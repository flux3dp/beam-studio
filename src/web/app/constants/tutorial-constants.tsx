import BeamboxPreference from '../actions/beambox/beambox-preference';
import Constant from '../actions/beambox/constant';
import { TopRef, RightRef, calculateTop, calculateRight } from 'helpers/absolute-position-helper';
import * as i18n from 'helpers/i18n';
import { ITutorial } from 'interfaces/ITutorial';

export enum TutorialCallbacks {
  SELECT_DEFAULT_RECT = 'SELECT_DEFAULT_RECT',
}

const React = requireNode('react');
const electron = requireNode('electron');
const systemPreferences = electron.remote.systemPreferences;

const LANG = i18n.lang.tutorial;

const nextStepRequirements = {
  SELECT_CIRCLE: 'SELECT_CIRCLE',
  SELECT_RECT: 'SELECT_RECT',
  DRAW_A_CIRCLE: 'DRAW_A_CIRCLE',
  DRAW_A_RECT: 'DRAW_A_RECT',
  INFILL: 'INFILL',
  SET_PRESET_WOOD_ENGRAVING: 'SET_PRESET_WOOD_ENGRAVING',
  SET_PRESET_WOOD_CUTTING: 'SET_PRESET_WOOD_CUTTING',
  ADD_NEW_LAYER: 'ADD_NEW_LAYER',
  TO_EDIT_MODE: 'TO_EDIT_MODE',
  TO_LAYER_PANEL: 'TO_LAYER_PANEL',
  TO_PREVIEW_MODE: 'TO_PREVIEW_MODE',
  PREVIEW_PLATFORM: 'PREVIEW_PLATFORM',
  SEND_FILE: 'SEND_FILE',
};

const isMac = process.platform === 'darwin';

const adjustFocusLinkClick = () => {
  // TODO: Add adjust focus link for Beambox2
  const model = BeamboxPreference.read('model') || 'fbb1b';
  if (['fbm1'].includes(model)) {
    electron.remote.shell.openExternal(LANG.links.adjust_focus_bm);
  } else {
    electron.remote.shell.openExternal(LANG.links.adjust_focus_bb);
  }
};

const NEW_USER_TUTORIAL: ITutorial = {
  id: 'NEW_USER_TUTORIAL',
  end_alert: LANG.newUser.end_alert,
  dialogStylesAndContents: [
    {
      dialogBoxStyles: {
        position: { left: isMac ? 100 : 25, top: calculateTop(10, TopRef.TOPBAR) },
        arrowDirection: 'top',
        arrowPadding: isMac ? undefined : 9
      },
      holePosition: { left: isMac ? 80 : 3, top: calculateTop(0) },
      holeSize: { width: 40, height: 40 },
      hintCircle: { left: isMac ? 82 : 7, top: calculateTop(3), width: 36, height: 36 },
      text: LANG.newUser.switch_to_preview_mode,
      nextStepRequirement: nextStepRequirements.TO_PREVIEW_MODE
    },
    {
      dialogBoxStyles: {
        position: {
          top: calculateTop(260, TopRef.TOPBAR),
          get left() {
            return window.innerWidth - Constant.rightPanelWidth
          },
        },
      },
      holePosition: { left: 50, right: 240, top: calculateTop(0) },
      holeSize: {},
      hintCircle: {
        left: 55, top: calculateTop(5, TopRef.TOPBAR),
        get width() {
          return window.innerWidth - Constant.sidePanelsWidth - 10;
        },
        get height() {
          return window.innerHeight - Constant.topBarHeight - 10;
        },
      },
      text: LANG.newUser.preview_the_platform,
      subElement: (
        <div className='sub-content'>
          <div className='sub-line'>{LANG.newUser.put_wood}</div>
          <div className='sub-line'>
            {LANG.newUser.adjust_focus}
            <div className='hint-mark' onClick={() => adjustFocusLinkClick()}>{'?'}</div>
          </div>
          <div className='sub-line'>{LANG.newUser.close_cover}</div>
        </div>
      ),
      nextStepRequirement: nextStepRequirements.PREVIEW_PLATFORM,
    },
    {
      dialogBoxStyles: {
        position: { left: 56, top: calculateTop(26, TopRef.TOPBAR) }
      },
      holePosition: { left: 7, top: calculateTop(16, TopRef.TOPBAR) },
      holeSize: { width: 36, height: 36 },
      hintCircle: { left: 5, top: calculateTop(9, TopRef.TOPBAR), width: 40, height: 40 },
      text: LANG.newUser.end_preview_mode,
      nextStepRequirement: nextStepRequirements.TO_EDIT_MODE,
    },
    {
      dialogBoxStyles: {
        position: { left: 56, top: calculateTop(157, TopRef.TOPBAR) }
      },
      holePosition: { left: 7, top: calculateTop(147, TopRef.TOPBAR) },
      holeSize: { width: 36, height: 36 },
      hintCircle: { left: 5, top: calculateTop(138, TopRef.TOPBAR), width: 40, height: 40 },
      text: LANG.newUser.draw_a_rect,
      nextStepRequirement: nextStepRequirements.SELECT_RECT,
    },
    {
      dialogBoxStyles: {
        position: {
          top: calculateTop(260, TopRef.TOPBAR),
          get left() {
            return window.innerWidth - Constant.rightPanelWidth
          },
        },
      },
      holePosition: { left: 50, right: 240, top: calculateTop(40) },
      holeSize: {},
      hintCircle: {
        left: 55, top: calculateTop(5, TopRef.TOPBAR),
        get width() {
          return window.innerWidth - Constant.sidePanelsWidth - 10;
        },
        get height() {
          return window.innerHeight - Constant.topBarHeight - 10;
        },
      },
      text: LANG.newUser.drag_to_draw,
      nextStepRequirement: nextStepRequirements.DRAW_A_RECT,
    },
    {
      dialogBoxStyles: {
        position: { right: calculateRight(4, RightRef.RIGHT_PANEL), top: calculateTop(20, TopRef.TOPBAR) },
        arrowDirection: 'right'
      },
      holePosition: { right: calculateRight(-31, RightRef.RIGHT_PANEL), top: calculateTop(0, TopRef.TOPBAR) },
      holeSize: { width: 32, height: 40 },
      hintCircle: { right: calculateRight(-36, RightRef.RIGHT_PANEL), top:calculateTop(0, TopRef.TOPBAR), width: 40, height: 40 },
      text: LANG.newUser.switch_to_layer_panel,
      nextStepRequirement: nextStepRequirements.TO_LAYER_PANEL,
    },
    {
      dialogBoxStyles: {
        position: { right: calculateRight(-2, RightRef.RIGHT_PANEL), top:  calculateTop(141, TopRef.LAYER_LIST) },
        arrowDirection: 'right'
      },
      holePosition: { right: 15, top: calculateTop(126, TopRef.LAYER_LIST) },
      holeSize: { width: Constant.rightPanelWidth - 22, height: 30 },
      hintCircle: { right: 5, top: calculateTop(122, TopRef.LAYER_LIST), width: Constant.rightPanelWidth - 12, height: 40 },
      text: LANG.newUser.set_preset_wood_cut,
      nextStepRequirement: nextStepRequirements.SET_PRESET_WOOD_CUTTING
    },
    {
      dialogBoxStyles: {
        position: { right: 55, top: calculateTop(22, TopRef.LAYER_LIST) },
        arrowDirection: 'right'
      },
      holePosition: { right: 15, top: calculateTop(3, TopRef.LAYER_LIST) },
      holeSize: { width: 35, height: 35 },
      hintCircle: { right: 14, top: calculateTop(2, TopRef.LAYER_LIST), width: 40, height: 40 },
      text: LANG.newUser.add_new_layer,
      nextStepRequirement: nextStepRequirements.ADD_NEW_LAYER
    },
    {
      dialogBoxStyles: {
        position: { left: 56, top: calculateTop(198, TopRef.TOPBAR) }
      },
      holePosition: { left: 7, top: calculateTop(188, TopRef.TOPBAR) },
      holeSize: { width: 36, height: 36 },
      hintCircle: { left: 5, top: calculateTop(181, TopRef.TOPBAR), width: 40, height: 40 },
      text: LANG.newUser.draw_a_circle,
      nextStepRequirement: nextStepRequirements.SELECT_CIRCLE,
    },
    {
      dialogBoxStyles: {
        position: {
          top: calculateTop(260, TopRef.TOPBAR),
          get left() {
            return window.innerWidth - Constant.rightPanelWidth
          },
        },
      },
      holePosition: { left: 50, right: 240, top: calculateTop(0, TopRef.TOPBAR) },
      holeSize: {},
      hintCircle: {
        left: 55, top: calculateTop(5, TopRef.TOPBAR),
        get width() {
          return window.innerWidth - Constant.sidePanelsWidth - 10;
        },
        get height() {
          return window.innerHeight - Constant.topBarHeight - 10;
        },
      },
      text: LANG.newUser.drag_to_draw,
      nextStepRequirement: nextStepRequirements.DRAW_A_CIRCLE,
    },
    {
      dialogBoxStyles: {
        position: { right: 65, top: calculateTop(261, TopRef.TOPBAR) },
        arrowDirection: 'right'
      },
      holePosition: { right: 15, top: calculateTop(249, TopRef.TOPBAR) },
      holeSize: { width: 55, height: 20 },
      hintCircle: { right: 9, top: calculateTop(241, TopRef.TOPBAR), width: 55, height: 40 },
      text: LANG.newUser.infill,
      nextStepRequirement: nextStepRequirements.INFILL
    },
    {
      dialogBoxStyles: {
        position: { right: calculateRight(4, RightRef.RIGHT_PANEL), top: calculateTop(20, TopRef.TOPBAR) },
        arrowDirection: 'right'
      },
      holePosition: { right: calculateRight(-31, RightRef.RIGHT_PANEL), top:calculateTop(0, TopRef.TOPBAR) },
      holeSize: { width: 32, height: 40 },
      hintCircle: { right: calculateRight(-36, RightRef.RIGHT_PANEL), top: calculateTop(0, TopRef.TOPBAR), width: 40, height: 40 },
      text: LANG.newUser.switch_to_layer_panel,
      nextStepRequirement: nextStepRequirements.TO_LAYER_PANEL,
    },
    {
      dialogBoxStyles: {
        position: { right: calculateRight(-2, RightRef.RIGHT_PANEL), top: calculateTop(141, TopRef.LAYER_LIST) },
        arrowDirection: 'right'
      },
      holePosition: { right: 15, top: calculateTop(126, TopRef.LAYER_LIST) },
      holeSize: { width: Constant.rightPanelWidth - 22, height: 30 },
      hintCircle: { right: 5, top: calculateTop(122, TopRef.LAYER_LIST), width: Constant.rightPanelWidth - 12, height: 40 },
      text: LANG.newUser.set_preset_wood_engraving,
      nextStepRequirement: nextStepRequirements.SET_PRESET_WOOD_ENGRAVING
    },
    {
      dialogBoxStyles: {
        position: { right: 21, top: calculateTop(0, TopRef.TOPBAR) },
        arrowDirection: 'top',
        arrowPadding: 7
      },
      holePosition: { left: 0, top: calculateTop(0) },
      holeSize: {},
      hintCircle: { right: 4, top: calculateTop(3), width: isMac ? 36 : 64, height: isMac ? 36 : 33 },
      text: LANG.newUser.send_the_file,
      nextStepRequirement: nextStepRequirements.SEND_FILE
    },
  ],
};

const INTERFACE_TUTORIAL: ITutorial = {
  id: 'INTERFACE_TUTORIAL',
  hasNextButton: true,
  end_alert: LANG.newInterface.end_alert,
  dialogStylesAndContents: [
    {
      dialogBoxStyles: {
        position: { left: isMac ? 100 : 25, top: calculateTop(10, TopRef.TOPBAR) },
        arrowDirection: 'top',
        arrowPadding: isMac ? undefined : 9
      },
      hintCircle: { left: isMac ? 82 : 7, top: calculateTop(3), width: 36, height: 36 },
      text: LANG.newInterface.camera_preview,
    },
    {
      dialogBoxStyles: {
        position: { left: 56, top: calculateTop(40, TopRef.TOPBAR) }
      },
      hintCircle: { left: 5, top: calculateTop(5, TopRef.TOPBAR), width: 40, height: 135 },
      text: LANG.newInterface.select_image_text,
    },
    {
      dialogBoxStyles: {
        position: { left: 56, top: calculateTop(175, TopRef.TOPBAR) }
      },
      hintCircle: { left: 5, top: calculateTop(135, TopRef.TOPBAR), width: 40, height: 180 },
      text: LANG.newInterface.basic_shapes,
    },
    {
      dialogBoxStyles: {
        position: { left: 56, top: calculateTop(330, TopRef.TOPBAR) }
      },
      hintCircle: { left: 5, top: calculateTop(310, TopRef.TOPBAR), width: 40, height: 40 },
      text: LANG.newInterface.pen_tool,
    },
    {
      dialogBoxStyles: {
        position: { right: 55, top: calculateTop(22, TopRef.LAYER_LIST) },
        arrowDirection: 'right'
      },
      hintCircle: { right: 14, top: calculateTop(2, TopRef.LAYER_LIST), width: 40, height: 40 },
      text: LANG.newInterface.add_new_layer,
    },
    {
      dialogBoxStyles: {
        position: { right: calculateRight(-30, RightRef.RIGHT_PANEL), top: calculateTop(60, TopRef.TOPBAR) },
        arrowDirection: 'right'
      },
      hintCircle: { right: calculateRight(60, RightRef.RIGHT_SROLL_BAR), top: calculateTop(42, TopRef.TOPBAR), width: 145, height: 36 },
      text: LANG.newInterface.rename_by_double_click,
    },
    {
      dialogBoxStyles: {
        position: { right: calculateRight(0, RightRef.RIGHT_PANEL), top: calculateTop(60, TopRef.TOPBAR) },
        arrowDirection: 'right'
      },
      hintCircle: { right: 10, top: calculateTop(42, TopRef.TOPBAR), width: Constant.rightPanelWidth - 15, height: 36 },
      text: LANG.newInterface.drag_to_sort,
    },
    {
      dialogBoxStyles: {
        position: { right: calculateRight(0, RightRef.RIGHT_PANEL), top: calculateTop(60, TopRef.TOPBAR) },
        arrowDirection: 'right'
      },
      hintCircle: { right: 10, top: calculateTop(42, TopRef.TOPBAR), width: Constant.rightPanelWidth - 15, height: 236 },
      text: LANG.newInterface.layer_controls,
    },
    {
      dialogBoxStyles: {
        position: { right: calculateRight(0, RightRef.RIGHT_PANEL), top: calculateTop(20, TopRef.TOPBAR) },
        arrowDirection: 'right'
      },
      hintCircle: { right: 5, top: calculateTop(2, TopRef.TOPBAR), width: Constant.rightPanelWidth - 10, height: 36 },
      text: LANG.newInterface.switch_between_layer_panel_and_object_panel,
      callback: TutorialCallbacks.SELECT_DEFAULT_RECT,
    },
    {
      dialogBoxStyles: {
        position: { right: calculateRight(0, RightRef.RIGHT_PANEL), top: calculateTop(60, TopRef.TOPBAR) },
        arrowDirection: 'right'
      },
      hintCircle: { right: 10, top: calculateTop(42, TopRef.TOPBAR), width: Constant.rightPanelWidth - 15, height: 36 },
      text: LANG.newInterface.align_controls,
    },
    {
      dialogBoxStyles: {
        position: { right: calculateRight(0, RightRef.RIGHT_PANEL), top: calculateTop(100, TopRef.TOPBAR) },
        arrowDirection: 'right'
      },
      hintCircle: { right: calculateRight(-70, RightRef.RIGHT_PANEL), top: calculateTop(83, TopRef.TOPBAR), width: 65, height: 36 },
      text: LANG.newInterface.group_controls,
    },
    {
      dialogBoxStyles: {
        position: { right: calculateRight(0, RightRef.RIGHT_PANEL), top: calculateTop(100, TopRef.TOPBAR) },
        arrowDirection: 'right'
      },
      hintCircle: { right: calculateRight(5, RightRef.RIGHT_SROLL_BAR), top: calculateTop(83, TopRef.TOPBAR), width: 115, height: 36 },
      text: LANG.newInterface.shape_operation,
    },
    {
      dialogBoxStyles: {
        position: { right: calculateRight(85, RightRef.RIGHT_SROLL_BAR), top: calculateTop(190, TopRef.TOPBAR) },
        arrowDirection: 'right'
      },
      hintCircle: { right: calculateRight(10, RightRef.RIGHT_SROLL_BAR), top: calculateTop(173, TopRef.TOPBAR), width: 67, height: 34 },
      text: LANG.newInterface.flip,
    },
    {
      dialogBoxStyles: {
        position: { right: calculateRight(0, RightRef.RIGHT_PANEL), top: calculateTop(233, TopRef.TOPBAR) },
        arrowDirection: 'right'
      },
      hintCircle: { right: 5, top: calculateTop(216, TopRef.TOPBAR), width: Constant.rightPanelWidth - 10, height: 180 },
      text: LANG.newInterface.object_actions,
    },
  ],
};

export default {
  ...nextStepRequirements,
  NEW_USER_TUTORIAL,
  INTERFACE_TUTORIAL,
};
