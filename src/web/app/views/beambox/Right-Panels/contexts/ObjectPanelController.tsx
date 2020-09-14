import Constant from '../../../../actions/beambox/constant';
import { ObjectPanelContextHelper } from '../Object-Panel';
const React = requireNode('react');
const updateDimensionValues = (newValue) => {
    if (!ObjectPanelContextHelper.context) {
        // console.log('ObjectPanel is not mounted now.');
    } else {
        ObjectPanelContextHelper.context.updateDimensionValues(newValue);
    }
};

const getDimensionValues = (key) => {
    if (!ObjectPanelContextHelper.context) {
        //console.log('ObjectPanel is not mounted now.');
    } else {
        return ObjectPanelContextHelper.context.getDimensionValues(key);
    }
}

const updateObjectPanel = () => {
    if (!ObjectPanelContextHelper.context) {
        //console.log('ObjectPanel is not mounted now.');
    } else {
        ObjectPanelContextHelper.context.updateObjectPanel();
    }
};

export default {
    updateObjectPanel: updateObjectPanel,
    updateDimensionValues: updateDimensionValues,
    getDimensionValues: getDimensionValues
}
