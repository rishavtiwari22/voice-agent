import React, { useState, useEffect } from "react";
import "./App.css";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Built-in commands
const builtInCommands = [
  { command: "open deepseek", url: "https://chat.deepseek.com/" },
  { command: "open google", url: "https://www.google.com" },
  { command: "open youtube", url: "https://www.youtube.com" },
  { command: "open chatgpt", url: "https://chat.openai.com" },
  { command: "open gmail", url: "https://mail.google.com/" },
  { command: "open linkedin", url: "https://www.linkedin.com/" },
  { command: "open github", url: "https://github.com/" },
  { command: "open hotstar", url: "https://www.hotstar.com/in/sports" },
  { command: "open vercel", url: "https://vercel.com/" },
  { command: "open sheet", url: "https://docs.google.com/spreadsheets/u/0/" },
  { command: "open docs", url: "https://docs.google.com/document/u/0/" },
  { command: "open calendar", url: "https://calendar.google.com/" },
  { command: "open maps", url: "https://www.google.com/maps" },
  { command: "open news", url: "https://news.google.com/" },
  { command: "open amazon", url: "https://www.amazon.com/" },
  { command: "open weather", url: "https://www.weather.com/" },
  { command: "open wikipedia", url: "https://www.wikipedia.org/" },
  { command: "open facebook", url: "https://www.facebook.com" },
  { command: "open instagram", url: "https://www.instagram.com" },
  { command: "open twitter", url: "https://twitter.com" },
  { command: "open netflix", url: "https://www.netflix.com/" },
  { command: "open reddit", url: "https://www.reddit.com" },
  { command: "open zoom", url: "https://zoom.us/" },
  { command: "open spotify", url: "https://www.spotify.com/" },
  { command: "open whatsapp", url: "https://web.whatsapp.com/" },
  { command: "open slack", url: "https://slack.com/" },
  { command: "open trello", url: "https://trello.com/" },
  { command: "open notion", url: "https://www.notion.so/" },
  { command: "open discord", url: "https://discord.com/" },
  { command: "open pinterest", url: "https://www.pinterest.com/" },
  { command: "open medium", url: "https://medium.com/" },
  { command: "open quora", url: "https://www.quora.com/" },
  { command: "open microsoft", url: "https://www.microsoft.com/" },
  { command: "open apple", url: "https://www.apple.com/" },
  { command: "open adobe", url: "https://www.adobe.com/" },
  { command: "open bing", url: "https://www.bing.com/" },
  { command: "open yelp", url: "https://www.yelp.com/" },
  { command: "open dropbox", url: "https://www.dropbox.com/" },
  { command: "open airbnb", url: "https://www.airbnb.com/" },
  { command: "open coursera", url: "https://www.coursera.org/" },
  { command: "open udemy", url: "https://www.udemy.com/" },
  { command: "open ebay", url: "https://www.ebay.com/" },
  { command: "open flipkart", url: "https://www.flipkart.com/" },
  { command: "open booking", url: "https://www.booking.com/" },
  { command: "open canva", url: "https://www.canva.com/" },
  { command: "open makemytrip", url: "https://www.makemytrip.com/" },
  { command: "open expedia", url: "https://www.expedia.com/" },
  { command: "open kayak", url: "https://www.kayak.com/" },
  { command: "open tripadvisor", url: "https://www.tripadvisor.com/" },
  { command: "open trivago", url: "https://www.trivago.com/" },
  { command: "open skyscanner", url: "https://www.skyscanner.net/" },
  { command: "open goibibo", url: "https://www.goibibo.com/" },
  { command: "open cleartrip", url: "https://www.cleartrip.com/" },
  { command: "open irctc", url: "https://www.irctc.co.in/nget/train-search" },
];

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const VITE_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const STORAGE_KEY = "customCommands";

const App = () => {
  const [customCommands, setCustomCommands] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("Press 'Start/Stop Listening' or hit Enter to toggle.");
  const [commandInput, setCommandInput] = useState("");
  const [urlInput, setUrlInput] = useState("");

  // Load custom commands from localStorage on mount
  useEffect(() => {
    const storedCommands = localStorage.getItem(STORAGE_KEY);
    if (storedCommands) {
      setCustomCommands(JSON.parse(storedCommands));
    }
  }, []);

  // Save custom commands to localStorage
  const saveCustomCommands = (commands) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(commands));
    setCustomCommands(commands);
  };

  // Add a new custom command
  const addCustomCommand = (e) => {
    e.preventDefault();
    const newCommand = commandInput.trim().toLowerCase();
    const newUrl = urlInput.trim();
    if (newCommand && newUrl) {
      const updatedCommands = [...customCommands, { command: newCommand, url: newUrl }];
      saveCustomCommands(updatedCommands);
      setCommandInput("");
      setUrlInput("");
    }
  };

  // Remove a custom command
  const removeCommand = (index) => {
    const updatedCommands = customCommands.filter((_, i) => i !== index);
    saveCustomCommands(updatedCommands);
  };

  // Clear all custom commands
  const clearCustomCommands = () => {
    if (window.confirm("Are you sure you want to clear all custom commands?")) {
      localStorage.removeItem(STORAGE_KEY);
      setCustomCommands([]);
    }
  };

  // Handle voice commands
  const handleCommand = async (spokenCommand) => {
    const allCommands = [...builtInCommands, ...customCommands];
    for (const item of allCommands) {
      if (spokenCommand.includes(item.command)) {
        window.open(item.url, "_blank");
        return;
      }
    }
    if (spokenCommand.includes("what is the time")) {
      const time = new Date().toLocaleTimeString();
      alert(`The current time is ${time}`);
      return;
    }
    let command = await generateResponse(spokenCommand);
    window.open(command, "_blank");
    return;
  };

  // Handle YouTube search
  const handleVoiceCommand = async (userCommand) => {
    if (userCommand.toLowerCase().startsWith("play")) {
      const songName = userCommand.replace("play", "").trim();
      const YOUTUBE_SEARCH_ENDPOINT = "https://www.googleapis.com/youtube/v3/search";
      try {
        const response = await fetch(
          `${YOUTUBE_SEARCH_ENDPOINT}?part=snippet&q=${encodeURIComponent(songName)}&type=video&key=${YOUTUBE_API_KEY}&maxResults=1`
        );
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const videoId = data.items[0].id.videoId;
          return `https://www.youtube.com/watch?v=${videoId}`;
        }
      } catch (error) {
        console.error("Error fetching YouTube video:", error);
      }
    }
    return "";
  };

  // Toggle voice recognition
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus("Your browser does not support Speech Recognition.");
      return;
    }

    if (!isListening) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;

      recognition.onresult = async (event) => {
        const spokenCommand = event.results[0][0].transcript.toLowerCase();
        setStatus(`You said: "${spokenCommand}"`);
        if (spokenCommand.startsWith("open")) {
          handleCommand(spokenCommand);
        } else {
          const command = await handleVoiceCommand(spokenCommand);
          if (command) window.open(command, "_blank");
        }
      };

      recognition.onstart = () => setStatus("Speech recognition has started.");
      recognition.onerror = (event) => setStatus(`Error: ${event.error}`);
      recognition.onend = () => setIsListening(false);

      recognition.start();
      setIsListening(true);
      setStatus("Listening for commands...");
    } else {
      setIsListening(false);
      setStatus("Stopped listening.");
    }
  };

  // Add keydown event listener for Enter key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" && document.activeElement.tagName !== "INPUT") {
        toggleListening();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isListening]); 

  async function generateResponse(userPrompt) {
    const systemInstruction = `
      You are a voice assistant that helps people with daily tasks. 
      When the user requests to open a webpage, provide the specfic link of that project insteas of any extra text.
    `;
  
    const genAI = new GoogleGenerativeAI(VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
    const prompt = `${systemInstruction}\nUser: ${userPrompt}`;
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();
  
    if (userPrompt.toLowerCase().startsWith("play")) {
      const songName = userPrompt.replace("play", "").trim();
      const youtubeLink = await searchYouTube(songName);
      console.log(`AI Response: ${aiResponse}\nLink: ${youtubeLink}`);
    } else {
      console.log(aiResponse);
      return aiResponse.trim();
    }
  }


  return (
    <div>
      <header>
        <h1>AI Voice-Controlled Agent</h1>
        <p>To search for any web page, speak 🗣️ "open Your-command".</p>
        <p>For playing a song, speak 🗣️ "play Your-command".</p>
      </header>
      <div className="container">
        <div className="left-panel">
          <section className="voice-section">
            <div className="card">
              <p id="status">{status}</p>
              <button onClick={toggleListening}>Start/Stop</button>
            </div>
          </section>
          <section className="custom-command-section">
            <div className="card">
              <h2>Add Custom Command</h2>
              <form onSubmit={addCustomCommand}>
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder="Enter command keyword (e.g., 'open github')"
                  required
                />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Enter URL (e.g., 'https://github.com/rishavtiwari22')"
                  required
                />
                <button type="submit">Add Command</button>
              </form>
            </div>
          </section>
          <footer className="left-footer">
            <p>© 2025 Rishav Tiwari</p>
          </footer>
        </div>
        <div className="right-panel">
          <div className="card">
            <h2>Your Custom Commands</h2>
            <div id="customCommandsList">
              {customCommands.length === 0 ? (
                <p>No custom commands added.</p>
              ) : (
                customCommands.map((cmd, index) => (
                  <div key={index} className="command-item">
                    <span><strong>{cmd.command.split(" ").pop()}</strong></span>
                    <button onClick={() => removeCommand(index)}>Remove</button>
                  </div>
                ))
              )}
            </div>
            <button id="btn" onClick={clearCustomCommands}>Clear All</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;