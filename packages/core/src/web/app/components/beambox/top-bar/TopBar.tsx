import React, { memo, useContext, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'classnames';

import tabController from '@core/app/actions/tabController';
import CommonTools from '@core/app/components/beambox/top-bar/CommonTools';
import DocumentButton from '@core/app/components/beambox/top-bar/DocumentButton';
import FileName, {
  registerWindowUpdateTitle,
  unregisterWindowUpdateTitle,
} from '@core/app/components/beambox/top-bar/FileName';
import FrameButton from '@core/app/components/beambox/top-bar/FrameButton';
import GoButton from '@core/app/components/beambox/top-bar/GoButton';
import Menu from '@core/app/components/beambox/top-bar/Menu';
import PathPreviewButton from '@core/app/components/beambox/top-bar/PathPreviewButton';
import SelectMachineButton from '@core/app/components/beambox/top-bar/SelectMachineButton';
import TopBarHints from '@core/app/components/beambox/top-bar/TopBarHints';
import UserAvatar from '@core/app/components/beambox/top-bar/UserAvatar';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import { TopBarHintsContextProvider } from '@core/app/contexts/TopBarHintsContext';
import ObjectPanelController from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import Discover from '@core/helpers/api/discover';
import checkSoftwareForAdor from '@core/helpers/check-software';
import isWeb from '@core/helpers/is-web';
import storage from '@core/implementations/storage';

import Tabs from './tabs/Tabs';
import styles from './TopBar.module.scss';

const Topbar = (): React.JSX.Element => {
  const { isDragRegion, isWebMode } = useMemo(() => {
    const web = isWeb();

    return { isDragRegion: window.os === 'MacOS' && !web, isWebMode: web };
  }, []);
  const { currentUser, hasUnsavedChange, mode, setSelectedDevice, togglePathPreview } = useContext(CanvasContext);
  const [hasDiscoveredMachine, setHasDiscoveredMachine] = useState(false);
  const defaultDeviceUUID = useRef<null | string>(storage.get('selected-device'));

  useEffect(() => {
    registerWindowUpdateTitle();

    return unregisterWindowUpdateTitle;
  }, []);

  const [isTabFocused, setIsTabFocused] = useState(false);

  useEffect(() => {
    const onTabFocused = () => {
      setIsTabFocused(true);
    };
    const onTabBlurred = () => {
      setIsTabFocused(false);
    };

    tabController.onFocused(onTabFocused);
    tabController.onBlurred(onTabBlurred);

    return () => {
      tabController.offFocused(onTabFocused);
      tabController.offBlurred(onTabBlurred);
    };
  }, []);

  useEffect(() => {
    const discover = Discover('top-bar', (deviceList) => {
      setHasDiscoveredMachine(deviceList.some((device) => device.serial !== 'XXXXXXXXXX'));
      setSelectedDevice((cur) => {
        if (!cur && defaultDeviceUUID.current) {
          const defaultDevice = deviceList.find((device) => device.uuid === defaultDeviceUUID.current);

          if (defaultDevice && !checkSoftwareForAdor(defaultDevice, false)) {
            defaultDeviceUUID.current = null;
          } else {
            return defaultDevice || null;
          }
        }

        return cur;
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
        })}
        onClick={() => ObjectPanelController.updateActiveKey(null)}
      >
        <div
          className={classNames(styles.controls, styles.left, {
            [styles.space]: isDragRegion || isWebMode,
          })}
        >
          <UserAvatar user={currentUser} />
          <CommonTools hide={mode !== CanvasMode.Draw} isWeb={isWebMode} />
          {!isWebMode && <Tabs />}
        </div>
        <div className={classNames(styles.controls, styles.right)}>
          <SelectMachineButton />
          <DocumentButton />
          <FrameButton />
          <PathPreviewButton isDeviceConnected={hasDiscoveredMachine} togglePathPreview={togglePathPreview} />
          <GoButton hasDiscoverdMachine={hasDiscoveredMachine} />
        </div>
        {isWebMode && <FileName hasUnsavedChange={hasUnsavedChange} />}
      </div>
      <TopBarHintsContextProvider>
        <TopBarHints />
      </TopBarHintsContextProvider>
      {isWebMode && (
        <div className={classNames('top-bar-menu-container', styles.menu)}>
          <Menu email={currentUser?.email} />
        </div>
      )}
    </>
  );
};

export default memo(Topbar);
