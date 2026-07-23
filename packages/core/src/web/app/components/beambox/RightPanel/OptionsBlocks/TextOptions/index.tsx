import React, { memo } from 'react';

import { ConfigProvider } from 'antd';
import classNames from 'classnames';

import { ObjectPanelItem } from '@core/app/components/beambox/RightPanel/common/ObjectPanelItem';
import { useTextOptions } from '@core/app/components/beambox/RightPanel/ObjectPanel/helper';
import { displayTabs } from '@core/app/components/beambox/RightPanel/ObjectPanel/tabs';
import { selectTheme } from '@core/app/constants/antd-config';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';

const TextOptions = () => {
  const lang = useI18n();
  const isTablet = useIsTabletOrMobile();
  const selectedElement = useSelectedElementStore((state) => state.selectedElement);
  const textElements = useSelectedElementStore((state) => state.objectPanelData!.textElems);

  const textOptions = useTextOptions({ elem: selectedElement as SVGElement, textElements });

  return (
    <>
      {isTablet ? (
        <ObjectPanelItem
          icon={<LeftPanelIcons.Text />}
          id="text-option"
          renderContent={() => displayTabs(['text_content', 'text_style'], textOptions)}
          title={lang.beambox.right_panel.object_panel.sections.options}
        />
      ) : (
        <ConfigProvider theme={selectTheme}>
          <div className={styles.panel}>
            {textOptions.text_content_block}
            {textOptions.text_transform}
            {textOptions.font_block}
            <div className={styles.row}>{textOptions.fit_text_align}</div>
            <div className={styles.row}>{textOptions.textpath_align}</div>
            <div className={classNames(styles.row, styles.multi)}>
              {textOptions.line_spacing}
              {textOptions.letter_spacing}
              {textOptions.font_size}
              {textOptions.vertical_switch}
            </div>
            {textOptions.textpath_offset}
            {textOptions.variable_text}
          </div>
        </ConfigProvider>
      )}
    </>
  );
};

export default memo(TextOptions);
