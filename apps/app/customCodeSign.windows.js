// customSign.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = async function customSign(configuration, packager) {
  const timeout = parseInt(process.env.SIGNTOOL_TIMEOUT, 10) || 10 * 60 * 60 * 1000; // 10 hours
  const { exec } = require('child_process');
  const { statSync } = require('fs');

  if (process.env.SKIP_CODE_SIGN === 'true') {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let retryTime = 0;

    const executeCodeSign = async () => {
      const filePath = configuration.path;
      const fileSize = statSync(filePath).size;
      const fileName = path.basename(filePath);
      const contentType = 'application/octet-stream';

      console.log('Signing file:', filePath, 'with size:', fileSize);

      exec(
        `curl -X POST -H "Content-Length: ${fileSize}" -H "Content-Type: ${contentType}" -H "Credential: ${process.env.WIN_CODESIGN_CREDENTIAL}" -H "File-Name: ${fileName}" --data-binary "@${filePath}" -o "${filePath}" ${process.env.WIN_CODESIGN_SERVER}`,
        { timeout, env: process.env },
        (err, stdout, stderr) => {
          console.log(stdout);
          if (err) {
            console.log(err);
            console.log(stderr);
            retryTime += 1;
            if (retryTime > 5) {
              reject(err);
            } else {
              executeCodeSign();
            }
          } else {
            resolve();
          }
        },
      );
    };

    executeCodeSign();
  });
};
