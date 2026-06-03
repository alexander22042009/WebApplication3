const tokenKey = "hrs_jwt_token";
const messageBox = document.getElementById("messageBox");
const authState = document.getElementById("authState");
const myHousesGrid = document.getElementById("myHousesGrid");
const guestActions = document.getElementById("guestActions");
const userActions = document.getElementById("userActions");
const addHouseNavItem = document.getElementById("addHouseNavItem");
const myHousesNavItem = document.getElementById("myHousesNavItem");
const authModalTitle = document.getElementById("authModalTitle");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const openLoginBtn = document.getElementById("openLoginBtn");
const openRegisterBtn = document.getElementById("openRegisterBtn");
const editHouseForm = document.getElementById("editHouseForm");
const myHousesSearchInput = document.getElementById("myHousesSearchInput");
const myHousesSearchBtn = document.getElementById("myHousesSearchBtn");
const myHousesClearBtn = document.getElementById("myHousesClearBtn");
const myHousesPagination = document.getElementById("myHousesPagination");

const authModalElement = document.getElementById("authModal");
const editHouseModalElement = document.getElementById("editHouseModal");
const hasBootstrapModal = !!(window.bootstrap && window.bootstrap.Modal);
const authModal = (authModalElement && hasBootstrapModal) ? new window.bootstrap.Modal(authModalElement) : null;
const editHouseModal = (editHouseModalElement && hasBootstrapModal) ? new window.bootstrap.Modal(editHouseModalElement) : null;
const myHousesState = {
    page: 1,
    pageSize: 6,
    search: ""
};

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
openLoginBtn?.addEventListener("click", () => openAuthModal("login"));
openRegisterBtn?.addEventListener("click", () => openAuthModal("register"));
editHouseForm?.addEventListener("submit", submitEdit);
myHousesSearchBtn?.addEventListener("click", applyMyHousesSearch);
myHousesClearBtn?.addEventListener("click", clearMyHousesSearch);
myHousesSearchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        applyMyHousesSearch();
    }
});

updateAuthState();
loadMyHouses();

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
    const agent = typeof hrsIsAgent === "function" && hrsIsAgent();
    const customer = typeof hrsIsCustomer === "function" && hrsIsCustomer();
    if (authState) {
        if (!isLogged) {
            authState.textContent = "Guest";
            authState.className = "badge text-bg-secondary";
        } else if (agent) {
            authState.textContent = "Agent";
            authState.className = "badge text-bg-primary";
        } else if (customer) {
            authState.textContent = "Customer";
            authState.className = "badge text-bg-info";
        } else {
            authState.textContent = "Logged In";
            authState.className = "badge text-bg-success";
        }
    }

    if (isLogged) {
        guestActions?.classList.add("d-none");
        userActions?.classList.remove("d-none");
        if (agent) {
            addHouseNavItem?.classList.remove("d-none");
            myHousesNavItem?.classList.remove("d-none");
        } else {
            addHouseNavItem?.classList.add("d-none");
            myHousesNavItem?.classList.add("d-none");
        }
    } else {
        guestActions?.classList.remove("d-none");
        userActions?.classList.add("d-none");
        addHouseNavItem?.classList.add("d-none");
        myHousesNavItem?.classList.add("d-none");
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
    loadMyHouses();
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
        return;
    }
    loadMyHouses();
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

async function loadMyHouses() {
    const token = getToken();
    if (!token) {
        myHousesGrid.innerHTML = `<div class="col-12"><div class="alert alert-warning">Login required to use My Houses.</div></div>`;
        if (myHousesPagination) {
            myHousesPagination.innerHTML = "";
        }
        return;
    }

    const query = new URLSearchParams({
        page: String(myHousesState.page),
        pageSize: String(myHousesState.pageSize),
        search: myHousesState.search
    });

    const response = await fetch(`/api/House/Mine?${query.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (response.status === 403) {
        window.location.replace("/index.html");
        return;
    }
    if (!response.ok) {
        myHousesGrid.innerHTML = `<div class="col-12"><div class="alert alert-danger">Could not load your houses.</div></div>`;
        if (myHousesPagination) {
            myHousesPagination.innerHTML = "";
        }
        return;
    }

    const result = await response.json();
    const houses = Array.isArray(result) ? result : (result.items ?? []);
    const totalCount = Array.isArray(result) ? houses.length : (result.totalCount ?? houses.length);
    const totalPages = Math.max(1, Math.ceil(totalCount / myHousesState.pageSize));

    if (!houses.length) {
        myHousesGrid.innerHTML = `<div class="col-12"><div class="alert alert-info">You have no houses...</div></div>`;
        renderMyHousesPagination(totalCount, totalPages);
        return;
    }

    myHousesGrid.innerHTML = houses.map(h => `
        <div class="col-12 col-sm-6 col-lg-4">
            <div class="card house-card h-100 shadow-sm">
                <img src="${h.imageUrl}" class="card-img-top" alt="${escapeHtml(h.title)}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${escapeHtml(h.title)}</h5>
                    <p class="card-text mb-1">${escapeHtml(h.address)}</p>
                    <p class="small text-muted mb-3">$${Number(h.pricePerMonth || 0).toFixed(2)}/month</p>
                    <div class="d-grid gap-2 mt-auto">
                        <button class="btn btn-outline-primary" onclick="openEditModal(${h.id})">Edit</button>
                        <button class="btn btn-outline-danger" onclick="deleteHouse(${h.id})">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    `).join("");

    renderMyHousesPagination(totalCount, totalPages);
}

async function openEditModal(id) {
    const token = getToken();
    const response = await fetch(`/api/House/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) {
        showMessage("House not found.", "warning");
        return;
    }

    const h = await response.json();
    document.getElementById("editHouseId").value = h.id;
    document.getElementById("editTitle").value = h.title ?? "";
    document.getElementById("editAddress").value = h.address ?? "";
    document.getElementById("editImageUrl").value = h.imageUrl ?? "";
    document.getElementById("editDescription").value = h.description ?? "";
    document.getElementById("editPricePerMonth").value = h.pricePerMonth ?? 0;
    document.getElementById("editCategory").value = String(h.category ?? 1);
    showEditHouseModal();
}

async function submitEdit(e) {
    e.preventDefault();
    hideMessage();

    const token = getToken();
    const id = document.getElementById("editHouseId").value;

    const payload = {
        id: Number(id),
        title: document.getElementById("editTitle").value.trim(),
        address: document.getElementById("editAddress").value.trim(),
        imageUrl: document.getElementById("editImageUrl").value.trim(),
        description: document.getElementById("editDescription").value.trim(),
        pricePerMonth: Number(document.getElementById("editPricePerMonth").value),
        category: Number(document.getElementById("editCategory").value)
    };

    const response = await fetch(`/api/House/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        showMessage("Edit failed.", "danger");
        return;
    }

    hideEditHouseModal();
    showMessage("House updated successfully.", "success");
    loadMyHouses();
}

async function deleteHouse(id) {
    hideMessage();

    const confirmed = window.confirm("Are you sure you want to delete this house?");
    if (!confirmed) {
        return;
    }

    const token = getToken();
    const response = await fetch(`/api/House/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        showMessage("Delete failed.", "danger");
        return;
    }

    showMessage("House deleted successfully.", "success");
    loadMyHouses();
}

function applyMyHousesSearch() {
    myHousesState.search = myHousesSearchInput?.value.trim() ?? "";
    myHousesState.page = 1;
    loadMyHouses();
}

function clearMyHousesSearch() {
    if (myHousesSearchInput) {
        myHousesSearchInput.value = "";
    }
    myHousesState.search = "";
    myHousesState.page = 1;
    loadMyHouses();
}

function renderMyHousesPagination(totalCount, totalPages) {
    if (!myHousesPagination) {
        return;
    }

    if (totalCount === 0) {
        myHousesPagination.innerHTML = "";
        return;
    }

    const prevDisabled = myHousesState.page <= 1 ? "disabled" : "";
    const nextDisabled = myHousesState.page >= totalPages ? "disabled" : "";

    myHousesPagination.innerHTML = `
        <button class="btn btn-outline-secondary btn-sm" id="myHousesPrevBtn" ${prevDisabled}>Prev</button>
        <span class="small text-muted">Page ${myHousesState.page} of ${totalPages}</span>
        <button class="btn btn-outline-secondary btn-sm" id="myHousesNextBtn" ${nextDisabled}>Next</button>
    `;

    document.getElementById("myHousesPrevBtn")?.addEventListener("click", () => {
        if (myHousesState.page > 1) {
            myHousesState.page -= 1;
            loadMyHouses();
        }
    });

    document.getElementById("myHousesNextBtn")?.addEventListener("click", () => {
        if (myHousesState.page < totalPages) {
            myHousesState.page += 1;
            loadMyHouses();
        }
    });
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
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
    addFallbackBackdrop("authModalFallbackBackdrop");
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
    removeFallbackBackdrop("authModalFallbackBackdrop");
}

function showEditHouseModal() {
    if (!editHouseModalElement) {
        return;
    }

    if (editHouseModal) {
        editHouseModal.show();
        return;
    }

    editHouseModalElement.classList.add("show");
    editHouseModalElement.style.display = "block";
    editHouseModalElement.removeAttribute("aria-hidden");
    document.body.classList.add("modal-open");
    addFallbackBackdrop("editHouseModalFallbackBackdrop");
}

function hideEditHouseModal() {
    if (!editHouseModalElement) {
        return;
    }

    if (editHouseModal) {
        editHouseModal.hide();
        return;
    }

    editHouseModalElement.classList.remove("show");
    editHouseModalElement.style.display = "none";
    editHouseModalElement.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    removeFallbackBackdrop("editHouseModalFallbackBackdrop");
}

function addFallbackBackdrop(id) {
    let backdrop = document.getElementById(id);
    if (!backdrop) {
        backdrop = document.createElement("div");
        backdrop.id = id;
        backdrop.className = "modal-backdrop fade show";
        document.body.appendChild(backdrop);
    }
}

function removeFallbackBackdrop(id) {
    const backdrop = document.getElementById(id);
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

if (editHouseModalElement && !editHouseModal) {
    editHouseModalElement.querySelectorAll('[data-bs-dismiss="modal"], .btn-close')
        .forEach(btn => btn.addEventListener("click", hideEditHouseModal));

    editHouseModalElement.addEventListener("click", (e) => {
        if (e.target === editHouseModalElement) {
            hideEditHouseModal();
        }
    });
}

window.openEditModal = openEditModal;
window.deleteHouse = deleteHouse;
