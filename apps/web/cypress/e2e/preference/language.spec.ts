const fileNamePrefix = '_-_-packages-core-src-web-app-components-beambox-top-bar-FileName-module__';

const i18n = {
  da: { language: 'Sprog', title: 'Untitled' },
  de: { language: 'Sprache', title: 'Ohne Titel' },
  el: { language: 'Γλώσσα', title: 'Χωρίς τίτλο' },
  en: { language: 'Language', title: 'Untitled' },
  es: { language: 'Idioma', title: 'Sin título' },
  fi: { language: 'Kieli', title: 'Nimeämätön' },
  fr: { language: 'Langue', title: 'Sans titre' },
  id: { language: 'Bahasa', title: 'Tanpa Judul' },
  it: { language: 'Lingua', title: 'Senza titolo' },
  ja: { language: '言語', title: '無題' },
  kr: { language: '언어', title: '언타이틀' },
  ms: { language: 'Bahasa', title: 'Tanpa Tajuk' },
  nl: { language: 'Taal', title: 'Naamloos' },
  no: { language: 'Språk', title: 'Uten tittel' },
  pl: { language: 'Język', title: 'Bez nazwy' },
  pt: { language: 'Idioma', title: 'Sem título' },
  se: { language: 'Språk', title: 'Namnlös' },
  th: { language: 'ภาษา', title: 'ไม่มีชื่อ' },
  vi: { language: 'Ngôn ngữ', title: 'Chưa đặt tên' },
  'zh-tw': { language: '語言', title: '未命名' },
  'zh-cn': { language: '语言', title: '无标题' },
};

function checkLang(lang: string, text: string, title: string) {
  cy.get('select#select-lang').select(lang);
  cy.get('.form > :nth-child(2) > .span3 > .font2').should('have.text', text);
  cy.get('div.btn-done').click();
  cy.get(`div[class*="${fileNamePrefix}file-name--"]`, { timeout: 1000 }).should('exist');
  cy.get(`div[class*="${fileNamePrefix}file-name--"]`).should('have.text', title);
}

describe('preference language', () => {
  beforeEach(() => {
    cy.landingEditor();
    cy.go2Preference();
  });

  Object.keys(i18n).forEach((lang) => {
    it(`choose ${lang}`, () => {
      checkLang(lang, i18n[lang].language, i18n[lang].title);
    });
  });
});
