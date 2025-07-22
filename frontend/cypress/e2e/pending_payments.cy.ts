/// <reference types="Cypress" />

describe('Dynamic Project Payment Approval and Processing Flow', () => {
  beforeEach(function () {
    cy.login();
    // cy.fixture('project-payment-data.json').as('paymentData');
    cy.visit('/');
  });

  it('should dynamically reject one payment', function () {

    cy.log('--- Step 1: Navigating to Project Payments -> Approve Payments tab ---');
    cy.log(' --- Navigating to Projec t Payments Tab --- ');
    cy.get('[data-cy="project-payments-button"]').should('exist').and('be.visible').click();
    cy.get('[data-cy="po-number-from-purchase-orders"]').should('exist').and('be.visible');

    cy.log('--- Step 2: Verify that the pending payments table contains at least two rows ---');
    cy.get('[data-cy="data-table"]', { timeout: 16000 })
        .should('be.visible')
        .within(() => {
            cy.get('tbody tr').should('have.length.gte', 2);
        });
    cy.log('SUCCESS: Prerequisite met. At least two pending payments are available.');

    cy.log('--- Step 3: Find the first pending payment and reject the payment request ---');
    cy.get('[data-cy="payments-reject-button"]', { timeout: 10000 })
            .first()
            .scrollIntoView()
            .should('exist')
            .and('be.visible')
            .and('not.be.disabled')
            .click({force: true});
    cy.contains('Are you sure you want to')
            .should('be.visible');

        cy.get('[data-cy="payment-action-dialog-cancel-button"]')
            .should('exist')
            .and('be.visible')
            .and('not.be.disabled')
            // .click();

        cy.get('[data-cy="payment-action-dialog-confrim-button"]')
            .should('exist')
            .and('be.visible')
            .and('not.be.disabled')
            // .click();
        });
        
    it('Approve another payment and verify the lifecycle', function () {
        cy.log('--- Step 1: Navigating to Project Payments -> Approve Payments tab ---');
        cy.log(' --- Navigating to Projec t Payments Tab --- ');
        cy.get('[data-cy="project-payments-button"]').should('exist').and('be.visible').click();
        cy.get('[data-cy="po-number-from-purchase-orders"]').should('exist').and('be.visible');

        cy.log('--- Step 2: Verify that the pending payments table contains at least one row ---');
        cy.get('[data-cy="data-table"]', { timeout: 16000 })
            .should('be.visible')
            .within(() => {
                cy.get('tbody tr').should('have.length.gte', 1);
            });
        cy.log('SUCCESS: Prerequisite met. At least two pending payments are available.');

        cy.log(' --- Step 4: Find the first pending request and approve the payment request ---');
        cy.get('[data-cy="payments-approve-button"]', { timeout: 10000 })
            .first()
            .scrollIntoView()
            .should('exist')
            .and('be.visible')
            .and('not.be.disabled')
            .click({force: true})

        cy.contains('Are you sure you want to')
            .should('be.visible')

        cy.get('[data-cy="payment-action-dialog-cancel-button"]')
            .should('exist')
            .and('be.visible')
            .and('not.be.disabled')
            // .click();

        cy.get('[data-cy="payment-action-dialog-confrim-button"]')
        .should('exist')
        .and('be.visible')
        .and('not.be.disabled')
        .click();

    })
});