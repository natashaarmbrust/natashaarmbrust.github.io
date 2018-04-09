var categories = new Set();
var data = [];
var filtered_data = [];
var neighborhoods = new Set();
var filterMetrics = 
{
  "rating": 0,
  "reviewCount": 0,
  "categories": new Set(),
  "neighborhoods": new Set()
}
var likedItems = new Set(); // liked items associated with a filter
var selectedItem = null;

///
/// MARK - GATHER DATA 
///

d3.csv("dataset.csv", function(error, d) {
  createDataStructures(error, d, null);
  reset();
});


function createDataStructures(error, d, callback) {
  if (error) { console.log(error); } 

  // not sure if we need this data structure but i want to keep it just in case
  data = d.map( function (row) { // map the data into our own structure 
    categories.add(row["search category"]);
    if (row["neighborhood"] != "") {
      neighborhoods.add(row["neighborhood"]);
    }
    return row;
  });

  filtered_data = data;

  // add page elements for selection picker depending on data
  categories.forEach(function (c) {
     $('#category').append('<option id="'+ c +'">'+ titleCase(c) +'</option>');
     $("#category").selectpicker("refresh");
  });
  neighborhoods.forEach(function (n) {
     $('#neighborhood').append('<option id="'+ n +'">'+ titleCase(n) +'</option>');
     $("#neighborhood").selectpicker("refresh");
  });
};

///
/// MARK - FILTERING
///

// gather the filtering metrics the user has selected
function filterData() {
  $("#category option").each(function(i){
    if(this.selected) {
      filterMetrics["categories"].add($(this).val().toLowerCase());
    } else {
      filterMetrics["categories"].delete($(this).val().toLowerCase());
    }
  });

  $("#neighborhood option").each(function(i){
    if(this.selected) {
      filterMetrics["neighborhoods"].add($(this).val());
    } else {
      filterMetrics["neighborhoods"].delete($(this).val());
    }
  });

  filterMetrics["rating"] = parseFloat($("#rating").val());
  filterMetrics["reviewCount"] = parseFloat($("#review").val());

  filter();
  reset();
  //plotItems();
};

// filter the data
function filter() {
  console.log("filtering");
  likedItemsForFilteringMetric = []; // reset liked items 

  filtered_data = data.filter( function (row) {
    if (parseFloat(row["rating"]) < filterMetrics["rating"]) {
      return false; 
    }

    if (parseFloat(row["review_count"]) < filterMetrics["reviewCount"]) {
      return false;
    }

    if (!(filterMetrics["categories"].has(row["search category"]) || filterMetrics["categories"].size == 0)){
      var keep = false;
      filterMetrics["categories"].forEach( function (c) {
        if(includes(row,c)) {
          keep = true;
        }
      });
      if(!keep) {
        return false;
      }
    }

    if (!(filterMetrics["neighborhoods"].has(row["neighborhood"]) || filterMetrics["neighborhoods"].size == 0)){
      return false;
    }

    return true;
  });
}


///
/// MARK - PARSING HELPER FUNCTIONS 
///

// does this row contain a category 
function includes(row, category) {
  return row["categories"].includes(category);
};

// taken from https://medium.freecodecamp.org/three-ways-to-title-case-a-sentence-in-javascript-676a9175eb27
function titleCase(str) {
  return str.toLowerCase().split(' ').map(function(word) {
    return word.replace(word[0], word[0].toUpperCase());
  }).join(' ');
}

function parseFloat(string) {
  if (Number.isNaN(Number.parseFloat(string))) {
    return 0;
  }
  return Number.parseFloat(string);
}

///
/// MARK - LIKING
///

function like() {
  if (selectedItem != null) {
    likedItems.add(selectedItem);
  }
  hideItems();
  $("#nothing").hide();
  selectedItem = null;
  layoutLikes();
  plotItems();
}

function layoutLikes() {
  $(".listItems").html("");
  likedItems.forEach( function(item) {
    $(".listItems").append("<div class='listItem'> " + 
      "<img id='listImage' src='" + item.image_url + "' alt='Image not avaliable'>" +
        "<div class='listOutline'>" + 
        "<div class='listTitle'>" + item.name + "</div>" + 
        "<div class='listNeigh'>" + item.neighborhood + "</div>" + 

        "<div class='listRating'><div class ='bigText'>" + item.rating + "</div>Rating</div>" + 
        "<div class='listReview'><div class ='bigText'>" + item.review_count + "</div>Reviews</div>" + 
        "<div class='listCateg'>" + parseCategories(item) + "</div>" + 
        "<a href='" + item.url + "' class='listUrl'>See more</a>" + 
        "</div><div class='deleteItem'><img src='assets/cross.png' class='swipe' id='" + item.name.hashCode() + "' alt='cross'></div></div>");
    $("#" + item.name.hashCode()).click (function () {
      unlike(itemName=item.name);
    });
  });
}

function likeStringHTML(item) {
  return "<div> " + 
      "<img id='listImage' src='" + item.image_url + "' alt='Image not avaliable'>" +
        "<div class='toolTipOutline'>" + 
        "<div class='listTitle'>" + item.name + "</div>" + 
        "<div class='listNeigh'>" + item.neighborhood + "</div>" + 
        "<div class='listRating'><div class ='bigText'>" + item.rating + "</div>Rating</div>" + 
        "<div class='listReview'><div class ='bigText'>" + item.review_count + "</div>Reviews</div>" + 
        "<div class='listCateg'>" + parseCategories(item) + "</div></div>";
}

function unlike(itemName=null) {
  console.log("unliking");
  if(itemName == null) {
    item = selectedItem;
    reset();
  } else {
    likedItems.forEach(function(i) {
      if (i.name == itemName) {
        item = i;
      }
    });
  }
  if (likedItems.has(item)) {
    likedItems.delete(item);
  }
  
  layoutLikes();
  plotItems();
}

function suggest(d=null) {
  if (d == null) {
    selectedItem = filtered_data[Math.floor(Math.random()*filtered_data.length)];
  } else {
    selectedItem = d;
  }
  
  showItems();
  $("#title").text(selectedItem.name);
  $("#neigh").text(selectedItem.neighborhood);
  $("#cardImage").attr("src", selectedItem.image_url);
  $("#rating .bigText").text(selectedItem.rating);
  $("#review .bigText").text(selectedItem.review_count);
  $("#snippet").text(selectedItem.snippet_text);
  $("#categ").text(parseCategories(selectedItem));
  $("#url").attr("href", selectedItem.url);
  plotItems();
}


function reset() {
  // get random element from filtered data 
  hideItems();
  if (filtered_data.length == 0) {
    $("#random").hide();
  } else {
    $("#nothing").hide();
  }
  
  selectedItem = null;
  plotItems();
}

function hideItems() {
  $("#cardImage").hide();
  $(".outline").hide();
  $("#nothing").show();
  $("#random").show()
  $("#swipeContainer").hide();
  return 
}

function showItems() {
  $("#cardImage").show();
  $(".outline").show();
  $("#nothing").hide();
  $("#random").hide()
  $("#swipeContainer").show();
  return 
}

function parseLatLong(item) {
  var location = item["location"];
  var longIndex = location.indexOf("u'longitude':") ;
  var latIndex = location.indexOf("u'latitude':") ;
  var lat = location.substring(latIndex + "u'latitude': ".length, longIndex-2);
  var long = location.substring(longIndex + "u'longitude': ".length, location.indexOf("}",longIndex));
  return [long,lat];
}


function parseCategories(item) {
  var minusU = item["categories"].replace(/u'/g, '');
  minusU = minusU.replace(/'/g, '');
  minusU = minusU.replace(/\[/g, '');
  minusU = minusU.replace(/\]/g, '');
  minusU = minusU.replace(/ /g, '');
  var categories = minusU.split(",");
  categories = categories.filter( function(x,i) {
    return i % 2 == 0;
  })
  categories = categories.toString().replace(/,/g, ", ");
  return categories.replace(/&/g, " & ");
}

String.prototype.hashCode = function(){
  var hash = 0;
  if (this.length == 0) return hash;
  for (i = 0; i < this.length; i++) {
    char = this.charCodeAt(i);
    hash = ((hash<<5)-hash)+char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}









































