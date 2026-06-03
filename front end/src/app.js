import { html, render } from "https://unpkg.com/lit-html?module";
import { registerView } from "./views/registerView.js";
import { loginView } from "./views/loginView.js";

const root = document.getElementById("app");

function getRoute() {
    const hash = window.location.hash || "#/register";
    return hash.replace("#", "");
}

function viewByRoute(route, update) {
    if (route === "/login") {
        return loginView(update);
    }

    return registerView(update);
}

function update() {
    const route = getRoute();
    const view = viewByRoute(route, update);
    render(html`${view}`, root);
}

window.addEventListener("hashchange", update);
update();
