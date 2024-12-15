// Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

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
    const homePage = document.getElementById("home-page");
    const searchPage = document.getElementById("search-page");
    const createPage = document.getElementById("create-page");
    const overviewPage = document.getElementById("overview-page");
    const anlagenContainer = document.getElementById("anlagen-container");
    const anlageDetailsPage = document.getElementById("anlage-details-page");
    const navbar = document.getElementById("navbar");
    const authSection = document.getElementById("auth-section");

    // Auth state changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            document.getElementById("login-button").style.display = "none";
            document.getElementById("logout-button").style.display = "inline-block";
            showPage(homePage);
        } else {
            document.getElementById("login-button").style.display = "inline-block";
            document.getElementById("logout-button").style.display = "none";
            showPage(homePage);
        }
    });

    // Menu navigation
    document.getElementById("home-link").addEventListener("click", () => showPage(homePage));
    document.getElementById("search-link").addEventListener("click", () => showPage(searchPage));
    document.getElementById("create-link").addEventListener("click", () => showPage(createPage));
    document.getElementById("overview-link").addEventListener("click", () => loadAnlagen());

    // Show the selected page
    function showPage(page) {
        const pages = document.querySelectorAll('.page');
        pages.forEach(p => p.style.display = 'none');
        page.style.display = 'block';
    }

    // Search for an Anlage
    document.getElementById("search-button").addEventListener("click", async () => {
        const searchTerm = document.getElementById("search-input").value;
        const querySnapshot = await getDocs(collection(db, "anlagen"));
        let foundAnlagen = [];
        
        querySnapshot.forEach((doc) => {
            const anlage = doc.data();
            if (anlage.name.includes(searchTerm) || String(anlage.id).includes(searchTerm)) {
                foundAnlagen.push(anlage);
            }
        });

        const resultsDiv = document.getElementById("search-results");
        resultsDiv.innerHTML = "";
        foundAnlagen.forEach(anlage => {
            const anlageDiv = document.createElement("div");
            anlageDiv.className = "anlage";
            anlageDiv.innerHTML = `<h3>${anlage.name}</h3><p>ID: ${anlage.id}</p><button class="view-button" data-id="${anlage.id}">Anlage anzeigen</button>`;
            resultsDiv.appendChild(anlageDiv);
        });
    });

    // Handle view button click for an Anlage
    document.getElementById("search-results").addEventListener("click", async (e) => {
        if (e.target && e.target.classList.contains("view-button")) {
            const anlageId = e.target.getAttribute("data-id");
            await displayAnlageDetails(anlageId);
        }
    });

    // Create a new Anlage
    document.getElementById("create-anlage-button").addEventListener("click", async () => {
        const anlagenName = document.getElementById("anlage-name").value;
        const anlagenNummer = document.getElementById("anlage-number").value;
        const meldegruppenCount = document.getElementById("meldegruppen-count").value;

        if (anlagenName && anlagenNummer && meldegruppenCount) {
            await createAnlage(anlagenNummer, anlagenName, parseInt(meldegruppenCount));
        }
    });

    // Create an Anlage in Firestore
    async function createAnlage(anlagenNummer, name, meldegruppenCount) {
        const meldegruppen = [];
        for (let i = 1; i <= meldegruppenCount; i++) {
            const meldepunkte = [];
            for (let j = 1; j <= 32; j++) {
                meldepunkte.push({
                    id: j,
                    geprüft: false,
                    geprüftAm: null
                });
            }

            meldegruppen.push({
                name: `MG${i}`,
                meldepunkte: meldepunkte
            });
        }

        const anlage = {
            id: anlagenNummer,  // Die Anlagennummer wird als ID genutzt
            name: name,
            meldegruppen: meldegruppen,
            erstelltAm: new Date()
        };

        try {
            await setDoc(doc(db, "anlagen", String(anlage.id)), anlage);
            alert("Anlage erfolgreich erstellt!");
            showPage(homePage);
        } catch (error) {
            console.error("Fehler beim Erstellen der Anlage:", error);
            alert("Fehler beim Erstellen der Anlage");
        }
    }

    // Load all Anlagen
    async function loadAnlagen() {
        const querySnapshot = await getDocs(collection(db, "anlagen"));
        anlagenContainer.innerHTML = "";
        
        querySnapshot.forEach((doc) => {
            const anlage = doc.data();
            const anlageDiv = document.createElement("div");
            anlageDiv.className = "anlage";
            anlageDiv.innerHTML = `<h3>${anlage.name}</h3><p>ID: ${anlage.id}</p><button class="view-button" data-id="${anlage.id}">Anlage anzeigen</button>`;
            anlagenContainer.appendChild(anlageDiv);
        });

        showPage(overviewPage);
    }

    // Show anlage details (display and update)
    async function displayAnlageDetails(anlageId) {
        const anlageRef = doc(db, "anlagen", anlageId);
        const docSnap = await getDoc(anlageRef);

        if (docSnap.exists()) {
            const anlage = docSnap.data();
            const detailsContainer = document.getElementById("anlage-details-container");
            detailsContainer.innerHTML = `<h3>${anlage.name}</h3><p>ID: ${anlage.id}</p>`;
            
            anlage.meldegruppen.forEach(gruppe => {
                const groupDiv = document.createElement("div");
                groupDiv.classList.add("gruppe");
                groupDiv.innerHTML = `<h4>${gruppe.name}</h4><div class="punkte-container"></div>`;

                gruppe.meldepunkte.forEach(punkt => {
                    const punktDiv = document.createElement("div");
                    punktDiv.classList.add("punkt");
                    punktDiv.innerHTML = `
                        <p>ID: ${punkt.id} - Status: ${punkt.geprüft ? "✔️ Geprüft" : "❌ Nicht geprüft"}</p>
                        <button class="check-button" data-id="${punkt.id}" data-gruppe="${gruppe.name}" data-anlage="${anlage.id}">
                            ${punkt.geprüft ? "Status zurücksetzen" : "Als geprüft markieren"}
                        </button>
                    `;
                    groupDiv.querySelector(".punkte-container").appendChild(punktDiv);
                });

                detailsContainer.appendChild(groupDiv);
            });

            showPage(anlageDetailsPage);
        } else {
            console.log("Anlage nicht gefunden!");
        }
    }
    
    // Handling check button for Meldepunkte
    document.getElementById("anlage-details-container").addEventListener("click", async (e) => {
        if (e.target && e.target.classList.contains("check-button")) {
            const punktId = e.target.getAttribute("data-id");
            const gruppeName = e.target.getAttribute("data-gruppe");
            const anlageId = e.target.getAttribute("data-anlage");

            const anlageRef = doc(db, "anlagen", anlageId);
            const docSnap = await getDoc(anlageRef);
            if (docSnap.exists()) {
                const anlage = docSnap.data();
                const gruppe = anlage.meldegruppen.find(gr => gr.name === gruppeName);
                const punkt = gruppe.meldepunkte.find(p => p.id === parseInt(punktId));
                punkt.geprüft = !punkt.geprüft;
                punkt.geprüftAm = punkt.geprüft ? new Date() : null;
                
                await updateDoc(anlageRef, {
                    meldegruppen: anlage.meldegruppen
                });

                displayAnlageDetails(anlageId);  // Refresh page
            }
        }
    });

    // Handle login and logout
    document.getElementById("login-button").addEventListener("click", () => {
        const email = prompt("Email eingeben:");
        const password = prompt("Passwort eingeben:");
        
        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                console.log("Erfolgreich eingeloggt!");
            })
            .catch((error) => {
                console.error("Login fehlgeschlagen:", error);
                alert("Login fehlgeschlagen!");
            });
    });

    document.getElementById("logout-button").addEventListener("click", () => {
        signOut(auth)
            .then(() => {
                console.log("Erfolgreich ausgeloggt!");
            })
            .catch((error) => {
                console.error("Logout fehlgeschlagen:", error);
            });
    });
});
