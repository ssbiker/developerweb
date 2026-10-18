/* ══════════════════════════════════════════════════
   bg3d.js — Three.js Cinematic 3D Scroller: El Reactor de Tritio Solar
   24K Gold Polygonal Dormant Sphere -> Plasma Fusion Ignition & Gimbal Rings
   Physically Based Rendering (PBR) with real-time dynamic studio lights
   ══════════════════════════════════════════════════ */

(function () {
  'use strict';

  var canvas = document.getElementById('bg3d');
  if (!canvas || typeof THREE === 'undefined') return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 1. Scene, Camera, Renderer (High-Precision PBR) ──
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 7.2;

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // ── 2. Cinematic Lighting System (PBR Studio & Core Emitter) ──
  // A. Warm Ambient Base (Rich warm golden radiance)
  var ambientLight = new THREE.AmbientLight(0x554020, 2.0);
  scene.add(ambientLight);

  // B. Key Studio Light (High-angle warm sunlight for crisp 24K gold specular highlights)
  var keyLight = new THREE.DirectionalLight(0xFFF3D6, 3.2);
  keyLight.position.set(6, 8, 5);
  scene.add(keyLight);

  // C. Front Fill Light (Direct camera illumination so gold facets gleam brightly)
  var frontLight = new THREE.DirectionalLight(0xFFE5A3, 2.5);
  frontLight.position.set(0, 2, 7);
  scene.add(frontLight);

  // D. Rim / Backlight (Cinematic cool titanium counter-light for razor-sharp edge contrast)
  var rimLight = new THREE.DirectionalLight(0x6688BB, 1.4);
  rimLight.position.set(-7, -4, -4);
  scene.add(rimLight);

  // E. Tritium Plasma Core PointLight (Real-time dynamic emitter inside the reactor)
  var tritiumLight = new THREE.PointLight(0xFFAA00, 0.4, 20, 2);
  scene.add(tritiumLight);

  // ── 3. Holographic 3D Reactor System ──
  var coreGroup = new THREE.Group();
  scene.add(coreGroup);

  // Attach tritiumLight to coreGroup so it travels with the reactor during scroll
  coreGroup.add(tritiumLight);

  // ── A. Coraza Exterior Facetada de Oro 24K (Esfera Poligonal Inactiva) ──
  var goldShellGeo = new THREE.IcosahedronGeometry(1.5, 1);
  var goldShellMat = new THREE.MeshStandardMaterial({
    color: 0xF5C542,         // Oro 24K real
    emissive: 0x3A2805,      // Calidez interna dorada para evitar facetas muertas
    metalness: 0.72,         // Equilibrio perfecto entre brillo metálico y color difuso
    roughness: 0.28,         // Acabado satinado de joyería de alta gama
    flatShading: true,       // Facetas triangulares nítidas
    transparent: true,
    opacity: 0.98
  });
  var goldShellMesh = new THREE.Mesh(goldShellGeo, goldShellMat);
  coreGroup.add(goldShellMesh);

  // Bisel dorado brillante en las aristas de las placas
  var goldSeamsGeo = new THREE.IcosahedronGeometry(1.506, 1);
  var goldSeamsMat = new THREE.MeshStandardMaterial({
    color: 0xFFEAA0,
    emissive: 0x886611,
    metalness: 0.95,
    roughness: 0.15,
    wireframe: true,
    transparent: true,
    opacity: 0.75
  });
  var goldSeamsMesh = new THREE.Mesh(goldSeamsGeo, goldSeamsMat);
  coreGroup.add(goldSeamsMesh);

  // ── B. El Sol de Tritio Interno (Plasma Nuclear Incandescente) ──
  var plasmaCoreGeo = new THREE.SphereGeometry(0.85, 32, 32);
  var plasmaCoreMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    emissive: 0xFFAA00,
    emissiveIntensity: 0.35,
    roughness: 0.1,
    metalness: 0.1
  });
  var plasmaCoreMesh = new THREE.Mesh(plasmaCoreGeo, plasmaCoreMat);
  plasmaCoreMesh.scale.setScalar(0.4); // Inicia comprimido dentro de la esfera
  coreGroup.add(plasmaCoreMesh);

  // Corona de plasma turbulento (Partículas ardientes de la corona solar)
  var coronaGeo = new THREE.IcosahedronGeometry(1.05, 2);
  var coronaMat = new THREE.PointsMaterial({
    color: 0xFFC72C,
    size: 0.05,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending
  });
  var coronaMesh = new THREE.Points(coronaGeo, coronaMat);
  coronaMesh.scale.setScalar(0.4);
  coreGroup.add(coronaMesh);

  // ── C. Anillos Gimbal de Confinamiento Magnético en Oro 24K ──
  var ringsGroup = new THREE.Group();
  coreGroup.add(ringsGroup);

  var ringMat = new THREE.MeshStandardMaterial({
    color: 0xE8B832,
    metalness: 0.95,
    roughness: 0.15
  });

  var ring1Geo = new THREE.TorusGeometry(2.1, 0.032, 16, 120);
  var ring1 = new THREE.Mesh(ring1Geo, ringMat);
  ring1.rotation.x = Math.PI / 3;
  ringsGroup.add(ring1);

  var ring2Geo = new THREE.TorusGeometry(2.5, 0.026, 16, 140);
  var ring2 = new THREE.Mesh(ring2Geo, ringMat);
  ring2.rotation.y = Math.PI / 4;
  ring2.rotation.x = -Math.PI / 6;
  ringsGroup.add(ring2);

  var ring3Geo = new THREE.TorusGeometry(2.9, 0.02, 16, 160);
  var ring3 = new THREE.Mesh(ring3Geo, ringMat);
  ring3.rotation.z = Math.PI / 5;
  ringsGroup.add(ring3);

  // ── 4. Nebulosa de Chispas Solares y Polvo de Oro ──
  var PARTICLE_COUNT = 2400;
  var particlesGeo = new THREE.BufferGeometry();
  var positions = new Float32Array(PARTICLE_COUNT * 3);
  var colors = new Float32Array(PARTICLE_COUNT * 3);

  var colorFireAmber = new THREE.Color(0xFF5500);  // Fuego ámbar profundo
  var colorSolarGold = new THREE.Color(0xFFB800);  // Oro solar brillante
  var colorWhiteHot   = new THREE.Color(0xFFF9E6);  // Blanco incandescente

  for (var i = 0; i < PARTICLE_COUNT; i++) {
    var radius = 2.4 + Math.random() * 14.5;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(Math.random() * 2 - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi) * 0.85;

    var mixedColor = Math.random() > 0.4
      ? colorSolarGold.clone().lerp(colorFireAmber, Math.random() * 0.8)
      : colorSolarGold.clone().lerp(colorWhiteHot, Math.random() * 0.7);

    colors[i * 3] = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;
  }

  particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  var particlesMat = new THREE.PointsMaterial({
    size: 0.042,
    vertexColors: true,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending
  });

  var particleSystem = new THREE.Points(particlesGeo, particlesMat);
  scene.add(particleSystem);

  // ── 5. Posicionamiento Responsivo Inicial ──
  var isMobile = window.innerWidth <= 860;
  if (!isMobile) {
    coreGroup.position.set(2.7, 0.05, 0.2);
  } else {
    coreGroup.position.set(0, -0.4, -1);
    coreGroup.scale.setScalar(0.75);
  }

  // ── 6. Física Reactiva al Mouse (Inercia con Lerp) ──
  var mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  window.addEventListener('mousemove', function (e) {
    mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // ── 7. Scroll Choreography & Ignition Logic ──
  var scrollProgress = 0;
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = max > 0 ? (window.scrollY || document.documentElement.scrollTop) / max : 0;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── 8. Animation Render Loop (60 FPS PBR) ──
  var clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    var delta = clock.getDelta();
    var time = clock.getElapsedTime();

    // Mouse lerp damping
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // A. Rotación base del artefacto de oro
    goldShellMesh.rotation.y += 0.25 * delta;
    goldShellMesh.rotation.x += 0.12 * delta;
    goldSeamsMesh.rotation.copy(goldShellMesh.rotation);

    // B. Rotación turbulenta del plasma solar
    plasmaCoreMesh.rotation.y -= 0.5 * delta;
    coronaMesh.rotation.y += 0.4 * delta;
    coronaMesh.rotation.x -= 0.2 * delta;

    // C. Rotación giroscópica de los anillos
    ring1.rotation.z += 0.5 * delta;
    ring2.rotation.x += 0.4 * delta;
    ring3.rotation.y += 0.35 * delta;

    // D. Deriva cósmica de las chispas solares
    particleSystem.rotation.y = time * 0.02 + mouse.x * 0.1;
    particleSystem.rotation.x = time * 0.01 + mouse.y * 0.1;

    // ── E. LÓGICA DE IGNICIÓN Y ACTIVACIÓN POR SCROLL ──
    // activationProgress: 0 en el Hero (inactivo) -> 1 al scrollear hacia abajo (fusión total)
    var activation = Math.min(1.0, Math.max(0.0, scrollProgress / 0.18));
    
    // Suavizado cúbico para la transición de ignición
    var smoothActivation = activation * activation * (3 - 2 * activation);

    // 1. Apertura de la coraza de oro 24K:
    // Inactivo: escala 1.0, opacidad 0.96 (sólido y facetado)
    // Activo: se expande mecánicamente a 1.48 y su opacidad baja a 0.52 para dejar escapar el fuego interior
    var targetShellScale = THREE.MathUtils.lerp(1.0, 1.48, smoothActivation);
    var targetShellOpacity = THREE.MathUtils.lerp(0.96, 0.52, smoothActivation);
    goldShellMesh.scale.setScalar(targetShellScale);
    goldSeamsMesh.scale.setScalar(targetShellScale * 1.002);
    goldShellMat.opacity = targetShellOpacity;

    // 2. Despliegue de los anillos de confinamiento:
    // Inactivo: compactos (escala 0.76) como abrazaderas de la esfera dorada
    // Activo: se expanden y desbloquean en 3D (escala 1.05)
    var targetRingsScale = THREE.MathUtils.lerp(0.76, 1.05, smoothActivation);
    ringsGroup.scale.setScalar(targetRingsScale);

    // 3. Ignición del Sol de Tritio:
    // Inactivo: escala 0.38, emisión tenue 0.35
    // Activo: crece a escala 1.25, emisión solar deslumbrante 4.2
    // Con respiración sinusoidal viva:
    var pulse = Math.sin(time * 3.5) * 0.06;
    var targetPlasmaScale = THREE.MathUtils.lerp(0.38, 1.22 + pulse, smoothActivation);
    var targetEmissive = THREE.MathUtils.lerp(0.35, 4.2 + pulse * 4, smoothActivation);
    plasmaCoreMesh.scale.setScalar(targetPlasmaScale);
    plasmaCoreMat.emissiveIntensity = targetEmissive;

    // 4. Corona de chispas ardientes:
    var targetCoronaScale = THREE.MathUtils.lerp(0.4, 1.35 + pulse * 1.5, smoothActivation);
    var targetCoronaOpacity = THREE.MathUtils.lerp(0.2, 0.85, smoothActivation);
    coronaMesh.scale.setScalar(targetCoronaScale);
    coronaMat.opacity = targetCoronaOpacity;

    // 5. Encendido de la PointLight de Tritio:
    // Inactivo: luz latente tenue (0.35)
    // Activo: explosión de fotones dorados (5.2) que baña las caras del oro
    var targetLightIntensity = THREE.MathUtils.lerp(0.35, 5.2 + pulse * 2, smoothActivation);
    tritiumLight.intensity = targetLightIntensity;

    // F. Scrollytelling de Posición por Secciones
    if (!reduceMotion) {
      if (!isMobile) {
        // Hero: (2.7, 0.05, 0.2) -> Stats: (0, 0.4, 1.3) -> Projects: (0, 0.1, -0.6) -> Contact: (0, -0.1, 1.8)
        var targetPosX, targetPosY, targetPosZ, targetScale;

        if (scrollProgress < 0.22) {
          var p = scrollProgress / 0.22;
          targetPosX = THREE.MathUtils.lerp(2.7, 0, p);
          targetPosY = THREE.MathUtils.lerp(0.05, 0.4, p);
          targetPosZ = THREE.MathUtils.lerp(0.2, 1.3, p);
          targetScale = THREE.MathUtils.lerp(1.0, 1.3, p);
        } else if (scrollProgress < 0.65) {
          var p = (scrollProgress - 0.22) / 0.43;
          targetPosX = THREE.MathUtils.lerp(0, 0, p);
          targetPosY = THREE.MathUtils.lerp(0.4, 0.1, p);
          targetPosZ = THREE.MathUtils.lerp(1.3, -0.6, p);
          targetScale = THREE.MathUtils.lerp(1.3, 1.4, p);
        } else {
          var p = (scrollProgress - 0.65) / 0.35;
          targetPosX = THREE.MathUtils.lerp(0, 0, p);
          targetPosY = THREE.MathUtils.lerp(0.1, -0.1, p);
          targetPosZ = THREE.MathUtils.lerp(-0.6, 1.8, p);
          targetScale = THREE.MathUtils.lerp(1.4, 1.45, p);
        }

        coreGroup.position.x += (targetPosX - coreGroup.position.x) * 0.08;
        coreGroup.position.y += (targetPosY - coreGroup.position.y) * 0.08;
        coreGroup.position.z += (targetPosZ - coreGroup.position.z) * 0.08;

        var currentScale = coreGroup.scale.x;
        var newScale = currentScale + (targetScale - currentScale) * 0.08;
        coreGroup.scale.set(newScale, newScale, newScale);
      }

      // Reactive tilt
      coreGroup.rotation.y = mouse.x * 0.35 + scrollProgress * Math.PI;
      coreGroup.rotation.x = -mouse.y * 0.35;
    }

    renderer.render(scene, camera);
  }

  animate();

  // ── 9. Responsive Resize ──
  window.addEventListener('resize', function () {
    isMobile = window.innerWidth <= 860;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (isMobile) {
      coreGroup.position.set(0, -0.4, -1);
      coreGroup.scale.setScalar(0.75);
    }
  });
})();