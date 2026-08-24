"""Insert favicon links and OGP/Twitter tags into every page's <head>.

Run it after editing a page's <title> or description, so the share-link
preview keeps matching the page:

    ORIGIN=https://example.com python3 scripts/build_meta.py

ORIGIN is the site's public origin. og:image and og:url need absolute URLs —
some crawlers will not resolve a relative one — so pass it whenever it is
known. Without it those two tags stay relative and the rest is unaffected.
The icon links are always relative: they are same-origin either way, and a
relative path survives the site moving to another domain.
"""
import os
import pathlib
import re

ORIGIN = os.environ.get("ORIGIN", "").rstrip("/")
BEGIN = "<!-- OGP: shared-link preview. Regenerate with scripts/build_meta.py -->"


def absolute(path):
    """The public URL of a file, or its relative path when ORIGIN is unset."""
    if not ORIGIN:
        return path
    # The top page is served from the root, so that is its canonical address.
    return ORIGIN + ("/" if path == "index.html" else "/" + path)


for page in sorted(pathlib.Path(".").glob("*.html")):
    s = page.read_text(encoding="utf-8")
    title = re.search(r"<title>(.*?)</title>", s, re.S).group(1).strip()
    desc = re.search(r'<meta name="description" content="(.*?)">', s, re.S).group(1).strip()

    block = f"""{BEGIN}
<link rel="icon" href="favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ぷてぃえーる">
<meta property="og:locale" content="ja_JP">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{absolute('images/ogp.jpg')}">
<meta property="og:url" content="{absolute(page.name)}">
<meta name="twitter:card" content="summary_large_image">
"""

    # Replace the block from a previous run, or insert it after the description.
    if BEGIN in s:
        s = re.sub(re.escape(BEGIN) + r'.*?<meta name="twitter:card"[^>]*>\n',
                   block, s, flags=re.S)
    else:
        anchor = re.search(r'<meta name="description" content=".*?">\n', s, re.S).group(0)
        s = s.replace(anchor, anchor + block, 1)

    page.write_text(s, encoding="utf-8")
    print("patched", page.name, "->", absolute(page.name))
