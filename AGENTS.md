# Portfolio deployment

- Publish this portfolio to **GitHub Pages** unless the user explicitly changes the destination.
- Source repository: `https://github.com/AndreLeal-L2/andre-leal-portfolio`.
- Production URL: `https://andreleal-l2.github.io/andre-leal-portfolio/`.
- A request to deploy means updating `main`, then waiting for `.github/workflows/deploy-pages.yml` to finish successfully and verifying the live page.
- Keep assets and links compatible with the `/andre-leal-portfolio/` base path.
- Use GitHub Pages for subsequent deployments. Do not publish to Sites or another hosting provider without an explicit user request.
- `.openai/` contains legacy local hosting metadata and is excluded from the GitHub source.
