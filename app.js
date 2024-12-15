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
        const q = query(collection(db, "anlagen"), where("name", "==", searchTerm));
        const querySnapshot = await getDocs(q);
        const resultsContainer = document.getElementById("search-results");

        resultsContainer.innerHTML = "";
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            resultsContainer.innerHTML += `<p>${data.name} - ${data.id}</p>`;
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
        const groupCount = parseInt(document.getElementById("group-count").value, 10);

        const meldergruppen = Array.from({ length: groupCount }, (_, i) => {
            return {
                name: `MG${i + 1}`,
                meldepunkte: Array.from({ length: 32 }, (_, j) => ({
                    id: j + 1,
                    geprüft: false,
                    quartal: null
                }))
            };
        });

        try {
            await setDoc(doc(db, "anlagen", id), { name, id, meldergruppen });
            alert("Anlage erfolgreich erstellt!");
        } catch (error) {
            alert(`Fehler beim Erstellen der Anlage: ${error.message}`);
        }
    });
}
