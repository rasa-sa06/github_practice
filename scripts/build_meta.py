"""Insert favicon links and OGP/Twitter tags into every page's <head>.

ORIGIN is the site's public origin, e.g. https://example.com. When it is empty
the image and page URLs stay relative; re-run with ORIGIN set once the domain
is decided to make them absolute (some crawlers insist on absolute URLs).
"""
import os, pathlib, re

ORIGIN = os.environ.get("ORIGIN", "").rstrip("/")
BEGIN = "<!-- OGP: shared-link preview. Regenerate with scripts/build_meta.py -->"

def url(path):
    return f"{ORIGIN}/{path}" if ORIGIN else path

for p in sorted(pathlib.Path(".").glob("*.html")):
    s = p.read_text(encoding="utf-8")
    title = re.search(r"<title>(.*?)</title>", s, re.S).group(1).strip()
    desc = re.search(r'<meta name="description" content="(.*?)">', s, re.S).group(1).strip()

    block = f"""{BEGIN}
<link rel="icon" href="{url('favicon.ico')}" sizes="any">
<link rel="apple-touch-icon" href="{url('apple-touch-icon.png')}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ぷてぃえーる">
<meta property="og:locale" content="ja_JP">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{url('images/ogp.jpg')}">
<meta property="og:url" content="{url(p.name)}">
<meta name="twitter:card" content="summary_large_image">
"""

    # Replace an existing block, or insert after the description tag.
    if BEGIN in s:
        s = re.sub(re.escape(BEGIN) + r".*?<meta name=\"twitter:card\"[^>]*>\n",
                   block, s, flags=re.S)
    else:
        anchor = re.search(r'<meta name="description" content=".*?">\n', s, re.S).group(0)
        s = s.replace(anchor, anchor + block, 1)
    p.write_text(s, encoding="utf-8")
    print("patched", p.name, "->", url(p.name))
