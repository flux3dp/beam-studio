import * as i18n from 'helpers/i18n';
import settings from 'app/app-settings';
import GeneralSetting from 'app/views/settings/Setting-General';

const React = requireNode('react');

export default function () {
  class HomeView extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        lang: i18n.lang,
      };
    }

    onLangChange = () => {
      this.setState({
        lang: i18n.lang,
      });
    };

    renderContent = () => {
      const { lang } = this.state;
      return (
        <GeneralSetting
          lang={lang}
          supported_langs={settings.i18n.supported_langs}
          onLangChange={this.onLangChange}
        />
      );
    };

    render() {
      return (
        <div className="studio-container settings-studio">
          <div className="settings-gradient-overlay" />
          {this.renderContent()}
        </div>
      );
    }
  }

  return HomeView;
}
