import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC38EqYYCvbUeO_59g00gUzxh0fXCU2H5c",
  authDomain: "phantomx-adb2c.firebaseapp.com",
  projectId: "phantomx-adb2c",
  storageBucket: "phantomx-adb2c.firebasestorage.app",
  messagingSenderId: "92687739632",
  appId: "1:92687739632:web:df3dc11c0014769da1f035"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
