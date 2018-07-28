var X_INNER_SPACING = 2; // px
var X_OUTER_MARGIN = 5; // px


function extractTeacherActivities(actmap) {
	var acts = [];

	for (var t in actmap) {
		acts.push(t);
	}

	return acts;
}


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
function generateGraphic(actmap, teachtots) {
	// Each data node: { teach_act:"String", [stud_act_1]:[count], [stud_act_2]:[count], . . . }
	//      Leading to one node per teacher activity

	var teachacts = extractTeacherActivities(actmap);
	var studacts = extractStudentActivities(actmap);

	var data = [];

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

	var svg = d3.select("svg"),
		margin = { top: 20, right: 60, bottom: 30, left: 40 },
		width = +svg.attr("width") - margin.left - margin.right,
		height = +svg.attr("height") - margin.top - margin.bottom,
		g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// REF: https://stackoverflow.com/questions/25500316/sort-a-dictionary-by-value-in-javascript
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

	var ttdom = [];
	var ttran = [];
	for (var i = 0; i < ttitems.length; i++) {
		ttdom.push(ttitems[i][0]);
		ttran.push(xoffsets[ttitems[i][1]]);
	}

	var y = d3.scaleLinear()
		.rangeRound([height, 0]);

	var z = d3.scaleOrdinal(d3.schemeCategory10);

 	// REF: https://bl.ocks.org/mbostock/b5935342c6d21928111928401e2c8608
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

	subgs.selectAll("rect")
		.data(function(d) { return d; })
		.enter().append("rect")
			.attr("width", function(d) {
				return ttwidths[d.data.teacherActivity];
			})
			.attr("x", function(d) {
				return xoffsets[d.data.teacherActivity];
			})
			.attr("y", function(d) { return y(d[1]); })
			.attr("height", function(d) { return y(d[0]) - y(d[1]); })
			.attr("id", function(d) { return "rect_" + d.data.teacherActivity.replace(/\ /g, "") + "_" + d.key.replace(/\ /g, "") })
			.attr("class", "bar-rect")
			.on("mouseover", function() { tooltip.style("display", null) })
			.on("mouseout", function() { tooltip.style("display", "none") })
			.on("mousemove", function(d) {
				var title = d.key;
				tooltip.select("text").text(title);

				var bb = $(".tooltip text")[0].getBBox();
				var tw = bb.width;
				var th = bb.height;

				tooltip.select("rect")
					.attr("width", (tw+4) + "px")
					.attr("height", (th+4) + "px")

				var xPosition = d3.mouse(this)[0] - ((tw+4)/2) + margin.left;
				var yPosition = d3.mouse(this)[1] - (th+8) + margin.top;
				tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")")

				tooltip.select("text")
					.attr("x", 2)
					.attr("y", -2)
			});

	var botg = svg.append("g")
		.attr("fill", "none")
		.attr("font-size", "10")
		.attr("font-family", "sans-serif")
		.attr("text-anchor", "middle")
		.attr("transform", "translate(" + margin.left + "," + (y(0) + margin.top) + ")");
	
	botg.append("path")
			.attr("class", "domain")
			.attr("stroke", "#000")
			.attr("d", "M0.5,6V0.5H860.5V6")
		
	// Generate ticks
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

	svg.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.call(d3.axisLeft(y));


	// Tooltip
	// REF: http://bl.ocks.org/mstanaland/6100713
	var tooltip = svg.append("g")
		.attr("class", "tooltip")
		.style("display", "none");

	tooltip.append("rect")
		.attr("width", 30)
		.attr("height", 20)
		.attr("fill", "white")
		.style("opacity", 0.5);

	tooltip.append("text")
		.attr("dy", "1.2em")
		.style("text-anchor", "front")
		.attr("font-size", "12px")
		.attr("font-weight", "bold")
}


// Ref: https://www.html5rocks.com/en/tutorials/file/dndfiles/
function handleFile() {
	if (window.FileReader) {
		$("#graphic").empty();
		$("#svg-download").prop("disabled", true);

		var f = document.getElementById("infile").files[0];

		var reader = new FileReader();

		reader.readAsText(f);
		reader.onload = readhandler;
		reader.onerror = errorhandler;
	} else {
		alert("File reading is not supported on your current browser!");
	}
}

var exp = {};


function handleMouseEnter(d) {
	var selector = "#text_" + d.data.teacherActivity.replace(/\ /g, "") + "_" + d.key.replace(/\ /g, "");
	console.log(selector);
	$(selector).removeClass("hidden-title");
}


function handleMouseLeave(d) {
	var selector = "#text_" + d.data.teacherActivity.replace(/\ /g, "") + "_" + d.key.replace(/\ /g, "");
	console.log(selector);
	$(selector).addClass("hidden-title");
}


function readhandler(event) {
	var text = event.target.result.replace(/\r\n/, "\n");
	var lines = text.split(/\r|\r\n|\n/);

	var actmap = {};
	var teachtots = {};

	exp.txt = text;

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


