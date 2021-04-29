import settings from 'app/app-settings';
import GeneralSetting from 'app/views/settings/Setting-General';

const React = requireNode('react');

export default function () {
  class HomeView extends React.PureComponent {
    render() {
      return (
        <div className="studio-container settings-studio">
          <div className="settings-gradient-overlay" />
          <GeneralSetting
            supported_langs={settings.i18n.supported_langs}
          />
        </div>
      );
    }
  }

  return HomeView;
}
