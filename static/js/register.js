document
.getElementById("register-form")
.addEventListener("submit", async (e) => {

    e.preventDefault();

    try {

        const response = await fetch("/api/accounts/register/", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                username: document.getElementById("username").value,

                email: document.getElementById("email").value,

                password: document.getElementById("password").value,

                password_confirm: document.getElementById("password_confirm").value
            })
        });

        const data = await response.json();

        if (!response.ok) {

            document.getElementById("error-message").innerText =
                JSON.stringify(data);

            return;
        }

        window.location.href = "/login/";

    } catch (error) {

        console.error(error);
    }
});