const Listing = require("../models/listing");
const Booking = require("../models/booking");

module.exports.createBooking = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    const { checkIn, checkOut, guests } = req.body.booking;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const nights = Math.ceil(
        (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    );

    if (nights <= 0) {
        req.flash("error", "Check-out date must be after check-in date");
        return res.redirect(`/listings/${id}`);
    }

    // ---- Overlap check: block double booking ----
    const conflictingBooking = await Booking.findOne({
        listing: listing._id,
        status: { $ne: "cancelled" },
        checkIn: { $lt: checkOutDate },
        checkOut: { $gt: checkInDate },
    });

    if (conflictingBooking) {
        req.flash("error", "This listing is already booked for those dates. Please choose different dates.");
        return res.redirect(`/listings/${id}`);
    }
    // -----------------------------------------------

    const totalPrice = nights * listing.price;

    const newBooking = new Booking({
        listing: listing._id,
        user: req.user._id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
        totalPrice,
    });

    await newBooking.save();
    req.flash("success", "Booking confirmed!");
    res.redirect(`/bookings/${newBooking._id}`);
};

module.exports.myBookings = async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate("listing")
        .sort({ createdAt: -1 });
    res.render("bookings/index.ejs", { bookings });
};

module.exports.showBooking = async (req, res) => {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate("listing");
    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect("/bookings");
    }
    res.render("bookings/show.ejs", { booking });
};

module.exports.cancelBooking = async (req, res) => {
    const { bookingId } = req.params;
    await Booking.findByIdAndUpdate(bookingId, { status: "cancelled" });
    req.flash("success", "Booking cancelled");
    res.redirect("/bookings");
};