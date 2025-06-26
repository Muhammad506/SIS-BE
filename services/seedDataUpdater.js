import axios from "axios";
import dotenv from "dotenv";
import SeedData from "../models/Iot.model.js";

dotenv.config();

const ALL_DATA_URL = process.env.ALL_DATA_URL.replace(
  /results=\d+/,
  "results=1"
);

export const startSeedDataFetchLoop = () => {
  setInterval(async () => {
    try {
      const response = await axios.get(ALL_DATA_URL, { timeout: 15000 });

      if (
        !response.data ||
        !response.data.channel ||
        !response.data.feeds ||
        !Array.isArray(response.data.feeds)
      ) {
        console.error("Invalid ThingSpeak response");
        return;
      }

      // Sanitize the latest feed to ensure all fields are present
      const feeds = response.data.feeds.map((feed) => ({
        field1: feed.field1 || "0",
        field2: feed.field2 || "0",
        field3: feed.field3 || "0",
        field4: feed.field4 || "0",
        field5: feed.field5 || "0",
        field6: feed.field6 || "0",
        field7: feed.field7 || "0",
        field8: feed.field8 || "0",
        created_at: feed.created_at || new Date().toISOString(),
      }));

      // Check if channel already exists in MongoDB
      const existingEntry = await SeedData.findOne({
        "channel.id": response.data.channel.id,
      });

      if (existingEntry) {
        // Update existing entry by adding new sanitized feeds
        existingEntry.feeds.push(...feeds);
        existingEntry.channel = response.data.channel; // Update channel metadata
        await existingEntry.save();
        console.log("✅ ThingSpeak data updated:", new Date().toISOString());
      } else {
        // Create new entry with sanitized feeds
        const seedEntry = new SeedData({
          channel: response.data.channel,
          feeds,
        });
        await seedEntry.save();
        console.log("✅ ThingSpeak data saved:", new Date().toISOString());
      }
    } catch (error) {
      console.error("❌ Error fetching data:", error.message);
    }
  }, 15000); // 15s interval to align with Arduino and ThingSpeak rate limits
};
