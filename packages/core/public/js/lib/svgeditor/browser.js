/*globals $, svgedit*/
/*jslint vars: true, eqeq: true*/
/**
 * Package: svgedit.browser
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2010 Jeff Schiller
 * Copyright(c) 2010 Alexis Deveria
 */

// Dependencies:
// 1) jQuery (for $.alert())

(function () {
  'use strict';

  if (!svgedit.browser) {
    svgedit.browser = {};
  }

  // alias
  var NS = svgedit.NS;

  var supportsSvg_ = (function () {
    return !!document.createElementNS && !!document.createElementNS(NS.SVG, 'svg').createSVGRect;
  })();

  svgedit.browser.supportsSvg = function () {
    return supportsSvg_;
  };
  if (!svgedit.browser.supportsSvg()) {
    window.location = 'browser-not-supported.html';
    return;
  }

  var userAgent = navigator.userAgent;
  var svg = document.createElementNS(NS.SVG, 'svg');

  // Note: Browser sniffing should only be used if no other detection method is possible
  var isOpera_ = !!window.opera;
  var isWebkit_ = userAgent.indexOf('AppleWebKit') >= 0;
  var isGecko_ = userAgent.indexOf('Gecko/') >= 0;
  var isIE_ = userAgent.indexOf('MSIE') >= 0;
  var isChrome_ = userAgent.indexOf('Chrome/') >= 0;
  var isWindows_ = userAgent.indexOf('Windows') >= 0;
  var isMac_ = userAgent.indexOf('Macintosh') >= 0;
  var isTouch_ = 'ontouchstart' in window;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // segList functions (for FF1.5 and 2.0)
  var supportsPathReplaceItem_ = (function () {
    var path = document.createElementNS(NS.SVG, 'path');
    path.setAttribute('d', 'M0,0 10,10');
    var seglist = path.pathSegList;
    var seg = path.createSVGPathSegLinetoAbs(5, 5);
    try {
      seglist.replaceItem(seg, 1);
      return true;
    } catch (err) {}
    return false;
  })();

  var supportsPathInsertItemBefore_ = (function () {
    var path = document.createElementNS(NS.SVG, 'path');
    path.setAttribute('d', 'M0,0 10,10');
    var seglist = path.pathSegList;
    var seg = path.createSVGPathSegLinetoAbs(5, 5);
    try {
      seglist.insertItemBefore(seg, 1);
      return true;
    } catch (err) {}
    return false;
  })();

  // text character positioning (for IE9)
  var supportsGoodTextCharPos_ = (function () {
    var svgroot = document.createElementNS(NS.SVG, 'svg');
    var svgcontent = document.createElementNS(NS.SVG, 'svg');
    document.documentElement.appendChild(svgroot);
    svgcontent.setAttribute('x', 5);
    svgroot.appendChild(svgcontent);
    var text = document.createElementNS(NS.SVG, 'text');
    text.textContent = 'a';
    svgcontent.appendChild(text);
    var pos = text.getStartPositionOfChar(0).x;
    document.documentElement.removeChild(svgroot);
    return pos === 0;
  })();

  var supportsEditableText_ = (function () {
    // TODO: Find better way to check support for this
    return isOpera_;
  })();

  var supportsNonScalingStroke_ = (function () {
    var rect = document.createElementNS(NS.SVG, 'rect');
    rect.setAttribute('style', 'vector-effect:non-scaling-stroke');
    return rect.style.vectorEffect === 'non-scaling-stroke';
  })();

  var supportsNativeSVGTransformLists_ = (function () {
    var rect = document.createElementNS(NS.SVG, 'rect');
    var rxform = rect.transform.baseVal;
    var t1 = svg.createSVGTransform();
    rxform.appendItem(t1);
    // https://developer.mozilla.org/en-US/docs/Web/API/SVGTransform
    const item1 = rxform.getItem(0);
    if (item1 instanceof SVGTransform) {
      const matrix1 = item1.matrix;
      const matrix2 = t1.matrix;
      return (
        matrix1.a === matrix2.a &&
        matrix1.b === matrix2.b &&
        matrix1.c === matrix2.c &&
        matrix1.d === matrix2.d &&
        matrix1.e === matrix2.e &&
        matrix1.f === matrix2.f
      );
    }
    return false;
  })();

  // Public API

  svgedit.browser.isOpera = function () {
    return isOpera_;
  };
  svgedit.browser.isWebkit = function () {
    return isWebkit_;
  };
  svgedit.browser.isGecko = function () {
    return isGecko_;
  };
  svgedit.browser.isIE = function () {
    return isIE_;
  };
  svgedit.browser.isChrome = function () {
    return isChrome_;
  };
  svgedit.browser.isSafari = function () {
    return isSafari;
  };
  svgedit.browser.isWindows = function () {
    return isWindows_;
  };
  svgedit.browser.isMac = function () {
    return isMac_;
  };
  svgedit.browser.isTouch = function () {
    return isTouch_;
  };

  svgedit.browser.supportsPathReplaceItem = function () {
    return supportsPathReplaceItem_;
  };
  svgedit.browser.supportsPathInsertItemBefore = function () {
    return supportsPathInsertItemBefore_;
  };
  svgedit.browser.supportsGoodTextCharPos = function () {
    return supportsGoodTextCharPos_;
  };
  svgedit.browser.supportsEditableText = function () {
    return supportsEditableText_;
  };
  svgedit.browser.supportsNonScalingStroke = function () {
    return supportsNonScalingStroke_;
  };
  svgedit.browser.supportsNativeTransformLists = function () {
    return supportsNativeSVGTransformLists_;
  };
})();
