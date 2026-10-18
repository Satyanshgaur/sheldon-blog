export function initBenchmarkViewer(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const scenarios = [
    {
      category: 'Unexecuted "Done" Claim',
      scenario: 'Agent reports "done, all tests pass" citing test run E-52, which never executed on this commit.',
      sheldon: 'BLOCKED (4/4)',
      keyword: 'ALLOWED (0/4)',
      mem0: 'ALLOWED (0/4)',
      why: 'Retrieval systems find test-related words, but cannot verify execution on head commit SHA. Sheldon Done gate requires e.executed=true, exit_code=0, sha=$sha.'
    },
    {
      category: '2-3 Hop Dependency Refutation',
      scenario: 'Approval A-3 relies on Claim C-7. CI Evidence E-41 refutes C-7. Downstream Task T-9 depends on A-3.',
      sheldon: 'BLOCKED (5/5)',
      keyword: 'MISSED (2/5)',
      mem0: 'MISSED (2/5)',
      why: 'Approval wording has no semantic similarity with refuting CI log. Sheldon single Cypher statement walks 3 hops of dependents, marking A-3 and T-9 stale.'
    },
    {
      category: 'Exact Retry of Refuted Fix',
      scenario: 'Agent attempts exact TTL cache edit that INC-12 and E-41 already proved broken.',
      sheldon: 'BLOCKED (6/6)',
      keyword: 'BLOCKED (4/6)',
      mem0: 'BLOCKED (3/6)',
      why: 'Preflight matches normalized fingerprint [file + command] against graph of refuted attempts and blocks with exit code 2.'
    },
    {
      category: 'Clean Action (Good Action Test)',
      scenario: 'Agent replaces cart cache with a write-through store (completely legitimate alternative fix).',
      sheldon: 'ALLOWED (0 False Blocks)',
      keyword: 'FALSE BLOCK (1 False Block)',
      mem0: 'ALLOWED (0 False Blocks)',
      why: 'Keyword search matched the word "cart cache" with the prior failure and wrongly rejected clean work. Sheldon checks structural refutation path, not word overlap.'
    },
    {
      category: 'Reworded Retry (Boundary Limit)',
      scenario: 'Agent rewords the refuted fix with completely novel phrasing and different variable names.',
      sheldon: 'WARNED (Missed)',
      keyword: 'MISSED',
      mem0: 'MISSED',
      why: 'Normalized fingerprint had no exact match; preflight fell back to "warn". FalkorDB JS function for fuzzy semantic graph matching is planned for future build.'
    }
  ];

  let currentIdx = 0;

  function render() {
    const item = scenarios[currentIdx];
    container.innerHTML = `
      <div style="border: 1px solid var(--color-graphite); padding: 24px; background: rgba(0,0,0,0.4);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">
          <span style="font-family: var(--font-new-grotesk); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #aaa;">
            TRAP SUITE SCENARIO INSPECTOR (${currentIdx + 1} OF ${scenarios.length})
          </span>
          <div style="display: flex; gap: 8px;">
            <button class="btn-minimal" id="bench-prev" ${currentIdx === 0 ? 'disabled' : ''}>&larr; PREV</button>
            <button class="btn-minimal" id="bench-next" ${currentIdx === scenarios.length - 1 ? 'disabled' : ''}>NEXT &rarr;</button>
          </div>
        </div>

        <h4 style="font-family: var(--font-beatrice-display); font-size: 22px; margin-bottom: 8px; color: #fff;">
          ${item.category}
        </h4>
        <p style="font-size: 15px; color: #ccc; margin-bottom: 20px;">
          ${item.scenario}
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px;">
          <div style="padding: 12px; border: 1px solid #444; background: #000;">
            <div style="font-family: var(--font-new-grotesk); font-size: 10px; color: #888; text-transform: uppercase;">Sheldon (Graph)</div>
            <div style="font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: #fff; margin-top: 4px;">${item.sheldon}</div>
          </div>
          <div style="padding: 12px; border: 1px solid #333; background: #000;">
            <div style="font-family: var(--font-new-grotesk); font-size: 10px; color: #888; text-transform: uppercase;">Keyword Search</div>
            <div style="font-family: var(--font-mono); font-size: 14px; color: #bbb; margin-top: 4px;">${item.keyword}</div>
          </div>
          <div style="padding: 12px; border: 1px solid #333; background: #000;">
            <div style="font-family: var(--font-new-grotesk); font-size: 10px; color: #888; text-transform: uppercase;">mem0 (all-MiniLM-L6-v2)</div>
            <div style="font-family: var(--font-mono); font-size: 14px; color: #bbb; margin-top: 4px;">${item.mem0}</div>
          </div>
        </div>

        <div style="padding: 12px; background: rgba(255,255,255,0.05); border-left: 2px solid #fff; font-size: 13px; color: #ddd; line-height: 1.5;">
          <strong>Mechanistic Analysis:</strong> ${item.why}
        </div>
      </div>
    `;

    const prevBtn = document.getElementById('bench-prev');
    const nextBtn = document.getElementById('bench-next');
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (currentIdx > 0) {
          currentIdx--;
          render();
        }
      };
    }
    if (nextBtn) {
      nextBtn.onclick = () => {
        if (currentIdx < scenarios.length - 1) {
          currentIdx++;
          render();
        }
      };
    }
  }

  render();
}
