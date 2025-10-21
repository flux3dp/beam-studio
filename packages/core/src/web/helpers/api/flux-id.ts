import type { AxiosError, AxiosResponse } from 'axios';
import axios from 'axios';
import { funnel } from 'remeda';

import alert from '@core/app/actions/alert-caller';
import progress from '@core/app/actions/progress-caller';
import { TabEvents } from '@core/app/constants/tabConstants';
import deviceMaster from '@core/helpers/device-master';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import parseQueryData from '@core/helpers/query-data-parser';
import browser from '@core/implementations/browser';
import communicator from '@core/implementations/communicator';
import cookies from '@core/implementations/cookies';
import storage from '@core/implementations/storage';
import type { Cookie } from '@core/interfaces/ICookies';
import type { IData } from '@core/interfaces/INounProject';
import type { IUser } from '@core/interfaces/IUser';

export interface ResponseWithError<T = any, D = any> extends AxiosResponse<T, D> {
  error?: AxiosError<T, D>;
}

export const FLUXID_HOST = 'https://id-test.flux3dp.com';
// export const FLUXID_HOST = 'http://localhost:8001';

const OAUTH_REDIRECT_URI = `${FLUXID_HOST}/api/beam-studio/auth`;
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

const FLUXID_DOMAIN = '.flux3dp.com';

export const axiosFluxId = axios.create({ baseURL: FLUXID_HOST, timeout: 10000 });

let currentUser: IUser | null = null;

axiosFluxId.interceptors.response.use(
  (response) => response,
  (error) => ({ error }),
);

export const fluxIDChannel = new BroadcastChannel('flux-id');
export const fluxIDEvents = eventEmitterFactory.createEventEmitter('flux-id');

const handleErrorMessage = (error?: AxiosError) => {
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

const updateAccountMenu = (user: IUser | null = null) => {
  if (!isWeb()) {
    communicator.send('UPDATE_ACCOUNT', user);
  }
};

const broadcastUserChanges = funnel(
  () => {
    const info = currentUser?.info ?? null;

    if (isWeb()) {
      fluxIDChannel.postMessage({ event: 'update-user', info });
    } else {
      communicator.send(TabEvents.UpdateUser, info);
    }
  },
  { minQuietPeriodMs: 2000, triggerAt: 'both' },
);

const updateUser = (info?: IUser | null, { sendToOtherTabs = true }: { sendToOtherTabs?: boolean } = {}) => {
  const emailChanged = currentUser?.email !== info?.email;
  const isSignIn = !currentUser && info?.email;

  if (info) {
    if (currentUser && !emailChanged) {
      // Update info data without deleting existing properties
      Object.assign(currentUser.info, info);
    } else {
      currentUser = { email: info.email, info };
    }
  } else {
    currentUser = null;
  }

  fluxIDEvents.emit('update-user', currentUser);

  if (sendToOtherTabs) {
    broadcastUserChanges.call();

    if (emailChanged) {
      updateAccountMenu(currentUser);
    }
  } else if (isSignIn) {
    // Close login dialog and handle callbacks
    // if logging from other tabs or loggin by web oauth
    fluxIDEvents.emit('DISMISS_FLUX_LOGIN');
  }
};

// broadcastUserChanges receiver for electron
communicator.on(TabEvents.UpdateUser, (_: Event, user: IUser | null) => {
  updateUser(user, { sendToOtherTabs: false });
});

// broadcastUserChanges receiver for web
fluxIDChannel.onmessage = (event) => {
  if (event.data.event === 'update-user') {
    const { info } = event.data;

    updateUser(info, { sendToOtherTabs: false });
  }
};

export const getCurrentUser = (): IUser | null => currentUser;

// Note: In electron, this function is called in the same tab as the login dialog,
// while in the web version, it is called in a different tab redirecting from the oauth website
const handleOAuthLoginSuccess = (data: IUser) => {
  storage.set('keep-flux-id-login', true);
  updateUser(data);
  // Close login dialog in electron tab
  fluxIDEvents.emit('DISMISS_FLUX_LOGIN');
};

/**
 * Get full user info
 * @returns
 * - null if api error
 * - IUser with status = 'ok' if logged in
 * - { info: string, status: 'error' } if not logged in or not verified
 */
export const getInfo = async ({
  sendToOtherTabs = true,
  silent = false,
}: { sendToOtherTabs?: boolean; silent?: boolean } = {}): Promise<
  (IUser & { status: 'ok' }) | null | { info: string; message: null | string; status: 'error' }
> => {
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
      updateUser(responseData, { sendToOtherTabs });
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
    await getInfo({ silent: true });

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
    await getInfo({ silent: true });

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
    cookies.on('changed', (_event: any, cookie: Cookie, _cause: string, removed: boolean) => {
      if (cookie.domain === FLUXID_DOMAIN && cookie.name === 'csrftoken' && !removed) {
        setHeaders(cookie.value);
      }
    });

    // Setup oauth events for electron
    communicator.on('FB_AUTH_TOKEN', (_: Event, dataString: string) => {
      const data = parseQueryData(dataString);
      const token = data.access_token;

      signInWithFBToken(token);
    });
    communicator.on('GOOGLE_AUTH', (e: Event, dataString: string) => {
      const data = parseQueryData(dataString);

      signInWithGoogleCode(data);
    });

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

  // Initialize user info for current tab
  await getInfo({ sendToOtherTabs: false, silent: true });
  updateAccountMenu(currentUser);
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

export const recordMachines = async (): Promise<void> => {
  let shouldRecord = true;

  try {
    const devices = deviceMaster.getAvailableDevices();
    const registeredMachines = storage.get('registered-devices', false) || [];
    const newMachines = devices
      .filter((device) => !registeredMachines.includes(device.serial) && device.model !== 'fpm1')
      .map((device) => device.serial);

    if (newMachines.length === 0) return;

    const response = (await axiosFluxId.post(
      '/machine/activity/beam-studio',
      { serials: newMachines },
      { withCredentials: true },
    )) as ResponseWithError;

    if (response.status === 200) {
      const { data } = response;

      if (data.status === 'ok') {
        storage.set('registered-devices', [...registeredMachines, ...newMachines]);
      } else if (data.info === 'IGNORED') {
        shouldRecord = false;
      }
    } else {
      shouldRecord = false;
    }
  } catch (error) {
    console.error('Error recording machines:', error);
    shouldRecord = false;
  } finally {
    if (shouldRecord) {
      setTimeout(recordMachines, 60000);
    }
  }
};

export default {
  getPreference,
  init,
  setPreference,
};
