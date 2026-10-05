# Sumcoin Insight UI Work — September 28, 2026

## Purpose

This document records the production Sumcoin Insight UI work identified during the September 28, 2026 explorer audit.

The changes were developed and tested on the production explorer before being carefully moved back into source control.

Production explorer:

`/root/explorer/sumcoin-explorer`

Production UI package:

`/root/explorer/sumcoin-explorer/node_modules/insight-sum-ui`

Installed UI version:

`0.4.8`

Original GitHub baseline:

`b59e128` — package bump 0.4.8

Upstream branch prepared from that baseline:

`explorer-ui-production-2026`

## Related backend work

Two dependent backend updates were upstreamed first.

### bitcore-node-sumcoin

PR:

`sumcoinlabs/bitcore-node-sumcoin#1`

Merged October 5, 2026.

Merge commit:

`15a59ed2f982f52010be7c5fc06b5be58637af45`

This added correct Sumcoin Proof-of-Stake coinstake detection and restricted the Insight web backend to localhost.

### insight-sum-api

PR:

`sumcoinlabs/insight-sum-api#4`

Merged October 5, 2026.

Merge commit:

`8c1bd116f64c936c3d511905de653be9804acb0d`

This added expanded currency handling, live Core connection count/status reporting and proper coinstake reward presentation.

The UI changes documented here sit on top of those backend changes.

## Source audit

A clean GitHub clone was compared recursively against the UI package actually running on the production explorer.

The audit deliberately separated:

- real source changes
- static assets
- tracked compiled assets
- npm installation metadata
- generated build intermediates
- dynamic SEO output
- runtime-generated files

The live package was NOT copied wholesale.

## Payment and address UX

`public/src/js/controllers/address.js`

and:

`public/views/address.html`

contain substantial production payment UX improvements.

The address/payment view can detect an incoming transaction and display a payment notification showing:

- incoming SUM amount
- current USD value
- waiting-for-confirmation state

After the first confirmation the presentation changes to a successful payment state showing:

- Payment received
- the same SUM amount
- corresponding USD value
- confirmation count

The success presentation automatically dismisses after approximately ten seconds and can also be manually closed.

## Payment audio

Sound handling is centralized in:

`public/src/js/app.js`

through the global production sound state:

`window.SumcoinSound`

The two sounds are:

`/sound/transaction.mp3`

for an incoming transaction, and:

`/sound/success-notification.mp3`

for confirmation/success.

`transaction.mp3` already existed in the repository.

`success-notification.mp3` is a new production asset included with this update.

The payment page includes the user-facing control:

`Want to hear your TX?`

Sound defaults OFF on a new full page load.

A user must explicitly enable it, which also primes browser audio playback.

The setting persists across Angular route changes during that page session through `window.SumcoinSound`, but it intentionally does not persist across a complete browser reload.

This behavior is intentional and should not be casually rewritten.

## Homepage transaction behavior

`public/src/js/controllers/index.js`

contains production changes to the homepage latest transaction stream.

The homepage maintains a concise list of recent activity, incorporates socket events, avoids duplicates and limits the visible transaction set.

## Currency support

Production currency behavior spans:

- `public/src/js/controllers/currency.js`
- `public/views/includes/currency.html`
- supporting translation/configuration code

The frontend consumes the expanded rates array supplied by the updated `insight-sum-api`.

Currency handling includes robust display symbols, ordering, locale handling and user selection behavior.

## Proof-of-Stake transaction display

Transaction UI files were updated to understand the API's Sumcoin coinstake fields.

Relevant files include:

- `public/src/js/controllers/transactions.js`
- `public/views/transaction.html`
- `public/views/transaction/tx.html`

Coinstake rewards are presented as staking rewards rather than negative fees.

This depends on the upstream bitcore-node and insight-sum-api changes referenced above.

## Network status

Production status presentation was updated through:

- `public/src/js/controllers/status.js`
- `public/views/status.html`

The backend now reports the actual Core connection count and uses Sumcoin-specific `sumcore node` terminology.

## QR scanner

The source `public/index.html` contains the scanner modal shell.

Production improved the original scanner significantly.

The scanner now supports:

- live camera scanning where browser security permits it
- HTTPS-aware camera behavior
- selecting a saved QR image
- clearer status/error messages
- Sumcoin-specific QR wording
- cleaner scanner presentation

The production `public/index.html` itself is dynamically rewritten by the SEO system and therefore was NOT copied wholesale.

Instead, the scanner modal and footer shell were selectively transferred into the clean GitHub source index.

## Language and Spanish support

The production explorer contains expanded Spanish support.

New localized views include:

- `public/views/index_es.html`
- `public/views/api_docs_es.html`
- `public/views/messages_verify_es.html`
- `public/views/transaction_sendraw_es.html`

Language-aware footer links and route behavior were also updated.

`public/src/js/translations.js` differs from the original repository and is preserved as part of the production UI.

Important build note:

The repository's full `grunt compile` task runs `nggettext_compile` before concatenation.

The production audit did not identify matching changes under `po/`.

Therefore, when reproducing the currently deployed production JavaScript, prefer:

`grunt concat:main uglify:main`

rather than blindly running the full compile task until translation source files have been reviewed.

## API documentation and tools

Production added or improved:

- API documentation
- signed-message verification
- raw transaction broadcasting
- search behavior
- QR scanning
- block presentation
- transaction presentation

Relevant views and controllers are included in this branch.

## Branding

Production branding assets include:

- `/favicon.ico`
- `/img/icons/favicon.ico`
- `/img/icons/apple-touch-icon.png`
- `/img/icons/sumcoin-logo-192.png`
- `/img/icons/sumcoin-logo-512.png`
- `/site.webmanifest`

The clean source `public/index.html` references the stable favicon, touch icon and manifest assets.

## CSS architecture

The canonical CSS source is:

`public/src/css/common.css`

Grunt builds CSS using:

`public/lib/bootstrap/dist/css/bootstrap.min.css`

plus:

`public/src/css/**/*.css`

into:

`public/css/main.css`

and then minifies that into:

`public/css/main.min.css`

The production package also contains:

`public/css/sumcoin-custom.css`

That file is not referenced by the application or index and is not part of the Grunt CSS input.

It is intentionally NOT included in this upstream change.

The actual production styling belongs in the canonical source stylesheet and tracked minified output.

## JavaScript build architecture

The canonical application JavaScript input is:

- `public/src/js/app.js`
- `public/src/js/controllers/*.js`
- `public/src/js/services/*.js`
- `public/src/js/directives.js`
- `public/src/js/filters.js`
- `public/src/js/config.js`
- `public/src/js/init.js`
- `public/src/js/translations.js`

Grunt concatenates these into:

`public/js/main.js`

and minifies that into:

`public/js/main.min.js`

The repository tracks `main.min.js`.

The production npm package also contains the generated intermediate `main.js` and expanded copied JS tree. Those generated/intermediate files are intentionally excluded from this PR.

## SEO architecture

The production explorer has a separate SEO generation/postprocessing system outside this npm repository.

The production postprocessor explicitly targets:

`node_modules/insight-sum-ui/public/index.html`

as well as static English and Spanish pages.

It dynamically updates:

- live Sumcoin price title
- meta description
- canonical URL
- hreflang links
- Open Graph data
- Twitter metadata
- JSON-LD
- language metadata

Additional scripts generate:

- `seo/live.json`
- social preview cards
- `sitemap.xml`
- supporting sitemap files
- static search-engine-facing pages

Because these are generated/runtime deployment artifacts, the live 13,000+ line `public/index.html` was NOT committed as source.

The following production runtime artifacts are intentionally excluded:

- `public/seo/`
- `public/social/`
- `public/sitemap.xml`
- `public/sitemap-live.xml`
- `public/sitemap-pages.xml`
- `public/sitemap.xsl`

The source `public/index.html` remains a small Angular shell.

## robots.txt

`public/robots.txt` is intentionally updated.

The production version:

- allows normal indexing
- blocks `/socket.io/`
- advertises `https://sumcoin.space/sitemap.xml`

This replaces the old rules that prevented search engines from crawling address, API and transaction paths.

## Files intentionally excluded

The following are not being upstreamed as production source:

### npm/package artifacts

- npm-modified `package.json`
- repository `.gitignore` / `.npmignore` differences
- installation metadata

### generated JavaScript

- `public/js/main.js`
- copied `public/js/app.js`
- copied `public/js/config.js`
- copied `public/js/controllers/`
- copied `public/js/services/`
- copied `public/js/directives.js`
- copied `public/js/filters.js`
- copied `public/js/init.js`
- copied `public/js/translations.js`
- `public/js_bak/`

Canonical source remains under `public/src/js`.

### generated CSS

- `public/css/main.css`
- `public/css/sumcoin-custom.css`

### dynamic SEO/runtime output

- `public/seo/`
- `public/social/`
- generated sitemap files
- dynamically expanded production `public/index.html`

### unrelated legacy difference

`sumcore-node/index.js`

was found to differ only by two old commented-out lines from 2023.

Those comments have no runtime effect and are intentionally excluded.

## Tracked compiled outputs

The repository already tracks:

- `public/js/main.min.js`
- `public/css/main.min.css`

The currently deployed production versions of those tracked build outputs are included so the repository matches the production application without requiring an immediate build after checkout.

## Validation

Before merging this work, validate at minimum:

`git diff --check`

and JavaScript syntax using `node --check`.

The source/index file should remain small and must not contain the dynamic production SEO snapshot.

The final PR should be reviewed to confirm no runtime SEO directories, npm metadata, backups or generated intermediate files were accidentally included.

## Production safety

Preparing and merging this repository branch does not itself modify or restart the running explorer.

The production explorer remains the known-good deployment while its working changes are being moved upstream.

Do not replace the live npm package wholesale from GitHub without separately planning and testing deployment.
