import React, { useContext } from 'react';
import { Button } from 'antd';

import BackButton from '@core/app/widgets/FullWindowPanel/BackButton';
import Footer from '@core/app/widgets/FullWindowPanel/Footer';
import FullWindowPanel from '@core/app/widgets/FullWindowPanel/FullWindowPanel';
import Header from '@core/app/widgets/FullWindowPanel/Header';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import Sider from '@core/app/widgets/FullWindowPanel/Sider';
import useI18n from '@core/helpers/useI18n';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import { useIsMobile } from '@core/helpers/system-helper';

import Canvas from './Canvas';
import Controls from './Controls';
import { PassThroughContext, PassThroughProvider } from './PassThroughContext';

const PassThrough = ({ onClose }: { onClose?: () => void }): JSX.Element => {
  const lang = useI18n();
  const isMobile = useIsMobile();
  const tPassThrough = useI18n().pass_through;
  const { handleExport } = useContext(PassThroughContext);

  const button = (
    <Button
      type="primary"
      onClick={async () => {
        await handleExport();
        onClose?.();
      }}
    >
      {tPassThrough.export}
    </Button>
  );

  return (
    <FullWindowPanel
      onClose={onClose}
      mobileTitle={tPassThrough.title}
      renderMobileFixedContent={() => <Canvas />}
      renderMobileContents={() => (
        <>
          <Controls />
          <Footer>{button}</Footer>
        </>
      )}
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
    />
  );
};

export default PassThrough;

export const showPassThrough = (onClose?: () => void): Promise<void> => {
  const dialogId = 'pass-through';
  if (isIdExist(dialogId)) popDialogById(dialogId);
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
