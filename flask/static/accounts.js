// DOM elements
const accountsList = document.getElementById('accountsList');
const loadingContainer = document.getElementById('loadingContainer');
const errorContainer = document.getElementById('errorContainer');
const emptyState = document.getElementById('emptyState');
const totalAccounts = document.getElementById('totalAccounts');
const refreshBtn = document.getElementById('refreshBtn');
const retryBtn = document.getElementById('retryBtn');
const errorText = document.getElementById('errorText');

// API endpoint
const API_BASE_URL = '/api';

// Event listeners
refreshBtn.addEventListener('click', loadAccounts);
retryBtn.addEventListener('click', loadAccounts);

// Load accounts on page load
document.addEventListener('DOMContentLoaded', loadAccounts);

// Load accounts from API
async function loadAccounts() {
    showLoading();
    hideError();
    hideEmptyState();
    
    try {
        const response = await fetch(`${API_BASE_URL}/accounts`);
        const data = await response.json();
        
        if (response.ok) {
            displayAccounts(data.accounts);
            updateStats(data.total);
        } else {
            showError(data.error || 'Failed to load accounts');
        }
    } catch (error) {
        console.error('Error loading accounts:', error);
        showError('Network error. Please check your connection and try again.');
    } finally {
        hideLoading();
    }
}

// Display accounts in the UI
function displayAccounts(accounts) {
    if (!accounts || accounts.length === 0) {
        showEmptyState();
        return;
    }
    
    accountsList.innerHTML = accounts.map(account => createAccountCard(account)).join('');
}

// Create HTML for a single account card
function createAccountCard(account) {
    const createdDate = new Date(account.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    return `
        <div class="account-card" data-account-id="${account.id}">
            <div class="account-header">
                <h3 class="account-name">${escapeHtml(account.account_name)}</h3>
                <span class="account-type ${account.account_type}">${formatAccountType(account.account_type)}</span>
            </div>
            <p class="account-description">${escapeHtml(account.description)}</p>
            <div class="account-meta">
                <span class="account-id">ID: ${account.id}</span>
                <span class="account-date">Created: ${createdDate}</span>
            </div>
        </div>
    `;
}

// Format account type for display
function formatAccountType(type) {
    const typeMap = {
        '401k': '401(k)',
        'ira': 'IRA',
        'roth_ira': 'Roth IRA',
        'savings': 'Savings',
        'checking': 'Checking',
        'investment': 'Investment',
        'pension': 'Pension',
        'other': 'Other'
    };
    return typeMap[type] || type;
}

// Update statistics
function updateStats(total) {
    totalAccounts.textContent = `${total} account${total !== 1 ? 's' : ''}`;
}

// Show/hide different states
function showLoading() {
    loadingContainer.style.display = 'block';
    accountsList.style.display = 'none';
}

function hideLoading() {
    loadingContainer.style.display = 'none';
    accountsList.style.display = 'block';
}

function showError(message) {
    errorText.textContent = message;
    errorContainer.style.display = 'block';
    accountsList.style.display = 'none';
}

function hideError() {
    errorContainer.style.display = 'none';
}

function showEmptyState() {
    emptyState.style.display = 'block';
    accountsList.style.display = 'none';
}

function hideEmptyState() {
    emptyState.style.display = 'none';
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add click handlers to account cards (for future functionality)
document.addEventListener('click', (e) => {
    const accountCard = e.target.closest('.account-card');
    if (accountCard) {
        const accountId = accountCard.dataset.accountId;
        console.log('Clicked account:', accountId);
        window.location.href = `/accounts/${accountId}`;
    }
});

// Add some nice animations
function animateAccountCards() {
    const cards = document.querySelectorAll('.account-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Call animation after accounts are loaded
const originalDisplayAccounts = displayAccounts;
displayAccounts = function(accounts) {
    originalDisplayAccounts(accounts);
    if (accounts && accounts.length > 0) {
        setTimeout(animateAccountCards, 100);
    }
};