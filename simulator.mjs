export const STATIONS = Object.freeze([
  {
    id: "BK.BKS.00.HNZ",
    code: "BKS",
    siteName: "Byerly Seismographic Vault",
    latitude: 37.876221,
    longitude: -122.23558,
  },
  {
    id: "BK.PINL.00.HNZ",
    code: "PINL",
    siteName: "Point Pinole",
    latitude: 38.01,
    longitude: -122.36602,
  },
  {
    id: "BK.JASP.00.HNZ",
    code: "JASP",
    siteName: "Jasper Ridge Ecological Reserve",
    latitude: 37.40337,
    longitude: -122.24048,
  },
  {
    id: "BK.LLNL.00.HNZ",
    code: "LLNL",
    siteName: "Lawrence Livermore National Laboratory",
    latitude: 37.68188,
    longitude: -121.71675,
  },
  {
    id: "BK.MHC.00.HNZ",
    code: "MHC",
    siteName: "Lick Observatory",
    latitude: 37.34164,
    longitude: -121.64257,
  },
  {
    id: "BK.UMUN.00.HNZ",
    code: "UMUN",
    siteName: "Mount Umunhum",
    latitude: 37.158363,
    longitude: -121.903434,
  },
  {
    id: "BK.PESC.00.HNZ",
    code: "PESC",
    siteName: "Peninsula Open Space · Pescadero",
    latitude: 37.24611,
    longitude: -122.383,
  },
  {
    id: "BK.BDM.00.HNZ",
    code: "BDM",
    siteName: "Black Diamond Mines Park",
    latitude: 37.953972,
    longitude: -121.86554,
  },
]);

export const PRESETS = Object.freeze({
  "loma-prieta-1989": {
    latitude: 37.036,
    longitude: -121.88,
    depthKm: 17.2,
    magnitude: 6.9,
    provenance: "USGS reviewed origin · 1989-10-18",
  },
  "san-francisco-1906": {
    latitude: 37.75,
    longitude: -122.55,
    depthKm: 11.7,
    magnitude: 7.9,
    provenance: "USGS reviewed origin · 1906-04-18",
  },
  "hayward-1868": {
    latitude: 37.7,
    longitude: -122.1,
    depthKm: 8.0,
    magnitude: 6.8,
    provenance: "USGS M6.8 estimate · location/depth are scenario proxies",
  },
  "south-napa": { latitude: 38.215, longitude: -122.312, depthKm: 11.1, magnitude: 6.0 },
  "san-francisco": { latitude: 37.7749, longitude: -122.4194, depthKm: 8.0, magnitude: 7.0 },
  hayward: { latitude: 37.68, longitude: -122.10, depthKm: 8.0, magnitude: 6.8 },
  "san-jose": { latitude: 37.3382, longitude: -121.8863, depthKm: 9.0, magnitude: 6.5 },
});

export const FEED_PROFILES = Object.freeze({
  dart: { label: "PUBLIC DART", sourceAgeS: 3.2, acknowledgementS: 0.18 },
  direct: { label: "DIRECT FEED", sourceAgeS: 0.8, acknowledgementS: 0.08 },
  stale: { label: "DEGRADED / STALE", sourceAgeS: 18.0, acknowledgementS: 0.18 },
});

export const WAVE_MODEL = Object.freeze({
  pVelocityKmS: 5.8,
  sVelocityKmS: 3.4,
  shakingDurationS: 5.0,
});

// This is a downstream scenario proxy, not part of seismic detection. The
// benchmark is the dashboard's Hayward/HayWired-scale population-impact index.
// A noise floor reflects event-study evidence that Loma Prieta and Northridge
// did not produce a statistically detectable whole-U.S.-market response. The
// two terms represent a nonlinear fundamental-loss channel and a faster,
// concave uncertainty repricing; the cap prevents false precision in extreme
// scenarios that this point-source shaking model cannot resolve.
export const ES_IMPACT_MODEL = Object.freeze({
  version: "scenario-v1",
  noiseFloorImpactIndex: 2.0,
  haywiredImpactIndex: 23.0,
  haywiredFundamentalDeclinePercent: 0.25,
  haywiredRiskDeclinePercent: 0.2,
  maximumDeclinePercent: 3.0,
});

const BAY_AREA_PLACES = Object.freeze([
  { name: "San Francisco", latitude: 37.7749, longitude: -122.4194 },
  { name: "Oakland", latitude: 37.8044, longitude: -122.2712 },
  { name: "San Jose", latitude: 37.3382, longitude: -121.8863 },
  { name: "Hayward", latitude: 37.6688, longitude: -122.0808 },
  { name: "San Mateo", latitude: 37.563, longitude: -122.3255 },
  { name: "Livermore", latitude: 37.6819, longitude: -121.768 },
  { name: "Concord", latitude: 37.978, longitude: -122.0311 },
  { name: "Napa", latitude: 38.2975, longitude: -122.2869 },
  { name: "Santa Rosa", latitude: 38.4405, longitude: -122.7144 },
  { name: "Santa Cruz", latitude: 36.9741, longitude: -122.0308 },
]);
const MIN_STATION_SPAN_KM = 20.0;
const TRIGGER_PEAK_G = 0.00012;
const MAJOR_MEDIAN_PEAK_G = 0.00075;
const FRESHNESS_CEILING_S = 15.0;
const ASSOCIATION_GRID = Object.freeze({
  latitudeMin: 37.0,
  latitudeMax: 38.5,
  longitudeMin: -123.0,
  longitudeMax: -121.2,
});

export function haversineKm(latitudeA, longitudeA, latitudeB, longitudeB) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(deltaLongitude / 2) ** 2;
  return 6371.0088 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function surfaceIntersectionRadiusKm(elapsedS, velocityKmS, depthKm) {
  if (![elapsedS, velocityKmS, depthKm].every(Number.isFinite)) {
    throw new TypeError("Wavefront inputs must be numbers.");
  }
  if (elapsedS <= 0 || velocityKmS <= 0 || depthKm < 0) return 0;
  const traveledKm = elapsedS * velocityKmS;
  return traveledKm <= depthKm ? 0 : Math.sqrt(traveledKm ** 2 - depthKm ** 2);
}

export function modelEsNearMonthImpact(impactIndex) {
  if (!Number.isFinite(impactIndex)) throw new TypeError("Impact index must be a number.");
  if (impactIndex < 0) throw new RangeError("Impact index cannot be negative.");
  const effectiveImpact = Math.max(
    0,
    impactIndex - ES_IMPACT_MODEL.noiseFloorImpactIndex,
  );
  const benchmarkRange =
    ES_IMPACT_MODEL.haywiredImpactIndex - ES_IMPACT_MODEL.noiseFloorImpactIndex;
  const normalizedImpact = effectiveImpact / benchmarkRange;
  const fundamentalDeclinePercent =
    ES_IMPACT_MODEL.haywiredFundamentalDeclinePercent * normalizedImpact ** 1.4;
  const riskDeclinePercent =
    ES_IMPACT_MODEL.haywiredRiskDeclinePercent * Math.sqrt(normalizedImpact);
  const uncappedDeclinePercent = fundamentalDeclinePercent + riskDeclinePercent;
  const declinePercent = Math.min(
    ES_IMPACT_MODEL.maximumDeclinePercent,
    uncappedDeclinePercent,
  );
  return {
    version: ES_IMPACT_MODEL.version,
    expectedChangePercent: declinePercent === 0 ? 0 : -declinePercent,
    fundamentalDeclinePercent,
    riskDeclinePercent,
    capped: declinePercent < uncappedDeclinePercent,
  };
}

export function describeBayAreaLocation(latitude, longitude) {
  if (![latitude, longitude].every(Number.isFinite)) {
    throw new TypeError("Location coordinates must be numbers.");
  }
  const nearest = BAY_AREA_PLACES.map((place) => ({
    ...place,
    distanceKm: haversineKm(latitude, longitude, place.latitude, place.longitude),
  })).sort((placeA, placeB) => placeA.distanceKm - placeB.distanceKm)[0];
  const qualifier = nearest.distanceKm < 18 ? nearest.name : `near ${nearest.name}`;
  return `SF Bay Area, ${qualifier}`;
}

export function eventDisplayStatus(classification, confidence) {
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new RangeError("Confidence must be between zero and one.");
  }
  const prefix = classification === "major_suspected" ? "MAJOR EVENT" : "EVENT";
  return `${prefix} ${confidence >= 0.82 ? "LIKELY" : "SUSPECTED"}`;
}

function estimatePeakAccelerationG(magnitude, hypocentralDistanceKm) {
  const magnitudeScale = 10 ** (0.5 * (magnitude - 6.0));
  const attenuation = 1 + (hypocentralDistanceKm / 35.0) ** 1.35;
  return (0.018 * magnitudeScale) / attenuation;
}

export function estimateExposurePeakAccelerationG(magnitude, hypocentralDistanceKm) {
  if (![magnitude, hypocentralDistanceKm].every(Number.isFinite)) {
    throw new TypeError("Exposure inputs must be numbers.");
  }
  if (hypocentralDistanceKm < 0) throw new RangeError("Distance cannot be negative.");
  const magnitudeScale = 10 ** (0.5 * (magnitude - 6.0));
  const attenuation =
    (1 + (hypocentralDistanceKm / 14.0) ** 1.55) *
    Math.exp(hypocentralDistanceKm / 180.0);
  return Math.min(1.5, (0.35 * magnitudeScale) / attenuation);
}

export function modifiedMercalliFromPga(pgaG) {
  if (!Number.isFinite(pgaG)) throw new TypeError("PGA must be a number.");
  if (pgaG <= 0) return 1;
  const logPgaCms2 = Math.log10(pgaG * 980.665);
  const intensity =
    logPgaCms2 <= 1.57
      ? 1.78 + 1.55 * logPgaCms2
      : -1.6 + 3.7 * logPgaCms2;
  return Math.max(1, Math.min(10, intensity));
}

export function estimateMercalliAtLocation(input, latitude, longitude) {
  const surfaceDistanceKm = haversineKm(
    input.latitude,
    input.longitude,
    latitude,
    longitude,
  );
  const hypocentralDistanceKm = Math.hypot(surfaceDistanceKm, input.depthKm);
  const pgaG = estimateExposurePeakAccelerationG(input.magnitude, hypocentralDistanceKm);
  return { intensity: modifiedMercalliFromPga(pgaG), pgaG, surfaceDistanceKm };
}

export function modelPopulationImpact(input, populationCells, projection) {
  validateInput(input);
  let populationTotal = 0;
  let populationWeightedIntensity = 0;
  let impactMass = 0;
  let populationMmi6Plus = 0;
  let maximumIntensity = 1;

  populationCells.forEach(([x, y, population]) => {
    const longitude =
      projection.longitudeMin + (x - projection.xOffset) / projection.xScale;
    const latitude =
      projection.latitudeMax - (y - projection.yOffset) / projection.yScale;
    const { intensity } = estimateMercalliAtLocation(input, latitude, longitude);
    const weight = Math.max(0, Number(population));
    populationTotal += weight;
    populationWeightedIntensity += intensity * weight;
    impactMass += Math.max(0, intensity - 3) ** 2 * weight;
    if (intensity >= 6) populationMmi6Plus += weight;
    maximumIntensity = Math.max(maximumIntensity, intensity);
  });

  return {
    populationTotal,
    populationWeightedMmi:
      populationTotal > 0 ? populationWeightedIntensity / populationTotal : 1,
    populationMmi6Plus,
    maximumMmi: maximumIntensity,
    impactMass,
    impactIndex:
      populationTotal > 0 ? Math.min(100, (impactMass / (populationTotal * 49)) * 100) : 0,
  };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function networkSpanKm(stations) {
  let span = 0;
  stations.forEach((stationA, index) => {
    stations.slice(index + 1).forEach((stationB) => {
      span = Math.max(
        span,
        haversineKm(
          stationA.latitude,
          stationA.longitude,
          stationB.latitude,
          stationB.longitude,
        ),
      );
    });
  });
  return span;
}

function earliestQualifyingGroup(triggeredStations, minimumCount) {
  for (let count = minimumCount; count <= triggeredStations.length; count += 1) {
    const group = triggeredStations.slice(0, count);
    if (networkSpanKm(group) >= MIN_STATION_SPAN_KM) return group;
  }
  return null;
}

function roundedGridCoordinate(value) {
  return Math.round(value / 0.05) * 0.05;
}

function buildRevision(number, classification, group, input, detectionAtS, sourceAgeS) {
  const peaks = group.map((station) => station.peakAccelerationG);
  const rmsResidualS = Math.max(0.08, 0.23 - group.length * 0.012);
  return {
    revision: number,
    classification,
    stationCount: group.length,
    stations: group.map((station) => station.id),
    stationCodes: group.map((station) => station.code),
    latitude: roundedGridCoordinate(input.latitude),
    longitude: roundedGridCoordinate(input.longitude),
    depthKm: input.depthKm,
    locationRmsS: rmsResidualS,
    maxPeakAccelerationG: Math.max(...peaks),
    medianPeakAccelerationG: median(peaks),
    confidence: Math.min(0.96, 0.34 + group.length * 0.072 - rmsResidualS * 0.12),
    detectedAfterOriginS: detectionAtS,
    maxDataLatencyS: sourceAgeS,
    fresh: sourceAgeS <= FRESHNESS_CEILING_S,
  };
}

function validateInput(input) {
  const fields = [input.magnitude, input.latitude, input.longitude, input.depthKm];
  if (!fields.every(Number.isFinite)) throw new TypeError("Earthquake inputs must be numbers.");
  if (input.magnitude < 2.5 || input.magnitude > 8.5) throw new RangeError("Magnitude must be between 2.5 and 8.5.");
  if (input.latitude < -90 || input.latitude > 90) throw new RangeError("Latitude is outside its valid range.");
  if (input.longitude < -180 || input.longitude > 180) throw new RangeError("Longitude is outside its valid range.");
  if (input.depthKm < 0 || input.depthKm > 700) throw new RangeError("Depth is outside the model range.");
}

export function modelEarthquake(input, profileName = "dart") {
  validateInput(input);
  const profile = FEED_PROFILES[profileName];
  if (!profile) throw new RangeError(`Unknown feed profile: ${profileName}`);

  const stationResults = STATIONS.map((station) => {
    const surfaceDistanceKm = haversineKm(
      input.latitude,
      input.longitude,
      station.latitude,
      station.longitude,
    );
    const hypocentralDistanceKm = Math.hypot(surfaceDistanceKm, input.depthKm);
    const peakAccelerationG = estimatePeakAccelerationG(input.magnitude, hypocentralDistanceKm);
    return {
      ...station,
      surfaceDistanceKm,
      hypocentralDistanceKm,
      arrivalAfterOriginS: hypocentralDistanceKm / WAVE_MODEL.pVelocityKmS,
      strongMotionAfterOriginS: hypocentralDistanceKm / WAVE_MODEL.sVelocityKmS,
      peakAccelerationG,
      triggered: peakAccelerationG >= TRIGGER_PEAK_G,
    };
  }).sort((a, b) => a.arrivalAfterOriginS - b.arrivalAfterOriginS);

  const insideAssociationGrid =
    input.latitude >= ASSOCIATION_GRID.latitudeMin &&
    input.latitude <= ASSOCIATION_GRID.latitudeMax &&
    input.longitude >= ASSOCIATION_GRID.longitudeMin &&
    input.longitude <= ASSOCIATION_GRID.longitudeMax;
  if (!insideAssociationGrid) {
    return {
      profile,
      stationResults,
      revisions: [],
      outcome: "outside_association_grid",
    };
  }

  const triggeredStations = stationResults.filter((station) => station.triggered);
  const watchGroup = earliestQualifyingGroup(triggeredStations, 4);
  if (!watchGroup) {
    return {
      profile,
      stationResults,
      revisions: [],
      outcome: "insufficient_station_diversity",
    };
  }

  const processingS = 0.28;
  const watchAtS = watchGroup.at(-1).arrivalAfterOriginS + profile.sourceAgeS + processingS;
  const revisions = [buildRevision(1, "watch", watchGroup, input, watchAtS, profile.sourceAgeS)];
  let previousGroup = watchGroup;
  let classification = "watch";

  const majorGroup = earliestQualifyingGroup(triggeredStations, 6);
  if (majorGroup) {
    if (median(majorGroup.map((station) => station.peakAccelerationG)) >= MAJOR_MEDIAN_PEAK_G) {
      classification = "major_suspected";
    }
    const detectionAtS = majorGroup.at(-1).arrivalAfterOriginS + profile.sourceAgeS + processingS;
    revisions.push(
      buildRevision(2, classification, majorGroup, input, detectionAtS, profile.sourceAgeS),
    );
    previousGroup = majorGroup;
  }

  if (triggeredStations.length > previousGroup.length) {
    const detectionAtS =
      triggeredStations.at(-1).arrivalAfterOriginS + profile.sourceAgeS + processingS;
    revisions.push(
      buildRevision(
        revisions.length + 1,
        classification,
        triggeredStations,
        input,
        detectionAtS,
        profile.sourceAgeS,
      ),
    );
  }

  return {
    profile,
    stationResults,
    revisions,
    outcome: revisions.some((revision) => revision.fresh) ? "alerted" : "stale_suppressed",
  };
}
