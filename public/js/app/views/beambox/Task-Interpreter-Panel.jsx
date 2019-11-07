define([
    'react',
    'reactDOM',
    'jsx!widgets/Modal',
    'jsx!widgets/Select',
    'app/stores/beambox-store',
    'app/actions/beambox/bottom-right-funcs',
    'helpers/i18n'
], function(
    React,
    ReactDOM,
    Modal,
    SelectView,
    BeamboxStore,
    BottomRightFuncs,
    i18n
) {
    const LANG = i18n.lang.topmenu;
    const SerialPort = require('serialport');
    const LINES_PER_PAGE = 100;
    const MockBinding = require('@serialport/binding-mock')
    //SerialPort.Binding = MockBinding
    MockBinding.createPort('/dev/ROBOT', { echo: true, record: true });
    
    class TaskInterpreterPanel extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                show: false,
                file: null,
                firstIndex: 0,
                currentIndex: 0,
                connecting: false
            };
            this._ln = 0;
            this.file = null;
            this.port = null;
            this.playerState = 'idle';
            this.portOptions = [];
            this.gcodelist = [];
            this._ondataCB = () => {};
        }

        componentDidMount() {
            BeamboxStore.onShowTaskInterpreter(this._show.bind(this));
        }

        componentWillUnmount() {
        }

        _show() {
            this._updateSerialPortList();
            this.setState({
                show: true
            });
        }

        _close() {
            this._stop();
            if (this.port) {
                this.port.close();
            }
            this.setState({
                show: false,
                connecting: false
            });
        }

        async _updateSerialPortList() {
            let portsList = await SerialPort.list();
            this.portOptions = portsList.map(p => {
                return ({
                    value: p.path,
                    label: p.path,
                    select: this.state.selectedPort === p.path
                });
            });
            this.setState({selectedPort: portsList[0].path});
        }

        _handleConnect() {
            const openPort = () => {
                this.port = new SerialPort(this.state.selectedPort, {
                    baudRate: 230400,
                    dataBits: 8,
                    lock: false} ,err => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(`Successfully open port to ${this.state.selectedPort}`);
                    }
                });
                
                this.port.on('open', () => {
                    console.log('Port Opened');
                });

                this.port.on('close', () => {
                    console.log('Port Closed');
                });

                this.port.on('error', err => {
                    console.log('Port err:', err);
                });
                
                this.port.on('drain', () => {
                    console.log('drained');
                });
                
                this.port.on('data', data => {
                    console.log('Port:', data.toString());
                    this._ondataCB(data.toString());
                });
            }
            if (this.port && this.port.isOpen) {
                this.port.close(err => {
                    if (err) {
                        console.log('error on closing port', err);
                    }
                    openPort();
                });
            } else {
                openPort();
            }
            this.setState({connecting: true});
        }

        _handleDisconnect() {
            if (this.port && this.port.isOpen) {
                this.port.close(err => {
                    if (err) {
                        console.log('error on closing port', err);
                    }
                    this.maxBufferNumber = 0;
                });
            } else {
                console.log('No Current Port');
            }
            this.setState({connecting: false});
        }

        _openFile() {
            this.file = ReactDOM.findDOMNode(this.refs.taskInput).files[0];
            this._importGcode();
        }

        async _fromScene() {
            let gcodeBlob = await BottomRightFuncs.getGcode();
            const fileReader = new FileReader();
            fileReader.onloadend = (e) => {
                let gcodeList = e.target.result.split('\n');
                this.gcodelist = gcodeList;
                this.setState({
                    file: 'Current Scene',
                    firstIndex: 0,
                    currentIndex: 0
                });
            }
            fileReader.readAsText(gcodeBlob);
        }

        _importGcode() {
            if (this.file) {
                let reader = new FileReader();
                reader.onloadend = (e) => {
                    let str = e.target.result;
                    str = str.split('\n');
                    this.gcodelist = str.slice(0, 3000);
                    this.setState({
                        file: this.file,
                        firstIndex: 0,
                        currentIndex: 0
                    });
                };
                reader.readAsText(this.file);
            } else {
                console.log('No File Read');
            }
        }

        _onListWheel(e) {
            //console.log(e.deltaY);
            const maxScrollTop = $('.gcode-command-container').outerHeight() * LINES_PER_PAGE - $('.gcode-command-list').height();
            const currentScrollTop = $('.gcode-command-list').scrollTop();
            if (e.deltaY > 0 && currentScrollTop === maxScrollTop) {
                this.setState({firstIndex: this.state.firstIndex + LINES_PER_PAGE / 2}, () => {
                    $('.gcode-command-list').scrollTop(currentScrollTop - $('.gcode-command-container').outerHeight() * (LINES_PER_PAGE / 2));
                });
            } else if (e.deltaY < 0 && currentScrollTop === 0) {
                if (this.state.firstIndex === 0) {
                    return;
                } else {
                    this.setState({firstIndex: Math.max(0, this.state.firstIndex - LINES_PER_PAGE / 2)}, () => {
                        $('.gcode-command-list').scrollTop(currentScrollTop + $('.gcode-command-container').outerHeight() * (LINES_PER_PAGE / 2));
                    });
                }
            }
        }

        _onListScroll(e) {
            let position = (e.target.scrollTop / 20 + this.state.firstIndex) / this.gcodelist.length * $('.scroll-bar').height(); // 20 = $('.gcode-command-container').outerHeight()
            $('.slider').css({top: `${position}px`});
        }

        _onScrollbarMouseDown(e) {
            this.dragingScroll = true;
            this._scrollToTargetY(e.clientY);
        }

        _onScrollbarMouseMove(e) {
            if (this.dragingScroll) {
                this._scrollToTargetY(e.clientY);
            }
        }

        _onScrollbarMouseUp(e) {
            this.dragingScroll = false;
        }

        _scrollToTargetY(clientY) {
            let targetIndex = this.gcodelist.length * (clientY - $('.scroll-bar').position().top) / $('.scroll-bar').height();
            targetIndex = Math.max(0, Math.min(this.gcodelist.length - 10, targetIndex));
            //console.log(targetIndex);
            let firstIndex = Math.floor(targetIndex / (LINES_PER_PAGE / 2)) * (LINES_PER_PAGE / 2);
            let scrollTop = targetIndex % (LINES_PER_PAGE / 2) * 20; //20: $('gcode-command-container').outerHeight();
            this.setState({firstIndex: firstIndex}, () => {
                $('.gcode-command-list').scrollTop(scrollTop);
            });
        }

        _scrollToTargetIndex(targetIndex) {
            let firstIndex = Math.floor(targetIndex / (LINES_PER_PAGE / 2)) * (LINES_PER_PAGE / 2);
            let scrollTop = targetIndex % (LINES_PER_PAGE / 2) * 20;
            this.setState({firstIndex: firstIndex}, () => {
                $('.gcode-command-list').scrollTop(scrollTop);
            });
        }

        _sendCommand() {
            const command = ReactDOM.findDOMNode(this.refs.command).value;
            if (this.port && this.port.isOpen) {
                let suc = this.port.write(`${command}\n`);
                if (suc) {
                    console.log(`Successfully write:\n${command}`)
                }
                ReactDOM.findDOMNode(this.refs.command).value = '';
                ReactDOM.findDOMNode(this.refs.command).focus();
            }
        }

        _onKeyDown(e) {
            if (e.ctrlKey && e.key === 'x') {
                this._sendCtrlX();
            } else if (e.key === 'Enter') {
                this._sendCommand();
            }
        }

        _sendCtrlX() {
            if (this.port && this.port.isOpen) {
                let suc = this.port.write('\x18');
            }
        }

        _play() {
            if (this.playerState !== 'play') {
                this.playerState = 'play';
                this.gcodePlayerCB = this._playGcodeCurrentLine.bind(this);
                /*
                this.gcodePlayerCB = () => {
                    this._playGcodeCurrentLine.bind(this)());
                }*/
                this._playGcodeCurrentLine();
            }
        }

        _nextStep() {
            console.log(this.playerState);
            if (this.playerState !== 'play') {
                this.playerState = 'play';
                this.gcodePlayerCB = () => {
                    this.playerState = 'idle';
                }
                this._playGcodeCurrentLine();
            }
        }

        _pause() {
            this.gcodePlayerCB = () => {
                console.log('gcode player paused');
                this.playerState = 'idle';
            }
        }

        _stop() {
            if (this.playerState === 'play') {
                this.playerState = 'idle';
                this.gcodePlayerCB = () => {
                    console.log('gcode player stoped');
                    this.maxBufferNumber = 20;
                    let suc = this.port.write('\x18');
                    this.setState({currentIndex: 0});
                }
            } else {
                this.setState({currentIndex: 0});
            }
        }
        
        async _waitForHoming () {
            if (this.port && this.port.isOpen) {
                this.port.write('$H\n');
                let res = await this._waitForResponse('ok');
                if (res) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }

        _waitForResponse (res) {
            return new Promise((resolve, reject) => {
                let suc = false;
                if (this.port && this.port.isOpen) {
                    this._ondataCB = (data) => {
                        if (res) {
                            if (data.startsWith(res)) {
                                this._ondataCB = () => {};
                                suc = true;
                                resolve(data);
                            }
                        } else {
                            this._ondataCB = () => {};
                            suc = true;
                            resolve(data);
                        } 
                    }
                    setTimeout(() => {
                        if (!suc) {
                            this.playerState = 'idle';
                            console.log('Err: Wait for response time out');
                            resolve(false);
                        }
                    }, 3000);
                } else {
                    resolve(false);
                }
            });
        }

        _waitForBuffer(n) {
            return new Promise((resolve, reject) => {
                if (this.maxBufferNumber > n) {
                    resolve(true);
                } else {
                    let interval = window.setInterval(() => {
                        if (this.maxBufferNumber > n) {
                            resolve(true);
                            window.clearInterval(interval);
                        } else if (this.playerState === 'idle') {
                            resolve(false);
                        }
                    }, 50);
                }
            });
        }

        async _handleLineModeCommand(cmd, id) {
            if (cmd.startsWith('G')) {
                this._ln += 1;
                cmd = `N${this._ln} ${cmd}`;
                let c = 0;
                for (let i = 0; i < cmd.length; i++) {
                    if (cmd[i] != ' ') {
                        let ch = cmd[i].charCodeAt();
                        c ^= ch;
                        c += ch;
                    }
                }
                c %= 65536;
                await this._waitForBuffer(this._ln);
                //console.log(`l${this._ln + this._nonGlines -1}`, cmd);
                this.port.write(`${cmd} *${c}\n`);
                this._ondataCB = (data) => {
                    if (data.startsWith('L')) {
                        data = data.substring(1).split(' ');
                        this.maxBufferNumber = parseInt(data[0]) + 12 - data[1];
                    }
                    this._executedIndex = data[0] - data[1] + this._nonGlines -1;
                    //console.log(this._executedIndex);
                }
            } else {
                this._nonGlines += 1;
            }
        }

        async _playGcodeCurrentLine() {
            if (this.state.currentIndex === 0) {
                let homeResult = await this._waitForHoming();
                if (!homeResult) {
                    return;
                }
                console.log('1');
                this.port.write('$@\n');
                await this._waitForResponse('CTRL LINECHECK_ENABLED');
                this._ln = 0;
                this._nonGlines = 0;
                this.maxBufferNumber = 20;
            }
            if (this.state.currentIndex < this.gcodelist.length) {
                let cmd = this.gcodelist[this.state.currentIndex]
                await this._handleLineModeCommand(cmd, this.state.currentIndex);
                this.state.currentIndex += 1;

                if (this.state.currentIndex === this.gcodelist.length) {
                    this.playerState = 'idle';
                    this.gcodePlayerCB = () => {
                        this.setState({currentIndex: 0});
                        this.maxBufferNumber = 20;
                        console.log('gcode play end');
                        //this.port.write('\x18');
                    }
                } else {
                    this._scrollToTargetIndex(this.state.currentIndex);
                }
            } else {
                this.playerState = 'idle';
                    this.gcodePlayerCB = () => {
                        this.setState({currentIndex: 0});
                        console.log('gcode play end');
                    }
            }
            this.gcodePlayerCB();
        }

        _renderConnectButton() {
            if (this.state.connecting) {
                return this._renderButton('btn btn-default pull-right', () => this._handleDisconnect(), '斷');
            } else {
                return this._renderButton('btn btn-default pull-right', () => this._handleConnect(), 'Connect');
            }
        }

        _renderCommandList() {
            let cmds = [];
            for (let i = this.state.firstIndex; i < Math.min(this.gcodelist.length, this.state.firstIndex + LINES_PER_PAGE); i++) {
                let current = this.state.currentIndex === i ? 'current': '';
                cmds.push(
                    <div className={`gcode-command-container ${current}`} key={i}>
                        <div className="line-index">
                            {i}
                        </div>
                        <div className="gcode-command">
                            {this.gcodelist[i]}
                        </div>
                    </div>
                )
            }
            return cmds;
        }

        _renderButton(className, onClick, label, disabled) {
            if (disabled) {
                className += ' disabled';
            }
            return (
                <button
                    className={className}
                    onClick={onClick}
                    disabled={disabled}
                >{label}
                </button>
            )
        }

        render() {
            if (this.state.show) {
                let sliderHeight = Math.max($('.scroll-bar').height() * ((this.gcodelist.length > 10 )? (10 / this.gcodelist.length) : 1), 1);
                let {connecting} = this.state;
                return (
                    <Modal onClose={() => {this._close()}}>
                        <div className='task-interpreter-panel'>
                            <div className='select-port'>
                                <SelectView
                                    className={connecting ? 'disabled' : ''}
                                    disabled={connecting}
                                    options={this.portOptions}
                                    onChange={e => this.setState({selectedPort: e.target.value})}
                                />
                                {this._renderConnectButton()}
                            </div>
                            <div className='file-input'>
                                <input type="file" accept=".gcode,.fc,.g" maxLength="255" ref="taskInput"/>
                                {this._renderButton('btn btn-default pull-right', () => this._openFile(), 'Open')}
                                {this._renderButton('btn btn-default pull-right', () => this._fromScene(), 'Scene')}
                            </div>
                            <div className='command-input'>
                                <input type="text"
                                    className={connecting ? "" : "disabled"}
                                    disabled={!connecting}
                                    maxLength="255"
                                    ref="command"
                                    onKeyDown={e => {this._onKeyDown(e)}}
                                    placeholder="Command to Machine"
                                />
                                {this._renderButton('btn btn-default pull-right', () => this._sendCommand(), 'Send', !connecting)}
                                {this._renderButton('btn btn-default pull-right', () => this._sendCtrlX(), 'CtrlX', !connecting)}
                            </div>
                            <div className="main-content">
                                <div className="left-part">
                                    <div className="gcode-command-list" onWheel={e => {this._onListWheel(e)}} onScroll={e => {this._onListScroll(e)}}>
                                        {this._renderCommandList()}
                                    </div>
                                    <div className="scroll-bar"
                                        onMouseDown={e => {this._onScrollbarMouseDown(e)}}
                                        onMouseMove={e => {this._onScrollbarMouseMove(e)}}
                                        onMouseUp={e => {this._onScrollbarMouseUp(e)}}
                                        onMouseLeave={e => {this._onScrollbarMouseUp(e)}}>
                                            <div className="slider" style={{ height: sliderHeight}}>
                                            </div>
                                    </div>
                                </div>
                                <div className="right-part">
                                </div>
                            </div>
                            <div className="gcode-player">
                                {this._renderButton('btn btn-default pull-left', () => this._play(), 'Play')}
                                {this._renderButton('btn btn-default pull-left', () => this._nextStep(), 'Next Step')}
                                {this._renderButton('btn btn-default pull-left', () => this._pause(), 'Pause')}
                                {this._renderButton('btn btn-default pull-left', () => this._stop(), 'Stop')}
                                {this._renderButton('btn btn-default pull-right', () => this._close(), 'Close')}
                            </div>
                        </div>
                    </Modal>
                );
            } else {
                return (
                    null
                );
            }
            
        }
    };

    return TaskInterpreterPanel;
});
