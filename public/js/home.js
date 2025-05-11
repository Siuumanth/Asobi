const BASE_URL = "http://localhost:7003/api/v1/videos";

const getAllVideos = async () => {
  const page = 1;
  const limit = 10;

  const response = await fetch(`${BASE_URL}?page=${page}&limit=${limit}`);
  const data = await response.json();
  return data.data; // because your response format is { success, message, data }
};

const createVideoCard = (video) => {
  const card = document.createElement("div");
  card.className = "bg-[#1e1e1e] p-3 rounded-lg shadow hover:shadow-lg transition";

  card.innerHTML = `
    <div class="relative mb-3">
      <img src="${video.thumbnail}" alt="Thumbnail" class="rounded-md w-full h-40 object-cover" />
    </div>
    <h2 class="text-lg font-medium truncate">${video.title}</h2>
    <p class="text-sm text-gray-400">By ${video.owner.fullName} • ${video.views} views</p>
  `;

  return card;
};

document.addEventListener("DOMContentLoaded", async () => {
  const videoList = document.getElementById("video-list");
console.log("videoList", videoList)
  try {
    console.log("videos got");
    const videos = await getAllVideos();
    console.log("videos", videos)
    
    if (!videos || videos.length === 0) {
      videoList.innerHTML = "<p class='text-gray-400'>No videos found.</p>";
      return;
    }
    videos.forEach(video => {
      const videoCard = createVideoCard(video);
      videoList.appendChild(videoCard);
    });
  } catch (err) {
    console.error("Failed to load videos", err);
    videoList.innerHTML = "<p class='text-red-500'>Error loading videos.</p>";
  }
});
