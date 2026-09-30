const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const initdata = require("./data.js");
const Listing = require("../models/listing.js");

const DB_URL = process.env.ATLASDB_URL;

async function main() {
    if (!DB_URL) {
        throw new Error("ATLASDB_URL is not defined in .env");
    }
    await mongoose.connect(DB_URL);
}

const initDB = async () => {
    await Listing.deleteMany({});
    console.log("Data was initialized");
};

main()
    .then(async () => {
        console.log("connected to DB");
        await initDB();
        await mongoose.disconnect();
    })
    .catch((err) => {
        console.log(err);
    });