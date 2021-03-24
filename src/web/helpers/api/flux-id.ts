import alert from 'app/actions/alert-caller';
import dialog from 'app/actions/dialog-caller';
import progress from 'app/actions/progress-caller';
import storage from 'helpers/storage-helper';
import i18n from 'helpers/i18n';

const axios = requireNode('axios');
const electron = requireNode('electron');

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

const parseHashStringData = (hashString: string) => {
    if (hashString.startsWith('#')) {
        hashString = hashString.slice(1);
    }
    const pairs = hashString.split('&');
    const data: { access_token?: string } = {};
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
    electron.ipcRenderer.on('FB_AUTH_TOKEN', (e, hashString: string) => {
        const data = parseHashStringData(hashString);
        const token = data.access_token;
        signInWithFBToken(token);
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
    // TODO: Update redirect URL & FB App ID
    const FB_APP_ID = '151570246832729';
    const REDIRECT_URI = 'http://localhost:8001/user/fb-auth';
    const fbAuthUri = `https://www.facebook.com/v10.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=email`;
    electron.remote.shell.openExternal(fbAuthUri);
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
    } else if (data.info === 'USER_NOT_FOUND') {
        signUpWithFBToken(fb_token);
        return;
    }
    const message = data.message ? `${data.info}: ${data.message}` : data.info;
    alert.popUpError({ message });
}

const signUpWithFBToken = async (fb_token: string) => {
    progress.openNonstopProgress({ id: 'flux-id-login' });
    const response = await axiosFluxId.post('/user/signup', { fb_token }, {
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
