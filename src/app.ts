import express, { Express } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { specs } from "./config/swagger";
import userRoutes from "./routes/userRoutes";
import postRoutes from "./routes/postRoutes";

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

export default app;
