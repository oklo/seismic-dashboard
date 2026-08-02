# Bay / Chi earthquake alert simulator

A browser-only training simulator for the Economic Seismology Bay Area-to-Chicago
alert path.

Choose a synthetic earthquake and data-source profile, press **Strike**, and watch
modeled station triggers become authenticated `watch` and `major_suspected`
revisions in a simple Chicago trader terminal.

The current dashboard includes:

- Light mode by default with a persistent dark-mode toggle.
- A compact laptop-demo layout with the dark Chicago terminal directly beneath
  the event controls.
- A local vector map of California and all 58 counties, with a detailed Bay inset.
- A pointer-following Census detail lens that reveals stronger county boundaries
  and labels without obscuring station or wavefront telemetry.
- Depth-aware geodesic P- and S-wave surface intersections driven from one
  monotonic simulation clock.
- Real-time playback by default, with accelerated review modes.
- Per-station distance, P/S arrival, estimated peak acceleration, source age,
  waveform trace, phase and association state.
- Alert scheduling independent from visual rendering, so dropped animation frames
  do not change modeled delivery times.

**Live dashboard:** https://oklo.github.io/seismic-dashboard/

## Safety boundary

This site uses no live waveform data, makes no network requests, sends no alerts,
and contains no trading or order-entry logic. Its station-arrival and ground-motion
calculations are illustrative and are not a validated magnitude or ground-motion
model. Do not use it for live trading or public-safety decisions.

The map is generated at build time from the U.S. Census Bureau's generalized
January 1, 2024 TIGERweb state and county boundaries. The live dashboard does not
contact a map service.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://127.0.0.1:8000/.

The site is dependency-free HTML, CSS, and JavaScript. Model checks can be run
with:

```bash
node --test dashboard_model.test.mjs
```

Rebuild the checked-in vector map with:

```bash
python3 scripts/build_dashboard_map.py --output california_map.mjs
```
