/// <reference types="Cypress" />
/// <reference path="../support/commands.js" />

describe('Full Procurement Request to Purchase Order End-to-End Flow', () => {
  // Before the test, load all necessary data from our fixture file.
  before(function () {
    cy.fixture('full-pr-to-po-flow.json').as('flowData');
  });

  // A single `it` block to run the entire flow, ensuring it's self-contained.
  it('should create, approve, quote, and finalize a PR into an approved PO', function () {
    // We start by logging in once.
    cy.login();
    cy.visit('/');

    // --- Step 1: Create a new Procurement Request ---
    // The command handles all the UI interactions and returns the new PR number.
    cy.createPr(this.flowData).then((prNumber) => {
      // The PR number is now available here to be used in the next step.
      cy.log(`PR ${prNumber} created. Now approving it.`);
      
      // --- Step 2: Approve the newly created PR ---
      // We pass the prNumber to the next command.
      cy.approvePr(prNumber, this.flowData.missingProduct);

      // --- Step 3: Add vendor quotes to the approved PR ---
      cy.log(`PR ${prNumber} approved. Now adding vendor quotes.`);
      cy.addVendorQuotes(prNumber, {
        vendors: this.flowData.vendors,
        quoteRate: this.flowData.quoteRate,
      });

      // --- Step 4: Approve the vendor quotes to generate a Purchase Order ---
      cy.log(`Quotes added for PR ${prNumber}. Now approving to create a PO.`);
      cy.approvePo(prNumber, this.flowData.finalApprovalComment).then((poNumber) => {
        // The final command returns the new PO number.

        // --- Step 5: Final Verification ---
        cy.log(`PO ${poNumber} created. Verifying its presence in the Approved PO list.`);
        cy.get('[data-cy="purchase-orders-button"]').click();
        cy.get('[data-cy="approved-po-navigation"]').click();
        
        // Final check to ensure the PO exists in the final list.
        cy.get('[data-cy="procurement-requests-data-table"]', { timeout: 15000 })
          .should('be.visible')
          .and('contain', poNumber);

        cy.log('*** End-to-end flow completed successfully! ***');
      });
    });
  });
}); 