const getDeeplinkUrl = (argv) => {
    return argv.find((s) => s.startsWith('beam-studio://'));
};

const handleDeepLinkUrl = (mainWindow, url) => {
    url = new URL(decodeURI(url));
    console.log(url)
    if (url.hostname === 'fb-auth') {
        mainWindow.webContents.send('FB_AUTH_TOKEN', url.hash);
    }
};

module.exports = {
    getDeeplinkUrl,
    handleDeepLinkUrl,
}