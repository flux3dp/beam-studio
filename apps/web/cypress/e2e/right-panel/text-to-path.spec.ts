import { md5 } from '../../support/utils';

const isRunningAtGithub = Cypress.env('envType') === 'github';
const isWindows = Cypress.platform === 'win32';
const isInteractive = Cypress.config('isInteractive');
const beamSeriersName = Cypress.env('beamSeriersName');

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
  cy.wait(500);
  cy.get('#svg_1')
    .invoke('attr', 'x')
    .should('be.closeTo', isWindows ? 1019 : 1011, 1);
  cy.get('#y_position').clear().type('50{enter}');
  cy.wait(500);
  cy.get('#svg_1').invoke('attr', 'y').should('be.closeTo', 703, 1);
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

describe('convert to path 1.0', () => {
  if (isRunningAtGithub) {
    it('skip test on github', () => {
      cy.log('skip test on github');
    });
    return;
  }

  beforeEach(() => {
    cy.setUpBackend(Cypress.env('backendIP'));
    cy.landingEditor();
    cy.go2Preference();
    cy.get('#font-convert').select('1.0');
    cy.get('.btn.btn-done').contains('Apply').click();
    cy.connectMachine(beamSeriersName);
    drawText();
    cy.window().then((win) => cy.spy(win.console, 'log').as('log'));
  });

  it('convert to path', () => {
    cy.get('#convert_to_path').click();
    cy.get('#svg_2').should('exist');
    cy.get('#svg_2').click({ force: true });
    cy.getElementTitle().should('have.text', 'Layer 1 > Path');
    checkConsoleLog();
    cy.get('#svg_2').should('have.attr', 'd');
    cy.get('#svg_2')
      .invoke('attr', 'd')
      .then((d) => expect(md5(d)).equal('a6cae32f9d516334b1c3209b25277ae4'));
  });

  it('replace text', () => {
    cy.get('#svg_1')
      .should('exist')
      .then(($text) => {
        $text.children('tspan')[0].innerHTML = 'hello你好';
      });
    cy.get('#convert_to_path').click();
    cy.contains('Your text contains characters which are not supported by current font.').should('exist');
    cy.contains('strong', '思源黑體 TC').should('exist');
    cy.contains('Confirm').click();
    cy.get('#svg_2').should('exist');
    cy.get('#svg_2').click({ force: true });
    cy.getElementTitle().should('have.text', 'Layer 1 > Path');
    checkConsoleLog();
    cy.get('#svg_2').should('have.attr', 'd');
    cy.get('#svg_2')
      .invoke('attr', 'd')
      .then((d) => {
        // text y position is slightly different after changing font family
        if (isInteractive) expect(md5(d)).equal('6102fcf66d921bcb93212f2cee1b2ad2');
        else expect(md5(d)).equal('757b73da31fade6a7ade848068c8fa04');
      });
  });

  it('weld text', () => {
    cy.get('#letter_spacing').clear().type('-0.8{enter}');
    cy.get('#svg_1').should('have.attr', 'letter-spacing').and('eq', '-0.8em');
    cy.get('#weld').click();
    cy.get('#svg_2').should('exist');
    cy.get('#svg_2').click({ force: true });
    cy.getElementTitle().should('have.text', 'Layer 1 > Path');
    checkConsoleLog();
    cy.get('#svg_2').should('have.attr', 'd');
    cy.get('#svg_2')
      .invoke('attr', 'd')
      .then((d) => expect(md5(d)).equal('038840e83f83269f357338de0b8e1d35'));
  });
});

describe.only('convert to path 2.0', () => {
  beforeEach(() => {
    cy.landingEditor();
    drawText();
    cy.window().then((win) => cy.spy(win.console, 'log').as('log'));
  });

  it('convert to path', () => {
    cy.get('#convert_to_path').click();
    cy.get('#svg_2').should('exist');
    cy.get('#svg_2').click({ force: true });
    cy.getElementTitle().should('have.text', 'Layer 1 > Path');
    checkConsoleLog();
    cy.get('#svg_2').should('have.attr', 'd');
    cy.get('#svg_2')
      .invoke('attr', 'd')
      .then((d) => {
        let expectedValue = '6fde8da297586452f7561d6dc93299bc';
        if (isRunningAtGithub) {
          expectedValue = isWindows ? 'a93f7f803e8eea840d61531458838987' : '5951b071eac21549437779d3bb3554bd';
        }
        expect(md5(d)).equal(expectedValue);
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
    cy.get('#svg_2').should('exist');
    cy.get('#svg_2').click({ force: true });
    cy.getElementTitle().should('have.text', 'Layer 1 > Path');
    checkConsoleLog();
    cy.get('#svg_2').should('have.attr', 'd');
    cy.get('#svg_2')
      .invoke('attr', 'd')
      .then((d) => {
        let expectedValue = '0b39368fe65b64e08cd08b9c8ff625b9';
        if (isRunningAtGithub) {
          expectedValue = isWindows ? '415ea1b80d7fc380646248203bfd10e4' : '9790fb3564249f0952dd1b131b77eba3';
        }
        expect(md5(d)).equal(expectedValue);
      });
  });

  it('weld text', () => {
    cy.get('#letter_spacing').clear().type('1.5{enter}');
    cy.get('#svg_1').should('have.attr', 'letter-spacing').and('eq', '1.5em');
    cy.get('#weld').click();
    cy.get('#svg_2').should('exist');
    cy.get('#svg_2').click({ force: true });
    cy.getElementTitle().should('have.text', 'Layer 1 > Path');
    checkConsoleLog();
    cy.get('#svg_2').should('have.attr', 'd');
    cy.get('#svg_2')
      .invoke('attr', 'd')
      .then((d) => {
        let expectedValue = 'd828dcc474ad48d26ecb9269cb3844fa';
        if (isRunningAtGithub) {
          expectedValue = isWindows ? '9f6739e16128b247684722743e8b04a1' : '8ffd98ed29e592cf37182bb6f9190729';
        }
        expect(md5(d)).equal(expectedValue);
      });
  });
});
