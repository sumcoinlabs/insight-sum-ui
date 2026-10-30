#!/usr/bin/env python3

import json
import subprocess
from pathlib import Path

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

live = json.loads(
    (UI / "seo/live.json").read_text()
)

price = float(
    live.get("priceUsd") or 0
)

height = int(
    live.get("height") or 0
)

connections = int(
    live.get("connections") or 0
)

logo = (
    UI /
    "img/icons/sumcoin-logo-512.png"
)

UI_SOCIAL = UI / "social"
STATIC_SOCIAL = STATIC / "social"

UI_SOCIAL.mkdir(
    parents=True,
    exist_ok=True
)

STATIC_SOCIAL.mkdir(
    parents=True,
    exist_ok=True
)


def build(
    output,
    title,
    subtitle,
    price_label,
    height_label,
    peers_label
):

    price_text = (
        "SUM ${:,.2f}".format(price)
        if price
        else "SUM"
    )

    height_text = (
        "{} {:,}".format(
            height_label,
            height
        )
    )

    peers_text = (
        "{} {}".format(
            peers_label,
            connections
        )
    )

    cmd = [
        "convert",

        "-size",
        "1200x630",

        "xc:#f6f9fd",

        "(",
        "-size",
        "1200x12",
        "xc:#1f6fd2",
        ")",

        "-gravity",
        "north",

        "-composite",

        "(",
        str(logo),
        "-resize",
        "145x145",
        ")",

        "-gravity",
        "northwest",

        "-geometry",
        "+70+78",

        "-composite",

        "-font",
        "DejaVu-Sans-Bold",

        "-fill",
        "#10498e",

        "-pointsize",
        "54",

        "-gravity",
        "northwest",

        "-annotate",
        "+255+88",
        title,

        "-font",
        "DejaVu-Sans",

        "-fill",
        "#475467",

        "-pointsize",
        "29",

        "-annotate",
        "+258+165",
        subtitle,

        "-font",
        "DejaVu-Sans-Bold",

        "-fill",
        "#1559ad",

        "-pointsize",
        "58",

        "-annotate",
        "+72+295",
        price_text,

        "-font",
        "DejaVu-Sans",

        "-fill",
        "#344054",

        "-pointsize",
        "30",

        "-annotate",
        "+74+405",
        height_text,

        "-annotate",
        "+520+405",
        peers_text,

        "-fill",
        "#667085",

        "-pointsize",
        "23",

        "-annotate",
        "+74+525",
        "sumcoin.space",

        "-quality",
        "92",

        str(output)
    ]

    subprocess.run(
        cmd,
        check=True
    )


en = (
    UI_SOCIAL /
    "explorer.jpg"
)

es = (
    UI_SOCIAL /
    "explorer-es.jpg"
)

build(
    en,
    "Sumcoin Explorer",
    "Live Sumcoin blockchain data",
    "Price",
    "Block",
    "Peers"
)

build(
    es,
    "Explorador Sumcoin",
    "Datos en vivo de la blockchain Sumcoin",
    "Precio",
    "Bloque",
    "Conexiones"
)

(STATIC_SOCIAL / "explorer.jpg").write_bytes(
    en.read_bytes()
)

(STATIC_SOCIAL / "explorer-es.jpg").write_bytes(
    es.read_bytes()
)

print(
    "English card:",
    en
)

print(
    "Spanish card:",
    es
)

print(
    "Price:",
    price
)

print(
    "Height:",
    height
)

print(
    "Connections:",
    connections
)
