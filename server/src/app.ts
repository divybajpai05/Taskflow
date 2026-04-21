import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL!]
    : ["http://localhost:5173"];

// CORS options
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["X-Total-Count", "Content-Range"], // optional
  optionsSuccessStatus: 200,
};

app.use(express.json());
// Apply CORS middleware
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));


// Routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("Working");
});

export default app;
