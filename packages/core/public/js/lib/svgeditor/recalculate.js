/*globals $*/
/*jslint vars: true, eqeq: true, continue: true*/
/**
 * Recalculate.
 *
 * Licensed under the MIT License
 *
 */

// Dependencies:
// 1) jquery
// 2) jquery-svg.js
// 3) svgedit.js
// 4) pathseg.js
// 5) browser.js
// 6) math.js
// 7) history.js
// 8) units.js
// 9) svgtransformlist.js
// 10) svgutils.js
// 11) coords.js

var svgedit = window.svgedit || {};

(function() {

if (!svgedit.recalculate) {
  svgedit.recalculate = {};
}

var NS = svgedit.NS;
var context_;
const isNegligible = (number) => Math.abs(number) < 1e-7;

// Function: svgedit.recalculate.init
svgedit.recalculate.init = function(editorContext) {
  context_ = editorContext;
};

// Function: svgedit.recalculate.updateClipPath
// Updates a <clipPath>s values based on the given translation of an element
//
// Parameters:
// attr - The clip-path attribute value with the clipPath's ID
// tx - The translation's x value
// ty - The translation's y value
svgedit.recalculate.updateClipPath = function(attr, tx, ty) {
  const refElem = svgedit.utilities.getRefElem(attr);
  var path = refElem.firstChild;
  var cp_xform = svgedit.transformlist.getTransformList(path);
  var newxlate = context_.getSVGRoot().createSVGTransform();
  newxlate.setTranslate(tx, ty);

  cp_xform.appendItem(newxlate);

  // Update clipPath's dimensions
  svgedit.recalculate.recalculateDimensions(path);
};


// Function: svgedit.recalculate.recalculateDimensions
// Decides the course of action based on the element's transform list
//
// Parameters:
// selected - The DOM element to recalculate
//
// Returns:
// Undo command object with the resulting change
svgedit.recalculate.recalculateDimensions = function(selected) {
  if (selected == null) {return null;}

  // Firefox Issue - 1081
  if (selected.nodeName == "svg" && navigator.userAgent.indexOf("Firefox/20") >= 0) {
    return null;
  }

  var svgroot = context_.getSVGRoot();
  var tlist = svgedit.transformlist.getTransformList(selected);
  var k;

  if (selected.getAttribute('data-textpath') === '1') {
    selected.removeAttribute('x');
    selected.setAttribute('transform', '');
    selected.removeAttribute('transform');
    tlist.clear();
    return;
  }

  // remove any unnecessary transforms
  if (tlist && tlist.numberOfItems > 0) {
    k = tlist.numberOfItems;
    while (k--) {
      var xform = tlist.getItem(k);
      if (xform.type === 0) {
        tlist.removeItem(k);
      } else if (xform.type === 1) {
        if (svgedit.math.isIdentity(xform.matrix)) {
          tlist.removeItem(k);
        } else if (xform.matrix.a === 1 && isNegligible(xform.matrix.b) && isNegligible(xform.matrix.c) && xform.matrix.d === 1) {
          const { e, f } = xform.matrix;
          const translate = svgroot.createSVGTransform();
          translate.setTranslate(e, f);
          tlist.replaceItem(translate, k);
        }
      } else if (xform.type === 4 && xform.angle === 0) {
        tlist.removeItem(k);
      }
    }

    if (selected.tagName !== 'text' && selected.tagName !== 'use') {
      if (tlist.numberOfItems === 1 && svgedit.utilities.getRotationAngle(selected)) return null;
    }
  }

  // if this element had no transforms, we are done
  if (!tlist || tlist.numberOfItems == 0) {
    // Chrome has a bug that requires clearing the attribute first.
    selected.setAttribute('transform', '');
    selected.removeAttribute('transform');
    return null;
  }

  // TODO: Make this work for more than 2
  if (tlist) {
    k = tlist.numberOfItems;
    var mxs = [];
    while (k--) {
      var xform = tlist.getItem(k);
      if (xform.type === 1) {
        mxs.push([xform.matrix, k]);
      } else if (mxs.length) {
        mxs = [];
      }
    }
    if (mxs.length === 2) {
      var m_new = svgroot.createSVGTransformFromMatrix(svgedit.math.matrixMultiply(mxs[1][0], mxs[0][0]));
      tlist.removeItem(mxs[0][1]);
      tlist.removeItem(mxs[1][1]);
      tlist.insertItemBefore(m_new, mxs[1][1]);
    }

    // combine matrix + translate
    k = tlist.numberOfItems;
    if (k >= 2 && tlist.getItem(k-2).type === 1 && tlist.getItem(k-1).type === 2) {
      var mt = svgroot.createSVGTransform();

      var m = svgedit.math.matrixMultiply(
          tlist.getItem(k-2).matrix,
          tlist.getItem(k-1).matrix);
      mt.setMatrix(m);
      tlist.removeItem(k-2);
      tlist.removeItem(k-2);
      tlist.appendItem(mt);
    }
  }

  // If it still has a single [M] or [R][M], return null too (prevents BatchCommand from being returned).
  switch ( selected.tagName ) {
    // Ignore these elements, as they can absorb the [M]
    case 'line':
    case 'polyline':
    case 'polygon':
    case 'path':
    case 'g':
      break;
    default:
      if ((tlist.numberOfItems === 1 && tlist.getItem(0).type === 1)) {
        let matrix = tlist.getItem(0).matrix;
        if (!isNegligible(matrix.b) || !isNegligible(matrix.c)) {
          return null;
        }
      }
  }

  // Grouped SVG element
  var gsvg = $(selected).data('gsvg');

  // we know we have some transforms, so set up return variable
  var batchCmd = new svgedit.history.BatchCommand('Transform');

  // store initial values that will be affected by reducing the transform list
  var changes = {}, initial = null, attrs = [];
  switch (selected.tagName) {
    case 'line':
      attrs = ['x1', 'y1', 'x2', 'y2'];
      break;
    case 'circle':
      attrs = ['cx', 'cy', 'r'];
      break;
    case 'ellipse':
      attrs = ['cx', 'cy', 'rx', 'ry'];
      break;
    case 'foreignObject':
    case 'rect':
    case 'image':
      attrs = ['width', 'height', 'x', 'y'];
      break;
    case 'use':
    case 'text':
    case 'tspan':
      attrs = ['x', 'y'];
      break;
    case 'polygon':
    case 'polyline':
      initial = {};
      initial.points = selected.getAttribute('points');
      var list = selected.points;
      var len = list.numberOfItems;
      changes.points = new Array(len);
      for (let i = 0; i < len; ++i) {
        var pt = list.getItem(i);
        changes.points[i] = {x:pt.x, y:pt.y};
      }
      const cx = selected.getAttribute('cx');
      const cy = selected.getAttribute('cy');
      if (cx) {
        initial.cx = cx;
        changes.cx = svgedit.units.convertToNum('cx', cx);
      }
      if (cy) {
        initial.cy = cy;
        changes.cy = svgedit.units.convertToNum('cy', cy);
      }
      break;
    case 'path':
      initial = {};
      initial.d = selected.getAttribute('d');
      changes.d = selected.getAttribute('d');
      break;
    } // switch on element type to get initial values

    if (attrs.length) {
      changes = $(selected).attr(attrs);
      $.each(changes, function(attr, val) {
        changes[attr] = svgedit.units.convertToNum(attr, val);
      });
    } else if (gsvg) {
      // GSVG exception
      changes = {
        x: $(gsvg).attr('x') || 0,
        y: $(gsvg).attr('y') || 0
      };
    }

  // if we haven't created an initial array in polygon/polyline/path, then
  // make a copy of initial values and include the transform
  if (initial == null) {
    initial = $.extend(true, {}, changes);
    $.each(initial, function(attr, val) {
      initial[attr] = svgedit.units.convertToNum(attr, val);
    });
  }
  // save the start transform value too
  initial.transform = context_.getStartTransform() || '';

  // if it's a regular group, we have special processing to flatten transforms
  if ((selected.tagName == 'g' && !gsvg) || selected.tagName == 'a') {
    const box = svgedit.utilities.getBBox(selected);
    const oldcenter = {x: box.x+box.width/2, y: box.y+box.height/2};
    let newcenter = svgedit.math.transformPoint(
      box.x+box.width/2,
      box.y+box.height/2,
      svgedit.math.transformListToTransform(tlist).matrix
    );
    let m = svgroot.createSVGMatrix();

    // temporarily strip off the rotate and save the old center
    var gangle = svgedit.utilities.getRotationAngle(selected);
    if (gangle) {
      var a = gangle * Math.PI / 180;
      if ( Math.abs(a) > (1.0e-10) ) {
        var s = Math.sin(a)/(1 - Math.cos(a));
      } else {
        // FIXME: This blows up if the angle is exactly 0!
        var s = 2/a;
      }
      for (let i = 0; i < tlist.numberOfItems; ++i) {
        var xform = tlist.getItem(i);
        if (xform.type == 4) {
          // extract old center through mystical arts
          var rm = xform.matrix;
          oldcenter.y = (s*rm.e + rm.f)/2;
          oldcenter.x = (rm.e - s*rm.f)/2;
          tlist.removeItem(i);
          break;
        }
      }
    }
    var tx = 0, ty = 0,
      operation = 0,
      N = tlist.numberOfItems;

    if (N) {
      var first_m = tlist.getItem(0).matrix;
    }

    // first, if it was a scale then the second-last transform will be it
    if (N >= 3 && tlist.getItem(N-2).type == 3 &&
      tlist.getItem(N-3).type == 2 && tlist.getItem(N-1).type == 2)
    {
      operation = 3; // scale

      // if the children are unrotated, pass the scale down directly
      // otherwise pass the equivalent matrix() down directly
      var tm = tlist.getItem(N-3).matrix,
        sm = tlist.getItem(N-2).matrix,
        tmn = tlist.getItem(N-1).matrix;

      var children = selected.childNodes;
      var c = children.length;
      while (c--) {
        var child = children.item(c);
        tx = 0;
        ty = 0;
        if (child.nodeType == 1) {
          var childTlist = svgedit.transformlist.getTransformList(child);

          // some children might not have a transform (<metadata>, <defs>, etc)
          if (!childTlist) {continue;}
          let r = null;
          if (childTlist.numberOfItems > 0) {
            let t0 = childTlist.getItem(0);
            if (t0.type === 4) {
              let {a, b, e, f} = t0.matrix;
              let x = (a * e + b * f - e) / (2 * a - 2);
              let y = (b * e - a * f + f) / (2 - 2 * a);
              r = { angle: t0.angle, center: {x, y}};
            }
          }

          m = svgedit.math.transformListToTransform(childTlist).matrix;

          // Convert a matrix to a scale if applicable
//          if (svgedit.math.hasMatrixTransform(childTlist) && childTlist.numberOfItems == 1) {
//            if (m.b==0 && m.c==0 && m.e==0 && m.f==0) {
//              childTlist.removeItem(0);
//              var translateOrigin = svgroot.createSVGTransform(),
//                scale = svgroot.createSVGTransform(),
//                translateBack = svgroot.createSVGTransform();
//              translateOrigin.setTranslate(0, 0);
//              scale.setScale(m.a, m.d);
//              translateBack.setTranslate(0, 0);
//              childTlist.appendItem(translateBack);
//              childTlist.appendItem(scale);
//              childTlist.appendItem(translateOrigin);
//            }
//          }

          var angle = svgedit.utilities.getRotationAngle(child);
          var oldStartTransform = context_.getStartTransform();
          var childxforms = [];
          context_.setStartTransform(child.getAttribute('transform'));
          if (angle || svgedit.math.hasMatrixTransform(childTlist)) {
            var e2t = svgroot.createSVGTransform();
            if (r) {
              let newCenter = svgedit.math.transformPoint(r.center.x, r.center.y, svgedit.math.transformListToTransform(tlist).matrix);
              let rotationBack = svgroot.createSVGTransform();
              rotationBack.setRotate(-r.angle, newCenter.x, newCenter.y);

              e2t.setMatrix(svgedit.math.matrixMultiply(rotationBack.matrix, tm, sm, tmn, m));
              let rotation = svgroot.createSVGTransform();
              rotation.setRotate(r.angle, newCenter.x, newCenter.y);
              childTlist.clear();
              childTlist.appendItem(rotation);
              childxforms.push(rotation);
            } else {
              e2t.setMatrix(svgedit.math.matrixMultiply(tm, sm, tmn, m));
              childTlist.clear();
            }
            childTlist.appendItem(e2t);
            childxforms.push(e2t);
          }
          // if not rotated or skewed, push the [T][S][-T] down to the child
          else {
            // update the transform list with translate,scale,translate

            // slide the [T][S][-T] from the front to the back
            // [T][S][-T][M] = [M][T2][S2][-T2]

            // (only bringing [-T] to the right of [M])
            // [T][S][-T][M] = [T][S][M][-T2]
            // [-T2] = [M_inv][-T][M]
            var t2n = svgedit.math.matrixMultiply(m.inverse(), tmn, m);
            // [T2] is always negative translation of [-T2]
            var t2 = svgroot.createSVGMatrix();
            t2.e = -t2n.e;
            t2.f = -t2n.f;

            // [T][S][-T][M] = [M][T2][S2][-T2]
            // [S2] = [T2_inv][M_inv][T][S][-T][M][-T2_inv]
            var s2 = svgedit.math.matrixMultiply(t2.inverse(), m.inverse(), tm, sm, tmn, m, t2n.inverse());

            var translateOrigin = svgroot.createSVGTransform(),
              scale = svgroot.createSVGTransform(),
              translateBack = svgroot.createSVGTransform();
            translateOrigin.setTranslate(t2n.e, t2n.f);
            scale.setScale(s2.a, s2.d);
            translateBack.setTranslate(t2.e, t2.f);
            childTlist.appendItem(translateBack);
            childTlist.appendItem(scale);
            childTlist.appendItem(translateOrigin);
            childxforms.push(translateBack);
            childxforms.push(scale);
            childxforms.push(translateOrigin);
//            logMatrix(translateBack.matrix);
//            logMatrix(scale.matrix);
          } // not rotated
          batchCmd.addSubCommand( svgedit.recalculate.recalculateDimensions(child) );
          // TODO: If any <use> have this group as a parent and are
          // referencing this child, then we need to impose a reverse
          // scale on it so that when it won't get double-translated
//            var uses = selected.getElementsByTagNameNS(NS.SVG, 'use');
//            var href = '#' + child.id;
//            var u = uses.length;
//            while (u--) {
//              var useElem = uses.item(u);
//              if (href == svgedit.utilities.getHref(useElem)) {
//                var usexlate = svgroot.createSVGTransform();
//                usexlate.setTranslate(-tx,-ty);
//                svgedit.transformlist.getTransformList(useElem).insertItemBefore(usexlate,0);
//                batchCmd.addSubCommand( svgedit.recalculate.recalculateDimensions(useElem) );
//              }
//            }
          context_.setStartTransform(oldStartTransform);
        } // element
      } // for each child
      // Remove these transforms from group
      tlist.removeItem(N-1);
      tlist.removeItem(N-2);
      tlist.removeItem(N-3);
    } else if (N >= 3 && tlist.getItem(N-1).type == 1) {
      operation = 3; // scale
      m = svgedit.math.transformListToTransform(tlist).matrix;
      var e2t = svgroot.createSVGTransform();
      e2t.setMatrix(m);
      tlist.clear();
      tlist.appendItem(e2t);
    }
    // next, check if the first transform was a translate
    // if we had [ T1 ] [ M ] we want to transform this into [ M ] [ T2 ]
    // therefore [ T2 ] = [ M_inv ] [ T1 ] [ M ]
    else if ( (N == 1 || (N > 1 && tlist.getItem(1).type != 3)) &&
      tlist.getItem(0).type == 2)
    {
      operation = 2; // translate
      var T_M = svgedit.math.transformListToTransform(tlist).matrix;
      tlist.removeItem(0);
      var M_inv = svgedit.math.transformListToTransform(tlist).matrix.inverse();
      var M2 = svgedit.math.matrixMultiply( M_inv, T_M );

      tx = M2.e;
      ty = M2.f;

      if (tx != 0 || ty != 0) {
        // we pass the translates down to the individual children
        var children = selected.childNodes;
        var c = children.length;

        var clipPaths_done = [];

        while (c--) {
          var child = children.item(c);
          if (child.nodeType == 1) {

            // Check if child has clip-path
            // if (child.getAttribute('clip-path')) {
            //   // tx, ty
            //   var attr = child.getAttribute('clip-path');
            //   const refElem = svgedit.utilities.getRefElem(attr);
            //   if (!refElem) {
            //     child.removeAttribute('clip-path')
            //   } else if (clipPaths_done.indexOf(attr) === -1) {
            //     svgedit.recalculate.updateClipPath(attr, tx, ty);
            //     clipPaths_done.push(attr);
            //   }
            // }

            var oldStartTransform = context_.getStartTransform();
            context_.setStartTransform(child.getAttribute('transform'));

            var childTlist = svgedit.transformlist.getTransformList(child);
            // some children might not have a transform (<metadata>, <defs>, etc)
            if (childTlist) {
              var newxlate = svgroot.createSVGTransform();
              newxlate.setTranslate(tx, ty);
              if (childTlist.numberOfItems) {
                childTlist.insertItemBefore(newxlate, 0);
              } else {
                childTlist.appendItem(newxlate);
              }
              batchCmd.addSubCommand(svgedit.recalculate.recalculateDimensions(child));
              // If any <use> have this group as a parent and are
              // referencing this child, then impose a reverse translate on it
              // so that when it won't get double-translated
              var uses = selected.getElementsByTagNameNS(NS.SVG, 'use');
              var href = '#' + child.id;
              var u = uses.length;
              while (u--) {
                var useElem = uses.item(u);
                if (href == svgedit.utilities.getHref(useElem)) {
                  var usexlate = svgroot.createSVGTransform();
                  usexlate.setTranslate(-tx,-ty);
                  svgedit.transformlist.getTransformList(useElem).insertItemBefore(usexlate, 0);
                  batchCmd.addSubCommand( svgedit.recalculate.recalculateDimensions(useElem) );
                }
              }
              context_.setStartTransform(oldStartTransform);
            }
          }
        }

        clipPaths_done = [];
        context_.setStartTransform(oldStartTransform);
      }
    }
    // else, a matrix imposition from a parent group
    // keep pushing it down to the children
    else if (N == 1 && tlist.getItem(0).type == 1 && !gangle) {
      operation = 1;
      m = tlist.getItem(0).matrix,
        children = selected.childNodes,
        c = children.length;
      while (c--) {
        var child = children.item(c);
        if (child.nodeType == 1) {
          var oldStartTransform = context_.getStartTransform();
          context_.setStartTransform(child.getAttribute('transform'));
          var childTlist = svgedit.transformlist.getTransformList(child);

          if (!childTlist) {continue;}

          var em = svgedit.math.matrixMultiply(m, svgedit.math.transformListToTransform(childTlist).matrix);
          var e2m = svgroot.createSVGTransform();
          e2m.setMatrix(em);
          childTlist.clear();
          childTlist.appendItem(e2m, 0);

          batchCmd.addSubCommand( svgedit.recalculate.recalculateDimensions(child) );
          context_.setStartTransform(oldStartTransform);

          // Convert stroke
          // TODO: Find out if this should actually happen somewhere else
          var sw = child.getAttribute('stroke-width');
          if (child.getAttribute('stroke') !== 'none' && sw && !isNaN(sw)) {
            var avg = (Math.abs(em.a) + Math.abs(em.d)) / 2;
            console.log(sw * avg);
            child.setAttribute('stroke-width', sw * avg);
          }

        }
      }
      tlist.clear();
    } else if (N > 1) {
      // If not either of above, concat all transforms and pass down
      let m = svgedit.math.transformListToTransform(tlist).matrix;
      let children = selected.childNodes;
      let c = children.length;
      while (c--) {
        let child = children.item(c);
        if (child.nodeType == 1) {
          let oldStartTransform = context_.getStartTransform();
          context_.setStartTransform(child.getAttribute('transform'));
          let childTlist = svgedit.transformlist.getTransformList(child);

          let em = svgroot.createSVGTransform();
          em.setMatrix(m);

          if (childTlist.numberOfItems) {
            childTlist.insertItemBefore(em, 0);
          } else {
            childTlist.appendItem(em);
          }

          let cmd = svgedit.recalculate.recalculateDimensions(child);
          if (cmd && !cmd.isEmpty()) {
            batchCmd.addSubCommand( svgedit.recalculate.recalculateDimensions(child) );
          }
          context_.setStartTransform(oldStartTransform);
        }
      }
      tlist.clear();
    }
    // else it was just a rotate
    else {
      if (gangle) {
        var newRot = svgroot.createSVGTransform();
        newRot.setRotate(gangle, newcenter.x, newcenter.y);
        if (tlist.numberOfItems) {
          tlist.insertItemBefore(newRot, 0);
        } else {
          tlist.appendItem(newRot);
        }
      }
      if (tlist.numberOfItems == 0) {
        selected.removeAttribute('transform');
      }
      return null;
    }

    // if it was a translate, put back the rotate at the new center
    if (operation == 2) {
      if (gangle) {
        newcenter = {
          x: oldcenter.x + first_m.e,
          y: oldcenter.y + first_m.f
        };

        var newRot = svgroot.createSVGTransform();
        newRot.setRotate(gangle, newcenter.x, newcenter.y);
        if (tlist.numberOfItems) {
          tlist.insertItemBefore(newRot, 0);
        } else {
          tlist.appendItem(newRot);
        }
      }
    }
    // if it was a resize
    else if (operation == 3) {
      m = svgedit.math.transformListToTransform(tlist).matrix;
      var roldt = svgroot.createSVGTransform();
      roldt.setRotate(gangle, oldcenter.x, oldcenter.y);
      var rold = roldt.matrix;
      var rnew = svgroot.createSVGTransform();
      rnew.setRotate(gangle, newcenter.x, newcenter.y);
      var rnew_inv = rnew.matrix.inverse(),
        m_inv = m.inverse(),
        extrat = svgedit.math.matrixMultiply(m_inv, rnew_inv, rold, m);

      tx = extrat.e;
      ty = extrat.f;

      if (tx != 0 || ty != 0) {
        // now push this transform down to the children
        // we pass the translates down to the individual children
        var children = selected.childNodes;
        var c = children.length;
        while (c--) {
          var child = children.item(c);
          if (child.nodeType == 1) {
            let oldStartTransform = context_.getStartTransform();
            context_.setStartTransform(child.getAttribute('transform'));
            const childTlist = svgedit.transformlist.getTransformList(child);
            const newxlate = svgroot.createSVGTransform();
            newxlate.setTranslate(tx, ty);
            if (childTlist.numberOfItems) {
              childTlist.insertItemBefore(newxlate, 0);
            } else {
              childTlist.appendItem(newxlate);
            }
            const cmd = svgedit.recalculate.recalculateDimensions(child);
            if (cmd && !cmd.isEmpty()) {
              batchCmd.addSubCommand(cmd);
            }
            context_.setStartTransform(oldStartTransform);
          }
        }
      }

      if (gangle) {
        if (tlist.numberOfItems) {
          tlist.insertItemBefore(rnew, 0);
        } else {
          tlist.appendItem(rnew);
        }
      }
    }
  } else if (selected.tagName?.toLowerCase?.() === 'clippath') {
    // combine all transform to a m
    const transformList = svgedit.transformlist.getTransformList(selected);
    const matrix = svgedit.math.transformListToTransform(transformList).matrix;
    transformList.clear();
    const newTransform = svgroot.createSVGTransform();
    newTransform.setMatrix(matrix);
    transformList.appendItem(newTransform);
  } else {
    // else, it's a non-group

    // FIXME: box might be null for some elements (<metadata> etc), need to handle this
    var box = svgedit.utilities.getBBox(selected);
    let oldRotateMatrix;

    // Paths (and possbly other shapes) will have no BBox while still in <defs>,
    // but we still may need to recalculate them (see issue 595).
    // TODO: Figure out how to get BBox from these elements in case they
    // have a rotation transform

    if (!box && selected.tagName != 'path') return null;


    var m = svgroot.createSVGMatrix(),
      // temporarily strip off the rotate and save the old center
      angle = svgedit.utilities.getRotationAngle(selected);

    let oldcenter = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    let newCenter = { ...oldcenter };
    let newCenterWithRotate = { ...oldcenter };
    if (angle) {
      newCenterWithRotate = svgedit.math.transformPoint(
        box.x + box.width / 2,
        box.y + box.height / 2,
        svgedit.math.transformListToTransform(tlist).matrix
      );
      for (let i = 0; i < tlist.numberOfItems; ++i) {
        xform = tlist.getItem(i);
        if (xform.type == 4) {
          var rm = xform.matrix;
          oldRotateMatrix = rm;
          tlist.removeItem(i);
          break;
        }
      }
      newCenter = svgedit.math.transformPoint(
        box.x + box.width / 2,
        box.y + box.height / 2,
        svgedit.math.transformListToTransform(tlist).matrix
      );
      // Hack: in beam studio the center is defined by bbox and the last M matrix
      if (tlist.numberOfItems > 0) {
        let lastM = tlist.getItem(tlist.numberOfItems - 1);
        if (lastM.type === 1) {
          oldcenter = svgedit.math.transformPoint(oldcenter.x, oldcenter.y, lastM.matrix);
        }
      }
    }
    // 2 = translate, 3 = scale, 4 = rotate, 1 = matrix imposition
    var operation = 0;
    var N = tlist.numberOfItems;
    // Check if it has a gradient with userSpaceOnUse, in which case
    // adjust it by recalculating the matrix transform.
    // TODO: Make this work in Webkit using svgedit.transformlist.SVGTransformList
    if (!svgedit.browser.isWebkit()) {
      var fill = selected.getAttribute('fill');
      if (fill && fill.indexOf('url(') === 0) {
        console.log(fill);
        var paint = svgedit.utilities.getRefElem(fill);
        var type = 'pattern';
        if (paint.tagName !== type) type = 'gradient';
        var attrVal = paint.getAttribute(type + 'Units');
        if (attrVal === 'userSpaceOnUse') {
          //Update the userSpaceOnUse element
          m = svgedit.math.transformListToTransform(tlist).matrix;
          var gtlist = svgedit.transformlist.getTransformList(paint);
          var gmatrix = svgedit.math.transformListToTransform(gtlist).matrix;
          m = svgedit.math.matrixMultiply(m, gmatrix);
          var m_str = 'matrix(' + [m.a, m.b, m.c, m.d, m.e, m.f].join(',') + ')';
          paint.setAttribute(type + 'Transform', m_str);
        }
      }
    }

    // first, if it was a scale of a non-skewed element, then the second-last
    // transform will be the [S]
    // if we had [M][T][S][T] we want to extract the matrix equivalent of
    // [T][S][T] and push it down to the element
    if (N >= 3 && tlist.getItem(N-2).type == 3 &&
      tlist.getItem(N-3).type == 2 && tlist.getItem(N-1).type == 2)

      // Removed this so a <use> with a given [T][S][T] would convert to a matrix.
      // Is that bad?
      //  && selected.nodeName != 'use'
    {
      operation = 3; // scale
      m = svgedit.math.transformListToTransform(tlist, N-3, N-1).matrix;
      tlist.removeItem(N-1);
      tlist.removeItem(N-2);
      tlist.removeItem(N-3);
    } // if we had [T][S][-T][M], then this was a skewed element being resized
    // Thus, we simply combine it all into one matrix
    else if (N == 4 && tlist.getItem(N-1).type == 1) {
      operation = 3; // scale
      m = svgedit.math.transformListToTransform(tlist).matrix;
      var e2t = svgroot.createSVGTransform();
      e2t.setMatrix(m);
      tlist.clear();
      tlist.appendItem(e2t);
      // reset the matrix so that the element is not re-mapped
      m = svgroot.createSVGMatrix();
    } // if we had [R][T][S][-T][M], then this was a rotated matrix-element
    // if we had [T1][M] we want to transform this into [M][T2]
    // therefore [ T2 ] = [ M_inv ] [ T1 ] [ M ] and we can push [T2]
    // down to the element
    else if ( (N == 1 || (N > 1 && tlist.getItem(1).type != 3)) &&
      tlist.getItem(0).type == 2)
    {
      operation = 2; // translate
      var oldxlate = tlist.getItem(0).matrix,
        meq = svgedit.math.transformListToTransform(tlist,1).matrix,
        meq_inv = meq.inverse();
      m = svgedit.math.matrixMultiply( meq_inv, oldxlate, meq );
      tlist.removeItem(0);
    }
    // else if this child now has a matrix imposition (from a parent group)
    // we might be able to simplify
    else if (N >= 1 && tlist.getItem(0).type == 1) {
      let matrix = svgedit.math.transformListToTransform(tlist).matrix;
      if (['line', 'polyline', 'polygon', 'path'].includes(selected.tagName) && !angle) {
        // Remap all point-based elements
        m = svgedit.math.transformListToTransform(tlist).matrix;
        if (selected.tagName === 'line') {
          changes = $(selected).attr(['x1', 'y1', 'x2', 'y2']);
        } else if (selected.tagName === 'path') {
          changes.d = selected.getAttribute('d');
        } else {
          // polyline or polygon
          changes.points = selected.getAttribute('points');
          if (changes.points) {
            const list = selected.points;
            const len = list.numberOfItems;
            changes.points = new Array(len);
            for (let i = 0; i < len; ++i) {
              var pt = list.getItem(i);
              changes.points[i] = {x:pt.x, y:pt.y};
            }
          }
        }
        operation = 1;
        tlist.clear();
      } else if (isNegligible(matrix.b) && isNegligible(matrix.c)) {
        operation = 3; // scale
        m = matrix;
        tlist.removeItem(0);
      }
    }

    if (operation === 0) {
      operation = 4; // rotation
      if (angle) {
        var newRot = svgroot.createSVGTransform();
        // when text contents changes text
        if (selected.tagName === 'text') {
          //from [Rm][M] to [Rnew][M'] ==> [M'] = [Rnew]^-1[Rm][M]
          const m = svgedit.math.transformListToTransform(tlist).matrix;
          newRot.setRotate(angle, newCenterWithRotate.x, newCenterWithRotate.y);
          const extrat = svgedit.math.matrixMultiply(m.inverse(), newRot.matrix.inverse(), oldRotateMatrix, m);

          let children = selected.childNodes;
          let c = children.length;
          while (c--) {
            var child = children.item(c);
            if (child.tagName == 'tspan') {
              var tspanChanges = {
                x: $(child).attr('x') || 0,
                y: $(child).attr('y') || 0
              };
              const orig = {...tspanChanges};
              svgedit.coords.remapElement(child, tspanChanges, extrat);
              batchCmd.addSubCommand(new svgedit.history.ChangeElementCommand(child, orig));
            }
          }
          svgedit.coords.remapElement(selected, changes, extrat);
        } else {
          newRot.setRotate(angle, newCenterWithRotate.x, newCenterWithRotate.y);
        }

        if (tlist.numberOfItems) {
          tlist.insertItemBefore(newRot, 0);
        } else {
          tlist.appendItem(newRot);
        }
      }
      if (tlist.numberOfItems == 0) {
        selected.removeAttribute('transform');
      }
      return null;
    }

    // if it was a translate or resize, we need to remap the element and absorb the xform
    if (operation == 1 || operation == 2 || operation == 3) {
      svgedit.coords.remapElement(selected, changes, m);
    } // if we are remapping
    // if it was a translate, put back the rotate at the new center
    if (operation == 2) {
      if (angle) {
        if (!svgedit.math.hasMatrixTransform(tlist) && selected.tagName !== 'text') {
          newCenter = {
            x: oldcenter.x + m.e,
            y: oldcenter.y + m.f
          };
        }
        var newRot = svgroot.createSVGTransform();
        newRot.setRotate(angle, newCenter.x, newCenter.y);
        if (tlist.numberOfItems) {
          tlist.insertItemBefore(newRot, 0);
        } else {
          tlist.appendItem(newRot);
        }
      }
      // We have special processing for tspans:  Tspans are not transformable
      // but they can have x,y coordinates (sigh).  Thus, if this was a translate,
      // on a text element, also translate any tspan children.
      if (selected.tagName == 'text') {
        var children = selected.childNodes;
        var c = children.length;
        while (c--) {
          var child = children.item(c);
          if (child.tagName == 'tspan') {
            var tspanChanges = {
              x: $(child).attr('x') || 0,
              y: $(child).attr('y') || 0
            };
            const orig = {...tspanChanges};
            svgedit.coords.remapElement(child, tspanChanges, m);
            batchCmd.addSubCommand(new svgedit.history.ChangeElementCommand(child, orig));
          }
        }
      }
    }
    // [Rold][M][T][S][-T] became [Rold][M]
    // we want it to be [Rnew][M][Tr] where Tr is the
    // translation required to re-center it
    // Therefore, [Tr] = [M_inv][Rnew_inv][Rold][M]
    else if (operation == 3 && angle) {
      var m = svgedit.math.transformListToTransform(tlist).matrix;
      var roldt = svgroot.createSVGTransform();
      roldt.setRotate(angle, oldcenter.x, oldcenter.y);
      var rold = oldRotateMatrix || roldt.matrix;
      var rnew = svgroot.createSVGTransform();
      rnew.setRotate(angle, newCenterWithRotate.x, newCenterWithRotate.y);
      var rnew_inv = rnew.matrix.inverse();
      var m_inv = m.inverse();
      var extrat = svgedit.math.matrixMultiply(m_inv, rnew_inv, rold, m);

      if (selected.tagName == 'text') {
        var children = selected.childNodes;
        var c = children.length;
        while (c--) {
          var child = children.item(c);
          if (child.tagName == 'tspan') {
            var tspanChanges = {
              x: $(child).attr('x') || 0,
              y: $(child).attr('y') || 0
            };
            const orig = {...tspanChanges};
            svgedit.coords.remapElement(child, tspanChanges, extrat);
            batchCmd.addSubCommand(new svgedit.history.ChangeElementCommand(child, orig));
          }
        }
      }
      svgedit.coords.remapElement(selected, changes, extrat);
      if (angle) {
        if (tlist.numberOfItems) {
          tlist.insertItemBefore(rnew, 0);
        } else {
          tlist.appendItem(rnew);
        }
      }
    }
  } // a non-group

  // if the transform list has been emptied, remove it
  if (tlist.numberOfItems == 0) {
    selected.removeAttribute('transform');
  }
  if (!selected.getAttribute('data-tempgroup')) {
    batchCmd.addSubCommand(new svgedit.history.ChangeElementCommand(selected, initial));
  }

  return batchCmd;
};
})();
