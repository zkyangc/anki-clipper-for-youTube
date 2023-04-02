function getVideoData() {
    const videoUrl = document.location.href;
    const videoElement = document.querySelector("video");
    const timestamp = Math.floor(videoElement.currentTime);
    return { videoUrl, timestamp };
}
  
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "getVideoData") {
        sendResponse(getVideoData());
    }
});

const isYouTube = !!document.querySelector('.html5-video-player');
chrome.runtime.sendMessage({ isYouTube });
  