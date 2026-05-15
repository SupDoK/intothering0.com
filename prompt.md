# Claude Code Prompt: Build a Static Cybersecurity Blog (Astro + GitHub Pages)

## Goal

Build a complete, production-ready personal blog called intothering0.com using **Astro** and deploy it to **GitHub Pages** via **GitHub Actions**. The blog covers Windows Internals, Malware Development (MalDev), and Cybersecurity in general. I will add new articles by dropping a `.md` file into a content folder and running `git push` — nothing else. The GitHub Action must take care of building and publishing.

Generate every file needed and place them in the current working directory so I can `git init`, commit, and push to my repo.

---

## Tech Stack (non-negotiable)

- **Astro** (latest stable, static output, no SSR)
- **TypeScript** for config and components where Astro supports it
- **Content Collections** for the blog posts
- **Vanilla CSS** (no Tailwind, no UI frameworks) — keep dependencies minimal
- **GitHub Actions** for CI/CD
- **GitHub Pages** as the host (deploy from the official `actions/deploy-pages` action, not a `gh-pages` branch)

---

## Site Structure

Exactly three pages — no categories, no tags pages, no submenus:

1. **Home (`/`)** — paginated list of articles, **10 per page**, with a page counter at the bottom (e.g. `← Prev | Page 2 of 5 | Next →`). Each list item shows title, date, and a short description.
2. **About (`/about`)** — a simple about-me page with placeholder text I can edit later.
3. **External GitHub link** in the nav bar (opens in a new tab) — placeholder URL `https://github.com/YOUR_USERNAME`, with a clear `// TODO` comment so I can find it.

Nav bar: just `Home`, `About`, `GitHub`. That's it.

---

## Content Workflow

- Articles live in `src/content/posts/` as `.md` files.
- Define an Astro **content collection** with a Zod schema enforcing this frontmatter:
  ```yaml
  ---
  title: "Hooking NtCreateFile"
  date: 2026-05-14
  description: "A quick walkthrough of inline hooking in user-mode."
  draft: false  # optional, defaults to false
  ---
  ```
- Posts with `draft: true` must be excluded from the list and not built.
- The slug is derived from the filename (e.g. `hooking-ntcreatefile.md` → `/posts/hooking-ntcreatefile/`).
- Sort the list by `date` descending.
- Create **2–3 example markdown posts** with realistic placeholder content on Windows internals / maldev topics so I can see pagination working. Vary the dates.
- Each post renders at `/posts/[slug]/` with: title, date, rendered markdown body, and a "← Back to all posts" link at the bottom.

Markdown should support code blocks with syntax highlighting. Use Astro's built-in Shiki integration with a dark theme (`github-dark` or similar) that fits the red/black palette.

---

## Visual Theme

**Palette** — dark, sharp, readable. Use CSS custom properties so I can tweak later:

```css
--bg:           #0a0a0a;   /* near-black background */
--bg-elevated:  #141414;   /* cards, nav */
--text:         #e8e8e8;   /* primary text */
--text-muted:   #8a8a8a;   /* dates, meta */
--accent:       #c41e3a;   /* dark red — links, hovers */
--accent-bright:#e63946;   /* hover/focus highlight */
--border:       #2a1416;   /* subtle dark-red-tinted borders */
```

**Typography:** clean sans-serif for UI (Inter or system stack), monospace for code (JetBrains Mono via Google Fonts or the system mono stack). Generous line-height for readability (1.7 in article bodies).

Keep it **neat and professional**, not gimmicky. Think "infosec researcher's notebook," not "edgy hacker landing page." No skull icons, no Matrix rain, no glitch text overlays on body content.

---

## The Shattered Glass Effect (Hero, Home Page Only)

This is the centerpiece. It must:

- Live in a **hero section at the top of the home page** (above the article list). The article list stays clean and readable below it.
- Render a **shattered glass illustration** using **inline SVG** (not an image file) so it scales and the shards can be manipulated individually.
- The shards must **react dynamically to mouse position** with a parallax-like effect: as the cursor moves across the viewport, individual shards translate and rotate by small amounts, with shards at different "depths" moving at different rates. Reference the aesthetic of the image I uploaded — frozen explosion of glass, light catching on edges.
- Use a `mousemove` listener on the hero container. Compute normalized cursor offset from center (`-1` to `1` on each axis). Apply per-shard transforms via CSS variables (`--mx`, `--my`) and per-shard depth multipliers stored as data attributes.
- Use `requestAnimationFrame` for smooth updates, and a small ease/lerp toward the target so motion feels fluid, not twitchy.
- **Respect `prefers-reduced-motion`** — if set, the shards render statically.
- Disable the mouse effect on touch devices (or fall back to a subtle device-orientation effect, but mouse-disabled is fine).
- Style: pale blue-white shards with thin red highlight edges, against the dark background. Faint radial glow behind the shatter point. The site title (something like "// Shards" or just my name — leave a clear `// TODO` placeholder) sits over or beside the shatter.
- Hand-author **at least 15–25 shards** as `<polygon>` elements with varied shapes, opacities, and depth values. Don't generate them randomly at build time — they should be deterministic and look composed.

This is the single piece of code where I want some craft. Take time on it.

---

## Pagination

- Use Astro's built-in pagination via `getStaticPaths({ paginate })`.
- Route: `/` for page 1, `/page/2/`, `/page/3/`, etc.
- Bottom of the list shows: `← Previous` (disabled/hidden on page 1), `Page X of Y`, `Next →` (disabled/hidden on last page).
- Style the pagination controls in the accent red, with hover states.

---

## GitHub Actions Workflow

Create `.github/workflows/deploy.yml` that:

- Triggers on `push` to `main` and on `workflow_dispatch`.
- Uses the official Astro + GitHub Pages pattern:
  - `actions/checkout@v4`
  - `withastro/action@v3` (or equivalent: setup Node, `npm ci`, `npm run build`)
  - `actions/upload-pages-artifact@v3`
  - `actions/deploy-pages@v4`
- Has the correct `permissions` block (`contents: read`, `pages: write`, `id-token: write`) and `concurrency` group for Pages deploys.
- Node 20.

In `astro.config.mjs`:
- Set `site` to `https://YOUR_USERNAME.github.io` (with a `// TODO` comment).
- Set `base` appropriately — if this is a user/org site (`USERNAME.github.io` repo), `base` is `/`; if it's a project site, `base` should be `/REPO_NAME/`. **Add a comment explaining both cases** so I can pick.
- Output: `static`.

---

## Repo Hygiene

- `.gitignore` for Node/Astro (node_modules, `dist/`, `.astro/`, `.DS_Store`, `.env`).
- A `README.md` with:
  - One-paragraph project description
  - "How to add a post" section (just: drop a `.md` file in `src/content/posts/` with the right frontmatter, commit, push)
  - "Local dev" section (`npm install`, `npm run dev`)
  - "Deployment" section (automatic via GitHub Actions on push to main; one-time setup: enable Pages in repo Settings → Pages → Source: GitHub Actions)
- `package.json` with sensible scripts: `dev`, `build`, `preview`.
- No unused dependencies. Audit before finishing.

---

## File Layout (target)

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml
├── public/
│   └── favicon.svg          # simple red shard or similar — generate inline
├── src/
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── ShatteredHero.astro     # SVG + script for the effect
│   │   ├── PostCard.astro
│   │   └── Pagination.astro
│   ├── content/
│   │   ├── config.ts                # collection schema
│   │   └── posts/
│   │       ├── example-post-1.md
│   │       ├── example-post-2.md
│   │       └── example-post-3.md
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro              # redirects/aliases to page 1, or IS page 1
│   │   ├── page/
│   │   │   └── [page].astro         # paginated list
│   │   ├── posts/
│   │   │   └── [slug].astro         # individual post
│   │   └── about.astro
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── tsconfig.json
├── package.json
├── .gitignore
└── README.md
```

(Adjust if Astro's idiomatic structure differs slightly, but keep it close to this.)

---

## Final Checks Before You Finish

1. Run `npm install` and `npm run build` and confirm it builds cleanly with **zero warnings or errors**.
2. Run `npm run preview` mentally — verify the home page shows the hero + 3 example posts, `/about` works, and the GitHub link is in the nav.
3. Confirm the pagination math works: with 3 posts and a limit of 10, only page 1 exists and Prev/Next are both hidden.
4. Confirm the content collection schema rejects malformed frontmatter (mention this in the README).
5. Confirm the GitHub Actions workflow file is syntactically valid YAML.

---

## What I Want From You

- Generate **every file**, full contents, no placeholders except the `// TODO` markers for things only I know (username, site title text, GitHub URL, about-me bio).
- Don't ask me clarifying questions — make reasonable choices and note them in the README.
- When you're done, give me a short summary of: what was built, what I need to change (the `// TODO`s), and the exact commands to get it live (init repo, push, enable Pages).

Go.
