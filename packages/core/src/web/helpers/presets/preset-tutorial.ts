import alertCaller from '@core/app/actions/alert-caller';
import tutorialController from '@core/app/components/tutorials/tutorialController';
import tutorialConstants from '@core/app/constants/tutorial-constants';
import i18n from '@core/helpers/i18n';

/**
 * New-user tutorial steps that wait for a specific preset selection.
 * Shared by the legacy preset dropdown and the Material Browser apply flow
 * (Material Browser passes isDefault: origin === 'default' and key: legacyKey).
 */
export const checkPresetTutorialStep = (preset: { isDefault?: boolean; key?: string }): void => {
  const { isDefault, key } = preset;
  const { SET_PRESET_WOOD_CUTTING, SET_PRESET_WOOD_ENGRAVING } = tutorialConstants;

  if (SET_PRESET_WOOD_ENGRAVING === tutorialController.getNextStepRequirement()) {
    if (isDefault && key?.startsWith('wood_engraving')) {
      tutorialController.handleNextStep();
    } else {
      alertCaller.popUp({ message: i18n.lang.tutorial.newUser.please_select_wood_engraving });
    }
  } else if (SET_PRESET_WOOD_CUTTING === tutorialController.getNextStepRequirement()) {
    if (isDefault && /^wood_[\d]+mm_cutting/.test(key ?? '')) {
      tutorialController.handleNextStep();
    } else {
      alertCaller.popUp({ message: i18n.lang.tutorial.newUser.please_select_wood_cutting });
    }
  }
};
