// Whenever someone clicks id save-note tag
$(document).on("click", ".add-note", function() {
  // Empty the notes from the note section
  $("#notes").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/songs/" + thisId
  })
    // With that done, add the note information to the page
    .then(function(data) {
      console.log(data);
      // The title of the article
      $("#exampleModalLongTitle").html(`<h4>${data.title}</h4>
                                        <p>by</p>
                                        <h6>${data.artist}</h6>`);

      // A button to submit a new note, with the id of the article saved to it
      $("#save-note").attr("data-id", data._id);

      // If there's a note in the article
      if (data.note) {
        // Place the body of the note in the body textarea
        $("#notes").val(data.note.body);
      }
    });
});

// When you click the savenote button
$(document).on("click", "#save-note", function() {
  //hide the modal
  $("#exampleModalCenter").modal('hide');
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/songs/" + thisId + "/note",
    data: {
      // Value taken from note textarea
      body: $("#notes").val()
    }
  })
    // With that done
    .then(function(data) {
      // Log the response
      console.log(data);
      // Empty the notes section
      $("#notes").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#notes").val("");
});

$(document).on("click", ".like-track", function() {
  var thisId = $(this).attr("data-id");
  var likedStatus;
  var trackCard = $(this).parent().parent();
  console.log("LIKED TRACK ID" + thisId);

  if (trackCard.hasClass("liked-track")) {
    trackCard.removeClass("liked-track");
    likedStatus = false;
  }
  else {
    trackCard.addClass("liked-track");
    likedStatus = true;
  }

  $.ajax({
    method: "GET",
    url: "/songs/" + thisId + "/liked",
    data: {
      
      body: likedStatus
    }

  })

});

$(document).on("click", ".scrape-link", function() {
  $(".content-render").empty();
  $.get("/scrape", function() {
      location.reload(true);
    });
});

$(document).on("click", ".delete-link", function() {
  $.delete("/clear", function() {
      location.reload(true);
    });
})
