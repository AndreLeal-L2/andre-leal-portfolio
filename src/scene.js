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
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const showStatic = () => {
    container.classList.remove('scene-ready', 'scene-unavailable');
    container.classList.add('scene-static');
    container.style.opacity = '';
    container.style.pointerEvents = '';
    window.dispatchEvent(new CustomEvent('portfolio-scene-static'));
  };
  if (reducedMotion.matches) {
    showStatic();
    return;
  }
  container.classList.remove('scene-static');
  container.dataset.initialized = 'true';

  let renderer;
  let computer;
  let crtScreen;
  let bakedTexture;
  let floorTexture;
  let environmentTexture;
  let loadedModel;
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
    if (stopped) return;
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
    releaseModel(loadedModel);
    renderer?.dispose();
    renderer?.domElement.remove();
    delete container.dataset.initialized;
  }

  function releaseModel(model) {
    model?.scene.traverse(object => {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => material?.dispose());
    });
  }

  function managedLoad(promise, retain, release) {
    return promise.then(resource => {
      if (stopped) {
        release(resource);
        return null;
      }
      retain(resource);
      return resource;
    });
  }

  const stopForStatic = () => {
    dispose();
    showStatic();
  };
  // Register before loading so an opt-out or preference change also cancels
  // initialization. Late loader results are released by managedLoad.
  listen(window, 'portfolio-scene-stop', stopForStatic);
  listen(reducedMotion, 'change', event => {
    if (event.matches) stopForStatic();
  });

  try {
    renderer = new THREE.WebGLRenderer({ antialias: false });
    const pixelRatio = () => Math.min(window.devicePixelRatio || 1,
      window.matchMedia('(max-width: 760px), (pointer: coarse)').matches ? 1.5 : 2);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-label', 'Retro computer showing André Leal’s portrait. Drag to look around, or type to use the terminal.');
    container.append(renderer.domElement);
    listen(renderer.domElement, 'webglcontextlost', event => {
      event.preventDefault();
      stopForStatic();
    });

    const sizes = {
      width: Math.max(1, container.clientWidth),
      height: Math.max(1, container.clientHeight),
    };
    sizes.portraitOffset = mapClamped(sizes.height / sizes.width, [0.75, 1.75], [0, 2]);
    let targetScroll = THREE.MathUtils.clamp(window.scrollY / sizes.height, 0, 2);
    let scroll = targetScroll;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6d4b1);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 100);
    camera.position.set(0, 0, -2.5);
    camera.rotation.set(-Math.PI, 0, Math.PI);
    scene.add(camera);
    renderer.setDrawingBufferSize(sizes.width, sizes.height, pixelRatio());

    const syncViewport = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const ratio = pixelRatio();
      if (sizes.width === width && sizes.height === height && renderer.getPixelRatio() === ratio) return;
      sizes.width = width;
      sizes.height = height;
      sizes.portraitOffset = mapClamped(height / width, [0.75, 1.75], [0, 2]);
      targetScroll = THREE.MathUtils.clamp(window.scrollY / height, 0, 2);
      scroll = targetScroll;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setDrawingBufferSize(width, height, ratio);
    };

    const loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = (url, loaded, total) => {
      if (stopped) return;
      window.dispatchEvent(new CustomEvent('portfolio-scene-progress', { detail: { url, loaded, total } }));
    };
    const textureLoader = new THREE.TextureLoader(loadingManager);
    const [gltf] = await Promise.all([
      managedLoad(new GLTFLoader(loadingManager).loadAsync(`${ASSETS}retro-computer.glb`), model => { loadedModel = model; }, releaseModel),
      managedLoad(textureLoader.loadAsync(`${ASSETS}computer-bake.jpg`), texture => { bakedTexture = texture; }, texture => texture.dispose()),
      managedLoad(textureLoader.loadAsync(`${ASSETS}computer-floor.jpg`), texture => { floorTexture = texture; }, texture => texture.dispose()),
      managedLoad(new THREE.CubeTextureLoader(loadingManager).loadAsync(['px', 'nx', 'py', 'ny', 'pz', 'nz'].map(side => `${ASSETS}environmentMap/${side}.jpg`)), texture => { environmentTexture = texture; }, texture => texture.dispose()),
    ]);
    if (stopped) return;
    await managedLoad(createCRTScreen(renderer), screen => { crtScreen = screen; }, screen => screen.dispose());
    if (stopped) return;
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
      targetScroll = THREE.MathUtils.clamp(window.scrollY / sizes.height, 0, 2);
    }, { passive: true });
    listen(window, 'resize', () => {
      // CSS keeps this viewport stable while mobile browser toolbars retract.
      // Do not reallocate the drawing buffer for unchanged dimensions.
      syncViewport();
    }, { passive: true });

    const cameraTarget = new THREE.Vector3(0, 0, 0);
    let previousTime = performance.now();
    const startTime = previousTime;
    let previousOpacity = -1;

    function render(time) {
      if (stopped) return;
      animationFrame = requestAnimationFrame(render);
      const delta = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;
      const elapsed = (time - startTime) / 1000;
      // Touch events can arrive less often than display frames. Follow the
      // latest position with the same short response at every refresh rate.
      scroll = THREE.MathUtils.damp(scroll, targetScroll, 20, delta);
      if (Math.abs(scroll - targetScroll) < 0.0001) scroll = targetScroll;
      const zoom = mapClamped(scroll, [0, 1], [0, 1]);

      camera.position.z = mapClamped(scroll, [0, 1], [-2.5 - sizes.portraitOffset, -10 - sizes.portraitOffset]);
      computer.position.x = 0.5 * zoom;
      computer.position.y = mapClamped(scroll, [0, 1], [0, 1.5]);
      computer.rotation.y = Math.PI * 0.2 * zoom;
      computer.rotation.z = sizes.portraitOffset > 0.5 ? mapClamped(scroll, [0, 1], [-Math.PI / 2, 0]) : 0;

      camera.position.x = THREE.MathUtils.damp(camera.position.x, computerParallax.x * mapClamped(scroll, [0, 1], [0.2, 5]), 6, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, computerParallax.y * mapClamped(scroll, [0, 1], [0.2, 1.5]), 6, delta);
      camera.lookAt(cameraTarget);
      const opacity = mapClamped(scroll, [1.25, 1.75], [1, 0]);
      if (opacity !== previousOpacity) {
        container.style.opacity = String(opacity);
        container.style.pointerEvents = opacity === 0 ? 'none' : '';
        previousOpacity = opacity;
      }

      if (crtMesh.morphTargetInfluences) {
        crtMesh.morphTargetInfluences[0] = mapClamped(zoom, [0, 0.1], [0.5, 0]);
      }
      if (opacity === 0 || document.hidden) return;
      crtScreen.tick(delta, elapsed);
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    }

    // Rotation, browser resizing or scroll may have happened while assets
    // loaded, before the normal interaction listeners were installed.
    syncViewport();
    targetScroll = THREE.MathUtils.clamp(window.scrollY / sizes.height, 0, 2);
    scroll = targetScroll;
    render(previousTime);
    container.classList.remove('scene-unavailable');
    container.classList.add('scene-ready');
    window.dispatchEvent(new CustomEvent('portfolio-scene-ready'));

    return dispose;
  } catch (error) {
    if (stopped) return;
    dispose();
    container.classList.remove('scene-ready');
    container.classList.add('scene-unavailable');
    console.warn('The interactive computer could not be loaded.', error);
    window.dispatchEvent(new CustomEvent('portfolio-scene-error'));
  }
}
