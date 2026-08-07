export const BAY_AREA_STATIONS = Object.freeze([
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

// Current CI HNZ accelerometer metadata queried from the EarthScope FDSN station
// service on 2026-08-05. These sites make the Southern California scenario
// spatially meaningful; they are not yet a validated live collector profile.
export const SOUTHERN_CALIFORNIA_STATIONS = Object.freeze([
  {
    id: "CI.USC..HNZ",
    code: "USC",
    siteName: "University of Southern California",
    latitude: 34.01919,
    longitude: -118.28631,
  },
  {
    id: "CI.RUS..HNZ",
    code: "RUS",
    siteName: "Rush",
    latitude: 34.05075,
    longitude: -118.08078,
  },
  {
    id: "CI.WLT..HNZ",
    code: "WLT",
    siteName: "Walnut",
    latitude: 34.00948,
    longitude: -117.95077,
  },
  {
    id: "CI.PDU..HNZ",
    code: "PDU",
    siteName: "Padua",
    latitude: 34.1207,
    longitude: -117.63808,
  },
  {
    id: "CI.SVD..HNZ",
    code: "SVD",
    siteName: "Seven Oaks",
    latitude: 34.10647,
    longitude: -117.09822,
  },
  {
    id: "CI.RVR..HNZ",
    code: "RVR",
    siteName: "Riverside",
    latitude: 33.99351,
    longitude: -117.37545,
  },
  {
    id: "CI.DEV..HNZ",
    code: "DEV",
    siteName: "Devers",
    latitude: 33.93597,
    longitude: -116.57794,
  },
  {
    id: "CI.VCS..HNZ",
    code: "VCS",
    siteName: "Vincent",
    latitude: 34.48372,
    longitude: -118.11781,
  },
]);

// Current UW/UO HNZ accelerometer metadata queried from the EarthScope FDSN
// station service on 2026-08-05. These sites span the U.S. Cascadia margin for
// scenario display only; they are not a validated live collector profile.
export const PACIFIC_NORTHWEST_STATIONS = Object.freeze([
  {
    id: "UW.BROK..HNZ",
    code: "BROK",
    siteName: "Brookings, Oregon",
    latitude: 42.0767,
    longitude: -124.2934,
  },
  {
    id: "UW.COOS..HNZ",
    code: "COOS",
    siteName: "Coos Bay, Oregon",
    latitude: 43.39566,
    longitude: -124.25334,
  },
  {
    id: "UO.DEPO..HNZ",
    code: "DEPO",
    siteName: "Depoe Bay, Oregon",
    latitude: 44.800364,
    longitude: -124.053674,
  },
  {
    id: "UO.PF09..HNZ",
    code: "PF09",
    siteName: "Portland, Oregon",
    latitude: 45.510659,
    longitude: -122.622312,
  },
  {
    id: "UO.ASTOR..HNZ",
    code: "ASTOR",
    siteName: "Astoria, Oregon",
    latitude: 46.18195,
    longitude: -123.79916,
  },
  {
    id: "UW.ALKI..HNZ",
    code: "ALKI",
    siteName: "Alki, Seattle",
    latitude: 47.5751,
    longitude: -122.4176,
  },
  {
    id: "UW.HOHM..HNZ",
    code: "HOHM",
    siteName: "Hoh River, Washington",
    latitude: 47.76627,
    longitude: -124.30569,
  },
  {
    id: "UW.EDSN..HNZ",
    code: "EDSN",
    siteName: "Bow, Washington",
    latitude: 48.56202,
    longitude: -122.43611,
  },
]);

// Current NM HNZ accelerometer metadata queried from the EarthScope FDSN
// station service on 2026-08-06. These professional sites span the modeled
// New Madrid shaking corridor for scenario display only; they are not a
// validated live collector profile.
export const CENTRAL_US_STATIONS = Object.freeze([
  {
    id: "NM.UALR.00.HNZ",
    code: "UALR",
    siteName: "University of Arkansas · Little Rock",
    latitude: 34.7751,
    longitude: -92.3429,
  },
  {
    id: "NM.CBHS.00.HNZ",
    code: "CBHS",
    siteName: "Christian Brothers High School · Memphis",
    latitude: 35.13258,
    longitude: -89.86517,
  },
  {
    id: "NM.PENM.00.HNZ",
    code: "PENM",
    siteName: "Penman · Portageville, Missouri",
    latitude: 36.45,
    longitude: -89.628,
  },
  {
    id: "NM.CGM3.00.HNZ",
    code: "CGM3",
    siteName: "Cape Girardeau, Missouri",
    latitude: 37.29775,
    longitude: -89.6582,
  },
  {
    id: "NM.SIUC.00.HNZ",
    code: "SIUC",
    siteName: "Carbondale, Illinois",
    latitude: 37.7148,
    longitude: -89.2174,
  },
  {
    id: "NM.SLM.00.HNZ",
    code: "SLM",
    siteName: "St. Louis, Missouri",
    latitude: 38.6361,
    longitude: -90.2364,
  },
  {
    id: "NM.EVIN..HNZ",
    code: "EVIN",
    siteName: "University of Evansville · Indiana",
    latitude: 37.9716,
    longitude: -87.529701,
  },
  {
    id: "NM.CLTN.00.HNZ",
    code: "CLTN",
    siteName: "Cedars of Lebanon · Tennessee",
    latitude: 36.09115,
    longitude: -86.3315,
  },
]);

// Backwards-compatible name for the physically validated eight-site Bay profile.
export const STATIONS = BAY_AREA_STATIONS;

export const CAJON_GATE_RUPTURE = Object.freeze({
  label: "San Jacinto–Cajon–Mojave gate-open proxy",
  ruptureVelocityKmS: 2.8,
  points: Object.freeze([
    Object.freeze({ latitude: 33.5, longitude: -116.52 }),
    Object.freeze({ latitude: 33.7, longitude: -116.76 }),
    Object.freeze({ latitude: 33.9, longitude: -117.02 }),
    Object.freeze({ latitude: 34.08, longitude: -117.25 }),
    Object.freeze({
      latitude: 34.31,
      longitude: -117.47,
      label: "Cajon Pass",
      markerLabel: "CAJON GATE",
    }),
    Object.freeze({ latitude: 34.44, longitude: -117.75 }),
    Object.freeze({ latitude: 34.57, longitude: -118.05 }),
    Object.freeze({ latitude: 34.74, longitude: -118.4 }),
    Object.freeze({ latitude: 34.92, longitude: -118.75 }),
  ]),
});

export const CASCADIA_1700_RUPTURE = Object.freeze({
  label: "1700-style full-margin Cascadia bilateral proxy",
  ruptureVelocityKmS: 2.8,
  hypocenterPointIndex: 6,
  points: Object.freeze([
    Object.freeze({ latitude: 40.25, longitude: -124.7 }),
    Object.freeze({ latitude: 40.95, longitude: -124.98 }),
    Object.freeze({ latitude: 41.75, longitude: -125.1 }),
    Object.freeze({ latitude: 42.6, longitude: -125.15 }),
    Object.freeze({ latitude: 43.45, longitude: -125.1 }),
    Object.freeze({ latitude: 44.3, longitude: -125.0 }),
    Object.freeze({
      latitude: 45.15,
      longitude: -124.9,
      label: "assumed hypocenter",
      markerLabel: "ASSUMED HYPOCENTER",
    }),
    Object.freeze({ latitude: 46.0, longitude: -124.8 }),
    Object.freeze({ latitude: 46.85, longitude: -124.75 }),
    Object.freeze({ latitude: 47.7, longitude: -124.85 }),
    Object.freeze({ latitude: 48.5, longitude: -125.1 }),
    Object.freeze({ latitude: 49.2, longitude: -125.55 }),
  ]),
});

export const NEW_MADRID_M75_RUPTURE = Object.freeze({
  label: "USGS BSSC2014 New Madrid central-fault rupture",
  ruptureVelocityKmS: 2.8,
  hypocenterPointIndex: 1,
  sourceNote:
    "centerline derived from the USGS finite-rupture polygon; propagation timing is a dashboard assumption",
  points: Object.freeze([
    Object.freeze({ latitude: 36.233469, longitude: -89.569229 }),
    Object.freeze({
      latitude: 36.45497,
      longitude: -89.621843,
      label: "USGS scenario hypocenter",
      markerLabel: "USGS HYPOCENTER",
      markerLabelX: -8,
      markerLabelAnchor: "end",
    }),
    Object.freeze({ latitude: 36.679425, longitude: -89.648597 }),
  ]),
});

export const PRESETS = Object.freeze({
  "loma-prieta-1989": {
    latitude: 37.036,
    longitude: -121.88,
    depthKm: 17.2,
    magnitude: 6.9,
    shakeMapKey: "loma-prieta-1989",
    provenance: "USGS reviewed origin · 1989-10-18",
  },
  "san-francisco-1906": {
    latitude: 37.75,
    longitude: -122.55,
    depthKm: 11.7,
    magnitude: 7.9,
    shakeMapKey: "san-francisco-1906",
    provenance: "USGS reviewed origin · 1906-04-18",
  },
  "hayward-1868": {
    latitude: 37.7,
    longitude: -122.1,
    depthKm: 8.0,
    magnitude: 6.8,
    provenance: "USGS M6.8 estimate · location/depth are scenario proxies",
  },
  "south-napa": {
    latitude: 38.215,
    longitude: -122.312,
    depthKm: 11.1,
    magnitude: 6.0,
    shakeMapKey: "south-napa",
    provenance: "USGS reviewed origin and preferred ShakeMap · 2014-08-24",
  },
  "haywired-m7.05": {
    latitude: 37.67,
    longitude: -122.08,
    depthKm: 8.0,
    magnitude: 7.05,
    shakeMapKey: "haywired-m7.05",
    provenance: "USGS HayWired M7.05 planning-scenario ShakeMap",
  },
  "san-francisco": { latitude: 37.7749, longitude: -122.4194, depthKm: 8.0, magnitude: 7.0 },
  hayward: { latitude: 37.68, longitude: -122.10, depthKm: 8.0, magnitude: 6.8 },
  "san-jose": { latitude: 37.3382, longitude: -121.8863, depthKm: 9.0, magnitude: 6.5 },
  "cajon-gate-2026": {
    latitude: 33.5,
    longitude: -116.52,
    depthKm: 8.0,
    magnitude: 7.8,
    region: "southernCalifornia",
    rupture: CAJON_GATE_RUPTURE,
    provenance:
      "Scenario proxy · Burkhard et al. 2026 Cajon gate geometry + USGS ShakeOut M7.8 scale",
  },
  "cascadia-1700": {
    latitude: 45.15,
    longitude: -124.9,
    depthKm: 15.0,
    magnitude: 9.0,
    shakeMapKey: "cascadia-1700",
    region: "pacificNorthwest",
    rupture: CASCADIA_1700_RUPTURE,
    shakingDurationS: 300,
    provenance:
      "1700 event scale · USGS M8.7–9.2 evidence + median M9 ensemble ShakeMap",
  },
  "new-madrid-m7.5": {
    latitude: 36.45497,
    longitude: -89.621843,
    depthKm: 15.5926,
    magnitude: 7.5,
    shakeMapKey: "new-madrid-m7.5",
    region: "centralUnitedStates",
    rupture: NEW_MADRID_M75_RUPTURE,
    shakingDurationS: 45,
    provenance:
      "USGS BSSC2014 New Madrid central-fault M7.5 median planning scenario",
  },
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

// FEMA Hazus 6.1, Earthquake Model Technical Manual, section 4.2.2.1.2.
// Probabilities represent the fraction of a mapped susceptibility cell expected
// to liquefy, not the chance that every point or structure in the cell fails.
export const HAZUS_LIQUEFACTION_MODEL = Object.freeze({
  version: "FEMA Hazus 6.1",
  defaultGroundwaterDepthFeet: 5,
  susceptibility: Object.freeze({
    VH: Object.freeze({ slope: 9.09, intercept: -0.82, mapUnitFraction: 0.25 }),
    H: Object.freeze({ slope: 7.67, intercept: -0.92, mapUnitFraction: 0.2 }),
    M: Object.freeze({ slope: 6.67, intercept: -1.0, mapUnitFraction: 0.1 }),
    L: Object.freeze({ slope: 5.57, intercept: -1.18, mapUnitFraction: 0.05 }),
    VL: Object.freeze({ slope: 4.16, intercept: -1.08, mapUnitFraction: 0.02 }),
  }),
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
const SOUTHERN_CALIFORNIA_PLACES = Object.freeze([
  { name: "Cajon Pass", latitude: 34.31, longitude: -117.47 },
  { name: "Los Angeles", latitude: 34.0522, longitude: -118.2437 },
  { name: "San Bernardino", latitude: 34.1083, longitude: -117.2898 },
  { name: "Riverside", latitude: 33.9806, longitude: -117.3755 },
  { name: "Palm Springs", latitude: 33.8303, longitude: -116.5453 },
  { name: "Coachella Valley", latitude: 33.72, longitude: -116.22 },
  { name: "Anaheim", latitude: 33.8366, longitude: -117.9143 },
  { name: "Long Beach", latitude: 33.7701, longitude: -118.1937 },
  { name: "Palmdale", latitude: 34.5794, longitude: -118.1165 },
]);
const PACIFIC_NORTHWEST_PLACES = Object.freeze([
  { name: "Cape Mendocino", latitude: 40.44, longitude: -124.4 },
  { name: "Brookings", latitude: 42.0526, longitude: -124.28398 },
  { name: "Coos Bay", latitude: 43.3665, longitude: -124.2179 },
  { name: "Newport", latitude: 44.6368, longitude: -124.0535 },
  { name: "Portland", latitude: 45.5152, longitude: -122.6784 },
  { name: "Astoria", latitude: 46.1879, longitude: -123.8313 },
  { name: "Olympic Peninsula", latitude: 47.8, longitude: -123.9 },
  { name: "Seattle", latitude: 47.6062, longitude: -122.3321 },
  { name: "Bellingham", latitude: 48.7519, longitude: -122.4787 },
]);
const CENTRAL_US_PLACES = Object.freeze([
  { name: "New Madrid seismic zone", latitude: 36.455, longitude: -89.622 },
  { name: "Memphis", latitude: 35.1495, longitude: -90.049 },
  { name: "Cape Girardeau", latitude: 37.3059, longitude: -89.5181 },
  { name: "Paducah", latitude: 37.0834, longitude: -88.6001 },
  { name: "Little Rock", latitude: 34.7465, longitude: -92.2896 },
  { name: "St. Louis", latitude: 38.627, longitude: -90.1994 },
  { name: "Evansville", latitude: 37.9716, longitude: -87.5711 },
  { name: "Nashville", latitude: 36.1627, longitude: -86.7816 },
  { name: "Chicago", latitude: 41.8781, longitude: -87.6298 },
]);
const MIN_STATION_SPAN_KM = 20.0;
const TRIGGER_PEAK_G = 0.00012;
const MAJOR_MEDIAN_PEAK_G = 0.00075;
const FRESHNESS_CEILING_S = 15.0;
export const REGIONS = Object.freeze({
  bay: Object.freeze({
    label: "SF Bay Area",
    mapKey: "bay",
    overviewKey: "california",
    overviewLabel: "CALIFORNIA",
    eventPrefix: "bay",
    networkLabel: "BK · HNZ",
    stations: BAY_AREA_STATIONS,
    places: BAY_AREA_PLACES,
    associationGrid: Object.freeze({
      latitudeMin: 37.0,
      latitudeMax: 38.5,
      longitudeMin: -123.0,
      longitudeMax: -121.2,
    }),
  }),
  southernCalifornia: Object.freeze({
    label: "Southern California",
    mapKey: "southernCalifornia",
    overviewKey: "california",
    overviewLabel: "CALIFORNIA",
    eventPrefix: "socal",
    networkLabel: "CI · HNZ",
    stations: SOUTHERN_CALIFORNIA_STATIONS,
    places: SOUTHERN_CALIFORNIA_PLACES,
    associationGrid: Object.freeze({
      latitudeMin: 32.7,
      latitudeMax: 35.1,
      longitudeMin: -119.4,
      longitudeMax: -115.3,
    }),
  }),
  pacificNorthwest: Object.freeze({
    label: "Pacific Northwest",
    mapKey: "pacificNorthwest",
    overviewKey: "westCoast",
    overviewLabel: "PACIFIC COAST",
    eventPrefix: "csz",
    networkLabel: "UW/UO · HNZ",
    stations: PACIFIC_NORTHWEST_STATIONS,
    places: PACIFIC_NORTHWEST_PLACES,
    associationGrid: Object.freeze({
      latitudeMin: 40.0,
      latitudeMax: 49.3,
      longitudeMin: -127.25,
      longitudeMax: -117.5,
    }),
  }),
  centralUnitedStates: Object.freeze({
    label: "Central U.S.",
    mapKey: "centralUnitedStates",
    overviewKey: "contiguousUnitedStates",
    overviewLabel: "UNITED STATES",
    eventPrefix: "nmsz",
    networkLabel: "NM · HNZ",
    stations: CENTRAL_US_STATIONS,
    places: CENTRAL_US_PLACES,
    associationGrid: Object.freeze({
      latitudeMin: 33.0,
      latitudeMax: 42.35,
      longitudeMin: -94.5,
      longitudeMax: -84.0,
    }),
  }),
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

const RUPTURE_SAMPLE_CACHE = new WeakMap();

export function ruptureSamples(input) {
  if (!input.rupture?.points?.length) {
    return [
      {
        latitude: input.latitude,
        longitude: input.longitude,
        activationAfterOriginS: 0,
      },
    ];
  }
  const cached = RUPTURE_SAMPLE_CACHE.get(input.rupture);
  if (cached) return cached;
  const samples = [];
  let accumulatedKm = 0;
  input.rupture.points.forEach((point, index) => {
    if (index === 0) {
      samples.push({ ...point, activationAfterOriginS: 0, distanceAlongRuptureKm: 0 });
      return;
    }
    const previous = input.rupture.points[index - 1];
    const segmentKm = haversineKm(
      previous.latitude,
      previous.longitude,
      point.latitude,
      point.longitude,
    );
    const steps = Math.max(1, Math.ceil(segmentKm / 6));
    for (let step = 1; step <= steps; step += 1) {
      const fraction = step / steps;
      const distanceAlongRuptureKm = accumulatedKm + segmentKm * fraction;
      samples.push({
        latitude: previous.latitude + (point.latitude - previous.latitude) * fraction,
        longitude: previous.longitude + (point.longitude - previous.longitude) * fraction,
        distanceAlongRuptureKm,
      });
    }
    accumulatedKm += segmentKm;
  });
  const hypocenterPointIndex = input.rupture.hypocenterPointIndex ?? 0;
  const hypocenterPoint = input.rupture.points[hypocenterPointIndex];
  const hypocenterSample = samples.reduce((nearest, sample) =>
    haversineKm(
      sample.latitude,
      sample.longitude,
      hypocenterPoint.latitude,
      hypocenterPoint.longitude,
    ) <
    haversineKm(
      nearest.latitude,
      nearest.longitude,
      hypocenterPoint.latitude,
      hypocenterPoint.longitude,
    )
      ? sample
      : nearest,
  );
  const frozen = Object.freeze(
    samples.map((sample) =>
      Object.freeze({
        ...sample,
        activationAfterOriginS:
          Math.abs(
            sample.distanceAlongRuptureKm - hypocenterSample.distanceAlongRuptureKm,
          ) / input.rupture.ruptureVelocityKmS,
      }),
    ),
  );
  RUPTURE_SAMPLE_CACHE.set(input.rupture, frozen);
  return frozen;
}

export function ruptureDurationS(input) {
  return Math.max(...ruptureSamples(input).map((sample) => sample.activationAfterOriginS));
}

export function sourceSiteMetrics(input, latitude, longitude) {
  let surfaceDistanceKm = Number.POSITIVE_INFINITY;
  let arrivalAfterOriginS = Number.POSITIVE_INFINITY;
  let strongMotionAfterOriginS = Number.POSITIVE_INFINITY;
  ruptureSamples(input).forEach((sample) => {
    const distanceKm = haversineKm(
      sample.latitude,
      sample.longitude,
      latitude,
      longitude,
    );
    const hypocentralDistanceKm = Math.hypot(distanceKm, input.depthKm);
    surfaceDistanceKm = Math.min(surfaceDistanceKm, distanceKm);
    arrivalAfterOriginS = Math.min(
      arrivalAfterOriginS,
      sample.activationAfterOriginS + hypocentralDistanceKm / WAVE_MODEL.pVelocityKmS,
    );
    strongMotionAfterOriginS = Math.min(
      strongMotionAfterOriginS,
      sample.activationAfterOriginS + hypocentralDistanceKm / WAVE_MODEL.sVelocityKmS,
    );
  });
  return {
    surfaceDistanceKm,
    hypocentralDistanceKm: Math.hypot(surfaceDistanceKm, input.depthKm),
    arrivalAfterOriginS,
    strongMotionAfterOriginS,
  };
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

export function describeLocation(latitude, longitude, regionName = "bay") {
  if (![latitude, longitude].every(Number.isFinite)) {
    throw new TypeError("Location coordinates must be numbers.");
  }
  const region = REGIONS[regionName];
  if (!region) throw new RangeError(`Unknown region: ${regionName}`);
  const nearest = region.places.map((place) => ({
    ...place,
    distanceKm: haversineKm(latitude, longitude, place.latitude, place.longitude),
  })).sort((placeA, placeB) => placeA.distanceKm - placeB.distanceKm)[0];
  const qualifier = nearest.distanceKm < 18 ? nearest.name : `near ${nearest.name}`;
  return `${region.label}, ${qualifier}`;
}

export function describeBayAreaLocation(latitude, longitude) {
  return describeLocation(latitude, longitude, "bay");
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

export function liquefactionProbability(
  pgaG,
  magnitude,
  susceptibility,
  groundwaterDepthFeet = HAZUS_LIQUEFACTION_MODEL.defaultGroundwaterDepthFeet,
) {
  if (![pgaG, magnitude, groundwaterDepthFeet].every(Number.isFinite)) {
    throw new TypeError("Liquefaction inputs must be numbers.");
  }
  if (pgaG < 0) throw new RangeError("PGA cannot be negative.");
  if (magnitude < 0) throw new RangeError("Magnitude cannot be negative.");
  if (groundwaterDepthFeet < 0) {
    throw new RangeError("Groundwater depth cannot be negative.");
  }
  const parameters = HAZUS_LIQUEFACTION_MODEL.susceptibility[susceptibility];
  if (!parameters) return 0;
  const conditional = Math.max(
    0,
    Math.min(1, parameters.slope * pgaG + parameters.intercept),
  );
  const magnitudeCorrection =
    0.0027 * magnitude ** 3 -
    0.0267 * magnitude ** 2 -
    0.2055 * magnitude +
    2.9188;
  const groundwaterCorrection = 0.022 * groundwaterDepthFeet + 0.93;
  if (magnitudeCorrection <= 0 || groundwaterCorrection <= 0) return 0;
  return Math.max(
    0,
    Math.min(
      1,
      (conditional * parameters.mapUnitFraction) /
        (magnitudeCorrection * groundwaterCorrection),
    ),
  );
}

export function shakeMapGroundMotion(shakeMap, latitude, longitude) {
  if (!shakeMap) return null;
  if (![latitude, longitude].every(Number.isFinite)) {
    throw new TypeError("ShakeMap coordinates must be numbers.");
  }
  const rawX = (longitude - shakeMap.longitudeMin) / shakeMap.longitudeStep;
  const rawY = (shakeMap.latitudeMax - latitude) / shakeMap.latitudeStep;
  if (
    rawX < -1 ||
    rawY < -1 ||
    rawX > shakeMap.columnCount ||
    rawY > shakeMap.rowCount
  ) {
    return null;
  }
  // The checked-in grid is a five-sample downsample of a finer USGS field. Clamp
  // only the sub-cell crop margin at the regional boundary to its nearest value.
  const x = Math.max(0, Math.min(shakeMap.columnCount - 1, rawX));
  const y = Math.max(0, Math.min(shakeMap.rowCount - 1, rawY));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(shakeMap.columnCount - 1, x0 + 1);
  const y1 = Math.min(shakeMap.rowCount - 1, y0 + 1);
  const xFraction = x - x0;
  const yFraction = y - y0;
  const interpolate = (values) => {
    const topLeft = values[y0 * shakeMap.columnCount + x0];
    const topRight = values[y0 * shakeMap.columnCount + x1];
    const bottomLeft = values[y1 * shakeMap.columnCount + x0];
    const bottomRight = values[y1 * shakeMap.columnCount + x1];
    const top = topLeft + (topRight - topLeft) * xFraction;
    const bottom = bottomLeft + (bottomRight - bottomLeft) * xFraction;
    return top + (bottom - top) * yFraction;
  };
  return {
    intensity: interpolate(shakeMap.mmi),
    pgaG: interpolate(shakeMap.pgaPercentG) / 100,
    pgvCms: shakeMap.pgvCms ? interpolate(shakeMap.pgvCms) : null,
  };
}

export function estimateMercalliAtLocation(input, latitude, longitude) {
  const sourceMetrics = sourceSiteMetrics(
    input,
    latitude,
    longitude,
  );
  const mappedMotion = shakeMapGroundMotion(input.shakeMap, latitude, longitude);
  if (mappedMotion) return { ...mappedMotion, ...sourceMetrics };
  const pgaG = estimateExposurePeakAccelerationG(
    input.magnitude,
    sourceMetrics.hypocentralDistanceKm,
  );
  return { intensity: modifiedMercalliFromPga(pgaG), pgaG, ...sourceMetrics };
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
  if (input.magnitude < 2.5 || input.magnitude > 9.5) throw new RangeError("Magnitude must be between 2.5 and 9.5.");
  if (input.latitude < -90 || input.latitude > 90) throw new RangeError("Latitude is outside its valid range.");
  if (input.longitude < -180 || input.longitude > 180) throw new RangeError("Longitude is outside its valid range.");
  if (input.depthKm < 0 || input.depthKm > 700) throw new RangeError("Depth is outside the model range.");
  if (input.rupture) {
    if (
      !Number.isFinite(input.rupture.ruptureVelocityKmS) ||
      input.rupture.ruptureVelocityKmS <= 0
    ) {
      throw new RangeError("Rupture velocity must be positive.");
    }
    if (
      !Array.isArray(input.rupture.points) ||
      input.rupture.points.length < 2 ||
      !input.rupture.points.every((point) =>
        [point.latitude, point.longitude].every(Number.isFinite),
      )
    ) {
      throw new TypeError("Finite rupture requires at least two valid coordinates.");
    }
    const hypocenterPointIndex = input.rupture.hypocenterPointIndex ?? 0;
    if (
      !Number.isInteger(hypocenterPointIndex) ||
      hypocenterPointIndex < 0 ||
      hypocenterPointIndex >= input.rupture.points.length
    ) {
      throw new RangeError("Rupture hypocenter point is outside the rupture geometry.");
    }
  }
  if (input.shakeMap) {
    const expectedValues = input.shakeMap.columnCount * input.shakeMap.rowCount;
    if (
      !Number.isInteger(input.shakeMap.columnCount) ||
      !Number.isInteger(input.shakeMap.rowCount) ||
      input.shakeMap.columnCount < 2 ||
      input.shakeMap.rowCount < 2 ||
      !Number.isFinite(input.shakeMap.longitudeStep) ||
      !Number.isFinite(input.shakeMap.latitudeStep) ||
      input.shakeMap.longitudeStep <= 0 ||
      input.shakeMap.latitudeStep <= 0 ||
      input.shakeMap.mmi?.length !== expectedValues ||
      input.shakeMap.pgaPercentG?.length !== expectedValues ||
      (input.shakeMap.pgvCms && input.shakeMap.pgvCms.length !== expectedValues)
    ) {
      throw new TypeError("ShakeMap field dimensions are invalid.");
    }
  }
}

export function modelEarthquake(input, profileName = "dart", regionName = null) {
  validateInput(input);
  const profile = FEED_PROFILES[profileName];
  if (!profile) throw new RangeError(`Unknown feed profile: ${profileName}`);
  const selectedRegionName = regionName ?? input.region ?? "bay";
  const region = REGIONS[selectedRegionName];
  if (!region) throw new RangeError(`Unknown region: ${selectedRegionName}`);

  const stationResults = region.stations.map((station) => {
    const sourceMetrics = sourceSiteMetrics(
      input,
      station.latitude,
      station.longitude,
    );
    const mappedMotion = shakeMapGroundMotion(
      input.shakeMap,
      station.latitude,
      station.longitude,
    );
    const peakAccelerationG =
      mappedMotion?.pgaG ??
      estimatePeakAccelerationG(input.magnitude, sourceMetrics.hypocentralDistanceKm);
    return {
      ...station,
      ...sourceMetrics,
      shakingDurationS: input.shakingDurationS ?? WAVE_MODEL.shakingDurationS,
      peakAccelerationG,
      triggered: peakAccelerationG >= TRIGGER_PEAK_G,
    };
  }).sort((a, b) => a.arrivalAfterOriginS - b.arrivalAfterOriginS);

  const insideAssociationGrid =
    input.latitude >= region.associationGrid.latitudeMin &&
    input.latitude <= region.associationGrid.latitudeMax &&
    input.longitude >= region.associationGrid.longitudeMin &&
    input.longitude <= region.associationGrid.longitudeMax;
  if (!insideAssociationGrid) {
    return {
      profile,
      region,
      regionName: selectedRegionName,
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
      region,
      regionName: selectedRegionName,
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
    region,
    regionName: selectedRegionName,
    stationResults,
    revisions,
    outcome: revisions.some((revision) => revision.fresh) ? "alerted" : "stale_suppressed",
  };
}
