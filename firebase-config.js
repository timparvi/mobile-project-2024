import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBQxJIaxqCqCYZ7QKlA3la4qzZegX2MJLw",
    authDomain: "healthcareapp-58a1f.firebaseapp.com",
    databaseURL: "https://healthcareapp-58a1f-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "healthcareapp-58a1f",
    storageBucket: "healthcareapp-58a1f.appspot.com",
    messagingSenderId: "206275679156",
    appId: "1:206275679156:web:bec3901c88d8a9595ed8e1"
  };
  
  
  // Alustetaan Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app)

  export {auth};