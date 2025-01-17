import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Switch } from 'react-router-dom';

import AlertsAndProgress from 'app/views/dialogs/AlertAndProgress';
import Beambox from 'app/pages/Beambox';
import ConnectEthernet from 'app/pages/ConnectEthernet';
import ConnectMachineIp from 'app/pages/ConnectMachineIp';
import ConnectUsb from 'app/pages/ConnectUsb';
import ConnectWiFi from 'app/pages/ConnectWiFi';
import ConnectWired from 'app/pages/ConnectWired';
import Dialog from 'app/views/dialogs/Dialog';
import Error from 'app/pages/Error';
import FacebookOAuth from 'app/pages/FacebookOAuth';
import FluxIdLogin from 'app/pages/FluxIdLogin';
import GoogleOAuth from 'app/pages/GoogleOAuth';
import Home from 'app/pages/Home';
import Settings from 'app/pages/Settings';
import SelectConnectionType from 'app/pages/SelectConnectionType';
import SelectMachineModel from 'app/pages/SelectMachineModel';
import SelectPromarkLaserSource from 'app/pages/SelectPromarkLaserSource';
import PromarkSettings from 'app/pages/PromarkSettings';
import { AlertProgressContextProvider } from 'app/contexts/AlertProgressContext';
import { DialogContextProvider } from 'app/contexts/DialogContext';
import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider, message, theme } from 'antd';

import enUS from 'antd/locale/en_US';
import deDE from 'antd/locale/de_DE';
import nlNL from 'antd/locale/nl_NL';
import nlBE from 'antd/locale/nl_BE';
import itIT from 'antd/locale/it_IT';
import frFR from 'antd/locale/fr_FR';
import zhTW from 'antd/locale/zh_TW';
import koKR from 'antd/locale/ko_KR';
import jaJP from 'antd/locale/ja_JP';
import plPL from 'antd/locale/pl_PL';
import daDK from 'antd/locale/da_DK';
import elGR from 'antd/locale/el_GR';
import fiFI from 'antd/locale/fi_FI';
import idID from 'antd/locale/id_ID';
import msMY from 'antd/locale/ms_MY';
import nbNO from 'antd/locale/nb_NO';
import svSE from 'antd/locale/sv_SE';
import thTH from 'antd/locale/th_TH';
import viVN from 'antd/locale/vi_VN';
import { Container } from 'react-dom';

const { defaultAlgorithm } = theme;

const localeMap = {
  'nl-NL': nlNL,
  'nl-BE': nlBE,
  'zh-TW': zhTW,
  'ko-KR': koKR,
  'ja-JP': jaJP,
  'fr-FR': frFR,
  'it-IT': itIT,
  'de-DE': deDE,
  'en-US': enUS,
  'pl-PL': plPL,
  da_DK: daDK,
  el_GR: elGR,
  fi_FI: fiFI,
  id_ID: idID,
  ms_MY: msMY,
  nb_NO: nbNO,
  sv_SE: svSE,
  th_TH: thTH,
  vi_VN: viVN,
};

console.log('Loading language', navigator.language);

const App = (): JSX.Element => {
  const [messageApi, contextHolder] = message.useMessage();
  return (
    <AlertProgressContextProvider messageApi={messageApi}>
      <DialogContextProvider>
        <ConfigProvider
          theme={{
            algorithm: defaultAlgorithm,
            token: { screenMD: 601, screenMDMin: 601, screenSMMax: 600 },
            components: {
              Message: {
                // set this value because zIndex of windows custom title bar is 99999
                zIndexPopup: 100000,
              },
            },
          }}
          locale={localeMap[navigator.language]}
        >
          <StyleProvider hashPriority="high">
            <Dialog />
            <AlertsAndProgress />
            {contextHolder}
            <HashRouter>
              <Switch>
                <Route exact path="/google-auth" component={GoogleOAuth} />
                <Route exact path="/fb-auth" component={FacebookOAuth} />
                <Route
                  exact
                  path="/initialize/connect/select-connection-type"
                  component={SelectConnectionType}
                />
                <Route
                  exact
                  path="/initialize/connect/select-machine-model"
                  component={SelectMachineModel}
                />
                <Route
                  exact
                  path="/initialize/connect/connect-machine-ip"
                  component={ConnectMachineIp}
                />
                <Route exact path="/initialize/connect/connect-usb" component={ConnectUsb} />
                <Route exact path="/initialize/connect/connect-wi-fi" component={ConnectWiFi} />
                <Route exact path="/initialize/connect/connect-wired" component={ConnectWired} />
                <Route
                  exact
                  path="/initialize/connect/connect-ethernet"
                  component={ConnectEthernet}
                />
                <Route exact path="/initialize/connect/flux-id-login" component={FluxIdLogin} />
                <Route
                  exact
                  path="/initialize/connect/select-promark-laser-source"
                  component={SelectPromarkLaserSource}
                />
                <Route
                  exact
                  path="/initialize/connect/promark-settings"
                  component={PromarkSettings}
                />
                <Route exact path="/studio/settings" component={Settings} />
                <Route exact path="/studio/beambox" component={Beambox} />
                <Route path="/error/*" component={Error} />
                <Route path="*" component={Home} />
              </Switch>
            </HashRouter>
          </StyleProvider>
        </ConfigProvider>
      </DialogContextProvider>
    </AlertProgressContextProvider>
  );
};

const router = (container: Container): void => {
  createRoot(container).render(<App />);
};

export default router;
