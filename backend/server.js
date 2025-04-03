const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { summarizeMessages } = require("./summarizer");

// Load environment variables
dotenv.config();

// Debug environment variables
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
    res.send("Discord Summarizer API is running");
});

// Summarize messages endpoint
app.post("/summarize", async (req, res) => {
    try {
        const { messages, mode, style } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res
                .status(400)
                .json({ error: "Invalid or empty messages array" });
        }

        // Get summary from Gemini
        const summary = await summarizeMessages(messages, mode, style);

        res.json({
            summary,
            summaryId: null, // No database storage
        });
    } catch (error) {
        console.error("Error summarizing messages:", error);
        res.status(500).json({ error: "Failed to summarize messages" });
    }
});

// No database-related endpoints needed

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
