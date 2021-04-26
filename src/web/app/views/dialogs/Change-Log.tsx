import Modal from 'app/widgets/Modal';
import i18n from 'helpers/i18n';

const React = requireNode('react');
const PropTypes = requireNode('prop-types');
const LANG = i18n.lang.change_logs;

const CHANGES_TW = {
  added: [
    '新增「自動儲存」專案功能。',
    '在編輯功能列表上新增原地貼上選項。',
  ],
  fixed: [
    '修正了一些「相機校正」的問題。',
    '修正混和雷射校正失敗問題。',
    '修正 Windows「新手教學」介面顯示異常。',
    '修正德文說明功能列表中「問卷回饋」字串。',
    '修正Windows版本儀表板顯示問題。',
    '修正Windows版本管理參數顯示問題。',
    '修正Windows版本「原地貼上」功能重複貼上的問題。',
    '修正文字於編輯狀態下刪除文字介面顯示異常問題。',
    '修正新增機器時，確認相機狀態回報資訊錯誤的問題。',
    '修正執行新手教學流程中，建立幾何圖形步驟按下右鍵後無法再次建立圖形的問題。',
    '修正開啟參考線的狀態下改變工作範圍後顯示錯誤的問題。',
  ],
  changed: [
  ],
};

const CHANGES_EN = {
  added: [
    'Added "Auto Save" feature.',
    'Added "Paste in Place" function in the Edit Menu.',
  ],
  fixed: [
    'Fixed some "Calibrate Camera" problem.',
    'Fixed "Calibrate Hybrid Module" failed problem.',
    'Fixed abnormal interface display in "Starting Tutorial." (Windows only)',
    'Fixed “Feedback-Fragebogen” text for the Deutsche version in the Help Menu.',
    'Fixed "Dashboard" interface display problem. (Windows only)',
    'Fixed "Manage Parameter" interface display problem. (Windows only)',
    'Fixed "Paste in Place" double paste problem. (Windows only)',
    'Fixed abnormal display on canvas while deleting the text during editing it.',
    'Fixed the wrong log report with  "Checking camera availability..." during Machine Setup.',
    'Fixed fail to create the rectangle or oval while right-clicking on canvas during the Starting Tutorial.',
    'Fixed the "Guides" wrong display after changing the "Work Area."',
  ],
  changed: [
  ],
};

class ChangeLogDialog extends React.Component {
  render(): Element {
    const renderChangeLogs = () => {
      const activeLang = i18n.getActiveLang();
      const CHANGES = activeLang.startsWith('zh') ? CHANGES_TW : CHANGES_EN;
      const logs = [];
      if (CHANGES.added.length > 0) {
        logs.push(<div className="change-log-category" key="added">{LANG.added}</div>);
        for (let i = 0; i < CHANGES.added.length; i += 1) {
          logs.push(
            <div className="change-log-item" key={`added-${i}`}>
              <div className="index">{`${i + 1}.`}</div>
              <div className="log">{CHANGES.added[i]}</div>
            </div>,
          );
        }
      }
      if (CHANGES.fixed.length > 0) {
        logs.push(<div className="change-log-category" key="fixed">{LANG.fixed}</div>);
        for (let i = 0; i < CHANGES.fixed.length; i += 1) {
          logs.push(
            <div className="change-log-item" key={`fixed-${i}`}>
              <div className="index">{`${i + 1}.`}</div>
              <div className="log">{CHANGES.fixed[i]}</div>
            </div>,
          );
        }
      }
      if (CHANGES.changed.length > 0) {
        logs.push(<div className="change-log-category" key="changed">{LANG.changed}</div>);
        for (let i = 0; i < CHANGES.changed.length; i += 1) {
          logs.push(
            <div className="change-log-item" key={`changed-${i}`}>
              <div className="index">{`${i + 1}.`}</div>
              <div className="log">{CHANGES.changed[i]}</div>
            </div>,
          );
        }
      }
      return logs;
    };

    const { onClose } = this.props;
    const { version } = window.electron;
    const changeLogs = renderChangeLogs();
    if (changeLogs.length === 0) {
      onClose();
      return null;
    }

    const handleLink = () => {
      const electron = requireNode('electron');
      electron.remote.shell.openExternal(LANG.help_center_url);
    };

    return (
      <Modal>
        <div className="change-log-dialog">
          <div className="header">
            <img src="icon.png" alt="Beam Studio Logo" />
            <div className="app">{`Beam Studio ${version.replace('-', ' ')}`}</div>
          </div>
          <div className="title">{LANG.change_log}</div>
          <div className="change-log-container">
            {changeLogs}
          </div>
          <div
            role="button"
            tabIndex={0}
            className="link"
            onKeyDown={() => handleLink()}
            onClick={() => handleLink()}
          >
            {LANG.see_older_version}
          </div>
          <div className="footer">
            <button
              type="button"
              className="btn btn-default primary"
              onClick={() => onClose()}
            >
              OK
            </button>
          </div>
        </div>
      </Modal>
    );
  }
}

ChangeLogDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default ChangeLogDialog;
