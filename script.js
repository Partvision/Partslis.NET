import { showConfirmationModal, showChangelogModal, closeChangelogModal } from './modal.js';
import { loadTableData } from './table-loader.js';

document.addEventListener('DOMContentLoaded', () => {
    const reputableProductDataTbody = document.getElementById('product-data');
    const untrustedProductDataTbody = document.getElementById('untrusted-product-data');
    const unreleasedProductDataTbody = document.getElementById('unreleased-product-data');
    const externalCheatDataTbody = document.getElementById('external-cheat-data');
    const changelogButton = document.getElementById('changelog-button');
    const changelogModalOverlay = document.getElementById('changelog-modal-overlay');
    const changelogCloseButton = document.getElementById('changelog-close-button');

    // Load data for all tables
    loadTableData('table-data.html', reputableProductDataTbody);
    loadTableData('untrusted-table-data.html', untrustedProductDataTbody);
    loadTableData('unreleased-table-data.html', unreleasedProductDataTbody);
    loadTableData('external-cheats-data.html', externalCheatDataTbody);

    // Changelog Button Listener
    if (changelogButton) {
        changelogButton.addEventListener('click', showChangelogModal);
    }

    // Changelog Modal Close Listeners
    if (changelogModalOverlay) {
        changelogModalOverlay.addEventListener('click', (e) => {
            // Close if clicked outside the modal content
            if (e.target === changelogModalOverlay) {
                closeChangelogModal();
            }
        });
    }
    if (changelogCloseButton) {
        changelogCloseButton.addEventListener('click', closeChangelogModal);
    }
});

