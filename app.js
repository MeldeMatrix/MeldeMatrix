// Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

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
    const addAnlageForm = document.getElementById("add-anlage-form");

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

        if (!email || !password) {
            alert("Bitte E-Mail und Passwort eingeben.");
            return;
        }

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

        if (!email || !password) {
            alert("Bitte E-Mail und Passwort eingeben.");
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            alert("Registrierung erfolgreich");
        } catch (error) {
            console.error("Registrierung fehlgeschlagen", error);
            alert("Fehler bei der Registrierung: " + error.message);
        }
    });

    // Load Anlagen Function
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
                    <ul>
                        ${anlage.meldegruppen
                            .map(
                                (gruppe) => `
                            <li>
                                <strong>${gruppe.name}</strong>
                                <ul>
                                    ${gruppe.meldepunkte
                                        .map(
                                            (punkt) =>
                                                `<li>${punkt.id}: ${
                                                    punkt.geprüft
                                                        ? "✔️ Geprüft"
                                                        : "❌ Nicht geprüft"
                                                }</li>`
                                        )
                                        .join("")}
                                </ul>
                            </li>
                        `
                            )
                            .join("")}
                    </ul>
                `;
                anlagenContainer.appendChild(anlageDiv);
            });
        } catch (error) {
            console.error("Fehler beim Laden der Anlagen:", error);
            alert("Fehler beim Laden der Anlagen");
        }
    }

    // Add a new Anlage to Firestore
    addAnlageForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // Verhindert das Standard-Formularverhalten (Seitenreload)

        const name = document.getElementById("anlage-name").value;
        const id = document.getElementById("anlage-id").value;

        if (!name || !id) {
            alert("Bitte geben Sie den Namen und die ID der neuen Anlage ein.");
            return;
        }

        // Meldegruppen und Meldepunkte automatisch erstellen
        const meldegruppen = [];
        for (let i = 1; i <= 200; i++) {
            const meldepunkte = [];
            for (let j = 1; j <= 32; j++) {
                meldepunkte.push({
                    id: j,
                    geprüft: false // Standardmäßig "Nicht geprüft"
                });
            }
            meldegruppen.push({
                name: `Meldegruppe ${i}`,
                meldepunkte: meldepunkte
            });
        }

        // Loggen Sie die generierten Daten zur Fehlerbehebung
        console.log("Anlage Daten:", { name, id, meldegruppen });

        try {
            // Dokument in der Sammlung "anlagen" hinzufügen
            const docRef = await addDoc(collection(db, "anlagen"), {
                name: name,
                id: id,
                meldegruppen: meldegruppen
            });

            alert("Anlage erfolgreich hinzugefügt");

            // Formular zurücksetzen
            addAnlageForm.reset();

            // Anlagen neu laden, um die neue Anlage anzuzeigen
            loadAnlagen();
        } catch (error) {
            console.error("Fehler beim Hinzufügen der Anlage:", error);
            alert("Fehler beim Hinzufügen der Anlage: " + error.message);
        }
    });
});
