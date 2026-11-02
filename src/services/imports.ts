import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";
import { Agent, request } from "undici";
import * as cheerio from "cheerio";
import type { Recipe } from "@/types";
export function publicAddress(address: string) {
  try {
    const parsed = ipaddr.process(address);
    return parsed.range() === "unicast";
  } catch {
    return false;
  }
}
export function safeUrl(input: string) {
  const u = new URL(input);
  if (
    !["http:", "https:"].includes(u.protocol) ||
    u.username ||
    u.password ||
    (u.port && !["80", "443"].includes(u.port))
  )
    throw new Error("Use a public HTTP or HTTPS recipe URL.");
  const host = u.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".") ||
    (ipaddr.isValid(host) && !publicAddress(host))
  )
    throw new Error("Private network addresses are not supported.");
  u.hash = "";
  return u;
}
// DNS is resolved and validated inside the connection lookup, pinning the actual
// socket address and preventing a second, unvalidated resolution (DNS rebinding).
async function getPublic(
  input: string,
  limit: number,
  signal: AbortSignal,
  enforceRobots = false,
  robotsFile = false,
) {
  let url = safeUrl(input);
  for (let redirects = 0; redirects <= 3; redirects++) {
    if (enforceRobots) {
      const robots = await getPublic(
        new URL("/robots.txt", url).href,
        100000,
        signal,
        false,
        true,
      );
      if (!robotsAllowed(robots.html, url.pathname + url.search))
        throw new Error(
          "This website restricts automated access. Enter the recipe manually.",
        );
    }
    const dispatcher = new Agent({
      connect: {
        autoSelectFamily: false,
        lookup: (hostname, options, callback) => {
          lookup(hostname, { all: true })
            .then((records) => {
              if (
                !records.length ||
                records.some((r) => !publicAddress(r.address))
              )
                return callback(
                  new Error("Private network destination blocked."),
                  "",
                  4,
                );
              const record =
                records.find(
                  (r) => !options.family || r.family === options.family,
                ) || records[0];
              callback(null, record.address, record.family);
            })
            .catch((error) => callback(error, "", 4));
        },
      },
    });
    try {
      const response = await request(url, {
        dispatcher,
        headers: {
          "user-agent": "PrepBookRecipeImporter/1.0",
          accept: "text/html,text/plain",
        },
        signal,
        headersTimeout: 10000,
        bodyTimeout: 10000,
      });
      if (response.statusCode >= 300 && response.statusCode < 400) {
        const location = response.headers.location;
        if (!location || Array.isArray(location))
          throw new Error("Unsupported redirect.");
        response.body.destroy();
        url = safeUrl(new URL(location, url).href);
        continue;
      }
      if (robotsFile && [404, 410].includes(response.statusCode)) {
        response.body.destroy();
        return { html: "", url };
      }
      if (response.statusCode !== 200) {
        response.body.destroy();
        throw new Error(
          "This website does not permit importing. Enter the recipe manually.",
        );
      }
      if (
        !String(response.headers["content-type"]).match(/text\/(html|plain)/i)
      ) {
        response.body.destroy();
        throw new Error("This URL is not a web page.");
      }
      const parts: Buffer[] = [];
      let length = 0;
      for await (const part of response.body) {
        length += part.length;
        if (length > limit)
          throw new Error("This page is too large to import.");
        parts.push(Buffer.from(part));
      }
      return { html: Buffer.concat(parts).toString("utf8"), url };
    } finally {
      await dispatcher.destroy();
    }
  }
  throw new Error("Too many redirects.");
}
type JsonObject = Record<string, unknown>;
function findRecipe(value: unknown, depth = 0): JsonObject | null {
  if (depth > 30) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findRecipe(item, depth + 1);
      if (found) return found;
    }
  } else if (value && typeof value === "object") {
    const obj = value as JsonObject;
    const types = Array.isArray(obj["@type"]) ? obj["@type"] : [obj["@type"]];
    if (types.some((t) => typeof t === "string" && /(^|\/)Recipe$/.test(t)))
      return obj;
    for (const child of Object.values(obj)) {
      const found = findRecipe(child, depth + 1);
      if (found) return found;
    }
  }
  return null;
}
function clean(value: unknown) {
  return cheerio
    .load(`<div>${typeof value === "string" ? value : ""}</div>`)("div")
    .text()
    .trim();
}
function steps(value: unknown, depth = 0): string[] {
  if (depth > 30) return [];
  if (typeof value === "string")
    return value.split(/\n+/).map(clean).filter(Boolean);
  if (Array.isArray(value)) return value.flatMap((v) => steps(v, depth + 1));
  if (value && typeof value === "object") {
    const obj = value as JsonObject;
    return obj.itemListElement
      ? steps(obj.itemListElement, depth + 1)
      : steps(obj.text, depth + 1);
  }
  return [];
}
function duration(value: unknown) {
  if (typeof value !== "string") return 0;
  const m = value.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/);
  return m
    ? Number(m[1] || 0) * 1440 + Number(m[2] || 0) * 60 + Number(m[3] || 0)
    : 0;
}
export function parseRecipe(html: string, sourceUrl: string): Partial<Recipe> {
  const $ = cheerio.load(html);
  let recipe: JsonObject | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (recipe) return;
    try {
      recipe = findRecipe(JSON.parse($(el).html() || ""));
    } catch {
      /* Ignore unrelated malformed JSON blocks. */
    }
  });
  if (!recipe)
    throw new Error(
      "No supported Recipe structured data found. Enter this recipe manually.",
    );
  const r = recipe as JsonObject;
  const ingredients = Array.isArray(r.recipeIngredient)
    ? r.recipeIngredient
        .filter((v): v is string => typeof v === "string")
        .map(clean)
        .filter(Boolean)
    : [];
  const instructions = steps(r.recipeInstructions);
  if (!clean(r.name) || !ingredients.length || !instructions.length)
    throw new Error(
      "The page is missing a title, ingredients or instructions. Nothing has been saved.",
    );
  const author = r.author;
  return {
    title: clean(r.name),
    description: clean(r.description),
    ingredients: ingredients.map((name) => ({
      id: crypto.randomUUID(),
      name: clean(name),
      quantity: 1,
      unit: "piece" as const,
      gramEquivalent: null,
      food: null,
    })),
    instructions,
    prepMinutes: duration(r.prepTime),
    cookMinutes: duration(r.cookTime),
    servings: Math.max(
      1,
      Number(String(r.recipeYield || "1").match(/\d+(?:\.\d+)?/)?.[0] || 1),
    ),
    sourceUrl,
    author:
      typeof author === "string"
        ? clean(author)
        : author && typeof author === "object"
          ? clean((author as JsonObject).name)
          : "",
    status: "draft",
  };
}
// Conservatively respect applicable Disallow rules, including after redirects.
export function robotsAllowed(text: string, path: string) {
  let applies = false,
    hasRules = false;
  for (const line of text.split(/\r?\n/)) {
    const [raw, ...rest] = line.replace(/#.*/, "").split(":");
    const key = raw.trim().toLowerCase(),
      value = rest.join(":").trim();
    if (key === "user-agent") {
      if (hasRules) {
        applies = false;
        hasRules = false;
      }
      applies = applies || value === "*" || /prepbook/i.test(value);
    } else if (key === "disallow" || key === "allow") {
      hasRules = true;
      if (applies && key === "disallow" && value) {
        // Literal prefix matching also conservatively blocks wildcard rules,
        // without compiling attacker-controlled regular expressions.
        const end = value.endsWith("$");
        const literal = (end ? value.slice(0, -1) : value).split("*")[0];
        if (
          value.includes("*")
            ? path.startsWith(literal)
            : end
              ? path === literal
              : path.startsWith(literal)
        )
          return false;
      }
    }
  }
  return true;
}
export async function importRecipe(input: string) {
  const source = safeUrl(input);
  const page = await getPublic(
    source.href,
    2000000,
    AbortSignal.timeout(25000),
    true,
  );
  return parseRecipe(page.html, page.url.href);
}
