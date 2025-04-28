import type { ReactNode } from 'react';
import React, { useContext, useEffect, useMemo, useRef } from 'react';

import { Button } from 'antd';
import { sprintf } from 'sprintf-js';

import dialogCaller from '@core/app/actions/dialog-caller';
import ThemedButton from '@core/app/components/common/ThemedButton';
import { ContentType, type MainType } from '@core/app/constants/element-panel-constants';
import { ElementPanelContext } from '@core/app/contexts/ElementPanelContext';
import { isMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './Content.module.scss';
import BuiltinElement from './Element/BuiltinElement';
import NPElement from './Element/NPElement';
import GridContent from './GridContent';

interface Props {
  types: MainType[];
}

const MainContent = ({ types }: Props): ReactNode => {
  const { contents, contentType, hasLogin, historyIcons, setActiveMainType, setActiveSubType, setSearchKey } =
    useContext(ElementPanelContext);
  const lang = useI18n().beambox.elements_panel;

  const scrollDivRef = useRef<HTMLDivElement>(null);
  const waitFirstAnimation = useRef(isMobile());
  const shadowRef = useRef<HTMLDivElement>(null);
  const handleShadow = () => {
    if (scrollDivRef.current && shadowRef.current && !waitFirstAnimation.current) {
      if (
        // add extra 5px to fix windows browser precision
        scrollDivRef.current.scrollTop + scrollDivRef.current.clientHeight + 5 >=
        scrollDivRef.current.scrollHeight
      ) {
        shadowRef.current.style.display = 'none';
      } else {
        shadowRef.current.style.display = 'block';
      }
    } else {
      if (shadowRef.current) {
        shadowRef.current.style.display = 'none';
      }

      setTimeout(handleShadow, 500);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      // Display shadow after floating panel completely opened
      waitFirstAnimation.current = false;
    }, 500);
  }, []);

  useEffect(() => {
    handleShadow();
    // Check again to make sure all icons loaded
    setTimeout(handleShadow, 300);
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [contents]);

  const isSearch = useMemo(() => contentType === ContentType.Search, [contentType]);
  const isSearchEmpty = useMemo(() => {
    if (!isSearch) return false;

    if (!contents[0]) return true;

    if (contents[0].loading || contents[0].fileNames?.length || contents[0].npIcons?.length) return false;

    return true;
  }, [isSearch, contents]);

  return (
    <div className={styles['shadow-container']}>
      <div className={styles['scroll-content']} onScroll={handleShadow} ref={scrollDivRef}>
        {!hasLogin && (
          <ThemedButton
            block
            className={styles.login}
            onClick={() => dialogCaller.showLoginDialog()}
            theme="yellow"
            type="primary"
          >
            {lang.sign_in}
          </ThemedButton>
        )}
        {isSearch && (
          <>
            <ul className={styles.hints}>
              <li>{lang.search_with_english}</li>
              <li>{lang.search_examples} flower, school building.</li>
            </ul>
            {isSearchEmpty && (
              <>
                {contents[0]?.term && (
                  <div className={styles.empty}>{sprintf(lang.search_no_results, contents[0].term)}</div>
                )}
                <div className={styles.bold}>{lang.browse_categories}</div>
                <div className={styles.categories}>
                  {types.map((key) => (
                    <Button
                      key={key}
                      onClick={() => {
                        setSearchKey(undefined);
                        setActiveSubType(undefined);
                        setActiveMainType(key);
                      }}
                      size="small"
                      type="link"
                    >
                      {lang[key]}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
        <div className={styles['icon-list']}>
          {contentType === ContentType.MainType && historyIcons.length > 0 && (
            <>
              <div className={styles.subtitle}>{lang.recently_used}</div>
              {historyIcons.map(({ npIcon, path }) =>
                path ? (
                  <BuiltinElement key={path.fileName} mainType={path.folder} path={path.fileName} />
                ) : hasLogin ? (
                  <NPElement icon={npIcon!} key={npIcon!.id} />
                ) : null,
              )}
            </>
          )}
          {contents.map((content) => (
            <GridContent content={content} key={content.term} />
          ))}
        </div>
      </div>
      <div className={styles.shadow} ref={shadowRef} />
    </div>
  );
};

export default MainContent;
