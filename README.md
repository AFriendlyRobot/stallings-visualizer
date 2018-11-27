# stallings-visualizer

Access the tool at <https://afriendlyrobot.github.io/stallings-visualizer>

---

Visualizer for Stallings observations (see <https://www.worldbank.org/en/programs/sief-trust-fund/brief/the-stallings-classroom-snapshot>).
For the purposes of this visualization, Stallings oversvations provided pairs of teacher activity and student activity, as a method of analyzing time usage within a classroom.
This visualization 

This is a simple web interface for generating a (modified) stacked bar chart with column width weights.

---

The interface accepts a simple csv file. Only the first two columns are used.
The first column's unique values correspond to column labels, and the second column's unique values correspond to individual stacked components within columns.
Both rows and columns are sorted by the order of appearance of their labels within the csv file.

The interface also allows users to download an SVG or PNG version of the graphic.

---

stallings-visualizer uses d3.js and jQuery.
The JavaScript, HTML, and CSS files are all static, and all functionality is housed client-side.
The visualizer can be served statically or opened directly from a browser.
No server is required, and no server ever sees whatever data you upload.
