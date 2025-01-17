import React, { useContext } from 'react';
import { Button } from 'antd';

import BackButton from 'app/widgets/FullWindowPanel/BackButton';
import Footer from 'app/widgets/FullWindowPanel/Footer';
import FullWindowPanel from 'app/widgets/FullWindowPanel/FullWindowPanel';
import Header from 'app/widgets/FullWindowPanel/Header';
import LeftPanelIcons from 'app/icons/left-panel/LeftPanelIcons';
import Sider from 'app/widgets/FullWindowPanel/Sider';
import useI18n from 'helpers/useI18n';
import { addDialogComponent, isIdExist, popDialogById } from 'app/actions/dialog-controller';
import { useIsMobile } from 'helpers/system-helper';

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
      </PassThroughProvider>
    );
  });
};
