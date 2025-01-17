import * as React from 'react';
import browser from 'implementations/browser';
import i18n from 'helpers/i18n';
import { ITutorial } from 'interfaces/ITutorial';
import { TopRef, RightRef, calculateTop, calculateRight } from 'helpers/absolute-position-helper';

import layoutConstants from './layout-constants';

export enum TutorialCallbacks {
  SELECT_DEFAULT_RECT = 'SELECT_DEFAULT_RECT',
  SCROLL_TO_PARAMETER = 'SCROLL_TO_PARAMETER',
  SCROLL_TO_ADD_LAYER = 'SCROLL_TO_ADD_LAYER',
}

const LANG = i18n.lang.tutorial;
const langLeftPanel = i18n.lang.beambox.left_panel.label;

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
  TO_OBJECT_PANEL: 'TO_OBJECT_PANEL',
  TO_PREVIEW_MODE: 'TO_PREVIEW_MODE',
  PREVIEW_PLATFORM: 'PREVIEW_PLATFORM',
  SEND_FILE: 'SEND_FILE',
};

const rightPanelInnerWidth =
  layoutConstants.rightPanelWidth - layoutConstants.rightPanelScrollBarWidth;

const adjustFocusLinkClick = () => {
  // TODO: Add adjust focus link for Beambox2
  browser.open(LANG.links.adjust_focus);
};

const NEW_USER_TUTORIAL: ITutorial = {
  id: 'NEW_USER_TUTORIAL',
  end_alert: LANG.newUser.end_alert,
  dialogStylesAndContents: [
    {
      dialogBoxStyles: {
        position: { left: 56, top: calculateTop(26, TopRef.TOPBAR) },
      },
      holePosition: { left: 7, top: calculateTop(10, TopRef.TOPBAR) },
      holeSize: { width: 36, height: 36 },
      hintCircle: {
        left: 5,
        top: calculateTop(9, TopRef.TOPBAR),
        width: 40,
        height: 40,
      },
      text: LANG.newUser.switch_to_preview_mode,
      nextStepRequirement: nextStepRequirements.TO_PREVIEW_MODE,
    },
    {
      dialogBoxStyles: {
        position: {
          top: calculateTop(260, TopRef.TOPBAR),
          get left(): number {
            return window.innerWidth - layoutConstants.rightPanelWidth;
          },
        },
      },
      holePosition: { left: 50, right: layoutConstants.rightPanelWidth, top: calculateTop(0) },
      holeSize: {},
      hintCircle: {
        left: 55,
        top: calculateTop(5, TopRef.TOPBAR),
        get width(): number {
          return window.innerWidth - layoutConstants.sidePanelsWidth - 10;
        },
        get height(): number {
          return window.innerHeight - layoutConstants.topBarHeight - 10;
        },
      },
      text: LANG.newUser.preview_the_platform,
      subElement: (
        <div className="sub-content">
          <div className="sub-line">{LANG.newUser.put_wood}</div>
          <div className="sub-line">
            {LANG.newUser.adjust_focus}
            <div className="hint-mark" onClick={adjustFocusLinkClick}>
              ?
            </div>
          </div>
          <div className="sub-line">{LANG.newUser.close_cover}</div>
        </div>
      ),
      nextStepRequirement: nextStepRequirements.PREVIEW_PLATFORM,
    },
    {
      dialogBoxStyles: {
        position: { left: 56, top: calculateTop(26, TopRef.TOPBAR) },
      },
      holePosition: { left: 7, top: calculateTop(10, TopRef.TOPBAR) },
      holeSize: { width: 36, height: 36 },
      hintCircle: {
        left: 5,
        top: calculateTop(9, TopRef.TOPBAR),
        width: 40,
        height: 40,
      },
      text: LANG.newUser.end_preview_mode,
      nextStepRequirement: nextStepRequirements.TO_EDIT_MODE,
    },
    {
      dialogBoxStyles: {
        position: { left: 56, top: calculateTop(287, TopRef.TOPBAR) },
      },
      holePosition: { left: 7, top: calculateTop(269, TopRef.TOPBAR) },
      holeSize: { width: 36, height: 36 },
      hintCircle: {
        left: 5,
        top: calculateTop(267, TopRef.TOPBAR),
        width: 40,
        height: 40,
      },
      text: LANG.newUser.draw_a_rect,
      nextStepRequirement: nextStepRequirements.SELECT_RECT,
    },
    {
      dialogBoxStyles: {
        position: {
          top: calculateTop(260, TopRef.TOPBAR),
          get left(): number {
            return window.innerWidth - layoutConstants.rightPanelWidth;
          },
        },
      },
      holePosition: { left: 50, right: layoutConstants.rightPanelWidth, top: calculateTop(40) },
      holeSize: {},
      hintCircle: {
        left: 55,
        top: calculateTop(5, TopRef.TOPBAR),
        get width(): number {
          return window.innerWidth - layoutConstants.sidePanelsWidth - 10;
        },
        get height(): number {
          return window.innerHeight - layoutConstants.topBarHeight - 10;
        },
      },
      text: LANG.newUser.drag_to_draw,
      nextStepRequirement: nextStepRequirements.DRAW_A_RECT,
      callback: TutorialCallbacks.SCROLL_TO_PARAMETER,
    },
    {
      dialogBoxStyles: {
        position: {
          right: calculateRight(4, RightRef.RIGHT_PANEL),
          get top(): number {
            return calculateTop(56, TopRef.LAYER_PARAMS);
          },
        },
        arrowDirection: 'right',
      },
      holePosition: {
        right: calculateRight(45, RightRef.RIGHT_SROLL_BAR),
        get top(): number {
          return calculateTop(44, TopRef.LAYER_PARAMS);
        },
      },
      holeSize: { width: rightPanelInnerWidth - 60, height: 30 },
      hintCircle: {
        right: calculateRight(45, RightRef.RIGHT_SROLL_BAR),
        get top(): number {
          return calculateTop(36, TopRef.LAYER_PARAMS);
        },
        width: rightPanelInnerWidth - 55,
        height: 40,
      },
      text: LANG.newUser.set_preset_wood_cut,
      nextStepRequirement: nextStepRequirements.SET_PRESET_WOOD_CUTTING,
      callback: TutorialCallbacks.SCROLL_TO_ADD_LAYER,
    },
    {
      dialogBoxStyles: {
        position: {
          right: calculateRight(40, RightRef.RIGHT_SROLL_BAR),
          top: calculateTop(11, TopRef.LAYER_LIST),
        },
        arrowDirection: 'right',
      },
      holePosition: {
        right: calculateRight(0, RightRef.RIGHT_SROLL_BAR),
        top: calculateTop(-8, TopRef.LAYER_LIST),
      },
      holeSize: { width: 35, height: 35 },
      hintCircle: {
        right: calculateRight(2, RightRef.RIGHT_SROLL_BAR),
        top: calculateTop(-4, TopRef.LAYER_LIST),
        width: 30,
        height: 30,
      },
      text: LANG.newUser.add_new_layer,
      nextStepRequirement: nextStepRequirements.ADD_NEW_LAYER,
    },
    {
      dialogBoxStyles: {
        position: { left: 56, top: calculateTop(329, TopRef.TOPBAR) },
      },
      holePosition: { left: 7, top: calculateTop(312, TopRef.TOPBAR) },
      holeSize: { width: 36, height: 36 },
      hintCircle: {
        left: 5,
        top: calculateTop(310, TopRef.TOPBAR),
        width: 40,
        height: 40,
      },
      text: LANG.newUser.draw_a_circle,
      nextStepRequirement: nextStepRequirements.SELECT_CIRCLE,
    },
    {
      dialogBoxStyles: {
        position: {
          top: calculateTop(260, TopRef.TOPBAR),
          get left(): number {
            return window.innerWidth - layoutConstants.rightPanelWidth;
          },
        },
      },
      holePosition: {
        left: 50,
        right: layoutConstants.rightPanelWidth,
        top: calculateTop(0, TopRef.TOPBAR),
      },
      holeSize: {},
      hintCircle: {
        left: 55,
        top: calculateTop(5, TopRef.TOPBAR),
        get width(): number {
          return window.innerWidth - layoutConstants.sidePanelsWidth - 10;
        },
        get height(): number {
          return window.innerHeight - layoutConstants.topBarHeight - 10;
        },
      },
      text: LANG.newUser.drag_to_draw,
      nextStepRequirement: nextStepRequirements.DRAW_A_CIRCLE,
    },
    {
      id: 'switch-tab',
      dialogBoxStyles: {
        position: {
          right: 44,
          top: calculateTop(20, TopRef.TOPBAR),
        },
        arrowDirection: 'right',
      },
      holePosition: {
        right: 0,
        top: calculateTop(0, TopRef.TOPBAR),
      },
      holeSize: { width: 32, height: 40 },
      hintCircle: {
        right: 0,
        top: calculateTop(0, TopRef.TOPBAR),
        width: 40,
        height: 40,
      },
      text: LANG.newUser.switch_to_object_panel,
      nextStepRequirement: nextStepRequirements.TO_OBJECT_PANEL,
    },
    {
      dialogBoxStyles: {
        position: {
          right: calculateRight(4, RightRef.RIGHT_PANEL),
          top: calculateTop(272, TopRef.TOPBAR),
        },
        arrowDirection: 'right',
      },
      holePosition: {
        right: calculateRight(-40, RightRef.RIGHT_PANEL),
        top: calculateTop(250, TopRef.TOPBAR),
      },
      holeSize: { width: 40, height: 40 },
      hintCircle: {
        right: calculateRight(-35, RightRef.RIGHT_PANEL),
        top: calculateTop(255, TopRef.TOPBAR),
        width: 30,
        height: 30,
      },
      text: LANG.newUser.infill,
      nextStepRequirement: nextStepRequirements.INFILL,
    },
    {
      dialogBoxStyles: {
        position: {
          right: calculateRight(4, RightRef.RIGHT_PANEL),
          top: calculateTop(20, TopRef.TOPBAR),
        },
        arrowDirection: 'right',
      },
      holePosition: {
        right: calculateRight(-31, RightRef.RIGHT_PANEL),
        top: calculateTop(0, TopRef.TOPBAR),
      },
      holeSize: { width: 32, height: 40 },
      hintCircle: {
        right: calculateRight(-36, RightRef.RIGHT_PANEL),
        top: calculateTop(0, TopRef.TOPBAR),
        width: 40,
        height: 40,
      },
      text: LANG.newUser.switch_to_layer_panel,
      nextStepRequirement: nextStepRequirements.TO_LAYER_PANEL,
      callback: TutorialCallbacks.SCROLL_TO_PARAMETER,
    },
    {
      dialogBoxStyles: {
        position: {
          right: calculateRight(4, RightRef.RIGHT_PANEL),
          get top(): number {
            return calculateTop(56, TopRef.LAYER_PARAMS);
          },
        },
        arrowDirection: 'right',
      },
      holePosition: {
        right: calculateRight(45, RightRef.RIGHT_SROLL_BAR),
        get top(): number {
          return calculateTop(44, TopRef.LAYER_PARAMS);
        },
      },
      holeSize: { width: rightPanelInnerWidth - 60, height: 30 },
      hintCircle: {
        right: calculateRight(45, RightRef.RIGHT_SROLL_BAR),
        get top(): number {
          return calculateTop(36, TopRef.LAYER_PARAMS);
        },
        width: rightPanelInnerWidth - 55,
        height: 40,
      },
      text: LANG.newUser.set_preset_wood_engraving,
      nextStepRequirement: nextStepRequirements.SET_PRESET_WOOD_ENGRAVING,
    },
    {
      dialogBoxStyles: {
        position: { right: 21, top: calculateTop(0, TopRef.TOPBAR) },
        arrowDirection: 'top',
        arrowPadding: 7,
      },
      holePosition: { left: 0, top: calculateTop(0) },
      holeSize: {},
      hintCircle: {
        right: 6,
        top: calculateTop(2),
        width: 36,
        height: 36,
      },
      text: LANG.newUser.send_the_file,
      nextStepRequirement: nextStepRequirements.SEND_FILE,
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
        position: { left: 56, top: calculateTop(26, TopRef.TOPBAR) },
      },
      hintCircle: {
        left: 5,
        top: calculateTop(9, TopRef.TOPBAR),
        width: 40,
        height: 40,
      },
      text: LANG.newInterface.camera_preview,
    },
    {
      dialogBoxStyles: {
        position: {
          get right(): number {
            return calculateRight(170, RightRef.PATH_PREVIEW_BTN);
          },
          top: calculateTop(10, TopRef.TOPBAR),
        },
        arrowDirection: 'top',
      },
      hintCircle: {
        right: calculateRight(150, RightRef.PATH_PREVIEW_BTN),
        top: calculateTop(2),
        width: 150,
        height: 36,
      },
      text: LANG.newInterface.select_machine,
    },
    {
      dialogBoxStyles: {
        position: {
          get right(): number {
            return calculateRight(58, RightRef.PATH_PREVIEW_BTN);
          },
          top: calculateTop(10, TopRef.TOPBAR),
        },
        arrowDirection: 'top',
      },
      hintCircle: {
        get right(): number {
          return calculateRight(42, RightRef.PATH_PREVIEW_BTN);
        },
        top: calculateTop(2),
        width: 36,
        height: 36,
      },
      text: i18n.lang.topbar.frame_task,
    },
    // Will be invisible with Ador
    // Rocover when path preview is ready for Ador
    // {
    //   dialogBoxStyles: {
    //     position: { right: 66, top: calculateTop(10, TopRef.TOPBAR) },
    //     arrowDirection: 'top',
    //   },
    //   hintCircle: {
    //     right: 49,
    //     top: calculateTop(2),
    //     width: 36,
    //     height: 36,
    //   },
    //   text: i18n.lang.topbar.task_preview,
    // },
    {
      dialogBoxStyles: {
        position: { right: 24, top: calculateTop(10, TopRef.TOPBAR) },
        arrowDirection: 'top',
        arrowPadding: 8,
      },
      hintCircle: {
        right: 6,
        top: calculateTop(2),
        width: 36,
        height: 36,
      },
      text: LANG.newInterface.start_work,
    },
    {
      dialogBoxStyles: {
        position: { left: 56, top: calculateTop(130, TopRef.TOPBAR) },
      },
      hintCircle: {
        left: 5,
        top: calculateTop(48, TopRef.TOPBAR),
        width: 40,
        height: 176,
      },
      text: `${langLeftPanel.cursor} / ${langLeftPanel.photo} / ${langLeftPanel.my_cloud} / ${langLeftPanel.text}`,
    },
    {
      dialogBoxStyles: {
        position: { left: 56, top: calculateTop(264, TopRef.TOPBAR) },
      },
      hintCircle: {
        left: 5,
        top: calculateTop(224, TopRef.TOPBAR),
        width: 40,
        height: 220,
      },
      text: LANG.newInterface.basic_shapes,
    },
    {
      dialogBoxStyles: {
        position: { left: 56, top: calculateTop(460, TopRef.TOPBAR) },
      },
      hintCircle: {
        left: 5,
        top: calculateTop(438, TopRef.TOPBAR),
        width: 40,
        height: 40,
      },
      text: LANG.newInterface.pen_tool,
      callback: TutorialCallbacks.SCROLL_TO_ADD_LAYER,
    },
    {
      dialogBoxStyles: {
        position: {
          right: calculateRight(45, RightRef.RIGHT_SROLL_BAR),
          top: calculateTop(11, TopRef.LAYER_LIST),
        },
        arrowDirection: 'right',
      },
      hintCircle: {
        right: calculateRight(2, RightRef.RIGHT_SROLL_BAR),
        top: calculateTop(-4, TopRef.LAYER_LIST),
        width: 30,
        height: 30,
      },
      text: LANG.newInterface.add_new_layer,
    },
    {
      dialogBoxStyles: {
        position: {
          right: calculateRight(-30, RightRef.RIGHT_PANEL),
          top: calculateTop(60, TopRef.TOPBAR),
        },
        arrowDirection: 'right',
      },
      hintCircle: {
        right: calculateRight(60, RightRef.RIGHT_SROLL_BAR),
        top: calculateTop(42, TopRef.TOPBAR),
        width: 145,
        height: 36,
      },
      text: LANG.newInterface.rename_by_double_click,
    },
    {
      dialogBoxStyles: {
        position: {
          right: calculateRight(0, RightRef.RIGHT_PANEL),
          top: calculateTop(60, TopRef.TOPBAR),
        },
        arrowDirection: 'right',
      },
      hintCircle: {
        right: calculateRight(4, RightRef.RIGHT_SROLL_BAR),
        top: calculateTop(42, TopRef.TOPBAR),
        width: rightPanelInnerWidth - 15,
        height: 36,
      },
      text: LANG.newInterface.drag_to_sort,
    },
    {
      dialogBoxStyles: {
        position: {
          right: calculateRight(0, RightRef.RIGHT_PANEL),
          top: calculateTop(60, TopRef.TOPBAR),
        },
        arrowDirection: 'right',
      },
      hintCircle: {
        right: calculateRight(4, RightRef.RIGHT_SROLL_BAR),
        top: calculateTop(42, TopRef.TOPBAR),
        width: rightPanelInnerWidth - 15,
        height: layoutConstants.layerListHeight - 4,
      },
      text: LANG.newInterface.layer_controls,
    },
    {
      dialogBoxStyles: {
        position: {
          right: calculateRight(0, RightRef.RIGHT_PANEL),
          top: calculateTop(20, TopRef.TOPBAR),
        },
        arrowDirection: 'right',
      },
      hintCircle: {
        right: 2,
        top: calculateTop(2, TopRef.TOPBAR),
        width: layoutConstants.rightPanelWidth - 4,
        height: 36,
      },
      text: LANG.newInterface.switch_between_layer_panel_and_object_panel,
      callback: TutorialCallbacks.SELECT_DEFAULT_RECT,
    },
    {
      dialogBoxStyles: {
        position: {
          right: calculateRight(0, RightRef.RIGHT_PANEL),
          top: calculateTop(60, TopRef.TOPBAR),
        },
        arrowDirection: 'right',
      },
      hintCircle: {
        right: calculateRight(2, RightRef.RIGHT_SROLL_BAR),
        top: calculateTop(42, TopRef.TOPBAR),
        width: rightPanelInnerWidth - 5,
        height: 36,
      },
      text: LANG.newInterface.align_controls,
    },
    {
      dialogBoxStyles: {
        position: {
          right: calculateRight(0, RightRef.RIGHT_PANEL),
          top: calculateTop(100, TopRef.TOPBAR),
        },
        arrowDirection: 'right',
      },
      hintCircle: {
        right: calculateRight(-65, RightRef.RIGHT_PANEL),
        top: calculateTop(83, TopRef.TOPBAR),
        width: 60,
        height: 36,
      },
      text: LANG.newInterface.group_controls,
    },
    {
      dialogBoxStyles: {
        position: {
          right: calculateRight(0, RightRef.RIGHT_PANEL),
          top: calculateTop(100, TopRef.TOPBAR),
        },
        arrowDirection: 'right',
      },
      hintCircle: {
        right: calculateRight(5, RightRef.RIGHT_SROLL_BAR),
        top: calculateTop(83, TopRef.TOPBAR),
        width: 115,
        height: 36,
      },
      text: LANG.newInterface.shape_operation,
    },
    {
      dialogBoxStyles: {
        position: {
          right: calculateRight(85, RightRef.RIGHT_SROLL_BAR),
          top: calculateTop(200, TopRef.TOPBAR),
        },
        arrowDirection: 'right',
      },
      hintCircle: {
        right: calculateRight(2, RightRef.RIGHT_SROLL_BAR),
        top: calculateTop(185, TopRef.TOPBAR),
        width: 67,
        height: 34,
      },
      text: LANG.newInterface.flip,
    },
    {
      dialogBoxStyles: {
        position: {
          right: calculateRight(0, RightRef.RIGHT_PANEL),
          top: calculateTop(260, TopRef.TOPBAR),
        },
        arrowDirection: 'right',
      },
      hintCircle: {
        right: calculateRight(5, RightRef.RIGHT_SROLL_BAR),
        top: calculateTop(225, TopRef.TOPBAR),
        width: rightPanelInnerWidth - 10,
        height: 290,
      },
      text: LANG.newInterface.object_actions,
    },
  ],
};

export default {
  ...nextStepRequirements,
  NEW_USER_TUTORIAL,
  INTERFACE_TUTORIAL,
};
