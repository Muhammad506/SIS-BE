import axios from "axios";
import dotenv from "dotenv";
import SeedData from "../models/Iot.model.js";

dotenv.config();

const ALL_DATA_URL = process.env.ALL_DATA_URL;

export const startSeedDataFetchLoop = () => {
  setInterval(async () => {
    try {
      const response = await axios.get(ALL_DATA_URL);

      if (!response.data || !response.data.channel || !response.data.feeds) {
        console.error("Invalid ThingSpeak response");
        return;
      }

      const seedEntry = new SeedData({
        channel: response.data.channel,
        feeds: response.data.feeds,
      });

      await seedEntry.save();
      console.log("✅ ThingSpeak data saved:", new Date().toISOString());
    } catch (error) {
      console.error("❌ Error fetching data:", error.message);
    }
  }, 35000); 
};
