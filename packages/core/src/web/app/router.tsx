import * as React from 'react';

import { StyleProvider } from '@ant-design/cssinjs';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ConfigProvider, message, theme } from 'antd';
import daDK from 'antd/locale/da_DK';
import deDE from 'antd/locale/de_DE';
import elGR from 'antd/locale/el_GR';
import enUS from 'antd/locale/en_US';
import fiFI from 'antd/locale/fi_FI';
import frFR from 'antd/locale/fr_FR';
import idID from 'antd/locale/id_ID';
import itIT from 'antd/locale/it_IT';
import jaJP from 'antd/locale/ja_JP';
import koKR from 'antd/locale/ko_KR';
import msMY from 'antd/locale/ms_MY';
import nbNO from 'antd/locale/nb_NO';
import nlBE from 'antd/locale/nl_BE';
import nlNL from 'antd/locale/nl_NL';
import plPL from 'antd/locale/pl_PL';
import svSE from 'antd/locale/sv_SE';
import thTH from 'antd/locale/th_TH';
import viVN from 'antd/locale/vi_VN';
import zhTW from 'antd/locale/zh_TW';
import type { Container } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { HashRouter, Route, Switch } from 'react-router-dom';

import AlertsAndProgress from '@core/app/components/dialogs/AlertAndProgress';
import Dialog from '@core/app/components/dialogs/Dialog';
import { AlertProgressContextProvider } from '@core/app/contexts/AlertProgressContext';
import { DialogContextProvider } from '@core/app/contexts/DialogContext';
import Beambox from '@core/app/pages/Beambox';
import ConnectEthernet from '@core/app/pages/ConnectEthernet';
import ConnectMachineIp from '@core/app/pages/ConnectMachineIp';
import ConnectUsb from '@core/app/pages/ConnectUsb';
import ConnectWiFi from '@core/app/pages/ConnectWiFi';
import ConnectWired from '@core/app/pages/ConnectWired';
import Error from '@core/app/pages/Error';
import FacebookOAuth from '@core/app/pages/FacebookOAuth';
import FluxIdLogin from '@core/app/pages/FluxIdLogin';
import GoogleOAuth from '@core/app/pages/GoogleOAuth';
import Home from '@core/app/pages/Home';
import PromarkSettings from '@core/app/pages/PromarkSettings';
import SelectConnectionType from '@core/app/pages/SelectConnectionType';
import SelectMachineModel from '@core/app/pages/SelectMachineModel';
import SelectPromarkLaserSource from '@core/app/pages/SelectPromarkLaserSource';
import Settings from '@core/app/pages/Settings';
import Welcome from '@core/app/pages/Welcome';
import { queryClient } from '@core/helpers/query';
import type { StorageKey } from '@core/interfaces/IStorage';

import ErrorBoundaryFallback from './components/ErrorBoundaryFallback';
import { DEFAULT_CONFIG, useSettingStore } from './components/settings/shared/hooks/useSettingStore';
import useAutoConnect from './hooks/useAutoConnect';

const { defaultAlgorithm } = theme;

const localeMap = {
  da_DK: daDK,
  'de-DE': deDE,
  el_GR: elGR,
  'en-US': enUS,
  fi_FI: fiFI,
  'fr-FR': frFR,
  id_ID: idID,
  'it-IT': itIT,
  'ja-JP': jaJP,
  'ko-KR': koKR,
  ms_MY: msMY,
  nb_NO: nbNO,
  'nl-BE': nlBE,
  'nl-NL': nlNL,
  'pl-PL': plPL,
  sv_SE: svSE,
  th_TH: thTH,
  vi_VN: viVN,
  'zh-TW': zhTW,
};

console.log('Loading language', navigator.language);

const App = (): React.JSX.Element => {
  const [messageApi, contextHolder] = message.useMessage();
  const { getConfig } = useSettingStore();

  useAutoConnect();

  Object.keys(DEFAULT_CONFIG).forEach((key) => {
    if (key === 'enable-sentry') return;

    getConfig(key as StorageKey);
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
        <AlertProgressContextProvider messageApi={messageApi}>
          <DialogContextProvider>
            <ConfigProvider
              locale={(localeMap as any)[navigator.language]}
              theme={{
                algorithm: defaultAlgorithm,
                components: {
                  Message: {
                    // set this value because zIndex of windows custom title bar is 99999
                    zIndexPopup: 100000,
                  },
                },
                token: { screenMD: 601, screenMDMin: 601, screenSMMax: 600 },
              }}
            >
              <StyleProvider hashPriority="low">
                <Dialog />
                <AlertsAndProgress />
                {contextHolder}
                <HashRouter>
                  <Switch>
                    <Route component={GoogleOAuth} exact path="/google-auth" />
                    <Route component={FacebookOAuth} exact path="/fb-auth" />
                    <Route component={SelectConnectionType} exact path="/initialize/connect/select-connection-type" />
                    <Route component={SelectMachineModel} exact path="/initialize/connect/select-machine-model" />
                    <Route component={ConnectMachineIp} exact path="/initialize/connect/connect-machine-ip" />
                    <Route component={ConnectUsb} exact path="/initialize/connect/connect-usb" />
                    <Route component={ConnectWiFi} exact path="/initialize/connect/connect-wi-fi" />
                    <Route component={ConnectWired} exact path="/initialize/connect/connect-wired" />
                    <Route component={ConnectEthernet} exact path="/initialize/connect/connect-ethernet" />
                    <Route component={FluxIdLogin} exact path="/initialize/connect/flux-id-login" />
                    <Route
                      component={SelectPromarkLaserSource}
                      exact
                      path="/initialize/connect/select-promark-laser-source"
                    />
                    <Route component={PromarkSettings} exact path="/initialize/connect/promark-settings" />
                    <Route component={Settings} exact path="/studio/settings" />
                    <Route component={Beambox} exact path="/studio/beambox" />
                    <Route component={Welcome} exact path="/studio/welcome" />
                    <Route component={Error} path="/error/*" />
                    <Route component={Home} path="*" />
                  </Switch>
                </HashRouter>
              </StyleProvider>
            </ConfigProvider>
          </DialogContextProvider>
        </AlertProgressContextProvider>
      </ErrorBoundary>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

const router = (container: Container): void => {
  createRoot(container as any).render(<App />);
};

export default router;
