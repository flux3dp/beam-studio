import React, { Fragment, memo, useMemo } from 'react';

import type { CollapseProps } from 'antd';
import { Collapse, ConfigProvider } from 'antd';
import classNames from 'classnames';

import { ButtonItem } from '@core/app/components/beambox/RightPanel/common/ObjectPanelItem';
import { ConfigPanelPopup } from '@core/app/components/beambox/RightPanel/ConfigPanel/ConfigPanel';
import ColorsPanel from '@core/app/components/beambox/RightPanel/ObjectPanel/ColorsPanel';
import LibraryPanel, { LibraryPanelTitle } from '@core/app/components/beambox/RightPanel/ObjectPanel/LibraryPanel';
import MainActionSection from '@core/app/components/beambox/RightPanel/ObjectPanel/MainActionSection';
import TemplateConfig from '@core/app/components/beambox/RightPanel/ObjectPanel/TemplateConfig';
import AlignDistSection from '@core/app/components/beambox/RightPanel/ObjectPanel/ToolPanel/AlignDistSection';
import BooleanSection from '@core/app/components/beambox/RightPanel/ObjectPanel/ToolPanel/BooleanSection';
import Divider from '@core/app/components/common/Divider';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { useIsInteractionMode } from '@core/app/stores/interactionModeStore';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import i18n from '@core/helpers/i18n';
import useI18n from '@core/helpers/useI18n';
import type { ILang } from '@core/interfaces/ILang';

import ActionsPanel from './ActionsPanel';
import DimensionPanel from './DimensionPanel/DimensionPanel';
import InfillPanel from './InfillPanel';
import ToolPanel from './ObjectPanel/ToolPanel';
import styles from './ObjectPanel.module.scss';
import OptionsPanel from './OptionsPanel';

type PanelType =
  | 'actions'
  | 'arrange'
  | 'boolean'
  | 'colors'
  | 'infill'
  | 'library'
  | 'mainActions'
  | 'options'
  | 'parameter'
  | 'templateConfig'
  | 'tools'
  | 'transform';

const panels: Record<
  PanelType,
  {
    labelKey?: keyof ILang['beambox']['right_panel']['object_panel']['sections'];
    render: (key: string, elem: SVGElement) => React.JSX.Element;
    title?: (key: string, elem: SVGElement) => React.ReactNode;
  }
> = {
  actions: {
    labelKey: 'actions',
    render: (key, elem) => <ActionsPanel elem={elem} key={key} />,
  },
  arrange: {
    render: (key) => <AlignDistSection key={key} />,
  },
  boolean: {
    render: (key) => <BooleanSection key={key} />,
  },
  colors: {
    labelKey: 'colors',
    render: (key) => <ColorsPanel key={key} />,
  },
  infill: {
    labelKey: 'operation_mode',
    render: (key) => <InfillPanel key={key} />,
  },
  library: {
    render: (key, elem) => <LibraryPanel elem={elem} key={key} />,
    title: (key, elem) => <LibraryPanelTitle elem={elem} key={key} />,
  },
  mainActions: {
    render: (key) => <MainActionSection key={key} />,
  },
  options: {
    labelKey: 'options',
    render: (key, elem) => <OptionsPanel elem={elem} key={key} />,
  },
  parameter: {
    render: (key) => (
      <Fragment key={key}>
        <ButtonItem
          icon={<ObjectPanelIcons.Parameter height="1em" viewBox="6 6 20 20" width="1em" />}
          id="parameter"
          objectPanelKey="parameter"
          title={i18n.lang.beambox.right_panel.laser_panel.parameters}
        />
        <ConfigPanelPopup objectPanelKey="parameter" />
      </Fragment>
    ),
  },
  templateConfig: {
    labelKey: 'template_config',
    render: (key) => <TemplateConfig key={key} />,
  },
  tools: {
    labelKey: 'tools',
    render: (key) => <ToolPanel key={key} />,
  },
  transform: {
    labelKey: 'transform',
    render: (key, elem) => <DimensionPanel elem={elem} key={key} />,
  },
};

interface Props {
  hide?: boolean;
}

function ObjectPanel({ hide }: Props): React.JSX.Element {
  const lang = useI18n();
  const isTablet = useIsTabletOrMobile();
  const elem = useSelectedElementStore((state) => state.selectedElement);
  const nodeCategory = useSelectedElementStore((state) => state.nodeCategory);
  const infillPanels = useSelectedElementStore((state) => state.objectPanelData?.infillPanels);
  const colorPanels = useSelectedElementStore((state) => state.objectPanelData?.colorPanels);
  const optionPanel = useSelectedElementStore((state) => state.objectPanelData?.optionPanel);
  const isProjectMode = useIsInteractionMode('project');

  const withLibrary = useMemo(
    () => isProjectMode && ['image', 'use'].includes(nodeCategory),
    [isProjectMode, nodeCategory],
  );
  const isMultiSelect = useMemo(() => nodeCategory === 'multi_select', [nodeCategory]);

  const tSections = lang.beambox.right_panel.object_panel.sections;

  const renderDesktopCollapse = (): React.JSX.Element => {
    const desktopPanels: Array<null | PanelType> = [
      'tools',
      isProjectMode && !isMultiSelect ? 'templateConfig' : null,
      'transform',
      infillPanels?.length ? 'infill' : null,
      colorPanels?.length ? 'colors' : null,
      optionPanel ? 'options' : null,
      withLibrary ? 'library' : null,
      'actions',
    ];
    const desktopItems: CollapseProps['items'] = desktopPanels
      .filter((key): key is PanelType => Boolean(key))
      .map((key) => {
        const { labelKey, render, title } = panels[key];

        return {
          children: render(key, elem!),
          forceRender: true,
          key,
          label: title ? title(key, elem!) : labelKey ? tSections[labelKey] : key,
        };
      });

    return (
      <ConfigProvider
        theme={{
          components: {
            Collapse: {
              colorTextHeading: '#1f1f1f',
              contentPadding: 0,
              fontSize: 13,
              headerPadding: '4px 12px',
            },
          },
        }}
      >
        <Collapse
          bordered={false}
          className={styles.collapse}
          defaultActiveKey={Object.keys(panels)}
          ghost
          items={desktopItems}
        />
      </ConfigProvider>
    );
  };

  const renderTabletButtons = () => {
    const tabletPanels: Array<'divider' | null | PanelType> = [
      infillPanels?.length ? 'infill' : null,
      'parameter',
      'divider',
      isProjectMode && !isMultiSelect ? 'templateConfig' : null,
      colorPanels?.length ? 'colors' : null,
      optionPanel ? 'options' : null,
      'mainActions',
      'arrange',
      'boolean',
      withLibrary ? 'library' : null,
      'transform',
      'divider',
      'actions',
    ];
    const tabletItems = tabletPanels.map((key, index) => {
      if (!key) return null;

      if (key === 'divider') return <Divider key={index} type="vertical" />;

      return panels[key].render(key, elem!);
    });

    return tabletItems;
  };

  const contents = elem ? (isTablet ? renderTabletButtons() : renderDesktopCollapse()) : null;

  return (
    <div className={classNames(styles.container, { [styles.hide]: hide })} id="object-panel">
      {contents}
    </div>
  );
}

export default memo(ObjectPanel);
