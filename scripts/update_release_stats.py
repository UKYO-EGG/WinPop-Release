#!/usr/bin/env python3
"""Generate pages_public/stats.json from GitHub Releases.

The public stats count is the total download_count for every
WinPop_Setup_*.exe release asset, not the latest asset's individual count.
"""

from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


REPO = os.environ.get("GITHUB_REPOSITORY", "UKYO-EGG/WinPop-Release")
API_URL = f"https://api.github.com/repos/{REPO}/releases?per_page=100"
ASSET_PATTERN = re.compile(r"^WinPop_Setup_.*\.exe$")
SOURCE = "GitHub Releases WinPop_Setup_*.exe total download_count"
ROOT = Path(__file__).resolve().parents[1]
STATS_PATHS = [
    ROOT / "pages_public" / "stats.json",
    ROOT / "pages_public" / "pages_public" / "stats.json",
]


def fetch_json(url: str) -> tuple[Any, str | None]:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "WinPop-Release-stats-updater",
    }
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    request = Request(url, headers=headers)
    with urlopen(request, timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8"))
        link_header = response.headers.get("Link")
    return payload, link_header


def parse_next_link(link_header: str | None) -> str | None:
    if not link_header:
        return None

    for part in link_header.split(","):
        section = part.strip()
        if 'rel="next"' not in section:
            continue
        start = section.find("<")
        end = section.find(">", start + 1)
        if start != -1 and end != -1:
            return section[start + 1 : end]
    return None


def fetch_all_releases() -> list[dict[str, Any]]:
    releases: list[dict[str, Any]] = []
    url: str | None = API_URL

    while url:
        payload, link_header = fetch_json(url)
        if not isinstance(payload, list):
            raise RuntimeError("GitHub Releases API returned a non-list payload")
        releases.extend(payload)
        url = parse_next_link(link_header)

    return releases


def collect_setup_assets(releases: list[dict[str, Any]]) -> list[dict[str, Any]]:
    assets: list[dict[str, Any]] = []

    for release in releases:
        tag_name = str(release.get("tag_name") or "")
        release_url = str(release.get("html_url") or "")
        release_published_at = str(
            release.get("published_at") or release.get("created_at") or ""
        )

        for asset in release.get("assets") or []:
            name = str(asset.get("name") or "")
            if not ASSET_PATTERN.fullmatch(name):
                continue

            try:
                download_count = int(asset.get("download_count"))
            except (TypeError, ValueError) as exc:
                raise RuntimeError(f"Invalid download_count for asset {name}") from exc

            assets.append(
                {
                    "tag_name": tag_name,
                    "release_url": release_url,
                    "release_published_at": release_published_at,
                    "name": name,
                    "download_url": str(asset.get("browser_download_url") or ""),
                    "download_count": download_count,
                    "created_at": str(asset.get("created_at") or ""),
                    "updated_at": str(asset.get("updated_at") or ""),
                }
            )

    return assets


def sort_key(asset: dict[str, Any]) -> tuple[str, str, str]:
    return (
        str(asset.get("release_published_at") or ""),
        str(asset.get("created_at") or ""),
        str(asset.get("name") or ""),
    )


def build_stats(assets: list[dict[str, Any]]) -> dict[str, Any]:
    if not assets:
        raise RuntimeError("No WinPop_Setup_*.exe release assets found")

    latest_asset = max(assets, key=sort_key)
    total_downloads = sum(asset["download_count"] for asset in assets)
    latest_version = str(latest_asset["tag_name"]).removeprefix("v")

    return {
        "version": latest_version,
        "asset_name": latest_asset["name"],
        "download_count": total_downloads,
        "total_downloads": total_downloads,
        "totalDownloadCount": total_downloads,
        "latest_asset_name": latest_asset["name"],
        "latest_asset_download_count": latest_asset["download_count"],
        "release_url": latest_asset["release_url"],
        "download_url": latest_asset["download_url"],
        "updated_at": (
            datetime.now(timezone.utc)
            .replace(microsecond=0)
            .isoformat()
            .replace("+00:00", "Z")
        ),
        "source": SOURCE,
    }


def write_stats(stats: dict[str, Any]) -> None:
    encoded = json.dumps(stats, ensure_ascii=False, indent=2) + "\n"
    for path in STATS_PATHS:
        if path.parent.exists():
            path.write_text(encoded, encoding="utf-8")


def main() -> int:
    try:
        releases = fetch_all_releases()
        assets = collect_setup_assets(releases)
        stats = build_stats(assets)
        write_stats(stats)
    except (HTTPError, URLError, TimeoutError, RuntimeError, OSError) as exc:
        print(f"Failed to update stats.json: {exc}", file=sys.stderr)
        return 1

    print(
        f"Updated stats.json with total_downloads={stats['total_downloads']} "
        f"from {len(assets)} WinPop_Setup_*.exe assets"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
