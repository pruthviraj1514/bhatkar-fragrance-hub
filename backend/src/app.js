const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const authRoute = require("./routes/auth.route");
const { httpLogStream } = require("./utils/logger");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(morgan("dev"));
app.use(morgan("combined", { stream: httpLogStream }));

// ✅ CORS (only once, correctly configured)
app.use(
  cors({
    origin: "https://psychic-lamp-r49rp79474pr2xjq5-8080.app.github.dev",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: false
  })
);

app.use("/api/auth", authRoute);

app.get("/", (req, res) => {
  res.status(200).send({
    status: "success",
    data: {
      message: "API working fine"
    }
  });
});

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).send({
    status: "error",
    message: err.message
  });
});

module.exports = app;
