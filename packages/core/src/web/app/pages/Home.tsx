import * as React from 'react';

import appSettings from '@core/app/app-settings';
import Modal from '@core/app/widgets/Modal';
import SelectView from '@core/app/widgets/Select';
import i18n from '@core/helpers/i18n';

import menu from '@app/implementations/menu';

function Home(): React.JSX.Element {
  const [lang, changeLang] = React.useState(i18n.lang);
  const getLanguageOptions = () => {
    const options = [];
    const langCodes = Object.keys(appSettings.i18n.supported_langs);

    for (let i = 0; i < langCodes.length; i += 1) {
      const langCode = langCodes[i];

      options.push({
        label: appSettings.i18n.supported_langs[langCode],
        selected: langCode === i18n.getActiveLang(),
        value: langCode,
      });
    }

    return options;
  };

  const changeActiveLang = (e) => {
    i18n.setActiveLang(e.currentTarget.value);
    menu.updateLanguage();
    changeLang(i18n.lang);
  };

  const wrapperClassName = {
    initialization: true,
  };
  const content = (
    <div className="home text-center">
      <img className="brand-image" src="img/menu/main_logo.svg" />
      <div>
        <h1 className="headline">{lang.initialize.select_language}</h1>
        <div className="language">
          <SelectView id="select-lang" onChange={changeActiveLang} options={getLanguageOptions()} />
        </div>
        <div>
          <a className="btn btn-action btn-large" href="#initialize/connect/flux-id-login">
            {lang.initialize.next}
          </a>
        </div>
      </div>
    </div>
  );

  return <Modal className={wrapperClassName} content={content} />;
}

export default Home;
