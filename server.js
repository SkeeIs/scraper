var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT =  process.env.PORT||3000;

// Initialize Express
var app = express();

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Require Handlebars.
var exhbs = require("express-handlebars");
app.engine("handlebars", exhbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");

// Connect to the Mongo DB
// mongoose.connect("mongodb://localhost/scrapeMongoose", { useNewUrlParser: true });

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);


// Routes

// A GET route for scraping the beatport website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://www.beatport.com/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every div with a class top-ten-track-meta, and do the following:
    $("div.top-ten-track-meta").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.artist = $(element)
        .children("span.top-ten-track-artists")
        .children("a")
        .eq(0)
        .text();

      result.secondArtist =  $(element)
        .children("span.top-ten-track-artists")
        .children("a")
        .eq(1)
        .text();

      result.artistLink = "https://www.beatport.com" + 
        $(element)
        .children("span.top-ten-track-artists")
        .children("a")
        .eq(0)
        .attr("href");

      result.secondArtistLink = "https://www.beatport.com" + 
        $(element)
        .children("span.top-ten-track-artists")
        .children("a")
        .eq(1)
        .attr("href");
    
      result.title = $(element)
        .children("a.top-ten-track-title")
        .children("span.top-ten-track-primary-title")
        .text();

      result.songLink = "https://www.beatport.com" + $(element)
        .children("a.top-ten-track-title")
        .attr("href");

      result.label = $(element)
        .children("span.top-ten-track-label")
        .children("a")
        .text();

      result.labelLink = "https://www.beatport.com" + $(element)
        .children("span.top-ten-track-label")
        .children("a")
        .attr("href");  


      // Create a new Song using the `result` object built from scraping
      db.Song.create(result)
        .then(function(dbSong) {
          // View the added result in the console
          console.log(dbSong);
          
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
    });

    // If we were able to successfully scrape and save an Article, send a message to the client
    res.redirect("/");
  });
});

app.get("/", function(req, res) {
  db.Song.find({})
    .then(function(dbSong) {
      res.render("index",{songs:dbSong})
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for getting all Articles from the db
app.get("/shows", function(req, res) {
  // Grab every document in the Articles collection
  db.Song.find({})
    .then(function(dbSong) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbSong);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/songs/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Song.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbSong) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbSong);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/songs/:id/note", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Song.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbSong) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbSong);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.get("/songs/:id/liked", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Song.findOneAndUpdate({ _id: req.params.id }, { liked: req.body })
    .then(function(dbSong) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbSong);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.delete("/clear", function(req, res) {

  db.dropCollection()
    .then(function() {
      location.reload();
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
})

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
