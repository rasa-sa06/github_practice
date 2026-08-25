"""Rebuild what depends on the site's public URL: the OGP/Twitter tags and
favicon links in every page's <head>, plus sitemap.xml and robots.txt.

Run it after editing a page's <title> or description, or after adding or
removing a page:

    python3 scripts/build_meta.py

The origin below is where the site is served. Moving to another domain is a
one-line edit here followed by one run; ORIGIN= in the environment overrides
it for a one-off. og:image, og:url and the sitemap need absolute URLs, since
not every crawler resolves a relative one. The icon links stay relative:
they are same-origin either way, and a relative path survives the move.
"""
import os
import pathlib
import re

DEFAULT_ORIGIN = "https://github-practice-rouge-nine.vercel.app"

ORIGIN = os.environ.get("ORIGIN", DEFAULT_ORIGIN).rstrip("/")
BEGIN = "<!-- OGP: shared-link preview. Regenerate with scripts/build_meta.py -->"


def absolute(path):
    """The public URL of a file, or its relative path when ORIGIN is unset."""
    if not ORIGIN:
        return path
    # The top page is served from the root, so that is its canonical address.
    return ORIGIN + ("/" if path == "index.html" else "/" + path)


pages = []

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
    pages.append(page.name)

# Search engines read these two from the site root. The sitemap lists every
# page so none is missed; robots.txt is where crawlers look for the sitemap.
# The top page leads, then the rest in the order they were processed.
pages.sort(key=lambda name: (name != "index.html", name))
urls = "\n".join(f"  <url><loc>{absolute(name)}</loc></url>" for name in pages)
pathlib.Path("sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    f"{urls}\n"
    "</urlset>\n",
    encoding="utf-8")

pathlib.Path("robots.txt").write_text(
    "User-agent: *\n"
    "Allow: /\n"
    "\n"
    f"Sitemap: {ORIGIN}/sitemap.xml\n",
    encoding="utf-8")

print(f"wrote sitemap.xml ({len(pages)} pages) and robots.txt")
