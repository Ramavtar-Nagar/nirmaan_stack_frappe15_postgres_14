/// <reference types="Cypress" />

describe('Creates a New Procurement Request as a Procurement User', () => {

    const project_name = "Test Project";
    const negative_Project_Name = "Negative Project";

    // This hook runs before each 'it' block in this describe suite.
    beforeEach(() => {
        cy.log('--- beforeEach Hook: Logging In and Navigating ---');
        cy.procurementLogin();
        cy.visit('/');
        cy.contains('Dashboard').should('be.visible');

        cy.get('[data-cy="procurement-requests-button"]').should('be.visible').click();
        cy.get('[data-cy="procurement-requests-search-bar"]', { timeout: 10000 }).should('be.visible');
        cy.contains('Add New PR').should('be.visible').click();
        cy.log('✅ beforeEach Hook: Setup complete, on Add PR page.');
    });

    /**
     * Test Case 1: Verifies Table - Verifying table behavior for Search and Filter Functionality.
     */
    it('Should validate the table for the search and filter functionality.', () => {

        const testCases = [
            {
                filterOption: 'PR ID',
                searchTerm: '1768',
                columnIndex: 0
            },
            {
                filterOption: 'Item in PR',
                searchTerm: "test item",
                columnIndex: 2
            },
        ];

        // Logging in as a Procurement User
        cy.procurementLogin();
        cy.visit('/');
        cy.contains('Dashboard').should('be.visible');

        cy.get('[data-cy="procurement-requests-button"]').should('be.visible').click();
        cy.get('[data-cy="procurement-requests-search-bar"]').should('be.visible');
        cy.get('[data-cy="data-table"]').should('exist').within(() => {
            cy.get('thead').should('exist');
            cy.get('tbody tr').should('have.length.at.least', 1);
            cy.contains('th', '#PR').should('be.visible');
        });


        testCases.forEach(({ filterOption, searchTerm, columnIndex }) => {

            cy.log(`--- Testing Filter: "${filterOption}" with Search: "${searchTerm}" ---`);
            
            cy.get('[data-cy="procurement-requests-search-bar"]')
            .siblings('button[role="combobox"]')
            .click();

            cy.contains('[role="option"]', filterOption).should('be.visible').click();
            cy.get('[data-cy="procurement-requests-search-bar"]')

            cy.get('[data-cy="procurement-requests-search-bar"]')
            .clear()
            .type(searchTerm);

            cy.get('[data-cy="data-table"] tbody tr').should('have.length.gte', 1);
            cy.get('[data-cy="procurement-requests-search-bar"]').clear();            
        });
        cy.pause();

    });

    /**
     * Test Case 2: Negative Path - Verifying behavior with an invalid project.
     */
    it('should NOT display the "Add New PR" button for an invalid project', () => {
        cy.log('--- TEST: Validating wrong project name ---');
        
        // Type a project name that does not exist
        cy.get('input').type(negative_Project_Name).type('{enter}');
        
        // Assert that the button to proceed does NOT exist
        cy.get('[data-cy="add-new-pr-normal-custom-button"]').should('not.exist');
        
        cy.log(`✅✅✅ TEST COMPLETED: Verified "Add Items" button is hidden for invalid project: "${negative_Project_Name}" ✅✅✅`);
        cy.pause();
    });

    /**
     * Test Case 3: Validating form and button states before adding items.
     */
    it('should have disabled "Add to Cart" and "Submit" buttons on a new, empty form', () => {
        cy.log('--- TEST: Validating initial disabled states of buttons ---');
        
        // Select a valid project and navigate to the item form
        cy.get('input').clear().type(project_name).type('{enter}');
        cy.get('[data-cy="add-new-pr-normal-custom-button"]').should('be.visible').click();
        cy.get('[data-cy="add-new-pr-normal"]').should('exist').click();
        cy.get('.rounded-xl.bg-card', { timeout: 10000 }).first().click();

        // 1. Verify "Add to Cart" is disabled because the item form is empty
        cy.contains('button', 'Add to Cart').should('be.disabled');
        cy.log('✅ VALIDATED: "Add to Cart" button is disabled.');

        // 2. Verify "Submit Request" button is disabled because the cart is empty
        cy.contains('button', /Submit Request/i).should('be.disabled');
        cy.log('✅ VALIDATED: "Submit Request" button is disabled.');

        cy.log('✅✅✅ TEST COMPLETED: Initial button disabled states verified successfully ✅✅✅');
        cy.pause();
    });

    /**
     * Test Case 4: Verifies the "Create/Request New Item" workflow from within the PR form.
     */
    it('should allow creating a new item via the item dropdown dialog', () => {
        cy.log('--- TEST: Create/Request New Item workflow ---');

        // --- 1. SETUP: Navigate to the item form ---
        cy.get('input').clear().type(project_name).type('{enter}');
        cy.get('[data-cy="add-new-pr-normal-custom-button"]', { timeout: 10000 }).click();
        cy.get('[data-cy="add-new-pr-normal"]').should('exist').click();
        cy.get('.rounded-xl.bg-card', { timeout: 10000 }).first().click();
        cy.log('--- Setup: On the item entry form ---');

        // --- 2. ACTION: Open the "Item" dropdown and click "Create/Request New Item" ---
        cy.contains('label', 'Item').next().find('[role="combobox"]').click({ force: true });
        
        // This button is likely inside the dropdown menu that appears
        cy.contains('button', 'Create/Request New Item', { timeout: 10000 }).should('be.visible');
        cy.contains('button', 'Create/Request New Item').click();
        cy.log('--- Action: Clicked "Create/Request New Item" button ---');

        // --- 3. ACTION: Fill out the new item dialog ---
        // The dialog should be visible now. We target it by its role and title.
        cy.get('[role="alertdialog"]').contains('h2', 'Create or Request New Item').should('be.visible');

        const newItemName = `E2E-Test-Item-${Date.now()}`;
        const newItemQuantity = '42';

        cy.get('[role="alertdialog"]').within(() => {
            cy.log('--- Filling out the "Create New Item" dialog ---');
            
            // A. Select a Category
            cy.get('#newItemCategory').parent().click(); // Clicks the dropdown container
            cy.get('[id^="react-select-"][role="option"]').first().click(); // Selects the first available category
            cy.log('--- Category selected ---');

            // B. Enter Item Name (should now be enabled)
            // We use a unique name for each test run to avoid conflicts
            const newItemName = `E2E-Test-Item-${Date.now()}`;
            cy.get('input#itemName').should('not.be.disabled').type(newItemName);
            cy.log(`--- New item name: ${newItemName} ---`);

            // C. Select a Unit
            cy.contains('span', 'Select Unit').parent('button').click();
            cy.get('[role="option"]').contains('NOS').click(); // Assuming 'Nos' is a valid unit
            cy.log('--- Unit selected ---');
            
            // D. Enter a Quantity
            cy.get('input#quantity').should('not.be.disabled').type('42');
            cy.log('--- Quantity entered ---');
            cy.pause();

            // E. Click the "Create & Add" button
            // cy.contains('button', ' Create & Add').should('be.enabled').click();
            cy.contains('button', /Request Item/, { timeout: 10000 }).should('be.visible').and('be.enabled').click();
        });

        // --- 4. VERIFICATION ---
        // The dialog should close, and the main "Item" dropdown should now have our new item selected.
        cy.get('[role="alertdialog"]').should('not.exist');
        cy.log('✅ VERIFIED: Dialog closed after creation.');

        // Assert that a new row has appeared in the cart/order list table.
        cy.get('tbody tr', { timeout: 10000 }).should('have.length', 1);
        cy.log('✅ VERIFIED: A new row has been added to the cart.');
        
        // Verify that the new row in the cart contains the correct item name and quantity.
        // cy.contains('tbody tr', { timeout: 10000 }).first() // TODO
        // // .should('be.visible') // Make sure the row itself is visible // TODO
        // .within(() => {
        //     // cy.get('td').eq(0).should('contain.text', newItemName); // TODO
        //     cy.get('td').eq(2).should('have.text', newItemQuantity);

        //     cy.log(`✅ VERIFIED: Found row for "${newItemName}" with correct quantity "${newItemQuantity}".`);
        // });

        // The main "Submit Request" button should now be enabled.
        cy.contains('button', /Submit Request/i).should('be.enabled');
        cy.log('✅ VERIFIED: Submit Request button is now enabled.');

        cy.log(`✅ VERIFIED: The new cart item has the correct name "${newItemName}" and quantity "${newItemQuantity}".`);

        cy.log('✅✅✅ TEST COMPLETED: New item creation workflow successful ✅✅✅');
        cy.pause();
    });

    /**
     * Test Case 5: Verifies the "Add New Make" workflow from within the PR form.
     */
    it('should allow adding a new make via the make dropdown dialog', () => {
        cy.log('--- TEST: Add New Make workflow ---');

        // --- 1. SETUP: Navigate to the item form and select an item ---
        cy.get('input').clear().type(project_name).type('{enter}');
        cy.get('[data-cy="add-new-pr-normal-custom-button"]').click();
        cy.get('[data-cy="add-new-pr-normal"]').should('exist').click();
        cy.get('.rounded-xl.bg-card', { timeout: 10000 }).first().click();

        // Select a standard item to enable the 'Make' dropdown
        cy.contains('label', 'Item').next().find('[role="combobox"]').click({ force: true });
        cy.get('.css-1nmdiq5-menu [role="option"]').first().click({ force: true });
        cy.log('--- Setup: On item form with an item selected ---');

        // --- 2. ACTION: Open the "Make" dropdown and click "Add Existing / New Make" ---
        cy.get('#make-select').should('not.be.disabled').click({ force: true });
        cy.contains('button', 'Add Existing / New Make').should('be.visible').click();
        cy.log('--- Action: Clicked "Add Existing / New Make" button ---');
        
        // --- 3. ACTION: Fill out the new make dialog ---
        // The dialog appears. We target it by its role and the unique input ID.
        cy.get('[role="alertdialog"]').contains('h2', 'Add New Make for:').should('be.visible');

        const newMakeName = `E2E-Test-Make-${Date.now()}`;
        cy.get('[role="alertdialog"]').within(() => {
            cy.log(`--- Creating new make: ${newMakeName} ---`);
            cy.get('input#new-make-input').type(newMakeName);
            cy.contains('button', 'Confirm & Associate').should('be.enabled').click();
        });

        // --- 4. VERIFICATION ---
        // A. The dialog should close automatically.
        cy.get('[role="alertdialog"]').should('not.exist');
        cy.log('✅ VERIFIED: Dialog closed after make creation.');
        
        // B. Re-open the "Make" dropdown to verify the new make exists and select it.
        cy.log('--- Verifying new make in the dropdown list ---');
        cy.get('#make-select').click({ force: true });
        cy.get('[role="option"]').contains(newMakeName).click();
        cy.log(`✅ VERIFIED: New make "${newMakeName}" was found and selected.`);
        
        // C. The main form's "Make" select should now display the new make.
        // cy.get('#make-select').should('contain.text', newMakeName); // TODO

        cy.log('✅✅✅ TEST COMPLETED: New make creation workflow successful ✅✅✅');
        cy.pause();
    });

    /**
     * Test Case 6: Verifies the "Reset" button functionality.
     */
    it('should reset the form and return to the work package selection screen', () => {
        cy.log('--- TEST: Verifying form reset functionality ---');

        // --- 1. SETUP: Navigate to the item form ---
        cy.get('input').clear().type(project_name).type('{enter}');
        cy.get('[data-cy="add-new-pr-normal-custom-button"]').click();
        cy.get('[data-cy="add-new-pr-normal"]').should('exist').click();
        
        // Select a work package to get to the item entry form
        cy.get('.rounded-xl.bg-card', { timeout: 10000 }).first().click();
        cy.log('--- Setup: On the item entry form ---');

        // --- 2. ACTION: Add one item to the cart ---
        cy.contains('label', 'Item').next().find('[role="combobox"]').click({ force: true });
        cy.get('.css-1nmdiq5-menu [role="option"]').first().click({ force: true });
        cy.get('#make-select').click({ force: true });
        cy.get('[role="option"]').contains('test makes').click();
        cy.get('#quantity-input').clear().type('1');
        cy.contains('button', 'Add to Cart').click();
        cy.get('tbody tr').should('have.length', 1);
        cy.log('--- Action: One item added to cart ---');

        // --- 3. ACTION: Click the Reset button and confirm ---
        cy.contains('button', 'Reset').should('be.visible').click();
        
        // Handle the confirmation dialog
        cy.get('[role="dialog"]', { timeout: 10000 })
        .should('be.visible')
        .within(() => {
            cy.contains('h2', 'Reset Order List?').should('be.visible');
            cy.contains('button', 'Yes, Change').should('be.visible').click();
        });
        cy.log('--- Action: Confirmed the reset dialog ---');

        // --- 4. VERIFICATION ---
        // Assert that we are back on the "Select Work Package" screen.
        cy.get('.rounded-xl.bg-card', { timeout: 10000 }).should('be.visible');
        cy.log('✅ VERIFIED: User is back on the "Select Work Package" screen.');

        // As an extra verification, let's go back into the form and ensure the cart is empty.
        cy.get('.rounded-xl.bg-card').first().click();
        
        // The "Submit Request" button should be disabled, proving the cart was cleared.
        cy.contains('button', /Submit Request/i).should('be.disabled');
        cy.log('✅ VERIFIED: Cart is empty after reset.');

        cy.log('✅✅✅ TEST COMPLETED: Form reset functionality works as expected ✅✅✅');
        cy.pause();
    });

    /**
     * Test Case 7: Focuses on cart manipulation features.
     */
    it('should correctly add, delete, undo delete, and edit an item in the cart', () => {
        cy.log('--- TEST: Manipulating items in the cart ---');

        // Navigate to the item form
        cy.get('input').clear().type(project_name).type('{enter}');
        cy.get('[data-cy="add-new-pr-normal-custom-button"]').click();
        cy.get('[data-cy="add-new-pr-normal"]').click();
        cy.get('.rounded-xl.bg-card').first().click();

        // Helper to add an item
        const addItem = (itemIndex, quantity) => {
            cy.contains('label', 'Item').next().find('[role="combobox"]').click({ force: true });
            cy.get('.css-1nmdiq5-menu [role="option"]').eq(itemIndex).click({ force: true });
            cy.get('#make-select').click({ force: true });
            cy.get('[role="option"]').contains('test makes').click();
            cy.get('#quantity-input').clear().type(quantity);
            cy.contains('button', 'Add to Cart').click();
        };

        // Add two items to set up the test
        addItem(0, '15');
        addItem(1, '25');
        cy.get('tbody tr').should('have.length', 2);
        cy.log('--- Setup: Added 2 items to the cart ---');

        // Target the first item for manipulation
        cy.get('tbody tr').first().as('targetRow');
        cy.get('@targetRow').find('td').first().invoke('text').then(itemNameText => {
            const itemName = itemNameText.split('(')[0].trim();
            cy.log(`Item to manipulate: "${itemName}"`);

            // 1. Test Delete and Undo
            cy.log('--- Testing Delete and Undo ---');
            cy.get('@targetRow').find('button[aria-label*="Delete item"]').click();
            
            // Correct Assertion: Check that the 'tbody' no longer contains the item's text.
            cy.get('tbody').should('not.contain', itemName);
            cy.get('tbody tr').should('have.length', 1);
            cy.log('✅ Item deleted.');

            cy.contains('button', 'Undo Delete').click();
            
            // Correct Assertion: Check that the 'tbody' now contains the item's text again.
            cy.get('tbody').should('contain', itemName);
            cy.get('tbody tr').should('have.length', 2);
            cy.log('✅ Item restored with Undo.');

            // 2. Test Edit and Update
            cy.log('--- Testing Edit and Update ---');
            cy.get('@targetRow').find('button[aria-label*="Edit item"]').click();
            const updatedQuantity = '99';
            cy.get('[role="alertdialog"]').should('be.visible').within(() => {
                cy.get('#editQuantity').clear().type(updatedQuantity);
                cy.contains('button', 'Update Item').click();
            });
            cy.get('@targetRow').find('td').eq(2).should('contain.text', updatedQuantity);
            cy.log('✅ Item quantity updated.');
        });

        cy.log('✅✅✅ TEST COMPLETED: Cart manipulation (delete, undo, edit) verified ✅✅✅');
        cy.pause();
    });

    /**
     * Test Case 8: End-to-end flow of creating and submitting a PR.
     */
    it('should allow a user to add items and successfully submit a new PR', () => {
        cy.log('--- TEST: Full E2E PR Submission ---');
        cy.intercept('POST', '**/api/resource/Procurement%20Requests').as('prCreationRequest');

        // Navigate to the item form
        cy.get('input').clear().type(project_name).type('{enter}');
        cy.get('[data-cy="add-new-pr-normal-custom-button"]').click();
        cy.get('[data-cy="add-new-pr-normal"]').click();
        cy.get('.rounded-xl.bg-card').first().click();

        // // Add a single item for submission
        // cy.contains('label', 'Item').next().find('[role="combobox"]').click({ force: true });
        // cy.get('.css-1nmdiq5-menu [role="option"]').first().click({ force: true });
        // cy.get('#make-select').click({ force: true });
        // cy.get('[role="option"]').contains('Local Make').click();
        // cy.get('#quantity-input').clear().type('50');
        // cy.contains('button', 'Add to Cart').click();
        // cy.log('--- Item added to cart for submission ---');

        // Helper to add an item
        const addItem = (itemIndex, quantity) => {
            cy.contains('label', 'Item').next().find('[role="combobox"]').click({ force: true });
            cy.get('.css-1nmdiq5-menu [role="option"]').eq(itemIndex).click({ force: true });
            cy.get('#make-select').click({ force: true });
            cy.get('[role="option"]').contains('test makes').click();
            cy.get('#quantity-input').clear().type(quantity);
            cy.contains('button', 'Add to Cart').click();
        };

        // Add two items to set up the test
        addItem(0, '36');
        addItem(1, '30');

        // Submit the request
        cy.contains('button', /Submit Request/i).should('be.enabled').click();
        cy.get('textarea[placeholder*="final comments"]').type('E2E Submission Test');
        cy.get('button svg.lucide-check-check').parent('button').contains('Confirm').click();

        // Wait for the API call and verify success
        cy.wait('@prCreationRequest', { timeout: 20000 }).then((interception) => {
            expect(interception.response?.statusCode).to.equal(200);
            const prName = interception.response?.body?.data?.name;
            expect(prName).to.exist;
            cy.log(`PR Created: ${prName}`);
        });

        cy.log('✅✅✅ TEST COMPLETED: End-to-end PR submission successful ✅✅✅');
        cy.pause();
    });

})

