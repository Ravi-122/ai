function messagebubble({ role, content, created_at }) {
  const isUser = role === "user";

  const formattedTime = created_at
    ? new Date(created_at).toLocaleTimeString()
    : "";

  return (
    <div className={`message ${isUser ? "user" : "assistant"}`}>
      <div className="message-content">{content}</div>
      <div className="timestamp">{formattedTime}</div>
    </div>
  );
}

export default messagebubble;