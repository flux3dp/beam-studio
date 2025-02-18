import CryptoJS from 'crypto-js';

export const sha256 = (message = ''): string => CryptoJS.SHA256(message).toString();
