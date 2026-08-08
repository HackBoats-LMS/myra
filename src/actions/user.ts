"use server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateUserProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  
  if (!session || !(session.user as any)?.id) {
    throw new Error("Unauthorized");
  }

  const userId = (session.user as any).id;
  
  const name = String(formData.get("name") || "").trim().substring(0, 100);
  const email = String(formData.get("email") || "").trim().substring(0, 100);
  const addressLine1 = String(formData.get("addressLine1") || "").trim().substring(0, 255);
  const city = String(formData.get("city") || "").trim().substring(0, 100);
  const state = String(formData.get("state") || "").trim().substring(0, 100);
  const postalCode = String(formData.get("postalCode") || "").trim().substring(0, 20);
  const country = String(formData.get("country") || "").trim().substring(0, 100);

  // Note: Skipping full Zod validation to avoid adding dependencies, 
  // but enforcing strict types and length limits manually.
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: name || null,
      email: email || null,
      addressLine1: addressLine1 || null,
      city: city || null,
      state: state || null,
      postalCode: postalCode || null,
      country: country || null
    }
  });

  revalidatePath("/account");
}
