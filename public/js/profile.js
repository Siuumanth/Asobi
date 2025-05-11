const getProfileURL = "http://localhost:7003/api/v1/users/profile";
const updateDetailsURL = "http://localhost:7003/api/v1/users/update-account";
const updateAvatarURL = "http://localhost:7003/api/v1/users/avatar";
const updateCoverURL = "http://localhost:7003/api/v1/users/cover-image";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch(getProfileURL, { credentials: "include" });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to load profile.");
    }

    const user = data.data;

    document.getElementById("coverImage").src = user.coverImage;
    document.getElementById("avatar").src = user.avatar;
    document.getElementById("fullNameDisplay").textContent = user.fullName;
    document.getElementById("username").textContent = `@${user.username}`;
    document.getElementById("fullName").value = user.fullName;
    document.getElementById("email").value = user.email;
    document.getElementById("createdAt").textContent = new Date(user.createdAt).toLocaleDateString();
  } catch (err) {
    console.error(err);
    alert("Error loading profile");
  }
});

document.getElementById("updateForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();

  try {
    const res = await fetch(updateDetailsURL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ fullName, email }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update");
    }

    alert("Profile updated successfully");
    location.reload();
  } catch (err) {
    console.error(err);
    alert("Update failed");
  }
});

document.getElementById("avatarUpload").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("avatar", file);

  try {
    const res = await fetch(updateAvatarURL, {
      method: "PUT",
      body: formData,
      credentials: "include",
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to upload avatar");
    }

    alert("Avatar updated");
    location.reload();
  } catch (err) {
    console.error(err);
    alert("Avatar update failed");
  }
});

document.getElementById("coverUpload").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("coverImage", file);

  try {
    const res = await fetch(updateCoverURL, {
      method: "PUT",
      body: formData,
      credentials: "include",
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to upload cover image");
    }

    alert("Cover image updated");
    location.reload();
  } catch (err) {
    console.error(err);
    alert("Cover image update failed");
  }
});
