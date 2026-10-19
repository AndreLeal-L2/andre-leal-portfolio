import { defineConfig } from 'vite';

const originalSiteUrl = 'https://andre-leal-portfolio.starrymaple8.chatgpt.site';

export default defineConfig({
  // Relative URLs support both a domain root and GitHub project Pages.
  base: './',
  plugins: [{
    name: 'portfolio-site-url',
    transformIndexHtml(html) {
      const siteUrl = process.env.PORTFOLIO_SITE_URL?.replace(/\/$/, '') || originalSiteUrl;
      return html.replaceAll(originalSiteUrl, siteUrl);
    },
  }],
});
