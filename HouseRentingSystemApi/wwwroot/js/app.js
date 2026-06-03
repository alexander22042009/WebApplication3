const tokenKey = "hrs_jwt_token";
const housesGrid = document.getElementById("housesGrid");
const messageBox = document.getElementById("messageBox");
const authState = document.getElementById("authState");
const guestActions = document.getElementById("guestActions");
const userActions = document.getElementById("userActions");
const authModalTitle = document.getElementById("authModalTitle");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const openLoginBtn = document.getElementById("openLoginBtn");
const openRegisterBtn = document.getElementById("openRegisterBtn");
const addHouseNavItem = document.getElementById("addHouseNavItem");
const myHousesNavItem = document.getElementById("myHousesNavItem");
const housesSearchInput = document.getElementById("housesSearchInput");
const housesSearchBtn = document.getElementById("housesSearchBtn");
const housesClearBtn = document.getElementById("housesClearBtn");
const housesCategoryFilter = document.getElementById("housesCategoryFilter");
const housesPriceFilter = document.getElementById("housesPriceFilter");
const housesPagination = document.getElementById("housesPagination");
const authModalElement = document.getElementById("authModal");
const deleteHouseModalElement = document.getElementById("deleteHouseModal");
const deleteHouseModalText = document.getElementById("deleteHouseModalText");
const deleteHouseConfirmBtn = document.getElementById("deleteHouseConfirmBtn");
const hasBootstrapModal = !!(window.bootstrap && window.bootstrap.Modal);
const authModal = (authModalElement && hasBootstrapModal) ? new window.bootstrap.Modal(authModalElement) : null;
const deleteHouseModal = (deleteHouseModalElement && hasBootstrapModal) ? new window.bootstrap.Modal(deleteHouseModalElement) : null;
let pendingDeleteHouseId = null;
const housesState = {
    page: 1,
    pageSize: 6,
    search: "",
    category: "",
    minPrice: "",
    maxPrice: ""
};

document.getElementById("refreshBtn")?.addEventListener("click", loadHouses);
document.getElementById("logoutBtn")?.addEventListener("click", logout);
deleteHouseConfirmBtn?.addEventListener("click", executeDeleteHouse);
loginForm?.addEventListener("submit", login);
registerForm?.addEventListener("submit", register);
openLoginBtn?.addEventListener("click", () => openAuthModal("login"));
openRegisterBtn?.addEventListener("click", () => openAuthModal("register"));
housesSearchBtn?.addEventListener("click", applyHousesSearch);
housesClearBtn?.addEventListener("click", clearHousesSearch);
housesCategoryFilter?.addEventListener("change", async () => {
    housesState.category = housesCategoryFilter.value;
    housesState.page = 1;
    await loadPriceRanges(housesState.category);
    housesState.minPrice = "";
    housesState.maxPrice = "";
    if (housesPriceFilter) {
        housesPriceFilter.value = "";
    }
    loadHouses();
});
housesPriceFilter?.addEventListener("change", () => {
    const [minPrice, maxPrice] = (housesPriceFilter.value || "").split("-");
    housesState.minPrice = minPrice || "";
    housesState.maxPrice = maxPrice || "";
    housesState.page = 1;
    loadHouses();
});
housesSearchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        applyHousesSearch();
    }
});

updateAuthState();
initializePage();
showCreateSuccessFromQuery();

async function initializePage() {
    await loadCategories();
    await loadPriceRanges();
    await loadHouses();
}

function showMessage(text, type = "info") {
    messageBox.className = `alert alert-${type} mt-3`;
    messageBox.textContent = text;
    messageBox.classList.remove("d-none");
}

function hideMessage() {
    messageBox.classList.add("d-none");
}

function showCreateSuccessFromQuery() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("created") === "1") {
        showMessage("House created successfully.", "success");
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }
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

async function loadHouses() {
    housesGrid.innerHTML = `<div class="col-12"><div class="alert alert-light">Loading houses...</div></div>`;
    try {
        const query = new URLSearchParams({
            page: String(housesState.page),
            pageSize: String(housesState.pageSize)
        });
        if (housesState.search) {
            query.set("search", housesState.search);
        }
        if (housesState.category) {
            query.set("category", housesState.category);
        }
        if (housesState.minPrice) {
            query.set("minPrice", housesState.minPrice);
        }
        if (housesState.maxPrice) {
            query.set("maxPrice", housesState.maxPrice);
        }

        const response = await fetch(`/api/House/All?${query.toString()}`);
        if (!response.ok) {
            housesGrid.innerHTML = `<div class="col-12"><div class="alert alert-danger">Could not load houses.</div></div>`;
            if (housesPagination) {
                housesPagination.innerHTML = "";
            }
            return;
        }

        const result = await response.json();
        const houses = Array.isArray(result) ? result : (result.items ?? []);
        const totalCount = Array.isArray(result) ? houses.length : (result.totalCount ?? houses.length);
        const totalPages = Math.max(1, Math.ceil(totalCount / housesState.pageSize));

        if (!houses.length) {
            housesGrid.innerHTML = `<div class="col-12"><div class="alert alert-secondary">No houses available.</div></div>`;
            renderHousesPagination(totalCount, totalPages);
            return;
        }

        const agent = typeof hrsIsAgent === "function" && hrsIsAgent();
        const customer = typeof hrsIsCustomer === "function" && hrsIsCustomer();
        const trashIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg>`;

        housesGrid.innerHTML = houses.map(h => {
            const favoriteBtn = customer
                ? `<button class="btn btn-outline-success w-100 mt-2" type="button" onclick="reserveHouse(${h.id})">Add to favorites</button>`
                : "";
            const deleteBtn = agent
                ? `<button class="btn btn-outline-danger house-delete-btn" type="button" title="Delete house" aria-label="Delete house" onclick="openDeleteHouseModal(${h.id}, '${escapeJsString(h.title)}')">${trashIcon}</button>`
                : "";
            return `
            <div class="col-12 col-sm-6 col-lg-4">
                <div class="card house-card h-100 shadow-sm">
                    <img src="${h.imageUrl}" class="card-img-top" alt="${escapeHtml(h.title)}">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${escapeHtml(h.title)}</h5>
                        <p class="card-text mb-1">${escapeHtml(h.address)}</p>
                        <p class="small text-muted mb-3">$${Number(h.pricePerMonth || 0).toFixed(2)}/month</p>
                        <div class="house-card-actions mt-auto">
                            <button class="btn btn-outline-primary" type="button" onclick="showDetails(${h.id})">Details</button>
                            ${deleteBtn}
                        </div>
                        ${favoriteBtn}
                    </div>
                </div>
            </div>
        `;
        }).join("");

        renderHousesPagination(totalCount, totalPages);
    } catch {
        housesGrid.innerHTML = `<div class="col-12"><div class="alert alert-danger">Error while loading houses.</div></div>`;
        if (housesPagination) {
            housesPagination.innerHTML = "";
        }
    }
}

function applyHousesSearch() {
    housesState.search = housesSearchInput?.value.trim() ?? "";
    housesState.page = 1;
    loadHouses();
}

function clearHousesSearch() {
    if (housesSearchInput) {
        housesSearchInput.value = "";
    }
    if (housesCategoryFilter) {
        housesCategoryFilter.value = "";
    }
    if (housesPriceFilter) {
        housesPriceFilter.value = "";
    }
    housesState.search = "";
    housesState.category = "";
    housesState.minPrice = "";
    housesState.maxPrice = "";
    housesState.page = 1;
    loadPriceRanges();
    loadHouses();
}

async function loadCategories() {
    if (!housesCategoryFilter) {
        return;
    }

    try {
        const response = await fetch("/api/House/Categories");
        if (!response.ok) {
            return;
        }
        const categories = await response.json();
        const options = [`<option value="">All categories</option>`];
        for (const category of categories) {
            options.push(`<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`);
        }
        housesCategoryFilter.innerHTML = options.join("");
    } catch {
    }
}

async function loadPriceRanges(category = "") {
    if (!housesPriceFilter) {
        return;
    }

    try {
        const query = new URLSearchParams();
        if (category) {
            query.set("category", category);
        }
        const queryString = query.toString();
        const response = await fetch(`/api/House/PriceRanges${queryString ? `?${queryString}` : ""}`);
        if (response.ok) {
            const ranges = await response.json();
            renderPriceOptions(ranges);
            return;
        }

        await loadPriceRangesFallback(category);
    } catch {
        await loadPriceRangesFallback(category);
    }
}

async function loadPriceRangesFallback(category = "") {
    if (!housesPriceFilter) {
        return;
    }

    try {
        const query = new URLSearchParams({
            page: "1",
            pageSize: "500"
        });
        if (category) {
            query.set("category", category);
        }

        const response = await fetch(`/api/House/All?${query.toString()}`);
        if (!response.ok) {
            renderPriceOptions([]);
            return;
        }

        const result = await response.json();
        const houses = Array.isArray(result) ? result : (result.items ?? []);
        const prices = houses
            .map(h => Number(h.pricePerMonth))
            .filter(v => Number.isFinite(v));

        if (!prices.length) {
            renderPriceOptions([]);
            return;
        }

        const maxPrice = Math.max(...prices);
        const rangeStep = 200;
        const start = 0;
        const endRaw = Math.ceil(maxPrice / rangeStep) * rangeStep;
        const end = endRaw <= start ? start + rangeStep : endRaw;

        const ranges = [];
        for (let current = start; current < end; current += rangeStep) {
            const rangeMin = current;
            const rangeMax = current + rangeStep;
            const count = prices.filter(price => price >= rangeMin && price < rangeMax).length;
            ranges.push({
                min: rangeMin,
                max: rangeMax,
                count: count,
                label: `${rangeMin}-${rangeMax} (${count})`
            });
        }

        renderPriceOptions(ranges);
    } catch {
        renderPriceOptions([]);
    }
}

function renderPriceOptions(ranges) {
    if (!housesPriceFilter) {
        return;
    }

    const options = [`<option value="">All prices</option>`];
    for (const range of ranges) {
        const label = range.label || `${range.min}-${range.max} (${Number(range.count || 0)})`;
        options.push(`<option value="${range.min}-${range.max}">${escapeHtml(label)}</option>`);
    }
    housesPriceFilter.innerHTML = options.join("");
}

function renderHousesPagination(totalCount, totalPages) {
    if (!housesPagination) {
        return;
    }

    if (totalCount === 0) {
        housesPagination.innerHTML = "";
        return;
    }

    const prevDisabled = housesState.page <= 1 ? "disabled" : "";
    const nextDisabled = housesState.page >= totalPages ? "disabled" : "";

    housesPagination.innerHTML = `
        <button class="btn btn-outline-secondary btn-sm" id="housesPrevBtn" ${prevDisabled}>Prev</button>
        <span class="small text-muted">Page ${housesState.page} of ${totalPages}</span>
        <button class="btn btn-outline-secondary btn-sm" id="housesNextBtn" ${nextDisabled}>Next</button>
    `;

    document.getElementById("housesPrevBtn")?.addEventListener("click", () => {
        if (housesState.page > 1) {
            housesState.page -= 1;
            loadHouses();
        }
    });

    document.getElementById("housesNextBtn")?.addEventListener("click", () => {
        if (housesState.page < totalPages) {
            housesState.page += 1;
            loadHouses();
        }
    });
}

async function reserveHouse(id) {
    hideMessage();
    const token = getToken();
    if (!token) {
        showMessage("Log in as a customer to add favorites.", "warning");
        openAuthModal("login");
        return;
    }
    if (typeof hrsIsCustomer === "function" && !hrsIsCustomer()) {
        showMessage("Only customers can add favorites.", "warning");
        return;
    }
    const response = await fetch(`/api/House/${id}/reserve`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (response.status === 409) {
        showMessage("This house is already in your favorites.", "info");
        return;
    }
    if (!response.ok) {
        showMessage("Could not add to favorites.", "danger");
        return;
    }
    showMessage("Added to favorites.", "success");
}

function openDeleteHouseModal(id, title) {
    hideMessage();
    const token = getToken();
    if (!token) {
        showMessage("Log in as an agent to delete houses.", "warning");
        openAuthModal("login");
        return;
    }
    if (typeof hrsIsAgent === "function" && !hrsIsAgent()) {
        showMessage("Only agents can delete houses.", "warning");
        return;
    }

    pendingDeleteHouseId = id;
    if (deleteHouseModalText) {
        const safeTitle = title ? `"${title}"` : "this house";
        deleteHouseModalText.textContent = `Are you sure you want to delete ${safeTitle}? This action cannot be undone.`;
    }

    if (deleteHouseModal) {
        deleteHouseModal.show();
        return;
    }

    if (deleteHouseModalElement) {
        deleteHouseModalElement.classList.add("show");
        deleteHouseModalElement.style.display = "block";
        deleteHouseModalElement.removeAttribute("aria-hidden");
        document.body.classList.add("modal-open");
        let backdrop = document.getElementById("deleteHouseModalFallbackBackdrop");
        if (!backdrop) {
            backdrop = document.createElement("div");
            backdrop.id = "deleteHouseModalFallbackBackdrop";
            backdrop.className = "modal-backdrop fade show";
            document.body.appendChild(backdrop);
        }
    }
}

function hideDeleteHouseModal() {
    pendingDeleteHouseId = null;
    if (deleteHouseModal) {
        deleteHouseModal.hide();
        return;
    }

    if (deleteHouseModalElement) {
        deleteHouseModalElement.classList.remove("show");
        deleteHouseModalElement.style.display = "none";
        deleteHouseModalElement.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        const backdrop = document.getElementById("deleteHouseModalFallbackBackdrop");
        if (backdrop) {
            backdrop.remove();
        }
    }
}

async function executeDeleteHouse() {
    const id = pendingDeleteHouseId;
    if (!id) {
        return;
    }

    hideMessage();
    const token = getToken();
    const response = await fetch(`/api/House/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });

    hideDeleteHouseModal();

    if (!response.ok) {
        showMessage("Delete failed.", "danger");
        return;
    }

    showMessage("House deleted successfully.", "success");
    loadHouses();
}

async function showDetails(id) {
    const response = await fetch(`/api/House/${id}`);
    if (!response.ok) {
        showMessage("House not found.", "warning");
        return;
    }

    const h = await response.json();
    const detailsBody = document.getElementById("detailsBody");
    const reserveRow = typeof hrsIsCustomer === "function" && hrsIsCustomer()
        ? `<p class="mt-3"><button type="button" class="btn btn-success" onclick="reserveHouse(${h.id})">Add to favorites</button></p>`
        : "";
    detailsBody.innerHTML = `
        <img src="${h.imageUrl}" alt="${escapeHtml(h.title)}">
        <h4>${escapeHtml(h.title)}</h4>
        <p><strong>Address:</strong> ${escapeHtml(h.address)}</p>
        <p><strong>Description:</strong> ${escapeHtml(h.description || "No description")}</p>
        <p><strong>Price:</strong> $${Number(h.pricePerMonth || 0).toFixed(2)} / month</p>
        ${reserveRow}
    `;

    const modal = new bootstrap.Modal(document.getElementById("detailsModal"));
    modal.show();
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
}

function escapeJsString(text) {
    return String(text ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/\r/g, "")
        .replace(/\n/g, "\\n");
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

if (deleteHouseModalElement && !deleteHouseModal) {
    deleteHouseModalElement.querySelectorAll('[data-bs-dismiss="modal"], .btn-close')
        .forEach(btn => btn.addEventListener("click", hideDeleteHouseModal));

    deleteHouseModalElement.addEventListener("click", (e) => {
        if (e.target === deleteHouseModalElement) {
            hideDeleteHouseModal();
        }
    });
}

window.showDetails = showDetails;
window.reserveHouse = reserveHouse;
window.openDeleteHouseModal = openDeleteHouseModal;
