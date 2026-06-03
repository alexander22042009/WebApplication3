const baseUrl = "http://localhost:5044";

async function request(path, payload) {
    const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    let data = null;
    try {
        data = await response.json();
    } catch (error) {
        data = { message: "Invalid server response" };
    }

    if (!response.ok) {
        throw new Error(data?.message || JSON.stringify(data));
    }

    return data;
}

export function register(payload) {
    return request("/register", payload);
}

export function login(payload) {
    return request("/login", payload);
}
