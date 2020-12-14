/**
 * drag and drop handler
 */
import $ from 'jquery';

export default {
    plug: function(rootElement, handler) {
        return this.unplug(rootElement).on('dragover dragend', function(e) {
                e.preventDefault();
            }).
            on('drop', function(e) {
                e.preventDefault();
                window['processDroppedFile'] = true;
                handler(e);
            });
    },
    unplug: function(rootElement) {
        return $(rootElement).off('drop dragover dragend');
    }
};
