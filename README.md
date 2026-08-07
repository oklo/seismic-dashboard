# Quake impact → market impact

A dependency-free browser simulator for exploring how a major U.S. earthquake
can move from professional strong-motion stations to an authenticated Chicago
alert, then into a preliminary population-weighted impact estimate.

**Live dashboard:** https://oklo.github.io/seismic-dashboard/

The simulator defaults to the 1906 San Francisco M7.9 event. Choose the
**SoCal · Cajon** dashboard view for the M7.8 gate-open proxy, or the
**PNW · Cascadia** view for a 1700-style M9 scenario, or **Central · New Madrid**
for the official USGS BSSC2014 M7.5 planning scenario. Open the
[Cajon](https://oklo.github.io/seismic-dashboard/?view=cajon) or
[Cascadia](https://oklo.github.io/seismic-dashboard/?view=cascadia) view directly,
or go straight to [New Madrid](https://oklo.github.io/seismic-dashboard/?view=new-madrid).
Choose another historical or scenario event, click or drag its epicenter on the
map, and press **Run simulation**. The dashboard includes:

- A light laptop-demo layout with a fixed-height, independently scrolling
  code-style output pane, central regional map, and a narrow simulation/station rail.
- Historical Bay Area presets, a Southern California M7.8 finite-rupture
  scenario, a 1700-style M9 Cascadia scenario with the official USGS median M9
  ensemble ShakeMap, and a USGS M7.5 New Madrid planning scenario.
- Event-specific Bay ground motion for the 1906 San Francisco, 1989 Loma Prieta,
  and 2014 South Napa earthquakes from preferred USGS ShakeMap Atlas fields,
  plus the USGS HayWired M7.05 planning-scenario ShakeMap. Unsupported Bay and
  custom events are visibly labeled as attenuation fallbacks.
- A toggleable Bay liquefaction layer combining detailed USGS five-class
  susceptibility mapping with local PGA and magnitude through the FEMA Hazus
  6.1 conditional-probability equations. Liquefaction exposure remains separate
  from the shaking impact index and ES estimate.
- Landscape Bay Area, Southern California, Pacific Northwest, and central-U.S.
  maps with 2020 Census population cells that light by local MMI as strong
  motion reaches them, sourced fault/rupture geometry, and a regional locator.
- Eight professional BK, CI, UW/UO, or NM station locations with physical site names, local PGA,
  P/S arrivals, phase, compact waveform traces, and MMI that mounts during
  shaking before holding the final modeled site value.
- Depth-aware P- and S-wave surface intersections driven by one monotonic clock;
  playback defaults to real time and does not drift after dropped rendering frames.
  Pause/resume freezes event order and accumulated shaking, then shifts the clock
  origin so playback continues from the same instant.
- Population at modeled MMI VI or higher, an initial population × intensity
  impact index, and a conditional expected percent change for the CME near-month
  E-mini S&P 500 future (ES).
- An explicit **Live NCEDC shadow** display that can consume read-only waveform
  snippets and health data from the full system's local same-origin bridge.

## Scope and physical limits

Default scenario mode uses no live waveform data and makes no runtime network
requests. Selecting **Live NCEDC shadow** polls relative `api/live`; the static
GitHub Pages deployment has no collector backend and therefore reports the bridge
as unavailable. The bridge is supplied only by the full repository's loopback
dashboard command. Neither mode sends alerts or has order-entry logic. This is a
research/shadow prototype, not a public-safety product or a validated market-
impact model.

The faint P/S rings are homogeneous travel-time guides, not shaking contours.
Supported Bay presets use checked-in USGS ShakeMap MMI, PGA, and PGV fields. The
1868 Hayward reconstruction, generic city scenarios, and custom placement use a
visibly labeled low-latency point-source attenuation fallback. The Cajon view uses
distance to a progressively activated 261 km rupture polyline with an assumed
2.8 km/s rupture velocity. It still omits true slip distribution, directivity
amplitudes, 3-D velocity-structure focusing, basin response, Vs30, and topographic
effects. Cascadia uses the USGS ensemble field for final MMI/PGA and a separate
1,009 km bilateral line for arrival timing. Its animated hypocenter, rupture
timing, and five-minute site duration are dashboard assumptions, not a
reconstruction of the 1700 rupture. Tsunami generation and inundation are not
modeled. New Madrid uses the USGS scenario field for MMI/PGA/PGV and a centerline
derived from its finite-rupture polygon; assumed 2.8 km/s bilateral activation
controls timing only. The view does not invent a surface trace for the deeply
buried source or infer liquefaction without a susceptibility/groundwater model.

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

- U.S. Census Bureau TIGERweb 2020 Census populated-block internal points for
  the California views and tract internal points for the larger Pacific
  Northwest and New Madrid views. All represented population is U.S.-only.
- Census Bureau January 1, 2024 generalized state and county boundaries, plus a
  state-only contiguous-U.S. locator for New Madrid.
- The USGS [Quaternary Fault and Fold Database](https://doi.org/10.5066/P9BCVRCK)
  for the Bay fault set and Southern California's San Andreas, San Jacinto,
  Elsinore, Sierra Madre, Garlock, and related traces, plus the Cascadia
  megathrust and selected Pacific Northwest crustal faults.
- The USGS [median M9 Cascadia ensemble ShakeMap](https://earthquake.usgs.gov/scenarios/catalog/cszm9/),
  downsampled at build time while preserving its MMI and PGA values.
- The USGS [BSSC2014 M7.5 New Madrid central-fault scenario](https://earthquake.usgs.gov/scenarios/eventpage/bssc2014newmadrid_32_m7p5_se/shakemap),
  cropped and downsampled at build time while retaining MMI, PGA, and PGV, plus
  its published finite-rupture geometry.
- USGS ShakeMap Atlas grids for [1906 San Francisco](https://earthquake.usgs.gov/earthquakes/eventpage/official19060418131226300_12/shakemap),
  [1989 Loma Prieta](https://earthquake.usgs.gov/earthquakes/eventpage/nc216859/shakemap),
  and [2014 South Napa](https://earthquake.usgs.gov/earthquakes/eventpage/nc72282711/shakemap),
  plus the [HayWired scenario ShakeMap](https://www.usgs.gov/media/images/haywired-scenario-shakemap).
- The USGS [nine-county liquefaction susceptibility database](https://pubs.usgs.gov/of/2000/of00-444/),
  its [detailed 2006 central-Bay update](https://pubs.usgs.gov/of/2006/1037/),
  and the [FEMA Hazus 6.1 Earthquake Model](https://www.fema.gov/sites/default/files/documents/fema_hazus-earthquake-model-technical-manual-6-1.pdf).

The 1989 and 1906 presets use USGS reviewed origins. The 1868 Hayward magnitude
is an historical estimate; its map location and depth are explicit scenario
proxies because the earthquake predates instrumental recording.

### Bay ShakeMap and liquefaction boundary

The 1906, Loma Prieta, and South Napa presets use the preferred USGS ShakeMap
Atlas grid associated with each event. These are final spatial reconstructions,
not direct observations at every map cell. The HayWired preset is a planning
scenario, not a forecast or the historical 1868 rupture. The dashboard never
silently stretches one of these fields to a different magnitude, origin, or
custom map placement; unsupported inputs retain the attenuation fallback and say
so in both the map strip and terminal.

The toggleable liquefaction overlay combines each event's local ShakeMap PGA with
the mapped `Very Low` through `Very High` susceptibility class and magnitude
correction in FEMA Hazus 6.1. It assumes a uniform five-foot groundwater depth
because the checked-in regional source does not supply a scenario-specific water
table. The resulting percentage is Hazus's estimated areal fraction of a map unit
that liquefies—not a site-specific failure probability, observed ground failure,
or probability that every resident or structure in the cell is damaged.

The `Liquefaction ≥ 5%` metric counts Census residents whose population-cell
point falls in a modeled cell at or above that threshold. It does not model
lateral spreading, settlement, deformation, building or pipeline fragility,
losses, casualties, or groundwater uncertainty. Liquefaction exposure is shown
as a separate hazard and does not alter detector confidence, shaking impact
index, or ES estimate.

### Cajon gate evidence boundary

[Burkhard et al. (2026)](https://doi.org/10.1029/2025JB033213) modeled 1,000
years of stress accumulation and found that Cajon Pass may conditionally allow
ruptures to connect the San Andreas and San Jacinto systems. The modeled stresses
are not direct subsurface measurements, and the study does not predict when an
earthquake will happen.

The M7.8 scale and widely quoted impact figures come from the separate 2008
[USGS ShakeOut Scenario](https://www.usgs.gov/publications/shakeout-scenario).
The dashboard does not reproduce ShakeOut's rupture, casualty, or loss models; it
labels the new view as a hybrid scenario proxy. Its eight current CI HNZ sites
come from EarthScope FDSN metadata and are display-only—not a validated live feed.

### Cascadia evidence and model boundary

[USGS dates the last great Cascadia earthquake](https://pubs.usgs.gov/publication/fs20253050)
to the evening of January 26, 1700 and estimates its magnitude between M8.7 and
M9.2. [NOAA describes](https://sos.noaa.gov/catalog/datasets/tsunami-historical-series-cascadia-1700/)
a roughly 1,000 km full-margin rupture from northern California to Vancouver
Island, with severe shaking lasting five minutes or longer and a Pacific-wide
tsunami. The dashboard uses M9.0 as a representative value in that historical
range.

Final ground motion comes from the USGS median ensemble of thirty M9 Cascadia
scenarios—the catalog's recommended general-use field—not from the dashboard's
attenuation proxy. The ensemble varies hypocenter, slip, down-dip extent, and
high-stress subevents, so it is a planning model rather than a unique inversion
of the 1700 earthquake.

The animation adds a 1,009 km line, a central-Oregon offshore hypocenter, 15 km
depth, bilateral propagation at 2.8 km/s, and 300 seconds of local shaking as
explicit visualization assumptions. It does not model tsunami generation,
arrival, run-up, inundation, coseismic subsidence, Canadian population, building
losses, casualties, or lifeline failure. The population exposure, impact index,
and ES estimate are dashboard outputs, not USGS or NOAA scenario results.

The eight Pacific Northwest sites (`UW.BROK`, `UW.COOS`, `UO.DEPO`, `UO.PF09`,
`UO.ASTOR`, `UW.ALKI`, `UW.HOHM`, and `UW.EDSN`) were selected from current
EarthScope FDSN metadata on 2026-08-05 as 200 Hz vertical accelerometer channels.
They are display-only and have not passed source-availability, response, gap,
latency, replay, or detector-threshold validation.

### New Madrid evidence and model boundary

The New Madrid view uses the USGS BSSC2014 M7.5 central-fault scenario at
36.455°N, 89.622°W and 15.6 km depth. It is a predictive planning ShakeMap with
median ground motions, not an observed event or a reconstruction of any one of
the three major 1811–1812 earthquakes. The checked-in crop spans MMI 3.1–8.71
and retains the source product's PGA and PGV fields.

The rupture line is the centerline of the USGS finite-rupture polygon. Bilateral
activation at 2.8 km/s is used only to animate timing and does not modify the
ShakeMap amplitude. The 45-second local shaking duration is an explicit upper-end
dashboard assumption informed by the USGS [M7.7 central-U.S. simulation](https://earthquake.usgs.gov/scenarios/related/nmszM7.7.php),
which found roughly 30–45 seconds of long-period shaking in some cities. It is not
a duration field from the BSSC2014 product.

USGS explains that New Madrid earthquake-producing faults are difficult to see
because river sediments deeply bury them. The dashboard therefore does not draw
an invented surface-fault trace; it shows only the scenario rupture. Although
the 1811–1812 sequence produced widespread liquefaction, this view has no checked-
in regional susceptibility and groundwater model. Its liquefaction metric says
`not modeled`, and liquefaction does not enter impact or ES output.

The eight stations (`NM.UALR`, `NM.CBHS`, `NM.PENM`, `NM.CGM3`, `NM.SIUC`,
`NM.SLM`, `NM.EVIN`, and `NM.CLTN`) were selected from current EarthScope FDSN
metadata on 2026-08-06 as professional vertical accelerometer channels. They are
display-only and have not passed live-availability, response, gap, latency,
replay, association, or detector-threshold validation.

The eight Bay station streams mirror the validated BK detector profile; they are
not a complete Bay Area sensor inventory. A 2026-08-02 DART probe also
found actively updating 100 Hz vertical accelerometer files for `NC.JPR..HNZ` in
San Francisco and `NC.NBO..HNZ`, `BK.BUCI.00.HNZ`, and `BK.MCCM.00.HNZ` in Marin.
They should join the detector only after sensitivity, gap, and continuous-latency
validation so its timing baseline is not changed silently.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://127.0.0.1:8000/. Add `?view=cajon`, `?view=cascadia`, or
`?view=new-madrid` for a direct regional view.

To exercise the actual read-only NCEDC shadow view, use the
[full seismic repository](https://github.com/oklo/seismic) with its live
dependencies, run `uv run seismic dashboard --config config/bay_area.toml`, and
open http://127.0.0.1:8000/?mode=live. The bridge binds to loopback by default and
does not invoke alert delivery.

Run the model checks with:

```bash
node --test dashboard_model.test.mjs
```

Rebuild the checked-in map with:

```bash
python3 scripts/build_dashboard_map.py --output california_map.mjs
```
