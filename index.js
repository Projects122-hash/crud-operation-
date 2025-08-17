const express = require("express");
const fs = require("fs");
const mongoose = require("mongoose"); // ✅ added
const users = require("./MOCK_DATA.json");

const app = express();
const PORT = 8000;

// ✅ Connect MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/youtube-app-1")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Mongo Error", err));

// ✅ Define schema
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  jobTitle: { type: String },
  gender: { type: String },
  
},
{timestamps : true}
);

// ✅ Model
const User = mongoose.model("User", userSchema);

app.use(express.urlencoded({ extended: false }));
app.use(express.json()); // ✅ important for JSON requests

// Middleware
app.use((req, res, next) => {
  fs.appendFile(
    "log.txt",
    `\n${Date.now()}: ${req.ip} ${req.method} ${req.path}\n`,
    (err) => {
      // Even if error happens, we move forward
      next();
    }
  );
});

// Route to get all users as HTML list
app.get("/users", async (req, res) => {
  const allDbUsers = await User.find({});
  const html = `
    <ul>
      ${allDbUsers
        .map((user) => `<li>${user.firstName} - ${user.email}</li>`)
        .join("")}
    </ul>
  `;
  res.send(html);
});

app.get("/api/users", async (req, res) => {
  const allDbUsers = await User.find({});
  return res.json({ allDbUsers });
});
// ✅ CRUD routes
app
  .route("/api/users/:id")
  // GET user by ID
  .get(async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json(user);
    } catch (err) {
      return res.status(400).json({ error: "Invalid ID" });
    }
  })
  // PATCH update
  .patch(async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, { lastName: "Changed" });
    return res.json({ status: "Success" });
  })
  // DELETE user
  .delete(async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    return res.json({ status: "User Deleted" });
  });

// ✅ POST new user
app.post("/api/users", async (req, res) => {
  const body = req.body;

  if (
    !body ||
    !body.first_name ||
    !body.last_name ||
    !body.email ||
    !body.gender ||
    !body.job_title
  ) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  try {
    const result = await User.create({
      firstName: body.first_name,
      lastName: body.last_name,
      email: body.email,
      gender: body.gender,
      jobTitle: body.job_title,
    });

    console.log("result", result);
    return res.status(201).json({ msg: "success", user: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server Started at PORT ${PORT}`);
});
