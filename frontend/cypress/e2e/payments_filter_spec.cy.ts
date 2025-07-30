// describe('Payments Page - Search and Filter Functionality', () => {

//     // --- 1. Define Your Test Cases ---
//     const testCases = [
//         {
//             filterOption: 'Payment ID', 
//             searchTerm: 'PO/109/00049/25-26',
//             columnIndex: 0
//         },
//         {
//             filterOption: 'Vendor ID',
//             searchTerm: 'AAA SWITCHGEAR',
//             columnIndex: 2
//         },
//         {
//             filterOption: 'Project ID',
//             searchTerm: 'Wakefit GT Road',
//             columnIndex: 3
//         },
//         {
//             filterOption: 'Amount',
//             searchTerm: '956',
//             columnIndex: 6
//         },
//         // TODO: Add test cases for 'document name' and 'document type' once you
//         // confirm their filter option text and corresponding column index.
//     ];

//     beforeEach(() => {
//         cy.login();
//         cy.visit('/');

//         cy.log('--- Step 1: Navigating to Project Payments -> Approve Payments tab ---');
//         cy.get('[data-cy="project-payments-button"]').should('exist').and('be.visible').click();
//         cy.get('[data-cy="po-number-from-purchase-orders"]').should('exist').and('be.visible');

//         cy.log('--- Step 2: Verify that the pending payments table contains at least two rows ---');
//         cy.get('[data-cy="data-table"]', { timeout: 16000 })
//             .should('be.visible')
//             .within(() => {
//                 cy.get('tbody tr').should('have.length.gte', 2);
//             });
//     });

//     // --- 2. Loop Through Each Test Case ---
//     testCases.forEach(({ filterOption, searchTerm, columnIndex }) => {

//         it(`should correctly filter by "${filterOption}" and search for "${searchTerm}"`, () => {
//             // --- 3. Select the Filter Option ---
//             // Click the dropdown trigger button

//             cy.get('[data-cy="procurement-requests-search-bar"]')
//             .siblings('button[role="combobox"]')
//             .click();

//             // The rest of your test remains the same...
//             cy.contains(filterOption).click({ force: true });

//             cy.get('[data-cy="procurement-requests-search-bar"]')
//             .should('have.attr', 'placeholder', `Search by ${filterOption}...`);

//             cy.get('[data-cy="procurement-requests-search-bar"]')
//             .clear()
//             .type(searchTerm);

//             // --- 5. Wait and Assert the Result ---
//             // Add a small wait for the search to apply (if it's debounced)
//             cy.wait(500); 

//             // Assert that at least one row is visible in the table
//             cy.get('[data-cy="data-table"] tbody tr')
//               .should('have.length.gte', 1);

//             // Assert that the correct column in the first result contains the search term
//             cy.get('[data-cy="data-table"] tbody tr')
//               .first()
//               .find('td')
//               .eq(columnIndex) // Get the cell at the specified column index
//               .should('contain.text', searchTerm);

//             // --- 6. Clean Up for the Next Test ---
//             cy.get('[data-cy="procurement-requests-search-bar"]').clear();
//             cy.wait(500); // Wait for the table to reset
//         });
//     });
// });


describe('Payments Page - Search and Filter Functionality', () => {

    // --- 1. Define Your Test Cases ---
    // This array makes it easy to add or change tests.
    const testCases = [
        {
            filterOption: 'Payment ID',
            searchTerm: 'Pay-000',
            columnIndex: 0
        },
        {
            filterOption: 'Vendor ID',
            searchTerm: "VEN-Material",
            columnIndex: 2
        },
        {
            filterOption: 'Project ID',
            searchTerm: 'Proj-00',
            columnIndex: 3
        },
        {
            filterOption: 'Amount',
            searchTerm: '956',
            columnIndex: 6
        },
        // TODO: Add test cases for 'document name' and 'document type' once you
        // confirm their filter option text and corresponding column index.
        {
            filterOption: 'Document Name',
            searchTerm: 'PO/10',
        },
        {
            filterOption: 'Document Name',
            searchTerm: 'SR-00',
        },
        {
            filterOption: 'Document Type',
            searchTerm: 'PO/10',
        },
        {
            filterOption: 'Document Type',
            searchTerm: 'PO/10',
        },

    ];

    beforeEach(() => {
        // --- SETUP NETWORK INTERCEPT ---
        // Tell Cypress to watch for the API call that fetches table data.
        // We give it an alias '@getTableData' so we can wait on it later.
        cy.intercept('POST', '**/api/method/nirmaan_stack.api.data-table.get_list_with_count_enhanced').as('getTableData');

        // --- Your existing navigation logic ---
        cy.login();
        cy.visit('/');

        cy.log('--- Step 1: Navigating to Project Payments -> Approve Payments tab ---');
        cy.get('[data-cy="project-payments-button"]').should('exist').and('be.visible').click();
        
        // This is a crucial wait. It ensures the page has fully loaded and made its
        // initial API call for data before any tests run.
        cy.wait('@getTableData', { timeout: 20000 }); // Increased timeout for initial load

        cy.log('--- Step 2: Verify that the pending payments table is ready ---');
        cy.get('[data-cy="data-table"]', { timeout: 16000 })
            .should('be.visible')
            .within(() => {
                // Check that the table has data rows. 
                // Using .should('not.contain', 'No results found') is also a good check.
                cy.get('tbody tr').should('have.length.gte', 1);
            });
    });

    // --- Loop Through Each Test Case ---
    testCases.forEach(({ filterOption, searchTerm, columnIndex }) => {

        it(`should correctly filter by "${filterOption}" and search for "${searchTerm}"`, () => {
            
            // --- 3. Select the Filter Option ---
            cy.get('[data-cy="procurement-requests-search-bar"]')
              .siblings('button[role="combobox"]')
              .click();

            // Wait for the dropdown option to be visible before clicking
            // This is more robust than using { force: true }
            cy.contains('[role="option"]', filterOption).should('be.visible').click();

            // When the filter option changes, it triggers a data refresh. We must wait for it.
            cy.wait('@getTableData');

            // --- 4. Type in the Search Bar ---
            cy.get('[data-cy="procurement-requests-search-bar"]')
              .should('have.attr', 'placeholder', `Search by ${filterOption}...`);

            cy.get('[data-cy="procurement-requests-search-bar"]')
              .clear()
              .type(searchTerm);

            // --- 5. Wait for the Search API Call to Complete ---
            // This is the most important part. We wait for the specific API call
            // that is triggered by typing in the search bar.
            cy.wait('@getTableData');

            // --- 6. Assert the Result ---
            // Now the table is guaranteed to have the correct, filtered data.
            cy.get('[data-cy="data-table"] tbody tr').should('have.length.gte', 1);

            cy.get('[data-cy="data-table"] tbody tr')
              .first()
              .find('td')
              .eq(columnIndex)
              .should('contain.text', searchTerm);

            // --- 7. Clean Up for the Next Test ---
            cy.get('[data-cy="procurement-requests-search-bar"]').clear();
            
            // Wait for the table to reset after clearing the search
            cy.wait('@getTableData');
            cy.pause();
        });
    });
});