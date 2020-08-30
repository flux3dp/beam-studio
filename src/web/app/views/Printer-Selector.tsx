
import $ from 'jquery'
import ListView from '../widgets/List'
import Discover from '../../helpers/api/discover'
import DeviceMaster from '../../helpers/device-master'
import * as i18n from '../../helpers/i18n'
import DeviceConstants from '../constants/device-constants'
import Alert from '../contexts/AlertCaller'
import AlertConstants from '../constants/alert-constants'
import InitializeMachine from '../actions/initialize-machine'
import ProgressActions from '../actions/progress-actions'
import ProgressConstants from '../constants/progress-constants'
import CheckDeviceStatus from '../../helpers/check-device-status'
import { IDeviceInfo } from '../../interfaces/IDevice'
// @ts-expect-error
import PropTypes = require('reactPropTypes');
// @ts-expect-error
import ReactCx = require('reactClassset');
const React = requireNode('react');;
    const lang = i18n.lang;
    class PrinterSelector extends React.Component<PrinterSelectorProps, PrinterSelectorState>{
        static defaultProps = {
            uniqleId: '',
            className: '',
            modelFilter: '',
            forceAuth: false,
            onGettingPrinter: function(printer: IDeviceInfo) {},
            onUnmount: function() {},
            onClose: function() {},
            arrowDirection: 'right' //'left'
        };
        defaultPrinter: IDeviceInfo | null;
        displayName: string
        refreshOption: (devices: IDeviceInfo[]) => void
        discoverAPI: { connection: any; poke: (targetIP: any) => void; testTcp: (targetIP: any) => void; countDevices: () => number; removeListener: (_id: any) => void; sendAggressive: () => void; getLatestPrinter: (printer: any) => any }
        isMounted: boolean;
        constructor(props) {
            super(props);
            this.displayName = 'PrinterSelection';
            this.refreshOption = () => {};
            const modelFilter = this.props.modelFilter.split(',');

            if (!this.props.bypassDefaultPrinter) {
                const dp = InitializeMachine.defaultPrinter.get();
                if (dp.uuid && !modelFilter.includes(dp.model)) {
                    this.defaultPrinter = dp;
                }
            }

            this.state = {
                discoverId          : `printer-selector-${this.props.uniqleId}`,
                devices             : [],
                loadFinished        : false,
                modelFilter         : modelFilter
            };
        }

        componentDidMount() {
            // TODO: Clean up selected printer logic to recognize as object | null
            const self = this;
            this.discoverAPI = Discover(
                this.state.discoverId,
                function(printers) {
                    this.refreshOption(printers);
                }
            )
            this.refreshOption = function(devices: IDeviceInfo[]) {
                    const options: any[] = devices.map((el) => { label: this._renderPrinterItem(el)});
                    devices.forEach((el) => {
                        if (el.uuid === this.defaultPrinter?.uuid) {
                            // update device stat
                            InitializeMachine.defaultPrinter.set({
                                name: el.name,
                                serial: el.serial,
                                uuid: el.uuid
                            });
                        }
                    });

                    if (self.props.showExport) {
                        options.push({ label: self._renderExportItem() });
                    }

                    self.setState({
                        devices: options,
                        loadFinished: true
                    });
                };
            //check for default printer availablity
            let foundPrinter = false;
            if (this.defaultPrinter) {
                DeviceMaster.selectDevice(this.defaultPrinter).then((result) => {
                    if (result.success) {
                        foundPrinter = true;
                        self.props.onGettingPrinter(this.defaultPrinter);
                    }
                }).catch(() => {});
            }
            if (!foundPrinter) {
                self.setState({
                    loadFinished: false
                });
            }
        }

        componentWillUnmount() {
            this.discoverAPI.removeListener(this.state.discoverId);
            this.props.onUnmount();
        }

        _onCancel (id) {
            switch (id) {
            case 'no-printer':
            case 'printer-connection-timeout':
                this._handleClose();
                break;
            default:
                break;
            }
        }

        async _selectPrinter (printer: IDeviceInfo) {
                DeviceMaster.selectDevice(printer).then((status) => {
                    if (status.success) {
                        ProgressActions.open(ProgressConstants.NONSTOP);
                        CheckDeviceStatus(printer).done(() => {
                            this.props.onGettingPrinter(printer)
                        });
                    }
                }).catch((error) => { // TODO: error handling from select device
                    Alert.popUp({
                        id: 'fatal-occurred',
                        message: `#813 ${error}`,
                        type: AlertConstants.SHOW_POPUP_ERROR,
                        callbacks: () => {this._onCancel('fatal-occurred')}
                    });
                }).finally(() => {
                    ProgressActions.close();
                });
        }

        _handleClose () {
            this.props.onClose();
        }

        // renders
        _renderPrinterSelection() {
            let devices = this.state.devices.filter((v) => {
                return this.state.modelFilter.includes(v.label.props['data-model']) || v.label.props.id === "export-item";
            });
            const options = (0 < devices.length ? devices : [{
                    label: (<div className="spinner-roller spinner-roller-reverse"/>)
                }]);
            let content = (
                    <div className="device-wrapper">
                        <ListView className="printer-list" items={options}/>
                    </div>
                );

            return content;
        }

        _renderPrinterItem (printer) {
            var meta,
                status = lang.machine_status,
                headModule = lang.head_module,
                statusId = 'st' + printer.st_id,
                statusText = status[printer.st_id] || status.UNKNOWN,
                headText = headModule[printer.head_module] || headModule.UNKNOWN;

            if (DeviceConstants.status.RUNNING === printer.st_id && 'number' === typeof printer.st_prog) {
                statusText += ' - ' + (printer.st_prog * 100).toFixed(1) + '%';
            }

            try {
                meta = JSON.stringify(printer);
            }
            catch (ex) {
                console.log(ex, printer);
            }

            let img = `img/icon_${printer.source === 'h2h' ? 'usb' : 'wifi' }.svg`;

            return (
                <div className="device printer-item" id={printer.name} data-model={printer.model} data-status={statusId} data-meta={meta} onClick={this._selectPrinter.bind(this, printer)}>
                    <div className="col device-name" id={printer.name}>{printer.name}</div>
                    <div className="col module">{headText}</div>
                    <div className="col status">{statusText}</div>
                    <div className="col connection-type">
                        <img src={img} />
                    </div>
                </div>
            );
        }

        _renderExportItem = () => {

            return (
                <div className="device printer-item" id={"export-item"} data-status={0} data-meta={0} onClick={() => {this.props.onGettingPrinter("export_fcode")} }>
                    <div className="col device-name" id={"export-item-name"}><i className="fa fa-save"></i>&nbsp;&nbsp;{lang.laser.export_fcode}</div>
                    <div className="col module"></div>
                    <div className="col status"></div>
                    <div className="col connection-type">
                    </div>
                </div>
            );
        }

        render() {
            var self = this,
                wrapperClass = {'select-printer': true},
                wrapperStyle = self.props.WindowStyle,
                content = self._renderPrinterSelection();

            if (self.props.className) {
                wrapperClass[self.props.className] = true;
            }
            wrapperClass = ReactCx.cx(wrapperClass);

            const arrowClass = `arrow arrow-${this.props.arrowDirection}`;

            return (
                this.defaultPrinter ?
                <span/> :
                <div className={wrapperClass} style={wrapperStyle}>
                    {content}
                    <div className={arrowClass}/>
                </div>
            );
        }

    };

    interface PrinterSelectorState {
        discoverId: string
        devices: any[]
        loadFinished: boolean,
        modelFilter: string[]
    }
    interface PrinterSelectorProps {
        uniqleId: string
        bypassDefaultPrinter: boolean
        showExport: boolean
        modelFilter: string
        onClose: Function
        onGettingPrinter: Function
        onUnmount: Function
        className: any
        WindowStyle: any
    }

    PrinterSelector['propTypes'] = {
        showExport: PropTypes.bool,
        modelFilter: PropTypes.string,
        onClose: PropTypes.func,
        onGettingPrinter: PropTypes.func
    };


    PrinterSelector.BEAMBOX_FILTER = "laser-b1,laser-b2,fbm1,fbb1b,fbb1p,mozu1,darwin-dev";
    PrinterSelector.DELTA_FILTER = "delta-1,delta-1p";
    export default PrinterSelector;
