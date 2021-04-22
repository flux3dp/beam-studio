import Monitor from './monitor';
import Device from './device';
const Redux = require('Redux');

const { combineReducers } = Redux;

export default combineReducers({
    Monitor,
    Device
});
