
const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isBookingOwner } = require("../middleware.js");
const bookingController = require("../controllers/bookings.js");

router.get("/", isLoggedIn, wrapAsync(bookingController.myBookings));
router.get("/:bookingId", isLoggedIn, isBookingOwner, wrapAsync(bookingController.showBooking));
router.post("/:bookingId/cancel", isLoggedIn, isBookingOwner, wrapAsync(bookingController.cancelBooking));

module.exports = router;