


// const BASE_URL = "https://ai-345h.onrender.com";
// export const sendMessage = async (sessionId, message) => {
//   localStorage.setItem("sessionId", sessionId);
//   localStorage.setItem("message", message);
//   const res = await fetch("https://ai-345h.onrender.com/api/chat", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ sessionId, message })
//   });

//   return res.json();
// };


// export const fetchConversation = async (sessionId) => {
//   const res = await fetch(`https://ai-345h.onrender.com/api/conversations/${sessionId}`);
//   return await res.json();
// };
const BASE_URL = "https://ai-345h.onrender.com";

export const sendMessage = async (sessionId, message) => {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message })
  });

  return res.json();
};

export const fetchConversation = async (sessionId) => {
  const res = await fetch(`${BASE_URL}/api/conversations/${sessionId}`);
  return res.json();
};
