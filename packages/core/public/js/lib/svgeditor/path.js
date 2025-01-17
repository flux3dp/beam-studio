/*globals $, svgedit, svgroot*/
/*jslint vars: true, eqeq: true, continue: true*/
/**
 * Package: svgedit.path
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2011 Alexis Deveria
 * Copyright(c) 2011 Jeff Schiller
 */

// Dependencies:
// 1) jQuery
// 2) browser.js
// 3) math.js
// 4) svgutils.js

(function() {'use strict';

if (!svgedit.path) {
	svgedit.path = {};
}

var NS = svgedit.NS;
var uiStrings = {
	'pathNodeTooltip': 'Drag node to move it. Double-click node to change segment type',
	'pathCtrlPtTooltip': 'Drag control point to adjust curve properties'
};

const GRIP_SIZE = navigator.maxTouchPoints > 0 ? 8 : 5;
const CONTROL_GRIP_SIZE = navigator.maxTouchPoints > 0 ? 7 : 4;

var segData = {
	2: ['x', 'y'],
	4: ['x', 'y'],
	6: ['x', 'y', 'x1', 'y1', 'x2', 'y2'],
	8: ['x', 'y', 'x1', 'y1'],
	10: ['x', 'y', 'r1', 'r2', 'angle', 'largeArcFlag', 'sweepFlag'],
	12: ['x'],
	14: ['y'],
	16: ['x', 'y', 'x2', 'y2'],
	18: ['x', 'y']
};

const LINKTYPE_CORNER = 0;
const LINKTYPE_SMOOTH = 1; // same direction, different dist
const LINKTYPE_SYMMETRIC = 2; // same direction, same dist

var pathFuncs = [];

var link_control_pts = true;

// Stores references to paths via IDs.
// TODO: Make this cross-document happy.
var pathData = {};

svgedit.path.setLinkControlPoints = function(lcp) {
	link_control_pts = lcp;
};

svgedit.path.path = null;

var editorContext_ = null;

svgedit.path.init = function(editorContext) {
	editorContext_ = editorContext;

	pathFuncs = [0, 'ClosePath'];
	var pathFuncsStrs = ['Moveto', 'Lineto', 'CurvetoCubic', 'CurvetoQuadratic', 'Arc',
		'LinetoHorizontal', 'LinetoVertical', 'CurvetoCubicSmooth', 'CurvetoQuadraticSmooth'];
	$.each(pathFuncsStrs, function(i, s) {
		pathFuncs.push(s+'Abs');
		pathFuncs.push(s+'Rel');
	});
};

svgedit.path.insertItemBefore = function(elem, newseg, index) {
	// Support insertItemBefore on paths for FF2
	var list = elem.pathSegList;

	if (svgedit.browser.supportsPathInsertItemBefore()) {
		list.insertItemBefore(newseg, index);
		return;
	}
	var len = list.numberOfItems;
	var arr = [];
	var i;
	for (i=0; i < len; i++) {
		var cur_seg = list.getItem(i);
		arr.push(cur_seg);
	}
	list.clear();
	for (i=0; i < len; i++) {
		if (i == index) { //index+1
			list.appendItem(newseg);
		}
		list.appendItem(arr[i]);
	}
};

// TODO: See if this should just live in replacePathSeg
svgedit.path.ptObjToArr = function(type, seg_item) {
	var arr = segData[type], len = arr.length;
	var i, out = [];
	for (i = 0; i < len; i++) {
		out[i] = seg_item[arr[i]];
	}
	return out;
};

svgedit.path.getGripPt = function(seg, alt_pt) {
	var out = {
		x: alt_pt? alt_pt.x : seg.item.x,
		y: alt_pt? alt_pt.y : seg.item.y
	}, path = seg.path;

	if (path.matrix) {
		var pt = svgedit.math.transformPoint(out.x, out.y, path.matrix);
		out = pt;
	}

	out.x *= editorContext_.getCurrentZoom();
	out.y *= editorContext_.getCurrentZoom();

	return out;
};

svgedit.path.getGripPosition = function(x, y) {
	let out = { x, y };
	let path = svgedit.path.path || {};

	if (path.matrix) {
		var pt = svgedit.math.transformPoint(out.x, out.y, path.matrix);
		out = pt;
	}

	out.x *= editorContext_.getCurrentZoom();
	out.y *= editorContext_.getCurrentZoom();

	return out;
};

svgedit.path.getPointFromGrip = function(pt, path) {
	var out = {
		x: pt.x,
		y: pt.y
	};

	if (path.matrix) {
		pt = svgedit.math.transformPoint(out.x, out.y, path.imatrix);
		out.x = pt.x;
		out.y = pt.y;
	}

	out.x /= editorContext_.getCurrentZoom();
	out.y /= editorContext_.getCurrentZoom();

	return out;
};

svgedit.path.getGripContainer = function() {
	var c = svgedit.utilities.getElem('pathpointgrip_container');
	if (!c) {
		var parent = svgedit.utilities.getElem('selectorParentGroup');
		c = parent.appendChild(document.createElementNS(NS.SVG, 'g'));
		c.id = 'pathpointgrip_container';
	}
	return c;
};

svgedit.path.addDrawingPoint = function(index, x, y, canvasX, canvasY) {
	// create the container of all the point grips
	var pointGripContainer = svgedit.path.getGripContainer();

	var pointGrip = svgedit.utilities.getElem('drawingPoint_'+index);
	// create it
	if (!pointGrip) {
		pointGrip = document.createElementNS(NS.SVG, 'circle');
		svgedit.utilities.assignAttributes(pointGrip, {
			'id': 'drawingPoint_' + index,
			'display': 'none',
			'r': GRIP_SIZE,
			'fill': '#ffffff',
			'stroke': '#0091ff',
			'stroke-width': 1,
			'cursor': 'move',
			'style': 'pointer-events:all',
			'xlink:title': uiStrings.pathNodeTooltip
		});
		pointGrip = pointGripContainer.appendChild(pointGrip);
	}
	if (x && y) {
		// set up the point grip element and display it
		svgedit.utilities.assignAttributes(pointGrip, {
			'cx': x,
			'cy': y,
			'data-x': canvasX,
			'data-y': canvasY,
			'display': 'inline'
		});
	}
	return pointGrip;
};

svgedit.path.addDrawingCtrlGrip = function(id) {
	var pointGrip = svgedit.utilities.getElem('drawingCtrlPoint_'+id);
	if (pointGrip) {return pointGrip;}

	pointGrip = document.createElementNS(NS.SVG, 'circle');
	svgedit.utilities.assignAttributes(pointGrip, {
		'id': 'drawingCtrlPoint_' + id,
		'display': 'none',
		'r': CONTROL_GRIP_SIZE,
		'fill': '#ffffff',
		'stroke': '#0091ff',
		'stroke-width': 1,
		'cursor': 'move',
		'style': 'pointer-events:all',
		'xlink:title': uiStrings.pathCtrlPtTooltip
	});
	svgedit.path.getGripContainer().appendChild(pointGrip);
	return pointGrip;
};

svgedit.path.updateDrawingPoints = () => {
	const pointGripContainer = svgedit.path.getGripContainer();
	const points = pointGripContainer.querySelectorAll('circle');
	for (let i = 0; i < points.length; i++) {
		const point = points[i];
		const x = Number(point.getAttribute('data-x')) * editorContext_.getCurrentZoom();
		const y = Number(point.getAttribute('data-y')) * editorContext_.getCurrentZoom();
		point.setAttribute('cx', x);
		point.setAttribute('cy', y);
	}
};

svgedit.path.updateControlLines = () => {
	const pointGripContainer = svgedit.path.getGripContainer();
	const lines = pointGripContainer.querySelectorAll('line');
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const x1 = Number(line.getAttribute('data-x1')) * editorContext_.getCurrentZoom();
		const y1 = Number(line.getAttribute('data-y1')) * editorContext_.getCurrentZoom();
		const x2 = Number(line.getAttribute('data-x2')) * editorContext_.getCurrentZoom();
		const y2 = Number(line.getAttribute('data-y2')) * editorContext_.getCurrentZoom();
		line.setAttribute('x1', x1);
		line.setAttribute('y1', y1);
		line.setAttribute('x2', x2);
		line.setAttribute('y2', y2);
	}
};

svgedit.path.getCtrlLine = function(id) {
	var ctrlLine = svgedit.utilities.getElem('ctrlLine_'+id);
	if (ctrlLine) {return ctrlLine;}

	ctrlLine = document.createElementNS(NS.SVG, 'line');
	svgedit.utilities.assignAttributes(ctrlLine, {
		'id': 'ctrlLine_'+id,
		'stroke': '#0091ff',
		'stroke-width': 1,
		'style': 'pointer-events:none'
	});
	svgedit.path.getGripContainer().prepend(ctrlLine);
	return ctrlLine;
};

// This replaces the segment at the given index. Type is given as number.
svgedit.path.replacePathSeg = function(type, index, pts, elem) {
	var path = elem || svgedit.path.path.elem;

	var func = 'createSVGPathSeg' + pathFuncs[type];
	var seg = path[func].apply(path, pts);

	if (svgedit.browser.supportsPathReplaceItem()) {
		path.pathSegList.replaceItem(seg, index);
	} else {
		var segList = path.pathSegList;
		var len = segList.numberOfItems;
		var arr = [];
		var i;
		for (i = 0; i < len; i++) {
			var cur_seg = segList.getItem(i);
			arr.push(cur_seg);
		}
		segList.clear();
		for (i = 0; i < len; i++) {
			if (i == index) {
				segList.appendItem(seg);
			} else {
				segList.appendItem(arr[i]);
			}
		}
	}
	return seg;
};

svgedit.path.createPathSeg = function(type, pts, elem) {
	const path = elem || svgedit.path.path.elem;
	const func = 'createSVGPathSeg' + pathFuncs[type];
	const seg = path[func].apply(path, pts);
	return seg;
};

svgedit.path.getSegSelector = function(seg, update) {
	var index = seg.index;
	var segLine = svgedit.utilities.getElem('segline_' + index);
	if (!segLine) {
		var pointGripContainer = svgedit.path.getGripContainer();
		// create segline
		segLine = document.createElementNS(NS.SVG, 'path');
		svgedit.utilities.assignAttributes(segLine, {
			'id': 'segline_' + index,
			'display': 'none',
			'fill': 'none',
			'stroke': '#0091ff',
			'stroke-width': 2,
			'style':'pointer-events:none',
			'd': 'M0,0 0,0'
		});
		pointGripContainer.prepend(segLine);
	}

	if (update) {
		var prev = seg.prev;
		if (!prev) {
			segLine.setAttribute('display', 'none');
			return segLine;
		}

		var pt = svgedit.path.getGripPt(prev);
		// Set start point
		svgedit.path.replacePathSeg(2, 0, [pt.x, pt.y], segLine);

		var pts = svgedit.path.ptObjToArr(seg.type, seg.item, true);
		var i;
		for (i = 0; i < pts.length; i += 2) {
			pt = svgedit.path.getGripPt(seg, {x:pts[i], y:pts[i+1]});
			pts[i] = pt.x;
			pts[i+1] = pt.y;
		}

		svgedit.path.replacePathSeg(seg.type, 1, pts, segLine);
	}
	return segLine;
};

// Function: smoothControlPoints
// Takes three points and creates a smoother line based on them
//
// Parameters:
// ct1 - Object with x and y values (first control point)
// ct2 - Object with x and y values (second control point)
// pt - Object with x and y values (third point)
//
// Returns:
// Array of two "smoothed" point objects
svgedit.path.smoothControlPoints = function(ct1, ct2, pt) {
	// each point must not be the origin
	var x1 = ct1.x - pt.x,
		y1 = ct1.y - pt.y,
		x2 = ct2.x - pt.x,
		y2 = ct2.y - pt.y;

	if ( (x1 != 0 || y1 != 0) && (x2 != 0 || y2 != 0) ) {
		var anglea = Math.atan2(y1, x1),
			angleb = Math.atan2(y2, x2),
			r1 = Math.sqrt(x1*x1+y1*y1),
			r2 = Math.sqrt(x2*x2+y2*y2),
			nct1 = editorContext_.getSVGRoot().createSVGPoint(),
			nct2 = editorContext_.getSVGRoot().createSVGPoint();
		if (anglea < 0) { anglea += 2*Math.PI; }
		if (angleb < 0) { angleb += 2*Math.PI; }

		var angleBetween = Math.abs(anglea - angleb),
			angleDiff = Math.abs(Math.PI - angleBetween)/2;

		var new_anglea, new_angleb;
		if (anglea - angleb > 0) {
			new_anglea = angleBetween < Math.PI ? (anglea + angleDiff) : (anglea - angleDiff);
			new_angleb = angleBetween < Math.PI ? (angleb - angleDiff) : (angleb + angleDiff);
		}
		else {
			new_anglea = angleBetween < Math.PI ? (anglea - angleDiff) : (anglea + angleDiff);
			new_angleb = angleBetween < Math.PI ? (angleb + angleDiff) : (angleb - angleDiff);
		}

		// rotate the points
		nct1.x = r1 * Math.cos(new_anglea) + pt.x;
		nct1.y = r1 * Math.sin(new_anglea) + pt.y;
		nct2.x = r2 * Math.cos(new_angleb) + pt.x;
		nct2.y = r2 * Math.sin(new_angleb) + pt.y;

		return [nct1, nct2];
	}
	return undefined;
};

svgedit.path.getPath_ = function(elem) {
	let p = pathData[elem.id] = new svgedit.path.Path(elem);
	return p;
};

svgedit.path.removePath_ = function(id) {
	if (id in pathData) {delete pathData[id];}
};
svgedit.path.getPath = svgedit.path.getPath_;
svgedit.path.removePath = svgedit.path.removePath_;

var newcx, newcy, oldcx, oldcy, angle;
var getRotVals = function(x, y) {
	var dx = x - oldcx;
	var dy = y - oldcy;

	// rotate the point around the old center
	var r = Math.sqrt(dx*dx + dy*dy);
	var theta = Math.atan2(dy, dx) + angle;
	dx = r * Math.cos(theta) + oldcx;
	dy = r * Math.sin(theta) + oldcy;

	// dx,dy should now hold the actual coordinates of each
	// point after being rotated

	// now we want to rotate them around the new center in the reverse direction
	dx -= newcx;
	dy -= newcy;

	r = Math.sqrt(dx*dx + dy*dy);
	theta = Math.atan2(dy, dx) - angle;

	return {'x': r * Math.cos(theta) + newcx,
		'y': r * Math.sin(theta) + newcy};
};

// If the path was rotated, we must now pay the piper:
// Every path point must be rotated into the rotated coordinate system of
// its old center, then determine the new center, then rotate it back
// This is because we want the path to remember its rotation

// TODO: This is still using ye olde transform methods, can probably
// be optimized or even taken care of by recalculateDimensions
svgedit.path.recalcRotatedPath = function() {
	var current_path = svgedit.path.path.elem;
	angle = svgedit.utilities.getRotationAngle(current_path, true);
	if (!angle) {return;}
//	selectedBBoxes[0] = svgedit.path.path.oldbbox;
	var box = svgedit.utilities.getBBox(current_path),
		oldbox = svgedit.path.path.oldbbox; //selectedBBoxes[0],
	oldcx = oldbox.x + oldbox.width/2;
	oldcy = oldbox.y + oldbox.height/2;
	newcx = box.x + box.width/2;
	newcy = box.y + box.height/2;

	// un-rotate the new center to the proper position
	var dx = newcx - oldcx,
		dy = newcy - oldcy,
		r = Math.sqrt(dx*dx + dy*dy),
		theta = Math.atan2(dy, dx) + angle;

	newcx = r * Math.cos(theta) + oldcx;
	newcy = r * Math.sin(theta) + oldcy;

	var list = current_path.pathSegList,
		i = list.numberOfItems;
	while (i) {
		i -= 1;
		var seg = list.getItem(i),
			type = seg.pathSegType;
		if (type == 1) {continue;}

		var rvals = getRotVals(seg.x, seg.y),
			points = [rvals.x, rvals.y];
		if (seg.x1 != null) {
			var c_vals1 = getRotVals(seg.x1, seg.y1);
			points.splice(points.length, 0, c_vals1.x, c_vals1.y);
		}
		if (seg.x2 != null) {
			var c_vals2 = getRotVals(seg.x2, seg.y2);
			points.splice(points.length, 0, c_vals2.x, c_vals2.y);
		}
		svgedit.path.replacePathSeg(type, i, points);
	} // loop for each point

	box = svgedit.utilities.getBBox(current_path);
//	selectedBBoxes[0].x = box.x; selectedBBoxes[0].y = box.y;
//	selectedBBoxes[0].width = box.width; selectedBBoxes[0].height = box.height;

	// now we must set the new transform to be rotated around the new center
	var R_nc = svgroot.createSVGTransform(),
		tlist = svgedit.transformlist.getTransformList(current_path);
	R_nc.setRotate((angle * 180.0 / Math.PI), newcx, newcy);
	tlist.replaceItem(R_nc,0);
};

// ====================================
// Public API starts here

svgedit.path.clearData =  function() {
	pathData = {};
};

}());
