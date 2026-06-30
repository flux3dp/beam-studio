import React, { memo } from 'react';

import { ConfigProvider } from 'antd';

import { ObjectPanelItem } from '@core/app/components/beambox/RightPanel/common/ObjectPanelItem';
import { useTextOptions } from '@core/app/components/beambox/RightPanel/ObjectPanel/helper';
import { displayTabs } from '@core/app/components/beambox/RightPanel/ObjectPanel/tabs';
import { selectTheme } from '@core/app/constants/antd-config';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { useIsTabletOrMobile } from '@core/app/stores/screenStore';
import { mockT } from '@core/helpers/is-dev';

import styles from './index.module.scss';

const TextOptions = () => {
  const isTablet = useIsTabletOrMobile();
  const selectedElement = useSelectedElementStore((state) => state.selectedElement);
  const visibleTextOptions = useSelectedElementStore((state) => state.objectPanelData!.textOptions);
  const textElements = useSelectedElementStore((state) => state.objectPanelData!.textElems);

  const textOptions = useTextOptions({ elem: selectedElement as SVGElement, textElements });

  return (
    <>
      {isTablet ? (
        <ObjectPanelItem
          icon={<LeftPanelIcons.Text />}
          id="text-option"
          renderContent={() => displayTabs(['text_content', 'text_style'], textOptions)}
          title={mockT('編輯物件')}
        />
      ) : (
        <ConfigProvider theme={selectTheme}>
          <div className={styles.panel}>
            {visibleTextOptions.has('text_content') && textOptions.text_content_block}
            {visibleTextOptions.has('font') && textOptions.font_block}
            {visibleTextOptions.has('fit_text_align') && <div className={styles.row}>{textOptions.fit_text_align}</div>}
            <div className={styles.row}>
              {visibleTextOptions.has('line_spacing') && textOptions.line_spacing}
              {visibleTextOptions.has('letter_spacing') && textOptions.letter_spacing}
              {visibleTextOptions.has('font_size') && textOptions.font_size}
              {visibleTextOptions.has('vertical_switch') && textOptions.vertical_switch}
              {visibleTextOptions.has('start_offset') && textOptions.textpath_offset}
              {visibleTextOptions.has('vertical_align') && textOptions.textpath_align}
            </div>
            {visibleTextOptions.has('variable_text') && textOptions.variable_text}
          </div>
        </ConfigProvider>
      )}
    </>
  );
};

export default memo(TextOptions);
