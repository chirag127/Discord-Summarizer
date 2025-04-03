const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { summarizeMessages } = require("./summarizer");
const connectDB = require("./db/connection");
const {
    storeSummary,
    getSummariesByUser,
    getSummariesByChannel,
    deleteSummary,
} = require("./services/summaryService");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

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
        const { messages, mode, style, userId, serverId, channelId } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res
                .status(400)
                .json({ error: "Invalid or empty messages array" });
        }

        // Get summary from Gemini
        const summary = await summarizeMessages(messages, mode, style);

        // Store summary in MongoDB if userId is provided
        let savedSummary = null;
        if (userId) {
            savedSummary = await storeSummary(
                userId,
                summary,
                messages,
                mode || "brief",
                style || "bullets",
                serverId,
                channelId
            );
        }

        res.json({
            summary,
            summaryId: savedSummary ? savedSummary._id : null,
        });
    } catch (error) {
        console.error("Error summarizing messages:", error);
        res.status(500).json({ error: "Failed to summarize messages" });
    }
});

// Get past summaries for a user
app.get("/summaries/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        const summaries = await getSummariesByUser(userId, limit);

        res.json({ summaries });
    } catch (error) {
        console.error("Error retrieving summaries:", error);
        res.status(500).json({ error: "Failed to retrieve summaries" });
    }
});

// Get summaries for a specific channel
app.get("/summaries/channel/:serverId/:channelId", async (req, res) => {
    try {
        const { serverId, channelId } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        const summaries = await getSummariesByChannel(
            serverId,
            channelId,
            limit
        );

        res.json({ summaries });
    } catch (error) {
        console.error("Error retrieving channel summaries:", error);
        res.status(500).json({ error: "Failed to retrieve summaries" });
    }
});

// Delete a summary
app.delete("/summaries/:summaryId", async (req, res) => {
    try {
        const { summaryId } = req.params;

        const success = await deleteSummary(summaryId);

        if (success) {
            res.json({
                success: true,
                message: "Summary deleted successfully",
            });
        } else {
            res.status(404).json({
                success: false,
                error: "Summary not found",
            });
        }
    } catch (error) {
        console.error("Error deleting summary:", error);
        res.status(500).json({ error: "Failed to delete summary" });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
