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

// Global state for the current Anlage ID
let currentAnlageId = null;
let selectedQuartal = 'Q1'; // Default value for the quarter
let selectedJahr = 2024;    // Default year
let showOnlyOpen = false;   // Filter for open points
let filterByQuarter = null; // To store which quarter to filter the display (via buttons)

// Event listener for login button click (already exists)
document.getElementById("login-button").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert(`Fehler beim Anmelden: ${error.message}`);
    }
});

document.getElementById("password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        triggerLogin();
    }
});

// Function to trigger login process
async function triggerLogin() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert(`Fehler beim Anmelden: ${error.message}`);
    }
}

document.getElementById("logout-button").addEventListener("click", async () => {
    await signOut(auth);
});

document.getElementById("search-submit").addEventListener("click", showSearchPage);
document.getElementById("create-submit").addEventListener("click", showCreatePage);

// Authentication State Change
onAuthStateChanged(auth, (user) => {
    if (user) {
        authSection.style.display = "none";
        menuSection.style.display = "block";
        showSearchPage();  // Show search page after login
    } else {
        authSection.style.display = "block";
        menuSection.style.display = "none";
        content.innerHTML = "<p>Bitte loggen Sie sich ein.</p>";
    }
});

// Event listener for the "CheckInspect" link
document.getElementById("checkinspect-link").addEventListener("click", () => {
    showSearchPage(); // Zeigt die Such-Seite an
});

// Event listener for the Refresh button
document.getElementById("refresh-button").addEventListener("click", () => {
    const currentPage = content.innerHTML;

    if (currentPage.includes("Anlage Suchen")) {
        showSearchPage();
    } else if (currentPage.includes("Neue Anlage Erstellen")) {
        showCreatePage();
    } else if (currentPage.includes("Anlage:")) {
        if (currentAnlageId) {
            showAnlagePruefung(currentAnlageId);
        } else {
            alert("Keine gültige Anlage-ID gefunden.");
        }
    }
});

// Search Page
async function showSearchPage() {
    content.innerHTML = `
        <h2>Anlage Suchen</h2>
        <input type="text" id="search-term" placeholder="Anlagen-Nr oder Name">
        <button id="perform-search" class="btn-class">Suchen</button>
        <div id="search-results"></div>
    `;

    // Event listener for search button click
    document.getElementById("perform-search").addEventListener("click", performSearch);

    // Event listener for Enter key press
    document.getElementById("search-term").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            performSearch();  // Trigger search when Enter is pressed
        }
    });

    // Perform search logic
    async function performSearch() {
        const searchTerm = document.getElementById("search-term").value.trim().toLowerCase();
        if (!searchTerm) {
            alert("Bitte einen Suchbegriff eingeben.");
            return;
        }

        try {
            const q = query(collection(db, "anlagen"));
            const querySnapshot = await getDocs(q);
            const resultsContainer = document.getElementById("search-results");

            resultsContainer.innerHTML = ""; // Clear previous results

            let foundResults = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const nameLower = data.name.toLowerCase();
                const idLower = data.id.toLowerCase();

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
                            <p><strong>${data.name}</strong> (Anlagen-Nr: ${data.id})</p>
                            <p>Meldergruppen: ${data.meldergruppen.length}</p>
                            <p>Geprüft: ${calculateProgress(data.meldergruppen)}%</p>
                            <button class="open-anlage btn-class" data-id="${data.id}">Zur Prüfung</button>
                        </div>
                        <hr>
                    `;
                });

                document.querySelectorAll(".open-anlage").forEach((button) => {
                    button.addEventListener("click", (e) => {
                        const anlageId = e.target.getAttribute("data-id");
                        currentAnlageId = anlageId;
                        showAnlagePruefung(anlageId);
                    });
                });
            }
        } catch (error) {
            alert(`Fehler bei der Suche: ${error.message}`);
        }
    }
}

// Create Page
async function showCreatePage() {
    content.innerHTML = `
        <h2>Neue Anlage Erstellen</h2>
        <input type="text" id="new-name" placeholder="Anlagenname">
        <input type="text" id="new-id" placeholder="Anlagen-Nr">
	<div style="margin-top:5px">
	<a>Akku Einbaudatum: </a>
        <input type="text" id="new-text-field-1" placeholder="YY/JJJJ">
	</div>
	<div style="margin-top:5px">
	<a>Besonderheiten: </a>
        <input type="text" id="new-text-field-2">
	</div>
	<div>
            <label for="turnus-select">Wählen Sie den Turnus:</label>
            <select id="turnus-select">
                <option value="quarterly">Vierteljährlich</option>
                <option value="semi-annual">Halbjährlich</option>
                <option value="annual">Jährlich</option>
            </select>
        </div>
        <div id="meldergruppen-container">
            <div class="meldergruppe">
                <h3>Meldegruppe 1</h3>
                <input type="number" class="melder-count" placeholder="Anzahl Melder" value="1">
                <label for="zd">ZD</label>
                <input type="checkbox" class="zd-checkbox">
                <label for="sm">SM</label>
                <input type="checkbox" class="sm-checkbox">
            </div>
        </div>
        <br>
        <button id="add-meldegruppe" class="btn-class">Weitere Meldegruppe hinzufügen</button>
        <br>
        <br>
        <button id="create-new" class="btn-class">Anlage Erstellen</button>
    `;

    // Event Listener für "Weitere Meldegruppe hinzufügen"
    document.getElementById("add-meldegruppe").addEventListener("click", () => {
        const meldergruppenContainer = document.getElementById("meldergruppen-container");
        const groupCount = meldergruppenContainer.querySelectorAll(".meldergruppe").length + 1;
        const newGroup = document.createElement("div");
        newGroup.classList.add("meldergruppe");
        newGroup.innerHTML = `
            <h3>Meldegruppe ${groupCount}</h3>
            <input type="number" class="melder-count" placeholder="Anzahl Melder" value="1">
            <label for="zd">ZD</label>
            <input type="checkbox" class="zd-checkbox">
            <label for="sm">SM</label>
            <input type="checkbox" class="sm-checkbox">
        `;
        meldergruppenContainer.appendChild(newGroup);
    });

    // Event Listener für das Erstellen der neuen Anlage
    document.getElementById("create-new").addEventListener("click", async () => {
        const name = document.getElementById("new-name").value;
        const id = document.getElementById("new-id").value;
        const textField1 = document.getElementById("new-text-field-1").value;  // Neues Textfeld 1
        const textField2 = document.getElementById("new-text-field-2").value;  // Neues Textfeld 2
	const turnus = document.getElementById("turnus-select").value;  // Get the selected Turnus

        // Collect all Meldegruppen data
        const meldergruppen = [];
        document.querySelectorAll(".meldergruppe").forEach((groupElement, index) => {
            const melderCount = parseInt(groupElement.querySelector(".melder-count").value, 10);
            const zdChecked = groupElement.querySelector(".zd-checkbox").checked;
            const smChecked = groupElement.querySelector(".sm-checkbox").checked;
            
            const meldepunkte = Array.from({ length: melderCount }, (_, i) => ({
                id: i + 1,
                geprüft: {},
                quartal: null,
            }));

            meldergruppen.push({
                name: `MG${index + 1}`,
                meldepunkte: meldepunkte,
                zd: zdChecked,
                sm: smChecked,
            });
        });

        try {
            await setDoc(doc(db, "anlagen", id), { name, id, meldergruppen, textField1, textField2, turnus });
            alert("Anlage erfolgreich erstellt!");
        } catch (error) {
            alert(`Fehler beim Erstellen der Anlage: ${error.message}`);
        }
    });
}



// Function to display the Anlage Prüfung page
async function showAnlagePruefung(anlageId) {
    const anlageDoc = await getDoc(doc(db, "anlagen", anlageId));
    if (!anlageDoc.exists()) {
        alert("Anlage nicht gefunden!");
        return;
    }

    const anlageData = anlageDoc.data();

    // Dynamisch die letzten 5 Jahre (inkl. aktuelles Jahr) erstellen
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)
        .map(year => `<option value="${year}" ${selectedJahr === year ? 'selected' : ''}>${year}</option>`)
        .join('');


	// Based on Turnus (quarterly, semi-annual, annual), adjust the quarter filters
    let quarterFilterHtml = '';
    if (anlageData.turnus === 'quarterly') {
        quarterFilterHtml = `
            <button class="quarter-filter ${filterByQuarter === 'Q1' ? 'active' : ''}" data-quarter="Q1">Q1</button>
            <button class="quarter-filter ${filterByQuarter === 'Q2' ? 'active' : ''}" data-quarter="Q2">Q2</button>
            <button class="quarter-filter ${filterByQuarter === 'Q3' ? 'active' : ''}" data-quarter="Q3">Q3</button>
            <button class="quarter-filter ${filterByQuarter === 'Q4' ? 'active' : ''}" data-quarter="Q4">Q4</button>
        `;
    } else if (anlageData.turnus === 'semi-annual') {
        quarterFilterHtml = `
            <button class="quarter-filter ${filterByQuarter === 'Q1' ? 'active' : ''}" data-quarter="Q1">Q1</button>
            <button class="quarter-filter ${filterByQuarter === 'Q2' ? 'active' : ''}" data-quarter="Q2">Q2</button>
        `;
    }

    // For annual, no quarter filter is needed




    // Render page with Quartal and Year selection and additional buttons
    content.innerHTML = `
        <h2>Anlage: ${anlageData.name} (Anlagen-Nr: ${anlageData.id})</h2>
        

	<div>
            <label for="quartal-select">Wählen Sie das Prüf-Quartal:</label>

	<label for="quartal-select">Wählen Sie das Prüf-Quartal:</label>
            ${quarterFilterHtml}
            
	<select id="quartal-select">
                <option value="Q1" ${selectedQuartal === 'Q1' ? 'selected' : ''}>Q1</option>
                <option value="Q2" ${selectedQuartal === 'Q2' ? 'selected' : ''}>Q2</option>
                <option value="Q3" ${selectedQuartal === 'Q3' ? 'selected' : ''}>Q3</option>
                <option value="Q4" ${selectedQuartal === 'Q4' ? 'selected' : ''}>Q4</option>
            </select>

            <label for="year-select">Wählen Sie das Prüf-Jahr:</label>
            <select id="year-select">
                ${yearOptions}
            </select>

            <button id="reset-melderpunkte" class="btn-class">Meldepunkte für das Jahr löschen</button>
        </div>
        <div id="quarter-buttons">
        <label for="quarter-filter">Ansichtsfilter:</label>
        <button id="filter-open" class="btn-class">${showOnlyOpen ? "Nur offene werden angezeigt" : "Alle werden angezeigt"}</button>
        <button class="quarter-filter ${filterByQuarter === 'Q1' ? 'active' : ''}" data-quarter="Q1">Q1</button>
        <button class="quarter-filter ${filterByQuarter === 'Q2' ? 'active' : ''}" data-quarter="Q2">Q2</button>
        <button class="quarter-filter ${filterByQuarter === 'Q3' ? 'active' : ''}" data-quarter="Q3">Q3</button>
        <button class="quarter-filter ${filterByQuarter === 'Q4' ? 'active' : ''}" data-quarter="Q4">Q4</button>
        <button class="quarter-filter ${filterByQuarter === null ? 'active' : ''}" data-quarter="all">Alle</button>


	<div style="margin-top:5px">
	<label for="text-field-1">Akku Einbaudatum:</label>
        	<input type="text" id="text-field-1" value="${anlageData.textField1 || ''}" />
	</div>
	<div style="margin-top:5px">
	<label for="text-field-2">Besonderheiten:</label>
        	<input style="width: 25%" "type="text" id="text-field-2" value="${anlageData.textField2 || ''}" />
	</div>
    </div>
        <div id="anlage-pruefung">
            ${anlageData.meldergruppen
                .filter(gruppe => gruppe.meldepunkte.length > 0) // Nur Meldegruppen mit Meldepunkten anzeigen
                .map(
                    (gruppe) => ` 
                <div>
                    <h3>${gruppe.name} ${gruppe.zd ? "(ZD)" : ""} ${gruppe.sm ? "(SM)" : ""}</h3>
                    <div class="melder-container">
                        ${gruppe.meldepunkte
                            .filter((melder) => {
                                // Filter auf Jahr und Quartal anwenden
                                if (filterByQuarter && filterByQuarter !== 'all') {
                                    return (
                                        melder.quartal === filterByQuarter &&
                                        melder.geprüft.hasOwnProperty(selectedJahr) // Nur prüfen, wenn im ausgewählten Jahr geprüft wurde
                                    );
                                }
                                return true; // Ohne Quartalsfilter alle anzeigen
                            })
                            .filter((melder) => {
                                // "Nur offene" Filter anwenden
                                if (showOnlyOpen) {
                                    return !melder.geprüft[selectedJahr]; // Nur ungeprüfte anzeigen
                                }
                                return true;
                            })
                            .map(
                                (melder) => ` 
                            <span>
                                ${melder.id}
                                <input type="checkbox" class="melder-checkbox" data-group="${gruppe.name}" data-melder="${melder.id}" ${melder.geprüft[selectedJahr] ? 'checked' : ''}>
                            </span>
                        `).join('') }
                    </div>
                </div>
            `).join('') }
        </div>
    `;

	// Event listener für die Änderungen der Textfelder
    	document.getElementById("text-field-1").addEventListener("change", async (e) => {
        const newValue = e.target.value;
        await setDoc(doc(db, "anlagen", anlageId), {
            ...anlageData,
            textField1: newValue
        }, { merge: true });
    });

    document.getElementById("text-field-2").addEventListener("change", async (e) => {
        const newValue = e.target.value;
        await setDoc(doc(db, "anlagen", anlageId), {
            ...anlageData,
            textField2: newValue
        }, { merge: true });
    });

    // Event listener for quartal selection
    document.getElementById("quartal-select").addEventListener("change", (e) => {
        selectedQuartal = e.target.value;
    });

    // Event listener for year selection
    document.getElementById("year-select").addEventListener("change", (e) => {
        selectedJahr = parseInt(e.target.value, 10);
        showAnlagePruefung(anlageId); // Re-render with selected year
    });

    // Event listeners für Quartalsfilter
document.querySelectorAll(".quarter-filter").forEach((button) => {
    button.addEventListener("click", (e) => {
        const quarter = e.target.getAttribute("data-quarter");
        filterByQuarter = quarter === 'all' ? null : quarter;

        // Entferne die aktive Klasse von allen Buttons
        document.querySelectorAll(".quarter-filter").forEach((btn) => {
            btn.classList.remove("active");
        });

        // Füge die aktive Klasse dem geklickten Button hinzu
        e.target.classList.add("active");

        showAnlagePruefung(anlageId); // Seite mit dem gewählten Filter neu rendern
    });
});

    // Handle open filter toggle
document.getElementById("filter-open").addEventListener("click", () => {
    showOnlyOpen = !showOnlyOpen;

    const filterOpenButton = document.getElementById("filter-open");
    filterOpenButton.classList.toggle("active", showOnlyOpen); // Active-Klasse basierend auf Zustand

    showAnlagePruefung(anlageId); // Re-render page
});


    // Handle reset melderpunkte button click
    document.getElementById("reset-melderpunkte").addEventListener("click", async () => {
        await resetMelderpunkte(anlageId, anlageData);
    });

   // Handle melder checkbox toggling
document.querySelectorAll(".melder-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", async (e) => {
        const groupName = e.target.getAttribute("data-group");
        const melderId = parseInt(e.target.getAttribute("data-melder"), 10);
        const checked = e.target.checked;

        if (!selectedQuartal) {
            alert("Bitte wählen Sie zuerst das Quartal aus!");
            return;
        }

        const updatedGruppen = anlageData.meldergruppen.map((gruppe) => {
            if (gruppe.name === groupName) {
                return {
                    ...gruppe,
                    meldepunkte: gruppe.meldepunkte.map((melder) => {
                        if (melder.id === melderId) {
                            return {
                                ...melder,
                                geprüft: checked
                                    ? { ...melder.geprüft, [selectedJahr]: true }
                                    : Object.fromEntries(
                                        Object.entries(melder.geprüft).filter(
                                            ([year]) => parseInt(year) !== selectedJahr
                                        )
                                    ),
                                quartal: checked ? selectedQuartal : null,
                            };
                        }
                        return melder;
                    }),
                };
            }
            return gruppe;
        });

        try {
            await setDoc(doc(db, "anlagen", anlageId), {
                ...anlageData,
                meldergruppen: updatedGruppen,
            });

            anlageData.meldergruppen = updatedGruppen;
            showAnlagePruefung(anlageId); // Re-render after update
        } catch (error) {
            alert(`Fehler beim Speichern der Änderungen: ${error.message}`);
        }
    });
});
}


// Helper function to calculate progress for the current year
function calculateProgress(meldergruppen) {
    const currentYear = new Date().getFullYear(); // Aktuelles Jahr ermitteln

    const total = meldergruppen.reduce(
        (sum, gruppe) => sum + gruppe.meldepunkte.length,
        0
    );

    const checked = meldergruppen.reduce(
        (sum, gruppe) =>
            sum +
            gruppe.meldepunkte.filter(
                (melder) => melder.geprüft[currentYear]
            ).length,
        0
    );

    // Verhindert Division durch Null, falls es keine Meldepunkte gibt
    return total > 0 ? ((checked / total) * 100).toFixed(2) : "0.00";
}

// Funktion zum Zurücksetzen der Meldepunkte für das gewählte Jahr
async function resetMelderpunkte(anlageId, anlageData) {
    const updatedGruppen = anlageData.meldergruppen.map((gruppe) => ({
        ...gruppe,
        meldepunkte: gruppe.meldepunkte.map((melder) => ({
            ...melder,
            // Nur das gewählte Jahr zurücksetzen, nicht alle Jahre
            geprüft: {
                ...Object.fromEntries(
                    Object.entries(melder.geprüft).filter(
                        ([year]) => parseInt(year) !== selectedJahr
                    )
                ),
            },
            quartal: melder.quartal === selectedQuartal ? null : melder.quartal,
        })),
    }));

    try {
        await setDoc(doc(db, "anlagen", anlageId), {
            ...anlageData,
            meldergruppen: updatedGruppen,
        });

        alert(`Die Meldepunkte für das Jahr ${selectedJahr} wurden zurückgesetzt.`);
        showAnlagePruefung(anlageId); // Seite nach dem Zurücksetzen neu laden
    } catch (error) {
        alert(`Fehler beim Zurücksetzen der Meldepunkte: ${error.message}`);
    }
}
