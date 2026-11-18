// customSign.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// True when the PE file already carries an embedded Authenticode signature (non-empty
// certificate table, data directory 4). Swiftray's zip ships with its Qt dlls pre-signed.
// .pyd files are PE dlls too, so the same header layout applies.
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

  // Smart App Control blocks unsigned dlls and Python .pyd modules (Bad Image 0xc0e90002), so sign the ones
  // under backend/ (Swiftray, flux_api). Exe files are signed as before.
  const isLibrary = ['.dll', '.pyd'].some((ext) => configuration.path.endsWith(ext));

  if (isLibrary && !configuration.path.split(path.sep).includes('backend')) {
    return Promise.resolve();
  }

  // Signing a pre-signed file again only costs an upload and replaces Microsoft's or Python's own signatures
  if (isLibrary && hasEmbeddedSignature(configuration.path)) {
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
