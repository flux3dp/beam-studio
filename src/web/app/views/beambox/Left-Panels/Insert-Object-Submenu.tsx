import FnWrapper from '../../../actions/beambox/svgeditor-function-wrapper'
import Shortcuts from '../../../../helpers/shortcuts'
import * as i18n from '../../../../helpers/i18n'
    const React = requireNode('react');;

    const LANG = i18n.lang.beambox.left_panel.insert_object_submenu;

    export default class InsertObjectSubmenu extends React.Component {
        componentDidMount() {
            Shortcuts.on(['esc'], () => this.props.onClose());
        }
        componentWillUnmount() {
            Shortcuts.off(['esc']);
        }
        render() {
            return (
                <div className='dialog-window' style={{display: 'flex'}}>
                    <div className='arrow arrow-left'/>
                    <div className='dialog-window-content'>
                        <ul onClick={() => this.props.onClose()} style={{margin: '0px'}}>
                            <li onClick={FnWrapper.insertRectangle} key='rectangle'>
                                {LANG.rectangle}
                            </li>
                            <li onClick={FnWrapper.insertEllipse} key='ellipse'>
                                {LANG.ellipse}
                            </li>
                            <li onClick={FnWrapper.insertLine} key='line'>
                                {LANG.line}
                            </li>
                            <li onClick={FnWrapper.importImage} key='image'>
                                {LANG.image}
                            </li>
                            <li onClick={FnWrapper.insertText} key='text'>
                                {LANG.text}
                            </li>
                            <li onClick={FnWrapper.insertPath} key='path'>
                                {LANG.path}
                            </li>
                            <li onClick={FnWrapper.insertPolygon} key='polygon'>
                                {LANG.polygon}
                            </li>
                        </ul>
                    </div>
                </div>
            );
        }
    };