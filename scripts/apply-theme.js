/**
 * Myra Theme Synchronization & Management Script
 * 
 * Usage:
 *   npm run theme:apply
 *   node scripts/apply-theme.js
 *   node scripts/apply-theme.js --primary "#4A0E17" --gold "#D4AF37"
 */

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const configPath = path.join(rootDir, "src", "config", "theme.ts");
const globalsCssPath = path.join(rootDir, "src", "app", "globals.css");

function parseConfig() {
  const content = fs.readFileSync(configPath, "utf8");
  const getVal = (key) => {
    const match = content.match(new RegExp(`${key}:\\s*["']([^"']+)["']`));
    return match ? match[1] : null;
  };

  return {
    primary: getVal("primary") || "#7A0B2E",
    primaryDark: getVal("primaryDark") || "#5C0820",
    primaryDeep: getVal("primaryDeep") || "#470618",
    primaryLight: getVal("primaryLight") || "#FAF0F2",
    primaryCapsule: getVal("primaryCapsule") || "#F0D5D5",
    gold: getVal("gold") || "#CE9222",
    goldWarm: getVal("goldWarm") || "#BF9351",
    dark: getVal("dark") || "#2D1F2F",
    surface: getVal("surface") || "#FAFAFA",
    background: getVal("background") || "#FFFFFF",
  };
}

function updateGlobalsCss(colors) {
  if (!fs.existsSync(globalsCssPath)) return;
  let css = fs.readFileSync(globalsCssPath, "utf8");

  const varMap = {
    "--background": colors.background,
    "--brand-primary": colors.primary,
    "--brand-primary-dark": colors.primaryDark,
    "--brand-primary-deep": colors.primaryDeep,
    "--brand-primary-light": colors.primaryLight,
    "--brand-primary-capsule": colors.primaryCapsule,
    "--brand-gold": colors.gold,
    "--brand-gold-warm": colors.goldWarm,
    "--brand-dark": colors.dark,
    "--brand-surface": colors.surface,
  };

  for (const [varName, val] of Object.entries(varMap)) {
    const regex = new RegExp(`(${varName}:\\s*)[^;]+;`);
    if (regex.test(css)) {
      css = css.replace(regex, `$1${val};`);
    }
  }

  fs.writeFileSync(globalsCssPath, css, "utf8");
  console.log("Updated globals.css design tokens");
}

function main() {
  console.log("Loading theme from src/config/theme.ts...");
  const colors = parseConfig();

  // Parse any CLI overrides
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, "");
    const val = args[i + 1];
    if (key && val && colors[key] !== undefined) {
      colors[key] = val;
    }
  }

  console.log("Active Palette:", colors);
  updateGlobalsCss(colors);
  console.log("Theme synchronization complete!");
}

main();
