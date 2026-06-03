const hrsTokenKey = "hrs_jwt_token";
const hrsRolesKey = "hrs_roles";

function hrsGetToken() {
    return localStorage.getItem(hrsTokenKey);
}

function hrsGetRoles() {
    try {
        const raw = localStorage.getItem(hrsRolesKey);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function hrsSetAuth(token, roles) {
    localStorage.setItem(hrsTokenKey, token);
    localStorage.setItem(hrsRolesKey, JSON.stringify(roles || []));
}

function hrsClearAuth() {
    localStorage.removeItem(hrsTokenKey);
    localStorage.removeItem(hrsRolesKey);
}

function hrsIsAgent() {
    return hrsGetRoles().includes("Agent");
}

function hrsIsCustomer() {
    return hrsGetRoles().includes("Customer");
}
