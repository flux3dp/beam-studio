// customSign.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// True when the PE file already carries an embedded Authenticode signature (non-empty
// certificate table, data directory 4). Swiftray's zip ships with its Qt dlls pre-signed.
const hasEmbeddedSignature = (filePath) => {
  const header = Buffer.alloc(4096);
  const fd = fs.openSync(filePath, 'r');
  try {
    fs.readSync(fd, header, 0, header.length, 0);
  } finally {
    fs.closeSync(fd);
  }
  const optionalHeader = header.readUInt32LE(0x3c) + 24;
  const isPe32Plus = header.readUInt16LE(optionalHeader) === 0x20b;
  const certificateTable = optionalHeader + (isPe32Plus ? 112 : 96) + 4 * 8;
  return header.readUInt32LE(certificateTable + 4) > 0;
};

module.exports = async function customSign(configuration, packager) {
  const timeout = parseInt(process.env.SIGNTOOL_TIMEOUT, 10) || 10 * 60 * 60 * 1000; // 10 hours
  const { exec } = require('child_process');
  const { statSync } = require('fs');

  if (process.env.SKIP_CODE_SIGN === 'true') {
    return Promise.resolve();
  }

  // Only sign dlls under backend/swiftray (Smart App Control blocks unsigned Qt dlls); exe files are signed as before.
  if (configuration.path.endsWith('.dll') && !configuration.path.split(path.sep).includes('swiftray')) {
    return Promise.resolve();
  }

  // Signing a pre-signed dll again only costs an upload per file and replaces Microsoft's own signatures
  if (configuration.path.endsWith('.dll') && hasEmbeddedSignature(configuration.path)) {
    console.log('Already signed, skipping:', configuration.path);
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
