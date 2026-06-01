import type { ReactNode } from 'react';
import React, { memo, use, useRef, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import type { InputRef } from 'antd';
import { Button, Input, message } from 'antd';

import { ContentType } from '@core/app/constants/element-panel-constants';
import { ElementPanelContext } from '@core/app/contexts/ElementPanelContext';
import useI18n from '@core/helpers/useI18n';

import styles from './ElementPanel.module.scss';

const SearchBar = (): ReactNode => {
  const { contentType, searchKey, setSearchKey, updateSearchContents } = use(ElementPanelContext);
  const lang = useI18n().beambox.elements_panel;
  const [error, setError] = useState(false);
  const inputRef = useRef<InputRef>(null);

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
};

SearchBar.displayName = 'SearchBar';

export default memo(SearchBar);
