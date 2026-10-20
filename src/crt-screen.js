import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/*
 * CRT pipeline adapted from Edward Hinrichsen's retro-computer-website.
 * Copyright (c) 2024 Edward Hinrichsen — MIT.
 * The original scanline, rolling-noise and phosphor-decay shaders are retained
 * below. Full license and source attribution: THIRD_PARTY_LICENSES.md.
 * Canvas content, supplied André portrait and terminal bridge: André portfolio.
 */

const WIDTH = 768;
const HEIGHT = 576;
const AMBER = '#f99021';

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// These values and the square-wave scanline pattern are the original site's.
const noiseFragmentShader = `
#define PI 3.1415926538
#define LINE_SIZE 288.0
#define LINE_STRENGTH 0.05
#define LINE_OFFSET 2.0
#define NOISE_STRENGTH 0.2
uniform sampler2D uDiffuse;
uniform float uTime;
uniform float uProgress;
uniform float uBoot;
varying vec2 vUv;
float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}
float squareWave(float x) {
  return ((4.0/PI * sin(PI*LINE_SIZE*x))
    +(4.0/PI * 1.0/3.0 * sin(3.0*PI*LINE_SIZE*x))
    +(4.0/PI * 1.0/5.0 * sin(5.0*PI*LINE_SIZE*x))
    - LINE_OFFSET)*LINE_STRENGTH;
}
vec4 progress() {
  if (vUv.y < uProgress && vUv.y > uProgress - 0.2) {
    return vec4(0.1,0.1,0.1,1.0) * (uProgress - vUv.y);
  }
  return vec4(0,0,0,0);
}
void main() {
  vec4 color = texture2D(uDiffuse, vUv);
  float r = rand(vUv*uTime);
  vec4 p = progress();
  vec3 phosphor = color.rgb + vec3(r) * (p.a + NOISE_STRENGTH) + squareWave(vUv.y);
  // The short warm-up contracts to the CRT's centre line when first powered on.
  float aperture = smoothstep(0.0, 0.035, uBoot * 0.55 - abs(vUv.y - 0.5));
  gl_FragColor = vec4(phosphor * aperture * min(uBoot * 2.0, 1.0), 1.0);
}`;

const lagFragmentShader = `
#define LAG 0.8
#define LAG_INVERSE 0.2
uniform sampler2D uDiffuse;
uniform sampler2D uLagTex;
varying vec2 vUv;
void main() {
  vec4 Diffuse = texture2D(uDiffuse, vUv);
  vec4 LagTex = texture2D(uLagTex, vUv);
  gl_FragColor = (Diffuse * LAG_INVERSE) + (LagTex * LAG);
}`;

const copyFragmentShader = `
uniform sampler2D uDiffuse;
varying vec2 vUv;
void main() { gl_FragColor = texture2D(uDiffuse, vUv); }
`;

function makeShaderPass(fragmentShader, uniforms) {
  const target = new THREE.WebGLRenderTarget(WIDTH, HEIGHT, {
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    depthBuffer: false,
    stencilBuffer: false,
  });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  camera.position.z = 1;
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  scene.add(new THREE.Mesh(geometry, material));
  return {
    target, material,
    render(renderer) {
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(scene, camera);
    },
    dispose() { target.dispose(); material.dispose(); geometry.dispose(); },
  };
}

function wrapLine(value, maxLength = 49) {
  const lines = [];
  for (const line of String(value).split('\n')) {
    if (!line) { lines.push(''); continue; }
    let rest = line;
    while (rest.length > maxLength) {
      let split = rest.lastIndexOf(' ', maxLength);
      if (split < maxLength / 2) split = maxLength;
      lines.push(rest.slice(0, split));
      rest = rest.slice(split).trimStart();
    }
    lines.push(rest);
  }
  return lines;
}

/**
 * Screen texture for the original GLB's Screen mesh.
 * Call tick before the main renderer.render() and dispose with the scene.
 * window events:
 *   portfolio-terminal       detail {command: string, response: string|string[]}
 *   portfolio-terminal-input detail {value: string}
 *   portfolio-terminal-reset clears command history and restores the title.
 */
export async function createCRTScreen(renderer) {
  const portrait = new Image();
  portrait.decoding = 'async';
  await new Promise((resolve, reject) => {
    portrait.onload = resolve;
    portrait.onerror = () => reject(new Error('The supplied portrait could not be loaded.'));
    portrait.src = `${import.meta.env.BASE_URL}assets/andre-portrait.png`;
  });
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d', { alpha: false });
  const canvasTexture = new THREE.CanvasTexture(canvas);
  // r134's text MeshBasicMaterial stored #f99021 directly as linear RGB.
  // Preserve those values here: decoding canvas sRGB would halve the green
  // channel before bloom and turn the reference's gold phosphor dark orange.
  canvasTexture.colorSpace = THREE.NoColorSpace;
  canvasTexture.minFilter = THREE.LinearFilter;
  canvasTexture.magFilter = THREE.NearestFilter;
  canvasTexture.generateMipmaps = false;

  const textScene = new THREE.Scene();
  textScene.background = new THREE.Color(0x000000);
  const textCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  textCamera.position.z = 1;
  const textGeometry = new THREE.PlaneGeometry(2, 2);
  const textMaterial = new THREE.MeshBasicMaterial({ map: canvasTexture, toneMapped: false });
  textScene.add(new THREE.Mesh(textGeometry, textMaterial));

  const renderTarget = new THREE.WebGLRenderTarget(WIDTH, HEIGHT, {
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    depthBuffer: false,
    stencilBuffer: false,
  });
  const composer = new EffectComposer(renderer, renderTarget);
  composer.renderToScreen = false;
  composer.setPixelRatio(1);
  composer.setSize(WIDTH, HEIGHT);
  composer.addPass(new RenderPass(textScene, textCamera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(128, 128), 1.1, 0.4, 0);
  composer.addPass(bloomPass);

  // The supplied portrait already contains a glow treatment. Composite it
  // after text bloom, retaining its facial detail while sharing phosphor lag,
  // scanlines, noise and the curved screen material with the rest of the CRT.
  const portraitCanvas = document.createElement('canvas');
  portraitCanvas.width = WIDTH;
  portraitCanvas.height = HEIGHT;
  const portraitContext = portraitCanvas.getContext('2d');
  portraitContext.imageSmoothingEnabled = true;
  portraitContext.imageSmoothingQuality = 'high';
  const portraitTexture = new THREE.CanvasTexture(portraitCanvas);
  portraitTexture.colorSpace = THREE.NoColorSpace;
  portraitTexture.generateMipmaps = false;
  const portraitScene = new THREE.Scene();
  const portraitMaterial = new THREE.MeshBasicMaterial({
    map: portraitTexture, transparent: true, depthTest: false,
    depthWrite: false, toneMapped: false,
  });
  portraitScene.add(new THREE.Mesh(textGeometry, portraitMaterial));
  const portraitPass = new RenderPass(portraitScene, textCamera);
  portraitPass.clear = false;
  composer.addPass(portraitPass);

  const lagPass = makeShaderPass(lagFragmentShader, {
    uDiffuse: { value: composer.readBuffer.texture },
    uLagTex: { value: null },
  });
  const copyPass = makeShaderPass(copyFragmentShader, {
    uDiffuse: { value: lagPass.target.texture },
  });
  lagPass.material.uniforms.uLagTex.value = copyPass.target.texture;
  const screenPass = makeShaderPass(noiseFragmentShader, {
    uDiffuse: { value: lagPass.target.texture },
    uTime: { value: 1 },
    uProgress: { value: 1.2 },
    uBoot: { value: 0 },
  });
  // The former three.js sRGBEncoding flag now uses texture.colorSpace.
  screenPass.target.texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshStandardMaterial({
    map: screenPass.target.texture,
    metalness: 0,
    roughness: 0.125,
    envMapIntensity: 0.7,
    toneMapped: false,
  });

  let disposed = false;
  let fontReady = false;
  let dirty = true;
  let input = '';
  let history = [];
  let lastCanvasFrame = -1;
  let startTime;
  let terminalMode = false;
  const pixelFont = 'CRT-Public-Pixel';
  if (typeof FontFace !== 'undefined') {
    const font = new FontFace(pixelFont, `url(${import.meta.env.BASE_URL}assets/public-pixel.woff)`);
    font.load().then(loaded => {
      if (disposed) return;
      document.fonts.add(loaded);
      fontReady = true;
      dirty = true;
    }).catch(() => { dirty = true; });
  }

  function font(size, weight = 'normal') {
    ctx.font = fontReady
      ? `${weight} ${size}px "${pixelFont}", monospace`
      : `${weight} ${Math.round(size * 1.4)}px "Courier New", monospace`;
  }

  function text(value, x, y, size = 15, maxWidth) {
    font(size);
    if (maxWidth) ctx.fillText(value, x, y, maxWidth);
    else ctx.fillText(value, x, y);
  }

  // The supplied PNG already contains the gold phosphor/dither treatment.
  // Keep its transparency and aspect ratio, then apply the shared CRT pipeline.
  function drawPortrait(alpha) {
    if (alpha <= 0) return;
    portraitContext.save();
    portraitContext.globalAlpha = alpha;
    const width = 300;
    const height = width * portrait.naturalHeight / portrait.naturalWidth;
    portraitContext.drawImage(portrait, 420, 38, width, height);
    portraitContext.restore();
  }

  function drawTitle(time) {
    const reveal = Math.max(0, Math.floor((time - 0.4) * 75));
    let remaining = reveal;
    function typed(value, x, y, size, maxWidth) {
      const rendered = value.slice(0, Math.max(0, remaining));
      remaining -= value.length;
      text(rendered, x, y, size, maxWidth);
    }
    drawPortrait(Math.min(1, Math.max(0, time - 0.5)));
    typed('Hi there, I\'m', 49, 106, 17);
    const name = 'André Leal';
    const visibleName = name.slice(0, Math.max(0, remaining));
    remaining -= name.length;
    if (visibleName) {
      font(25);
      const nameWidth = Math.min(360, ctx.measureText(visibleName).width + 14);
      ctx.fillRect(46, 131, nameWidth, 40);
      ctx.fillStyle = '#000000';
      text(visibleName, 53, 159, 25, 345);
      ctx.fillStyle = AMBER;
    }
    typed('• Junior Full Stack Developer', 49, 210, 13.5, 350);
    typed('• Porto, Portugal', 49, 246, 14);
    typed('Welcome to LEAL-Linux 1.0 LTS', 49, 406, 15);
    typed('→→ Scroll or type help to get started', 49, 442, 14, 651);
    const prompt = 'andre@portfolio:~$ ' + input;
    text(prompt.slice(-48), 49, 515, 13, 655);
    if (Math.floor(time * 2) % 2 === 0) {
      font(13);
      const caretX = Math.min(704, 49 + ctx.measureText(prompt.slice(-48)).width);
      ctx.fillRect(caretX, 501, 12, 20);
    }
  }

  function drawTerminal(time) {
    text('LEAL-Linux / André Leal', 49, 61, 16);
    ctx.globalAlpha = 0.6;
    ctx.fillRect(49, 80, 661, 1);
    ctx.globalAlpha = 1;
    const lines = history.flatMap(line => wrapLine(line));
    const visible = lines.slice(-12);
    for (let i = 0; i < visible.length; i++) text(visible[i], 49, 115 + i * 30, 12.5, 660);
    const prompt = 'andre@portfolio:~$ ' + input;
    text(prompt.slice(-49), 49, 515, 12.5, 660);
    if (Math.floor(time * 2) % 2 === 0) {
      font(12.5);
      const caretX = Math.min(704, 49 + ctx.measureText(prompt.slice(-49)).width);
      ctx.fillRect(caretX, 501, 12, 20);
    }
  }

  function draw(time) {
    portraitContext.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = AMBER;
    ctx.textBaseline = 'alphabetic';
    ctx.imageSmoothingEnabled = false;
    if (terminalMode) drawTerminal(time);
    else drawTitle(time);
    canvasTexture.needsUpdate = true;
    portraitTexture.needsUpdate = true;
    dirty = false;
  }

  const onCommand = event => {
    const detail = event.detail || {};
    const command = String(detail.command || '').trim();
    if (command === 'clear' || command === 'home') {
      history = [];
      terminalMode = false;
    } else {
      terminalMode = true;
      history.push(`andre@portfolio:~$ ${command}`);
      if (Array.isArray(detail.response)) history.push(...detail.response.map(String));
      else if (detail.response != null) history.push(...String(detail.response).split('\n'));
      history.push('');
      history = history.slice(-120);
    }
    input = '';
    dirty = true;
  };
  const onInput = event => { input = String(event.detail?.value || ''); dirty = true; };
  const onReset = () => { history = []; input = ''; terminalMode = false; dirty = true; };
  window.addEventListener('portfolio-terminal', onCommand);
  window.addEventListener('portfolio-terminal-input', onInput);
  window.addEventListener('portfolio-terminal-reset', onReset);

  // Initialize all accumulation targets explicitly so the first frame is black.
  const previousTarget = renderer.getRenderTarget();
  const previousClear = renderer.getClearColor(new THREE.Color());
  const previousAlpha = renderer.getClearAlpha();
  renderer.setClearColor(0x000000, 1);
  for (const target of [lagPass.target, copyPass.target, screenPass.target]) {
    renderer.setRenderTarget(target);
    renderer.clear();
  }
  renderer.setRenderTarget(previousTarget);
  renderer.setClearColor(previousClear, previousAlpha);
  draw(0);

  const tickClearColor = new THREE.Color();
  function tick(delta, elapsed) {
    if (disposed) return;
    if (startTime === undefined) startTime = elapsed;
    const time = Math.max(0, elapsed - startTime);
    // Bloom depends only on the canvas content. Cache its composition between
    // changes; noise, scanlines and phosphor lag remain animated every frame.
    const frame = Math.floor(time * (!terminalMode && time < 4 ? 24 : 2));
    const contentChanged = dirty || frame !== lastCanvasFrame;
    if (contentChanged) {
      draw(time);
      lastCanvasFrame = frame;
    }
    const target = renderer.getRenderTarget();
    const clearColor = renderer.getClearColor(tickClearColor);
    const clearAlpha = renderer.getClearAlpha();
    const autoClear = renderer.autoClear;
    const toneMapping = renderer.toneMapping;
    renderer.autoClear = true;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setClearColor(0x000000, 1);
    if (contentChanged) composer.render(delta);
    lagPass.material.uniforms.uDiffuse.value = composer.readBuffer.texture;
    lagPass.render(renderer);
    copyPass.render(renderer);
    screenPass.material.uniforms.uTime.value = elapsed + 1;
    screenPass.material.uniforms.uProgress.value = 1.2 - (time * 0.2) % 1.2;
    screenPass.material.uniforms.uBoot.value = Math.min(1, time / 0.65);
    screenPass.render(renderer);
    renderer.setRenderTarget(target);
    renderer.setClearColor(clearColor, clearAlpha);
    renderer.autoClear = autoClear;
    renderer.toneMapping = toneMapping;
  }

  function dispose() {
    disposed = true;
    window.removeEventListener('portfolio-terminal', onCommand);
    window.removeEventListener('portfolio-terminal-input', onInput);
    window.removeEventListener('portfolio-terminal-reset', onReset);
    canvasTexture.dispose();
    portraitTexture.dispose();
    portraitMaterial.dispose();
    textGeometry.dispose();
    textMaterial.dispose();
    bloomPass.dispose();
    composer.dispose();
    lagPass.dispose();
    copyPass.dispose();
    screenPass.dispose();
    material.dispose();
  }

  return { material, tick, dispose };
}
