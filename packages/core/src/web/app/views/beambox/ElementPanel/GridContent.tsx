import type { ReactNode } from 'react';
import React from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import { type Content, useElementPanelStore } from '@core/app/stores/elementPanelStore';
import useI18n from '@core/helpers/useI18n';

import styles from './Content.module.scss';
import BuiltinElement from './Element/BuiltinElement';
import NPElement from './Element/NPElement';
import Skeleton from './Element/Skeleton';

interface Props {
  content: Content;
}

const GridContent = ({ content }: Props): ReactNode => {
  const getNPIcons = useElementPanelStore((s) => s.getNPIcons);
  const hasLogin = useElementPanelStore((s) => s.hasLogin);
  const setActiveSubType = useElementPanelStore((s) => s.setActiveSubType);
  const lang = useI18n().beambox.elements_panel;

  return (
    <>
      {content.subType &&
        (hasLogin ? (
          <Button
            block
            className={styles.subtitle}
            icon={<RightOutlined />}
            iconPosition="end"
            onClick={() => setActiveSubType(content.subType)}
            type="text"
          >
            {lang[content.subType]}
          </Button>
        ) : (
          <div className={styles.subtitle}>{lang[content.subType]}</div>
        ))}
      {content.fileNames?.map((fileName) => (
        <BuiltinElement key={fileName} mainType={content.mainType} path={fileName} />
      ))}
      {hasLogin && (
        <>
          {content.npIcons?.map((icon) => <NPElement icon={icon} key={icon.id} />)}
          {content.loading ? (
            <Skeleton count={100} />
          ) : (
            content.nextPage && (
              <Button block className={styles.more} onClick={() => getNPIcons(content)}>
                {lang.load_more}
              </Button>
            )
          )}
        </>
      )}
    </>
  );
};

export default GridContent;
