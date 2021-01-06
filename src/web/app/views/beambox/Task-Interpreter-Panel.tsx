import Modal from '../../widgets/Modal'
import SelectView from '../../widgets/Select';
import VerticalSlider from '../../widgets/Vertical-Slider-Control';
import BeamboxStore from '../../stores/beambox-store';
import ExportFuncs from '../../actions/beambox/export-funcs';
import ProgressActions from '../../actions/progress-actions';
import ProgressConstants from '../../constants/progress-constants';
import * as i18n from '../../../helpers/i18n';
import { getSVGAsync } from '../../../helpers/svg-editor-helper';
let svgCanvas;
let svgEditor;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas; svgEditor = globalSVG.Editor; });

const React = requireNode('react');
const LANG = i18n.lang.topmenu;
const SerialPort = requireNode('serialport');
const LINES_PER_PAGE = 100;
const TAB_GCODE = 0;
const TAB_CONSOLE = 1;
const TAB_MOVE = 2;
//const MockBinding = require('@serialport/binding-mock');
//SerialPort.Binding = MockBinding
//MockBinding.createPort('/dev/ROBOT', { echo: true, record: true });

class TaskInterpreterPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            show: false,
            file: null,
            firstIndex: 0,
            currentIndex: 0,
            connecting: false,
            tab: TAB_GCODE,
            consoleText: ""
        };
        //Serial Port
        this.file = null;
        this.port = null;
        this.portOptions = [];
        this._ondataCB = () => {};
        //GCode Tab
        this._ln = 0;
        this.playerState = 'idle';
        this.gcodelist = [];
        //Move Tab
        this.moveDistance = 10;
        this.moveFeedrate = 3000;

        this.canvas = document.createElement('canvas');
    }

    componentDidMount() {
        BeamboxStore.onShowTaskInterpreter(this._show.bind(this));
    }

    componentDidUpdate() {
        let gcodeCanvas = this.refs.gcodeCanvas;
        if (gcodeCanvas) {
            let scale = Math.min((this.refs.rightPart.offsetWidth - 4) / svgCanvas.contentW, (this.refs.rightPart.offsetHeight - 4) / svgCanvas.contentH);
            gcodeCanvas.width = svgCanvas.contentW * scale;
            gcodeCanvas.height = svgCanvas.contentH * scale;
            if (this.canvas) {
                let gcodeCtx = gcodeCanvas.getContext('2d');
                gcodeCtx.drawImage(this.canvas, 0, 0);
            }
        }
    }

    componentWillUnmount() {
    }

    _show() {
        this._updateSerialPortList();
        this.setState({
            show: true,
            tab: TAB_GCODE,
            consoleText: ""
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
                this.state.consoleText += data.toString();
                if (!data.toString().endsWith('\n')) {
                    this.state.consoleText += '\n';
                }
                if (this.state.tab === TAB_CONSOLE) {
                    this.setState({consoleText: this.state.consoleText}, () => {
                        $('.console').scrollTop(Number.MAX_SAFE_INTEGER);
                    });
                }
                    
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
        this.file = this.refs.taskInput.files[0];
        this._importGcode();
    }

    async _fromScene() {
        let gcodeBlob = await ExportFuncs.getGcode();
        const fileReader = new FileReader();
        fileReader.onloadend = (e) => {
            let gcodeList = (e.target.result as string).split('\n');
            let start = new Date();
            this.gcodelist = gcodeList;
            this._renderGcodeCanvas();
            console.log('canvas:', (+new Date()) - (+start));
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
                let str = e.target.result as string;
                this.gcodelist = str.split('\n');
                this.setState({
                    file: this.file,
                    firstIndex: 0,
                    currentIndex: 0
                });
                this._renderGcodeCanvas();
            };
            reader.readAsText(this.file);
        } else {
            console.log('No File Read');
        }
    }

    _renderGcodeCanvas() {
        let scale = Math.min((this.refs.rightPart.offsetWidth - 4) / svgCanvas.contentW, (this.refs.rightPart.offsetHeight - 4) / svgCanvas.contentH);
        const gcodeCanvas = this.refs.gcodeCanvas;
        let gcodeCtx = gcodeCanvas.getContext("2d");
        this.canvas.width = svgCanvas.contentW * scale;
        this.canvas.height = svgCanvas.contentH * scale;
        gcodeCanvas.width = svgCanvas.contentW * scale;
        gcodeCanvas.height = svgCanvas.contentH * scale;
        gcodeCtx.clearRect(0, 0, gcodeCanvas.width, gcodeCanvas.height);

        let ctx = this.canvas.getContext("2d");
        let [x, y, p1, p2, power] = [0, 0, 0, 0, 0];
        ctx.beginPath();
        ctx.lineWidth = 1;
        scale *= 10;
        for (let i = 0; i < this.gcodelist.length; i++) {
            if (i % 10000 === 0) {
            }
            let command = this.gcodelist[i];
            if (command.startsWith('G1 ')) {
                let X = command.match(/(?<=X)[0-9\.]*/);
                let Y = command.match(/(?<=Y)[0-9\.]*/);
                x = X ? scale * parseFloat(X[0]) : x;
                y = Y ? scale * parseFloat(Y[0]) : y;
                if (power > 0) {
                    ctx.lineTo(x, y);
                } else {
                    ctx.moveTo(x, y);
                }
            } else if (command.indexOf('X2O') >= 0) {
                let p = command.match(/(?<=X2O)[-0-9\.]*/);
                try {
                    p = parseInt(p);
                    if (p >= 0) {
                        p1 = p / 255;
                    } else {
                        p2 = Math.round(-p / 2.55);
                    }
                    power = p1 * p2;
                } catch (err) {
                    console.log(err);
                }
            }
        }

        ctx.stroke();
        ctx.closePath();
        gcodeCtx.drawImage(this.canvas, 0, 0);
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
        const command = this.refs.command.value;
        if (this.port && this.port.isOpen) {
            let suc = this.port.write(`${command}\n`);
            this.state.consoleText += `> ${command}\n`;
            this.setState({consoleText: this.state.consoleText}, () => {
                $('.console').scrollTop(Number.MAX_SAFE_INTEGER);
            });
            if (suc) {
                console.log(`Successfully write:\n${command}`)
            }
            this.refs.command.value = '';
            //this.refs.command.focus();
        }
    }

    _onConsoleKeyDown(e) {
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
            return this._renderButton('pull-right', () => this._handleDisconnect(), '斷');
        } else {
            return this._renderButton('pull-right', () => this._handleConnect(), 'Connect');
        }
    }

    _renderLeftPart() {
        let tabContent;
        switch (this.state.tab) {
            case TAB_GCODE:
                tabContent = this._renderGCodeTab();
                break;
            case TAB_CONSOLE:
                tabContent = this._renderConsoleTab();
                break;
            case TAB_MOVE:
                tabContent = this._renderMoveTab();
                break;
            default:
                break;
        }
        return (
            <div className="left-part">
                {this._renderTabControl()}
                {tabContent}
            </div>
        );
    }

    _renderTabControl(){
        return (
        <div className="tab-control">
            {this._renderTabButton(TAB_GCODE, 'GCODE')}
            {this._renderTabButton(TAB_CONSOLE, 'CONSOLE')}
            {this._renderTabButton(TAB_MOVE, 'MOVE')}
        </div>
        );
    }

    _renderTabButton(tab, label) {
        let className = tab === this.state.tab ? 'selected pull-left tab-button' : 'pull-left tab-button';
        return this._renderButton(className, () => {this.setState({tab})}, label)
    }

    _renderGCodeTab() {
        let sliderHeight = Math.max($('.scroll-bar').height() * ((this.gcodelist.length > 10 )? (10 / this.gcodelist.length) : 1), 1);
        let ret = [
            <div className="gcode-command-list" onWheel={e => {this._onListWheel(e)}} onScroll={e => {this._onListScroll(e)}} key={'list'}>
                {this._renderGCodeList()}
            </div>,
            <div className="scroll-bar"
                key={'scroll-bar'}
                onMouseDown={e => {this._onScrollbarMouseDown(e)}}
                onMouseMove={e => {this._onScrollbarMouseMove(e)}}
                onMouseUp={e => {this._onScrollbarMouseUp(e)}}
                onMouseLeave={e => {this._onScrollbarMouseUp(e)}}>
                <div className="slider" style={{ height: sliderHeight}}>
                </div>
            </div>
        ];
        return ret;
    }

    _renderGCodeList() {
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

    _renderConsoleTab() {
        let {connecting, consoleText} = this.state;
        return (
            <div className="console-tab">
                <textarea className="console" disabled value={consoleText} />
                <input type="text"
                    className={connecting ? "console-input" : "console-input disabled"}
                    disabled={!connecting}
                    maxLength="255"
                    ref="command"
                    onKeyDown={e => {this._onConsoleKeyDown(e)}}
                    placeholder={connecting ? "Type command here" : "Waiting for connection"}
                />
            </div>
        );
    }

    _renderMoveTab() {
        let {connecting} = this.state;
        return (
            <div className="move-tab">
                <div className="speed-container">
                    <div className="title">
                        {"Feedrate"}
                    </div>
                    <VerticalSlider
                        id={'feedrate'}
                        max={7500}
                        min={500}
                        step={100}
                        defaultValue={this.moveFeedrate}
                        onChange={this._onFeedrateChange.bind(this)}
                    />
                </div>
                <div className="move-buttons">
                    <div className="row">
                        {this._renderButton("pull-left", ()=>{this._handleMoveButtonClick()}, '1', !connecting)}
                        {this._renderButton("pull-left", ()=>{this._handleMoveButtonClick('up')}, '2', !connecting)}
                        {this._renderButton("pull-left", ()=>{this._handleMoveButtonClick()}, '3', !connecting)}
                    </div >
                    <div className="row">
                        {this._renderButton("pull-left", ()=>{this._handleMoveButtonClick('left')}, '4', !connecting)}
                        {this._renderButton("pull-left", ()=>{this._handleMoveButtonClick('home')}, '5', !connecting)}
                        {this._renderButton("pull-left", ()=>{this._handleMoveButtonClick('right')}, '6', !connecting)}
                    </div>
                    <div className="row">
                        {this._renderButton("pull-left", ()=>{this._handleMoveButtonClick()}, '7', !connecting)}
                        {this._renderButton("pull-left", ()=>{this._handleMoveButtonClick('down')}, '8', !connecting)}
                        {this._renderButton("pull-left", ()=>{this._handleMoveButtonClick()}, '9', !connecting)}
                    </div>
                </div>
                <div className="distance-container">
                    <div className="title">
                        {"Distance"}
                    </div>
                    <VerticalSlider
                        id={'distance'}
                        max={50}
                        min={1}
                        step={1}
                        defaultValue={this.moveDistance}
                        onChange={this._onDistanceChange.bind(this)}
                    />
                </div>
            </div>
        );
    }

    _onFeedrateChange(val) {
        this.moveFeedrate = val;
    }

    _onDistanceChange(val) {
        this.moveDistance = val;
    }

    _handleMoveButtonClick(dir?: string) {
        switch(dir) {
            case 'up':
                console.log(`TODO: Send G1 F${this.moveFeedrate} V${-this.moveDistance}`);
                break;
            case 'down':
                console.log(`TODO: Send G1 F${this.moveFeedrate} V${this.moveDistance}`);
                break;
            case 'left':
                console.log(`TODO: Send G1 F${this.moveFeedrate} U${-this.moveDistance}`);
                break;
            case 'right':
                console.log(`TODO: Send G1 F${this.moveFeedrate} U${this.moveDistance}`);
                break;
            case 'home':
                console.log(`TODO: Send G28 (does it work?) maybe $H`);
                break;
            default:
                console.warn("Unsupported direction");
        }
    }

    _renderButton(className, onClick, label, disabled?: boolean) {
        className = `btn btn-default ${className}`;
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
            let leftPart = this._renderLeftPart();
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
                            {this._renderButton('pull-right', () => this._openFile(), 'Open')}
                            {this._renderButton('pull-right', () => this._fromScene(), 'Scene')}
                        </div>
                        <div className="main-content">
                                {leftPart}
                            <div ref="rightPart" className="right-part">
                                <canvas ref="gcodeCanvas"/>
                            </div>
                        </div>
                        <div className="footer">
                            {this._renderButton('pull-left', () => this._play(), 'Play')}
                            {this._renderButton('pull-left', () => this._nextStep(), 'Next Step')}
                            {this._renderButton('pull-left', () => this._pause(), 'Pause')}
                            {this._renderButton('pull-left', () => this._stop(), 'Stop')}
                            {this._renderButton('pull-right', () => this._close(), 'Close')}
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

export default TaskInterpreterPanel;
