# Development and deployment


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

GitHub Pages is the production destination for this portfolio and the default for all future deployment requests. The source repository is `AndreLeal-L2/andre-leal-portfolio`; the deployment preference is also recorded in the root `AGENTS.md`.

The workflow in `.github/workflows/deploy-pages.yml` builds and publishes the site on every push to `main`. It uses `npm ci` and `npm run build`; no personal access token or deployment secret is required.

1. Push this project to a public GitHub repository.
2. In the repository, open **Settings → Pages** and select **GitHub Actions** as the source.
3. Open **Actions → Deploy portfolio to GitHub Pages → Run workflow** for the first deployment, or push a new commit to `main`.
4. The completed deployment shows the public site URL in the `github-pages` environment.

The production address is `https://andreleal-l2.github.io/andre-leal-portfolio/`. After each publication, wait for the workflow to succeed and confirm the updated content at that address.

Relative asset URLs support project repositories and repository renames. The Pages workflow sets `PORTFOLIO_SITE_URL` from GitHub's Pages configuration so the Open Graph and structured-data URLs match the deployment. Local builds default to the production GitHub Pages URL. Legacy `.openai/` metadata is local and is excluded from the GitHub repository.

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
- `public/assets/`: 3D assets, BarberFlow screenshots and the CatWay previews rendered from the project's original JavaFX views. See [CatWay preview sources](CATWAY_PREVIEWS.md).

The BarberFlow previews are captures of its [deployed public website](https://barberflow-saas-delta.vercel.app/). The agenda is the public demonstration with sample data, rather than a signed-in owner dashboard. Project links point to the actual repository and demo.


See [third-party credits and licenses](../THIRD_PARTY_LICENSES.md) for asset attribution.
