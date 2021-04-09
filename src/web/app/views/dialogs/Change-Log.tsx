const React = requireNode('react');

import Modal from 'app/widgets/Modal';
import i18n from 'helpers/i18n';

const LANG = i18n.lang.change_logs;

const CHANGES_TW = {
    added: [
        '新增 FLUX 會員中心登入功能',
        '新增 快捷鍵 Shift 減選功能。',
        '新增 更多「相機預覽」失敗之錯誤訊息提示。',
        '新增 下載「錯誤回報」按鈕在「韌體發生錯誤」視窗',
        '重命名時不會清空圖層名稱。',
        '新增 相機預覽示意動畫。',
    ],
    fixed: [
        '修正 Mac 開啟檔案總管容易出現閃退的問題。',
        '重構「儀表板」元件。',
        '修正 輸入連接密碼錯誤時跳出之錯誤訊息，長按 Enter鍵，畫面會變黑的問題',
        '重新設計新手教學流程',
        '修正 在儀表板上完成雕刻後可以重啟雕刻的功能',
    ],
    changed: [
        '經由相機預覽後更改 Beam Studio 畫布尺寸後，會連動改變偏好設定預設畫布尺寸。',
        '相機校正預設不顯示前次校正結果。',
        '「與 FLUX 分享」 更改為 「分享 Beam Studio 分析」',
        '調整德文多語。',
        '更新 Beam Studio 功能圖示',
    ],
};

const CHANGES_EN = {
    added: [
        'Added FLUX account login function.',
        'Added "Shift" shortcut for deselecting.',
        'Added more error reports for "Camera Preview."',
        'Added "Bug Report" button in the "DEVICE ERROR" panel.',
        'It will not empty the layer name while renaming.',
        'Add animation in the Camera Calibration panel.',
    ],
    fixed: [
        'Fixed crash problem while open the Finder (File Browser) in Mac.',
        'Refactor “Dashboard” component.',
        'Fixed the problem that presses and holds the Enter key, the screen will turn black in the "connection password wrong error message" panel.',
        'Re-design "Start Tutorial" ​flow.',
        'Fixed the function of restarting the engraving after finishing the engraving on the dashboard.',
    ],
    changed: [
        'If the canvas size is changed by the "Camera Previewing" function, it will automatically change the canvas size setting in the Preferences.',
        'Not display Camera Calibration last time result by default.',
        'Changed "share with FLUX" to "Share Beam Studio Analytics."',
        'Adjust the translation of the German version.',
        'Redesign Beam Studio icons',
    ],
};
const FLUX = window['FLUX'];


class ChangeLogDialog extends React.Component {
    renderChangeLogs () {
        const activeLang = i18n.getActiveLang();
        const CHANGES = activeLang.startsWith('zh') ? CHANGES_TW : CHANGES_EN;
        const logs = [];
        if (CHANGES.added.length > 0) {
            logs.push(<div className='change-log-category' key={'added'}>{LANG.added}</div>);
            for (let i = 0; i < CHANGES.added.length; i++) {
                logs.push(
                    <div className='change-log-item' key={`added-${i}`}>
                        <div className='index'>{`${i + 1}.`}</div>
                        <div className='log'>{CHANGES.added[i]}</div>
                    </div>
                );
            }
        }
        if (CHANGES.fixed.length > 0) {
            logs.push(<div className='change-log-category' key={'fixed'}>{LANG.fixed}</div>);
            for (let i = 0; i < CHANGES.fixed.length; i++) {
                logs.push(
                    <div className='change-log-item' key={`fixed-${i}`}>
                        <div className='index'>{`${i + 1}.`}</div>
                        <div className='log'>{CHANGES.fixed[i]}</div>
                    </div>
                );
            }
        }
        if (CHANGES.changed.length > 0) {
            logs.push(<div className='change-log-category' key={'changed'}>{LANG.changed}</div>);
            for (let i = 0; i < CHANGES.changed.length; i++) {
                logs.push(
                    <div className='change-log-item' key={`changed-${i}`}>
                        <div className='index'>{`${i + 1}.`}</div>
                        <div className='log'>{CHANGES.changed[i]}</div>
                    </div>
                );
            }
        }
        return logs;
    }

    onClose = () => {
        const { onClose } = this.props;
        onClose();
    }

    render() {
        const { version } = FLUX;
        const changeLogs = this.renderChangeLogs();
        if (changeLogs.length === 0) {
            console.warn('Change log is empty.');
            this.onClose();
            return null;
        }
        return (
            <Modal>
                <div className='change-log-dialog'>
                    <div className='header'>
                        <img src='icon.png'/>
                        <div className='app'>{`Beam Studio ${version.replace('-', ' ')}`}</div>
                    </div>
                    <div className='title'>{LANG.change_log}</div>
                    <div className='change-log-container'>
                        {changeLogs}
                    </div>
                    <div className='link' onClick={
                        () => {
                            const electron = requireNode('electron');
                            electron.remote.shell.openExternal(LANG.help_center_url);
                        }}
                    >
                        {LANG.see_older_version}
                    </div>
                    <div className='footer'>
                        <button
                            className='btn btn-default primary'
                            onClick={() => {this.onClose()}}
                        >
                            {'OK'}
                        </button>
                    </div>
                </div>
            </Modal>
        )
    }
};

export default ChangeLogDialog;
