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
        const searchTerm = document.getElementById("search-term").value;
        const q = query(
            collection(db, "anlagen"),
            where("name", "==", searchTerm)
        );

        const querySnapshot = await getDocs(q);
        const resultsContainer = document.getElementById("search-results");

        resultsContainer.innerHTML = "";
        querySnapshot.forEach((doc) => {
            const data = doc.data();
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

        // Add event listeners for "Zur Prüfung" buttons
        document.querySelectorAll(".open-anlage").forEach((button) => {
            button.addEventListener("click", (e) => {
                const anlageId = e.target.getAttribute("data-id");
                showAnlagePruefung(anlageId);
            });
        });
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

// Show Prüfung Page
let quartalFilter = null; // Global state for the quartal filter
let showOnlyOpen = false; // State for showing only open points

async function showAnlagePruefung(anlageId) {
    const anlageDoc = await getDoc(doc(db, "anlagen", anlageId));
    if (!anlageDoc.exists()) {
        alert("Anlage nicht gefunden!");
        return;
    }

    const anlageData = anlageDoc.data();

    const renderPage = () => {
        content.innerHTML = `
            <h2>Anlage: ${anlageData.name} (ID: ${anlageData.id})</h2>
            <select id="quartal-selector">
                <option value="Q1" ${quartalFilter === 'Q1' ? 'selected' : ''}>Q1</option>
                <option value="Q2" ${quartalFilter === 'Q2' ? 'selected' : ''}>Q2</option>
                <option value="Q3" ${quartalFilter === 'Q3' ? 'selected' : ''}>Q3</option>
                <option value="Q4" ${quartalFilter === 'Q4' ? 'selected' : ''}>Q4</option>
            </select>
            <button id="filter-open">${showOnlyOpen ? "Alle Punkte anzeigen" : "Nur offene Punkte anzeigen"}</button>
            <button id="filter-quartal">${quartalFilter ? `Quartal ${quartalFilter} anzeigen` : "Quartal filtern"}</button>
            <div id="anlage-pruefung">
                ${anlageData.meldergruppen
                    .map(
                        (gruppe) => `
                    <div>
                        <h3>${gruppe.name}</h3>
                        <div class="melder-container">
                            ${gruppe.meldepunkte
                                .filter((melder) =>
                                    showOnlyOpen
                                        ? !melder.geprüft
                                        : true &&
                                          (!quartalFilter ||
                                              melder.quartal === quartalFilter)
                                )
                                .map(
                                    (melder) => `
                                <span>
                                    ${melder.id}
                                    <button class="toggle-status" data-group="${gruppe.name}" data-melder="${melder.id}" data-status="${melder.geprüft}">${melder.geprüft ? "✔️" : "❌"}</button>
                                </span>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        bindButtons();
    };

    const bindButtons = () => {
        // Handle the "Nur offene Punkte anzeigen" button toggle
        document.getElementById("filter-open").addEventListener("click", () => {
            showOnlyOpen = !showOnlyOpen;
            renderPage();
        });

        // Handle the "Quartal filtern" button toggle
        document.getElementById("filter-quartal").addEventListener("click", () => {
            const selectedQuartal = document.getElementById("quartal-selector").value;
            quartalFilter = quartalFilter === selectedQuartal ? null : selectedQuartal;
            renderPage();
        });

        // Handle the Quartal selector change
        document.getElementById("quartal-selector").addEventListener("change", (e) => {
            quartalFilter = e.target.value;
            renderPage(); // Re-render the page after the quartal change
        });

        // Event listeners for toggling the Prüfzstatus
        document.querySelectorAll(".toggle-status").forEach((button) => {
            button.addEventListener("click", async (e) => {
                const groupName = e.target.getAttribute("data-group");
                const melderId = parseInt(e.target.getAttribute("data-melder"), 10);
                const currentStatus = e.target.getAttribute("data-status") === "true";
                const quartal = document.getElementById("quartal-selector").value;

                try {
                    const updatedGruppen = anlageData.meldergruppen.map((gruppe) => {
                        if (gruppe.name === groupName) {
                            return {
                                ...gruppe,
                                meldepunkte: gruppe.meldepunkte.map((melder) => {
                                    if (melder.id === melderId) {
                                        return {
                                            ...melder,
                                            geprüft: !currentStatus,
                                            quartal: quartal,
                                        };
                                    }
                                    return melder;
                                }),
                            };
                        }
                        return gruppe;
                    });

                    await setDoc(doc(db, "anlagen", anlageId), {
                        ...anlageData,
                        meldergruppen: updatedGruppen,
                    });

                    anlageData.meldergruppen = updatedGruppen; // Update local data
                    renderPage(); // Re-render the page with updated data
                } catch (error) {
                    alert(`Fehler beim Aktualisieren des Prüfstatus: ${error.message}`);
                }
            });
        });
    };

    renderPage(); // Initial render
}
