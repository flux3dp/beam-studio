import React from 'react';

import { BoxgenProvider } from '@core/app/contexts/BoxgenContext';
import BackButton from '@core/app/widgets/FullWindowPanel/BackButton';
import Footer from '@core/app/widgets/FullWindowPanel/Footer';
import FullWindowPanel from '@core/app/widgets/FullWindowPanel/FullWindowPanel';
import Header from '@core/app/widgets/FullWindowPanel/Header';
import Sider from '@core/app/widgets/FullWindowPanel/Sider';
import useNewShortcutsScope from '@core/helpers/hooks/useNewShortcutsScope';
import useI18n from '@core/helpers/useI18n';

import BoxCanvas from './BoxCanvas';
import styles from './Boxgen.module.scss';
import BoxSelector from './BoxSelector';
import Controller from './Controller';
import ExportButton from './ExportButton';

const Boxgen = ({ onClose }: { onClose?: () => void }): React.JSX.Element => {
  const lang = useI18n();
  const tBoxgen = lang.boxgen;

  useNewShortcutsScope();

  return (
    <BoxgenProvider onClose={onClose}>
      <FullWindowPanel
        mobileTitle={tBoxgen.title}
        onClose={onClose}
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
        renderMobileContents={() => (
          <>
            <Controller />
            <Footer>
              <ExportButton />
            </Footer>
          </>
        )}
        renderMobileFixedContent={() => (
          <div>
            <BoxSelector />
            <div className={styles.canvas}>
              <BoxCanvas />
            </div>
          </div>
        )}
      />
    </BoxgenProvider>
  );
};

export default Boxgen;
