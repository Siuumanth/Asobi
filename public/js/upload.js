const BASE_URL = "http://localhost:7003/api/v1/videos";

const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const thumbnailInput = document.getElementById("thumbnail");
const videoInput = document.getElementById("video");
const uploadForm = document.getElementById("uploadForm");

function getVideoDurationInSeconds(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(Math.floor(video.duration)); // Send seconds as integer
    };

    video.onerror = () => {
      reject(new Error("Unable to load video metadata."));
    };

    video.src = URL.createObjectURL(file);
  });
}

uploadForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const videoFile = videoInput.files[0];
  const thumbnailFile = thumbnailInput.files[0];
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();

  if (!title || !description || !thumbnailFile || !videoFile) {
    alert("All fields are required.");
    return;
  }

  try {
    const durationInSeconds = await getVideoDurationInSeconds(videoFile);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("thumbnail", thumbnailFile);
    formData.append("video", videoFile);
    formData.append("duration", durationInSeconds);

    // Debug: log all form data fields
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    const response = await fetch(`${BASE_URL}/publish`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed. Status: ${response.status}`);
    }

    const data = await response.json();
    alert("Video uploaded successfully!");
    console.log("Server response:", data);
  } catch (error) {
    console.error("Upload error:", error);
    alert("There was an error uploading the video. Please try again.");
  }
});
