const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("fs");
const { spawn } = require("child_process");
const os = require("os");
(async () => {
  const root = fs.mkdtempSync("/private/tmp/traggo-webqa-");
  const proc = spawn(
    process.env.TRAGGO_TEST_BINARY ||
      (() => {
        throw Error("Set TRAGGO_TEST_BINARY");
      })(),
    [],
    {
      cwd: root,
      env: {
        ...process.env,
        TRAGGO_PORT: "18303",
        TRAGGO_DATABASE_CONNECTION: root + "/traggo.db",
        TRAGGO_DEFAULT_USER_NAME: "admin",
        TRAGGO_DEFAULT_USER_PASS: "Traggo-Test-2026!",
      },
    },
  );
  let log = "";
  proc.stdout.on("data", (d) => (log += d));
  proc.stderr.on("data", (d) => (log += d));
  let browser;
  try {
    for (let i = 0; i < 100; i++) {
      try {
        let r = await fetch("http://127.0.0.1:18303/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: "{version{name}}" }),
        });
        if (r.ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    browser = await chromium.launch({
      headless: true,
      ...(process.env.CHROME_EXECUTABLE
        ? { executablePath: process.env.CHROME_EXECUTABLE }
        : {}),
    });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      locale: "de-DE",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:18303");
    await page.getByRole("button", { name: "Anmelden", exact: true }).waitFor();
    await page.screenshot({ path: root + "/login-de.png", fullPage: true });
    await page.getByLabel("Benutzername", { exact: false }).fill("admin");
    await page
      .getByLabel("Passwort", { exact: false })
      .fill("Traggo-Test-2026!");
    await page.getByRole("button", { name: "Anmelden", exact: true }).click();
    await page
      .getByRole("button", { name: "Timer starten", exact: true })
      .waitFor();
    await page.screenshot({ path: root + "/list-de.png", fullPage: true });
    await page
      .getByRole("button", { name: "Timer starten", exact: true })
      .click();
    await page.getByText("Laufende Timer", { exact: true }).waitFor();
    await page
      .getByRole("combobox", { name: "Oberflächensprache" })
      .selectOption("en");
    await page
      .getByRole("button", { name: "Start timer", exact: true })
      .waitFor();
    await page.waitForTimeout(300);
    const gql = async (query) =>
      page.evaluate(async (query) => {
        const r = await fetch("./graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        return r.json();
      }, query);
    let result = await gql("{userSettings{interfaceLanguage} timers{id}}");
    if (
      result.data.userSettings.interfaceLanguage !== "English" ||
      result.data.timers.length !== 1
    )
      throw Error(
        "Language persistence/timer failed " + JSON.stringify(result),
      );
    await gql(
      "mutation{stopTimeSpan(id:" +
        result.data.timers[0].id +
        ',end:"' +
        new Date().toISOString() +
        '"){id}}',
    );
    await page.reload();
    await page
      .getByRole("button", { name: "Start timer", exact: true })
      .waitFor();
    await page.screenshot({ path: root + "/list-en.png", fullPage: true });
    if (
      await page.evaluate(() => {
        const el = document.querySelector("#main-content");
        return (
          el.getBoundingClientRect().top +
            parseFloat(getComputedStyle(el).paddingTop) <
          document.querySelector("header").getBoundingClientRect().bottom + 16
        );
      })
    )
      throw Error("Header overlaps content");
    await page.getByRole("link", { name: "Settings", exact: true }).click();
    await page
      .getByRole("heading", { name: "Interface language", exact: true })
      .waitFor();
    await page.screenshot({ path: root + "/settings-en.png", fullPage: true });
    await page.locator("#setting-1").selectOption("MaterialLight");
    await page.waitForFunction(async () => {
      const r = await fetch("./graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "{userSettings{theme}}" }),
      });
      return (await r.json()).data.userSettings.theme === "MaterialLight";
    });
    await page
      .getByRole("combobox", { name: "Interface language" })
      .first()
      .selectOption("de");
    await page
      .getByRole("heading", { name: "Oberflächensprache", exact: true })
      .waitFor();
    await page.screenshot({
      path: root + "/settings-de-light.png",
      fullPage: true,
    });
    await page
      .getByRole("combobox", { name: "Oberflächensprache" })
      .first()
      .selectOption("en");
    await page
      .getByRole("heading", { name: "Interface language", exact: true })
      .waitFor();
    await page.evaluate(
      () => (document.documentElement.style.fontSize = "200%"),
    );
    await page.waitForTimeout(100);
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      )
    )
      throw Error("200% text overflow");
    await page.screenshot({
      path: root + "/settings-text-200.png",
      fullPage: true,
    });
    await page.evaluate(() => (document.documentElement.style.fontSize = ""));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: root + "/settings-mobile.png",
      fullPage: true,
    });
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      )
    )
      throw Error("Mobile horizontal overflow");
    await page
      .getByRole("button", { name: "Open drawer", exact: true })
      .click();
    await page.getByRole("link", { name: "Calendar", exact: true }).click();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: root + "/calendar-mobile.png",
      fullPage: true,
    });
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      )
    )
      throw Error("Calendar mobile overflow");
    if (errors.length) throw Error("Browser errors: " + errors.join(";"));
    console.log(
      JSON.stringify({
        passed: true,
        root,
        checks: [
          "German login",
          "timer creation",
          "language switch without data loss",
          "server preference persisted",
          "reload retains English",
          "settings desktop/mobile",
          "mobile navigation/calendar",
          "no uncaught browser errors",
        ],
      }),
    );
  } catch (e) {
    console.error(e);
    console.error(log.slice(-1500));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    proc.kill("SIGTERM");
  }
})();
