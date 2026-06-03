import { html } from "https://unpkg.com/lit-html?module";
import { login } from "../api/authApi.js";

const state = {
    email: "john2@gmail.com",
    password: "123456",
    result: ""
};

export function loginView(update) {
    const onInput = (event) => {
        const { name, value } = event.target;
        state[name] = value;
        update();
    };

    const onSubmit = async (event) => {
        event.preventDefault();
        state.result = "Sending...";
        update();

        try {
            const data = await login({
                email: state.email.trim(),
                password: state.password
            });
            if (data.token) {
                localStorage.setItem("jwt_token", data.token);
            }
            state.result = JSON.stringify(data, null, 2);
        } catch (error) {
            state.result = `Error: ${error.message}`;
        }

        update();
    };

    return html`
        <div class="grid">
            <div class="card">
                <h2>Login</h2>
                <form @submit=${onSubmit}>
                    <label for="loginEmail">Email</label>
                    <input id="loginEmail" name="email" .value=${state.email} @input=${onInput} type="email" required />

                    <label for="loginPassword">Password</label>
                    <input id="loginPassword" name="password" .value=${state.password} @input=${onInput} type="password" required />

                    <button type="submit">Login</button>
                </form>
                <div class="result">${state.result}</div>
            </div>
        </div>
    `;
}
