const Flux = requireNode('flux');
var flux = new Flux.Dispatcher();

export default {
    register: function (callback) {
        return flux.register(callback);
    },

    dispatch(action) {
        flux.dispatch(action);
    }
};
