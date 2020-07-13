define([
    'jquery',
    'helpers/i18n'
], 
function(
    $,
    i18n
) {
    'use strict';
    const LANG = i18n.lang;
    const electron = require('electron');
    if (process.platform !== 'win32') return () => {};

    return () => {
        const customTitlebar = require('custom-electron-titlebar');
        
        $('.content').css({'height': 'calc(100% - 30px)'});
        let titlebar = new customTitlebar.Titlebar({
            backgroundColor: customTitlebar.Color.fromHex('#333'),
            shadow: false,
            icon: 'win-title-icon.png'
        });
        titlebar.updateTitle(' ');
        window.titlebar = titlebar;
        electron.ipcRenderer.on('UPDATE_CUSTOM_TITLEBAR', (e) => {
            window.dispatchEvent(new Event('mousedown'));
        });
    }
});