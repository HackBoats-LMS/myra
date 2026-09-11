import { prisma } from "@/lib/db/prisma";
import { type ProductTypeTemplate, DEFAULT_PRODUCT_TYPES } from "@/services/product-types";

const SETTING_KEY = "product_type_templates";

export async function getProductTypes(): Promise<ProductTypeTemplate[]> {
  try {
    const setting = await prisma.storeSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    if (!setting?.value) {
      return DEFAULT_PRODUCT_TYPES;
    }

    const parsed = JSON.parse(setting.value);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as ProductTypeTemplate[];
    }
    return DEFAULT_PRODUCT_TYPES;
  } catch (error) {
    console.warn("Failed to fetch product types from storeSetting, returning defaults:", error);
    return DEFAULT_PRODUCT_TYPES;
  }
}

export async function saveProductTypes(types: ProductTypeTemplate[]): Promise<void> {
  const json = JSON.stringify(types);
  await prisma.storeSetting.upsert({
    where: { key: SETTING_KEY },
    update: { value: json },
    create: { key: SETTING_KEY, value: json },
  });
}
