const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const UPLOAD_DIR = "uploads/videos";
const CHANNEL_FILE = "uploads/channels.json";
const VIDEO_FILE = "uploads/videos.json";

// Make folders/files if they don't exist
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({ dest: UPLOAD_DIR });

app.use(express.json());
app.use(express.static("public"));
app.use("/videos", express.static(UPLOAD_DIR));

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Upload with channel password
app.post("/upload", upload.single("video"), (req, res) => {
  const { channel, password } = req.body;

  if (!channel || !password) {
    return res.status(400).json({ error: "Missing channel or password" });
  }

  const channels = readJSON(CHANNEL_FILE);
  const videos = readJSON(VIDEO_FILE);

  // Create channel if new
  if (!channels[channel]) {
    channels[channel] = password;
  } else if (channels[channel] !== password) {
    return res.status(403).json({ error: "Wrong password" });
  }

  videos.push({
    file: req.file.filename,
    channel
  });

  writeJSON(CHANNEL_FILE, channels);
  writeJSON(VIDEO_FILE, videos);

  res.json({ success: true });
});

// Get videos
app.get("/list", (req, res) => {
  res.json(readJSON(VIDEO_FILE));
});

// Get channels
app.get("/channels", (req, res) => {
  res.json(Object.keys(readJSON(CHANNEL_FILE)));
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
if (!fs.existsSync(CHANNEL_FILE)) fs.writeFileSync(CHANNEL_FILE, "{}");
if (!fs.existsSync(VIDEO_FILE)) fs.writeFileSync(VIDEO_FILE, "[]");


