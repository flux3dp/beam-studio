import React, { Fragment } from 'react';
import { CapsuleTabs } from 'antd-mobile';
import { Modal } from 'antd';

import FloatingPanel from 'app/widgets/FloatingPanel';
import layoutConstants from 'app/constants/layout-constants';
import Shapes, { ShapeTabs, generateFileNameArray } from 'app/constants/shape-panel-constants';
import ShapeIcon from 'app/views/beambox/ShapePanel/ShapeIcon';
import useI18n from 'helpers/useI18n';
import { useIsMobile } from 'helpers/system-helper';

import styles from './ShapePanel.module.scss';

const ShapePanel = ({ onClose }: { onClose: () => void }): JSX.Element => {
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
      if (shodowRef.current) shodowRef.current.style.display = 'none';
      setTimeout(handleShadow, 500);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(handleShadow, [activeTab]);

  const renderIconList = () => {
    const subtypes = Object.keys(Shapes[activeTab]);
    return (
      <div className={styles['shadow-container']}>
        <div ref={scrollDivRef} className={styles['scroll-content']} onScroll={handleShadow}>
          <div className={styles['icon-list']}>
            {subtypes.map((subtype) => {
              if (!Shapes[activeTab][subtype].fileNames) {
                const fileNames = generateFileNameArray(
                  subtype,
                  Shapes[activeTab][subtype].setting
                );
                Shapes[activeTab][subtype].fileNames = fileNames;
              }
              return (
                <Fragment key={subtype}>
                  <div className={styles.label}>{lang[subtype]}</div>
                  {Shapes[activeTab][subtype].fileNames.map((fileName) => (
                    <ShapeIcon
                      key={fileName}
                      activeTab={activeTab}
                      fileName={fileName}
                      onClose={() => {
                        setClose(true);
                        if (!isMobile) onClose();
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
      className={styles.panel}
      anchors={anchors}
      title={lang.title}
      fixedContent={
        <CapsuleTabs className={styles.tabs} activeKey={activeTab} onChange={setActiveTab}>
          {ShapeTabs.map((key) => (
            <CapsuleTabs.Tab title={lang[key]} key={key} />
          ))}
        </CapsuleTabs>
      }
      forceClose={close}
      onClose={onClose}
    >
      {renderIconList()}
    </FloatingPanel>
  ) : (
    <Modal onCancel={onClose} title={lang.title} footer={null} width={500} open={!close} centered>
      <CapsuleTabs className={styles.tabs} activeKey={activeTab} onChange={setActiveTab}>
        {ShapeTabs.map((key) => (
          <CapsuleTabs.Tab title={lang[key]} key={key} />
        ))}
      </CapsuleTabs>
      {renderIconList()}
    </Modal>
  );
};

export default ShapePanel;
