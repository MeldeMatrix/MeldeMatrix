// Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    getDoc,
    doc,
    setDoc,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAN2ZXKYzFoJ0o__qAyVxubjit3wrlEGlo",
    authDomain: "meldepunktpro.firebaseapp.com",
    projectId: "meldepunktpro",
    storageBucket: "meldepunktpro.appspot.com",
    messagingSenderId: "1084931878712",
    appId: "1:1084931878712:web:bfa5e31c03fad5e1015bcd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const authSection = document.getElementById("auth-section");
const menuSection = document.getElementById("menu-section");
const content = document.getElementById("content");

// Event Listeners
document.getElementById("login-button").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Login erfolgreich!");
    } catch (error) {
        alert(`Fehler beim Anmelden: ${error.message}`);
    }
});

document.getElementById("logout-button").addEventListener("click", async () => {
    await signOut(auth);
    alert("Abgemeldet!");
});

document.getElementById("search-submit").addEventListener("click", showSearchPage);
document.getElementById("create-submit").addEventListener("click", showCreatePage);

// Authentication State Change
onAuthStateChanged(auth, (user) => {
    if (user) {
        authSection.style.display = "none";
        menuSection.style.display = "block";
    } else {
        authSection.style.display = "block";
        menuSection.style.display = "none";
        content.innerHTML = "<p>Bitte loggen Sie sich ein.</p>";
    }
});

// Search Page
function showSearchPage() {
    content.innerHTML = `
        <h2>Anlage Suchen</h2>
        <input type="text" id="search-term" placeholder="Anlagen-ID oder Name">
        <button id="perform-search">Suchen</button>
        <div id="search-results"></div>
    `;

    document.getElementById("perform-search").addEventListener("click", async () => {
        const searchTerm = document.getElementById("search-term").value.trim().toLowerCase();
        if (!searchTerm) {
            alert("Bitte einen Suchbegriff eingeben.");
            return;
        }

        try {
            const q = query(collection(db, "anlagen"));
            const querySnapshot = await getDocs(q);
            const resultsContainer = document.getElementById("search-results");

            resultsContainer.innerHTML = ""; // Leeren Sie die Ergebnisse vorher

            let foundResults = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const nameLower = data.name.toLowerCase();
                const idLower = data.id.toLowerCase();

                // Überprüfung auf teilweise Übereinstimmungen im Namen oder ID
                if (nameLower.includes(searchTerm) || idLower.includes(searchTerm)) {
                    foundResults.push(data);
                }
            });

            if (foundResults.length === 0) {
                resultsContainer.innerHTML = "<p>Keine Ergebnisse gefunden.</p>";
            } else {
                foundResults.forEach((data) => {
                    resultsContainer.innerHTML += `
                        <div>
                            <p><strong>${data.name}</strong> (ID: ${data.id})</p>
                            <p>Meldergruppen: ${data.meldergruppen.length}</p>
                            <p>Geprüft: ${calculateProgress(data.meldergruppen)}%</p>
                            <button class="open-anlage" data-id="${data.id}">Zur Prüfung</button>
                        </div>
                        <hr>
                    `;
                });

                // Event listeners für die Buttons
                document.querySelectorAll(".open-anlage").forEach((button) => {
                    button.addEventListener("click", (e) => {
                        const anlageId = e.target.getAttribute("data-id");
                        showAnlagePruefung(anlageId);
                    });
                });
            }
        } catch (error) {
            alert(`Fehler bei der Suche: ${error.message}`);
        }
    });
}

// Create Page
function showCreatePage() {
    content.innerHTML = `
        <h2>Neue Anlage Erstellen</h2>
        <input type="text" id="new-name" placeholder="Anlagenname">
        <input type="text" id="new-id" placeholder="Anlagen-ID">
        <input type="number" id="group-count" placeholder="Anzahl Meldergruppen">
        <button id="create-new">Anlage Erstellen</button>
    `;

    document.getElementById("create-new").addEventListener("click", async () => {
        const name = document.getElementById("new-name").value;
        const id = document.getElementById("new-id").value;
        const groupCount = parseInt(
            document.getElementById("group-count").value,
            10
        );

        const meldergruppen = Array.from({ length: groupCount }, (_, i) => ({
            name: `MG${i + 1}`,
            meldepunkte: Array.from({ length: 32 }, (_, j) => ({
                id: j + 1,
                geprüft: false,
                quartal: null,
            })),
        }));

        try {
            await setDoc(doc(db, "anlagen", id), { name, id, meldergruppen });
            alert("Anlage erfolgreich erstellt!");
        } catch (error) {
            alert(`Fehler beim Erstellen der Anlage: ${error.message}`);
        }
    });
}

// Anlage Prüfungsseite
function showAnlagePruefung(anlageId) {
    content.innerHTML = `
        <h2>Prüfung der Anlage</h2>
        <p>Prüfen Sie die Melderpunkte der Anlage mit der ID: ${anlageId}</p>
        <div id="melderpunkte-list"></div>
    `;

    loadAnlageDetails(anlageId);
}

async function loadAnlageDetails(anlageId) {
    try {
        const anlageRef = doc(db, "anlagen", anlageId);
        const anlageDoc = await getDoc(anlageRef);
        if (anlageDoc.exists()) {
            const data = anlageDoc.data();
            const melderpunkteList = document.getElementById("melderpunkte-list");
            melderpunkteList.innerHTML = ""; // Ergebnisse leeren

            data.meldergruppen.forEach((gruppe, index) => {
                melderpunkteList.innerHTML += `
                    <h3>Meldergruppe ${gruppe.name}</h3>
                    <ul>
                        ${gruppe.meldepunkte
                            .map((punkt) => {
                                const geprüftStatus = punkt.geprüft ? "Ja" : "Nein";
                                return `
                                    <li>
                                        Melderpunkt ${punkt.id} - Geprüft: ${geprüftStatus} 
                                        <button class="toggle-pruefung" data-id="${punkt.id}" data-gruppe="${gruppe.name}">
                                            ${punkt.geprüft ? "Zurücksetzen" : "Prüfen"}
                                        </button>
                                    </li>
                                `;
                            })
                            .join("")}
                    </ul>
                    <hr>
                `;
            });

            document.querySelectorAll(".toggle-pruefung").forEach((button) => {
                button.addEventListener("click", async (e) => {
                    const punktId = parseInt(e.target.getAttribute("data-id"));
                    const gruppeName = e.target.getAttribute("data-gruppe");
                    await togglePruefungStatus(anlageId, gruppeName, punktId);
                });
            });
        } else {
            alert("Anlage nicht gefunden!");
        }
    } catch (error) {
        alert(`Fehler beim Laden der Anlagendetails: ${error.message}`);
    }
}

async function togglePruefungStatus(anlageId, gruppeName, punktId) {
    try {
        const anlageRef = doc(db, "anlagen", anlageId);
        const anlageDoc = await getDoc(anlageRef);
        const anlageData = anlageDoc.data();

        // Finde die Meldergruppe und den Melderpunkt
        const meldergruppe = anlageData.meldergruppen.find((gruppe) => gruppe.name === gruppeName);
        const melderpunkt = meldergruppe.meldepunkte.find((punkt) => punkt.id === punktId);

        // Toggle den Prüfstatus
        melderpunkt.geprüft = !melderpunkt.geprüft;

        // Speichern der Änderungen
        await setDoc(anlageRef, anlageData);
        loadAnlageDetails(anlageId); // Lade die Details neu
    } catch (error) {
        alert(`Fehler beim Ändern des Prüfstatus: ${error.message}`);
    }
}

// Helper Function: Calculate Progress
function calculateProgress(meldergruppen) {
    const total = meldergruppen.reduce(
        (sum, gruppe) => sum + gruppe.meldepunkte.length,
        0
    );
    const checked = meldergruppen.reduce(
        (sum, gruppe) =>
            sum +
            gruppe.meldepunkte.filter((melder) => melder.geprüft).length,
        0
    );
    return ((checked / total) * 100).toFixed(2);
}
