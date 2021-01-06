import Dispatcher from '../dispatcher/input-lightbox-dispatcher';
import Constants from '../constants/input-lightbox-constants';
const EventEmitter = requireNode('events');

var namespace = 'InputLightBox',
    Store;

Store = Object.assign(EventEmitter.prototype, {
    onInputLightBoxOpened: function(callback) {
        this.on(namespace + Constants.OPEN_EVENT, callback);
        return Store;
    },

    removeOpenedListener: function(callback) {
        this.removeListener(namespace + Constants.OPEN_EVENT, callback);
        return Store;
    },

    dispatcherIndex: Dispatcher.register(function(payload) {
        var actionType = payload.actionType,
            actions = [
                namespace + Constants.OPEN_EVENT
            ],
            isMethodExisting = function(method) {
                return namespace + actionType === method;
            };

        if (true === actions.some(isMethodExisting)) {
            Store.emit(namespace + actionType, payload);
        }
        else {
            throw new Error('No method exists');
        }
    })

});

export default Store;
