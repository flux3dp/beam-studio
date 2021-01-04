import ButtonGroup from '../../widgets/Button-Group';
import KeyCodeConstants from '../../constants/keycode-constants';
import * as i18n from '../../../helpers/i18n';
const React = requireNode('react');
const lang = i18n.lang;

const DxfDpiSelector = ({defaultDpiValue, onSubmit, onCancel}) => {
    const submitValue = () => {
        const dpi = Number($('#dpi-input').val());
        onSubmit(dpi);
    };
    const _handleKeyDown = (e) => {
        if (e.keyCode === KeyCodeConstants.KEY_RETURN) {
            submitValue();
        }
    };
    const clearInputValue = () => {
        $('#dpi-input').val('');
    };

    const buttons = [
        {
            key: 'cancel',
            label: lang.alert.cancel,
            right: true,
            onClick: () => onCancel()
        },
        {
            key: 'ok',
            className: 'btn-default primary',
            label: lang.alert.ok,
            right: true,
            onClick: () => submitValue()
        }
    ];
    const style = {
        padding: '3px 10px',
        width: '120px',
        textAlign: 'left'
    };
    return (
        <div className='dxf-dpi-selector'>
            <div className='caption'>
                {lang.message.please_enter_dpi}
                <br/>
                1, 2.54, 25.4, 72, 96 etc.
            </div>
            <div className="message" style={{textAlign: 'center'}}>
                <input
                    id='dpi-input'
                    defaultValue={defaultDpiValue}
                    onClick={clearInputValue}
                    onKeyDown={_handleKeyDown}
                    style={style}
                />
            </div>

            <ButtonGroup buttons={buttons}/>
        </div>
    );
};

export default DxfDpiSelector;
