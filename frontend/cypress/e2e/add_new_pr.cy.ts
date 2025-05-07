/// <reference types="Cypress" />

const email = Cypress.env('login_Email');
const password = Cypress.env("login_Password");

describe('Adding a New PR', () => {

    beforeEach( () => {
        //Loging In
        cy.intercept('POST', '**/api/method/login').as('loginRequest');
        cy.visit('/login');

        cy.contains('Login', {timeout: 3000}).should('be.visible');
        cy.get('[data-cy="username-login-input-email"]').should('be.visible').type(email);
        cy.get('[data-cy="username-login-input-password"]').should('be.visible').type(password);
        cy.get('[data-cy="login-button"]').should('be.visible').click();

        cy.wait('@loginRequest', {timeout: 3000}).its('response.statusCode').should('eq', 200);
        cy.url().should('include', 'localhost:8080');
        cy.contains('Modules List').should('be.visible');
    });

    it('Navigates to Procurement requests page and adds a Normal PR', () => {

        cy.get('[data-cy="procurement-requests-button"]').should('be.visible').click();
        cy.get('[data-cy="procurement-requests-search-bar"]').should('be.visible');
        cy.get('[data-cy="procurement-requests-data-table"]').should('exist').within(() => {
            cy.get('thead').should('exist');
            cy.get('tbody tr').should('have.length.at.least', 1);
            cy.contains('th', '#PR').should('be.visible');
            cy.contains('th', 'Date Created').should('be.visible');
        });

        cy.contains('Add New PR').should('be.visible').click();
        cy.get('.css-art2ul-ValueContainer2').click();
        // cy.get('.css-1nmdiq5-menu').should('be.visible');
        cy.get('.css-1nmdiq5-menu')
        .find('[role="option"]')
        .then( $options => {
            const randomIndex = Math.floor( Math.random() * $options.length);
            const selectedOption = $options[randomIndex].textContent;
            cy.log(`Randomly Selected Option: ${selectedOption}`);
            cy.wrap($options[randomIndex]).click();
        });

        cy.get('[data-cy="add-new-pr-normal-custom-button"]').should('be.visible').click();
        cy.get('[data-cy="add-new-pr-normal"]').should('exist').click();

        cy.get('.rounded-xl.bg-card').should('have.length.gt', 0).then(($cards) => {
            const randomIndex = Math.floor(Math.random() * $cards.length);
            const selectedCard = $cards[randomIndex].textContent;
            cy.log(`Selected Work Package -> ${selectedCard}`)               
            cy.wrap($cards[randomIndex]).click();
        });
    });


})
