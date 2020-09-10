define([
    'helpers/local-storage',
    // non-return
    'lib/jsencrypt'
], function(LocalStorage) {
    'use strict';

    return function(createNewKey) {
        var RSA_KEY_NAME = 'flux-rsa-key',
            rsaCipher = new JSEncrypt({ default_key_size: 1024 }),
            newKey = rsaCipher.getPrivateKey(),
            rsaKey = LocalStorage.get(RSA_KEY_NAME) || newKey;

        if (!LocalStorage.isExisting(RSA_KEY_NAME)) {
            LocalStorage.set(RSA_KEY_NAME, rsaKey);
        }

        return (true === createNewKey ? newKey : rsaKey);
    };
});