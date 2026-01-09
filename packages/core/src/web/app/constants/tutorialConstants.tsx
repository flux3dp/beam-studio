import * as React from 'react';

import type { TourProps, TourStepProps } from 'antd';

import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { handleCallback } from '@core/app/views/tutorials/utils';
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

type IStep = TourStepProps & { beforeStep?: () => void };
type ITourSetting = Pick<TourProps, 'disabledInteraction'> & { steps: IStep[] };

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

const getTutorialElemFn = (key: string) => () => document.querySelector(`[data-tutorial="${key}"]`) as HTMLElement;

let mockElementDiv: HTMLDivElement | undefined = undefined;

export const prepareMultiBox = (keys: string[]): void => {
  mockElementDiv?.remove();

  const elems = keys.map((key) => getTutorialElemFn(key)());
  const bbox: DOMRect | null = elems.reduce(
    (acc, elem) => {
      const rect = elem.getBoundingClientRect();

      if (!acc) return rect;

      return {
        bottom: Math.max(acc.bottom, rect.bottom),
        height: Math.max(acc.bottom, rect.bottom) - Math.min(acc.top, rect.top),
        left: Math.min(acc.left, rect.left),
        right: Math.max(acc.right, rect.right),
        top: Math.min(acc.top, rect.top),
        width: Math.max(acc.right, rect.right) - Math.min(acc.left, rect.left),
      };
    },
    null as DOMRect | null,
  );

  if (bbox) {
    mockElementDiv = document.createElement('div')!;
    mockElementDiv.style.position = 'absolute';
    mockElementDiv.style.top = `${bbox.top + window.scrollY}px`;
    mockElementDiv.style.left = `${bbox.left + window.scrollX}px`;
    mockElementDiv.style.width = `${bbox.width}px`;
    mockElementDiv.style.height = `${bbox.height}px`;
    mockElementDiv.style.pointerEvents = 'none';
    mockElementDiv.style.zIndex = '9999';
    mockElementDiv.dataset.tutorial = 'multi-box-mock-element';
    document.body.appendChild(mockElementDiv);
  }
};

export const generateInterfaceTutorial = (): ITourSetting => {
  const {
    beambox: {
      left_panel: { label: langLeftPanel },
    },
    tutorial: t,
  } = i18n.lang;

  return {
    disabledInteraction: true,
    steps: [
      {
        placement: 'right',
        target: getTutorialElemFn('left-Preview'),
        title: t.newInterface.camera_preview,
      },
      {
        placement: 'bottom',
        target: getTutorialElemFn('select-machine-button'),
        title: t.newInterface.select_machine,
      },
      {
        placement: 'bottom',
        target: getTutorialElemFn('frame-button'),
        title: i18n.lang.topbar.frame_task,
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
        placement: 'bottom',
        target: getTutorialElemFn('go-button'),
        title: t.newInterface.start_work,
      },
      {
        beforeStep: () => {
          prepareMultiBox(['left-Cursor', 'left-Photo', 'left-Text']);
        },
        placement: 'right',
        target: getTutorialElemFn('multi-box-mock-element'),
        title: `${langLeftPanel.cursor} / ${langLeftPanel.photo} / ${langLeftPanel.text}`,
      },
      {
        beforeStep: () => {
          prepareMultiBox(['left-Element', 'left-Rectangle', 'left-Ellipse', 'left-Polygon', 'left-Line']);
        },
        placement: 'right',
        target: getTutorialElemFn('multi-box-mock-element'),
        title: t.newInterface.basic_shapes,
      },
      {
        placement: 'right',
        target: getTutorialElemFn('left-Pen'),
        title: t.newInterface.pen_tool,
      },
      {
        beforeStep: () => handleCallback(TutorialCallbacks.SCROLL_TO_ADD_LAYER),
        placement: 'left',
        target: getTutorialElemFn('add-layer-button'),
        title: t.newInterface.add_new_layer,
      },
      {
        placement: 'left',
        target: getTutorialElemFn('layer-name'),
        title: t.newInterface.rename_by_double_click,
      },
      {
        placement: 'left',
        target: getTutorialElemFn('layer-item'),
        title: t.newInterface.drag_to_sort,
      },
      {
        beforeStep: () => handleCallback(TutorialCallbacks.SCROLL_TO_ADD_LAYER),
        placement: 'left',
        // target: getTutorialElemFn('layer-list'),
        target: getTutorialElemFn('layer-item'), // TBD: 只框選第一個來避免高度超過 Floating panel
        title: t.newInterface.layer_controls,
      },
      // {
      //   callback: TutorialCallbacks.SELECT_DEFAULT_RECT,
      //   dialogBoxStyles: {
      //     arrowDirection: 'right',
      //     position: {
      //       right: calculateRight(0, RightRef.RIGHT_PANEL),
      //       top: calculateTop(20, TopRef.TOPBAR),
      //     },
      //   },
      //   hintCircle: {
      //     height: 36,
      //     right: 2,
      //     top: calculateTop(2, TopRef.TOPBAR),
      //     width: layoutConstants.rightPanelWidth - 4,
      //   },
      //   text: t.newInterface.switch_between_layer_panel_and_object_panel,
      // },
      {
        beforeStep: () => handleCallback(TutorialCallbacks.SELECT_DEFAULT_RECT),
        placement: 'left',
        target: getTutorialElemFn('object-align-buttons'),
        title: t.newInterface.align_controls,
      },
      {
        placement: 'left',
        target: getTutorialElemFn('object-group-buttons'),
        title: t.newInterface.group_controls,
      },
      {
        placement: 'left',
        target: getTutorialElemFn('object-boolean-buttons'),
        title: t.newInterface.shape_operation,
      },
      {
        placement: 'left',
        target: getTutorialElemFn('object-flip-buttons'),
        title: t.newInterface.flip,
      },
      {
        beforeStep: () => {
          prepareMultiBox(['options-panel', 'actions-panel']);
        },
        placement: 'left',
        target: getTutorialElemFn('multi-box-mock-element'),
        title: t.newInterface.object_actions,
      },
    ],
  };

  return {
    end_alert: t.newInterface.end_alert,
    hasNextButton: true,
    id: 'INTERFACE_TUTORIAL',
  };
};

export default {
  ...nextStepRequirements,
};
