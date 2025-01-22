import React, { useContext } from 'react';

import { Button } from 'antd';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import BackButton from '@core/app/widgets/FullWindowPanel/BackButton';
import Footer from '@core/app/widgets/FullWindowPanel/Footer';
import FullWindowPanel from '@core/app/widgets/FullWindowPanel/FullWindowPanel';
import Header from '@core/app/widgets/FullWindowPanel/Header';
import Sider from '@core/app/widgets/FullWindowPanel/Sider';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import Canvas from './Canvas';
import Controls from './Controls';
import { PassThroughContext, PassThroughProvider } from './PassThroughContext';

const PassThrough = ({ onClose }: { onClose?: () => void }): React.JSX.Element => {
  const lang = useI18n();
  const isMobile = useIsMobile();
  const tPassThrough = useI18n().pass_through;
  const { handleExport } = useContext(PassThroughContext);

  const button = (
    <Button
      onClick={async () => {
        await handleExport();
        onClose?.();
      }}
      type="primary"
    >
      {tPassThrough.export}
    </Button>
  );

  return (
    <FullWindowPanel
      mobileTitle={tPassThrough.title}
      onClose={onClose}
      renderContents={() => (
        <>
          <Sider>
            <BackButton onClose={onClose}>{lang.buttons.back_to_beam_studio}</BackButton>
            <Header icon={<LeftPanelIcons.PassThrough />} title={tPassThrough.title} />
            <Controls />
            <Footer>{button}</Footer>
          </Sider>
          {!isMobile && <Canvas />}
        </>
      )}
      renderMobileContents={() => (
        <>
          <Controls />
          <Footer>{button}</Footer>
        </>
      )}
      renderMobileFixedContent={() => <Canvas />}
    />
  );
};

export default PassThrough;

export const showPassThrough = (onClose?: () => void): Promise<void> => {
  const dialogId = 'pass-through';

  if (isIdExist(dialogId)) {
    popDialogById(dialogId);
  }

  return new Promise<void>((resolve) => {
    addDialogComponent(
      dialogId,
      <PassThroughProvider>
        <PassThrough
          onClose={() => {
            resolve(null);
            popDialogById(dialogId);
            onClose?.();
          }}
        />
      </PassThroughProvider>,
    );
  });
};
