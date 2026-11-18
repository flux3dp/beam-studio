// customSign.js
const { exec, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// True when the PE file has a non-empty certificate table (data directory 4). Cheap first pass:
// most unsigned files fail here without spawning signtool. .pyd files are PE dlls too.
const hasCertificateTable = (filePath) => {
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

// windows-latest has the Windows SDK but not on PATH; take the newest versioned signtool
const findSignTool = () => {
  const sdkBin = path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Windows Kits', '10', 'bin');
  const candidates = fs.existsSync(sdkBin)
    ? fs
        .readdirSync(sdkBin)
        .filter((dir) => dir.startsWith('10.'))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map((dir) => path.join(sdkBin, dir, 'x64', 'signtool.exe'))
    : [];

  return candidates.reverse().find((candidate) => fs.existsSync(candidate)) || 'signtool';
};

let signTool;

// True only for a valid, trusted Authenticode signature; a stale or corrupt certificate table gets re-signed.
// Files that keep a valid signature: Swiftray's pre-signed Qt dlls, Python's and Microsoft's own dlls.
const hasValidSignature = (filePath) => {
  if (!hasCertificateTable(filePath)) return false;

  signTool ??= findSignTool();

  return spawnSync(signTool, ['verify', '/pa', '/q', filePath]).status === 0;
};

module.exports = async function customSign(configuration, packager) {
  const timeout = parseInt(process.env.SIGNTOOL_TIMEOUT, 10) || 10 * 60 * 60 * 1000; // 10 hours
  const { exec } = require('child_process');
  const { statSync } = require('fs');

  if (process.env.SKIP_CODE_SIGN === 'true') {
    return Promise.resolve();
  }

  // Smart App Control blocks unsigned libraries (Bad Image 0xc0e90002): dlls and Python .pyd modules under
  // backend/ (Swiftray, flux_api with fluxclient/beamify) and native node modules in app.asar.unpacked
  // (fontmanager.node). Dlls outside backend/ are Electron's own and stay as they are. Exe files are always signed.
  const isLibrary = ['.dll', '.pyd', '.node'].some((ext) => configuration.path.endsWith(ext));

  if (configuration.path.endsWith('.dll') && !configuration.path.split(path.sep).includes('backend')) {
    return Promise.resolve();
  }

  // Signing a pre-signed file again only costs an upload and replaces Microsoft's or Python's own signatures
  if (isLibrary && hasValidSignature(configuration.path)) {
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
