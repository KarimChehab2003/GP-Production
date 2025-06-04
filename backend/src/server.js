import express from "express";
import cors from "cors";
// import studentRoutes from "./routes/studentRoutes.js"; 
import authRoutes from "./routes/authRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";

const app = express();
app.use(express.json());
app.use(cors());

// Modular routes
app.use("/auth", authRoutes);
app.use("/api", quizRoutes);


const port = 5100;
app.listen(port, () => console.log(`Listening on port ${port}...`));