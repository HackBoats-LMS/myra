export interface ProductTypeField {
  id: string;
  name: string;
  required: boolean;
}

export interface ProductTypeTemplate {
  id: string;
  name: string;
  fields: ProductTypeField[];
}

export const DEFAULT_PRODUCT_TYPES: ProductTypeTemplate[] = [
  {
    id: "saree",
    name: "Saree",
    fields: [
      { id: "f-saree-1", name: "Material / Fabric", required: true },
      { id: "f-saree-2", name: "Blouse Piece", required: true },
      { id: "f-saree-3", name: "Zari / Border Work", required: false },
      { id: "f-saree-4", name: "Pattern / Weave", required: false },
      { id: "f-saree-5", name: "Wash Care", required: false },
      { id: "f-saree-6", name: "Occasion", required: false },
    ],
  },
  {
    id: "lehenga",
    name: "Lehenga",
    fields: [
      { id: "f-leh-1", name: "Material / Fabric", required: true },
      { id: "f-leh-2", name: "Blouse / Choli Fabric", required: true },
      { id: "f-leh-3", name: "Dupatta Fabric", required: true },
      { id: "f-leh-4", name: "Work / Embellishment", required: false },
      { id: "f-leh-5", name: "Flair / Cut", required: false },
      { id: "f-leh-6", name: "Wash Care", required: false },
    ],
  },
  {
    id: "suit",
    name: "Suit",
    fields: [
      { id: "f-suit-1", name: "Material / Fabric", required: true },
      { id: "f-suit-2", name: "Bottom Wear", required: true },
      { id: "f-suit-3", name: "Dupatta", required: false },
      { id: "f-suit-4", name: "Work / Pattern", required: false },
      { id: "f-suit-5", name: "Wash Care", required: false },
    ],
  },
  {
    id: "anarkali-suit",
    name: "Anarkali Suit",
    fields: [
      { id: "f-anarkali-1", name: "Material / Fabric", required: true },
      { id: "f-anarkali-2", name: "Bottom Wear", required: true },
      { id: "f-anarkali-3", name: "Dupatta", required: false },
      { id: "f-anarkali-4", name: "Length / Flair", required: false },
      { id: "f-anarkali-5", name: "Wash Care", required: false },
    ],
  },
  {
    id: "kurti-ethnic",
    name: "Kurti / Ethnic",
    fields: [
      { id: "f-kurti-1", name: "Material / Fabric", required: true },
      { id: "f-kurti-2", name: "Pattern / Print", required: false },
      { id: "f-kurti-3", name: "Sleeve Type", required: false },
      { id: "f-kurti-4", name: "Neck Style", required: false },
      { id: "f-kurti-5", name: "Wash Care", required: false },
    ],
  },
  {
    id: "dress",
    name: "Dress",
    fields: [
      { id: "f-dress-1", name: "Material / Fabric", required: true },
      { id: "f-dress-2", name: "Pattern / Silhouette", required: false },
      { id: "f-dress-3", name: "Length", required: false },
      { id: "f-dress-4", name: "Wash Care", required: false },
    ],
  },
  {
    id: "gown",
    name: "Gown",
    fields: [
      { id: "f-gown-1", name: "Material / Fabric", required: true },
      { id: "f-gown-2", name: "Work / Embellishment", required: false },
      { id: "f-gown-3", name: "Sleeve Length", required: false },
      { id: "f-gown-4", name: "Wash Care", required: false },
    ],
  },
  {
    id: "top-western",
    name: "Top / Western",
    fields: [
      { id: "f-top-1", name: "Material / Fabric", required: true },
      { id: "f-top-2", name: "Fit / Style", required: false },
      { id: "f-top-3", name: "Wash Care", required: false },
    ],
  },
  {
    id: "bottom-wear",
    name: "Bottom Wear",
    fields: [
      { id: "f-bottom-1", name: "Material / Fabric", required: true },
      { id: "f-bottom-2", name: "Style / Fit", required: false },
      { id: "f-bottom-3", name: "Closure", required: false },
      { id: "f-bottom-4", name: "Wash Care", required: false },
    ],
  },
  {
    id: "kids-wear",
    name: "Kids Wear",
    fields: [
      { id: "f-kids-1", name: "Material / Fabric", required: true },
      { id: "f-kids-2", name: "Age Group / Size Info", required: false },
      { id: "f-kids-3", name: "Wash Care", required: false },
    ],
  },
];
