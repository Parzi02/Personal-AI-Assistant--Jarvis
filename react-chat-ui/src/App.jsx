import React, { useState, useRef, useEffect } from 'react';

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

// Send Icon (as a component)
const SendIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M21.604 11.9161L3.60402 3.91613C3.41829 3.82327 3.20399 3.80373 3.00161 3.86175C2.79923 3.91977 2.6247 4.05193 2.51137 4.2372C2.39804 4.42247 2.35339 4.64936 2.38466 4.86877C2.41592 5.08818 2.52123 5.28919 2.68402 5.44213L9.68402 12.0001L2.68402 18.5581C2.52123 18.7111 2.41592 18.9121 2.38466 19.1315C2.35339 19.3509 2.39804 19.5778 2.51137 19.7631C2.6247 19.9483 2.79923 20.0805 3.00161 20.1385C3.20399 20.1965 3.41829 20.177 3.60402 20.0841L21.604 12.0841C21.7801 11.9961 21.918 11.8549 21.9942 11.6845C22.0704 11.514 22.081 11.3235 22.024 11.1441C21.967 10.9647 21.845 10.8068 21.678 10.7001C21.511 10.5934 21.309 10.5463 21.104 10.5661L21.096 10.5681"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

// --- React Components ---

const App = () => {
  // State for the chat messages
  const [messages, setMessages] = useState([
    {
      id: 0,
      text: "Hello! Ask me anything?",
      isUser: false,
    }
  ]);
  // State for the user's current input
  const [input, setInput] = useState('');
  // State to show a loading spinner
  const [isLoading, setIsLoading] = useState(false);
  // Ref to the bottom of the messages list, for auto-scrolling
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to send a message (from user or suggestion)
  const sendMessage = async (messageText) => {
    // Add the user's message to the chat
    const newUserMessage = {
      id: Date.now(),
      text: messageText,
      isUser: true,
    };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setIsLoading(true);

    try {
      // Send the message to the Python backend
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // Add the AI's response to the chat
      const aiMessage = {
        id: Date.now() + 1,
        text: data.answer,
        isUser: false,
      };
      setMessages(prevMessages => [...prevMessages, aiMessage]);

    } catch (error) {
      console.error("Error sending message:", error);
      // Show an error message in the chat
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting. Please try again later.",
        isUser: false,
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for the send button
  const handleSend = () => {
    const trimmedInput = input.trim();
    if (trimmedInput) {
      sendMessage(trimmedInput);
      setInput(''); // Clear the input field
    }
  };

  // Handler for clicking a suggestion chip
  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  // List of suggestion messages
  const suggestionMessages = [
    "What can I ask you to do?",
    "Which one of my projects is performing the best?",
    "What projects should I be concerned about right now?",
  ];

  return (
    <div style={styles.appContainer}>
      <div style={styles.chatContainer}>
        {messages.length === 1 ? (
          // --- Welcome/Suggestions View (if no messages sent yet) ---
          <>
            <div style={styles.welcomeHeader}>
              <SparkleIcon />
              <h2 style={styles.welcomeTitle}>Ask our AI anything</h2>
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
            <button
              style={isLoading ? { ...styles.sendButton, ...styles.sendButtonDisabled } : styles.sendButton}
              onClick={handleSend}
              disabled={isLoading}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Child Components ---

// Component for a single chat bubble
const ChatMessage = ({ message }) => (
  <div
    style={{
      ...styles.messageBubble,
      ...(message.isUser ? styles.userBubble : styles.aiBubble),
    }}
  >
    {message.isUser ? (
      // User messages are plain text
      <p style={styles.messageText}>{message.text}</p>
    ) : (
      // AI messages can contain HTML
      <p
        style={styles.messageText}
        dangerouslySetInnerHTML={{ __html: message.text }}
      />
    )}
  </div>
);

// Component for a suggestion chip
const SuggestionChip = ({ message, onClick }) => (
  <button style={styles.suggestionChip} onClick={onClick}>
    {message}
  </button>
);

// Component for the "typing..." bubble
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
    paddingTop: 'calc(25% - 60px)', // Adjust padding to center vertically
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
  // --- Chat Message List ---
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
    backgroundColor: '#7A37C7', // Purple for user
    color: '#FFFFFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '4px',
  },
  aiBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Light grey for AI
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
    height: '24px', // Fixed height for loading bubble
    padding: '12px 16px',
  },
  // --- Input Area ---
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
    paddingRight: '50px', // Make space for the button
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
    borderRadius: '12px', // Make it a "squircle"
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#E0C6F7', // Purple icon
    transition: 'background-color 0.2s ease',
  },
  sendButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  // --- Loading dots animation ---
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
// React's inline styles don't support @keyframes or styling HTML tags directly.
// We must inject them into the document's head.
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
  @keyframes dotFlashing {
    0% { opacity: 0.2; }
    50% { opacity: 1; }
    100% { opacity: 0.2; }
  }
  
  /* Loading dots animation setup */
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

  /* Style for SuggestionChip hover */
  button[style*="suggestionChip"]:hover {
    background-color: rgba(255, 255, 255, 0.15) !important;
  }
  
  /* Style for SendButton hover */
  button[style*="sendButton"]:not(:disabled):hover {
    background-color: rgba(255, 255, 255, 0.25) !important;
  }
  
  /* Custom scrollbar for Firefox */
  div[style*="messagesList"] {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  }
  
  /* Custom scrollbar for Webkit (Chrome, Safari) */
  div[style*="messagesList"]::-webkit-scrollbar {
    width: 6px;
  }
  div[style*="messagesList"]::-webkit-scrollbar-track {
    background: transparent;
  }
  div[style*="messagesList"]::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  /* --- Styles for Rendered HTML in AI Bubbles --- */
  div[style*="aiBubble"] p {
    margin: 0; /* Override default p margins */
  }
  div[style*="aiBubble"] b, 
  div[style*="aiBubble"] strong {
    color: #E0C6F7; /* Purple to stand out */
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
// Check if the styleSheet is already added to avoid duplicates on hot-reload
if (!document.querySelector('style[data-custom-styles]')) {
  styleSheet.setAttribute('data-custom-styles', 'true');
  document.head.appendChild(styleSheet);
}

export default App;