#!/usr/bin/env python3

from pathlib import Path
import datetime
import json
import urllib.request
from xml.sax.saxutils import escape

ROOT = Path("/root/explorer/sumcoin-explorer")

UI = (
    ROOT /
    "node_modules/insight-sum-ui/public"
)

STATIC = Path(
    "/var/www/sumcoin-static"
)

BASE = "https://sumcoin.space"

UTC = datetime.timezone.utc


def iso(dt):
    return (
        dt.astimezone(UTC)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


def get_json(url):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent":
            "SumcoinSitemap/1.0"
        }
    )

    with urllib.request.urlopen(
        req,
        timeout=15
    ) as r:
        return json.load(r)


# ------------------------------------------------------------
# Determine REAL live-content modification time.
# Prefer newest block timestamp.
# ------------------------------------------------------------

now = datetime.datetime.now(UTC)

live_dt = now
tip_height = None

try:
    data = get_json(
        "http://127.0.0.1:3001/api/blocks?limit=1"
    )

    blocks = []

    if isinstance(data, dict):
        blocks = data.get("blocks") or []

    elif isinstance(data, list):
        blocks = data

    if blocks:
        block = blocks[0]

        tip_height = block.get("height")

        ts = block.get("time")

        if ts:
            live_dt = datetime.datetime.fromtimestamp(
                float(ts),
                UTC
            )

except Exception as e:
    print(
        "WARNING: latest block timestamp unavailable:",
        str(e)
    )


live_lastmod = iso(live_dt)


# ------------------------------------------------------------
# Static-page timestamps come from the actual source files.
# ------------------------------------------------------------

def file_time(path):
    p = Path(path)

    if not p.exists():
        return iso(now)

    return iso(
        datetime.datetime.fromtimestamp(
            p.stat().st_mtime,
            UTC
        )
    )


pairs_live = [
    {
        "en": "/",
        "es": "/es/"
    },
    {
        "en": "/blocks",
        "es": "/es/blocks"
    },
    {
        "en": "/status",
        "es": "/es/status"
    }
]


pairs_pages = [
    {
        "en": "/api-docs",
        "es": "/es/api-docs",

        "en_file":
            UI / "views/api_docs.html",

        "es_file":
            UI / "views/api_docs_es.html"
    },

    {
        "en": "/messages/verify",
        "es": "/es/messages/verify",

        "en_file":
            UI / "views/messages_verify.html",

        "es_file":
            UI / "views/messages_verify_es.html"
    },

    {
        "en": "/tx/send",
        "es": "/es/tx/send",

        "en_file":
            UI / "views/transaction_sendraw.html",

        "es_file":
            UI / "views/transaction_sendraw_es.html"
    }
]


def entry(loc, en, es, lastmod):
    return f"""  <url>
    <loc>{escape(BASE + loc)}</loc>
    <xhtml:link
      rel="alternate"
      hreflang="en"
      href="{escape(BASE + en)}" />
    <xhtml:link
      rel="alternate"
      hreflang="es"
      href="{escape(BASE + es)}" />
    <xhtml:link
      rel="alternate"
      hreflang="x-default"
      href="{escape(BASE + en)}" />
    <lastmod>{escape(lastmod)}</lastmod>
  </url>"""


def urlset(entries):
    return """<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
%s
</urlset>
""" % "\n".join(entries)


# ------------------------------------------------------------
# LIVE sitemap
# ------------------------------------------------------------

live_entries = []

for pair in pairs_live:

    live_entries.append(
        entry(
            pair["en"],
            pair["en"],
            pair["es"],
            live_lastmod
        )
    )

    live_entries.append(
        entry(
            pair["es"],
            pair["en"],
            pair["es"],
            live_lastmod
        )
    )


live_xml = urlset(
    live_entries
)


# ------------------------------------------------------------
# STATIC / documentation sitemap
# ------------------------------------------------------------

page_entries = []
static_times = []

for pair in pairs_pages:

    en_time = file_time(
        pair["en_file"]
    )

    es_time = file_time(
        pair["es_file"]
    )

    static_times += [
        en_time,
        es_time
    ]

    page_entries.append(
        entry(
            pair["en"],
            pair["en"],
            pair["es"],
            en_time
        )
    )

    page_entries.append(
        entry(
            pair["es"],
            pair["en"],
            pair["es"],
            es_time
        )
    )


pages_xml = urlset(
    page_entries
)


static_latest = max(
    static_times
) if static_times else iso(now)


# ------------------------------------------------------------
# Sitemap INDEX
# ------------------------------------------------------------

index_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<sitemapindex
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>{BASE}/sitemap-live.xml</loc>
    <lastmod>{live_lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>{BASE}/sitemap-pages.xml</loc>
    <lastmod>{static_latest}</lastmod>
  </sitemap>
</sitemapindex>
"""


# ------------------------------------------------------------
# Human-readable browser styling.
# Google still sees standard XML.
# ------------------------------------------------------------

xsl = r'''<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
  version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="s xhtml">

<xsl:output
  method="html"
  encoding="UTF-8"
  indent="yes" />

<xsl:template match="/">

<html>

<head>

<title>Sumcoin Explorer XML Sitemap</title>

<meta
  name="viewport"
  content="width=device-width,initial-scale=1" />

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont,
               "Segoe UI", sans-serif;
  margin: 0;
  background: #f5f7fa;
  color: #1d2939;
}

header {
  background: #1f6fd2;
  color: white;
  padding: 30px 40px;
}

header h1 {
  margin: 0 0 7px;
  font-size: 28px;
}

header p {
  margin: 0;
  opacity: .9;
}

main {
  padding: 28px 40px 50px;
}

.card {
  background: white;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #e9f2ff;
  text-align: left;
  padding: 12px 14px;
  font-size: 13px;
}

td {
  border-top: 1px solid #e5e7eb;
  padding: 12px 14px;
  vertical-align: top;
}

a {
  color: #1559ad;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

small {
  color: #667085;
}

.badge {
  display: inline-block;
  background: #e9f2ff;
  border-radius: 4px;
  padding: 3px 7px;
  font-size: 12px;
}
</style>

</head>

<body>

<header>
  <h1>Sumcoin Explorer XML Sitemap</h1>
  <p>
    Canonical English and Spanish pages for sumcoin.space
  </p>
</header>

<main>

<xsl:choose>

<xsl:when test="s:sitemapindex">

  <p>
    Sitemap index containing separate live blockchain
    and documentation sitemaps.
  </p>

  <div class="card">

  <table>

    <thead>
      <tr>
        <th>Sitemap</th>
        <th>Last significant update</th>
      </tr>
    </thead>

    <tbody>

      <xsl:for-each select="s:sitemapindex/s:sitemap">

        <tr>

          <td>
            <a href="{s:loc}">
              <xsl:value-of select="s:loc"/>
            </a>
          </td>

          <td>
            <span class="badge">
              <xsl:value-of select="s:lastmod"/>
            </span>
          </td>

        </tr>

      </xsl:for-each>

    </tbody>

  </table>

  </div>

</xsl:when>


<xsl:otherwise>

  <p>
    <strong>
      <xsl:value-of select="count(s:urlset/s:url)"/>
    </strong>
    canonical URLs in this sitemap.
  </p>

  <div class="card">

  <table>

    <thead>
      <tr>
        <th>Canonical URL</th>
        <th>Last significant update</th>
        <th>English</th>
        <th>Spanish</th>
      </tr>
    </thead>

    <tbody>

      <xsl:for-each select="s:urlset/s:url">

        <tr>

          <td>
            <a href="{s:loc}">
              <xsl:value-of select="s:loc"/>
            </a>
          </td>

          <td>
            <small>
              <xsl:value-of select="s:lastmod"/>
            </small>
          </td>

          <td>
            <a href="{xhtml:link[@hreflang='en']/@href}">
              EN
            </a>
          </td>

          <td>
            <a href="{xhtml:link[@hreflang='es']/@href}">
              ES
            </a>
          </td>

        </tr>

      </xsl:for-each>

    </tbody>

  </table>

  </div>

</xsl:otherwise>

</xsl:choose>

</main>

</body>

</html>

</xsl:template>

</xsl:stylesheet>
'''


files = {
    "sitemap.xml":
        index_xml,

    "sitemap-live.xml":
        live_xml,

    "sitemap-pages.xml":
        pages_xml,

    "sitemap.xsl":
        xsl
}


for name, content in files.items():

    (UI / name).write_text(
        content
    )

    (STATIC / name).write_text(
        content
    )


print(
    "Tip height:",
    tip_height
)

print(
    "Live lastmod:",
    live_lastmod
)

print(
    "Live URLs:",
    len(live_entries)
)

print(
    "Static URLs:",
    len(page_entries)
)

print(
    "Index:",
    BASE + "/sitemap.xml"
)
