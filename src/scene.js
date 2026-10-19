import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createCRTScreen } from './crt-screen.js';

// Camera, scroll choreography, model and baked lighting by Edward Hinrichsen.
// Adapted from his MIT-licensed retro-computer-website; see THIRD_PARTY_LICENSES.md.
const ASSETS = `${import.meta.env.BASE_URL}assets/`;

function mapClamped(value, from, to) {
  const progress = THREE.MathUtils.clamp((value - from[0]) / (from[1] - from[0]), 0, 1);
  return to[0] + progress * (to[1] - to[0]);
}

export async function initScene() {
  const container = document.querySelector('#computer-scene');
  if (!container || container.dataset.initialized) return;
  container.dataset.initialized = 'true';

  let renderer;
  let computer;
  let crtScreen;
  let bakedTexture;
  let floorTexture;
  let environmentTexture;
  let shellMaterial;
  let shadowMaterial;
  let animationFrame;
  let stopped = false;
  const cleanups = [];

  function listen(target, type, callback, options) {
    target.addEventListener(type, callback, options);
    cleanups.push(() => target.removeEventListener(type, callback, options));
  }

  function dispose() {
    stopped = true;
    cancelAnimationFrame(animationFrame);
    cleanups.splice(0).forEach(cleanup => cleanup());
    crtScreen?.dispose();
    bakedTexture?.dispose();
    floorTexture?.dispose();
    environmentTexture?.dispose();
    shellMaterial?.dispose();
    shadowMaterial?.dispose();
    computer?.traverse(object => object.geometry?.dispose());
    renderer?.dispose();
    renderer?.domElement.remove();
    delete container.dataset.initialized;
  }

  try {
    renderer = new THREE.WebGLRenderer({ antialias: false });
    const pixelRatio = () => Math.min(window.devicePixelRatio || 1,
      window.matchMedia('(max-width: 760px), (pointer: coarse)').matches ? 1.5 : 2);
    renderer.setPixelRatio(pixelRatio());
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-label', 'Retro computer showing André Leal’s portrait. Drag to look around, or type to use the terminal.');
    container.append(renderer.domElement);

    let viewHeight = document.documentElement.clientHeight;
    let scroll = window.scrollY / viewHeight;
    const sizes = {
      width: document.documentElement.clientWidth,
      height: window.innerHeight,
      portraitOffset: mapClamped(window.innerHeight / document.documentElement.clientWidth, [0.75, 1.75], [0, 2]),
    };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6d4b1);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 100);
    camera.position.set(0, 0, -2.5);
    camera.rotation.set(-Math.PI, 0, Math.PI);
    scene.add(camera);
    renderer.setSize(sizes.width, sizes.height);

    const loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = (url, loaded, total) => {
      window.dispatchEvent(new CustomEvent('portfolio-scene-progress', { detail: { url, loaded, total } }));
    };
    const textureLoader = new THREE.TextureLoader(loadingManager);
    const [gltf, bake, floor, environment, screen] = await Promise.all([
      new GLTFLoader(loadingManager).loadAsync(`${ASSETS}retro-computer.glb`),
      textureLoader.loadAsync(`${ASSETS}computer-bake.jpg`),
      textureLoader.loadAsync(`${ASSETS}computer-floor.jpg`),
      new THREE.CubeTextureLoader(loadingManager).loadAsync(['px', 'nx', 'py', 'ny', 'pz', 'nz'].map(side => `${ASSETS}environmentMap/${side}.jpg`)),
      createCRTScreen(renderer),
    ]);
    bakedTexture = bake;
    floorTexture = floor;
    environmentTexture = environment;
    crtScreen = screen;
    bakedTexture.flipY = false;
    bakedTexture.colorSpace = THREE.SRGBColorSpace;
    floorTexture.flipY = false;
    floorTexture.colorSpace = THREE.SRGBColorSpace;
    environmentTexture.colorSpace = THREE.SRGBColorSpace;
    crtScreen.material.envMap = environmentTexture;
    crtScreen.material.envMapIntensity = 0.7;
    crtScreen.material.needsUpdate = true;
    shellMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });
    shadowMaterial = new THREE.MeshBasicMaterial({ map: floorTexture });

    computer = new THREE.Group();
    let crtMesh;
    for (const name of ['Screen', 'Computer', 'CRT', 'Keyboard', 'ShadowPlane']) {
      const mesh = gltf.scene.getObjectByName(name);
      if (!mesh) throw new Error(`The computer asset is missing ${name}.`);
      mesh.material = name === 'Screen' ? crtScreen.material : name === 'ShadowPlane' ? shadowMaterial : shellMaterial;
      if (name === 'CRT') crtMesh = mesh;
      // The source model's origin is also the camera target. Keeping its native
      // transforms preserves the transition from the screen to the full model.
      computer.add(mesh);
    }
    scene.add(computer);

    const computerParallax = { x: 0, y: 0 };
    let mouseDown = null;
    let dragged = false;
    const canvas = renderer.domElement;
    const checkIfTouch = event => {
      if (event.pointerType !== 'mouse') {
        mouseDown = null;
        computerParallax.x = 0;
        computerParallax.y = 0;
        return true;
      }
      return false;
    };
    listen(canvas, 'pointerdown', event => {
      dragged = false;
      if (checkIfTouch(event)) return;
      mouseDown = { x: event.clientX, y: event.clientY };
    }, { passive: true });
    listen(canvas, 'pointermove', event => {
      if (checkIfTouch(event) || !mouseDown) return;
      if (Math.abs(event.clientX - mouseDown.x) + Math.abs(event.clientY - mouseDown.y) > 3) dragged = true;
      computerParallax.x = THREE.MathUtils.clamp(computerParallax.x + (event.clientX - mouseDown.x) / (window.innerWidth * 0.5), -1, 1);
      computerParallax.y = THREE.MathUtils.clamp(computerParallax.y + (event.clientY - mouseDown.y) / (window.innerHeight * 0.5), -1, 1);
      mouseDown = { x: event.clientX, y: event.clientY };
    }, { passive: true });
    listen(document, 'pointerup', event => {
      checkIfTouch(event);
      mouseDown = null;
    }, { passive: true });
    listen(canvas, 'click', event => {
      // Touch scrolling and incidental taps should not open the keyboard.
      // The visible mobile terminal button provides an explicit entry point.
      if (!dragged && (!event.pointerType || event.pointerType === 'mouse')) document.querySelector('#open-terminal')?.click();
    });

    listen(window, 'scroll', () => {
      scroll = window.scrollY / viewHeight;
    }, { passive: true });
    listen(window, 'resize', () => {
      viewHeight = document.documentElement.clientHeight;
      const widthChanged = sizes.width !== document.documentElement.clientWidth;
      sizes.width = document.documentElement.clientWidth;
      sizes.height = window.innerHeight;
      // Keep framing steady when browser chrome or the keyboard changes height.
      if (widthChanged) sizes.portraitOffset = mapClamped(sizes.height / sizes.width, [0.75, 1.75], [0, 2]);
      scroll = window.scrollY / viewHeight;
      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(pixelRatio());
      renderer.setSize(sizes.width, sizes.height);
    }, { passive: true });

    const cameraTarget = new THREE.Vector3(0, 0, 0);
    let previousTime = performance.now();
    const startTime = previousTime;

    function render(time) {
      if (stopped) return;
      animationFrame = requestAnimationFrame(render);
      const delta = (time - previousTime) / 1000;
      previousTime = time;
      const elapsed = (time - startTime) / 1000;
      const zoom = mapClamped(scroll, [0, 1], [0, 1]);

      camera.position.z = mapClamped(scroll, [0, 1], [-2.5 - sizes.portraitOffset, -10 - sizes.portraitOffset]);
      computer.position.x = 0.5 * zoom;
      computer.position.y = mapClamped(scroll, [0, 1], [0, 1.5]);
      computer.rotation.y = Math.PI * 0.2 * zoom;
      computer.rotation.z = sizes.portraitOffset > 0.5 ? mapClamped(scroll, [0, 1], [-Math.PI / 2, 0]) : 0;

      camera.position.x = computerParallax.x * mapClamped(scroll, [0, 1], [0.2, 5]) * 0.1 + camera.position.x * 0.9;
      camera.position.y = computerParallax.y * mapClamped(scroll, [0, 1], [0.2, 1.5]) * 0.1 + camera.position.y * 0.9;
      camera.lookAt(cameraTarget);
      const opacity = mapClamped(scroll, [1.25, 1.75], [1, 0]);
      container.style.opacity = String(opacity);
      container.style.pointerEvents = opacity === 0 ? 'none' : '';

      if (crtMesh.morphTargetInfluences) {
        crtMesh.morphTargetInfluences[0] = mapClamped(zoom, [0, 0.1], [0.5, 0]);
      }
      if (opacity === 0 || document.hidden) return;
      crtScreen.tick(delta, elapsed);
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    }

    render(previousTime);
    container.classList.remove('scene-unavailable');
    container.classList.add('scene-ready');
    window.dispatchEvent(new CustomEvent('portfolio-scene-ready'));

    listen(canvas, 'webglcontextlost', event => {
      event.preventDefault();
      dispose();
      container.classList.remove('scene-ready');
      container.classList.add('scene-unavailable');
    });
    return dispose;
  } catch (error) {
    dispose();
    container.classList.remove('scene-ready');
    container.classList.add('scene-unavailable');
    console.warn('The interactive computer could not be loaded.', error);
    window.dispatchEvent(new CustomEvent('portfolio-scene-error'));
  }
}
