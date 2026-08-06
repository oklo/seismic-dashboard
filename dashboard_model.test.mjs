import assert from "node:assert/strict";
import test from "node:test";

import { CALIFORNIA_MAP_DATA } from "./california_map.mjs";

import {
  CAJON_GATE_RUPTURE,
  CASCADIA_1700_RUPTURE,
  FEED_PROFILES,
  HAZUS_LIQUEFACTION_MODEL,
  PRESETS,
  PACIFIC_NORTHWEST_STATIONS,
  REGIONS,
  SOUTHERN_CALIFORNIA_STATIONS,
  STATIONS,
  WAVE_MODEL,
  describeBayAreaLocation,
  describeLocation,
  estimateExposurePeakAccelerationG,
  eventDisplayStatus,
  haversineKm,
  liquefactionProbability,
  modifiedMercalliFromPga,
  modelEarthquake,
  modelEsNearMonthImpact,
  modelPopulationImpact,
  ruptureDurationS,
  ruptureSamples,
  shakeMapGroundMotion,
  surfaceIntersectionRadiusKm,
} from "./simulator.mjs";

test("station inventory matches the eight-site detector profile", () => {
  assert.equal(STATIONS.length, 8);
  assert.equal(new Set(STATIONS.map((station) => station.id)).size, 8);
  assert.ok(STATIONS.every((station) => station.id.startsWith("BK.")));
  assert.ok(STATIONS.every((station) => station.siteName.length > 5));
  assert.equal(STATIONS.find((station) => station.code === "BKS").siteName, "Byerly Seismographic Vault");
  assert.equal(STATIONS.find((station) => station.code === "MHC").siteName, "Lick Observatory");
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

test("supported Bay presets carry checked-in USGS ShakeMap fields", () => {
  const bayMap = CALIFORNIA_MAP_DATA.bay;
  const supported = [
    "san-francisco-1906",
    "loma-prieta-1989",
    "south-napa",
    "haywired-m7.05",
  ];

  assert.deepEqual(Object.keys(bayMap.shakeMaps), supported);
  supported.forEach((presetId) => {
    const shakeMap = bayMap.shakeMaps[presetId];
    assert.equal(PRESETS[presetId].shakeMapKey, presetId);
    assert.match(shakeMap.source, /USGS/);
    assert.equal(shakeMap.mmi.length, shakeMap.columnCount * shakeMap.rowCount);
    assert.equal(shakeMap.pgaPercentG.length, shakeMap.mmi.length);
    assert.equal(shakeMap.pgvCms.length, shakeMap.mmi.length);
  });
  assert.equal(PRESETS["hayward-1868"].shakeMapKey, undefined);
  assert.equal(PRESETS["san-francisco"].shakeMapKey, undefined);

  const input = {
    ...PRESETS["san-francisco-1906"],
    shakeMap: bayMap.shakeMaps["san-francisco-1906"],
  };
  const result = modelEarthquake(input, "dart", "bay");
  const bks = result.stationResults.find((station) => station.code === "BKS");
  const mappedBks = shakeMapGroundMotion(
    input.shakeMap,
    bks.latitude,
    bks.longitude,
  );
  assert.ok(mappedBks.intensity >= 7);
  assert.ok(mappedBks.pgvCms > 0);
  assert.ok(Math.abs(bks.peakAccelerationG - mappedBks.pgaG) < 1e-12);
});

test("Bay liquefaction uses detailed susceptibility and FEMA Hazus probability", () => {
  const grid = CALIFORNIA_MAP_DATA.bay.liquefaction;
  const mappedClasses = new Set(grid.values);
  const veryHighAt20PercentG = liquefactionProbability(0.2, 7.5, "VH", 5);
  const moderateAt20PercentG = liquefactionProbability(0.2, 7.5, "M", 5);
  const veryHighAt30PercentG = liquefactionProbability(0.3, 7.5, "VH", 5);
  const veryHighM6 = liquefactionProbability(0.3, 6.0, "VH", 5);
  const veryHighM79 = liquefactionProbability(0.3, 7.9, "VH", 5);

  assert.match(grid.source, /USGS Bay Area liquefaction susceptibility/);
  assert.match(grid.model, /FEMA Hazus 6\.1/);
  assert.equal(grid.groundwaterDepthFeet, 5);
  assert.ok(grid.values.filter(Boolean).length > 5_000);
  assert.deepEqual(mappedClasses, new Set([0, 1, 2, 3, 4, 5]));
  assert.equal(HAZUS_LIQUEFACTION_MODEL.version, "FEMA Hazus 6.1");
  assert.equal(liquefactionProbability(0, 7.5, "VH", 5), 0);
  assert.ok(veryHighAt20PercentG > moderateAt20PercentG);
  assert.ok(veryHighAt30PercentG > veryHighAt20PercentG);
  assert.ok(veryHighM79 > veryHighM6);
  assert.ok(veryHighAt30PercentG < 0.3);
  assert.throws(() => liquefactionProbability(-0.1, 7, "VH", 5), /negative/);
});

test("Cajon gate view uses current professional CI accelerometer sites", () => {
  assert.equal(SOUTHERN_CALIFORNIA_STATIONS.length, 8);
  assert.equal(new Set(SOUTHERN_CALIFORNIA_STATIONS.map((station) => station.id)).size, 8);
  assert.ok(SOUTHERN_CALIFORNIA_STATIONS.every((station) => station.id.startsWith("CI.")));
  assert.ok(SOUTHERN_CALIFORNIA_STATIONS.every((station) => station.id.endsWith(".HNZ")));
  assert.equal(REGIONS.southernCalifornia.stations, SOUTHERN_CALIFORNIA_STATIONS);
  assert.equal(PRESETS["cajon-gate-2026"].magnitude, 7.8);
  assert.equal(PRESETS["cajon-gate-2026"].rupture, CAJON_GATE_RUPTURE);
});

test("Cajon gate scenario propagates across a finite multi-fault source", () => {
  const input = PRESETS["cajon-gate-2026"];
  const samples = ruptureSamples(input);
  const result = modelEarthquake(input, "dart", "southernCalifornia");
  const vincent = result.stationResults.find((station) => station.code === "VCS");
  const pointResult = modelEarthquake(
    { ...input, rupture: undefined },
    "dart",
    "southernCalifornia",
  );
  const pointSourceVincent = pointResult.stationResults.find(
    (station) => station.code === "VCS",
  );

  assert.ok(samples.length > input.rupture.points.length);
  assert.ok(samples.at(-1).distanceAlongRuptureKm > 250);
  assert.ok(samples.at(-1).activationAfterOriginS > 90);
  assert.ok(vincent.surfaceDistanceKm < 15);
  assert.ok(vincent.surfaceDistanceKm < pointSourceVincent.surfaceDistanceKm);
  assert.ok(vincent.peakAccelerationG > pointSourceVincent.peakAccelerationG);
  assert.equal(result.outcome, "alerted");
  assert.deepEqual(
    result.revisions.map((revision) => revision.stationCount),
    [4, 6, 8],
  );
  assert.equal(result.revisions[1].classification, "major_suspected");
});

test("Cascadia view uses current professional UW and UO accelerometer sites", () => {
  const shakeMap = CALIFORNIA_MAP_DATA.pacificNorthwest.shakeMap;

  assert.equal(PACIFIC_NORTHWEST_STATIONS.length, 8);
  assert.equal(new Set(PACIFIC_NORTHWEST_STATIONS.map((station) => station.id)).size, 8);
  assert.ok(
    PACIFIC_NORTHWEST_STATIONS.every(
      (station) => station.id.startsWith("UW.") || station.id.startsWith("UO."),
    ),
  );
  assert.ok(PACIFIC_NORTHWEST_STATIONS.every((station) => station.id.endsWith(".HNZ")));
  assert.equal(REGIONS.pacificNorthwest.stations, PACIFIC_NORTHWEST_STATIONS);
  assert.equal(PRESETS["cascadia-1700"].magnitude, 9);
  assert.equal(PRESETS["cascadia-1700"].rupture, CASCADIA_1700_RUPTURE);
  assert.match(shakeMap.source, /USGS median M9 Cascadia/);
  assert.equal(shakeMap.mmi.length, shakeMap.columnCount * shakeMap.rowCount);
  assert.equal(shakeMap.pgaPercentG.length, shakeMap.mmi.length);
});

test("1700-style Cascadia scenario uses bilateral timing and USGS ensemble shaking", () => {
  const preset = PRESETS["cascadia-1700"];
  const input = {
    ...preset,
    shakeMap: CALIFORNIA_MAP_DATA.pacificNorthwest.shakeMap,
  };
  const samples = ruptureSamples(input);
  const result = modelEarthquake(input, "dart", "pacificNorthwest");
  const impact = modelPopulationImpact(
    input,
    CALIFORNIA_MAP_DATA.pacificNorthwest.populationCells,
    CALIFORNIA_MAP_DATA.pacificNorthwest.projection,
  );
  const depo = result.stationResults.find((station) => station.code === "DEPO");
  const mappedDepo = shakeMapGroundMotion(
    input.shakeMap,
    depo.latitude,
    depo.longitude,
  );

  assert.ok(samples.at(-1).distanceAlongRuptureKm > 950);
  assert.ok(samples.at(-1).distanceAlongRuptureKm < 1100);
  assert.ok(ruptureDurationS(input) > 180);
  assert.ok(ruptureDurationS(input) < 220);
  assert.ok(samples.some((sample) => sample.activationAfterOriginS === 0));
  assert.ok(samples[0].activationAfterOriginS > 180);
  assert.ok(samples.at(-1).activationAfterOriginS > 150);
  assert.equal(result.outcome, "alerted");
  assert.deepEqual(
    result.revisions.map((revision) => revision.stationCount),
    [4, 6, 8],
  );
  assert.equal(result.revisions[1].classification, "major_suspected");
  assert.ok(Math.abs(depo.peakAccelerationG - mappedDepo.pgaG) < 1e-12);
  assert.ok(impact.populationMmi6Plus > 9_000_000);
  assert.ok(impact.maximumMmi > 8);
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

test("ES near-month scenario estimate is conservative, monotonic, and bounded", () => {
  const noise = modelEsNearMonthImpact(2);
  const lomaPrieta = modelEsNearMonthImpact(8.42);
  const haywiredScale = modelEsNearMonthImpact(23);
  const extreme = modelEsNearMonthImpact(1_000);

  assert.equal(noise.expectedChangePercent, 0);
  assert.ok(lomaPrieta.expectedChangePercent < 0);
  assert.ok(lomaPrieta.expectedChangePercent > haywiredScale.expectedChangePercent);
  assert.ok(Math.abs(haywiredScale.expectedChangePercent + 0.45) < 1e-12);
  assert.equal(extreme.expectedChangePercent, -3);
  assert.equal(extreme.capped, true);
  assert.throws(() => modelEsNearMonthImpact(-1), /negative/);
});

test("trader display grades confidence and adds concise Bay Area geography", () => {
  assert.equal(eventDisplayStatus("major_suspected", 0.75), "MAJOR EVENT SUSPECTED");
  assert.equal(eventDisplayStatus("major_suspected", 0.9), "MAJOR EVENT LIKELY");
  assert.equal(
    describeBayAreaLocation(PRESETS["san-jose"].latitude, PRESETS["san-jose"].longitude),
    "SF Bay Area, San Jose",
  );
  assert.equal(
    describeLocation(34.31, -117.47, "southernCalifornia"),
    "Southern California, Cajon Pass",
  );
});

test("invalid model input is rejected", () => {
  assert.throws(
    () => modelEarthquake({ magnitude: 10, latitude: 37.8, longitude: -122.2, depthKm: 8 }),
    /Magnitude/,
  );
  assert.throws(() => modelEarthquake(PRESETS.hayward, "unknown"), /Unknown feed profile/);
});
