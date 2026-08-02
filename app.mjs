import { CALIFORNIA_MAP_DATA } from "./california_map.mjs";
import {
  FEED_PROFILES,
  PRESETS,
  STATIONS,
  WAVE_MODEL,
  modelEarthquake,
  surfaceIntersectionRadiusKm,
} from "./simulator.mjs";

const SVG_NS = "http://www.w3.org/2000/svg";
const EARTH_RADIUS_KM = 6371.0088;
const BAY_BOUNDS = {
  latitudeMin: 36.95,
  latitudeMax: 38.55,
  longitudeMin: -123.05,
  longitudeMax: -121.15,
};

const elements = {
  form: document.querySelector("#quake-form"),
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
  themeToggle: document.querySelector("#theme-toggle"),
  themeLabel: document.querySelector("#theme-label"),
  californiaGeography: document.querySelector("#california-geography"),
  californiaStations: document.querySelector("#california-stations"),
  californiaEpicenter: document.querySelector("#california-epicenter"),
  californiaBayWindow: document.querySelector("#california-bay-window"),
  californiaPWave: document.querySelector("#california-p-wave"),
  californiaSWave: document.querySelector("#california-s-wave"),
  bayGeography: document.querySelector("#bay-geography"),
  stationLayer: document.querySelector("#station-layer"),
  epicenterLayer: document.querySelector("#epicenter-layer"),
  pWave: document.querySelector("#p-wavefront"),
  sWave: document.querySelector("#s-wavefront"),
  stationGrid: document.querySelector("#station-grid"),
  networkState: document.querySelector("#network-state"),
  simulationClock: document.querySelector("#simulation-clock"),
  simulationRate: document.querySelector("#simulation-rate"),
  pRadius: document.querySelector("#p-radius"),
  sRadius: document.querySelector("#s-radius"),
  metricNetwork: document.querySelector("#metric-network"),
  metricWatch: document.querySelector("#metric-watch"),
  metricMajor: document.querySelector("#metric-major"),
  metricSourceAge: document.querySelector("#metric-source-age"),
  terminal: document.querySelector("#terminal-screen"),
  terminalSummary: document.querySelector("#terminal-summary"),
  relayStatus: document.querySelector("#relay-status"),
};

let simulation = null;
let animationFrame = null;
let eventTimer = null;
let nextRunId = 0;

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

function drawBayWindow() {
  const northwest = projectPoint(
    CALIFORNIA_MAP_DATA.california,
    BAY_BOUNDS.latitudeMax,
    BAY_BOUNDS.longitudeMin,
  );
  const southeast = projectPoint(
    CALIFORNIA_MAP_DATA.california,
    BAY_BOUNDS.latitudeMin,
    BAY_BOUNDS.longitudeMax,
  );
  elements.californiaBayWindow.setAttribute("x", String(northwest.x));
  elements.californiaBayWindow.setAttribute("y", String(northwest.y));
  elements.californiaBayWindow.setAttribute("width", String(southeast.x - northwest.x));
  elements.californiaBayWindow.setAttribute("height", String(southeast.y - northwest.y));
}

function drawStaticMaps() {
  drawGeography(
    elements.californiaGeography,
    CALIFORNIA_MAP_DATA.california,
    "california",
  );
  drawGeography(elements.bayGeography, CALIFORNIA_MAP_DATA.bay, "bay");
  drawBayWindow();
}

function readInput() {
  return {
    magnitude: Number.parseFloat(elements.magnitude.value),
    depthKm: Number.parseFloat(elements.depth.value),
    latitude: Number.parseFloat(elements.latitude.value),
    longitude: Number.parseFloat(elements.longitude.value),
  };
}

function formatSeconds(seconds) {
  return Number.isFinite(seconds) ? `${seconds.toFixed(1)}s` : "—";
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
  elements.terminal.scrollTop = elements.terminal.scrollHeight;
}

function resetTerminal() {
  elements.terminal.replaceChildren();
  terminalLine("BOOT", "BAY/CHI training relay 0.2", "muted");
  terminalLine("SAFE", "synthetic input only · external delivery disabled", "muted");
  const prompt = document.createElement("div");
  prompt.className = "terminal-prompt";
  const promptText = document.createElement("span");
  promptText.textContent = "chi-alert~$";
  const cursor = document.createElement("b");
  cursor.className = "cursor";
  prompt.append(promptText, cursor);
  elements.terminal.append(prompt);
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

function drawEpicenters(input, active = false) {
  elements.epicenterLayer.replaceChildren(epicenterGroup(CALIFORNIA_MAP_DATA.bay, input));
  elements.californiaEpicenter.replaceChildren(
    epicenterGroup(CALIFORNIA_MAP_DATA.california, input, true),
  );
  document
    .querySelectorAll(".epicenter-ring")
    .forEach((ring) => ring.classList.toggle("active", active));
}

function markerGroup(station, map, overview = false) {
  const point = projectPoint(map, station.latitude, station.longitude);
  const group = svgElement("g", {
    class: `station-marker phase-wait${overview ? " overview" : ""}`,
    transform: `translate(${point.x} ${point.y})`,
    "data-station": station.code,
    role: "img",
    tabindex: overview ? -1 : 0,
    "aria-label": `${station.id}, waiting for wave arrival`,
  });
  group.append(svgElement("circle", { class: "station-halo", r: overview ? 4.5 : 11 }));
  group.append(svgElement("circle", { class: "station-core", r: overview ? 2.2 : 5.5 }));
  if (!overview) {
    const label = svgElement("text", { x: 10, y: -8 });
    label.textContent = station.code;
    const phase = svgElement("text", { class: "marker-phase", x: 10, y: 5 });
    phase.textContent = "WAIT";
    group.append(label, phase);
  }
  return group;
}

function stationCard(station, profile) {
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
  const state = document.createElement("b");
  state.className = "station-state";
  state.textContent = "WAIT";
  header.append(identity, state);

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
  const entries = [
    ["DIST", `${station.surfaceDistanceKm.toFixed(1)} km`, "distance"],
    [
      "P / S",
      `${station.arrivalAfterOriginS.toFixed(1)} / ${station.strongMotionAfterOriginS.toFixed(1)}s`,
      "arrivals",
    ],
    ["EST. PEAK", `${station.peakAccelerationG.toFixed(4)} g`, "peak"],
    ["SOURCE AGE", `${profile.sourceAgeS.toFixed(1)}s`, "source-age"],
  ];
  entries.forEach(([label, value, key]) => {
    const item = document.createElement("div");
    const term = document.createElement("span");
    term.textContent = label;
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

function drawStations(result) {
  elements.stationLayer.replaceChildren();
  elements.californiaStations.replaceChildren();
  elements.stationGrid.replaceChildren();
  result.stationResults.forEach((station) => {
    const bayMarker = markerGroup(station, CALIFORNIA_MAP_DATA.bay);
    const californiaMarker = markerGroup(station, CALIFORNIA_MAP_DATA.california, true);
    bindStationHighlight(bayMarker, station.code);
    elements.stationLayer.append(bayMarker);
    elements.californiaStations.append(californiaMarker);
    elements.stationGrid.append(stationCard(station, result.profile));
  });
}

function phaseAt(station, elapsedS) {
  if (elapsedS < station.arrivalAfterOriginS) return "wait";
  if (elapsedS < station.strongMotionAfterOriginS) return station.triggered ? "p-pick" : "p-wave";
  if (elapsedS < station.strongMotionAfterOriginS + WAVE_MODEL.shakingDurationS) {
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
      const envelope = Math.exp(-shakingTime / 4.5);
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
      ["wait", "p-pick", "p-wave", "shaking", "recorded", "below-gate"].forEach(
        (value) => node.classList.remove(`phase-${value}`),
      );
      node.classList.add(`phase-${phase}`);
      node.classList.toggle("associated", associatedStations.has(station.id));
      node.setAttribute("aria-label", `${station.id}, ${label.toLowerCase()}`);
      const state = node.querySelector(".station-state");
      if (state) state.textContent = associatedStations.has(station.id) ? "ASSOCIATED" : label;
      const markerPhase = node.querySelector(".marker-phase");
      if (markerPhase) markerPhase.textContent = label;
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
  const bayP = wavefrontPath(CALIFORNIA_MAP_DATA.bay, input, pRadius);
  const bayS = wavefrontPath(CALIFORNIA_MAP_DATA.bay, input, sRadius);
  const californiaP = wavefrontPath(CALIFORNIA_MAP_DATA.california, input, pRadius);
  const californiaS = wavefrontPath(CALIFORNIA_MAP_DATA.california, input, sRadius);
  elements.pWave.setAttribute("d", bayP);
  elements.sWave.setAttribute("d", bayS);
  elements.californiaPWave.setAttribute("d", californiaP);
  elements.californiaSWave.setAttribute("d", californiaS);
  elements.pRadius.textContent = `${pRadius.toFixed(0)} km`;
  elements.sRadius.textContent = `${sRadius.toFixed(0)} km`;
}

function clearWavefronts() {
  [elements.pWave, elements.sWave, elements.californiaPWave, elements.californiaSWave].forEach(
    (wave) => wave.setAttribute("d", ""),
  );
  elements.pRadius.textContent = "0 km";
  elements.sRadius.textContent = "0 km";
}

function alertCard(revision, eventId) {
  const card = document.createElement("article");
  const isMajor = revision.classification === "major_suspected";
  card.className = `alert-card${isMajor ? " major" : ""}`;

  const header = document.createElement("div");
  header.className = "alert-card-header";
  const title = document.createElement("strong");
  title.textContent = revision.classification.replaceAll("_", " ").toUpperCase();
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
  elements.terminal.scrollTop = elements.terminal.scrollHeight;
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
      elements.relayStatus.innerHTML = "<i></i> FAIL CLOSED / STALE";
      elements.terminalSummary.textContent = "No trader alert delivered: freshness gate failed.";
      return;
    }
    terminalLine("RX", `${wireId} · signature verified · alert ID matched`, "success", timestamp);
    alertCard(revision, state.eventId);
    elements.relayStatus.className = "relay-status alerting";
    elements.relayStatus.innerHTML = "<i></i> AUTHENTICATED ALERT";
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
      ? "origin outside Bay Area association grid"
      : "insufficient independent station diversity";
  terminalLine("CLOSED", `No alert: ${reason}.`, "danger", timestamp);
  elements.networkState.innerHTML = "<i></i> No association";
  elements.relayStatus.className = "relay-status blocked";
  elements.relayStatus.innerHTML = "<i></i> NO DELIVERY";
  elements.terminalSummary.textContent = `Fail closed: ${reason}.`;
}

function setFormLocked(locked) {
  elements.form.querySelectorAll("input, select").forEach((control) => {
    control.disabled = locked;
  });
  elements.strike.disabled = locked;
}

function simulationFinishTime(result, timeline) {
  const latestShaking = Math.max(
    ...result.stationResults.map(
      (station) => station.strongMotionAfterOriginS + WAVE_MODEL.shakingDurationS,
    ),
  );
  const latestEvent = timeline.length ? timeline.at(-1).at + 0.6 : 0;
  return Math.max(latestShaking, latestEvent);
}

function elapsedSimulationSeconds(state, now = performance.now()) {
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
  if (!simulation || simulation.runId !== runId) return;
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
  if (!simulation || simulation.runId !== runId) return;
  const state = simulation;
  const now = performance.now();
  const elapsedS = elapsedSimulationSeconds(state, now);
  state.elapsedS = elapsedS;
  elements.simulationClock.textContent = `T+${elapsedS.toFixed(1).padStart(4, "0")}s`;

  updateWavefronts(state.input, elapsedS);
  if (now - state.lastStationRenderMs >= 45) {
    updateStations(state.result, elapsedS, state.associatedStations);
    state.lastStationRenderMs = now;
  }

  if (elapsedS >= state.finishAtS) {
    setFormLocked(false);
    if (state.result.revisions.length) {
      elements.networkState.innerHTML = "<i></i> Simulation complete";
    }
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
}

function updatePreview() {
  const profile = FEED_PROFILES[elements.profile.value];
  elements.metricSourceAge.textContent = `${profile.sourceAgeS.toFixed(1)}s`;
  elements.simulationRate.textContent = `${elements.speed.value}× ${
    elements.speed.value === "1" ? "REAL TIME" : "REVIEW SPEED"
  }`;
  try {
    const input = readInput();
    const result = modelEarthquake(input, elements.profile.value);
    const watch = result.revisions[0];
    const major = result.revisions.find((revision) => revision.classification === "major_suspected");
    elements.metricWatch.textContent = watch ? formatSeconds(watch.detectedAfterOriginS) : "NONE";
    elements.metricMajor.textContent = major ? formatSeconds(major.detectedAfterOriginS) : "—";
    elements.metricNetwork.textContent = `${result.stationResults.filter((station) => station.triggered).length} / 8`;
    drawEpicenters(input);
    drawStations(result);
    updateStations(result, 0, new Set());
    clearWavefronts();
    elements.simulationClock.textContent = "T+00.0s";
    if (result.revisions.length) {
      elements.formNote.textContent = "Preview calculated. Strike to run from the origin clock.";
    } else if (result.outcome === "outside_association_grid") {
      elements.formNote.textContent = "This origin is outside the Bay Area association grid.";
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
  const speed = Number.parseFloat(elements.speed.value);
  const result = modelEarthquake(input, elements.profile.value);
  const originTime = new Date();
  const timeline = buildTimeline(result);
  const runId = nextRunId;
  simulation = {
    runId,
    input,
    speed,
    result,
    originTime,
    eventId: `bay-${originTime.getTime()}`,
    timeline,
    nextEventIndex: 0,
    associatedStations: new Set(),
    startedAtPerformanceMs: performance.now(),
    lastStationRenderMs: -Infinity,
    elapsedS: 0,
    finishAtS: simulationFinishTime(result, timeline),
  };

  setFormLocked(true);
  elements.networkState.innerHTML = "<i></i> Wavefront in motion";
  elements.relayStatus.className = "relay-status";
  elements.relayStatus.innerHTML = "<i></i> WAITING FOR ASSOCIATION";
  elements.terminalSummary.textContent = `Synthetic M${input.magnitude.toFixed(1)} origin in progress.`;
  elements.simulationRate.textContent = `${speed}× ${speed === 1 ? "REAL TIME" : "REVIEW SPEED"}`;
  drawEpicenters(input, true);
  drawStations(result);
  terminalLine(
    "ORIGIN",
    `SYNTHETIC M${input.magnitude.toFixed(1)} · ${input.latitude.toFixed(3)}, ${input.longitude.toFixed(3)} · depth ${input.depthKm.toFixed(1)} km`,
    "",
    originTime,
  );
  terminalLine(
    "MODEL",
    `P ${WAVE_MODEL.pVelocityKmS.toFixed(1)} km/s · S ${WAVE_MODEL.sVelocityKmS.toFixed(1)} km/s · hypocentral travel path`,
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
  elements.relayStatus.innerHTML = "<i></i> SIM RELAY READY";
  elements.networkState.innerHTML = "<i></i> Armed for simulation";
  elements.terminalSummary.textContent = "Waiting for a synthetic origin.";
  resetTerminal();
  updatePreview();
}

function setTheme(theme, persist = true) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === "dark";
  elements.themeToggle.setAttribute("aria-pressed", String(dark));
  elements.themeToggle.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} mode`);
  elements.themeLabel.textContent = dark ? "Light" : "Dark";
  if (persist) {
    try {
      localStorage.setItem("bay-chi-theme", theme);
    } catch (_) {
      // Storage can be disabled without affecting the simulator.
    }
  }
}

elements.themeToggle.addEventListener("click", () => {
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});
elements.preset.addEventListener("change", () => {
  const preset = PRESETS[elements.preset.value];
  if (preset) {
    elements.magnitude.value = preset.magnitude.toFixed(1);
    elements.depth.value = preset.depthKm.toFixed(1);
    elements.latitude.value = preset.latitude.toFixed(3);
    elements.longitude.value = preset.longitude.toFixed(3);
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
elements.form.addEventListener("submit", runSimulation);
elements.reset.addEventListener("click", resetSimulation);

function updateClock() {
  elements.clock.textContent = `UTC ${clockText().slice(0, 8)}`;
}

drawStaticMaps();
const query = new URLSearchParams(window.location.search);
const queryTheme = query.get("theme");
setTheme(
  queryTheme === "dark" || queryTheme === "light"
    ? queryTheme
    : document.documentElement.dataset.theme || "light",
  false,
);
if (["1", "5", "20"].includes(query.get("speed"))) {
  elements.speed.value = query.get("speed");
}
updateClock();
window.setInterval(updateClock, 250);
resetTerminal();
updatePreview();
if (query.get("autorun") === "1") {
  window.requestAnimationFrame(() => elements.form.requestSubmit());
}
