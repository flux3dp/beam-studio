import ReactDomServer from 'react-dom/server';

import TopBarController from '@core/app/views/beambox/TopBar/contexts/TopBarController';

import FileName from '.';

const updateTitle = () => {
  if (window.os === 'Windows' && window.titlebar) {
    const title = ReactDomServer.renderToStaticMarkup(<FileName hasUnsavedChange={false} isTitle />);

    if (window.titlebar?.title) {
      window.titlebar.title.innerHTML = title;
    }
  }
};

const unregisterWindowUpdateTitle = (): void => {
  TopBarController.offTitleChange(updateTitle);
};

export const registerWindowUpdateTitle = (): (() => void) => {
  TopBarController.onTitleChange(updateTitle);

  return unregisterWindowUpdateTitle;
};
