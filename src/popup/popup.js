document.addEventListener("DOMContentLoaded", () => {
    updateConnectionStatus();
    
    const addToAnkiButton = document.getElementById("addVideoBtn");
    console.log(addToAnkiButton);
    if (addToAnkiButton) {
        addToAnkiButton.addEventListener("click", async () => {
            const videoData = await getVideoDataFromContentScript();
    
            const youtubeEmbed = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${
                videoData.videoId
            }?start=${videoData.timestamp}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
            
            console.log(youtubeEmbed);
            
            // Replace 'Front' and 'Back' with the fields you want to populate in your Anki card
            const fields = {
                Front: videoData.videoId + " " + videoData.timestamp,
                Back: youtubeEmbed
            };
            await createAnkiCard(fields);
        });
    } else {
        console.error('Element with ID "addToAnki" not found.');
    }
  });
  
async function getVideoDataFromContentScript() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { message: "getVideoData"
            }, (response) => {
                const videoUrl = new URL(response.videoUrl);
                const videoId = videoUrl.searchParams.get("v");
                const timestamp = response.timestamp;
                resolve({ videoId, timestamp });
            });
        });
    });
}

async function deckExists(deckName) {
    const result = await invokeAnkiConnect("deckNames");
    return result.includes(deckName);
}

async function modelExists(modelName) {
    const result = await invokeAnkiConnect("modelNames");
    return result.includes(modelName);
}

async function createAnkiCard(fields) {
    const modelName = "youtube"; // Replace with your desired Anki card model
    const deckName = "YouTube Videos"; // Replace with your desired Anki deck

    const note = {
        modelName,
        fields,
        tags: ["youtube", "video"],
        deckName
    };

    try {
        if (!await deckExists(deckName)) {
            await invokeAnkiConnect("createDeck", { deck: deckName });
        }
    
        if (!await modelExists(modelName)) {
            await invokeAnkiConnect("createModel", {
                modelName,
                inOrderFields: Object.keys(fields),
                css: "",
                cardTemplates: [
                    {
                        Front: "{{Front}}",
                        Back: "{{Back}}"
                    }
                ]
            });
        }
        
        await invokeAnkiConnect("addNote", { note });
        alert("YouTube video added to Anki successfully!");
    } catch (error) {
        console.error(error);
        alert("An error occurred while adding the video to Anki.");
    }
}

async function invokeAnkiConnect(action, params) {
    console.log(action, params);
    const response = await fetch("http://localhost:8765", {
        method: "POST",
        body: JSON.stringify({ action, params, version: 6 }),
        headers: { "Content-Type": "application/json" }
    });
    
    if (!response.ok) {
        throw new Error(`AnkiConnect request failed: ${response.statusText}`);
    }

    const jsonResponse = await response.json();

    if (jsonResponse.error) {
        throw new Error(`AnkiConnect error: ${jsonResponse.error}`);
    }

    return jsonResponse.result;
}

async function checkAnkiConnectConnection() {
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "version",
        version: 6,
      }),
    };
  
    try {
      const response = await fetch("http://localhost:8765", requestOptions);
      const jsonResponse = await response.json();
  
      if (jsonResponse.error) {
        throw new Error(jsonResponse.error);
      }
  
      return true;
    } catch (error) {
      return false;
    }
  }
  
async function updateConnectionStatus() {
    const isConnected = await checkAnkiConnectConnection();
    //const isYouTube = await isYouTubePage();
    const addToAnkiButton = document.getElementById("addVideoBtn");
    const connStatusElement = document.getElementById("connectionStatus");
    const ytStatusElement = document.getElementById("ytStatus");
    
    if (!isConnected) {
        connStatusElement.textContent = "Not connected to Anki";
        connStatusElement.style.color = "red";
        addToAnkiButton.style.display = false;
        return;
    }
    connStatusElement.textContent = "Connected to Anki";
    connStatusElement.style.color = "green";
    
    // if (!isYouTube) {
    //     ytStatusElement.textContent = "Not a YouTube tab";
    //     ytStatusElement.style.color = "red";
    //     addToAnkiButton.style.display = false;
    //     return;
    // } 
    // ytStatusElement.textContent = "YouTube tab";
    // ytStatusElement.style.color = "green";
    addToAnkiButton.style.display = true;
}
  