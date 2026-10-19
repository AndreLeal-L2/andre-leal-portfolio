import { defineConfig } from 'vite';

const defaultSiteUrl = 'https://andreleal-l2.github.io/andre-leal-portfolio/';

export default defineConfig({
  // Relative URLs support both a domain root and GitHub project Pages.
  base: './',
  plugins: [{
    name: 'portfolio-site-url',
    transformIndexHtml(html) {
      const siteUrl = (process.env.PORTFOLIO_SITE_URL || defaultSiteUrl).replace(/\/$/, '') + '/';
      return html.replaceAll(defaultSiteUrl, siteUrl);
    },
  }],
});
