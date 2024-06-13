import dotenv from "dotenv";
dotenv.config(); // Load environment variables
import connectDB from "./db/index.js"; // Ensure this path is correct
import  {app}  from "./app.js";
connectDB()
  .then(() => {
    app.listen(process.env.PORT , () => {
      console.log(`Server listening at ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGODB connection failed:", err);
  });
