/// <reference types="Cypress" />

describe('Creates a New Procurement Request as a Procurement User', () => {

    const project_name = "Test Project";

    it('Should create a New PR for the Test Project.', () => {

        // Logging in as a Procurement User
        cy.procurementLogin();
        cy.visit('/');
        cy.contains('Dashboard').should('be.visible');

        // Setting Up Intercept Use to Fetch PR-Number
        cy.intercept(
            'POST', 
            '**/api/resource/Procurement%20Requests'
        ).as('prCreationRequest');

        cy.get('[data-cy="procurement-requests-button"]').should('be.visible').click();
        cy.get('[data-cy="procurement-requests-search-bar"]').should('be.visible');
        cy.get('[data-cy="data-table"]').should('exist').within(() => {
            cy.get('thead').should('exist');
            cy.get('tbody tr').should('have.length.at.least', 1);
            cy.contains('th', '#PR').should('be.visible');
        });


        cy.contains('Add New PR').should('be.visible').click();
        // cy.pause()
       
        cy.get('input').type(project_name).type('{enter}')
        // cy.pause();

        // creating the PR According to the Project Name
        cy.get('[data-cy="add-new-pr-normal-custom-button"]').should('be.visible').click();
        cy.get('[data-cy="add-new-pr-normal"]').should('exist').click();

        cy.get('.rounded-xl.bg-card', { timeout: 10000 }) 
        .then(($cards) => {
            const randomIndex = Math.floor(Math.random() * $cards.length);
            const selectedCard = $cards[randomIndex].textContent;
            cy.log(`Selected Work Package -> ${selectedCard}`)               
            cy.wrap($cards[randomIndex]).click();
        });

        // Function to repeat process for adding two items in the PR
        function itemAdditon(iteration) {

            cy.log(`Starting Test Iteration ${iteration}`);

            // Opening Dropdown to Select required Item
            cy.get('.css-b62m3t-container .css-1xc3v61-indicatorContainer', { timeout: 10000 })
            .should('be.visible')
            .click();

            cy.get('.css-1nmdiq5-menu [role="option"]', { timeout: 10000 })
                .should('have.length.greaterThan', 0)
                    .then(($options) => {
                        const randomIndex = Math.floor(Math.random() * $options.length);
                        const randomItemText = $options[randomIndex].textContent?.trim();
                        cy.log(`Randomly Selected Item... : ${randomItemText}`);
                        cy.wrap($options[randomIndex]).click();
                    });

            // Updated Approach for the Item Selection
            cy.contains('label', 'Item')
            .next()
            .find('[role="combobox"]')
            .click({ force: true });

            // Updated Approach for the Make Selection
            cy.get('#make-select').click({ force: true });
            cy.get('body').then(($body) => {
                if ($body.find('[role="option"]:contains("Local Make")').length > 0) {
                    cy.contains('[role="option"]', 'Local Make').click();

                } else {
                    cy.get('[role="option"]')
                        .first()
                        .should('be.visible')
                        .click();
                }
            });

            cy.get('#quantity-input')
            .should('exist')
            .and('be.visible')
            .and('not.be.disabled');
    
            // Generate random number between 1-9 and type it
            const randomQuantity = Math.floor(Math.random() * 16) + 33;
            cy.get('#quantity-input')
                    .should('be.visible')
                    .clear()
                    .type(randomQuantity.toString())
                        .then(() => {
                            cy.log(`Entered Random Quantity: ${randomQuantity}`);
                        });
        
             // Array of possible PR item comments
             const itemComments = [
                "Please ensure this meets the project specifications before approval.",
                "Double-check the measurements against the technical drawings.",
                "This item requires additional safety certifications - please verify.",
                "Confirm lead time with vendor before proceeding with this item.",
                "Need clarification on the material grade for this component.",
                "This matches our quality standards - ready for procurement."
            ];
    
            // selecting and typing any random comment from the Array
            cy.get('#comment-input')
                .should('be.visible')
                .clear()
                .type(itemComments[Math.floor(Math.random() * itemAdditon.length)], {delay: 33})
                    .then(($input) => {
                        cy.log(`Entered Comment : "${$input.val()}"`);
                    });
            
            cy.contains('button', 'Add to Cart')
                .scrollIntoView()
                .should('have.class', 'bg-background')
                .and('be.visible')
                .click();

        }

        // Execute 2-3 times
        [1, 2, /** 3 */].forEach((iteration) => {
            itemAdditon(iteration);
        });

        // Clicking Submit button after adding the Required Items ->
        cy.contains('button', /Submit Request/i)
            .scrollIntoView()
            .should('have.attr', 'aria-haspopup', 'dialog')
            .and('be.visible')
            .click();

        // 1. Targetting by placeholder + classes (most stable)
        cy.get('textarea[placeholder="Add final comments (optional)..."]')
            .should('be.visible')
            .type('This is my test comment for Normal PR Addition.');

        cy.contains('button', /^Cancel$/i)
            .should('have.class', 'bg-background')
            .and('have.attr', 'type', 'button')
            .and('be.visible')
            // .click();

        cy.get('button svg.lucide-check-check')
            .parent('button')
            .should('contain', 'Confirm')
            .and('be.visible')
            .click();


        // --- Extracting PR-Number Suffix ---
        let extractedPrNumber;

        cy.wait('@prCreationRequest', { timeout: 16000})
            .then((interception) => {
                expect(interception.response?.statusCode).to.equal(200, 'Expected PR Creation to Succeed');

                // 1. Check if response body and data field exist  
                if (interception.response?.body && interception.response.body.data && interception.response.body.data.name) {
                    const fullPrName = interception.response.body.data.name;
                    cy.log(`Full PR Name from API response: ${fullPrName}`);
                    // cy.pause();

                    // 2. Split the name string by hyphens
                    const parts = fullPrName.split('-');

                    // 3. Get the last part (the suffix)
                    if (parts.length >= 3) {
                        const suffixWithZeros = parts[parts.length - 1];
                        
                        // 4. Removing leading zeros by converting to number and back to string
                        extractedPrNumber = parseInt(suffixWithZeros, 10).toString();
                        
                        cy.log(`Extracted PR Number : ---> ${extractedPrNumber}`);
                        // cy.pause();

                        // Storing in Cypress.env for other tests
                        Cypress.env('prNumber', extractedPrNumber);

                    } else {
                        cy.log('Could not extract PR Suffix: "name" field format is unexpected after splitting.');
                        throw new Error('Failed to parse PR Suffix: Unexpected format of "name" field.');
                    }
                } else {
                    cy.log('Could not extract PR Suffix: API response structure is unexpected (body, data, or name field missing).');
                    console.error('Unexpected API response structure for PR creation:', interception.response?.body);
                    throw new Error('Failed to extract PR Suffix: Unexpected API response structure.');
                }
            });

    })
});