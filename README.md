# Quake impact → market impact

A dependency-free browser simulator for exploring how a Bay Area earthquake can
move from professional strong-motion stations to an authenticated Chicago alert,
then into a preliminary population-weighted impact estimate.

**Live dashboard:** https://oklo.github.io/seismic-dashboard/

Choose a historical or scenario event, click or drag its epicenter on the map,
and press **Run simulation**. The dashboard includes:

- A compact laptop-demo layout with a dark terminal above the event controls.
- Light mode by default with a persistent dark-mode toggle.
- 1989 Loma Prieta, 1906 San Francisco, 1868 Hayward, and 2014 South Napa presets.
- A tall Bay Area map with accumulated 2020 Census population lights, named USGS
  Quaternary fault traces, dense modeled MMI cells, and MMI-colored population.
- Eight professional BK station locations with local MMI/PGA estimates, P/S
  arrivals, phase, association state, and stacked waveform traces.
- Depth-aware P- and S-wave surface intersections driven by one monotonic clock;
  playback defaults to real time and does not drift after dropped rendering frames.
- Population at modeled MMI VI or higher and an initial population × intensity
  impact index.

## Scope and physical limits

The site uses no live waveform data, makes no network requests, sends no alerts,
and has no order-entry logic. It is a simulator, not a public-safety product or a
validated market-impact model.

The faint P/S rings are homogeneous travel-time guides, not shaking contours.
The current MMI field is a low-latency point-source attenuation proxy; it does not
yet include finite-fault rupture, directivity, 3-D velocity-structure focusing,
basin response, Bay mud, Vs30, or topographic effects. Those effects are important
in the Bay Area and must be added before interpreting the map as a detailed
ground-motion forecast.

PGA is converted to MMI using the California coefficients from Worden et al.
(2012), as implemented by
[USGS ShakeLib](https://usgs.github.io/shakelib/_modules/shakelib/gmice/wgrw12.html).
The current impact index is:

```text
100 × Σ(population × max(MMI - 3, 0)²) / (total population × 49)
```

It remains separate from the station detection and alert-classification model.

## Map and event provenance

The checked-in map module is generated at build time from:

- U.S. Census Bureau TIGERweb 2020 Census populated-block internal points and
  `POP100` counts, aggregated into 1.5 SVG-pixel cells without changing the
  represented population total.
- Census Bureau January 1, 2024 generalized state and county boundaries.
- The USGS [Quaternary Fault and Fold Database](https://doi.org/10.5066/P9BCVRCK)
  for the San Andreas, San Gregorio, Hayward, Calaveras, Rodgers Creek, Concord,
  Green Valley, West Napa, and Greenville traces.

The 1989 and 1906 presets use USGS reviewed origins. The 1868 Hayward magnitude
is an historical estimate; its map location and depth are explicit scenario
proxies because the earthquake predates instrumental recording.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://127.0.0.1:8000/.

Run the model checks with:

```bash
node --test dashboard_model.test.mjs
```

Rebuild the checked-in map with:

```bash
python3 scripts/build_dashboard_map.py --output california_map.mjs
```
