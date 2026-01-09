import type { ReactNode } from 'react';
import React, { useContext, useMemo, useRef, useState } from 'react';

import { LeftOutlined, SearchOutlined } from '@ant-design/icons';
import type { InputRef } from 'antd';
import { Button, Input, message } from 'antd';
import { CapsuleTabs } from 'antd-mobile';
import classNames from 'classnames';

import type { MainType } from '@core/app/constants/element-panel-constants';
import { ContentType, MainTypes, NPTypes } from '@core/app/constants/element-panel-constants';
import layoutConstants from '@core/app/constants/layout-constants';
import { ElementPanelContext, ElementPanelProvider } from '@core/app/contexts/ElementPanelContext';
import Select from '@core/app/widgets/AntdSelect';
import FloatingPanel from '@core/app/widgets/FloatingPanel';
import ToolBarDrawer from '@core/app/widgets/ToolBarDrawer';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './ElementPanel.module.scss';
import MainContent from './MainContent';

const mode = 'element-panel';

export const ElementPanelContent = (): ReactNode => {
  const {
    activeMainType,
    activeSubType,
    closeDrawer,
    contentType,
    hasLogin,
    open,
    searchKey,
    setActiveMainType,
    setActiveSubType,
    setSearchKey,
    updateSearchContents,
  } = useContext(ElementPanelContext);
  const [error, setError] = useState(false);
  const lang = useI18n().beambox.elements_panel;
  const isMobile = useIsMobile();
  const anchors = [0, window.innerHeight - layoutConstants.menubarHeight];
  const inputRef = useRef<InputRef>(null);

  const allTypes = useMemo(() => (hasLogin ? [...MainTypes, ...NPTypes] : MainTypes), [hasLogin]);

  const backButton = useMemo(() => {
    let onClick: (() => void) | undefined = undefined;
    let text: string | undefined = undefined;

    if (contentType === ContentType.Search) {
      onClick = () => {
        setSearchKey(undefined);
        setActiveSubType(activeSubType);
      };
    } else if (contentType === ContentType.SubType) {
      onClick = () => {
        setActiveSubType(undefined);
      };
      text = lang[activeSubType!];
    }

    if (onClick || isMobile) {
      return (
        <Button
          className={classNames(styles['back-button'], { [styles.invisible]: !onClick })}
          icon={<LeftOutlined />}
          onClick={onClick}
          type="text"
        >
          {text}
        </Button>
      );
    }

    return null;
  }, [contentType, isMobile, setSearchKey, setActiveSubType, activeSubType, lang]);

  const searchBar = useMemo(() => {
    const handleSearch = (key: string) => {
      if (/^[A-Za-z0-9, ]*$/.test(key || '')) {
        inputRef.current?.blur();
        setError(false);
        updateSearchContents(key);
      } else {
        setError(true);
        message.error(lang.search_invalid_characters);
      }
    };

    return (
      <div className={styles['search-bar']}>
        <Input
          allowClear
          className={styles['search-input']}
          maxLength={50}
          onChange={(e) => {
            setError(false);
            setSearchKey(e.target.value);
          }}
          onClear={() => handleSearch('')}
          onPressEnter={() => handleSearch(searchKey || '')}
          ref={inputRef}
          size="small"
          status={error ? 'error' : undefined}
          type="search"
          value={searchKey}
        />
        <Button
          className={styles['search-button']}
          icon={<SearchOutlined />}
          onClick={() => {
            if (contentType === ContentType.Search) {
              handleSearch(searchKey || '');
            } else {
              setSearchKey('');
              inputRef.current?.focus();
            }
          }}
          shape="circle"
          type={contentType === ContentType.Search ? 'primary' : 'default'}
        />
      </div>
    );
  }, [error, searchKey, contentType, updateSearchContents, lang.search_invalid_characters, setSearchKey]);

  const mainTypeSelector = useMemo(() => {
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
  }, [isMobile, activeMainType, allTypes, contentType, setActiveMainType, lang]);

  return isMobile ? (
    <FloatingPanel
      anchors={anchors}
      className={styles.panel}
      fixedContent={
        <div
          className={classNames(styles.header, {
            [styles['hide-search']]: contentType !== ContentType.Search,
            [styles['hide-select']]: contentType !== ContentType.MainType,
          })}
        >
          {backButton || <div className={styles['back-button']} />}
          {searchBar}
          {mainTypeSelector}
        </div>
      }
      forceClose={!open}
      onClose={closeDrawer}
      title={lang.title}
    >
      <MainContent types={allTypes} />
    </FloatingPanel>
  ) : (
    <ToolBarDrawer
      classNames={{ body: styles['drawer-body'], header: styles['drawer-header'] }}
      closeIcon={null}
      enableResizable={false}
      mode={mode}
      rootClassName={styles.drawer}
      title={
        <div className={classNames(styles.header, { [styles['hide-search']]: contentType !== ContentType.Search })}>
          {backButton || <div className={styles.title}>{lang.title}</div>}
          {mainTypeSelector}
          {searchBar}
        </div>
      }
    >
      <MainContent types={allTypes} />
    </ToolBarDrawer>
  );
};

const ElementPanel = () => {
  return (
    <ElementPanelProvider>
      <ElementPanelContent />
    </ElementPanelProvider>
  );
};

export default ElementPanel;
