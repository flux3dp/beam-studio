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

/**
 * Selects an option from an Ant Design virtual list dropdown using keyboard navigation.
 * @param selectAlias - Cypress alias for the select element (e.g., '@select')
 * @param optionText - The text of the option to select
 */
function selectOptionWithKeyboard(selectAlias: string, optionText: string) {
  // Use arrow down to navigate through options until we find the target
  // Ant Design Select keeps track of the active option and scrolls automatically
  const maxAttempts = 30; // Enough for 21 languages

  const findAndSelect = (attempt = 0) => {
    if (attempt >= maxAttempts) {
      throw new Error(`Option "${optionText}" not found after ${maxAttempts} keyboard navigation attempts.`);
    }

    // Check if the currently active option matches our target
    cy.get('.ant-select-item-option-active .ant-select-item-option-content').then(($active) => {
      if ($active.text().trim() === optionText) {
        // Found it - press Enter to select
        cy.get(selectAlias).find('.ant-select-selection-search-input').type('{enter}', { force: true });
      } else {
        // Not found yet - press arrow down and try again
        cy.get(selectAlias)
          .find('.ant-select-selection-search-input')
          .type('{downarrow}', { force: true })
          .then(() => findAndSelect(attempt + 1));
      }
    });
  };

  findAndSelect();
}

function checkLang(lang: string) {
  const { language, title } = i18n[lang];

  // Open the dropdown
  cy.get('#select-lang').closest('.ant-select').as('select');
  cy.get('@select').find('.ant-select-selection-item').click();
  cy.get('@select').should('have.class', 'ant-select-open');

  // Use keyboard navigation to select the language option
  // This is more reliable than scroll-based approach for virtual lists
  selectOptionWithKeyboard('@select', lang);

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
