const tokenKey = "hrs_jwt_token";
const messageBox = document.getElementById("messageBox");
const authState = document.getElementById("authState");
const createForm = document.getElementById("createHouseForm");
const createAuthNote = document.getElementById("createAuthNote");
const guestActions = document.getElementById("guestActions");
const userActions = document.getElementById("userActions");
const authModalTitle = document.getElementById("authModalTitle");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const openLoginBtn = document.getElementById("openLoginBtn");
const openRegisterBtn = document.getElementById("openRegisterBtn");
const addHouseNavItem = document.getElementById("addHouseNavItem");
const myHousesNavItem = document.getElementById("myHousesNavItem");
const authModalElement = document.getElementById("authModal");
const hasBootstrapModal = !!(window.bootstrap && window.bootstrap.Modal);
const authModal = (authModalElement && hasBootstrapModal) ? new window.bootstrap.Modal(authModalElement) : null;

(function () {
    if (typeof hrsGetToken !== "function" || typeof hrsIsAgent !== "function") {
        return;
    }
    const t = hrsGetToken();
    if (t && !hrsIsAgent()) {
        window.location.replace("/index.html");
    }
})();

document.getElementById("logoutBtn")?.addEventListener("click", logout);
loginForm?.addEventListener("submit", login);
registerForm?.addEventListener("submit", register);
createForm?.addEventListener("submit", createHouse);
openLoginBtn?.addEventListener("click", () => openAuthModal("login"));
openRegisterBtn?.addEventListener("click", () => openAuthModal("register"));

updateAuthState();

function showMessage(text, type = "info") {
    messageBox.className = `alert alert-${type} mb-4`;
    messageBox.textContent = text;
    messageBox.classList.remove("d-none");
}

function hideMessage() {
    messageBox.classList.add("d-none");
}

function getToken() {
    return typeof hrsGetToken === "function" ? hrsGetToken() : localStorage.getItem(tokenKey);
}

function updateAuthState() {
    const isLogged = !!getToken();

    if (isLogged) {
        guestActions?.classList.add("d-none");
        userActions?.classList.remove("d-none");
        addHouseNavItem?.classList.remove("d-none");
        myHousesNavItem?.classList.remove("d-none");
    } else {
        guestActions?.classList.remove("d-none");
        userActions?.classList.add("d-none");
        addHouseNavItem?.classList.add("d-none");
        myHousesNavItem?.classList.add("d-none");
    }

    if (createForm) {
        Array.from(createForm.elements).forEach(el => {
            if (el.tagName === "BUTTON" || el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
                el.disabled = !isLogged;
            }
        });
    }

    if (isLogged) {
        createAuthNote?.classList.add("d-none");
    } else {
        createAuthNote?.classList.remove("d-none");
    }
}

function logout() {
    if (typeof hrsClearAuth === "function") {
        hrsClearAuth();
    } else {
        localStorage.removeItem(tokenKey);
    }
    updateAuthState();
    showMessage("Logged out.", "secondary");
}

function openAuthModal(mode) {
    if (!authModal || !authModalTitle || !loginForm || !registerForm) {
        if (!authModalElement || !authModalTitle || !loginForm || !registerForm) {
            return;
        }
    }

    if (mode === "register") {
        authModalTitle.textContent = "Register";
        loginForm.classList.add("d-none");
        registerForm.classList.remove("d-none");
    } else {
        authModalTitle.textContent = "Login";
        registerForm.classList.add("d-none");
        loginForm.classList.remove("d-none");
    }

    showAuthModal();
}

async function login(e) {
    e.preventDefault();
    hideMessage();

    const payload = {
        email: document.getElementById("loginEmail").value.trim(),
        password: document.getElementById("loginPassword").value.trim()
    };

    const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        showMessage("Invalid login credentials.", "danger");
        return;
    }

    const loginResult = await response.json();
    if (typeof hrsSetAuth === "function") {
        hrsSetAuth(loginResult.token, loginResult.roles || []);
    } else {
        localStorage.setItem(tokenKey, loginResult.token);
    }
    updateAuthState();
    hideAuthModal();
    loginForm.reset();
    showMessage("Login successful.", "success");
    if (typeof hrsIsAgent === "function" && !hrsIsAgent()) {
        window.location.replace("/index.html");
    }
}

async function register(e) {
    e.preventDefault();
    hideMessage();

    const payload = {
        username: document.getElementById("registerUsername").value.trim(),
        email: document.getElementById("registerEmail").value.trim(),
        password: document.getElementById("registerPassword").value.trim()
    };

    const response = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        showMessage("Registration failed.", "danger");
        return;
    }

    showMessage("Registration successful. You can now login.", "success");
    registerForm.reset();
    openAuthModal("login");
}

async function createHouse(e) {
    e.preventDefault();
    hideMessage();

    const token = getToken();
    if (!token) {
        showMessage("Login first to create a house.", "warning");
        openAuthModal("login");
        return;
    }

    const payload = {
        title: document.getElementById("houseTitle").value.trim(),
        address: document.getElementById("houseAddress").value.trim(),
        imageUrl: document.getElementById("houseImageUrl").value.trim(),
        description: document.getElementById("houseDescription").value.trim(),
        pricePerMonth: Number(document.getElementById("housePrice").value),
        category: Number(document.getElementById("houseCategory").value)
    };

    const response = await fetch("/api/House", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    if (response.status === 403) {
        showMessage("Only agents can add houses.", "warning");
        return;
    }
    if (!response.ok) {
        showMessage("Create failed. Check data and token.", "danger");
        return;
    }

    window.location.href = "/index.html?created=1";
}

function showAuthModal() {
    if (!authModalElement) {
        return;
    }

    if (authModal) {
        authModal.show();
        return;
    }

    authModalElement.classList.add("show");
    authModalElement.style.display = "block";
    authModalElement.removeAttribute("aria-hidden");
    document.body.classList.add("modal-open");

    let backdrop = document.getElementById("authModalFallbackBackdrop");
    if (!backdrop) {
        backdrop = document.createElement("div");
        backdrop.id = "authModalFallbackBackdrop";
        backdrop.className = "modal-backdrop fade show";
        document.body.appendChild(backdrop);
    }
}

function hideAuthModal() {
    if (!authModalElement) {
        return;
    }

    if (authModal) {
        authModal.hide();
        return;
    }

    authModalElement.classList.remove("show");
    authModalElement.style.display = "none";
    authModalElement.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    const backdrop = document.getElementById("authModalFallbackBackdrop");
    if (backdrop) {
        backdrop.remove();
    }
}

if (authModalElement && !authModal) {
    authModalElement.querySelectorAll('[data-bs-dismiss="modal"], .btn-close')
        .forEach(btn => btn.addEventListener("click", hideAuthModal));

    authModalElement.addEventListener("click", (e) => {
        if (e.target === authModalElement) {
            hideAuthModal();
        }
    });
}
