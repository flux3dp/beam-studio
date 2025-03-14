import { md5 } from '../../support/utils';

describe('convert to path 2.0', () => {
  const isRunningAtGithub = Cypress.env('envType') === 'github';
  const isWindows = Cypress.platform === 'win32';

  const drawText = () => {
    cy.clickToolBtn('Text');
    cy.get('svg#svgcontent').realClick({ x: 100, y: 100 });
    cy.wait(1000);
    cy.inputText('123');
    cy.get('#svg_1').should('exist');
    cy.getElementTitle().should('have.text', 'Layer 1 > Text');
    cy.get('.tab.objects').click();
    cy.get('div#object-panel').should('exist');
    cy.get('.ant-select-selection-item[title="Font"]').click();
    cy.get('.ant-select-item-option-content img[alt="Mr Bedfort"]').click();
    cy.get('#svg_1').should('have.attr', 'font-family').and('eq', "'Mr Bedfort'");
    cy.get('#x_position').clear().type('100{enter}');
    cy.get('#svg_1', { timeout: 15000 })
      .invoke('attr', 'x')
      .should('be.closeTo', isWindows ? 1019 : 1011, 3);
    cy.get('#y_position').clear().type('50{enter}');
    cy.get('#svg_1', { timeout: 15000 }).invoke('attr', 'y').should('be.closeTo', 703, 3);
  };

  const checkConsoleLog = () => {
    cy.get('@log')
      .invoke('getCalls')
      .each((call: any) => {
        call.args.forEach((arg) => {
          if (arg) expect(arg.toString()).not.contain('Unable to handle font');
        });
      });
  };

  const verifyPathMd5 = (
    selector: string,
    expectedValues: { default: string; githubWindows: string; githubOther: string },
  ) => {
    cy.get(selector)
      .invoke('attr', 'd')
      .then((d) => {
        let expectedValue = expectedValues.default;
        if (isRunningAtGithub) {
          expectedValue = isWindows ? expectedValues.githubWindows : expectedValues.githubOther;
        }
        expect(md5(d)).equal(expectedValue);
      });
  };

  beforeEach(() => {
    cy.landingEditor();
    drawText();
    cy.window().then((win) => cy.spy(win.console, 'log').as('log'));
  });

  it('convert to path', () => {
    cy.get('#convert_to_path').click();
    cy.get('#svg_2').should('exist').click({ force: true });
    cy.getElementTitle().should('have.text', 'Layer 1 > Path');
    checkConsoleLog();
    cy.get('#svg_2').should('have.attr', 'd');
    verifyPathMd5('#svg_2', {
      default: '6fde8da297586452f7561d6dc93299bc',
      githubWindows: 'a93f7f803e8eea840d61531458838987',
      githubOther: '5951b071eac21549437779d3bb3554bd',
    });
  });

  it('replace text', () => {
    cy.get('#svg_1')
      .should('exist')
      .then(($text) => {
        $text.children('tspan')[0].innerHTML = 'hello你好';
      });
    cy.get('#convert_to_path').click();
    cy.contains('Your text contains characters which are not supported by current font.').should('exist', {
      timeout: 3000,
    });
    cy.contains('strong', '思源黑體 TC').should('exist');
    cy.contains('Confirm').click();
    cy.get('#svg_2').should('exist').click({ force: true });
    cy.getElementTitle().should('have.text', 'Layer 1 > Path');
    checkConsoleLog();
    cy.get('#svg_2').should('have.attr', 'd');
    verifyPathMd5('#svg_2', {
      default: '0b39368fe65b64e08cd08b9c8ff625b9',
      githubWindows: '415ea1b80d7fc380646248203bfd10e4',
      githubOther: '9790fb3564249f0952dd1b131b77eba3',
    });
  });

  it('weld text', () => {
    cy.get('#letter_spacing').clear().type('1.5{enter}');
    cy.get('#svg_1').should('have.attr', 'letter-spacing').and('eq', '1.5em');
    cy.get('#weld').click();
    cy.get('#svg_2').should('exist').click({ force: true });
    cy.getElementTitle().should('have.text', 'Layer 1 > Path');
    checkConsoleLog();
    cy.get('#svg_2').should('have.attr', 'd');
    verifyPathMd5('#svg_2', {
      default: 'd828dcc474ad48d26ecb9269cb3844fa',
      githubWindows: '9f6739e16128b247684722743e8b04a1',
      githubOther: '8ffd98ed29e592cf37182bb6f9190729',
    });
  });
});
