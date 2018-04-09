// Width and Height of the whole visualization
var width = 400;
var height = 300;
var padding = 10;
var jsonData = null;
var centered;
var scale = 1;

// Create SVG
var svg = d3.select(".center")
    .append( "svg" )
    .attr("width", width)
    .attr("height", height);

var g = svg.append("g");

var blues = d3.scaleOrdinal().domain([3.5,4.0,4.5,5.0]).range(d3.schemeYlOrRd[4]);


// Width and Height of the whole visualization
// Set Projection Parameters
var albersProjection = d3.geoAlbers()
    .rotate([71.057,0])
    .center([0, 42.313])
    .translate([width/2,height/2]);

// Create GeoPath function that uses built-in D3 functionality to turn
// lat/lon coordinates into screen coordinates
var geoPath = d3.geoPath()
  .projection(albersProjection);


var tooltip = d3.select("body").append("div").attr("class","toolTip");

// Set the dimensions of the canvas / graph
var margin = {top: 30, right: 20, bottom: 50, left: 50};
var graphWidth = 400 - margin.left - margin.right;
var graphHeight = 300 - margin.top - margin.bottom;

// Adds the svg canvas
var graph = d3.select("#graph")
            .append("svg")
            .attr("width", graphWidth + margin.left + margin.right)
            .attr("height", graphHeight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", 
                "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleLinear().range([0, graphWidth]);
var y = d3.scale.linear().range([graphHeight, 0]);


d3.json("assets/outerboston.json", function(error, bos) {
  if (error) { console.log(error); }

  d3.json("assets/boston.geojson", function(error, data) {
    if (error) { console.log(error); }

    jsonData = data;

    albersProjection.fitSize([width, height], data);


    // Classic D3... Select non-existent elements, bind the data, append the elements, and apply attributes
    g.selectAll(".outerarea")
        .data(bos.features)
        .enter()
        .append("path")
        .attr("class","outerarea")
        .attr("opacity", "1")
        .attr("fill", "#DCDCDC")
        .attr("stroke", "#373737")
        .on("click", d => zoom(d))
        .attr("d", geoPath);

    // Classic D3... Select non-existent elements, bind the data, append the elements, and apply attributes
    g.selectAll(".boston")
        .data(data.features)
        .enter()
        .append("path")
        .attr("class","boston")
        .attr("opacity", d => opacity(d))
        .attr("fill", d => color(d))
        .attr("stroke", "#373737")
        .on("click", d => zoom(d))
        .attr("d", geoPath);

  });

  

  //albersProjection.fitSize([width, height], data);

 // albersProjection.fitExtent([[0, 0], [width, height]], data);

  // Scale the range of the data
  x.domain([0,500]);
  y.domain([3, 5]);

  // Add the y Axis
  graph.append("g")
      .call(d3.axisLeft(y)
        .ticks(5));

  // add labels to axis 
  graph.append("text")
      .attr("class","axisLabel")
      .attr("text-anchor", "middle") 
      .attr("transform", "translate("+ -1.5 * margin.right +","+(graphHeight/2)+")rotate(-90)")  
      .text("Rating");

  graph.append("text")
      .classed("axisLabel", true)
      .attr("text-anchor", "middle") 
      .attr("transform", "translate("+ (graphWidth/2) +"," +(graphHeight + .75 * margin.bottom)+")")  // centre below axis 
      .text("Review Count");

  plotItems();
});



function plotItems() {

  var extent = d3.extent(filtered_data, d => parseFloat(d.review_count));
  if (extent[1] > 500) {
    if (extent[0] >= 450) { 
      extent[0] = 400;
    }
    extent[1] = 500;
  }
  x.domain(extent);

  graph.selectAll(".xAxis").remove();

  graph.append("g")
    .attr("class","xAxis")
    .attr("transform", "translate(0," + graphHeight + ")")
    .call(d3.axisBottom(x)
    .ticks(4)
    .tickFormat(function (d) { return d == 500 ? "> 500" : d; }));

  g.selectAll(".boston")
      .data(jsonData.features)
      .attr("fill", d => color(d))
      .attr("opacity", d => opacity(d));

  g.selectAll(".circles").remove();

  g.selectAll("circle")
    .data(filtered_data).enter()
    .append("circle")
    .attr("class", "circles")
    .attr("cx", function(d) {
      var proj = albersProjection(parseLatLong(d));
      return proj[0]
    })
    .attr("cy", function(d) {
      var proj = albersProjection(parseLatLong(d));
      return proj[1]
    })
    .on('click', d => suggest(d))
    .attr("opacity", "0.95")
    .attr("r", circleSize(3) + "px")
    .attr("fill", d => blues(parseFloat(d.rating)))
    .on('mouseover', function(d) {
      tooltip.moveToFront();
      tooltip
        .style("left", d3.event.pageX - 50 + "px")
        .style("top", d3.event.pageY - 130 + "px")
        .style("display", "inline-block")
        .html(likeStringHTML(d));
    })
    .on('mouseout', function(d) {
        tooltip.style("display", "none");
    });

  g.selectAll(".likes").remove();

  g.selectAll(".likes")
    .data(Array.from(likedItems)).enter()
    .append("svg:image")
    .attr("class","likes")
    .attr("transform", function(d) {
      var proj = albersProjection(parseLatLong(d));
      return "translate(" + [proj[0] - circleSize(5),proj[1] - circleSize(5)] + ")"
    })
    .attr("height", circleSize(10) + "px")
    .attr("width", circleSize(10) + "px")
    .attr("xlink:href", "assets/heart_circle.png")
    .on('click', d => suggest(d))
    .on('mouseover', function(d) {
      tooltip.moveToFront();
      tooltip
        .style("left", d3.event.pageX - 50 + "px")
        .style("top", d3.event.pageY - 130 + "px")
        .style("display", "inline-block")
        .html(likeStringHTML(d));
    })
    .on('mouseout', function(d) {
        tooltip.style("display", "none");
    });

  g.selectAll(".selectedItem").remove();

  if (selectedItem != null) {
    g.selectAll(".selectedItem")
      .data([selectedItem]).enter()
      .append("svg:image")
      .attr("class","selectedItem")
      .attr("transform", function(d) {
        var proj = albersProjection(parseLatLong(d));
        return "translate(" + [proj[0],proj[1]] + ")"
      })
      .attr("height", circleSize(15) + "px")
      .attr("width", circleSize(15) + "px")
      .attr("xlink:href", "assets/click-dark.png")
      .on('click', d => suggest(d))
      .on('mouseover', function(d) {
        tooltip.moveToFront();
        tooltip
          .style("left", d3.event.pageX - 50 + "px")
          .style("top", d3.event.pageY - 130 + "px")
          .style("display", "inline-block")
          .html(likeStringHTML(d));
      })
      .on('mouseout', function(d) {
          tooltip.style("display", "none");
      });
    }

    graph.selectAll(".circles").remove();

    graph.selectAll("circle")
    .data(filtered_data).enter()
    .append("circle")
    .attr("class", "circles")
    .attr("transform", function(d) {
      return "translate(" + translatePoint(d) + ")"
    })
    .on('click', d => suggest(d))
    .attr("opacity", "0.75")
    .attr("r", "5px")
    .attr("fill", d => blues(parseFloat(d.rating)))
    .on('mouseover', function(d) {
      tooltip.moveToFront();
      tooltip
        .style("left", d3.event.pageX - 50 + "px")
        .style("top", d3.event.pageY - 130 + "px")
        .style("display", "inline-block")
        .html(likeStringHTML(d));
    })
    .on('mouseout', function(d) {
        tooltip.style("display", "none");
    });

  graph.selectAll(".likes").remove();

  graph.selectAll(".likes")
    .data(Array.from(likedItems)).enter()
    .append("svg:image")
    .attr("class","likes")
    .attr("transform", function(d) {
      var trans = translatePoint(d);
      if (trans[0] < 0) { trans[0] = -100; }
      return "translate(" + [trans[0]-5, trans[1]-5] + ")"
    })
    .attr("height", "10px")
    .attr("width", "10px")
    .attr("xlink:href", "assets/heart_circle.png")
    .on('click', d => suggest(d))
    .on('mouseover', function(d) {
      tooltip.moveToFront();
      tooltip
        .style("left", d3.event.pageX - 50 + "px")
        .style("top", d3.event.pageY - 130 + "px")
        .style("display", "inline-block")
        .html(likeStringHTML(d));
    })
    .on('mouseout', function(d) {
        tooltip.style("display", "none");
    });

  graph.selectAll(".selectedItem").remove();

  if (selectedItem != null) {
     graph.selectAll(".selectedItem")
    .data([selectedItem]).enter()
    .append("svg:image")
    .attr("class","selectedItem")
    .attr("transform", function(d) {
      var trans = translatePoint(d);
      return "translate(" + [trans[0], trans[1]] + ")"
    })
    .attr("height", "15px")
    .attr("width", "15px")
    .attr("xlink:href", "assets/click-white.png")
    .on('click', d => suggest(d))
    .on('mouseover', function(d) {
      tooltip.moveToFront();
      tooltip
        .style("left", d3.event.pageX - 50 + "px")
        .style("top", d3.event.pageY - 130 + "px")
        .style("display", "inline-block")
        .html(likeStringHTML(d));
    })
    .on('mouseout', function(d) {
        tooltip.style("display", "none");
    });
  }
 
}

function color(d) {
  if (filterMetrics["neighborhoods"].has(d.properties.name) || filterMetrics["neighborhoods"].size == 0) {
    return "#f4f4f4"
  } 
  return "#DCDCDC"
}

function opacity(d) {
  if (filterMetrics["neighborhoods"].has(d.properties.name) || filterMetrics["neighborhoods"].size == 0) {
    return 1;
  } 
  return 1;
}

function translatePoint(d) {
  var review = parseFloat(d.review_count);
  if (review > 500) {
    review = 500;
  }
  return [x(review),y(d.rating)];
}

// https://github.com/wbkd/d3-extended
d3.selection.prototype.moveToFront = function() {  
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

d3.selection.prototype.moveToBack = function() {  
    return this.each(function() { 
        var firstChild = this.parentNode.firstChild; 
        if (firstChild) { 
            this.parentNode.insertBefore(this, firstChild); 
        } 
    });
};

function circleSize(x) {
  return x / (.75 * scale);
}

function zoom(d) {
  var x, y, k;

  if (d && centered !== d) {
    var centroid = geoPath.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  scale = k;

  g.transition()
      .duration(750)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");

  //albersProjection.scale(k);
  plotItems();
}


