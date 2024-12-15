// Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
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
    const anlageDetailsPage = document.getElementById("anlage-details-page");
    const navbar = document.getElementById("navbar");
    const authSection = document.getElementById("auth-section");
    const scrollTopButton = document.getElementById("scroll-top-button");
    const anlageNameDisplay = document.getElementById("anlage-name-display");
    const quartalSelect = document.getElementById("quartal-select");
    const showOpenPointsCheckbox = document.getElementById("show-open-points");

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

    // Scroll to top button
    scrollTopButton.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

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
            const totalMeldergruppen = anlage.meldegruppen.length;
            const totalPruefungen = anlage.meldegruppen.reduce((sum, gruppe) => {
                return sum + gruppe.meldepunkte.filter(punkt => punkt.geprüft).length;
            }, 0);
            const pruefungsPercentage = ((totalPruefungen / (totalMeldergruppen * 32)) * 100).toFixed(2);

            anlageDiv.innerHTML = `
                <h3>${anlage.name}</h3>
                <p>ID: ${anlage.id}</p>
                <p>Meldergruppen: ${totalMeldergruppen}</p>
                <p>Geprüft: ${totalPruefungen} / ${totalMeldergruppen * 32} (${pruefungsPercentage}%)</p>
                <button class="view-button" data-id="${anlage.id}">Anlage anzeigen</button>
            `;
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
        
        const anlageRef = doc(db, "anlagen", anlagenNummer);
        await setDoc(anlageRef, {
            id: anlagenNummer,
            name: anlagenName,
            meldegruppen: createMeldegruppen(meldegruppenCount),
        });

        alert("Anlage erfolgreich erstellt!");
        showPage(homePage);
    });

    // Helper to create Meldegruppen for the Anlage
    function createMeldegruppen(count) {
        const meldegruppen = [];
        for (let i = 1; i <= count; i++) {
            const meldepunkte = [];
            for (let j = 1; j <= 32; j++) {
                meldepunkte.push({
                    id: j,
                    geprüft: false,
                    geprüftAm: null,
                    quartal: null
                });
            }
            meldegruppen.push({ name: `MG${i}`, meldepunkte });
        }
        return meldegruppen;
    }

    // Display Anlage details
    async function displayAnlageDetails(anlageId) {
        const anlageRef = doc(db, "anlagen", anlageId);
        const docSnap = await getDoc(anlageRef);
        
        if (docSnap.exists()) {
            const anlage = docSnap.data();
            const detailsContainer = document.getElementById("anlage-details-container");
            detailsContainer.innerHTML = '';
            
            anlageNameDisplay.textContent = anlage.name;

            const quartalSelect = document.getElementById("quartal-select");
            const showOpenPoints = document.getElementById("show-open-points");

            anlage.meldegruppen.forEach(gruppe => {
                const groupDiv = document.createElement("div");
                groupDiv.classList.add("meldegruppe");
                groupDiv.innerHTML = `<h4>${gruppe.name}</h4><div class="meldepunkte-container">`;

                gruppe.meldepunkte.forEach(punkt => {
                    if (!showOpenPoints.checked || !punkt.geprüft) {
                        const punktDiv = document.createElement("div");
                        punktDiv.classList.add("meldepunkt");
                        punktDiv.classList.add(punkt.geprüft ? 'checked' : 'not-checked');
                        punktDiv.textContent = punkt.id;

                        // Add click handler to toggle checked status
                        punktDiv.addEventListener("click", async () => {
                            punkt.geprüft = !punkt.geprüft;
                            punkt.geprüftAm = punkt.geprüft ? new Date() : null;
                            punkt.quartal = quartalSelect.value;

                            await updateDoc(anlageRef, {
                                meldegruppen: anlage.meldegruppen
                            });

                            displayAnlageDetails(anlageId);  // Refresh the details view
                        });

                        groupDiv.querySelector(".meldepunkte-container").appendChild(punktDiv);
                    }
                });

                detailsContainer.appendChild(groupDiv);
            });

            showPage(anlageDetailsPage);
        } else {
            console.log("Anlage nicht gefunden!");
        }
    }
});
