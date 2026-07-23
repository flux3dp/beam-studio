import React, { memo, use, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'classnames';
import { pipe } from 'remeda';

import { CanvasMode } from '@core/app/constants/canvasMode';
import { MiscEvents } from '@core/app/constants/ipcEvents';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useInteractionModeStore } from '@core/app/stores/interactionModeStore';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import { discoverManager } from '@core/helpers/api/discover';
import checkSoftwareForAdor from '@core/helpers/check-software';
import { getOS } from '@core/helpers/getOS';
import { isRetailDev } from '@core/helpers/is-dev';
import getIsWeb from '@core/helpers/is-web';
import communicator from '@core/implementations/communicator';
import storage from '@core/implementations/storage';

import AutoFocusButton from './AutoFocusButton';
import CommonTools from './CommonTools';
import DocumentButton from './DocumentButton';
import DrawerMenu from './DrawerMenu';
import FileName from './FileName';
import FrameButton from './FrameButton';
import GoButton from './GoButton';
import MaintenanceButton from './MaintenanceButton';
import Menu from './Menu';
import PathPreviewButton from './PathPreviewButton';
import SelectMachineButton from './SelectMachineButton';
import Tabs from './tabs/Tabs';
import styles from './TopBar.module.scss';
import WelcomePageButton from './WelcomePageButton';

const UnmemorizedTopBar = (): React.JSX.Element => {
  const { isDragRegion, isWeb } = useMemo(
    () => pipe(getIsWeb(), (isWeb) => ({ isDragRegion: getOS() === 'MacOS' && !isWeb, isWeb })),
    [],
  );
  const isTablet = useIsTabletOrMobile();

  const mode = useCanvasStore((state) => state.mode);
  const interactionMode = useInteractionModeStore((state) => state.interactionMode);
  const isExploreMode = interactionMode === 'explore';
  const { currentUser, hasUnsavedChange, setSelectedDevice } = use(CanvasContext);
  const [hasDiscoveredMachine, setHasDiscoveredMachine] = useState(false);
  const defaultDeviceUUID = useRef<null | string>(storage.get('selected-device') ?? null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const onFullScreenChange = (_: unknown, isFullScreen: boolean) => setIsFullScreen(isFullScreen);

    communicator.on(MiscEvents.WindowFullscreen, onFullScreenChange);

    return () => {
      communicator.off(MiscEvents.WindowFullscreen, onFullScreenChange);
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
      >
        <div
          className={classNames(styles.controls, styles.left, {
            [styles.space]: (isDragRegion && !isFullScreen) || isWeb,
          })}
        >
          {isWeb ? (
            <>
              {!isExploreMode && <WelcomePageButton />}
              <CommonTools hide={mode !== CanvasMode.Draw} />
            </>
          ) : (
            <Tabs />
          )}
          {isRetailDev() && <div className={styles.info}>{interactionMode.toUpperCase()}</div>}
        </div>
        {!isExploreMode && (
          <div className={classNames(styles.controls, styles.right)}>
            <SelectMachineButton />
            <MaintenanceButton />
            <DocumentButton />
            <AutoFocusButton />
            <FrameButton />
            <PathPreviewButton isDeviceConnected={hasDiscoveredMachine} />
            <GoButton hasDiscoverdMachine={hasDiscoveredMachine} />
          </div>
        )}
        {isWeb && <FileName hasUnsavedChange={hasUnsavedChange} />}
      </div>
      {isWeb && (
        <div className={classNames(styles['top-bar-menu-container'], styles.menu)} data-testid="top-bar-menu">
          {isTablet ? (
            <DrawerMenu disabled={isExploreMode} email={currentUser?.email} />
          ) : (
            <Menu disabled={isExploreMode} email={currentUser?.email} />
          )}
        </div>
      )}
    </>
  );
};

const TopBar = memo(UnmemorizedTopBar);

export default TopBar;
