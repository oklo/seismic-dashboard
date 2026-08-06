import { CALIFORNIA_MAP_DATA } from "./california_map.mjs";
import {
  PRESETS,
  REGIONS,
  WAVE_MODEL,
  describeBayAreaLocation,
  describeLocation,
  estimateMercalliAtLocation,
  eventDisplayStatus,
  liquefactionProbability,
  modelEsNearMonthImpact,
  modelEarthquake,
  modelPopulationImpact,
  ruptureDurationS,
  ruptureSamples,
  surfaceIntersectionRadiusKm,
} from "./simulator.mjs";

const SVG_NS = "http://www.w3.org/2000/svg";
const EARTH_RADIUS_KM = 6371.0088;
const IMPACT_GRID_SIZE = 14;
const PROPAGATION_TIME_BIN_S = 0.35;
const STATION_MMI_RISE_S = 2.4;
const LIVE_POLL_INTERVAL_MS = 1_000;
const LIVE_TRACE_SCALE_G = 0.00001;
const STATION_CALLOUT_OFFSETS = Object.freeze({
  PINL: { x: 10, y: -34 },
  BKS: { x: -76, y: -31 },
  BDM: { x: 10, y: -10 },
  LLNL: { x: -77, y: -12 },
  JASP: { x: 10, y: -10 },
  PESC: { x: 10, y: -28 },
  MHC: { x: -77, y: -30 },
  UMUN: { x: -77, y: -2 },
  USC: { x: -77, y: -28 },
  RUS: { x: -77, y: -8 },
  WLT: { x: 10, y: -30 },
  PDU: { x: 10, y: -10 },
  SVD: { x: 10, y: -30 },
  RVR: { x: 10, y: 5 },
  DEV: { x: 10, y: -10 },
  VCS: { x: -77, y: -28 },
  BROK: { x: 10, y: -26 },
  COOS: { x: 10, y: -22 },
  DEPO: { x: 10, y: -20 },
  PF09: { x: 10, y: -10 },
  ASTOR: { x: 10, y: -24 },
  ALKI: { x: 10, y: -8 },
  HOHM: { x: -77, y: -24 },
  EDSN: { x: 10, y: -16 },
});

const elements = {
  form: document.querySelector("#quake-form"),
  dashboardMode: document.querySelector("#dashboard-mode"),
  dashboardRegion: document.querySelector("#dashboard-region"),
  scenarioContext: document.querySelector("#scenario-context"),
  preset: document.querySelector("#preset"),
  magnitude: document.querySelector("#magnitude"),
  depth: document.querySelector("#depth"),
  latitude: document.querySelector("#latitude"),
  longitude: document.querySelector("#longitude"),
  profile: document.querySelector("#feed-profile"),
  speed: document.querySelector("#playback-speed"),
  strike: document.querySelector("#strike-button"),
  reset: document.querySelector("#reset-button"),
  formNote: document.querySelector("#form-note"),
  clock: document.querySelector("#utc-clock"),
  networkMap: document.querySelector("#network-map"),
  bayGeography: document.querySelector("#bay-geography"),
  impactGrid: document.querySelector("#impact-grid"),
  liquefactionLayer: document.querySelector("#liquefaction-layer"),
  liquefactionLegend: document.querySelector("#liquefaction-legend"),
  liquefactionToggle: document.querySelector("#liquefaction-toggle"),
  groundMotionSource: document.querySelector("#ground-motion-source"),
  populationLayer: document.querySelector("#population-layer"),
  populationImpactLayer: document.querySelector("#population-impact-layer"),
  faultLayer: document.querySelector("#fault-layer"),
  ruptureLayer: document.querySelector("#rupture-layer"),
  californiaInset: document.querySelector("#california-inset"),
  stationLayer: document.querySelector("#station-layer"),
  epicenterLayer: document.querySelector("#epicenter-layer"),
  pWave: document.querySelector("#p-wavefront"),
  sWave: document.querySelector("#s-wavefront"),
  stationGrid: document.querySelector("#station-grid"),
  simulationClock: document.querySelector("#simulation-clock"),
  simulationRate: document.querySelector("#simulation-rate"),
  play: document.querySelector("#play-button"),
  pause: document.querySelector("#pause-button"),
  pRadius: document.querySelector("#p-radius"),
  sRadius: document.querySelector("#s-radius"),
  metricNetwork: document.querySelector("#metric-network"),
  metricWatch: document.querySelector("#metric-watch"),
  metricMajor: document.querySelector("#metric-major"),
  metricPeakMmi: document.querySelector("#metric-peak-mmi"),
  metricPopulationExposed: document.querySelector("#metric-population-exposed"),
  metricLiquefactionExposed: document.querySelector("#metric-liquefaction-exposed"),
  metricImpactIndex: document.querySelector("#metric-impact-index"),
  metricEsChange: document.querySelector("#metric-es-change"),
  terminal: document.querySelector("#terminal-screen"),
  terminalSummary: document.querySelector("#terminal-summary"),
  relayStatus: document.querySelector("#relay-status"),
  outputModeLabel: document.querySelector("#output-mode-label"),
  terminalAuthMode: document.querySelector("#terminal-auth-mode"),
  stationNetworkLabel: document.querySelector("#station-network-label"),
  mapTitle: document.querySelector("#map-title"),
  mapDescription: document.querySelector("#map-description"),
};

let simulation = null;
let animationFrame = null;
let eventTimer = null;
let nextRunId = 0;
let impactCells = [];
let liquefactionCells = [];
let populationArrivalLayers = [];
let populationImpactTimeline = [];
let populationImpactSummary = null;
let revealedImpactCellCount = 0;
let revealedLiquefactionCellCount = 0;
let revealedPopulationLayerCount = 0;
let revealedPopulationCellCount = 0;
let reachedPopulationMmi6Plus = 0;
let reachedLiquefactionPopulation = 0;
let reachedImpactMass = 0;
let draggingEpicenter = false;
let pendingPlacement = null;
let placementFrame = null;
let terminalFollowsLatest = true;
let activeDashboardMode = "scenario";
let livePollTimer = null;
let livePollGeneration = 0;
let liveLastHealthKey = null;
let liveLastHealthLogAt = 0;
let liveLastEventId = null;
let activeRegionName = "bay";
let liquefactionOverlayEnabled = false;

function currentRegion() {
  return REGIONS[activeRegionName];
}

function currentMap() {
  return CALIFORNIA_MAP_DATA[currentRegion().mapKey];
}

function defaultPresetForRegion(regionName) {
  if (regionName === "southernCalifornia") return "cajon-gate-2026";
  if (regionName === "pacificNorthwest") return "cascadia-1700";
  return "san-francisco-1906";
}

function applyPreset(presetId) {
  const preset = PRESETS[presetId];
  if (!preset) return;
  elements.preset.value = presetId;
  elements.magnitude.value = preset.magnitude.toFixed(1);
  elements.depth.value = preset.depthKm.toFixed(1);
  elements.latitude.value = preset.latitude.toFixed(3);
  elements.longitude.value = preset.longitude.toFixed(3);
}

function setLiquefactionOverlay(enabled) {
  liquefactionOverlayEnabled = Boolean(
    enabled && currentMap().liquefaction && activeDashboardMode === "scenario",
  );
  elements.liquefactionToggle.setAttribute(
    "aria-pressed",
    String(liquefactionOverlayEnabled),
  );
  elements.liquefactionToggle.textContent = liquefactionOverlayEnabled
    ? "Liquefaction on"
    : "Liquefaction off";
  elements.liquefactionLayer.toggleAttribute("hidden", !liquefactionOverlayEnabled);
  elements.liquefactionLegend.hidden = !liquefactionOverlayEnabled;
  if (liquefactionOverlayEnabled && !simulation) {
    liquefactionCells.forEach((cell) => {
      cell.rect.style.opacity = cell.opacity ?? "0";
    });
  }
}

function syncHazardControls() {
  const available = Boolean(
    currentMap().liquefaction && activeDashboardMode === "scenario",
  );
  elements.liquefactionToggle.disabled = !available;
  elements.liquefactionToggle.hidden = !currentMap().liquefaction;
  if (!available) setLiquefactionOverlay(false);
}

function configureRegion(regionName) {
  const region = REGIONS[regionName];
  if (!region) throw new RangeError(`Unknown dashboard region: ${regionName}`);
  activeRegionName = regionName;
  elements.dashboardRegion.value = regionName;
  elements.stationNetworkLabel.textContent = region.networkLabel;
  elements.scenarioContext.hidden = regionName === "bay";
  const contextTitle = elements.scenarioContext.querySelector("b");
  const contextDetail = elements.scenarioContext.querySelector("span");
  if (regionName === "southernCalifornia") {
    contextTitle.textContent = "CAJON GATE · SCENARIO PROXY";
    contextDetail.textContent =
      "Joint San Jacinto–San Andreas rupture; hazard study, not a time prediction. ShakeOut losses are a separate benchmark.";
  } else if (regionName === "pacificNorthwest") {
    contextTitle.textContent = "CASCADIA 1700 · SHAKING SCENARIO";
    contextDetail.textContent =
      "M9 full-margin bilateral proxy with USGS median ensemble ShakeMap. Tsunami generation and inundation are not modeled.";
  }
  elements.mapTitle.textContent = `${region.label} shaking, population, faults and stations`;
  if (regionName === "southernCalifornia") {
    elements.mapDescription.textContent =
      "Census population dots, USGS fault traces, a finite San Jacinto to San Andreas rupture through Cajon Pass, eight CI accelerometer sites, and modeled P and S wavefronts.";
  } else if (regionName === "pacificNorthwest") {
    elements.mapDescription.textContent =
      "U.S. Census population dots, USGS faults and median M9 ensemble ShakeMap, a bilateral full-margin Cascadia rupture proxy, eight UW/UO accelerometer sites, and modeled P and S timing guides.";
  } else {
    elements.mapDescription.textContent =
      "Census population dots, event-specific USGS ShakeMap ground motion where available, Bay liquefaction susceptibility and modeled probability, Quaternary fault traces, eight BK stations, and P and S wavefronts.";
  }
  drawStaticMaps();
  syncHazardControls();
}

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
}

function projectPoint(map, latitude, longitude) {
  const projection = map.projection;
  return {
    x: projection.xOffset + (longitude - projection.longitudeMin) * projection.xScale,
    y: projection.yOffset + (projection.latitudeMax - latitude) * projection.yScale,
  };
}

function drawGeography(layer, map, prefix) {
  layer.replaceChildren();
  const state = svgElement("path", {
    class: "state-shape",
    d: map.statePath,
    "fill-rule": "evenodd",
  });
  layer.append(state);
  map.counties.forEach((county) => {
    const path = svgElement("path", {
      class: "county-shape",
      d: county.path,
      "data-geoid": county.geoid,
      "aria-label": county.name,
      "fill-rule": "evenodd",
    });
    path.id = `${prefix}-county-${county.geoid}`;
    layer.append(path);
  });
}

function unprojectPoint(map, x, y) {
  const projection = map.projection;
  return {
    latitude: projection.latitudeMax - (y - projection.yOffset) / projection.yScale,
    longitude: projection.longitudeMin + (x - projection.xOffset) / projection.xScale,
  };
}

function pointPath(points) {
  return points.map(([x, y]) => `M${x},${y}h0`).join("");
}

function drawPopulation() {
  const groups = { low: [], medium: [], high: [] };
  currentMap().populationCells.forEach(([x, y, population]) => {
    const group = population >= 200 ? "high" : population >= 25 ? "medium" : "low";
    groups[group].push([x, y]);
  });
  elements.populationLayer.replaceChildren(
    ...Object.entries(groups).map(([group, points]) =>
      svgElement("path", { class: `population-dots ${group}`, d: pointPath(points) }),
    ),
  );
}

function drawFaults() {
  elements.faultLayer.replaceChildren();
  currentMap().faults.forEach((fault) => {
    const path = svgElement("path", {
      class: "fault-trace",
      d: fault.path,
      role: "img",
      "aria-label": fault.name,
    });
    const title = svgElement("title");
    title.textContent = fault.sectionName
      ? `${fault.name} · ${fault.sectionName}`
      : fault.name;
    path.append(title);
    elements.faultLayer.append(path);
  });
}

function geographicBounds(map) {
  const projection = map.projection;
  return {
    longitudeMin: projection.longitudeMin,
    longitudeMax:
      projection.longitudeMin +
      (projection.width - 2 * projection.xOffset) / projection.xScale,
    latitudeMin:
      projection.latitudeMax -
      (projection.height - 2 * projection.yOffset) / projection.yScale,
    latitudeMax: projection.latitudeMax,
  };
}

function drawCaliforniaInset() {
  const root = elements.californiaInset;
  const region = currentRegion();
  const map = CALIFORNIA_MAP_DATA[region.overviewKey];
  const geography = svgElement("g", { class: "california-inset-geography" });
  const backdrop = svgElement("rect", {
    class: "california-inset-backdrop",
    x: 5,
    y: 58,
    width: 250,
    height: 300,
    rx: 7,
  });
  drawGeography(geography, map, "california-inset");

  const regionBounds = geographicBounds(currentMap());
  const topLeft = projectPoint(map, regionBounds.latitudeMax, regionBounds.longitudeMin);
  const bottomRight = projectPoint(map, regionBounds.latitudeMin, regionBounds.longitudeMax);
  const window = svgElement("rect", {
    class: "california-inset-window",
    x: topLeft.x,
    y: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  });
  const label = svgElement("text", {
    class: "california-inset-label",
    x: 17,
    y: 47,
  });
  label.textContent = region.overviewLabel;
  root.replaceChildren(backdrop, geography, window, label);
}

function drawImpactGrid() {
  impactCells = [];
  elements.impactGrid.replaceChildren();
  const map = currentMap();
  const { width, height, xOffset, yOffset } = map.projection;
  for (let y = yOffset; y < height - yOffset; y += IMPACT_GRID_SIZE) {
    for (let x = xOffset; x < width - xOffset; x += IMPACT_GRID_SIZE) {
      const center = unprojectPoint(
        map,
        x + IMPACT_GRID_SIZE / 2,
        y + IMPACT_GRID_SIZE / 2,
      );
      const rect = svgElement("rect", {
        class: "impact-cell",
        x,
        y,
        width: IMPACT_GRID_SIZE + 0.25,
        height: IMPACT_GRID_SIZE + 0.25,
      });
      elements.impactGrid.append(rect);
      impactCells.push({ ...center, rect });
    }
  }
}

function drawLiquefactionGrid() {
  liquefactionCells = [];
  elements.liquefactionLayer.replaceChildren();
  const map = currentMap();
  const grid = map.liquefaction;
  if (!grid) return;
  grid.values.forEach((classIndex, index) => {
    if (!classIndex) return;
    const column = index % grid.columnCount;
    const row = Math.floor(index / grid.columnCount);
    const x = grid.xOffset + column * grid.cellSizePx;
    const y = grid.yOffset + row * grid.cellSizePx;
    const location = unprojectPoint(
      map,
      x + grid.cellSizePx / 2,
      y + grid.cellSizePx / 2,
    );
    const rect = svgElement("rect", {
      class: "liquefaction-cell",
      x,
      y,
      width: grid.cellSizePx + 0.3,
      height: grid.cellSizePx + 0.3,
    });
    elements.liquefactionLayer.append(rect);
    liquefactionCells.push({
      ...location,
      susceptibility: grid.classes[classIndex],
      rect,
    });
  });
}

function drawStaticMaps() {
  elements.ruptureLayer.replaceChildren();
  drawGeography(elements.bayGeography, currentMap(), currentRegion().eventPrefix);
  drawImpactGrid();
  drawLiquefactionGrid();
  drawPopulation();
  drawFaults();
  drawCaliforniaInset();
}

function mapPoint(event) {
  const point = elements.networkMap.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const matrix = elements.networkMap.getScreenCTM();
  return matrix ? point.matrixTransform(matrix.inverse()) : { x: 280, y: 340 };
}

function placeEpicenter(event) {
  const point = mapPoint(event);
  const map = currentMap();
  const projection = map.projection;
  const longitudeMax =
    projection.longitudeMin +
    (projection.width - 2 * projection.xOffset) / projection.xScale;
  const latitudeMin =
    projection.latitudeMax -
    (projection.height - 2 * projection.yOffset) / projection.yScale;
  const location = unprojectPoint(map, point.x, point.y);
  elements.latitude.value = Math.max(
    latitudeMin,
    Math.min(projection.latitudeMax, location.latitude),
  ).toFixed(3);
  elements.longitude.value = Math.max(
    projection.longitudeMin,
    Math.min(longitudeMax, location.longitude),
  ).toFixed(3);
  elements.preset.value = "custom";
  updatePreview();
}

function queueEpicenterPlacement(event) {
  pendingPlacement = { clientX: event.clientX, clientY: event.clientY };
  if (placementFrame !== null) return;
  placementFrame = window.requestAnimationFrame(() => {
    placementFrame = null;
    if (pendingPlacement) placeEpicenter(pendingPlacement);
    pendingPlacement = null;
  });
}

function readInput() {
  const preset = PRESETS[elements.preset.value];
  const input = {
    magnitude: Number.parseFloat(elements.magnitude.value),
    depthKm: Number.parseFloat(elements.depth.value),
    latitude: Number.parseFloat(elements.latitude.value),
    longitude: Number.parseFloat(elements.longitude.value),
    region: activeRegionName,
  };
  if (preset?.rupture && preset.region === activeRegionName) {
    input.rupture = preset.rupture;
    input.shakingDurationS = preset.shakingDurationS;
  }
  const shakeMap = preset?.shakeMapKey
    ? currentMap().shakeMaps?.[preset.shakeMapKey] ??
      (preset.shakeMapKey === "cascadia-1700" ? currentMap().shakeMap : null)
    : null;
  if (shakeMap) input.shakeMap = shakeMap;
  input.groundMotionSource = shakeMap ? "usgs-shakemap" : "attenuation-fallback";
  return input;
}

function formatSeconds(seconds) {
  return Number.isFinite(seconds) ? `${seconds.toFixed(1)}s` : "—";
}

const MMI_COLORS = Object.freeze([
  [1, [255, 255, 255]],
  [2, [191, 204, 255]],
  [3, [160, 230, 255]],
  [4, [128, 255, 255]],
  [5, [122, 255, 147]],
  [6, [255, 255, 0]],
  [7, [255, 200, 0]],
  [8, [255, 145, 0]],
  [9, [255, 0, 0]],
  [10, [128, 0, 0]],
]);

function mmiColor(intensity) {
  const lowerIndex = Math.max(0, Math.min(8, Math.floor(intensity) - 1));
  const [lowerMmi, lower] = MMI_COLORS[lowerIndex];
  const [upperMmi, upper] = MMI_COLORS[lowerIndex + 1];
  const fraction = Math.max(0, Math.min(1, (intensity - lowerMmi) / (upperMmi - lowerMmi)));
  const color = lower.map((channel, index) =>
    Math.round(channel + (upper[index] - channel) * fraction),
  );
  return `rgb(${color.join(" ")})`;
}

function liquefactionColor(probability) {
  if (probability >= 0.2) return "rgb(141 38 55)";
  if (probability >= 0.1) return "rgb(217 104 59)";
  if (probability >= 0.05) return "rgb(239 173 72)";
  return "rgb(243 223 125)";
}

function liquefactionOpacity(probability) {
  if (probability <= 0) return "0";
  return String(Math.min(0.78, 0.16 + probability * 2.6));
}

function liquefactionSusceptibilityAtPixel(map, x, y) {
  const grid = map.liquefaction;
  if (!grid) return null;
  const column = Math.floor((x - grid.xOffset) / grid.cellSizePx);
  const row = Math.floor((y - grid.yOffset) / grid.cellSizePx);
  if (
    column < 0 ||
    row < 0 ||
    column >= grid.columnCount ||
    row >= grid.rowCount
  ) {
    return null;
  }
  return grid.classes[grid.values[row * grid.columnCount + column]] ?? null;
}

function romanMmi(intensity) {
  const numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  return numerals[Math.max(0, Math.min(9, Math.round(intensity) - 1))];
}

function formatPopulation(population) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(population);
}

function formatExpectedChangePercent(value) {
  if (value === 0) return "0.00%";
  return `${value < 0 ? "−" : "+"}${Math.abs(value).toFixed(2)}%`;
}

function updateGroundMotionSource(input) {
  const usesShakeMap = Boolean(input.shakeMap);
  elements.groundMotionSource.textContent = usesShakeMap
    ? "USGS SHAKEMAP"
    : "ATTENUATION FALLBACK";
  elements.groundMotionSource.classList.toggle("fallback", !usesShakeMap);
  elements.groundMotionSource.title = usesShakeMap
    ? input.shakeMap.source
    : "No event-specific ShakeMap is assigned to this preset.";
}

function describeScenarioLocation(input, latitude, longitude) {
  if (input.region === "pacificNorthwest" && input.rupture) {
    return "Pacific Northwest, Cascadia coast";
  }
  if (input.region === "southernCalifornia" && input.rupture) {
    return "Southern California, Cajon Pass corridor";
  }
  return describeLocation(latitude, longitude, activeRegionName);
}

function resetPropagationReveal() {
  impactCells.forEach((cell) => {
    cell.rect.style.opacity = "0";
  });
  liquefactionCells.forEach((cell) => {
    cell.rect.style.opacity = "0";
  });
  populationArrivalLayers.forEach((layer) => {
    layer.path.style.opacity = "0";
  });
  revealedImpactCellCount = 0;
  revealedLiquefactionCellCount = 0;
  revealedPopulationLayerCount = 0;
  revealedPopulationCellCount = 0;
  reachedPopulationMmi6Plus = 0;
  reachedLiquefactionPopulation = 0;
  reachedImpactMass = 0;
  elements.metricPopulationExposed.textContent = "0";
  elements.metricLiquefactionExposed.textContent = "0";
  elements.metricImpactIndex.textContent = "0.0";
  elements.metricEsChange.textContent = "0.00%";
}

function currentPopulationImpact() {
  const populationTotal = populationImpactSummary?.populationTotal ?? 0;
  const impactIndex =
    populationTotal > 0
      ? Math.min(100, (reachedImpactMass / (populationTotal * 49)) * 100)
      : 0;
  return {
    populationMmi6Plus: reachedPopulationMmi6Plus,
    impactIndex,
    esNearMonthChangePercent:
      modelEsNearMonthImpact(impactIndex).expectedChangePercent,
  };
}

function updatePropagationReveal(elapsedS) {
  while (
    revealedImpactCellCount < impactCells.length &&
    impactCells[revealedImpactCellCount].arrivalS <= elapsedS
  ) {
    const cell = impactCells[revealedImpactCellCount];
    cell.rect.style.opacity = cell.opacity;
    revealedImpactCellCount += 1;
  }
  while (
    revealedLiquefactionCellCount < liquefactionCells.length &&
    liquefactionCells[revealedLiquefactionCellCount].arrivalS <= elapsedS
  ) {
    const cell = liquefactionCells[revealedLiquefactionCellCount];
    cell.rect.style.opacity = cell.opacity;
    revealedLiquefactionCellCount += 1;
  }
  while (
    revealedPopulationLayerCount < populationArrivalLayers.length &&
    populationArrivalLayers[revealedPopulationLayerCount].arrivalS <= elapsedS
  ) {
    populationArrivalLayers[revealedPopulationLayerCount].path.style.opacity = "0.9";
    revealedPopulationLayerCount += 1;
  }
  const startingPopulationCellCount = revealedPopulationCellCount;
  while (
    revealedPopulationCellCount < populationImpactTimeline.length &&
    populationImpactTimeline[revealedPopulationCellCount].arrivalS <= elapsedS
  ) {
    const cell = populationImpactTimeline[revealedPopulationCellCount];
    if (cell.intensity >= 6) reachedPopulationMmi6Plus += cell.population;
    if (cell.liquefactionProbability >= 0.05) {
      reachedLiquefactionPopulation += cell.population;
    }
    reachedImpactMass += Math.max(0, cell.intensity - 3) ** 2 * cell.population;
    revealedPopulationCellCount += 1;
  }
  if (revealedPopulationCellCount !== startingPopulationCellCount) {
    const impact = currentPopulationImpact();
    elements.metricPopulationExposed.textContent = formatPopulation(
      impact.populationMmi6Plus,
    );
    elements.metricLiquefactionExposed.textContent = formatPopulation(
      reachedLiquefactionPopulation,
    );
    elements.metricImpactIndex.textContent = impact.impactIndex.toFixed(1);
    elements.metricEsChange.textContent = formatExpectedChangePercent(
      impact.esNearMonthChangePercent,
    );
  }
}

function updateImpact(input) {
  impactCells.forEach((cell) => {
    const { intensity, strongMotionAfterOriginS } = estimateMercalliAtLocation(
      input,
      cell.latitude,
      cell.longitude,
    );
    cell.rect.style.fill = mmiColor(intensity);
    cell.arrivalS = strongMotionAfterOriginS;
    cell.opacity = intensity < 2 ? "0" : String(Math.min(0.31, 0.035 + intensity * 0.026));
  });
  impactCells.sort((a, b) => a.arrivalS - b.arrivalS);

  let maximumLiquefactionProbability = 0;
  const groundwaterDepthFeet = currentMap().liquefaction?.groundwaterDepthFeet ?? 5;
  liquefactionCells.forEach((cell) => {
    const { pgaG, strongMotionAfterOriginS } = estimateMercalliAtLocation(
      input,
      cell.latitude,
      cell.longitude,
    );
    const probability = liquefactionProbability(
      pgaG,
      input.magnitude,
      cell.susceptibility,
      groundwaterDepthFeet,
    );
    cell.probability = probability;
    cell.arrivalS = strongMotionAfterOriginS;
    cell.opacity = liquefactionOpacity(probability);
    cell.rect.style.fill = liquefactionColor(probability);
    maximumLiquefactionProbability = Math.max(
      maximumLiquefactionProbability,
      probability,
    );
  });
  liquefactionCells.sort((a, b) => a.arrivalS - b.arrivalS);

  const arrivalGroups = new Map();
  populationImpactTimeline = [];
  const map = currentMap();
  let liquefactionPopulation5Percent = 0;
  map.populationCells.forEach(([x, y, population]) => {
    const location = unprojectPoint(map, x, y);
    const { intensity, pgaG, strongMotionAfterOriginS } = estimateMercalliAtLocation(
      input,
      location.latitude,
      location.longitude,
    );
    const arrivalS = strongMotionAfterOriginS;
    const susceptibility = liquefactionSusceptibilityAtPixel(map, x, y);
    const probability = susceptibility
      ? liquefactionProbability(
          pgaG,
          input.magnitude,
          susceptibility,
          groundwaterDepthFeet,
        )
      : 0;
    if (probability >= 0.05) {
      liquefactionPopulation5Percent += Math.max(0, Number(population));
    }
    populationImpactTimeline.push({
      arrivalS,
      intensity,
      liquefactionProbability: probability,
      population: Math.max(0, Number(population)),
    });
    if (intensity < 2) return;
    const mmiBand = Math.max(2, Math.min(10, Math.floor(intensity)));
    const arrivalBin = Math.floor(arrivalS / PROPAGATION_TIME_BIN_S);
    const key = `${arrivalBin}:${mmiBand}`;
    const group = arrivalGroups.get(key) ?? { arrivalBin, mmiBand, points: [] };
    group.points.push([x, y]);
    arrivalGroups.set(key, group);
  });
  populationArrivalLayers = [...arrivalGroups.values()]
    .map((group) => {
      const path = svgElement("path", {
        class: "population-impact",
        d: pointPath(group.points),
      });
      path.style.stroke = mmiColor(group.mmiBand);
      return {
        arrivalS: group.arrivalBin * PROPAGATION_TIME_BIN_S,
        path,
      };
    })
    .sort((a, b) => a.arrivalS - b.arrivalS);
  populationImpactTimeline.sort((a, b) => a.arrivalS - b.arrivalS);
  elements.populationImpactLayer.replaceChildren(
    ...populationArrivalLayers.map((layer) => layer.path),
  );

  const impact = modelPopulationImpact(
    input,
    map.populationCells,
    map.projection,
  );
  impact.maximumLiquefactionProbability = maximumLiquefactionProbability;
  impact.liquefactionPopulation5Percent = liquefactionPopulation5Percent;
  populationImpactSummary = impact;
  resetPropagationReveal();
  elements.metricPeakMmi.textContent = `${romanMmi(impact.maximumMmi)} / ${impact.maximumMmi.toFixed(1)}`;
  return impact;
}

function clockText(date = new Date()) {
  return `${date.getUTCHours().toString().padStart(2, "0")}:${date
    .getUTCMinutes()
    .toString()
    .padStart(2, "0")}:${date.getUTCSeconds().toString().padStart(2, "0")}.${date
    .getUTCMilliseconds()
    .toString()
    .padStart(3, "0")}`;
}

function terminalLine(tag, message, className = "", eventTime = new Date()) {
  const line = document.createElement("div");
  line.className = `terminal-line ${className}`.trim();
  const time = document.createElement("time");
  time.textContent = clockText(eventTime);
  const tagNode = document.createElement("span");
  tagNode.textContent = `[${tag}]`;
  const text = document.createElement("div");
  text.textContent = message;
  line.append(time, tagNode, text);
  elements.terminal.append(line);
  scrollTerminalToLatest();
}

function scrollTerminalToLatest(force = false) {
  if (!force && !terminalFollowsLatest) return;
  terminalFollowsLatest = true;
  window.requestAnimationFrame(() => {
    elements.terminal.scrollTop = elements.terminal.scrollHeight;
  });
}

function resetTerminal() {
  terminalFollowsLatest = true;
  elements.terminal.replaceChildren();
  if (activeDashboardMode === "live") {
    terminalLine("BOOT", "NCEDC live shadow · read-only browser bridge", "muted");
    terminalLine("LIVE", "connecting to same-origin api/live", "muted");
  } else {
    terminalLine(
      "BOOT",
      `${currentRegion().eventPrefix.toUpperCase()}/CHI impact relay 0.3`,
      "muted",
    );
    terminalLine("MODEL", "scenario input · delivery path simulation", "muted");
  }
  const prompt = document.createElement("div");
  prompt.className = "terminal-prompt";
  const promptText = document.createElement("span");
  promptText.textContent = "›";
  const cursor = document.createElement("b");
  cursor.className = "cursor";
  prompt.append(promptText, cursor);
  elements.terminal.append(prompt);
  scrollTerminalToLatest(true);
}

function setLiveMetricsEmpty() {
  elements.metricNetwork.textContent = "0 / 8";
  elements.metricWatch.textContent = "—";
  elements.metricMajor.textContent = "—";
  elements.metricPeakMmi.textContent = "—";
  elements.metricPopulationExposed.textContent = "—";
  elements.metricLiquefactionExposed.textContent = "—";
  elements.metricImpactIndex.textContent = "—";
  elements.metricEsChange.textContent = "—";
}

function formatLivePeak(value) {
  if (!Number.isFinite(value)) return "—";
  if (value >= 0.001) return `${value.toFixed(3)} g`;
  if (value >= 0.00001) return `${value.toFixed(5)} g`;
  return `${value.toExponential(1)} g`;
}

function liveWaveformPath(samples) {
  const width = 120;
  const middle = 14;
  if (!Array.isArray(samples) || samples.length === 0) return `M0,${middle}L120,${middle}`;
  return samples
    .map((sample, index) => {
      const x = samples.length === 1 ? width : (index / (samples.length - 1)) * width;
      const displacement = Math.max(
        -34,
        Math.min(34, (Number(sample) / LIVE_TRACE_SCALE_G) * 10),
      );
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${(
        middle - displacement
      ).toFixed(1)}`;
    })
    .join("");
}

function setLiveValue(node, key, label, value) {
  const valueNode = node.querySelector(`[data-value="${key}"]`);
  if (!valueNode) return;
  valueNode.textContent = value;
  const labelNode = valueNode.parentElement?.querySelector(`[data-label="${key}"]`);
  if (labelNode) labelNode.textContent = label;
}

function updateLiveStation(station) {
  const fresh = station?.fresh === true;
  const seen = Number.isFinite(station?.sampleAgeS);
  const phase = fresh ? "recorded" : seen ? "below-gate" : "wait";
  const status = fresh ? "LIVE" : seen ? "STALE" : "WAIT";
  const age = seen ? `${station.sampleAgeS.toFixed(1)}s` : "—";
  const stationColor = fresh ? "#4f9562" : seen ? "#b5453d" : "#aeb6af";
  document.querySelectorAll(`[data-station="${station.code}"]`).forEach((node) => {
    ["wait", "p-pick", "p-wave", "shaking", "recorded", "below-gate"].forEach(
      (value) => node.classList.remove(`phase-${value}`),
    );
    node.classList.remove("associated");
    node.classList.add(`phase-${phase}`);
    node.style.setProperty("--station-mmi-color", stationColor);
    node.setAttribute(
      "aria-label",
      `${station.id}, ${status.toLowerCase()}, sample age ${age}`,
    );
    const markerReading = node.querySelector(".marker-reading");
    if (markerReading) markerReading.textContent = `AGE ${age} · ${status}`;
    const stationCore = node.querySelector(".station-core");
    if (stationCore) {
      stationCore.style.fill = stationColor;
      stationCore.style.stroke = stationColor;
    }
    setLiveValue(node, "distance", "AGE", age);
    setLiveValue(node, "arrivals", "RATE", `${station.sampleRateHz.toFixed(0)} Hz`);
    setLiveValue(node, "mmi", "STATE", status);
    setLiveValue(node, "peak", "PKT PEAK", formatLivePeak(station.packetPeakG));
    const trace = node.querySelector(".trace-signal");
    if (trace) trace.setAttribute("d", liveWaveformPath(station.samplesG));
  });
}

function logLiveHealth(snapshot, healthKey) {
  const generatedAt = Number(snapshot.generatedAt);
  const due = generatedAt - liveLastHealthLogAt >= 10;
  if (healthKey === liveLastHealthKey && !due) return;
  const maximumAge = Number.isFinite(snapshot.maximumSampleAgeS)
    ? `${snapshot.maximumSampleAgeS.toFixed(1)}s max sample age`
    : "waiting for samples";
  const sourceFaults = `${snapshot.gapCount ?? 0} gaps · ${snapshot.pollErrorCount ?? 0} poll errors`;
  terminalLine(
    snapshot.healthy ? "HEALTH" : "DEGRADED",
    `${snapshot.activeStations}/${snapshot.expectedStations} active · ${snapshot.packetCount} packets · ${maximumAge} · ${sourceFaults}`,
    snapshot.healthy ? "success" : "danger",
    new Date(generatedAt * 1000),
  );
  liveLastHealthKey = healthKey;
  liveLastHealthLogAt = generatedAt;
}

function applyLiveSnapshot(snapshot) {
  const active = Number(snapshot.activeStations);
  const expected = Number(snapshot.expectedStations);
  const gaps = Number(snapshot.gapCount ?? 0);
  const pollErrors = Number(snapshot.pollErrorCount ?? 0);
  const healthKey = `${snapshot.status}:${active}:${expected}:${gaps}:${pollErrors}:${snapshot.error ?? ""}`;
  elements.metricNetwork.textContent = `${active} / ${expected}`;
  elements.simulationClock.textContent = "LIVE";
  elements.simulationRate.textContent = snapshot.source ?? "NCEDC DART";
  elements.relayStatus.className = `relay-status ${
    snapshot.healthy ? "alerting" : "blocked"
  }`;
  elements.relayStatus.textContent = snapshot.healthy
    ? `Live shadow · ${active}/${expected}`
    : `${snapshot.status} · ${active}/${expected}`;
  const maximumAge = Number.isFinite(snapshot.maximumSampleAgeS)
    ? ` · max age ${snapshot.maximumSampleAgeS.toFixed(1)}s`
    : "";
  elements.terminalSummary.textContent = `NCEDC DART ${active}/${expected} active${maximumAge} · ${gaps} gaps · ${pollErrors} poll errors.`;
  logLiveHealth(snapshot, healthKey);
  snapshot.stations.forEach(updateLiveStation);

  if (snapshot.latestEvent) {
    const event = snapshot.latestEvent;
    const eventKey = `${event.event_id}:${event.revision}`;
    if (eventKey !== liveLastEventId) {
      liveLastEventId = eventKey;
      const status = eventDisplayStatus(event.classification, event.confidence);
      terminalLine(
        "DETECT",
        `${status} — ${describeBayAreaLocation(event.latitude, event.longitude)} · ${event.station_count} sites`,
        "danger",
        new Date(event.detected_at * 1000),
      );
      drawEpicenters({
        latitude: event.latitude,
        longitude: event.longitude,
        depthKm: event.depth_km,
      }, true);
    }
  }
}

function applyLiveUnavailable(message) {
  const healthKey = `unavailable:${message}`;
  elements.metricNetwork.textContent = "0 / 8";
  elements.simulationClock.textContent = "LIVE";
  elements.simulationRate.textContent = "BRIDGE OFFLINE";
  elements.relayStatus.className = "relay-status blocked";
  elements.relayStatus.textContent = "Live bridge unavailable";
  elements.terminalSummary.textContent =
    "No live data. Run the local read-only dashboard bridge.";
  if (healthKey !== liveLastHealthKey) {
    terminalLine("CLOSED", message, "danger");
    liveLastHealthKey = healthKey;
  }
}

async function pollLiveStatus(generation) {
  try {
    const response = await fetch("api/live", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`live bridge returned HTTP ${response.status}`);
    const snapshot = await response.json();
    if (snapshot.schemaVersion !== 1) throw new Error("unsupported live bridge schema");
    if (generation === livePollGeneration && activeDashboardMode === "live") {
      applyLiveSnapshot(snapshot);
    }
  } catch (error) {
    if (generation === livePollGeneration && activeDashboardMode === "live") {
      applyLiveUnavailable(error.message);
    }
  } finally {
    if (generation === livePollGeneration && activeDashboardMode === "live") {
      livePollTimer = window.setTimeout(
        () => pollLiveStatus(generation),
        LIVE_POLL_INTERVAL_MS,
      );
    }
  }
}

function stopLivePolling() {
  livePollGeneration += 1;
  if (livePollTimer !== null) window.clearTimeout(livePollTimer);
  livePollTimer = null;
}

function enterLiveMode() {
  cancelSimulation();
  stopLivePolling();
  activeDashboardMode = "live";
  configureRegion("bay");
  applyPreset("san-francisco-1906");
  liveLastHealthKey = null;
  liveLastHealthLogAt = 0;
  liveLastEventId = null;
  resetTerminal();
  setFormLocked(true);
  elements.dashboardRegion.disabled = true;
  elements.scenarioContext.hidden = true;
  elements.play.disabled = true;
  elements.pause.disabled = true;
  elements.outputModeLabel.textContent = "Live network output";
  elements.terminalAuthMode.textContent = "READ ONLY / NO DELIVERY";
  elements.formNote.textContent = "";
  elements.relayStatus.className = "relay-status";
  elements.relayStatus.textContent = "Connecting to live bridge";
  elements.epicenterLayer.replaceChildren();
  clearWavefronts();
  resetPropagationReveal();
  setLiveMetricsEmpty();
  elements.groundMotionSource.textContent = "LIVE WAVEFORMS";
  elements.groundMotionSource.classList.remove("fallback");
  syncHazardControls();
  const referenceInput = PRESETS["san-francisco-1906"];
  const referenceResult = modelEarthquake(referenceInput, "dart");
  drawStations(referenceResult, referenceInput);
  referenceResult.stationResults.forEach((station) =>
    updateLiveStation({
      ...station,
      fresh: false,
      sampleAgeS: null,
      sampleRateHz: 100,
      packetPeakG: null,
      samplesG: [],
    }),
  );
  const generation = livePollGeneration;
  pollLiveStatus(generation);
}

function enterScenarioMode() {
  stopLivePolling();
  activeDashboardMode = "scenario";
  syncHazardControls();
  elements.dashboardRegion.disabled = false;
  elements.scenarioContext.hidden = activeRegionName === "bay";
  elements.outputModeLabel.textContent = "Simulation output";
  elements.terminalAuthMode.textContent = "HMAC-SHA256 / SIMULATED";
  elements.formNote.textContent = "";
  resetSimulation();
}

function epicenterGroup(map, input, overview = false) {
  const point = projectPoint(map, input.latitude, input.longitude);
  const group = svgElement("g", {
    class: `epicenter-marker${overview ? " overview" : ""}`,
    transform: `translate(${point.x} ${point.y})`,
    role: "img",
    "aria-label": `Synthetic epicenter at ${input.latitude}, ${input.longitude}`,
  });
  group.append(svgElement("circle", { class: "epicenter-ring", r: overview ? 5 : 17 }));
  const size = overview ? 3.5 : 8;
  group.append(
    svgElement("line", {
      class: "epicenter-cross",
      x1: -size,
      y1: -size,
      x2: size,
      y2: size,
    }),
  );
  group.append(
    svgElement("line", {
      class: "epicenter-cross",
      x1: size,
      y1: -size,
      x2: -size,
      y2: size,
    }),
  );
  return group;
}

function rupturePath(map, input) {
  if (!input.rupture?.points?.length) return "";
  return input.rupture.points
    .map((point, index) => {
      const projected = projectPoint(map, point.latitude, point.longitude);
      return `${index === 0 ? "M" : "L"}${projected.x.toFixed(1)},${projected.y.toFixed(1)}`;
    })
    .join("");
}

function drawRupture(input, elapsedS = null) {
  if (!input.rupture?.points?.length) {
    elements.ruptureLayer.replaceChildren();
    return;
  }
  const pathData = rupturePath(currentMap(), input);
  const trace = svgElement("path", { class: "rupture-trace", d: pathData });
  const samples = ruptureSamples(input);
  const activeSamples =
    elapsedS === null
      ? []
      : samples.filter((sample) => sample.activationAfterOriginS <= elapsedS);
  const progressPath = activeSamples
    .map((sample, index) => {
      const projected = projectPoint(currentMap(), sample.latitude, sample.longitude);
      return `${index === 0 ? "M" : "L"}${projected.x.toFixed(1)},${projected.y.toFixed(1)}`;
    })
    .join("");
  const progress = svgElement("path", {
    class: "rupture-progress",
    d: activeSamples.length > 1 ? progressPath : "",
  });
  const children = [trace, progress];
  input.rupture.points.filter((point) => point.label).forEach((landmark) => {
    const point = projectPoint(
      currentMap(),
      landmark.latitude,
      landmark.longitude,
    );
    const marker = svgElement("g", {
      class: "rupture-landmark",
      transform: `translate(${point.x} ${point.y})`,
      role: "img",
      "aria-label": landmark.label,
    });
    marker.append(svgElement("circle", { r: 5 }));
    const label = svgElement("text", { x: 8, y: -7 });
    label.textContent = landmark.markerLabel ?? landmark.label.toUpperCase();
    marker.append(label);
    children.push(marker);
  });
  elements.ruptureLayer.replaceChildren(...children);
}

function drawEpicenters(input, active = false) {
  elements.epicenterLayer.replaceChildren(epicenterGroup(currentMap(), input));
  drawRupture(input, active ? 0 : null);
  document
    .querySelectorAll(".epicenter-ring")
    .forEach((ring) => ring.classList.toggle("active", active));
}

function markerGroup(station, map, input) {
  const point = projectPoint(map, station.latitude, station.longitude);
  const impact = estimateMercalliAtLocation(input, station.latitude, station.longitude);
  const offset = STATION_CALLOUT_OFFSETS[station.code] ?? { x: 10, y: -12 };
  const group = svgElement("g", {
    class: "station-marker phase-wait",
    transform: `translate(${point.x} ${point.y})`,
    "data-station": station.code,
    "data-final-mmi": impact.intensity.toFixed(3),
    role: "img",
    tabindex: 0,
    "aria-label": `${station.id}, waiting for wave arrival`,
  });
  group.append(
    svgElement("rect", {
      class: "station-callout",
      x: offset.x,
      y: offset.y,
      width: 67,
      height: 25,
      rx: 1,
    }),
  );
  group.append(svgElement("circle", { class: "station-halo", r: 9 }));
  group.append(svgElement("circle", { class: "station-core", r: 4.5 }));
  const label = svgElement("text", {
    class: "marker-code",
    x: offset.x + 5,
    y: offset.y + 9,
  });
  label.textContent = station.code;
  const reading = svgElement("text", {
    class: "marker-reading",
    x: offset.x + 5,
    y: offset.y + 19,
  });
  reading.textContent = "MMI — · WAIT";
  group.append(label, reading);
  return group;
}

function stationCard(station, input) {
  const card = document.createElement("article");
  card.className = "station-card phase-wait";
  card.dataset.station = station.code;
  card.tabIndex = 0;

  const header = document.createElement("header");
  const identity = document.createElement("div");
  const code = document.createElement("strong");
  code.textContent = station.code;
  const channel = document.createElement("small");
  channel.textContent = station.id;
  identity.append(code, channel);
  const location = document.createElement("b");
  location.className = "station-location";
  location.textContent = station.siteName;
  header.append(identity, location);

  const trace = svgElement("svg", {
    class: "station-trace",
    viewBox: "0 0 120 28",
    role: "img",
    "aria-label": `${station.code} modeled waveform`,
  });
  trace.append(svgElement("line", { class: "trace-zero", x1: 0, y1: 14, x2: 120, y2: 14 }));
  trace.append(svgElement("path", { class: "trace-signal", d: "M0,14L120,14" }));

  const values = document.createElement("div");
  values.className = "station-values";
  const impact = estimateMercalliAtLocation(input, station.latitude, station.longitude);
  card.dataset.finalMmi = impact.intensity.toFixed(3);
  const entries = [
    ["DIST", `${station.surfaceDistanceKm.toFixed(1)} km`, "distance"],
    [
      "P / S",
      `${station.arrivalAfterOriginS.toFixed(1)} / ${station.strongMotionAfterOriginS.toFixed(1)}s`,
      "arrivals",
    ],
    ["MMI", "—", "mmi"],
    ["PGA", `${impact.pgaG.toFixed(3)} g`, "peak"],
  ];
  entries.forEach(([label, value, key]) => {
    const item = document.createElement("div");
    const term = document.createElement("span");
    term.textContent = label;
    term.dataset.label = key;
    const description = document.createElement("b");
    description.textContent = value;
    description.dataset.value = key;
    item.append(term, description);
    values.append(item);
  });
  card.append(header, trace, values);
  bindStationHighlight(card, station.code);
  return card;
}

function bindStationHighlight(element, code) {
  const setHighlight = (active) => {
    document
      .querySelectorAll(`[data-station="${code}"]`)
      .forEach((node) => node.classList.toggle("highlighted", active));
  };
  element.addEventListener("mouseenter", () => setHighlight(true));
  element.addEventListener("mouseleave", () => setHighlight(false));
  element.addEventListener("focus", () => setHighlight(true));
  element.addEventListener("blur", () => setHighlight(false));
}

function drawStations(result, input) {
  elements.stationLayer.replaceChildren();
  elements.stationGrid.replaceChildren();
  result.stationResults.forEach((station) => {
    const marker = markerGroup(station, currentMap(), input);
    bindStationHighlight(marker, station.code);
    elements.stationLayer.append(marker);
    elements.stationGrid.append(stationCard(station, input));
  });
}

function phaseAt(station, elapsedS) {
  if (elapsedS < station.arrivalAfterOriginS) return "wait";
  if (elapsedS < station.strongMotionAfterOriginS) return station.triggered ? "p-pick" : "p-wave";
  if (elapsedS < station.strongMotionAfterOriginS + station.shakingDurationS) {
    return station.triggered ? "shaking" : "below-gate";
  }
  return station.triggered ? "recorded" : "below-gate";
}

function phaseLabel(phase, station, elapsedS) {
  if (phase === "wait") {
    return `P IN ${Math.max(0, station.arrivalAfterOriginS - elapsedS).toFixed(1)}s`;
  }
  if (phase === "p-pick") return "P PICK";
  if (phase === "p-wave") return "P WAVE";
  if (phase === "shaking") return "SHAKING";
  if (phase === "recorded") return "RECORDED";
  return "BELOW GATE";
}

function observedStationMmi(station, finalMmi, elapsedS) {
  const shakingElapsedS = elapsedS - station.strongMotionAfterOriginS;
  if (shakingElapsedS < 0) return null;
  const progress = Math.min(1, shakingElapsedS / STATION_MMI_RISE_S);
  const easedProgress = 1 - (1 - progress) ** 3;
  return 1 + (finalMmi - 1) * easedProgress;
}

function waveformPath(station, elapsedS) {
  const width = 120;
  const middle = 14;
  const windowS = 3.0;
  const phaseSeed = station.code.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const points = [];
  for (let index = 0; index <= 48; index += 1) {
    const sampleTime = elapsedS - windowS + (index / 48) * windowS;
    const shakingTime = sampleTime - station.strongMotionAfterOriginS;
    let displacement = 0.35 * Math.sin(sampleTime * 7 + phaseSeed);
    if (shakingTime >= 0) {
      const peakScale = Math.min(10, 2.2 + Math.sqrt(station.peakAccelerationG) * 70);
      const durationS = station.shakingDurationS ?? WAVE_MODEL.shakingDurationS;
      const envelope =
        durationS > 30
          ? (0.65 + 0.35 * Math.exp(-shakingTime / 30)) *
            (shakingTime < durationS
              ? Math.min(1, Math.max(0, (durationS - shakingTime) / 15))
              : Math.exp(-(shakingTime - durationS) / 2))
          : Math.exp(-shakingTime / 4.5);
      displacement +=
        peakScale *
        envelope *
        (0.68 * Math.sin(shakingTime * 25 + phaseSeed) +
          0.32 * Math.sin(shakingTime * 43 + phaseSeed / 3));
    }
    points.push(`${index === 0 ? "M" : "L"}${((index / 48) * width).toFixed(1)},${(
      middle - displacement
    ).toFixed(1)}`);
  }
  return points.join("");
}

function updateStations(result, elapsedS, associatedStations) {
  result.stationResults.forEach((station) => {
    const phase = phaseAt(station, elapsedS);
    const label = phaseLabel(phase, station, elapsedS);
    document.querySelectorAll(`[data-station="${station.code}"]`).forEach((node) => {
      const finalMmi = Number.parseFloat(node.dataset.finalMmi);
      const observedMmi = observedStationMmi(station, finalMmi, elapsedS);
      const observedMmiLabel = observedMmi === null ? "—" : observedMmi.toFixed(1);
      const stationColor = observedMmi === null ? "" : mmiColor(observedMmi);
      ["wait", "p-pick", "p-wave", "shaking", "recorded", "below-gate"].forEach(
        (value) => node.classList.remove(`phase-${value}`),
      );
      node.classList.add(`phase-${phase}`);
      node.classList.toggle("associated", associatedStations.has(station.id));
      if (stationColor) node.style.setProperty("--station-mmi-color", stationColor);
      else node.style.removeProperty("--station-mmi-color");
      node.setAttribute("aria-label", `${station.id}, ${label.toLowerCase()}`);
      const markerReading = node.querySelector(".marker-reading");
      if (markerReading) markerReading.textContent = `MMI ${observedMmiLabel} · ${label}`;
      const mmiValue = node.querySelector('[data-value="mmi"]');
      if (mmiValue) mmiValue.textContent = observedMmiLabel;
      const stationCore = node.querySelector(".station-core");
      if (stationCore) {
        stationCore.style.fill = stationColor;
        stationCore.style.stroke = stationColor;
      }
      const trace = node.querySelector(".trace-signal");
      if (trace) trace.setAttribute("d", waveformPath(station, elapsedS));
    });
  });
}

function destinationPoint(latitude, longitude, bearingDegrees, distanceKm) {
  const angularDistance = distanceKm / EARTH_RADIUS_KM;
  const bearing = (bearingDegrees * Math.PI) / 180;
  const latitudeRadians = (latitude * Math.PI) / 180;
  const longitudeRadians = (longitude * Math.PI) / 180;
  const resultLatitude = Math.asin(
    Math.sin(latitudeRadians) * Math.cos(angularDistance) +
      Math.cos(latitudeRadians) * Math.sin(angularDistance) * Math.cos(bearing),
  );
  const resultLongitude =
    longitudeRadians +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitudeRadians),
      Math.cos(angularDistance) - Math.sin(latitudeRadians) * Math.sin(resultLatitude),
    );
  return {
    latitude: (resultLatitude * 180) / Math.PI,
    longitude: (resultLongitude * 180) / Math.PI,
  };
}

function wavefrontPath(map, input, radiusKm) {
  if (radiusKm <= 0) return "";
  const commands = [];
  for (let bearing = 0; bearing <= 360; bearing += 5) {
    const destination = destinationPoint(
      input.latitude,
      input.longitude,
      bearing,
      radiusKm,
    );
    const point = projectPoint(map, destination.latitude, destination.longitude);
    commands.push(`${bearing === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`);
  }
  return `${commands.join("")}Z`;
}

function sourceWavefrontPath(map, input, elapsedS, velocityKmS) {
  if (!input.rupture?.points?.length) {
    const radiusKm = surfaceIntersectionRadiusKm(elapsedS, velocityKmS, input.depthKm);
    return wavefrontPath(map, input, radiusKm);
  }
  const activeSamples = ruptureSamples(input).filter(
    (sample) => sample.activationAfterOriginS <= elapsedS,
  );
  const sampleStep = Math.max(1, Math.ceil(activeSamples.length / 12));
  return activeSamples
    .filter(
      (sample, index) =>
        index % sampleStep === 0 || index === activeSamples.length - 1,
    )
    .map((sample) => {
      const localElapsedS = elapsedS - sample.activationAfterOriginS;
      const radiusKm = surfaceIntersectionRadiusKm(
        localElapsedS,
        velocityKmS,
        input.depthKm,
      );
      return wavefrontPath(map, sample, radiusKm);
    })
    .join("");
}

function updateWavefronts(input, elapsedS) {
  const pRadius = surfaceIntersectionRadiusKm(
    elapsedS,
    WAVE_MODEL.pVelocityKmS,
    input.depthKm,
  );
  const sRadius = surfaceIntersectionRadiusKm(
    elapsedS,
    WAVE_MODEL.sVelocityKmS,
    input.depthKm,
  );
  elements.pWave.setAttribute(
    "d",
    sourceWavefrontPath(currentMap(), input, elapsedS, WAVE_MODEL.pVelocityKmS),
  );
  elements.sWave.setAttribute(
    "d",
    sourceWavefrontPath(currentMap(), input, elapsedS, WAVE_MODEL.sVelocityKmS),
  );
  drawRupture(input, elapsedS);
  elements.pRadius.textContent = `${pRadius.toFixed(0)} km`;
  elements.sRadius.textContent = `${sRadius.toFixed(0)} km`;
}

function clearWavefronts() {
  [elements.pWave, elements.sWave].forEach((wave) => wave.setAttribute("d", ""));
  elements.pRadius.textContent = "0 km";
  elements.sRadius.textContent = "0 km";
}

function alertCard(revision, eventId, impact, input) {
  const card = document.createElement("article");
  const isMajor = revision.classification === "major_suspected";
  card.className = `alert-card${isMajor ? " major" : ""}`;

  const header = document.createElement("div");
  header.className = "alert-card-header";
  const title = document.createElement("strong");
  title.textContent = `${eventDisplayStatus(
    revision.classification,
    revision.confidence,
  )} — ${describeScenarioLocation(input, revision.latitude, revision.longitude)}`;
  const identity = document.createElement("span");
  identity.textContent = `${eventId} · REV ${revision.revision}`;
  header.append(title, identity);

  const grid = document.createElement("div");
  grid.className = "alert-grid";
  const fields = [
    ["Location", `${revision.latitude.toFixed(2)}, ${revision.longitude.toFixed(2)}`],
    ["Stations", `${revision.stationCount} sites`],
    ["Confidence", revision.confidence.toFixed(3)],
    ["Peak accel.", `${revision.maxPeakAccelerationG.toFixed(4)} g`],
    ["Depth", `${revision.depthKm.toFixed(1)} km`],
    ["Location RMS", `${revision.locationRmsS.toFixed(3)} s`],
    ["Detection", `T+${revision.detectedAfterOriginS.toFixed(1)} s`],
    ["Source age", `${revision.maxDataLatencyS.toFixed(1)} s`],
    ["Population ≥ VI", formatPopulation(impact.populationMmi6Plus)],
    ["Impact index", impact.impactIndex.toFixed(1)],
    ["ES near-month", formatExpectedChangePercent(impact.esNearMonthChangePercent)],
  ];
  fields.forEach(([label, value]) => {
    const field = document.createElement("div");
    field.className = "alert-field";
    const labelNode = document.createElement("span");
    labelNode.textContent = label;
    const valueNode = document.createElement("b");
    valueNode.textContent = value;
    field.append(labelNode, valueNode);
    grid.append(field);
  });

  const stations = document.createElement("div");
  stations.className = "alert-stations";
  stations.textContent = `CONTRIBUTING // ${revision.stationCodes.join(" · ")}`;
  card.append(header, grid, stations);
  elements.terminal.append(card);
  scrollTerminalToLatest();
}

function eventTime(simulationState, elapsedS) {
  return new Date(simulationState.originTime.getTime() + elapsedS * 1000);
}

function buildTimeline(result) {
  const events = [];
  result.stationResults.forEach((station) => {
    if (station.triggered) {
      events.push({ at: station.arrivalAfterOriginS, kind: "station-pick", station });
    }
  });
  result.revisions.forEach((revision) => {
    events.push({ at: revision.detectedAfterOriginS, kind: "revision", revision });
    if (revision.fresh) {
      events.push({
        at: revision.detectedAfterOriginS + result.profile.acknowledgementS,
        kind: "acknowledgement",
        revision,
      });
    }
  });
  if (result.revisions.length === 0) {
    const latestPick = Math.max(
      0,
      ...result.stationResults
        .filter((station) => station.triggered)
        .map((station) => station.arrivalAfterOriginS),
    );
    events.push({
      at: result.outcome === "outside_association_grid" ? 0.5 : latestPick + 0.5,
      kind: "closed",
      outcome: result.outcome,
    });
  }
  const priority = { "station-pick": 0, revision: 1, acknowledgement: 2, closed: 3 };
  return events.sort((a, b) => a.at - b.at || priority[a.kind] - priority[b.kind]);
}

function dispatchTimelineEvent(state, event) {
  const timestamp = eventTime(state, event.at);
  if (event.kind === "station-pick") {
    const station = event.station;
    terminalLine(
      "PICK",
      `${station.code} · ${station.surfaceDistanceKm.toFixed(1)} km · P T+${station.arrivalAfterOriginS.toFixed(1)}s · S T+${station.strongMotionAfterOriginS.toFixed(1)}s · est ${station.peakAccelerationG.toFixed(4)}g`,
      "muted",
      timestamp,
    );
    return;
  }
  if (event.kind === "revision") {
    const revision = event.revision;
    const wireId = `${state.eventId}:${revision.revision}`;
    revision.stations.forEach((station) => state.associatedStations.add(station));
    if (!revision.fresh) {
      terminalLine(
        "BLOCKED",
        `${wireId} · ${revision.classification.toUpperCase()} suppressed · source age ${revision.maxDataLatencyS.toFixed(1)}s > 15.0s`,
        "danger",
        timestamp,
      );
      elements.relayStatus.className = "relay-status blocked";
      elements.relayStatus.textContent = "Fail closed / stale";
      elements.terminalSummary.textContent = "No trader alert delivered: freshness gate failed.";
      return;
    }
    updatePropagationReveal(event.at);
    terminalLine("RX", `${wireId} · signature verified · alert ID matched`, "success", timestamp);
    alertCard(revision, state.eventId, currentPopulationImpact(), state.input);
    elements.relayStatus.className = "relay-status alerting";
    elements.relayStatus.textContent = "Authenticated alert";
    elements.terminalSummary.textContent = `Latest: ${revision.classification.replaceAll("_", " ")} · revision ${revision.revision}.`;
    return;
  }
  if (event.kind === "acknowledgement") {
    const revision = event.revision;
    const wireId = `${state.eventId}:${revision.revision}`;
    terminalLine(
      "ACK",
      `${wireId} accepted · HTTP 204 · ${Math.round(state.result.profile.acknowledgementS * 1000)}ms modeled transit`,
      "success",
      timestamp,
    );
    return;
  }
  const reason =
    event.outcome === "outside_association_grid"
      ? `origin outside ${currentRegion().label} association grid`
      : "insufficient independent station diversity";
  terminalLine("CLOSED", `No alert: ${reason}.`, "danger", timestamp);
  elements.relayStatus.className = "relay-status blocked";
  elements.relayStatus.textContent = "No delivery";
  elements.terminalSummary.textContent = `Fail closed: ${reason}.`;
}

function setFormLocked(locked) {
  elements.form.querySelectorAll("input, select").forEach((control) => {
    control.disabled = locked;
  });
  elements.strike.disabled = locked;
  elements.dashboardRegion.disabled = locked || activeDashboardMode === "live";
}

function setPlaybackState(state) {
  const paused = state === "paused";
  const running = state === "running";
  elements.play.disabled = running;
  elements.pause.disabled = !running;
  const playLabel = paused ? "Resume simulation" : "Play simulation";
  elements.play.setAttribute("aria-label", playLabel);
  elements.play.title = playLabel;
}

function simulationFinishTime(result, timeline) {
  const latestShaking = Math.max(
    ...result.stationResults.map(
      (station) => station.strongMotionAfterOriginS + station.shakingDurationS,
    ),
  );
  const latestEvent = timeline.length ? timeline.at(-1).at + 0.6 : 0;
  const latestMapArrival = impactCells.length ? impactCells.at(-1).arrivalS + 0.5 : 0;
  return Math.max(latestShaking, latestEvent, latestMapArrival);
}

function elapsedSimulationSeconds(state, now = performance.now()) {
  if (state.paused) return state.elapsedS;
  return ((now - state.startedAtPerformanceMs) / 1000) * state.speed;
}

function scheduleNextTimelineEvent(state) {
  if (state.nextEventIndex >= state.timeline.length) return;
  const nextEvent = state.timeline[state.nextEventIndex];
  const remainingSimulationS = nextEvent.at - elapsedSimulationSeconds(state);
  const delayMs = Math.max(0, (remainingSimulationS / state.speed) * 1000);
  eventTimer = window.setTimeout(() => processTimeline(state.runId), delayMs);
}

function processTimeline(runId) {
  if (!simulation || simulation.runId !== runId || simulation.paused) return;
  const state = simulation;
  const elapsedS = elapsedSimulationSeconds(state);
  while (state.nextEventIndex < state.timeline.length) {
    const event = state.timeline[state.nextEventIndex];
    if (event.at - elapsedS > 0.002) break;
    dispatchTimelineEvent(state, event);
    state.nextEventIndex += 1;
  }
  scheduleNextTimelineEvent(state);
}

function renderSimulationFrame(runId) {
  if (!simulation || simulation.runId !== runId || simulation.paused) return;
  const state = simulation;
  const now = performance.now();
  const elapsedS = elapsedSimulationSeconds(state, now);
  state.elapsedS = elapsedS;
  elements.simulationClock.textContent = `T+${elapsedS.toFixed(1).padStart(4, "0")}s`;

  updateWavefronts(state.input, elapsedS);
  updatePropagationReveal(elapsedS);
  if (now - state.lastStationRenderMs >= 45) {
    updateStations(state.result, elapsedS, state.associatedStations);
    state.lastStationRenderMs = now;
  }

  if (elapsedS >= state.finishAtS) {
    updateWavefronts(state.input, state.finishAtS);
    elements.pWave.setAttribute("d", "");
    elements.sWave.setAttribute("d", "");
    updatePropagationReveal(state.finishAtS);
    updateStations(state.result, state.finishAtS, state.associatedStations);
    setFormLocked(false);
    setPlaybackState("idle");
    elements.simulationClock.textContent = `T+${state.finishAtS.toFixed(1)}s`;
    if (eventTimer !== null) window.clearTimeout(eventTimer);
    eventTimer = null;
    simulation = null;
    animationFrame = null;
    return;
  }
  animationFrame = window.requestAnimationFrame(() => renderSimulationFrame(runId));
}

function cancelSimulation() {
  nextRunId += 1;
  if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
  if (eventTimer !== null) window.clearTimeout(eventTimer);
  animationFrame = null;
  eventTimer = null;
  simulation = null;
  setFormLocked(false);
  setPlaybackState("idle");
}

function pauseSimulation() {
  if (!simulation || simulation.paused) return;
  const now = performance.now();
  simulation.elapsedS = elapsedSimulationSeconds(simulation, now);
  simulation.paused = true;
  simulation.pausedAtPerformanceMs = now;
  if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
  if (eventTimer !== null) window.clearTimeout(eventTimer);
  animationFrame = null;
  eventTimer = null;
  elements.simulationRate.textContent = `${simulation.speed}× PAUSED`;
  setPlaybackState("paused");
}

function playSimulation() {
  if (!simulation) {
    elements.form.requestSubmit();
    return;
  }
  if (!simulation.paused) return;
  const state = simulation;
  const now = performance.now();
  state.startedAtPerformanceMs += now - state.pausedAtPerformanceMs;
  state.pausedAtPerformanceMs = null;
  state.paused = false;
  state.lastStationRenderMs = -Infinity;
  elements.simulationRate.textContent = `${state.speed}× ${
    state.speed === 1 ? "REAL TIME" : "REVIEW SPEED"
  }`;
  setPlaybackState("running");
  scheduleNextTimelineEvent(state);
  animationFrame = window.requestAnimationFrame(() => renderSimulationFrame(state.runId));
}

function updatePreview() {
  elements.simulationRate.textContent = `${elements.speed.value}× ${
    elements.speed.value === "1" ? "REAL TIME" : "REVIEW SPEED"
  }`;
  try {
    const input = readInput();
    updateGroundMotionSource(input);
    const result = modelEarthquake(input, elements.profile.value, activeRegionName);
    const watch = result.revisions[0];
    const major = result.revisions.find((revision) => revision.classification === "major_suspected");
    elements.metricWatch.textContent = watch ? formatSeconds(watch.detectedAfterOriginS) : "NONE";
    elements.metricMajor.textContent = major ? formatSeconds(major.detectedAfterOriginS) : "—";
    elements.metricNetwork.textContent = `${result.stationResults.filter((station) => station.triggered).length} / ${result.stationResults.length}`;
    updateImpact(input);
    if (liquefactionOverlayEnabled) {
      liquefactionCells.forEach((cell) => {
        cell.rect.style.opacity = cell.opacity;
      });
    }
    drawEpicenters(input);
    drawStations(result, input);
    updateStations(result, 0, new Set());
    clearWavefronts();
    elements.simulationClock.textContent = "T+00.0s";
    if (result.revisions.length) {
      elements.formNote.textContent = "";
    } else if (result.outcome === "outside_association_grid") {
      elements.formNote.textContent = `This origin is outside the ${currentRegion().label} association grid.`;
    } else {
      elements.formNote.textContent = "This input does not produce four-site network agreement.";
    }
  } catch (error) {
    elements.formNote.textContent = error.message;
  }
}

function runSimulation(event) {
  event.preventDefault();
  if (!elements.form.reportValidity()) return;
  cancelSimulation();
  resetTerminal();

  const input = readInput();
  updateGroundMotionSource(input);
  const speed = Number.parseFloat(elements.speed.value);
  const result = modelEarthquake(input, elements.profile.value, activeRegionName);
  const impact = updateImpact(input);
  const esImpact = modelEsNearMonthImpact(impact.impactIndex);
  const originTime = new Date();
  const timeline = buildTimeline(result);
  const runId = nextRunId;
  simulation = {
    runId,
    input,
    speed,
    result,
    impact,
    originTime,
    eventId: `${currentRegion().eventPrefix}-${originTime.getTime()}`,
    timeline,
    nextEventIndex: 0,
    associatedStations: new Set(),
    startedAtPerformanceMs: performance.now(),
    lastStationRenderMs: -Infinity,
    elapsedS: 0,
    paused: false,
    pausedAtPerformanceMs: null,
    finishAtS: simulationFinishTime(result, timeline),
  };

  setFormLocked(true);
  setPlaybackState("running");
  elements.relayStatus.className = "relay-status";
  elements.relayStatus.textContent = "Waiting for association";
  elements.terminalSummary.textContent = `Synthetic M${input.magnitude.toFixed(1)} origin in progress.`;
  elements.simulationRate.textContent = `${speed}× ${speed === 1 ? "REAL TIME" : "REVIEW SPEED"}`;
  drawEpicenters(input, true);
  drawStations(result, input);
  terminalLine(
    "ORIGIN",
    `SYNTHETIC M${input.magnitude.toFixed(1)} · ${input.latitude.toFixed(3)}, ${input.longitude.toFixed(3)} · depth ${input.depthKm.toFixed(1)} km`,
    "",
    originTime,
  );
  if (input.rupture) {
    const rupture = ruptureSamples(input);
    terminalLine(
      "RUPTURE",
      `${input.rupture.label} · ${rupture.at(-1).distanceAlongRuptureKm.toFixed(0)} km · ${input.rupture.ruptureVelocityKmS.toFixed(1)} km/s · ${ruptureDurationS(input).toFixed(0)}s to endpoints · geometry is a scenario proxy`,
      "danger",
      originTime,
    );
  }
  if (input.shakeMap) {
    terminalLine(
      "SHAKEMAP",
      `${input.shakeMap.source} · ${input.shakeMap.sourceKind ?? "spatial ground-motion field"}`,
      "muted",
      originTime,
    );
  } else {
    terminalLine(
      "SHAKEMAP",
      "No event-specific field · using coarse magnitude-distance attenuation fallback",
      "danger",
      originTime,
    );
  }
  const liquefaction = currentMap().liquefaction;
  if (liquefaction) {
    terminalLine(
      "LIQUEFACTION",
      `${liquefaction.model} · ${liquefaction.source} · ${liquefaction.groundwaterDepthFeet} ft groundwater assumed · max ${(impact.maximumLiquefactionProbability * 100).toFixed(0)}% · ${formatPopulation(impact.liquefactionPopulation5Percent)} residents at ≥5% · excluded from impact/ES`,
      "muted",
      originTime,
    );
  }
  terminalLine(
    "MODEL",
    `P ${WAVE_MODEL.pVelocityKmS.toFixed(1)} km/s · S ${WAVE_MODEL.sVelocityKmS.toFixed(1)} km/s · peak MMI ${impact.maximumMmi.toFixed(1)} · impact ${impact.impactIndex.toFixed(1)} · ES ${formatExpectedChangePercent(esImpact.expectedChangePercent)}`,
    "muted",
    originTime,
  );
  terminalLine(
    "PATH",
    `${result.profile.label} · modeled source age ${result.profile.sourceAgeS.toFixed(1)}s`,
    "muted",
    originTime,
  );
  scheduleNextTimelineEvent(simulation);
  animationFrame = window.requestAnimationFrame(() => renderSimulationFrame(runId));
}

function resetSimulation() {
  cancelSimulation();
  elements.relayStatus.className = "relay-status";
  elements.relayStatus.textContent = "Ready";
  elements.terminalSummary.textContent = "Waiting for a synthetic origin.";
  resetTerminal();
  updatePreview();
}

elements.preset.addEventListener("change", () => {
  const preset = PRESETS[elements.preset.value];
  if (preset) {
    const presetRegion = preset.region ?? "bay";
    if (presetRegion !== activeRegionName) configureRegion(presetRegion);
    applyPreset(elements.preset.value);
  }
  updatePreview();
});
[elements.magnitude, elements.depth, elements.latitude, elements.longitude].forEach((element) => {
  element.addEventListener("input", () => {
    elements.preset.value = "custom";
    updatePreview();
  });
});
elements.profile.addEventListener("change", updatePreview);
elements.speed.addEventListener("change", updatePreview);
elements.dashboardMode.addEventListener("change", () => {
  if (elements.dashboardMode.value === "live") enterLiveMode();
  else enterScenarioMode();
});
elements.dashboardRegion.addEventListener("change", () => {
  cancelSimulation();
  configureRegion(elements.dashboardRegion.value);
  applyPreset(defaultPresetForRegion(activeRegionName));
  resetTerminal();
  updatePreview();
});
elements.liquefactionToggle.addEventListener("click", () => {
  setLiquefactionOverlay(!liquefactionOverlayEnabled);
});
elements.form.addEventListener("submit", runSimulation);
elements.reset.addEventListener("click", resetSimulation);
elements.play.addEventListener("click", playSimulation);
elements.pause.addEventListener("click", pauseSimulation);
elements.terminal.addEventListener(
  "scroll",
  () => {
    const distanceFromLatest =
      elements.terminal.scrollHeight -
      elements.terminal.clientHeight -
      elements.terminal.scrollTop;
    terminalFollowsLatest = distanceFromLatest <= 24;
  },
  { passive: true },
);
elements.networkMap.addEventListener("pointerdown", (event) => {
  if (activeDashboardMode === "live" || simulation || event.button !== 0) return;
  draggingEpicenter = true;
  elements.networkMap.setPointerCapture(event.pointerId);
  queueEpicenterPlacement(event);
});
elements.networkMap.addEventListener("pointermove", (event) => {
  if (draggingEpicenter) queueEpicenterPlacement(event);
});
elements.networkMap.addEventListener("pointerup", (event) => {
  draggingEpicenter = false;
  if (elements.networkMap.hasPointerCapture(event.pointerId)) {
    elements.networkMap.releasePointerCapture(event.pointerId);
  }
});
elements.networkMap.addEventListener("pointercancel", () => {
  draggingEpicenter = false;
});

function updateClock() {
  elements.clock.textContent = `UTC ${clockText().slice(0, 8)}`;
}

const query = new URLSearchParams(window.location.search);
const requestedPreset = PRESETS[query.get("preset")] ? query.get("preset") : null;
let requestedRegion = requestedPreset ? PRESETS[requestedPreset].region ?? "bay" : "bay";
if (
  query.get("region") === "southernCalifornia" ||
  query.get("view") === "cajon"
) {
  requestedRegion = "southernCalifornia";
} else if (
  query.get("region") === "pacificNorthwest" ||
  query.get("view") === "cascadia"
) {
  requestedRegion = "pacificNorthwest";
}
configureRegion(requestedRegion);
applyPreset(requestedPreset ?? defaultPresetForRegion(requestedRegion));
if (["1", "5", "20"].includes(query.get("speed"))) {
  elements.speed.value = query.get("speed");
}
if (query.get("mode") === "live") {
  elements.dashboardMode.value = "live";
}
updateClock();
window.setInterval(updateClock, 250);
resetTerminal();
updatePreview();
if (query.get("liquefaction") === "1") {
  setLiquefactionOverlay(true);
}
setPlaybackState("idle");
if (elements.dashboardMode.value === "live") {
  enterLiveMode();
} else if (query.get("autorun") === "1") {
  window.requestAnimationFrame(() => elements.form.requestSubmit());
}
