# Arifa Pack website

The Arifa Pack site, rebuilt on the agreed stack:
**Next.js + React + TypeScript**, with **Three.js (React Three Fiber), GSAP and Lenis** for 3D and motion, hosted on **Vercel**.

It looks and moves exactly like the approved prototype — the same pages, sections, 3D scenes, animations, assistant and styles — but the code is now organised the way a Next.js project is expected to be.

---

## Run it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install          # once, to download the libraries
npm run dev          # start the site → open http://localhost:3000
```

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Builds the production site (also checks every TypeScript file for mistakes) |
| `npm start` | Runs the built site, exactly as Vercel will |
| `npm run typecheck` | Only the TypeScript check |
| `npm run lint` | Checks the code for common problems |

**The AI assistant (optional):** copy `.env.example` to `.env.local` and paste an Anthropic API key. Without a key the assistant still works, using its built-in scripted salesperson.

## Put it online (Vercel)

1. Push this folder to a GitHub repository.
2. On [vercel.com](https://vercel.com) → **Add New → Project** → pick the repository. Vercel recognises Next.js by itself; no settings to change.
3. Optional: **Settings → Environment Variables** → add `ANTHROPIC_API_KEY` for the live AI assistant.
4. Every push gets its own preview link; the main branch is the live site.

The prototype's old addresses (`/products.html`, `/about.html` …) forward automatically to the new ones (`/products`, `/about` …).

---

## How the project is organised

```
arifa-pack-website/
├── public/                  Images and video, served as-is (/images/…, /media/…)
├── src/
│   ├── app/                 THE ADDRESSES — English in (en)/, Arabic in (ar)/ar/
│   │   ├── (en)/layout.tsx    the outer HTML of the English pages  (<html lang="en">)
│   │   ├── (en)/page.tsx      Home            → /          (and products/, about/, quality/, clients/, contact/)
│   │   ├── (ar)/layout.tsx    the outer HTML of the Arabic pages   (<html lang="ar" dir="rtl">)
│   │   ├── (ar)/ar/page.tsx   الرئيسية        → /ar        (and /ar/products, /ar/about …)
│   │   └── api/assistant/     the AI assistant's server endpoint
│   │
│   ├── views/               THE PAGES — one file per page, shared by both languages
│   │   └── home.tsx, products.tsx, about.tsx, quality.tsx, clients.tsx, contact.tsx
│   │
│   ├── i18n/                ARABIC — ar.ts (page text), ar-client.ts (text written by scripts)
│   │
│   ├── sections/            EACH PAGE'S PARTS — one folder per page
│   │   └── home/              Hero.tsx (what you see)  +  hero.ts (how it moves)
│   │                          … and start.ts, which starts that page's motion
│   │
│   ├── components/site/     PARTS ON EVERY PAGE — Nav, Menu, Footer, Loader, Assistant, PageShell
│   ├── motion/              SHARED MOTION — smooth scroll (Lenis), loader, reveals, nav (GSAP)
│   ├── three/               3D — SceneCanvas (React Three Fiber), quality settings, the scenes
│   ├── assistant/           THE VOICE ASSISTANT — what it says, hears and does
│   ├── data/                CONTENT — catalogue.json, clients.json, company details
│   ├── lib/                 Small helpers (browser checks, enquiry list, Ajman clock)
│   └── styles/              The stylesheets (plain CSS, one file per page — see "Why plain CSS")
└── README.md                you are here
```

### The idea in one picture

```
 src/views/about.tsx             ← the page: lists its sections, title, description
                                   (src/app/(en)/about and src/app/(ar)/ar/about both show it)
   └── <PageShell page="about">  ← loader, nav, menu, footer, assistant around it
         <AboutStage/> <Reach/>…  ← src/sections/about/*.tsx: the HTML, built by React on the server
         <PageScripts/>           ← in the browser, runs src/sections/about/start.ts:
                                     smooth scroll + GSAP animations + 3D scenes on top of that HTML
```

React builds every page **on the server**, so pages open fast and Google can read every word and every product. Once in the browser, the page's `start.ts` brings it to life — the same motion code as the prototype, now in TypeScript.

---

## Where do I change…?

| I want to change… | Edit this |
| --- | --- |
| A product, a code or a pack size | `src/data/catalogue.json` |
| A product photo | Put `public/images/catalogue/<product id>.webp` in place — it's picked up automatically |
| Phone numbers, email, address, opening hours | `src/data/site.ts` |
| The menu, header or footer links | `src/data/site.ts` |
| Client logos, industries, customer stories | `src/data/clients.json` (+ logos in `public/images/clients/`) |
| A page's title or Google description | the `metadataFor` at the top of `src/views/<page>.tsx` (Arabic: `src/i18n/ar.ts`) |
| Any Arabic wording | `src/i18n/ar.ts` (pages) or `src/i18n/ar-client.ts` (counters, buttons, the assistant) |
| The words in a section | `src/sections/<page>/<Section>.tsx` |
| How a section animates | `src/sections/<page>/<section>.ts` (lower-case file next to it) |
| Colours, spacing, fonts | `src/styles/main.css` (the `:root` variables at the top) |
| 3D quality on weak phones | `src/three/quality.ts` |
| What the AI assistant knows | `src/assistant/server/prompt.ts` |

---

## Arabic (/ar)

Every page exists twice: in English at `/products`, and in Arabic, right to left, at `/ar/products`. The header has an **EN | عربي** switch that keeps the visitor on the same page (filters and all). Google is told about both versions (`hreflang` on every page, both in `/sitemap.xml`).

How it works:

- The English text in the components is the key: `{t("Request a quote")}` shows "Request a quote" on English pages and `اطلب عرض سعر` on Arabic ones, looked up in **`src/i18n/ar.ts`**. Links go through `lh("/products")`, which adds `/ar` on Arabic pages.
- Text the browser scripts write (the Ajman clock, the catalogue counter, quick view, the enquiry desk, the assistant) uses `tc()` and **`src/i18n/ar-client.ts`**.
- The catalogue and clients content (`catalogue.json`, `clients.json`) is translated as it's read: product names, families, pack sizes. Codes and numbers stay as they are.
- Right-to-left layout comes from `<html dir="rtl">`; the few things that need help (Arabic font, no letter-spacing, arrows, phone numbers, the about-page 3D, sideways tracks) are in **`src/styles/rtl.css`**.
- The assistant speaks and listens in Arabic on `/ar` (browser voices permitting), understands Arabic product words, and with an API key Claude answers in Arabic.
- Adding new English text? Wrap it in `t("…")` and add the Arabic to `src/i18n/ar.ts` — anything without an entry simply stays in English.

The enquiry email that reaches the packaging team keeps its English field labels, so the team reads every enquiry the same way.

---

## The stack, file by file

| Part | Technology | Where it lives |
| --- | --- | --- |
| Language | **TypeScript** | every `.ts` / `.tsx` file. Content shapes (products, families, clients…) are in `src/data/types.ts`. |
| Interface | **React** | `.tsx` files. Shared parts — header, product card, quick view, family panels — are written once and reused. |
| Framework | **Next.js** (App Router) | `src/app/`. Pages are pre-built at deploy time; the assistant runs as a server route. |
| 3D | **Three.js** with **React Three Fiber** | `src/three/`. `SceneCanvas.tsx` puts each 3D canvas on the page; `quality.ts` lowers quality on weak phones in one place. |
| Animation | **GSAP** (ScrollTrigger, SplitText, Flip, DrawSVG, ScrambleText) | `src/motion/` and the `*.ts` files in `src/sections/`. |
| Smooth scroll | **Lenis** | `src/motion/smoothScroll.ts` |
| Hosting | **Vercel** | nothing to configure — see "Put it online". |

### How the 3D works

Each 3D area on a page is a `<SceneCanvas name="…" />` (React Three Fiber). It creates the WebGL renderer with that scene's settings from `src/three/quality.ts` — pixel density, antialiasing — so **"lower quality on weak phones" is one decision for the whole site**. The page's script then builds the hand-tuned Three.js scene (`src/three/scenes/`) on that renderer and draws it on GSAP's clock, so 3D and scrolling never drift apart. Without WebGL, each section shows its photo/film fallback, as before.

| Scene | Page | File |
| --- | --- | --- |
| Dots that become products | Home hero, About | `three/scenes/DotField.ts` |
| The press forming a container | Home · The line | `three/scenes/PressScene.ts` |
| Media plate following the cursor | Home · Product range | `three/scenes/RangeReveal.ts` |
| Factory folding into the world map | About · Reach | `three/scenes/ReachScene.ts` |
| The delivery town | Clients | `three/scenes/DeliveryScene.ts` |

### Moving between pages

Links between pages are ordinary links (a full page load), on purpose: the loader's curtain plays between pages and the assistant carries the conversation from one page to the next — exactly as approved in the prototype.

---

## What changed from the prototype

* **Vite + HTML pages → Next.js + React.** Each `.html` page is now `src/app/<page>/page.tsx`, split into one component per section. The `partials/` (loader, nav, footer, assistant) are React components in `src/components/site/`.
* **Build scripts → React components.** The old `build/renderCatalogue.js` and `build/renderClients.js` (which wrote product cards and client logos into the HTML) are now components such as `ProductCard.tsx`, `ProductGrid.tsx`, `RouteStops.tsx`.
* **JavaScript → TypeScript.** All code is TypeScript and checked on every build.
* **3D canvases → React Three Fiber**, with the quality settings in one place (`src/three/quality.ts`).
* **The assistant's endpoint** (`build/assistantApi.js`, dev-server only) is now a real server route (`src/app/api/assistant/route.ts`), so the live AI works in production on Vercel too.
* **Addresses:** `/products.html` → `/products` and so on (old addresses redirect).
* **Removed unused code** from the prototype that no page loaded: an earlier hero (`HeroOrbit`, `heroPhotography`, `heroStudio`, `leafMark`), an earlier line scene (`FormingLine`), an unused hero conversation (`heroVoice`) and its styles.
* Second clean-up pass: 15 unused functions and constants, about 50 lines of CSS for an old hero and quote form that no page shows, and 21 media files no page loads (17.6 MB — moved to `_unused-assets/`, which is not served or committed; delete it once you're happy).
* Company details and navigation links are now in one file (`src/data/site.ts`) instead of repeated in each page.

## Why plain CSS (and not Tailwind)

The styles are the approved prototype's own hand-tuned CSS (about 3,700 lines, one file per page). The page scripts find elements by these class names and switch states on them (`is-active`, `is-open`…) in over 200 places, and many effects are driven from JavaScript through CSS variables (`--lvl`, `--p`, `--mx`). Rewriting it all as Tailwind utilities would not change how the site looks, but every page would need re-checking. Tailwind works fine with Next.js, so it can be added later for **new** pages and components, side by side with this CSS.

## Before launch

* `src/data/clients.json` is **sample content** (logos, industries, stories) and shows "Sample" tags until replaced with approved material.
* The product film (`public/media/arifa-film.mp4`, 33 MB) is served as a plain file. The agreed plan is a streaming service (for example Mux) so it plays at the right quality for each visitor's connection — swap the `src` in `src/sections/home/FilmPlayer.tsx` when that is set up.
* TypeScript runs in standard mode (`tsconfig.json`). Turning on `"strict": true` later will ask for more detailed types in the animation and 3D code.
