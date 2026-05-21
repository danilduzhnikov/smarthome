document
.getElementById("login-form")
.addEventListener("submit", async (e) => {

    e.preventDefault();

    try {

        const response = await fetch("/token/", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: document.getElementById("email").value,
                password: document.getElementById("password").value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error("Login failed");
        }

        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);

        window.location.href = "/home/";

    } catch (error) {

        console.error(error);

        alert("Invalid credentials");
    }
});