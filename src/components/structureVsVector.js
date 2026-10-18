export function initStructureVsVector(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Build the two clearly separated side-by-side comparison panels
  container.innerHTML = `
    <div class="comparison-dual-grid">
      
      <!-- ===================================================================
           PANEL 1: VECTOR & KEYWORD RETRIEVAL (SIMILARITY SEARCH)
           =================================================================== -->
      <div class="comparison-panel" id="panel-vector-sim">
        <div class="comparison-panel-header">
          <div class="panel-header-left">
            <span class="panel-title-badge">VECTOR &amp; KEYWORD RETRIEVAL</span>
            <span class="panel-sub-label">SIMILARITY SEARCH OVER PAST CLAIMS &amp; INCIDENTS</span>
          </div>
          <span class="panel-status-pill warn">1 FALSE BLOCK &middot; 3/5 MISSED APPROVALS</span>
        </div>

        <div class="comparison-stage-wrap">
          <svg class="comparison-svg" viewBox="0 0 540 280" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="vec-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#d9383a" />
              </marker>
              <marker id="vec-arrow-gray" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#888888" />
              </marker>
            </defs>

            <!-- ================= CASE A: FALSE BLOCK ON CLEAN WORK ================= -->
            <text x="20" y="24" font-family="var(--font-mono)" font-size="8.5px" font-weight="700" fill="#888888" letter-spacing="0.06em">
              CASE A: REJECTED VALID FIX (LEXICAL OVERLAP)
            </text>

            <!-- Node A1: Refuted Incident Fix -->
            <g class="comp-node-group" id="node-vec-refuted" transform="translate(95, 68)">
              <rect x="-70" y="-18" width="140" height="36" fill="#111111" stroke="#000000" stroke-width="1" />
              <text x="0" y="-3" font-family="var(--font-new-grotesk)" font-size="10.5px" font-weight="700" fill="#ffffff" text-anchor="middle">"cart cache TTL"</text>
              <text x="0" y="10" font-family="var(--font-mono)" font-size="7.5px" fill="#ff8080" text-anchor="middle">REFUTED ATTEMPT (INC-12)</text>
            </g>

            <!-- Lexical Overlap Connector -->
            <line x1="165" y1="68" x2="205" y2="68" stroke="#d9383a" stroke-width="1.8" stroke-dasharray="3,3" />
            <rect x="145" y="38" width="80" height="15" fill="#ffffff" stroke="#d9383a" stroke-width="0.8" />
            <text x="185" y="49" font-family="var(--font-mono)" font-size="7.5px" fill="#d9383a" font-weight="700" text-anchor="middle">
              BM25 OVERLAP &ge; 0.5
            </text>

            <!-- Node A2: Legitimate Replacement -->
            <g class="comp-node-group" id="node-vec-clean" transform="translate(285, 68)">
              <rect x="-75" y="-18" width="150" height="36" fill="#ffffff" stroke="#d9383a" stroke-width="2" />
              <text x="0" y="-3" font-family="var(--font-new-grotesk)" font-size="10px" font-weight="700" fill="#111111" text-anchor="middle">"write-through store"</text>
              <text x="0" y="10" font-family="var(--font-mono)" font-size="7.5px" fill="#d9383a" font-weight="700" text-anchor="middle">LEGITIMATE ALTERNATIVE</text>
            </g>

            <!-- False Block Stamp -->
            <g transform="translate(450, 68)">
              <rect x="-65" y="-17" width="130" height="34" fill="#d9383a" />
              <text x="0" y="-3" font-family="var(--font-new-grotesk)" font-size="9.5px" font-weight="700" fill="#ffffff" text-anchor="middle">&times; FALSE BLOCK</text>
              <text x="0" y="10" font-family="var(--font-mono)" font-size="7.5px" fill="#ffffff" opacity="0.9" text-anchor="middle">KEYWORD SEARCH HIT</text>
            </g>

            <!-- Horizontal Separator -->
            <line x1="20" y1="120" x2="520" y2="120" stroke="#eeeeee" stroke-width="1" stroke-dasharray="2,2" />

            <!-- ================= CASE B: MISSED 2-HOP DEPENDENCY ================= -->
            <text x="20" y="146" font-family="var(--font-mono)" font-size="8.5px" font-weight="700" fill="#888888" letter-spacing="0.06em">
              CASE B: UNCAUGHT STALE APPROVAL (DISSIMILAR TEXT)
            </text>

            <!-- Node B1: Refuting Evidence E-41 -->
            <g class="comp-node-group" id="node-vec-e41" transform="translate(95, 192)">
              <rect x="-70" y="-18" width="140" height="36" fill="#f8f8f8" stroke="#777777" stroke-width="1" />
              <text x="0" y="-3" font-family="var(--font-new-grotesk)" font-size="10.5px" font-weight="700" fill="#111111" text-anchor="middle">Evidence E-41</text>
              <text x="0" y="10" font-family="var(--font-mono)" font-size="7.5px" fill="#555555" text-anchor="middle">"CI exit_code: 1"</text>
            </g>

            <!-- Vector Distance Gap Indicator -->
            <line x1="165" y1="192" x2="205" y2="192" stroke="#888888" stroke-width="1.2" stroke-dasharray="3,3" />
            <rect x="145" y="162" width="80" height="15" fill="#ffffff" stroke="#888888" stroke-width="0.8" />
            <text x="185" y="173" font-family="var(--font-mono)" font-size="7.5px" fill="#666666" text-anchor="middle">
              COSINE &lt; 0.5 (DISTANT)
            </text>

            <!-- Node B2: Stale PR Approval A-3 -->
            <g class="comp-node-group" id="node-vec-approval" transform="translate(285, 192)">
              <rect x="-75" y="-18" width="150" height="36" fill="#ffffff" stroke="#888888" stroke-width="1" />
              <text x="0" y="-3" font-family="var(--font-new-grotesk)" font-size="10px" font-weight="700" fill="#111111" text-anchor="middle">Approval A-3</text>
              <text x="0" y="10" font-family="var(--font-mono)" font-size="7.5px" fill="#666666" text-anchor="middle">"LGTM on PR #42"</text>
            </g>

            <!-- Missed Stamp -->
            <g transform="translate(450, 192)">
              <rect x="-65" y="-17" width="130" height="34" fill="#f4f4f4" stroke="#888888" stroke-width="1" />
              <text x="0" y="-3" font-family="var(--font-new-grotesk)" font-size="9.5px" font-weight="700" fill="#444444" text-anchor="middle">! MISSED (SILENT PASS)</text>
              <text x="0" y="10" font-family="var(--font-mono)" font-size="7.5px" fill="#666666" text-anchor="middle">KEYWORD (2/5) &bull; MEM0 (2/5)</text>
            </g>

            <!-- Bottom Vector Limitation Note -->
            <rect x="25" y="244" width="490" height="20" fill="#f9f9f9" stroke="#e0e0e0" stroke-width="0.8" rx="2" />
            <text x="270" y="257" font-family="var(--font-mono)" font-size="8px" fill="#555555" text-anchor="middle">
              LIMITATION: Cosine distance &amp; BM25 cannot traverse multi-hop dependency edges
            </text>
          </svg>
        </div>

        <div class="comparison-analysis-box">
          <div class="analysis-row error">
            <span class="analysis-pill-bad">FALSE BLOCK (KEYWORD SEARCH):</span>
            <span>Lexical BM25 matched "cart" and "cache" in <em>"replace cart cache with write-through store"</em>. Good code was rejected because word overlap cannot distinguish a repeat attempt from a replacement architecture. (mem0 had 0 false blocks here).</span>
          </div>
          <div class="analysis-row muted">
            <span class="analysis-pill-gray">MISSED DEPENDENCY (KEYWORD &amp; MEM0):</span>
            <span>Approval A-3 (<em>"LGTM on PR #42"</em>) shares neither keywords nor embedding proximity with CI failure log E-41. Both baselines missed 3/5 multi-hop approvals because vector retrieval cannot follow citation edges.</span>
          </div>
        </div>
      </div>

      <!-- ===================================================================
           PANEL 2: GRAPH TRAVERSAL (FALKORDB · SHELDON)
           =================================================================== -->
      <div class="comparison-panel" id="panel-graph-trav">
        <div class="comparison-panel-header">
          <div class="panel-header-left">
            <span class="panel-title-badge">GRAPH TRAVERSAL (FALKORDB)</span>
            <span class="panel-sub-label">TOPOLOGICAL PATH &amp; FINGERPRINT VERIFICATION</span>
          </div>
          <span class="panel-status-pill good">DEV TRAP SUITE: 0 FALSE BLOCKS &middot; 5/5 CAUGHT</span>
        </div>

        <div class="comparison-stage-wrap">
          <svg class="comparison-svg" viewBox="0 0 540 280" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="gt-arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#d9383a" />
              </marker>
              <marker id="gt-arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#27ae60" />
              </marker>
            </defs>

            <!-- ================= CASE A: PREFLIGHT FINGERPRINT MATCHING ================= -->
            <text x="20" y="24" font-family="var(--font-mono)" font-size="8.5px" font-weight="700" fill="#888888" letter-spacing="0.06em">
              CASE A: PREFLIGHT FINGERPRINT MATCHING
            </text>

            <!-- Clean Action Fingerprint -->
            <g class="comp-node-group" id="node-gt-clean" transform="translate(125, 68)">
              <rect x="-95" y="-18" width="190" height="36" fill="#ffffff" stroke="#27ae60" stroke-width="2" />
              <text x="0" y="-3" font-family="var(--font-new-grotesk)" font-size="10px" font-weight="700" fill="#111111" text-anchor="middle">"write-through store"</text>
              <text x="0" y="10" font-family="var(--font-mono)" font-size="7.5px" fill="#27ae60" font-weight="700" text-anchor="middle">NORMALIZED COMMAND FINGERPRINT</text>
            </g>

            <!-- Check Query Indicator -->
            <line x1="225" y1="68" x2="365" y2="68" stroke="#27ae60" stroke-width="1.5" stroke-dasharray="3,3" marker-end="url(#gt-arrow-green)" />
            <rect x="238" y="42" width="114" height="15" fill="#ffffff" stroke="#27ae60" stroke-width="0.8" />
            <text x="295" y="53" font-family="var(--font-mono)" font-size="7.5px" fill="#27ae60" font-weight="700" text-anchor="middle">
              0 REFUTATIONS IN GRAPH
            </text>

            <!-- Allowed Stamp -->
            <g transform="translate(450, 68)">
              <rect x="-65" y="-17" width="130" height="34" fill="#27ae60" />
              <text x="0" y="-3" font-family="var(--font-new-grotesk)" font-size="9.5px" font-weight="700" fill="#ffffff" text-anchor="middle">&check; ALLOWED</text>
              <text x="0" y="10" font-family="var(--font-mono)" font-size="7.5px" fill="#ffffff" opacity="0.95" text-anchor="middle">0 FALSE BLOCKS IN SUITE</text>
            </g>

            <!-- Horizontal Separator -->
            <line x1="20" y1="120" x2="520" y2="120" stroke="#eeeeee" stroke-width="1" stroke-dasharray="2,2" />

            <!-- ================= CASE B: 2-HOP TRAVERSAL FOR DEPENDENT APPROVAL ================= -->
            <text x="20" y="146" font-family="var(--font-mono)" font-size="8.5px" font-weight="700" fill="#888888" letter-spacing="0.06em">
              CASE B: 2-HOP REFUTATION TRAVERSAL QUERY
            </text>

            <!-- Node B1: Evidence E-41 -->
            <g class="comp-node-group" id="node-gt-e41" transform="translate(75, 192)">
              <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#d9383a" stroke-width="2" />
              <text x="0" y="-2" font-family="var(--font-new-grotesk)" font-size="9.5px" font-weight="700" fill="#d9383a" text-anchor="middle">E-41</text>
              <text x="0" y="8" font-family="var(--font-mono)" font-size="7px" fill="#555555" text-anchor="middle">CI EXIT 1</text>
            </g>

            <!-- Node B2: Claim C-7 -->
            <g class="comp-node-group" id="node-gt-c7" transform="translate(255, 192)">
              <polygon points="0,-20 22,0 0,20 -22,0" fill="#ffffff" stroke="#d9383a" stroke-width="2" />
              <text x="0" y="-2" font-family="var(--font-new-grotesk)" font-size="9.5px" font-weight="700" fill="#d9383a" text-anchor="middle">C-7</text>
              <text x="0" y="8" font-family="var(--font-mono)" font-size="7px" fill="#d9383a" text-anchor="middle">REFUTED</text>
            </g>

            <!-- Node B3: Approval A-3 -->
            <g class="comp-node-group" id="node-gt-a3" transform="translate(435, 192)">
              <rect x="-45" y="-18" width="90" height="36" fill="#ffffff" stroke="#d9383a" stroke-width="2" />
              <text x="0" y="-2" font-family="var(--font-new-grotesk)" font-size="9.5px" font-weight="700" fill="#d9383a" text-anchor="middle">A-3</text>
              <text x="0" y="10" font-family="var(--font-mono)" font-size="7px" fill="#d9383a" font-weight="700" text-anchor="middle">STALE CAUGHT</text>
            </g>

            <!-- Directed Traversal Line 1: E-41 -> C-7 -->
            <line x1="95" y1="192" x2="230" y2="192" stroke="#d9383a" stroke-width="2.2" marker-end="url(#gt-arrow-red)" />
            <rect x="132" y="184" width="62" height="15" fill="#ffffff" stroke="#d9383a" stroke-width="0.8" />
            <text x="163" y="195" font-family="var(--font-mono)" font-size="7.5px" fill="#d9383a" font-weight="700" text-anchor="middle">
              Hop 1: :REFUTES
            </text>

            <!-- Directed Traversal Line 2: A-3 -> C-7 -->
            <line x1="388" y1="192" x2="280" y2="192" stroke="#d9383a" stroke-width="2.2" marker-end="url(#gt-arrow-red)" />
            <rect x="306" y="184" width="56" height="15" fill="#ffffff" stroke="#d9383a" stroke-width="0.8" />
            <text x="334" y="195" font-family="var(--font-mono)" font-size="7.5px" fill="#d9383a" font-weight="700" text-anchor="middle">
              Hop 2: :CITES
            </text>

            <!-- Bottom Traversal Cypher Banner -->
            <rect x="25" y="244" width="490" height="20" fill="#fdf5f5" stroke="#d9383a" stroke-width="1" rx="2" />
            <text x="270" y="257" font-family="var(--font-mono)" font-size="8px" fill="#d9383a" font-weight="700" text-anchor="middle">
              CYPHER: (E-41)-[:REFUTES]&rarr;(C-7)&larr;[:CITES]-(A-3) &bull; 2 HOPS TRAVERSED &rarr; 5/5 CAUGHT
            </text>
          </svg>
        </div>

        <div class="comparison-analysis-box">
          <div class="analysis-row success">
            <span class="analysis-pill-good">PRECISE GATE (0 FALSE BLOCKS):</span>
            <span>Preflight evaluates the normalized action fingerprint against failure records. <em>"Write-through store"</em> has no refutation edge in the graph and passes without false refusal.</span>
          </div>
          <div class="analysis-row focal">
            <span class="analysis-pill-red">2-HOP TRAVERSAL (5/5 CAUGHT):</span>
            <span>Single Cypher statement follows <code>(E-41)-[:REFUTES]&rarr;(C-7)&larr;[:CITES]-(A-3)</code>. Flags disproven approvals regardless of how thoroughly they were rephrased.</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Synthesis Explanation Banner -->
    <div class="comparison-verdict-banner">
      <div class="verdict-title">THE ARCHITECTURAL DISTINCTION &amp; EVALUATION SCOPE</div>
      <p>
        <strong>What graphs solve:</strong> Structure beats similarity for causal and dependency questions. Cypher traverses recorded multi-hop edges <code>(Evidence &rarr; Claim &larr; Approval)</code> regardless of phrasing or text length, eliminating false blocks from keyword overlap and catching stale approvals with dissimilar wording.
      </p>
      <p style="margin-top: 8px;">
        <strong>What graphs do not solve (Narrow Claim):</strong> Graph traversal does not replace semantic understanding. As documented in our 21-scenario trap suite, if an agent rewords a failed fix so thoroughly that its command fingerprint does not match recorded attempts, preflight falls back to <code>warn</code> (Sheldon missed 1 development scenario and 2 held-out scenarios).
      </p>
      <div class="verdict-benchmark-note">
        <em>Evaluation scope:</em> Development trap suite (21 scenarios: 14 bad, 7 good) on pinned FalkorDB v4.22.1. Multi-hop approval subset: Sheldon 5/5 caught vs. Keyword 2/5 and mem0 2/5. False blocks: Sheldon 0/7, mem0 0/7, Keyword 1/7. These measure mechanism behavior on scripted traps, not general AI benchmark guarantees.
      </div>
    </div>
  `;

  // Interactive inspection: Hovering updates contextual feedback
  const panelVector = container.querySelector('#panel-vector-sim');
  const panelGraph = container.querySelector('#panel-graph-trav');

  if (panelVector && panelGraph) {
    const vClean = container.querySelector('#node-vec-clean');
    const gtClean = container.querySelector('#node-gt-clean');

    if (vClean) {
      vClean.style.cursor = 'pointer';
      vClean.addEventListener('mouseenter', () => {
        vClean.querySelector('rect').setAttribute('fill', '#ffe6e6');
      });
      vClean.addEventListener('mouseleave', () => {
        vClean.querySelector('rect').setAttribute('fill', '#ffffff');
      });
    }

    if (gtClean) {
      gtClean.style.cursor = 'pointer';
      gtClean.addEventListener('mouseenter', () => {
        gtClean.querySelector('rect').setAttribute('fill', '#eafaf1');
      });
      gtClean.addEventListener('mouseleave', () => {
        gtClean.querySelector('rect').setAttribute('fill', '#ffffff');
      });
    }
  }
}
