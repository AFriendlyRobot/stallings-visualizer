#!/usr/bin/python3


import argparse

from matplotlib import pyplot as plt

# import pandas as pd
import seaborn as sns


def parse_headers(lines):
	headers = lines[0].strip().split(",")

	return headers


def parse_activity_names(lines):
	teachmap = {}
	studmap = {}

	for line in lines[1:]:
		cols = line.strip().split(",")

		teach = int(cols[2])
		stud = int(cols[3])

		teachmap[teach] = cols[0]
		studmap[stud] = cols[1]

	return (teachmap, studmap)


def parse_infile(lines):
	actmap = {}

	for line in lines[1:]:
		cols = line.strip().split(",")

		teach = int(cols[2])
		stud = int(cols[3])

		if (teach not in actmap):
			actmap[teach] = {}
		if (stud not in actmap[teach]):
			actmap[teach][stud] = 0

		actmap[teach][stud] += 1

	return actmap


def calc_teach_totals(actmap):
	totmap = {}

	for tval in actmap.keys():
		totmap[tval] = sum(actmap[tval].values())

	return totmap


def generate_graph(actmap, teach_totals, headers, teachmap, studmap):
	bars = []


def run(infile_location, outfile_location):
	infile = open(infile_location)
	lines = infile.readlines()
	infile.close()

	headers = parse_headers(lines)
	(teachmap, studmap) = parse_activity_names(lines)
	actmap = parse_infile(lines)
	teach_totals = calc_teach_totals(actmap)

	print(actmap)
	print(teach_totals)

	generate_graph(actmap, teach_totals, headers, teachmap, studmap)


def main():
	parser = argparse.ArgumentParser()

	parser.add_argument("-i", "--input", help="Input file location, csv", required=True)
	parser.add_argument("-o", "--output", help="Output location (for saved PDF)", required=True)

	options = parser.parse_args()

	run(options.input, options.output)


if __name__ == "__main__":
	main()