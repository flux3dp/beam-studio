import type { ReactNode } from 'react';
import React, { use } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import { type Content, ElementPanelContext } from '@core/app/contexts/ElementPanelContext';
import useI18n from '@core/helpers/useI18n';

import styles from './Content.module.scss';
import BuiltinElement from './Element/BuiltinElement';
import NPElement from './Element/NPElement';
import Skeleton from './Element/Skeleton';

interface Props {
  content: Content;
}

const GridContent = ({ content }: Props): ReactNode => {
  const { getNPIcons, hasLogin, setActiveSubType } = use(ElementPanelContext);
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
