import alertConfig from '@core/helpers/api/alert-config';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import browser from '@core/implementations/browser';
import type { IAlert } from '@core/interfaces/IAlert';

let isInvitationShowed = false;
const showFacebookGroupInvitation = (popUp: (args: IAlert) => void) => {
  const LANG = i18n.lang.beambox.popup.facebook_group_invitation;

  if (!isInvitationShowed && !alertConfig.read('skip-fb-group-invitation')) {
    const handleJoinNow = () => {
      browser.open(i18n.lang.topbar.menu.link.forum);
      alertConfig.write('skip-fb-group-invitation', true);
    };
    const handleAlreadyJoined = () => alertConfig.write('skip-fb-group-invitation', true);

    popUp({
      buttonLabels: [LANG.join_now, LANG.later, LANG.already_joined],
      callbacks: [handleJoinNow, () => {}, handleAlreadyJoined],
      caption: LANG.title,
      checkbox: {
        callbacks: [handleJoinNow, () => alertConfig.write('skip-fb-group-invitation', true), handleAlreadyJoined],
        text: LANG.dont_show_again,
      },
      message: LANG.message,
      primaryButtonIndex: 0,
    });
    isInvitationShowed = true;
  }
};

const registerAlertEvents = (popUp: (args: IAlert) => void): void => {
  const monitorEventEmitter = eventEmitterFactory.createEventEmitter('monitor');

  monitorEventEmitter.on('PLAY', () => showFacebookGroupInvitation(popUp));
};

export default {
  registerAlertEvents,
};
