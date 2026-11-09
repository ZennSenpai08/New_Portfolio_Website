# Romcill Aquino portfolio

Buildless HTML, CSS, and JavaScript. All project files live in this
`romcill_portfolio` folder. Open `index.html` directly or use the local server.

## Preview locally

From this folder, run:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173`. Stop the server with Ctrl+C.

## Check changes

```powershell
node --check script.js
node tests/check-site.mjs
```

The dependency-free checks cover local resource references, internal anchors,
unique IDs, external link attributes, the CV email action, menu interactions,
Escape focus restoration, breakpoint reset, clipboard success/failure, and
scroll-animation lifecycle and reduced-motion behavior.
Interaction checks use DOM stubs; they do not verify browser layout or native
clipboard permissions.

## Latest design pass — November 9, 2026

- Consolidated the site, tests, documentation, and original Git metadata into
  `romcill_portfolio`; removed the old folders and separate refinement stylesheet.
- Added a midnight-teal background, sea-glass mint, warm gold accents, and soft gradients.
- Added staggered hero entrances, on-scroll reveals, and subtle card/link hover effects.
- Respected reduced-motion settings, including changes made while the page is open.
- Increased body text, metadata, and link sizes for readability.
- Added consistent project card spacing and borders; stacked them on smaller screens.
- Hid the menu toggle on desktop and added narrow-phone layout adjustments.
- Replaced the disabled CV download with a working email request link.
- Added outside-click dismissal to the mobile menu.

`styles.css` contains all styles, including responsive, print, and reduced-motion
rules. `script.js` adds navigation, clipboard, and one-time reveal animations.
Content stays readable without JavaScript or animation API support.

JavaScript syntax, automated checks, and local HTTP responses passed. Browser
visual QA could not run because the browser access host was unavailable.
Pending visual checks: 320, 390, 768, and 1440 px widths; no horizontal overflow;
mobile menu and project disclosures; keyboard focus; 200% zoom; reduced motion.
These edits are local and have not been published.
