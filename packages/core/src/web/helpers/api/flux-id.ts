import type { AxiosError, AxiosResponse } from 'axios';
import axios from 'axios';

import alert from '@core/app/actions/alert-caller';
import progress from '@core/app/actions/progress-caller';
import { TabEvents } from '@core/app/constants/tabConstants';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import parseQueryData from '@core/helpers/query-data-parser';
import browser from '@core/implementations/browser';
import communicator from '@core/implementations/communicator';
import cookies from '@core/implementations/cookies';
import storage from '@core/implementations/storage';
import type { IData } from '@core/interfaces/INounProject';
import type { IUser } from '@core/interfaces/IUser';

export interface ResponseWithError<T = any, D = any> extends AxiosResponse<T, D> {
  error?: AxiosError<T, D>;
}

const OAUTH_REDIRECT_URI = 'https://id.flux3dp.com/api/beam-studio/auth';
const FB_OAUTH_URI = 'https://www.facebook.com/v10.0/dialog/oauth';
const FB_APP_ID = '1071530792957137';
const G_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const G_CLIENT_ID = '1071432315622-ekdkc89hdt70sevt6iv9ia4659lg70vi.apps.googleusercontent.com';

export const getRedirectUri = (withState = true) => {
  if (!isWeb()) return OAUTH_REDIRECT_URI;

  const query = ['isWeb=true'];

  if (withState) {
    const state = { origin: window.location.origin };

    query.push(`state=${encodeURIComponent(JSON.stringify(state))}`);
  }

  return `${OAUTH_REDIRECT_URI}?${query.join('&')}`;
};

const OAUTH_TOKEN = new Set<string>();

export const FLUXID_HOST = 'https://id.flux3dp.com';

const FLUXID_DOMAIN = '.flux3dp.com';

export const axiosFluxId = axios.create({
  baseURL: FLUXID_HOST,
  timeout: 10000,
});

let currentUser: IUser | null = null;

axiosFluxId.interceptors.response.use(
  (response) => response,
  (error) => ({ error }),
);

export const fluxIDEvents = eventEmitterFactory.createEventEmitter('flux-id');

const handleErrorMessage = (error: AxiosError) => {
  if (!error) {
    return;
  }

  const { response } = error;

  if (!response) {
    alert.popUpError({ message: i18n.lang.flux_id_login.connection_fail });
  } else {
    const message = `${response.status} ${response.statusText}`;

    alert.popUpError({ message });
  }
};

const updateMenu = (info?: IUser) => {
  communicator.send('UPDATE_ACCOUNT', info);
};

const updateUser = (
  info?: IUser,
  {
    isWebSocialSignIn = false,
    sendToOtherTabs = true,
  }: { isWebSocialSignIn?: boolean; sendToOtherTabs?: boolean } = {},
) => {
  if (info) {
    if (!currentUser) {
      if (sendToOtherTabs) updateMenu(info);

      currentUser = {
        email: info.email,
        info,
      };

      if (isWebSocialSignIn && isWeb()) {
        window.opener.dispatchEvent(
          new CustomEvent('update-user', {
            detail: {
              user: currentUser,
            },
          }),
        );
      }
    } else {
      if (currentUser.email !== info.email && sendToOtherTabs) {
        updateMenu(info);
      }

      Object.assign(currentUser.info, info);
    }

    fluxIDEvents.emit('update-user', currentUser);
  } else {
    if (currentUser) {
      currentUser = null;

      if (sendToOtherTabs) updateMenu();
    }

    fluxIDEvents.emit('update-user', null);
  }

  if (sendToOtherTabs) communicator.send(TabEvents.UpdateUser, currentUser);
};

communicator.on(TabEvents.UpdateUser, (_: Event, user: IUser) => {
  updateUser(user, { sendToOtherTabs: false });
});

window.addEventListener('update-user', (e: CustomEvent) => {
  currentUser = e.detail.user;
});

export const getCurrentUser = (): IUser | null => currentUser;

const handleOAuthLoginSuccess = (data: IUser) => {
  updateUser(data, { isWebSocialSignIn: true });
  fluxIDEvents.emit('oauth-logged-in');
  storage.set('keep-flux-id-login', true);

  if (window.location.hash === '#/initialize/connect/flux-id-login') {
    window.location.hash = '#/initialize/connect/select-machine-model';
  }
};

export const getInfo = async ({
  isWebSocialSignIn = false,
  sendToOtherTabs = true,
  silent = false,
}: { isWebSocialSignIn?: boolean; sendToOtherTabs?: boolean; silent?: boolean } = {}) => {
  const response = (await axiosFluxId.get('/user/info?query=credits', {
    withCredentials: true,
  })) as ResponseWithError;

  if (response.error) {
    if (!silent) {
      handleErrorMessage(response.error);
    }

    return null;
  }

  const responseData = response.data;

  if (response.status === 200) {
    if (responseData.status === 'ok') {
      updateUser(responseData, { isWebSocialSignIn, sendToOtherTabs });
    }

    return responseData;
  }

  if (!silent) {
    const message = responseData.message ? `${responseData.info}: ${responseData.message}` : responseData.info;

    alert.popUpError({ message });
  }

  return null;
};

const getAccessToken = async () => {
  const response = (await axiosFluxId.get('/oauth/', {
    params: {
      response_type: 'token',
    },
    withCredentials: true,
  })) as ResponseWithError;

  if (response.error) {
    handleErrorMessage(response.error);

    return false;
  }

  const responseData = response.data;

  if (responseData.status === 'ok') {
    return responseData.token;
  }

  const message = responseData.message ? `${responseData.info}: ${responseData.message}` : responseData.info;

  alert.popUpError({ message });

  return null;
};

export const signInWithFBToken = async (fb_token: string): Promise<boolean> => {
  if (OAUTH_TOKEN.has(fb_token)) {
    return false;
  }

  OAUTH_TOKEN.add(fb_token);
  progress.openNonstopProgress({ id: 'flux-id-login' });

  const response = (await axiosFluxId.post(
    '/user/signin',
    { fb_token },
    {
      withCredentials: true,
    },
  )) as ResponseWithError;

  progress.popById('flux-id-login');

  if (response.error) {
    handleErrorMessage(response.error);

    return false;
  }

  const { data } = response;

  if (data.status === 'ok') {
    handleOAuthLoginSuccess(data);
    await getInfo({ isWebSocialSignIn: true, silent: true });

    return true;
  }

  const message = data.message ? `${data.info}: ${data.message}` : data.info;

  alert.popUpError({ message });

  return false;
};

export const signInWithGoogleCode = async (info: { [key: string]: string }): Promise<boolean> => {
  const data = {
    google_code: info.code,
    redirect_uri: info.redirect_url,
  };

  if (OAUTH_TOKEN.has(data.google_code)) {
    return false;
  }

  OAUTH_TOKEN.add(data.google_code);
  progress.openNonstopProgress({ id: 'flux-id-login' });

  const response = (await axiosFluxId.post('/user/signin', data, {
    withCredentials: true,
  })) as ResponseWithError;

  progress.popById('flux-id-login');

  if (response.error) {
    handleErrorMessage(response.error);

    return false;
  }

  const responseData = response.data;

  if (responseData.status === 'ok') {
    handleOAuthLoginSuccess(responseData);
    await getInfo({ isWebSocialSignIn: true, silent: true });

    return true;
  }

  const message = responseData.message ? `${responseData.info}: ${responseData.message}` : responseData.info;

  alert.popUpError({ message });

  return false;
};

export const signOut = async (): Promise<boolean> => {
  const response = await axiosFluxId.get('/user/logout', {
    withCredentials: true,
  });

  if (response.status === 200) {
    updateUser();
    fluxIDEvents.emit('logged-out');

    return response.data;
  }

  return false;
};

const setHeaders = (csrftoken: string) => {
  axiosFluxId.defaults.headers.post['X-CSRFToken'] = csrftoken;
  axiosFluxId.defaults.headers.put['X-CSRFToken'] = csrftoken;
  axiosFluxId.defaults.headers.delete['X-CSRFToken'] = csrftoken;
};

export const init = async (): Promise<void> => {
  axiosFluxId.defaults.withCredentials = true;

  if (!isWeb()) {
    // Set csrf cookie for electron only
    cookies.on('changed', (event, cookie, cause, removed) => {
      if (cookie.domain === FLUXID_DOMAIN && cookie.name === 'csrftoken' && !removed) {
        setHeaders(cookie.value);
      }
    });
  }

  communicator.on('FB_AUTH_TOKEN', (_: Event, dataString: string) => {
    const data = parseQueryData(dataString);
    const token = data.access_token;

    signInWithFBToken(token);
  });
  communicator.on('GOOGLE_AUTH', (e: Event, dataString: string) => {
    const data = parseQueryData(dataString);

    signInWithGoogleCode(data);
  });

  if (!isWeb()) {
    // Init csrftoken for electron
    const csrfcookies = await cookies.get({
      domain: FLUXID_DOMAIN,
      name: 'csrftoken',
    });

    if (csrfcookies.length > 0) {
      // Should be unique
      setHeaders(csrfcookies[0].value);
    }
  }

  const res = await getInfo({ sendToOtherTabs: false, silent: true });

  if (res && res.status !== 'ok') {
    updateMenu();
  }
};

export const externalLinkFBSignIn = (): void => {
  const fbAuthUrl = `${FB_OAUTH_URI}?client_id=${FB_APP_ID}&redirect_uri=${getRedirectUri()}&response_type=token&scope=email`;

  browser.open(fbAuthUrl);
};

export const externalLinkGoogleSignIn = (): void => {
  const gAuthUrl = `${G_OAUTH_URL}?client_id=${G_CLIENT_ID}&redirect_uri=${getRedirectUri()}&response_type=code&scope=email+profile`;

  browser.open(gAuthUrl);
};

export const externalLinkMemberDashboard = async (): Promise<void> => {
  const token = await getAccessToken();

  if (token) {
    const langPath = i18n.getActiveLang() === 'zh-tw' ? 'zh-TW' : 'en-US';
    const url = `https://member.flux3dp.com/${langPath}/oauth/${token}?next=/account`;

    browser.open(url);
  }
};

export const signIn = async (signInData: { email: string; expires_session?: boolean; password?: string }) => {
  progress.openNonstopProgress({ id: 'flux-id-login' });

  const response = (await axiosFluxId.post('/user/signin', signInData, {
    withCredentials: true,
  })) as ResponseWithError;

  progress.popById('flux-id-login');

  if (response.status === 200) {
    const { data } = response;

    if (data.status === 'ok') {
      updateUser({ email: data.email });
      await getInfo({ silent: true });
    }

    return data;
  }

  handleErrorMessage(response.error);

  return response;
};

export const submitRating = async (ratingData: { app: string; score: number; user?: string; version: string }) => {
  const response = (await axiosFluxId.post('/user_rating/submit_rating', ratingData, {
    withCredentials: true,
  })) as ResponseWithError;

  if (response.status === 200) {
    const { data } = response;

    if (data.status === 'ok') {
      updateUser({ email: data.email });
    }

    return data;
  }

  handleErrorMessage(response.error);

  return response;
};

export const getPreference = async (key = '', silent = false) => {
  const response = (await axiosFluxId.get(`software-preference/bxpref/${key}`, {
    withCredentials: true,
  })) as ResponseWithError;

  if (response.status === 200) {
    const { data } = response;

    return data;
  }

  if (!silent) {
    handleErrorMessage(response.error);
  }

  return response;
};

export const setPreference = async (value: { [key: string]: any }): Promise<boolean> => {
  const response = (await axiosFluxId.post('software-preference/bxpref', value, {
    withCredentials: true,
  })) as ResponseWithError;

  if (response.status === 200) {
    const { data } = response;

    if (data.status === 'ok') {
      return true;
    }
  }

  return false;
};

export const getNPIconsByTerm = async (term: string, nextPage?: string): Promise<IData | null> => {
  const response = (await axiosFluxId.get(`/api/np/icons/${term}`, {
    params: {
      next_page: nextPage,
    },
    withCredentials: true,
  })) as ResponseWithError;

  if (response.error) {
    handleErrorMessage(response.error);

    return null;
  }

  return response.data.data;
};

export const getNPIconByID = async (id: string): Promise<null | string> => {
  const response = (await axiosFluxId.get(`/api/np/icon/${id}`, {
    withCredentials: true,
  })) as ResponseWithError;

  if (response.error) {
    handleErrorMessage(response.error);

    return null;
  }

  return response.data.base64;
};

export const getDefaultHeader = () => {
  if (isWeb()) {
    const csrfToken = cookies.getBrowserCookie('csrftoken');

    return {
      'X-CSRFToken': csrfToken,
    };
  }

  return undefined;
};

export default {
  getPreference,
  init,
  setPreference,
};
