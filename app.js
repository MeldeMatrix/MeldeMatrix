// Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

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
    const homeSection = document.getElementById("home-section");
    const searchSection = document.getElementById("search-section");
    const createSection = document.getElementById("create-section");
    const searchButton = document.getElementById("search-button");
    const createButton = document.getElementById("create-button");

    const searchSubmit = document.getElementById("search-submit");
    const createSubmit = document.getElementById("create-submit");

    // Home section buttons
    searchButton.addEventListener("click", () => {
        homeSection.style.display = "none";
        searchSection.style.display = "block";
    });

    createButton.addEventListener("click", () => {
        homeSection.style.display = "none";
        createSection.style.display = "block";
    });

    // Search function
    searchSubmit.addEventListener("click", async () => {
        const searchInput = document.getElementById("search-input").value;
        if (!searchInput) {
            alert("Bitte geben Sie eine Anlagennummer oder einen Anlagennamen ein.");
            return;
        }

        try {
            // Query to find an Anlage by ID or Name
            const q = query(
                collection(db, "anlagen"),
                where("anlageId", "==", searchInput),
                where("name", "==", searchInput)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                alert("Anlage gefunden!");
            } else {
                alert("Keine Anlage gefunden.");
            }
        } catch (error) {
            console.error("Fehler bei der Suche nach der Anlage", error);
            alert("Fehler bei der Suche nach der Anlage.");
        }
    });

    // Create new Anlage
    createSubmit.addEventListener("click", async () => {
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
            homeSection.style.display = "block";
        } else {
            alert("Bitte loggen Sie sich ein.");
        }
    });
});
