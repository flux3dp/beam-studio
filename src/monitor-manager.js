const fs = require('fs');
const os = require('os');

const exec = require('child_process').exec;
const execSync = require('child_process').execSync;

const sudo = require('sudo-prompt');

class MonitorManager {
    constructor (options) {
        this.killProcSync = this._killProcSync.bind(this);
        this.killProc = this._killProc.bind(this);
        this.startProc = this._startProc.bind(this);
    }

    _killProcSync = () => {
        if (process.platform === 'darwin') {
            try {
                execSync('pkill monitorexe');
            } catch(e) {
                //console.log(e);
            }
        } else if (process.platform === 'win32' && process.arch === 'x64') {
            try {
                execSync('taskkill /F /IM cygserver.exe');
            } catch(e) {
                //console.log(e);
            }
            try {
                execSync('taskkill /F /IM monitorexe.exe');
            } catch(e) {
                //console.log(e);
            }
        }
    }

    _killProc = () => {
        if (process.platform === 'darwin') {
            exec('pkill monitorexe', (err, data) => {
            if (err) {
                console.log('kill monitorexe err:', err);
            }
            console.log('kill monitorexe succeed');
        });
        } else if (process.platform === 'win32' && process.arch === 'x64') {
            exec('taskkill /F /IM cygserver.exe', (err, data) => {
                if (err) {
                    console.log('kill cygserver err:', err);
                }
                console.log('kill cygserver succeed');
            });
            exec('taskkill /F /IM monitorexe.exe', (err, data) => {
                if (err) {
                    console.log('kill monitorexe err:', err);
                }
                console.log('kill monitorexe succeed');
            });
        }
    }

    _startProc = () => {
        let monitor_cmd = null;
        let execFail = false;
        const sudo_options = {
            name: 'Beam Studio',
            icns: 'public/icon.png'
        };

        if (process.platform === 'darwin') {
            monitor_cmd = './backend/monitorexe-osx/monitorexe';
        } else if (process.platform === 'win32' && process.arch === 'x64') {
            monitor_cmd = '.\\backend\\monitorexe-win64\\monitorexe.exe';
            exec('.\\backend\\monitorexe-win64\\cygserver.exe', (err, data) => {
                if (err) {
                    console.log('cygserver err:', err);
                }
                console.log('cygserver data:', data);
            });
            if(!fs.existsSync('./backend/tmp')) {
                fs.mkdirSync('./backend/tmp')
            }
            if(!fs.existsSync('./backend/var')) {
                fs.mkdirSync('./backend/var')
            }
        }
        
        if (monitor_cmd) {
            // Try without sudo-prompt first
            exec(monitor_cmd, (err, data) => {
                if (err) {
                    console.log('monitorexe err:', err);
                    execFail = true;
                } else {
                    console.log('monitorexe data:');
                    console.log(data);
                }
            });
            if (execFail) {
                sudo.exec(monitor_cmd, sudo_options, (err, stdout, stderr) => {
                    if (err) {
                        console.log('sudo monitorexe err:', err);
                    }
                    console.log('sudo monitor out:');
                    console.log(stdout);
                });
            }
        }
    }
}

module.exports = MonitorManager;