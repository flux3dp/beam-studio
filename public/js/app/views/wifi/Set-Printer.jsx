define([
    'jquery',
    'reactPropTypes',
    'reactClassset',
    'helpers/i18n'
], function($, PropTypes, ReactCx, i18n) {
    'use strict';

    const React = require('react');
    const ReactDOM = require('react-dom');

    return class SetPrinter extends React.Component{
        static propTypes = {
            onSetPrinter: PropTypes.func
        }

        constructor(props) {
            super(props);
            this.state = {
                validPrinterName    : true,
                validPrinterPassword: true
            };
        }

        _handleSetPrinter = () => {
            var name     = ReactDOM.findDOMNode(this.refs.name).value,
                password = ReactDOM.findDOMNode(this.refs.password).value;

            this.setState({
                validPrinterName: (name !== ''),
                validPrinterPassword: (password !== '')
            });

            if(name !== '') {
                this.props.onSetPrinter(name, password);
            }
        }

        render() {
            var lang = this.props.lang,
                printerNameClass;

            printerNameClass = ReactCx.cx({
                'required'  : true,
                'error'     : !this.state.validPrinterName
            });

            return (
                <div className="wifi center">
                    <div>
                        <h2>{lang.wifi.set_printer.caption}</h2>
                        <div className="wifi-form row-fluid clearfix">
                            <div className="col span5 flux-printer">
                                <img src="img/img-flux-printer.png"/>
                            </div>
                            <div className="col span7 text-left">
                                <p>
                                    <label for="printer-name">
                                        {lang.wifi.set_printer.printer_name}
                                    </label>
                                    <input ref="name" id="printer-name" type="text" className={printerNameClass}
                                    placeholder={lang.wifi.set_printer.printer_name_placeholder}/>
                                </p>
                                <p>
                                    <label for="printer-password">
                                        {lang.wifi.set_printer.password}
                                    </label>
                                    <input ref="password" type="password"
                                    placeholder={lang.wifi.set_printer.password_placeholder}/>
                                </p>
                                <p className="notice">
                                    {lang.wifi.set_printer.notice}
                                </p>
                            </div>
                        </div>
                        <div>
                            <a id="btn-set-printer" className="btn btn-large" onClick={this._handleSetPrinter}>
                                {lang.wifi.set_printer.next}</a>
                        </div>
                    </div>
                </div>
            );
        }

    };
});
