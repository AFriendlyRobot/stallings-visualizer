var X_INNER_SPACING = 0; // px
var X_OUTER_MARGIN = 0; // px


// actmap format:
/*
{
	teacher_activity: {
		student_activity: count,
		student_activity: count,
		. . .
	},
	teacher_activity: {
		student_activity: count,
		student_activity: count,
		. . .
	},
	. . .
}
*/


// Extracts list of unique teacher activity labels
function extractTeacherActivities(actmap) {
	var acts = [];

	for (var t in actmap) {
		acts.push(t);
	}

	return acts;
}


// Extracts list of unique student activity labels
function extractStudentActivities(actmap) {
	var acts = [];
	var actflags = {};

	for (var t in actmap) {
		for (var s in actmap[t]) {
			actflags[s] = true;
		}
	}

	for (var k in actflags) {
		acts.push(k);
	}

	return acts;
}


// REF: https://bl.ocks.org/mbostock/3886394
// Handles all D3 SVG generation based on actmap and observation totals for each teacher activity
function generateGraphic(actmap, teachtots) {
	// Each data node: { teach_act:"String", [stud_act_1]:[count], [stud_act_2]:[count], . . . }
	//      Leading to one node per teacher activity

	// Extract unique labels
	var teachacts = extractTeacherActivities(actmap);
	var studacts = extractStudentActivities(actmap);

	// Data format:
	/*
	[
		{
			teacherActivity: [teacher activity label],
			[student_activity_1]: count,
			[student_activity_2]: count,
			. . . 
		},
		{
			teacherActivity: [teacher activity label],
			[student_activity_1]: count,
			[student_activity_2]: count,
			. . . 
		},
		. . .
	]
	*/
	var data = [];

	// Populate data
	for (var i = 0; i < teachacts.length; i++) {
		var newPoint = {};

		newPoint.teacherActivity = teachacts[i];

		for (var j = 0; j < studacts.length; j++) {
			if (studacts[j] in actmap[teachacts[i]]) {
				newPoint[studacts[j]] = actmap[teachacts[i]][studacts[j]];
			} else {
				newPoint[studacts[j]] = 0;
			}
		}

		data.push(newPoint);
	}

	// Setup initial SVG, g elements
	// Margin should be adjusted here
	var svg = d3.select("svg"),
		margin = { top: 20, right: 360, bottom: 45, left: 65 },
		width = +svg.attr("width") - margin.left - margin.right,
		height = +svg.attr("height") - margin.top - margin.bottom,
		g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// REF: https://stackoverflow.com/questions/25500316/sort-a-dictionary-by-value-in-javascript
	// Sort teacher totals by size (largest corresponds to leftmost column)
	var ttitems = Object.keys(teachtots).map(function(key) {
		return [key, teachtots[key]];
	});

	ttitems.sort(function(first, second) {
		return second[1] - first[1];
	});

	var totalcount = 0;
	for (var i = 0; i < ttitems.length; i++) {
		totalcount += ttitems[i][1];
	}

	// Calculate manual x offset and teachertots-scaled column widths
	var xwidth = width - ((ttitems.length - 1) * X_INNER_SPACING) - (2 * X_OUTER_MARGIN);

	var ttwidths = {}
	for (var i = 0; i < ttitems.length; i++) {
		ttwidths[ttitems[i][0]] = Math.floor((ttitems[i][1] / totalcount) * xwidth);
	}

	var xoffsets = {}
	var offset = X_OUTER_MARGIN;
	for (var i = 0; i < ttitems.length; i++) {
		xoffsets[ttitems[i][0]] = Math.floor(offset);
		offset += ttwidths[ttitems[i][0]] + X_INNER_SPACING;
	}

	// Provide simpler access to teacher activity domain
	var ttdom = [];
	for (var i = 0; i < ttitems.length; i++) {
		ttdom.push(ttitems[i][0]);
	}

	var y = d3.scaleLinear()
		.rangeRound([height, 0]);

	// var z = d3.scaleOrdinal(d3.schemeCategory10);
	var z = d3.scaleOrdinal(d3.schemePastel1);

 	// REF: https://bl.ocks.org/mbostock/b5935342c6d21928111928401e2c8608
 	// Use d3 stack as layout for data
 	var series = d3.stack()
 					.keys(studacts)
 					.offset(d3.stackOffsetExpand)(data);

 	var subgs = g.selectAll("g").data(series)
 		.enter().append("g")
 			.attr("fill", function(d) {
 				// Propagate key to each rectangle, for title
 				for (var i = 0; i < ttdom.length; i++) {
 					d[i].key = d.key;
 				}

 				return z(d.key)
 			});

 	// Add column rectangles
	subgs.selectAll("rect")
		.data(function(d) { return d; })
		.enter().append("rect")
			.attr("width", function(d) {
				return ttwidths[d.data.teacherActivity];
			})
			.attr("x", function(d) {
				return xoffsets[d.data.teacherActivity] + 1;
			})
			.attr("y", function(d) { return y(d[1]) + 0.5; })
			.attr("height", function(d) { return y(d[0]) - y(d[1]); })
			.attr("id", function(d) { return "rect_" + d.data.teacherActivity.replace(/\ /g, "") + "_" + d.key.replace(/\ /g, "") })
			.attr("class", "bar-rect")
			.on("mouseover", function() { tooltip.style("display", null) })
			.on("mouseout", function() { tooltip.style("display", "none") })
			.on("mousemove", function(d) {
				// Update hovering tooltip
				var title = d.key + ": " + d.data[d.key] + " / ";
				title += teachtots[d.data.teacherActivity];
				tooltip.select("text").text(title);

				var bb = $(".tooltip text")[0].getBBox();
				var tw = bb.width;
				var th = bb.height;

				tooltip.select("rect")
					.attr("width", (tw+8) + "px")
					.attr("height", (th+8) + "px")
					.attr("rx", "5")
					.attr("ry", "5");

				var xPosition = d3.mouse(this)[0] - ((tw+8)/2) + margin.left;
				var yPosition = d3.mouse(this)[1] - (th+16) + margin.top;
				tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");

				tooltip.select("text")
					.attr("x", 4)
					.attr("y", 0);
			});

	// Manually generate x axis
	var botg = svg.append("g")
		.attr("fill", "none")
		.attr("font-size", "10")
		.attr("font-family", "sans-serif")
		.attr("text-anchor", "middle")
		.attr("transform", "translate(" + margin.left + "," + (y(0) + margin.top) + ")");
	
	botg.append("path")
			.attr("class", "domain")
			.attr("stroke", "#000")
			.attr("d", "M0.5,6V0.5H" + (width) + "V6")
		
	// Generate ticks for x axis
	for (var i = 0; i < ttdom.length; i++) {
		var newg = botg.append("g")
			.attr("class", "tick")
			.attr("opacity", "1")
			.attr("transform", "translate(" + (X_OUTER_MARGIN + xoffsets[ttdom[i]] + (ttwidths[ttdom[i]]/2)) + ",0)");

		newg.append("line")
			.attr("stroke", "#000")
			.attr("y2", "6");

		newg.append("text")
			.attr("fill", "#000")
			.attr("y", "9")
			.attr("dy", "0.71em")
			.text(ttdom[i])
	}

	// Generate y axis
	svg.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.call(d3.axisLeft(y));


	// REF: https://bl.ocks.org/d3noob/23e42c8f67210ac6c678db2cd07a747e
	// X axis label
	svg.append("text")
		.attr("transform", "translate(" + (margin.left + (width/2)) + " ," +
							(height + margin.top + 40) + ")")
		.style("text-anchor", "middle")
		.style("fill", "black")
		.text("Teacher Activity");


	// Y axis label
	svg.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 10)
		.attr("x", 0 - ((height/2) + margin.top))
		.attr("dy", "1em")
		.style("text-anchor", "middle")
		.style("fill", "black")
		.text("Student Activity");


	// Legend
	// REF: https://bl.ocks.org/mtandre/bea54a387eb5506ad5d46cb5e74d9bce
	var legend = svg.append("g")
		.attr("class", "legend")
		.attr("transform", "translate(" + (margin.left + width + 25) + "," + "0)");

	legend.selectAll("rect")
		.data(studacts)
		.enter()
		.append("rect")
		.attr("x", 0)
		.attr("y", function(d, i) {
			return (i * 34) + margin.top + 15; 
		})
		.attr("width", 24)
		.attr("height", 24)
		.attr("fill", function(d, i) {
			return z(d);
		});

	legend.selectAll("text")
		.data(studacts)
		.enter()
		.append("text")
		.text(function(d) {
			return d;
		})
		.attr("x", 34)
		.attr("y", function(d, i) {
			return (i * 34) + margin.top + 21;
		})
		.attr("text-anchor", "start")
		.attr("alignment-baseline", "hanging")
		.attr("font-family", "sans-serif")
		.attr("style", "fill: black;");


	// Tooltip
	// REF: http://bl.ocks.org/mstanaland/6100713
	var tooltip = svg.append("g")
		.attr("class", "tooltip")
		.style("display", "none");

	tooltip.append("rect")
		.attr("width", 30)
		.attr("height", 20)
		.attr("fill", "white")
		.style("opacity", 0.8);

	tooltip.append("text")
		.attr("dy", "1.2em")
		.style("text-anchor", "front")
		.attr("font-size", "12px")
		.attr("font-weight", "bold")
		.attr("class", "tooltip-text");
}


// Ref: https://www.html5rocks.com/en/tutorials/file/dndfiles/
function handleFile() {
	if (window.FileReader) {
		$("#graphic").empty();
		$("#svg-download").prop("disabled", true);
		$("#png-download").prop("disabled", true);
		$("#jpg-download").prop("disabled", true);

		var f = document.getElementById("infile").files[0];

		var reader = new FileReader();

		reader.readAsText(f);
		reader.onload = readhandler;
		reader.onerror = errorhandler;
	} else {
		alert("File reading is not supported on your current browser!");
	}
}


function readhandler(event) {
	var text = event.target.result.replace(/\r\n/, "\n");
	var lines = text.split(/\r|\r\n|\n/);

	var actmap = {};
	var teachtots = {};

	// Parse file into actmap and teachtots
	// Skip header, start at i=1
	for (var i = 1; i < lines.length; i++) {
		// Ugly handling of CR/NL CSV delineation (thanks Windows)
		if (lines[i].length <= 0) { continue; }

		var cols = lines[i].split(",");
		
		teachact = cols[0];
		studact = cols[1];

		if (!(teachact in teachtots)) {
			teachtots[teachact] = 0;
		}

		if (!(teachact in actmap)) {
			actmap[teachact] = {};
		}

		if (!(studact in actmap[teachact])) {
			actmap[teachact][studact] = 0;
		}

		actmap[teachact][studact] += 1;
		teachtots[teachact] += 1;
	}

	generateGraphic(actmap, teachtots);

	$("#svg-download").prop("disabled", false);
	$("#png-download").prop("disabled", false);
	$("#jpg-download").prop("disabled", false);
}


function errorhandler(event) {
	alert("ERROR: " + event.target.error.name);
}


// REF: https://github.com/ajbc/trellis/blob/master/src/shiny/www/topics.js

var relevantStyles = [
	"display",
	"visibility",
	"background-color",
	"opacity",
	"stroke",
	"stroke-width",
	"fill",
	"font",
	"font-weight"
];

// Ref: https://stackoverflow.com/questions/15181452/how-to-save-export-inline-svg-styled-with-css-from-browser-to-image-file?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
// Recursive function used to explicitly record style for SVG downloads
function setStyle(elem) {
	var idstr = $(elem).attr("id");

	if (typeof idstr !== 'undefined') {
		$(elem).attr("id","clone-"+idstr);
		
		var compStyle = window.getComputedStyle(document.getElementById($(elem).attr("id").slice(6)));

		var styleString = "";

		for (var idx = 0; idx < relevantStyles.length; idx++) {
			var styleKind = relevantStyles[idx];
			styleString += styleKind + ":" + compStyle.getPropertyValue(styleKind) + "; ";
		}

		$(elem).attr("style", styleString);
	}

	$(elem).children().each(function(i) { setStyle($(this)) });
}


// REF: https://github.com/ajbc/trellis/blob/master/src/shiny/www/topics.js
function saveSVG() {
	var serializer = new XMLSerializer();
	var selector = "#graphic"

	var clone = $(selector).clone(true, true, true);
	setStyle(clone);

	var sourceString = serializer.serializeToString($(clone)[0]);

	// Ref: https://stackoverflow.com/questions/2483919/how-to-save-svg-canvas-to-local-filesystem
	$("body").append("<a id=\"tmp-download-link\" class=\"hidden\"></a>");
	$("#tmp-download-link").attr("href", "data:image/svg+xml;utf8," + sourceString)
			.attr("download", "graph.svg")
			.attr("target", "_blank");
	$("#tmp-download-link")[0].click();
	$("a#tmp-download-link").remove();

	// NOTE(tfs): Not 100% sure this adequately cleans up. If downloading ends up causing
	//            performance issues, check here first.
	$(clone).remove();
}


// REF: https://stackoverflow.com/questions/14631408/save-svg-html5-to-png-or-image
// REF: https://gist.github.com/mbostock/6466603
// REF: http://bl.ocks.org/Rokotyan/0556f8facbaf344507cdc45dc3622177
// REF: https://weworkweplay.com/play/saving-html5-canvas-as-image/
// REF: http://bl.ocks.org/biovisualize/8187844
// REF: https://gist.github.com/vicapow/758fce6aa4c5195d24be
function saveIMG(width, height, fmt) {
	// Get XML serialized string, for generating canvas using an img tag
	var serializer = new XMLSerializer();
	var selector = "#graphic"

	var clone = $(selector).clone(true, true, true);
	setStyle(clone);

	var sourceString = serializer.serializeToString($(clone)[0]);

	var blb = new Blob([sourceString], { type: "image/svg+xml;charset-utf-8" });

	var url = window.URL.createObjectURL(blb);

	// Create image tag, to be used as source for canvas (which can convert to png)
	var img = d3.select("body").append("img")
		.attr("width", width)
		.attr("height", height)
		.attr("id", "first-stage-img")
		.node();

	// Perform final conversion and save once image has loaded
	img.onload = function() {
		// Generate new canvas
		var canvas = d3.select("body").append("canvas").attr("id", "export-canvas").node();
		canvas.width = width;
		canvas.height = height;
		var ctx = canvas.getContext("2d");

		// Draw source image to canvas
		ctx.drawImage(img, 0, 0, width, height);

		// Get URL for canvas in correct format
		var canvasURL = canvas.toDataURL("image/"+fmt);

		// Generate, click, and remove a download link
		$("body").append("<a id=\"tmp-download-link\" class=\"hidden\"></a>");
		$("#tmp-download-link").attr("href", canvasURL)
				.attr("download", "graph." + fmt)
				.attr("target", "_blank");
		$("#tmp-download-link")[0].click();
		$("a#tmp-download-link").remove();

		// Clean up
		$(clone).remove();
		$("#export-canvas").remove();
		$(img).remove();
	}

	// Start loading image
	img.src = url;
}


