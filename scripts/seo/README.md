# Sumcoin Explorer SEO automation

The production cron job runs every five minutes.

Source scripts are maintained in this directory. The production
/root/explorer/sumcoin-explorer/scripts/*.py and refresh-seo.sh
are symbolic links to these version-controlled files.

index-template.html is the stable input for refresh-seo.py.
Do not manually modify the generated public/index.html.

Generated runtime outputs include public/index.html,
public/seo/live.json, public/sitemap*.xml and social cards.

When updating the browser JavaScript cache version, edit
index-template.html, not the generated HTML.

The scripts still use their original production paths.
