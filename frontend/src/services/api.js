



export const sendMessage = async (sessionId, message) => {
  localStorage.setItem("sessionId", sessionId);
  localStorage.setItem("message", message);
  const res = await fetch("https://ai-345h.onrender.com/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message })
  });

  return res.json();
};


export const fetchConversation = async (sessionId) => {
  const res = await fetch(`https://ai-345h.onrender.com/api/conversation/${sessionId}`);
  const data = await res.json();
  return data.conversation; 
};
