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

    const emailInput = document.getElementById("email-input");
    const passwordInput = document.getElementById("password-input");

    // Firebase Auth instance
    const auth = getAuth(app);

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

    // Menu Navigation
    document.getElementById("home-link").addEventListener("click", () => showPage(homePage));
    document.getElementById("search-link").addEventListener("click", () => showPage(searchPage));
    document.getElementById("create-link").addEventListener("click", () => showPage(createPage));

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

    // Handle login form visibility
    function showLoginForm() {
        const loginForm = document.getElementById("login-form");
        loginForm.style.display = "block";
    }

    // Handle login form hiding
    function hideLoginForm() {
        const loginForm = document.getElementById("login-form");
        loginForm.style.display = "none";
    }
});
