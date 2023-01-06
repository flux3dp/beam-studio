exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }
  console.log("==== Begin Notarizing!!! ====");
  require('dotenv').config();
  const { notarize } = require('@electron/notarize');

  const appName = context.packager.appInfo.productFilename;
  const appBundleId = context.packager.appInfo.platformSpecificOptions.category;
  console.log(`Notarizing with bundle ID: ${appBundleId}`);
  let result = await notarize({
    appBundleId,
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
  });
  console.log("==== Notarize Done. ====");
  return result;
};
