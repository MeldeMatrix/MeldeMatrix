// Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, setDoc, doc, getDoc, onSnapshot, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);

// Enable Offline Persistence
enableIndexedDbPersistence(db).catch((err) => {
    console.error("Offline-Modus konnte nicht aktiviert werden:", err);
});

// Authentication Functions
export async function login(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Erfolgreich eingeloggt");
    } catch (error) {
        alert("Login fehlgeschlagen: " + error.message);
    }
}

export async function register(email, password) {
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Benutzer registriert");
    } catch (error) {
        alert("Registrierung fehlgeschlagen: " + error.message);
    }
}

// Firestore Functions
export async function addAnlage(anlageId, name) {
    try {
        await setDoc(doc(db, "anlagen", anlageId), {
            name: name,
            meldegruppen: []
        });
        alert(`Anlage '${name}' erfolgreich hinzugefügt.`);
    } catch (error) {
        console.error("Fehler beim Hinzufügen der Anlage:", error);
    }
}

export async function addMeldegruppe(meldegruppeId, anlageId) {
    const melderpunkte = Array.from({ length: 32 }, (_, index) => ({
        nummer: index + 1,
        name: `Meldepunkt ${index + 1}`,
        zd_markiert: false
    }));

    try {
        await setDoc(doc(db, "meldegruppen", meldegruppeId), {
            anlage_id: anlageId,
            melderpunkte: melderpunkte
        });
        alert(`Meldegruppe '${meldegruppeId}' erfolgreich hinzugefügt.`);
    } catch (error) {
        console.error("Fehler beim Hinzufügen der Meldegruppe:", error);
    }
}

export async function addPruefstatus(anlageId, jahr, meldegruppen) {
    const meldegruppenStatus = meldegruppen.map((mg) => ({
        meldegruppe_id: mg.id,
        melderpunkte: mg.melderpunkte.map((mp) => ({ nummer: mp.nummer, geprüft: false }))
    }));

    try {
        await setDoc(doc(db, "prüfstatus", `${anlageId}_${jahr}`), {
            jahr: jahr,
            meldegruppen: meldegruppenStatus
        });
        alert(`Prüfstatus für '${jahr}' erfolgreich hinzugefügt.`);
    } catch (error) {
        console.error("Fehler beim Hinzufügen des Prüfstatus:", error);
    }
}

export async function loadAnlagen(anlageId, jahr) {
    const pruefstatusRef = doc(db, "prüfstatus", `${anlageId}_${jahr}`);
    const docSnapshot = await getDoc(pruefstatusRef);

    if (docSnapshot.exists()) {
        return docSnapshot.data();
    } else {
        alert("Keine Daten gefunden.");
        return null;
    }
}

export function subscribeToPruefstatus(anlageId, jahr, callback) {
    const pruefstatusRef = doc(db, "prüfstatus", `${anlageId}_${jahr}`);
    onSnapshot(pruefstatusRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            callback(docSnapshot.data());
        } else {
            console.log("Keine aktuellen Daten.");
        }
    });
}
