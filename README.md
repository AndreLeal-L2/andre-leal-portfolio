# André Leal — Portfolio

An English-language portfolio based on `CV_Andre_Leal_FullStack_EN_.pdf`, with professional experience, academic projects, education, contact links, a downloadable CV and the original reference site's scroll-driven retro computer animation.

## Run locally

Use Node.js 24 (also declared in `.nvmrc`).

```sh
npm install
npm run dev
```

```sh
npm run build
npm run preview
```

The production output is `dist/`. The site is static and needs no database or environment variables.

## Publish on GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` builds and publishes the site on every push to `main`. It uses `npm ci` and `npm run build`; no personal access token or deployment secret is required.

1. Push this project to a public GitHub repository.
2. In the repository, open **Settings → Pages** and select **GitHub Actions** as the source.
3. Open **Actions → Deploy portfolio to GitHub Pages → Run workflow** for the first deployment, or push a new commit to `main`.
4. The completed deployment shows the public site URL in the `github-pages` environment.

For `AndreLeal-L2/andre-leal-portfolio`, the expected address is `https://andreleal-l2.github.io/andre-leal-portfolio/`. It becomes available after Pages is enabled and the workflow completes.

Relative asset URLs support project repositories and repository renames. The Pages workflow sets `PORTFOLIO_SITE_URL` from GitHub's Pages configuration so the Open Graph and structured-data URLs match the deployment. For another host, this build-time variable is optional; its default retains the existing Site URL.

## Edit content

- `index.html`: portfolio copy, navigation, work experience and contacts.
- `src/style.css`: layout, colours and responsive styles.
- `src/app.js`: navigation, accessible dialogs and terminal commands.
- `src/scene.js`: Three.js retro computer scene.
- `src/crt-screen.js`: animated phosphor display, bloom, scanlines and terminal screen.
- `public/assets/andre-portrait.png`: André's supplied portrait, displayed inside the CRT on the welcome screen.
- `src/intro.css`: fixed full-screen introduction, boot screen and 200vh scroll sequence.
- `src/mobile.css`: touch controls, larger mobile typography and project detail sheets.
- `public/Andre_Leal_CV.pdf`: original CV selected by the user.
- `public/assets/`: 3D assets, the BarberFlow public landing page screenshot and the labelled Travel Manager concept illustration.

The BarberFlow image comes from its [public source repository](https://github.com/AndreLeal-L2/barberflow-saas/blob/main/docs/screenshots/barberflow-home.jpg). Project links point to the actual repository and demo.

## Credits

Inspired by [Ed Hinrichsen's portfolio](https://edh.dev/). The retro computer model and accompanying original assets are reused from the [MIT-licensed source repository](https://github.com/edhinrichsen/retro-computer-website). See `THIRD_PARTY_LICENSES.md` for attribution.

No personal content, portrait, professional experience or projects belonging to Ed Hinrichsen are presented as André's work.
