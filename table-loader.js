import { showConfirmationModal } from './modal.js';

/**
 * Fetches HTML content from a URL, processes it, sorts it by trust score,
 * and populates the target table body element.
 * @param {string} url - The URL to fetch the table row HTML from.
 * @param {HTMLElement | null} targetElement - The tbody element to populate.
 */
export const loadTableData = (url, targetElement) => {
    if (!targetElement) {
        // Only log error if the element *should* exist based on the URL
        if (['table-data.html', 'untrusted-table-data.html', 'unreleased-table-data.html', 'external-cheats-data.html'].includes(url)) {
            console.error(`Target element for ${url} not found in the HTML.`);
        }
        return; // Exit if target element doesn't exist
    }

    // Keep loading state until success/error - initial state is set in HTML

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            // Temporarily parse the fetched HTML to manipulate rows before adding to the DOM
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = `<table><tbody>${html}</tbody></table>`; // Wrap in table/tbody for valid parsing
            const rows = Array.from(tempDiv.querySelectorAll('tbody > tr'));

            // Determine number of columns from the header in the main document
            let columnCount = 8; // Default
            const table = targetElement.closest('table');
            if (table) {
                const headerRow = table.querySelector('thead tr');
                if (headerRow) {
                    columnCount = headerRow.cells.length;
                }
            }


            // Sort rows by trust score (descending)
            rows.sort((rowA, rowB) => {
                // Target the trust score column (assuming it's the 5th column, index 4)
                const scoreCellA = rowA.cells[4];
                const scoreCellB = rowB.cells[4];

                const scoreAEl = scoreCellA ? scoreCellA.querySelector('.round_button') : null;
                const scoreBEl = scoreCellB ? scoreCellB.querySelector('.round_button') : null;

                // Extract score number
                let scoreA = 0;
                let scoreB = 0;

                if (scoreAEl && scoreAEl.textContent) {
                    const scoreTextA = scoreAEl.textContent.trim();
                    const scoreMatchA = scoreTextA.match(/\d+/);
                    scoreA = scoreMatchA ? parseInt(scoreMatchA[0], 10) : 0;
                }
                if (scoreBEl && scoreBEl.textContent) {
                     const scoreTextB = scoreBEl.textContent.trim();
                     const scoreMatchB = scoreTextB.match(/\d+/);
                     scoreB = scoreMatchB ? parseInt(scoreMatchB[0], 10) : 0;
                }

                return scoreB - scoreA; // Sort descending
            });

            // Clear the target element and append sorted rows
            targetElement.innerHTML = '';
            rows.forEach(row => {
                targetElement.appendChild(row);
            });


            // --- Apply Post-Processing to Table Rows ---
            processTableRows(targetElement, url, columnCount);

        })
        .catch(error => {
            console.error(`Error fetching data from ${url}:`, error);
             if (targetElement) { // Check if targetElement still exists
                // Determine colspan dynamically based on header
                let columnCount = 8; // Default
                const table = targetElement.closest('table');
                 if (table) {
                    const headerRow = table.querySelector('thead tr');
                    if (headerRow) {
                        columnCount = headerRow.cells.length;
                    }
                 }
                 targetElement.innerHTML = `<tr><td colspan="${columnCount}" class="error-message">Error loading product data. Please try again later.</td></tr>`;
             }
        });
};

/**
 * Applies various processing steps to the rows within a table body.
 * - Adds titles to hover icons.
 * - Styles trust score buttons.
 * - Styles reseller/check icons.
 * - Adds custom click listeners for links in specific tables.
 * @param {HTMLElement} tableBody - The tbody element containing the rows.
 * @param {string} sourceUrl - The original URL the data was loaded from (used for specific listeners).
 * @param {number} columnCount - The number of columns in the table.
 */
function processTableRows(tableBody, sourceUrl, columnCount) {
    // Add native titles to hover-info spans based on onclick alert text
    tableBody.querySelectorAll('.hover-info').forEach(span => {
        const onclickAttr = span.getAttribute('onclick');
        if (onclickAttr && onclickAttr.startsWith('alert(')) {
            try {
                const match = onclickAttr.match(/^alert\('(.*?)'\)$/);
                if (match && match[1]) {
                    const titleText = match[1].replace(/\\'/g, "'").replace(/\\"/g, '"');
                    span.setAttribute('title', titleText);
                }
            } catch (e) {
                console.warn("Could not parse onclick for title: ", span);
            }
        }
    });

    // Process each row for score buttons and icons
    tableBody.querySelectorAll('tr').forEach(row => {
        // Style trust score buttons (5th column, index 4)
        const scoreCell = row.cells[4];
        if (scoreCell) {
            const button = scoreCell.querySelector('.round_button');
            if (button) {
                styleTrustScoreButton(button);
            }
        }

        // Style reseller/check icons
        styleIconCell(row.cells[columnCount - 1], 'reseller-yes', 'reseller-no'); // Last column for resellers

        // Style stream proof icon for external cheats table (6th column, index 5)
        if (sourceUrl === 'external-cheats-data.html' && columnCount > 5) {
            styleIconCell(row.cells[5], 'reseller-yes', 'reseller-no'); // Using reseller styles for now
        }
    });

    // Add custom link listeners based on the table type
    if (sourceUrl === 'untrusted-table-data.html' && tableBody.id === 'untrusted-product-data') {
        addUntrustedLinkListeners(tableBody);
    } else if (sourceUrl === 'external-cheats-data.html' && tableBody.id === 'external-cheat-data') {
        addExternalLinkListeners(tableBody);
    }
}

/**
 * Styles a trust score button based on its score.
 * Adds score class, ensures SVG icon exists, and formats text content.
 * @param {HTMLAnchorElement} button - The trust score button element.
 */
function styleTrustScoreButton(button) {
    const scoreText = button.textContent.trim();
    const scoreMatch = scoreText.match(/\d+/); // Extract number
    const score = scoreMatch ? parseInt(scoreMatch[0], 10) : NaN;

    if (!isNaN(score)) {
        // Remove existing score classes first
        button.className = button.className.replace(/score-\d+/g, '').trim();
        // Determine score range class
        let scoreClass = 'score-50'; // Default for 50 or lower
        if (score >= 90) scoreClass = 'score-90';
        else if (score >= 85) scoreClass = 'score-85';
        else if (score >= 80) scoreClass = 'score-80';
        else if (score >= 75) scoreClass = 'score-75';
        else if (score >= 70) scoreClass = 'score-70';
        else if (score >= 65) scoreClass = 'score-65';
        else if (score >= 60) scoreClass = 'score-60';
        else if (score >= 55) scoreClass = 'score-55';

        button.classList.add(scoreClass);

        // Ensure SVG is present
        if (!button.querySelector('.shield_icon')) {
            const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgIcon.setAttribute('class', 'shield_icon');
            svgIcon.setAttribute('viewBox', '0 0 24 24');
            svgIcon.setAttribute('fill', 'currentColor'); // White fill from button text color
            svgIcon.setAttribute('stroke', 'none');
            svgIcon.innerHTML = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>';
             if (button.firstChild && button.firstChild.nodeType === Node.TEXT_NODE) {
                button.insertBefore(svgIcon, button.firstChild);
             } else {
                button.prepend(svgIcon); // Fallback prepend
             }
        }

        // Ensure the text content only contains the score number after SVG
        button.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
                node.nodeValue = ` ${score}`; // Add space before score
            }
        });
         // Fallback if text node manipulation fails or if score wasn't found initially
         if (!button.textContent.includes(score)) {
             // Clear existing text nodes and add score
             button.childNodes.forEach(node => {
                 if(node.nodeType === Node.TEXT_NODE) node.remove();
             });
              button.insertAdjacentText('beforeend', ` ${score}`);
         }

    } else {
        console.warn("Could not parse score for button:", button);
    }

    // Ensure the link has a default href if missing
    if (!button.hasAttribute('href')) {
        button.setAttribute('href', '#'); // Add '#' as fallback href
    }
     // Remove inline styles if they exist from old versions
     button.style.background = '';
}

/**
 * Adds CSS classes to a table cell based on its text content (check or cross icon).
 * @param {HTMLTableCellElement | undefined} cell - The table cell element.
 * @param {string} yesClass - The CSS class for the 'yes'/'check' state.
 * @param {string} noClass - The CSS class for the 'no'/'cross' state.
 */
function styleIconCell(cell, yesClass, noClass) {
    if (cell) {
        const text = cell.textContent.trim();
        cell.classList.remove(yesClass, noClass); // Clear existing classes
        if (text === '✔️') {
            cell.classList.add(yesClass);
        } else if (text === '❌') {
            cell.classList.add(noClass);
        }
    }
}

/**
 * Adds click listeners to product links in the untrusted table body.
 * Shows a confirmation modal warning about untrusted products.
 * @param {HTMLElement} tableBody - The tbody element of the untrusted table.
 */
function addUntrustedLinkListeners(tableBody) {
    // Select product links (<a> inside the name column - second child), excluding score button
    tableBody.querySelectorAll('td:nth-child(2) > a').forEach(link => {
        // Clone and replace to ensure only one listener is attached
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);

        newLink.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link navigation
            const url = newLink.href;
            const row = newLink.closest('tr');
            const productName = newLink.textContent;
            let score = 'N/A'; // Default score text

            const scoreCell = row.cells[4]; // 5th column
            const scoreButton = scoreCell ? scoreCell.querySelector('.round_button') : null;
            if (scoreButton && scoreButton.textContent) {
                const scoreText = scoreButton.textContent.trim();
                const scoreMatch = scoreText.match(/\d+/);
                if (scoreMatch) {
                    score = scoreMatch[0]; // Get the score number as string
                }
            }

            // Construct the message
            let message = `${productName} has a trust score of ${score}. `;
            message += "Untrusted products carry a higher risk and may potentially exit scam. Proceed with caution.";

            // Show the custom confirmation modal
            showConfirmationModal(url, message, "Untrusted Product Warning");
        });
    });
}

/**
 * Adds click listeners to product links in the external cheats table body.
 * Shows a confirmation modal with a general notice about external products.
 * @param {HTMLElement} tableBody - The tbody element of the external cheats table.
 */
function addExternalLinkListeners(tableBody) {
    // Select product links (<a> inside the name column - second child), excluding score button
   tableBody.querySelectorAll('td:nth-child(2) > a').forEach(link => {
       const newLink = link.cloneNode(true);
       link.parentNode.replaceChild(newLink, link);

       newLink.addEventListener('click', (event) => {
           event.preventDefault();
           const url = newLink.href;
           const productName = newLink.textContent;
           // Example message - customize as needed
           const message = `You are about to visit the site for ${productName}. External cheats may have different risks or setup requirements. Proceed carefully.`;
           showConfirmationModal(url, message, "External Product Notice");
       });
   });
}