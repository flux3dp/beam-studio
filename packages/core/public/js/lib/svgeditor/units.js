/*globals $, svgedit*/
/*jslint vars: true, eqeq: true*/
/**
 * Package: svgedit.units
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2010 Alexis Deveria
 * Copyright(c) 2010 Jeff Schiller
 */

// Dependencies:
// 1) jQuery

(function() {'use strict';

if (!svgedit.units) {
	svgedit.units = {};
}

var NS = svgedit.NS;
var wAttrs = ['x', 'x1', 'cx', 'rx', 'width'];
var hAttrs = ['y', 'y1', 'cy', 'ry', 'height'];
var unitAttrs = ['r', 'radius'].concat(wAttrs, hAttrs);
// unused
var unitNumMap = {
	'%':  2,
	'em': 3,
	'ex': 4,
	'px': 5,
	'cm': 6,
	'mm': 7,
	'in': 8,
	'pt': 9,
	'pc': 10
};

// Container of elements.
var elementContainer_;

/**
 * Stores mapping of unit type to user coordinates.
 */
var typeMap_ = {};

/**
 * ElementContainer interface
 *
 * function getBaseUnit() - returns a string of the base unit type of the container ('em')
 * function getElement() - returns an element in the container given an id
 * function getHeight() - returns the container's height
 * function getWidth() - returns the container's width
 * function getRoundDigits() - returns the number of digits number should be rounded to
 */

/**
 * Function: svgedit.units.init()
 * Initializes this module.
 *
 * Parameters:
 * elementContainer - an object implementing the ElementContainer interface.
 */
svgedit.units.init = function(elementContainer) {
	elementContainer_ = elementContainer;

	// Get correct em/ex values by creating a temporary SVG.
	var svg = document.createElementNS(NS.SVG, 'svg');
	document.body.appendChild(svg);
	var rect = document.createElementNS(NS.SVG, 'rect');
	rect.setAttribute('width', '1em');
	rect.setAttribute('height', '1ex');
	rect.setAttribute('x', '1in');
	svg.appendChild(rect);
	var bb = rect.getBBox();
	document.body.removeChild(svg);

	var inch = bb.x;
	typeMap_ = {
		'em': bb.width,
		'ex': bb.height,
		'in': inch,
		'cm': inch / 2.54,
		'mm': inch / 25.4,
		'pt': inch / 72,
		'pc': inch / 6,
		'px': 1,
		'%': 0
	};
};

// Function: svgedit.units.shortFloat
// Rounds a given value to a float with number of digits defined in save_options
//
// Parameters:
// val - The value as a String, Number or Array of two numbers to be rounded
//
// Returns:
// If a string/number was given, returns a Float. If an array, return a string
// with comma-seperated floats
svgedit.units.shortFloat = function(val) {
	var digits = elementContainer_.getRoundDigits();
	if (!isNaN(val)) {
		// Note that + converts to Number
		return +((+val).toFixed(digits));
	}
	if ($.isArray(val)) {
		return svgedit.units.shortFloat(val[0]) + ',' + svgedit.units.shortFloat(val[1]);
	}
	return parseFloat(val).toFixed(digits) - 0;
};

// Function: svgedit.units.convertToNum
// Converts given values to numbers. Attributes must be supplied in
// case a percentage is given
//
// Parameters:
// attr - String with the name of the attribute associated with the value
// val - String with the attribute value to convert
svgedit.units.convertToNum = function(attr, val) {
	// Return a number if that's what it already is
	if (!isNaN(val)) {return val-0;}
	var num;
	if (val.substr(-1) === '%') {
		// Deal with percentage, depends on attribute
		num = val.substr(0, val.length-1)/100;
		var width = elementContainer_.getWidth();
		var height = elementContainer_.getHeight();

		if (wAttrs.indexOf(attr) >= 0) {
			return num * width;
		}
		if (hAttrs.indexOf(attr) >= 0) {
			return num * height;
		}
		return num * Math.sqrt((width*width) + (height*height))/Math.sqrt(2);
	}
	var unit = val.substr(-2);
	num = val.substr(0, val.length-2);
	// Note that this multiplication turns the string into a number
	return num * typeMap_[unit];
};
}());
