/*globals $, svgedit, unescape, DOMParser, ActiveXObject*/
/*jslint vars: true, eqeq: true, bitwise: true, continue: true, forin: true*/
/**
 * Package: svgedit.utilities
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2010 Alexis Deveria
 * Copyright(c) 2010 Jeff Schiller
 */

const path = require('path');

// Dependencies:
// 1) jQuery
// 2) pathseg.js
// 3) browser.js
// 4) svgtransformlist.js
// 5) units.js

(function (undef) {
  'use strict';

  if (!svgedit.utilities) {
    svgedit.utilities = {};
  }

  // Constants

  // String used to encode base64.
  var KEYSTR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  var NS = svgedit.NS;

  // Much faster than running getBBox() every time
  var visElems = 'a,circle,ellipse,foreignObject,g,image,line,path,polygon,polyline,rect,svg,text,tspan,use';
  var visElems_arr = visElems.split(',');
  //var hidElems = 'clipPath,defs,desc,feGaussianBlur,filter,linearGradient,marker,mask,metadata,pattern,radialGradient,stop,switch,symbol,title,textPath';

  var editorContext_ = null;
  var domdoc_ = null;
  var domcontainer_ = null;
  var svgroot_ = null;

  svgedit.utilities.init = function (editorContext) {
    editorContext_ = editorContext;
    domdoc_ = editorContext.getDOMDocument();
    domcontainer_ = editorContext.getDOMContainer();
    svgroot_ = editorContext.getSVGRoot();
  };

  // Function: svgedit.utilities.toXml
  // Converts characters in a string to XML-friendly entities.
  //
  // Example: '&' becomes '&amp;'
  //
  // Parameters:
  // str - The string to be converted
  //
  // Returns:
  // The converted string
  svgedit.utilities.toXml = function (str) {
    // &apos; is ok in XML, but not HTML
    // &gt; does not normally need escaping, though it can if within a CDATA expression (and preceded by "]]")
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/, '&#x27;');
  };

  // Function: svgedit.utilities.fromXml
  // Converts XML entities in a string to single characters.
  // Example: '&amp;' becomes '&'
  //
  // Parameters:
  // str - The string to be converted
  //
  // Returns:
  // The converted string
  svgedit.utilities.fromXml = function (str) {
    return $('<p/>').html(str).text();
  };

  // This code was written by Tyler Akins and has been placed in the
  // public domain.  It would be nice if you left this header intact.
  // Base64 code from Tyler Akins -- http://rumkin.com

  // schiller: Removed string concatenation in favour of Array.join() optimization,
  //				also precalculate the size of the array needed.

  // Function: svgedit.utilities.encode64
  // Converts a string to base64
  svgedit.utilities.encode64 = function (input) {
    // base64 strings are 4/3 larger than the original string
    input = svgedit.utilities.encodeUTF8(input); // convert non-ASCII characters
    // input = svgedit.utilities.convertToXMLReferences(input);
    if (window.btoa) {
      return window.btoa(input); // Use native if available
    }
    var output = [];
    output.length = Math.floor((input.length + 2) / 3) * 4;
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0,
      p = 0;

    do {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);

      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;

      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }

      output[p++] = KEYSTR.charAt(enc1);
      output[p++] = KEYSTR.charAt(enc2);
      output[p++] = KEYSTR.charAt(enc3);
      output[p++] = KEYSTR.charAt(enc4);
    } while (i < input.length);

    return output.join('');
  };

  // Function: svgedit.utilities.decode64
  // Converts a string from base64
  svgedit.utilities.decode64 = function (input) {
    if (window.atob) {
      return svgedit.utilities.decodeUTF8(window.atob(input));
    }
    var output = '';
    var chr1,
      chr2,
      chr3 = '';
    var enc1,
      enc2,
      enc3,
      enc4 = '';
    var i = 0;

    // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

    do {
      enc1 = KEYSTR.indexOf(input.charAt(i++));
      enc2 = KEYSTR.indexOf(input.charAt(i++));
      enc3 = KEYSTR.indexOf(input.charAt(i++));
      enc4 = KEYSTR.indexOf(input.charAt(i++));

      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;

      output = output + String.fromCharCode(chr1);

      if (enc3 != 64) {
        output = output + String.fromCharCode(chr2);
      }
      if (enc4 != 64) {
        output = output + String.fromCharCode(chr3);
      }

      chr1 = chr2 = chr3 = '';
      enc1 = enc2 = enc3 = enc4 = '';
    } while (i < input.length);
    return svgedit.utilities.decodeUTF8(output);
  };

  svgedit.utilities.decodeUTF8 = function (argString) {
    return decodeURIComponent(escape(argString));
  };

  // codedread:does not seem to work with webkit-based browsers on OSX // Brettz9: please test again as function upgraded
  svgedit.utilities.encodeUTF8 = function (argString) {
    return unescape(encodeURIComponent(argString));
  };

  // Function: svgedit.utilities.convertToXMLReferences
  // Converts a string to use XML references
  svgedit.utilities.convertToXMLReferences = function (input) {
    var n,
      output = '';
    for (n = 0; n < input.length; n++) {
      var c = input.charCodeAt(n);
      if (c < 128) {
        output += input[n];
      } else if (c > 127) {
        output += '&#' + c + ';';
      }
    }
    return output;
  };

  // Function: svgedit.utilities.text2xml
  // Cross-browser compatible method of converting a string to an XML tree
  // found this function here: http://groups.google.com/group/jquery-dev/browse_thread/thread/c6d11387c580a77f
  svgedit.utilities.text2xml = function (sXML) {
    if (sXML.indexOf('<svg:svg') >= 0) {
      sXML = sXML.replace(/<(\/?)svg:/g, '<$1').replace('xmlns:svg', 'xmlns');
    }

    var out, dXML;
    try {
      dXML = window.DOMParser ? new DOMParser() : new ActiveXObject('Microsoft.XMLDOM');
      dXML.async = false;
    } catch (e) {
      throw new Error('XML Parser could not be instantiated');
    }
    try {
      if (dXML.loadXML) {
        out = dXML.loadXML(sXML) ? dXML : false;
      } else {
        out = dXML.parseFromString(sXML, 'text/xml');
      }
    } catch (e2) {
      throw new Error('Error parsing XML string');
    }
    return out;
  };

  // Function: svgedit.utilities.bboxToObj
  // Converts a SVGRect into an object.
  //
  // Parameters:
  // bbox - a SVGRect
  //
  // Returns:
  // An object with properties names x, y, width, height.
  svgedit.utilities.bboxToObj = function (bbox) {
    return {
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height,
    };
  };

  // Function: svgedit.utilities.walkTree
  // Walks the tree and executes the callback on each element in a top-down fashion
  //
  // Parameters:
  // elem - DOM element to traverse
  // cbFn - Callback function to run on each element
  svgedit.utilities.walkTree = function (elem, cbFn) {
    if (elem && elem.nodeType == 1) {
      cbFn(elem);
      var i = elem.childNodes.length;
      while (i--) {
        svgedit.utilities.walkTree(elem.childNodes.item(i), cbFn);
      }
    }
  };

  // Function: svgedit.utilities.walkTreePost
  // Walks the tree and executes the callback on each element in a depth-first fashion
  // TODO: FIXME: Shouldn't this be calling walkTreePost?
  //
  // Parameters:
  // elem - DOM element to traverse
  // cbFn - Callback function to run on each element
  svgedit.utilities.walkTreePost = function (elem, cbFn) {
    if (elem && elem.nodeType == 1) {
      var i = elem.childNodes.length;
      while (i--) {
        svgedit.utilities.walkTree(elem.childNodes.item(i), cbFn);
      }
      cbFn(elem);
    }
  };

  // Function: svgedit.utilities.getUrlFromAttr
  // Extracts the URL from the url(...) syntax of some attributes.
  // Three variants:
  //  * <circle fill="url(someFile.svg#foo)" />
  //  * <circle fill="url('someFile.svg#foo')" />
  //  * <circle fill='url("someFile.svg#foo")' />
  //
  // Parameters:
  // attrVal - The attribute value as a string
  //
  // Returns:
  // String with just the URL, like someFile.svg#foo
  svgedit.utilities.getUrlFromAttr = function (attrVal) {
    if (attrVal) {
      // url("#somegrad")
      if (attrVal.indexOf('url("') === 0) {
        return attrVal.substring(5, attrVal.indexOf('"', 6));
      }
      // url('#somegrad')
      if (attrVal.indexOf("url('") === 0) {
        return attrVal.substring(5, attrVal.indexOf("'", 6));
      }
      if (attrVal.indexOf('url(') === 0) {
        return attrVal.substring(4, attrVal.indexOf(')'));
      }
    }
    return null;
  };

  // Function: svgedit.utilities.getHref
  // Returns the given element's xlink:href value
  /**
   * @deprecated Please use import getHref from '@core/app/svgedit/utils/href'; if you want to use this function
   */
  svgedit.utilities.getHref = function (elem) {
    return elem.getAttributeNS(NS.XLINK, 'href');
  };

  // Function: svgedit.utilities.setHref
  // Sets the given element's xlink:href value
  /**
   * @deprecated Please use import setHref from '@core/app/svgedit/utils/href'; if you want to use this function
   */
  svgedit.utilities.setHref = function (elem, val) {
    elem.setAttributeNS(NS.XLINK, 'xlink:href', val);
  };

  // Function: svgedit.utilities.moveDefs
  // Because symbol elements in svgcontent will cause severe lag when zooming,
  // we wants defs to be out of svgcontent when editing. However, we need defs
  // in svgcontent when exporting and saving. So we use these to functions to
  // move in and out defs.
  svgedit.utilities.moveDefsIntoSvgContent = () => {
    const svgContents = editorContext_.getSVGContent();
    const defs = svgedit.utilities.findDefs();
    svgContents.prepend(defs);
  };

  svgedit.utilities.moveDefsOutfromSvgContent = () => {
    const svgContents = editorContext_.getSVGContent();
    let defs = svgContents.getElementsByTagNameNS(NS.SVG, 'defs');
    if (defs.length > 0) {
      defs = defs[0];
      const origDefs = svgedit.utilities.findDefs();
      Array.from(defs.childNodes).forEach((child) => {
        origDefs.appendChild(child);
      });
      defs.remove();
    }
  };

  svgedit.utilities.findTempUse = function () {
    //var svgElement = editorContext_.getSVGContent();
    let svgElement = document.getElementById('svg_defs');
    if (!svgElement) {
      const svgCanvas = document.getElementById('svgcanvas');
      const svgdoc = svgCanvas.ownerDocument;
      const NS = svgedit.NS;
      svgElement = svgdoc.createElementNS(NS.SVG, 'svg');
      svgElement.setAttribute('id', 'svg_defs');
      svgCanvas.appendChild(svgElement);
    }
    let use = Array.from(svgElement.childNodes).find((node) => node.tagName === 'use');
    if (!use) {
      use = document.createElementNS(NS.SVG, 'use');
      svgElement.appendChild(use);
    }
    return use;
  };

  // Function: findDefs
  //
  // Returns:
  // The document's <defs> element, create it first if necessary
  /**
   * @deprecated Please use import findDefs from '@core/app/svgedit/utils/findDef'; if you want to use this function
   */
  svgedit.utilities.findDefs = function () {
    let svgElement = document.getElementById('svg_defs');
    if (!svgElement) {
      const svgCanvas = document.getElementById('svgcanvas');
      const svgdoc = svgCanvas.ownerDocument;
      const NS = svgedit.NS;
      svgElement = svgdoc.createElementNS(NS.SVG, 'svg');
      svgElement.setAttribute('id', 'svg_defs');
      svgCanvas.appendChild(svgElement);
    }
    var defs = svgElement.getElementsByTagNameNS(NS.SVG, 'defs');
    if (defs.length > 0) {
      defs = defs[0];
    } else {
      defs = svgElement.ownerDocument.createElementNS(NS.SVG, 'defs');
      svgElement.insertBefore(defs, svgElement.firstChild);
    }
    return defs;
  };

  svgedit.utilities.clearDefs = function () {
    let svgElement = document.getElementById('svg_defs');
    if (svgElement) {
      svgElement.remove();
    }
  };

  // Function: getPathDFromSegments
  // Create a path 'd' attribute from path segments.
  // Each segment is an array of the form: [singleChar, [x,y, x,y, ...]]
  //
  // Parameters:
  // pathSegments - An array of path segments to be converted
  //
  // Returns:
  // The converted path d attribute.
  svgedit.utilities.getPathDFromSegments = function (pathSegments) {
    var d = '';

    $.each(pathSegments, function (j, seg) {
      var i;
      var pts = seg[1];
      //var pts = parseFloat(seg[1]);
      d += seg[0];
      for (i = 0; i < pts.length; i += 2) {
        d += pts[i].toFixed(5) + ',' + pts[i + 1].toFixed(5) + ' ';
      }
    });

    return d;
  };

  // Function: getPathDFromElement
  // Make a path 'd' attribute from a simple SVG element shape.
  //
  // Parameters:
  // elem - The element to be converted
  //
  // Returns:
  // The path d attribute or undefined if the element type is unknown.
  svgedit.utilities.getPathDFromElement = function (elem) {
    // Possibly the cubed root of 6, but 1.81 works best
    var num = 1.81;
    var d, a, rx, ry;
    switch (elem.tagName) {
      case 'ellipse':
      case 'circle':
        a = $(elem).attr(['rx', 'ry', 'cx', 'cy']);
        var cx = a.cx,
          cy = a.cy;
        rx = a.rx;
        ry = a.ry;
        if (elem.tagName == 'circle') {
          rx = ry = $(elem).attr('r');
        }

        d = svgedit.utilities.getPathDFromSegments([
          ['M', [cx - rx, cy]],
          ['C', [cx - rx, cy - ry / num, cx - rx / num, cy - ry, cx, cy - ry]],
          ['C', [cx + rx / num, cy - ry, cx + rx, cy - ry / num, cx + rx, cy]],
          ['C', [cx + rx, cy + ry / num, cx + rx / num, cy + ry, cx, cy + ry]],
          ['C', [cx - rx / num, cy + ry, cx - rx, cy + ry / num, cx - rx, cy]],
          ['Z', []],
        ]);
        break;
      case 'path':
        d = elem.getAttribute('d');
        break;
      case 'line':
        a = $(elem).attr(['x1', 'y1', 'x2', 'y2']);
        d = 'M' + a.x1 + ',' + a.y1 + 'L' + a.x2 + ',' + a.y2;
        break;
      case 'polyline':
        d = 'M' + elem.getAttribute('points');
        break;
      case 'polygon':
        d = 'M' + elem.getAttribute('points').trim().replace(/ /g, ' L') + ' Z';
        break;
      case 'rect':
        var r = $(elem).attr(['rx', 'ry']);
        var b = elem.getBBox();
        var x = b.x,
          y = b.y,
          w = b.width,
          h = b.height;
        rx = Math.min(w / 2, r.rx);
        ry = Math.min(h / 2, r.ry || rx);
        num = 4 - num; // Why? Because!

        if (!rx && !ry) {
          // Regular rect
          d = svgedit.utilities.getPathDFromSegments([
            ['M', [x, y]],
            ['L', [x + w, y]],
            ['L', [x + w, y + h]],
            ['L', [x, y + h]],
            ['L', [x, y]],
            ['Z', []],
          ]);
        } else {
          d = svgedit.utilities.getPathDFromSegments([
            ['M', [x, y + ry]],
            ['C', [x, y + ry / num, x + rx / num, y, x + rx, y]],
            ['L', [x + w - rx, y]],
            ['C', [x + w - rx / num, y, x + w, y + ry / num, x + w, y + ry]],
            ['L', [x + w, y + h - ry]],
            ['C', [x + w, y + h - ry / num, x + w - rx / num, y + h, x + w - rx, y + h]],
            ['L', [x + rx, y + h]],
            ['C', [x + rx / num, y + h, x, y + h - ry / num, x, y + h - ry]],
            ['L', [x, y + ry]],
            ['Z', []],
          ]);
        }
        break;
      default:
        break;
    }

    return d;
  };

  // Function: getExtraAttributesForConvertToPath
  // Get a set of attributes from an element that is useful for convertToPath.
  //
  // Parameters:
  // elem - The element to be probed
  //
  // Returns:
  // An object with attributes.
  svgedit.utilities.getExtraAttributesForConvertToPath = function (elem) {
    var attrs = {};
    // TODO: make this list global so that we can properly maintain it
    // TODO: what about @transform, @clip-rule, @fill-rule, etc?
    $.each(['marker-start', 'marker-end', 'marker-mid', 'filter', 'clip-path'], function () {
      var a = elem.getAttribute(this);
      if (a) {
        attrs[this] = a;
      }
    });
    return attrs;
  };

  // Function: convertToPath
  // Convert selected element to a path.
  //
  // Parameters:
  // elem - The DOM element to be converted
  // attrs - Apply attributes to new path. see canvas.convertToPath
  // addSvgElementFromJson - Function to add the path element to the current layer. See canvas.addSvgElementFromJson
  // pathActions - If a transform exists, pathActions.resetOrientation() is used. See: canvas.pathActions.
  // clearSelection - see canvas.clearSelection
  // addToSelection - see canvas.addToSelection
  // history - see svgedit.history
  // addCommandToHistory - see canvas.addCommandToHistory
  //
  // Returns:
  // The converted path element or null if the DOM element was not recognized.
  svgedit.utilities.convertToPath = function (elem, attrs, addSvgElementFromJson, pathActions, history) {
    var batchCmd = new history.BatchCommand('Convert element to Path');

    // Any attribute on the element not covered by the passed-in attributes
    attrs = $.extend({}, attrs, svgedit.utilities.getExtraAttributesForConvertToPath(elem));

    var path = addSvgElementFromJson({
      element: 'path',
      attr: attrs,
    });

    var eltrans = elem.getAttribute('transform');
    if (eltrans) {
      path.setAttribute('transform', eltrans);
    }

    var id = elem.id;
    var parent = elem.parentNode;
    if (elem.nextSibling) {
      parent.insertBefore(path, elem);
    } else {
      parent.appendChild(path);
    }

    var d = svgedit.utilities.getPathDFromElement(elem);
    if (d) {
      path.setAttribute('d', d);

      // Replace the current element with the converted one

      // Reorient if it has a matrix
      if (eltrans) {
        var tlist = svgedit.transformlist.getTransformList(path);
        if (svgedit.math.hasMatrixTransform(tlist)) {
          pathActions.resetOrientation(path);
        }
      }

      var nextSibling = elem.nextSibling;
      batchCmd.addSubCommand(new history.InsertElementCommand(path));
      batchCmd.addSubCommand(new history.RemoveElementCommand(elem, nextSibling, parent));

      elem.parentNode.removeChild(elem);
      path.setAttribute('id', id);
      path.removeAttribute('visibility');

      return { path, cmd: batchCmd };
    } else {
      // the elem.tagName was not recognized, so no "d" attribute. Remove it, so we've haven't changed anything.
      path.parentNode.removeChild(path);
      return { path };
    }
  };

  // Function: svgedit.utilities.getRotationAngleFromTransformList
  // Get the rotation angle of the given transform list.
  //
  // Parameters:
  // tlist - List of transforms
  // to_rad - Boolean that when true returns the value in radians rather than degrees
  //
  // Returns:
  // Float with the angle in degrees or radians
  svgedit.utilities.getRotationAngleFromTransformList = function (tlist, to_rad) {
    if (!tlist) {
      return 0;
    } // <svg> elements have no tlist
    var N = tlist.numberOfItems;
    var i;
    for (i = 0; i < N; ++i) {
      var xform = tlist.getItem(i);
      if (xform.type == 4) {
        return to_rad ? (xform.angle * Math.PI) / 180.0 : xform.angle;
      }
    }
    return 0.0;
  };

  // Function: svgedit.utilities.getRotationAngle
  // Get the rotation angle of the given/selected DOM element
  //
  // Parameters:
  // elem - Optional DOM element to get the angle for
  // to_rad - Boolean that when true returns the value in radians rather than degrees
  //
  // Returns:
  // Float with the angle in degrees or radians
  svgedit.utilities.getRotationAngle = function (elem, to_rad) {
    var selected = elem || editorContext_.getSelectedElements()[0];
    // find the rotation transform (if any) and set it
    var tlist = svgedit.transformlist.getTransformList(selected);
    return svgedit.utilities.getRotationAngleFromTransformList(tlist, to_rad);
  };

  // Function getRefElem
  // Get the reference element associated with the given attribute value
  //
  // Parameters:
  // attrVal - The attribute value as a string
  svgedit.utilities.getRefElem = function (attrVal) {
    return svgedit.utilities.getElem(svgedit.utilities.getUrlFromAttr(attrVal).substr(1));
  };

  // Function: getElem
  // Get a DOM element by ID within the SVG root element.
  //
  // Parameters:
  // id - String with the element's new ID
  svgedit.utilities.getElem = function (id) {
    // querySelector lookup
    return svgroot_.querySelector('#' + id);
  };

  // Function: assignAttributes
  // Assigns multiple attributes to an element.
  //
  // Parameters:
  // node - DOM element to apply new attribute values to
  // attrs - Object with attribute keys/values
  // suspendLength - Optional integer of milliseconds to suspend redraw
  // unitCheck - Boolean to indicate the need to use svgedit.units.setUnitAttr
  svgedit.utilities.assignAttributes = function (node, attrs, suspendLength, unitCheck) {
    var i;
    for (i in attrs) {
      var ns = i.substr(0, 4) === 'xml:' ? NS.XML : i.substr(0, 6) === 'xlink:' ? NS.XLINK : null;

      if (ns) {
        node.setAttributeNS(ns, i, attrs[i]);
      } else if (!unitCheck) {
        node.setAttribute(i, attrs[i]);
      } else {
        svgedit.units.setUnitAttr(node, i, attrs[i]);
      }
    }
  };

  const shapeElementsTags = ['circle', 'ellipse', 'line', 'mesh', 'path', 'polygon', 'polyline', 'rect'];

  /**
   * cleanUpElement
   * Remove unneeded (default) attributes and useless childnodes, makes resulting SVG smaller
   * @param {Element} element DOM element to clean up
   */
  svgedit.utilities.cleanupElement = function (element) {
    var defaults = {
      'fill-opacity': 1,
      'stop-opacity': 1,
      opacity: 1,
      stroke: 'none',
      'stroke-dasharray': 'none',
      'stroke-linejoin': 'miter',
      'stroke-linecap': 'butt',
      'stroke-opacity': 1,
      'stroke-width': 1,
      rx: 0,
      ry: 0,
    };

    if (element.nodeName === 'ellipse') {
      // Ellipse elements requires rx and ry attributes
      delete defaults.rx;
      delete defaults.ry;
    }

    if (shapeElementsTags.includes(element.tagName)) {
      while (element.firstChild) {
        element.firstChild.remove();
      }
    }

    var attr;
    for (attr in defaults) {
      var val = defaults[attr];
      if (element.getAttribute(attr) == val) {
        element.removeAttribute(attr);
      }
    }
  };

  // Function: snapToGrid
  // round value to for snapping
  // NOTE: This function did not move to svgutils.js since it depends on curConfig.
  svgedit.utilities.snapToGrid = function (value) {
    var stepSize = editorContext_.getSnappingStep();
    var unit = editorContext_.getBaseUnit();
    if (unit !== 'px') {
      stepSize *= svgedit.units.getTypeMap()[unit];
    }
    value = Math.round(value / stepSize) * stepSize;
    return value;
  };

  svgedit.utilities.preg_quote = function (str, delimiter) {
    // From: http://phpjs.org/functions
    return String(str).replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
  };

  /**
   * @param {string} globalCheck A global which can be used to determine if the script is already loaded
   * @param {array} scripts An array of scripts to preload (in order)
   * @param {function} cb The callback to execute upon load.
   */
  svgedit.utilities.executeAfterLoads = function (globalCheck, scripts, cb) {
    return function () {
      var args = arguments;
      function endCallback() {
        cb.apply(null, args);
      }
      if (window[globalCheck]) {
        endCallback();
      } else {
        scripts.reduceRight(function (oldFunc, script) {
          return function () {
            $.getScript(script, oldFunc);
          };
        }, endCallback)();
      }
    };
  };

  /**
   * Prevents default browser click behaviour on the given element
   * @param img - The DOM element to prevent the click on
   */
  svgedit.utilities.preventClickDefault = function (img) {
    $(img).click(function (e) {
      e.preventDefault();
    });
  };

  /**
   * Create a clone of an element, updating its ID and its children's IDs when needed
   * @param {Element} el - DOM element to clone
   * @param {function()} getNextId - function the get the next unique ID.
   * @returns {Element}
   */
  svgedit.utilities.copyElem = function (el, getNextId) {
    // manually create a copy of the element
    var new_el = document.createElementNS(el.namespaceURI, el.nodeName);
    $.each(el.attributes, function (i, attr) {
      if (attr.localName != '-moz-math-font-style') {
        new_el.setAttributeNS(attr.namespaceURI, attr.nodeName, attr.value);
      }
    });
    // set the copied element's new id
    new_el.removeAttribute('id');
    new_el.id = getNextId();

    // Opera's "d" value needs to be reset for Opera/Win/non-EN
    // Also needed for webkit (else does not keep curved segments on clone)
    if (svgedit.browser.isWebkit() && el.nodeName == 'path') {
      var fixed_d = svgedit.utilities.convertPath(el);
      new_el.setAttribute('d', fixed_d);
    }

    // now create copies of all children
    $.each(el.childNodes, function (i, child) {
      switch (child.nodeType) {
        case 1: // element node
          new_el.appendChild(svgedit.utilities.copyElem(child, getNextId));
          break;
        case 3: // text node
          new_el.textContent = child.nodeValue;
          break;
        default:
          break;
      }
    });

    if ($(el).data('gsvg')) {
      $(new_el).data('gsvg', new_el.firstChild);
    } else if (new_el.tagName == 'image') {
      svgedit.utilities.preventClickDefault(new_el);
    }
    return new_el;
  };

  /**
   * Create a clone of an element, updating its ID and its children's IDs when needed
   * @param {Element} elData - DOM element to clone
   * @param {function()} getNextId - function the get the next unique ID.
   * @returns {Element}
   */
  svgedit.utilities.copyElemData = function (elData, getNextId) {
    // manually create a copy of the element
    var new_el = document.createElementNS(
      elData.namespaceURI,
      elData.nodeName === 'STYLE' ? elData.nodeName?.toLowerCase() : elData.nodeName,
    );

    $.each(elData.attributes, function (i, attr) {
      new_el.setAttributeNS(attr.namespaceURI, attr.nodeName, attr.value);
    });
    // set the copied element's new id
    new_el.removeAttribute('id');
    new_el.id = getNextId();

    // Opera's "d" value needs to be reset for Opera/Win/non-EN
    // Also needed for webkit (else does not keep curved segments on clone)
    if (svgedit.browser.isWebkit() && elData.nodeName == 'path') {
      // new_el.setAttribute('d', elData.d);
    }

    // now create copies of all children
    $.each(elData.childNodes, function (i, childData) {
      switch (childData.nodeType) {
        case 1: // element node
          new_el.appendChild(svgedit.utilities.copyElemData(childData, getNextId));
          break;
        case 3: // text node
          new_el.textContent = childData.nodeValue;
          break;
        default:
          break;
      }
    });

    if (elData.dataGSVG) {
      $(new_el).data('gsvg', new_el.firstChild);
    } else if (new_el.tagName == 'image') {
      svgedit.utilities.preventClickDefault(new_el);
    }
    return new_el;
  };

  /**
   * TODO: refactor callers in convertPath to use getPathDFromSegments instead of this function.
   * Legacy code refactored from svgcanvas.pathActions.convertPath
   * @param letter - path segment command
   * @param {Array.<Array.<number>>} points - x,y points.
   * @param {Array.<Array.<number>>=} morePoints - x,y points
   * @param {Array.<number>=}lastPoint - x,y point
   * @returns {string}
   */
  function pathDSegment(letter, points, morePoints, lastPoint) {
    $.each(points, function (i, pnt) {
      points[i] = svgedit.units.shortFloat(pnt);
    });
    var segment = letter + points.join(' ');
    if (morePoints) {
      segment += ' ' + morePoints.join(' ');
    }
    if (lastPoint) {
      segment += ' ' + svgedit.units.shortFloat(lastPoint);
    }
    return segment;
  }

  // this is how we map paths to our preferred relative segment types
  var pathMap = [0, 'z', 'M', 'm', 'L', 'l', 'C', 'c', 'Q', 'q', 'A', 'a', 'H', 'h', 'V', 'v', 'S', 's', 'T', 't'];

  /**
   * TODO: move to pathActions.js when migrating rest of pathActions out of svgcanvas.js
   * Convert a path to one with only absolute or relative values
   * @param {Object} path - the path to convert
   * @param {boolean} toRel - true of convert to relative
   * @returns {string}
   */
  svgedit.utilities.convertPath = function (path, toRel) {
    var i;
    var segList = path.pathSegList;
    var len = segList.numberOfItems;
    var curx = 0,
      cury = 0;
    var d = '';
    var last_m = null;

    for (i = 0; i < len; ++i) {
      var seg = segList.getItem(i);
      // if these properties are not in the segment, set them to zero
      var x = seg.x || 0,
        y = seg.y || 0,
        x1 = seg.x1 || 0,
        y1 = seg.y1 || 0,
        x2 = seg.x2 || 0,
        y2 = seg.y2 || 0;

      var type = seg.pathSegType;
      var letter = pathMap[type]['to' + (toRel ? 'Lower' : 'Upper') + 'Case']();

      switch (type) {
        case 1: // z,Z closepath (Z/z)
          curx = last_m ? last_m[0] : 0;
          cury = last_m ? last_m[1] : 0;
          d += 'z';
          break;
        case 12: // absolute horizontal line (H)
          x -= curx;
        case 13: // relative horizontal line (h)
          if (toRel) {
            curx += x;
            letter = 'l';
          } else {
            x += curx;
            curx = x;
            y = cury;
            letter = 'L';
          }
          // Convert to "line" for easier editing
          d += pathDSegment(letter, [[x, y]]);
          break;
        case 14: // absolute vertical line (V)
          y -= cury;
        case 15: // relative vertical line (v)
          if (toRel) {
            cury += y;
            letter = 'l';
          } else {
            y += cury;
            cury = y;
            x = curx;
            letter = 'L';
          }
          // Convert to "line" for easier editing
          d += pathDSegment(letter, [[x, y]]);
          break;
        case 2: // absolute move (M)
        case 4: // absolute line (L)
        case 18: // absolute smooth quad (T)
          x -= curx;
          y -= cury;
        case 5: // relative line (l)
        case 3: // relative move (m)
          // If the last segment was a "z", this must be relative to
          if (last_m && segList.getItem(i - 1).pathSegType === 1 && !toRel) {
            curx = last_m[0];
            cury = last_m[1];
          }

        case 19: // relative smooth quad (t)
          if (toRel) {
            curx += x;
            cury += y;
          } else {
            x += curx;
            y += cury;
            curx = x;
            cury = y;
          }
          if (type === 2 || type === 3) {
            last_m = [curx, cury];
          }

          d += pathDSegment(letter, [[x, y]]);
          break;
        case 6: // absolute cubic (C)
          x -= curx;
          x1 -= curx;
          x2 -= curx;
          y -= cury;
          y1 -= cury;
          y2 -= cury;
        case 7: // relative cubic (c)
          if (toRel) {
            curx += x;
            cury += y;
          } else {
            x += curx;
            x1 += curx;
            x2 += curx;
            y += cury;
            y1 += cury;
            y2 += cury;
            curx = x;
            cury = y;
          }
          d += pathDSegment(letter, [
            [x1, y1],
            [x2, y2],
            [x, y],
          ]);
          break;
        case 8: // absolute quad (Q)
          x -= curx;
          x1 -= curx;
          y -= cury;
          y1 -= cury;
        case 9: // relative quad (q)
          if (toRel) {
            curx += x;
            cury += y;
          } else {
            x += curx;
            x1 += curx;
            y += cury;
            y1 += cury;
            curx = x;
            cury = y;
          }
          d += pathDSegment(letter, [
            [x1, y1],
            [x, y],
          ]);
          break;
        case 10: // absolute elliptical arc (A)
          x -= curx;
          y -= cury;
        case 11: // relative elliptical arc (a)
          if (toRel) {
            curx += x;
            cury += y;
          } else {
            x += curx;
            y += cury;
            curx = x;
            cury = y;
          }
          d += pathDSegment(
            letter,
            [[seg.r1, seg.r2]],
            [seg.angle, seg.largeArcFlag ? 1 : 0, seg.sweepFlag ? 1 : 0],
            [x, y],
          );
          break;
        case 16: // absolute smooth cubic (S)
          x -= curx;
          x2 -= curx;
          y -= cury;
          y2 -= cury;
        case 17: // relative smooth cubic (s)
          if (toRel) {
            curx += x;
            cury += y;
          } else {
            x += curx;
            x2 += curx;
            y += cury;
            y2 += cury;
            curx = x;
            cury = y;
          }
          d += pathDSegment(letter, [
            [x2, y2],
            [x, y],
          ]);
          break;
      } // switch on path segment type
    } // for each segment
    return d;
  };
})();

svgedit.utilities.getMatrixFromTransformAttr = function (str) {
  matrix = svgroot.createSVGMatrix();

  // Parse SVG root element transform attribute
  for (var i in (str = str.match(/(\w+\((\-?\d+\.?\d*e?\-?\d*,?)+\))+/g))) {
    var c = str[i].match(/[\w\.\-]+/g);
    var key = c.shift();
    var value = c;
    if (key === 'translate') {
      if (c.length === 1) c[1] = c[0];
      matrix = matrix.translate(parseFloat(c[0]), parseFloat(c[1]));
    }
    if (key === 'scale') {
      if (c.length === 1) {
        matrix = matrix.scale(parseFloat(c[0]));
      } else {
        matrix = matrix.scaleNonUniform(parseFloat(c[0]), parseFloat(c[1]));
      }
    }
    if (key === 'rotate') {
      matrix = matrix.rotate(c[0]);
    }
  }

  return matrix;
};

String.prototype.format = function () {
  let a = this;
  for (let k in arguments) {
    a = a.replace('{' + k + '}', arguments[k]);
  }
  return a;
};
