define([
    'jsx!widgets/Radio-Group'
], function(RadioGroupView) {
    'use strict';
    const React = require('react');

    class Export extends React.Component{

        _onExport = (e) => {
            this.props.onExport(e);
        }

        render() {
            var lang = this.props.lang;

            return (
                <div className="scan-model-save-as absolute-center">
                    <h4 className="caption">{lang.scan.save_as}</h4>
                    <RadioGroupView className="file-formats clearfix" name="file-format" options={lang.scan.save_mode}/>
                    <div>
                        <button data-ga-event="scan-export-to-file" className="btn btn-default" onClick={this._onExport}>{lang.scan.do_save}</button>
                    </div>
                </div>
            );
        }
    };

    Export.defaultProps = {
        lang: {},
        onExport: function() {}
    };

    return Export;
});