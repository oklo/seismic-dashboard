"""Build the static Census population and USGS fault layers for the dashboard."""

from __future__ import annotations

import argparse
import json
import math
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path
from typing import Any

BOUNDARY_SERVICE = (
    "https://tigerweb.geo.census.gov/arcgis/rest/services/"
    "Generalized_ACS2024/State_County/MapServer"
)
STATE_URL = f"{BOUNDARY_SERVICE}/7/query"
COUNTY_URL = f"{BOUNDARY_SERVICE}/11/query"
BLOCK_URL = (
    "https://tigerweb.geo.census.gov/arcgis/rest/services/"
    "TIGERweb/Tracts_Blocks/MapServer/12/query"
)
TRACT_URL = (
    "https://tigerweb.geo.census.gov/arcgis/rest/services/"
    "TIGERweb/Tracts_Blocks/MapServer/10/query"
)
FAULT_URL = (
    "https://services2.arcgis.com/OCysFFatYM3MITwS/arcgis/rest/services/"
    "Quaternary_Faults/FeatureServer/0/query"
)
SOURCE_LABEL = (
    "U.S. Census Bureau TIGERweb 2020 population and 2024 generalized boundaries; "
    "USGS Quaternary Fault and Fold Database"
)
CALIFORNIA_BOUNDS = (-124.65, 32.3, -114.0, 42.1)
WEST_COAST_BOUNDS = (-125.1, 32.3, -116.5, 49.3)
BAY_BOUNDS = (-123.95, 36.95, -121.45, 38.55)
SOUTHERN_CALIFORNIA_BOUNDS = (-119.4, 32.7, -115.3, 35.1)
PACIFIC_NORTHWEST_BOUNDS = (-127.25, 40.0, -117.5, 49.3)
CALIFORNIA_STATE_WHERE = "STATE='06'"
WEST_COAST_STATE_WHERE = "STATE IN ('06','41','53')"
USGS_CASCADIA_MEDIAN_GRID_URL = (
    "https://earthquake.usgs.gov/product/shakemap-scenario/"
    "_median_se/us/1605643892799/download/grid.xml"
)
BAY_FAULT_NAMES = (
    "San Andreas fault zone",
    "San Gregorio fault zone",
    "Hayward fault zone",
    "Calaveras fault zone",
    "Rodgers Creek fault",
    "Concord fault",
    "Green Valley fault",
    "West Napa fault",
    "Greenville fault zone",
)
SOUTHERN_CALIFORNIA_FAULT_NAMES = (
    "San Andreas fault zone",
    "San Jacinto fault",
    "Elsinore fault zone",
    "Newport-Inglewood fault zone",
    "Sierra Madre fault zone",
    "Garlock fault zone",
)
PACIFIC_NORTHWEST_FAULT_NAMES = (
    "Cascadia megathrust",
    "Little Salmon fault zone",
    "Mad River fault zone",
    "Gales Creek fault zone",
    "Portland Hills fault",
    "Seattle fault zone",
    "Tacoma fault",
    "southern Whidbey Island fault zone",
    "Darrington-Devils Mountain fault",
)


@dataclass(frozen=True, slots=True)
class Projection:
    width: int
    height: int
    longitude_min: float
    latitude_max: float
    x_offset: float
    y_offset: float
    x_scale: float
    y_scale: float

    def point(self, longitude: float, latitude: float) -> tuple[float, float]:
        return (
            self.x_offset + (longitude - self.longitude_min) * self.x_scale,
            self.y_offset + (self.latitude_max - latitude) * self.y_scale,
        )

    def to_dict(self) -> dict[str, float | int]:
        return {
            "width": self.width,
            "height": self.height,
            "longitudeMin": self.longitude_min,
            "latitudeMax": self.latitude_max,
            "xOffset": round(self.x_offset, 6),
            "yOffset": round(self.y_offset, 6),
            "xScale": round(self.x_scale, 6),
            "yScale": round(self.y_scale, 6),
        }


def _projection(
    bounds: tuple[float, float, float, float],
    width: int,
    height: int,
    padding: float,
) -> Projection:
    longitude_min, latitude_min, longitude_max, latitude_max = bounds
    middle_latitude_radians = math.radians((latitude_min + latitude_max) / 2)
    longitude_km = (longitude_max - longitude_min) * 111.32 * math.cos(
        middle_latitude_radians
    )
    latitude_km = (latitude_max - latitude_min) * 111.32
    pixels_per_km = min(
        (width - 2 * padding) / longitude_km,
        (height - 2 * padding) / latitude_km,
    )
    rendered_width = longitude_km * pixels_per_km
    rendered_height = latitude_km * pixels_per_km
    return Projection(
        width=width,
        height=height,
        longitude_min=longitude_min,
        latitude_max=latitude_max,
        x_offset=(width - rendered_width) / 2,
        y_offset=(height - rendered_height) / 2,
        x_scale=111.32 * math.cos(middle_latitude_radians) * pixels_per_km,
        y_scale=111.32 * pixels_per_km,
    )


def _query(
    url: str,
    fields: str,
    *,
    where: str = "STATE='06'",
    bounds: tuple[float, float, float, float] | None = None,
    return_geometry: bool = True,
    page_size: int = 100_000,
) -> dict[str, Any]:
    features: list[dict[str, Any]] = []
    offset = 0
    while True:
        parameters: dict[str, str | int] = {
            "where": where,
            "outFields": fields,
            "returnGeometry": str(return_geometry).lower(),
            "outSR": "4326",
            "orderByFields": "OBJECTID",
            "resultOffset": offset,
            "resultRecordCount": page_size,
            "f": "geojson",
        }
        if bounds is not None:
            parameters.update(
                {
                    "geometry": ",".join(str(value) for value in bounds),
                    "geometryType": "esriGeometryEnvelope",
                    "spatialRel": "esriSpatialRelIntersects",
                    "inSR": "4326",
                }
            )
        query = urllib.parse.urlencode(parameters)
        request = urllib.request.Request(
            f"{url}?{query}",
            headers={"User-Agent": "economic-seismology-map-builder/1.0"},
        )
        with urllib.request.urlopen(request, timeout=120) as response:
            data = json.load(response)
        if "error" in data:
            raise RuntimeError(f"map service query failed: {data['error']}")
        page = data.get("features", [])
        features.extend(page)
        exceeded = data.get("properties", {}).get("exceededTransferLimit", False)
        if not exceeded or not page:
            return {"type": "FeatureCollection", "features": features}
        offset += len(page)


def _perpendicular_distance(
    point: list[float], start: list[float], end: list[float]
) -> float:
    delta_x = end[0] - start[0]
    delta_y = end[1] - start[1]
    if delta_x == 0 and delta_y == 0:
        return math.hypot(point[0] - start[0], point[1] - start[1])
    numerator = abs(
        delta_y * point[0] - delta_x * point[1] + end[0] * start[1] - end[1] * start[0]
    )
    return numerator / math.hypot(delta_x, delta_y)


def _simplify(points: list[list[float]], tolerance: float) -> list[list[float]]:
    if len(points) <= 3:
        return points
    maximum_distance = 0.0
    split_index = 0
    for index, point in enumerate(points[1:-1], start=1):
        distance = _perpendicular_distance(point, points[0], points[-1])
        if distance > maximum_distance:
            maximum_distance = distance
            split_index = index
    if maximum_distance <= tolerance:
        return [points[0], points[-1]]
    first = _simplify(points[: split_index + 1], tolerance)
    second = _simplify(points[split_index:], tolerance)
    return first[:-1] + second


def _rings(geometry: dict[str, Any]) -> list[list[list[float]]]:
    coordinates = geometry["coordinates"]
    if geometry["type"] == "Polygon":
        return coordinates
    if geometry["type"] == "MultiPolygon":
        return [ring for polygon in coordinates for ring in polygon]
    raise ValueError(f"unsupported geometry type {geometry['type']}")


def _path(geometry: dict[str, Any], projection: Projection, tolerance: float) -> str:
    commands: list[str] = []
    for ring in _rings(geometry):
        open_ring = ring[:-1] if ring[0] == ring[-1] else ring
        simplified = _simplify(open_ring, tolerance)
        if len(simplified) < 3:
            continue
        points = [projection.point(longitude, latitude) for longitude, latitude in simplified]
        commands.append(
            "M"
            + "L".join(f"{x:.2f},{y:.2f}" for x, y in points)
            + "Z"
        )
    return "".join(commands)


def _lines(geometry: dict[str, Any]) -> list[list[list[float]]]:
    coordinates = geometry["coordinates"]
    if geometry["type"] == "LineString":
        return [coordinates]
    if geometry["type"] == "MultiLineString":
        return coordinates
    raise ValueError(f"unsupported line geometry type {geometry['type']}")


def _line_path(geometry: dict[str, Any], projection: Projection) -> str:
    commands: list[str] = []
    for line in _lines(geometry):
        simplified = _simplify(line, 0.0002)
        if len(simplified) < 2:
            continue
        points = [projection.point(longitude, latitude) for longitude, latitude in simplified]
        commands.append("M" + "L".join(f"{x:.2f},{y:.2f}" for x, y in points))
    return "".join(commands)


def _geometry_bounds(geometry: dict[str, Any]) -> tuple[float, float, float, float]:
    points = [point for ring in _rings(geometry) for point in ring]
    longitudes = [point[0] for point in points]
    latitudes = [point[1] for point in points]
    return min(longitudes), min(latitudes), max(longitudes), max(latitudes)


def _intersects(
    bounds_a: tuple[float, float, float, float],
    bounds_b: tuple[float, float, float, float],
) -> bool:
    return not (
        bounds_a[2] < bounds_b[0]
        or bounds_a[0] > bounds_b[2]
        or bounds_a[3] < bounds_b[1]
        or bounds_a[1] > bounds_b[3]
    )


def _map_data(
    states: list[dict[str, Any]],
    counties: list[dict[str, Any]],
    projection: Projection,
    bounds: tuple[float, float, float, float],
    tolerance: float,
) -> dict[str, Any]:
    included_counties = []
    for feature in sorted(counties, key=lambda item: item["properties"]["GEOID"]):
        geometry = feature["geometry"]
        if not _intersects(_geometry_bounds(geometry), bounds):
            continue
        properties = feature["properties"]
        included_counties.append(
            {
                "geoid": properties["GEOID"],
                "name": properties["NAME"],
                "center": {
                    "latitude": float(properties["CENTLAT"]),
                    "longitude": float(properties["CENTLON"]),
                },
                "path": _path(geometry, projection, tolerance),
            }
        )
    return {
        "projection": projection.to_dict(),
        "statePath": "".join(
            _path(state["geometry"], projection, tolerance)
            for state in sorted(states, key=lambda item: item["properties"]["GEOID"])
            if _intersects(_geometry_bounds(state["geometry"]), bounds)
        ),
        "counties": included_counties,
    }


def _population_cells(
    features: list[dict[str, Any]],
    projection: Projection,
    bounds: tuple[float, float, float, float],
) -> tuple[list[list[float | int]], int]:
    cells: dict[tuple[int, int], int] = {}
    for feature in features:
        properties = feature["properties"]
        population = int(properties.get("POP100") or 0)
        if population <= 0:
            continue
        latitude = float(properties["INTPTLAT"])
        longitude = float(properties["INTPTLON"])
        if not (
            bounds[0] <= longitude <= bounds[2]
            and bounds[1] <= latitude <= bounds[3]
        ):
            continue
        x, y = projection.point(longitude, latitude)
        cell = (round(x / 1.5), round(y / 1.5))
        cells[cell] = cells.get(cell, 0) + population
    population_cells = [
        [round(x_cell * 1.5, 1), round(y_cell * 1.5, 1), population]
        for (x_cell, y_cell), population in sorted(cells.items())
    ]
    return population_cells, sum(cell[2] for cell in population_cells)


def _fault_data(
    features: list[dict[str, Any]],
    projection: Projection,
    fault_names: tuple[str, ...],
) -> list[dict[str, str]]:
    paths: dict[tuple[str, str], list[str]] = {}
    for feature in features:
        name = feature["properties"].get("fault_name")
        section_name = feature["properties"].get("section_name") or ""
        geometry = feature.get("geometry")
        if name in fault_names and geometry:
            paths.setdefault((name, section_name), []).append(
                _line_path(geometry, projection)
            )
    return [
        {"name": name, "sectionName": section_name, "path": "".join(path_parts)}
        for (name, section_name), path_parts in sorted(paths.items())
        if path_parts
    ]


def _cascadia_shakemap(
    bounds: tuple[float, float, float, float], downsample: int = 5
) -> dict[str, Any]:
    request = urllib.request.Request(
        USGS_CASCADIA_MEDIAN_GRID_URL,
        headers={"User-Agent": "economic-seismology-map-builder/1.0"},
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        root = ET.fromstring(response.read())
    namespace = "{http://earthquake.usgs.gov/eqcenter/shakemap}"
    specification = root.find(f"{namespace}grid_specification")
    grid_data = root.find(f"{namespace}grid_data")
    if specification is None or grid_data is None or not grid_data.text:
        raise RuntimeError("USGS Cascadia ShakeMap grid is incomplete")

    column_count = int(specification.attrib["nlon"])
    row_count = int(specification.attrib["nlat"])
    rows = [line.split() for line in grid_data.text.splitlines() if line.strip()]
    if len(rows) != column_count * row_count:
        raise RuntimeError("USGS Cascadia ShakeMap grid dimensions do not match")

    valid_columns = [
        column
        for column in range(column_count)
        if bounds[0] <= float(rows[column][0]) <= bounds[2]
    ]
    valid_rows = [
        row
        for row in range(row_count)
        if bounds[1] <= float(rows[row * column_count][1]) <= bounds[3]
    ]
    selected_columns = valid_columns[::downsample]
    selected_rows = valid_rows[::downsample]
    if len(selected_columns) < 2 or len(selected_rows) < 2:
        raise RuntimeError("USGS Cascadia ShakeMap does not cover the map extent")

    values = [
        rows[row * column_count + column]
        for row in selected_rows
        for column in selected_columns
    ]
    first = values[0]
    second_column = values[1]
    second_row = values[len(selected_columns)]
    return {
        "source": "USGS median M9 Cascadia ensemble ShakeMap (Wirth et al. 2021)",
        "sourceUrl": "https://earthquake.usgs.gov/scenarios/catalog/cszm9/",
        "longitudeMin": float(first[0]),
        "latitudeMax": float(first[1]),
        "longitudeStep": round(float(second_column[0]) - float(first[0]), 4),
        "latitudeStep": round(float(first[1]) - float(second_row[1]), 4),
        "columnCount": len(selected_columns),
        "rowCount": len(selected_rows),
        "mmi": [float(value[2]) for value in values],
        "pgaPercentG": [float(value[3]) for value in values],
    }


def _build_region(
    states: list[dict[str, Any]],
    counties: list[dict[str, Any]],
    bounds: tuple[float, float, float, float],
    fault_names: tuple[str, ...],
    state_where: str = CALIFORNIA_STATE_WHERE,
    population_url: str = BLOCK_URL,
    population_note: str = (
        "2020 Census populated-block internal points; 1.5 px aggregation"
    ),
) -> dict[str, Any]:
    projection = _projection(bounds, 840, 680, 16)
    region = _map_data(states, counties, projection, bounds, 0.0015)
    block_collection = _query(
        population_url,
        "OBJECTID,GEOID,POP100,INTPTLAT,INTPTLON",
        where=state_where,
        bounds=bounds,
        return_geometry=False,
    )
    population_cells, population_total = _population_cells(
        block_collection["features"], projection, bounds
    )
    fault_where = "fault_name IN (" + ",".join(
        f"'{name}'" for name in fault_names
    ) + ")"
    fault_collection = _query(
        FAULT_URL,
        "OBJECTID,fault_name,section_name,fault_id,section_id,age,slip_rate,class,"
        "mapped_certainty",
        where=fault_where,
        bounds=bounds,
        page_size=2_000,
    )
    region["populationCells"] = population_cells
    region["populationTotal"] = population_total
    region["peoplePerCellNote"] = population_note
    region["populationSourceUrl"] = population_url
    region["faults"] = _fault_data(
        fault_collection["features"], projection, fault_names
    )
    return region


def build(output: Path) -> None:
    state_collection = _query(
        STATE_URL, "GEOID,NAME", where=WEST_COAST_STATE_WHERE
    )
    county_collection = _query(
        COUNTY_URL,
        "GEOID,NAME,CENTLAT,CENTLON",
        where=WEST_COAST_STATE_WHERE,
    )
    states = state_collection["features"]
    california_states = [
        state for state in states if state["properties"]["GEOID"] == "06"
    ]
    counties = county_collection["features"]
    california_counties = [
        county
        for county in counties
        if county["properties"]["GEOID"].startswith("06")
    ]
    california = _map_data(
        california_states,
        california_counties,
        _projection(CALIFORNIA_BOUNDS, 260, 420, 12),
        CALIFORNIA_BOUNDS,
        0.004,
    )
    west_coast = _map_data(
        states,
        counties,
        _projection(WEST_COAST_BOUNDS, 260, 420, 12),
        WEST_COAST_BOUNDS,
        0.005,
    )
    bay = _build_region(
        california_states, california_counties, BAY_BOUNDS, BAY_FAULT_NAMES
    )
    southern_california = _build_region(
        california_states,
        california_counties,
        SOUTHERN_CALIFORNIA_BOUNDS,
        SOUTHERN_CALIFORNIA_FAULT_NAMES,
    )
    pacific_northwest = _build_region(
        states,
        counties,
        PACIFIC_NORTHWEST_BOUNDS,
        PACIFIC_NORTHWEST_FAULT_NAMES,
        WEST_COAST_STATE_WHERE,
        TRACT_URL,
        "2020 Census tract internal points; U.S. population only",
    )
    pacific_northwest["shakeMap"] = _cascadia_shakemap(
        PACIFIC_NORTHWEST_BOUNDS
    )
    payload = {
        "source": SOURCE_LABEL,
        "boundarySourceUrl": BOUNDARY_SERVICE,
        "populationSourceUrl": "https://tigerweb.geo.census.gov/arcgis/rest/services/"
        "TIGERweb/Tracts_Blocks/MapServer/12",
        "faultSourceUrl": "https://doi.org/10.5066/P9BCVRCK",
        "california": california,
        "westCoast": west_coast,
        "bay": bay,
        "southernCalifornia": southern_california,
        "pacificNorthwest": pacific_northwest,
    }
    compact = json.dumps(payload, separators=(",", ":"), ensure_ascii=True)
    output.write_text(
        "// Generated by scripts/build_dashboard_map.py; do not edit by hand.\n"
        f"export const CALIFORNIA_MAP_DATA = Object.freeze({compact});\n"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("docs/california_map.mjs"))
    args = parser.parse_args()
    build(args.output)


if __name__ == "__main__":
    main()
