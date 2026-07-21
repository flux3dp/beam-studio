// Design Market is a client-side link: the "Design Market" item in the top-bar Account menu
// opens the FLUX Design Market site in a new tab. On web, browser.open() delegates to
// window.open(), so we stub window.open and assert it is called with the design-market URL.
//
// URL source of truth: lang/en.ts -> topbar.menu.link.design_market === 'https://dmkt.io'
// Menu wiring: TopBar/useMenuData.ts -> Account menu -> { id: 'DESIGN_MARKET', url: ... }
// Menu click: TopBar/Menu.tsx handleItemClick -> browser.open(node.url).

const DESIGN_MARKET_URL = 'https://dmkt.io';

describe('design market', () => {
  it('opens the Design Market site from the Account menu', () => {
    cy.landingEditor({
      onBeforeLoad(win) {
        // Stub before the app loads so the menu handler hits the stub.
        cy.stub(win, 'open').as('windowOpen');
      },
    });

    cy.getMenuItem(['Account'], 'Design Market').click();

    cy.get('@windowOpen').should('have.been.calledWith', DESIGN_MARKET_URL);
  });
});
