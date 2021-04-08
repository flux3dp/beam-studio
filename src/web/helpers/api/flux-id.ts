import alert from 'app/actions/alert-caller';
import progress from 'app/actions/progress-caller';
import parseQueryData from 'helpers/query-data-parser';
import storage from 'helpers/storage-helper';
import i18n from 'helpers/i18n';
import { IUser } from 'interfaces/IUser';

const axios = requireNode('axios');
const electron = requireNode('electron');
const EventEmitter = requireNode('events');

const FB_OAUTH_URI = 'https://www.facebook.com/v10.0/dialog/oauth';
const FB_APP_ID = '1071530792957137';
const FB_REDIRECT_URI = 'https://store.flux3dp.com/beam-studio-oauth';

const G_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const G_CLIENT_ID = '1071432315622-ekdkc89hdt70sevt6iv9ia4659lg70vi.apps.googleusercontent.com';
const G_REDIRECT_URI = 'https://store.flux3dp.com/beam-studio-oauth';

const FLUXID_HOST = 'https://id.flux3dp.com';
const FLUXID_DOMAIN = 'id.flux3dp.com';
const axiosFluxId = axios.create({
    baseURL: FLUXID_HOST,
    timeout: 2000,
});

let currentUser: IUser = null;

axiosFluxId.interceptors.response.use((response) => {
    return response;
}, (error) => {
    return { error };
});

export const fluxIDEvents = new EventEmitter();

const handleErrorMessage = (error) => {
    if (!error) {
        return;
    }
    const response = error.response;
    if (!response) {
        alert.popUpError({ message: i18n.lang.flux_id_login.connection_fail });
    } else {
        const message = `${response.status} ${response.statusText}`;
        alert.popUpError({ message });
    }
}

const updateMenu = (info?) => {
    electron.ipcRenderer.send('UPDATE_ACCOUNT', info);
};

const updateUser = (info?) => {
    if (info) {
        if (!currentUser) {
            updateMenu(info);
            currentUser = {
                email: info.email,
                info,
            };
            fluxIDEvents.emit('update-user', currentUser);
        } else {
            if (currentUser.email !== info.email) {
                updateMenu(info);
            }
            Object.assign(currentUser.info, info);
        }
    } else {
        if (currentUser) {
            currentUser = null;
            updateMenu();
            fluxIDEvents.emit('update-user');
        }
    }
};

export const getCurrentUser = () => currentUser;

const handleOAuthLoginSuccess = (data) => {
    updateUser(data);
    fluxIDEvents.emit('oauth-logged-in');
    if (location.hash === '#initialize/connect/flux-id-login') {
        location.hash = '#initialize/connect/select-connection-type';
    } else {
        alert.popUp({ message: i18n.lang.flux_id_login.login_success });
    }
};

export const init = async () => {
    const cookies = electron.remote.session.defaultSession.cookies;
    cookies.on('changed', (event, cookie, cause, removed) => {
        if (cookie.domain === FLUXID_DOMAIN && cookie.name === 'csrftoken' && !removed) {
            axiosFluxId.defaults.headers.post['X-CSRFToken'] = cookie.value;
        }
    });
    electron.ipcRenderer.on('FB_AUTH_TOKEN', (e, dataString: string) => {
        const data = parseQueryData(dataString);
        const token = data.access_token;
        signInWithFBToken(token);
    });
    electron.ipcRenderer.on('GOOGLE_AUTH', (e, dataString: string) => {
        const data = parseQueryData(dataString);
        signInWithGoogleCode(data);
    });
    if (storage.get('keep-flux-id-login') || storage.get('new-user')) {
        // If user is new, keep login status after setting machines.
        const csrfcookies = await cookies.get({
            domain: FLUXID_DOMAIN,
            name: 'csrftoken'
        });
        if (csrfcookies.length > 0) {
            // Should be unique
            axiosFluxId.defaults.headers.post['X-CSRFToken'] = csrfcookies[0].value;
        }
        const res = await getInfo(true);
        if (res.status !== 'ok') {
            updateMenu();
        }
    } else {
        const fluxIdCookies = await cookies.get({
            domain: FLUXID_DOMAIN,
        });
        fluxIdCookies.forEach((cookie) => {
            let url = '';
            url += cookie.secure ? 'https://' : 'http://';
            url += cookie.domain.charAt(0) === '.' ? 'www' : '';
            url += cookie.domain;
            url += cookie.path;

            cookies.remove(url, cookie.name, (error) => {
              if (error) console.log(`error removing cookie ${cookie.name}`, error);
            });
        });
        updateMenu();
    }
};

export const externalLinkFBSignIn = () => {
    const fbAuthUrl = `${FB_OAUTH_URI}?client_id=${FB_APP_ID}&redirect_uri=${FB_REDIRECT_URI}&response_type=token&scope=email`;
    electron.remote.shell.openExternal(fbAuthUrl);
};

export const externalLinkGoogleSignIn = () => {
    const gAuthUrl = `${G_OAUTH_URL}?client_id=${G_CLIENT_ID}&redirect_uri=${G_REDIRECT_URI}&response_type=code&scope=email+profile`;
    electron.remote.shell.openExternal(gAuthUrl);
};

export const externalLinkMemberDashboard = async () => {
    const token = await getAccessToken();
    if (token) {
        const urlPrefix = i18n.getActiveLang() === 'zh-tw' ? 'tw-' : '';
        const url = `https://${urlPrefix}store.flux3dp.com/api_entry/?feature=beam-studio-login&key=${token}`
        electron.remote.shell.openExternal(url);
    }
}

export const signIn = async (data: { email: string, password?: string, fb_token?: string }) => {
    progress.openNonstopProgress({ id: 'flux-id-login' });
    const response = await axiosFluxId.post('/user/signin', data, {
        withCredentials: true,
    });
    progress.popById('flux-id-login');
    if (response.status === 200) {
        const data = response.data;
        if (data.status === 'ok') {
            updateUser({ email: data.email });
        }
        return data;
    }
    handleErrorMessage(response.error);
    return response;
};

const signInWithFBToken = async (fb_token: string) => {
    progress.openNonstopProgress({ id: 'flux-id-login' });
    const response = await axiosFluxId.post('/user/signin', { fb_token }, {
        withCredentials: true,
    });
    progress.popById('flux-id-login');
    if (response.error) {
        handleErrorMessage(response.error);
        return false;
    }

    const data = response.data;
    if (data.status === 'ok') {
        handleOAuthLoginSuccess(data);
        return true;
    }
    const message = data.message ? `${data.info}: ${data.message}` : data.info;
    alert.popUpError({ message });
    return false;
}

const signInWithGoogleCode = async (data) => {
    data = {
        google_code: data.code,
        redirect_uri: data.redirect_url,
    };
    progress.openNonstopProgress({ id: 'flux-id-login' });
    const response = await axiosFluxId.post('/user/signin', data, {
        withCredentials: true,
    });
    console.log(response);
    progress.popById('flux-id-login');

    if (response.error) {
        handleErrorMessage(response.error);
        return false;
    }

    const responseData = response.data;
    if (responseData.status === 'ok') {
        handleOAuthLoginSuccess(responseData);
        return true;
    }
    const message = responseData.message ? `${responseData.info}: ${responseData.message}` : responseData.info;
    alert.popUpError({ message });
    return false;
}

export const signOut = async () => {
    const response = await axiosFluxId.get('/user/logout', {
        withCredentials: true,
    });
    if (response.status === 200) {
        updateUser();
        fluxIDEvents.emit('logged-out');
        return response.data;
    }
    return false;
}

export const getInfo = async (silent: boolean = false) => {
    const response = await axiosFluxId.get('/user/info', {
        withCredentials: true,
    });
    if (response.error) {
        if (!silent) {
            handleErrorMessage(response.error);
        }
        return false;
    }
    const responseData = response.data;
    if (response.status === 200) {
        if (responseData.status === 'ok') {
            updateUser(responseData);
        }
        return responseData;
    }
    if (!silent) {
        const message = responseData.message ? `${responseData.info}: ${responseData.message}` : responseData.info;
        alert.popUpError({ message });
    }
    return false;
};

const getAccessToken = async () => {
    const response = await axiosFluxId.get('/oauth/', {
        params: {
            response_type: 'token',
        }
    }, {
        withCredentials: true,
    });
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
    return false;
}

export const getNPIconsByTerm = async (term: string, offset: number = 0) => {
    const response = await axiosFluxId.get(`/api/np/icons/${term}`, {
        params: {
            offset,
        }
    }, {
        withCredentials: true,
    });
    if (response.error) {
        handleErrorMessage(response.error);
        return false;
    }

    return response.data;
}

export const getNPIconByID = async (id: string) => {
    const response = await axiosFluxId.get(`/api/np/icon/${id}`, {
        withCredentials: true,
    });
    if (response.error) {
        handleErrorMessage(response.error);
        return false;
    }
    console.log(response.data);
    return response.data;
}

export default {
    init,
};
