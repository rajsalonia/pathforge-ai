/*
 * One exercise per dedicated worker. The host MUST terminate this worker after
 * its time budget (recommended 2s), including when the worker stops responding.
 * Serve this script with the response header:
 * Content-Security-Policy: default-src 'none'; script-src 'unsafe-eval'; connect-src 'none'; worker-src 'none'
 * The response CSP is required to block dynamic import and all network access.
 * Revoking globals below is defense in depth, not a standalone secure JS sandbox.
 * Results are self-learning browser evidence, not a tamper-proof credential.
 */
(() => {
  'use strict';
  const send = self.postMessage.bind(self);
  const Compile = Function;
  const clone = structuredClone;
  const stringify = JSON.stringify;
  const parse = JSON.parse;
  let used = false;

  function fingerprint(source) {
    let hash = 2166136261;
    for (let i = 0; i < source.length; i++) hash = Math.imul(hash ^ source.charCodeAt(i), 16777619);
    return (hash >>> 0).toString(16).padStart(8, '0');
  }
  function same(a, b) {
    if (Object.is(a, b)) return true;
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
    const keys = Object.keys(a).sort(), other = Object.keys(b).sort();
    return keys.length === other.length && keys.every((key, i) => key === other[i] && same(a[key], b[key]));
  }
  function message(error) { return String(error?.message || error || 'Execution failed').slice(0, 600); }

  self.onmessage = async event => {
    if (used) return;
    used = true;
    const request = event.data || {};
    const id = typeof request.id === 'string' || typeof request.id === 'number' ? request.id : null;
    const code = request.code;
    const sourceHash = typeof code === 'string' ? fingerprint(code) : '';
    const results = [];
    try {
      if (typeof code !== 'string' || !code.trim() || code.length > 16000) throw new Error('Use 1–16,000 characters of JavaScript.');
      if (!/^[a-zA-Z_$][a-zA-Z0-9_$]{0,63}$/.test(request.functionName || '')) throw new Error('Invalid function name.');
      if (!Array.isArray(request.cases) || !request.cases.length || request.cases.length > 30 || request.cases.some(c => !c || !Array.isArray(c.args) || c.args.length > 10)) throw new Error('Invalid fixed test cases.');
      if (/\bimport\s*(?:\(|["'{*])/.test(code)) throw new Error('Imports are not supported in function exercises.');
      // Capture the trusted transport before removing user-code access to I/O.
      for (const name of ['fetch', 'WebSocket', 'WebSocketStream', 'XMLHttpRequest', 'EventSource', 'WebTransport', 'importScripts', 'Worker', 'SharedWorker', 'BroadcastChannel', 'MessageChannel', 'postMessage', 'indexedDB', 'caches', 'navigator', 'eval', 'Function', 'setTimeout', 'setInterval']) {
        try { Object.defineProperty(globalThis, name, { value: undefined, writable: false, configurable: false }); } catch { /* CSP remains the network boundary. */ }
      }
      // Prevent recovery of dynamic-code constructors via function prototypes.
      for (const fn of [function () {}, async function () {}, function* () {}, async function* () {}]) {
        try { Object.defineProperty(Object.getPrototypeOf(fn), 'constructor', { value: undefined, writable: false, configurable: false }); } catch { /* Already revoked. */ }
      }
      try { globalThis.console = Object.freeze({ log() {}, warn() {}, error() {}, info() {}, debug() {} }); } catch { /* Harmless diagnostics. */ }
      const exercise = Compile(`"use strict";\n${code}\n; if (typeof ${request.functionName} !== "function") throw new Error("Define ${request.functionName} as a function."); return ${request.functionName};`)();
      for (let i = 0; i < request.cases.length; i++) {
        const test = request.cases[i];
        try {
          const args = clone(test.args);
          const raw = await exercise(...args);
          const json = stringify(raw, (_key, value) => {
            if (['undefined', 'function', 'symbol', 'bigint'].includes(typeof value) || (typeof value === 'number' && !Number.isFinite(value))) throw new Error('Return JSON-compatible values; undefined, functions, and non-finite numbers are not supported.');
            return value;
          });
          if (typeof json !== 'string' || json.length > 32000) throw new Error('Return a JSON-compatible result of at most 32,000 characters.');
          const actual = parse(json);
          const passed = same(actual, test.expected) && same(args, test.args);
          results.push({ name: `Case ${i + 1}`, args: test.args, expected: test.expected, actual, passed, ...(!same(args, test.args) ? { error: 'The function changed its input arguments.' } : {}) });
        } catch (error) {
          results.push({ name: `Case ${i + 1}`, args: test.args, expected: test.expected, passed: false, error: message(error) });
        }
      }
      send({ id, sourceHash, passed: results.every(r => r.passed), cases: results });
    } catch (error) {
      send({ id, sourceHash, passed: false, cases: results, error: message(error) });
    }
  };
})();
