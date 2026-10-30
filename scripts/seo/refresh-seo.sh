#!/bin/bash
set -Eeuo pipefail

ROOT="/root/explorer/sumcoin-explorer"
UI="$ROOT/node_modules/insight-sum-ui/public"
STATIC="/var/www/sumcoin-static"

exec 9>/tmp/sumcoin-seo-refresh.lock

if ! flock -n 9; then
  exit 0
fi

READY=0

for i in $(seq 1 12); do

  if curl -fsS -m 5 \
    http://127.0.0.1:3001/api/sync \
    >/dev/null 2>&1
  then
    READY=1
    break
  fi

  sleep 5
done

if [ "$READY" -ne 1 ]; then
  echo \
  "SEO refresh skipped: backend unavailable $(date -u '+%FT%TZ')"
  exit 0
fi


if ! python3 \
  "$ROOT/scripts/refresh-seo.py"
then

  echo \
  "SEO refresh skipped after API error $(date -u '+%FT%TZ')"




  exit 0
fi




# SUMCOIN DYNAMIC SOCIAL CARDS
python3 \
  "$ROOT/scripts/build-social-cards.py"

VERSION="$(
python3 -c "
import json
d=json.load(open('$UI/seo/live.json'))
print(int(__import__('time').time()))
"
)"



mkdir -p \
"$UI/social" \
"$STATIC/social"






cp -f \
"$UI/social/explorer.jpg" \
"$STATIC/social/explorer.jpg"

cp -f \
"$UI/social/explorer-es.jpg" \
"$STATIC/social/explorer-es.jpg"

cp -f \
"$UI/sitemap.xml" \
"$STATIC/sitemap.xml"

cp -f \
"$UI/robots.txt" \
"$STATIC/robots.txt"

chmod 644 \
"$STATIC/social/explorer.jpg" \
"$STATIC/social/explorer-es.jpg" \
"$STATIC/sitemap.xml" \
"$STATIC/robots.txt"


echo \
"SEO EN/ES refreshed: $(date -u '+%FT%TZ')"


# SUMCOIN ADVANCED SITEMAPS
python3 \
  "$ROOT/scripts/build-sitemaps.py"

# SUMCOIN SEARCH SEO POSTPROCESS START
/root/explorer/sumcoin-explorer/scripts/seo-search-postprocess.py
# SUMCOIN SEARCH SEO POSTPROCESS END
