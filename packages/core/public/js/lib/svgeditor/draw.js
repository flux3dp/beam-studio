/*globals $, svgedit*/
/*jslint vars: true, eqeq: true, todo: true*/
/**
 * Package: svgedit.draw
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2011 Jeff Schiller
 */

// Dependencies:
// 1) jQuery
// 2) browser.js
// 3) svgutils.js

(function () {

    if (!svgedit.draw) {
        svgedit.draw = {};
    }
    // alias
    var NS = svgedit.NS;

    var visElems = 'a,circle,ellipse,foreignObject,g,image,line,path,polygon,polyline,rect,svg,text,tspan,use'.split(',');

    var RandomizeModes = {
        LET_DOCUMENT_DECIDE: 0,
        ALWAYS_RANDOMIZE: 1,
        NEVER_RANDOMIZE: 2
    };
    var randomize_ids = RandomizeModes.LET_DOCUMENT_DECIDE;




    /**
 * Called to ensure that drawings will or will not have randomized ids.
 * The currentDrawing will have its nonce set if it doesn't already.
 * @param {boolean} enableRandomization - flag indicating if documents should have randomized ids
 * @param {svgedit.draw.Drawing} currentDrawing
 */
    svgedit.draw.randomizeIds = function (enableRandomization, currentDrawing) {
        randomize_ids = enableRandomization === false ?
            RandomizeModes.NEVER_RANDOMIZE :
            RandomizeModes.ALWAYS_RANDOMIZE;

        if (randomize_ids == RandomizeModes.ALWAYS_RANDOMIZE && !currentDrawing.getNonce()) {
            currentDrawing.setNonce(Math.floor(Math.random() * 100001));
        } else if (randomize_ids == RandomizeModes.NEVER_RANDOMIZE && currentDrawing.getNonce()) {
            currentDrawing.clearNonce();
        }
    };

    /**
     * This class encapsulates the concept of a SVG-edit drawing
     * @param {SVGSVGElement} svgElem - The SVG DOM Element that this JS object
     *     encapsulates.  If the svgElem has a se:nonce attribute on it, then
     *     IDs will use the nonce as they are generated.
     * @param {String=svg_} [opt_idPrefix] - The ID prefix to use.
     */
    svgedit.draw.Drawing = function (svgElem, opt_idPrefix) {
        if (!svgElem || !svgElem.tagName || !svgElem.namespaceURI ||
            svgElem.tagName != 'svg' || svgElem.namespaceURI != NS.SVG) {
            throw 'Error: svgedit.draw.Drawing instance initialized without a <svg> element';
        }

        /**
         * The SVG DOM Element that represents this drawing.
         * @type {SVGSVGElement}
         */
        this.svgElem_ = svgElem;

        /**
         * The latest object number used in this drawing.
         * @type {number}
         */
        this.obj_num = 0;

        /**
         * The prefix to prepend to each element id in the drawing.
         * @type {String}
         */
        this.idPrefix = opt_idPrefix || 'svg_';

        /**
         * An array of released element ids to immediately reuse.
         * @type {Array.<number>}
         */
        this.releasedNums = [];

        /**
         * The nonce to use to uniquely identify elements across drawings.
         * @type {!String}
         */
        this.nonce_ = '';
        var n = this.svgElem_.getAttributeNS(NS.SE, 'nonce');
        // If already set in the DOM, use the nonce throughout the document
        // else, if randomizeIds(true) has been called, create and set the nonce.
        if (!!n && randomize_ids != RandomizeModes.NEVER_RANDOMIZE) {
            this.nonce_ = n;
        } else if (randomize_ids == RandomizeModes.ALWAYS_RANDOMIZE) {
            this.setNonce(Math.floor(Math.random() * 100001));
        }
    };

    /**
     * @param {string} id Element ID to retrieve
     * @returns {Element} SVG element within the root SVGSVGElement
    */
    svgedit.draw.Drawing.prototype.getElem_ = function (id) {
        if (this.svgElem_.querySelector) {
            // querySelector lookup
            return this.svgElem_.querySelector('#' + id);
        }
        // jQuery lookup: twice as slow as xpath in FF
        return $(this.svgElem_).find('[id=' + id + ']')[0];
    };

    svgedit.draw.Drawing.prototype.getDefElem_ = function (id) {
        return $(`#svg_defs #${id}`)[0];
    };

    /**
     * @returns {SVGSVGElement}
     */
    svgedit.draw.Drawing.prototype.getSvgElem = function () {
        return this.svgElem_;
    };

    /**
     * @returns {!string|number} The previously set nonce
     */
    svgedit.draw.Drawing.prototype.getNonce = function () {
        return this.nonce_;
    };

    /**
     * @param {!string|number} n The nonce to set
     */
    svgedit.draw.Drawing.prototype.setNonce = function (n) {
        this.svgElem_.setAttributeNS(NS.XMLNS, 'xmlns:se', NS.SE);
        this.svgElem_.setAttributeNS(NS.SE, 'se:nonce', n);
        this.nonce_ = n;
    };

    /**
     * Clears any previously set nonce
     */
    svgedit.draw.Drawing.prototype.clearNonce = function () {
        // We deliberately leave any se:nonce attributes alone,
        // we just don't use it to randomize ids.
        this.nonce_ = '';
    };

    /**
     * Returns the latest object id as a string.
     * @return {String} The latest object Id.
     */
    svgedit.draw.Drawing.prototype.getId = function () {
        return this.nonce_ ?
            this.idPrefix + this.nonce_ + '_' + this.obj_num :
            this.idPrefix + this.obj_num;
    };

    /**
     * Returns the next object Id as a string.
     * @return {String} The next object Id to use.
     */
    svgedit.draw.Drawing.prototype.getNextId = function () {
        var oldObjNum = this.obj_num;
        var restoreOldObjNum = false;

        // If there are any released numbers in the release stack,
        // use the last one instead of the next obj_num.
        // We need to temporarily use obj_num as that is what getId() depends on.
        if (this.releasedNums.length > 0) {
            this.obj_num = this.releasedNums.pop();
            restoreOldObjNum = true;
        } else {
            // If we are not using a released id, then increment the obj_num.
            this.obj_num++;
        }

        // Ensure the ID does not exist.
        var id = this.getId();
        while (this.getElem_(id) || this.getDefElem_(id)) {
            if (restoreOldObjNum) {
                this.obj_num = oldObjNum;
                restoreOldObjNum = false;
            }
            this.obj_num++;
            id = this.getId();
        }
        // Restore the old object number if required.
        if (restoreOldObjNum) {
            this.obj_num = oldObjNum;
        }
        return id;
    };

    /**
     * Releases the object Id, letting it be used as the next id in getNextId().
     * This method DOES NOT remove any elements from the DOM, it is expected
     * that client code will do this.
     * @param {string} id - The id to release.
     * @returns {boolean} True if the id was valid to be released, false otherwise.
    */
    svgedit.draw.Drawing.prototype.releaseId = function (id) {
        // confirm if this is a valid id for this Document, else return false
        var front = this.idPrefix + (this.nonce_ ? this.nonce_ + '_' : '');
        if (typeof id !== 'string' || id.indexOf(front) !== 0) {
            return false;
        }
        // extract the obj_num of this id
        var num = parseInt(id.substr(front.length), 10);

        // if we didn't get a positive number or we already released this number
        // then return false.
        if (typeof num !== 'number' || num <= 0 || this.releasedNums.indexOf(num) != -1) {
            return false;
        }

        // push the released number into the released queue
        this.releasedNums.push(num);

        return true;
    };

    /**
     * Create a clone of an element, updating its ID and its children's IDs when needed
     * @param {Element} el - DOM element to clone
     * @returns {Element}
     */
    svgedit.draw.Drawing.prototype.copyElem = function (el) {
        var self = this;
        var getNextIdClosure = function () { return self.getNextId(); };
        return svgedit.utilities.copyElem(el, getNextIdClosure);
    };

    svgedit.draw.Drawing.prototype.copyElemData = function (elData) {
      var self = this;
      var getNextIdClosure = function () { return self.getNextId(); };
      return svgedit.utilities.copyElemData(elData, getNextIdClosure);
    };
})();
