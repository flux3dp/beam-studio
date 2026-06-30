import React, { memo, useRef, useState } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { createPortal } from 'react-dom';

import AddLayerButton from '@core/app/components/beambox/RightPanel/AddLayerButton';
import LayerPanel from '@core/app/components/beambox/RightPanel/LayerPanel';
import LayerContextMenu from '@core/app/components/beambox/RightPanel/LayerPanel/LayerContextMenu';
import FloatingButton from '@core/app/components/beambox/SvgEditor/FloatingButton';
import Divider from '@core/app/components/common/Divider';
import FloatingPopover from '@core/app/components/dialogs/popover/FloatingPopover';
import TabBarIcons from '@core/app/icons/tab-bar/TabBarIcons';
import { useIsMobile } from '@core/app/stores/screenStore';
import AutoHeightDrawer from '@core/app/widgets/AutoHeightDrawer';
import FloatingPanel from '@core/app/widgets/FloatingPanel';
import { mockT } from '@core/helpers/is-dev';

import styles from './LayerPanelButton.module.scss';

interface Props {
  open: boolean;
  reference: React.RefObject<Element | null>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Popout = memo(({ open, reference, setOpen }: Props): React.JSX.Element => {
  const isMobile = useIsMobile();

  const title = (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flex: 1,
        justifyContent: 'space-between',
        marginLeft: isMobile ? 16 : 12,
        marginRight: isMobile ? 40 : 12,
        position: 'relative',
      }}
    >
      <AddLayerButton />
      <div>{mockT('圖層管理')}</div>
      <LayerContextMenu />
    </div>
  );

  if (isMobile) {
    const useDrawer = false;

    return useDrawer ? (
      <AutoHeightDrawer
        className={styles['floating-panel']}
        getContainer={() => document.querySelector('#svg_editor')!}
        onClose={() => setOpen(false)}
        open={open}
        title={title}
      >
        <LayerPanel />
      </AutoHeightDrawer>
    ) : (
      <FloatingPanel
        // Open panel to height that make panel top close to trigger button
        // 130 = 40 topbar + 20 title name + 20 top margin + 40 button height + 10 margin
        anchors={[0, window.innerHeight - 130, window.innerHeight * 0.6]}
        className={styles['floating-panel']}
        forceClose={!open}
        onClose={() => setOpen(false)}
        title={title}
      >
        <LayerPanel />
      </FloatingPanel>
    );
  }

  return (
    <FloatingPopover open={open} placement="bottom-start" reference={reference.current} zIndex={5}>
      <div className={styles.popover}>
        <div className={styles.header}>
          {title}
          <Button icon={<CloseOutlined />} onClick={() => setOpen(false)} size="small" type="text" />
        </div>
        <Divider />
        <LayerPanel />
      </div>
    </FloatingPopover>
  );
});

const LayerPanelButton = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const popoutContainer = document.querySelector('.beambox-studio') ?? document.body;

  return (
    <>
      {createPortal(<Popout open={open} reference={ref} setOpen={setOpen} />, popoutContainer)}
      <FloatingButton active={open} icon={<TabBarIcons.Layers />} onClick={() => setOpen(!open)} ref={ref} />
    </>
  );
};

export default LayerPanelButton;
