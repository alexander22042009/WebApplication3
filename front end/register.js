async function registerUser() {
    const payload = {
        username: "john2",
        email: "john2@gmail.com",
        password: "123456"
    };

    try {
        const response = await fetch("http://localhost:5044/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Register failed:", data);
            return;
        }

        console.log("Register success:", data);
    } catch (error) {
        console.error("Network error:", error);
    }
}

async function loginUser() {
    const payload = {
        email: "john2@gmail.com",
        password: "123456"
    };

    try {
        const response = await fetch("http://localhost:5044/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Login failed:", data);
            return;
        }

        console.log("Login success:", data);
        if (data.token) {
            localStorage.setItem("jwt_token", data.token);
        }
    } catch (error) {
        console.error("Network error:", error);
    }
}

document.getElementById("registerForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const result = document.getElementById("registerResult");
    result.textContent = "Sending...";

    const payload = {
        username: document.getElementById("username").value.trim(),
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value
    };

    try {
        const response = await fetch("http://localhost:5044/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        result.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
        result.textContent = "Network error: " + err.message;
    }
});

document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const result = document.getElementById("loginResult");
    result.textContent = "Sending...";

    const payload = {
        email: document.getElementById("loginEmail").value.trim(),
        password: document.getElementById("loginPassword").value
    };

    try {
        const response = await fetch("http://localhost:5044/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        result.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
        result.textContent = "Network error: " + err.message;
    }
});