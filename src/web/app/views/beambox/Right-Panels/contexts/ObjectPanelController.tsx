import Constant from '../../../../actions/beambox/constant'
import { ObjectPanel, ObjectPanelContextCaller } from '../Object-Panel'
    const React = requireNode('react');;
    const updateDimensionValues = (newValue) => {
        if (!ObjectPanelContextCaller) {
            //console.log('ObjectPanel is not mounted now.');
        } else {
            ObjectPanelContextCaller.updateDimensionValues(newValue);
        }
    };

    const getDimensionValues = (key) => {
        if (!ObjectPanelContextCaller) {
            //console.log('ObjectPanel is not mounted now.');
        } else {
            return ObjectPanelContextCaller.getDimensionValues(key);
        }
    }

    const updateObjectPanel = () => {
        if (!ObjectPanelContextCaller) {
            //console.log('ObjectPanel is not mounted now.');
        } else {
            ObjectPanelContextCaller.updateObjectPanel();
        }
    };

    export default {
        updateObjectPanel: updateObjectPanel,
        updateDimensionValues: updateDimensionValues,
        getDimensionValues: getDimensionValues
    }