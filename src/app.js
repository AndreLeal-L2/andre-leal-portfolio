import { initProjectTours } from './project-tours.js';

initProjectTours();

document.querySelector('#year').textContent = new Date().getFullYear();

const barberflowPreviews = {
  home: {
    src: 'barberflow-home-current.jpg',
    alt: 'Current BarberFlow website with its blue and white branding and online booking introduction',
    caption: 'Current public website',
  },
  agenda: {
    src: 'barberflow-product-current.jpg',
    alt: 'BarberFlow public product preview showing its daily agenda with sample appointments',
    caption: 'Illustrative agenda preview · Sample data',
  },
};
const barberflowPreviewButtons = document.querySelectorAll('[data-barberflow-view]');
barberflowPreviewButtons.forEach(button => button.addEventListener('click', () => {
  const preview = barberflowPreviews[button.dataset.barberflowView];
  const image = document.querySelector('#barberflow-preview-image');
  image.src = `${import.meta.env.BASE_URL}assets/${preview.src}`;
  image.alt = preview.alt;
  document.querySelector('#barberflow-preview-note').textContent = preview.caption;
  barberflowPreviewButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
}));

const catwayPreviews = {
  home: {
    alt: 'CatWay overview rendered from the original JavaFX views, with journey cards and the metro network map',
    title: 'overview',
    caption: 'Overview · Original JavaFX view · Demo data',
  },
  routes: {
    alt: 'CatWay route search rendered from SearchRoute.fxml, with station selectors, a sample route and the original metro map',
    title: 'route search',
    caption: 'Route search · Original JavaFX view · Demo data',
  },
  login: {
    alt: 'CatWay login rendered from Login.fxml, with email and password fields, registration and password recovery links',
    title: 'login',
    caption: 'Login · Original JavaFX view',
  },
};
const catwayPreviewButtons = document.querySelectorAll('[data-catway-view]');
catwayPreviewButtons.forEach(button => button.addEventListener('click', () => {
  const view = button.dataset.catwayView;
  const preview = catwayPreviews[view];
  const source = `${import.meta.env.BASE_URL}assets/catway-${view}.webp`;
  const image = document.querySelector('#catway-preview-image');
  image.src = source;
  image.alt = preview.alt;
  const link = document.querySelector('#catway-preview-link');
  link.href = source;
  link.setAttribute('aria-label', `Open the full-size CatWay ${preview.title} view`);
  document.querySelector('#catway-preview-note').textContent = preview.caption;
  catwayPreviewButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
}));

const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu() { mobileNav.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open navigation'); }
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  mobileNav.hidden = !open;
});
mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuButton.focus(); }
});
document.addEventListener('pointerdown', e => {
  if (!mobileNav.hidden && !mobileNav.contains(e.target) && !menuButton.contains(e.target)) closeMenu();
});
window.matchMedia('(min-width: 761px)').addEventListener('change', e => { if (e.matches) closeMenu(); });

const terminal = document.querySelector('#terminal-dialog');
const terminalInput = document.querySelector('#terminal-input');
const crtInput = document.querySelector('#crt-command');
function focusCRT() {
  if (document.querySelector('#computer-scene').classList.contains('scene-ready')) {
    crtInput.focus({ preventScroll: true });
    document.body.classList.add('terminal-focused');
  } else { terminal.showModal(); terminalInput.focus(); }
}
document.querySelector('#open-terminal').addEventListener('click', focusCRT);
crtInput.addEventListener('blur', () => document.body.classList.remove('terminal-focused'));
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', e => {
  const r = dialog.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
}));

const responses = {
  help: 'Available commands:\n  whoami       A little about André\n  experience   Professional journey\n  projects     Selected projects\n  skills       My development toolbox\n  education    My academic background\n  contact      Get in touch\n  cv           Download my CV\n  home         Return to the welcome screen\n  clear        Clear the terminal',
  whoami: 'André Guilherme Leal\nJunior Full Stack Developer · Porto, Portugal\nE-commerce, API integrations and automation.\nInternship at Escolhadigital · March–June 2026\nCTeSP graduate · Computer Engineering student at ISEP\nPortuguese: native · English: C1',
  skills: 'Backend: Java, Spring Boot, Node.js, PHP, Python, CodeIgniter\nFrontend: Angular, TypeScript, JavaScript, HTML/CSS, jQuery\nData: PostgreSQL, MySQL/MariaDB, SQL Server\nIntegration: REST, GraphQL, OAuth 2.0, Webhooks\nTools: Docker, Postman, Playwright, Vitest, Git, GitHub Actions',
  contact: 'Email: andreleal.epg@gmail.com\nLinkedIn: linkedin.com/in/andregsleal\nGitHub: github.com/AndreLeal-L2',
  education: '2026–Present · Computer Engineering, ISEP (degree in progress)\n2024–2026 · Agile Software Development, ISEP (CTeSP completed)\n2021–2024 · Electronics, Automation & Computers, Escola Profissional Gaia',
};
const history = [];
let historyPosition = 0;
const output = document.querySelector('#terminal-output');
function runCommand(raw) {
  const command = raw.toLowerCase();
  if (command === 'home') { window.location.hash = 'home'; return 'Welcome to André’s portfolio.'; }
  if (command === 'experience' || command === 'projects') {
    terminal.close(); crtInput.blur(); window.location.hash = command;
    return `Opening ${command}…`;
  }
  if (command === 'cv') {
    const a = document.createElement('a'); a.href = `${import.meta.env.BASE_URL}Andre_Leal_CV.pdf`; a.download = 'Andre_Leal_CV.pdf'; document.body.append(a); a.click(); a.remove();
    return 'Downloading André Leal’s CV…';
  }
  return responses[command] || `Command not found: ${raw}\nType help to see available commands.`;
}
document.querySelector('#terminal-form').addEventListener('submit', e => {
  e.preventDefault();
  const raw = terminalInput.value.trim();
  if (!raw) return;
  const command = raw.toLowerCase();
  history.push(raw); historyPosition = history.length; terminalInput.value = '';
  if (command === 'clear') { output.replaceChildren(); window.dispatchEvent(new CustomEvent('portfolio-terminal', { detail: { command: raw, response: '' } })); return; }
  const line = document.createElement('p'); line.className = 'terminal-command'; line.textContent = `andre:~$ ${raw}`; output.append(line);
  const response = document.createElement('p'); response.className = 'terminal-response';
  response.textContent = runCommand(raw);
  window.dispatchEvent(new CustomEvent('portfolio-terminal', { detail: { command: raw, response: response.textContent } }));
  output.append(response); terminalInput.scrollIntoView({ block: 'nearest' });
});

function updateCRTInput() { window.dispatchEvent(new CustomEvent('portfolio-terminal-input', { detail: { value: crtInput.value } })); }
crtInput.addEventListener('input', updateCRTInput);
crtInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') { crtInput.blur(); return; }
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault(); historyPosition = Math.max(0, Math.min(history.length, historyPosition + (e.key === 'ArrowUp' ? -1 : 1)));
    crtInput.value = history[historyPosition] || ''; updateCRTInput(); return;
  }
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const raw = crtInput.value.trim();
  if (!raw) return;
  history.push(raw); historyPosition = history.length; crtInput.value = '';
  const response = raw.toLowerCase() === 'clear' ? '' : runCommand(raw);
  window.dispatchEvent(new CustomEvent('portfolio-terminal', { detail: { command: raw, response } }));
  updateCRTInput();
});
document.addEventListener('keydown', e => {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.key === ' ' || e.key.length !== 1 || window.scrollY > window.innerHeight * 1.25 || document.querySelector('dialog[open]')) return;
  const target = e.target;
  if (target instanceof HTMLElement && (target.matches('input,textarea,select,button,a') || target.isContentEditable)) return;
  if (!document.querySelector('#computer-scene').classList.contains('scene-ready')) return;
  e.preventDefault(); focusCRT(); crtInput.value += e.key; updateCRTInput();
});

function updateIntroState() {
  document.documentElement.dataset.scroll = String(window.scrollY > 10);
  document.documentElement.dataset.intro = String(window.scrollY < window.innerHeight * 1.25);
  if (window.scrollY > window.innerHeight * 1.5 && document.activeElement === crtInput) crtInput.blur();
}
updateIntroState();
window.addEventListener('scroll', updateIntroState, { passive: true });
window.addEventListener('resize', updateIntroState, { passive: true });
const bootOverlay = document.querySelector('#scene-loading');
const enableSceneButton = document.querySelector('#enable-scene');
const terminalButton = document.querySelector('#open-terminal');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let sceneEpoch = 0;
let sceneState = 'idle';
let sceneDispose;
let sceneTimeout;
function finishBoot(failed = false) {
  clearTimeout(sceneTimeout);
  if (failed) document.body.classList.add('scene-failed');
  bootOverlay.hidden = true;
}
function showStaticIntro() {
  sceneState = 'static';
  document.body.classList.add('scene-static');
  terminalButton.hidden = true;
  enableSceneButton.hidden = motionPreference.matches;
  finishBoot();
}
function stopScene() {
  sceneEpoch++;
  window.dispatchEvent(new CustomEvent('portfolio-scene-stop'));
  sceneDispose?.();
  sceneDispose = undefined;
  showStaticIntro();
}
async function startScene() {
  if (motionPreference.matches || sceneState === 'loading' || sceneState === 'ready') return;
  const attempt = ++sceneEpoch;
  sceneState = 'loading';
  document.body.classList.remove('scene-static', 'scene-failed');
  enableSceneButton.hidden = true;
  bootOverlay.hidden = false;
  document.querySelector('#scene-loading-progress').style.transform = 'scaleX(.02)';
  document.querySelector('#scene-loading-status').textContent = 'Loading the 3D scene. You can browse the portfolio now.';
  // The page is already usable. Offer the static introduction if loading stalls.
  sceneTimeout = setTimeout(stopScene, 6000);
  try {
    const { initScene } = await import('./scene.js');
    if (attempt !== sceneEpoch || motionPreference.matches) return;
    const cleanup = await initScene();
    if (attempt !== sceneEpoch) cleanup?.();
    else sceneDispose = cleanup;
  } catch (error) {
    if (attempt !== sceneEpoch) return;
    console.warn('3D scene unavailable; the portfolio remains accessible.', error);
    document.querySelector('#computer-scene').classList.add('scene-unavailable');
    showStaticIntro();
    finishBoot(true);
  }
}
window.addEventListener('portfolio-scene-progress', e => {
  const { loaded, total } = e.detail;
  document.querySelector('#scene-loading-progress').style.transform = `scaleX(${total ? loaded / total : 0})`;
  document.querySelector('#scene-loading-status').textContent = `Loading the optional 3D scene: ${loaded} of ${total} files.`;
});
window.addEventListener('portfolio-scene-ready', () => {
  sceneState = 'ready';
  terminalButton.hidden = false;
  finishBoot();
});
window.addEventListener('portfolio-scene-static', showStaticIntro);
window.addEventListener('portfolio-scene-error', () => { showStaticIntro(); finishBoot(true); });
enableSceneButton.addEventListener('click', startScene);
motionPreference.addEventListener('change', event => {
  if (event.matches) stopScene();
  else if (sceneState === 'static') enableSceneButton.hidden = false;
});
document.querySelectorAll('[data-skip-intro]').forEach(link => link.addEventListener('click', stopScene));
document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (sceneState !== 'loading' || !link) return;
  const url = new URL(link.href);
  if (url.origin === location.origin && url.pathname === location.pathname && url.hash && url.hash !== '#home') stopScene();
});
terminalInput.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault(); historyPosition = Math.max(0, Math.min(history.length, historyPosition + (e.key === 'ArrowUp' ? -1 : 1)));
    terminalInput.value = history[historyPosition] || '';
  }
});

const projectData = {
  barberflow: {
    title: 'BarberFlow',
    label: 'CLIENT-INSPIRED PROJECT · FUNCTIONAL MVP',
    description: 'A conversation with a barber became a project. The challenge was to simplify booking management and reduce reliance on messages and a manual diary. I built a platform where each barbershop can configure services and availability, share a booking page and manage its operation in a private dashboard.',
    tags: ['Java 21', 'Spring Boot', 'Angular', 'TypeScript', 'PostgreSQL'],
    sections: [
      { title: 'Engineering behind a booking', items: [
        'Preventing double booking in concurrent requests using transactions and pessimistic locking.',
        'Enforcing tenant isolation so each barbershop can access only its own data.',
        'Implementing Spring Security authentication with persisted sessions, HttpOnly cookies and CSRF protection.',
        'Preserving booking history with snapshots of service prices and durations.',
        'Delivering email notifications through a Transactional Outbox with retries.',
      ] },
      { title: 'Testing and delivery', text: 'JUnit, Mockito, Testcontainers and Vitest support the project’s evolution. Docker and GitHub Actions pipelines cover tests, builds and security analysis with CodeQL and Trivy.' },
      { title: 'Current stage', text: 'BarberFlow is a functional MVP for a controlled beta. Development continues, guided by client feedback. As a Computer Engineering student at ISEP, I have used the project to deepen my Java Full Stack skills and follow a solution from requirements through implementation and maintenance.' },
    ],
    links: [
      { label: 'Open website', href: 'https://barberflow-saas-delta.vercel.app/' },
      { label: 'Source code', href: 'https://github.com/AndreLeal-L2/barberflow-saas' },
    ],
  },
  commerce: {
    title: 'E-commerce business rules',
    label: 'PROFESSIONAL WORK · ESCOLHADIGITAL INTERNSHIP',
    description: 'I helped adapt an existing B2B/B2C WooCommerce store to specific commercial rules. The work connected configurable backoffice settings to the customer’s purchase flow, from product selection through order confirmation.',
    tags: ['PHP', 'WordPress', 'WooCommerce', 'JavaScript', 'Staging'],
    sections: [
      { title: 'The challenge', text: 'Business rules were spread across theme code, WooCommerce templates and browser scripts. I first mapped these dependencies so that server calculations and the information shown to customers would stay consistent.' },
      { title: 'My contribution', items: [
        'Implemented the deposit-return system (SDR): a configurable rate, product and variation eligibility, and calculations based on the number of bottles in a pack.',
        'Carried the deposit through product pages, the mini-cart, cart, checkout and order confirmation, reviewing subtotals, shipping and final totals.',
        'Added editable employee-offer and campaign settings, including eligible profiles, schedules, promotional products and interface text.',
        'Improved checkout addresses and reviewed responsive deposit tooltips and Portuguese interface copy.',
      ] },
      { title: 'Validation and outcome', text: 'I used PHP syntax checks, targeted tests, asset builds and desktop/mobile review. Changes were ported to the updated theme and verified in staging. Functional documentation and demonstration scripts supported sessions with the client. The result made recurring commercial rules configurable and kept deposit information consistent throughout the purchase flow.' },
      { title: 'What this taught me', text: 'Understanding the whole business flow and the existing code matters as much as implementing a feature. Client demonstrations helped connect technical changes to observable behaviour.' },
    ],
    links: [],
  },
  dataPipeline: {
    title: 'Making product data make sense',
    label: 'PROFESSIONAL WORK · TESTED DRY-RUN PIPELINE',
    description: 'A Node.js and TypeScript service to prepare product synchronization from Excel to Sage Intacct. My work focused on reading and normalizing real workbooks, interpreting the product model and producing a traceable plan before any external write.',
    tags: ['TypeScript', 'Node.js', 'Excel', 'Vitest', 'Sage Intacct'],
    sections: [
      { title: 'The challenge', text: 'Several spreadsheet rows could share an ITEM_ID while describing valid suppliers, quantity tiers, effective periods or price lists. Treating every repeated ID as a duplicate created false conflicts.' },
      { title: 'My contribution', items: [
        'Reworked grouping around ITEM_ID as the master item, preserving its associated commercial entries.',
        'Flagged conflicting costs only when records collided on the same commercial key.',
        'Generated reviewable create/update plans in dry-run mode, retaining source information to explain each decision.',
        'Used Vitest to validate reading, normalization, grouping, conflict detection and synchronization planning.',
      ] },
      { title: 'Validation and outcome', text: 'The pipeline was tested with real data and automated tests. Correcting the model removed false conflicts caused by valid repeated master-item IDs. The real Sage integration still depended on complete credentials and final business rules; this case covers the validated preparation pipeline.' },
      { title: 'What this taught me', text: 'A technically tidy implementation can still be wrong if it models the business incorrectly. The key improvement came from understanding what a row represented.' },
    ],
    links: [],
  },
  logistics: {
    title: 'From order to shipment',
    label: 'PROFESSIONAL WORK · TESTED IN DOCKER',
    description: 'I developed and tested a WordPress/WooCommerce plugin connecting store orders to the DHL Parcel Iberia API. The integration covers the operational flow from shipment creation to pickup and daily closing.',
    tags: ['PHP', 'WooCommerce', 'DHL API', 'Docker', 'PDF'],
    sections: [
      { title: 'My contribution', items: [
        'Created shipments through the API and made tracking and PDF shipping labels available in the backoffice.',
        'Served labels through a secure WordPress route after direct file downloads failed during testing.',
        'Added pickup requests and a combined shipment-and-pickup action, with validation against duplicate pickups on the same day.',
        'Implemented end-of-day closing and PDF manifests, plus backoffice settings for the environment and pickup details.',
      ] },
      { title: 'Validation and outcome', text: 'I set up a Docker test environment with test credentials, a shipping zone, products and orders. API payloads and responses were checked, JSON examples supported validation and PHP files passed syntax checks before installable plugin packages were prepared.' },
      { title: 'What this taught me', text: 'An integration needs more than a successful API call: file access, duplicate actions, required operational data and the complete backoffice workflow all need validation.' },
    ],
    links: [],
  },
  travel: {
    title: 'CatWay · Metro travel manager',
    label: 'ACADEMIC TEAM PROJECT · LP3 / GROUP 4',
    description: 'A desktop application developed as an LP3 team project (Group 4) for planning metro journeys and managing a transport network. Built with Java 24 and JavaFX, CatWay connects to SQL Server and REST APIs for network data, travel passes and QR tickets.',
    tags: ['Java 24', 'JavaFX', 'SQL Server', 'REST APIs'],
    sections: [
      { title: 'Project context', text: 'Developed in a team during my Higher Technical Diploma in Agile Software Development. The features below describe the shared application.' },
      { title: 'Evaluation and setup', text: 'The quick walkthrough uses original JavaFX views rendered in isolation with sample data. Running the complete application requires SQL Server and external services; the repository does not include the database creation schema or those services.' },
      { title: 'Passenger features', text: 'Search routes between stations, compare journey time and price, apply an active pass discount, simulate cash payment with change, and view QR tickets and travel history.' },
      { title: 'Administration features', text: 'Import network maps from XML files or XML/JSON APIs, manage users and role permissions, maintain the cash register, and review import history and usage statistics.' },
    ],
    links: [{ label: 'Source code', href: 'https://github.com/AndreLeal-L2/CatWay' }],
  },
};
const projectDialog = document.querySelector('#project-dialog');
document.querySelectorAll('.project-detail').forEach(button => button.addEventListener('click', () => {
  const data = projectData[button.dataset.project];
  document.querySelector('#project-dialog-label').textContent = data.label || 'ACADEMIC PROJECT';
  document.querySelector('#project-dialog-title').textContent = data.title;
  document.querySelector('#project-dialog-description').textContent = data.description;
  const tags = document.querySelector('#project-dialog-tags'); tags.replaceChildren();
  data.tags.forEach(tag => { const span = document.createElement('span'); span.textContent = tag; tags.append(span); });
  const details = document.querySelector('#project-dialog-details'); details.replaceChildren();
  (data.sections || []).forEach(section => {
    const article = document.createElement('section');
    const heading = document.createElement('h3'); heading.textContent = section.title; article.append(heading);
    if (section.text) { const paragraph = document.createElement('p'); paragraph.textContent = section.text; article.append(paragraph); }
    if (section.items) {
      const list = document.createElement('ul');
      section.items.forEach(item => { const li = document.createElement('li'); li.textContent = item; list.append(li); });
      article.append(list);
    }
    details.append(article);
  });
  const links = document.querySelector('#project-dialog-links'); links.replaceChildren();
  (data.links || [{ label: 'Visit my GitHub profile', href: 'https://github.com/AndreLeal-L2' }]).forEach((link, index) => {
    const a = document.createElement('a'); a.className = index === 0 ? 'button button-dark' : 'underlined-link';
    a.textContent = link.label;
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'icon');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M7 17 17 7M7 7h10v10');
    icon.append(path);
    a.append(icon);
    a.href = link.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; links.append(a);
  });
  projectDialog.showModal();
  projectDialog.scrollTop = 0;
}));

const navLinks = document.querySelectorAll('.desktop-nav a');
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) navLinks.forEach(link => {
    const active = link.hash === `#${entry.target.id}`;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
}, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
document.querySelectorAll('main section[id]').forEach(section => observer.observe(section));

if (motionPreference.matches || (location.hash && location.hash !== '#home')) showStaticIntro();
else requestAnimationFrame(() => requestAnimationFrame(() => {
  if (sceneState === 'idle') startScene();
}));
