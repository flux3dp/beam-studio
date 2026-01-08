const fileNamePrefix = '_-_-packages-core-src-web-app-components-beambox-top-bar-FileName-index-module__';

const i18n = {
  Dansk: { language: 'Sprog', title: 'Untitled' },
  Deutsch: { language: 'Sprache', title: 'Ohne Titel' },
  Ελληνικά: { language: 'Γλώσσα', title: 'Χωρίς τίτλο' },
  English: { language: 'Language', title: 'Untitled' },
  Español: { language: 'Idioma', title: 'Sin título' },
  Suomi: { language: 'Kieli', title: 'Nimeämätön' },
  Français: { language: 'Langue', title: 'Sans titre' },
  'Bahasa Indonesia': { language: 'Bahasa', title: 'Tanpa Judul' },
  Italiano: { language: 'Lingua', title: 'Senza titolo' },
  日本語: { language: '言語', title: '無題' },
  한국어: { language: '언어', title: '언타이틀' },
  Melayu: { language: 'Bahasa', title: 'Tanpa Tajuk' },
  Nederlands: { language: 'Taal', title: 'Naamloos' },
  Norsk: { language: 'Språk', title: 'Uten tittel' },
  Polski: { language: 'Język', title: 'Bez nazwy' },
  Português: { language: 'Idioma', title: 'Sem título' },
  Svenska: { language: 'Språk', title: 'Namnlös' },
  ภาษาไทย: { language: 'ภาษา', title: 'ไม่มีชื่อ' },
  'Tiếng Việt': { language: 'Ngôn ngữ', title: 'Chưa đặt tên' },
  简体中文: { language: '语言', title: '无标题' },
  繁體中文: { language: '語言', title: '未命名' },
};

function checkLang(lang: string) {
  const { language, title } = i18n[lang];

  // Open the dropdown
  cy.get('#select-lang').closest('.ant-select').as('select');
  cy.get('@select').find('.ant-select-selection-item').click();
  cy.get('@select').should('have.class', 'ant-select-open');

  // Scroll to the desired language option
  cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
    .find('.rc-virtual-list-holder') // Target the scrollable container
    .then(($container) => {
      const findOption = () =>
        $container
          .find('.ant-select-item-option-content')
          .toArray()
          .find((el) => el.textContent?.trim() === lang);

      // Scroll until the desired option is found
      const scrollAndFind = (attempt = 0) => {
        if (attempt >= 20) {
          throw new Error(`Option "${lang}" not found after 10 scroll attempts.`);
        }

        const option = findOption();

        if (option) {
          cy.wrap(option).click({ force: true });
        } else {
          $container[0].scrollBy(0, attempt <= 10 ? 100 : -100); // Scroll down by 100px

          // Wait for the DOM to update after scrolling
          cy.wait(200).then(() => scrollAndFind(attempt + 1));
        }
      };

      scrollAndFind();
    });

  // Verify the language label - SettingFormItem now uses custom layout with CSS modules
  // The label is in a sibling div with class containing 'label'
  cy.get('#select-lang-label')
    .find('[class*="label"]:not([class*="label-container"])', { timeout: 10000 })
    .should('have.text', language);

  cy.get('div.btn-done').click();

  // Verify the file name with the expected title
  cy.get(`div[class*="${fileNamePrefix}file-name--"]`, { timeout: 10000 }).should('exist').and('have.text', title);
}

describe('preference language', () => {
  beforeEach(() => {
    cy.landingEditor();
    cy.go2Preference();
  });

  Object.keys(i18n).forEach((lang) => {
    it(`choose ${lang}`, () => {
      checkLang(lang);
    });
  });
});
