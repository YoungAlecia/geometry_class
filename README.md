# Geometry Honors — Lab, Calculators &amp; Lesson Toolkit

A polished, static classroom companion site for an Honors Geometry course. It pairs an embedded **GeoGebra** sketchpad with a modular library of **live calculators** (area, perimeter, circumference, volume) for triangles, trapezoids, circles, and spheres — and ships with a step-by-step **Lesson Integration Guide** so teachers can swap GeoGebra materials in under a minute.

No build step, no framework, no backend.

---

## File tree

```
geometry-honors-site/
├── index.html      # Markup: nav, hero, GeoGebra lab, calculators, guide, table
├── styles.css      # Design system, layout, responsive rules
├── script.js       # GeoGebra loader + modular calculator library + UI
└── README.md       # This file
```

---

## Run locally

The page embeds the GeoGebra applet by loading `https://www.geogebra.org/apps/deployggb.js`. Any static file server works; the simplest options:

```bash
# Python (built-in)
cd geometry-honors-site
python3 -m http.server 8000
# then open http://localhost:8000

# OR Node
npx serve .
```

Opening `index.html` directly via `file://` will still render the layout and calculators, but **GeoGebra will refuse to load** because of mixed-protocol restrictions — always serve over `http(s)`.

---

## Features

### 1. Main navigation
Sticky header with five sections: **Home**, **GeoGebra Lab**, **Calculators**, **Lesson Integration Guide**, **Formula Reference**. The active section is highlighted using `IntersectionObserver`. A hamburger menu appears below 720 px.

### 2. Embedded GeoGebra graphing window
A `<div id="ggb-element">` mount is hydrated by `deployggb.js` via the standard `new GGBApplet(params, true).inject('ggb-element')` pattern. The default material ID `RHYH3UVE` is a clearly labelled placeholder.

The lab toolbar also exposes:
- an **App selector** (Graphing / Geometry / 3D / Classic / Suite)
- a **Reload applet** button
- a status badge showing the current material and app

If `deployggb.js` cannot load, the mount displays a graceful fallback message.

### 3. Modular calculator library
`script.js` defines a single `GeometryCalculators` object with one entry per shape:

```js
GeometryCalculators.triangle.compute({ base: 10, height: 6, sideA: 5, sideC: 7 });
// → { results: { area: 30, perimeter: 22 }, error: null }
```

Each entry exposes:
- `requires` — minimum inputs needed
- `compute(values)` — pure function returning `{ results, error }`

Shapes implemented:

| Shape     | Quantities                  |
| --------- | --------------------------- |
| Triangle  | Area, Perimeter             |
| Trapezoid | Area, Perimeter             |
| Circle    | Area, Circumference         |
| Sphere    | Volume, Surface area        |

The library is exposed as `window.GeometryCalculators` for ad-hoc testing in DevTools.

### 4. Live UI with validation
- Inputs update results on every `input` event (no submit button).
- Negative numbers and non-numeric entries flag the field with `aria-invalid="true"` and a contextual error message under the inputs.
- Triangle inputs also validate the **triangle inequality** when all three sides are supplied.
- Each result animates briefly when it changes (respecting `prefers-reduced-motion`).
- Every formula stays visible above its inputs.

### 5. Lesson Integration Guide
A numbered, five-step guide explains how to swap in any GeoGebra material:
1. Find a material at geogebra.org/materials.
2. Copy the alphanumeric **material ID** from the `/m/<ID>` URL.
3. Paste it in **either**
   - the in-page **Quick Swap** tool (validates input, reloads the Lab immediately, scrolls user to it), **or**
   - directly into `GGB_CONFIG.materialId` in `script.js`.
4. Optional fallback iframe snippet for stubborn materials.
5. Verify in class.

### 6. Polished design
- **Palette**: chalkboard-notebook — deep navy ink, warm cream paper, brass accent.
- **Type**: Fraunces (display serif) + Inter (UI) + JetBrains Mono (math/code).
- **SVG**: custom inline logo (triangle circumscribing a compass circle), favicon variant, and a decorative geometric hero figure with a grid pattern.
- **Accessibility**: skip link, semantic landmarks, `:focus-visible` rings, `aria-invalid`, `role="alert"` errors, keyboard-operable nav and swap-tool, reduced-motion media query.
- **Responsive**: fluid container, mobile nav, calculator grid collapses to a single column, calculator inputs stack at narrow widths.

---

## How teachers swap activities

The fastest path:

1. Open the page.
2. Scroll to **Lesson Integration Guide → Option A**.
3. Paste a material ID (e.g. `dwxd6tcv`), pick the app, press **Load in Lab**.
4. The page scrolls back to the Lab and the new sketch loads.

For a permanent default, change one line in `script.js`:

```js
const GGB_CONFIG = {
  materialId: 'YOUR_ID',   // ← change here
  appName:    'graphing',
  ...
};
```

---

## QA performed

Manual functional testing was done in a headless browser harness against the calculator library (`script.js` is a single self-contained IIFE). Test cases run:

| Case                          | Input                          | Expected                       | Result   |
| ----------------------------- | ------------------------------ | ------------------------------ | -------- |
| Triangle area                 | b=10, h=6                      | area = 30                      | ✓        |
| Triangle perimeter            | a=3, b=4, c=5                  | perimeter = 12                 | ✓        |
| Triangle inequality           | a=1, b=1, c=10                 | error message                  | ✓        |
| Trapezoid area                | a=4, b=6, h=5                  | area = 25                      | ✓        |
| Trapezoid perimeter           | a=4, b=6, c=3, d=3             | perimeter = 16                 | ✓        |
| Circle                        | r=5                            | A=78.540, C=31.416             | ✓        |
| Sphere                        | r=3                            | V=113.097, S=113.097           | ✓        |
| Negative input rejection      | r = -2                         | error message                  | ✓        |
| Empty-state rendering         | all fields blank               | results show em dash           | ✓        |

The GeoGebra applet was verified to load over `http://localhost:8000` against the default material; the fallback path was verified by temporarily blocking `deployggb.js`.

---

## License notes

The site links to GeoGebra under the terms of the public GeoGebra license. The custom code in this folder is provided as a teaching template — adapt freely for classroom use.
