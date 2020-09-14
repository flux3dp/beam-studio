import LocalStorage from './local-storage';

const RSA_KEY_NAME = 'flux-rsa-key';
const { JSEncrypt } = requireNode('jsencrypt');

export default function(createNewKey: boolean = false) {
    if (createNewKey || !LocalStorage.isExisting(RSA_KEY_NAME)) {
        const rsaCipher = new JSEncrypt({ default_key_size: 1024 });
        const newKey = rsaCipher.getPrivateKey();
        LocalStorage.set(RSA_KEY_NAME, newKey);
        return newKey;
    } else {
        const rsaKey = LocalStorage.get(RSA_KEY_NAME);
        return rsaKey;
    }
};
