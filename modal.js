/**
 * Closes the currently open confirmation modal.
 * Removes the modal overlay from the DOM after transition.
 */
function closeConfirmationModal() {
    const overlay = document.getElementById('confirmation-modal-overlay');
    if (overlay) {
        overlay.classList.remove('visible');
        // Remove the element after the transition ends
        overlay.addEventListener('transitionend', () => {
            if (overlay && overlay.parentNode) { 
                overlay.parentNode.removeChild(overlay);
            }
        }, { once: true });
    }
}

/**
 * Displays a custom confirmation modal.
 * @param {string} url - The URL to navigate to if the user confirms.
 * @param {string} message - The message to display in the modal.
 * @param {string} [title="Warning"] - The title of the modal.
 */
export function showConfirmationModal(url, message, title = "Warning") {
    // Close any existing modal first
    closeConfirmationModal(); 
    closeChangelogModal(); 

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'confirmation-modal-overlay'; 

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content'; 

    const modalTitle = document.createElement('h2');
    modalTitle.textContent = title;

    const modalMessage = document.createElement('p');
    modalMessage.textContent = message;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'modal-buttons';

    const yesButton = document.createElement('button');
    yesButton.className = 'modal-button modal-button-yes';
    yesButton.textContent = 'Yes';
    yesButton.onclick = () => {
        window.open(url, '_blank'); 
        closeConfirmationModal();
    };

    const noButton = document.createElement('button');
    noButton.className = 'modal-button modal-button-no';
    noButton.textContent = 'No';
    noButton.onclick = closeConfirmationModal;

    // Close modal if overlay is clicked
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            closeConfirmationModal();
        }
    };

    buttonContainer.appendChild(yesButton);
    buttonContainer.appendChild(noButton);
    modalContent.appendChild(modalTitle);
    modalContent.appendChild(modalMessage);
    modalContent.appendChild(buttonContainer);
    overlay.appendChild(modalContent);
    document.body.appendChild(overlay);

    // Trigger the transition
    requestAnimationFrame(() => {
        overlay.classList.add('visible');
    });
}


/**
 * Displays the changelog modal.
 */
export function showChangelogModal() {
    closeConfirmationModal(); 
    const overlay = document.getElementById('changelog-modal-overlay');
    if (overlay) {
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
    }
}

/**
 * Closes the changelog modal.
 */
export function closeChangelogModal() {
    const overlay = document.getElementById('changelog-modal-overlay');
    if (overlay) {
        overlay.classList.remove('visible');
        // No need to remove the element from DOM as it's part of the initial HTML
    }
}