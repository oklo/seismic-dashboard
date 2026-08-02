export const STATIONS = Object.freeze([
  { id: "BK.BKS.00.HNZ", code: "BKS", latitude: 37.876221, longitude: -122.23558 },
  { id: "BK.PINL.00.HNZ", code: "PINL", latitude: 38.01, longitude: -122.36602 },
  { id: "BK.JASP.00.HNZ", code: "JASP", latitude: 37.40337, longitude: -122.24048 },
  { id: "BK.LLNL.00.HNZ", code: "LLNL", latitude: 37.68188, longitude: -121.71675 },
  { id: "BK.MHC.00.HNZ", code: "MHC", latitude: 37.34164, longitude: -121.64257 },
  { id: "BK.UMUN.00.HNZ", code: "UMUN", latitude: 37.158363, longitude: -121.903434 },
  { id: "BK.PESC.00.HNZ", code: "PESC", latitude: 37.24611, longitude: -122.383 },
  { id: "BK.BDM.00.HNZ", code: "BDM", latitude: 37.953972, longitude: -121.86554 },
]);

export const PRESETS = Object.freeze({
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

const P_VELOCITY_KM_S = 5.8;
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

function estimatePeakAccelerationG(magnitude, hypocentralDistanceKm) {
  const magnitudeScale = 10 ** (0.5 * (magnitude - 6.0));
  const attenuation = 1 + (hypocentralDistanceKm / 35.0) ** 1.35;
  return (0.018 * magnitudeScale) / attenuation;
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
      arrivalAfterOriginS: hypocentralDistanceKm / P_VELOCITY_KM_S,
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
