import mongoose from "mongoose";

const feedSchema = new mongoose.Schema({
  created_at: Date,
  entry_id: Number,
  field1: String,
  field2: String,
  field3: String,
  field4: String,
  field5: String,
  field6: String,
  field7: String,
});

const channelSchema = new mongoose.Schema({
  id: Number,
  name: String,
  description: String,
  latitude: String,
  longitude: String,
  field1: String,
  field2: String,
  field3: String,
  field4: String,
  field5: String,
  field6: String,
  field7: String,
  created_at: Date,
  updated_at: Date,
  last_entry_id: Number,
});

const seedDataSchema = new mongoose.Schema({
  channel: channelSchema,
  feeds: [feedSchema],
});

const SeedData = mongoose.model("SeedData", seedDataSchema);
export default SeedData;
