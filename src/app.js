
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
// setting up express app
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
); //setting cors
// app.use(express.json({ limit: "16kb" })); //setting up express to accept json
app.use(express.json()); //setting up express to accept json
app.use(express.urlencoded({ extended: true, limit: "16kb" })); //this allows the use of adding extended objects
app.use(express.static("public"));
app.use(cookieParser())

//routes import
import router from "./routes/user.routes.js";

//routes declaration
app.use("/api/v1/users", router); //users routes
export { app };
