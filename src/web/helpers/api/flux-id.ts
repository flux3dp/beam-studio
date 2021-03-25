import alert from 'app/actions/alert-caller';
import dialog from 'app/actions/dialog-caller';
import progress from 'app/actions/progress-caller';
import storage from 'helpers/storage-helper';
import i18n from 'helpers/i18n';

const axios = requireNode('axios');
const electron = requireNode('electron');

// TODO: Update redirect URL & FB App ID
const FB_OAUTH_URI = 'https://www.facebook.com/v10.0/dialog/oauth';
const FB_APP_ID = '151570246832729';
const FB_REDIRECT_URI = 'http://localhost:8001/user/fb-auth';

const G_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const G_CLIENT_ID = '923029051122-rbt88kegp89eh1j3pu99fu5fus92f178.apps.googleusercontent.com';
const G_REDIRECT_URI = 'http://localhost:8001/user/google-auth';

// TODO: Update FLUXID url
const FLUXID_HOST = 'http://127.0.0.1:8001';
const FLUXID_DOMAIN = '127.0.0.1';
const axiosFluxId = axios.create({
    baseURL: FLUXID_HOST,
    timeout: 2000,
});

axiosFluxId.interceptors.response.use((response) => {
    return response;
}, (error) => {
    return { error };
});

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

const parseData = (hashString: string) => {
    if (hashString.startsWith('#')) {
        hashString = hashString.slice(1);
    }
    const pairs = hashString.split('&');
    const data: { access_token?: string, code?: string } = {};
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].split('=');
        if (pair.length > 1) {
            data[pair[0]] = pair[1];
        }
    }
    return data;
};

const handleOAuthLoginSuccess = (data) => {
    updateMenu(data);
    dialog.popDialogById('flux-id-login');
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
        const data = parseData(dataString);
        const token = data.access_token;
        signInWithFBToken(token);
    });
    electron.ipcRenderer.on('GOOGLE_AUTH', (e, dataString: string) => {
        const data = parseData(dataString);
        signInWithGoogleCode(data);
    });
    if (storage.get('keep-flux-id-login')) {
        const csrfcookies = await cookies.get({
            domain: FLUXID_DOMAIN,
            name: 'csrftoken'
        });
        if (csrfcookies.length > 0) {
            // Should be unique
            axiosFluxId.defaults.headers.post['X-CSRFToken'] = csrfcookies[0].value;
        }
        const res = await getInfo();
        if (res.status === 'ok') {
            updateMenu(res);
        } else {
            updateMenu();
        }
    } else {
        const fluxIdCookies = await cookies.get({
            domain: FLUXID_DOMAIN,
        });
        fluxIdCookies.forEach((cookie) => {
            let url = '';
            // get prefix, like https://www.
            url += cookie.secure ? 'https://' : 'http://';
            url += cookie.domain.charAt(0) === '.' ? 'www' : '';
            // append domain and path
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

export const signIn = async (data: { email: string, password?: string, fb_token?: string }) => {
    progress.openNonstopProgress({ id: 'flux-id-login' });
    const response = await axiosFluxId.post('/user/signin', data, {
        withCredentials: true,
    });
    progress.popById('flux-id-login');
    if (response.status === 200) {
        const data = response.data;
        if (data.status === 'ok') {
            updateMenu({ email: data.email });
        }
        return data;
    }
    handleErrorMessage(response.error);
    return response;
};

const signInWithFBToken = async (fb_token: string) => {
    progress.openNonstopProgress({ id: 'flux-id-login' });
    await signOut();
    const response = await axiosFluxId.post('/user/signin', { fb_token }, {
        withCredentials: true,
    });
    progress.popById('flux-id-login');
    if (response.error) {
        handleErrorMessage(response.error);
        return;
    }

    const data = response.data;
    if (data.status === 'ok') {
        handleOAuthLoginSuccess(data);
        return;
    }
    const message = data.message ? `${data.info}: ${data.message}` : data.info;
    alert.popUpError({ message });
}

const signInWithGoogleCode = async (data) => {
    progress.openNonstopProgress({ id: 'flux-id-login' });
    await signOut();
    const response = await axiosFluxId.post('/user/signin', data, {
        withCredentials: true,
    });
    console.log(response);
    progress.popById('flux-id-login');

    if (response.error) {
        handleErrorMessage(response.error);
        return;
    }

    const responseData = response.data;
    if (responseData.status === 'ok') {
        handleOAuthLoginSuccess(responseData);
        return;
    }
    const message = responseData.message ? `${responseData.info}: ${responseData.message}` : responseData.info;
    alert.popUpError({ message });
}

export const signOut = async () => {
    const response = await axiosFluxId.get('/user/logout', {
        withCredentials: true,
    });
    if (response.status === 200) {
        updateMenu();
    }
    return response;
}

export const getInfo = async () => {
    const response = await axiosFluxId.get('/user/info', {
        withCredentials: true,
    });
    if (response.status === 200) {
        return response.data;
    }
    return response;
};

export default {
    init,
    signIn,
    externalLinkFBSignIn,
    signOut,
    getInfo,
};
