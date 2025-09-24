// DOM elements
const form = document.getElementById('accountForm');
const submitBtn = document.getElementById('submitBtn');
const clearBtn = document.getElementById('clearBtn');
const messageContainer = document.getElementById('messageContainer');
const message = document.getElementById('message');

// Form fields
const accountNameField = document.getElementById('accountName');
const descriptionField = document.getElementById('description');
const accountTypeField = document.getElementById('accountType');

// API endpoint
const API_BASE_URL = '/api';

// Event listeners
form.addEventListener('submit', handleFormSubmit);
clearBtn.addEventListener('click', clearForm);

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Disable submit button and show loading state
    setLoadingState(true);
    hideMessage();
    
    try {
        // Get form data
        const formData = {
            account_name: accountNameField.value.trim(),
            description: descriptionField.value.trim(),
            account_type: accountTypeField.value
        };
        
        // Validate form data
        if (!validateFormData(formData)) {
            return;
        }
        
        // Make API request
        const response = await fetch(`${API_BASE_URL}/accounts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success
            showMessage('Account created successfully!', 'success');
            clearForm();
        } else {
            // Error
            showMessage(data.error || 'An error occurred while creating the account.', 'error');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        setLoadingState(false);
    }
}

// Validate form data
function validateFormData(data) {
    if (!data.account_name) {
        showMessage('Account name is required.', 'error');
        accountNameField.focus();
        return false;
    }
    
    if (!data.description) {
        showMessage('Description is required.', 'error');
        descriptionField.focus();
        return false;
    }
    
    if (!data.account_type) {
        showMessage('Please select an account type.', 'error');
        accountTypeField.focus();
        return false;
    }
    
    return true;
}

// Clear form
function clearForm() {
    form.reset();
    hideMessage();
    accountNameField.focus();
}

// Show message
function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
    messageContainer.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            hideMessage();
        }, 5000);
    }
}

// Hide message
function hideMessage() {
    messageContainer.style.display = 'none';
}

// Set loading state
function setLoadingState(loading) {
    if (loading) {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Adding Account...';
    } else {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Add Account';
    }
}

// Focus first field on page load
document.addEventListener('DOMContentLoaded', () => {
    accountNameField.focus();
});

// Add some nice interactions
accountNameField.addEventListener('input', () => {
    if (messageContainer.style.display === 'block') {
        hideMessage();
    }
});

descriptionField.addEventListener('input', () => {
    if (messageContainer.style.display === 'block') {
        hideMessage();
    }
});

accountTypeField.addEventListener('change', () => {
    if (messageContainer.style.display === 'block') {
        hideMessage();
    }
});