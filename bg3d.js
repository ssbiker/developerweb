/* ══════════════════════════════════════════════════
   bg3d.js — Three.js Cinematic 3D Scroller & Holographic Core
   Camera choreography, orbital particle nebula, and reactive geometry
══════════════════════════════════════════════════ */

(function () {
  'use strict';

  var canvas = document.getElementById('bg3d');
  if (!canvas || typeof THREE === 'undefined') return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 1. Scene, Camera, Renderer ──
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 7;

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // ── 2. Holographic 3D Core System ──
  var coreGroup = new THREE.Group();
  scene.add(coreGroup);

  // A. Inner glowing crystal (faceted wireframe)
  var crystalGeo = new THREE.IcosahedronGeometry(1.4, 1);
  var crystalMat = new THREE.MeshBasicMaterial({
    color: 0x00F0FF,
    wireframe: true,
    transparent: true,
    opacity: 0.4
  });
  var crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
  coreGroup.add(crystalMesh);

  // B. Inner point cloud singularity
  var innerPointsGeo = new THREE.IcosahedronGeometry(1.2, 2);
  var innerPointsMat = new THREE.PointsMaterial({
    color: 0x38BDF8,
    size: 0.05,
    transparent: true,
    opacity: 0.85
  });
  var innerPoints = new THREE.Points(innerPointsGeo, innerPointsMat);
  coreGroup.add(innerPoints);

  // C. Concentric Orbital Cyber-Rings
  var ring1Geo = new THREE.TorusGeometry(2.1, 0.02, 16, 100);
  var ring1Mat = new THREE.MeshBasicMaterial({
    color: 0x0071E3,
    transparent: true,
    opacity: 0.6
  });
  var ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
  ring1.rotation.x = Math.PI / 3;
  coreGroup.add(ring1);

  var ring2Geo = new THREE.TorusGeometry(2.5, 0.015, 16, 120);
  var ring2Mat = new THREE.MeshBasicMaterial({
    color: 0x818CF8,
    transparent: true,
    opacity: 0.45
  });
  var ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
  ring2.rotation.y = Math.PI / 4;
  ring2.rotation.x = -Math.PI / 6;
  coreGroup.add(ring2);

  var ring3Geo = new THREE.TorusGeometry(2.9, 0.012, 16, 140);
  var ring3Mat = new THREE.MeshBasicMaterial({
    color: 0x38BDF8,
    transparent: true,
    opacity: 0.35
  });
  var ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
  ring3.rotation.z = Math.PI / 5;
  coreGroup.add(ring3);

  // ── 3. 3D Particle Constellation Nebula ──
  var PARTICLE_COUNT = 2400;
  var particlesGeo = new THREE.BufferGeometry();
  var positions = new Float32Array(PARTICLE_COUNT * 3);
  var colors = new Float32Array(PARTICLE_COUNT * 3);

  var colorCyan = new THREE.Color(0x00F0FF);
  var colorBlue = new THREE.Color(0x0071E3);
  var colorPurple = new THREE.Color(0x818CF8);

  for (var i = 0; i < PARTICLE_COUNT; i++) {
    var radius = 2.5 + Math.random() * 14;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(Math.random() * 2 - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi) * 0.8;

    var mixedColor = colorCyan.clone().lerp(
      Math.random() > 0.5 ? colorBlue : colorPurple,
      Math.random()
    );
    colors[i * 3] = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;
  }

  particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  var particlesMat = new THREE.PointsMaterial({
    size: 0.038,
    vertexColors: true,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending
  });

  var particleSystem = new THREE.Points(particlesGeo, particlesMat);
  scene.add(particleSystem);

  // ── 4. Initial Position for Desktop Hero ──
  var isMobile = window.innerWidth <= 860;
  if (!isMobile) {
    coreGroup.position.set(2.7, 0.05, 0.2);
  } else {
    coreGroup.position.set(0, -0.4, -1);
    coreGroup.scale.setScalar(0.75);
  }

  // ── 5. Mouse Reactive Physics (Lerp Damping) ──
  var mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  window.addEventListener('mousemove', function (e) {
    mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // ── 6. Scroll-driven Choreography (Scrollytelling) ──
  var scrollProgress = 0;
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = max > 0 ? (window.scrollY || document.documentElement.scrollTop) / max : 0;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── 7. Render Loop with Inertia ──
  var clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    var delta = clock.getDelta();
    var time = clock.getElapsedTime();

    // Mouse lerp
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Idle core rotation
    crystalMesh.rotation.y += 0.4 * delta;
    crystalMesh.rotation.x += 0.2 * delta;

    innerPoints.rotation.y -= 0.3 * delta;

    ring1.rotation.z += 0.6 * delta;
    ring2.rotation.x += 0.5 * delta;
    ring3.rotation.y += 0.4 * delta;

    // Slow ambient universe drift
    particleSystem.rotation.y = time * 0.02 + mouse.x * 0.1;
    particleSystem.rotation.x = time * 0.01 + mouse.y * 0.1;

    // Dynamic Scroll Interpolation
    if (!reduceMotion) {
      if (!isMobile) {
        // Hero: (2.7, 0.05, 0.2) -> Stats: (0, 0.4, 1.3) -> Projects: (0, 0.2, -0.6) -> Contact: (0, -0.1, 1.8)
        var targetPosX, targetPosY, targetPosZ, targetScale;

        if (scrollProgress < 0.22) {
          // Hero to Stats
          var p = scrollProgress / 0.22;
          targetPosX = THREE.MathUtils.lerp(2.7, 0, p);
          targetPosY = THREE.MathUtils.lerp(0.05, 0.4, p);
          targetPosZ = THREE.MathUtils.lerp(0.2, 1.3, p);
          targetScale = THREE.MathUtils.lerp(1.0, 1.3, p);
        } else if (scrollProgress < 0.65) {
          // Stats to Projects (forms a backdrop behind the cards)
          var p = (scrollProgress - 0.22) / 0.43;
          targetPosX = THREE.MathUtils.lerp(0, 0, p);
          targetPosY = THREE.MathUtils.lerp(0.4, 0.1, p);
          targetPosZ = THREE.MathUtils.lerp(1.3, -0.6, p);
          targetScale = THREE.MathUtils.lerp(1.3, 1.4, p);
        } else {
          // Projects to Contact (singularity behind CTA)
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

  // ── 8. Responsive Resize ──
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