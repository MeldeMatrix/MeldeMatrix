// Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, doc, setDoc, updateDoc, FieldValue } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

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
    const searchSection = document.getElementById("search-section");
    const createAnlageSection = document.getElementById("create-anlage-section");
    const dataSection = document.getElementById("data-section");
    const anlagenContainer = document.getElementById("anlagen-container");
    const searchButton = document.getElementById("search-button");
    const createButton = document.getElementById("create-button");
    const createAnlageButton = document.getElementById("create-anlage-button");
    const cancelCreateAnlageButton = document.getElementById("cancel-create-anlage");

    // Monitor Auth State
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            authSection.style.display = "none";
            searchSection.style.display = "block"; // Zeigt das Suchfeld an
        } else {
            authSection.style.display = "block";
            searchSection.style.display = "none";
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

    // Search for Anlage by ID or Name
    searchButton.addEventListener("click", async () => {
        const searchQuery = document.getElementById("search-field").value.trim();
        if (!searchQuery) {
            alert("Bitte geben Sie eine ID oder einen Namen ein.");
            return;
        }

        // Firestore query to search by ID or name
        const q = query(
            collection(db, "anlagen"),
            where("name", "==", searchQuery) // Filter nach Name
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            alert("Keine Anlage gefunden.");
            return;
        }

        // Wenn ein Treffer gefunden wird, zeigen wir die Details an
        querySnapshot.forEach(docSnapshot => {
            const anlage = docSnapshot.data();
            displayAnlageDetails(anlage);
        });
    });

    // Display Anlage details and its Meldegruppen
    async function displayAnlageDetails(anlage) {
        dataSection.style.display = "block";
        searchSection.style.display = "none";

        anlagenContainer.innerHTML = `
            <h3>${anlage.name} (ID: ${anlage.id})</h3>
            <div class="grid-container">
                ${anlage.meldegruppen
                    .map((gruppe, index) => `
                        <div class="grid-item">
                            <h4>${gruppe.name}</h4>
                            <ul>
                                ${gruppe.meldepunkte
                                    .map((punkt) => `
                                        <li>
                                            <button class="check-button" data-id="${punkt.id}" data-gruppe="${gruppe.name}">
                                                ${punkt.geprüft ? "✔️ Geprüft" : "❌ Nicht geprüft"}
                                            </button>
                                        </li>
                                    `)
                                    .join("")}
                            </ul>
                        </div>
                    `)
                    .join("")}
            </div>
        `;

        // Attach event listeners to check buttons
        const checkButtons = document.querySelectorAll(".check-button");
        checkButtons.forEach(button => {
            button.addEventListener("click", async (e) => {
                const punktId = e.target.dataset.id;
                const gruppeName = e.target.dataset.gruppe;

                // Toggle check status and update timestamp
                const timestamp = new Date();

                // Update Firestore document
                const anlageRef = doc(db, "anlagen", anlage.id);
                const meldegruppe = anlage.meldegruppen.find(g => g.name === gruppeName);
                const meldepunkt = meldegruppe.meldepunkte.find(p => p.id === parseInt(punktId));

                meldepunkt.geprüft = !meldepunkt.geprüft;
                meldepunkt.geprüftAm = timestamp;

                try {
                    await updateDoc(anlageRef, {
                        meldegruppen: anlage.meldegruppen
                    });
                    alert("Status aktualisiert!");
                    displayAnlageDetails(anlage); // Refresh the display
                } catch (error) {
                    console.error("Fehler beim Aktualisieren:", error);
                    alert("Fehler beim Aktualisieren des Status.");
                }
            });
        });
    }

    // Button to create a new Anlage
    createButton.addEventListener("click", () => {
        searchSection.style.display = "none";
        createAnlageSection.style.display = "block"; // Zeigt das Erstellungsformular an
    });

    // Cancel create Anlage
    cancelCreateAnlageButton.addEventListener("click", () => {
        createAnlageSection.style.display = "none";
        searchSection.style.display = "block";
    });

    // Create new Anlage
    createAnlageButton.addEventListener("click", async () => {
        const anlageName = document.getElementById("new-anlage-name").value.trim();

        if (!anlageName) {
            alert("Bitte einen Namen für die Anlage eingeben.");
            return;
        }

        const newAnlage = {
            name: anlageName,
            id: Date.now().toString(), // Using a timestamp as ID
            meldegruppen: createMeldegruppen() // Automatisch 200 Meldegruppen anlegen
        };

        try {
            await setDoc(doc(db, "anlagen", newAnlage.id), newAnlage);
            alert("Anlage erfolgreich erstellt!");
            displayAnlageDetails(newAnlage);
            createAnlageSection.style.display = "none";
            searchSection.style.display = "block";
        } catch (error) {
            console.error("Fehler beim Erstellen der Anlage:", error);
            alert("Fehler beim Erstellen der Anlage.");
        }
    });

    // Function to create 200 Meldegruppen with 32 Meldepunkte each
    function createMeldegruppen() {
        const meldegruppen = [];
        for (let i = 1; i <= 200; i++) {
            const meldepunkte = [];
            for (let j = 1; j <= 32; j++) {
                meldepunkte.push({
                    id: j,
                    geprüft: false,
                    geprüftAm: null
                });
            }
            meldegruppen.push({
                name: `Gruppe ${i}`,
                meldepunkte: meldepunkte
            });
        }
        return meldegruppen;
    }
});
