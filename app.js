// Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

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

document.addEventListener("DOMContentLoaded", () => {
    const homePage = document.getElementById("home-page");
    const searchPage = document.getElementById("search-page");
    const createPage = document.getElementById("create-page");
    const anlageDetailsPage = document.getElementById("anlage-details-page");
    const navbar = document.getElementById("navbar");
    const authSection = document.getElementById("auth-section");
    const scrollTopButton = document.getElementById("scroll-top-button");

    const emailInput = document.getElementById("email-input");
    const passwordInput = document.getElementById("password-input");

    // Auth state changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User logged in
            document.getElementById("login-button").style.display = "none";
            document.getElementById("logout-button").style.display = "inline-block";
            showPage(homePage);
        } else {
            // User not logged in
            document.getElementById("login-button").style.display = "inline-block";
            document.getElementById("logout-button").style.display = "none";
            showPage(homePage);
        }
    });

    // Login Button Click Handler
    document.getElementById("login-button").addEventListener("click", () => {
        const email = emailInput.value;
        const password = passwordInput.value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // User logged in
                const user = userCredential.user;
                alert(`Willkommen, ${user.email}`);
                showPage(homePage);
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                alert(`Fehler beim Anmelden: ${errorMessage}`);
            });
    });

    // Logout Button Click Handler
    document.getElementById("logout-button").addEventListener("click", () => {
        signOut(auth)
            .then(() => {
                alert("Erfolgreich abgemeldet");
                showPage(homePage);
            })
            .catch((error) => {
                alert("Fehler beim Abmelden");
            });
    });

    // Show the selected page
    function showPage(page) {
        const pages = document.querySelectorAll('.page');
        pages.forEach(p => p.style.display = 'none');
        page.style.display = 'block';
    }

    // Scroll to top button
    scrollTopButton.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Handle 'Anlage erstellen' button
    document.getElementById("create-anlage-button").addEventListener("click", () => {
        const anlagenName = document.getElementById("anlagen-name").value;
        const anlagenNummer = document.getElementById("anlagen-nummer").value;
        const meldegruppenCount = document.getElementById("meldegruppen-count").value;

        if (anlagenName && anlagenNummer && meldegruppenCount) {
            createAnlage(anlagenName, anlagenNummer, parseInt(meldegruppenCount));
        }
    });
    
    // Create new Anlage in Firestore
    async function createAnlage(name, nummer, meldergruppenCount) {
        const db = getFirestore(app);
        const docRef = await addDoc(collection(db, "anlagen"), {
            name: name,
            id: nummer,
            meldegruppenCount: meldergruppenCount,
            meldergruppen: createMeldergruppen(meldergruppenCount)
        });

        alert("Anlage erfolgreich erstellt!");
        showPage(homePage);
    }

    // Generate Meldergruppen for Anlage
    function createMeldergruppen(count) {
        const meldergruppen = [];
        for (let i = 1; i <= count; i++) {
            meldergruppen.push({
                name: `MG${i}`,
                meldepunkte: Array(32).fill({ geprüft: false, quartal: "" })
            });
        }
        return meldergruppen;
    }
});
