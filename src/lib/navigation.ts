export interface NavChild {
  label: string;
  href: string;
}

export interface NavLink {
  label: string;
  href: string;
  children: NavChild[];
}

export const NAV_LINKS: NavLink[] = [
  {
    label: "Sarees",
    href: "/collections/sarees",
    children: [
      { label: "Silk Sarees", href: "/collections/silk-sarees" },
      { label: "Cotton Sarees", href: "/collections/cotton-sarees" },
      { label: "Bridal Sarees", href: "/collections/bridal-sarees" },
      { label: "Designer Sarees", href: "/collections/designer-sarees" },
    ],
  },
  {
    label: "Women",
    href: "/collections/women",
    children: [
      { label: "Sarees", href: "/collections/sarees" },
      { label: "Kurtis", href: "/collections/kurtis" },
      { label: "Dresses", href: "/collections/dresses" },
      { label: "Tops", href: "/collections/tops" },
      { label: "Ethnic Wear", href: "/collections/ethnic-wear" },
    ],
  },
  {
    label: "Kids",
    href: "/collections/kids",
    children: [
      { label: "Boys", href: "/collections/boys" },
      { label: "Girls", href: "/collections/girls" },
      { label: "Newborn", href: "/collections/newborn" },
      { label: "Party Wear", href: "/collections/kids-party-wear" },
    ],
  },
  {
    label: "Best Sellers",
    href: "/collections?sort=best-sellers",
    children: [
      { label: "All Best Sellers", href: "/collections?sort=best-sellers" },
      { label: "New Arrivals", href: "/collections?sort=new-arrivals" },
      { label: "Top Rated", href: "/collections?sort=top-rated" },
      { label: "Trending", href: "/collections?sort=trending" },
    ],
  },
];
