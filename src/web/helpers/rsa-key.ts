import storage from 'helpers/storage-helper';

const RSA_KEY_NAME = 'flux-rsa-key';
const { JSEncrypt } = requireNode('jsencrypt');

export default function(createNewKey: boolean = false) {
    if (createNewKey || !storage.isExisting(RSA_KEY_NAME)) {
        const rsaCipher = new JSEncrypt({ default_key_size: 1024 });
        const newKey = rsaCipher.getPrivateKey();
        storage.set(RSA_KEY_NAME, newKey);
        return newKey;
    } else {
        const rsaKey = storage.get(RSA_KEY_NAME);
        return rsaKey;
    }
};
