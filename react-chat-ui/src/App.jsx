import React, { useState, useRef, useEffect, useCallback } from 'react';

// --- SVG Icons ---

// Sparkle Icon (as a component)
const SparkleIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ color: '#E0C6F7' }}
  >
    <path
      d="M12 2.69141L13.8086 7.69141L14.3086 9.00001L15.6172 9.50001L20.6172 11.3086L15.6172 13.1172L14.3086 13.6172L13.8086 14.9258L12 19.9258L10.1914 14.9258L9.69141 13.6172L8.38281 13.1172L3.38281 11.3086L8.38281 9.50001L9.69141 9.00001L10.1914 7.69141L12 2.69141Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

// --- UPDATED --- Send Icon (as a component)
// This is a simpler, more robust SVG path that fills correctly.
const SendIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor" // Changed to fill
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2 .01 7z" />
  </svg>
);

// Microphone Icon (as a component)
const MicIcon = ({ isListening }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ color: isListening ? '#FF6B6B' : '#E0C6F7' }} // Red when listening
  >
    <path
      d="M12 2C10.3431 2 9 3.34315 9 5V11C9 12.6569 10.3431 14 12 14C13.6569 14 15 12.6569 15 11V5C15 3.34315 13.6569 2 12 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19 10V11C19 14.866 15.866 18 12 18C8.13401 18 5 14.866 5 11V10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 18V22M8 22H16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// --- React Components ---

// --- NEW --- Set up Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechSupported = !!SpeechRecognition;
if (!isSpeechSupported) {
  console.log("Speech recognition not supported in this browser.");
}


const App = () => {
  const [messages, setMessages] = useState([
    {
      id: 0,
      text: "Hello! How can I assist you.",
      isUser: false,
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voices, setVoices] = useState([]);
  
  // --- UPDATED --- Store recognition instance in a ref
  const recognitionRef = useRef(null);
  
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Load speech synthesis voices
  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Text-to-Speech (TTS) Function
  const speak = (text) => {
    window.speechSynthesis.cancel();
    const cleanText = new DOMParser().parseFromString(text, 'text/html').body.textContent || text;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const desiredVoice = voices.find(v => v.name.includes("Google") && v.lang.includes("en-US")) || voices.find(v => v.lang.includes("en-US"));
    utterance.voice = desiredVoice || voices[0];
    utterance.pitch = 1;
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  };
  
  // useEffect to speak when a new AI message arrives
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && !lastMessage.isUser && !isLoading) {
      speak(lastMessage.text);
    }
  }, [messages, isLoading]); // 'voices' removed from dependency array, it's ok

  // Function to send a message
  const sendMessage = useCallback(async (messageText) => {
    if (!messageText.trim()) return; 
    window.speechSynthesis.cancel();
    
    const newUserMessage = {
      id: Date.now(),
      text: messageText,
      isUser: true,
    };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setIsLoading(true);
    setInput(''); // Clear input *after* sending

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      const aiMessage = { id: Date.now() + 1, text: data.answer, isUser: false };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting. Please try again later.",
        isUser: false,
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array is fine

  // Handler for the send button
  const handleSend = () => {
    if (input) {
      sendMessage(input);
    }
  };
  
  // --- UPDATED --- Setup Speech-to-Text (STT) Handlers
  useEffect(() => {
    if (!isSpeechSupported) return;

    // Initialize the recognition instance
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript); // Put the spoken text into the input box
      // Automatically send the message after speech is recognized
      sendMessage(transcript);
    };

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };
    
    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      }
    };
  }, [sendMessage]); // Add sendMessage as dependency

  // Handler for the microphone button
  const handleMicClick = () => {
    if (!isSpeechSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInput(''); // Clear input
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Speech recognition start error:", e);
      }
    }
  };

  // Handler for clicking a suggestion chip
  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const suggestionMessages = [
    "What can I ask you to do?",
    "Which one of my projects is performing the best?",
    "What projects should I be concerned about right now?",
  ];

  return (
    <div style={styles.appContainer}>
      <div style={styles.chatContainer}>
        {messages.length === 1 ? (
          // --- Welcome/Suggestions View ---
          <>
            <div style={styles.welcomeHeader}>
              <SparkleIcon />
              <h2 style={styles.welcomeTitle}>Ask AI anything</h2>
            </div>
            <div style={styles.suggestionsContainer}>
              <p style={styles.suggestionsTitle}>Suggestions or what to ask Our AI</p>
              <div style={styles.suggestionsGrid}>
                {suggestionMessages.map((msg, index) => (
                  <SuggestionChip
                    key={index}
                    message={msg}
                    onClick={() => handleSuggestionClick(msg)}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          // --- Chat Messages View ---
          <div style={styles.messagesList}>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && <LoadingBubble />}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* --- Input Area (always visible) --- */}
        <div style={styles.inputArea}>
          <div style={styles.inputWrapper}>
            <input
              type="text"
              style={styles.inputBox}
              placeholder="Ask me anything about your projects"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              disabled={isLoading}
            />
            
            {/* --- UPDATED: Conditional Send/Mic Button --- */}
            <button
              style={isLoading ? { ...styles.sendButton, ...styles.sendButtonDisabled } : styles.sendButton}
              onClick={ (input || !isSpeechSupported) ? handleSend : handleMicClick } 
              disabled={isLoading}
            >
              { (input || !isSpeechSupported) ? <SendIcon /> : <MicIcon isListening={isListening} />}
            </button>
            
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Child Components ---

const ChatMessage = ({ message }) => (
  <div
    style={{
      ...styles.messageBubble,
      ...(message.isUser ? styles.userBubble : styles.aiBubble),
    }}
  >
    {message.isUser ? (
      <p style={styles.messageText}>{message.text}</p>
    ) : (
      <p
        style={styles.messageText}
        dangerouslySetInnerHTML={{ __html: message.text }} // Renders HTML
      />
    )}
  </div>
);

const SuggestionChip = ({ message, onClick }) => (
  <button style={styles.suggestionChip} onClick={onClick}>
    {message}
  </button>
);

const LoadingBubble = () => (
  <div style={{ ...styles.messageBubble, ...styles.aiBubble, ...styles.loadingBubble }}>
    <div style={styles.dotFlashing}></div>
  </div>
);

// --- Styles ---
const styles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#1E1E1E',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#FFFFFF',
    overflow: 'hidden',
  },
  chatContainer: {
    width: '90%',
    maxWidth: '800px',
    height: '90vh',
    maxHeight: '800px',
    backgroundColor: '#2D2D2D',
    borderRadius: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '24px',
    boxSizing: 'border-box',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  },
  welcomeHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    paddingTop: 'calc(25% - 60px)',
  },
  welcomeTitle: {
    fontSize: '24px',
    fontWeight: '600',
    margin: '16px 0 0 0',
  },
  suggestionsContainer: {
    marginTop: 'auto',
    marginBottom: '20px',
  },
  suggestionsTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#A0A0A0',
    marginBottom: '12px',
    paddingLeft: '8px',
  },
  suggestionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  suggestionChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#E0E0E0',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.2s ease',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  messagesList: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '0 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: '12px 16px',
    borderRadius: '18px',
    lineHeight: '1.5',
    fontSize: '15px',
    wordWrap: 'break-word',
  },
  userBubble: {
    backgroundColor: '#7A37C7',
    color: '#FFFFFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '4px',
  },
  aiBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#E0E0E0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '4px',
  },
  messageText: {
    margin: 0,
  },
  loadingBubble: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '24px', 
    padding: '12px 16px',
  },
  inputArea: {
    paddingTop: '20px',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  inputBox: {
    flexGrow: 1,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    padding: '16px',
    paddingRight: '50px',
    color: '#FFFFFF',
    fontSize: '15px',
  },
  sendButton: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    border: 'none',
    borderRadius: '12px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#E0C6F7',
    transition: 'background-color 0.2s ease, color 0.2s ease',
  },
  sendButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  dotFlashing: {
    position: 'relative',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#A0A0A0',
    color: '#A0A0A0',
    animation: 'dotFlashing 1s infinite linear alternate',
    animationDelay: '0.5s',
  },
};

// --- Style Injection for Keyframes & HTML ---
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
  @keyframes dotFlashing {
    0% { opacity: 0.2; }
    50% { opacity: 1; }
    100% { opacity: 0.2; }
  }
  
  div[style*="dotFlashing"]::before,
  div[style*="dotFlashing"]::after {
    content: '';
    display: inline-block;
    position: absolute;
    top: 0;
  }
  div[style*="dotFlashing"]::before {
    left: -12px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #A0A0A0;
    color: #A0A0A0;
    animation: dotFlashing 1s infinite alternate;
    animationDelay: 0s;
  }
  div[style*="dotFlashing"]::after {
    left: 12px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #A0A0A0;
    color: #A0A0A0;
    animation: dotFlashing 1s infinite alternate;
    animationDelay: 1s;
  }

  button[style*="suggestionChip"]:hover {
    background-color: rgba(255, 255, 255, 0.15) !important;
  }
  
  button[style*="sendButton"]:not(:disabled):hover {
    background-color: rgba(255, 255, 255, 0.25) !important;
  }
  
  div[style*="messagesList"] {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  }
  
  div[style*="messagesList"]::-webkit-scrollbar {
    width: 6px;
  }
  div[style*="messagesList"]::-webkit-scrollbar-track {
    background: transparent;
  }
  div[style*."messagesList"]::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  div[style*="aiBubble"] p { margin: 0; }
  div[style*="aiBubble"] b, 
  div[style*="aiBubble"] strong {
    color: #E0C6F7; 
    font-weight: 600;
  }
  div[style*="aiBubble"] ul, 
  div[style*="aiBubble"] ol {
    padding-left: 24px;
    margin: 10px 0;
  }
  div[style*="aiBubble"] li {
    margin-bottom: 5px;
    line-height: 1.4;
  }
`;
if (!document.querySelector('style[data-custom-styles]')) {
  styleSheet.setAttribute('data-custom-styles', 'true');
  document.head.appendChild(styleSheet);
}

export default App;