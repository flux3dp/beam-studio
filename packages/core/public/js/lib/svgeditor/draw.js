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
         * The z-ordered array of Layer objects. Each layer has a name
         * and group element.
         * The first layer is the one at the bottom of the rendering.
         * @type {Array.<Layer>}
         */
        this.all_layers = [];

        /**
         * Map of all_layers by name.
         *
         * Note: Layers are ordered, but referenced externally by name; so, we need both container
         * types depending on which function is called (i.e. all_layers and layer_map).
         *
         * @type {Object.<string, Layer>}
         */
        this.layer_map = {};

        /**
         * The current layer being used.
         * @type {Layer}
         */
        this.current_layer = null;

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
     * Returns the number of layers in the current drawing.
     * @returns {integer} The number of layers in the current drawing.
    */
    svgedit.draw.Drawing.prototype.getNumLayers = function () {
        return this.all_layers.length;
    };

    /**
     * Check if layer with given name already exists
     * @param {string} name - The layer name to check
    */
    svgedit.draw.Drawing.prototype.hasLayer = function (name) {
        return this.layer_map[name] !== undefined;
    };


    /**
     * Returns the name of the ith layer. If the index is out of range, an empty string is returned.
     * @param {integer} i - The zero-based index of the layer you are querying.
     * @returns {string} The name of the ith layer (or the empty string if none found)
    */
    svgedit.draw.Drawing.prototype.getLayerName = function (i) {
        return i >= 0 && i < this.getNumLayers() ? this.all_layers[i].getName() : '';
    };

    /**
     * @returns {SVGGElement} The SVGGElement representing the current layer.
     */
    svgedit.draw.Drawing.prototype.getCurrentLayer = function () {
        return this.current_layer ? this.current_layer.getGroup() : null;
    };

    /**
     * Get a layer by name.
     * @returns {SVGGElement} The SVGGElement representing the named layer or null.
     */
    svgedit.draw.Drawing.prototype.getLayerByName = function (name) {
        var layer = this.layer_map[name];
        return layer ? layer.getGroup() : null;
    };

    /**
     * Returns the name of the currently selected layer. If an error occurs, an empty string
     * is returned.
     * @returns {string} The name of the currently active layer (or the empty string if none found).
    */
    svgedit.draw.Drawing.prototype.getCurrentLayerName = function () {
        return this.current_layer ? this.current_layer.getName() : '';
    };

    /**
     * Get the current layer's position.
     * @returns {number}  The zero-based index of current layer position.
     */
    svgedit.draw.Drawing.prototype.getCurrentLayerPosition = function () {
        var layer_count = this.getNumLayers();
        if (!this.current_layer) {
            return null;
        }

        let pos;
        for (pos = 0; pos < layer_count; ++pos) {
            if (this.all_layers[pos] === this.current_layer) { break; }
        }
        // some unknown error condition (current_layer not in all_layers)
        if (pos == layer_count) { return null; }

        return pos;
    };

    svgedit.draw.Drawing.prototype.mergeLayer = function (hrService) {
        var current_group = this.current_layer.getGroup();
        var prevGroup = $(current_group).prev()[0];
        if (!prevGroup) { return; }

        hrService.startBatchCommand('Merge Layer');

        var layerNextSibling = current_group.nextSibling;

        const children = current_group.childNodes;
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            if (child.localName == 'title' || child.tagName === 'filter') {
                continue;
            }
            var oldNextSibling = child.nextSibling;
            prevGroup.appendChild(child);
            hrService.moveElement(child, oldNextSibling, current_group);
            i -= 1;
        }
        hrService.removeElement(current_group, layerNextSibling, this.svgElem_);

        // Remove current layer's group
        this.current_layer.removeGroup();
        // Remove the current layer and set the previous layer as the new current layer
        var index = this.all_layers.indexOf(this.current_layer);
        if (index > 0) {
            var name = this.current_layer.getName();
            this.current_layer = this.all_layers[index - 1];
            this.all_layers.splice(index, 1);
            delete this.layer_map[name];
        }

        hrService.endBatchCommand();
    };

    /**
     * Creates a new top-level layer in the drawing with the given name and
     * makes it the current layer.
     * @param {string} name - The given name. If the layer name exists, a new name will be generated.
     * @param {svgedit.history.HistoryRecordingService} hrService - History recording service
     * @returns {SVGGElement} The SVGGElement of the new layer, which is
     * 		also the current layer of this drawing.
    */
    svgedit.draw.Drawing.prototype.createLayer = function (name, hrService) {
        if (this.current_layer) {
            this.current_layer.deactivate();
        }
        // Check for duplicate name.
        if (name === undefined || name === null || name === '' || this.layer_map[name]) {
            name = getNewLayerName(Object.keys(this.layer_map), name || 'Layer');
        }

        // Crate new layer and add to DOM as last layer
        var layer = new svgedit.draw.Layer(name, null, this.svgElem_);
        // Like to assume hrService exists, but this is backwards compatible with old version of createLayer.
        if (hrService) {
            hrService.startBatchCommand('Create Layer');
            hrService.insertElement(layer.getGroup());
            hrService.endBatchCommand();
        }

        this.all_layers.push(layer);
        this.layer_map[name] = layer;
        this.current_layer = layer;
        return layer.getGroup();
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
