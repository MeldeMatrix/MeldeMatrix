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
  doc,
  setDoc,
  updateDoc,
  query,
  where,
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

// DOM Elements
const loginButton = document.getElementById("login-button");
const logoutButton = document.getElementById("logout-button");
const createAnlageButton = document.getElementById("create-anlage-button");
const searchButton = document.getElementById("search-button");
const anlagenContainer = document.getElementById("anlagen-container");
const quartalSelector = document.getElementById("quartal-selector");
const filterOpenButton = document.getElementById("filter-open");
const scrollToTopButton = document.getElementById("scroll-to-top");
const melderContainer = document.getElementById("melder-container");
const currentAnlageHeader = document.getElementById("current-anlage-header");

let currentUser = null;
let currentAnlage = null;
let currentQuartal = "Q1";
let showOnlyOpen = false;

// Monitor Auth State
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    showMainMenu();
  } else {
    currentUser = null;
    showLogin();
  }
});

// Login Function
loginButton?.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Erfolgreich eingeloggt");
  } catch (error) {
    console.error("Fehler beim Anmelden:", error);
    alert("Fehler beim Anmelden: " + error.message);
  }
});

// Logout Function
logoutButton?.addEventListener("click", async () => {
  try {
    await auth.signOut();
    alert("Erfolgreich abgemeldet");
  } catch (error) {
    console.error("Fehler beim Abmelden:", error);
  }
});

// Create Anlage
createAnlageButton?.addEventListener("click", async () => {
  const anlageName = prompt("Name der Anlage eingeben:");
  const anlageID = prompt("Anlagen-ID eingeben:");
  const meldergruppenCount = parseInt(
    prompt("Anzahl der Meldergruppen eingeben (maximal 20):"),
    10
  );

  if (!anlageName || !anlageID || isNaN(meldergruppenCount)) {
    alert("Ungültige Eingaben. Bitte erneut versuchen.");
    return;
  }

  try {
    const meldergruppen = [];
    for (let i = 1; i <= meldergruppenCount; i++) {
      const meldepunkte = Array.from({ length: 32 }, (_, idx) => ({
        id: idx + 1,
        geprüft: false,
        quartal: "",
        timestamp: null,
      }));
      meldergruppen.push({ name: `MG${i}`, meldepunkte });
    }

    await setDoc(doc(db, "anlagen", anlageID), {
      id: anlageID,
      name: anlageName,
      meldergruppen,
    });

    alert("Anlage erfolgreich erstellt");
  } catch (error) {
    console.error("Fehler beim Erstellen der Anlage:", error);
    alert("Fehler beim Erstellen der Anlage: " + error.message);
  }
});

// Search Anlage
searchButton?.addEventListener("click", async () => {
  const searchQuery = document.getElementById("search-input").value.trim();
  if (!searchQuery) {
    alert("Bitte geben Sie einen Suchbegriff ein.");
    return;
  }

  try {
    const q = query(
      collection(db, "anlagen"),
      where("id", "==", searchQuery)
    );
    const querySnapshot = await getDocs(q);

    anlagenContainer.innerHTML = "";
    querySnapshot.forEach((doc) => {
      const anlage = doc.data();
      const div = document.createElement("div");
      div.className = "anlage-item";
      div.textContent = `${anlage.name} (ID: ${anlage.id})`;
      div.addEventListener("click", () => {
        currentAnlage = anlage;
        showAnlageView(anlage);
      });
      anlagenContainer.appendChild(div);
    });

    if (querySnapshot.empty) {
      alert("Keine Anlagen gefunden.");
    }
  } catch (error) {
    console.error("Fehler bei der Suche nach Anlagen:", error);
    alert("Fehler bei der Suche: " + error.message);
  }
});

// Show Main Menu
function showMainMenu() {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("main-menu").style.display = "block";
}

// Show Login Page
function showLogin() {
  document.getElementById("login-section").style.display = "block";
  document.getElementById("main-menu").style.display = "none";
}

// Show Anlage View
function showAnlageView(anlage) {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("anlage-view").style.display = "block";
  currentAnlageHeader.textContent = `Anlage: ${anlage.name} (ID: ${anlage.id})`;

  renderMeldergruppen(anlage.meldergruppen);
}

// Render Meldergruppen
function renderMeldergruppen(meldergruppen) {
  melderContainer.innerHTML = "";
  meldergruppen.forEach((gruppe) => {
    const groupDiv = document.createElement("div");
    groupDiv.className = "meldergruppe";

    const header = document.createElement("h4");
    header.textContent = gruppe.name;
    groupDiv.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "melder-container";

    gruppe.meldepunkte.forEach((melder) => {
      const span = document.createElement("span");
      span.textContent = melder.id;
      const toggleButton = document.createElement("button");
      toggleButton.textContent = melder.geprüft ? "✔️" : "❌";
      toggleButton.className = "toggle-status";

      toggleButton.addEventListener("click", async () => {
        try {
          melder.geprüft = !melder.geprüft;
          melder.quartal = currentQuartal;
          melder.timestamp = melder.geprüft ? new Date().toISOString() : null;

          await updateDoc(doc(db, "anlagen", currentAnlage.id), {
            meldergruppen,
          });

          toggleButton.textContent = melder.geprüft ? "✔️" : "❌";
        } catch (error) {
          console.error("Fehler beim Aktualisieren des Status:", error);
        }
      });

      span.appendChild(toggleButton);
      grid.appendChild(span);
    });

    groupDiv.appendChild(grid);
    melderContainer.appendChild(groupDiv);
  });
}

// Filter Open Points
filterOpenButton?.addEventListener("click", () => {
  showOnlyOpen = !showOnlyOpen;
  filterOpenButton.classList.toggle("active", showOnlyOpen);

  if (currentAnlage) {
    const filteredGroups = currentAnlage.meldergruppen.map((gruppe) => ({
      ...gruppe,
      meldepunkte: gruppe.meldepunkte.filter(
        (melder) => !melder.geprüft || !showOnlyOpen
      ),
    }));
    renderMeldergruppen(filteredGroups);
  }
});

// Scroll-to-Top Functionality
scrollToTopButton?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Quartal Selector
quartalSelector?.addEventListener("change", (e) => {
  currentQuartal = e.target.value;
});
