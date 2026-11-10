
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
 
import { app } from "./app.js";
import connectDb from "./db/index.js";
 
connectDb()
  .then(() => {
    app.on("error", (err) => {
      console.error("Error:", err);
      throw err;
    });
 
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server is running on PORT: ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => {
    console.log("POSTGRESQL CONNECTION FAILED !!", err);
    process.exit(1);
  });
 
