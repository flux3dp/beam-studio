define([
    'app/constants/topbar-constants',
    'app/dispatcher/topbar-dispatcher'
], function(
    TopbarConstants,
    Dispatcher
) {
    return {
        showAlignToolbox: function() {
            Dispatcher.dispatch({
                actionType: TopbarConstants.SHOW_ALIGN_TOOLBOX
            });
        },
        closeAlignToolbox: function() {
            Dispatcher.dispatch({
                actionType: TopbarConstants.CLOSE_ALIGN_TOOLBOX
            });
        },
        showDistributeToolbox: function() {
            Dispatcher.dispatch({
                actionType: TopbarConstants.SHOW_DISTRIBUTE_TOOLBOX
            });
        },
        closeDistributeToolbox: function() {
            Dispatcher.dispatch({
                actionType: TopbarConstants.CLOSE_DISTRIBUTE_TOOLBOX
            });
        },
        showImageToolbox: function() {
            Dispatcher.dispatch({
                actionType: TopbarConstants.SHOW_IMAGE_TOOLBOX
            });
        },
        closeImageToolbox: function() {
            Dispatcher.dispatch({
                actionType: TopbarConstants.CLOSE_IMAGE_TOOLBOX
            });
        },
        updateTopMenu: function() {
            Dispatcher.dispatch({
                actionType: TopbarConstants.UPDATE_TOP_MENU
            });
        },
    };
});
