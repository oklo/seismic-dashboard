"""Build compact dashboard SVG paths from U.S. Census Bureau boundaries."""

from __future__ import annotations

import argparse
import json
import math
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

SERVICE = (
    "https://tigerweb.geo.census.gov/arcgis/rest/services/"
    "Generalized_ACS2024/State_County/MapServer"
)
STATE_URL = f"{SERVICE}/7/query"
COUNTY_URL = f"{SERVICE}/11/query"
SOURCE_LABEL = "U.S. Census Bureau TIGERweb, January 1 2024 generalized boundaries"
CALIFORNIA_BOUNDS = (-124.65, 32.3, -114.0, 42.1)
BAY_BOUNDS = (-123.05, 36.95, -121.15, 38.55)


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


def _query(url: str, fields: str) -> dict[str, Any]:
    query = urllib.parse.urlencode(
        {
            "where": "STATE='06'",
            "outFields": fields,
            "returnGeometry": "true",
            "outSR": "4326",
            "f": "geojson",
        }
    )
    request = urllib.request.Request(
        f"{url}?{query}",
        headers={"User-Agent": "economic-seismology-map-builder/1.0"},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        data = json.load(response)
    if "error" in data:
        raise RuntimeError(f"TIGERweb query failed: {data['error']}")
    return data


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
    state: dict[str, Any],
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
        "statePath": _path(state["geometry"], projection, tolerance),
        "counties": included_counties,
    }


def build(output: Path) -> None:
    state_collection = _query(STATE_URL, "GEOID,NAME")
    county_collection = _query(COUNTY_URL, "GEOID,NAME,CENTLAT,CENTLON")
    state = state_collection["features"][0]
    counties = county_collection["features"]
    california = _map_data(
        state,
        counties,
        _projection(CALIFORNIA_BOUNDS, 260, 420, 12),
        CALIFORNIA_BOUNDS,
        0.004,
    )
    bay = _map_data(
        state,
        counties,
        _projection(BAY_BOUNDS, 720, 520, 18),
        BAY_BOUNDS,
        0.0015,
    )
    payload = {
        "source": SOURCE_LABEL,
        "sourceUrl": "https://tigerweb.geo.census.gov/arcgis/rest/services/"
        "Generalized_ACS2024/State_County/MapServer",
        "california": california,
        "bay": bay,
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
