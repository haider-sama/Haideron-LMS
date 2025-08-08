// src/lib/firebaseAdmin.ts
import admin from "firebase-admin";
import { FIREBASE_STORAGE_BUCKET } from "../constants/env";

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: FIREBASE_STORAGE_BUCKET, // Replace with actual
    });
}

export const bucket = admin.storage().bucket();
