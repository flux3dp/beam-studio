import { md5 } from '../../support/utils';

// FIXME: Real press seems not work on github CI

// describe('verify hotkey', () => {
//   beforeEach(() => {
//     cy.landingEditor();
//   });
//   if (Cypress.platform == 'darwin') {

//     it('verify command + S', () => {
//       const cypressDownloadBeamPath = Cypress.env('cypressDownloadBeamPath');
//       cy.realPress(['Meta', 'S']);
//       cy.wait(5000);
//       cy.readFile(cypressDownloadBeamPath).then((info) => {
//         expect(md5(info)).equal('b6403a0144502172f9a92672c7a39d7b');
//       });
//     });

//     it('verify command + shift + S', () => {
//       const cypressDownloadNewBeamPath = Cypress.env('cypressDownloadNewBeamPath');
//       drawRect();
//       cy.realPress(['Meta', 'Shift', 'S']);
//       cy.wait(5000);
//       cy.readFile(cypressDownloadNewBeamPath).then((info) => {
//         expect(md5(info)).equal('014673ddffcc53595306b2bc18bd9ed3');
//       });
//     });

//     it('verify command + K', () => {
//       cy.realPress(['Meta', 'K']);
//       cy.url().should('eq', 'http://localhost:8080/#/studio/settings');
//     });

//     it('verify command + Z', () => {
//       drawRect();
//       cy.realPress(['Meta', 'Z']);
//       cy.get('#svg_1').should('not.exist');
//     });

//     it('verify command + shift + Z', () => {
//       cy.realPress('Tab');
//       drawRect();
//       cy.get('#left-Cursor > img').click();
//       cy.realPress(['Meta', 'Z']);
//       cy.get('#svg_1').should('not.exist');
//       cy.get('#left-Cursor > img').click();
//       cy.realPress(['Meta', 'Shift', 'Z']);
//       cy.get('#svg_1').should('exist');
//     });

//     it('verify command + C and command + V', () => {
//       drawRect();
//       cy.get('#svg_1').click({ force: true });
//       cy.realPress(['Meta', 'C']);
//       cy.realPress(['Meta', 'V']);
//       cy.get('#svg_1').should('exist');
//       cy.get('#svg_2').should('exist');
//     });

//     it('verify command + X', () => {
//       drawRect();
//       cy.realPress(['Meta', 'X']);
//       cy.get('#svg_1').should('not.exist');
//       cy.realPress(['Meta', 'V']);
//       cy.get('#svg_1').should('exist')
//     });

//     it('verify command + D', () => {
//       drawRect();
//       cy.realPress(['Meta', 'D']);
//       cy.get('#svg_2').should('exist');
//     });

//     it('verify command + G', () => {
//       group();
//       cy.get('div.top-bar div.element-title').should('have.text', 'Layer 1 > Group');
//     });

//     it('verify command + shift + G', () => {
//       group();
//       selectAll();
//       cy.realPress(['Meta', 'Shift', 'G']);
//       cy.get('div.top-bar div.element-title').should('have.text', 'Multiple Objects');
//     });

//     it('verify command + shift + X', () => {
//       drawRect();
//       cy.realPress(['Meta', 'Shift', 'X']);
//       cy.get('[data-test-key="yes"]').click();
//       cy.get('#svg_1').should('not.exist');
//     });

//     it('verify command + ', () => {
//       cy.realPress(['Meta', 'Equal']);
//       cy.get('.zoom-ratio').should('have.text', '46%');
//     });

//     it('verify command - ', () => {
//       cy.realPress(['Meta', 'Minus']);
//       cy.get('.zoom-ratio').should('have.text', '38%');
//     });

//     it('verify option + N', () => {
//       cy.realPress(['Alt', 'N']);
//       cy.url().should('eq', 'http://localhost:8080/#/initialize/connect/select-connection-type');
//     });
//   } else {

//     it('verify control + S', () => {
//       const cypressDownloadBeamPath = Cypress.env('cypressDownloadBeamPath');
//       cy.realPress(['Control', 'S']);
//       cy.wait(5000);
//       cy.readFile(cypressDownloadBeamPath).then((info) => {
//         expect(md5(info)).equal('b6403a0144502172f9a92672c7a39d7b');
//       });
//     });

//     it('verify control + shift + S', () => {
//       const cypressDownloadNewBeamPath = Cypress.env('cypressDownloadNewBeamPath');
//       drawRect();
//       cy.realPress(['Control', 'Shift', 'S']);
//       cy.wait(5000);
//       cy.readFile(cypressDownloadNewBeamPath).then((info) => {
//         expect(md5(info)).equal('014673ddffcc53595306b2bc18bd9ed3');
//       });
//     });

//     it('verify control + K', () => {
//       cy.realPress(['Control', 'K']);
//       cy.url().should('eq', 'http://localhost:8080/#/studio/settings');
//     });

//     it('verify control + Z', () => {
//       drawRect();
//       cy.realPress(['Control', 'Z']);
//       cy.get('#svg_1').should('not.exist');
//     });

//     it('verify control + shift + Z', () => {
//       cy.realPress('Tab');
//       drawRect();
//       cy.get('#left-Cursor > img').click();
//       cy.realPress(['Control', 'Z']);
//       cy.get('#svg_1').should('not.exist');
//       cy.get('#left-Cursor > img').click();
//       cy.realPress(['Control', 'Shift', 'Z']);
//       cy.get('#svg_1').should('exist');
//     });

//     it('verify control + C and command + V', () => {
//       drawRect();
//       cy.get('#svg_1').click({ force: true });
//       cy.realPress(['Control', 'C']);
//       cy.realPress(['Control', 'V']);
//       cy.get('#svg_1').should('exist');
//       cy.get('#svg_2').should('exist');
//     });

//     it('verify control + X', () => {
//       drawRect();
//       cy.realPress(['Control', 'X']);
//       cy.get('#svg_1').should('not.exist');
//       cy.realPress(['Control', 'V']);
//       cy.get('#svg_1').should('exist')
//     });

//     it('verify control + D', () => {
//       drawRect();
//       cy.realPress(['Control', 'D']);
//       cy.get('#svg_2').should('exist');
//     });

//     it('verify control + G', () => {
//       group();
//       cy.get('div.top-bar div.element-title').should('have.text', 'Layer 1 > Group');
//     });

//     it('verify control + shift + G', () => {
//       group();
//       selectAll();
//       cy.realPress(['Control', 'Shift', 'G']);
//       cy.get('div.top-bar div.element-title').should('have.text', 'Multiple Objects');
//     });

//     it('verify control + shift + X', () => {
//       drawRect();
//       cy.realPress(['Control', 'Shift', 'X']);
//       cy.get('[data-test-key="yes"]').click();
//       cy.get('#svg_1').should('not.exist');
//     });

//     it('verify control + ', () => {
//       cy.realPress(['Control', 'Equal']);
//       cy.get('.zoom-ratio').should('have.text', '46%');
//     });

//     it('verify control - ', () => {
//       cy.realPress(['Control', 'Minus']);
//       cy.get('.zoom-ratio').should('have.text', '38%');
//     });

//     it('verify alt + N', () => {
//       cy.realPress(['Alt', 'N']);
//       cy.url().should('eq', 'http://localhost:8080/#/initialize/connect/select-connection-type');
//     });
//   };

//   function drawRect() {
//     cy.clickToolBtn('Rectangle');
//     cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
//     cy.get('svg#svgcontent').trigger('mousemove', 400, 400, { force: true });
//     cy.get('svg#svgcontent').trigger('mouseup', { force: true });
//   };

//   function selectAll() {
//     cy.clickToolBtn('Cursor');
//     cy.get('svg#svgcontent').trigger('mousedown', -10, -10, { force: true });
//     cy.get('svg#svgcontent').trigger('mousemove', 400, 400, { force: true });
//     cy.get('svg#svgcontent').trigger('mouseup', { force: true });
//   };

//   function group() {
//     drawRect();
//     drawRect();
//     selectAll();
//     cy.realPress(['Meta', 'G']);
//   };
// });
