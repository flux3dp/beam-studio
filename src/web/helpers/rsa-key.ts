import LocalStorage from './local-storage';
// @ts-expect-error
import _JSEncrypt = require('jsencrypt');
const RSA_KEY_NAME = 'flux-rsa-key';
console.log("JSEncrypt", _JSEncrypt);

export default function(createNewKey: boolean = false) {
    // @ts-expect-error
    let rsaCipher = new JSEncrypt({ default_key_size: 1024 }),
        newKey = rsaCipher.getPrivateKey(),
        rsaKey = LocalStorage.get(RSA_KEY_NAME) || newKey;

    if (!LocalStorage.isExisting(RSA_KEY_NAME)) {
        LocalStorage.set(RSA_KEY_NAME, rsaKey);
    }

    return (createNewKey ? newKey : rsaKey);
};
