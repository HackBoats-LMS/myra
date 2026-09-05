/**
 * Myra Centralized Brand Theme Configuration
 * 
 * To change or customize the website theme in the future:
 * 1. Modify the colors below
 * 2. Run: npm run theme:apply
 * 
 * This will automatically synchronize the CSS tokens and all components.
 */

export interface ThemeColors {
  /** Primary luxury brand color (headers, buttons, highlights, active accents) */
  primary: string;
  /** Deep tone for footer background, active states, dark accents */
  primaryDark: string;
  /** Deepest tone for button hover/active states */
  primaryDeep: string;
  /** Soft blush tint for card backgrounds, hovers, subtle fills */
  primaryLight: string;
  /** Rose tint for category pill capsules */
  primaryCapsule: string;

  /** Royal gold accent for prices, stars, badges */
  gold: string;
  /** Warm gold accent from logo emblem */
  goldWarm: string;

  /** Body text, primary headings, dark tags */
  dark: string;
  /** Page surface / section alternating background */
  surface: string;
  /** Clean page canvas background */
  background: string;
}

export interface BrandTheme {
  name: string;
  colors: ThemeColors;
}

export const theme: BrandTheme = {
  name: "Warm Raw Silk Ivory & Maroon",
  colors: {
    primary: "#7A0B2E",
    primaryDark: "#5C0820",
    primaryDeep: "#470618",
    primaryLight: "#F7EFF0",
    primaryCapsule: "#EBDCD9",
    gold: "#CE9222",
    goldWarm: "#BF9351",
    dark: "#2D1F2F",
    surface: "#F5EFE6",
    background: "#F5EFE6",
  },
};

export default theme;
