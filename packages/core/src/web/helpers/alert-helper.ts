import alertCaller from '@core/app/actions/alert-caller';
import dialogCaller from '@core/app/actions/dialog-caller';
import alertConfig from '@core/helpers/api/alert-config';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import browser from '@core/implementations/browser';

let count = 0;
const showFacebookGroupInvitation = () => {
  const LANG = i18n.lang.beambox.popup.facebook_group_invitation;

  if (!alertConfig.read('skip-fb-group-invitation')) {
    const handleJoinNow = () => {
      browser.open(i18n.lang.topbar.menu.link.forum);
      alertConfig.write('skip-fb-group-invitation', true);
    };
    const handleAlreadyJoined = () => alertConfig.write('skip-fb-group-invitation', true);

    alertCaller.popUp({
      buttonLabels: [LANG.join_now, LANG.later, LANG.already_joined],
      callbacks: [handleJoinNow, () => {}, handleAlreadyJoined],
      caption: LANG.title,
      checkbox: {
        callbacks: [handleJoinNow, () => alertConfig.write('skip-fb-group-invitation', true), handleAlreadyJoined],
        text: i18n.lang.alert.dont_show_again,
      },
      message: LANG.message,
      primaryButtonIndex: 0,
    });
  }
};

const showMediaInvitation = (): void => {
  if (count > 5) return;

  count += 1;

  if (count === 1) showFacebookGroupInvitation();
  else if (count === 5 && !alertConfig.read('skip-social-media-invitation')) dialogCaller.showSocialMedia(true);
};

const registerAlertEvents = (): void => {
  count = 0; // Reset count for testing

  const monitorEventEmitter = eventEmitterFactory.createEventEmitter('monitor');

  monitorEventEmitter.on('PLAY', showMediaInvitation);
};

export default {
  registerAlertEvents,
};
