import { selectOptionWithKeyboard } from '../../support/utils';

const fileNamePrefix = '_-_-packages-core-src-web-app-components-beambox-top-bar-FileName-index-module__';

const i18n: Record<string, { language: string; title: string }> = {
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

describe('preference language (part 3)', () => {
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
