import axios from "axios";
import dotenv from "dotenv";
import SeedData from "../models/Iot.model.js";

dotenv.config();

// ✅ Controller: Fetch and Store Feed Data from ThingSpeak
export const fetchAndStoreSeedData = async (req, res) => {
  try {
    const url = process.env.ALL_DATA_URL;

    const response = await axios.get(url, { timeout: 35000 }); // 35s timeout

    const { channel, feeds } = response.data || {};

    if (!channel || !feeds || !Array.isArray(feeds)) {
      console.warn("Received malformed data from ThingSpeak:", response.data);
      return res
        .status(400)
        .json({ error: "Invalid ThingSpeak response format" });
    }

    const seedEntry = new SeedData({ channel, feeds });

    await seedEntry.save();

    res.status(201).json({
      message: "Data saved successfully",
      data: seedEntry,
    });
  } catch (error) {
    console.error("Error fetching/saving data:", error.message);

    if (error.code === "ECONNABORTED") {
      return res.status(504).json({ error: "Request to ThingSpeak timed out" });
    }

    res.status(500).json({ error: "Failed to fetch or save data" });
  }
};

// ✅ Controller: Update Relay Flag (field4 to field7)
export const updateRelayFlag = async (req, res) => {
  try {
    const field = Number(req.body.field);
    const value = Number(req.body.value);

    if (![4, 5, 6, 7].includes(field)) {
      return res.status(400).json({
        error: "Invalid field. Only field4 to field7 are allowed.",
      });
    }

    if (![0, 1].includes(value)) {
      return res.status(400).json({
        error: "Invalid value. Only 0 or 1 is allowed.",
      });
    }

    const apiKey = process.env.THINGSPEAK_WRITE_API_KEY;
    const url = `https://api.thingspeak.com/update?api_key=${apiKey}&field${field}=${value}`;
    const response = await axios.get(url, { timeout: 35000 });

    if (response.data === 0) {
      return res.status(502).json({ error: "ThingSpeak update failed" });
    }

    res.status(200).json({
      message: `Relay flag updated successfully for field${field}`,
      field: `field${field}`,
      value,
      entryId: response.data,
    });
  } catch (error) {
    console.error("Error updating relay flag:", error.message);

    if (error.code === "ECONNABORTED") {
      return res.status(504).json({ error: "Request to ThingSpeak timed out" });
    }

    res.status(500).json({ error: "Internal server error" });
  }
};
