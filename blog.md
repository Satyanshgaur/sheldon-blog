# One Repo, Many Agents, One Memory: Making Shared Agent Memory Trustworthy

*Building Sheldon for Graph Hacks (WeMakeDevs × FalkorDB), Track 02: Agent Memory and Coordination*

---

Picture a normal Tuesday on a repo that uses coding agents. One agent is working on a checkout bug in Claude Code. A cheaper model has picked up the test-writing task. The first agent spawns a subagent to look into a flaky fixture. Halfway through the afternoon its context is compacted, and it carries on with a much shorter memory of the morning. Tomorrow, a fresh session will start with none of it.

Each of those transitions is a place where knowledge falls on the floor. [@arpit_bhayani](https://x.com/arpit_bhayani/status/2100444191876903215) described the mechanism well: when one agent hands work to the next, what gets passed along is a summary rather than the reasoning trace. The receiving agent gets the conclusion but not the context that produced it.

The natural fix is memory that lives outside any single agent's context window. Sheldon is our attempt at that: one shared [FalkorDB](https://www.falkordb.com/) graph per repository, read and written by every agent that works on it. Building it taught us that sharing memory is the easy half. The harder half is making sure what's in it can be trusted.

## The shared notebook

The metaphor we kept coming back to was a professional kitchen. Agents are the line cooks, working at different stations. A good kitchen runs on a shared picture of the night: who has which station, what was sent back and why, so that when a cook hands over, the next one knows what has been tried.

In Sheldon that picture is a property graph. Incidents, claims, evidence, approvals, tasks and attempted actions are nodes, and the relationships carry the meaning: this action was an attempted fix for that claim, this approval relies on that claim, this task depends on it. A small coordination layer sits on top.

**Tasks are claimed with leases.** An agent can take a task only if it is open (or the previous holder's lease has expired), its prerequisite tasks are done, and the claims it depends on haven't been refuted. The claim is a single conditional write, intended to guarantee exactly one winner when agents race for the same task. Heartbeats keep a lease alive while an agent is genuinely working, and an explicit handoff transfers ownership with a note.

**A new session can resume instead of starting over.** An agent picking up work can ask the graph four things: what has been tried, what failed and which evidence says so, what is currently believed and on what basis, and what is ready to be picked up. That is the reasoning trace Arpit was describing, kept in a form a different agent can query.

**A small capsule rides along at session start.** Sheldon injects a tight block of context: the do-nots from refuted attempts that touch the current task, and the command that proves the work. It is re-injected after compaction and again when a subagent starts, because context given to the parent thread doesn't reach its children. It is deliberately tiny and evidence-backed, not a repo dump.

**Every write records who made it.** Claims, evidence, approvals and actions store the model and session that produced them. The motivating case was a Claude Code user's report that a project they only ran on Opus quietly started sessions on Sonnet for about 14 hours, and shipped a data-deleting bug ([anthropics/claude-code#98539](https://github.com/anthropics/claude-code/issues/98539)). It is one user's report, but it made "which model wrote the approvals on this PR?" a question we wanted to answer with one query.

## The catch: shared memory spreads mistakes as easily as knowledge

A notebook that every agent writes in also records everyone's wrong turns, and it hands them to the next cook with the same confidence as the right ones.

Think about what an agent writes down: a hypothesis ("the root cause is the cache TTL"), a fix based on it, a cheerful "done, all tests pass." If any of that is wrong, a shared memory doesn't merely preserve the error. It distributes it. A second agent reads the confident claim and builds an approval on top of it. A third schedules a task that depends on the approval.

Even the single-agent version of this is familiar. [@malladiphani](https://x.com/malladiphani/status/2107056404540608789) summed it up as "it kept trying the same fix and failing the same way." With several agents and several sessions, the same dead end gets walked into again by someone who never saw the first attempt.

FalkorDB's Guy Korland made a related point in [a reply on X](https://x.com/i/status/2099372201292013619), warning that a graph nobody keeps current stops being a memory and becomes a liability: "A stale graph is worse than no graph, it lies with confidence." In a shared setting, being stale isn't a hygiene issue. Other agents make decisions on it.

So the design question became: what would it take for a shared memory to be something agents can rely on? Our answer is that the memory has to be able to refuse things.

## Three enforcement mechanisms

One rule underlies all three: **a model can cite evidence, but it can never create it.** Only trusted producers write evidence: `sheldon run`, which wraps a real command and records its exit code and commit, and CI webhooks. Agents are consumers.

### The retry block

Before an agent edits a file or runs a command, a preflight checks the action's fingerprint (the normalised command plus the files it touches) against the graph. If it matches an attempt that executed evidence has already refuted, the answer is `block`, with a reason the agent can follow:

```
blocked: refuted by E-41
this edit repeats the cache-TTL fix tried for INC-12; E-41 (CI run) refuted it
```

The refutation belongs to the repo, not to whoever made the original attempt. If agent A burned an hour on the TTL fix last week, agent B shouldn't walk into it today. If an agent touches a file from a past incident but takes a genuinely different approach, the answer is only `warn`. The aim is to stop repeats, not to put files off limits. If the graph is unreachable, commit, push and "done" fail closed, while reads fail open so an outage doesn't freeze the agent.

The matching is exact on the normalised fingerprint, plus a scoped full-text check against recorded attempts. That precision is also its weakness, which we come back to below.

### The evidence gate

Claims of completion and approvals on pull requests are graph writes that only land if the evidence they cite checks out. Here is the approval gate, trimmed:

```cypher
MATCH (pr:PR {number:$pr, head_sha:$sha})
MATCH (e:Evidence) WHERE e.id IN $ids AND e.executed = true AND e.sha = $sha
WITH pr, collect(e) AS ev
WHERE size($ids) > 0 AND size(ev) = size($ids)   // the gate: 0 rows = refused
CREATE (a:Approval {id:$aid, sha:$sha, status:'active', ...})-[:FOR]->(pr)
FOREACH (x IN ev | CREATE (a)-[:CITES]->(x))
```

It's worth being exact about what this does and doesn't establish. If an agent cites an ID that doesn't exist, a run that never executed, or a run recorded against a different commit, the match comes back short and nothing is written. What this query does *not* check is the outcome of the run. It proves a cited run happened on this commit, and approvals can cite CI runs as well as local test runs.

The "done" gate is stricter, because a completion claim has to mean the tests passed. It adds conditions on the kind and result of the evidence, along these lines (simplified; the full query is `queries/claim_done.cypher`):

```cypher
WHERE e.id IN $ids
  AND e.kind = 'test_run'
  AND e.executed = true
  AND e.exit_code = 0
  AND e.sha = $sha
```

So the two gates have different requirements, and the guarantee they give is correspondingly different: approvals require real executed evidence on the head commit, and completion claims additionally require a passing test run.

### The stale cascade

When executed evidence refutes a claim, a single Cypher statement marks the claim refuted and follows up to three hops of dependents, flagging every approval and task that relied on it as stale. Because the refutation and the staleness marking are issued as one statement rather than two steps, there is no separate moment where the claim is dead and its dependents haven't been told. We have exercised it on seeded graphs with dependents one and two hops from the refuted claim. Two limits are deliberate: dependencies beyond three hops aren't reached, and a dependency that was never recorded as an edge can't be marked stale. Nothing is deleted, which matters because the refuted claim and its evidence are exactly what the retry block reads next time.

### Three separate boundaries

"Enforces" can mean three different things here, and they shouldn't be blurred:

1. **The graph rejecting an invalid write.** The gate queries above return zero rows and create nothing. This is the layer our evaluation exercises.
2. **A host hook blocking an attempted action.** In Claude Code, a `PreToolUse` hook calls `sheldon preflight`, and exit code 2 blocks the tool call with the reason shown to the agent. This is the delivery path for the retry block. The trap suite below evaluates the preflight decision, not the hook wiring end to end.
3. **A PR check preventing a bad approval from being accepted.** A required GitHub check run is the backstop for anything a local hook can miss; a git pre-commit hook, for example, can be skipped with `--no-verify`. This is a separate integration from the graph queries.

### An illustrative walkthrough

This is the scenario we designed our demo around. It's an illustration of how the pieces fit, not a recording of a specific run.

Agent A reaches for the cache-TTL fix that incident INC-12 already recorded as a failure, with CI run E-41 as the refuting evidence. Preflight returns `block` and agent A sees which evidence ruled it out. Agent B, a cheaper model, reports "done, all tests pass" and cites E-52, which isn't an executed test run on this commit. The done gate returns zero rows and the claim is refused. Then new CI evidence refutes claim C-7, which approval A-3 and task T-9 relied on. One write marks C-7 refuted and A-3 and T-9 stale, so whoever holds T-9 is no longer building on a disproven assumption.

## Does it work?

We should be clear about what we measured. We cut live paired runs against real model APIs on purpose. Hosted models aren't deterministic, and we didn't want to publish pass rates or cost figures we couldn't stand behind. Instead we built a deterministic trap suite: scripted scenarios run against the pinned FalkorDB graph (`falkordb/falkordb:v4.22.1`), each reset from a frozen `GRAPH.COPY` snapshot, with no LLM anywhere in the loop. It asks a narrow question: given the same graph, which systems stop the bad action, and does any of them wrongly stop a good one?

**Definitions.** A *bad action* is one that should be stopped: a retry of a refuted fix (exact or reworded), a "done" claim with no executed run behind it, or an approval resting on a claim that a refuted ancestor, up to three hops away, has invalidated. A *good action* is one that should go through, such as a clean change with no history or a legitimate alternative to a failed fix. A *block* is an explicit refusal: for Sheldon, a `block` from preflight or a refusal from a gate (a `warn` counts as not blocked); for the keyword baseline, a hit on prior claims or incidents; for mem0, a cosine similarity of at least 0.5. A *false block* is a good action that got blocked.

**Arms.** A no-memory control that always allows; a keyword search over prior claims and incidents, standing in for ordinary retrieval memory; [mem0](https://github.com/mem0ai/mem0) with a local embedding model (`all-MiniLM-L6-v2`, `infer=False`); and Sheldon. The development set has 21 scenarios (14 bad, 7 good). The held-out set has 10 (7 bad, 3 good) and was scored separately. [CONFIRM BEFORE PUBLISHING: how the scenarios were chosen, and that the held-out cases weren't used while implementing or tuning.]

| Arm | Development (14 bad, 7 good) | Held-out (7 bad, 3 good) |
|---|---|---|
| No memory (control) | 0 blocked · 0 false blocks · 0.00 ms | 0 blocked · 0 false blocks · 0.00 ms |
| Keyword search | 8 blocked · 1 false block · 5.31 ms | 2 blocked · 0 false blocks · 4.58 ms |
| mem0 (local embedder) | 7 blocked · 0 false blocks · 10.14 ms | 1 blocked · 0 false blocks · 8.72 ms |
| Sheldon | 13 blocked · 0 false blocks · 5.43 ms | 5 blocked · 0 false blocks · 6.13 ms |

*Bad actions blocked, good actions wrongly blocked, and median latency per decision in the evaluation harness. We report medians only. These are harness timings, not end-to-end agent latency.*

**How to read this.** Most of the separation comes from three categories. On unexecuted "done" claims, Sheldon blocked all four and keyword search and mem0 blocked none. That isn't surprising: a retrieval system can find text about tests, but "did a test run on this commit?" isn't a retrieval question, and the baselines have no execution gate. On approvals sitting two or three hops from a refuted claim, Sheldon caught all five, and keyword search and mem0 caught two each. On exact retries of refuted fixes, Sheldon blocked all six, against four for keyword search and three for mem0.

The one false block is instructive. The keyword baseline refused a perfectly good action, replacing a cart cache with a write-through store, because its wording overlapped with a refuted claim. Word overlap is a poor stand-in for "this repeats a known failure."

On latency, everything ran in single-digit to low-double-digit milliseconds. Sheldon was slightly slower than keyword search on the held-out set, and mem0 was the slowest. The only takeaway we'd draw is that none of them is a bottleneck in this harness.

**What this is, and isn't.** These are small, scenario-based results, and they show that the mechanisms behave as designed on those scenarios. They don't show that Sheldon outperforms memory systems on real coding tasks. We built the suite around the job Sheldon was designed for, so baselines without an execution gate or a dependency traversal were never going to do well on those categories. The baselines are stand-ins, not tuned products. Mem0 in particular was run in one configuration, and a different embedder or threshold could shift its numbers.

## What it doesn't guarantee

**Reworded retries slip through.** Sheldon's one development miss and both held-out misses were the same failure: the agent rephrased the fix so thoroughly that nothing overlapped with the recorded attempt, and preflight fell back to `warn`. A looser "same action" matcher exists as a FalkorDB JavaScript function. It has been tested but isn't wired in yet.

**The gate is only as strong as the tests.** Sheldon can say a test run happened on this commit, and for completion claims that it passed. It can't say the assertions were any good. A nastier version of this was described by [@realSamHu](https://x.com/realSamHu/status/2100685063759466784): an agent "finished" a bugfix by deleting the failing test, and CI went green for the wrong reason. A real run on a tree with the test deleted is still a real run. Catching that needs a diff-scope check, which is on our roadmap, not in the current build.

**Coordination isn't evaluated.** The trap suite covers the blocking and staleness decisions. It doesn't run agents through leases, handoffs or resume, and it doesn't test contention. The claim operation is a conditional write designed to give one winner, but a many-claimers concurrency test is still to be done, so treat "exactly one winner" as an intended invariant for now. The hook and check-run integrations are likewise outside what the suite exercises.

**Cost is a hypothesis.** [@GergelyOrosz](https://x.com/GergelyOrosz/status/2101625544626356272) relayed a company capping top-tier model usage and using cheaper models for everything but planning. If the gate holds regardless of which model is working, cheaper models might become safer to use. We haven't measured that.

## What we learned

**Shared memory raises the stakes for being right.** One agent's mistake is a private inconvenience. In a shared memory it's a public fact that others build on.

**Make the memory enforce, not just inform.** Anything you ask an agent to remember to do will eventually be skipped. A blocking exit code or a query that returns zero rows doesn't depend on its cooperation, as long as you're clear about which boundary you're relying on.

**Structure beats similarity for this kind of question.** "Is this approval standing on something that has since been disproven?" is a path question, and graphs are good at path questions. FalkorDB's own account [put the distinction neatly](https://x.com/falkordb/status/2092351558465769688): vector search finds similar text, graph traversal finds connected facts.

### Try it, inspect it, reproduce it

- **Repository:** https://github.com/nothariharan/sheldon
- **The evaluation:** the trap suite lives in `eval/traps/`, with the evaluation framing in the eval `README.md`, the case definitions in `docs/plan/eval-def.md`, and the scored output in `results.md`.
- **The queries:** the gate and cascade queries are in `queries/` (`approve_pr.cypher`, `claim_done.cypher`, `refute_claim.cypher`, `recall_r1.cypher`), so you can check them against everything above.
- **Environment:** FalkorDB pinned to `falkordb/falkordb:v4.22.1`; every scenario resets from a frozen `GRAPH.COPY`, so runs are repeatable.
- **Run it:** [EXACT COMMAND: add before publishing]

If you run more than one agent on the same codebase and have watched them rediscover each other's dead ends, we'd like to hear how it goes.

---

### Sources

Quotes were checked against the text recorded in our research notes, not re-fetched live.

**Referenced in the article:**
[@arpit_bhayani on lossy handoffs](https://x.com/arpit_bhayani/status/2100444191876903215) ·
[@malladiphani on repeated failed fixes](https://x.com/malladiphani/status/2107056404540608789) ·
[Guy Korland on stale graphs (reply)](https://x.com/i/status/2099372201292013619) ·
[@realSamHu on a deleted test](https://x.com/realSamHu/status/2100685063759466784) ·
[@GergelyOrosz on model budgets](https://x.com/GergelyOrosz/status/2101625544626356272) ·
[@falkordb on vector vs. graph](https://x.com/falkordb/status/2092351558465769688) ·
[anthropics/claude-code#98539](https://github.com/anthropics/claude-code/issues/98539)

**Further context:**
[@falkordb: "Agent-memory demos break at user #2"](https://x.com/falkordb/status/2100982681358254499) ·
[Kunal Kushwaha on the Graph Hacks brief](https://x.com/kunalstwt/status/2111391844101759093) ·
[WeMakeDevs](https://x.com/WeMakeDevs/status/2111376518798856267)

**Built on:**
[FalkorDB code-graph](https://github.com/FalkorDB/code-graph) ·
[FalkorDB RepoGraph](https://github.com/FalkorDB/RepoGraph) ·
[mem0](https://github.com/mem0ai/mem0)
