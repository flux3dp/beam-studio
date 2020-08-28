define([
    'jsx!views/beambox/Right-Panels/Options-Blocks/Infill-Block',
    'jsx!views/beambox/Right-Panels/Options-Blocks/Rect-Options',
    'jsx!views/beambox/Right-Panels/Options-Blocks/Image-Options',
    'jsx!views/beambox/Right-Panels/Options-Blocks/Text-Options',
    'jsx!contexts/DialogCaller',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
    'app/actions/beambox/constant',
    'helpers/i18n'
], function(
    InFillBlock,
    RectOptions,
    ImageOptions,
    TextOptions,
    DialogCaller,
    Alert,
    AlertConstants,
    Constant,
    i18n
) {
    const React = require('react');
    const classNames = require('classnames');
    const LANG = i18n.lang.beambox.right_panel.object_panel;

    class OptionsPanel extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
            };
        }

        componentDidMount() {
        }

        componentWillUnmount() {
        }

        render() {
            const { elem, updateObjectPanel } = this.props;
            let contents = [];
            if (elem) {
                if (elem.tagName === 'rect') {
                    contents = <RectOptions {...this.props} />
                } else if (elem.tagName === 'text') {
                    contents = <TextOptions {...this.props}/>;
                } else if (elem.tagName === 'image') {
                    contents = <ImageOptions elem={elem} updateObjectPanel={updateObjectPanel}/>;
                } else {
                    contents = <InFillBlock elem={elem}/>;
                }
            }
            return (
                <div className="options-panel">
                    <div className="title">{'OPTIONS'}</div>
                    { contents }
                </div>
            );
        }
    }

    return OptionsPanel;
});
