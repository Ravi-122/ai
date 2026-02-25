function Header({ onNewChat }) {
  return (
    <div className="header">
      <h2>AI </h2>
      <button className="new-chat-btn" onClick={onNewChat}>
        New Chat
      </button>
    </div>
  );
}

export default Header;