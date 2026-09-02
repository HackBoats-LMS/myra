import { config } from "dotenv";
config(); // Load variables from .env

import { getToken } from "./src/lib/integrations/shiprocket";

async function testConnection() {
  console.log("Testing Shiprocket authentication...");
  try {
    const token = await getToken();
    console.log("✅ Success! Shiprocket connected successfully.");
    console.log("Token received:", token.substring(0, 15) + "...");
  } catch (error) {
    console.error("❌ Failed to connect to Shiprocket:");
    console.error(error);
  }
}

testConnection();
