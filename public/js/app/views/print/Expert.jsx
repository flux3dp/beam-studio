define([
    'jquery',
    'jsx!widgets/Radio-Group'
], function($, RadioGroupView) {
    'use strict';
    const React = require('react');

    return function(args) {
        args = args || {};
        var options = [];
        return class Expert extends React.Component{
            constructor(props) {
                super(props);
                this.state = args.state;
            }

            render() {
                var lang = this.state.lang;

                return (
                    <div className="panel expert-panel">
                        <div className="params horizontal-form">
                            <h2>
                                <span className="fa fa-clock-o"></span>
                                1 hr 30min
                            </h2>
                            <div className="row-fluid clearfix">
                                <div className="col span3">
                                    <span className="param-icon fa fa-bars"></span>
                                </div>
                                <div className="param col span9">
                                    <h4>{lang.print.params.expert.layer_height.text}</h4>
                                    <p>
                                        <input type="number" defaultValue={lang.print.params.expert.layer_height.value}/>
                                        {lang.print.params.expert.layer_height.unit}
                                    </p>
                                </div>
                            </div>
                            <div className="row-fluid clearfix">
                                <div className="col span3">
                                    <span className="param-icon fa fa-print"></span>
                                </div>
                                <div className="param col span9">
                                    <h4>{lang.print.params.expert.print_speed.text}</h4>
                                    <p>
                                        <input type="number" defaultValue={lang.print.params.expert.print_speed.value}/>
                                        {lang.print.params.expert.print_speed.unit}
                                    </p>
                                </div>
                            </div>
                            <div className="row-fluid clearfix">
                                <div className="col span3">
                                    <span className="param-icon fa fa-fire"></span>
                                </div>
                                <div className="param col span9">
                                    <h4>{lang.print.params.expert.temperature.text}</h4>
                                    <p>
                                        <input type="number" defaultValue={lang.print.params.expert.temperature.value}/>
                                        {lang.print.params.expert.temperature.unit}
                                    </p>
                                </div>
                            </div>
                            <div className="row-fluid clearfix">
                                <div className="col span3">
                                    <span className="param-icon fa fa-check"></span>
                                </div>
                                <div className="param col span9">
                                    <h4>{lang.print.params.expert.support.text}</h4>
                                    <p>
                                        <RadioGroupView name="support" options={lang.print.params.expert.support.options}/>
                                    </p>
                                </div>
                            </div>
                            <div className="row-fluid clearfix">
                                <div className="col span3">
                                    <span className="param-icon fa fa-check"></span>
                                </div>
                                <div className="param col span9">
                                    <h4>{lang.print.params.expert.platform.text}</h4>
                                    <p>
                                        <RadioGroupView name="platform" options={lang.print.params.expert.platform.options}/>
                                    </p>
                                </div>
                            </div>
                            <div>
                                <button data-ga-event="show-print-advanced" className="btn btn-default span12">{lang.print.advanced}</button>
                            </div>
                        </div>
                        <div>
                            <button data-ga-event="print-started" className="btn btn-default span12">{lang.print.start_print}</button>
                        </div>
                    </div>
                )
            }
        };
    };
});