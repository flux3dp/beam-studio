import React, { memo, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Tour } from 'antd';
import classNames from 'classnames';
import { pipe } from 'remeda';

import CommonTools from '@core/app/components/beambox/top-bar/CommonTools';
import DocumentButton from '@core/app/components/beambox/top-bar/DocumentButton';
import FileName from '@core/app/components/beambox/top-bar/FileName';
import { registerWindowUpdateTitle } from '@core/app/components/beambox/top-bar/FileName/registerWindowUpdateTile';
import FrameButton from '@core/app/components/beambox/top-bar/FrameButton';
import GoButton from '@core/app/components/beambox/top-bar/GoButton';
import Menu from '@core/app/components/beambox/top-bar/Menu';
import PathPreviewButton from '@core/app/components/beambox/top-bar/PathPreviewButton';
import SelectMachineButton from '@core/app/components/beambox/top-bar/SelectMachineButton';
import TopBarHints from '@core/app/components/beambox/top-bar/TopBarHints';
import WelcomePageButton from '@core/app/components/beambox/top-bar/WelcomePageButton';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { generateInterfaceTutorial } from '@core/app/constants/tutorialConstants';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import { TopBarHintsContextProvider } from '@core/app/contexts/TopBarHintsContext';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import ObjectPanelController from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import { moveToStep } from '@core/app/views/tutorials/utils';
import { loadLayout } from '@core/app/widgets/dockable/utils';
import { discoverManager } from '@core/helpers/api/discover';
import checkSoftwareForAdor from '@core/helpers/check-software';
import { getOS } from '@core/helpers/getOS';
import getIsWeb from '@core/helpers/is-web';
import communicator from '@core/implementations/communicator';
import storage from '@core/implementations/storage';

import AutoFocusButton from './AutoFocusButton';
import Tabs from './tabs/Tabs';
import styles from './TopBar.module.scss';

const ttt = generateInterfaceTutorial();

const UnmemorizedTopBar = (): React.JSX.Element => {
  const { isDragRegion, isWeb } = useMemo(
    () => pipe(getIsWeb(), (isWeb) => ({ isDragRegion: getOS() === 'MacOS' && !isWeb, isWeb })),
    [],
  );
  const mode = useCanvasStore((state) => state.mode);
  const { currentUser, hasUnsavedChange, setSelectedDevice } = useContext(CanvasContext);
  const [hasDiscoveredMachine, setHasDiscoveredMachine] = useState(false);
  const defaultDeviceUUID = useRef<null | string>(storage.get('selected-device') ?? null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => registerWindowUpdateTitle(), []);

  useEffect(() => {
    const onFullScreenChange = (_: unknown, isFullScreen: boolean) => setIsFullScreen(isFullScreen);

    communicator.on('window-fullscreen', onFullScreenChange);

    return () => {
      communicator.off('window-fullscreen', onFullScreenChange);
    };
  }, []);

  useEffect(() => {
    const unregister = discoverManager.register('top-bar', (deviceList) => {
      setHasDiscoveredMachine(deviceList.some(({ serial }) => serial !== 'XXXXXXXXXX'));
      setSelectedDevice((previous) => {
        if (previous || !defaultDeviceUUID.current) return previous;

        const defaultDevice = deviceList.find(({ uuid }) => uuid === defaultDeviceUUID.current);

        if (defaultDevice && !checkSoftwareForAdor(defaultDevice, false)) defaultDeviceUUID.current = null;
        else return defaultDevice || null;

        return previous;
      });
    });

    return unregister;
  }, [setSelectedDevice]);

  return (
    <>
      <div
        className={classNames(styles['top-bar'], {
          [styles.draggable]: isDragRegion,
          [styles.web]: isWeb,
        })}
        onClick={() => ObjectPanelController.updateActiveKey(null)}
      >
        <div
          className={classNames(styles.controls, styles.left, {
            [styles.space]: (isDragRegion && !isFullScreen) || isWeb,
          })}
        >
          {isWeb ? (
            <>
              <WelcomePageButton />
              <CommonTools hide={mode !== CanvasMode.Draw} />
            </>
          ) : (
            <Tabs />
          )}
        </div>
        <div className={classNames(styles.controls, styles.right)}>
          <Button
            onClick={() => {
              console.log('Start Top Bar Tour');
              loadLayout('fallback');
              setCurrent(0);
              setOpen(true);
            }}
            style={{ '-webkit-app-region': 'no-drag' }}
          >
            Tour
          </Button>
          <Tour
            current={current}
            disabledInteraction={ttt.disabledInteraction} // Disable in interface and enable in new user tutorial
            indicatorsRender={(current, total) => (
              // Fix layout loop when close to border
              <span className={styles.indicators}>
                {current + 1} / {total}
              </span>
            )}
            mask={{ color: 'rgba(0, 0, 0, 0.3)' }}
            onChange={async (step) => {
              console.log('step', step);
              await moveToStep(ttt.steps[step]);
              setCurrent(step);
            }}
            onClose={() => {
              setOpen(false);
              loadLayout('cached');
            }} // TODO: add confirm when closing in the middle of tour
            open={open}
            rootClassName={styles.tour}
            steps={ttt.steps}
          />
          <SelectMachineButton />
          <DocumentButton />
          <AutoFocusButton />
          <FrameButton />
          <PathPreviewButton isDeviceConnected={hasDiscoveredMachine} />
          <GoButton hasDiscoverdMachine={hasDiscoveredMachine} />
        </div>
        {isWeb && <FileName hasUnsavedChange={hasUnsavedChange} />}
      </div>
      <TopBarHintsContextProvider>
        <TopBarHints />
      </TopBarHintsContextProvider>
      {isWeb && (
        <div className={classNames('top-bar-menu-container', styles.menu)}>
          <Menu email={currentUser?.email} />
        </div>
      )}
    </>
  );
};

const TopBar = memo(UnmemorizedTopBar);

export default TopBar;
