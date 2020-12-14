/*globals svgEditor, svgCanvas, svgedit, $*/
/*jslint vars: true, eqeq: true, todo: true */
/*
 * ext-polygon.js
 *
 *
 * Copyright(c) 2010 CloudCanvas, Inc.
 * All rights reserved
 *
 */
svgEditor.addExtension('polygon', function (S) {
    'use strict';
    var selectedElement,
        editingitex = false,
        started,
        newPoly,
        polygonSides = 5;

    window.polygonAddSides = () => {
        if (started) {
            polygonSides++;
            polygonExt.renderPolygon();
        } else {
            const elems = svgCanvas.getSelectedElems();
            if (elems.length === 1 && elems[0].tagName === 'polygon') {
                const poly = elems[0];
                polygonExt.updatePolygonSide(poly, 1);
            }
        }
    };

    window.polygonDecreaseSides = () => {
        if (started) {
            polygonSides--;
            if (polygonSides < 3) {
                polygonSides = 3;
            }
            polygonExt.renderPolygon();
        } else {
            const elems = svgCanvas.getSelectedElems();
            if (elems.length === 1 && elems[0].tagName === 'polygon') {
                const poly = elems[0];
                polygonExt.updatePolygonSide(poly, -1);
            }
        }
    };

    function showPanel(on) {
        var fc_rules = $('#fc_rules');
        if (!fc_rules.length) {
            fc_rules = $('<style id="fc_rules"></style>').appendTo('head');
        }
        fc_rules.text(!on ? '' : ' #tool_topath { display: none !important; }');
        $('#polygon_panel').toggle(on);
    }

    function setAttr(attr, val) {
        svgCanvas.changeSelectedAttribute(attr, val);
        S.call('changed', selectedElement);
    }

    function cot(n) {
        return 1 / Math.tan(n);
    }

    function sec(n) {
        return 1 / Math.cos(n);
    }

    let polygonExt = {
        name: 'polygon',
        svgicons: svgEditor.curConfig.extPath + 'polygon-icons.svg',
        buttons: [{
            id: 'tool_polygon',
            type: 'mode',
            title: 'Polygon Tool',
            position: 11,
            parent: 'tool_polygon',
            events: {
                'mouseup': function () {
                    console.log('Click polygon');
                    svgCanvas.setMode('polygon');
                    showPanel(true);
                }
            }
        }],

        context_tools: [{
            type: 'input',
            panel: 'polygon_panel',
            title: 'Number of Sides',
            id: 'polySides',
            label: 'sides',
            size: 3,
            defval: 5,
            events: {
                change: function () {
                    setAttr('sides', this.value);
                }
            }
        }],

        callback: function () {

            $('#polygon_panel').hide();

            var endChanges = function () {};

            // TODO: Needs to be done after orig icon loads
            setTimeout(function () {
                // Create source save/cancel buttons
                var save = $('#tool_source_save').clone().hide().attr('id', 'polygon_save').unbind().appendTo('#tool_source_back').click(function () {

                    if (!editingitex) {
                        return;
                    }
                    // Todo: Uncomment the setItexString() function above and handle ajaxEndpoint?
                    if (!setItexString($('#svg_source_textarea').val())) {
                        $.confirm('Errors found. Revert to original?', function (ok) {
                            if (!ok) {
                                return false;
                            }
                            endChanges();
                        });
                    } else {
                        endChanges();
                    }
                    // setSelectMode();
                });

                var cancel = $('#tool_source_cancel').clone().hide().attr('id', 'polygon_cancel').unbind().appendTo('#tool_source_back').click(function () {
                    endChanges();
                });

            }, 3000);
        },
        mouseDown: function (opts) {
            // var e = opts.event;
            var sRgb = svgCanvas.getColor('stroke');
            // ccSRgbEl = sRgb.substring(1, rgb.length);
            var sWidth = svgCanvas.getStrokeWidth();

            if (svgCanvas.getMode() == 'polygon') {
                started = true;
                newPoly = S.addSvgElementFromJson({
                    'element': 'polygon',
                    'attr': {
                        'cx': opts.start_x,
                        'cy': opts.start_y,
                        'id': S.getNextId(),
                        'shape': 'regularPoly',
                        'sides': polygonSides,
                        'orient': 'x',
                        'edge': 0,
                        'fill': 'none',
                        'fill-opacity': 0,
                        'stroke': 'black',
                        'strokeWidth': 1
                    }
                });
                if (svgCanvas.isUsingLayerColor) {
                    svgCanvas.updateElementColor(newPoly);
                }
                svgCanvas.clearSelection();
                return {
                    started: true
                };
            }
        },
        updatePolygonSide: (polygon, sideChange) => {
            const c = $(polygon).attr(['cx', 'cy', 'edge', 'angle_offset', 'sides']);
            console.log(c);
            const newSidesNumber = Math.max(c.sides + sideChange, 3);
            if (newSidesNumber === c.sides) {
                return;
            }
            const edg = Number(c.edge);
            const cx = c.cx;
            const cy = c.cy;
            const angle_offset = Number(c.angle_offset);
            const inradius = (edg / 2) * cot(Math.PI / newSidesNumber);
            const circumradius = inradius * sec(Math.PI / newSidesNumber);
            const points = [];
            for (let s = 0; newSidesNumber >= s; s++) {
                const angle = 2.0 * Math.PI * s / newSidesNumber + angle_offset;
                const x = (circumradius * Math.cos(angle)) + cx;
                const y = (circumradius * Math.sin(angle)) + cy;

                points.push(x + ',' + y);
            }
            polygon.setAttributeNS(null, 'sides', newSidesNumber);
            polygon.setAttributeNS(null, 'points', points.join(' '));
            const selectedElems = svgCanvas.getSelectedElems();
            if (selectedElems.includes(polygon)) {
                svgedit.select.getSelectorManager().requestSelector(polygon).resize();
            }
            window.updateContextPanel();
        },
        renderPolygon: function() {
            if (!newPoly) {
                return;
            }
            let c = $(newPoly).attr(['cx', 'cy', 'edge', 'angle_offset']);
            let edg = Number(c.edge),
                cx = c.cx,
                cy = c.cy,
                angle_offset = Number(c.angle_offset),
                sides = polygonSides;
            let inradius = (edg / 2) * cot(Math.PI / sides);
            let circumradius = inradius * sec(Math.PI / sides);
            let points = [];
            for (let s = 0; sides >= s; s++) {
                var angle = 2.0 * Math.PI * s / sides + angle_offset;
                x = (circumradius * Math.cos(angle)) + cx;
                y = (circumradius * Math.sin(angle)) + cy;

                points.push(x + ',' + y);
            }
            newPoly.setAttributeNS(null, 'points', points.join(' '));
            newPoly.setAttributeNS(null, 'sides', polygonSides);
            const selectedElems = svgCanvas.getSelectedElems();
            if (selectedElems.includes(newPoly)) {
                svgedit.select.getSelectorManager().requestSelector(newPoly).resize();
            }
        },
        mouseMove: function (opts) {
            if (!started) {
                return;
            }
            if (svgCanvas.getMode() === 'polygon') {
                let zoom = svgCanvas.getZoom(),
                    x = opts.mouse_x / zoom,
                    y = opts.mouse_y / zoom;
                let c = $(newPoly).attr(['cx', 'cy']);
                const angle = (180 * (polygonSides - 2)) / polygonSides / 2;
                let cx = c.cx,
                    cy = c.cy,
                    edg = (2 * Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy))* Math.cos(angle * Math.PI / 180)),
                    sides = polygonSides;
                let angle_offset;
                if (!opts.event.shiftKey) {
                    angle_offset = Math.atan2(y - cy, x - cx)
                } else {
                    angle_offset = Math.PI / 2 - (Math.PI / sides);
                }
                
                newPoly.setAttributeNS(null, 'edge', edg);
                newPoly.setAttributeNS(null, 'angle_offset', angle_offset);
                polygonExt.renderPolygon();
                if (!opts.selected) {
                    svgCanvas.selectOnly([newPoly], true);
                } else {
                    svgCanvas.selectorManager.requestSelector(opts.selected).resize();
                    const bbox = newPoly.getBBox();
                    opts.ObjectPanelController.updateDimensionValues({x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height});
                    opts.ObjectPanelController.updateObjectPanel();
                }
                return {
                    started: true
                };
            }

        },

        mouseUp: function (opts) {
            if (svgCanvas.getMode() == 'polygon') {
                started = false;
                var edge = $(newPoly).attr('edge');
                var keep = (edge !== 0);

                if (!opts.isContinuousDrawing) {
                    svgCanvas.setMode('select');
                }
                return {
                    keep: keep,
                    element: newPoly
                };
            }

        },
        selectedChanged: function (opts) {
            // Use this to update the current selected elements
            selectedElement = opts.elems;

            var i = selectedElement.length;

            while (i--) {
                var elem = selectedElement[i];
                if (elem && elem.getAttributeNS(null, 'shape') === 'regularPoly') {
                    if (opts.selectedElement && !opts.multiselected) {
                        $('#polySides').val(elem.getAttribute('sides'));

                        showPanel(true);
                    } else {
                        showPanel(false);
                    }
                } else {
                    showPanel(false);
                }
            }
        },
        elementChanged: function (opts) {
            // var elem = opts.elems[0];
        }
    };

    return polygonExt;
});
