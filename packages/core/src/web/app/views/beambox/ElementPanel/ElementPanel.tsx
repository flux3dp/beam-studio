import type { ReactNode } from 'react';
import React, { useContext, useMemo, useRef } from 'react';

import { LeftOutlined, SearchOutlined } from '@ant-design/icons';
import type { InputRef } from 'antd';
import { Button, Drawer, Input } from 'antd';
import { CapsuleTabs } from 'antd-mobile';
import classNames from 'classnames';

import type { MainType } from '@core/app/constants/element-panel-constants';
import { ContentType, MainTypes, NPTypes } from '@core/app/constants/element-panel-constants';
import layoutConstants from '@core/app/constants/layout-constants';
import { ElementPanelContext, ElementPanelProvider } from '@core/app/contexts/ElementPanelContext';
import Select from '@core/app/widgets/AntdSelect';
import FloatingPanel from '@core/app/widgets/FloatingPanel';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './ElementPanel.module.scss';
import MainContent from './MainContent';

export const ElementPanelContent = (): ReactNode => {
  const {
    activeMainType,
    activeSubType,
    closeDrawer,
    contentType,
    handleSearch,
    hasLogin,
    onClose,
    open,
    searchKey,
    setActiveMainType,
    setActiveSubType,
    setSearchKey,
  } = useContext(ElementPanelContext);
  const lang = useI18n().beambox.elements_panel;
  const isMobile = useIsMobile();
  const anchors = [0, window.innerHeight - layoutConstants.menuberHeight];
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
    return (
      <div className={styles['search-bar']}>
        <Input
          allowClear
          className={styles['search-input']}
          onChange={(e) => setSearchKey(e.target.value)}
          onClear={() => handleSearch('')}
          onPressEnter={() => {
            inputRef.current?.blur();
            handleSearch();
          }}
          ref={inputRef}
          size="small"
          type="search"
          value={searchKey}
        />
        <Button
          className={styles['search-button']}
          icon={<SearchOutlined />}
          onClick={() => {
            if (contentType === ContentType.Search) {
              inputRef.current?.blur();
              handleSearch();
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
  }, [contentType, handleSearch, searchKey, setSearchKey]);

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
      onClose={onClose}
      title={lang.title}
    >
      <MainContent types={allTypes} />
    </FloatingPanel>
  ) : (
    <Drawer
      afterOpenChange={(open) => {
        if (!open) onClose();
      }}
      classNames={{ body: styles['drawer-body'], header: styles['drawer-header'] }}
      closeIcon={null}
      getContainer={() => document.querySelector('#svg_editor') || document.body}
      mask={false}
      maskClosable={false}
      onClose={closeDrawer}
      open={open}
      placement="left"
      rootClassName={styles.drawer}
      title={
        <div className={classNames(styles.header, { [styles['hide-search']]: contentType !== ContentType.Search })}>
          {backButton || <div className={styles.title}>{lang.title}</div>}
          {mainTypeSelector}
          {searchBar}
        </div>
      }
    >
      <div className={styles.handle} onClick={closeDrawer}>
        <LeftOutlined />
      </div>
      <MainContent types={allTypes} />
    </Drawer>
  );
};

const ElementPanel = ({ onClose }: { onClose: () => void }) => {
  return (
    <ElementPanelProvider onClose={onClose}>
      <ElementPanelContent />
    </ElementPanelProvider>
  );
};

export default ElementPanel;
