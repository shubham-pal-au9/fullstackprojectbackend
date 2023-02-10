const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();
app.use(cors());

const hostname = "0.0.0.0";

//connect to DB
connectDB();

//intialize middleware
app.use(express.json({ extended: false }));

app.get("/", (req, res) => res.send("API RUNNING..."));

//Define routes
app.use("/api/users", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/ticket", require("./routes/api/ticket"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, hostname, () => console.log(`Server started on port ${PORT}`));
