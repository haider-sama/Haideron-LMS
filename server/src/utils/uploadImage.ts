import { v2 as cloudinary } from "cloudinary";

// Upload image to Cloudinary
interface UploadImageOptions {
    folder: 'avatars' | 'forums'; // extendable if needed
    entityId: string;
    transformation?: {
        width: number;
        height: number;
        crop?: 'limit' | 'fill' | 'fit' | 'thumb' | 'scale';
    };
}

export const uploadImageToCloudinary = async (
    file: Express.Multer.File,
    options: UploadImageOptions
): Promise<string> => {
    const { folder, entityId, transformation = { width: 500, height: 500, crop: 'limit' } } = options;

    const base64Image = Buffer.from(file.buffer).toString("base64");
    const dataURI = `data:${file.mimetype};base64,${base64Image}`;

    try {
        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
            public_id: `${folder}/${entityId}`,
            overwrite: true,
            invalidate: true,
            transformation: [transformation],
        });

        return uploadResponse.secure_url;
    } catch (error) {
        console.error(`Error uploading ${folder} image:`, error);
        throw new Error("Image upload failed");
    }
};