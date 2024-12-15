// Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

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
    const authSection = document.getElementById("auth-section");
    const dataSection = document.getElementById("data-section");
    const anlagenContainer = document.getElementById("anlagen-container");

    // Monitor Auth State
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            authSection.style.display = "none";
            dataSection.style.display = "block";
            await loadAnlagen();
        } else {
            authSection.style.display = "block";
            dataSection.style.display = "none";
        }
    });

    // Login Function
    document.getElementById("login-button").addEventListener("click", async () => {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert("Erfolgreich eingeloggt");
        } catch (error) {
            console.error("Login fehlgeschlagen", error);
            alert("Fehler beim Einloggen: " + error.message);
        }
    });

    // Register Function
    document.getElementById("register-button").addEventListener("click", async () => {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            alert("Registrierung erfolgreich");
        } catch (error) {
            console.error("Registrierung fehlgeschlagen", error);
            alert("Fehler bei der Registrierung: " + error.message);
        }
    });

    // Function to Load Anlagen
    async function loadAnlagen() {
        try {
            const querySnapshot = await getDocs(collection(db, "anlagen"));
            anlagenContainer.innerHTML = ""; // Clear previous data

            querySnapshot.forEach((doc) => {
                const anlage = doc.data();
                const anlageDiv = document.createElement("div");
                anlageDiv.className = "anlage";

                anlageDiv.innerHTML = `
                    <h3>${anlage.name}</h3>
                    <p>ID: ${anlage.id}</p>
                    <button class="view-button" data-id="${anlage.id}">Anlage anzeigen</button>
                `;
                anlagenContainer.appendChild(anlageDiv);
            });
        } catch (error) {
            console.error("Fehler beim Laden der Anlagen:", error);
            alert("Fehler beim Laden der Anlagen");
        }
    }

    // Function to Create a New Anlage
    async function createAnlage(name) {
        const timestamp = new Date();

        const meldegruppen = [];
        for (let i = 1; i <= 20; i++) { // Erstellen von 20 Meldegruppen
            const meldepunkte = [];
            for (let j = 1; j <= 32; j++) { // Erstellen von 32 Meldepunkten pro Gruppe
                meldepunkte.push({
                    id: j,
                    geprüft: false,
                    geprüftAm: null
                });
            }

            meldegruppen.push({
                name: `Meldegruppe ${i}`,
                meldepunkte: meldepunkte
            });
        }

        const anlage = {
            id: Date.now(), // Erstellen einer eindeutigen ID basierend auf der aktuellen Zeit
            name: name,
            meldegruppen: meldegruppen,
            erstelltAm: timestamp
        };

        try {
            await setDoc(doc(db, "anlagen", String(anlage.id)), anlage);
            alert("Anlage erfolgreich erstellt");
            loadAnlagen(); // Liste der Anlagen neu laden
        } catch (error) {
            console.error("Fehler beim Erstellen der Anlage:", error);
            alert("Fehler beim Erstellen der Anlage");
        }
    }

    // Event listener for creating a new Anlage
    document.getElementById("create-anlage-button").addEventListener("click", async () => {
        const anlagenName = prompt("Bitte geben Sie den Namen der neuen Anlage ein:");
        if (anlagenName) {
            await createAnlage(anlagenName);
        }
    });

    // Event listener to view an Anlage's details
    anlagenContainer.addEventListener("click", async (e) => {
        if (e.target && e.target.classList.contains("view-button")) {
            const anlageId = e.target.getAttribute("data-id");
            await displayAnlageDetails(anlageId);
        }
    });

    // Display details for a selected Anlage
    async function displayAnlageDetails(anlageId) {
        const anlageRef = doc(db, "anlagen", anlageId);
        const docSnap = await getDoc(anlageRef);

        if (docSnap.exists()) {
            const anlage = docSnap.data();
            const anlageContainer = document.getElementById("anlage-details-container");
            anlageContainer.innerHTML = `<h3>${anlage.name}</h3>`;

            anlage.meldegruppen.forEach((gruppe) => {
                const groupDiv = document.createElement("div");
                groupDiv.classList.add("gruppe");
                groupDiv.innerHTML = `<h4>${gruppe.name}</h4><div class="punkte-container"></div>`;

                gruppe.meldepunkte.forEach((punkt) => {
                    const punktDiv = document.createElement("div");
                    punktDiv.classList.add("punkt");
                    punktDiv.innerHTML = `
                        <p>ID: ${punkt.id} - Status: ${punkt.geprüft ? "✔️ Geprüft" : "❌ Nicht geprüft"}</p>
                        <button class="check-button" data-id="${punkt.id}" data-gruppe="${gruppe.name}">
                            ${punkt.geprüft ? "Status zurücksetzen" : "Als geprüft markieren"}
                        </button>
                    `;
                    groupDiv.querySelector(".punkte-container").appendChild(punktDiv);
                });

                anlageContainer.appendChild(groupDiv);
            });

            // Show the details section
            document.getElementById("anlage-details-section").style.display = "block";
        } else {
            console.log("Anlage nicht gefunden");
        }
    }

    // Function to Update Meldepunkt Status
    async function updateMeldepunktStatus(anlageId, gruppeName, punktId) {
        const timestamp = new Date();
        const anlageRef = doc(db, "anlagen", anlageId);

        // Hole die Anlage-Daten
        const anlageSnap = await getDoc(anlageRef);
        const anlage = anlageSnap.data();

        // Suche nach der richtigen Meldegruppe und Meldepunkt
        const meldegruppeIndex = anlage.meldegruppen.findIndex(gruppe => gruppe.name === gruppeName);
        const meldepunktIndex = anlage.meldegruppen[meldegruppeIndex].meldepunkte.findIndex(punkt => punkt.id === parseInt(punktId));

        if (meldegruppeIndex === -1 || meldepunktIndex === -1) {
            console.error("Meldegruppe oder Meldepunkt nicht gefunden!");
            return;
        }

        // Toggle den geprüft-Status
        const meldepunkt = anlage.meldegruppen[meldegruppeIndex].meldepunkte[meldepunktIndex];
        meldepunkt.geprüft = !meldepunkt.geprüft;
        meldepunkt.geprüftAm = meldepunkt.geprüft ? timestamp : null;

        // Aktualisieren Sie das gesamte meldegruppen Array in Firestore
        try {
            await updateDoc(anlageRef, {
                meldegruppen: anlage.meldegruppen
            });
            alert("Status aktualisiert!");
            displayAnlageDetails(anlageId); // Details neu anzeigen
        } catch (error) {
            console.error("Fehler beim Aktualisieren des Status:", error);
            alert("Fehler beim Aktualisieren des Status.");
        }
    }

    // Event listener to handle checking/unchecking Meldepunkte
    document.getElementById("anlage-details-container").addEventListener("click", async (e) => {
        if (e.target && e.target.classList.contains("check-button")) {
            const punktId = e.target.getAttribute("data-id");
            const gruppeName = e.target.getAttribute("data-gruppe");
            const anlageId = document.querySelector("h3").textContent;

            await updateMeldepunktStatus(anlageId, gruppeName, punktId);
        }
    });
});
