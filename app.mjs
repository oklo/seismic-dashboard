import { FEED_PROFILES, PRESETS, STATIONS, modelEarthquake } from "./simulator.mjs";

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
  map: document.querySelector("#network-map"),
  stationLayer: document.querySelector("#station-layer"),
  epicenterLayer: document.querySelector("#epicenter-layer"),
  rangeRings: document.querySelector("#range-rings"),
  networkState: document.querySelector("#network-state"),
  metricNetwork: document.querySelector("#metric-network"),
  metricWatch: document.querySelector("#metric-watch"),
  metricMajor: document.querySelector("#metric-major"),
  metricSourceAge: document.querySelector("#metric-source-age"),
  terminal: document.querySelector("#terminal-screen"),
  terminalSummary: document.querySelector("#terminal-summary"),
  relayStatus: document.querySelector("#relay-status"),
};

const MAP_BOUNDS = { latMin: 37.0, latMax: 38.5, lonMin: -123.0, lonMax: -121.2 };
const MAP_PADDING = 48;
const SVG_NS = "http://www.w3.org/2000/svg";
let timers = [];
let activeRun = 0;

function mapPoint(latitude, longitude) {
  const width = 720 - MAP_PADDING * 2;
  const height = 500 - MAP_PADDING * 2;
  return {
    x: MAP_PADDING + ((longitude - MAP_BOUNDS.lonMin) / (MAP_BOUNDS.lonMax - MAP_BOUNDS.lonMin)) * width,
    y: MAP_PADDING + ((MAP_BOUNDS.latMax - latitude) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * height,
  };
}

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
}

function drawNetwork() {
  elements.stationLayer.replaceChildren();
  STATIONS.forEach((station) => {
    const point = mapPoint(station.latitude, station.longitude);
    const group = svgElement("g", {
      class: "station-marker pending",
      transform: `translate(${point.x} ${point.y})`,
      "data-station": station.code,
      role: "img",
      "aria-label": `${station.id}, waiting`,
    });
    group.append(svgElement("circle", { r: 6 }));
    const label = svgElement("text", { x: 11, y: 4 });
    label.textContent = station.code;
    group.append(label);
    elements.stationLayer.append(group);
  });
  drawEpicenter(readInput());
}

function drawEpicenter(input, active = false) {
  const point = mapPoint(input.latitude, input.longitude);
  elements.epicenterLayer.replaceChildren();
  const group = svgElement("g", {
    transform: `translate(${point.x} ${point.y})`,
    role: "img",
    "aria-label": `Synthetic epicenter at ${input.latitude}, ${input.longitude}`,
  });
  group.append(svgElement("circle", { class: `epicenter-ring${active ? " active" : ""}`, r: 19 }));
  group.append(svgElement("line", { class: "epicenter-cross", x1: -9, y1: -9, x2: 9, y2: 9 }));
  group.append(svgElement("line", { class: "epicenter-cross", x1: 9, y1: -9, x2: -9, y2: 9 }));
  elements.epicenterLayer.append(group);
}

function animateRangeRings(input) {
  const point = mapPoint(input.latitude, input.longitude);
  elements.rangeRings.replaceChildren();
  [0, 350, 700].forEach((delay, index) => {
    const ring = svgElement("circle", {
      class: "range-ring active",
      cx: point.x,
      cy: point.y,
      r: 42 + index * 20,
      style: `animation-delay:${delay}ms`,
    });
    elements.rangeRings.append(ring);
  });
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

function clearTimers() {
  timers.forEach(window.clearTimeout);
  timers = [];
  activeRun += 1;
}

function schedule(callback, delayMs, runId) {
  timers.push(
    window.setTimeout(() => {
      if (runId === activeRun) callback();
    }, Math.max(0, delayMs)),
  );
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

function markStationTriggered(code) {
  const marker = elements.stationLayer.querySelector(`[data-station="${code}"]`);
  if (!marker) return;
  marker.classList.remove("pending");
  marker.classList.add("triggered");
  marker.setAttribute("aria-label", `${code}, trigger received`);
}

function resetTerminal() {
  elements.terminal.replaceChildren();
  terminalLine("BOOT", "BAY/CHI training relay 0.1", "muted");
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

function updatePreview() {
  const profile = FEED_PROFILES[elements.profile.value];
  elements.metricSourceAge.textContent = `${profile.sourceAgeS.toFixed(1)}s`;
  try {
    const result = modelEarthquake(readInput(), elements.profile.value);
    const watch = result.revisions[0];
    const major = result.revisions.find((revision) => revision.classification === "major_suspected");
    elements.metricWatch.textContent = watch ? formatSeconds(watch.detectedAfterOriginS) : "NONE";
    elements.metricMajor.textContent = major ? formatSeconds(major.detectedAfterOriginS) : "—";
    elements.metricNetwork.textContent = `${result.stationResults.filter((station) => station.triggered).length} / 8`;
    drawEpicenter(readInput());
    if (result.revisions.length) {
      elements.formNote.textContent = "Preview calculated. Strike to deliver modeled revisions.";
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
  clearTimers();
  resetTerminal();
  drawNetwork();

  const runId = activeRun;
  const input = readInput();
  const profileName = elements.profile.value;
  const speed = Number.parseFloat(elements.speed.value);
  const result = modelEarthquake(input, profileName);
  const originTime = new Date();
  const eventId = `bay-${originTime.getTime()}`;
  const playbackMsPerSecond = 1000 / speed;

  elements.strike.disabled = true;
  elements.networkState.innerHTML = "<i></i> Wavefront in motion";
  elements.relayStatus.className = "relay-status";
  elements.relayStatus.innerHTML = "<i></i> WAITING FOR ASSOCIATION";
  elements.terminalSummary.textContent = `Synthetic M${input.magnitude.toFixed(1)} origin in progress.`;
  drawEpicenter(input, true);
  animateRangeRings(input);
  terminalLine(
    "ORIGIN",
    `SYNTHETIC M${input.magnitude.toFixed(1)} · ${input.latitude.toFixed(3)}, ${input.longitude.toFixed(3)} · depth ${input.depthKm.toFixed(1)} km`,
    "",
    originTime,
  );
  terminalLine("PATH", `${result.profile.label} · modeled source age ${result.profile.sourceAgeS.toFixed(1)}s`);

  result.stationResults.forEach((station) => {
    if (!station.triggered) return;
    const delayMs = Math.max(80, station.arrivalAfterOriginS * playbackMsPerSecond);
    schedule(() => {
      markStationTriggered(station.code);
      terminalLine(
        "PICK",
        `${station.code} trigger · ${station.surfaceDistanceKm.toFixed(1)} km · modeled P arrival T+${station.arrivalAfterOriginS.toFixed(1)}s`,
        "muted",
      );
    }, delayMs, runId);
  });

  if (result.revisions.length === 0) {
    const lastTriggerS = Math.max(
      0,
      ...result.stationResults
        .filter((station) => station.triggered)
        .map((station) => station.arrivalAfterOriginS),
    );
    schedule(() => {
      const reason =
        result.outcome === "outside_association_grid"
          ? "origin outside Bay Area association grid"
          : "insufficient independent station diversity";
      terminalLine("CLOSED", `No alert: ${reason}.`, "danger");
      elements.networkState.innerHTML = "<i></i> No association";
      elements.relayStatus.className = "relay-status blocked";
      elements.relayStatus.innerHTML = "<i></i> NO DELIVERY";
      elements.terminalSummary.textContent = `Fail closed: ${reason}.`;
      elements.strike.disabled = false;
    }, Math.max(900, lastTriggerS * playbackMsPerSecond + 450), runId);
    return;
  }

  result.revisions.forEach((revision) => {
    const delayMs = revision.detectedAfterOriginS * playbackMsPerSecond;
    schedule(() => {
      const wireId = `${eventId}:${revision.revision}`;
      if (!revision.fresh) {
        terminalLine(
          "BLOCKED",
          `${wireId} · ${revision.classification.toUpperCase()} suppressed · source age ${revision.maxDataLatencyS.toFixed(1)}s > 15.0s`,
          "danger",
        );
        elements.relayStatus.className = "relay-status blocked";
        elements.relayStatus.innerHTML = "<i></i> FAIL CLOSED / STALE";
        elements.terminalSummary.textContent = "No trader alert delivered: freshness gate failed.";
        return;
      }

      terminalLine("RX", `${wireId} · signature verified · alert ID matched`, "success");
      alertCard(revision, eventId);
      terminalLine(
        "ACK",
        `${wireId} accepted · HTTP 204 · modeled ${Math.round(result.profile.acknowledgementS * 1000)}ms`,
        "success",
      );
      elements.relayStatus.className = "relay-status alerting";
      elements.relayStatus.innerHTML = "<i></i> AUTHENTICATED ALERT";
      elements.terminalSummary.textContent = `Latest: ${revision.classification.replaceAll("_", " ")} · revision ${revision.revision}.`;
    }, delayMs, runId);
  });

  const finishMs =
    500 + result.revisions.at(-1).detectedAfterOriginS * playbackMsPerSecond;
  schedule(() => {
    elements.strike.disabled = false;
    elements.networkState.innerHTML = "<i></i> Simulation complete";
  }, finishMs, runId);
}

function resetSimulation() {
  clearTimers();
  elements.strike.disabled = false;
  elements.relayStatus.className = "relay-status";
  elements.relayStatus.innerHTML = "<i></i> SIM RELAY READY";
  elements.networkState.innerHTML = "<i></i> Armed for simulation";
  elements.terminalSummary.textContent = "Waiting for a synthetic origin.";
  resetTerminal();
  drawNetwork();
  updatePreview();
}

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
elements.form.addEventListener("submit", runSimulation);
elements.reset.addEventListener("click", resetSimulation);

function updateClock() {
  elements.clock.textContent = `UTC ${clockText().slice(0, 8)}`;
}

updateClock();
window.setInterval(updateClock, 250);

drawNetwork();
updatePreview();
