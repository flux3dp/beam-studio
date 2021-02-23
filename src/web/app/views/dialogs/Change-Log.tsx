const React = requireNode('react');

import Modal from 'app/widgets/Modal';
import i18n from 'helpers/i18n';

const LANG = i18n.lang.change_logs;

const CHANGES_TW = {
    added: [
        '新增『問券回饋』功能。',
        '新增 版本『更新日誌』對話窗。',
        '新增與FLUX 分享錯誤回報的隱私權設定。',
        '拖移複製功能左鍵+ “alt” （Mac "option"）支援多選物件複製。',
        '新增『使用當前字體』按鈕於文字轉換為路徑時跳出的警告視窗。',
    ],
    fixed: [
        '修正 第一圖層雷射不出光的問題。',
        '修正 Mac 系統偏好設定總是顯示捲軸狀態下，Beam Stuido 介面右側破版問題。',
        '修正 Beam Studio專案生成雕刻檔時，隨機產生不預期切割線段問題。',
        '修正 『替換影像』功能。',
        '修正『文字轉換為路徑』停在解析字體中狀態問題。',
        '修正 『解散圖檔』計算進度卡住的問題。',
        '修正 『陣列』功能參數欄位輸入行為異常問題。',
        '修正 『陣列』功能結果不正確。',
        '修正 畫布中『框選』功能能異常問題。',
        '修正 『直線』物件無法計算切割時間之問題。',
        '修正 錯誤訊息與機器連接密碼視窗排列前後順序。',
        '修正 顯示速度限制提示介面。',
        '修正 雷射頭原點設定按鈕連續點選後，Beam Studio 視窗異常顯示問題。',
        '修正 『最佳化』功能結束按鈕在某些情境下點擊沒有反應。',
        '修正 輸入連接密碼時，快捷鍵衝突問題。',
        '修正 使用鋼筆工具繪圖時，縮放畫布大小導致曲線控制桿顯示錯位問題。',
        '修正 『偏好設定』中，預設字體與專案不一致問題。',
        '修正 相機預覽後的『影像描圖』的『確認』『返回』及『取消』按鈕有時候會消失的問題。',
        '修正 圖片『裁剪』功能有時會失效的問題。',
        '修正 貼上快捷鍵在編輯功能區複製數值，應排除貼上物件的行為。',
        '修正 雙擊群組物件後工作區域顯示異常。',
        '修正 有時偏好設定中『預設字型』下拉選單內容會消失的問題。',
        '修正 在畫布上雙擊輸入文字會導致介面上顯示空物件問題。',
        '修正 部分大圖向量化功能異常。',
        '修正 雙擊直書文字選取範圍錯位問題。',
        '修正 雕刻參數匯入異常問題。',
        '修正 單一物件在場景中剪下後，無法貼上的問題。',
        '修正 繪製物件與右鍵同時執行時，畫面操作異常問題。',
        '修正 多次開啟清除場景對話窗，畫面背景顯示異常問題。',
        '修正 雙擊最佳化後的物件，物件錯位等問題。',
        '修正 第一次安裝Beam Studio 無法與有設定密碼的機器連線。',
        '修正 在軟體初始化狀態設定流程中，無法關閉 Beam Studio 視窗之操作。 ',
        '修正 中文版網路檢測提示框字串錯誤問題。',
    ],
    changed: [
        '『文字轉換為路徑』遇不支援字元之警告視窗，更改『取消』按鈕行為不執行任何指令動作。',
        '相機預覽模式下，取消物件選取、位移、旋轉與縮放功能。',
        '修改「機器錯誤 請重啟機器」字串，為「韌體執行雕刻程序錯誤，請嘗試重新啟動機器」',
        '移除 快捷鍵 Shift 45度移動行爲，保留垂直與水平移動。',
        '非封閉曲線物件如直線與鋼筆繪製支線段，不支援 『相加』、『相減』、『相交』與『相異』功能。',
        '文字輸入模式下，不支援移動、旋轉、縮放功能。',
        '物件旋轉值域為 -180 到 +180',
        '檔案存檔類型的名稱 beambox 雷雕場景改成 Beam Studio 場景',
    ],
};

const CHANGES_EN = {
    added: [
        'Added "Feedback Questionnaire" popup dialog.',
        'Added "Changelog" popup dialog.',
        'Added "Share with FLUX" privacy setting in Preferences.',
        'Supported multi-selected object duplicates while using left click drag with the "alt" key. ("option" key for MacOS)',
        'Added "Use Current Font" button in "Convert to Path" warning dialog.',
    ],
    fixed: [
        'Fixed the problem that the first layer of objects could not emit laser light.',
        'Fixed right panel layout issue of Beam Studio when the Mac preference "show scroll bars" is set to "always".',
        'Fixed unexpected cutting lines randomly generated when calculating Beam Studio task.',
        'Fixed "Replace with..." function.',
        'Fixed "Convert to Path" hanging issue.',
        'Fixed "Disassemble" hanging issue.',
        'Fixed abnormal behavior of parameter field in "Array" function panel.',
        'Fixed incorrect result with using "Array" function.',
        'Fixed abnormal behavior with box selection.',
        'Fixed the problem of failing to estimate time while project include line object.',
        'Fixed the wrong popup order of insert machine password panel and error message pop out.',
        'Fixed speed limit warning message not appearing when both speed and power is too high.',
        'Fixed displaying problem after clicking laser head origin setting button multiple times.',
        'Fixed issue that "Optimize" mode "Cancel" button did not response in some situations.',
        'Fixed shortcut conflict while entering Connection Password.',
        'Fixed path controller displaying issue when zooming canvas while drawing paths.',
        'Fixed "Default Font" setting in the Preference.',
        'Fixed layout issue of "Trace Image" panel.',
        'Fixed "Image Crop" function sometimes is not working.',
        'Fixed shortcut conflict when editing object dimension values.',
        'Fixed the problem that double clicks the group object will cause the canvas display abnormally.',
        'Fixed displaying issue of "Default Font" drop down list in preference.',
        'Fixed the problem that double clicks the "Input Text" cursor on the canvas will create an null object.',
        'Fixed bug when "tracking" large images.',
        'Fixed the misalignment problem when double-clicking the text selection area of the "Vertical text" status.',
        'Fixed that "Import Parameters" function was not working.',
        'Fixed the issue that cut object could not be pasted.',
        'Fixed the problem of abnormal screen operation when drawing objects and right-clicking at the same time.',
        'Fixed the problem that the screen background is displayed abnormally when the "Clear Scene" dialog box is opened multiple times.',
        'Fixed the problem of double-clicking on the optimized object, the object will be misaligned.',
        'Fixed the problem that Beam Studio could not connect to a machine with connection password in machine-connection page.',
        'Fixed the problem that unable to close the Beam Studio window during the initialization process after reseting Beam Studio.',
    ],
    changed: [
        'Changed the "Cancel" button behavior to not execute any command actions of characters which are not supported by current font while using "Convert to Path" function.',
        'Disabled "Select", "Move", "Rotate" and "Scale" behavior in "Camera Preview" mode.',
        'Changed the error message "Please restart the machine" to "Error when machine firmware executing the task. Please restart the machine."',
        'Removed the 45 degree movement behavior when moving and holding "Shift" key. Keeps vertical and horizontal movement.',
        'Non-closed objects such as "Line" and "Path" do not support "Union", "Subtract", "Intersect" and "Different" functions.',
        'Disabled "Move", "Rotate" and "Scale" object behavior while typing.',
        'Changed the object "Rotation" range from -180 to +180.',
        'Changed "Save Scene" format name form "Beambox Scene" to "Beam Studio Scene."'
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
