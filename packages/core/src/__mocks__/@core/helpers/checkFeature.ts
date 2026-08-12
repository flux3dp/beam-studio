export const checkFpm1 = (): boolean => true;
export const checkBM24C = (): boolean => true;
export const checkBM2UV = (): boolean => true;
export const checkBM2CurveEngraving = (): boolean => true;
export const checkFUV1 = (): boolean => true;
// False by default so existing specs exercise the legacy preset UI; new-mode specs re-mock.
export const checkMaterialBrowser = (): boolean => false;
