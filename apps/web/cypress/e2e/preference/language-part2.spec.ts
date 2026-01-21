import { selectOptionWithKeyboard } from '../../support/utils';

const fileNamePrefix = '_-_-packages-core-src-web-app-components-beambox-top-bar-FileName-index-module__';

const i18n: Record<string, { language: string; title: string }> = {
  'Bahasa Indonesia': { language: 'Bahasa', title: 'Tanpa Judul' },
  Italiano: { language: 'Lingua', title: 'Senza titolo' },
  日本語: { language: '言語', title: '無題' },
  한국어: { language: '언어', title: '언타이틀' },
  Melayu: { language: 'Bahasa', title: 'Tanpa Tajuk' },
  Nederlands: { language: 'Taal', title: 'Naamloos' },
  Norsk: { language: 'Språk', title: 'Uten tittel' },
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

describe('preference language (part 2)', () => {
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
