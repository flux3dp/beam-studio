import * as React from 'react';

import Modal from 'app/widgets/Modal';
import LangEn from 'app/lang/en';
import LangZHCN from 'app/lang/zh-cn';
import LangZHTW from 'app/lang/zh-tw';

function Error(): JSX.Element {
  const hashFragments = window.location.hash.split('/');
  const reason = hashFragments[hashFragments.length - 1];

  const navigatorLang = navigator.language;
  const langFile = {
    'zh-TW': LangZHTW,
    'zh-CN': LangZHCN,
  }[navigatorLang] || LangEn;
  const message = {
    'screen-size': langFile.error_pages.screen_size,
  }[reason] || 'Unknown Error';

  const wrapperClassName = {
    'error-page': true,
  };
  return (
    <Modal className={wrapperClassName}>
      <div className="text-center">
        {message}
      </div>
    </Modal>
  );
}

export default Error;
