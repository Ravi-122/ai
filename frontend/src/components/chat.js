import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { sendMessage, fetchConversation } from "../services/api";
import MessageBubble from "./messagebubble";
import Header from "./header";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
 
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let sessionId = localStorage.getItem("sessionId");

    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem("sessionId", sessionId);
    }

    loadConversation(sessionId);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const loadConversation = async (sessionId) => {
    try {
      const history = await fetchConversation(sessionId);
      console.log("History:", history); 
      if (Array.isArray(history)) {
        setMessages(history);
      } else if (Array.isArray(history.messages)) {
        setMessages(history.messages);
      } else {
        setMessages([]); 
        }
      } catch (err) {
        console.error("Failed to load conversation");
        setMessages([]); 
      }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const sessionId = localStorage.getItem("sessionId");

    const userMessage = {
      role: "user",
      content: input,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await sendMessage(sessionId, input);
      console.log("API response:", response);

      const assistantMessage = {
        role: "assistant",
        content: response.reply,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error generating response.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    const newSessionId = uuidv4();
    localStorage.setItem("sessionId", newSessionId);
    setMessages([]);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="chat-container">
      <Header onNewChat={handleNewChat} />

      <div className="messages-container">
        {messages.map((msg, index) => (
          <MessageBubble
            key={index}
            role={msg.role}
            content={msg.content}
            created_at={msg.created_at}
          />
        ))}

        {loading && (
          <div className="message assistant">
            <div className="message-content">Generating response...</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default Chat;
