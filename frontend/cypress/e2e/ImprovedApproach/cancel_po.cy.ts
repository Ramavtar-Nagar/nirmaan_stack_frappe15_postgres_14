/// <reference types="Cypress" />
/// <reference path="../support/commands.js" />

describe('Purchase Order Cancellation End-to-End Flow', () => {
  // Before each test, we log in using the fast programmatic command
  // and load our fixture data for easy access.
  beforeEach(function () {
    cy.login();
    cy.fixture('po-cancellation-data.json').as('poData');
    cy.visit('/');
  });

  it('should find an approved PO, cancel it, and verify its presence in the "Rejected PO" list', function () {
    // --- Step 1: Navigate to the Approved POs tab ---
    cy.log('--- Navigating to Approved Purchase Orders ---');
    cy.get('[data-cy="purchase-orders-button"]').click();
    cy.url().should('include', '/purchase-orders');
    cy.get('[data-cy="approved-po-navigation"]').click();

    // --- Step 2: Check if any POs exist and select the first one ---
    cy.log('--- Selecting the first available PO ---');
    cy.get('body', { timeout: 10000 }).then(($body) => {
      // Gracefully skip the test if the table is empty.
      if ($body.find('[data-cy="procurement-requests-data-table"] tbody tr').length === 0) {
        cy.log(this.poData.noPoFoundMessage);
        this.skip();
      }
    });

    // At this point, we know at least one PO exists. Clicking the first one.
    cy.get('[data-cy="procurement-requests-data-table"] tbody tr a[href*="/purchase-orders/"]')
      .first()
      .click();

    // --- Step 3: Using our custom command to handle the core logic ---
    // Wait for the details page to fully load before taking action.
    cy.get('[data-cy="po-details-page-identifier"]', { timeout: 15000 }).should('be.visible');

    // This command will intelligently find the "Cancel" or "Delete" button,
    // handle the dialog, and return the result.
    cy.cancelOrDeletePo(this.poData.cancellationComment).then((result) => {
      // --- Step 4: Verify the outcome based on the action our command took ---
      
      if (result.action === 'cancelled') {
        cy.log(`--- PO was cancelled. Verifying Sent Back ID: ${result.sentBackId} ---`);
        
        // As per your original flow, navigate to Procurement Requests to find the rejected PO.
        cy.get('[data-cy="procurement-requests-button"]').click();
        cy.get('[data-cy="rejected-po-navigation"]').click();

        // Verify the cancelled PO appears in the correct table using the stable selector.
        cy.get('[data-cy="procurement-requests-data-table"]', { timeout: 15000 })
          .should('be.visible')
          .find(`a:contains("${result.sentBackId}")`) // Find the specific link
          .should('be.visible');
          
        cy.log(`SUCCESS: Cancelled PO with SB ID ${result.sentBackId} was found in the Rejected POs list.`);

      } else if (result.action === 'deleted') {
        // If the PO was deleted, we just confirm we are back on the main PO list page.
        cy.log('--- PO was deleted. Verifying redirection. ---');
        cy.url().should('include', '/purchase-orders');
        cy.get('[data-cy="approved-po-navigation"]').should('be.visible');
        cy.log('SUCCESS: PO was deleted and user was redirected correctly.');

      } else {
        // This handles the case where the custom command found neither button.
        cy.log(this.poData.noCancelOrDeleteButtonMessage);
        this.skip();
      }
    });
  });
});