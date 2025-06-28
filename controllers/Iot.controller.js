import axios from "axios";
import dotenv from "dotenv";
import SeedData from "../models/Iot.model.js";

dotenv.config();

const ALL_DATA_URL = process.env.ALL_DATA_URL.replace(
  /results=\d+/,
  "results=1"
);
const WRITE_API_KEY = process.env.THINGSPEAK_WRITE_API_KEY;
const CHANNEL_ID = 2947009; // Hardcoded from Arduino code for consistency
const RELAY_UPDATE_DELAY = 17000; // 17 seconds delay for relay updates

// Helper function to sanitize feed data
const sanitizeFeed = (feed) => ({
  field1: feed.field1 || "0", // Battery health (%)
  field2: feed.field2 || "0", // Solar panel 1 voltage
  field3: feed.field3 || "0", // Solar panel 2 voltage
  field4: feed.field4 || "0", // Current (A)
  field5: feed.field5 || "0", // Relay 1
  field6: feed.field6 || "0", // Relay 2
  field7: feed.field7 || "0", // Relay 3
  field8: feed.field8 || "0", // Relay 4
  created_at: feed.created_at || new Date().toISOString(),
  entry_id: feed.entry_id || null,
});

// Controller: Fetch and Store Feed Data from ThingSpeak
export const fetchAndStoreSeedData = async (req, res) => {
  try {
    const response = await axios.get(ALL_DATA_URL, { timeout: 15000 });

    const { channel, feeds } = response.data || {};
    if (!channel || !feeds || !Array.isArray(feeds)) {
      console.warn("Received malformed data from ThingSpeak:", response.data);
      return res
        .status(400)
        .json({ error: "Invalid ThingSpeak response format" });
    }

    // Sanitize all feeds
    const sanitizedFeeds = feeds.map(sanitizeFeed);

    // Update or create entry in MongoDB
    const existingEntry = await SeedData.findOne({ "channel.id": channel.id });
    if (existingEntry) {
      sanitizedFeeds.forEach((feed) => {
        if (!existingEntry.feeds.some((f) => f.entry_id === feed.entry_id)) {
          existingEntry.feeds.push(feed);
        }
      });
      existingEntry.channel = channel;
      await existingEntry.save();
      res.status(200).json({
        message: "Data updated successfully",
        data: existingEntry,
      });
    } else {
      const seedEntry = new SeedData({ channel, feeds: sanitizedFeeds });
      await seedEntry.save();
      res.status(201).json({
        message: "Data saved successfully",
        data: seedEntry,
      });
    }
  } catch (error) {
    console.error("Error fetching/saving data:", error.message);
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({ error: "Request to ThingSpeak timed out" });
    }
    if (error.response?.status === 404) {
      return res.status(404).json({ error: "ThingSpeak API route not found" });
    }
    res.status(500).json({ error: "Failed to fetch or save data" });
  }
};

// Controller: Update Relay Flag and Preserve Sensor Data
export const updateRelayFlag = async (req, res) => {
  try {
    const { field, value } = req.body;

    // Validate input
    if (!Number.isInteger(field) || ![5, 6, 7, 8].includes(field)) {
      return res.status(400).json({
        error: "Invalid field. Only field5 to field8 are allowed for relays.",
      });
    }
    if (![0, 1].includes(value)) {
      return res.status(400).json({
        error: "Invalid value. Only 0 or 1 is allowed.",
      });
    }

    // Fetch latest data from ThingSpeak to preserve sensor values
    let latestFeed = {};
    let retries = 5; // Increased retries for reliability
    while (retries > 0) {
      try {
        const response = await axios.get(ALL_DATA_URL, { timeout: 15000 });
        const { feeds } = response.data || {};
        if (!feeds || !Array.isArray(feeds) || feeds.length === 0) {
          throw new Error("No feed data available from ThingSpeak");
        }
        latestFeed = feeds[feeds.length - 1];
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          console.error(
            "Failed to fetch latest data after retries:",
            error.message
          );
          return res
            .status(502)
            .json({ error: "Failed to fetch latest data from ThingSpeak" });
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Sanitize latest feed
    const fieldValues = sanitizeFeed(latestFeed);

    // Update the specified relay field
    fieldValues[`field${field}`] = value.toString();

    // Write all fields to ThingSpeak with delay
    const writeUrl = `https://api.thingspeak.com/update?api_key=${WRITE_API_KEY}&field1=${fieldValues.field1}&field2=${fieldValues.field2}&field3=${fieldValues.field3}&field4=${fieldValues.field4}&field5=${fieldValues.field5}&field6=${fieldValues.field6}&field7=${fieldValues.field7}&field8=${fieldValues.field8}`;

    retries = 5; // Increased retries for reliability
    let writeResponse;
    while (retries > 0) {
      try {
        writeResponse = await axios.get(writeUrl, { timeout: 15000 });
        if (writeResponse.data === 0) {
          throw new Error("ThingSpeak update failed: Zero entry ID returned");
        }
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          console.error(
            "Failed to update ThingSpeak after retries:",
            error.message
          );
          return res.status(502).json({ error: "ThingSpeak update failed" });
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Enforce 17-second delay before allowing another update
    await new Promise((resolve) => setTimeout(resolve, RELAY_UPDATE_DELAY));

    // Update MongoDB with new feed
    const newFeed = {
      ...fieldValues,
      created_at: new Date().toISOString(),
      entry_id: writeResponse.data,
    };

    const existingEntry = await SeedData.findOne({ "channel.id": CHANNEL_ID });
    if (existingEntry) {
      existingEntry.feeds.push(newFeed);
      await existingEntry.save();
    } else {
      const seedEntry = new SeedData({
        channel: { id: CHANNEL_ID },
        feeds: [newFeed],
      });
      await seedEntry.save();
    }

    res.status(200).json({
      message: `Relay flag updated successfully for field${field}`,
      field: `field${field}`,
      value,
      entryId: writeResponse.data,
      updatedFields: fieldValues,
    });
  } catch (error) {
    console.error("Error updating relay flag:", error.message);
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({ error: "Request to ThingSpeak timed out" });
    }
    if (error.response?.status === 404) {
      return res.status(404).json({ error: "ThingSpeak API route not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

// Controller: Get Latest Data from MongoDB
export const getLatestData = async (req, res) => {
  try {
    const latestEntry = await SeedData.findOne({
      "channel.id": CHANNEL_ID,
    }).sort({
      "feeds.created_at": -1,
    });

    if (!latestEntry || !latestEntry.feeds.length) {
      return res.status(404).json({ error: "No data available in database" });
    }

    const latestFeed = latestEntry.feeds[latestEntry.feeds.length - 1];

    res.status(200).json({
      message: "Latest data fetched successfully",
      channel: latestEntry.channel,
      feed: {
        batteryHealth: parseFloat(latestFeed.field1),
        solar1Voltage: parseFloat(latestFeed.field2),
        solar2Voltage: parseFloat(latestFeed.field3),
        current: parseFloat(latestFeed.field4),
        relay1: parseInt(latestFeed.field5),
        relay2: parseInt(latestFeed.field6),
        relay3: parseInt(latestFeed.field7),
        relay4: parseInt(latestFeed.field8),
        created_at: latestFeed.created_at,
      },
    });
  } catch (error) {
    console.error("Error fetching latest data:", error.message);
    res.status(500).json({ error: "Failed to fetch latest data" });
  }
};
