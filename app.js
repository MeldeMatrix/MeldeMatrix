// Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAN2ZXKYzFoJ0o__qAyVxubjit3wrlEGlo",
    authDomain: "meldepunktpro.firebaseapp.com",
    projectId: "meldepunktpro",
    storageBucket: "meldepunktpro.firebasestorage.app",
    messagingSenderId: "1084931878712",
    appId: "1:1084931878712:web:bfa5e31c03fad5e1015bcd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
    const loginSection = document.getElementById("login-section");
    const homeSection = document.getElementById("home-section");
    const searchSection = document.getElementById("search-section");
    const createSection = document.getElementById("create-section");

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    const loginButton = document.getElementById("login-submit");
    const registerLink = document.getElementById("register-link");

    // Login function
    loginButton.addEventListener("click", async () => {
        const email = emailInput.value;
        const password = passwordInput.value;

        // Validate email format
        if (!email || !password) {
            alert("Bitte geben Sie sowohl eine E-Mail-Adresse als auch ein Passwort ein.");
            return;
        }

        if (!validateEmail(email)) {
            alert("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert("Erfolgreich eingeloggt!");
            loginSection.style.display = "none";
            homeSection.style.display = "block";
        } catch (error) {
            console.error("Login fehlgeschlagen", error);
            alert("Fehler beim Anmelden: " + error.message);
        }
    });

    // Register link handler (optional for now)
    registerLink.addEventListener("click", () => {
        alert("Registrierung wird derzeit nicht unterstützt.");
    });

    // Create new Anlage
    document.getElementById("create-submit").addEventListener("click", async () => {
        const anlageName = document.getElementById("new-anlage-name").value;
        const anlageId = document.getElementById("new-anlage-id").value;
        const meldergruppenCount = parseInt(document.getElementById("new-meldergruppen-count").value);

        if (!anlageName || !anlageId || isNaN(meldergruppenCount) || meldergruppenCount < 1 || meldergruppenCount > 20) {
            alert("Bitte geben Sie gültige Daten ein.");
            return;
        }

        try {
            const anlageRef = await addDoc(collection(db, "anlagen"), {
                name: anlageName,
                anlageId: anlageId,
                meldergruppenCount: meldergruppenCount,
                meldergruppen: createMeldergruppen(meldergruppenCount)
            });
            alert("Anlage erfolgreich erstellt!");
            createSection.style.display = "none";
            homeSection.style.display = "block";
        } catch (error) {
            console.error("Fehler beim Erstellen der Anlage", error);
            alert("Fehler beim Erstellen der Anlage: " + error.message);
        }
    });

    // Helper functions

    // Validate email format
    function validateEmail(email) {
        const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        return re.test(email);
    }

    // Generate Meldergruppen
    function createMeldergruppen(count) {
        const meldergruppen = [];
        for (let i = 1; i <= count; i++) {
            const meldergruppe = {
                name: `MG${i}`,
                meldepunkte: Array.from({ length: 32 }, (_, index) => ({
                    id: index + 1,
                    geprüft: false,
                    prüfquartal: ""
                }))
            };
            meldergruppen.push(meldergruppe);
        }
        return meldergruppen;
    }

    // Firebase Auth state listener
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginSection.style.display = "none";
            homeSection.style.display = "block";
        } else {
            loginSection.style.display = "block";
            homeSection.style.display = "none";
        }
    });
});
