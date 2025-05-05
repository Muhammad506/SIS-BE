// import dotenv from "dotenv";
// import mongoose from "mongoose";

// dotenv.config();

// const connectDB = async () => {
//   const maxRetries = 5;
//   let retryCount = 0;

//   const connectWithRetry = async () => {
//     try {
//       // In production, avoid logging the full URI
//       const isProduction = process.env.NODE_ENV === "production";
//       console.log(
//         "Attempting to connect to MongoDB" +
//           (isProduction ? "" : " with URI: " + process.env.MONGO_URI)
//       );

//       const conn = await mongoose.connect(process.env.MONGO_URI);
//       console.log("MongoDB connected successfully!");
//       return conn;
//     } catch (error) {
//       console.error("MongoDB connection error:", error.message);
//       retryCount++;

//       if (retryCount < maxRetries) {
//         console.log(`Retrying connection (${retryCount}/${maxRetries})...`);
//         await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
//         return connectWithRetry();
//       } else {
//         console.error("Max retries reached. Exiting process.");
//         process.exit(1);
//       }
//     }
//   };

//   return connectWithRetry();
// };

// export default connectDB;

// import dotenv from "dotenv";
// import mongoose from "mongoose";

// dotenv.config();

// const connectDB = async () => {
//   const maxRetries = 5;
//   let retryCount = 0;

//   const connectWithRetry = async () => {
//     try {
//       const isProduction = process.env.NODE_ENV === "production";
//       console.log(
//         "[DB] Attempting to connect to MongoDB" +
//           (isProduction ? "" : " with URI: " + process.env.MONGO_URI)
//       );

//       const conn = await mongoose.connect(process.env.MONGO_URI, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//       });

//       console.log("[DB] MongoDB connected successfully!");
//       return conn;
//     } catch (error) {
//       console.error("[DB] Connection error:", error.message);
//       retryCount++;

//       if (retryCount < maxRetries) {
//         console.log(
//           `[DB] Retrying connection (${retryCount}/${maxRetries})...`
//         );
//         await new Promise((resolve) => setTimeout(resolve, 5000));
//         return connectWithRetry();
//       } else {
//         console.error("[DB] Max retries reached. Exiting process.");
//         process.exit(1);
//       }
//     }
//   };

//   return connectWithRetry();
// };

// export default connectDB;

import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const connectDB = async () => {
  const maxRetries = 5;
  let retryCount = 0;

  const connectWithRetry = async () => {
    try {
      const isProduction = process.env.NODE_ENV === "production";
      console.log(
        "[DB] Attempting to connect to MongoDB" +
          (isProduction ? "" : " with URI: " + process.env.MONGO_URI)
      );

      const conn = await mongoose.connect(process.env.MONGO_URI);

      console.log("[DB] MongoDB connected successfully!");
      return conn;
    } catch (error) {
      console.error("[DB] Connection error:", error.message);
      retryCount++;

      if (retryCount < maxRetries) {
        console.log(
          `[DB] Retrying connection (${retryCount}/${maxRetries})...`
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return connectWithRetry();
      } else {
        console.error("[DB] Max retries reached. Exiting process.");
        process.exit(1);
      }
    }
  };

  return connectWithRetry();
};

export default connectDB;
