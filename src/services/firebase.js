import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDZ_L3V_KmAvtoEEhtFDjVNsGSGLP8Cvos",
  authDomain: "desafio03dps-ff2fd.firebaseapp.com",
  projectId: "desafio03dps-ff2fd",
  storageBucket: "desafio03dps-ff2fd.firebasestorage.app",
  messagingSenderId: "1056436046494",
  appId: "1:1056436046494:web:3a5d142c06814040f7c98f"
};


if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app();
}

// Exportar los servicios
export const auth = firebase.auth();
export const db = firebase.firestore();
export const firebaseTimestamp = firebase.firestore.FieldValue.serverTimestamp;
export const storage = firebase.storage();
export { firebase };