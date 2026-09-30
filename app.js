if(process.env.NODE_ENV != "production") {
    require("dotenv").config();
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const bookingRouter = require("./routes/booking.js");
const myBookingsRouter = require("./routes/myBookings.js");
const defaultLocalUrl = "mongodb://127.0.0.1:27017/heavanhub";
const dbUrl = process.env.ATLASDB_URL || defaultLocalUrl;
let connectedDbUrl = dbUrl;
let memoryServer;
const PORT = process.env.PORT || 8080;
main()
    .then(() => {
        console.log("connected to DB");
        startApp();
    })
    .catch((err) => {
        console.log(err);
    })
async function main() {
    try {
        console.log(`Connecting to MongoDB at ${dbUrl}`);
        await mongoose.connect(dbUrl);
    } catch (err) {
        console.log("Primary DB connection failed:", err.message);
        if (dbUrl !== defaultLocalUrl) {
            console.log(`Falling back to local MongoDB at ${defaultLocalUrl}`);
            try {
                await mongoose.disconnect();
                connectedDbUrl = defaultLocalUrl;
                await mongoose.connect(defaultLocalUrl);
            } catch (localErr) {
                console.log("Local DB fallback failed:", localErr.message);
                console.log("Starting in-memory MongoDB for development...");
                await mongoose.disconnect();
                memoryServer = await MongoMemoryServer.create();
                connectedDbUrl = memoryServer.getUri();
                await mongoose.connect(connectedDbUrl);
            }
        } else {
            console.log("Starting in-memory MongoDB for development...");
            await mongoose.disconnect();
            memoryServer = await MongoMemoryServer.create();
            connectedDbUrl = memoryServer.getUri();
            await mongoose.connect(connectedDbUrl);
        }
    }
}
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

function startApp() {
    const store = MongoStore.create({
        clientPromise: mongoose.connection.asPromise().then(conn => conn.getClient()),
        crypto: {
            secret: process.env.SECRET,
        },
        touchAfter: 24 * 3600,
    });
    store.on("error" , (err) => {
        console.log("ERROR in MONGO SESSION STORE", err);
    });
    const sessionOptions = {
        store,
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            expires: Date.now() + 7 *24 * 60 * 60 * 1000,
            maxAge: 7 *24 * 60 * 60 * 1000,
        }
    };
    app.use(session(sessionOptions));
    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
    passport.use(new LocalStrategy(User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
    app.use((req, res, next) => {
        res.locals.success = req.flash("success");
        res.locals.error = req.flash("error");
        res.locals.currUser = req.user;
        next();
    })
    app.use("/listings", listingRouter);
    app.use("/listings/:id/bookings", bookingRouter);
    app.use("/listings/:id/reviews", reviewRouter);
    app.use("/", userRouter);
    app.use("/bookings", myBookingsRouter);

    app.use((err, req, res, next) => {
        let {statusCode=500, message="Something went wrong!"} = err;
        res.status(statusCode).render("error.ejs", {message});
        // res.status(statusCode).send(message);
    });

    app.listen(PORT, () => {
        console.log(`server is listening to port ${PORT}`);
    });
}