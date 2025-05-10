const BASE_URL = "http://localhost:7003/api/v1/videos";
console.log("hello");
const getAllVideos = async () => {
    const page = 1;
    const limit = 10;
    const videos = await fetch(`${BASE_URL}?page=${page}&limit=${limit}`).then(res => res.json());
    return videos;
}

document.addEventListener("DOMContentLoaded", async () => {
    const videos = await getAllVideos();
    console.log(videos);
})