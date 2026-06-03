import { html } from "https://unpkg.com/lit-html?module";
import { register } from "../api/authApi.js";

const state = {
    username: "john2",
    email: "john2@gmail.com",
    password: "123456",
    result: ""
};

export function registerView(update) {
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
            const data = await register({
                username: state.username.trim(),
                email: state.email.trim(),
                password: state.password
            });
            state.result = JSON.stringify(data, null, 2);
        } catch (error) {
            state.result = `Error: ${error.message}`;
        }

        update();
    };

    return html`
        <div class="grid">
            <div class="card">
                <h2>Create Account</h2>
                <form @submit=${onSubmit}>
                    <label for="username">Username</label>
                    <input id="username" name="username" .value=${state.username} @input=${onInput} type="text" required />

                    <label for="email">Email</label>
                    <input id="email" name="email" .value=${state.email} @input=${onInput} type="email" required />

                    <label for="password">Password</label>
                    <input id="password" name="password" .value=${state.password} @input=${onInput} type="password" required />

                    <button type="submit">Register</button>
                </form>
                <div class="result">${state.result}</div>
            </div>
        </div>
    `;
}
