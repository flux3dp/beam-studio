define([
    'jquery',
    'reactClassset',
    'reactPropTypes',
    'app/actions/laser',
    'app/actions/alert-actions',
    'app/actions/delta/holder-global-interactions',
    'app/actions/progress-actions',
    'jsx!views/laser/Setup-Panel',
    'jsx!views/holder/Setup-Panel',
    'jsx!views/laser/Image-Panel',
    'jsx!widgets/File-Uploader',
    'jsx!widgets/Modal',
    'jsx!views/Printer-Selector',
    'jsx!widgets/Button-Group',
    'helpers/api/config',
    'helpers/i18n',
    'helpers/dnd-handler'
], function(
    $,
    ReactCx,
    PropTypes,
    laserEvents,
    AlertActions,
    HolderGlobalInteraction,
    ProgressActions,
    LaserSetupPanel,
    HolderSetupPanel,
    ImagePanel,
    FileUploader,
    Modal,
    PrinterSelector,
    ButtonGroup,
    ConfigHelper,
    i18n,
    DnDHandler
) {
    'use strict';

    const React = require('react');
    const ReactDOM = require('react-dom');

    let Config = ConfigHelper(),
        lang = i18n.lang;

    return function(args) {
        args = args || {};

        class Holder extends React.Component{
            constructor(props) {
                super(props);
                this.state = {
                    mode: 'engrave',
                    hasImage: false,
                    selectedImage: false,
                    fileFormat: undefined,
                    selectedPrinter: 0,
                    openPrinterSelectorWindow: false,
                    openBlocker: false,
                    settings: {},
                    laserEvents: laserEvents.call(this, args),
                    imagePanel: {},
                    position: {},
                    size: {},
                    sizeLock: false,
                    angle: 0,
                    threshold: 255,
                    images: [],
                    machineCommand: 'start'
                };
            }

            componentDidMount() {
                var self = this;

                HolderGlobalInteraction.attach(this);

                DnDHandler.plug(document, self._handleDragAndDrop);

                self.state.laserEvents.setPlatform(ReactDOM.findDOMNode(self.refs.laserObject));

                var laser_custom_bg = Config.read('laser-custom-bg') && this.props.page === 'laser';
                if (laser_custom_bg) {
                    $('.laser-object').css({background :'url(' + laser_custom_bg + ')', 'background-size': '100% 100%'});
                }

                self.setState({
                    setupPanelDefaults: this.props.panelOptions
                });

                if(!Config.read('laser-calibrated') && this.props.page === 'laser') {
                    // NOTE: only yes no support this kind of callback
                    AlertActions.showPopupYesNo('do-calibrate', lang.laser.do_calibrate, '', null, {
                        yes: function() {
                            self._onLoadCalibrationImage();
                            Config.write('laser-calibrated', true);
                        },
                        no: function() {
                            Config.write('laser-calibrated', true);
                        }
                    });
                }
            }

            componentWillUnmount() {
                HolderGlobalInteraction.detach();
                this.state.laserEvents.destroySocket();
                this.state.laserEvents.destroy();
                DnDHandler.unplug(document);
            }

            UNSAFE_componentWillReceiveProps(nextProps) {
                this.setState({
                    panelOptions: nextProps.panelOptions
                });
            }

            // UI events
            _handleStartClick = () => {
                this.setState({
                    openPrinterSelectorWindow: true,
                    machineCommand: 'start',
                    settings: this._fetchFormalSettings()
                });
            }
            _handleShowOutlineClick = () => {
                this.setState({
                    openPrinterSelectorWindow: true,
                    machineCommand: 'showOutline',
                    settings: this._fetchFormalSettings()
                });
            }

            _handleCalibrateClick = () => {
                this.setState({
                    openPrinterSelectorWindow: true,
                    machineCommand: 'calibrate'
                });
            }

            _handleZProbeClick = () => {
                this.setState({
                    openPrinterSelectorWindow: true,
                    machineCommand: 'zprobe'
                });
            }

            _handleExportClick = (filemode) => {
                this.state.laserEvents.exportTaskCode(this._fetchFormalSettings(), filemode);
            }

            _handleDragAndDrop = (e) => {
                e.preventDefault();

                var uploadedFiles = e.originalEvent.dataTransfer.files;

                e.target.files = uploadedFiles;
                this.refs.fileUploader.readFiles(e, uploadedFiles);
            }

            _onLoadCalibrationImage = (e) => {
                this.state.laserEvents.uploadDefaultLaserImage();
                this.setState({debug: 1}); // Debug flag will be reset at laser.js/deleteImage
            }

            _onShadingChanged = (e) => {
                var self = this,
                    $images = self.state.laserEvents.getCurrentImages();

                $images.each(function(k, el) {
                    var $el = $(el);

                    self.state.laserEvents.refreshImage($el, $el.data('threshold') || 255);
                });
            }

            // Private events
            _fetchFormalSettings = () => {
                return this.props.fetchFormalSettings(this);
            }

            _inactiveSelectImage = (e) => {
                if (e.target === e.currentTarget) {
                    this.state.laserEvents.inactiveAllImage();
                }
            }

            // Lifecycle
            _renderStageSection = () => {
                var self = this,
                    image_panel_class = ReactCx.cx({
                        'panel object-position': true
                    }),
                    imagePanel = (
                        this.state.selectedImage ?
                        <ImagePanel
                            lang={lang}
                            initialPosition={this.state.initialPosition}
                            ref="imagePanel"
                            sizeLock={this.state.sizeLock}
                            mode={this.state.mode}
                            className={image_panel_class}
                            onThresholdChanged={this.state.laserEvents.thresholdChanged}
                            onTransform={this.state.laserEvents.imageTransform}
                            position={this.state.position}
                            size={this.state.size}
                            angle={this.state.angle}
                            threshold={this.state.threshold}
                        /> :
                        ''
                    ),
                    closeSubPopup = function(e) {
                        e.cancelBubble = true;
                        e.stopPropagation();

                        if ('true' === e.target.dataset.closeImagePanel) {
                            self.refs.setupPanel.openSubPopup(e);
                            self._inactiveSelectImage(e);
                        }
                    },
                    paramPanel;

                paramPanel = this.state.panelOptions ? this.props.renderSetupPanel(this) : null;

                return (
                    <div ref="laserStage" className="laser-stage">
                        <section ref="operationTable" data-close-image-panel="true" className="operation-table" onClick={closeSubPopup}>
                            <div ref="laserObject" data-close-image-panel="true" className="laser-object border-circle" onClick={closeSubPopup}/>
                            {imagePanel}
                        </section>
                        {paramPanel}
                    </div>
                );
            }

            _renderPrinterSelectorWindow = () => {
                if (!this.state.openPrinterSelectorWindow) { return ''; }
                var self = this,
                    onGettingPrinter = function(selected_printer) {
                        if (selected_printer == 'export_fcode') {
                            self.state.laserEvents.exportTaskCode(self._fetchFormalSettings(), '-f')
                            return;
                        }
                        self.setState({
                            selectedPrinter: selected_printer,
                            openPrinterSelectorWindow: false
                        });

                        self.state.laserEvents.runCommand(self.state.settings, self.state.machineCommand);
                    },
                    onClose = function(e) {
                        self.setState({
                            openPrinterSelectorWindow: false
                        });
                    },
                    content = (
                        <PrinterSelector
                            uniqleId="laser"
                            className="laser-device-selection-popup"
                            modelFilter={PrinterSelector.DELTA_FILTER}
                            lang={lang}
                            showExport={true}
                            onClose={onClose}
                            onGettingPrinter={onGettingPrinter}
                        />
                    );

                return (
                    <Modal content={content} onClose={onClose}/>
                );
            }

            _renderFileUploader = () => {
                var self = this,
                    uploadStyle = ReactCx.cx({
                        'file-importer': !self.state.hasImage,
                        'absolute-center': !self.state.hasImage,
                        'hide': self.state.hasImage

                    }),
                    accept = self.props.acceptFormat,
                    onError = function(msg) {
                        ProgressActions.close();
                        AlertActions.showPopupError('laser-upload-error', msg);
                    },
                    typeErrorMessage = (
                        'laser' === self.props.page ?
                        lang.laser.laser_accepted_images :
                        lang.laser.draw_accepted_images
                    );

                return (
                    <div className={uploadStyle}>
                        <label htmlFor="file-uploader">{lang.laser.import}</label>
                        <FileUploader
                            ref="fileUploader"
                            accept={accept}
                            typeErrorMessage={typeErrorMessage}
                            multiple={true}
                            onReadFileStarted={this.state.laserEvents.onReadFileStarted}
                            onReadEnd={this.state.laserEvents.onFileReadEnd}
                            onError={onError}
                        />
                    </div>
                );
            }

            _renderActionButtons = () => {
                HolderGlobalInteraction.onImageChanged(this.state.hasImage);

                var buttons = [{
                        label: lang.monitor.start,
                        className: ReactCx.cx({
                            'btn-disabled': !this.state.hasImage,
                            'btn-default': true,
                            'btn-hexagon': true,
                            'btn-go': true
                        }),
                        dataAttrs: {
                            'ga-event': 'laser-goto-monitor'
                        },
                        onClick: this._handleStartClick
                    }];

                if (this.props.page === 'laser') {
                    buttons = [{
                        label: lang.laser.showOutline,
                        className: ReactCx.cx({
                            'btn-disabled': !this.state.hasImage,
                            'btn-default': true,
                            'btn-hexagon': true,
                            'btn-go': true
                        }),
                        dataAttrs: {
                            'ga-event': 'holder-outline'
                        },
                        onClick: this._handleShowOutlineClick
                    }].concat(buttons);
                }

                if (this.props.page === 'cut' || this.props.page === 'mill') {
                    buttons = [{
                        label: lang.cut.horizontal_calibrate,
                        className: ReactCx.cx({
                            'btn-disabled': false,
                            'btn-default': true,
                            'btn-hexagon': true,
                            'btn-go': true,
                            'mini-text': i18n.getActiveLang() === 'en'
                        }),
                        dataAttrs: {
                            'ga-event': 'holder-calibrate'
                        },
                        onClick: this._handleCalibrateClick
                    },
                    {
                        label: lang.cut.height_calibrate,
                        className: ReactCx.cx({
                            'btn-disabled': false,
                            'btn-default': true,
                            'btn-hexagon': true,
                            'btn-go': true,
                            'mini-text': i18n.getActiveLang() === 'en'
                        }),
                        dataAttrs: {
                            'ga-event': 'holder-calibrate'
                        },
                        onClick: this._handleZProbeClick
                    }].concat(buttons);
                }

                return (
                    <ButtonGroup buttons={buttons} className="beehive-buttons action-buttons"/>
                );
            }

            render() {
                var stageSection = this._renderStageSection(),
                    printerSelector = this._renderPrinterSelectorWindow(),
                    uploader = this._renderFileUploader(),
                    actionButtons = this._renderActionButtons();
                return (
                    <div className="studio-container laser-studio">
                        {printerSelector}

                        <div className="stage">
                            {stageSection}
                            {actionButtons}
                        </div>

                        {uploader}
                    </div>
                );
            }

        };
        Holder.propTypes = {
            page: PropTypes.string
        };

        return Holder;
    };
});
