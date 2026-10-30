#!/usr/bin/env python3

import datetime
import html
import json
import os
import re
import time
import urllib.request

from pathlib import Path
from xml.sax.saxutils import escape


ROOT = Path(
    "/root/explorer/sumcoin-explorer"
)

UI = (
    ROOT /
    "node_modules/insight-sum-ui/public"
)

STATIC = Path(
    "/var/www/sumcoin-static"
)

PAGES = STATIC / "pages"

BASE = "https://sumcoin.space"


def get_json(url):

    req = urllib.request.Request(
        url,
        headers={
            "User-Agent":
            "SumcoinExplorerSEO/2.0"
        }
    )

    with urllib.request.urlopen(
        req,
        timeout=15
    ) as response:

        return json.load(response)


status = get_json(
    "http://127.0.0.1:3001/"
    "api/status?q=getInfo"
)

currency = get_json(
    "http://127.0.0.1:3001/"
    "api/currency"
)

sync = get_json(
    "http://127.0.0.1:3001/"
    "api/sync"
)

info = status.get(
    "info", {}
)

height = int(
    info.get("blocks") or
    sync.get("blockChainHeight") or
    0
)

connections = int(
    info.get("connections") or
    0
)

price = float(
    currency.get(
        "data", {}
    ).get(
        "bitstamp", 0
    ) or 0
)

now = datetime.datetime.now(
    datetime.timezone.utc
)

now_iso = (
    now
    .replace(microsecond=0)
    .isoformat()
    .replace("+00:00", "Z")
)

today = now.date().isoformat()

version = int(
    time.time()
)

price_text = (
    "${:,.2f}".format(price)
    if price
    else "Live"
)

image_en = (
    BASE +
    "/social/explorer.jpg?v=" +
    str(version)
)

image_es = (
    BASE +
    "/social/explorer-es.jpg?v=" +
    str(version)
)

logo = (
    BASE +
    "/img/icons/sumcoin-logo-512.png"
)


routes = [
    {
        "key": "home",
        "en": "/",
        "es": "/es/",
        "en_title":
            "Sumcoin Explorer | SUM " +
            price_text +
            " | Live Blockchain",
        "es_title":
            "Explorador Sumcoin | SUM " +
            price_text +
            " | Blockchain en vivo",
        "en_description":
            "Live Sumcoin blockchain explorer with current SUM price, blocks, transactions, addresses, network status and developer API.",
        "es_description":
            "Explorador en vivo de la blockchain de Sumcoin con precio actual de SUM, bloques, transacciones, direcciones, estado de red y API para desarrolladores.",
        "live": True
    },

    {
        "key": "blocks",
        "en": "/blocks",
        "es": "/es/blocks",
        "en_title":
            "Sumcoin Blocks | Live Blockchain Explorer",
        "es_title":
            "Bloques de Sumcoin | Explorador blockchain",
        "en_description":
            "Browse the latest Sumcoin blocks, timestamps, transaction counts, miners and block sizes.",
        "es_description":
            "Consulta los últimos bloques de Sumcoin, fechas, número de transacciones, mineros y tamaños de bloque.",
        "live": True
    },

    {
        "key": "status",
        "en": "/status",
        "es": "/es/status",
        "en_title":
            "Sumcoin Network Status | Sumcoin Explorer",
        "es_title":
            "Estado de la red Sumcoin | Explorador",
        "en_description":
            "Live Sumcoin node status, blockchain height, synchronization, connections, difficulty and network information.",
        "es_description":
            "Estado en vivo del nodo Sumcoin, altura blockchain, sincronización, conexiones, dificultad e información de red.",
        "live": True
    },

    {
        "key": "api-docs",
        "en": "/api-docs",
        "es": "/es/api-docs",
        "en_title":
            "Sumcoin API Documentation | REST & WebSocket",
        "es_title":
            "Documentación API de Sumcoin | REST y WebSocket",
        "en_description":
            "Developer documentation for the public Sumcoin Explorer REST and WebSocket APIs, with endpoints and working examples.",
        "es_description":
            "Documentación para desarrolladores de las APIs públicas REST y WebSocket de Sumcoin Explorer, con endpoints y ejemplos.",
        "live": False,
        "source":
            UI / "views/api_docs.html",
        "source_es":
            UI / "views/api_docs_es.html"
    },

    {
        "key": "verify",
        "en": "/messages/verify",
        "es": "/es/messages/verify",
        "en_title":
            "Verify Sumcoin Signed Message | Sumcoin Explorer",
        "es_title":
            "Verificar mensaje firmado de Sumcoin | Explorador",
        "en_description":
            "Verify a cryptographic message signature against a Sumcoin address without revealing the private key.",
        "es_description":
            "Verifica una firma criptográfica contra una dirección Sumcoin sin revelar la clave privada.",
        "live": False,
        "source":
            UI / "views/messages_verify.html",
        "source_es":
            UI / "views/messages_verify_es.html"
    },

    {
        "key": "broadcast",
        "en": "/tx/send",
        "es": "/es/tx/send",
        "en_title":
            "Broadcast Sumcoin Transaction | Sumcoin Explorer",
        "es_title":
            "Transmitir transacción Sumcoin | Explorador",
        "en_description":
            "Broadcast an already-created and signed raw Sumcoin transaction to the network.",
        "es_description":
            "Transmite a la red una transacción Sumcoin sin procesar que ya fue creada y firmada.",
        "live": False,
        "source":
            UI / "views/transaction_sendraw.html",
        "source_es":
            UI / "views/transaction_sendraw_es.html"
    }
]


def clean_index(text):

    text = re.sub(
        r'<!-- SUMCOIN SEO START -->.*?'
        r'<!-- SUMCOIN SEO END -->',
        '',
        text,
        flags=re.S
    )

    patterns = [
        r'<title\b[^>]*>.*?</title>',
        r'<meta\b[^>]*name=["\']description["\'][^>]*>',
        r'<meta\b[^>]*name=["\']keywords["\'][^>]*>',
        r'<meta\b[^>]*name=["\']robots["\'][^>]*>',
        r'<meta\b[^>]*name=["\']googlebot["\'][^>]*>',
        r'<meta\b[^>]*name=["\']application-name["\'][^>]*>',
        r'<meta\b[^>]*name=["\']theme-color["\'][^>]*>',
        r'<meta\b[^>]*name=["\']twitter:[^"\']+["\'][^>]*>',
        r'<meta\b[^>]*property=["\']og:[^"\']+["\'][^>]*>',
        r'<link\b[^>]*rel=["\']canonical["\'][^>]*>',
        r'<link\b[^>]*rel=["\']alternate["\'][^>]*>',
        r'<link\b[^>]*rel=["\']shortcut icon["\'][^>]*>',
        r'<link\b[^>]*rel=["\']icon["\'][^>]*>',
        r'<link\b[^>]*rel=["\']apple-touch-icon["\'][^>]*>',
        r'<link\b[^>]*rel=["\']manifest["\'][^>]*>',
        r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>.*?</script>'
    ]

    for pattern in patterns:
        text = re.sub(
            pattern,
            '',
            text,
            flags=re.S | re.I
        )

    return text


base_index = clean_index(
    (ROOT / "node_modules/insight-sum-ui/scripts/seo/index-template.html").read_text()
)


def spanish_shell_text(text):

    text = re.sub(
        r'<html\s+lang=["\'][^"\']*["\']',
        '<html lang="es"',
        text,
        count=1,
        flags=re.I
    )

    replacements = {
        "Scan Sumcoin QR Code":
            "Escanear código QR de Sumcoin",

        "Live camera scanning requires HTTPS in modern browsers. You can still scan a saved QR image below.":
            "El escaneo con cámara en vivo requiere HTTPS en los navegadores modernos. También puedes escanear una imagen QR guardada.",

        "Choose QR Image":
            "Elegir imagen QR",

        "Works with Sumcoin address, transaction and block QR codes.":
            "Funciona con códigos QR de direcciones, transacciones y bloques de Sumcoin.",

        ">Close<":
            ">Cerrar<"
    }

    for a, b in replacements.items():
        text = text.replace(a, b)

    return text


def file_lastmod(path):

    if not path or not Path(path).exists():
        return today

    stamp = datetime.datetime.fromtimestamp(
        Path(path).stat().st_mtime,
        datetime.timezone.utc
    )

    return stamp.date().isoformat()


def seo_block(route, lang):

    spanish = (
        lang == "es"
    )

    path = (
        route["es"]
        if spanish
        else route["en"]
    )

    alt_path = (
        route["en"]
        if spanish
        else route["es"]
    )

    title = (
        route["es_title"]
        if spanish
        else route["en_title"]
    )

    description = (
        route["es_description"]
        if spanish
        else route["en_description"]
    )

    canonical = BASE + path

    english = BASE + route["en"]
    spanish_url = BASE + route["es"]

    image = (
        image_es
        if spanish
        else image_en
    )

    locale = (
        "es_ES"
        if spanish
        else "en_US"
    )

    graph = {
        "@context":
            "https://schema.org",

        "@graph": [
            {
                "@type":
                    "WebPage",

                "@id":
                    canonical + "#webpage",

                "url":
                    canonical,

                "name":
                    title,

                "description":
                    description,

                "inLanguage":
                    lang,

                "dateModified":
                    now_iso,

                "isPartOf": {
                    "@id":
                        BASE + "/#website"
                }
            },

            {
                "@type":
                    "WebSite",

                "@id":
                    BASE + "/#website",

                "url":
                    BASE + "/",

                "name":
                    "Sumcoin Explorer",

                "inLanguage": [
                    "en",
                    "es"
                ]
            },

            {
                "@type":
                    "WebApplication",

                "@id":
                    BASE + "/#application",

                "name":
                    "Sumcoin Explorer",

                "url":
                    BASE + "/",

                "applicationCategory":
                    "FinanceApplication",

                "operatingSystem":
                    "Any",

                "isAccessibleForFree":
                    True,

                "image":
                    image,

                "screenshot":
                    image,

                "featureList": [
                    "Sumcoin block explorer",
                    "Transaction lookup",
                    "Address lookup",
                    "Live network status",
                    "REST API",
                    "WebSocket API",
                    "Signed message verification",
                    "Raw transaction broadcast"
                ]
            }
        ]
    }

    return f"""
<!-- SUMCOIN SEO START -->
<title>{html.escape(title)}</title>

<meta name="description"
      content="{html.escape(description, quote=True)}">

<meta name="robots"
      content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">

<meta name="googlebot"
      content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">

<meta name="application-name"
      content="Sumcoin Explorer">

<meta name="theme-color"
      content="#1f6fd2">

<link rel="canonical"
      href="{canonical}">

<link rel="alternate"
      hreflang="en"
      href="{english}">

<link rel="alternate"
      hreflang="es"
      href="{spanish_url}">

<link rel="alternate"
      hreflang="x-default"
      href="{english}">

<link rel="icon"
      href="/favicon.ico"
      type="image/x-icon">

<link rel="icon"
      type="image/png"
      sizes="192x192"
      href="/img/icons/sumcoin-logo-192.png">

<link rel="apple-touch-icon"
      href="/img/icons/apple-touch-icon.png">

<link rel="manifest"
      href="/site.webmanifest">

<meta property="og:type"
      content="website">

<meta property="og:site_name"
      content="Sumcoin Explorer">

<meta property="og:locale"
      content="{locale}">

<meta property="og:url"
      content="{canonical}">

<meta property="og:title"
      content="{html.escape(title, quote=True)}">

<meta property="og:description"
      content="{html.escape(description, quote=True)}">

<meta property="og:image"
      content="{image}">

<meta property="og:image:secure_url"
      content="{image}">

<meta property="og:image:width"
      content="1200">

<meta property="og:image:height"
      content="630">

<meta property="og:image:alt"
      content="{html.escape(title, quote=True)}">

<meta name="twitter:card"
      content="summary_large_image">

<meta name="twitter:title"
      content="{html.escape(title, quote=True)}">

<meta name="twitter:description"
      content="{html.escape(description, quote=True)}">

<meta name="twitter:image"
      content="{image}">

<script type="application/ld+json">
{json.dumps(graph, ensure_ascii=False)}
</script>
<!-- SUMCOIN SEO END -->
""".strip()


def make_shell(route, lang):

    text = base_index

    if lang == "es":
        text = spanish_shell_text(
            text
        )

    else:
        text = re.sub(
            r'<html\s+lang=["\'][^"\']*["\']',
            '<html lang="en"',
            text,
            count=1,
            flags=re.I
        )

    block = seo_block(
        route,
        lang
    )

    text = text.replace(
        "<head>",
        "<head>\n" + block,
        1
    )

    return text


(PAGES / "en").mkdir(
    parents=True,
    exist_ok=True
)

(PAGES / "es").mkdir(
    parents=True,
    exist_ok=True
)


for route in routes:

    for lang in [
        "en",
        "es"
    ]:

        shell = make_shell(
            route,
            lang
        )

        path = (
            PAGES /
            lang /
            (
                route["key"] +
                ".html"
            )
        )

        path.write_text(
            shell
        )


# Keep Express fallback index useful too.
home_route = routes[0]

(UI / "index.html").write_text(
    make_shell(
        home_route,
        "en"
    )
)


# ------------------------------------------------------------
# Sitemap with en/es alternate relationships.
# Live pages change daily for sitemap purposes,
# not every five minutes.
# ------------------------------------------------------------

rows = []

for route in routes:

    if route.get(
        "live", False
    ):
        lastmod_en = today
        lastmod_es = today

    else:
        lastmod_en = file_lastmod(
            route.get("source")
        )

        lastmod_es = file_lastmod(
            route.get("source_es")
        )

    en_url = (
        BASE +
        route["en"]
    )

    es_url = (
        BASE +
        route["es"]
    )

    for loc, lang, lastmod in [
        (
            en_url,
            "en",
            lastmod_en
        ),
        (
            es_url,
            "es",
            lastmod_es
        )
    ]:

        row = [
            "  <url>",
            "    <loc>" +
            escape(loc) +
            "</loc>",

            '    <xhtml:link rel="alternate" hreflang="en" href="' +
            escape(en_url) +
            '" />',

            '    <xhtml:link rel="alternate" hreflang="es" href="' +
            escape(es_url) +
            '" />',

            '    <xhtml:link rel="alternate" hreflang="x-default" href="' +
            escape(en_url) +
            '" />',

            "    <lastmod>" +
            escape(lastmod) +
            "</lastmod>",

            "  </url>"
        ]

        rows.append(
            "\n".join(row)
        )


sitemap = (
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset '
    'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
    'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    +
    "\n".join(rows)
    +
    "\n</urlset>\n"
)

(UI / "sitemap.xml").write_text(
    sitemap
)

(STATIC / "sitemap.xml").write_text(
    sitemap
)


live = {
    "generated":
        now_iso,

    "priceUsd":
        price,

    "height":
        height,

    "connections":
        connections,

    "englishTitle":
        routes[0]["en_title"],

    "spanishTitle":
        routes[0]["es_title"],

    "englishSocialImage":
        image_en,

    "spanishSocialImage":
        image_es
}

(UI / "seo").mkdir(
    exist_ok=True
)

(UI / "seo/live.json").write_text(
    json.dumps(
        live,
        indent=2,
        ensure_ascii=False
    )
)

print(
    json.dumps(
        live,
        ensure_ascii=False
    )
)
