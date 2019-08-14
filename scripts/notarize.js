exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;  
  if (electronPlatformName !== 'darwin') {
    return;
  }

  require('dotenv').config();
  const { notarize } = require('electron-notarize');

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: 'com.flux3dp.beam-studio',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
  });
};