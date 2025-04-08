document.addEventListener('DOMContentLoaded', () => {
    const reputableProductDataTbody = document.getElementById('product-data');
    const untrustedProductDataTbody = document.getElementById('untrusted-product-data');
    const unreleasedProductDataTbody = document.getElementById('unreleased-product-data');

    // Function to fetch and populate table data
    const loadTableData = (url, targetElement) => {
        if (!targetElement) {
             // Only log error if the element *should* exist based on the URL
             if (url === 'table-data.html' || url === 'untrusted-table-data.html' || url === 'unreleased-table-data.html') {
                 console.error(`Target element for ${url} not found in the HTML.`);
             }
            return; // Exit if target element doesn't exist
        }

        // Keep loading state until success/error
        // targetElement.innerHTML = '';

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

                // Sort rows by trust score (descending)
                rows.sort((rowA, rowB) => {
                    const scoreAEl = rowA.querySelector('.round_button');
                    const scoreBEl = rowB.querySelector('.round_button');

                    // Extract score number (handle potential errors)
                    let scoreA = 0;
                    let scoreB = 0;

                    if (scoreAEl && scoreAEl.textContent) {
                        const scoreTextA = scoreAEl.textContent.trim();
                        scoreA = parseInt(scoreTextA, 10) || 0; // Default to 0 if parsing fails
                    }
                    if (scoreBEl && scoreBEl.textContent) {
                         const scoreTextB = scoreBEl.textContent.trim();
                         scoreB = parseInt(scoreTextB, 10) || 0; // Default to 0 if parsing fails
                    }

                    // Sort descending
                    return scoreB - scoreA;
                });

                // Clear the target element and append sorted rows
                targetElement.innerHTML = '';
                rows.forEach(row => {
                    targetElement.appendChild(row);
                });


                // --- Start: Existing processing code applied AFTER sorting and appending ---

                // Add native titles to hover-info spans based on onclick alert text
                targetElement.querySelectorAll('.hover-info').forEach(span => {
                    const onclickAttr = span.getAttribute('onclick');
                    if (onclickAttr && onclickAttr.startsWith('alert(')) {
                        try {
                            // Extract the alert message carefully
                            const match = onclickAttr.match(/^alert\('(.*?)'\)$/);
                            if (match && match[1]) {
                                // Decode potential HTML entities in the message if needed (simple cases)
                                const titleText = match[1].replace(/\\'/g, "'").replace(/\\"/g, '"');
                                span.setAttribute('title', titleText);
                            }
                        } catch (e) {
                            console.warn("Could not parse onclick for title: ", span);
                        }
                         // Optional: Remove inline onclick for cleaner HTML and potentially add event listener
                         // span.removeAttribute('onclick');
                         // span.addEventListener('click', (e) => {
                         //    const title = e.currentTarget.getAttribute('title');
                         //    if(title) alert(title);
                         // });
                    }
                });

                // Style trust score buttons using classes
                targetElement.querySelectorAll('.round_button').forEach(button => {
                    // Use Node.textContent which ignores comments, scripts etc.
                    const scoreText = button.textContent.trim();
                    const score = parseInt(scoreText, 10);

                    if (!isNaN(score)) {
                        // Remove existing score classes first
                        button.className = button.className.replace(/score-\d+/g, '').trim();
                        // Determine score range class - ensure it matches CSS
                        let scoreClass = '';
                        if (score >= 90) scoreClass = 'score-90';
                        else if (score >= 85) scoreClass = 'score-85';
                        else if (score >= 80) scoreClass = 'score-80';
                        else if (score >= 75) scoreClass = 'score-75';
                        else if (score >= 70) scoreClass = 'score-70';
                        else if (score >= 65) scoreClass = 'score-65';
                        else if (score >= 60) scoreClass = 'score-60';
                        else if (score >= 55) scoreClass = 'score-55';
                        else scoreClass = 'score-50'; // Default for 50 or lower

                        button.classList.add(scoreClass);

                        // Ensure SVG is present
                        if (!button.querySelector('.shield_icon')) {
                            const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                            svgIcon.setAttribute('class', 'shield_icon');
                            svgIcon.setAttribute('viewBox', '0 0 24 24');
                            svgIcon.setAttribute('fill', 'currentColor'); // Changed fill to currentColor
                            svgIcon.setAttribute('stroke', 'none'); // Remove stroke if fill is used, or adjust as needed
                           // svgIcon.setAttribute('stroke-width', '3'); // Remove or adjust if using fill
                            svgIcon.innerHTML = '<path d="M12 2L2 7v5.48C2 17.79 6.71 22 12 22s10-4.21 10-9.52V7l-10-5zm0 10.91l-5-2.43V7.43l5 2.43v3.05z"/>'; // Example solid shield
                             // Or keep the outlined version:
                             // svgIcon.setAttribute('fill', 'none');
                             // svgIcon.setAttribute('stroke', 'currentColor');
                             // svgIcon.setAttribute('stroke-width', '3');
                             // svgIcon.setAttribute('stroke-linecap', 'round');
                             // svgIcon.setAttribute('stroke-linejoin', 'round');
                             // svgIcon.innerHTML = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>';
                            button.insertBefore(svgIcon, button.firstChild);
                        }

                        // Format the text content to just the score number after ensuring SVG is there
                        button.textContent = scoreText; // Re-set text content to remove potential extra nodes/text

                    } else {
                        console.warn("Could not parse score for button:", button);
                    }

                    // Ensure the link has a default href if missing
                    if (!button.hasAttribute('href')) {
                        button.setAttribute('href', '#'); // Add '#' as fallback href
                    }
                     // Remove inline styles if they exist from old versions
                     button.style.background = '';
                });

                 // Add classes for reseller icons
                 targetElement.querySelectorAll('td:last-child').forEach(td => {
                    const text = td.textContent.trim();
                    if (text === '✔️') {
                        td.classList.add('reseller-yes');
                    } else if (text === '❌') {
                        td.classList.add('reseller-no');
                    }
                });
                // --- End: Existing processing code ---

            })
            .catch(error => {
                console.error(`Error fetching data from ${url}:`, error);
                targetElement.innerHTML = `<tr><td colspan="8" class="error-message">Error loading product data. Please try again later.</td></tr>`;
            });
    };

    // Load data for all tables
    loadTableData('table-data.html', reputableProductDataTbody);
    loadTableData('untrusted-table-data.html', untrustedProductDataTbody);
    loadTableData('unreleased-table-data.html', unreleasedProductDataTbody);
});