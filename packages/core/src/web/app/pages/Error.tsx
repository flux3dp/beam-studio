import * as React from 'react';

import LangEn from '@core/app/lang/en';
import LangZHCN from '@core/app/lang/zh-cn';
import LangZHTW from '@core/app/lang/zh-tw';
import Modal from '@core/app/widgets/Modal';

function Error(): React.JSX.Element {
  const hashFragments = window.location.hash.split('/');
  const reason = hashFragments[hashFragments.length - 1];

  const navigatorLang = navigator.language;
  const langFile =
    {
      'zh-CN': LangZHCN,
      'zh-TW': LangZHTW,
    }[navigatorLang] || LangEn;
  const message =
    {
      'screen-size': langFile.error_pages.screen_size,
    }[reason] || 'Unknown Error';

  const wrapperClassName = {
    'error-page': true,
  };

  return (
    <Modal className={wrapperClassName}>
      <div className="text-center">{message}</div>
    </Modal>
  );
}

export default Error;
