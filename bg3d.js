/* ══════════════════════════════════════════════════
   bg3d.js — Three.js Cinematic 3D Scroller: El Reactor de Tritio Solar (Spider-Man 2 Edition)
   - Photorealistic Smooth Machined 24K Gold Sphere with Engraved Precision Channels
   - Miniature Sun with Blinding Nuclear Core & Magnetic Plasma Coronal Arcs
   - 3D Gimbal Magnetic Confinement Rings in Polished 24K Gold
   - 60/120 FPS Guaranteed on GPU (0 KB external download)
   ══════════════════════════════════════════════════ */

(function () {
  'use strict';

  var canvas = document.getElementById('bg3d');
  if (!canvas || typeof THREE === 'undefined') return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 1. Scene, Camera, High-End Cinematic Renderer ──
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 7.4;

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  if (renderer.outputEncoding !== undefined) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }
  if (renderer.toneMapping !== undefined) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
  }

  // ── 2. Procedural Studio Environment Map (IBL) ──
  function createStudioEnvironment() {
    var c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    var ctx = c.getContext('2d');

    var bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
    bgGrad.addColorStop(0, '#1c1710');
    bgGrad.addColorStop(0.5, '#07090e');
    bgGrad.addColorStop(1, '#020305');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Overhead Key Softbox (Warm golden sunlight)
    var g1 = ctx.createRadialGradient(512, 100, 10, 512, 100, 260);
    g1.addColorStop(0, '#ffffff');
    g1.addColorStop(0.35, '#fff1d0');
    g1.addColorStop(1, 'rgba(255, 215, 140, 0)');
    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.ellipse(512, 100, 320, 110, 0, 0, Math.PI * 2);
    ctx.fill();

    // Left Rim Softbox (Cool titanium contrast)
    var g2 = ctx.createRadialGradient(160, 260, 10, 160, 260, 180);
    g2.addColorStop(0, '#e0f0ff');
    g2.addColorStop(0.4, '#80a8d0');
    g2.addColorStop(1, 'rgba(80, 140, 200, 0)');
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.ellipse(160, 260, 160, 80, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Right Reflector Softbox (Deep amber gold fill)
    var g3 = ctx.createRadialGradient(860, 260, 10, 860, 260, 180);
    g3.addColorStop(0, '#fff4cc');
    g3.addColorStop(0.4, '#e6a830');
    g3.addColorStop(1, 'rgba(230, 150, 40, 0)');
    ctx.fillStyle = g3;
    ctx.beginPath();
    ctx.ellipse(860, 260, 170, 80, -0.4, 0, Math.PI * 2);
    ctx.fill();

    var tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    return tex;
  }
  var studioEnvMap = createStudioEnvironment();
  scene.environment = studioEnvMap;

  // ── 3. Procedural Brushed Gold Bump Texture ──
  function createBrushedGoldBumpMap() {
    var c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    for (var y = 0; y < 512; y += 2) {
      var noiseVal = (Math.random() - 0.5) * 35;
      var gray = Math.floor(128 + noiseVal);
      ctx.fillStyle = 'rgb(' + gray + ',' + gray + ',' + gray + ')';
      ctx.fillRect(0, y, 512, 1.2);
    }
    for (var i = 0; i < 300; i++) {
      var x = Math.random() * 512;
      var y = Math.random() * 512;
      var len = 10 + Math.random() * 35;
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(180,180,180,0.12)' : 'rgba(80,80,80,0.12)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y + (Math.random() - 0.5) * 6);
      ctx.stroke();
    }
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }
  var goldBumpMap = createBrushedGoldBumpMap();

  // ── 4. Cinematic Lighting System ──
  var ambientLight = new THREE.AmbientLight(0x40301c, 1.6);
  scene.add(ambientLight);

  var keyLight = new THREE.DirectionalLight(0xFFF3D6, 3.6);
  keyLight.position.set(6, 8, 5);
  scene.add(keyLight);

  var frontLight = new THREE.DirectionalLight(0xFFE8B0, 2.6);
  frontLight.position.set(0, 2, 7);
  scene.add(frontLight);

  var rimLight = new THREE.DirectionalLight(0x7098CC, 1.5);
  rimLight.position.set(-7, -4, -4);
  scene.add(rimLight);

  var tritiumLight = new THREE.PointLight(0xFFAA00, 0.4, 25, 2);

  // ── 5. Holographic 3D Reactor System ──
  var coreGroup = new THREE.Group();
  scene.add(coreGroup);
  coreGroup.add(tritiumLight);

  // ── A. Esfera de Oro 24K Pulido Maquinada (Estado Inactivo en Hero) ──
  // Material de Oro 24K real con física de metales preciosos (sin flatShading para reflejos fluidos)
  var goldMat = new THREE.MeshStandardMaterial({
    color: 0xF2BF38,            // Oro 24K puro
    emissive: 0x302008,         // Brillo interior sutil
    metalness: 0.98,            // Metal puro espejo
    roughness: 0.14,            // Acabado de pulido de joyería fina
    bumpMap: goldBumpMap,       // Micro-estriado de oro cepillado
    bumpScale: 0.008,
    transparent: true,
    opacity: 0.98
  });

  // Esfera de contención de precisión de alta definición
  var goldShellGeo = new THREE.SphereGeometry(1.5, 64, 64);
  var goldShellMesh = new THREE.Mesh(goldShellGeo, goldMat);
  coreGroup.add(goldShellMesh);

  // Canales mecánicos grabados en la esfera (ranuras de contención magnética de tritio)
  var channelGroup = new THREE.Group();
  goldShellMesh.add(channelGroup);

  var channelMat = new THREE.MeshStandardMaterial({
    color: 0x664411,
    metalness: 0.95,
    roughness: 0.25
  });

  // Anillos ecuatoriales y meridianos empotrados en la superficie dorada
  var ch1 = new THREE.Mesh(new THREE.TorusGeometry(1.502, 0.016, 16, 120), channelMat);
  var ch2 = new THREE.Mesh(new THREE.TorusGeometry(1.502, 0.012, 16, 120), channelMat);
  ch2.rotation.x = Math.PI / 2;
  var ch3 = new THREE.Mesh(new THREE.TorusGeometry(1.502, 0.012, 16, 120), channelMat);
  ch3.rotation.y = Math.PI / 2;
  channelGroup.add(ch1, ch2, ch3);

  // ── B. El Sol de Tritio de Spider-Man 2 (Miniature Star) ──
  var sunGroup = new THREE.Group();
  coreGroup.add(sunGroup);
  sunGroup.scale.setScalar(0.35); // En reposo comprimido en el centro

  // 1. Núcleo Incandescente Blanco Solar Nuclear
  var sunCoreGeo = new THREE.SphereGeometry(0.72, 32, 32);
  var sunCoreMat = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF // Blanco puro de fusión nuclear
  });
  var sunCoreMesh = new THREE.Mesh(sunCoreGeo, sunCoreMat);
  sunGroup.add(sunCoreMesh);

  // 2. Fotosfera Solar con GLSL Shader de convección y ebullición
  var plasmaVertexShader = [
    'varying vec2 vUv;',
    'varying vec3 vNormal;',
    'varying vec3 vPosition;',
    'varying vec3 vWorldPosition;',
    'uniform float uTime;',
    '',
    'vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }',
    'vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }',
    'vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }',
    'vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }',
    '',
    'float snoise(vec3 v) {',
    '  const vec2 C = vec2(1.0/6.0, 1.0/3.0);',
    '  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);',
    '  vec3 i  = floor(v + dot(v, C.yyy));',
    '  vec3 x0 = v - i + dot(i, C.xxx);',
    '  vec3 g = step(x0.yzx, x0.xyz);',
    '  vec3 l = 1.0 - g;',
    '  vec3 i1 = min(g.xyz, l.zxy);',
    '  vec3 i2 = max(g.xyz, l.zxy);',
    '  vec3 x1 = x0 - i1 + C.xxx;',
    '  vec3 x2 = x0 - i2 + C.yyy;',
    '  vec3 x3 = x0 - D.yyy;',
    '  i = mod289(i);',
    '  vec4 p = permute(permute(permute(',
    '             i.z + vec4(0.0, i1.z, i2.z, 1.0))',
    '           + i.y + vec4(0.0, i1.y, i2.y, 1.0))',
    '           + i.x + vec4(0.0, i1.x, i2.x, 1.0));',
    '  float n_ = 0.142857142857;',
    '  vec3 ns = n_ * D.wyz - D.xzx;',
    '  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);',
    '  vec4 x_ = floor(j * ns.z);',
    '  vec4 y_ = floor(j - 7.0 * x_);',
    '  vec4 x = x_ *ns.x + ns.yyyy;',
    '  vec4 y = y_ *ns.x + ns.yyyy;',
    '  vec4 h = 1.0 - abs(x) - abs(y);',
    '  vec4 b0 = vec4(x.xy, y.xy);',
    '  vec4 b1 = vec4(x.zw, y.zw);',
    '  vec4 s0 = floor(b0)*2.0 + 1.0;',
    '  vec4 s1 = floor(b1)*2.0 + 1.0;',
    '  vec4 sh = -step(h, vec4(0.0));',
    '  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;',
    '  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;',
    '  vec3 p0 = vec3(a0.xy, h.x);',
    '  vec3 p1 = vec3(a0.zw, h.y);',
    '  vec3 p2 = vec3(a1.xy, h.z);',
    '  vec3 p3 = vec3(a1.zw, h.w);',
    '  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));',
    '  p0 *= norm.x;',
    '  p1 *= norm.y;',
    '  p2 *= norm.z;',
    '  p3 *= norm.w;',
    '  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);',
    '  m = m * m;',
    '  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));',
    '}',
    '',
    'void main() {',
    '  vUv = uv;',
    '  vNormal = normalize(normalMatrix * normal);',
    '  float disp = snoise(normal * 3.0 + vec3(0.0, 0.0, uTime * 0.5)) * 0.08;',
    '  vec3 newPosition = position + normal * disp;',
    '  vPosition = newPosition;',
    '  vWorldPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);',
    '}'
  ].join('\n');

  var plasmaFragmentShader = [
    'varying vec2 vUv;',
    'varying vec3 vNormal;',
    'varying vec3 vPosition;',
    'varying vec3 vWorldPosition;',
    'uniform float uTime;',
    'uniform float uIntensity;',
    '',
    'vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }',
    'vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }',
    'vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }',
    'vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }',
    '',
    'float snoise(vec3 v) {',
    '  const vec2 C = vec2(1.0/6.0, 1.0/3.0);',
    '  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);',
    '  vec3 i  = floor(v + dot(v, C.yyy));',
    '  vec3 x0 = v - i + dot(i, C.xxx);',
    '  vec3 g = step(x0.yzx, x0.xyz);',
    '  vec3 l = 1.0 - g;',
    '  vec3 i1 = min(g.xyz, l.zxy);',
    '  vec3 i2 = max(g.xyz, l.zxy);',
    '  vec3 x1 = x0 - i1 + C.xxx;',
    '  vec3 x2 = x0 - i2 + C.yyy;',
    '  vec3 x3 = x0 - D.yyy;',
    '  i = mod289(i);',
    '  vec4 p = permute(permute(permute(',
    '             i.z + vec4(0.0, i1.z, i2.z, 1.0))',
    '           + i.y + vec4(0.0, i1.y, i2.y, 1.0))',
    '           + i.x + vec4(0.0, i1.x, i2.x, 1.0));',
    '  float n_ = 0.142857142857;',
    '  vec3 ns = n_ * D.wyz - D.xzx;',
    '  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);',
    '  vec4 x_ = floor(j * ns.z);',
    '  vec4 y_ = floor(j - 7.0 * x_);',
    '  vec4 x = x_ *ns.x + ns.yyyy;',
    '  vec4 y = y_ *ns.x + ns.yyyy;',
    '  vec4 h = 1.0 - abs(x) - abs(y);',
    '  vec4 b0 = vec4(x.xy, y.xy);',
    '  vec4 b1 = vec4(x.zw, y.zw);',
    '  vec4 s0 = floor(b0)*2.0 + 1.0;',
    '  vec4 s1 = floor(b1)*2.0 + 1.0;',
    '  vec4 sh = -step(h, vec4(0.0));',
    '  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;',
    '  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;',
    '  vec3 p0 = vec3(a0.xy, h.x);',
    '  vec3 p1 = vec3(a0.zw, h.y);',
    '  vec3 p2 = vec3(a1.xy, h.z);',
    '  vec3 p3 = vec3(a1.zw, h.w);',
    '  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));',
    '  p0 *= norm.x;',
    '  p1 *= norm.y;',
    '  p2 *= norm.z;',
    '  p3 *= norm.w;',
    '  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);',
    '  m = m * m;',
    '  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));',
    '}',
    '',
    'void main() {',
    '  vec3 pos = vPosition * 3.5;',
    '  float n1 = snoise(pos + vec3(0.0, uTime * 0.45, 0.0));',
    '  float n2 = snoise(pos * 2.2 - vec3(uTime * 0.65, 0.0, uTime * 0.35)) * 0.5;',
    '  float plasma = (n1 + n2 + 1.1) * 0.5;',
    '',
    '  // Spider-Man 2 Sun Palette (Nuclear Core)',
    '  vec3 colDark = vec3(0.9, 0.2, 0.02);   // Fuego carmesí solar',
    '  vec3 colFlame = vec3(1.0, 0.72, 0.12); // Plasma oro incandescente',
    '  vec3 colWhite = vec3(1.0, 0.98, 0.94); // Núcleo blanco caliente de fusión',
    '',
    '  vec3 col = mix(colDark, colFlame, smoothstep(0.2, 0.65, plasma));',
    '  col = mix(col, colWhite, smoothstep(0.65, 0.98, plasma));',
    '',
    '  vec3 viewDir = normalize(cameraPosition - vWorldPosition);',
    '  float fresnel = 1.0 - max(0.0, dot(viewDir, vNormal));',
    '  fresnel = pow(fresnel, 2.0);',
    '  col += vec3(1.0, 0.85, 0.4) * fresnel * 2.5;',
    '',
    '  gl_FragColor = vec4(col * uIntensity, 0.85);',
    '}'
  ].join('\n');

  var plasmaUniforms = {
    uTime: { value: 0 },
    uIntensity: { value: 0.4 }
  };

  var plasmaMat = new THREE.ShaderMaterial({
    vertexShader: plasmaVertexShader,
    fragmentShader: plasmaFragmentShader,
    uniforms: plasmaUniforms,
    transparent: true,
    blending: THREE.AdditiveBlending
  });

  var sunPhotosphereGeo = new THREE.SphereGeometry(0.88, 48, 48);
  var sunPhotosphereMesh = new THREE.Mesh(sunPhotosphereGeo, plasmaMat);
  sunGroup.add(sunPhotosphereMesh);

  // 3. Arcos Magnéticos de Plasma (Coronal Loops de Spider-Man 2)
  var loopGroup = new THREE.Group();
  sunGroup.add(loopGroup);

  var loopMat1 = new THREE.MeshBasicMaterial({
    color: 0xFF3300,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending
  });
  var loopMat2 = new THREE.MeshBasicMaterial({
    color: 0xFFAA00,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending
  });

  var loop1 = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.045, 16, 80, Math.PI), loopMat1);
  loop1.position.set(0, 0.1, 0);
  loop1.rotation.x = Math.PI / 3;
  loopGroup.add(loop1);

  var loop2 = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.038, 16, 80, Math.PI), loopMat2);
  loop2.position.set(0, -0.1, 0);
  loop2.rotation.y = Math.PI / 2.5;
  loop2.rotation.z = Math.PI / 3;
  loopGroup.add(loop2);

  var loop3 = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.032, 16, 80, Math.PI), loopMat1);
  loop3.rotation.x = -Math.PI / 3;
  loop3.rotation.y = -Math.PI / 4;
  loopGroup.add(loop3);

  // ── C. Anillos Gimbal de Confinamiento en Oro 24K Pulido ──
  var ringsGroup = new THREE.Group();
  coreGroup.add(ringsGroup);

  var ringMat = new THREE.MeshStandardMaterial({
    color: 0xF2BF38,
    metalness: 0.98,
    roughness: 0.12,
    bumpMap: goldBumpMap,
    bumpScale: 0.006
  });

  var ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.034, 16, 120), ringMat);
  ring1.rotation.x = Math.PI / 3;
  ringsGroup.add(ring1);

  var ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.027, 16, 140), ringMat);
  ring2.rotation.y = Math.PI / 4;
  ring2.rotation.x = -Math.PI / 6;
  ringsGroup.add(ring2);

  var ring3 = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.021, 16, 160), ringMat);
  ring3.rotation.z = Math.PI / 5;
  ringsGroup.add(ring3);

  // ── 6. Nebulosa de Chispas Solares y Polvo de Oro ──
  var PARTICLE_COUNT = 2400;
  var particlesGeo = new THREE.BufferGeometry();
  var positions = new Float32Array(PARTICLE_COUNT * 3);
  var colors = new Float32Array(PARTICLE_COUNT * 3);

  var colorFireAmber = new THREE.Color(0xFF4500);
  var colorSolarGold = new THREE.Color(0xFFB800);
  var colorWhiteHot   = new THREE.Color(0xFFFBF0);

  for (var i = 0; i < PARTICLE_COUNT; i++) {
    var radius = 2.4 + Math.random() * 14.5;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(Math.random() * 2 - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi) * 0.85;

    var mixedColor = Math.random() > 0.4
      ? colorSolarGold.clone().lerp(colorFireAmber, Math.random() * 0.8)
      : colorSolarGold.clone().lerp(colorWhiteHot, Math.random() * 0.75);

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

  // ── 7. Posicionamiento Inicial ──
  var isMobile = window.innerWidth <= 860;
  if (!isMobile) {
    coreGroup.position.set(2.7, 0.05, 0.2);
  } else {
    coreGroup.position.set(0, -0.4, -1);
    coreGroup.scale.setScalar(0.75);
  }

  // ── 8. Física Reactiva al Mouse ──
  var mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  window.addEventListener('mousemove', function (e) {
    mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // ── 9. Scroll Choreography ──
  var scrollProgress = 0;
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = max > 0 ? (window.scrollY || document.documentElement.scrollTop) / max : 0;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── 10. Animation Render Loop (60/120 FPS PBR) ──
  var clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    var delta = clock.getDelta();
    var time = clock.getElapsedTime();

    plasmaUniforms.uTime.value = time;

    // Mouse lerp damping
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // A. Rotación suave de la esfera de oro mecanizada
    goldShellMesh.rotation.y += 0.22 * delta;
    goldShellMesh.rotation.x += 0.10 * delta;

    // B. Rotación turbulenta del sol de Spider-Man 2 y sus arcos magnéticos
    sunGroup.rotation.y -= 0.5 * delta;
    loop1.rotation.z += 0.8 * delta;
    loop2.rotation.x -= 0.7 * delta;
    loop3.rotation.y += 0.6 * delta;

    // C. Rotación giroscópica de los anillos de oro 24K
    ring1.rotation.z += 0.5 * delta;
    ring2.rotation.x += 0.4 * delta;
    ring3.rotation.y += 0.35 * delta;

    // D. Deriva ambiental de chispas
    particleSystem.rotation.y = time * 0.02 + mouse.x * 0.1;
    particleSystem.rotation.x = time * 0.01 + mouse.y * 0.1;

    // ── E. LÓGICA DE IGNICIÓN Y ACTIVACIÓN POR SCROLL ──
    var activation = Math.min(1.0, Math.max(0.0, scrollProgress / 0.18));
    var smoothActivation = activation * activation * (3 - 2 * activation);

    // 1. Apertura de la coraza de oro:
    // Inactivo (Hero): escala 1.0, opacidad 0.98 (sólido oro 24K pulido)
    // Activo: se abre a 1.48 y opacidad 0.40 dejando escapar la radiación
    var targetShellScale = THREE.MathUtils.lerp(1.0, 1.48, smoothActivation);
    var targetShellOpacity = THREE.MathUtils.lerp(0.98, 0.38, smoothActivation);
    goldShellMesh.scale.setScalar(targetShellScale);
    goldMat.opacity = targetShellOpacity;

    // 2. Despliegue de los anillos de confinamiento:
    var targetRingsScale = THREE.MathUtils.lerp(0.76, 1.05, smoothActivation);
    ringsGroup.scale.setScalar(targetRingsScale);

    // 3. Ignición del Sol de Spider-Man 2:
    // Inactivo: comprimido dentro de la esfera
    // Activo: crece e irradia luz solar extrema
    var pulse = Math.sin(time * 3.5) * 0.06;
    var targetSunScale = THREE.MathUtils.lerp(0.35, 1.25 + pulse, smoothActivation);
    var targetIntensity = THREE.MathUtils.lerp(0.3, 2.5 + pulse * 1.2, smoothActivation);
    sunGroup.scale.setScalar(targetSunScale);
    plasmaUniforms.uIntensity.value = targetIntensity;

    // 4. Encendido de la PointLight interna:
    var targetLightIntensity = THREE.MathUtils.lerp(0.3, 6.0 + pulse * 2, smoothActivation);
    tritiumLight.intensity = targetLightIntensity;

    // F. Scrollytelling de Posición por Secciones
    if (!reduceMotion) {
      if (!isMobile) {
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

      coreGroup.rotation.y = mouse.x * 0.35 + scrollProgress * Math.PI;
      coreGroup.rotation.x = -mouse.y * 0.35;
    }

    renderer.render(scene, camera);
  }

  animate();

  // ── 11. Responsive Resize ──
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