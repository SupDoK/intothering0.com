# intothering0.com

Personal security research blog covering Windows Internals, Malware Development, and
applied offensive techniques. Built with [Astro](https://astro.build) and deployed
automatically to GitHub Pages on every push to `main`.

---

## How to add a post

1. Create a `.md` file in `src/content/posts/` — the filename becomes the URL slug.
   Example: `src/content/posts/my-new-post.md` → `/posts/my-new-post/`

2. Add the required frontmatter at the top:

   ```yaml
   ---
   title: "Your Post Title"
   date: 2026-05-20
   description: "A one- or two-sentence summary shown in the post list."
   draft: false
   ---
   ```

   - `title`, `date`, and `description` are required. The build will fail with a
     clear error if any are missing or malformed (e.g., `date` is not a valid date).
   - Set `draft: true` to keep a post out of the list and the build output.

3. Commit and push:

   ```sh
   git add src/content/posts/my-new-post.md
   git commit -m "add: my new post"
   git push
   ```

   GitHub Actions will build and deploy automatically.

---

## Local development

```sh
npm install
npm run dev       # starts at http://localhost:4321
npm run build     # production build → dist/
npm run preview   # preview the production build locally
```

---

## Deployment

Deployment is fully automatic via GitHub Actions (`.github/workflows/deploy.yml`).

**One-time setup:**

1. Push this repo to GitHub.
2. Go to **Settings → Pages → Source** and select **GitHub Actions**.
3. Update `astro.config.mjs`:
   - Set `site` to your GitHub Pages URL.
   - If this is a *project site* (repo name is not `USERNAME.github.io`), also
     uncomment and set `base` to `'/REPO_NAME'`. If it's a *user/org site*
     (`USERNAME.github.io` repo), leave `base` commented out or set to `'/'`.

After that, every push to `main` triggers a build and deploy. The Actions tab
shows build status and any errors.

---

## Design decisions

- **Fonts**: IBM Plex Sans (UI) + JetBrains Mono (code). Both loaded from Google Fonts.
- **Syntax highlighting**: Shiki with `github-dark` theme, built into Astro.
- **No JavaScript frameworks**: Astro static output, vanilla CSS, one small inline
  script for the hero parallax effect.
- **Pagination**: 10 posts per page. `/` is always page 1. Subsequent pages live at
  `/page/2/`, `/page/3/`, etc.
