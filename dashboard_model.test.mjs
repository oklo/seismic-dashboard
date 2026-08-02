import assert from "node:assert/strict";
import test from "node:test";

import {
  FEED_PROFILES,
  PRESETS,
  STATIONS,
  WAVE_MODEL,
  estimateExposurePeakAccelerationG,
  haversineKm,
  modifiedMercalliFromPga,
  modelEarthquake,
  modelPopulationImpact,
  surfaceIntersectionRadiusKm,
} from "./simulator.mjs";

test("station inventory matches the eight-site detector profile", () => {
  assert.equal(STATIONS.length, 8);
  assert.equal(new Set(STATIONS.map((station) => station.id)).size, 8);
  assert.ok(STATIONS.every((station) => station.id.startsWith("BK.")));
});

test("historical presets carry the reviewed or reconstructed geophysical details", () => {
  assert.deepEqual(
    [
      PRESETS["loma-prieta-1989"].magnitude,
      PRESETS["loma-prieta-1989"].depthKm,
      PRESETS["san-francisco-1906"].magnitude,
      PRESETS["san-francisco-1906"].depthKm,
      PRESETS["hayward-1868"].magnitude,
    ],
    [6.9, 17.2, 7.9, 11.7, 6.8],
  );
  assert.match(PRESETS["hayward-1868"].provenance, /prox/);
});

test("South Napa reference produces ordered watch and major revisions", () => {
  const result = modelEarthquake(PRESETS["south-napa"], "dart");

  assert.equal(result.outcome, "alerted");
  assert.deepEqual(
    result.revisions.map((revision) => revision.stationCount),
    [4, 6, 8],
  );
  assert.equal(result.revisions[0].classification, "watch");
  assert.equal(result.revisions[1].classification, "major_suspected");
  assert.ok(
    result.revisions[0].detectedAfterOriginS < result.revisions[1].detectedAfterOriginS,
  );
  assert.ok(
    result.stationResults.every(
      (station) => station.arrivalAfterOriginS < station.strongMotionAfterOriginS,
    ),
  );
});

test("surface wavefront honors source depth and station travel geometry", () => {
  const result = modelEarthquake(PRESETS.hayward, "direct");
  const station = result.stationResults[0];

  assert.equal(
    surfaceIntersectionRadiusKm(
      PRESETS.hayward.depthKm / WAVE_MODEL.pVelocityKmS,
      WAVE_MODEL.pVelocityKmS,
      PRESETS.hayward.depthKm,
    ),
    0,
  );
  const radiusAtArrival = surfaceIntersectionRadiusKm(
    station.arrivalAfterOriginS,
    WAVE_MODEL.pVelocityKmS,
    PRESETS.hayward.depthKm,
  );
  assert.ok(Math.abs(radiusAtArrival - station.surfaceDistanceKm) < 1e-9);
});

test("small or distant inputs fail closed without network agreement", () => {
  const small = modelEarthquake({ ...PRESETS["south-napa"], magnitude: 2.5 }, "dart");
  const distant = modelEarthquake(
    { magnitude: 6, latitude: 34.05, longitude: -118.25, depthKm: 10 },
    "dart",
  );

  assert.equal(small.outcome, "insufficient_station_diversity");
  assert.equal(small.revisions.length, 0);
  assert.equal(distant.outcome, "outside_association_grid");
  assert.equal(distant.revisions.length, 0);
});

test("stale data creates detector revisions but suppresses trader delivery", () => {
  const result = modelEarthquake(PRESETS.hayward, "stale");

  assert.equal(FEED_PROFILES.stale.sourceAgeS, 18);
  assert.equal(result.outcome, "stale_suppressed");
  assert.ok(result.revisions.length > 0);
  assert.ok(result.revisions.every((revision) => !revision.fresh));
});

test("distance calculation is symmetric and zero at one point", () => {
  assert.equal(haversineKm(37.8, -122.2, 37.8, -122.2), 0);
  const forward = haversineKm(37.8, -122.2, 38.0, -122.4);
  const reverse = haversineKm(38.0, -122.4, 37.8, -122.2);
  assert.ok(Math.abs(forward - reverse) < 1e-9);
});

test("Worden PGA conversion and population exposure increase with shaking", () => {
  const weakPga = estimateExposurePeakAccelerationG(5.5, 40);
  const strongPga = estimateExposurePeakAccelerationG(7.0, 40);
  assert.ok(strongPga > weakPga);
  assert.ok(modifiedMercalliFromPga(strongPga) > modifiedMercalliFromPga(weakPga));

  const projection = {
    longitudeMin: -122.5,
    latitudeMax: 38,
    xOffset: 0,
    yOffset: 0,
    xScale: 100,
    yScale: 100,
  };
  const populationCells = [
    [50, 50, 1_000_000],
    [80, 70, 500_000],
  ];
  const weak = modelPopulationImpact(
    { magnitude: 5.5, latitude: 37.5, longitude: -122, depthKm: 10 },
    populationCells,
    projection,
  );
  const strong = modelPopulationImpact(
    { magnitude: 7, latitude: 37.5, longitude: -122, depthKm: 10 },
    populationCells,
    projection,
  );
  assert.equal(strong.populationTotal, 1_500_000);
  assert.ok(strong.populationWeightedMmi > weak.populationWeightedMmi);
  assert.ok(strong.impactIndex > weak.impactIndex);
});

test("invalid model input is rejected", () => {
  assert.throws(
    () => modelEarthquake({ magnitude: 10, latitude: 37.8, longitude: -122.2, depthKm: 8 }),
    /Magnitude/,
  );
  assert.throws(() => modelEarthquake(PRESETS.hayward, "unknown"), /Unknown feed profile/);
});
