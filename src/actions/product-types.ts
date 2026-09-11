"use server";

import { revalidatePath } from "next/cache";
import { verifyWorkerCapability } from "@/lib/auth/auth-utils";
import { getProductTypes, saveProductTypes } from "@/services/product-types-server";
import { DEFAULT_PRODUCT_TYPES, type ProductTypeTemplate } from "@/services/product-types";

function revalidateAllProductTypePaths() {
  revalidatePath("/admin/product-types");
  revalidatePath("/worker/product-types");
  revalidatePath("/admin/products/new");
  revalidatePath("/admin/products/[id]", "page");
  revalidatePath("/worker/products/new");
  revalidatePath("/worker/products/[id]", "page");
}

export async function saveProductTypeAction(template: ProductTypeTemplate): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyWorkerCapability("inventory");

    const trimmedName = template.name.trim();
    if (!trimmedName) {
      return { success: false, error: "Product type name is required." };
    }

    const currentTypes = await getProductTypes();
    const cleanFields = (template.fields || [])
      .map((f, idx) => ({
        id: f.id || `f-${Date.now()}-${idx}`,
        name: f.name.trim(),
        required: Boolean(f.required),
      }))
      .filter((f) => f.name.length > 0);

    const updatedTemplate: ProductTypeTemplate = {
      id: template.id || `pt-${Date.now()}`,
      name: trimmedName,
      fields: cleanFields,
    };

    const existingIndex = currentTypes.findIndex((t) => t.id === updatedTemplate.id);
    let nextList: ProductTypeTemplate[];

    if (existingIndex >= 0) {
      nextList = [...currentTypes];
      nextList[existingIndex] = updatedTemplate;
    } else {
      // Check if name already exists
      const duplicateName = currentTypes.some(
        (t) => t.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicateName) {
        return { success: false, error: `A product type named "${trimmedName}" already exists.` };
      }
      nextList = [...currentTypes, updatedTemplate];
    }

    await saveProductTypes(nextList);
    revalidateAllProductTypePaths();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to save product type." };
  }
}

export async function deleteProductTypeAction(typeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyWorkerCapability("inventory");

    const currentTypes = await getProductTypes();
    const nextList = currentTypes.filter((t) => t.id !== typeId);

    await saveProductTypes(nextList);
    revalidateAllProductTypePaths();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete product type." };
  }
}

export async function reorderProductTypesAction(newOrder: ProductTypeTemplate[]): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyWorkerCapability("inventory");

    await saveProductTypes(newOrder);
    revalidateAllProductTypePaths();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to reorder product types." };
  }
}

export async function resetToDefaultProductTypesAction(): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyWorkerCapability("inventory");

    await saveProductTypes(DEFAULT_PRODUCT_TYPES);
    revalidateAllProductTypePaths();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to reset product types." };
  }
}
