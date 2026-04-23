/* ============================================
   VaultTag — Three.js Scene Setup
   3D shoe viewer with orbit controls
   ============================================ */

// Using Three.js from CDN (loaded in HTML)
// import * as THREE from 'three';

/**
 * Create a 3D shoe viewer in a container element
 * Uses a stylized geometric shoe as placeholder when no GLTF model is available
 */
function createShoeViewer(container, options = {}) {
  const {
    autoRotate = true,
    rotateSpeed = 0.005,
    enableZoom = true,
    enablePan = false,
    backgroundColor = 0x050810,
    accentColor = 0x00D4AA,
    shoeColor = options.shoeColor || 0xE8E8ED,
    shoeAccent = options.shoeAccent || 0xE24B4A,
    interactive = true
  } = options;

  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundColor);
  scene.fog = new THREE.Fog(backgroundColor, 8, 20);

  // Camera
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(3, 2, 4);
  camera.lookAt(0, 0.3, 0);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  // ── Lights ──
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
  mainLight.position.set(5, 8, 5);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.set(1024, 1024);
  mainLight.shadow.camera.near = 0.5;
  mainLight.shadow.camera.far = 50;
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
  fillLight.position.set(-5, 3, -5);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(accentColor, 0.8, 10);
  rimLight.position.set(-3, 2, -2);
  scene.add(rimLight);

  // Accent spotlight from below
  const accentSpot = new THREE.SpotLight(accentColor, 0.5, 10, Math.PI / 6);
  accentSpot.position.set(0, -2, 0);
  accentSpot.target.position.set(0, 0, 0);
  scene.add(accentSpot);
  scene.add(accentSpot.target);

  // ── Ground Plane with glow ──
  const groundGeo = new THREE.CircleGeometry(3, 64);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0A0E27,
    metalness: 0.8,
    roughness: 0.4,
    transparent: true,
    opacity: 0.6
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5;
  ground.receiveShadow = true;
  scene.add(ground);

  // Glow ring on ground
  const ringGeo = new THREE.RingGeometry(1.5, 1.7, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.49;
  scene.add(ring);

  // ── Build Stylized Shoe ──
  const shoeGroup = new THREE.Group();

  // Sole
  const soleShape = new THREE.Shape();
  soleShape.moveTo(-1.2, -0.4);
  soleShape.lineTo(1.4, -0.4);
  soleShape.quadraticCurveTo(1.6, -0.4, 1.6, -0.2);
  soleShape.lineTo(1.5, 0);
  soleShape.lineTo(-1.3, 0);
  soleShape.quadraticCurveTo(-1.4, -0.1, -1.2, -0.4);

  const soleExtrudeSettings = { steps: 1, depth: 0.8, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 };
  const soleGeo = new THREE.ExtrudeGeometry(soleShape, soleExtrudeSettings);
  const soleMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, metalness: 0.1 });
  const sole = new THREE.Mesh(soleGeo, soleMat);
  sole.position.set(0, -0.3, -0.4);
  sole.castShadow = true;
  shoeGroup.add(sole);

  // Midsole
  const midGeo = new THREE.BoxGeometry(2.8, 0.15, 0.9);
  midGeo.translate(0.1, 0, 0);
  const midMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.1 });
  const midsole = new THREE.Mesh(midGeo, midMat);
  midsole.position.set(0, -0.15, 0);
  midsole.castShadow = true;
  shoeGroup.add(midsole);

  // Upper body
  const upperGeo = new THREE.BoxGeometry(2.4, 0.7, 0.85);
  upperGeo.translate(0, 0.15, 0);
  const upperMat = new THREE.MeshStandardMaterial({ color: shoeColor, roughness: 0.5, metalness: 0.05 });
  const upper = new THREE.Mesh(upperGeo, upperMat);
  upper.position.set(0.1, 0, 0);
  upper.castShadow = true;
  shoeGroup.add(upper);

  // Toe cap
  const toeGeo = new THREE.SphereGeometry(0.45, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const toeMat = new THREE.MeshStandardMaterial({ color: shoeColor, roughness: 0.4, metalness: 0.05 });
  const toe = new THREE.Mesh(toeGeo, toeMat);
  toe.rotation.z = -Math.PI / 2;
  toe.position.set(1.3, 0.05, 0);
  toe.scale.set(1, 0.8, 0.95);
  toe.castShadow = true;
  shoeGroup.add(toe);

  // Ankle collar
  const collarGeo = new THREE.CylinderGeometry(0.35, 0.42, 0.5, 16, 1, true);
  const collarMat = new THREE.MeshStandardMaterial({ color: shoeAccent, roughness: 0.5, metalness: 0.1 });
  const collar = new THREE.Mesh(collarGeo, collarMat);
  collar.position.set(-0.6, 0.55, 0);
  collar.castShadow = true;
  shoeGroup.add(collar);

  // Swoosh / accent stripe
  const swooshGeo = new THREE.BoxGeometry(1.5, 0.08, 0.02);
  const swooshMat = new THREE.MeshStandardMaterial({ color: shoeAccent, roughness: 0.3, metalness: 0.3, emissive: shoeAccent, emissiveIntensity: 0.1 });
  const swoosh = new THREE.Mesh(swooshGeo, swooshMat);
  swoosh.position.set(0.2, 0.15, 0.44);
  swoosh.rotation.z = -0.15;
  shoeGroup.add(swoosh);

  // Swoosh other side
  const swoosh2 = swoosh.clone();
  swoosh2.position.z = -0.44;
  shoeGroup.add(swoosh2);

  // Lace area dots
  for (let i = 0; i < 5; i++) {
    const dotGeo = new THREE.SphereGeometry(0.03, 8, 8);
    const dotMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(0.4 - i * 0.25, 0.38, 0.15);
    shoeGroup.add(dot);
    const dot2 = dot.clone();
    dot2.position.z = -0.15;
    shoeGroup.add(dot2);
  }

  shoeGroup.position.y = 0.3;
  shoeGroup.scale.set(0.8, 0.8, 0.8);
  scene.add(shoeGroup);

  // ── Floating particles around shoe ──
  const particlesGeo = new THREE.BufferGeometry();
  const particleCount = 50;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 1] = Math.random() * 4 - 1;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
  }
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particlesMat = new THREE.PointsMaterial({ color: accentColor, size: 0.03, transparent: true, opacity: 0.6 });
  const particles = new THREE.Points(particlesGeo, particlesMat);
  scene.add(particles);

  // ── Orbit Controls (manual implementation) ──
  let isDragging = false;
  let previousMouse = { x: 0, y: 0 };
  let rotation = { x: 0.3, y: 0 };
  let targetRotation = { x: 0.3, y: 0 };
  let zoom = 4;
  let targetZoom = 4;

  if (interactive) {
    renderer.domElement.addEventListener('mousedown', (e) => {
      isDragging = true;
      previousMouse = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - previousMouse.x;
      const dy = e.clientY - previousMouse.y;
      targetRotation.y += dx * 0.005;
      targetRotation.x += dy * 0.005;
      targetRotation.x = Math.max(-0.5, Math.min(1.2, targetRotation.x));
      previousMouse = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('mouseup', () => isDragging = false);
    renderer.domElement.addEventListener('mouseleave', () => isDragging = false);

    // Touch
    renderer.domElement.addEventListener('touchstart', (e) => {
      isDragging = true;
      previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });

    renderer.domElement.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - previousMouse.x;
      const dy = e.touches[0].clientY - previousMouse.y;
      targetRotation.y += dx * 0.005;
      targetRotation.x += dy * 0.005;
      targetRotation.x = Math.max(-0.5, Math.min(1.2, targetRotation.x));
      previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: false });

    renderer.domElement.addEventListener('touchend', () => isDragging = false);

    if (enableZoom) {
      renderer.domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        targetZoom += e.deltaY * 0.005;
        targetZoom = Math.max(2.5, Math.min(7, targetZoom));
      }, { passive: false });
    }
  }

  // ── Animation Loop ──
  let animFrame;
  const clock = new THREE.Clock();

  function animate() {
    animFrame = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    // Auto rotate
    if (autoRotate && !isDragging) {
      targetRotation.y += rotateSpeed;
    }

    // Smooth interpolation
    rotation.x += (targetRotation.x - rotation.x) * 0.08;
    rotation.y += (targetRotation.y - rotation.y) * 0.08;
    zoom += (targetZoom - zoom) * 0.08;

    // Update camera position
    camera.position.x = Math.sin(rotation.y) * zoom;
    camera.position.z = Math.cos(rotation.y) * zoom;
    camera.position.y = 1 + rotation.x * 2;
    camera.lookAt(0, 0.3, 0);

    // Floating shoe animation
    shoeGroup.position.y = 0.3 + Math.sin(elapsed * 0.8) * 0.08;
    shoeGroup.rotation.y = Math.sin(elapsed * 0.3) * 0.05;

    // Ring pulse
    ring.material.opacity = 0.15 + Math.sin(elapsed * 2) * 0.05;

    // Particle drift
    const posArr = particlesGeo.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      posArr[i * 3 + 1] += Math.sin(elapsed + i) * 0.001;
    }
    particlesGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }
  animate();

  // ── Resize ──
  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  window.addEventListener('resize', onResize);

  // Return controller object
  return {
    scene, camera, renderer, shoeGroup,
    setShoeColor(mainColor, accentColor) {
      upperMat.color.setHex(mainColor);
      toeMat.color.setHex(mainColor);
      collarMat.color.setHex(accentColor);
      swooshMat.color.setHex(accentColor);
      swooshMat.emissive.setHex(accentColor);
    },
    destroy() {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    }
  };
}
