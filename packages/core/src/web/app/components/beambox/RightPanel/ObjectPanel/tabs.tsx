import Tabs from '@core/app/components/beambox/RightPanel/common/Tabs';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { templateModes, withinInteractionModes } from '@core/app/stores/interactionModeStore';
import { ControlType } from '@core/helpers/element/editable/base';
import i18n from '@core/helpers/i18n';
import type { ILang } from '@core/interfaces/ILang';

export type TabKey =
  | 'content_library'
  | 'dimensions'
  | 'fit_text_align'
  | 'font'
  | 'infillPanel'
  | 'infillPathPanel'
  | 'letter_spacing'
  | 'line_spacing'
  | 'text_content'
  | 'text_style'
  | 'textpath_align'
  | 'textpath_offset';

type TabConfig = {
  controlTypes?: ControlType[];
  getLabel: (i18n: ILang) => React.ReactNode;
  key?: TabKey;
  subTabs?: TabKey[];
};

const tabConfigs: {
  [key in TabKey]: TabConfig;
} = {
  content_library: {
    controlTypes: [ControlType.LIBRARY],
    getLabel: (i18n) => i18n.beambox.right_panel.object_panel.sections.library,
    key: 'content_library',
  },
  dimensions: {
    controlTypes: [
      ControlType.POSITION_X,
      ControlType.POSITION_Y,
      ControlType.POSITION_X2,
      ControlType.POSITION_Y2,
      ControlType._SIZE,
      ControlType.ROTATION,
      ControlType._FLIP,
    ],
    getLabel: (i18n) => i18n.beambox.right_panel.object_panel.sections.transform,
    key: 'dimensions',
  },
  fit_text_align: {
    controlTypes: [ControlType.FIT_TEXT_ALIGN],
    getLabel: () => <OptionPanelIcons.AlignCenter />,
    key: 'fit_text_align',
  },
  font: {
    controlTypes: [ControlType.FONT_FAMILY, ControlType.FONT_STYLE, ControlType.FONT_SIZE],
    getLabel: () => <LeftPanelIcons.Text viewBox="4 4 24 24" />,
    key: 'font',
  },
  infillPanel: {
    controlTypes: [ControlType.INFILL],
    getLabel: (i18n) => i18n.beambox.right_panel.object_panel.sections.operation_mode,
  },
  infillPathPanel: {
    controlTypes: [ControlType.PATH_INFILL],
    getLabel: (i18n) =>
      `${i18n.beambox.right_panel.object_panel.sections.operation_mode} ${i18n.topbar.tag_names.path}`,
  },
  letter_spacing: {
    controlTypes: [ControlType.LETTER_SPACING],
    getLabel: () => <OptionPanelIcons.LetterSpacing viewBox="7 7 18 18" />,
    key: 'letter_spacing',
  },
  line_spacing: {
    controlTypes: [ControlType.LINE_SPACING],
    getLabel: () => <OptionPanelIcons.LineSpacing viewBox="6 6 18 18" />,
    key: 'line_spacing',
  },
  text_content: {
    controlTypes: [ControlType.TEXT_CONTENT, ControlType.TEXT_TRANSFORM, ControlType.TEXT_VERTICAL],
    getLabel: (i18n) => i18n.beambox.right_panel.object_panel.sections.text_content,
    key: 'text_content',
  },
  text_style: {
    getLabel: (i18n) => i18n.beambox.right_panel.object_panel.sections.text_style,
    key: 'text_style',
    subTabs: ['font', 'fit_text_align', 'textpath_align', 'textpath_offset', 'line_spacing', 'letter_spacing'],
  },
  textpath_align: {
    controlTypes: [ControlType.TEXTPATH_ALIGN],
    getLabel: () => <OptionPanelIcons.TextpathAlignMiddle viewBox="2 2 20 20" />,
    key: 'textpath_align',
  },
  textpath_offset: {
    controlTypes: [ControlType.TEXTPATH_OFFSET],
    getLabel: () => <OptionPanelIcons.TextpathOffset viewBox="4 4 16 16" />,
    key: 'textpath_offset',
  },
};

export const displayTabs = (tabs: TabKey[], tabsComponents: { [key in TabKey]?: React.ReactNode }): React.ReactNode => {
  const isWithinTemplateModes = withinInteractionModes(templateModes);
  const { controllableTypes, editableInfo } = useSelectedElementStore.getState();

  const isAnySupported = (controlTypes?: ControlType[]) => {
    if (!controlTypes) return true;

    if (isWithinTemplateModes) return controlTypes.some((type) => editableInfo?.[type]?.value);

    return controlTypes.some((type) => controllableTypes.includes(type));
  };

  const visibleTabs = [];

  for (const tabKey of tabs) {
    const config = tabConfigs[tabKey];

    if (!config) continue;

    if (config.subTabs) {
      const subTabs = config.subTabs
        .filter((subTabKey) => {
          const subConfig = tabConfigs[subTabKey];

          return subConfig && isAnySupported(subConfig.controlTypes) && tabsComponents[subTabKey];
        })
        .map((subTabKey) => ({
          children: tabsComponents[subTabKey],
          key: subTabKey,
          label: tabConfigs[subTabKey]!.getLabel(i18n.lang),
        }));

      if (subTabs.length === 0) continue;

      visibleTabs.push({
        children: <Tabs items={subTabs} />,
        key: tabKey,
        label: config.getLabel(i18n.lang),
      });
    } else if (isAnySupported(config.controlTypes) && tabsComponents[tabKey]) {
      visibleTabs.push({
        children: tabsComponents[tabKey],
        key: tabKey,
        label: config.getLabel(i18n.lang),
      });
    }
  }

  if (visibleTabs.length === 0) return null;

  if (visibleTabs.length === 1) return visibleTabs[0].children;

  return <Tabs items={visibleTabs} />;
};
