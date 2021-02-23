
import InFillBlock from '../../../views/beambox/Right-Panels/Options-Blocks/Infill-Block';
import RectOptions from '../../../views/beambox/Right-Panels/Options-Blocks/Rect-Options';
import ImageOptions from '../../../views/beambox/Right-Panels/Options-Blocks/Image-Options';
import TextOptions from '../../../views/beambox/Right-Panels/Options-Blocks/Text-Options';
import * as i18n from '../../../../helpers/i18n';

const React = requireNode('react');
const classNames = requireNode('classnames');
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

export default OptionsPanel;
