import * as _localStorage from './local-storage'
// @ts-expect-error
import JSEncrypt = require('jsencrypt');
const RSA_KEY_NAME = 'flux-rsa-key';

export default function(createNewKey: boolean = false) {
    let rsaCipher = new JSEncrypt({ default_key_size: 1024 }),
        newKey = rsaCipher.getPrivateKey(),
        rsaKey = _localStorage.get(RSA_KEY_NAME) || newKey;

    if (!_localStorage.isExisting(RSA_KEY_NAME)) {
        _localStorage.set(RSA_KEY_NAME, rsaKey);
    }

    return (createNewKey ? newKey : rsaKey);
};