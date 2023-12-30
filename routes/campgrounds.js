const express = require("express");
const router = express.Router();
const Campground = require("../models/campground");
const campgrounds = require("../controllers/campgrounds");
const catchAsync = require("../utils/catchAsync");
const { isLoggedIn, isAuthor, validateCampground } = require("../middleware");
const multer = require("multer");
const { storage } = require("../cloudinary");
const upload = multer({ storage });

router
  .route("/")
  .get(catchAsync(campgrounds.index))
  .post(
    isLoggedIn,
    upload.array("campground[image]"),
    validateCampground,
    catchAsync(campgrounds.createCampground)
  );

router.get('/campgrounds', async (req, res) => {
    try {
      const searchTerm = req.query.search || ''; // Assuming the search term is sent as a query parameter
      let campgrounds;
  
      if (searchTerm) {
        // If there's a search term, filter the campgrounds
        campgrounds = await Campground.find({ searchTerm: { $regex: new RegExp(searchTerm, 'i') } });
      } else {
        // If no search term, retrieve all campgrounds
        campgrounds = await Campground.find({});
      }
  
      res.render('campgrounds/index', { campgrounds, searchTerm });
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });

router.get("/new", isLoggedIn, campgrounds.renderNewForm);

router
  .route("/:id")
  .get(catchAsync(campgrounds.showCampground))
  .put(
    isLoggedIn,
    isAuthor,
    upload.array("campground[image]"),
    validateCampground,
    catchAsync(campgrounds.updateCampground)
  )
  .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

router.get(
  "/:id/edit",
  isLoggedIn,
  isAuthor,
  catchAsync(campgrounds.renderEditForm)
);

module.exports = router;
