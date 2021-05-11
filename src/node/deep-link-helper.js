const getDeeplinkUrl = (argv) => {
  return argv.find((s) => s.startsWith('beam-studio://'));
};

const handleDeepLinkUrl = (mainWindow, url) => {
  if (url) {
    url = new URL(decodeURI(url));
    console.log(url)
    if (url.hostname === 'fb-auth') {
      mainWindow.webContents.send('FB_AUTH_TOKEN', url.hash.slice(1));
    } else if (url.hostname === 'google-auth') {
      mainWindow.webContents.send('GOOGLE_AUTH', url.search.slice(1));
    }
  }
};

module.exports = {
  getDeeplinkUrl,
  handleDeepLinkUrl,
}
