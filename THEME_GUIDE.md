# How to Change the Website Theme & Logo (Guide)

This guide documents how to customize or completely change the **Myra Shopping Mall** website theme, colors, and logo at any time in the future.

---

## 1. Quick Start: Changing Colors in 2 Steps

### Step 1: Edit the Central Theme File
Open [`src/config/theme.ts`](file:///d:/myra/myra/src/config/theme.ts) and adjust the hex colors:

```typescript
export const theme: BrandTheme = {
  name: "Luxury Indian Maroon & Gold",
  colors: {
    // Main Brand Identity
    primary: "#7A0B2E",         // Primary brand color (buttons, borders, titles, accents)
    primaryDark: "#5C0820",     // Deep shade (footer background, active states)
    primaryDeep: "#470618",     // Darkest shade (button active/focus states)
    primaryLight: "#FAF0F2",    // Very light blush tint (search boxes, input backgrounds)
    primaryCapsule: "#F0D5D5",  // Pill capsule backgrounds

    // Accent Gold
    gold: "#CE9222",            // Royal Gold (prices, stars, badges)
    goldWarm: "#BF9351",        // Warm Gold (matches logo SVG)

    // Neutral Text & Surfaces
    dark: "#2D1F2F",            // Body text, headings, dark badges
    surface: "#FAFAFA",         // Card backgrounds, section background
    background: "#FFFFFF",      // Main canvas background
  },
};
```

### Step 2: Run the Sync Command
In your terminal, run:

```bash
npm run theme:apply
```

This updates all CSS design tokens in [`src/app/globals.css`](file:///d:/myra/myra/src/app/globals.css) and syncs the theme across the site.

---

## 2. Changing the Navbar Logo

The navbar uses a crisp vector SVG component located at:
[`src/components/shared/MyraLogo.tsx`](file:///d:/myra/myra/src/components/shared/MyraLogo.tsx)

### Option A: If you have a new SVG
1. Open [`src/components/shared/MyraLogo.tsx`](file:///d:/myra/myra/src/components/shared/MyraLogo.tsx).
2. Paste your new SVG paths inside the `<svg>` element.
3. Save the file. The navbar will immediately show the new logo.

### Option B: If you have an image file (PNG / WEBP)
1. Place your image in `public/displaypics/myralogo.png`.
2. In [`src/components/layout/Navbar.tsx`](file:///d:/myra/myra/src/components/layout/Navbar.tsx), import and render it with Next.js `Image`:
   ```tsx
   import Image from "next/image";
   import logoPic from "../../../public/displaypics/myralogo.png";

   // Inside the Navbar JSX:
   <Image
     src={logoPic}
     alt="Myra Logo"
     width={180}
     height={60}
     priority
     className="py-1 px-2 md:py-2 md:px-4 h-10 sm:h-12 md:h-14 lg:h-16 xl:h-[72px] 2xl:h-[76px] w-auto transition-all"
   />
   ```

---

## 3. Tailwind CSS Theme Classes

The project uses Tailwind v4 with design tokens mapped in [`src/app/globals.css`](file:///d:/myra/myra/src/app/globals.css):

| Tailwind Class | Token Variable | Default Value | Usage |
| :--- | :--- | :--- | :--- |
| `bg-brand-primary` / `text-brand-primary` | `--brand-primary` | `#7A0B2E` | Buttons, highlights, active navigation |
| `bg-brand-primary-dark` | `--brand-primary-dark` | `#5C0820` | Footer background, deep hover |
| `bg-brand-primary-light` | `--brand-primary-light` | `#FAF0F2` | Search bar fill, subtle card hover |
| `text-brand-gold` / `bg-brand-gold` | `--brand-gold` | `#CE9222` | Price tags, discount badges, stars |
| `text-brand-dark` | `--brand-dark` | `#2D1F2F` | Headings, body copy, drawer text |
| `bg-brand-surface` | `--brand-surface` | `#FAFAFA` | Alternating section backgrounds |

---

## 4. Key Files Reference

- **Theme Configuration**: [`src/config/theme.ts`](file:///d:/myra/myra/src/config/theme.ts)
- **Theme Sync Script**: [`scripts/apply-theme.js`](file:///d:/myra/myra/scripts/apply-theme.js)
- **Global CSS & Tokens**: [`src/app/globals.css`](file:///d:/myra/myra/src/app/globals.css)
- **Navbar Logo Component**: [`src/components/shared/MyraLogo.tsx`](file:///d:/myra/myra/src/components/shared/MyraLogo.tsx)
- **Navbar Layout**: [`src/components/layout/Navbar.tsx`](file:///d:/myra/myra/src/components/layout/Navbar.tsx)
- **Footer Layout**: [`src/components/layout/Footer.tsx`](file:///d:/myra/myra/src/components/layout/Footer.tsx)
- **Catalog Search & Filter Toolbar**: [`src/components/layout/CatalogToolbar.tsx`](file:///d:/myra/myra/src/components/layout/CatalogToolbar.tsx)
