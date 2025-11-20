import { v2 as cloudinary } from "cloudinary";
import { unlinkSync, existsSync } from "fs";
import dotenv from "dotenv";
dotenv.config(); // safe-guard: ensure env loaded

// Normalize possible env var names and trim values
const getEnv = (k) => {
  const val = process.env[k] ?? process.env[k?.toUpperCase()];
  return typeof val === "string" ? val.trim() : val;
};

const ensureConfig = () => {
  const cloudName = getEnv("CLOUDINARY_NAME") || getEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = getEnv("CLOUDINARY_API_KEY");
  const apiSecret = getEnv("CLOUDINARY_API_SECRET");

  // Helpful debug log (remove in production)
  console.log("Cloudinary env ->", {
    cloudName: !!cloudName,
    apiKey: !!apiKey,
    apiSecret: !!apiSecret
  });

  if (!apiKey || !apiSecret || !cloudName) {
    // throw a descriptive error so you see exactly what's missing
    const missing = [
      !cloudName ? "CLOUDINARY_NAME/CLOUDINARY_CLOUD_NAME" : null,
      !apiKey ? "CLOUDINARY_API_KEY" : null,
      !apiSecret ? "CLOUDINARY_API_SECRET" : null
    ].filter(Boolean).join(", ");
    throw new Error(`Cloudinary config missing required env var(s): ${missing}`);
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
};

const UploadCloudinary = async (localfilepath) => {
  try {
    // Ensure config on each call (safe even if dotenv order weird)
    ensureConfig();

    if (!localfilepath) return null;
    console.log("Uploading local file to cloudinary:", localfilepath);

    const response = await cloudinary.uploader.upload(localfilepath, { resource_type: "auto" });
    console.log("Cloudinary upload success:", response && response.secure_url ? "OK" : response);

    // cleanup local file if exists
    try { if (existsSync(localfilepath)) unlinkSync(localfilepath); } catch (e) { console.warn("unlink failed:", e.message); }

    return response;
  } catch (err) {
    // make error message explicit so you can see root cause in logs
    console.error("UploadCloudinary error ->", err && err.message ? err.message : err);
    // attempt cleanup
    try { if (localfilepath && existsSync(localfilepath)) unlinkSync(localfilepath); } catch (e) { /* ignore */ }
    // rethrow so caller knows upload failed (or return null per your previous logic)
    throw err;
  }
};

export  {UploadCloudinary};
