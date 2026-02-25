
const axios = require("axios");
const express = require("express");
const router = express.Router();
const db = require("../db");
const fs = require("fs");


/* =====================================================
   Load Documents
===================================================== */

const docs = JSON.parse(fs.readFileSync("./docs.json", "utf8"));


/* =====================================================
   Document Matching Function
===================================================== */

function findRelevantDoc(question) {
  const lowerQuestion = question.toLowerCase();

  let bestMatch = null;
  let highestScore = 0;

  docs.forEach((doc) => {
    const title = doc.title.toLowerCase();
    let score = 0;

    if (lowerQuestion.includes(title)) {
      score += 5;
    }

    const titleWords = title.split(" ");

    titleWords.forEach((word) => {
      if (lowerQuestion.includes(word)) {
        score += 1;
      }
    });

    if (score > highestScore) {
      highestScore = score;
      bestMatch = doc;
    }
  });

  return highestScore > 0 ? bestMatch : null;
}

/* =====================================================
   POST /api/chat
===================================================== */

router.post("/chat", async (req, res) => {


  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        error: "sessionId and message are required.",
      });
    }

    /* ================= Session Handling ================= */

    db.run(`INSERT OR IGNORE INTO sessions(id) VALUES(?)`, [sessionId]);

    db.run(
      `UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [sessionId]
    );

    /* ================= Save User Message ================= */

    db.run(
      `INSERT INTO messages(session_id, role, content)
       VALUES(?,?,?)`,
      [sessionId, "user", message]
    );

    /* ================= Get Chat History ================= */

    db.all(
      `SELECT role, content
       FROM messages
       WHERE session_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [sessionId],
      async (err, rows) => {
        console.log("DB ALL CALLED");

        if (err) {
          return res.status(500).json({
            error: "Database error.",
          });
        }

        const history = rows.reverse();
        const relevantDoc = findRelevantDoc(message);

        /* ================= If No Matching Doc ================= */

        if (!relevantDoc) {
          const fallback =
            "Sorry, I don’t have information about that.";

          db.run(
            `INSERT INTO messages(session_id, role, content)
             VALUES(?,?,?)`,
            [sessionId, "assistant", fallback]
          );

          return res.json({
            reply: fallback,
            tokensUsed: 0,
          });
        }

        /* ================= Build Prompt ================= */

        const prompt = `
You are a support assistant.

STRICT RULE:
- Use ONLY the documentation provided below.
- If answer not found, reply exactly:
"Sorry, I don’t have information about that."

DOCUMENTATION:
${relevantDoc.content}

CHAT HISTORY:
${history.map((h) => `${h.role}: ${h.content}`).join("\n")}

USER QUESTION:
${message}
`;

        /* ================= Call Gemini ================= */

        try {
 

          const response = await axios.post(
             `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0,
              },
            }
          );

     
          console.log(JSON.stringify(response.data, null, 2));

          const reply =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Sorry, I don’t have information about that.";

          const tokensUsed =
            response.data?.usageMetadata?.totalTokenCount || 0;

          db.run(
            `INSERT INTO messages(session_id, role, content)
             VALUES(?,?,?)`,
            [sessionId, "assistant", reply]
          );

          return res.json({
            reply,
            tokensUsed,
          });

        } catch (llmError) {
          
          console.log(
            llmError.response?.data || llmError.message
          );

          return res.status(500).json({
            error: "LLM API failure",
            details:
              llmError.response?.data || llmError.message,
          });
        }
      }
    );
  } catch (error) {


    return res.status(500).json({
      error: "Server error",
    });
  }
});

/* =====================================================
   GET Conversations
===================================================== */

router.get("/conversations/:sessionId", (req, res) => {
  db.all(
    `SELECT role, content, created_at
     FROM messages
     WHERE session_id = ?
     ORDER BY created_at ASC`,
    [req.params.sessionId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          error: "Database error.",
        });
      }

      res.json(rows);
    }
  );
});

/* =====================================================
   GET Sessions
===================================================== */

router.get("/sessions", (req, res) => {
  db.all(
    `SELECT id, created_at, updated_at
     FROM sessions
     ORDER BY updated_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          error: "Database error.",
        });
      }

      res.json(rows);
    }
  );
});

module.exports = router;