"use server";
import { prisma } from "@/lib/db/prisma";
import { checkServiceability, shiprocketConfigured } from "@/lib/integrations/shiprocket";

export async function checkPincodeAvailability(code: string): Promise<{
  available: boolean;
  message: string;
}> {
  const trimmed = code.trim();

  if (!/^\d{6}$/.test(trimmed)) {
    return { available: false, message: "Please enter a valid 6-digit pincode." };
  }

  // Attempt to use Shiprocket if configured
  if (shiprocketConfigured()) {
    const serviceability = await checkServiceability(trimmed);
    if (serviceability.available) {
      const location = [serviceability.city, serviceability.state].filter(Boolean).join(", ");
      let msg = location ? `Great! Delivery is available in ${location}.` : "Great! Delivery is available to this pincode.";
      
      if (serviceability.estimatedDeliveryDays) {
        const totalDays = serviceability.estimatedDeliveryDays + 1; // +1 day for internal packing
        msg += ` Estimated delivery in ${totalDays} days.`;
      }
      
      return {
        available: true,
        message: msg,
      };
    }
    return {
      available: false,
      message: "Delivery is not available to this pincode at the moment.",
    };
  }

  // Fallback to database if Shiprocket is not configured
  const pincode = await prisma.pincode.findUnique({ where: { code: trimmed } });

  if (!pincode || !pincode.isActive) {
    return {
      available: false,
      message: "Delivery is not available to this pincode yet.",
    };
  }

  const location = [pincode.city, pincode.state].filter(Boolean).join(", ");
  return {
    available: true,
    message: location ? `Great! Delivery is available in ${location}.` : "Great! Delivery is available to this pincode.",
  };
}

export async function isPincodeDeliverable(code: string): Promise<boolean> {
  const trimmed = code.trim();
  if (!/^\d{6}$/.test(trimmed)) return false;
  
  if (shiprocketConfigured()) {
    const serviceability = await checkServiceability(trimmed);
    return serviceability.available;
  }
  
  const pincode = await prisma.pincode.findUnique({ where: { code: trimmed } });
  return Boolean(pincode && pincode.isActive);
}
