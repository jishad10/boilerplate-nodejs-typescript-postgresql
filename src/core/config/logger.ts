import winston from "winston";
import path from "path";
import fs from "fs";
import config from "./config";


// Ensure logs directory exists
const logDir = path.resolve("logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger: winston.Logger = winston.createLogger({
  level: config.env === "production" ? "info" : "debug",

  format: winston.format.combine(
    winston.format.timestamp({
      format: () =>
        new Date().toLocaleString("en-US", {
          timeZone: "Asia/Dhaka",
        }),
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),

  transports: [
    new winston.transports.Console({
      format:
        config.env === "production"
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            ),
    }),

    new winston.transports.File({
      filename: path.join(logDir, "app.log"),
    }),
  ],
});


export default logger;