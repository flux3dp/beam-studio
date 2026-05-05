import type { ReactNode } from 'react';
import React, { memo, use } from 'react';

import { CapsuleTabs } from 'antd-mobile';

import { ContentType, type MainType } from '@core/app/constants/element-panel-constants';
import { ElementPanelContext } from '@core/app/contexts/ElementPanelContext';
import { useIsMobile } from '@core/app/stores/screenStore';
import Select from '@core/app/widgets/AntdSelect';
import useI18n from '@core/helpers/useI18n';

import styles from './ElementPanel.module.scss';

const MainTypeSelector = (): ReactNode => {
  const lang = useI18n().beambox.elements_panel;
  const isMobile = useIsMobile();
  const { activeMainType, allTypes, contentType, setActiveMainType } = use(ElementPanelContext);

  return isMobile ? (
    <CapsuleTabs
      activeKey={activeMainType}
      className={styles.select}
      onChange={(val) => setActiveMainType(val as MainType)}
    >
      {allTypes.map((key) => (
        <CapsuleTabs.Tab key={key} title={lang[key]} />
      ))}
    </CapsuleTabs>
  ) : contentType !== ContentType.MainType ? null : (
    <Select
      className={styles.select}
      onChange={setActiveMainType}
      options={allTypes.map((key) => ({ label: lang[key], value: key }))}
      popupMatchSelectWidth={false}
      value={activeMainType}
    />
  );
};

MainTypeSelector.displayName = 'MainTypeSelector';

export default memo(MainTypeSelector);
