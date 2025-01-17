import JSEncrypt from 'jsencrypt';
import storage from 'implementations/storage';

const RSA_KEY_NAME = 'flux-rsa-key';

export default (createNewKey = false): string => {
  if (createNewKey || !storage.isExisting(RSA_KEY_NAME)) {
    const rsaCipher = new JSEncrypt({ default_key_size: '1024' });
    const newKey = rsaCipher.getPrivateKey();
    storage.set(RSA_KEY_NAME, newKey);
    return newKey;
  }
  return storage.get(RSA_KEY_NAME);
};
