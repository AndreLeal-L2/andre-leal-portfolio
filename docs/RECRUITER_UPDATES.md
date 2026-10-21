# Recruiter-facing updates

The portfolio now exposes André's name, role and project links as HTML before the optional 3D scene loads. Navigation and the profile remain available when the application script does not run. Loading is a small status panel rather than a blocking overlay. “Skip introduction” stops the scene, and loading that exceeds six seconds falls back to the static introduction with an explicit retry control.

The scene honours `prefers-reduced-motion`: the app does not import it in reduced-motion mode, and the scene independently checks the preference before allocating WebGL resources. A runtime preference change cancels initialization or the active scene. Stop, error and context-loss paths restore the static interface. Late loader results are disposed without reviving a cancelled scene. Viewport dimensions and scroll are synchronized after asynchronous loading and before the first render.

## Project evaluation

BarberFlow and CatWay have keyboard-accessible “Quick walkthrough” dialogs using the existing project images. Each guide identifies its sources and sample data. The BarberFlow link is named “Open website”; the guide explains that the private dashboard requires account creation and setup. The guide is a visual overview, not a running backend demo.

CatWay is identified as an LP3 team project, Group 4. Its setup requirements and missing database creation SQL/services are explicit. The original FXML previews remain isolated renders, not proof of the full runtime. On 21 October 2026, the owner confirmed that all CatWay group members developed the application collaboratively and that entry into the second year of Computer Engineering was through credit transfer. The portfolio, walkthrough, terminal and README now reflect those details without attributing individual modules. The original CV is unchanged.

## Sharing

Open Graph image, image dimensions/alt text, Twitter card and canonical URL are set in `index.html`. `public/assets/social-preview.jpg` is a 1200 × 630 capture of the code-native design in `design/social-preview.html`.

## Verification

- Production build, JavaScript syntax and diff whitespace checks pass.
- Mobile walkthroughs: all two BarberFlow and three CatWay steps, disabled end controls, close/Escape and focus return.
- At 320 × 568: no horizontal overflow, dialog inside viewport and controls at least 44px tall.
- At 393 × 852: readable profile, skip removes the WebGL canvas and hides loading.
- With a deterministic 1.8s fixture delay, changing viewport during initialization ends with matching 393 × 852 display and drawing buffer (DPR 1 in that browser test).
- A local media-query fixture verifies reduced-motion startup without a canvas, opt-in after the preference changes and canvas removal when reduced motion is enabled again. This checks application behaviour; it does not emulate an iPhone GPU.
- An 8s fixture delay verifies the six-second timeout returns to the static introduction with retry and no lingering canvas.
- An HTML-only fixture verifies visible profile/navigation and a hidden loading panel without the application script.

The test fixtures are local files in `.artifacts/recruiter-fixes/` and are excluded from deployment.
