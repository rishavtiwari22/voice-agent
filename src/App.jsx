import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Your existing builtInCommands array
const builtInCommands = [
  { command: "open deepseek", url: "https://chat.deepseek.com/swde" },
  { command: "open google", url: "https://www.google.com" },
  { command: "open google maps", url: "https://maps.google.com" },
  { command: "open youtube", url: "https://www.youtube.com" },
  { command: "open github", url: "https://github.com" },
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

  // Use a ref to always access the latest customCommands
  const customCommandsRef = useRef(customCommands);
  useEffect(() => {
    customCommandsRef.current = customCommands;
  }, [customCommands]);

  // Load custom commands from localStorage
  useEffect(() => {
    const storedCommands = localStorage.getItem(STORAGE_KEY);
    if (storedCommands) {
      try {
        const parsedCommands = JSON.parse(storedCommands);
        setCustomCommands(parsedCommands);
      } catch (error) {
        console.error("Failed to parse custom commands:", error);
        localStorage.removeItem(STORAGE_KEY);
        setCustomCommands([]);
      }
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
    const newCommand = `open ${commandInput.trim().toLowerCase()}`; // Ensure "open" is prefixed
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
  const handleCommand = async (normalizedCommand) => {
    const spokenCommand = normalizedCommand.toLowerCase();

    // Extract the part after "open" for multi-word commands
    const commandAfterOpen = spokenCommand.replace("open", "").trim();

    // Check custom commands first
    for (const item of customCommandsRef.current) {
      if (item.command === `open ${commandAfterOpen}`) {
        console.log("Matched custom command:", item.command);
        window.open(item.url, "_blank");
        return; // Exit if a match is found
      }
    }

    // Check built-in commands next
    for (const item of builtInCommands) {
      if (item.command === `open ${commandAfterOpen}`) {
        console.log("Matched built-in command:", item.command);
        window.open(item.url, "_blank");
        return; // Exit if a match is found
      }
    }

    // If no match is found, use Gemini
    if (spokenCommand.startsWith("open")) {
      console.log("No match found. Using Gemini to generate a response...");
      const command = await generateResponse(spokenCommand);
      if (command) {
        window.open(command, "_blank");
      }
      return;
    }

    // Handle other commands like time
    if (spokenCommand.includes("what is the time")) {
      const time = new Date().toLocaleTimeString();
      alert(`The current time is ${time}`);
      return;
    }

    // Handle YouTube search
    if (spokenCommand.startsWith("play")) {
      const songName = spokenCommand.replace("play", "").trim();
      const youtubeLink = await handleVoiceCommand(spokenCommand);
      if (youtubeLink) {
        window.open(youtubeLink, "_blank");
      }
      return;
    }

    // If no command matches, show an error or fallback message
    setStatus(`Command not recognized: "${spokenCommand}"`);
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
        await handleCommand(spokenCommand);
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

  // Generate response using Gemini
  async function generateResponse(userPrompt) {
    const systemInstruction = `
    1. When the user requests to open a specific webpage:
      : Provide only the direct link to the requested webpage without any additional text.
      : Ensure the link is relevant to the user's request.
    Example:
      User: "Open YouTube."
      Response: https://www.youtube.com

    2. When the user asks a random query unrelated to opening a webpage:
      : Provide a relevant link that could help answer the query, but only include the link without any extra text.
    
    Example:
      User: "How do I bake a cake?"
      Response: https://en.wikipedia.org/wiki/Cake
    General Guidelines:
      1. Always respond with only the link, no explanations, confirmations, or additional text.
      2. Ensure the link is relevant to the user’s query or request.
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
                  placeholder="Enter command keyword (e.g., 'github')"
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
                    <span><strong>{cmd.command}</strong></span>
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
