const BASE_URL = "http://localhost:7003/api/v1/users";

const usernameInput = document.getElementById("username");
const fullNameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const avatarInput = document.getElementById("avatar");
const coverInput = document.getElementById("cover");
const spinner = document.getElementById("spinner");

const registerUser = async () => {
    const username = usernameInput.value;
    const fullName = fullNameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;
    const avatarFile = avatarInput.files[0];
    const coverFile = coverInput?.files[0];

    if (!username || !fullName || !email || !password || !avatarFile) {
        alert("Please fill in all fields including avatar ");
        return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("fullName", fullName);  
    formData.append("email", email);
    formData.append("password", password);
    formData.append("avatar", avatarFile);
    formData.append("coverImage", coverFile);

    spinner.classList.remove("hidden");

    try {
        const response = await fetch(`${BASE_URL}/register`, {
            method: "POST",
            body: formData,
            credentials: "include"  // Important for cookie-based auth
        });

        const data = await response.json();
        console.log(data);

        if (response.ok) {
            alert(data.message || "Registration successful");
            window.location.href = "/home";
        } else {
            alert(data.message || "Registration failed");
        }
    } catch (err) {
        console.error("Error:", err);
        alert("Something went wrong!");
    } finally {
        spinner.classList.add("hidden");
    }
};


document.getElementById("register").addEventListener("click", (e) => {
    e.preventDefault(); // prevent form submission if inside <form>
    registerUser();
});
