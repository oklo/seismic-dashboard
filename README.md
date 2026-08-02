# Bay / Chi earthquake alert simulator

A browser-only training simulator for the Economic Seismology Bay Area-to-Chicago
alert path.

Choose a synthetic earthquake and data-source profile, press **Strike**, and watch
modeled station triggers become authenticated `watch` and `major_suspected`
revisions in a simple Chicago trader terminal.

**Live dashboard:** https://oklo.github.io/seismic-dashboard/

## Safety boundary

This site uses no live waveform data, makes no network requests, sends no alerts,
and contains no trading or order-entry logic. Its station-arrival and ground-motion
calculations are illustrative and are not a validated magnitude or ground-motion
model. Do not use it for live trading or public-safety decisions.

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
