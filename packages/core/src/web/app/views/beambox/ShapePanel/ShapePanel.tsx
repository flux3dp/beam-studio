import React, { Fragment } from 'react';

import { Modal } from 'antd';
import { CapsuleTabs } from 'antd-mobile';

import layoutConstants from '@core/app/constants/layout-constants';
import Shapes, { generateFileNameArray, ShapeTabs } from '@core/app/constants/shape-panel-constants';
import ShapeIcon from '@core/app/views/beambox/ShapePanel/ShapeIcon';
import FloatingPanel from '@core/app/widgets/FloatingPanel';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './ShapePanel.module.scss';

const ShapePanel = ({ onClose }: { onClose: () => void }): React.JSX.Element => {
  const lang = useI18n().beambox.shapes_panel;
  const isMobile = useIsMobile();
  const anchors = [0, window.innerHeight - layoutConstants.menuberHeight];
  const [close, setClose] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(ShapeTabs[0]);

  const scrollDivRef = React.useRef<HTMLDivElement>(null);
  const shodowRef = React.useRef<HTMLDivElement>(null);
  const handleShadow = () => {
    if (scrollDivRef.current && shodowRef.current && scrollDivRef.current.scrollHeight > 400) {
      if (
        // add extra 5px to fix windows browser precision
        scrollDivRef.current.scrollTop + scrollDivRef.current.clientHeight + 5 >=
        scrollDivRef.current.scrollHeight
      ) {
        shodowRef.current.style.display = 'none';
      } else {
        shodowRef.current.style.display = 'block';
      }
    } else {
      if (shodowRef.current) {
        shodowRef.current.style.display = 'none';
      }

      setTimeout(handleShadow, 500);
    }
  };

  // eslint-disable-next-line hooks/exhaustive-deps
  React.useEffect(handleShadow, [activeTab]);

  const renderIconList = () => {
    const subtypes = Object.keys(Shapes[activeTab]);

    return (
      <div className={styles['shadow-container']}>
        <div className={styles['scroll-content']} onScroll={handleShadow} ref={scrollDivRef}>
          <div className={styles['icon-list']}>
            {subtypes.map((subtype) => {
              if (!Shapes[activeTab][subtype].fileNames) {
                const fileNames = generateFileNameArray(subtype, Shapes[activeTab][subtype].setting);

                Shapes[activeTab][subtype].fileNames = fileNames;
              }

              return (
                <Fragment key={subtype}>
                  <div className={styles.label}>{lang[subtype]}</div>
                  {Shapes[activeTab][subtype].fileNames.map((fileName) => (
                    <ShapeIcon
                      activeTab={activeTab}
                      fileName={fileName}
                      key={fileName}
                      onClose={() => {
                        setClose(true);

                        if (!isMobile) {
                          onClose();
                        }
                      }}
                    />
                  ))}
                </Fragment>
              );
            })}
          </div>
        </div>
        <div className={styles.shadow} ref={shodowRef} />
      </div>
    );
  };

  return isMobile ? (
    <FloatingPanel
      anchors={anchors}
      className={styles.panel}
      fixedContent={
        <CapsuleTabs activeKey={activeTab} className={styles.tabs} onChange={setActiveTab}>
          {ShapeTabs.map((key) => (
            <CapsuleTabs.Tab key={key} title={lang[key]} />
          ))}
        </CapsuleTabs>
      }
      forceClose={close}
      onClose={onClose}
      title={lang.title}
    >
      {renderIconList()}
    </FloatingPanel>
  ) : (
    <Modal centered footer={null} onCancel={onClose} open={!close} title={lang.title} width={500}>
      <CapsuleTabs activeKey={activeTab} className={styles.tabs} onChange={setActiveTab}>
        {ShapeTabs.map((key) => (
          <CapsuleTabs.Tab key={key} title={lang[key]} />
        ))}
      </CapsuleTabs>
      {renderIconList()}
    </Modal>
  );
};

export default ShapePanel;
