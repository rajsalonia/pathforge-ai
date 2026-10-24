#!/usr/bin/env node
/* Component integration QA; does not change account data or the active app route. */
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
const resolveTool = createRequire(import.meta.url);
const playwrightModule = await import(
  pathToFileURL(resolveTool.resolve("playwright")).href
);
const { chromium } = playwrightModule.default ?? playwrightModule;
const root = fileURLToPath(new URL("../", import.meta.url));
const base = "http://127.0.0.1:5183";
const output = path.join(root, "outputs", "ui-workspace-qa");
const key = "pathforge-ui-component-test-v1";
const screenshots = [];
const checks = [];
let server;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function pass(name) {
  checks.push(name);
  console.log("PASS " + name);
}
async function ensureServer() {
  try {
    const response = await fetch(base);
    assert.match(
      await response.text(),
      /PathForge component integration tests/,
    );
    return;
  } catch (error) {
    if (error.code === "ERR_ASSERTION") throw error;
  }
  fs.mkdirSync(output, { recursive: true });
  const log = fs.openSync(path.join(output, "vite.log"), "w");
  server = spawn(
    process.execPath,
    [
      path.join(root, "node_modules/vite/bin/vite.js"),
      "--config",
      "tests/ui-workspace/vite.config.ts",
    ],
    { cwd: root, stdio: ["ignore", log, log] },
  );
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null)
      throw new Error(
        "Component test server failed; inspect outputs/ui-workspace-qa/vite.log",
      );
    try {
      const response = await fetch(base);
      if (response.ok) return;
    } catch {}
    await pause(500);
  }
  throw new Error("Component test server was not ready in 30 seconds");
}
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const axePath =
    process.env.PATHFORGE_AXE_PATH ||
    resolveTool.resolve("axe-core/axe.min.js");
  const { missions } = await import(
    pathToFileURL(path.join(root, "lib/missions.ts")).href
  );
  const { simulationTopics, runSimulation } = await import(
    pathToFileURL(path.join(root, "lib/simulations.ts")).href
  );
  await ensureServer();
  const runner = await fetch(base + "/api/runner");
  assert.equal(
    runner.status,
    200,
    "Start npm run dev on port 5173 before running component integration tests",
  );
  assert.equal(
    await runner.text(),
    fs.readFileSync(path.join(root, "public/code-worker.js"), "utf8"),
    "use the actual application runner",
  );
  assert.match(
    runner.headers.get("content-security-policy"),
    /connect-src 'none'/,
  );
  const browser = await chromium.launch({
    executablePath: process.env.PATHFORGE_CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    for (const width of [375, 768, 1024, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      async function shot(name) {
        await page.locator(".pf-main").focus();
        await page.evaluate(() => {
          window.scrollTo(0, 0);
          return document.fonts.ready;
        });
        const filename = `${name}-${width}.png`;
        await page.screenshot({
          path: path.join(output, filename),
          fullPage: true,
        });
        screenshots.push(filename);
      }
      async function noOverflow() {
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
          `horizontal overflow at ${width}px`,
        );
      }
      async function audit(label) {
        await noOverflow();
        await page.addScriptTag({ path: axePath });
        const result = await page.evaluate(async () =>
          window.axe.run(document, {
            runOnly: {
              type: "tag",
              values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
            },
          }),
        );
        assert.deepEqual(
          result.violations.map((item) => ({
            id: item.id,
            nodes: item.nodes.map((node) => node.target),
          })),
          [],
          `${label} accessibility at ${width}px`,
        );
      }
      async function go(destination) {
        if (
          await page
            .getByRole("button", { name: "Open navigation", exact: true })
            .isVisible()
        )
          await page
            .getByRole("button", { name: "Open navigation", exact: true })
            .click();
        const hi =
          (await page.locator(".pf-shell").getAttribute("lang")) === "hi";
        const names = {
          home: ["Home", "होम"],
          roadmap: ["My Learning", "मेरी सीख"],
          missions: ["Practice", "अभ्यास"],
          projects: ["Projects", "प्रोजेक्ट"],
          dna: ["Progress", "प्रगति"],
          settings: ["Settings & data", "सेटिंग और डेटा"],
          together: ["Learn together", "साथ सीखें"],
          explore: ["Explore paths", "सीखने की राहें"],
        };
        const navigation = ["settings", "together", "explore"].includes(
          destination,
        )
          ? "More workspace destinations"
          : hi
            ? "मुख्य नेविगेशन"
            : "Primary navigation";
        await page
          .getByRole("navigation", { name: navigation, exact: true })
          .getByRole("button", {
            name: names[destination][hi ? 1 : 0],
            exact: true,
          })
          .click();
      }
      async function solve(code) {
        await page
          .getByRole("textbox", { name: "Mission answer", exact: true })
          .fill(code);
        await page
          .getByRole("button", { name: "Run tests", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Run tests", exact: true })
          .waitFor();
        await page
          .getByRole("button", { name: "Check my work", exact: true })
          .click();
      }
      await page.goto(base, { waitUntil: "networkidle" });
      await audit("new learner home");
      await shot("home");
      const tiny = await page.evaluate(() =>
        [...document.querySelectorAll(".pf-workspace *")]
          .filter(
            (element) =>
              element.getClientRects().length &&
              [...element.childNodes].some(
                (node) =>
                  node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
              ) &&
              parseFloat(getComputedStyle(element).fontSize) < 12,
          )
          .map((element) => element.outerHTML.slice(0, 120)),
      );
      assert.deepEqual(tiny, [], "visible text must be at least 12px");
      if (width < 850) {
        const toggle = page.getByRole("button", {
          name: "Open navigation",
          exact: true,
        });
        await toggle.click();
        await page.keyboard.press("Tab");
        assert.equal(
          await page.evaluate(() =>
            Boolean(document.activeElement.closest("dialog")),
          ),
          true,
        );
        await page.keyboard.press("Escape");
        assert.equal(await toggle.getAttribute("aria-expanded"), "false");
        await page.waitForFunction(
          () =>
            document.activeElement?.getAttribute("aria-label") ===
            "Open navigation",
        );
      }
      await page
        .getByLabel("Your learning goal", { exact: true })
        .fill("Learn JavaScript");
      await page
        .getByRole("button", { name: "Create my learning path", exact: true })
        .click();
      const dialog = page.getByRole("dialog", {
        name: "Make this path yours",
        exact: true,
      });
      await dialog.waitFor();
      await page.keyboard.press("Escape");
      await page.waitForFunction(() =>
        document.activeElement?.textContent.includes("Create my learning path"),
      );
      await page
        .getByRole("button", { name: "Create my learning path", exact: true })
        .click();
      await dialog.waitFor();
      for (let i = 0; i < 18; i++) {
        await page.keyboard.press("Tab");
        assert.equal(
          await page.evaluate(() =>
            Boolean(document.activeElement.closest("dialog")),
          ),
          true,
        );
      }
      await audit("goal dialog");
      assert.equal(
        await dialog
          .getByRole("button", { name: "Generate a personalized AI path" })
          .isDisabled(),
        true,
      );
      await dialog
        .getByRole("button", { name: "Create my learning path", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "JavaScript foundations", exact: true })
        .waitFor();
      await audit("roadmap");
      await shot("roadmap");
      if (width <= 700)
        assert.equal(
          await page
            .getByRole("list", { name: "Roadmap step list" })
            .isVisible(),
          true,
        );
      else {
        await page
          .getByRole("button", { name: "Zoom in", exact: true })
          .click();
        assert.match(
          await page.getByLabel("Map zoom", { exact: true }).textContent(),
          /110%/,
        );
        await page
          .getByRole("button", { name: "Fit roadmap to view", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Step list", exact: true })
          .click();
        assert.equal(
          await page
            .getByRole("list", { name: "Roadmap step list" })
            .isVisible(),
          true,
        );
        await page
          .getByRole("button", { name: "Map view", exact: true })
          .click();
      }
      await page
        .getByRole("button", { name: "Open mission", exact: true })
        .click();
      await page
        .getByRole("textbox", { name: "Mission answer", exact: true })
        .fill(
          'function formatMinutes(n) { return n + (n === 1 ? " minute" : " minutes"); }',
        );
      await page
        .getByRole("button", { name: "Run tests", exact: true })
        .click();
      await page
        .getByRole("heading", {
          name: "Tests passed · ready to record",
          exact: true,
        })
        .waitFor();
      assert.equal(
        await page.evaluate(
          (storageKey) =>
            JSON.parse(localStorage.getItem(storageKey)).attempts.length,
          key,
        ),
        0,
        "running tests alone must not fabricate a recorded attempt",
      );
      await page
        .getByRole("button", { name: "Check my work", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Task checks verified", exact: true })
        .waitFor();
      await audit("checked mission");
      await shot("mission");
      let state = await page.evaluate(
        (storageKey) => JSON.parse(localStorage.getItem(storageKey)),
        key,
      );
      assert.equal(state.attempts.length, 1);
      assert.equal(state.attempts[0].passed, true);
      assert.match(
        await page
          .getByRole("status", { name: "Learning check result" })
          .textContent(),
        /4 of 4 checks/,
      );
      await page
        .getByRole("button", { name: "Dismiss learning result" })
        .click();
      await go("home");
      await page
        .getByRole("button", { name: "Continue Learning", exact: true })
        .waitFor();
      await shot("returning");
      await page.reload({ waitUntil: "networkidle" });
      state = await page.evaluate(
        (storageKey) => JSON.parse(localStorage.getItem(storageKey)),
        key,
      );
      assert.equal(state.attempts.length, 1);
      await page
        .getByRole("button", { name: "Continue Learning", exact: true })
        .click();
      await solve("function totalPrice() { return -1; }");
      await page
        .getByRole("heading", {
          name: "Your next try starts here",
          exact: true,
        })
        .waitFor();
      await solve("function totalPrice() { return -1; }");
      await page
        .getByText("Try one smaller example", { exact: true })
        .waitFor();
      assert.equal(
        await page
          .getByRole("status", { name: "Learning check result" })
          .count(),
        0,
      );
      await page
        .getByRole("button", { name: "Back to My Learning", exact: true })
        .click();
      await page
        .getByRole("heading", {
          name: "A small JavaScript detour",
          exact: true,
        })
        .waitFor();
      await shot("recovery");
      await page
        .getByRole("button", { name: "Open mission", exact: true })
        .click();
      const revision = missions.find(
        (mission) => mission.id === "revision-scope",
      );
      await page
        .locator(".pf-mission-choices label")
        .filter({ hasText: revision.answer })
        .locator("input")
        .check();
      await page
        .getByRole("button", { name: "Check my work", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Knowledge check passed", exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "Dismiss learning result" })
        .click();
      await go("home");
      assert.match(
        await page.locator(".pf-next-mission h2").textContent(),
        /cart/i,
      );
      await go("missions");
      await page
        .getByRole("button", { name: "Simulation Lab", exact: true })
        .click();
      const topic = simulationTopics.find((item) => item.id === "sorting");
      const computed = runSimulation(topic.id, topic.input, topic.parameter);
      await page
        .getByPlaceholder("Your predicted outcome", { exact: true })
        .fill(String(computed.answer));
      await page
        .getByRole("button", { name: "Run simulation", exact: true })
        .click();
      await page.getByRole("button", { name: "Next", exact: true }).click();
      await page
        .getByPlaceholder("Your prediction for the changed input", {
          exact: true,
        })
        .fill(String(computed.check.expected));
      await page
        .getByLabel("Explain what changed", { exact: false })
        .fill("The changed parameter changes the actual bounded model trace.");
      await page
        .getByRole("button", { name: "Check my understanding", exact: true })
        .click();
      await page
        .getByText("Both prediction checks passed.", { exact: true })
        .waitFor();
      await audit("simulation");
      await shot("simulation");
      await page
        .getByRole("button", { name: "Dismiss learning result" })
        .click();
      await page
        .getByRole("button", { name: "Reset experiment", exact: true })
        .click();
      await page
        .getByLabel(topic.inputLabel, { exact: false })
        .fill("invalid numbers");
      await page
        .getByRole("alert")
        .filter({ hasText: "Check the experiment input" })
        .waitFor();
      await noOverflow();
      await go("projects");
      await audit("projects");
      await page
        .getByLabel("Expense label", { exact: true })
        .fill("A test notebook");
      await page.getByLabel("Amount", { exact: true }).fill("12.50");
      await page
        .getByRole("button", { name: "Add expense", exact: true })
        .click();
      await page.getByText("A test notebook", { exact: true }).waitFor();
      await page
        .getByRole("button", { name: "Delete A test notebook", exact: true })
        .click();
      await go("dna");
      await audit("progress");
      await shot("progress");
      await page
        .getByRole("button", { name: "Evidence portfolio", exact: true })
        .click();
      await page
        .getByRole("button", {
          name: "Inspect supporting evidence",
          exact: true,
        })
        .first()
        .click();
      await audit("evidence portfolio");
      await go("together");
      await audit("collaboration empty");
      await go("settings");
      await audit("settings");
      await page.getByLabel("Larger text", { exact: false }).check();
      await page.getByLabel("Reduced motion", { exact: false }).check();
      assert.equal(
        await page.locator(".pf-shell").getAttribute("data-reduced-motion"),
        "true",
      );
      await page
        .getByRole("button", { name: "EN — हिन्दी में बदलें", exact: true })
        .click();
      await go("home");
      await page
        .getByRole("heading", {
          name: "जहाँ रुके थे, वहीं से शुरू करें।",
          exact: true,
        })
        .waitFor();
      await shot("hindi");
      await audit("Hindi and larger text");
      assert.equal(
        await page.evaluate(() =>
          document.fonts.check('16px "PathForge Devanagari"', "मेरी सीख"),
        ),
        true,
      );
      await go("missions");
      await page.locator(".pf-mission-catalog > button").first().click();
      await page
        .getByRole("heading", { name: missions[0].titleHi, exact: true })
        .waitFor();
      await audit("Hindi mission");
      await shot("mission-hindi");
      await page.evaluate((storageKey) => {
        const saved = JSON.parse(localStorage.getItem(storageKey));
        saved.goal = "LongUnexpectedGoalWithoutSpaces".repeat(15);
        saved.roadmap.title = "LongUnexpectedRoadmapTitle".repeat(12);
        saved.roadmap.nodes[0].title = "LongUnexpectedMilestone".repeat(20);
        saved.attempts[0].createdAt = "unparseable imported date";
        localStorage.setItem(storageKey, JSON.stringify(saved));
      }, key);
      await page.reload({ waitUntil: "networkidle" });
      await noOverflow();
      await go("roadmap");
      await noOverflow();
      await go("dna");
      await page
        .getByRole("button", { name: "Evidence portfolio", exact: true })
        .click();
      await noOverflow();
      await page.goto(base + "/?scenario=states", { waitUntil: "networkidle" });
      await page
        .getByText("Loading your learning record", { exact: true })
        .waitFor();
      assert.equal(
        await page
          .getByRole("button", { name: "Preparing your path", exact: true })
          .isDisabled(),
        true,
      );
      await page.getByRole("alert").waitFor();
      await audit("loading and error states");
      assert.deepEqual(errors, [], "no browser runtime errors");
      pass(
        `${width}px: real checks, persistence, recovery, simulation, navigation, Hindi, keyboard, contrast, empty/error/long-content states`,
      );
      await context.close();
    }
  } finally {
    await browser.close();
    if (server) server.kill("SIGTERM");
  }
  fs.writeFileSync(
    path.join(output, "results.json"),
    JSON.stringify(
      {
        checks,
        screenshots,
        liveAI: "Unrun: provider is not configured",
        productionIntegration: "Pending shared-file ownership",
        axeVersion: "4.14.0",
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS ${checks.length} viewport journeys; screenshots and results in ${output}`,
  );
})().catch((error) => {
  console.error(error);
  if (server) server.kill("SIGTERM");
  process.exitCode = 1;
});
