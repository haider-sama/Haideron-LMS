// src/lib/mediaUploader.ts
import { storage } from "./firebaseConfig";
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
} from "firebase/storage";

export const uploadMedia = async (file: File): Promise<string> => {
    const storageRef = ref(storage, `posts/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
};

export const deleteMediaByUrl = async (url: string) => {
    const baseUrl = "https://firebasestorage.googleapis.com/v0/b/";
    if (!url.startsWith(baseUrl)) return;

    try {
        const bucketPath = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
        const fileRef = ref(storage, bucketPath);
        await deleteObject(fileRef);
    } catch (error) {
        console.warn("Failed to delete media:", error);
    }
};
