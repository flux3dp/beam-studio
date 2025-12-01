import * as React from 'react';

import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { calculateRight, calculateTop, RightRef, TopRef } from '@core/helpers/absolute-position-helper';
import i18n from '@core/helpers/i18n';
import browser from '@core/implementations/browser';
import type { ITutorial, ITutorialDialog } from '@core/interfaces/ITutorial';

import layoutConstants from './layout-constants';

export enum TutorialCallbacks {
  SCROLL_TO_ADD_LAYER = 'SCROLL_TO_ADD_LAYER',
  SCROLL_TO_PARAMETER = 'SCROLL_TO_PARAMETER',
  SELECT_DEFAULT_RECT = 'SELECT_DEFAULT_RECT',
}

const nextStepRequirements = {
  ADD_NEW_LAYER: 'ADD_NEW_LAYER',
  DRAW_A_CIRCLE: 'DRAW_A_CIRCLE',
  DRAW_A_RECT: 'DRAW_A_RECT',
  END_PREVIEW_MODE: 'END_PREVIEW_MODE',
  INFILL: 'INFILL',
  PREVIEW_PLATFORM: 'PREVIEW_PLATFORM',
  SELECT_CIRCLE: 'SELECT_CIRCLE',
  SELECT_RECT: 'SELECT_RECT',
  SEND_FILE: 'SEND_FILE',
  SET_PRESET_WOOD_CUTTING: 'SET_PRESET_WOOD_CUTTING',
  SET_PRESET_WOOD_ENGRAVING: 'SET_PRESET_WOOD_ENGRAVING',
  TO_LAYER_PANEL: 'TO_LAYER_PANEL',
  TO_OBJECT_PANEL: 'TO_OBJECT_PANEL',
  TO_PREVIEW_MODE: 'TO_PREVIEW_MODE',
};

const rightPanelInnerWidth = layoutConstants.rightPanelWidth - layoutConstants.rightPanelScrollBarWidth;

const adjustFocusLinkClick = () => {
  // TODO: Add adjust focus link for Beambox2
  browser.open(i18n.lang.tutorial.links.adjust_focus);
};

export const generateNewUserTutorial = (workarea: WorkAreaModel): ITutorial => {
  const { tutorial: t } = i18n.lang;
  const isBm2 = workarea === 'fbm2';
  const autoSwitch = useGlobalPreferenceStore.getState()['auto-switch-tab'];

  const dialogStylesAndContents: Array<ITutorialDialog | null> = [
    isBm2
      ? {
          subElement: (
            <div>
              <video autoPlay loop muted>
                <source src="video/bm2-focus.webm" type="video/webm" />
                <source src="video/bm2-focus.mp4" type="video/mp4" />
              </video>
              <div>{t.newUser.put_wood}</div>
              <div>{t.newUser.adjust_focus}</div>
              <div>{t.newUser.close_cover}</div>
            </div>
          ),
          text: t.newUser.start_tutorial,
        }
      : null,
    {
      dialogBoxStyles: {
        position: { left: 56, top: calculateTop(0.5, TopRef.ToolButton) },
      },
      hintCircle: {
        height: layoutConstants.toolButtonHeight,
        left: 3,
        top: calculateTop(0, TopRef.ToolButton),
        width: layoutConstants.toolButtonHeight,
      },
      holePosition: { left: 3, top: calculateTop(0, TopRef.ToolButton) },
      holeSize: { height: layoutConstants.toolButtonHeight, width: layoutConstants.toolButtonHeight },
      nextStepRequirement: isBm2 ? nextStepRequirements.PREVIEW_PLATFORM : nextStepRequirements.TO_PREVIEW_MODE,
      text: t.newUser.switch_to_preview_mode,
    },
    isBm2
      ? null
      : {
          dialogBoxStyles: {
            position: {
              get left(): number {
                return window.innerWidth - layoutConstants.rightPanelWidth;
              },
              top: calculateTop(260, TopRef.TOPBAR),
            },
          },
          hintCircle: {
            get height(): number {
              return window.innerHeight - layoutConstants.topBarHeight - 10;
            },
            left: 55,
            top: calculateTop(5, TopRef.TOPBAR),
            get width(): number {
              return window.innerWidth - layoutConstants.sidePanelsWidth - 10;
            },
          },
          holePosition: { left: 50, right: layoutConstants.rightPanelWidth, top: calculateTop(0) },
          holeSize: {},
          nextStepRequirement: nextStepRequirements.PREVIEW_PLATFORM,
          subElement: (
            <div className="sub-content">
              <div className="sub-line">{t.newUser.put_wood}</div>
              <div className="sub-line">
                {t.newUser.adjust_focus}
                <div className="hint-mark" onClick={adjustFocusLinkClick}>
                  ?
                </div>
              </div>
              <div className="sub-line">{t.newUser.close_cover}</div>
            </div>
          ),
          text: t.newUser.preview_the_platform,
        },
    {
      dialogBoxStyles: {
        position: { left: 35, top: 16 },
      },
      hintCircle: {
        height: layoutConstants.toolButtonHeight,
        left: -9,
        top: -4,
        width: layoutConstants.toolButtonHeight,
      },
      holePosition: { left: -9, top: -4 },
      holeSize: { height: layoutConstants.toolButtonHeight, width: layoutConstants.toolButtonHeight },
      nextStepRequirement: nextStepRequirements.END_PREVIEW_MODE,
      refElementId: 'end-preview-mode',
      text: t.newUser.end_preview_mode,
    },
    {
      dialogBoxStyles: {
        position: { left: 56, top: calculateTop(5.5, TopRef.ToolButton) },
      },
      hintCircle: {
        height: layoutConstants.toolButtonHeight,
        left: 3,
        top: calculateTop(5, TopRef.ToolButton),
        width: layoutConstants.toolButtonHeight,
      },
      holePosition: { left: 3, top: calculateTop(5, TopRef.ToolButton) },
      holeSize: { height: layoutConstants.toolButtonHeight, width: layoutConstants.toolButtonHeight },
      nextStepRequirement: nextStepRequirements.SELECT_RECT,
      text: t.newUser.draw_a_rect,
    },
    {
      callback: TutorialCallbacks.SCROLL_TO_PARAMETER,
      dialogBoxStyles: {
        position: {
          get left(): number {
            return window.innerWidth - layoutConstants.rightPanelWidth;
          },
          top: calculateTop(260, TopRef.TOPBAR),
        },
      },
      hintCircle: {
        get height(): number {
          return window.innerHeight - layoutConstants.topBarHeight - 10;
        },
        left: 55,
        top: calculateTop(5, TopRef.TOPBAR),
        get width(): number {
          return window.innerWidth - layoutConstants.sidePanelsWidth - 10;
        },
      },
      holePosition: { left: 50, right: layoutConstants.rightPanelWidth, top: calculateTop(40) },
      holeSize: {},
      nextStepRequirement: nextStepRequirements.DRAW_A_RECT,
      text: t.newUser.drag_to_draw,
    },
    {
      callback: TutorialCallbacks.SCROLL_TO_ADD_LAYER,
      dialogBoxStyles: {
        arrowDirection: 'right',
        position: {
          right: calculateRight(4, RightRef.RIGHT_PANEL),
          get top(): number {
            return calculateTop(56, TopRef.LAYER_PARAMS);
          },
        },
      },
      hintCircle: {
        height: 40,
        right: calculateRight(45, RightRef.RIGHT_SCROLL_BAR),
        get top(): number {
          return calculateTop(36, TopRef.LAYER_PARAMS);
        },
        width: rightPanelInnerWidth - 55,
      },
      holePosition: {
        right: calculateRight(45, RightRef.RIGHT_SCROLL_BAR),
        get top(): number {
          return calculateTop(44, TopRef.LAYER_PARAMS);
        },
      },
      holeSize: { height: 30, width: rightPanelInnerWidth - 60 },
      nextStepRequirement: nextStepRequirements.SET_PRESET_WOOD_CUTTING,
      text: t.newUser.set_preset_wood_cut,
    },
    {
      dialogBoxStyles: {
        arrowDirection: 'right',
        position: {
          right: calculateRight(40, RightRef.RIGHT_SCROLL_BAR),
          top: calculateTop(11, TopRef.LAYER_LIST),
        },
      },
      hintCircle: {
        height: 30,
        right: calculateRight(2, RightRef.RIGHT_SCROLL_BAR),
        top: calculateTop(-4, TopRef.LAYER_LIST),
        width: 30,
      },
      holePosition: {
        right: calculateRight(0, RightRef.RIGHT_SCROLL_BAR),
        top: calculateTop(-8, TopRef.LAYER_LIST),
      },
      holeSize: { height: 35, width: 35 },
      nextStepRequirement: nextStepRequirements.ADD_NEW_LAYER,
      text: t.newUser.add_new_layer,
    },
    {
      dialogBoxStyles: {
        position: { left: 56, top: calculateTop(6.5, TopRef.ToolButton) },
      },
      hintCircle: {
        height: layoutConstants.toolButtonHeight,
        left: 3,
        top: calculateTop(6, TopRef.ToolButton),
        width: layoutConstants.toolButtonHeight,
      },
      holePosition: { left: 3, top: calculateTop(6, TopRef.ToolButton) },
      holeSize: { height: layoutConstants.toolButtonHeight, width: layoutConstants.toolButtonHeight },
      nextStepRequirement: nextStepRequirements.SELECT_CIRCLE,
      text: t.newUser.draw_a_circle,
    },
    {
      dialogBoxStyles: {
        position: {
          get left(): number {
            return window.innerWidth - layoutConstants.rightPanelWidth;
          },
          top: calculateTop(260, TopRef.TOPBAR),
        },
      },
      hintCircle: {
        get height(): number {
          return window.innerHeight - layoutConstants.topBarHeight - 10;
        },
        left: 55,
        top: calculateTop(5, TopRef.TOPBAR),
        get width(): number {
          return window.innerWidth - layoutConstants.sidePanelsWidth - 10;
        },
      },
      holePosition: {
        left: 50,
        right: layoutConstants.rightPanelWidth,
        top: calculateTop(0, TopRef.TOPBAR),
      },
      holeSize: {},
      nextStepRequirement: nextStepRequirements.DRAW_A_CIRCLE,
      text: t.newUser.drag_to_draw,
    },
    autoSwitch
      ? null
      : {
          dialogBoxStyles: {
            arrowDirection: 'right',
            position: {
              right: 44,
              top: calculateTop(20, TopRef.TOPBAR),
            },
          },
          hintCircle: {
            height: 40,
            right: 0,
            top: calculateTop(0, TopRef.TOPBAR),
            width: 40,
          },
          holePosition: {
            right: 0,
            top: calculateTop(0, TopRef.TOPBAR),
          },
          holeSize: { height: 40, width: 32 },
          nextStepRequirement: nextStepRequirements.TO_OBJECT_PANEL,
          text: t.newUser.switch_to_object_panel,
        },
    {
      dialogBoxStyles: {
        arrowDirection: 'right',
        position: {
          right: calculateRight(4, RightRef.RIGHT_PANEL),
          top: calculateTop(272, TopRef.TOPBAR),
        },
      },
      hintCircle: {
        height: 30,
        right: calculateRight(-35, RightRef.RIGHT_PANEL),
        top: calculateTop(255, TopRef.TOPBAR),
        width: 30,
      },
      holePosition: {
        right: calculateRight(-40, RightRef.RIGHT_PANEL),
        top: calculateTop(250, TopRef.TOPBAR),
      },
      holeSize: { height: 40, width: 40 },
      nextStepRequirement: nextStepRequirements.INFILL,
      text: t.newUser.infill,
    },
    {
      callback: TutorialCallbacks.SCROLL_TO_PARAMETER,
      dialogBoxStyles: {
        arrowDirection: 'right',
        position: {
          right: calculateRight(4, RightRef.RIGHT_PANEL),
          top: calculateTop(20, TopRef.TOPBAR),
        },
      },
      hintCircle: {
        height: 40,
        right: calculateRight(-36, RightRef.RIGHT_PANEL),
        top: calculateTop(0, TopRef.TOPBAR),
        width: 40,
      },
      holePosition: {
        right: calculateRight(-31, RightRef.RIGHT_PANEL),
        top: calculateTop(0, TopRef.TOPBAR),
      },
      holeSize: { height: 40, width: 32 },
      nextStepRequirement: nextStepRequirements.TO_LAYER_PANEL,
      text: t.newUser.switch_to_layer_panel,
    },
    {
      dialogBoxStyles: {
        arrowDirection: 'right',
        position: {
          right: calculateRight(4, RightRef.RIGHT_PANEL),
          get top(): number {
            return calculateTop(56, TopRef.LAYER_PARAMS);
          },
        },
      },
      hintCircle: {
        height: 40,
        right: calculateRight(45, RightRef.RIGHT_SCROLL_BAR),
        get top(): number {
          return calculateTop(36, TopRef.LAYER_PARAMS);
        },
        width: rightPanelInnerWidth - 55,
      },
      holePosition: {
        right: calculateRight(45, RightRef.RIGHT_SCROLL_BAR),
        get top(): number {
          return calculateTop(44, TopRef.LAYER_PARAMS);
        },
      },
      holeSize: { height: 30, width: rightPanelInnerWidth - 60 },
      nextStepRequirement: nextStepRequirements.SET_PRESET_WOOD_ENGRAVING,
      text: t.newUser.set_preset_wood_engraving,
    },
    {
      dialogBoxStyles: {
        arrowDirection: 'top',
        arrowPadding: 7,
        position: { right: 21, top: calculateTop(0, TopRef.TOPBAR) },
      },
      hintCircle: {
        height: 36,
        right: 6,
        top: calculateTop(2),
        width: 36,
      },
      holePosition: { left: 0, top: calculateTop(0) },
      holeSize: {},
      nextStepRequirement: nextStepRequirements.SEND_FILE,
      text: t.newUser.send_the_file,
    },
  ];

  return {
    dialogStylesAndContents: dialogStylesAndContents.filter(Boolean),
    end_alert: t.newUser.end_alert,
    id: 'NEW_USER_TUTORIAL',
  };
};

export const generateInterfaceTutorial = (): ITutorial => {
  const {
    beambox: {
      left_panel: { label: langLeftPanel },
    },
    tutorial: t,
  } = i18n.lang;

  return {
    dialogStylesAndContents: [
      {
        dialogBoxStyles: {
          position: { left: 56, top: calculateTop(0.5, TopRef.ToolButton) },
        },
        hintCircle: {
          height: layoutConstants.toolButtonHeight,
          left: 3,
          top: calculateTop(0, TopRef.ToolButton),
          width: layoutConstants.toolButtonHeight,
        },
        text: t.newInterface.camera_preview,
      },
      {
        dialogBoxStyles: {
          arrowDirection: 'top',
          position: {
            get right(): number {
              return calculateRight(212, RightRef.PATH_PREVIEW_BTN);
            },
            top: calculateTop(10, TopRef.TOPBAR),
          },
        },
        hintCircle: {
          height: 36,
          get right(): number {
            return calculateRight(192, RightRef.PATH_PREVIEW_BTN);
          },
          top: calculateTop(2),
          width: 150,
        },
        text: t.newInterface.select_machine,
      },
      {
        dialogBoxStyles: {
          arrowDirection: 'top',
          position: {
            get right(): number {
              return calculateRight(58, RightRef.PATH_PREVIEW_BTN);
            },
            top: calculateTop(10, TopRef.TOPBAR),
          },
        },
        hintCircle: {
          height: 36,
          get right(): number {
            return calculateRight(42, RightRef.PATH_PREVIEW_BTN);
          },
          top: calculateTop(2),
          width: 36,
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
          arrowDirection: 'top',
          arrowPadding: 8,
          position: { right: 24, top: calculateTop(10, TopRef.TOPBAR) },
        },
        hintCircle: {
          height: 36,
          right: 6,
          top: calculateTop(2),
          width: 36,
        },
        text: t.newInterface.start_work,
      },
      {
        dialogBoxStyles: {
          position: { left: 56, top: calculateTop(2, TopRef.ToolButton) },
        },
        hintCircle: {
          height: layoutConstants.toolButtonHeight * 3,
          left: 3,
          top: calculateTop(1, TopRef.ToolButton),
          width: layoutConstants.toolButtonHeight,
        },
        text: `${langLeftPanel.cursor} / ${langLeftPanel.photo} / ${langLeftPanel.text}`,
      },
      {
        dialogBoxStyles: {
          position: { left: 56, top: calculateTop(5, TopRef.ToolButton) },
        },
        hintCircle: {
          height: layoutConstants.toolButtonHeight * 5,
          left: 3,
          top: calculateTop(4, TopRef.ToolButton),
          width: layoutConstants.toolButtonHeight,
        },
        text: t.newInterface.basic_shapes,
      },
      {
        callback: TutorialCallbacks.SCROLL_TO_ADD_LAYER,
        dialogBoxStyles: {
          position: { left: 56, top: calculateTop(9.5, TopRef.ToolButton) },
        },
        hintCircle: {
          height: layoutConstants.toolButtonHeight,
          left: 3,
          top: calculateTop(9, TopRef.ToolButton),
          width: layoutConstants.toolButtonHeight,
        },
        text: t.newInterface.pen_tool,
      },
      {
        dialogBoxStyles: {
          arrowDirection: 'right',
          position: {
            right: calculateRight(45, RightRef.RIGHT_SCROLL_BAR),
            top: calculateTop(11, TopRef.LAYER_LIST),
          },
        },
        hintCircle: {
          height: 30,
          right: calculateRight(2, RightRef.RIGHT_SCROLL_BAR),
          top: calculateTop(-4, TopRef.LAYER_LIST),
          width: 30,
        },
        text: t.newInterface.add_new_layer,
      },
      {
        dialogBoxStyles: {
          arrowDirection: 'right',
          position: {
            right: calculateRight(-30, RightRef.RIGHT_PANEL),
            top: calculateTop(60, TopRef.TOPBAR),
          },
        },
        hintCircle: {
          height: 36,
          right: calculateRight(60, RightRef.RIGHT_SCROLL_BAR),
          top: calculateTop(42, TopRef.TOPBAR),
          width: 145,
        },
        text: t.newInterface.rename_by_double_click,
      },
      {
        dialogBoxStyles: {
          arrowDirection: 'right',
          position: {
            right: calculateRight(0, RightRef.RIGHT_PANEL),
            top: calculateTop(60, TopRef.TOPBAR),
          },
        },
        hintCircle: {
          height: 36,
          right: calculateRight(4, RightRef.RIGHT_SCROLL_BAR),
          top: calculateTop(42, TopRef.TOPBAR),
          width: rightPanelInnerWidth - 15,
        },
        text: t.newInterface.drag_to_sort,
      },
      {
        dialogBoxStyles: {
          arrowDirection: 'right',
          position: {
            right: calculateRight(0, RightRef.RIGHT_PANEL),
            top: calculateTop(60, TopRef.TOPBAR),
          },
        },
        hintCircle: {
          height: layoutConstants.layerListHeight - 4,
          right: calculateRight(4, RightRef.RIGHT_SCROLL_BAR),
          top: calculateTop(42, TopRef.TOPBAR),
          width: rightPanelInnerWidth - 15,
        },
        text: t.newInterface.layer_controls,
      },
      {
        callback: TutorialCallbacks.SELECT_DEFAULT_RECT,
        dialogBoxStyles: {
          arrowDirection: 'right',
          position: {
            right: calculateRight(0, RightRef.RIGHT_PANEL),
            top: calculateTop(20, TopRef.TOPBAR),
          },
        },
        hintCircle: {
          height: 36,
          right: 2,
          top: calculateTop(2, TopRef.TOPBAR),
          width: layoutConstants.rightPanelWidth - 4,
        },
        text: t.newInterface.switch_between_layer_panel_and_object_panel,
      },
      {
        dialogBoxStyles: {
          arrowDirection: 'right',
          position: {
            right: calculateRight(0, RightRef.RIGHT_PANEL),
            top: calculateTop(60, TopRef.TOPBAR),
          },
        },
        hintCircle: {
          height: 36,
          right: calculateRight(2, RightRef.RIGHT_SCROLL_BAR),
          top: calculateTop(42, TopRef.TOPBAR),
          width: rightPanelInnerWidth - 5,
        },
        text: t.newInterface.align_controls,
      },
      {
        dialogBoxStyles: {
          arrowDirection: 'right',
          position: {
            right: calculateRight(0, RightRef.RIGHT_PANEL),
            top: calculateTop(100, TopRef.TOPBAR),
          },
        },
        hintCircle: {
          height: 36,
          right: calculateRight(-65, RightRef.RIGHT_PANEL),
          top: calculateTop(83, TopRef.TOPBAR),
          width: 60,
        },
        text: t.newInterface.group_controls,
      },
      {
        dialogBoxStyles: {
          arrowDirection: 'right',
          position: {
            right: calculateRight(0, RightRef.RIGHT_PANEL),
            top: calculateTop(100, TopRef.TOPBAR),
          },
        },
        hintCircle: {
          height: 36,
          right: calculateRight(5, RightRef.RIGHT_SCROLL_BAR),
          top: calculateTop(83, TopRef.TOPBAR),
          width: 115,
        },
        text: t.newInterface.shape_operation,
      },
      {
        dialogBoxStyles: {
          arrowDirection: 'right',
          position: {
            right: calculateRight(85, RightRef.RIGHT_SCROLL_BAR),
            top: calculateTop(200, TopRef.TOPBAR),
          },
        },
        hintCircle: {
          height: 34,
          right: calculateRight(2, RightRef.RIGHT_SCROLL_BAR),
          top: calculateTop(185, TopRef.TOPBAR),
          width: 67,
        },
        text: t.newInterface.flip,
      },
      {
        dialogBoxStyles: {
          arrowDirection: 'right',
          position: {
            right: calculateRight(0, RightRef.RIGHT_PANEL),
            top: calculateTop(260, TopRef.TOPBAR),
          },
        },
        hintCircle: {
          height: 360,
          right: calculateRight(5, RightRef.RIGHT_SCROLL_BAR),
          top: calculateTop(225, TopRef.TOPBAR),
          width: rightPanelInnerWidth - 10,
        },
        text: t.newInterface.object_actions,
      },
    ],
    end_alert: t.newInterface.end_alert,
    hasNextButton: true,
    id: 'INTERFACE_TUTORIAL',
  };
};

export default {
  ...nextStepRequirements,
};
