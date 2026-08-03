# Quake impact → market impact

A dependency-free browser simulator for exploring how a Bay Area earthquake can
move from professional strong-motion stations to an authenticated Chicago alert,
then into a preliminary population-weighted impact estimate.

**Live dashboard:** https://oklo.github.io/seismic-dashboard/

Choose a historical or scenario event, click or drag its epicenter on the map,
and press **Run simulation**. The dashboard includes:

- A light laptop-demo layout with a fixed-height, independently scrolling
  code-style output pane, central Bay map, and a narrow simulation/station rail.
- 1989 Loma Prieta, 1906 San Francisco, 1868 Hayward, and 2014 South Napa presets.
- A landscape Bay Area map that fills its panel, with gray 2020 Census population
  dots that light by local MMI as the S-wave reaches them, named USGS Quaternary
  fault traces, and a California locator inset in the Pacific.
- Eight professional BK station locations with physical site names, local PGA,
  P/S arrivals, phase, compact waveform traces, and MMI that mounts during
  shaking before holding the final modeled site value.
- Depth-aware P- and S-wave surface intersections driven by one monotonic clock;
  playback defaults to real time and does not drift after dropped rendering frames.
  Pause/resume freezes event order and accumulated shaking, then shifts the clock
  origin so playback continues from the same instant.
- Population at modeled MMI VI or higher, an initial population × intensity
  impact index, and a conditional expected percent change for the CME near-month
  E-mini S&P 500 future (ES).

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
During playback, population exposure and impact accumulate only as the modeled
S-wave reaches each Census cell; the final values equal the full scenario estimate.

The ES estimate is a conservative downstream scenario proxy, not an observed
quote or a validated trading forecast. For impact index `I`, it uses
`x = max(0, (I - 2) / (23 - 2))` and
`expected ES change = -min(3%, 0.25 x^1.4 + 0.20 sqrt(x))`. The impact-index
noise floor reflects [event-study evidence](https://doi.org/10.1016/j.ijdrr.2022.102993)
that the 1989 Loma Prieta and 1994 Northridge earthquakes had no detectable
whole-market effect. The `I = 23` benchmark is the dashboard's
Hayward/HayWired-scale case and produces a central estimate of `-0.45%`; the
[USGS HayWired economic study](https://www.usgs.gov/publications/economic-consequences-haywired-earthquake-scenario)
estimates $44.2 billion of gross regional product losses in the six months after
its M7.0 scenario before resilience tactics. CME identifies ES as its nearly
around-the-clock, broad U.S. equity-index future in the
[official contract overview](https://www.cmegroup.com/markets/equities/sp/e-mini-sandp500.contract.html).

The estimate is conditional on the modeled earthquake. It does not incorporate
the detector's uncalibrated confidence as a probability, current market
volatility or liquidity, time of day, futures basis, exchange pauses, policy
response, or company/facility-level exposure. Those omissions make it
explanatory only; it must not drive an order.

## Map and event provenance

The checked-in map module is generated at build time from:

- U.S. Census Bureau TIGERweb 2020 Census populated-block internal points and
  `POP100` counts, aggregated into 1.5 SVG-pixel cells without changing the
  represented population total across the expanded Bay/coastal extent.
- Census Bureau January 1, 2024 generalized state and county boundaries.
- The USGS [Quaternary Fault and Fold Database](https://doi.org/10.5066/P9BCVRCK)
  for the San Andreas, San Gregorio, Hayward, Calaveras, Rodgers Creek, Concord,
  Green Valley, West Napa, and Greenville traces.

The 1989 and 1906 presets use USGS reviewed origins. The 1868 Hayward magnitude
is an historical estimate; its map location and depth are explicit scenario
proxies because the earthquake predates instrumental recording.

The eight displayed station streams mirror the validated BK detector profile;
they are not a complete Bay Area sensor inventory. A 2026-08-02 DART probe also
found actively updating 100 Hz vertical accelerometer files for `NC.JPR..HNZ` in
San Francisco and `NC.NBO..HNZ`, `BK.BUCI.00.HNZ`, and `BK.MCCM.00.HNZ` in Marin.
They should join the detector only after sensitivity, gap, and continuous-latency
validation so its timing baseline is not changed silently.

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
