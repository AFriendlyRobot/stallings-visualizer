# stallings-visualizer
Visualizer for Stallings observations

This is a simple web interface for generating a (modified) stacked bar chart with column width weights.

The interface accepts a simple csv file. Only the first two columns are used.
The first column's unique values correspond to column labels, and the second column's unique values correspond to individual stacked components within columns.

The interface also allows users to download an SVG or PNG version of the graphic.

---

stallings-visualizer uses d3.js and jQuery.
