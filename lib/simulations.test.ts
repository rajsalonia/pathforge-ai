import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's built-in TypeScript runner imports the source extension directly.
import { answersMatch, fitPolynomial, polynomialErrors, runSimulation, simulationTopics } from "./simulations.ts";

test("every registered concept produces deterministic initial, final and transfer states", () => {
  assert.equal(simulationTopics.length, 47);
  for (const topic of simulationTopics) {
    const first = runSimulation(topic.id, topic.input, topic.parameter);
    const second = runSimulation(topic.id, topic.input, topic.parameter);
    assert.deepEqual(first, second, `${topic.id} must be reproducible`);
    assert.ok(first.frames.length >= 2, `${topic.id} needs observable state transitions`);
    assert.notEqual(first.check.parameter, topic.parameter, `${topic.id} transfer question must alter a parameter`);
    assert.ok(first.metric.length > 0);
    assert.ok(first.explanation.length > 30);
    const transfer = runSimulation(topic.id, first.check.input, first.check.parameter);
    assert.equal(transfer.answer, first.check.expected, `${topic.id} transfer answer must match an actual fresh computation`);
    assert.ok(typeof first.answer === "string" || Number.isFinite(first.answer));
  }
});

test("array insertion counts actual right-to-left shifts and preserves every original value", () => {
  const run = runSimulation("arrays", "8,3,5", 1);
  assert.equal(run.answer, 2);
  assert.deepEqual(run.frames.at(-1)!.cells.map((c: { value: unknown }) => c.value), [8, 99, 3, 5]);
  assert.equal(runSimulation("arrays", "8,3,5", 8).answer, 0);
});

test("linked lists, stacks, queues and heaps respect their structural invariants", () => {
  assert.equal(runSimulation("linked-lists", "8,3,5", 5).answer, 3);
  assert.equal(runSimulation("linked-lists", "8,3,5", 20).answer, 3);
  assert.equal(runSimulation("stacks", "8,3,5", 1).answer, 3);
  assert.equal(runSimulation("queues", "8,3,5", 1).answer, 3);
  assert.equal(runSimulation("stacks", "8,3,5", 6).answer, "empty");
  const heap = runSimulation("heaps", "8,3,5,1,4", 2);
  assert.equal(heap.answer, 4);
  for (const frame of heap.frames) {
    const values = frame.cells.map((c: { value: unknown }) => Number(c.value));
    for (let i = 1; i < values.length; i++) assert.ok(values[Math.floor((i - 1) / 2)] <= values[i]);
  }
});

test("tree traversal, BST duplicate handling, hashing and sorting are computed", () => {
  assert.equal(runSimulation("trees", "1,2,3,4,5,6,7", 1).answer, 11);
  assert.equal(runSimulation("binary-search-trees", "5,3,7,3,6", 6).answer, 3);
  assert.equal(runSimulation("hashing", "-1,3,7,2", 4).answer, 2);
  const sorted = runSimulation("sorting", "3,2,1", 3);
  assert.equal(sorted.answer, 3);
  assert.deepEqual(sorted.frames.at(-1)!.cells.map((c: { value: unknown }) => c.value), [1, 2, 3]);
  assert.equal(runSimulation("binary-search", "9,1,5,3,7", 9).answer, 3);
  assert.equal(runSimulation("recursion", "2,4,6,8", 3).answer, 12);
});

test("BFS, DFS and Dijkstra follow actual graph connectivity and edge weights", () => {
  const edges = "0,1,0,2,1,3,2,4,3,5";
  assert.equal(runSimulation("graph-traversal", edges, 0).answer, "0,1,2,3,4,5");
  assert.equal(runSimulation("dfs", edges, 0).answer, "0,1,3,5,2,4");
  assert.equal(runSimulation("bfs", edges, 0).answer, 3);
  assert.equal(runSimulation("bfs", "0,1,2,3", 0).answer, "unreachable");
  assert.equal(runSimulation("shortest-paths", "4,2,3,1,5,2,1", 5).answer, 5);
  assert.equal(runSimulation("shortest-paths", "4,2,3,1,5,9,1", 5).answer, 8);
  assert.equal(runSimulation("dynamic-programming", "1,3,4", 6).answer, 2);
  assert.equal(runSimulation("dynamic-programming", "4,6", 3).answer, "unreachable");
});

test("round robin accounts for completion minus burst, including different quanta", () => {
  // q=2: P1[0,2], P2[2,4], P3[4,6], P1[6,8], P2[8,9], P1[9,10].
  // completion [10,9,6] minus burst [5,3,2] gives total waiting 15.
  assert.equal(runSimulation("cpu-scheduling", "5,3,2", 2).answer, 15);
  // q=6 runs FCFS: completion [5,8,10], waiting [0,5,8].
  assert.equal(runSimulation("cpu-scheduling", "5,3,2", 6).answer, 13);
  assert.equal(runSimulation("process-states", "3,2", 4).answer, 9);
});

test("synchronization models lost updates, and graph cycles distinguish deadlocked processes", () => {
  assert.equal(runSimulation("synchronization", "3,2", 0).answer, 3);
  assert.equal(runSimulation("synchronization", "3,2", 1).answer, 6);
  assert.equal(runSimulation("deadlocks", "0,1,1,2", 0).answer, 3);
  assert.equal(runSimulation("deadlocks", "0,1,1,2", 3).answer, 0); // Added 2→3 extends the chain without a cycle.
  assert.equal(runSimulation("deadlocks", "0,1,1,2", 1).answer, 2);
  assert.equal(runSimulation("resource-allocation", "3,2,4", 5).answer, 3);
  assert.equal(runSimulation("resource-allocation", "3,3,3", 3).answer, 0);
});

test("paging preserves offsets, FIFO ignores hits, and first fit splits blocks", () => {
  assert.equal(runSimulation("paging", "3,12,19,27", 4).answer, 11);
  assert.equal(runSimulation("paging", "99", 4).answer, "page fault");
  assert.equal(runSimulation("page-replacement", "1,2,3,1,4,2,5,1", 3).answer, 6);
  assert.equal(runSimulation("memory-allocation", "8,5,12,6", 4).answer, 7);
});

test("relational operations retain duplicate multiplicity and transaction atomicity", () => {
  assert.equal(runSimulation("sql-execution", "9,4,7,2,6", 5).answer, 3);
  assert.equal(runSimulation("joins", "1,2,2,3", 0).answer, 5);
  assert.equal(runSimulation("joins", "1,2,2,3", 1).answer, 6);
  assert.equal(runSimulation("transactions", "100,-20,30", 1).answer, 110);
  assert.equal(runSimulation("transactions", "100,-20,30", 0).answer, 100);
  assert.equal(runSimulation("transactions", "10,-20,100", 1).answer, 10);
  assert.equal(runSimulation("locks", "0,0,1,0", 0).answer, 2);
  assert.equal(runSimulation("locks", "0,0,1,0", 1).answer, 4);
  assert.equal(runSimulation("isolation", "20,7", 0).answer, 27);
  assert.equal(runSimulation("isolation", "20,7", 1).answer, 20);
  assert.equal(runSimulation("bplus-trees", "2,5,7,9,12,14,18,20,23", 13).answer, 2);
  assert.equal(runSimulation("query-planning", "1,2,4,5,7,9,12,15", 10).answer, "index");
  assert.equal(runSimulation("query-planning", "1,2,4,5,7,9,12,15", 0).answer, "scan");
});

test("network models compute pipeline times, connectivity, round trips and finite-buffer drops", () => {
  assert.equal(runSimulation("packet-movement", "4,2,5,3", 3).answer, 24);
  assert.equal(runSimulation("packet-movement", "4,2,5,3", 1).answer, 14);
  assert.equal(runSimulation("network-topology", "0,1,1,2,2,3", 1).answer, 2);
  assert.equal(runSimulation("latency", "4,7,3", 5).answer, 33);
  assert.equal(runSimulation("request-response", "2,5,3", 2).answer, 28);
  assert.equal(runSimulation("congestion", "2,5,1,4,0", 2).answer, 2);
});

test("actual polynomial least-squares recovers a noiseless quadratic and responds to noise", () => {
  const coefficients = fitPolynomial([-1,-0.5,0,0.5,1], [1,0.25,0,0.25,1], 2);
  assert.ok(Math.abs(coefficients[0]) < 1e-10);
  assert.ok(Math.abs(coefficients[1]) < 1e-10);
  assert.ok(Math.abs(coefficients[2] - 1) < 1e-10);
  const quadratic = polynomialErrors([0,0,0,0,0,0], 2), linear = polynomialErrors([0,0,0,0,0,0], 1);
  assert.ok(quadratic.validationMse < 1e-20);
  assert.ok(linear.validationMse > 0.05);
  const noisyLow = polynomialErrors([1,-1,2,-1,1,-2], 2), noisyHigh = polynomialErrors([1,-1,2,-1,1,-2], 5);
  assert.ok(noisyHigh.trainMse < noisyLow.trainMse);
  assert.ok(noisyHigh.validationMse > noisyLow.validationMse);
});

test("ML preparation, holdout splits and metrics are actual calculations with explicit conventions", () => {
  assert.equal(runSimulation("data-preparation", "2,4,-99,8", 0).answer, 1);
  assert.equal(runSimulation("data-preparation", "5,5,5", 1).answer, 0);
  assert.equal(runSimulation("train-validation-split", "10,11,12,13,14,15,16,17,18,19", 30).answer, 3);
  assert.equal(runSimulation("classification", "1,3,4,6,7,9", 5).answer, 3);
  assert.equal(runSimulation("decision-boundaries", "1,3,4,6,7,9", 7).answer, 2);
  const predictions = "1,1,0,1,1,0,0,0,1,1";
  assert.equal(runSimulation("confusion-matrices", predictions, 1).answer, 0.667);
  assert.equal(runSimulation("model-evaluation", predictions, 0).answer, 0.6);
  assert.equal(runSimulation("model-evaluation", predictions, 1).answer, 0.667);
  assert.equal(runSimulation("model-evaluation", "0,0,0,0", 1).answer, 0);
});

test("invalid inputs cannot fabricate outcomes or allocate unbounded work", () => {
  assert.throws(() => runSimulation("arrays", "", 1), /between 1 and 12/);
  assert.throws(() => runSimulation("arrays", "Infinity", 1), /whole numbers/);
  assert.throws(() => runSimulation("arrays", "1,2", 99), /parameter/);
  assert.throws(() => runSimulation("bfs", "0,1,2", 0), /complete pairs/);
  assert.throws(() => runSimulation("shortest-paths", "1,1,-1,1,1,1,1", 5), /from 1 to 20/);
  assert.throws(() => runSimulation("data-preparation", "-99,-99", 0), /observed/);
  assert.throws(() => runSimulation("train-validation-split", "1,1", 20), /distinct/);
  assert.throws(() => runSimulation("model-complexity", "1,2,3,4,5", 5), /Degree/);
  assert.throws(() => runSimulation("resource-allocation", "3,2,4", 2), /initially holds/);
});

test("prediction comparison accepts stated rounding and traversal separators without accepting empty numbers", () => {
  assert.equal(answersMatch("0.667", 0.667), true);
  assert.equal(answersMatch("0.66", 0.667), false);
  assert.equal(answersMatch("", 0), false);
  assert.equal(answersMatch("0 → 1 → 2", "0,1,2"), true);
  assert.equal(answersMatch(" PAGE FAULT ", "page fault"), true);
  assert.equal(answersMatch("no", "yes"), false);
});
