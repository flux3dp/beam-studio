import { ContextHelper } from './Time-Estimation-Button';

export const clearEstimatedTime = () => {
    if (ContextHelper.context) {
        ContextHelper.context.setEstimatedTime(null);
    } else {
        console.info('Time Est. Button has not mount yet.')
    }
};

export default {
    clearEstimatedTime,
};