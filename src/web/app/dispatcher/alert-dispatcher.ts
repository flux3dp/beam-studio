// @ts-expect-error
import Flux = require('reactFlux');
var flux = new Flux.Dispatcher();

export default {
    register: function(callback) {
        return flux.register(callback);
    },

    dispatch(actionType) {
        flux.dispatch(actionType);
    }
};