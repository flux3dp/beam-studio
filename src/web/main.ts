const allowTracking = false;

import $ from 'jquery';
import * as i18n from './helpers/i18n';
import Shortcuts from './helpers/shortcuts';
import Backbone from 'backbone';
import Router from './app/router';
import Announcement from './app/actions/announcement';
import globalEvents from './app/actions/global';
import menuBar from './helpers/menubar';

declare global {
    var requireNode: (name: string) => any
}

export default function() {
    console.log(`Beam-Studio: ${window['FLUX'].version}`);

    if(allowTracking) {
        // google analytics
        $.getScript('/js/helpers/analytics.js');
    }

    menuBar();

    globalEvents(function() {
        let router = new Router();
        Backbone.history.start();
        Announcement.init('announcement');
    });
}
