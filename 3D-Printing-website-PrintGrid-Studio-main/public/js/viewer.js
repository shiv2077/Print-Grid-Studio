// PrintGrid Studio — 3D viewer
// ES module. Mounts a three.js scene into a container, renders STLs on a
// 256×256 mm P1S build plate with IBL + 3-point lighting + soft shadow.
// Custom damped orbit controls (no addon dep). Exports:
//   mountViewer(container) → { loadFromBuffer, clearMesh, dispose }

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const PLATE_HALF = 128;          // 256 / 2

// Theme-aware scene + plate colors. Read from CSS variables at mount time
// and on every `themechange` event so the 3D viewer flips with the rest
// of the page. See readThemeColors() inside mountViewer().

export function mountViewer(container) {
  // Declared up-front so any of the dirty=true sites (theme apply, pointer
  // handlers, render loop, public methods) can reach the same binding even
  // when they run during mount — avoids a TDZ crash from forward references.
  let dirty = true;

  // ───── Renderer ─────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const initialRect = container.getBoundingClientRect();
  renderer.setSize(initialRect.width || 600, initialRect.height || 450, false);
  // Insert canvas as the first child so HUD overlays sit above it.
  container.insertBefore(renderer.domElement, container.firstChild);

  // ───── Scene + camera ───────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xF4F4F1); // overwritten by applyTheme() below

  const camera = new THREE.PerspectiveCamera(
    35,
    (initialRect.width || 600) / (initialRect.height || 450),
    1, 5000
  );

  // ───── IBL via PMREM + RoomEnvironment ──────────────────────────────
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;

  // ───── Three-point + hemisphere ─────────────────────────────────────
  const keyLight = new THREE.DirectionalLight(0xfff4e8, 1.4);
  keyLight.position.set(80, 120, 60);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.5;
  // Frustum sized when a mesh loads; default to plate-sized so empty state still casts.
  keyLight.shadow.camera.left   = -180;
  keyLight.shadow.camera.right  =  180;
  keyLight.shadow.camera.top    =  180;
  keyLight.shadow.camera.bottom = -180;
  keyLight.shadow.camera.near   = 1;
  keyLight.shadow.camera.far    = 600;
  scene.add(keyLight);
  scene.add(keyLight.target);

  const fillLight = new THREE.DirectionalLight(0xc8e0ff, 0.45);
  fillLight.position.set(-90, 70, -40);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.7);
  rimLight.position.set(40, 60, -120);
  scene.add(rimLight);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xb0b0a8, 0.25);
  scene.add(hemi);

  // ───── Build plate ──────────────────────────────────────────────────
  const plateRefs = buildPlate();
  const plateGroup = plateRefs.group;
  scene.add(plateGroup);

  // ───── Theme-aware color application ────────────────────────────────
  function readThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const styles = getComputedStyle(document.documentElement);
    const bg = styles.getPropertyValue('--paper-cool').trim() || (isDark ? '#18181D' : '#F4F4F1');
    return {
      bg,
      plate:     isDark ? 0x202024 : 0xEDECE6,  // light: slightly darker than bg / dark: slightly lighter
      gridMajor: isDark ? 0x3A3A40 : 0x909088,
      gridMinor: isDark ? 0x2A2A2E : 0xC5C3BC,
      outline:   isDark ? 0x66666C : 0x5A5A5A,
    };
  }
  function applyTheme() {
    const c = readThemeColors();
    scene.background = new THREE.Color(c.bg);
    plateRefs.plate.material.color.setHex(c.plate);
    plateRefs.major.material.color.setHex(c.gridMajor);
    plateRefs.minor.material.color.setHex(c.gridMinor);
    plateRefs.outline.material.color.setHex(c.outline);
    dirty = true;
  }
  document.addEventListener('themechange', applyTheme);
  applyTheme();

  // Plate label (HTML overlay tracking a 3D point)
  const plateLabel = document.createElement('div');
  plateLabel.textContent = '256 × 256 mm · P1S';
  plateLabel.style.cssText = [
    'position: absolute',
    'pointer-events: none',
    'font-family: var(--font-mono)',
    'font-size: 10px',
    'letter-spacing: 0.14em',
    'text-transform: uppercase',
    'color: var(--ink-60)',
    'background: var(--paper-alpha-85)',
    'border: 1px solid var(--ink-10)',
    'padding: 3px 8px',
    'transform: translate(-50%, -100%)',
    'white-space: nowrap',
    'z-index: 2',
    'transition: opacity 120ms ease',
  ].join('; ');
  container.appendChild(plateLabel);
  const plateLabelAnchor = new THREE.Vector3(0, 0.5, PLATE_HALF + 4);

  // ───── HUD references ───────────────────────────────────────────────
  const presetsHud = container.querySelector('[data-presets]');
  const dimsHud    = container.querySelector('[data-dims]');
  const emptyHud   = container.querySelector('[data-empty]');

  // Initial empty state: no mesh, hide dims HUD, show empty label
  if (dimsHud)  dimsHud.style.display = 'none';
  if (emptyHud) emptyHud.style.display = '';

  // Build preset buttons
  if (presetsHud) {
    presetsHud.innerHTML =
      '<button type="button" data-preset="iso"   aria-pressed="true">ISO</button>' +
      '<button type="button" data-preset="top"   aria-pressed="false">TOP</button>' +
      '<button type="button" data-preset="front" aria-pressed="false">FRONT</button>';
    presetsHud.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => animateToPreset(btn.dataset.preset, btn));
    });
  }

  // ───── Orbit state (current + target for damped motion) ─────────────
  const orbit = {
    azimuth:        Math.PI / 4,
    elevation:      0.45,
    distance:       400,
    target:         new THREE.Vector3(0, 30, 0),
    targetAzimuth:  Math.PI / 4,
    targetElev:     0.45,
    targetDistance: 400,
    targetTarget:   new THREE.Vector3(0, 30, 0),
  };

  // ───── Mesh state ───────────────────────────────────────────────────
  let currentMesh = null;
  let currentTriCount = 0;

  // ───── Pointer / wheel events ───────────────────────────────────────
  const activePointers = new Map();
  let pointerOrbiting = false;
  let lastX = 0, lastY = 0;
  let panMode = false;
  let pinchStartPx = 0;
  let pinchStartDistance = 0;

  const ORBIT_SPEED = 0.005;

  function onPointerDown(e) {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { container.setPointerCapture(e.pointerId); } catch {}
    if (activePointers.size === 1) {
      pointerOrbiting = true;
      lastX = e.clientX;
      lastY = e.clientY;
      panMode = e.shiftKey || e.button === 2;
    } else if (activePointers.size === 2) {
      pointerOrbiting = false;
      const it = activePointers.values();
      const a = it.next().value, b = it.next().value;
      pinchStartPx = Math.hypot(a.x - b.x, a.y - b.y);
      pinchStartDistance = orbit.targetDistance;
    }
  }

  function onPointerMove(e) {
    if (!activePointers.has(e.pointerId)) return;
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size === 1 && pointerOrbiting) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      if (panMode) {
        // Pan in screen space: convert pixels → world units via FOV + distance.
        const rect = container.getBoundingClientRect();
        const worldPerPx = 2 * orbit.targetDistance *
          Math.tan(camera.fov * Math.PI / 360) / Math.max(1, rect.height);
        const right = new THREE.Vector3();
        const up    = new THREE.Vector3();
        camera.matrix.extractBasis(right, up, new THREE.Vector3());
        orbit.targetTarget.addScaledVector(right, -dx * worldPerPx);
        orbit.targetTarget.addScaledVector(up,     dy * worldPerPx);
      } else {
        orbit.targetAzimuth -= dx * ORBIT_SPEED;
        orbit.targetElev    += dy * ORBIT_SPEED;
        orbit.targetElev = Math.max(-Math.PI / 2 + 0.02,
                          Math.min( Math.PI / 2 - 0.02, orbit.targetElev));
      }
      dirty = true;
    } else if (activePointers.size === 2) {
      const it = activePointers.values();
      const a = it.next().value, b = it.next().value;
      const px = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchStartPx > 0) {
        const next = pinchStartDistance * (pinchStartPx / Math.max(1, px));
        orbit.targetDistance = clampDistance(next);
        dirty = true;
      }
    }
  }

  function onPointerUp(e) {
    activePointers.delete(e.pointerId);
    try { container.releasePointerCapture(e.pointerId); } catch {}
    if (activePointers.size === 0) {
      pointerOrbiting = false;
      panMode = false;
    }
  }

  function onWheel(e) {
    e.preventDefault();
    orbit.targetDistance *= 1 + e.deltaY * 0.0008;
    orbit.targetDistance = clampDistance(orbit.targetDistance);
    dirty = true;
  }

  function onContextMenu(e) { e.preventDefault(); }

  function clampDistance(d) {
    return Math.max(80, Math.min(2000, d));
  }

  container.addEventListener('pointerdown',   onPointerDown);
  container.addEventListener('pointermove',   onPointerMove);
  container.addEventListener('pointerup',     onPointerUp);
  container.addEventListener('pointercancel', onPointerUp);
  container.addEventListener('wheel',         onWheel, { passive: false });
  container.addEventListener('contextmenu',   onContextMenu);

  // ───── Resize (debounced) ───────────────────────────────────────────
  let resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const r = container.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
      dirty = true;
    }, 50);
  }
  window.addEventListener('resize', onResize);

  // ───── Render loop ──────────────────────────────────────────────────
  let raf = null;
  // (`dirty` is declared at the top of mountViewer — see TDZ note up there.)

  function tick() {
    raf = requestAnimationFrame(tick);

    // Damp orbit toward target (per-frame lerp 0.15)
    const lerp = 0.15;
    const da = orbit.targetAzimuth - orbit.azimuth;
    const de = orbit.targetElev    - orbit.elevation;
    const dd = orbit.targetDistance - orbit.distance;
    const dt = orbit.targetTarget.x - orbit.target.x;
    const dty = orbit.targetTarget.y - orbit.target.y;
    const dtz = orbit.targetTarget.z - orbit.target.z;

    const settled =
      Math.abs(da) < 0.0002 && Math.abs(de) < 0.0002 && Math.abs(dd) < 0.01 &&
      Math.abs(dt) < 0.01  && Math.abs(dty) < 0.01  && Math.abs(dtz) < 0.01;

    if (!settled) {
      orbit.azimuth   += da  * lerp;
      orbit.elevation += de  * lerp;
      orbit.distance  += dd  * lerp;
      orbit.target.x  += dt  * lerp;
      orbit.target.y  += dty * lerp;
      orbit.target.z  += dtz * lerp;
      dirty = true;
    } else {
      // Snap to target to avoid jittery drift.
      orbit.azimuth   = orbit.targetAzimuth;
      orbit.elevation = orbit.targetElev;
      orbit.distance  = orbit.targetDistance;
      orbit.target.copy(orbit.targetTarget);
    }

    if (dirty) {
      updateCameraFromOrbit();
      renderer.render(scene, camera);
      updatePlateLabel();
      dirty = false;
    }
  }

  function updateCameraFromOrbit() {
    const r = orbit.distance;
    const cosE = Math.cos(orbit.elevation);
    camera.position.x = orbit.target.x + r * cosE * Math.sin(orbit.azimuth);
    camera.position.y = orbit.target.y + r * Math.sin(orbit.elevation);
    camera.position.z = orbit.target.z + r * cosE * Math.cos(orbit.azimuth);
    camera.lookAt(orbit.target);
  }

  function updatePlateLabel() {
    const v = plateLabelAnchor.clone().project(camera);
    const rect = container.getBoundingClientRect();
    const x = ( v.x * 0.5 + 0.5) * rect.width;
    const y = (-v.y * 0.5 + 0.5) * rect.height;
    plateLabel.style.left = x + 'px';
    plateLabel.style.top  = y + 'px';
    // Hide if behind camera or off-screen.
    const visible = v.z > -1 && v.z < 1 && x > 0 && x < rect.width && y > 0 && y < rect.height;
    plateLabel.style.opacity = visible ? '1' : '0';
  }

  // ───── Build plate construction ─────────────────────────────────────
  function buildPlate() {
    const g = new THREE.Group();

    // Plate plane (receives shadow)
    const plateGeom = new THREE.PlaneGeometry(256, 256);
    plateGeom.rotateX(-Math.PI / 2);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0xEDECE6,    // overwritten by applyTheme()
      roughness: 0.85,
      metalness: 0.0,
    });
    const plate = new THREE.Mesh(plateGeom, plateMat);
    plate.position.y = 0;
    plate.receiveShadow = true;
    g.add(plate);

    // Major lines every 50 mm
    const majorVerts = [];
    for (let i = -PLATE_HALF; i <= PLATE_HALF; i += 50) {
      majorVerts.push(i, 0.005, -PLATE_HALF, i, 0.005, PLATE_HALF);
      majorVerts.push(-PLATE_HALF, 0.005, i, PLATE_HALF, 0.005, i);
    }
    const major = makeLines(majorVerts, 0x909088, 0.55);
    g.add(major);

    // Minor lines every 10 mm (skip the 50s)
    const minorVerts = [];
    for (let i = -PLATE_HALF; i <= PLATE_HALF; i += 10) {
      if (i % 50 === 0) continue;
      minorVerts.push(i, 0.003, -PLATE_HALF, i, 0.003, PLATE_HALF);
      minorVerts.push(-PLATE_HALF, 0.003, i, PLATE_HALF, 0.003, i);
    }
    const minor = makeLines(minorVerts, 0xC5C3BC, 0.35);
    g.add(minor);

    // Outline rectangle on top of grid
    const outlineVerts = [
      -PLATE_HALF, 0.012, -PLATE_HALF,  PLATE_HALF, 0.012, -PLATE_HALF,
       PLATE_HALF, 0.012, -PLATE_HALF,  PLATE_HALF, 0.012,  PLATE_HALF,
       PLATE_HALF, 0.012,  PLATE_HALF, -PLATE_HALF, 0.012,  PLATE_HALF,
      -PLATE_HALF, 0.012,  PLATE_HALF, -PLATE_HALF, 0.012, -PLATE_HALF,
    ];
    const outline = makeLines(outlineVerts, 0x5a5a5a, 1.0);
    g.add(outline);

    return { group: g, plate, major, minor, outline };
  }

  function makeLines(verts, color, opacity) {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    const mat = new THREE.LineBasicMaterial({
      color, transparent: opacity < 1, opacity,
    });
    return new THREE.LineSegments(geom, mat);
  }

  // ───── STL parsing (inline; mirrors js/stl.js but produces BufferGeometry) ─
  function parseSTLToGeometry(buffer) {
    if (!(buffer instanceof ArrayBuffer)) {
      throw new Error('parseSTL expects an ArrayBuffer');
    }
    if (buffer.byteLength >= 84) {
      const view = new DataView(buffer);
      const triCount = view.getUint32(80, true);
      if (84 + triCount * 50 === buffer.byteLength) {
        return readBinary(view, triCount);
      }
    }
    return readAscii(new TextDecoder().decode(buffer));
  }

  function readBinary(view, triCount) {
    const positions = new Float32Array(triCount * 9);
    let off = 84, pi = 0;
    for (let i = 0; i < triCount; i++) {
      off += 12; // skip face normal
      for (let v = 0; v < 3; v++) {
        positions[pi++] = view.getFloat32(off,     true);
        positions[pi++] = view.getFloat32(off + 4, true);
        positions[pi++] = view.getFloat32(off + 8, true);
        off += 12;
      }
      off += 2; // skip attribute
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { geometry: g, triangles: triCount };
  }

  function readAscii(text) {
    const re = /vertex\s+(-?[\d.eE+-]+)\s+(-?[\d.eE+-]+)\s+(-?[\d.eE+-]+)/g;
    const verts = [];
    let m;
    while ((m = re.exec(text)) !== null) {
      verts.push(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]));
    }
    const triCount = Math.floor(verts.length / 9);
    const positions = new Float32Array(triCount * 9);
    for (let i = 0; i < positions.length; i++) positions[i] = verts[i] || 0;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { geometry: g, triangles: triCount };
  }

  function computeVolumeMm3(geometry) {
    const p = geometry.attributes.position.array;
    let v = 0;
    for (let i = 0; i < p.length; i += 9) {
      const ax = p[i],   ay = p[i+1], az = p[i+2];
      const bx = p[i+3], by = p[i+4], bz = p[i+5];
      const cx = p[i+6], cy = p[i+7], cz = p[i+8];
      v += (ax*(by*cz - bz*cy) + ay*(bz*cx - bx*cz) + az*(bx*cy - by*cx)) / 6;
    }
    return Math.abs(v);
  }

  // ───── Public: load mesh from buffer ─────────────────────────────────
  function loadFromBuffer(buffer) {
    if (currentMesh) {
      scene.remove(currentMesh);
      currentMesh.geometry.dispose();
      currentMesh.material.dispose();
      currentMesh = null;
    }

    const { geometry, triangles } = parseSTLToGeometry(buffer);
    currentTriCount = triangles;

    // 1. bbox BEFORE rotation — these are the as-authored dimensions for HUD
    geometry.computeBoundingBox();
    const origSize = new THREE.Vector3();
    geometry.boundingBox.getSize(origSize);

    // 2. Z-up STL → Y-up world (rotate the geometry, not the mesh, so the
    //    bbox + shadow camera reflect the final orientation)
    geometry.rotateX(-Math.PI / 2);
    geometry.computeBoundingBox();
    const worldBox  = geometry.boundingBox;
    const worldSize = new THREE.Vector3();
    worldBox.getSize(worldSize);
    const worldCenter = new THREE.Vector3();
    worldBox.getCenter(worldCenter);

    // 3. Center in XZ; drop minY to 0 so part sits on the plate.
    geometry.translate(-worldCenter.x, -worldBox.min.y, -worldCenter.z);
    geometry.computeBoundingBox();
    geometry.computeVertexNormals();

    // 4. Material + mesh
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xD14620,
      roughness: 0.55,
      metalness: 0.0,
      sheen: 0.05,
      clearcoat: 0.0,
      envMapIntensity: 0.8,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    scene.add(mesh);
    currentMesh = mesh;

    // 5. Volume from the post-translation geometry (translation invariant).
    const volMm3 = computeVolumeMm3(geometry);

    // 6. Resize key-light shadow camera to envelope the mesh + 50 mm margin.
    const half = Math.max(worldSize.x, worldSize.y, worldSize.z) / 2 + 50;
    keyLight.shadow.camera.left   = -half;
    keyLight.shadow.camera.right  =  half;
    keyLight.shadow.camera.top    =  half;
    keyLight.shadow.camera.bottom = -half;
    keyLight.shadow.camera.near   = 1;
    keyLight.shadow.camera.far    = Math.max(600, half * 6);
    keyLight.shadow.camera.updateProjectionMatrix();
    keyLight.target.position.set(0, worldSize.y / 2, 0);

    // 7. Reframe camera. Distance per spec: max-dim × 2 + 60.
    const maxDim = Math.max(worldSize.x, worldSize.y, worldSize.z);
    orbit.targetDistance = clampDistance(maxDim * 2.0 + 60);
    orbit.targetTarget.set(0, worldSize.y / 2, 0);

    // 8. HUD
    if (dimsHud) {
      const triFmt = triangles.toLocaleString();
      // Display the original (as-authored) dimensions, sorted by axis label.
      dimsHud.textContent =
        origSize.x.toFixed(1) + ' × ' + origSize.y.toFixed(1) + ' × ' + origSize.z.toFixed(1) + ' mm\n' +
        (volMm3 / 1000).toFixed(2) + ' cm³ · ' + triFmt + ' tris';
      dimsHud.style.display = '';
    }
    if (emptyHud) emptyHud.style.display = 'none';

    dirty = true;
  }

  // ───── Public: clear mesh (UX parity with file removal) ─────────────
  function clearMesh() {
    if (currentMesh) {
      scene.remove(currentMesh);
      currentMesh.geometry.dispose();
      currentMesh.material.dispose();
      currentMesh = null;
    }
    currentTriCount = 0;
    if (dimsHud)  dimsHud.style.display  = 'none';
    if (emptyHud) emptyHud.style.display = '';
    // Reset camera framing to plate
    orbit.targetTarget.set(0, 30, 0);
    orbit.targetDistance = 400;
    dirty = true;
  }

  // ───── Preset animation (lerp via damping target) ───────────────────
  function animateToPreset(preset, button) {
    const presets = {
      iso:   { azimuth: Math.PI / 4, elevation: 0.45 },
      top:   { azimuth: 0,           elevation: Math.PI / 2 - 0.05 },
      front: { azimuth: 0,           elevation: 0 },
    };
    const p = presets[preset];
    if (!p) return;
    orbit.targetAzimuth = p.azimuth;
    orbit.targetElev    = p.elevation;

    if (currentMesh) {
      const size = new THREE.Vector3();
      currentMesh.geometry.boundingBox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      orbit.targetDistance = clampDistance(maxDim * 2.0 + 60);
    }

    if (presetsHud) {
      presetsHud.querySelectorAll('button').forEach((b) => {
        b.setAttribute('aria-pressed', b === button ? 'true' : 'false');
      });
    }

    dirty = true;
  }

  // ───── Public: dispose ──────────────────────────────────────────────
  function dispose() {
    cancelAnimationFrame(raf);

    container.removeEventListener('pointerdown',   onPointerDown);
    container.removeEventListener('pointermove',   onPointerMove);
    container.removeEventListener('pointerup',     onPointerUp);
    container.removeEventListener('pointercancel', onPointerUp);
    container.removeEventListener('wheel',         onWheel);
    container.removeEventListener('contextmenu',   onContextMenu);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('themechange', applyTheme);
    clearTimeout(resizeTimer);

    if (currentMesh) {
      currentMesh.geometry.dispose();
      currentMesh.material.dispose();
    }
    plateGroup.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
    if (envRT) envRT.dispose();
    pmrem.dispose();
    renderer.dispose();

    container.innerHTML = '';
  }

  // ───── Kick off ─────────────────────────────────────────────────────
  tick();

  return { loadFromBuffer, clearMesh, dispose };
}
