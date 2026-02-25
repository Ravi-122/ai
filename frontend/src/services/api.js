



export const sendMessage = async (sessionId, message) => {
  localStorage.setItem("sessionId", sessionId);
  localStorage.setItem("message", message);
  const res = await fetch("http://localhost:5000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message })
  });

  return res.json();
};


export const fetchConversation = async (sessionId) => {
  const res = await fetch(`http://localhost:5000/api/conversation/${sessionId}`);
  const data = await res.json();
  return data.conversation; 
};
