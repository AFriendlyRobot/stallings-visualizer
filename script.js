// $(document).ready(function() {
// 	initGraphic();
// });


// function initGraphic() {

// }


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

	console.log(actmap);

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

	// TODO(tfs): Adjust x widths based on teacher totals
	var x = d3.scaleBand()
		.domain(data.map(function(d) { return d.teacherActivity; }))
		.rangeRound([0, width])
		.padding(0.1)
		.align(0.1);

	var y = d3.scaleLinear()
		.rangeRound([height, 0]);

	// var z = d3.scaleOrdinal()
	// 	.range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

	var z = d3.scaleOrdinal(d3.schemeCategory10);

	// var stack = d3.stack()
	// 	.offset(d3.stackOffsetExpand);

	// var circles = self.g.selectAll("circle")
 //            .data(nodes, self.constancy);

 	// var bars = g.selectAll("rect")
 	// 			.data()

 	// var serie = g.selectAll(".serie")
 	// 			.data(stack.keys(data.columns.slice(1))(data))
 	// 			.enter().append("g")
 	// 				.attr("class", "serie")
 	// 				.attr("fill", function(d) { return z(d.key) });



 	// serie.selectAll("rect")
 	// 	.data(function(d) { return d; })
 	// 	.enter().append("rect")
 	// 		.attr("x", function(d) { return x(d.data.teacherActivity) })
 	// 		.attr("y", function(d) { return y(d[])})


 	// REF: https://bl.ocks.org/mbostock/b5935342c6d21928111928401e2c8608
 	var series = d3.stack()
 					.keys(studacts)
 					.offset(d3.stackOffsetExpand)(data);

 	console.log("TESTING");
 	console.log(series);
 	console.log("woot");

 	g.selectAll("g").data(series)
 		.enter().append("g")
 			.attr("fill", function(d) { return z(d.key) })
		.selectAll("rect")
		.data(function(d) { return d; })
		.enter().append("rect")
			.attr("width", x.bandwidth()) // TODO(tfs): Scale based on teachtots
			.attr("x", function(d) { return x(d.data.teacherActivity); })
			.attr("y", function(d) { return y(d[1]); })
			.attr("height", function(d) { return y(d[0]) - y(d[1]); })

	console.log(x.bandwidth());

	svg.append("g")
		.attr("transform", "translate(" + margin.left + "," + (y(0) + margin.top) + ")")
		.call(d3.axisBottom(x));

	svg.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.call(d3.axisLeft(y));
}


// Ref: https://www.html5rocks.com/en/tutorials/file/dndfiles/
function handleFile() {
	if (window.FileReader) {
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
	var text = event.target.result;
	var lines = text.split(/\r|\r\n|\n/);

	var actmap = {};
	var teachtots = {};

	// Skip header, start at i=1
	for (var i = 1; i < lines.length; i++) {
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

	// console.log(actmap);
	// console.log(teachtots);
	generateGraphic(actmap, teachtots);
}


function errorhandler(event) {
	alert("ERROR: " + event.target.error.name);
}


