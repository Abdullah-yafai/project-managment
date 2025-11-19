import { v2 as cloudinary } from "cloudinary"
import { unlinkSync } from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const UploadCloudinary = async (localfilepath) => {
    try {
        if (!localfilepath) return null

        const response = await cloudinary.uploader.upload(localfilepath, { resourceType: "auto" });
        console.log(response, "cloudinary response");
        unlinkSync(localfilepath);
        return response;
    } catch (error) {
        unlinkSync(localfilepath)
        return null
    }
}

export {UploadCloudinary}