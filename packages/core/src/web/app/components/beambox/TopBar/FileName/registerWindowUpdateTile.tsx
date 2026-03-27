import ReactDomServer from 'react-dom/server';

import { getOS } from '@core/helpers/getOS';

import FileName from '.';

export const updateWindowsTitle = () => {
  if (getOS() === 'Windows' && window.titlebar) {
    const title = ReactDomServer.renderToStaticMarkup(<FileName hasUnsavedChange={false} isTitle />);

    if (window.titlebar?.title) {
      window.titlebar.title.innerHTML = title;
    }
  }
};
