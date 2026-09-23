#!/usr/bin/env python3
"""Refresh the gallery from the shop's Instagram account.

Pulls the newest image posts, resizes and re-encodes them the same way the
rest of the site's photos were prepared, and writes them over
images/ig-image{1,2,3}.webp. The pages keep pointing at those fixed names, so
nothing in the HTML has to change except the alt text, which names what the
photo is and when it was posted.

Reads INSTAGRAM_TOKEN from the environment. Exits 0 without touching anything
when the token is absent, so the workflow is harmless before it is configured.
"""

from __future__ import annotations

import io
import json
import os
import re
import sys
from datetime import datetime
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

# Matches how the existing gallery photos were prepared: the tiles render at
# 330px, so 800px covers a 2x display, and quality 92 was chosen for the
# product shots specifically.
TARGET_WIDTH = 800
QUALITY = 92
COUNT = 3

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "images"
PAGES = [ROOT / "index.html", ROOT / "gallery.html"]

API = "https://graph.instagram.com/v21.0/me/media"
FIELDS = "id,media_type,media_url,permalink,caption,timestamp"


def fail(message: str) -> None:
    print(f"::error::{message}")
    sys.exit(1)


def get_json(url: str) -> dict:
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")[:400]
        fail(f"Instagram API returned {exc.code}: {body}")
    except Exception as exc:  # noqa: BLE001 - surfaced to the workflow log
        fail(f"Could not reach the Instagram API: {exc}")
    return {}


def fetch_media(token: str) -> list[dict]:
    """Newest COUNT posts that carry a single image.

    Carousels report CAROUSEL_ALBUM and their media_url is the first child, so
    they are usable as-is; videos are skipped because the gallery is stills.
    """
    query = urllib.parse.urlencode({"fields": FIELDS, "limit": 25, "access_token": token})
    payload = get_json(f"{API}?{query}")
    usable = [
        item
        for item in payload.get("data", [])
        if item.get("media_type") in ("IMAGE", "CAROUSEL_ALBUM") and item.get("media_url")
    ]
    if len(usable) < COUNT:
        fail(f"Need {COUNT} image posts, the account returned {len(usable)}")
    return usable[:COUNT]


def download(url: str) -> Image.Image:
    try:
        with urllib.request.urlopen(url, timeout=60) as response:
            return Image.open(io.BytesIO(response.read()))
    except Exception as exc:  # noqa: BLE001
        fail(f"Could not download {url[:80]}: {exc}")
    raise AssertionError("unreachable")


def write_webp(image: Image.Image, destination: Path) -> int:
    image = image.convert("RGB")
    width, height = image.size
    if width > TARGET_WIDTH:
        image = image.resize((TARGET_WIDTH, round(height * TARGET_WIDTH / width)), Image.LANCZOS)
    image.save(destination, "WEBP", quality=QUALITY, method=6)
    return destination.stat().st_size


def alt_from_post(post: dict) -> str:
    """What the photo is, and when it was posted.

    The caption used to be used for this, on the assumption that it describes
    the item. It usually does not — a post opens with a greeting, a date, or a
    single emoji, and "🎄" tells a screen reader nothing about a hair ribbon
    and keeps the photo out of image search. Nothing here can see what is in
    the picture, so the alt text says only what is certainly true: these are
    the shop's ribbons, and this is when this one went up.
    """
    base = "ぷてぃえーるのヘアリボン作品"
    stamp = (post.get("timestamp") or "")[:10]
    try:
        posted = datetime.strptime(stamp, "%Y-%m-%d")
    except ValueError:
        return base
    return f"{base}（{posted.year}年{posted.month}月{posted.day}日の投稿）"


def update_alt_text(alts: list[str]) -> list[Path]:
    """Describe each gallery <img> as the post now behind it."""
    changed = []
    for page in PAGES:
        original = page.read_text(encoding="utf-8")
        updated = original
        for index, alt in enumerate(alts, start=1):
            escaped = alt.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;")
            updated = re.sub(
                rf'(<img src="images/ig-image{index}\.webp" alt=")[^"]*(")',
                lambda m, value=escaped: m.group(1) + value + m.group(2),
                updated,
            )
        if updated != original:
            page.write_text(updated, encoding="utf-8")
            changed.append(page)
    return changed


def main() -> None:
    token = os.environ.get("INSTAGRAM_TOKEN", "").strip()
    if not token:
        print("INSTAGRAM_TOKEN is not set — nothing to sync yet.")
        return

    posts = fetch_media(token)
    alts = []
    for index, post in enumerate(posts, start=1):
        destination = IMAGES / f"ig-image{index}.webp"
        size = write_webp(download(post["media_url"]), destination)
        alt = alt_from_post(post)
        alts.append(alt)
        # The caption is only here so the log says which post this was.
        caption = " ".join((post.get("caption") or "").split())[:40]
        print(f"{destination.name}: {size // 1024} KB  {post.get('timestamp', '')}  {caption}")

    for page in update_alt_text(alts):
        print(f"alt text updated in {page.name}")


if __name__ == "__main__":
    main()
