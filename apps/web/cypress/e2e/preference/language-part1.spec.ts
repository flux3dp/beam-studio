import { selectOptionWithKeyboard } from '../../support/utils';

const fileNamePrefix = '_-_-packages-core-src-web-app-components-beambox-top-bar-FileName-index-module__';

const i18n: Record<string, { language: string; title: string }> = {
  Dansk: { language: 'Sprog', title: 'Untitled' },
  Deutsch: { language: 'Sprache', title: 'Ohne Titel' },
  Ελληνικά: { language: 'Γλώσσα', title: 'Χωρίς τίτλο' },
  English: { language: 'Language', title: 'Untitled' },
  Español: { language: 'Idioma', title: 'Sin título' },
  Suomi: { language: 'Kieli', title: 'Nimeämätön' },
  Français: { language: 'Langue', title: 'Sans titre' },
};

function checkLang(lang: string) {
  const { language, title } = i18n[lang];

  cy.get('#select-lang').closest('.ant-select').as('select');
  cy.get('@select').find('.ant-select-selection-item').click();
  cy.get('@select').should('have.class', 'ant-select-open');

  selectOptionWithKeyboard('@select', lang);

  cy.get('#select-lang-label')
    .find('[class*="label"]:not([class*="label-container"])', { timeout: 10000 })
    .should('have.text', language);

  cy.get('div.btn-done').click();

  cy.get(`div[class*="${fileNamePrefix}file-name--"]`, { timeout: 10000 }).should('exist').and('have.text', title);
}

describe('preference language (part 1)', () => {
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
