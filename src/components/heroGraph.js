import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function initHeroGraph(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = container.clientWidth;
  const height = container.clientHeight || 520;

  // Front-facing, flat camera with subtle parallax
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 1000);
  camera.position.set(3, 4, 98);
  camera.lookAt(3, 4, 0);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
  } catch (e) {
    console.warn('WebGL not supported, falling back to SVG/HTML layout');
  }

  let controls = null;
  if (renderer) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxDistance = 160;
    controls.minDistance = 65;
    controls.target.set(3, 4, 0);
    // Keep viewing angle restrained and flat for maximum legibility
    controls.maxPolarAngle = Math.PI / 2 + 0.08;
    controls.minPolarAngle = Math.PI / 2 - 0.08;
    controls.maxAzimuthAngle = 0.15;
    controls.minAzimuthAngle = -0.15;
  }

  // Faint architectural grid: ultra-low contrast (0xf4f4f4, 0xfcfcfc) to avoid visual noise
  const gridHelper = new THREE.GridHelper(130, 26, 0xf4f4f4, 0xfbfbfb);
  gridHelper.rotation.x = Math.PI / 2;
  gridHelper.position.set(3, 4, -10);
  scene.add(gridHelper);

  // SVG & HTML Overlay Layers
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
      <marker id="hero-arrow-default" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#555555" />
      </marker>
      <marker id="hero-arrow-focal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 1 L 9 5 L 0 9 z" fill="#d9383a" />
      </marker>
      <marker id="hero-arrow-agent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#111111" />
      </marker>
    </defs>
    <g id="hero-svg-bounds"></g>
    <g id="hero-svg-edges"></g>
    <g id="hero-svg-labels"></g>
  `;

  const svgBoundsGroup = svgOverlay.querySelector('#hero-svg-bounds');
  const svgEdgesGroup = svgOverlay.querySelector('#hero-svg-edges');
  const svgLabelsGroup = svgOverlay.querySelector('#hero-svg-labels');

  // =========================================================================
  // GRAPH DATA: Strictly derived from blog schema & Cypher queries
  // =========================================================================

  // Agents positioned outside the central repository boundary
  const agents = [
    {
      id: 'agent-a',
      name: 'Agent A (Claude Code Opus)',
      role: 'Coding agent',
      pos: new THREE.Vector3(-28, 22, 0)
    },
    {
      id: 'agent-ci',
      name: 'CI Webhook (GitHub Actions)',
      role: 'Trusted evidence producer',
      pos: new THREE.Vector3(-3, 23.5, 0)
    },
    {
      id: 'agent-b',
      name: 'Agent B (Test Runner Sonnet)',
      role: 'Approval writer',
      pos: new THREE.Vector3(28, 22, 0)
    }
  ];

  // Central Nodes: Generously spaced horizontally to prevent any label collisions
  const nodes = [
    {
      id: 'INC-12',
      type: 'INCIDENT',
      name: 'INC-12',
      tag: 'INCIDENT',
      status: 'OPEN',
      desc: 'Checkout 500 error on cart flush',
      pos: new THREE.Vector3(-37, -4, 0),
      shape: 'box',
      isFocal: false,
      cypher: 'MATCH (i:Incident {id:"INC-12"})',
      meta: 'Incident INC-12: Uncaught checkout failure on cart flush. Stored in repo graph.'
    },
    {
      id: 'ATT-3',
      type: 'ATTEMPT',
      name: 'ATT-3',
      tag: 'ATTEMPT (TTL FIX)',
      status: 'REFUTED',
      desc: 'cache.ts TTL bump to 60s',
      pos: new THREE.Vector3(-21, -4, 0),
      shape: 'octa',
      isFocal: true,
      cypher: 'MATCH (a:Attempt {id:"ATT-3"})-[:ATTEMPTED_FIX_FOR]->(i:Incident)',
      meta: 'Attempt ATT-3: Normalized fingerprint stored. Blocked from retry once refuted.'
    },
    {
      id: 'E-41',
      type: 'EVIDENCE',
      name: 'E-41',
      tag: 'EVIDENCE (CI EXIT 1)',
      status: 'EXECUTED (FAIL)',
      desc: 'CI run #41 (exit_code: 1, sha: 9f2a)',
      pos: new THREE.Vector3(-3, 8.5, 0),
      shape: 'sphere',
      isFocal: true,
      cypher: 'MATCH (e:Evidence {id:"E-41", executed:true, exit_code:1})',
      meta: 'Evidence E-41: Only trusted CI webhook writes evidence. Exit code 1 refutes claim.'
    },
    {
      id: 'C-7',
      type: 'CLAIM',
      name: 'C-7',
      tag: 'CLAIM (REFUTED)',
      status: 'REFUTED',
      desc: 'Hypothesis: Cache TTL is root cause',
      pos: new THREE.Vector3(13, -4, 0),
      shape: 'dodeca',
      isFocal: true,
      cypher: 'MATCH (c:Claim {id:"C-7", status:"refuted"})<-[:REFUTES]-(e:Evidence)',
      meta: 'Claim C-7: Refuted by E-41. Preserved in graph for retry block preflight checking.'
    },
    {
      id: 'A-3',
      type: 'APPROVAL',
      name: 'A-3',
      tag: 'APPROVAL (STALE)',
      status: 'STALE',
      desc: 'PR #42 Approval citing C-7',
      pos: new THREE.Vector3(28, -4, 0),
      shape: 'box',
      isFocal: true,
      cypher: 'MATCH (a:Approval {id:"A-3", status:"stale"})-[:CITES]->(c:Claim)',
      meta: 'Approval A-3: Depended on C-7. Marked STALE in single Cypher write (not deleted).'
    },
    {
      id: 'T-9',
      type: 'TASK',
      name: 'T-9',
      tag: 'TASK (STALE LEASE)',
      status: 'STALE (UNCLAIMABLE)',
      desc: 'Deploy patch to staging',
      pos: new THREE.Vector3(43, -4, 0),
      shape: 'octa',
      isFocal: false,
      cypher: 'MATCH (t:Task {id:"T-9", status:"stale"})-[:DEPENDS_ON]->(a:Approval)',
      meta: 'Task T-9: Stored status is STALE. Lease cannot be claimed because prerequisite A-3 is stale.'
    }
  ];

  // Graph Relationships with exact semantics and vertical/horizontal label offsets
  const edges = [
    { from: 'ATT-3', to: 'INC-12', label: 'ATTEMPTED_FIX_FOR', isFocal: false, yOffset: -12, xOffset: 0 },
    { from: 'ATT-3', to: 'E-41', label: 'REFUTED_BY', isFocal: true, yOffset: -10, xOffset: -10 },
    { from: 'E-41', to: 'C-7', label: 'REFUTES', isFocal: true, yOffset: -10, xOffset: 10 },
    { from: 'A-3', to: 'C-7', label: 'CITES', isFocal: true, yOffset: -12, xOffset: 0 },
    { from: 'T-9', to: 'A-3', label: 'DEPENDS_ON', isFocal: false, yOffset: -12, xOffset: 0 }
  ];

  // Agent connections (READS / WRITES)
  const agentEdges = [
    { fromAgent: 'agent-a', toNode: 'ATT-3', label: 'WRITES', xOffset: 6, yOffset: 0 },
    { fromNode: 'INC-12', toAgent: 'agent-a', label: 'READS', xOffset: -6, yOffset: 0 },
    { fromAgent: 'agent-ci', toNode: 'E-41', label: 'WRITES', xOffset: 6, yOffset: 0 },
    { fromAgent: 'agent-b', toNode: 'A-3', label: 'WRITES', xOffset: 6, yOffset: 0 },
    { fromNode: 'C-7', toAgent: 'agent-b', label: 'READS', xOffset: -6, yOffset: 0 }
  ];

  // Build 3D Anchors for nodes
  const nodeMap = {};
  nodes.forEach(node => {
    const group = new THREE.Group();
    group.position.copy(node.pos);

    let geom;
    if (node.shape === 'box') geom = new THREE.BoxGeometry(2.4, 2.4, 1);
    else if (node.shape === 'octa') geom = new THREE.OctahedronGeometry(1.6);
    else if (node.shape === 'dodeca') geom = new THREE.DodecahedronGeometry(1.6);
    else geom = new THREE.SphereGeometry(1.4, 16, 16);

    const wireColor = node.isFocal ? 0xd9383a : 0x222222;
    const mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(geom),
      new THREE.LineBasicMaterial({ color: wireColor, linewidth: node.isFocal ? 2 : 1 })
    );
    group.add(mesh);
    group.add(wire);
    scene.add(group);

    node.meshGroup = group;
    nodeMap[node.id] = node;

    // Compact Chip Badge
    const badge = document.createElement('div');
    badge.className = `node-badge ${node.isFocal ? 'focal' : ''}`;
    badge.id = `hero-badge-${node.id}`;
    badge.innerHTML = `
      <span class="node-id">${node.name}</span>
      <span class="node-tag">${node.tag}</span>
    `;

    badge.addEventListener('mouseenter', () => showDetails(node));
    badge.addEventListener('mouseleave', () => {
      if (!activeSelectedNode) hideDetails();
    });
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      selectNode(node);
    });

    htmlOverlay.appendChild(badge);
    node.badgeEl = badge;
  });

  // Agents
  const agentMap = {};
  agents.forEach(agent => {
    const group = new THREE.Group();
    group.position.copy(agent.pos);

    const geom = new THREE.ConeGeometry(1.4, 2.4, 4);
    geom.rotateX(Math.PI / 2);
    const mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: 0x111111 }));
    group.add(mesh);
    scene.add(group);

    agent.meshGroup = group;
    agentMap[agent.id] = agent;

    const card = document.createElement('div');
    card.className = 'agent-card';
    card.id = `hero-agent-${agent.id}`;
    card.innerHTML = `
      <span class="agent-heartbeat"></span>
      <span>${agent.name}</span>
    `;

    card.addEventListener('mouseenter', () => {
      if (tooltip) {
        tooltip.innerHTML = `<strong>${agent.name}</strong> &mdash; ${agent.role}<br>Synchronizes leases & task claims with repository-scoped FalkorDB memory.`;
        tooltip.style.opacity = '1';
      }
    });
    card.addEventListener('mouseleave', () => {
      if (!activeSelectedNode) hideDetails();
    });

    htmlOverlay.appendChild(card);
    agent.cardEl = card;
  });

  // Central Repository Perimeter Tag
  const repoBoundaryLabel = document.createElement('div');
  repoBoundaryLabel.className = 'repo-center-badge';
  repoBoundaryLabel.innerHTML = `FALKORDB · REPOSITORY GRAPH`;
  htmlOverlay.appendChild(repoBoundaryLabel);

  // Single interactive tooltip inside canvas (appears on hover/click only)
  let activeSelectedNode = null;
  const tooltip = document.createElement('div');
  tooltip.className = 'canvas-hud';
  tooltip.style.opacity = '0';
  tooltip.style.transition = 'opacity 0.2s ease';
  htmlOverlay.appendChild(tooltip);

  function showDetails(node) {
    if (!tooltip) return;
    tooltip.innerHTML = `
      <span class="canvas-hud-focal-tag">:${node.type} [${node.id}] &mdash; STORED STATUS: ${node.status}</span>
      <strong>${node.desc}</strong> &bull; <code>${node.cypher}</code>
    `;
    tooltip.style.opacity = '1';
  }

  function hideDetails() {
    if (!tooltip) return;
    tooltip.style.opacity = '0';
  }

  function selectNode(node) {
    document.querySelectorAll('.node-badge').forEach(b => b.classList.remove('active-selected'));
    if (activeSelectedNode === node) {
      activeSelectedNode = null;
      hideDetails();
      return;
    }
    activeSelectedNode = node;
    if (node && node.badgeEl) {
      node.badgeEl.classList.add('active-selected');
    }
    showDetails(node);
  }

  if (renderer) {
    renderer.domElement.addEventListener('click', () => {
      activeSelectedNode = null;
      document.querySelectorAll('.node-badge').forEach(b => b.classList.remove('active-selected'));
      hideDetails();
    });
  }

  // Math helper: find point where a line from (cx, cy) to (tx, ty) intersects a box centered at (cx, cy)
  function getBoxBorderPoint(cx, cy, halfW, halfH, tx, ty) {
    const dx = tx - cx;
    const dy = ty - cy;
    if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) return { x: cx, y: cy };
    const scale = Math.min(halfW / (Math.abs(dx) || 0.0001), halfH / (Math.abs(dy) || 0.0001));
    return {
      x: cx + dx * scale,
      y: cy + dy * scale
    };
  }

  function updateScreenProjections() {
    const w = container.clientWidth;
    const h = container.clientHeight || 520;

    nodes.forEach(node => {
      const p = node.pos.clone().project(camera);
      if (p.z < 1) {
        node.screenX = ((p.x + 1) * w) / 2;
        node.screenY = ((-p.y + 1) * h) / 2;
        node.badgeEl.style.left = `${node.screenX}px`;
        node.badgeEl.style.top = `${node.screenY}px`;
        node.badgeEl.style.display = 'flex';
        node.halfW = (node.badgeEl.offsetWidth || 116) / 2;
        node.halfH = (node.badgeEl.offsetHeight || 26) / 2;
      } else {
        node.badgeEl.style.display = 'none';
      }
    });

    agents.forEach(agent => {
      const p = agent.pos.clone().project(camera);
      if (p.z < 1) {
        agent.screenX = ((p.x + 1) * w) / 2;
        agent.screenY = ((-p.y + 1) * h) / 2;
        agent.cardEl.style.left = `${agent.screenX}px`;
        agent.cardEl.style.top = `${agent.screenY}px`;
        agent.cardEl.style.display = 'flex';
        agent.halfW = (agent.cardEl.offsetWidth || 170) / 2;
        agent.halfH = (agent.cardEl.offsetHeight || 28) / 2;
      } else {
        agent.cardEl.style.display = 'none';
      }
    });

    // Outer repo enclosure box
    const pTL = new THREE.Vector3(-47, 14, 0).project(camera);
    const pBR = new THREE.Vector3(52, -14, 0).project(camera);
    const bx1 = ((pTL.x + 1) * w) / 2;
    const by1 = ((-pTL.y + 1) * h) / 2;
    const bx2 = ((pBR.x + 1) * w) / 2;
    const by2 = ((-pBR.y + 1) * h) / 2;

    svgBoundsGroup.innerHTML = `
      <rect x="${bx1}" y="${by1}" width="${bx2 - bx1}" height="${by2 - by1}"
            fill="none" stroke="#222222" stroke-width="1.2" stroke-dasharray="4,4" />
    `;

    repoBoundaryLabel.style.left = `${(bx1 + bx2) / 2}px`;
    repoBoundaryLabel.style.top = `${by1}px`;
    repoBoundaryLabel.style.display = 'block';

    let edgesSvg = '';
    let labelsSvg = '';

    // Agent lines (READS / WRITES) clipped at component borders
    agentEdges.forEach(ae => {
      let srcX, srcY, srcHalfW, srcHalfH, dstX, dstY, dstHalfW, dstHalfH;
      if (ae.fromAgent) {
        const ag = agentMap[ae.fromAgent];
        const nd = nodeMap[ae.toNode];
        if (!ag || !nd || !ag.screenX || !nd.screenX) return;
        srcX = ag.screenX; srcY = ag.screenY; srcHalfW = ag.halfW || 85; srcHalfH = ag.halfH || 14;
        dstX = nd.screenX; dstY = nd.screenY; dstHalfW = nd.halfW || 58; dstHalfH = nd.halfH || 13;
      } else {
        const nd = nodeMap[ae.fromNode];
        const ag = agentMap[ae.toAgent];
        if (!nd || !ag || !nd.screenX || !ag.screenX) return;
        srcX = nd.screenX; srcY = nd.screenY; srcHalfW = nd.halfW || 58; srcHalfH = nd.halfH || 13;
        dstX = ag.screenX; dstY = ag.screenY; dstHalfW = ag.halfW || 85; dstHalfH = ag.halfH || 14;
      }

      // Clip start and end points to outer border + 2px safety
      const startPt = getBoxBorderPoint(srcX, srcY, srcHalfW + 2, srcHalfH + 2, dstX, dstY);
      const endPt = getBoxBorderPoint(dstX, dstY, dstHalfW + 3, dstHalfH + 3, srcX, srcY);

      edgesSvg += `
        <line x1="${startPt.x}" y1="${startPt.y}" x2="${endPt.x}" y2="${endPt.y}"
              stroke="#444444" stroke-width="1.3" stroke-dasharray="3,3" marker-end="url(#hero-arrow-agent)" />
      `;

      const midX = (startPt.x + endPt.x) / 2 + (ae.xOffset || 0);
      const midY = (startPt.y + endPt.y) / 2 + (ae.yOffset || 0);
      const lw = ae.label.length * 6 + 10;
      labelsSvg += `
        <g transform="translate(${midX}, ${midY})">
          <rect x="-${lw / 2}" y="-6.5" width="${lw}" height="13" fill="#ffffff" stroke="#bbbbbb" stroke-width="0.7" />
          <text x="0" y="0" class="svg-edge-label" font-size="8px" fill="#111111">${ae.label}</text>
        </g>
      `;
    });

    // Graph relationships clipped at badge borders so arrowheads touch the badge edge
    edges.forEach(edge => {
      const fn = nodeMap[edge.from];
      const tn = nodeMap[edge.to];
      if (!fn || !tn || !fn.screenX || !tn.screenX) return;

      const srcHalfW = fn.halfW || 58;
      const srcHalfH = fn.halfH || 13;
      const dstHalfW = tn.halfW || 58;
      const dstHalfH = tn.halfH || 13;

      const startPt = getBoxBorderPoint(fn.screenX, fn.screenY, srcHalfW + 2, srcHalfH + 2, tn.screenX, tn.screenY);
      const endPt = getBoxBorderPoint(tn.screenX, tn.screenY, dstHalfW + 3, dstHalfH + 3, fn.screenX, fn.screenY);

      const midX = (startPt.x + endPt.x) / 2 + (edge.xOffset || 0);
      const midY = (startPt.y + endPt.y) / 2 + (edge.yOffset || 0);

      const isFocal = edge.isFocal;
      const markerId = isFocal ? 'hero-arrow-focal' : 'hero-arrow-default';
      const edgeClass = isFocal ? 'svg-edge-line focal-edge' : 'svg-edge-line';
      const labelClass = isFocal ? 'svg-edge-label focal-label' : 'svg-edge-label';
      const bgClass = isFocal ? 'svg-edge-bg focal-bg' : 'svg-edge-bg';

      edgesSvg += `
        <line x1="${startPt.x}" y1="${startPt.y}" x2="${endPt.x}" y2="${endPt.y}"
              class="${edgeClass}" marker-end="url(#${markerId})" />
      `;

      const lw = edge.label.length * 5.8 + 10;
      labelsSvg += `
        <g transform="translate(${midX}, ${midY})">
          <rect x="-${lw / 2}" y="-6.5" width="${lw}" height="13" class="${bgClass}" />
          <text x="0" y="0" class="${labelClass}" font-size="8px">${edge.label}</text>
        </g>
      `;
    });

    svgEdgesGroup.innerHTML = edgesSvg;
    svgLabelsGroup.innerHTML = labelsSvg;
  }

  function updateCameraFit() {
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight || 520;
    camera.aspect = w / h;

    // Dynamically calculate camera Z to ensure the entire graph fits without clipping
    const targetWidthUnits = 114;
    const halfFovRad = THREE.MathUtils.degToRad(camera.fov / 2);
    const requiredZ = (targetWidthUnits / 2) / (Math.tan(halfFovRad) * camera.aspect);
    camera.position.z = Math.max(96, requiredZ);
    camera.updateProjectionMatrix();

    if (renderer) renderer.setSize(w, h);
    updateScreenProjections();
  }

  window.addEventListener('resize', updateCameraFit);
  updateCameraFit();

  let clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    nodes.forEach(n => {
      n.meshGroup.rotation.y += delta * 0.1;
    });

    if (controls) controls.update();
    if (renderer) renderer.render(scene, camera);
    updateScreenProjections();
  }

  animate();
}
