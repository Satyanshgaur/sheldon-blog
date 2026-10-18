import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function initPropagationSim(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = container.clientWidth;
  const height = container.clientHeight || 520;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0e0e);

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
  camera.position.set(0, 22, 72);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxDistance = 140;
  controls.minDistance = 25;

  // Dark Grid
  const gridHelper = new THREE.GridHelper(90, 18, 0x333333, 0x1a1a1a);
  gridHelper.position.y = -16;
  scene.add(gridHelper);

  // SVG & HTML Overlays
  let svgOverlay = container.querySelector('.canvas-overlay-svg');
  if (!svgOverlay) {
    svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgOverlay.setAttribute('class', 'canvas-overlay-svg');
    container.appendChild(svgOverlay);
  }

  let htmlOverlay = container.querySelector('.canvas-overlay-html');
  if (!htmlOverlay) {
    htmlOverlay = document.createElement('div');
    htmlOverlay.setAttribute('class', 'canvas-overlay-html');
    container.appendChild(htmlOverlay);
  }

  svgOverlay.innerHTML = `
    <defs>
      <marker id="prop-arrow-default" viewBox="0 0 10 10" refX="20" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#888888" />
      </marker>
      <marker id="prop-arrow-refute" viewBox="0 0 10 10" refX="20" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#d9383a" />
      </marker>
    </defs>
    <g id="prop-svg-edges"></g>
    <g id="prop-svg-labels"></g>
  `;

  const svgEdgesGroup = svgOverlay.querySelector('#prop-svg-edges');
  const svgLabelsGroup = svgOverlay.querySelector('#prop-svg-labels');

  // Minimalist Nodes
  const nodes = [
    {
      id: 'C-7',
      name: 'Claim C-7',
      roleTag: 'Hypothesis (TTL)',
      pos: new THREE.Vector3(-22, 0, 0),
      isFocal: false
    },
    {
      id: 'A-3',
      name: 'Approval A-3',
      roleTag: 'PR #42',
      pos: new THREE.Vector3(0, 3, 0),
      isFocal: false
    },
    {
      id: 'T-9',
      name: 'Task T-9',
      roleTag: 'Deploy Task',
      pos: new THREE.Vector3(22, -2, 0),
      isFocal: false
    },
    {
      id: 'E-41',
      name: 'Evidence E-41',
      roleTag: 'CI Fail (Exit 1)',
      pos: new THREE.Vector3(-22, 16, 0),
      isFocal: true,
      visible: false
    }
  ];

  const nodeMap = {};
  nodes.forEach(node => {
    const group = new THREE.Group();
    group.position.copy(node.pos);

    const geom = new THREE.BoxGeometry(2.8, 2.8, 2.8);
    const mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: 0x111111 }));
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geom),
      new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1.5 })
    );
    group.add(mesh);
    group.add(edges);
    scene.add(group);

    node.meshGroup = group;
    node.lineMat = edges.material;
    nodeMap[node.id] = node;

    // Compact Chip
    const badge = document.createElement('div');
    badge.className = 'node-badge';
    badge.id = `prop-badge-${node.id}`;
    badge.innerHTML = `
      <span class="node-id">${node.name}</span>
      <span class="node-tag">${node.roleTag}</span>
    `;
    htmlOverlay.appendChild(badge);
    node.badgeEl = badge;
  });

  const edges = [
    { from: 'A-3', to: 'C-7', label: 'CITES', isRefute: false },
    { from: 'T-9', to: 'A-3', label: 'DEPENDS_ON', isRefute: false },
    { from: 'E-41', to: 'C-7', label: 'REFUTES', isRefute: true, active: false }
  ];

  const hud = document.getElementById('prop-hud');

  function updateStep(step) {
    nodes.forEach(n => {
      n.badgeEl.className = 'node-badge';
      n.lineMat.color.setHex(0xffffff);
    });

    const e41 = nodeMap['E-41'];
    const c7 = nodeMap['C-7'];
    const a3 = nodeMap['A-3'];
    const t9 = nodeMap['T-9'];

    edges.find(e => e.label === 'REFUTES').active = false;
    e41.visible = false;
    e41.meshGroup.visible = false;
    e41.badgeEl.style.display = 'none';

    if (step === 1) {
      c7.badgeEl.className = 'node-badge focal';
      c7.lineMat.color.setHex(0xe67e22);
      if (hud) {
        hud.innerHTML = `
          <span style="color:#e67e22; font-weight:700;">STEP 1: UNVERIFIED HYPOTHESIS</span><br>
          Agent A writes <strong>Claim C-7</strong> (<em>"Root cause is cache TTL"</em>). Sits unverified in shared memory.
        `;
      }
    } else if (step === 2) {
      a3.badgeEl.className = 'node-badge active-selected';
      t9.badgeEl.className = 'node-badge active-selected';
      if (hud) {
        hud.innerHTML = `
          <span style="color:#ffffff; font-weight:700;">STEP 2: DISTRIBUTING MISTAKES</span><br>
          Agent B reads C-7 &rarr; <strong>Approval A-3</strong>. Agent C schedules <strong>Task T-9</strong>. Error is now public dogma.
        `;
      }
    } else if (step === 3) {
      e41.visible = true;
      e41.meshGroup.visible = true;
      e41.badgeEl.style.display = 'flex';
      e41.badgeEl.className = 'node-badge focal';
      e41.lineMat.color.setHex(0xd9383a);

      c7.badgeEl.className = 'node-badge focal';
      c7.lineMat.color.setHex(0xd9383a);
      edges.find(e => e.label === 'REFUTES').active = true;

      if (hud) {
        hud.innerHTML = `
          <span style="color:#d9383a; font-weight:700;">STEP 3: REALITY ARRIVES (E-41)</span><br>
          Trusted CI webhook runs test on commit SHA. Test fails (exit code 1). <strong>Evidence E-41</strong> refutes Claim C-7.
        `;
      }
    } else if (step === 4) {
      e41.visible = true;
      e41.meshGroup.visible = true;
      e41.badgeEl.style.display = 'flex';
      e41.badgeEl.className = 'node-badge focal';
      edges.find(e => e.label === 'REFUTES').active = true;

      c7.badgeEl.className = 'node-badge focal';
      c7.lineMat.color.setHex(0xd9383a);
      a3.badgeEl.className = 'node-badge focal';
      a3.lineMat.color.setHex(0xd9383a);
      t9.badgeEl.className = 'node-badge focal';
      t9.lineMat.color.setHex(0xd9383a);

      if (hud) {
        hud.innerHTML = `
          <span style="color:#d9383a; font-weight:700;">STEP 4: ATOMIC 3-HOP STALE CASCADE</span><br>
          One Cypher statement marks C-7 REFUTED and cascades staleness to A-3 and T-9.<br>
          <em>Guy Korland: "A stale graph lies with confidence." Sheldon halts work on disproven assumptions!</em>
        `;
      }
    }

    document.querySelectorAll('.prop-step-btn').forEach(btn => {
      const s = parseInt(btn.getAttribute('data-step'), 10);
      btn.classList.toggle('active', s === step);
    });
  }

  document.querySelectorAll('.prop-step-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const s = parseInt(e.target.getAttribute('data-step'), 10);
      updateStep(s);
    });
  });

  function updateScreenProjections() {
    const w = container.clientWidth;
    const h = container.clientHeight || 520;

    nodes.forEach(node => {
      if (node.id === 'E-41' && !node.visible) {
        node.badgeEl.style.display = 'none';
        return;
      }
      const p = node.pos.clone().project(camera);
      if (p.z < 1) {
        const x = ((p.x + 1) * w) / 2;
        const y = ((-p.y + 1) * h) / 2;
        node.badgeEl.style.left = `${x}px`;
        node.badgeEl.style.top = `${y}px`;
        node.badgeEl.style.display = 'flex';
        node.screenX = x;
        node.screenY = y;
      } else {
        node.badgeEl.style.display = 'none';
      }
    });

    let edgesSvgHtml = '';
    let labelsSvgHtml = '';

    edges.forEach(edge => {
      if (edge.label === 'REFUTES' && !edge.active) return;

      const fromN = nodeMap[edge.from];
      const toN = nodeMap[edge.to];
      if (!fromN || !toN || !fromN.screenX || !toN.screenX) return;

      const x1 = fromN.screenX;
      const y1 = fromN.screenY;
      const x2 = toN.screenX;
      const y2 = toN.screenY;
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      const isRefute = edge.isRefute;
      const markerId = isRefute ? 'prop-arrow-refute' : 'prop-arrow-default';
      const edgeClass = isRefute ? 'svg-edge-line focal-edge' : 'svg-edge-line';
      const labelClass = isRefute ? 'svg-edge-label focal-label' : 'svg-edge-label';
      const bgClass = isRefute ? 'svg-edge-bg focal-bg' : 'svg-edge-bg';

      edgesSvgHtml += `
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
              class="${edgeClass}" marker-end="url(#${markerId})" />
      `;

      const textWidth = edge.label.length * 5.8 + 8;
      labelsSvgHtml += `
        <g transform="translate(${midX}, ${midY})">
          <rect x="-${textWidth / 2}" y="-7" width="${textWidth}" height="14" rx="0" class="${bgClass}" />
          <text x="0" y="0" class="${labelClass}">${edge.label}</text>
        </g>
      `;
    });

    svgEdgesGroup.innerHTML = edgesSvgHtml;
    svgLabelsGroup.innerHTML = labelsSvgHtml;
  }

  function onResize() {
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight || 520;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  let clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    nodes.forEach((n, idx) => {
      if (n.id === 'E-41' && !n.visible) return;
      n.meshGroup.position.y = n.pos.y + Math.sin(elapsed * 1.5 + idx) * 0.3;
      n.meshGroup.rotation.y += delta * 0.15;
    });

    controls.update();
    renderer.render(scene, camera);
    updateScreenProjections();
  }

  animate();
  updateStep(1);
}
