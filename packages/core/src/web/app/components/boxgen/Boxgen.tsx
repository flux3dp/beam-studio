import React from 'react';

import BackButton from '@core/app/widgets/FullWindowPanel/BackButton';
import Footer from '@core/app/widgets/FullWindowPanel/Footer';
import FullWindowPanel from '@core/app/widgets/FullWindowPanel/FullWindowPanel';
import Header from '@core/app/widgets/FullWindowPanel/Header';
import Sider from '@core/app/widgets/FullWindowPanel/Sider';
import useI18n from '@core/helpers/useI18n';
import useNewShortcutsScope from '@core/helpers/hooks/useNewShortcutsScope';
import { BoxgenProvider } from '@core/app/contexts/BoxgenContext';

import BoxCanvas from './BoxCanvas';
import BoxSelector from './BoxSelector';
import Controller from './Controller';
import ExportButton from './ExportButton';
import styles from './Boxgen.module.scss';

const Boxgen = ({ onClose }: { onClose?: () => void }): JSX.Element => {
  const lang = useI18n();
  const tBoxgen = lang.boxgen;

  useNewShortcutsScope();

  return (
    <BoxgenProvider onClose={onClose}>
      <FullWindowPanel
        onClose={onClose}
        mobileTitle={tBoxgen.title}
        renderMobileFixedContent={() => (
          <div>
            <BoxSelector />
            <div className={styles.canvas}>
              <BoxCanvas />
            </div>
          </div>
        )}
        renderMobileContents={() => (
          <>
            <Controller />
            <Footer>
              <ExportButton />
            </Footer>
          </>
        )}
        renderContents={() => (
          <>
            <Sider>
              <BackButton onClose={onClose}>{lang.buttons.back_to_beam_studio}</BackButton>
              <Header title={tBoxgen.title}>
                <BoxSelector />
              </Header>
              <Controller />
              <Footer>
                <ExportButton />
              </Footer>
            </Sider>
            <div className={styles.canvas}>
              <BoxCanvas />
            </div>
          </>
        )}
      />
    </BoxgenProvider>
  );
};

export default Boxgen;
