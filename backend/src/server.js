import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import insightsRoutes from "./routes/insightsRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";

const app = express();
app.use(express.json());
app.use(cors());

// Modular routes
app.use("/auth", authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/user", insightsRoutes);
app.use("/schedule", scheduleRoutes);

const port = 5100;
app.listen(port, () => console.log(`Listening on port ${port}...`));