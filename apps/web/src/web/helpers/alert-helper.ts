import alertConfig from 'helpers/api/alert-config';
import browser from 'implementations/browser';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import i18n from 'helpers/i18n';
import { IAlert } from 'interfaces/IAlert';

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
      caption: LANG.title,
      message: LANG.message,
      buttonLabels: [LANG.join_now, LANG.later, LANG.already_joined],
      primaryButtonIndex: 0,
      callbacks: [
        handleJoinNow,
        () => {},
        handleAlreadyJoined,
      ],
      checkbox: {
        text: LANG.dont_show_again,
        callbacks: [
          handleJoinNow,
          () => alertConfig.write('skip-fb-group-invitation', true),
          handleAlreadyJoined,
        ],
      }
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
