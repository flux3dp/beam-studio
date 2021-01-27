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
			'r': 5,
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
		'r': 4,
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

svgedit.path.Segment = function(index, item) {
	this.index = index;
	this.item = item;
	this.type = item.pathSegType;
	this.controlPoints = [];
};

svgedit.path.Segment.prototype.select = function(y) {
};


svgedit.path.Segment.prototype.update = function(full) {
	if (this.ptgrip) {
		var pt = svgedit.path.getGripPt(this);
		svgedit.utilities.assignAttributes(this.ptgrip, {
			'cx': pt.x,
			'cy': pt.y
		});

		svgedit.path.getSegSelector(this, true);
	}
};

svgedit.path.Segment.prototype.getNodePointAndControlPoints = function() {
	const pathSeg = this.item;
	if (pathSeg.pathSegType === 1) {
		return {};
	}
	const nodePoint = new PathNodePoint(pathSeg.x, pathSeg.y, this, this.path);
	const controlPoints = [];
	if (pathSeg.pathSegType === 6) {
		controlPoints.push(new SegmentControlPoint(pathSeg.x1, pathSeg.y1, this, 1));
		controlPoints.push(new SegmentControlPoint(pathSeg.x2, pathSeg.y2, this, 2));
	} else if (pathSeg.pathSegType === 8) {
		controlPoints.push(new SegmentControlPoint(pathSeg.x1, pathSeg.y1, this, 1));
	}
	this.controlPoints = controlPoints;
	return {nodePoint, controlPoints};
};

class PathNodePoint {
	constructor(x, y, seg, path) {
		this.x = x;
		this.y = y;
		this.mSeg = null; // M segment
		this.prevSeg = null; 
		if (seg.type === 2) {
			this.setMSeg(seg);
		} else {
			this.setPrevSeg(seg);
		}
		this.nextSeg = null; 
		this.next = null; // next connecting grip
		this.prev = null; // previous connecting grip
		this.path = path;
		this.controlPoints = [];
		this.linkType = LINKTYPE_CORNER;
	}

	setMSeg(seg) {
		this.mSeg = seg;
	}

	setPrevSeg(seg) {
		this.prevSeg = seg;
	}

	addControlPoint(controlPoint) {
		controlPoint.nodePoint = this;
		this.controlPoints.push(controlPoint);
	}

	getDisplayPosition(x=this.x, y=this.y) {
		let out = {x, y};
		if (this.path.matrix) {
			out = svgedit.math.transformPoint(this.x, this.y, this.path.matrix);
		}
		out.x *= editorContext_.getCurrentZoom();
		out.y *= editorContext_.getCurrentZoom();
		return out;
	}

	show() {
		const pointGripContainer = svgedit.path.getGripContainer();
		const id = `pathpointgrip_${this.index}`;
		let point = svgedit.utilities.getElem(id);
		const {x, y} = this.getDisplayPosition()
		// create it
		if (!point) {
			point = document.createElementNS(NS.SVG, 'circle');
			svgedit.utilities.assignAttributes(point, {
				'id': id,
				'display': 'block',
				'r': 5,
				'fill': '#ffffff',
				'stroke': '#0091ff',
				'stroke-width': 1,
				'cursor': 'move',
				'style': 'pointer-events:all',
				'xlink:title': uiStrings.pathNodeTooltip
			});
			point = pointGripContainer.appendChild(point);

			const i = this.index;
			let elem = $(`#${id}`);
			elem.dblclick(() => {
				if (svgedit.path.path) {
					svgedit.path.path.createControlPointsAtGrip(i);
				}
			});
		}
		svgedit.utilities.assignAttributes(point, {
			'display': 'block',
			'cx': x,
			'cy': y,
		});
		this.elem = point;
	}

	hide() {
		const id = `pathpointgrip_${this.index}`;
		let point = svgedit.utilities.getElem(id);
		if (point) {
			svgedit.utilities.assignAttributes(point, {
				'display': 'none',
			});
		}
		this.controlPoints.forEach((cp) => {
			cp.hide();
		});
		
	}

	update() {
		const id = `pathpointgrip_${this.index}`;
		let point = svgedit.utilities.getElem(id);
		const {x, y} = this.getDisplayPosition();
		// create it
		if (point) {
			svgedit.utilities.assignAttributes(point, {
				'cx': x,
				'cy': y,
			});
			this.elem = point;
		}
		this.controlPoints.forEach((cp) => {
			cp.update();
		});
	}

	setHighlight(isHighlighted) {
		const id = `pathpointgrip_${this.index}`;
		let point = svgedit.utilities.getElem(id);
		if (point) {
			svgedit.utilities.assignAttributes(point, {
				'fill': isHighlighted ? '#0091ff' : '#ffffff',
			});
		}
	}

	setSelected(isSelected) {
		this.isSelected = isSelected;
		this.setHighlight(isSelected);
		this.controlPoints.forEach((cp) => {
			if (isSelected) {
				cp.show();
			} else {
				cp.hide();
			}
		});
	}

	move(dx, dy) {
		const segChanges = {};
		this.x += dx;
		this.y += dy;
		if (this.mSeg) {
			segChanges[this.mSeg.index] = {x: this.x, y: this.y};
		}
		if (this.prevSeg) {
			segChanges[this.prevSeg.index] = {x: this.x, y: this.y};
		}
		for (let i = 0; i < this.controlPoints.length; i++) {
			const controlPoint = this.controlPoints[i];
			controlPoint.x += dx;
			controlPoint.y += dy;
			if (!segChanges[controlPoint.seg.index]) {
				segChanges[controlPoint.seg.index] = {};
			}
			segChanges[controlPoint.seg.index][`x${controlPoint.index}`] = controlPoint.x;
			segChanges[controlPoint.seg.index][`y${controlPoint.index}`] = controlPoint.y;
		}
		this.update();
		return segChanges;
	}

	createControlPoints() {
		const segChanges = {};
		let newControlPoints = [];
		//Segments that end here
		if (this.prevSeg && [4, 8].includes(this.prevSeg.item.pathSegType)) {
			const seg = this.prevSeg;
			const segItem = seg.item;
			const x = this.x + (seg.startPoint.x - this.x) / 3;
			const y = this.y + (seg.startPoint.y - this.y) / 3;
			if (segItem.pathSegType === 4) { // L 
				segChanges[seg.index] = {pathSegType: 8, x1: x, y1: y};
				const newControlPoint = new SegmentControlPoint(x, y, seg, 1);
				newControlPoints.push(newControlPoint);
				seg.controlPoints.push(newControlPoint);
			} else if (segItem.pathSegType === 8 && seg.controlPoints[0].nodePoint !== this) { // Q
				segChanges[seg.index] = {pathSegType: 6, x2: x, y2: y};
				const newControlPoint = new SegmentControlPoint(x, y, seg, 2);
				newControlPoints.push(newControlPoint);
				seg.controlPoints.push(newControlPoint);
			}
		}
		if (this.nextSeg && [4, 8].includes(this.nextSeg.item.pathSegType)) {
			const seg = this.nextSeg;
			const segItem = seg.item;
			const x = this.x + (seg.endPoint.x - this.x) / 3;
			const y = this.y + (seg.endPoint.y - this.y) / 3;
			if (segItem.pathSegType === 4) {
				segChanges[seg.index] = {pathSegType: 8, x1: x, y1: y};
				const newControlPoint = new SegmentControlPoint(x, y, seg, 1);
				newControlPoints.push(newControlPoint);
				seg.controlPoints.push(newControlPoint);
			} else if (segItem.pathSegType === 8 && seg.controlPoints[0].nodePoint !== this) {
				const currentControlPoint = seg.controlPoints[0];
				currentControlPoint.index = 2;
				segChanges[seg.index] = {
					pathSegType: 6,
					x1: x,
					y1: y,
					x2: currentControlPoint.x,
					y2: currentControlPoint.y
				};
				const newControlPoint = new SegmentControlPoint(x, y, seg, 1);
				newControlPoints.push(newControlPoint);
				seg.controlPoints.push(newControlPoint);
			}
		}
		newControlPoints.forEach((cp) => {
			this.addControlPoint(cp);
			cp.show();
		})
		this.update();
		return segChanges;
	}

	setNodeType(newType) {
		const segChanges = {};
		this.linkType = newType;
		if (this.controlPoints.length === 2 && newType !== LINKTYPE_CORNER) {
			const distancePoint = newType === LINKTYPE_SMOOTH ? this.controlPoints[1] : this.controlPoints[0];
			const th = Math.atan2(this.controlPoints[0].y - this.y, this.controlPoints[0].x - this.x) - Math.PI;
			const l = Math.hypot(distancePoint.x - this.x, distancePoint.y - this.y);
			const newPos = {x: l * Math.cos(th) + this.x, y: l * Math.sin(th) + this.y};
			const changes = this.controlPoints[1].moveAbs(newPos.x, newPos.y);
			Object.assign(segChanges, changes);
		}
		return segChanges;
	}

	delete() {
		const segChanges = {};
		let segIndexToRemove;
		if (this.mSeg) {
			if (this.next) {
				this.mSeg.endPoint = this.next;
				this.next.setMSeg(this.mSeg);
				segChanges[this.mSeg.index] = { x: this.next.x, y: this.next.y };
			}
		}
		if (this.prevSeg && this.nextSeg) {
			// 2 seg connecting: delete next seg, change prev seg
			const newSegControlPoints = [];
			segChanges[this.prevSeg.index] = {x: this.nextSeg.item.x, y: this.nextSeg.item.y};
			const prevControlPoint = this.prevSeg.controlPoints.find((cp) => cp.nodePoint !== this);
			if (prevControlPoint) {
				newSegControlPoints.push(prevControlPoint);
			}
			const nextControlPoint = this.nextSeg.controlPoints.find((cp) => cp.nodePoint !== this);
			if (nextControlPoint) {
				newSegControlPoints.push(nextControlPoint);
			}
			for (let i = 0; i < newSegControlPoints.length; i++) {
				const controlPoint = newSegControlPoints[i];
				controlPoint.index = i+1;
				segChanges[this.prevSeg.index][`x${i+1}`] = controlPoint.x;
				segChanges[this.prevSeg.index][`y${i+1}`] = controlPoint.y;
				controlPoint.seg = this.prevSeg;
			}
			const newSegType = {0: 4, 1: 8, 2: 6}[newSegControlPoints.length];
			segChanges[this.prevSeg.index].pathSegType = newSegType;
			this.prevSeg.controlPoints = newSegControlPoints;
			this.prevSeg.endPoint = this.nextSeg.endPoint;
			this.nextSeg.startPoint = this.prevSeg.startPoint;
			if (this.prev) {
				this.prev.next = this.next;
			}
			if (this.next) {
				this.next.prev = this.prev;
			}
			segIndexToRemove = this.nextSeg.index;
		} else if (this.prevSeg) { // has prevSeg, no nextSeg: last point
			this.prev.next = null;
			segIndexToRemove = this.prevSeg.index;
		} else if (this.nextSeg) { // First point
			this.next.prev = null;
			segIndexToRemove = this.nextSeg.index;
		} else {
			segIndexToRemove = this.mSeg.index;
		}
		return {segChanges, segIndexToRemove}
	}
}

class SegmentControlPoint {
	constructor(x, y, seg, index) {
		this.x = x;
		this.y = y;
		this.seg = seg;
		this.index = index;
		this.nodePoint = null;
		this.controlPointsLinkType = 0 //
	}

	setSelected(isSelected) {
		const id = `${this.seg.index}c${this.index}`;
		let point = svgedit.utilities.getElem(`ctrlpointgrip_${id}`);
		this.isSelected = isSelected;
		// create it
		if (point) {
			svgedit.utilities.assignAttributes(point, {
				'fill': isSelected ? '#0091ff' : '#ffffff',
			});
		}
	}

	move(dx, dy) {
		const segChanges = {};
		this.x += dx;
		this.y += dy;
		segChanges[this.seg.index] = {};
		segChanges[this.seg.index][`x${this.index}`] = this.x;
		segChanges[this.seg.index][`y${this.index}`] = this.y;
		this.update();
		return segChanges;
	}

	moveAbs(x, y) {
		const segChanges = {};
		this.x = x;
		this.y = y;
		segChanges[this.seg.index] = {};
		segChanges[this.seg.index][`x${this.index}`] = this.x;
		segChanges[this.seg.index][`y${this.index}`] = this.y;
		this.update();
		return segChanges;
	}

	moveLinkedControlPoint() {
		const segChanges = {};
		const nodePoint = this.nodePoint;
		if (nodePoint) {
			if (nodePoint.controlPoints.length === 2 && nodePoint.linkType !== LINKTYPE_CORNER) {
				const theOtherControlPoint = this.nodePoint.controlPoints.find((cp) => cp !== this);
				const { x: nodeX, y: nodeY, linkType } = nodePoint;
				if (!theOtherControlPoint) {
					return;
				}
				const distancePoint = linkType === LINKTYPE_SMOOTH ? theOtherControlPoint : this;
				const th = Math.atan2(this.y - nodeY, this.x - nodeX) - Math.PI;
				const l = Math.hypot(distancePoint.x - nodeX, distancePoint.y - nodeY);
				const newPos = {x: l * Math.cos(th) + nodeX, y: l * Math.sin(th) + nodeY};
				const changes = theOtherControlPoint.moveAbs(newPos.x, newPos.y);
				Object.assign(segChanges, changes);
			}
		} else {
			console.error('Control Point without Node Point', this);
		}
		return segChanges;
	}

	show() {
		const id = `${this.seg.index}c${this.index}`;
		let point = svgedit.utilities.getElem('ctrlpointgrip_'+id);
		const {x, y} = svgedit.path.getGripPosition(this.x, this.y);
		if (!point) {
			point = document.createElementNS(NS.SVG, 'circle');
			svgedit.utilities.assignAttributes(point, {
				'id': 'ctrlpointgrip_' + id,
				'r': 4,
				'fill': '#ffffff',
				'stroke': '#0091ff',
				'stroke-width': 1,
				'cursor': 'move',
				'style': 'pointer-events:all',
				'xlink:title': uiStrings.pathCtrlPtTooltip
			});
			svgedit.path.getGripContainer().appendChild(point);
		}
		svgedit.utilities.assignAttributes(point, {
			'display': 'block',
			'cx': x,
			'cy': y,
		});
		this.elem = point;
		const nodePointPosition = this.nodePoint ? this.nodePoint.getDisplayPosition() : {x, y};
		let ctrlLine = svgedit.utilities.getElem('ctrlLine_'+id);
		if (!ctrlLine) {
			ctrlLine = document.createElementNS(NS.SVG, 'line');
			svgedit.utilities.assignAttributes(ctrlLine, {
				'id': 'ctrlLine_'+id,
				'stroke': '#0091ff',
				'stroke-width': 1,
				'style': 'pointer-events:none'
			});
			svgedit.path.getGripContainer().prepend(ctrlLine);
		}
		svgedit.utilities.assignAttributes(ctrlLine, {
			'display': 'block',
			'x1': nodePointPosition.x,
			'y1': nodePointPosition.y,
			'x2': x,
			'y2': y,
		});
		return point;
	}

	update() {
		const id = `${this.seg.index}c${this.index}`;
		const {x, y} = svgedit.path.getGripPosition(this.x, this.y);
		const nodePointPosition = this.nodePoint ? this.nodePoint.getDisplayPosition() : {x, y};
		let point = svgedit.utilities.getElem(`ctrlpointgrip_${id}`);
		if (point) {
			svgedit.utilities.assignAttributes(point, {
				'cx': x,
				'cy': y,
			});
			this.elem = point;
		}
		let ctrlLine = svgedit.utilities.getElem(`ctrlLine_${id}`);
		if (ctrlLine) {
			svgedit.utilities.assignAttributes(ctrlLine, {
				'x1': nodePointPosition.x,
				'y1': nodePointPosition.y,
				'x2': x,
				'y2': y,
			});
		}
	}

	hide() {
		const id = `${this.seg.index}c${this.index}`;
		let point = svgedit.utilities.getElem(`ctrlpointgrip_${id}`);
		this.setSelected(false);
		if (point) {
			svgedit.utilities.assignAttributes(point, {
				'display': 'none',
			});
		}
		let ctrlLine = svgedit.utilities.getElem(`ctrlLine_${id}`);
		if (ctrlLine) {
			svgedit.utilities.assignAttributes(ctrlLine, {
				'display': 'none',
			});
		}
	}

	removeFromNodePoint() {
		const nodePoint = this.nodePoint;
		nodePoint.controlPoints = nodePoint.controlPoints.filter((cp) => cp !== this);
	}

	delete() {
		const seg = this.seg;
		const segItem = seg.item;
		const changes = {};
		const segChanges = {};
		this.hide();
		if (segItem.pathSegType === 6) {
			changes.pathSegType = 8;
			if (this.index === 1) {
				const theOtherControlPoint = seg.controlPoints.find((cp) => cp !== this);
				if (theOtherControlPoint) {
					theOtherControlPoint.index = 1;
					changes.x1 = theOtherControlPoint.x;
					changes.y1 = theOtherControlPoint.y;
				}
			} 
		} else if (segItem.pathSegType === 8) {
			changes.pathSegType = 4;
		}
		segChanges[this.seg.index] = changes;
		seg.controlPoints = seg.controlPoints.filter((cp) => cp !== this);
		this.removeFromNodePoint();
		return segChanges;
	}
}

svgedit.path.Path = function(elem) {
	if (!elem || elem.tagName !== 'path') {
		throw 'svgedit.path.Path constructed without a <path> element';
	}

	this.elem = elem;
	this.segs = [];
	this.selected_pts = [];
	svgedit.path.path = this;
	this.init();
};

// Reset path data
svgedit.path.Path.prototype.init = function() {
	// Hide all grips, etc

	//fixed, needed to work on all found elements, not just first
	$(svgedit.path.getGripContainer()).find('*').each( function() { $(this).attr('display', 'none') });
	var segList = this.elem.pathSegList;
	const segInfo = JSON.parse(this.elem.getAttribute('data-segInfo') || '{}');
	const nodeTypes = JSON.parse(this.elem.getAttribute('data-nodeTypes') || '{}');

	var len = segList.numberOfItems;
	this.segs = [];
	this.nodePoints = [];
	this.selected_pts = [];
	this.first_seg = null;

	// Set up segs array
	var i;
	for (i = 0; i < len; i++) {
		var item = segList.getItem(i);
		var segment = new svgedit.path.Segment(i, item);
		segment.path = this;
		this.segs.push(segment);
	}

	var segs = this.segs;
	var start_i = null;
	let lastGrip = null;

	for (i = 0; i < len; i++) {
		var seg = segs[i];
		var next_seg = (i+1) >= len ? null : segs[i+1];
		var prev_seg = (i-1) < 0 ? null : segs[i-1];
		var start_seg;
		if (seg.type === 2) {
			if (prev_seg && prev_seg.type !== 1) {
				// New sub-path, last one is open,
				// so add a grip to last sub-path's first point
				start_seg = segs[start_i];
				start_seg.next = segs[start_i+1];
				start_seg.next.prev = start_seg;
			}
			// Remember that this is a starter seg
			const nodePoint = new PathNodePoint(seg.item.x, seg.item.y, seg, this);
			nodePoint.index = this.nodePoints.length;
			this.nodePoints.push(nodePoint);
			seg.endPoint = nodePoint;
			lastGrip = nodePoint;
			start_i = i;
		} else if (next_seg && next_seg.type === 1) {
			// This is the last real segment of a closed sub-path
			// Next is first seg after "M"
			seg.next = segs[start_i+1];

			// First seg after "M"'s prev is this
			seg.next.prev = seg;
			seg.mate = segs[start_i];
			const { controlPoints } = seg.getNodePointAndControlPoints();
			//First grip point
			const nodePoint = segs[start_i].endPoint;
			nodePoint.setPrevSeg(seg);
			seg.startPoint = lastGrip;
			seg.endPoint = nodePoint;
			if (controlPoints.length === 2) {
				lastGrip.addControlPoint(controlPoints[0]);
				nodePoint.addControlPoint(controlPoints[1]);
			} else if (controlPoints.length === 1) {
				if (segInfo[i]) {
					nodePoint.addControlPoint(controlPoints[0]);
				} else {
					lastGrip.addControlPoint(controlPoints[0]);
				}
			}
			nodePoint.prev = lastGrip;
			lastGrip.next = nodePoint;
			lastGrip.nextSeg = seg;

			if (this.first_seg == null) {
				this.first_seg = seg;
			}
		} else if (!next_seg) {
			if (seg.type !== 1) {
				// Last seg, doesn't close so add a grip
				// to last sub-path's first point
				start_seg = segs[start_i];
				start_seg.next = segs[start_i+1];
				start_seg.next.prev = start_seg;

				const { nodePoint, controlPoints } = seg.getNodePointAndControlPoints();
				nodePoint.index = this.nodePoints.length;
				this.nodePoints.push(nodePoint);
				seg.startPoint = lastGrip;
				seg.endPoint = nodePoint;
				if (controlPoints.length === 2) {
					lastGrip.addControlPoint(controlPoints[0]);
					nodePoint.addControlPoint(controlPoints[1]);
				} else if (controlPoints.length === 1) {
					if (segInfo[i]) {
						nodePoint.addControlPoint(controlPoints[0]);
					} else {
						lastGrip.addControlPoint(controlPoints[0]);
					}
				}
				nodePoint.prev = lastGrip;
				lastGrip.next = nodePoint;
				lastGrip.nextSeg = seg;
				lastGrip = nodePoint;

				if (!this.first_seg) {
					// Open path, so set first as real first and add grip
					this.first_seg = segs[start_i];
				}
			}
		} else if (seg.type !== 1){
			// Regular segment, so add grip and its "next"
			const { nodePoint, controlPoints } = seg.getNodePointAndControlPoints();
			nodePoint.index = this.nodePoints.length;
			this.nodePoints.push(nodePoint);
			seg.startPoint = lastGrip;
			seg.endPoint = nodePoint;
			if (controlPoints.length === 2) {
				lastGrip.addControlPoint(controlPoints[0]);
				nodePoint.addControlPoint(controlPoints[1]);
			} else if (controlPoints.length === 1) {
				if (segInfo[i]) {
					nodePoint.addControlPoint(controlPoints[0]);
				} else {
					lastGrip.addControlPoint(controlPoints[0]);
				}
			}
			nodePoint.prev = lastGrip;
			lastGrip.next = nodePoint;
			lastGrip.nextSeg = seg;
			lastGrip = nodePoint;

			// Don't set its "next" if it's an "M"
			if (next_seg && next_seg.type !== 2) {
				seg.next = next_seg;
				seg.next.prev = seg;
			}
		}
	}
	for (let i = 0; i < this.nodePoints.length; i++) {
		if (nodeTypes[i]) {
			this.nodePoints[i].linkType = nodeTypes[i];
		}
	}
	this.clearSelection();
	return this;
};

svgedit.path.Path.prototype.eachSeg = function(fn) {
	var i;
	var len = this.segs.length;
	for (i = 0; i < len; i++) {
		var ret = fn.call(this.segs[i], i);
		if (ret === false) {break;}
	}
};

svgedit.path.Path.prototype.addSeg = function(index) {
	// Adds a new segment
	var seg = this.segs[index];
	if (!seg.prev) {return;}

	var prev = seg.prev;
	var newseg, new_x, new_y;
	switch(seg.item.pathSegType) {
	case 4:
		new_x = (seg.item.x + prev.item.x) / 2;
		new_y = (seg.item.y + prev.item.y) / 2;
		newseg = this.elem.createSVGPathSegLinetoAbs(new_x, new_y);
		break;
	case 6: //make it a curved segment to preserve the shape (WRS)
		// http://en.wikipedia.org/wiki/De_Casteljau%27s_algorithm#Geometric_interpretation
		var p0_x = (prev.item.x + seg.item.x1)/2;
		var p1_x = (seg.item.x1 + seg.item.x2)/2;
		var p2_x = (seg.item.x2 + seg.item.x)/2;
		var p01_x = (p0_x + p1_x)/2;
		var p12_x = (p1_x + p2_x)/2;
		new_x = (p01_x + p12_x)/2;
		var p0_y = (prev.item.y + seg.item.y1)/2;
		var p1_y = (seg.item.y1 + seg.item.y2)/2;
		var p2_y = (seg.item.y2 + seg.item.y)/2;
		var p01_y = (p0_y + p1_y)/2;
		var p12_y = (p1_y + p2_y)/2;
		new_y = (p01_y + p12_y)/2;
		newseg = this.elem.createSVGPathSegCurvetoCubicAbs(new_x, new_y, p0_x, p0_y, p01_x, p01_y);
		var pts = [seg.item.x, seg.item.y, p12_x, p12_y, p2_x, p2_y];
		svgedit.path.replacePathSeg(seg.type, index, pts);
		break;
	}

	svgedit.path.insertItemBefore(this.elem, newseg, index);
};

svgedit.path.Path.prototype.onDelete = function(fn) {
	if (this.selectedControlPoint) {
		this.deleteCtrlPoint();
		this.endChanges('Delete Path Control Point');
	} else if (this.selected_pts.length > 0) {
		for (let i = this.selected_pts.length - 1; i >= 0; i--) {
			const index = this.selected_pts[i];
			this.deleteNodePoint(index);
		}
		this.clearSelection();
		if (this.segs.length > 0) {
			this.endChanges('Delete Path Node Point(s)');
		} else {
			const batchCmd = new svgedit.history.BatchCommand('Delete Path Node and Delete Path');
			const changeDCmd = this.endChanges('Delete Path Node Point(s)', true);
			if (changeDCmd) {
				batchCmd.addSubCommand(changeDCmd);
			}
			const nextSibling = this.elem.nextSibling;
			const parent = this.elem.parentNode;
			if (parent) {
				const elem = parent.removeChild(this.elem);
				batchCmd.addSubCommand(new svgedit.history.RemoveElementCommand(elem, nextSibling, parent));
			}
			if (!batchCmd.isEmpty()) {
				svgCanvas.undoMgr.addCommandToHistory(batchCmd);
			}
		}
	}
};

svgedit.path.Path.prototype.deleteCtrlPoint = function() {
	if (this.selectedControlPoint) {
		const segChanges = this.selectedControlPoint.delete();
		this.applySegChanges(segChanges);
		this.addPtsToSelection([this.selectedControlPoint.nodePoint.index]);
		this.selectedControlPoint = null;
	}
};

svgedit.path.Path.prototype.deleteNodePoint = function(index) {
	this.hideAllNodes();
	const nodePoint = this.nodePoints[index];
	const { segChanges, segIndexToRemove } = nodePoint.delete();
	this.applySegChanges(segChanges);
	this.nodePoints.splice(index, 1);
	this.nodePoints.forEach((node, index) => {
		node.index = index;
		node.show();
	});
	this.deleteSeg(segIndexToRemove);
};

svgedit.path.Path.prototype.deleteSeg = function(index) {
	const seg = this.segs[index];
	if (!seg) {
		return;
	}
	if (seg.endPoint && seg.endPoint.prevSeg === seg) {
		if (seg.prev.type !== 2) {
			seg.endPoint.setPrevSeg(seg.prev);
		} else {
			seg.endPoint.setPrevSeg(null);
		}
	}
	if (seg.startPoint && seg.startPoint.nextSeg === seg) {
		seg.startPoint.nextSeg = seg.next;
	}
	seg.controlPoints.forEach((cp) => {
		if (cp.seg === seg) {
			cp.removeFromNodePoint();
			cp.hide();
		}
	});
	if (seg.prev) {
		seg.prev.next = seg.next;
	}
	if (seg.next) {
		seg.next.prev = seg.prev;
	}

	// Clean Up M or Mz seg
	if (index > 0 && this.segs[index - 1].type === 2) {
		const mSegIndex = index - 1;
		if (index === this.segs.length - 1 || this.segs[index + 1].type === 2 || this.segs[index + 1].type === 1) {
			// Delete z seg
			if (this.segs.length - 1 > index && this.segs[index + 1].type === 1) {
				const zSegIndex = index + 1;
				this.deleteSeg(zSegIndex);
			}
			// Delete M seg
			this.deleteSeg(mSegIndex);
			index -= 1;
			if (seg.startPoint && !seg.startPoint.isSelected) {
				seg.startPoint.hide();
			}
		}
	}

	const segList = this.elem.pathSegList;
	segList.removeItem(index);
	this.segs.splice(index, 1);
	this.segs.forEach((seg, i) => {
		seg.index = i;
	});
	console.log(this);
};

svgedit.path.Path.prototype.subpathIsClosed = function(index) {
	var closed = false;
	// Check if subpath is already open
	svgedit.path.path.eachSeg(function(i) {
		if (i <= index) {return true;}
		if (this.type === 2) {
			// Found M first, so open
			return false;
		}
		if (this.type === 1) {
			// Found Z first, so closed
			closed = true;
			return false;
		}
	});

	return closed;
};

svgedit.path.Path.prototype.clearSelection = function() {
	this.nodePoints.forEach((nodePoint) => {
		nodePoint.setSelected(false);
	});
	this.selected_pts = [];
	this.selectedControlPoint = null;
};

svgedit.path.Path.prototype.storeD = function() {
	this.last_d = this.elem.getAttribute('d');
};

svgedit.path.Path.prototype.show = function(y) {
	if (y) {
		this.showAllNodes();
	} else {
		this.hideAllNodes();
	}
	return this;
};

svgedit.path.Path.prototype.showAllNodes = function() {
	this.nodePoints.forEach((nodePoint) => {
		nodePoint.show();
	})
	return this;
};

svgedit.path.Path.prototype.hideAllNodes = function() {
	this.nodePoints.forEach((nodePoint) => {
		nodePoint.hide();
	})
	return this;
};

svgedit.path.Path.prototype.updateAllNodes = function() {
	this.nodePoints.forEach((nodePoint) => {
		nodePoint.update();
	})
	return this;
};

svgedit.path.Path.prototype.createControlPointsAtGrip = function(index) {
	const nodePoint = this.nodePoints[index];
	let segChanges = nodePoint.createControlPoints();
	svgedit.path.path.applySegChanges(segChanges);
	segChanges = nodePoint.setNodeType(nodePoint.linkType);
	svgedit.path.path.applySegChanges(segChanges);
	svgedit.path.path.endChanges('Add control points');
};

svgedit.path.Path.prototype.applySegChanges = function(segChanges) {
	for (let index in segChanges) {
		const changes = segChanges[index];
		const segItem = this.segs[index].item;
		const pathSegType = changes.pathSegType || segItem.pathSegType;
		this.segs[index].type = pathSegType;
		let newPoints;
		if (pathSegType === 6) { // C
			newPoints = [
				changes.x || segItem.x, changes.y || segItem.y,
				changes.x1 || segItem.x1, changes.y1 || segItem.y1,
				changes.x2 || segItem.x2, changes.y2 || segItem.y2
			];
		} else if (pathSegType === 8) { // Q
			newPoints = [
				changes.x || segItem.x, changes.y || segItem.y,
				changes.x1 || segItem.x1, changes.y1 || segItem.y1
			];
		} else if (pathSegType === 2 || pathSegType === 4) { // M or L
			newPoints = [
				changes.x || segItem.x, changes.y || segItem.y
			];
		}
		const newItem = svgedit.path.replacePathSeg(pathSegType, index, newPoints);
		this.segs[index].item = newItem;
	}
}

// Move selected points
svgedit.path.Path.prototype.movePts = function(d_x, d_y) {
	let i = this.selected_pts.length;
	while(i--) {
		var nodePoint = this.nodePoints[this.selected_pts[i]];
		const segChanges = nodePoint.move(d_x, d_y);
		this.applySegChanges(segChanges);
	}
};

svgedit.path.Path.prototype.moveCtrl = function(d_x, d_y) {
	if (this.selectedControlPoint) {
		let segChanges = this.selectedControlPoint.move(d_x, d_y);
		this.applySegChanges(segChanges);
		segChanges = this.selectedControlPoint.moveLinkedControlPoint();
		this.applySegChanges(segChanges);
	}
};

svgedit.path.Path.prototype.selectPt = function(pt) {
	this.clearSelection();
	if (pt == null) {
		this.eachSeg(function(i) {
			// 'this' is the segment here.
			if (this.prev) {
				pt = i;
			}
		});
	}
	this.addPtsToSelection(pt);
};

svgedit.path.Path.prototype.selectCtrlPoint = function(segIndex, controlPointIndex) {
	const seg = this.segs[segIndex];
	const controlPoint = seg.controlPoints.find((cp) => cp.index === parseInt(controlPointIndex));
	const nodePoint = controlPoint.nodePoint;
	if (this.selected_pts.length > 1 || this.selected_pts.length[0] !== nodePoint.index) {
		this.clearSelection();
		this.addPtsToSelection([nodePoint.index]);
	}
	nodePoint.setHighlight(false);
	controlPoint.nodePoint.controlPoints.forEach((cp) => {
		cp.setSelected(cp === controlPoint);
	});
	this.selectedControlPoint = controlPoint;
}

svgedit.path.Path.prototype.addPtsToSelection = function (indexes) {
	if (!$.isArray(indexes)) {
		indexes = [indexes];
	}
	for (let i = 0; i < indexes.length; i++) {
		let index = indexes[i];
		if (index < this.nodePoints.length) {
			if (this.selected_pts.indexOf(index) === -1 && index >= 0) {
				this.selected_pts.push(index);
			}
		}
	}
	this.selectedControlPoint = null;
	this.selected_pts.sort();
	const isSelectingOnePoint = this.selected_pts.length <= 1;
	for (let i = 0; i < this.selected_pts.length; i++) {
		const index = this.selected_pts[i];
		const nodePoint = this.nodePoints[index];
		if (isSelectingOnePoint) {
			nodePoint.setSelected(true);
		} else {
			nodePoint.setSelected(true);
			nodePoint.controlPoints.forEach((cp) => cp.hide());
		}
	}
	svgCanvas.pathActions.canDeleteNodes = true;

	svgCanvas.pathActions.closed_subpath = this.subpathIsClosed(this.selected_pts[0]);
};

svgedit.path.Path.prototype.removePtFromSelection = function(index) {
	var pos = this.selected_pts.indexOf(index);
	if (pos == -1) {
		return;
	}
	let nodePoint = this.nodePoints[index];
	nodePoint.setSelected(false);
	this.selected_pts.splice(pos, 1);
	const isSelectingOnePoint = this.selected_pts.length <= 1;
	if (isSelectingOnePoint) {
		const index = this.selected_pts[0];
		const nodePoint = this.nodePoints[index];
		nodePoint.setSelected(true);
	}
};

// Update position of all points
svgedit.path.Path.prototype.update = function() {
	var elem = this.elem;
	if (svgedit.utilities.getRotationAngle(elem)) {
		this.matrix = svgedit.math.getMatrix(elem);
		this.imatrix = this.matrix.inverse();
	} else {
		this.matrix = null;
		this.imatrix = null;
	}

	this.eachSeg(function(i) {
		this.item = elem.pathSegList.getItem(i);
		this.update();
	});

	this.updateAllNodes();
	return this;
};

svgedit.path.Path.prototype.setSelectedNodeType = function(newNodeType) {
	for (let i = 0; i < this.selected_pts.length; i++) {
		const index = this.selected_pts[i];
		const nodePoint = this.nodePoints[index];
		const segChanges = nodePoint.setNodeType(newNodeType);
		this.applySegChanges(segChanges);
	}
	this.endChanges('Set Node Type');
	return this;
};

// Q segments have only one control point, noting which side it belongs to
svgedit.path.Path.prototype.saveSegmentControlPointInfo = function() {
	const segCPInfo = {};
	this.segs.forEach((seg) => {
		if (seg.type === 8) {
			const controlPoint = seg.controlPoints[0];
			if (!controlPoint) {
				return;
			}
			if (controlPoint.nodePoint.index === seg.startPoint.index) {
				segCPInfo[seg.index] = 0;
			} else {
				segCPInfo[seg.index] = 1;
			}
		}
	});
	this.elem.setAttribute('data-segInfo', JSON.stringify(segCPInfo));
	return this;
};

svgedit.path.Path.prototype.saveNodeTypeInfo = function() {
	const nodeTypeInfo = {};
	this.nodePoints.forEach((nodePoint) => {
		nodeTypeInfo[nodePoint.index] = nodePoint.linkType || 0;
	});
	this.elem.setAttribute('data-nodeTypes', JSON.stringify(nodeTypeInfo));
	return this;

};

svgedit.path.getPath_ = function(elem) {
	let p = pathData[elem.id] = new svgedit.path.Path(elem);
	return p;
};

svgedit.path.removePath_ = function(id) {
	if (id in pathData) {delete pathData[id];}
};
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
