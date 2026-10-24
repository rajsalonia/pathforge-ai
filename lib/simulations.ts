export type SimulationCategory = "DSA" | "Operating systems" | "Databases" | "Networks" | "Machine learning";
export type SimulationCell = { label: string; value: string | number; tone?: "active" | "done" | "warning" | "muted"; x?: number; y?: number };
export type SimulationFrame = {
  title: string; note: string; cells: SimulationCell[]; kind?: "bars" | "nodes" | "table" | "memory" | "timeline" | "scatter";
  links?: { from: number; to: number; label?: string }[];
  points?: { x: number; y: number; group: "training" | "validation" | "curve" }[];
};
export type SimulationTopic = {
  id: string; category: SimulationCategory; name: string; description: string; model: string;
  inputLabel: string; inputHelp: string; input: string; parameterLabel: string; min: number; max: number; parameter: number;
};
export type SimulationResult = {
  topic: SimulationTopic; input: number[]; parameter: number; frames: SimulationFrame[]; answer: string | number;
  metric: string; explanation: string; check: { input: string; parameter: number; question: string; expected: string | number };
};
export type SimulationEvidence = {
  type: "simulation"; topic: string; title: string; category: SimulationCategory; status: "verified"; passed: true;
  score: number; total: number; method: "deterministic-state-model"; scope: string; model: string;
  input: number[]; parameter: number; prediction: string; actual: string | number; predictionMadeBeforeRun: true;
  transfer: { input: string; parameter: number; prediction: string; actual: string | number };
  explanation: string; explanationGraded: false; transitions: number;
  checks: { name: string; passed: true; expected: string | number; actual: string }[];
};
type Computation = Omit<SimulationResult, "topic" | "input" | "parameter" | "check">;
const base = { inputLabel: "Values", inputHelp: "Comma-separated integers, up to 12 values.", input: "9, 4, 7, 2, 6", parameterLabel: "Parameter", min: 1, max: 12, parameter: 2 };
function topic(category: SimulationCategory, id: string, name: string, description: string, model: string, options: Partial<typeof base> = {}): SimulationTopic {
  return { ...base, ...options, id, category, name, description, model };
}
const graphInput = { input: "0, 1, 0, 2, 1, 3, 2, 4, 3, 5", inputLabel: "Undirected edge pairs", inputHelp: "Pairs of vertex labels 0–9. For example: 0,1, 1,2 connects 0–1–2.", parameterLabel: "Start vertex", min: 0, max: 9, parameter: 0 };
const polynomialInput = { input: "1, -1, 2, -1, 1, -2", inputLabel: "Training noise × 10", inputHelp: "5–8 small integers (−5 to 5). At equally spaced x ∈ [−1,1], y = x² + noise/10.", parameterLabel: "Polynomial degree", min: 1, max: 5, parameter: 2 };
const binaryPairs = { input: "1, 1, 0, 1, 1, 0, 0, 0, 1, 1", inputLabel: "Actual, predicted label pairs", inputHelp: "Pairs of binary labels (0 or 1). For example: 1,0 is a false negative for positive class 1.", min: 0, max: 1, parameter: 1, parameterLabel: "Positive class (0 or 1)" };
export const simulationCategories: SimulationCategory[] = ["DSA", "Operating systems", "Databases", "Networks", "Machine learning"];
export const simulationTopics: SimulationTopic[] = [
  topic("DSA", "arrays", "Arrays", "Insert a value and count the elements that must move.", "Contiguous array insertion; the inserted value is 99.", { parameterLabel: "Insertion index (zero-based)", min: 0 }),
  topic("DSA", "linked-lists", "Linked lists", "Follow next pointers until a target is found.", "Singly linked list; sequential search including the matching node.", { parameterLabel: "Target value", min: -20, max: 30, parameter: 7 }),
  topic("DSA", "stacks", "Stacks", "Push the input, then remove the newest items.", "LIFO stack; excess pops stop at empty.", { parameterLabel: "Number of pops" }),
  topic("DSA", "queues", "Queues", "Enqueue the input, then remove the oldest items.", "FIFO queue; excess dequeues stop at empty.", { parameterLabel: "Number of dequeues" }),
  topic("DSA", "trees", "Trees", "Find the sum of a complete binary tree's subtree.", "Level-order complete binary tree, with zero-based root index. An index beyond the tree is clamped to its final node.", { parameterLabel: "Subtree root index", min: 0, parameter: 1 }),
  topic("DSA", "binary-search-trees", "Binary search trees", "Build a BST, then count search comparisons.", "Unbalanced BST insertion; duplicate keys are ignored.", { parameterLabel: "Search target", min: -20, max: 30, parameter: 6 }),
  topic("DSA", "heaps", "Heaps", "Build a min-heap, then repeatedly extract its minimum.", "Binary min-heap with sift-up and sift-down.", { parameterLabel: "Extract-min operations" }),
  topic("DSA", "hashing", "Hashing", "Place each value in a bucket and count collisions.", "Separate chaining with h(k) = ((k mod m) + m) mod m. Each insertion into a nonempty bucket counts once.", { parameterLabel: "Bucket count", min: 2, max: 8, parameter: 4 }),
  topic("DSA", "sorting", "Sorting", "Watch bubble sort compare adjacent values.", "Left-to-right bubble-sort passes, stopping early when no swap occurs.", { parameterLabel: "Maximum passes", parameter: 5 }),
  topic("DSA", "binary-search", "Binary search", "Halve a sorted search interval.", "Input is sorted ascending first. The midpoint is floor((low + high)/2); stop at the first match encountered.", { parameterLabel: "Search target", min: -20, max: 30, parameter: 7 }),
  topic("DSA", "recursion", "Recursion", "Trace calls and returns while summing a prefix.", "sum(k) = input[k−1] + sum(k−1), with sum(0) = 0.", { parameterLabel: "Prefix length", parameter: 4 }),
  topic("DSA", "graph-traversal", "Graph traversal", "Discover vertices in deterministic breadth-first order.", "Undirected graph; neighbors visited in ascending order; only the reachable component is traversed.", graphInput),
  topic("DSA", "bfs", "Breadth-first search", "Find the fewest edges to the highest-numbered vertex.", "Unweighted undirected BFS; ascending neighbors.", graphInput),
  topic("DSA", "dfs", "Depth-first search", "Go as deep as possible before backtracking.", "Recursive preorder DFS; ascending neighbors; only the reachable component is traversed.", graphInput),
  topic("DSA", "shortest-paths", "Shortest paths", "Relax edges in a weighted graph.", "Dijkstra on a fixed undirected graph A–B, A–C, B–D, C–D, C–E, D–F, E–F. Positive integer edge weights only.", { input: "4, 2, 3, 1, 5, 2, 1", inputLabel: "Seven edge weights", inputHelp: "Exactly seven positive weights, 1–20, in the edge order described below.", parameterLabel: "Destination (1=B … 5=F)", min: 1, max: 5, parameter: 5 }),
  topic("DSA", "dynamic-programming", "Dynamic programming", "Build a table for the minimum number of coins.", "Unbounded coin change; positive integer denominations; impossible amounts stay unreachable.", { input: "1, 3, 4", inputLabel: "Coin denominations", inputHelp: "Positive integers from 1 to 20.", parameterLabel: "Target amount", min: 1, max: 30, parameter: 6 }),
  topic("Operating systems", "process-states", "Process states", "Follow a process through CPU work and an I/O wait.", "One process: ready → running → blocked → ready → running → terminated. I/O has a fixed duration; no scheduler contention.", { input: "3, 2", inputLabel: "Two CPU burst durations", inputHelp: "Exactly two integer CPU bursts, 1–12 ticks each.", parameterLabel: "I/O wait (ticks)", max: 8, parameter: 2 }),
  topic("Operating systems", "cpu-scheduling", "CPU scheduling", "Schedule CPU bursts with round robin.", "All processes arrive at t=0, in input order; zero context-switch overhead.", { input: "5, 3, 2", inputLabel: "CPU burst durations", inputHelp: "1–8 processes, each requiring 1–12 ticks.", parameterLabel: "Time quantum", max: 6, parameter: 2 }),
  topic("Operating systems", "synchronization", "Synchronization", "Compare a lost-update schedule with mutex protection.", "In the unlocked case, every worker reads the same value before any worker writes in each round. This is one deterministic interleaving.", { input: "3, 2", inputLabel: "Increments per worker, worker count", inputHelp: "Exactly two integers: increments (1–5), workers (2–6).", parameterLabel: "Mutex (0=off, 1=on)", min: 0, max: 1, parameter: 0 }),
  topic("Operating systems", "deadlocks", "Deadlocks", "Detect cycles in a wait-for graph.", "Single-instance, non-preemptible resources. A directed cycle identifies deadlocked processes. Adds a wait edge from the largest vertex to the selected process.", { ...graphInput, input: "0, 1, 1, 2", inputLabel: "Directed wait-for edge pairs", inputHelp: "Pairs of process labels 0–9; p,q means p waits for q.", parameterLabel: "New wait target", parameter: 0 }),
  topic("Operating systems", "resource-allocation", "Resource allocation", "Find a safe completion sequence with a resource budget.", "Single-resource Banker's safety test. Each process initially holds one unit; claims are its maximum total need. A process releases its unit after finishing.", { input: "3, 2, 4", inputLabel: "Maximum claims per process", inputHelp: "1–8 positive claims, each at most 20. Total resources must cover the initial one-unit allocations.", parameterLabel: "Total resource units", min: 1, max: 20, parameter: 5 }),
  topic("Operating systems", "paging", "Paging", "Translate virtual addresses through a page table.", "Static page table: virtual pages 0–7 map to frames [4,1,6,0,3,7,2,5]. Higher virtual pages are absent; no demand paging.", { input: "3, 12, 19, 27", inputLabel: "Virtual addresses", inputHelp: "Integer addresses from 0 to 99.", parameterLabel: "Page size (bytes)", min: 2, max: 16, parameter: 4 }),
  topic("Operating systems", "page-replacement", "Page replacement", "Count misses as FIFO evicts the oldest loaded page.", "FIFO page replacement; a hit does not change FIFO order; frames start empty.", { input: "1, 2, 3, 1, 4, 2, 5, 1", inputLabel: "Page reference string", inputHelp: "Page IDs from 0 to 20.", parameterLabel: "Frame count", max: 6, parameter: 3 }),
  topic("Operating systems", "memory-allocation", "Memory allocation", "Allocate equal-sized requests into the first available block.", "Repeated first-fit allocation; free blocks split; no freeing or coalescing. Stop when another request cannot fit.", { input: "8, 5, 12, 6", inputLabel: "Free block sizes", inputHelp: "1–8 free blocks, each 1–20 units.", parameterLabel: "Request size", max: 20, parameter: 4 }),
  topic("Databases", "sql-execution", "SQL query execution", "Scan rows, apply a predicate, then order the result.", "Fixed relational query: SELECT id,value FROM samples WHERE value >= threshold ORDER BY value DESC, id ASC. This operator model is separate from the SQL editor mission.", { parameterLabel: "WHERE value >= threshold", min: -10, max: 30, parameter: 5 }),
  topic("Databases", "joins", "Joins", "Observe how duplicate and missing keys affect a join.", "Nested-loop equijoin. Left keys are editable; right keys are fixed at [1,2,2,4]. A left join emits one null match for unmatched left rows.", { input: "1, 2, 2, 3", inputLabel: "Left table keys", parameterLabel: "Join (0=inner, 1=left)", min: 0, max: 1, parameter: 0 }),
  topic("Databases", "transactions", "Transactions", "Stage updates, then commit or roll back atomically.", "First value is a durable balance; remaining values are deltas. A negative staged balance violates a CHECK constraint and aborts the whole transaction.", { input: "100, -20, 30", inputLabel: "Initial balance, then deltas", inputHelp: "2–8 integers; initial balance must be nonnegative; each value −100 to 100.", parameterLabel: "Finish (0=rollback, 1=commit)", min: 0, max: 1, parameter: 1 }),
  topic("Databases", "locks", "Locks", "Apply shared/exclusive compatibility to arriving requests.", "A lock on one row is already held. Shared locks coexist; exclusive locks conflict with every other lock. FIFO wait queue; no lock releases in this trace.", { input: "0, 0, 1, 0", inputLabel: "Lock request modes", inputHelp: "0=shared, 1=exclusive. Requests arrive in input order.", parameterLabel: "Existing lock (0=S, 1=X)", min: 0, max: 1, parameter: 0 }),
  topic("Databases", "isolation", "Isolation concepts", "Read a value while another transaction has an uncommitted update.", "Two-transaction schedule: writer updates; reader reads; writer rolls back. Compare read uncommitted with read committed for this dirty-read example.", { input: "20, 7", inputLabel: "Initial value, writer delta", inputHelp: "Exactly two integers between −100 and 100.", parameterLabel: "Isolation (0=uncommitted, 1=committed)", min: 0, max: 1, parameter: 1 }),
  topic("Databases", "indexing", "Indexing", "Count comparisons in a sorted index lookup.", "A sorted in-memory index searched with binary search. This comparison model omits real database page I/O and caching.", { parameterLabel: "Lookup key", min: -20, max: 30, parameter: 6 }),
  topic("Databases", "bplus-trees", "B-tree / B+ tree concepts", "Follow separator keys into sorted leaf pages.", "Two-level bulk-loaded B+ leaf directory, three keys per leaf. Range query is key <= threshold. Shows separators and linked leaves; occupancy constraints, rebalancing and arbitrary-depth insertion are outside this focused model.", { input: "2, 5, 7, 9, 12, 14, 18, 20, 23", inputLabel: "Unique index keys", parameterLabel: "Range threshold (key <=)", min: 0, max: 30, parameter: 13 }),
  topic("Databases", "query-planning", "Query-planning examples", "Compare a scan with an index lookup under an explicit cost model.", "Toy cost model: scan=n row checks; index=ceil(log₂(n+1)) comparisons + matching rows. Real optimizers also model I/O, statistics, selectivity and cache behavior.", { input: "1, 2, 4, 5, 7, 9, 12, 15", parameterLabel: "Filter threshold (value >=)", min: 0, max: 30, parameter: 10 }),
  topic("Networks", "packet-movement", "Packet movement", "Send packets through a store-and-forward pipeline.", "Linear links each serve one packet at a time. A link's input value is its packet service duration; links can work in parallel; no loss or propagation delay beyond that duration.", { input: "4, 2, 5, 3", inputLabel: "Link service times (ms)", inputHelp: "1–8 positive link times, 1–20 ms each.", parameterLabel: "Packet count", max: 5, parameter: 3 }),
  topic("Networks", "routing", "Routing", "Compute a least-cost route across a network.", "Dijkstra over A–B, A–C, B–D, C–D, C–E, D–F, E–F with positive link costs; static topology.", { input: "4, 2, 3, 1, 5, 2, 1", inputLabel: "Seven link costs", inputHelp: "Exactly seven positive weights, 1–20, in the link order described below.", parameterLabel: "Destination (1=B … 5=F)", min: 1, max: 5, parameter: 5 }),
  topic("Networks", "network-topology", "Network topology", "Fail a node and measure disconnected components.", "Undirected static graph; remove the selected vertex and its incident edges. Count connected components among remaining vertices.", { ...graphInput, input: "0, 1, 1, 2, 2, 3, 3, 0, 1, 3", parameterLabel: "Failed vertex", parameter: 1 }),
  topic("Networks", "latency", "Latency", "Add one-way link delays and server processing time.", "Request and response take the same path; RTT = 2×sum(link delays)+server time. Ignores serialization, queueing and packet loss.", { input: "4, 7, 3", inputLabel: "One-way link delays (ms)", inputHelp: "1–8 integer delays, 1–20 ms each.", parameterLabel: "Server processing (ms)", max: 20, parameter: 5 }),
  topic("Networks", "request-response", "Request/response flow", "Follow DNS, request travel, processing and response travel.", "Sequential requests over an established connection. One initial DNS lookup; fixed one-way delay and server time. TLS and TCP setup omitted.", { input: "2, 5, 3", inputLabel: "DNS, one-way delay, server time (ms)", inputHelp: "Exactly three positive durations from 1 to 20.", parameterLabel: "Sequential request count", max: 6, parameter: 2 }),
  topic("Networks", "congestion", "Basic congestion", "Observe queue growth and packet drops at a bottleneck.", "Discrete time slots. Arrivals join a four-packet buffer first; overflow drops; the link then transmits up to its service rate.", { input: "2, 5, 1, 4, 0", inputLabel: "Packets arriving each slot", inputHelp: "Arrival counts from 0 to 12.", parameterLabel: "Packets served per slot", max: 6, parameter: 2 }),
  topic("Machine learning", "data-preparation", "Data preparation", "Impute missing training values, then fit a scaler.", "−99 denotes missing. Mean-impute using observed training values; min–max scaling or population z-score scaling. This mini-set is training data only.", { input: "2, 4, -99, 8", inputLabel: "Training values (−99 = missing)", parameterLabel: "Scaler (0=min–max, 1=z-score)", min: 0, max: 1, parameter: 0 }),
  topic("Machine learning", "train-validation-split", "Training and validation splits", "Keep validation examples separate from training.", "Deterministic ordered split; last max(1,floor(n×percent/100)) rows are held out. No random shuffle or stratification is claimed.", { input: "10, 11, 12, 13, 14, 15, 16, 17, 18, 19", inputLabel: "Example IDs", parameterLabel: "Validation percentage", min: 10, max: 50, parameter: 30 }),
  topic("Machine learning", "classification", "Classification", "Apply a one-dimensional threshold classifier.", "Fixed classifier, not trained AI: class 1 when feature >= threshold, otherwise class 0.", { input: "1, 3, 4, 6, 7, 9", inputLabel: "Feature values", parameterLabel: "Decision threshold", min: -10, max: 20, parameter: 5 }),
  topic("Machine learning", "model-complexity", "Model complexity", "Fit actual polynomial regressors to a noisy quadratic.", "Least-squares polynomial fit via Gaussian elimination. Validation uses five fixed, noiseless x² points. Errors are computed; no canned learning curves.", polynomialInput),
  topic("Machine learning", "overfitting", "Overfitting", "Compare training fit with held-out generalization error.", "Least-squares fit to noisy x² data. High degree can follow training noise; a training improvement does not guarantee a validation improvement.", { ...polynomialInput, parameter: 5 }),
  topic("Machine learning", "underfitting", "Underfitting", "Test whether a linear model can represent a quadratic trend.", "Least-squares polynomial regression on noisy x² data. A degree-one model has no quadratic term; inspect actual train and validation errors.", { ...polynomialInput, parameter: 1 }),
  topic("Machine learning", "confusion-matrices", "Confusion matrices", "Accumulate true/false positives and negatives.", "Binary classification counts relative to your chosen positive class. F1=2TP/(2TP+FP+FN); a zero denominator yields 0.", binaryPairs),
  topic("Machine learning", "decision-boundaries", "Decision boundaries", "Move a boundary and watch predictions change.", "One-dimensional logistic score p=1/(1+exp(−(x−threshold))). Predict 1 when p>=0.5; model parameters are set, not learned.", { input: "1, 3, 4, 6, 7, 9", inputLabel: "Feature values", parameterLabel: "Boundary position", min: -10, max: 20, parameter: 5 }),
  topic("Machine learning", "model-evaluation", "Model evaluation", "Compute accuracy, precision, recall or F1 from predictions.", "Binary label evaluation with positive class 1; zero-denominator precision/recall/F1 is defined as 0 for this exercise.", { ...binaryPairs, parameterLabel: "Metric (0=accuracy, 1=precision, 2=recall, 3=F1)", max: 3, parameter: 0 }),
];

const round = (n: number, digits = 3) => Number(n.toFixed(digits));
const cell = (label: string, value: string | number, tone?: SimulationCell["tone"]): SimulationCell => ({ label, value, tone });
const valuesFrame = (title: string, values: number[], note: string, active = -1, kind: SimulationFrame["kind"] = "bars"): SimulationFrame => ({ title, note, kind, cells: values.map((v, i) => cell(`[${i}]`, v, i === active ? "active" : undefined)) });
const requireValues = (condition: boolean, message: string) => { if (!condition) throw new Error(message); };
const result = (frames: SimulationFrame[], answer: string | number, metric: string, explanation: string): Computation => ({ frames, answer, metric, explanation });
function parseInput(raw: string): number[] {
  const pieces = raw.trim().split(/[\s,;]+/).filter(Boolean);
  requireValues(pieces.length > 0 && pieces.length <= 12, "Enter between 1 and 12 integers.");
  const values = pieces.map(Number);
  requireValues(values.every(n => Number.isInteger(n) && n >= -100 && n <= 100), "Use whole numbers between −100 and 100.");
  return values;
}
function bounded(values: number[], min: number, max: number, maxCount = 12) {
  requireValues(values.length <= maxCount && values.every(v => v >= min && v <= max), `Use at most ${maxCount} values, each from ${min} to ${max}.`);
}
function graph(values: number[], extra?: number, directed = false): Map<number, number[]> {
  requireValues(values.length % 2 === 0, "A graph needs complete pairs of vertices."); bounded(values, 0, 9);
  const adjacency = new Map<number, number[]>();
  const addVertex = (v: number) => { if (!adjacency.has(v)) adjacency.set(v, []); };
  if (extra !== undefined) addVertex(extra);
  for (let i = 0; i < values.length; i += 2) {
    const a = values[i], b = values[i + 1]; addVertex(a); addVertex(b);
    if (!adjacency.get(a)!.includes(b)) adjacency.get(a)!.push(b);
    if (!directed && !adjacency.get(b)!.includes(a)) adjacency.get(b)!.push(a);
  }
  for (const neighbors of adjacency.values()) neighbors.sort((a, b) => a - b);
  return new Map([...adjacency].sort(([a], [b]) => a - b));
}
function graphFrame(adjacency: Map<number, number[]>, title: string, note: string, visited: Set<number> = new Set(), active = -1): SimulationFrame {
  const labels = [...adjacency.keys()];
  return { title, note, kind: "nodes", cells: labels.map(v => cell(`Vertex ${v}`, v, active === v ? "active" : visited.has(v) ? "done" : undefined)), links: labels.flatMap((v, i) => adjacency.get(v)!.map(n => ({ from: i, to: labels.indexOf(n) }))).filter(l => l.to >= 0) };
}
function binaryLookup(values: number[], target: number): Computation {
  const sorted = [...values].sort((a, b) => a - b); let low = 0, high = sorted.length - 1, comparisons = 0, found = false;
  const frames = [valuesFrame("Sorted search space", sorted, "The search interval initially contains every value.")];
  while (low <= high) {
    const mid = Math.floor((low + high) / 2); comparisons++;
    frames.push(valuesFrame(`Compare ${target} with index ${mid}`, sorted, `low=${low}, high=${high}, middle=${mid}; comparison ${comparisons}.`, mid));
    if (sorted[mid] === target) { found = true; break; }
    if (sorted[mid] < target) low = mid + 1; else high = mid - 1;
  }
  frames.push(valuesFrame(found ? "Target found" : "Empty search interval", sorted, `${comparisons} comparisons; ${found ? "the target is present" : "the target is absent"}.`));
  return result(frames, comparisons, "Search comparisons", "Each unsuccessful comparison eliminates the midpoint and the half that cannot contain the target. Sorting is a separate preparation step, not included in this comparison count.");
}
function dijkstra(values: number[], destination: number): Computation {
  requireValues(values.length === 7, "Enter exactly seven edge weights."); bounded(values, 1, 20);
  const edges = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 5]];
  const positions = [[10, 50], [36, 18], [36, 82], [65, 18], [65, 82], [90, 50]];
  const distance = [0, Infinity, Infinity, Infinity, Infinity, Infinity], done = new Set<number>();
  const snapshot = (title: string, note: string, active = -1): SimulationFrame => ({ title, note, kind: "nodes", cells: distance.map((d, i) => ({ label: String.fromCharCode(65 + i), value: Number.isFinite(d) ? d : "∞", tone: active === i ? "active" : done.has(i) ? "done" : undefined, x: positions[i][0], y: positions[i][1] })), links: edges.map(([from, to], i) => ({ from, to, label: String(values[i]) })) });
  const frames = [snapshot("Source A starts at distance 0", "All other distances begin at infinity.")];
  while (done.size < 6) {
    let u = -1; for (let v = 0; v < 6; v++) if (!done.has(v) && (u < 0 || distance[v] < distance[u])) u = v;
    if (u < 0 || !Number.isFinite(distance[u])) break;
    done.add(u);
    edges.forEach(([a, b], i) => { const v = a === u ? b : b === u ? a : -1; if (v >= 0 && !done.has(v)) distance[v] = Math.min(distance[v], distance[u] + values[i]); });
    frames.push(snapshot(`Settle ${String.fromCharCode(65 + u)}`, "Relax each adjacent edge: candidate = settled distance + edge weight.", u));
  }
  return result(frames, distance[destination], `Shortest cost A → ${String.fromCharCode(65 + destination)}`, "With nonnegative edge costs, the unsettled vertex with the smallest tentative distance can be finalized. Each relaxation retains the cheaper known route.");
}

/** Least-squares normal equations for the small, bounded teaching datasets. */
export function fitPolynomial(xs: number[], ys: number[], degree: number): number[] {
  const size = degree + 1;
  const matrix = Array.from({ length: size }, (_, r) => Array.from({ length: size + 1 }, (_, c) => c === size ? xs.reduce((sum, x, i) => sum + ys[i] * x ** r, 0) : xs.reduce((sum, x) => sum + x ** (r + c), 0)));
  for (let col = 0; col < size; col++) {
    let pivot = col; for (let r = col + 1; r < size; r++) if (Math.abs(matrix[r][col]) > Math.abs(matrix[pivot][col])) pivot = r;
    [matrix[col], matrix[pivot]] = [matrix[pivot], matrix[col]];
    requireValues(Math.abs(matrix[col][col]) > 1e-10, "This polynomial degree cannot be fit to the available points. Lower the degree.");
    const scale = matrix[col][col]; for (let c = col; c <= size; c++) matrix[col][c] /= scale;
    for (let r = 0; r < size; r++) if (r !== col) { const factor = matrix[r][col]; for (let c = col; c <= size; c++) matrix[r][c] -= factor * matrix[col][c]; }
  }
  return matrix.map(row => row[size]);
}
export function polynomialErrors(noise: number[], degree: number) {
  const xs = noise.map((_, i) => -1 + 2 * i / (noise.length - 1)), ys = xs.map((x, i) => x * x + noise[i] / 10);
  const coefficients = fitPolynomial(xs, ys, degree);
  const predict = (x: number) => coefficients.reduce((sum, c, i) => sum + c * x ** i, 0);
  const validation = [-0.85, -0.45, 0.05, 0.45, 0.85];
  const trainMse = xs.reduce((sum, x, i) => sum + (predict(x) - ys[i]) ** 2, 0) / xs.length;
  const validationMse = validation.reduce((sum, x) => sum + (predict(x) - x * x) ** 2, 0) / validation.length;
  return { xs, ys, coefficients, predict, validation, trainMse, validationMse };
}

function compute(id: string, values: number[], parameter: number): Computation {
  const p = parameter, frames: SimulationFrame[] = [];
  if (id === "arrays") {
    const index = Math.min(p, values.length), out = [...values];
    frames.push(valuesFrame("Before insertion", values, `Insert 99 at index ${index}. An index beyond the end is clamped to the end.`, index));
    for (let i = values.length - 1; i >= index; i--) { out[i + 1] = out[i]; frames.push(valuesFrame(`Shift index ${i} → ${i + 1}`, [...out], "Move from right to left so no unread value is overwritten.", i + 1)); }
    out[index] = 99; frames.push(valuesFrame("Insert the new value", out, `The insertion required ${values.length - index} shifts.`, index));
    return result(frames, values.length - index, "Element shifts", "Only elements at or after the insertion index move. The number of shifts is original length minus the clamped insertion index.");
  }
  if (id === "linked-lists") {
    const snapshot = (title: string, active: number, note: string): SimulationFrame => ({ ...valuesFrame(title, values, note, active, "nodes"), links: values.slice(1).map((_, i) => ({ from: i, to: i + 1 })) });
    frames.push(snapshot("Head points to the first node", -1, "The next pointers connect input values in order."));
    let comparisons = 0; for (let i = 0; i < values.length; i++) { comparisons++; frames.push(snapshot(`Visit node ${i}`, i, `${values[i]} ${values[i] === p ? "equals" : "does not equal"} target ${p}.`)); if (values[i] === p) break; }
    return result(frames, comparisons, "Nodes compared", "A linked list cannot jump directly to an arbitrary index. Follow next pointers and stop at the first matching value or at null.");
  }
  if (id === "stacks" || id === "queues") {
    const stack = id === "stacks", items: number[] = [];
    frames.push(valuesFrame("Empty structure", [], stack ? "The most recently pushed item becomes the top." : "The earliest enqueued item is at the front.", -1, "memory"));
    values.forEach(v => { items.push(v); frames.push(valuesFrame(`${stack ? "Push" : "Enqueue"} ${v}`, [...items], stack ? "Top is on the right." : "Front is on the left.", items.length - 1, "memory")); });
    for (let n = 0; n < p && items.length; n++) { const removed = stack ? items.pop() : items.shift(); frames.push(valuesFrame(`${stack ? "Pop" : "Dequeue"} ${removed}`, [...items], `${items.length} items remain.`, stack ? items.length - 1 : 0, "memory")); }
    return result(frames, items.length ? items[stack ? items.length - 1 : 0] : "empty", stack ? "Remaining top value (or empty)" : "Remaining front value (or empty)", stack ? "A stack is last in, first out. Removing the top reveals the next newest value." : "A queue is first in, first out. Removing the front reveals the next oldest value.");
  }
  if (id === "trees") {
    const root = Math.min(p, values.length - 1), visited = new Set<number>(), queue = [root]; let sum = 0;
    const snapshot = (title: string, active = -1): SimulationFrame => ({ title, note: `Subtree root ${root}; accumulated sum ${sum}. Children of i are 2i+1 and 2i+2.`, kind: "nodes", cells: values.map((v, i) => { const depth = Math.floor(Math.log2(i + 1)), position = i - (2 ** depth - 1); return { ...cell(`[${i}]`, v, active === i ? "active" : visited.has(i) ? "done" : "muted"), x: 100 * (position + 0.5) / 2 ** depth, y: 12 + depth * 24 }; }), links: values.slice(1).map((_, i) => ({ from: Math.floor(i / 2), to: i + 1 })) });
    frames.push(snapshot("Complete binary tree"));
    while (queue.length) { const i = queue.shift()!; visited.add(i); sum += values[i]; for (const child of [2 * i + 1, 2 * i + 2]) if (child < values.length) queue.push(child); frames.push(snapshot(`Add node ${i}`, i)); }
    return result(frames, sum, "Subtree sum", "Only descendants of the selected root contribute. Level-order storage determines child positions; the input values do not determine the tree's shape.");
  }
  if (id === "binary-search-trees") {
    type Node = { value: number; left: number; right: number; depth: number; x: number; width: number };
    const nodes: Node[] = [];
    const snapshot = (title: string, note: string, active = -1): SimulationFrame => ({ title, note, kind: "nodes", cells: nodes.map((n, i) => ({ ...cell(`Node ${i}`, n.value, active === i ? "active" : undefined), x: n.x, y: 10 + 80 * n.depth / Math.max(3, ...nodes.map(n => n.depth)) })), links: nodes.flatMap((n, i) => [n.left, n.right].filter(child => child >= 0).map(child => ({ from: i, to: child }))) });
    frames.push(snapshot("Empty binary search tree", "Insert the values in their given order."));
    values.forEach(value => { if (!nodes.length) nodes.push({ value, left: -1, right: -1, depth: 0, x: 50, width: 46 }); else { let i = 0; while (true) { const n = nodes[i]; if (n.value === value) break; const side = value < n.value ? "left" : "right"; if (n[side] < 0) { n[side] = nodes.length; nodes.push({ value, left: -1, right: -1, depth: n.depth + 1, x: n.x + (side === "left" ? -1 : 1) * n.width / 2, width: n.width / 2 }); break; } i = n[side]; } } frames.push(snapshot(`Insert ${value}`, "Smaller keys go left; larger keys go right. Duplicate keys keep the existing node.")); });
    let i = 0, comparisons = 0; while (i >= 0 && nodes[i]) { comparisons++; frames.push(snapshot(`Search comparison ${comparisons}`, `${p} compared with ${nodes[i].value}.`, i)); if (p === nodes[i].value) break; i = p < nodes[i].value ? nodes[i].left : nodes[i].right; }
    return result(frames, comparisons, "Search comparisons", "The BST ordering chooses exactly one branch at each comparison. An unbalanced tree can still require a linear number of comparisons.");
  }
  if (id === "heaps") {
    const heap: number[] = [];
    const snap = (title: string): SimulationFrame => ({ ...valuesFrame(title, [...heap], "Every parent is <= its children. The minimum is at the root.", 0, "nodes"), cells: heap.map((v, i) => { const d = Math.floor(Math.log2(i + 1)); return { ...cell(`[${i}]`, v, i === 0 ? "active" : undefined), x: 100 * (i - (2 ** d - 1) + 0.5) / 2 ** d, y: 12 + d * 24 }; }), links: heap.slice(1).map((_, i) => ({ from: Math.floor(i / 2), to: i + 1 })) });
    frames.push(snap("Empty min-heap"));
    values.forEach(v => { heap.push(v); let i = heap.length - 1; while (i > 0) { const parent = Math.floor((i - 1) / 2); if (heap[parent] <= heap[i]) break; [heap[parent], heap[i]] = [heap[i], heap[parent]]; i = parent; } frames.push(snap(`Insert ${v} and sift up`)); });
    for (let n = 0; n < p && heap.length; n++) { const min = heap[0], tail = heap.pop()!; if (heap.length) { heap[0] = tail; let i = 0; while (2 * i + 1 < heap.length) { let smallest = 2 * i + 1; if (smallest + 1 < heap.length && heap[smallest + 1] < heap[smallest]) smallest++; if (heap[i] <= heap[smallest]) break; [heap[i], heap[smallest]] = [heap[smallest], heap[i]]; i = smallest; } } frames.push(snap(`Extract ${min} and restore the heap`)); }
    return result(frames, heap.length ? heap[0] : "empty", "Next minimum (or empty)", "After removing the root, replace it with the last value, then sift it down along the smaller-child branch until the min-heap invariant is restored.");
  }
  if (id === "hashing") {
    const buckets: number[][] = Array.from({ length: p }, () => []); let collisions = 0;
    const snap = (title: string, active = -1): SimulationFrame => ({ title, note: `${collisions} insertion collisions so far. Buckets retain every inserted value.`, kind: "memory", cells: buckets.map((b, i) => cell(`Bucket ${i}`, b.length ? b.join(" → ") : "∅", active === i ? "active" : undefined)) });
    frames.push(snap("Empty hash table")); values.forEach(v => { const h = ((v % p) + p) % p; if (buckets[h].length) collisions++; buckets[h].push(v); frames.push(snap(`Hash ${v} → bucket ${h}`, h)); });
    return result(frames, collisions, "Insertion collisions", "Different values may share a bucket. Separate chaining stores both instead of overwriting data. A collision is counted whenever a new insertion meets an occupied bucket.");
  }
  if (id === "sorting") {
    const out = [...values]; let swaps = 0; frames.push(valuesFrame("Unsorted array", out, "Compare adjacent values, swapping only when the left is larger."));
    for (let pass = 0; pass < Math.min(p, out.length - 1); pass++) { let changed = false; for (let i = 0; i < out.length - 1 - pass; i++) if (out[i] > out[i + 1]) { [out[i], out[i + 1]] = [out[i + 1], out[i]]; swaps++; changed = true; frames.push(valuesFrame(`Pass ${pass + 1}: swap ${i} ↔ ${i + 1}`, [...out], `${swaps} adjacent swaps so far.`, i + 1)); } if (!changed) { frames.push(valuesFrame("No swaps needed", [...out], "A full unchanged pass proves the array is sorted.")); break; } }
    const sorted = out.every((v, i) => i === 0 || out[i - 1] <= v);
    frames.push(valuesFrame(sorted ? "Array sorted" : "Pass limit reached", [...out], `${swaps} total adjacent swaps. ${sorted ? "Every adjacent pair is in order." : "More passes would be needed to sort the remaining prefix."}`));
    return result(frames, swaps, "Adjacent swaps", "Each left-to-right pass moves the largest unsorted value to the right. A pass with no swaps ends the algorithm early; a limited pass count may leave the array partly sorted.");
  }
  if (id === "binary-search" || id === "indexing") return binaryLookup(values, p);
  if (id === "recursion") {
    const k = Math.min(p, values.length), stack: number[] = []; let sum = 0;
    frames.push(valuesFrame("Input values", values, `Compute sum(${k}); prefix length is clamped to the array length.`));
    for (let n = k; n >= 0; n--) { stack.push(n); frames.push({ title: `Call sum(${n})`, note: n === 0 ? "Base case: return 0." : `Wait for sum(${n - 1}), then add input[${n - 1}]=${values[n - 1]}.`, kind: "memory", cells: stack.map(n => cell(`Frame ${n}`, `sum(${n})`, n === 0 ? "active" : undefined)) }); }
    stack.pop(); for (let n = 1; n <= k; n++) { sum += values[n - 1]; stack.pop(); frames.push({ title: `Return sum(${n}) = ${sum}`, note: "A completed child call supplies the value needed by its parent.", kind: "memory", cells: [cell("Returned total", sum, "done"), ...stack.map(n => cell("Waiting call", `sum(${n})`))] }); }
    return result(frames, sum, "Returned sum", "The call stack stores unfinished work. After sum(0) returns 0, values are added as frames unwind.");
  }
  if (["graph-traversal", "bfs", "dfs"].includes(id)) {
    const adjacency = graph(values, p), seen = new Set<number>(), order: number[] = [], distances = new Map([[p, 0]]), target = Math.max(...adjacency.keys());
    frames.push(graphFrame(adjacency, "Graph before traversal", `Start at ${p}; highest vertex is ${target}.`));
    if (id === "dfs") { const visit = (v: number) => { seen.add(v); order.push(v); frames.push(graphFrame(adjacency, `Discover ${v}`, `DFS preorder: ${order.join(" → ")}.`, seen, v)); adjacency.get(v)!.forEach(n => { if (!seen.has(n)) visit(n); }); }; visit(p); }
    else { const queue = [p]; seen.add(p); while (queue.length) { const v = queue.shift()!; order.push(v); for (const n of adjacency.get(v)!) if (!seen.has(n)) { seen.add(n); queue.push(n); distances.set(n, distances.get(v)! + 1); } frames.push(graphFrame(adjacency, `Visit ${v}`, `Order: ${order.join(" → ")}. Queue: ${queue.join(", ") || "empty"}.`, seen, v)); } }
    if (id === "bfs") return result(frames, distances.get(target) ?? "unreachable", `Fewest edges ${p} → ${target}`, "A FIFO frontier visits vertices in increasing distance from the source. The first discovered distance is a shortest path in an unweighted graph.");
    return result(frames, order.join(","), "Traversal order (comma-separated)", id === "dfs" ? "DFS follows the smallest unvisited neighbor recursively before backtracking. The resulting order depends on the stated neighbor ordering." : "BFS uses a FIFO queue. A vertex is marked on enqueue so it cannot be scheduled twice.");
  }
  if (id === "shortest-paths" || id === "routing") return dijkstra(values, p);
  if (id === "dynamic-programming") {
    bounded(values, 1, 20); const coins = [...new Set(values)], dp = Array<number>(p + 1).fill(Infinity); dp[0] = 0;
    const snap = (title: string, active = -1): SimulationFrame => ({ title, note: "dp[a] = min(dp[a−coin]+1) over coins that fit; ∞ means unreachable.", kind: "memory", cells: dp.map((v, a) => cell(String(a), Number.isFinite(v) ? v : "∞", a === active ? "active" : Number.isFinite(v) ? "done" : undefined)) });
    frames.push(snap("Base case: zero coins make amount 0", 0));
    for (let a = 1; a <= p; a++) { for (const c of coins) if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1); frames.push(snap(`Solve amount ${a}`, a)); }
    return result(frames, Number.isFinite(dp[p]) ? dp[p] : "unreachable", "Minimum coins (or unreachable)", "Each table entry reuses optimal solutions for smaller amounts. The same coin may be used more than once in this unbounded problem.");
  }
  if (id === "process-states") {
    requireValues(values.length === 2, "Enter exactly two CPU burst durations."); bounded(values, 1, 12); let time = 0;
    const state = (name: string, duration = 0) => { time += duration; frames.push({ title: `t=${time}: ${name}`, note: "One process; the I/O wait contributes to turnaround but does not consume this process's CPU time.", kind: "timeline", cells: [cell("Process", "P1", name === "terminated" ? "done" : "active"), cell("State", name), cell("Elapsed", time)] }); };
    state("ready"); state("running"); for (let i = 0; i < values[0]; i++) state("running", 1); state("blocked"); for (let i = 0; i < p; i++) state("blocked", 1); state("ready"); state("running"); for (let i = 0; i < values[1]; i++) state("running", 1); state("terminated");
    return result(frames, time, "Turnaround time (ticks)", "Turnaround includes both CPU bursts and the time blocked on I/O. A process changes from blocked to ready when its I/O completes.");
  }
  if (id === "cpu-scheduling") {
    bounded(values, 1, 12, 8); const remaining = [...values], completion = values.map(() => 0), queue = values.map((_, i) => i); let time = 0; const segments: SimulationCell[] = [];
    frames.push(valuesFrame("Ready queue at t=0", values, "Every process has arrived; input order breaks ties.", -1, "timeline"));
    while (queue.length) { const i = queue.shift()!, slice = Math.min(p, remaining[i]); remaining[i] -= slice; const start = time; time += slice; segments.push(cell(`t${start}–${time}`, `P${i + 1}`, "done")); if (remaining[i]) queue.push(i); else completion[i] = time; frames.push({ title: `P${i + 1} runs for ${slice} ticks`, note: `t=${time}; ready queue: ${queue.map(n => `P${n + 1}`).join(" → ") || "empty"}.`, kind: "timeline", cells: [...segments] }); }
    const waiting = completion.reduce((sum, c, i) => sum + c - values[i], 0); frames.push({ title: "All processes completed", note: "waiting = completion − arrival − CPU burst; every arrival is zero.", kind: "table", cells: completion.map((c, i) => cell(`P${i + 1}`, `finish ${c}; wait ${c - values[i]}`, "done")) });
    return result(frames, waiting, "Total waiting time (ticks)", "Round robin requeues a process when its quantum ends and work remains. Sum each process's completion time minus its burst to get total waiting time here.");
  }
  if (id === "synchronization") {
    requireValues(values.length === 2 && values[0] >= 1 && values[0] <= 5 && values[1] >= 2 && values[1] <= 6, "Enter increments 1–5, then workers 2–6."); let counter = 0;
    frames.push({ title: "Shared counter starts at 0", note: `Each of ${values[1]} workers will increment ${values[0]} times.`, kind: "memory", cells: [cell("Counter", 0)] });
    for (let roundIndex = 0; roundIndex < values[0]; roundIndex++) {
      if (p === 1) for (let worker = 0; worker < values[1]; worker++) { counter++; frames.push({ title: `Worker ${worker + 1} holds the mutex`, note: "The lock protects the complete read-modify-write operation.", kind: "memory", cells: [cell("Counter", counter, "done"), ...Array.from({ length: values[1] }, (_, i) => cell(`Worker ${i + 1}`, i === worker ? "locked: +1" : "waiting", i === worker ? "active" : "muted"))] }); }
      else { const read = counter; frames.push({ title: `Round ${roundIndex + 1}: all workers read ${read}`, note: "No worker has written yet. Each computes the same next value.", kind: "memory", cells: Array.from({ length: values[1] }, (_, i) => cell(`Worker ${i + 1}`, `read ${read}`, "warning")) }); counter = read + 1; frames.push({ title: `Every worker writes ${counter}`, note: `${values[1] - 1} intended increments are lost in this round.`, kind: "memory", cells: [cell("Counter", counter, "warning")] }); }
    }
    return result(frames, counter, "Final shared counter", p ? "Mutual exclusion serializes each entire read-modify-write, preserving every increment in this schedule." : "The unsynchronized schedule overwrites updates because all workers read the same old value. Other interleavings can produce other totals; this trace demonstrates one valid lost-update interleaving.");
  }
  if (id === "deadlocks") {
    const adjacency = graph(values, undefined, true), largest = Math.max(...adjacency.keys()); if (!adjacency.has(p)) adjacency.set(p, []); if (!adjacency.get(largest)!.includes(p)) adjacency.get(largest)!.push(p);
    const cyclic = new Set<number>(); frames.push(graphFrame(adjacency, "Wait-for graph", `New edge: ${largest} waits for ${p}. Arrows represent waiting, not ownership.`));
    for (const start of adjacency.keys()) { const search = (current: number, visited: Set<number>): boolean => { for (const next of adjacency.get(current)!) { if (next === start) return true; if (!visited.has(next)) { visited.add(next); if (search(next, visited)) return true; } } return false; }; if (search(start, new Set([start]))) cyclic.add(start); frames.push(graphFrame(adjacency, `Check process ${start}`, cyclic.has(start) ? `A directed path leads back to ${start}.` : `No path leads back to ${start}.`, cyclic, start)); }
    return result(frames, cyclic.size, "Processes on directed cycles", "Under the single-instance resource assumption, a wait-for cycle identifies deadlock. This count includes processes on cycles; upstream processes may also be blocked without belonging to a cycle.");
  }
  if (id === "resource-allocation") {
    bounded(values, 1, 20, 8); requireValues(p >= values.length, "Total resources must be at least the process count (each initially holds one)."); let available = p - values.length; const done = new Set<number>();
    const snap = (title: string, active = -1): SimulationFrame => ({ title, note: `Available units: ${available}. Finishing a process returns its original one-unit allocation.`, kind: "table", cells: values.map((claim, i) => cell(`P${i + 1}`, `max ${claim}; need ${claim - 1}; ${done.has(i) ? "finished" : "holds 1"}`, i === active ? "active" : done.has(i) ? "done" : undefined)) });
    frames.push(snap("Initial allocation")); let changed = true; while (changed) { changed = false; for (let i = 0; i < values.length; i++) if (!done.has(i) && values[i] - 1 <= available) { done.add(i); available++; changed = true; frames.push(snap(`P${i + 1} can finish`, i)); } }
    frames.push(snap(done.size === values.length ? "Safe sequence found" : "Safety test cannot finish every process"));
    return result(frames, done.size, "Processes completed by safety test", "A process can hypothetically finish when its remaining claim fits the available resource. The safety test releases its allocation and repeats. An unsafe state does not by itself prove a current deadlock.");
  }
  if (id === "paging") {
    bounded(values, 0, 99); const table = [4, 1, 6, 0, 3, 7, 2, 5]; let answer: string | number = "page fault";
    frames.push({ title: "Static page table", note: `Page size ${p}; virtual address = page×${p} + offset.`, kind: "table", cells: table.map((frame, page) => cell(`Page ${page}`, `Frame ${frame}`)) });
    values.forEach(address => { const page = Math.floor(address / p), offset = address % p; answer = page < table.length ? table[page] * p + offset : "page fault"; frames.push({ title: `Translate virtual address ${address}`, note: page < table.length ? `Physical address = ${table[page]}×${p}+${offset}=${answer}.` : "The virtual page has no page-table entry in this model.", kind: "memory", cells: [cell("Virtual page", page), cell("Offset", offset), cell("Physical frame", table[page] ?? "absent", table[page] === undefined ? "warning" : "active"), cell("Result", answer)] }); });
    return result(frames, answer, "Last physical address (or page fault)", "The page number indexes the page table. Translation changes the page/frame portion while preserving the offset. Missing mappings cause page faults.");
  }
  if (id === "page-replacement") {
    bounded(values, 0, 20); const memory: number[] = []; let faults = 0;
    frames.push(valuesFrame("Empty physical frames", [], "FIFO order runs from oldest on the left to newest on the right.", -1, "memory"));
    values.forEach(v => { const hit = memory.includes(v); if (!hit) { faults++; if (memory.length === p) memory.shift(); memory.push(v); } frames.push(valuesFrame(`Page ${v}: ${hit ? "hit" : "fault"}`, [...memory], `${faults} faults so far. A hit does not reorder FIFO.`, memory.indexOf(v), "memory")); });
    return result(frames, faults, "Page faults", "A miss loads the requested page and evicts the oldest loaded page if all frames are full. FIFO tracks insertion time rather than most recent access.");
  }
  if (id === "memory-allocation") {
    bounded(values, 1, 20, 8); const free = [...values]; let count = 0; frames.push(valuesFrame("Free block sizes", free, "Each request searches from the first block.", -1, "memory"));
    while (true) { const index = free.findIndex(v => v >= p); if (index < 0) break; free[index] -= p; count++; frames.push(valuesFrame(`Allocate request ${count} from block ${index}`, [...free], `Allocated ${p} units; remainder stays in the same free block.`, index, "memory")); }
    return result(frames, count, "Successful equal-size allocations", "First fit chooses the earliest block with enough free units. This experiment keeps splitting blocks until no single remainder can satisfy another request.");
  }
  if (id === "sql-execution") {
    const matches: { value: number; id: number }[] = [];
    frames.push(valuesFrame("samples table before query", values, `SELECT id,value FROM samples WHERE value >= ${p} ORDER BY value DESC, id ASC`, -1, "table"));
    values.forEach((v, i) => { if (v >= p) matches.push({ value: v, id: i + 1 }); frames.push(valuesFrame(`Scan row ${i + 1}: ${v >= p ? "keep" : "filter out"}`, values, `${matches.length} rows satisfy the predicate.`, i, "table")); }); matches.sort((a, b) => b.value - a.value || a.id - b.id);
    frames.push({ title: "ORDER BY result", note: "Rows are filtered before sorting. IDs retain original input positions (one-based).", kind: "table", cells: matches.map(row => cell(`id=${row.id}`, row.value, "done")) });
    return result(frames, matches.length, "Returned row count", "WHERE keeps only rows whose value meets the threshold. ORDER BY changes presentation order but does not change row count.");
  }
  if (id === "joins") {
    const right = [1, 2, 2, 4], output: SimulationCell[] = [];
    frames.push({ title: "Input relations", note: `${p ? "LEFT" : "INNER"} JOIN on key equality. Duplicate right keys create multiple matches.`, kind: "table", cells: [cell("Left keys", values.join(", ")), cell("Right keys", right.join(", "))] });
    values.forEach((v, i) => { let matches = 0; right.forEach((r, j) => { if (v === r) { matches++; output.push(cell(`L${i + 1} ⋈ R${j + 1}`, v, "done")); } }); if (!matches && p === 1) output.push(cell(`L${i + 1} ⋈ NULL`, v, "warning")); frames.push({ title: `Join left row ${i + 1}`, note: `${matches} matching right rows; output now has ${output.length} rows.`, kind: "table", cells: [...output] }); });
    return result(frames, output.length, "Joined output row count", "An equijoin emits every matching pair, so duplicate keys multiply rows. A left join additionally preserves each unmatched left row with null right-side values.");
  }
  if (id === "transactions") {
    requireValues(values.length >= 2 && values.length <= 8 && values[0] >= 0, "Use a nonnegative initial balance followed by 1–7 integer deltas."); const durable = values[0]; let staged = durable, aborted = false;
    const snap = (title: string, finalValue = durable): SimulationFrame => ({ title, note: "The durable balance remains unchanged until a successful commit.", kind: "memory", cells: [cell("Durable balance", finalValue, "done"), cell("Staged balance", staged, aborted ? "warning" : "active"), cell("Transaction", aborted ? "aborted" : "open")] });
    frames.push(snap("BEGIN transaction")); for (const delta of values.slice(1)) { if (aborted) break; staged += delta; if (staged < 0) aborted = true; frames.push(snap(`Apply delta ${delta}${aborted ? ": CHECK fails" : ""}`)); }
    const final = p === 1 && !aborted ? staged : durable; frames.push({ ...snap(p === 1 && !aborted ? "COMMIT" : "ROLLBACK", final), note: aborted ? "Constraint failure rolls back the entire transaction." : p ? "Commit atomically publishes all staged changes." : "Rollback discards every staged change." });
    return result(frames, final, "Final durable balance", "Atomicity makes all staged updates durable together or discards them together. A rejected constraint prevents a successful commit in this exercise.");
  }
  if (id === "locks") {
    bounded(values, 0, 1); const granted = [p], waiting: number[] = [], rows: SimulationCell[] = [cell("Holder T0", p ? "X granted" : "S granted", "active")];
    frames.push({ title: "One transaction holds the row lock", note: "S is shared; X is exclusive. Requests join a FIFO wait queue.", kind: "table", cells: [...rows] });
    values.forEach((mode, i) => { const compatible = waiting.length === 0 && mode === 0 && granted.every(m => m === 0); if (compatible) granted.push(mode); else waiting.push(mode); rows.push(cell(`T${i + 1}`, `${mode ? "X" : "S"} ${compatible ? "granted" : "waiting"}`, compatible ? "done" : "warning")); frames.push({ title: `T${i + 1} requests ${mode ? "exclusive" : "shared"}`, note: "A queued request prevents later requests from jumping ahead.", kind: "table", cells: [...rows] }); });
    return result(frames, waiting.length, "Waiting lock requests", "Shared locks can coexist. Exclusive access waits until other holders release; FIFO queueing here also prevents starvation through bypassing.");
  }
  if (id === "isolation") {
    requireValues(values.length === 2, "Enter initial value, then writer delta."); const [initial, delta] = values, staged = initial + delta, observed = p ? initial : staged;
    for (const [title, committed, uncommitted, read] of [["Initial committed row", initial, "none", "not yet"], ["T1 writes without committing", initial, staged, "not yet"], ["T2 reads the row", initial, staged, observed], ["T1 rolls back", initial, "discarded", observed]] as const) frames.push({ title, note: p ? "T2's read-committed statement uses the committed row version in this focused example." : "T2 can read T1's uncommitted change, even though T1 later rolls back.", kind: "table", cells: [cell("Committed", committed), cell("T1 staged", uncommitted, "warning"), cell("T2 observed", read, "active")] });
    return result(frames, observed, "Value observed by T2", p ? "Read committed prevents this dirty read. It does not promise repeatable reads or serializability across a whole transaction." : "Read uncommitted permits the dirty read: the reader observes a value that never becomes durable.");
  }
  if (id === "bplus-trees") {
    const sorted = [...new Set(values)].sort((a, b) => a - b), leaves: number[][] = []; for (let i = 0; i < sorted.length; i += 3) leaves.push(sorted.slice(i, i + 3));
    const separators = leaves.slice(1).map(leaf => leaf[0]); let touched = 0;
    const snap = (title: string, active = -1): SimulationFrame => ({ title, note: `Root separator keys: ${separators.join(" | ") || "none"}. Each separator is the first key of its right-hand leaf.`, kind: "nodes", cells: [ { ...cell("Root directory", separators.join(" | ") || "single leaf"), x: 50, y: 15 }, ...leaves.map((leaf, i) => ({ ...cell(`Leaf ${i}`, leaf.join(" | "), i === active ? "active" : undefined), x: 100 * (i + 0.5) / leaves.length, y: 75 })) ], links: [...leaves.map((_, i) => ({ from: 0, to: i + 1 })), ...leaves.slice(1).map((_, i) => ({ from: i + 1, to: i + 2, label: "next" }))] });
    frames.push(snap("Bulk-loaded B+ directory and linked leaves")); for (let i = 0; i < leaves.length; i++) if (leaves[i][0] <= p) { touched++; frames.push(snap(`Read qualifying leaf ${i}`, i)); }
    return result(frames, touched, "Leaves containing keys <= threshold", "B+ internal separators guide access while records stay in leaves. A sorted linked leaf layer supports range scans; this count includes leaves with qualifying keys, not all physical I/O needed by a real implementation.");
  }
  if (id === "query-planning") {
    const matches = values.filter(v => v >= p).length, scan = values.length, seek = Math.ceil(Math.log2(values.length + 1)), index = seek + matches;
    frames.push(valuesFrame("Table statistics for this exact mini-set", values, `Predicate value >= ${p}; ${matches}/${values.length} rows match.`, -1, "table")); frames.push({ title: "Estimate candidate costs", note: `Index seek comparisons=${seek}; matching row visits=${matches}. Units are abstract operations, not milliseconds.`, kind: "bars", cells: [cell("Full scan", scan, scan <= index ? "done" : undefined), cell("Index plan", index, index <= scan ? "done" : undefined)] });
    return result(frames, scan < index ? "scan" : index < scan ? "index" : "tie", "Cheaper plan (scan, index or tie)", "An index has a seek overhead plus work to fetch matches. If many rows qualify, a scan can be cheaper under this stated cost model. This is an educational estimate, not a production optimizer.");
  }
  if (id === "packet-movement") {
    bounded(values, 1, 20, 8); const finish = Array.from({ length: p }, () => values.map(() => 0)); const completed: SimulationCell[] = [];
    frames.push(valuesFrame("Link service durations", values, `${p} packets traverse every link. Each link serves only one packet at a time.`, -1, "timeline"));
    for (let packet = 0; packet < p; packet++) for (let link = 0; link < values.length; link++) { const arrival = link ? finish[packet][link - 1] : 0, free = packet ? finish[packet - 1][link] : 0, start = Math.max(arrival, free); finish[packet][link] = start + values[link]; completed.push(cell(`P${packet + 1} / link ${link + 1}`, `${start}–${finish[packet][link]} ms`, "done")); frames.push({ title: `Packet ${packet + 1} crosses link ${link + 1}`, note: `start=max(arrival ${arrival}, link free ${free})=${start}; finish=${finish[packet][link]}. Events are listed per packet; concurrent link work overlaps in time.`, kind: "timeline", cells: [...completed] }); }
    return result(frames, finish[p - 1][values.length - 1], "Last packet arrival (ms)", "Store-and-forward waits for the complete packet and for the next link to become available. Independent links overlap, so additional packets can pipeline through the path.");
  }
  if (id === "network-topology") {
    const adjacency = graph(values), initial = graphFrame(adjacency, "Network before failure", `Remove vertex ${p} and every incident edge.`); frames.push(initial); adjacency.delete(p); for (const [v, neighbors] of adjacency) adjacency.set(v, neighbors.filter(n => n !== p));
    const seen = new Set<number>(); let components = 0; frames.push(graphFrame(adjacency, "Failed vertex removed", "Connectivity is measured among remaining vertices only."));
    for (const start of adjacency.keys()) if (!seen.has(start)) { components++; const queue = [start]; seen.add(start); while (queue.length) { const v = queue.shift()!; for (const n of adjacency.get(v)!) if (!seen.has(n)) { seen.add(n); queue.push(n); } } frames.push(graphFrame(adjacency, `Connected component ${components}`, "A graph search marks every vertex reachable within this component.", seen, start)); }
    return result(frames, components, "Remaining connected components", "Removing a vertex also removes its links. Starting a fresh search at each unvisited remaining vertex counts independent connected components.");
  }
  if (id === "latency") {
    bounded(values, 1, 20, 8); let time = 0; const events: SimulationCell[] = []; frames.push(valuesFrame("One-way link delays", values, "A response returns along the same links.", -1, "timeline"));
    values.forEach((delay, i) => { time += delay; events.push(cell(`Request hop ${i + 1}`, `${time} ms`, "done")); frames.push({ title: `Request reaches hop ${i + 1}`, note: "Sum one-way delays along the route.", kind: "timeline", cells: [...events] }); }); time += p; events.push(cell("Server processed", `${time} ms`, "active")); frames.push({ title: "Server processing complete", note: `Processing adds ${p} ms once.`, kind: "timeline", cells: [...events] });
    [...values].reverse().forEach((delay, i) => { time += delay; events.push(cell(`Response hop ${i + 1}`, `${time} ms`, "done")); frames.push({ title: `Response returns hop ${i + 1}`, note: "Return travel adds the same link delays again.", kind: "timeline", cells: [...events] }); });
    return result(frames, time, "Request round-trip time (ms)", "Both outbound and inbound travel contribute. Add the server processing duration once: RTT = 2×sum(one-way link delays) + processing.");
  }
  if (id === "request-response") {
    requireValues(values.length === 3, "Enter DNS time, one-way delay and server processing time."); bounded(values, 1, 20); const [dns, travel, server] = values; let time = dns; const phases = [cell("DNS resolved", `${time} ms`, "done")];
    frames.push({ title: "Resolve server address once", note: "Established transport connection; TCP and TLS setup are outside this trace.", kind: "timeline", cells: [...phases] });
    for (let i = 1; i <= p; i++) for (const [phase, cost] of [["request travel", travel], ["server processing", server], ["response travel", travel]] as const) { time += cost; phases.push(cell(`R${i}: ${phase}`, `${time} ms`, "done")); frames.push({ title: `Request ${i}: ${phase}`, note: "The next request starts only after the preceding response arrives.", kind: "timeline", cells: [...phases] }); }
    return result(frames, time, "All responses received after (ms)", "This sequential model pays one DNS lookup plus request travel, processing and response travel for each request. Parallel requests would require a different schedule.");
  }
  if (id === "congestion") {
    bounded(values, 0, 12); let queue = 0, dropped = 0;
    frames.push({ title: "Empty four-packet buffer", note: `Link service rate: ${p} packets per slot. Arrivals are buffered before service.`, kind: "memory", cells: [cell("Queued", 0), cell("Dropped", 0)] });
    values.forEach((arrivals, i) => { const overflow = Math.max(0, queue + arrivals - 4); dropped += overflow; queue = Math.min(4, queue + arrivals); const sent = Math.min(queue, p); queue -= sent; frames.push({ title: `Time slot ${i + 1}`, note: `${arrivals} arrive, ${overflow} overflow, ${sent} transmitted.`, kind: "memory", cells: [cell("Queued after service", queue, "active"), cell("Dropped this slot", overflow, overflow ? "warning" : undefined), cell("Dropped total", dropped)] }); });
    return result(frames, dropped, "Total dropped packets", "Bursty arrivals can exceed the finite buffer even when average arrival rate is modest. The ordering of arrivals and service is part of the stated discrete-time model.");
  }
  if (id === "data-preparation") {
    const observed = values.filter(v => v !== -99); requireValues(observed.length > 0, "At least one observed training value is needed for mean imputation."); const mean = observed.reduce((sum, v) => sum + v, 0) / observed.length, filled = values.map(v => v === -99 ? mean : v), min = Math.min(...filled), max = Math.max(...filled), filledMean = filled.reduce((s, v) => s + v, 0) / filled.length, sd = Math.sqrt(filled.reduce((s, v) => s + (v - filledMean) ** 2, 0) / filled.length), scaled = filled.map(v => p ? sd ? (v - filledMean) / sd : 0 : max > min ? (v - min) / (max - min) : 0);
    frames.push(valuesFrame("Raw training data", values, "−99 is the missing-value marker; it is excluded from the imputation mean.")); frames.push(valuesFrame("Mean imputation", filled.map(v => round(v)), `Observed mean=${round(mean)}. Missing values receive that mean.`)); frames.push(valuesFrame(p ? "Population z-score scaling" : "Min–max scaling", scaled.map(v => round(v)), p ? `Subtract mean ${round(filledMean)}, divide by population SD ${round(sd)}. A constant set maps to 0.` : `Subtract minimum ${min}, divide by range ${round(max - min)}. A constant set maps to 0.`));
    return result(frames, round(scaled[scaled.length - 1]), "Last scaled value (3 decimals)", "Fit imputation and scaling parameters on training data only, then reuse those fitted parameters for future validation data. Fitting them on a held-out set would leak information.");
  }
  if (id === "train-validation-split") {
    requireValues(values.length >= 2 && new Set(values).size === values.length, "Enter at least two distinct example IDs."); const count = Math.max(1, Math.floor(values.length * p / 100)), split = values.length - count;
    frames.push(valuesFrame("Unsplit example IDs", values, "Order is preserved; there is no random shuffle.", -1, "memory")); frames.push({ title: "Freeze the holdout boundary", note: `Validation count=max(1,floor(${values.length}×${p}/100))=${count}. Never fit on these holdout rows.`, kind: "memory", cells: values.map((v, i) => cell(`Row ${i + 1}`, `${v} · ${i < split ? "train" : "validation"}`, i < split ? "done" : "active")) });
    return result(frames, count, "Held-out validation examples", "Keep the validation partition out of model fitting and preprocessing estimation. An ordered split is reproducible but may be inappropriate when the data's order creates bias.");
  }
  if (id === "classification" || id === "decision-boundaries") {
    let positives = 0; frames.push(valuesFrame("Unclassified feature values", values, `The boundary is x=${p}. Equal-to-threshold values belong to class 1.`));
    const rows: SimulationCell[] = []; values.forEach((v, i) => { const predicted = v >= p ? 1 : 0; positives += predicted; const probability = 1 / (1 + Math.exp(-(v - p))); rows.push(cell(`x=${v}`, id === "classification" ? `class ${predicted}` : `p=${round(probability)}, class ${predicted}`, predicted ? "active" : "muted")); frames.push({ title: `Classify example ${i + 1}`, note: `Predicted positives so far: ${positives}. ${id === "decision-boundaries" ? "Probability is a fixed logistic score, not a calibrated learned model." : "No training is performed by this fixed rule."}`, kind: "table", cells: [...rows] }); });
    return result(frames, positives, "Examples predicted class 1", "The decision rule compares each feature with the boundary. Predictions alone do not establish accuracy; that requires independent ground-truth labels.");
  }
  if (["model-complexity", "overfitting", "underfitting"].includes(id)) {
    requireValues(values.length >= 5 && values.length <= 8, "Use 5–8 training noise values."); bounded(values, -5, 5, 8); requireValues(p < values.length, "Degree must be smaller than the training example count.");
    const initial = polynomialErrors(values, 1); frames.push({ title: "Training and untouched validation points", note: "Training targets contain your noise. Validation targets are the true y=x² at five separate x positions.", kind: "scatter", cells: [cell("Training examples", values.length), cell("Validation examples", 5)], points: [...initial.xs.map((x, i) => ({ x, y: initial.ys[i], group: "training" as const })), ...initial.validation.map(x => ({ x, y: x * x, group: "validation" as const }))] });
    for (let degree = 1; degree <= p; degree++) { const fit = polynomialErrors(values, degree); frames.push({ title: `Fit degree ${degree}`, note: `${degree + 1} fitted coefficients. Training MSE=${round(fit.trainMse, 6)}; validation MSE=${round(fit.validationMse, 6)}.`, kind: "scatter", cells: [cell("Train MSE", round(fit.trainMse, 6)), cell("Validation MSE", round(fit.validationMse, 6), "active")], points: [...fit.xs.map((x, i) => ({ x, y: fit.ys[i], group: "training" as const })), ...fit.validation.map(x => ({ x, y: x * x, group: "validation" as const })), ...Array.from({ length: 51 }, (_, i) => { const x = -1 + i / 25; return { x, y: fit.predict(x), group: "curve" as const }; })] }); }
    const final = polynomialErrors(values, p); return result(frames, round(final.validationMse), "Validation MSE (3 decimals)", "Least squares minimizes training error for the chosen polynomial family. Extra degrees allow a closer training fit but can amplify noise between points. Validation error is evaluated against held-out quadratic targets; the observed effect depends on your noise values.");
  }
  if (id === "confusion-matrices" || id === "model-evaluation") {
    requireValues(values.length % 2 === 0, "Use complete actual,predicted label pairs."); bounded(values, 0, 1); const positive = id === "confusion-matrices" ? p : 1; let tp = 0, tn = 0, fp = 0, fn = 0;
    const snap = (title: string): SimulationFrame => ({ title, note: `Positive label=${positive}. TP and FN have actual-positive labels; FP and TN have actual-negative labels.`, kind: "table", cells: [cell("True positive", tp, "done"), cell("False negative", fn, "warning"), cell("False positive", fp, "warning"), cell("True negative", tn, "done")] });
    frames.push(snap("Empty confusion matrix")); for (let i = 0; i < values.length; i += 2) { const actual = values[i] === positive, predicted = values[i + 1] === positive; if (actual && predicted) tp++; else if (actual) fn++; else if (predicted) fp++; else tn++; frames.push(snap(`Example ${i / 2 + 1}: actual ${values[i]}, predicted ${values[i + 1]}`)); }
    const metrics = [(tp + tn) / (values.length / 2), tp + fp ? tp / (tp + fp) : 0, tp + fn ? tp / (tp + fn) : 0, 2 * tp + fp + fn ? 2 * tp / (2 * tp + fp + fn) : 0], names = ["Accuracy", "Precision", "Recall", "F1"], metricIndex = id === "confusion-matrices" ? 3 : p;
    frames.push({ title: "Compute evaluation metrics", note: "Undefined zero-denominator precision, recall and F1 are set to 0 by this exercise's stated convention.", kind: "table", cells: metrics.map((v, i) => cell(names[i], round(v), i === metricIndex ? "active" : undefined)) });
    return result(frames, round(metrics[metricIndex]), `${names[metricIndex]} score (3 decimals)`, "Accuracy counts all correct predictions. Precision asks what fraction of positive predictions are correct; recall asks what fraction of actual positives are found. F1 is their harmonic mean, computed directly as 2TP/(2TP+FP+FN).");
  }
  throw new Error("This simulation topic is not registered.");
}

export function runSimulation(id: string, raw: string, parameter: number): SimulationResult {
  const spec = simulationTopics.find(t => t.id === id); if (!spec) throw new Error("Unknown simulation topic.");
  requireValues(Number.isInteger(parameter) && parameter >= spec.min && parameter <= spec.max, `Choose an integer parameter between ${spec.min} and ${spec.max}.`);
  const input = parseInput(raw), actual = compute(id, input, parameter);
  // Prefer a changed parameter with a changed outcome, so a successful transfer
  // check usually requires fresh reasoning rather than repeating the revealed result.
  let checkParameter = parameter, transfer: Computation | undefined;
  for (let offset = 1; offset <= spec.max - spec.min; offset++) {
    const candidate = spec.min + ((parameter - spec.min + offset) % (spec.max - spec.min + 1));
    try {
      const evaluated = compute(id, input, candidate);
      if (!transfer) { checkParameter = candidate; transfer = evaluated; }
      if (evaluated.answer !== actual.answer) { checkParameter = candidate; transfer = evaluated; break; }
    } catch { /* A candidate may violate a topic-specific input/parameter constraint. */ }
  }
  requireValues(!!transfer, "Adjust the input to allow a second valid parameter for the transfer check.");
  return { topic: spec, input, parameter, ...actual, check: { input: input.join(", "), parameter: checkParameter, question: `Keep the same input, but change “${spec.parameterLabel}” to ${checkParameter}. Predict ${transfer!.metric.toLowerCase()}.`, expected: transfer!.answer } };
}

export function answersMatch(response: string, expected: string | number): boolean {
  if (typeof expected === "number") return response.trim() !== "" && Number.isFinite(Number(response)) && Math.abs(Number(response) - expected) <= 0.0005;
  const normalize = (s: string) => s.toLowerCase().trim().replace(/\s*[,;→]\s*/g, ",").replace(/\s+/g, " ");
  return normalize(response) === normalize(expected);
}
