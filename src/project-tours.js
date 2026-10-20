import './project-tours.css';

const asset = filename => `${import.meta.env.BASE_URL}assets/${filename}`;

const tours = [
  {
    id: 'barberflow',
    mount: '#barberflow .project-actions',
    title: 'BarberFlow',
    context: 'A quick look at the public website and its product preview.',
    note: 'The agenda below is an illustrative preview on the public landing page. To try the private dashboard, open the website, create an owner account, confirm your email and configure services and availability.',
    links: [
      { label: 'Open public website', href: 'https://barberflow-saas-delta.vercel.app/' },
      { label: 'Read source & setup', href: 'https://github.com/AndreLeal-L2/barberflow-saas' },
    ],
    steps: [
      {
        title: 'The public starting point',
        text: 'A barbershop owner can read about online booking, availability and the private agenda before creating an account. Visitors can explore this website without signing in.',
        image: 'barberflow-home-current.jpg',
        alt: 'Screenshot of the real BarberFlow public website introducing its online booking product',
        source: 'Capture of the deployed public website',
      },
      {
        title: 'What an organised day looks like',
        text: 'The landing page illustrates appointments, service durations and an available time slot. This explains the product visually; these sample appointments are not a live owner dashboard or a booking form.',
        image: 'barberflow-product-current.jpg',
        alt: 'BarberFlow landing page product preview with an illustrative daily agenda and sample appointments',
        source: 'Public product illustration · Sample appointments',
      },
    ],
  },
  {
    id: 'catway',
    mount: '#catway .project-info',
    title: 'CatWay',
    context: 'LP3 · Group 4 academic project. Explore the original JavaFX views.',
    note: 'These original FXML views were rendered with sample data and their controllers disabled. The complete application requires SQL Server schema/data and external map, pass and QR services. The repository does not include the database creation SQL or those services. This preview does not run or validate those workflows.',
    links: [
      { label: 'Read source & setup', href: 'https://github.com/AndreLeal-L2/CatWay' },
    ],
    steps: [
      {
        title: 'Account access',
        text: 'The original login view contains email and password fields, account registration and password recovery links. This capture shows the interface; it does not submit credentials or connect to an account service.',
        image: 'catway-login.webp',
        alt: 'Original CatWay JavaFX login view with email and password fields and registration and recovery links',
        source: 'Login.fxml inside Menu.fxml · Isolated JavaFX render',
      },
      {
        title: 'Compare a metro journey',
        text: 'The route-search view presents origin and destination stations alongside journey information and the bundled metro map. The displayed route values are demonstration data, rather than a search performed in this browser.',
        image: 'catway-routes.webp',
        alt: 'Original CatWay route-search view with station selectors, demonstration route information and the bundled metro map',
        source: 'SearchRoute.fxml inside Menu.fxml · Demo data',
      },
      {
        title: 'A passenger overview',
        text: 'The home view brings journey cards and the network map together. The group project also includes transport passes, QR tickets and simulated cash payments; those flows require the application and its external dependencies.',
        image: 'catway-home.webp',
        alt: 'Original CatWay home view with demonstration journey cards and the bundled metro map',
        source: 'Home.fxml inside Menu.fxml · Demo data',
      },
    ],
  },
];

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function makeTour(tour, mount) {
  const button = element('button', 'tour-open', 'Quick walkthrough');
  button.type = 'button';
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-controls', `tour-${tour.id}`);
  button.setAttribute('aria-label', `Quick walkthrough of ${tour.title}`);

  const dialog = element('dialog', 'tour-dialog');
  dialog.id = `tour-${tour.id}`;
  dialog.setAttribute('aria-labelledby', `${dialog.id}-title`);
  dialog.setAttribute('aria-describedby', `${dialog.id}-context`);

  const header = element('header', 'tour-header');
  const close = element('button', 'tour-close', 'Close');
  close.type = 'button';
  close.setAttribute('aria-label', `Close ${tour.title} walkthrough`);
  const title = element('h2', 'tour-title', `${tour.title} walkthrough`);
  title.id = `${dialog.id}-title`;
  const context = element('p', 'tour-context', tour.context);
  context.id = `${dialog.id}-context`;
  header.append(close, title, context);

  const body = element('div', 'tour-body');
  const notice = element('p', 'tour-notice', 'Guided preview · Sample data · No live bookings/payments');
  const stepTitle = element('h3', 'tour-step-title');
  stepTitle.tabIndex = -1;
  const description = element('p', 'tour-description');
  const figure = element('figure', 'tour-figure');
  const sourceLink = element('a', 'tour-image-link');
  sourceLink.target = '_blank';
  sourceLink.rel = 'noopener noreferrer';
  const image = element('img', 'tour-image');
  image.width = 1920;
  image.height = 1080;
  image.decoding = 'async';
  sourceLink.append(image);
  const caption = element('figcaption', 'tour-caption');
  figure.append(sourceLink, caption);
  const note = element('p', 'tour-note', tour.note);
  body.append(notice, stepTitle, description, figure, note);

  const footer = element('footer', 'tour-footer');
  const navigation = element('div', 'tour-navigation');
  const previous = element('button', 'tour-step-button', 'Previous');
  const next = element('button', 'tour-step-button', 'Next');
  previous.type = next.type = 'button';
  previous.setAttribute('aria-label', 'Previous walkthrough step');
  next.setAttribute('aria-label', 'Next walkthrough step');
  const status = element('p', 'tour-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  navigation.append(previous, status, next);
  const links = element('div', 'tour-links');
  for (const link of tour.links) {
    const anchor = element('a', 'tour-link', link.label);
    anchor.href = link.href;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    links.append(anchor);
  }
  footer.append(navigation, links);
  dialog.append(header, body, footer);

  let stepIndex = 0;
  function updateStep(index, focus = true) {
    stepIndex = Math.max(0, Math.min(tour.steps.length - 1, index));
    const step = tour.steps[stepIndex];
    stepTitle.textContent = step.title;
    description.textContent = step.text;
    image.src = asset(step.image);
    image.alt = step.alt;
    sourceLink.href = asset(step.image);
    sourceLink.setAttribute('aria-label', `Open full-size image: ${step.title}`);
    caption.textContent = `${step.source} · Select image to view full size`;
    status.textContent = `Step ${stepIndex + 1} of ${tour.steps.length}`;
    previous.disabled = stepIndex === 0;
    next.disabled = stepIndex === tour.steps.length - 1;
    body.scrollTop = 0;
    if (focus) stepTitle.focus({ preventScroll: true });
  }
  button.addEventListener('click', () => {
    updateStep(0, false);
    dialog.showModal();
    close.focus({ preventScroll: true });
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => button.focus({ preventScroll: true }));
  previous.addEventListener('click', () => updateStep(stepIndex - 1));
  next.addEventListener('click', () => updateStep(stepIndex + 1));
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowLeft' && stepIndex > 0) {
      event.preventDefault();
      updateStep(stepIndex - 1);
    } else if (event.key === 'ArrowRight' && stepIndex < tour.steps.length - 1) {
      event.preventDefault();
      updateStep(stepIndex + 1);
    }
  });
  mount.append(button);
  document.body.append(dialog);
}

export function initProjectTours() {
  for (const tour of tours) {
    const mount = document.querySelector(tour.mount);
    if (mount && !document.querySelector(`#tour-${tour.id}`)) makeTour(tour, mount);
  }
}
