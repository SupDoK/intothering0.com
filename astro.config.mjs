import { defineConfig } from 'astro/config';

export default defineConfig({
  // TODO: Set your site URL.
  // For a user/org site (repo named USERNAME.github.io):
  //   site: 'https://YOUR_USERNAME.github.io'
  //   base: '/'            <-- this is the default; you can omit `base`
  //
  // For a project site (any other repo name, e.g. "intothering0.com"):
  //   site: 'https://YOUR_USERNAME.github.io'
  //   base: '/intothering0.com'   <-- must match the repo name exactly
  site: 'https://SupDoK.github.io',
  base: '/intothering0.com',

  output: 'static',

  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: false,
    },
  },
});
