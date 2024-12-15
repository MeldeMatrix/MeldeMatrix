// Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, query, where, updateDoc, doc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

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
const loginButton = document.getElementById("login-button");
const logoutButton = document.getElementById("logout-button");
const searchSubmit = document.getElementById("search-submit");
const createSubmit = document.getElementById("create-submit");
const content = document.getElementById("content");
const currentAnlage = document.getElementById("current-anlage");

// Monitor Auth State
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById("auth-section").style.display = "none";
        document.getElementById("menu-section").style.display = "block";
    } else {
        document.getElementById("auth-section").style.display = "block";
        document.getElementById("menu-section").style.display = "none";
        content.innerHTML = "<p>Bitte loggen Sie sich ein.</p>";
    }
});

// Login Function
loginButton.addEventListener("click", async () => {
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
logoutButton.addEventListener("click", async () => {
    try {
        await auth.signOut();
        alert("Erfolgreich ausgeloggt");
    } catch (error) {
        console.error("Fehler beim Abmelden:", error);
        alert("Fehler beim Abmelden: " + error.message);
    }
});

// Search Function
searchSubmit.addEventListener("click", async () => {
    const searchInput = document.getElementById("search-input").value.trim();

    if (!searchInput) {
        alert("Bitte geben Sie eine Anlagennummer oder einen Anlagennamen ein.");
        return;
    }

    try {
        const collectionRef = collection(db, "anlagen");

        // Queries for Anlage by ID or Name
        const qId = query(collectionRef, where("anlageId", "==", searchInput));
        const qName = query(collectionRef, where("name", "==", searchInput));

        const [idSnapshot, nameSnapshot] = await Promise.all([
            getDocs(qId),
            getDocs(qName)
        ]);

        if (!idSnapshot.empty) {
            idSnapshot.forEach((doc) => renderAnlage(doc.data()));
        } else if (!nameSnapshot.empty) {
            nameSnapshot.forEach((doc) => renderAnlage(doc.data()));
        } else {
            alert("Keine Anlage gefunden.");
        }
    } catch (error) {
        console.error("Fehler bei der Suche nach der Anlage:", error);
        alert("Fehler bei der Suche nach der Anlage.");
    }
});

// Create Function
createSubmit.addEventListener("click", async () => {
    const name = document.getElementById("create-name").value.trim();
    const anlageId = document.getElementById("create-id").value.trim();
    const groupCount = parseInt(document.getElementById("create-groups").value, 10);

    if (!name || !anlageId || isNaN(groupCount) || groupCount <= 0) {
        alert("Bitte geben Sie gültige Werte ein.");
        return;
    }

    try {
        const meldergruppen = Array.from({ length: groupCount }, (_, i) => ({
            name: `MG${i + 1}`,
            meldepunkte: Array.from({ length: 32 }, (_, j) => ({
                id: j + 1,
                geprüft: false,
                prüfquartal: ""
            }))
        }));

        await addDoc(collection(db, "anlagen"), {
            anlageId,
            name,
            meldergruppenCount: groupCount,
            meldergruppen
        });

        alert("Anlage erfolgreich erstellt.");
    } catch (error) {
        console.error("Fehler beim Erstellen der Anlage:", error);
        alert("Fehler beim Erstellen der Anlage.");
    }
});

// Render Anlage Function
function renderAnlage(anlage) {
    content.innerHTML = `<h2>Anlage: ${anlage.name}</h2>`;
    currentAnlage.textContent = `Aktuelle Anlage: ${anlage.name}`;

    const grid = document.createElement("div");
    grid.classList.add("grid");

    anlage.meldergruppen.forEach((gruppe) => {
        const groupDiv = document.createElement("div");
        groupDiv.classList.add("meldergruppe");

        groupDiv.innerHTML = `<h3>${gruppe.name}</h3>`;
        const melderpunkte = document.createElement("div");
        melderpunkte.classList.add("melderpunkte");

        gruppe.meldepunkte.forEach((punkt) => {
            const punktDiv = document.createElement("button");
            punktDiv.textContent = punkt.id;
            punktDiv.classList.add(punkt.geprüft ? "checked" : "unchecked");
            punktDiv.addEventListener("click", async () => {
                try {
                    const docRef = doc(db, "anlagen", anlage.anlageId);
                    punkt.geprüft = !punkt.geprüft;
                    punkt.prüfquartal = punkt.geprüft ? document.getElementById("quartal-select").value : "";

                    await updateDoc(docRef, { meldergruppen: anlage.meldergruppen });

                    punktDiv.classList.toggle("checked", punkt.geprüft);
                    punktDiv.classList.toggle("unchecked", !punkt.geprüft);
                } catch (error) {
                    console.error("Fehler beim Aktualisieren des Status:", error);
                    alert("Fehler beim Aktualisieren des Status.");
                }
            });
            melderpunkte.appendChild(punktDiv);
        });

        groupDiv.appendChild(melderpunkte);
        grid.appendChild(groupDiv);
    });

    content.appendChild(grid);
}
