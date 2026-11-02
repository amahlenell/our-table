import { test, expect } from "@playwright/test";
import path from "node:path";
const recipe = "/recipes/20000000-0000-4000-8000-000000000001";
const screens = [
  ["overview", "/"],
  ["library", "/recipes"],
  ["recipe", recipe],
  ["new", "/recipes/new"],
  ["edit", `${recipe}/edit`],
  ["planner", "/meal-prep"],
  ["assistant", "/assistant"],
  ["settings", "/settings"],
  ["login", "/auth/login"],
  ["signup", "/auth/signup"],
  ["recovery", "/auth/recovery"],
  ["password", "/auth/update-password"],
  ["cooking", `${recipe}/cook`],
] as const;
test("Our Table identity and layout across every existing screen", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  for (const [name, url] of screens) {
    await page.goto(url);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page).toHaveTitle(/Our Table/);
    const style = await page.evaluate(() => ({
      body: getComputedStyle(document.body).fontFamily,
      heading: getComputedStyle(document.querySelector("h1")!).fontFamily,
      width: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    expect(style.body.toLowerCase()).toContain("nunito");
    expect(style.heading.toLowerCase()).toContain("fredoka");
    await page.evaluate(() => document.fonts.ready);
    const loadedFonts = await page.evaluate(() =>
      Array.from(document.fonts)
        .filter((f) => f.status === "loaded")
        .map((f) => f.family.toLowerCase())
        .join(" "),
    );
    expect(loadedFonts).toContain("nunito");
    expect(loadedFonts).toContain("fredoka");
    expect(
      style.width,
      `${name} must fit ${info.project.name}`,
    ).toBeLessThanOrEqual(style.viewport + 1);
    await page.screenshot({
      path: path.resolve(
        `../../work/our-table-qa/${info.project.name}-${name}.png`,
      ),
      fullPage: true,
      animations: "disabled",
      scale: "css",
    });
    if (name === "overview")
      await page.screenshot({
        path: path.resolve(`../our-table-${info.project.name}.png`),
        fullPage: true,
        animations: "disabled",
        scale: "css",
      });
  }
  if (info.project.name === "desktop") {
    await page.setViewportSize({ width: 820, height: 1100 });
    for (const [name, url] of screens.slice(0, 8)) {
      await page.goto(url);
      await expect(page.locator("h1").first()).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `Tablet ${name}`,
      ).toBe(true);
      await page.screenshot({
        path: path.resolve(`../../work/our-table-qa/tablet-${name}.png`),
        fullPage: true,
        animations: "disabled",
        scale: "css",
      });
    }
  }
});
test("earthy text, button and input contrast meet accessibility thresholds", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  const tokens = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return Object.fromEntries(
      [
        "espresso",
        "cocoa",
        "surface",
        "text-muted",
        "on-cocoa",
        "control-border",
      ].map((k) => [k, s.getPropertyValue(`--${k}`).trim()]),
    );
  });
  function luminance(hex: string) {
    const rgb = hex
      .replace("#", "")
      .match(/../g)!
      .map((v) => parseInt(v, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }
  function ratio(a: string, b: string) {
    const x = luminance(a),
      y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  expect(ratio(tokens.espresso, tokens.surface)).toBeGreaterThanOrEqual(7);
  expect(ratio(tokens.cocoa, tokens["on-cocoa"])).toBeGreaterThanOrEqual(4.5);
  expect(ratio(tokens["text-muted"], tokens.surface)).toBeGreaterThanOrEqual(
    4.5,
  );
  expect(
    ratio(tokens["control-border"], tokens.surface),
  ).toBeGreaterThanOrEqual(3);
});
