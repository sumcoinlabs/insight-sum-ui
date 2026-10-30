#!/usr/bin/env python3

from pathlib import Path
import re
import json


TARGETS = [
    (
        Path("/var/www/sumcoin-static/pages/en/home.html"),
        "en"
    ),
    (
        Path("/var/www/sumcoin-static/pages/es/home.html"),
        "es"
    ),
    (
        Path(
            "/root/explorer/sumcoin-explorer/"
            "node_modules/insight-sum-ui/public/index.html"
        ),
        "en"
    ),
]


def price_from(html):

    patterns = [
        r'SUM\s+\$([0-9][0-9,]*\.[0-9]{2})',
        r'\$([0-9][0-9,]*\.[0-9]{2})\s*USD',
    ]

    for pattern in patterns:

        m = re.search(
            pattern,
            html,
            re.I
        )

        if m:
            return m.group(1)

    return None


def set_title(html, title):

    tag = "<title>%s</title>" % title

    if re.search(
        r'<title\b[^>]*>.*?</title>',
        html,
        re.I | re.S
    ):

        return re.sub(
            r'<title\b[^>]*>.*?</title>',
            tag,
            html,
            count=1,
            flags=re.I | re.S
        )

    return html.replace(
        "</head>",
        tag + "\n</head>",
        1
    )


def set_meta(
    html,
    attr,
    key,
    value
):

    pattern = re.compile(
        r'<meta\b'
        r'(?=[^>]*\b' +
        re.escape(attr) +
        r'=["\']' +
        re.escape(key) +
        r'["\'])'
        r'[^>]*>',
        re.I
    )

    safe = value.replace(
        '"',
        '&quot;'
    )

    tag = (
        '<meta %s="%s" content="%s">'
        % (
            attr,
            key,
            safe
        )
    )

    if pattern.search(html):

        return pattern.sub(
            tag,
            html,
            count=1
        )

    return html.replace(
        "</head>",
        tag + "\n</head>",
        1
    )


def set_language(
    html,
    lang
):

    if re.search(
        r'<html\b[^>]*\blang=',
        html,
        re.I
    ):

        return re.sub(
            r'(<html\b[^>]*\blang=)'
            r'["\'][^"\']*["\']',
            r'\1"' + lang + '"',
            html,
            count=1,
            flags=re.I
        )

    return re.sub(
        r'<html\b',
        '<html lang="%s"' % lang,
        html,
        count=1,
        flags=re.I
    )


def set_links(
    html,
    canonical
):

    html = re.sub(
        r'\s*<link\b'
        r'(?=[^>]*\brel=["\']canonical["\'])'
        r'[^>]*>',
        '',
        html,
        flags=re.I
    )

    html = re.sub(
        r'\s*<link\b'
        r'(?=[^>]*\brel=["\']alternate["\'])'
        r'(?=[^>]*\bhreflang=)'
        r'[^>]*>',
        '',
        html,
        flags=re.I
    )

    block = (
        '\n'
        '  <link rel="canonical" href="%s">\n'
        '  <link rel="alternate" hreflang="en" '
        'href="https://sumcoin.space/">\n'
        '  <link rel="alternate" hreflang="es" '
        'href="https://sumcoin.space/es/">\n'
        '  <link rel="alternate" hreflang="x-default" '
        'href="https://sumcoin.space/">\n'
        % canonical
    )

    return html.replace(
        "</head>",
        block + "</head>",
        1
    )


def update_jsonld(
    html,
    title,
    description,
    lang,
    canonical
):

    pattern = re.compile(
        r'(<script\b[^>]*'
        r'type=["\']application/ld\+json["\']'
        r'[^>]*>)'
        r'(.*?)'
        r'(</script>)',
        re.I | re.S
    )


    def replace(match):

        try:

            data = json.loads(
                match.group(2)
            )

        except Exception:

            return match.group(0)


        if isinstance(data, dict):

            nodes = data.get(
                "@graph",
                []
            )

            if not isinstance(
                nodes,
                list
            ):

                nodes = []


            for node in nodes:

                if not isinstance(
                    node,
                    dict
                ):
                    continue


                if node.get("@type") == "WebPage":

                    node["name"] = title
                    node["description"] = description
                    node["inLanguage"] = lang
                    node["url"] = canonical


        return (
            match.group(1) +
            json.dumps(
                data,
                ensure_ascii=False
            ) +
            match.group(3)
        )


    return pattern.sub(
        replace,
        html
    )


def patch(
    path,
    lang
):

    if not path.exists():

        raise SystemExit(
            "STOP: missing %s"
            % path
        )


    html = path.read_text(
        errors="ignore"
    )

    price = price_from(
        html
    )


    if lang == "es":

        canonical = (
            "https://sumcoin.space/es/"
        )

        if price:

            title = (
                "Precio de Sumcoin Hoy: $%s | "
                "Explorador Blockchain SUM"
                % price
            )

            description = (
                "Precio de Sumcoin (SUM) hoy: $%s USD "
                "desde el Índice Sumcoin. Consulta bloques, "
                "transacciones, direcciones, confirmaciones, "
                "estado de red y API en tiempo real."
                % price
            )

        else:

            title = (
                "Precio de Sumcoin Hoy (SUM) | "
                "Explorador Blockchain"
            )

            description = (
                "Precio de Sumcoin (SUM) hoy desde el Índice "
                "Sumcoin. Consulta bloques, transacciones, "
                "direcciones, confirmaciones, estado de red "
                "y API en tiempo real."
            )


    else:

        canonical = (
            "https://sumcoin.space/"
        )

        if price:

            title = (
                "Sumcoin Price Today: $%s | "
                "SUM Blockchain Explorer"
                % price
            )

            description = (
                "Sumcoin (SUM) price today: $%s USD "
                "from the Sumcoin Index. Explore live blocks, "
                "transactions, addresses, confirmations, "
                "network status and API."
                % price
            )

        else:

            title = (
                "Sumcoin Price Today (SUM) | "
                "Live Blockchain Explorer"
            )

            description = (
                "Sumcoin (SUM) price today from the Sumcoin Index. "
                "Explore live blocks, transactions, addresses, "
                "confirmations, network status and API."
            )


    html = set_language(
        html,
        lang
    )

    html = set_title(
        html,
        title
    )

    html = set_meta(
        html,
        "name",
        "description",
        description
    )

    html = set_meta(
        html,
        "property",
        "og:title",
        title
    )

    html = set_meta(
        html,
        "property",
        "og:description",
        description
    )

    html = set_meta(
        html,
        "property",
        "og:url",
        canonical
    )

    html = set_meta(
        html,
        "name",
        "twitter:title",
        title
    )

    html = set_meta(
        html,
        "name",
        "twitter:description",
        description
    )

    html = set_links(
        html,
        canonical
    )

    html = update_jsonld(
        html,
        title,
        description,
        lang,
        canonical
    )

    path.write_text(
        html
    )


    print()
    print(
        "PATCHED:",
        path
    )

    print(
        "LANG:",
        lang
    )

    print(
        "PRICE:",
        price or "not found"
    )

    print(
        "TITLE:",
        title
    )

    print(
        "DESCRIPTION:",
        description
    )

    print(
        "CANONICAL:",
        canonical
    )


for path, lang in TARGETS:

    patch(
        path,
        lang
    )
