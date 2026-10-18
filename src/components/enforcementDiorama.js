import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function initEnforcementDiorama(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = container.clientWidth;
  const height = container.clientHeight || 540;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
  camera.position.set(0, 26, 75);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxDistance = 150;
  controls.minDistance = 30;

  // Grid
  const gridHelper = new THREE.GridHelper(100, 20, 0x111111, 0xe5e5e5);
  gridHelper.position.y = -18;
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
      <marker id="enf-arrow" viewBox="0 0 10 10" refX="20" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#111111" />
      </marker>
      <marker id="enf-arrow-red" viewBox="0 0 10 10" refX="20" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#d9383a" />
      </marker>
    </defs>
    <g id="enf-svg-edges"></g>
    <g id="enf-svg-labels"></g>
  `;

  const svgEdgesGroup = svgOverlay.querySelector('#enf-svg-edges');
  const svgLabelsGroup = svgOverlay.querySelector('#enf-svg-labels');

  const modeGroups = {
    retry: new THREE.Group(),
    gate: new THREE.Group(),
    cascade: new THREE.Group()
  };

  scene.add(modeGroups.retry);
  scene.add(modeGroups.gate);
  scene.add(modeGroups.cascade);

  // MODE 1: RETRY BLOCK
  const retryGroup = modeGroups.retry;
  const repoBox = new THREE.Mesh(
    new THREE.BoxGeometry(11, 11, 11),
    new THREE.MeshBasicMaterial({ color: 0xf5f5f5 })
  );
  const repoWire = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(11, 11, 11)),
    new THREE.LineBasicMaterial({ color: 0x111111, linewidth: 2 })
  );
  const repoTarget = new THREE.Group();
  repoTarget.add(repoBox);
  repoTarget.add(repoWire);
  repoTarget.position.set(22, 0, 0);
  retryGroup.add(repoTarget);

  const barrier = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 22),
    new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide })
  );
  barrier.position.set(4, 0, 0);
  barrier.rotation.y = Math.PI / 2;
  retryGroup.add(barrier);

  const attemptMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3, 3, 3),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  attemptMesh.position.set(-25, 0, 0);
  retryGroup.add(attemptMesh);

  const incNode = new THREE.Mesh(
    new THREE.OctahedronGeometry(2.6),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  incNode.add(new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.OctahedronGeometry(2.6)),
    new THREE.LineBasicMaterial({ color: 0xd9383a, linewidth: 2 })
  ));
  incNode.position.set(4, 14, 0);
  retryGroup.add(incNode);

  let retryAttemptType = 'refuted';

  // MODE 2: EVIDENCE GATE
  const gateGroup = modeGroups.gate;
  const prTarget = new THREE.Mesh(
    new THREE.BoxGeometry(9, 15, 9),
    new THREE.MeshBasicMaterial({ color: 0xf8f8f8 })
  );
  prTarget.add(new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(9, 15, 9)),
    new THREE.LineBasicMaterial({ color: 0x111111, linewidth: 2 })
  ));
  prTarget.position.set(20, 0, 0);
  gateGroup.add(prTarget);

  const doorGeom = new THREE.BoxGeometry(1.8, 13, 5);
  const leftDoor = new THREE.Mesh(doorGeom, new THREE.MeshBasicMaterial({ color: 0x222222 }));
  leftDoor.position.set(4, 0, -2.8);
  const rightDoor = new THREE.Mesh(doorGeom, new THREE.MeshBasicMaterial({ color: 0x222222 }));
  rightDoor.position.set(4, 0, 2.8);
  gateGroup.add(leftDoor);
  gateGroup.add(rightDoor);

  const approvalReq = new THREE.Mesh(
    new THREE.OctahedronGeometry(2.5),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  approvalReq.position.set(-24, 0, 0);
  gateGroup.add(approvalReq);

  let gateEvidenceState = 'fake';

  // MODE 3: 3-HOP STALE CASCADE
  const cascadeGroup = modeGroups.cascade;
  const cascadeNodes = [
    { id: 'E-41', name: 'E-41', roleTag: 'CI fail', pos: new THREE.Vector3(-24, 0, 0), isFocal: true },
    { id: 'C-7', name: 'C-7', roleTag: 'claim (1-hop)', pos: new THREE.Vector3(-8, 0, 0), isFocal: true },
    { id: 'A-3', name: 'A-3', roleTag: 'approval (2-hop)', pos: new THREE.Vector3(8, 0, 0), isFocal: true },
    { id: 'T-9', name: 'T-9', roleTag: 'task (3-hop)', pos: new THREE.Vector3(24, 0, 0), isFocal: true }
  ];

  const cascadeMeshes = [];
  cascadeNodes.forEach(cn => {
    const group = new THREE.Group();
    group.position.copy(cn.pos);

    const geom = new THREE.BoxGeometry(2.8, 2.8, 2.8);
    const mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geom),
      new THREE.LineBasicMaterial({ color: 0x111111, linewidth: 1.5 })
    );
    group.add(mesh);
    group.add(edges);
    cascadeGroup.add(group);

    cn.meshGroup = group;
    cn.lineMat = edges.material;
    cascadeMeshes.push(cn);

    const badge = document.createElement('div');
    badge.className = 'node-badge focal';
    badge.id = `cas-badge-${cn.id}`;
    badge.innerHTML = `
      <span class="node-id">${cn.name}</span>
      <span class="node-tag">${cn.roleTag}</span>
    `;
    badge.style.display = 'none';
    htmlOverlay.appendChild(badge);
    cn.badgeEl = badge;
  });

  const cascadeEdges = [
    { from: 'E-41', to: 'C-7', label: 'REFUTES' },
    { from: 'A-3', to: 'C-7', label: 'CITES' },
    { from: 'T-9', to: 'A-3', label: 'DEPENDS_ON' }
  ];

  let activeMode = 'retry';
  const hud = document.getElementById('enforcement-hud');

  function setMode(mode) {
    activeMode = mode;
    modeGroups.retry.visible = mode === 'retry';
    modeGroups.gate.visible = mode === 'gate';
    modeGroups.cascade.visible = mode === 'cascade';

    cascadeMeshes.forEach(cn => {
      cn.badgeEl.style.display = mode === 'cascade' ? 'flex' : 'none';
    });

    document.querySelectorAll('.enforce-tab').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-mode') === mode);
    });

    const actionPanel = document.getElementById('enforce-action-panel');

    if (mode === 'retry') {
      attemptMesh.position.set(-25, 0, 0);
      if (actionPanel) {
        actionPanel.innerHTML = `
          <span>AGENT TOOL CALL:</span>
          <div style="display: flex; gap: 8px;">
            <button class="btn-minimal ${retryAttemptType === 'refuted' ? 'active' : ''}" id="btn-test-refuted">Repeat Refuted Fix (TTL Bump)</button>
            <button class="btn-minimal ${retryAttemptType === 'clean' ? 'active' : ''}" id="btn-test-clean">Try Clean Fix (Write-Through)</button>
          </div>
        `;
        document.getElementById('btn-test-refuted').onclick = () => {
          retryAttemptType = 'refuted';
          attemptMesh.position.set(-25, 0, 0);
          setMode('retry');
        };
        document.getElementById('btn-test-clean').onclick = () => {
          retryAttemptType = 'clean';
          attemptMesh.position.set(-25, 0, 0);
          setMode('retry');
        };
      }
      if (hud) {
        hud.innerHTML = retryAttemptType === 'refuted'
          ? `<span class="canvas-hud-focal-tag">PREFLIGHT: BLOCKED (EXIT 2)</span>
             <code>blocked: refuted by E-41 (repeats INC-12 fix)</code><br>
             Tool call halted before file write.`
          : `<span style="color:#27ae60; font-weight:700; display:block; margin-bottom:2px;">PREFLIGHT: ALLOWED (EXIT 0)</span>
             Clean change on independent logic. Write accepted.`;
      }
    } else if (mode === 'gate') {
      approvalReq.position.set(-24, 0, 0);
      leftDoor.position.z = -2.8;
      rightDoor.position.z = 2.8;
      if (actionPanel) {
        actionPanel.innerHTML = `
          <span>EVIDENCE VERIFICATION:</span>
          <div style="display: flex; gap: 8px;">
            <button class="btn-minimal ${gateEvidenceState === 'fake' ? 'active' : ''}" id="btn-test-fake">Fake / Unexecuted Evidence (E-52)</button>
            <button class="btn-minimal ${gateEvidenceState === 'valid' ? 'active' : ''}" id="btn-test-valid">Passing Run on Head SHA</button>
          </div>
        `;
        document.getElementById('btn-test-fake').onclick = () => {
          gateEvidenceState = 'fake';
          approvalReq.position.set(-24, 0, 0);
          setMode('gate');
        };
        document.getElementById('btn-test-valid').onclick = () => {
          gateEvidenceState = 'valid';
          approvalReq.position.set(-24, 0, 0);
          setMode('gate');
        };
      }
      if (hud) {
        hud.innerHTML = gateEvidenceState === 'fake'
          ? `<span class="canvas-hud-focal-tag">EVIDENCE GATE: REFUSED</span>
             Cypher check matches executed=true on head SHA &rarr; returns <strong>0 rows</strong>. Refused.`
          : `<span style="color:#27ae60; font-weight:700; display:block; margin-bottom:2px;">EVIDENCE GATE: UNLOCKED</span>
             Passing test verified on head commit. Approval node created.`;
      }
    } else if (mode === 'cascade') {
      if (actionPanel) {
        actionPanel.innerHTML = `
          <span>SINGLE STATEMENT CYPHER CASCADE:</span>
          <div style="display: flex; gap: 8px;">
            <button class="btn-minimal" id="btn-run-cascade">Execute Single Cypher Statement</button>
            <button class="btn-minimal" id="btn-reset-cascade">Reset</button>
          </div>
        `;
        document.getElementById('btn-run-cascade').onclick = () => triggerCascade();
        document.getElementById('btn-reset-cascade').onclick = () => resetCascade();
      }
      if (hud) {
        hud.innerHTML = `
          <span class="canvas-hud-focal-tag">3-HOP CASCADE: READY</span>
          Click 'Execute Single Cypher Statement' to watch refutation ripple across 3 tiers.
        `;
      }
    }
  }

  function triggerCascade() {
    cascadeMeshes.forEach((n, idx) => {
      setTimeout(() => {
        n.lineMat.color.setHex(0xd9383a);
        n.meshGroup.scale.set(1.2, 1.2, 1.2);
        setTimeout(() => n.meshGroup.scale.set(1, 1, 1), 200);
      }, idx * 250);
    });

    if (hud) {
      hud.innerHTML = `
        <span class="canvas-hud-focal-tag">CYPHER STATEMENT EXECUTED (1 WRITE)</span>
        E-41 refutes C-7 &rarr; A-3 marked stale (hop 2) &rarr; T-9 marked stale (hop 3). Nodes preserved for future retry block!
      `;
    }
  }

  function resetCascade() {
    cascadeMeshes.forEach(n => {
      n.lineMat.color.setHex(0x111111);
      n.meshGroup.scale.set(1, 1, 1);
    });
    if (hud) {
      hud.innerHTML = `<span>GRAPH RESET:</span> All nodes active.`;
    }
  }

  document.querySelectorAll('.enforce-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      setMode(e.target.getAttribute('data-mode'));
    });
  });

  function updateScreenProjections() {
    const w = container.clientWidth;
    const h = container.clientHeight || 540;

    let edgesSvgHtml = '';
    let labelsSvgHtml = '';

    if (activeMode === 'cascade') {
      cascadeMeshes.forEach(node => {
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

      cascadeEdges.forEach(edge => {
        const fromN = cascadeMeshes.find(m => m.id === edge.from);
        const toN = cascadeMeshes.find(m => m.id === edge.to);
        if (!fromN || !toN || !fromN.screenX || !toN.screenX) return;

        const x1 = fromN.screenX;
        const y1 = fromN.screenY;
        const x2 = toN.screenX;
        const y2 = toN.screenY;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        edgesSvgHtml += `
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
                class="svg-edge-line focal-edge" marker-end="url(#enf-arrow-red)" />
        `;

        const textWidth = edge.label.length * 5.8 + 8;
        labelsSvgHtml += `
          <g transform="translate(${midX}, ${midY})">
            <rect x="-${textWidth / 2}" y="-7" width="${textWidth}" height="14" rx="0" class="svg-edge-bg focal-bg" />
            <text x="0" y="0" class="svg-edge-label focal-label">${edge.label}</text>
          </g>
        `;
      });
    }

    svgEdgesGroup.innerHTML = edgesSvgHtml;
    svgLabelsGroup.innerHTML = labelsSvgHtml;
  }

  function onResize() {
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight || 540;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  let clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (activeMode === 'retry') {
      if (retryAttemptType === 'refuted') {
        if (attemptMesh.position.x < 1.5) {
          attemptMesh.position.x += delta * 16;
        } else {
          attemptMesh.position.x = -25;
        }
      } else {
        if (attemptMesh.position.x < 20) {
          attemptMesh.position.x += delta * 18;
        } else {
          attemptMesh.position.x = -25;
        }
      }
      incNode.rotation.y += delta * 0.4;
    } else if (activeMode === 'gate') {
      if (gateEvidenceState === 'fake') {
        if (approvalReq.position.x < 0.5) {
          approvalReq.position.x += delta * 14;
        } else {
          approvalReq.position.x = -24;
        }
        leftDoor.position.z = -2.8;
        rightDoor.position.z = 2.8;
      } else {
        if (approvalReq.position.x < -1) {
          approvalReq.position.x += delta * 14;
          leftDoor.position.z = -2.8;
          rightDoor.position.z = 2.8;
        } else if (approvalReq.position.x < 18) {
          leftDoor.position.z = -6;
          rightDoor.position.z = 6;
          approvalReq.position.x += delta * 16;
        } else {
          approvalReq.position.x = -24;
        }
      }
      prTarget.rotation.y += delta * 0.1;
    } else if (activeMode === 'cascade') {
      cascadeMeshes.forEach(n => {
        n.meshGroup.rotation.y += delta * 0.25;
      });
    }

    controls.update();
    renderer.render(scene, camera);
    updateScreenProjections();
  }

  animate();
  setMode('retry');
}
