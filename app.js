// Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  setDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAN2ZXKYzFoJ0o__qAyVxubjit3wrlEGlo",
  authDomain: "meldepunktpro.firebaseapp.com",
  projectId: "meldepunktpro",
  storageBucket: "meldepunktpro.appspot.com",
  messagingSenderId: "1084931878712",
  appId: "1:1084931878712:web:bfa5e31c03fad5e1015bcd",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOMContentLoaded Event Listener
document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("content");

  onAuthStateChanged(auth, (user) => {
    if (user) {
      showStartPage();
    } else {
      showLoginPage();
    }
  });
});

// Login Page Function
function showLoginPage() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <h2>Login</h2>
    <input type="email" id="email" placeholder="E-Mail" />
    <input type="password" id="password" placeholder="Passwort" />
    <button id="login-button">Einloggen</button>
    <button id="register-button">Registrieren</button>
  `;

  document.getElementById("login-button").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert("Fehler beim Anmelden: " + error.message);
    }
  });

  document
    .getElementById("register-button")
    .addEventListener("click", async () => {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Registrierung erfolgreich");
      } catch (error) {
        alert("Fehler bei der Registrierung: " + error.message);
      }
    });
}

// Start Page Function
function showStartPage() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <h2>Willkommen im Anlagenmanager</h2>
    <button id="search-anlage">Anlage suchen</button>
    <button id="create-anlage">Neue Anlage erstellen</button>
  `;

  document.getElementById("search-anlage").addEventListener("click", showSearchAnlage);
  document.getElementById("create-anlage").addEventListener("click", showCreateAnlage);
}

// Search Anlage Function
function showSearchAnlage() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <h2>Anlage suchen</h2>
    <input type="text" id="search-input" placeholder="Name oder ID eingeben" />
    <button id="search-button">Suchen</button>
    <div id="search-results"></div>
  `;

  document.getElementById("search-button").addEventListener("click", async () => {
    const query = document.getElementById("search-input").value;
    const resultsDiv = document.getElementById("search-results");

    const querySnapshot = await getDocs(collection(db, "anlagen"));
    const results = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.name.includes(query) || data.id.includes(query)) {
        results.push(data);
      }
    });

    resultsDiv.innerHTML = results
      .map(
        (anlage) => `
          <div>
            <h3>${anlage.name} (ID: ${anlage.id})</h3>
            <button onclick="showAnlagePruefung('${anlage.id}')">Prüfen</button>
          </div>
        `
      )
      .join("");
  });
}

// Create Anlage Function
function showCreateAnlage() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <h2>Neue Anlage erstellen</h2>
    <input type="text" id="anlage-name" placeholder="Anlagenname" />
    <input type="text" id="anlage-id" placeholder="Anlagen-ID" />
    <input type="number" id="gruppe-count" placeholder="Anzahl Meldergruppen" min="1" />
    <button id="create-button">Erstellen</button>
  `;

  document.getElementById("create-button").addEventListener("click", async () => {
    const name = document.getElementById("anlage-name").value;
    const id = document.getElementById("anlage-id").value;
    const gruppeCount = parseInt(document.getElementById("gruppe-count").value, 10);

    const meldergruppen = Array.from({ length: gruppeCount }, (_, i) => ({
      name: `MG${i + 1}`,
      meldepunkte: Array.from({ length: 32 }, (_, j) => ({
        id: j + 1,
        geprüft: false,
        quartal: null,
      })),
    }));

    try {
      await setDoc(doc(db, "anlagen", id), {
        id,
        name,
        meldergruppen,
      });
      alert("Anlage erfolgreich erstellt!");
      showStartPage();
    } catch (error) {
      alert("Fehler beim Erstellen der Anlage: " + error.message);
    }
  });
}

// Show Prüfung Page
async function showAnlagePruefung(anlageId) {
  const anlageDoc = await getDoc(doc(db, "anlagen", anlageId));
  if (!anlageDoc.exists()) {
    alert("Anlage nicht gefunden!");
    return;
  }

  const anlageData = anlageDoc.data();

  // Initial Rendering of the Prüfung Page
  renderPruefungsPage(anlageData);

  // Event Listener for the "Nur offene Punkte" Filter
  document.getElementById("filter-open").addEventListener("click", () => {
    const showOnlyOpen = document
      .getElementById("filter-open")
      .classList.toggle("active");
    renderPruefungsPage(anlageData, showOnlyOpen);
  });

  // Event Listener for Prüfstatus Änderungen
  document.querySelectorAll(".toggle-status").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const groupName = e.target.getAttribute("data-group");
      const melderId = parseInt(e.target.getAttribute("data-melder"), 10);
      const currentStatus = e.target.getAttribute("data-status") === "true";
      const quartal = document.getElementById("quartal-selector").value;

      try {
        // Update Prüfstatus im Datenbank
        const updatedGruppen = anlageData.meldergruppen.map((gruppe) => {
          if (gruppe.name === groupName) {
            return {
              ...gruppe,
              meldepunkte: gruppe.meldepunkte.map((melder) => {
                if (melder.id === melderId) {
                  return {
                    ...melder,
                    geprüft: !currentStatus,
                    quartal: !currentStatus ? quartal : null,
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

        // Update UI ohne Popup
        anlageData.meldergruppen = updatedGruppen;
        renderPruefungsPage(
          anlageData,
          document.getElementById("filter-open").classList.contains("active")
        );
      } catch (error) {
        alert(`Fehler beim Aktualisieren des Prüfstatus: ${error.message}`);
      }
    });
  });
}

// Helper Function: Render Prüfung Page
function renderPruefungsPage(anlageData, showOnlyOpen = false) {
  const content = document.getElementById("content");

  // Filter Meldergruppen basierend auf dem Status
  const filteredGruppen = showOnlyOpen
    ? anlageData.meldergruppen.map((gruppe) => ({
          ...gruppe,
          meldepunkte: gruppe.meldepunkte.filter((melder) => !melder.geprüft),
      }))
    : anlageData.meldergruppen;

  content.innerHTML = `
      <h2>Anlage: ${anlageData.name} (ID: ${anlageData.id})</h2>
      <select id="quartal-selector">
          <option value="Q1">Q1</option>
          <option value="Q2">Q2</option>
          <option value="Q3">Q3</option>
          <option value="Q4">Q4</option>
      </select>
      <button id="filter-open" class="${showOnlyOpen ? "active" : ""}">
          Nur offene Punkte anzeigen
      </button>
      <div id="anlage-pruefung">
          ${filteredGruppen
            .map(
              (gruppe) => `
              <div>
                  <h3>${gruppe.name}</h3>
                  <div class="melder-container">
                      ${gruppe.meldepunkte
                        .map(
                          (melder) => `
                          <span>
                              ${melder.id}
                              <button class="toggle-status" data-group="${
                                gruppe.name
                              }" data-melder="${melder.id}" data-status="${
                                melder.geprüft
                              }">
                                  ${melder.geprüft ? "✔️" : "❌"}
                              </button>
                          </span>
