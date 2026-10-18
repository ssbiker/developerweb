/* ══════════════════════════════════════════════════
   bg3d.js — Simulación de Fluidos Navier-Stokes Eulerian Grid
   Basado en la ingeniería inversa de unseen.co (theme.js)
   GPU Fluid Dynamics: Navier-Stokes Eulerian Grid (GLSL custom)
   59 bloques de shaders GLSL compilados en el bundle original
══════════════════════════════════════════════════ */
(function () {
  'use strict';

  var canvas = document.getElementById('bg3d');
  if (!canvas) return;

  var gl = canvas.getContext('webgl2', { alpha: true, preserveDrawingBuffer: true }) ||
           canvas.getContext('webgl', { alpha: true, preserveDrawingBuffer: true }) ||
           canvas.getContext('experimental-webgl', { alpha: true, preserveDrawingBuffer: true });
  if (!gl) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Configuración de simulación ──
  var SIM_RES = 256; // Resolución de la cuadrícula de fluido
  var DYE_RES = 512;  // Resolución de la textura de tinta
  var PRESSURE_ITERATIONS = 25; // Iteraciones de Jacobi para presión
  var PRESSURE_DECAY = 0.8;
  var SPLAT_RADIUS = 0.35;
  var SPLAT_FORCE = 6000;

  // ── Estado ──
  var mouse = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, dx: 0, dy: 0, moved: false, down: false };
  var scrollP = 0;
  var start = performance.now();

  // ── Utilidades WebGL ──
  var isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
  var halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;
  var formatRGBA = isWebGL2 ? gl.RGBA16F : gl.RGBA;
  var formatRG = isWebGL2 ? gl.RG16F : gl.RGBA;
  var formatR = isWebGL2 ? gl.R16F : gl.RGBA;
  var supportLinearFiltering = isWebGL2 || gl.getExtension('OES_texture_float_linear');

  function getResolution(baseResolution) {
    var aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspect < 1) aspect = 1.0 / aspect;
    var min = Math.round(baseResolution);
    var max = Math.round(baseResolution * aspect);
    if (gl.drawingBufferWidth > gl.drawingBufferHeight) return { width: max, height: min };
    return { width: min, height: max };
  }

  // ── Shaders ──
  var VERT = [
    'attribute vec2 a_pos;',
    'varying vec2 vUv;',
    'varying vec2 vL;',
    'varying vec2 vR;',
    'varying vec2 vT;',
    'varying vec2 vB;',
    'uniform vec2 texelSize;',
    'void main(){',
    '  vUv = a_pos * 0.5 + 0.5;',
    '  vL = vUv - vec2(texelSize.x, 0.0);',
    '  vR = vUv + vec2(texelSize.x, 0.0);',
    '  vT = vUv + vec2(0.0, texelSize.y);',
    '  vB = vUv - vec2(0.0, texelSize.y);',
    '  gl_Position = vec4(a_pos, 0.0, 1.0);',
    '}'
  ].join('\n');

  // Copiar textura (para advección)
  var COPY_FRAG = [
    'precision mediump float;',
    'precision mediump sampler2D;',
    'varying vec2 vUv;',
    'uniform sampler2D uTexture;',
    'void main(){',
    '  gl_FragColor = texture2D(uTexture, vUv);',
    '}'
  ].join('\n');

  // Desenfoque (para limpieza de texturas)
  var BLUR_FRAG = [
    'precision mediump float;',
    'precision mediump sampler2D;',
    'varying vec2 vUv;',
    'uniform sampler2D uTexture;',
    'uniform vec2 texelSize;',
    'void main(){',
    '  vec4 sum = vec4(0.0);',
    '  sum += texture2D(uTexture, vUv + texelSize * vec2(-1.0, 1.0));',
    '  sum += texture2D(uTexture, vUv + texelSize * vec2(0.0, 1.0));',
    '  sum += texture2D(uTexture, vUv + texelSize * vec2(1.0, 1.0));',
    '  sum += texture2D(uTexture, vUv + texelSize * vec2(-1.0, 0.0));',
    '  sum += texture2D(uTexture, vUv + texelSize * vec2(0.0, 0.0));',
    '  sum += texture2D(uTexture, vUv + texelSize * vec2(1.0, 0.0));',
    '  sum += texture2D(uTexture, vUv + texelSize * vec2(-1.0, -1.0));',
    '  sum += texture2D(uTexture, vUv + texelSize * vec2(0.0, -1.0));',
    '  sum += texture2D(uTexture, vUv + texelSize * vec2(1.0, -1.0));',
    '  gl_FragColor = sum * 0.09;', // 1/9
    '}'
  ].join('\n');

  // Limpiar presión (decaimiento)
  var CLEAR_FRAG = [
    'precision mediump float;',
    'precision mediump sampler2D;',
    'varying vec2 vUv;',
    'uniform sampler2D uTexture;',
    'uniform float uValue;',
    'void main(){',
    '  gl_FragColor = uValue * texture2D(uTexture, vUv);',
    '}'
  ].join('\n');

  // Advección (mover campo según velocidad)
  var ADVECTION_FRAG = [
    'precision mediump float;',
    'precision mediump sampler2D;',
    'varying vec2 vUv;',
    'uniform sampler2D uVelocity;',
    'uniform sampler2D uSource;',
    'uniform vec2 texelSize;',
    'uniform float dt;',
    'uniform float dissipation;',
    'vec4 bilerp(sampler2D sam, vec2 uv, vec2 tsize){',
    '  vec2 st = uv / tsize - 0.5;',
    '  vec2 iuv = floor(st);',
    '  vec2 fuv = fract(st);',
    '  vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);',
    '  vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);',
    '  vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);',
    '  vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);',
    '  return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);',
    '}',
    'void main(){',
    '  vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;',
    '  vec4 result = bilerp(uSource, coord, texelSize);',
    '  gl_FragColor = dissipation * result;',
    '}'
  ].join('\n');

  // Divergencia del campo de velocidad
  var DIVERGENCE_FRAG = [
    'precision mediump float;',
    'precision mediump sampler2D;',
    'varying vec2 vUv;',
    'varying vec2 vL;',
    'varying vec2 vR;',
    'varying vec2 vT;',
    'varying vec2 vB;',
    'uniform sampler2D uVelocity;',
    'void main(){',
    '  float L = texture2D(uVelocity, vL).x;',
    '  float R = texture2D(uVelocity, vR).x;',
    '  float T = texture2D(uVelocity, vT).y;',
    '  float B = texture2D(uVelocity, vB).y;',
    '  vec2 C = texture2D(uVelocity, vUv).xy;',
    '  if (vL.x < 0.0) { L = -C.x; }',
    '  if (vR.x > 1.0) { R = -C.x; }',
    '  if (vT.y > 1.0) { T = -C.y; }',
    '  if (vB.y < 0.0) { B = -C.y; }',
    '  float div = 0.5 * (R - L + T - B);',
    '  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);',
    '}'
  ].join('\n');

  // Presión: resolver ecuación de Poisson (iteraciones de Jacobi)
  var PRESSURE_FRAG = [
    'precision mediump float;',
    'precision mediump sampler2D;',
    'varying vec2 vUv;',
    'varying vec2 vL;',
    'varying vec2 vR;',
    'varying vec2 vT;',
    'varying vec2 vB;',
    'uniform sampler2D uPressure;',
    'uniform sampler2D uDivergence;',
    'void main(){',
    '  float L = texture2D(uPressure, vL).x;',
    '  float R = texture2D(uPressure, vR).x;',
    '  float T = texture2D(uPressure, vT).x;',
    '  float B = texture2D(uPressure, vB).x;',
    '  float divergence = texture2D(uDivergence, vUv).x;',
    '  float pressure = (L + R + B + T - divergence) * 0.25;',
    '  gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);',
    '}'
  ].join('\n');

  // Restar gradiente de presión a la velocidad (incompresibilidad)
  var GRADIENT_SUBTRACT_FRAG = [
    'precision mediump float;',
    'precision mediump sampler2D;',
    'varying vec2 vUv;',
    'varying vec2 vL;',
    'varying vec2 vR;',
    'varying vec2 vT;',
    'varying vec2 vB;',
    'uniform sampler2D uPressure;',
    'uniform sampler2D uVelocity;',
    'void main(){',
    '  float L = texture2D(uPressure, vL).x;',
    '  float R = texture2D(uPressure, vR).x;',
    '  float T = texture2D(uPressure, vT).x;',
    '  float B = texture2D(uPressure, vB).x;',
    '  vec2 velocity = texture2D(uVelocity, vUv).xy;',
    '  velocity.xy -= vec2(R - L, T - B);',
    '  gl_FragColor = vec4(velocity, 0.0, 1.0);',
    '}'
  ].join('\n');

  // Splat: inyección de fuerza del ratón (uMouse, uMouseVelocity, uMouseRadius)
  var SPLAT_FRAG = [
    'precision mediump float;',
    'precision mediump sampler2D;',
    'varying vec2 vUv;',
    'uniform sampler2D uTarget;',
    'uniform float uAspect;',
    'uniform vec3 uColor;',
    'uniform vec2 uPoint;',
    'uniform float uRadius;',
    'void main(){',
    '  vec2 p = vUv - uPoint;',
    '  p.x *= uAspect;',
    '  vec3 splat = exp(-dot(p, p) / uRadius) * uColor;',
    '  vec3 base = texture2D(uTarget, vUv).xyz;',
    '  gl_FragColor = vec4(base + splat, 1.0);',
    '}'
  ].join('\n');

  // Render final: mostrar densidad con colores rosa/blush (estilo unseen.co)
  var DISPLAY_FRAG = [
    'precision mediump float;',
    'precision mediump sampler2D;',
    'varying vec2 vUv;',
    'uniform sampler2D uTexture;',
    'uniform float uTime;',
    'uniform float uScroll;',
    'uniform vec2 u_res;',
    '',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }',
    'float noise(vec2 p){',
    '  vec2 i = floor(p), f = fract(p);',
    '  vec2 u = f*f*(3.0-2.0*f);',
    '  return mix(mix(hash(i), hash(i+vec2(1.,0.)), u.x),',
    '             mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), u.x), u.y);',
    '}',
    '',
    'void main(){',
    '  vec4 dye = texture2D(uTexture, vUv);',
    '  float d = length(dye.rgb);',
    '',
    '  // Paleta rosa/blush (estilo unseen.co)',
    '  vec3 base   = vec3(0.98, 0.94, 0.95);',
    '  vec3 pink   = vec3(0.95, 0.60, 0.70);',
    '  vec3 blush  = vec3(0.98, 0.75, 0.82);',
    '  vec3 rose   = vec3(0.88, 0.45, 0.58);',
    '  vec3 deep   = vec3(0.82, 0.30, 0.45);',
    '',
    '  vec3 col = base;',
    '  col = mix(col, pink,   clamp(d * 0.6, 0.0, 1.0));',
    '  col = mix(col, blush,  clamp(d * 0.3, 0.0, 1.0));',
    '  col = mix(col, rose,   clamp(d * 0.9, 0.0, 1.0));',
    '  col = mix(col, deep,   clamp(d * 1.2, 0.0, 1.0));',
    '',
    '  // Brillo en bordes (efecto tensión superficial)',
    '  float edge = smoothstep(0.2, 0.4, d) * smoothstep(0.6, 0.4, d);',
    '  col += vec3(1.0, 0.95, 0.97) * edge * 0.5;',
    '',
    '  // Aberración cromática sutil (efecto de unseen.co)',
    '  float aberration = 0.003 + u_scroll * 0.005;',
    '  vec4 dyeR = texture2D(uTexture, vUv + vec2(aberration, 0.0));',
    '  vec4 dyeB = texture2D(uTexture, vUv - vec2(aberration, 0.0));',
    '  col.r = mix(col.r, dyeR.r * 0.8, 0.3);',
    '  col.b = mix(col.b, dyeB.b * 0.8, 0.3);',
    '',
    '  // Grano sutil',
    '  col += (hash(vUv * u_res + fract(uTime)) - 0.5) * 0.008;',
    '',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  // ── Compilar shaders ──
  function compileShader(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(vs, fs) {
    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  function getUniforms(program) {
    var uniforms = [];
    var count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < count; i++) {
      var name = gl.getActiveUniform(program, i).name;
      uniforms[name] = gl.getUniformLocation(program, name);
    }
    return uniforms;
  }

  // ── Crear texturas y FBOs ──
  function createFBO(w, h, internalFormat, format, type, param) {
    gl.activeTexture(gl.TEXTURE0);
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture: texture, fbo: fbo, width: w, height: h, texelSizeX: 1 / w, texelSizeY: 1 / h, attach: function(id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, texture); return id; } };
  }

  function createDoubleFBO(w, h, internalFormat, format, type, param) {
    var fbo1 = createFBO(w, h, internalFormat, format, type, param);
    var fbo2 = createFBO(w, h, internalFormat, format, type, param);
    return { width: w, height: h, texelSizeX: fbo1.texelSizeX, texelSizeY: fbo1.texelSizeY, get read() { return fbo1; }, get write() { return fbo2; }, swap: function() { var temp = fbo1; fbo1 = fbo2; fbo2 = temp; } };
  }

  function getResolution2(baseResolution) {
    var aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;
    var minResolution = Math.round(baseResolution);
    var maxResolution = Math.round(baseResolution * aspectRatio);
    if (gl.drawingBufferWidth > gl.drawingBufferHeight) return { width: maxResolution, height: minResolution };
    return { width: minResolution, height: maxResolution };
  }

  // ── Inicialización ──
  var simRes = getResolution2(SIM_RES);
  var dyeRes = getResolution2(DYE_RES);

  // Crear texturas FBOs
  var dye = createDoubleFBO(dyeRes.width, dyeRes.height, formatRGBA, gl.RGBA, halfFloatTexType, supportLinearFiltering ? gl.LINEAR : gl.NEAREST);
  var velocity = createDoubleFBO(simRes.width, simRes.height, formatRG, gl.RG, halfFloatTexType, supportLinearFiltering ? gl.LINEAR : gl.NEAREST);
  var divergence = createFBO(simRes.width, simRes.height, formatR, gl.RED, halfFloatTexType, gl.NEAREST);
  var pressure = createDoubleFBO(simRes.width, simRes.height, formatR, gl.RED, halfFloatTexType, gl.NEAREST);

  // ── Crear programas ──
  var baseVertexShader = compileShader(gl.VERTEX_SHADER, VERT);
  var copyProgram = createProgram(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, COPY_FRAG));
  var blurProgram = createProgram(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, BLUR_FRAG));
  var clearProgram = createProgram(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, CLEAR_FRAG));
  var advectionProgram = createProgram(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, ADVECTION_FRAG));
  var divergenceProgram = createProgram(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, DIVERGENCE_FRAG));
  var pressureProgram = createProgram(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, PRESSURE_FRAG));
  var gradientSubtractProgram = createProgram(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, GRADIENT_SUBTRACT_FRAG));
  var splatProgram = createProgram(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, SPLAT_FRAG));
  var displayProgram = createProgram(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, DISPLAY_FRAG));

  if (!copyProgram || !blurProgram || !clearProgram || !advectionProgram || !divergenceProgram || !pressureProgram || !gradientSubtractProgram || !splatProgram || !displayProgram) {
    console.error('Failed to create shader programs');
    return;
  }

  var uniforms = {
    copy: getUniforms(copyProgram),
    blur: getUniforms(blurProgram),
    clear: getUniforms(clearProgram),
    advection: getUniforms(advectionProgram),
    divergence: getUniforms(divergenceProgram),
    pressure: getUniforms(pressureProgram),
    gradientSubtract: getUniforms(gradientSubtractProgram),
    splat: getUniforms(splatProgram),
    display: getUniforms(displayProgram)
  };

  // Buffer compartido
  var blitBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, blitBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  function blit(target) {
    gl.bindBuffer(gl.ARRAY_BUFFER, blitBuffer);
    var loc = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), 'a_pos');
    if (loc >= 0) {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }
    gl.viewport(0, 0, target ? target.width : gl.drawingBufferWidth, target ? target.height : gl.drawingBufferHeight);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // ── Simulación ──
  function step(dt) {
    gl.disable(gl.BLEND);

    // 1. Advección de velocidad
    gl.useProgram(advectionProgram);
    gl.uniform2f(uniforms.advection.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(uniforms.advection.uVelocity, velocity.read.attach(0));
    gl.uniform1i(uniforms.advection.uSource, velocity.read.attach(1));
    gl.uniform1f(uniforms.advection.dt, dt);
    gl.uniform1f(uniforms.advection.dissipation, 0.98);
    blit(velocity.write);
    velocity.swap();

    // 2. Advección de densidad
    gl.useProgram(advectionProgram);
    gl.uniform2f(uniforms.advection.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(uniforms.advection.uVelocity, velocity.read.attach(0));
    gl.uniform1i(uniforms.advection.uSource, dye.read.attach(1));
    gl.uniform1f(uniforms.advection.dt, dt);
    gl.uniform1f(uniforms.advection.dissipation, 0.97);
    blit(dye.write);
    dye.swap();

    // 3. Divergencia
    gl.useProgram(divergenceProgram);
    gl.uniform2f(uniforms.divergence.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(uniforms.divergence.uVelocity, velocity.read.attach(0));
    blit(divergence);

    // 4. Presión (iteraciones de Jacobi)
    gl.useProgram(clearProgram);
    gl.uniform1i(uniforms.clear.uTexture, pressure.read.attach(0));
    gl.uniform1f(uniforms.clear.uValue, PRESSURE_DECAY);
    blit(pressure.write);
    pressure.swap();

    gl.useProgram(pressureProgram);
    gl.uniform2f(uniforms.pressure.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(uniforms.pressure.uDivergence, divergence.attach(0));
    for (var i = 0; i < PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(uniforms.pressure.uPressure, pressure.read.attach(1));
      blit(pressure.write);
      pressure.swap();
    }

    // 5. Restar gradiente de presión (incompresibilidad)
    gl.useProgram(gradientSubtractProgram);
    gl.uniform2f(uniforms.gradientSubtract.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(uniforms.gradientSubtract.uPressure, pressure.read.attach(0));
    gl.uniform1i(uniforms.gradientSubtract.uVelocity, velocity.read.attach(1));
    blit(velocity.write);
    velocity.swap();
  }

  // ── Splat: inyección de fuerza del ratón ──
  function splat(x, y, dx, dy, color) {
    gl.useProgram(splatProgram);
    gl.uniform1i(uniforms.splat.uTarget, velocity.read.attach(0));
    gl.uniform1f(uniforms.splat.uAspect, canvas.width / canvas.height);
    gl.uniform2f(uniforms.splat.uPoint, x, y);
    gl.uniform3f(uniforms.splat.uColor, dx, dy, 0);
    gl.uniform1f(uniforms.splat.uRadius, SPLAT_RADIUS / 100);
    blit(velocity.write);
    velocity.swap();

    gl.useProgram(splatProgram);
    gl.uniform1i(uniforms.splat.uTarget, dye.read.attach(0));
    gl.uniform1f(uniforms.splat.uAspect, canvas.width / canvas.height);
    gl.uniform2f(uniforms.splat.uPoint, x, y);
    gl.uniform3f(uniforms.splat.uColor, color.r, color.g, color.b);
    gl.uniform1f(uniforms.splat.uRadius, SPLAT_RADIUS / 100);
    blit(dye.write);
    dye.swap();
  }

  // ── Render final ──
  function render(time) {
    gl.useProgram(displayProgram);
    gl.uniform2f(uniforms.display.texelSize, 1 / canvas.width, 1 / canvas.height);
    gl.uniform1i(uniforms.display.uTexture, dye.read.attach(0));
    gl.uniform1f(uniforms.display.uTime, time);
    gl.uniform1f(uniforms.display.uScroll, scrollP);
    gl.uniform2f(uniforms.display.u_res, canvas.width, canvas.height);
    blit(null);
  }

  // ── Interacción ──
  window.addEventListener('mousemove', function (e) {
    var nx = e.clientX / window.innerWidth;
    var ny = 1.0 - e.clientY / window.innerHeight;
    if (mouse.moved) {
      var dx = (nx - mouse.x) * SPLAT_FORCE;
      var dy = (ny - mouse.y) * SPLAT_FORCE;
      // Colores rosa/blush (estilo unseen.co)
      var cr = 0.35;
      var cg = 0.15;
      var cb = 0.25;
      splat(nx, ny, dx, dy, { r: cr, g: cg, b: cb });
    }
    mouse.x = nx;
    mouse.y = ny;
    mouse.moved = true;
  });

  window.addEventListener('mousedown', function () { mouse.down = true; });
  window.addEventListener('mouseup', function () { mouse.down = false; });

  window.addEventListener('scroll', function () {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    scrollP = max > 0 ? (window.scrollY || document.documentElement.scrollTop) / max : 0;
  }, { passive: true });

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  // Splat inicial (tinta en el centro)
  for (var i = 0; i < 10; i++) {
    var a = (i / 10) * Math.PI * 2;
    var r = 0.2 + Math.random() * 0.3;
    var g = 0.1 + Math.random() * 0.2;
    var b = 0.15 + Math.random() * 0.2;
    splat(0.5 + Math.cos(a) * 0.2, 0.5 + Math.sin(a) * 0.2, Math.cos(a) * 5, Math.sin(a) * 5, { r: r, g: g, b: b });
  }

  if (reduceMotion) {
    render(0);
    return;
  }

  function loop() {
    requestAnimationFrame(loop);
    var dt = Math.min((performance.now() - start) / 1000, 0.016);
    start = performance.now();
    step(dt);
    render(start / 1000);
  }
  loop();
})();