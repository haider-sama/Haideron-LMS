// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA1LS8jdFrU7A3ySzcH6LPom93kv4NAKnU",
    authDomain: "ecommerce-store-deconbyte-01.firebaseapp.com",
    projectId: "ecommerce-store-deconbyte-01",
    storageBucket: "ecommerce-store-deconbyte-01.appspot.com",
    messagingSenderId: "85645214746",
    appId: "1:85645214746:web:2ef11e63463e74cced7da3"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
export const storage = getStorage(firebaseApp);