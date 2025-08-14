import React, { memo, useContext, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'classnames';
import { pipe } from 'remeda';

import tabController from '@core/app/actions/tabController';
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
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import { TopBarHintsContextProvider } from '@core/app/contexts/TopBarHintsContext';
import ObjectPanelController from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import Discover from '@core/helpers/api/discover';
import checkSoftwareForAdor from '@core/helpers/check-software';
import getIsWeb from '@core/helpers/is-web';
import communicator from '@core/implementations/communicator';
import storage from '@core/implementations/storage';

import AutoFocusButton from './AutoFocusButton';
import Tabs from './tabs/Tabs';
import styles from './TopBar.module.scss';

const UnmemorizedTopBar = (): React.JSX.Element => {
  const { isDragRegion, isWeb } = useMemo(
    () => pipe(getIsWeb(), (isWeb) => ({ isDragRegion: window.os === 'MacOS' && !isWeb, isWeb })),
    [],
  );
  const { currentUser, hasUnsavedChange, mode, setSelectedDevice, toggleAutoFocus, togglePathPreview } =
    useContext(CanvasContext);
  const [hasDiscoveredMachine, setHasDiscoveredMachine] = useState(false);
  const defaultDeviceUUID = useRef<null | string>(storage.get('selected-device'));
  const [isTabFocused, setIsTabFocused] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => registerWindowUpdateTitle(), []);

  useEffect(() => {
    const onTabFocused = () => setIsTabFocused(true);
    const onTabBlurred = () => setIsTabFocused(false);
    const onFullScreenChange = (_: unknown, isFullScreen: boolean) => setIsFullScreen(isFullScreen);

    tabController.onFocused(onTabFocused);
    tabController.onBlurred(onTabBlurred);
    communicator.on('window-fullscreen', onFullScreenChange);

    return () => {
      tabController.offFocused(onTabFocused);
      tabController.offBlurred(onTabBlurred);
      communicator.off('window-fullscreen', onFullScreenChange);
    };
  }, []);

  useEffect(() => {
    const discover = Discover('top-bar', (deviceList) => {
      setHasDiscoveredMachine(deviceList.some(({ serial }) => serial !== 'XXXXXXXXXX'));
      setSelectedDevice((previous) => {
        if (previous || !defaultDeviceUUID.current) return previous;

        const defaultDevice = deviceList.find(({ uuid }) => uuid === defaultDeviceUUID.current);

        if (defaultDevice && !checkSoftwareForAdor(defaultDevice, false)) defaultDeviceUUID.current = null;
        else return defaultDevice || null;

        return previous;
      });
    });

    return () => {
      discover.removeListener('top-bar');
    };
  }, [setSelectedDevice]);

  return (
    <>
      <div
        className={classNames(styles['top-bar'], {
          [styles.draggable]: isDragRegion && isTabFocused,
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
          <SelectMachineButton />
          <DocumentButton />
          <AutoFocusButton toggleAutoFocus={toggleAutoFocus} />
          <FrameButton />
          <PathPreviewButton isDeviceConnected={hasDiscoveredMachine} togglePathPreview={togglePathPreview} />
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
