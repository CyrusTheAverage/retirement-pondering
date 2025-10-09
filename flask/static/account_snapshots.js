// DOM elements
const loadingContainer = document.getElementById('loadingContainer');
const errorContainer = document.getElementById('errorContainer');
const accountContent = document.getElementById('accountContent');
const retryBtn = document.getElementById('retryBtn');
const errorText = document.getElementById('errorText');

// Account elements
const accountName = document.getElementById('accountName');
const accountType = document.getElementById('accountType');
const accountDescription = document.getElementById('accountDescription');
const accountId = document.getElementById('accountId');
const accountCreated = document.getElementById('accountCreated');
const currentAccountLink = document.getElementById('currentAccountLink');

// Snapshots elements
const snapshotsList = document.getElementById('snapshotsList');
const totalSnapshots = document.getElementById('totalSnapshots');
const latestAmount = document.getElementById('latestAmount');
const emptySnapshotsState = document.getElementById('emptySnapshotsState');

// Modal elements
const addSnapshotModal = document.getElementById('addSnapshotModal');
const addSnapshotBtn = document.getElementById('addSnapshotBtn');
const addFirstSnapshotBtn = document.getElementById('addFirstSnapshotBtn');
const closeModal = document.querySelector('.close');
const cancelSnapshotBtn = document.getElementById('cancelSnapshotBtn');
const snapshotForm = document.getElementById('snapshotForm');
const submitSnapshotBtn = document.getElementById('submitSnapshotBtn');

// Form elements
const snapshotDate = document.getElementById('snapshotDate');
const snapshotAmount = document.getElementById('snapshotAmount');

// Message elements
const messageContainer = document.getElementById('messageContainer');
const message = document.getElementById('message');

// API endpoint
const API_BASE_URL = '/api';

// Get account ID from URL
const accountIdFromUrl = window.location.pathname.split('/').pop();

// Current account data
let currentAccount = null;

// Event listeners
retryBtn.addEventListener('click', loadAccountDetails);
addSnapshotBtn.addEventListener('click', openAddSnapshotModal);
addFirstSnapshotBtn.addEventListener('click', openAddSnapshotModal);
closeModal.addEventListener('click', closeAddSnapshotModal);
cancelSnapshotBtn.addEventListener('click', closeAddSnapshotModal);
snapshotForm.addEventListener('submit', handleSnapshotSubmit);

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === addSnapshotModal) {
        closeAddSnapshotModal();
    }
});

// Load account details on page load
document.addEventListener('DOMContentLoaded', () => {
    loadAccountDetails();
    // Set today's date as default
    snapshotDate.value = new Date().toISOString().split('T')[0];
});

// Load account details from API
async function loadAccountDetails() {
    showLoading();
    hideError();
    hideAccountContent();
    
    try {
        // Load account details
        const accountResponse = await fetch(`${API_BASE_URL}/accounts/${accountIdFromUrl}`);
        const accountData = await accountResponse.json();
        
        if (accountResponse.ok) {
            currentAccount = accountData.account;
            displayAccountDetails(currentAccount);
            
            // Load snapshots for this account
            await loadSnapshots();
            
            showAccountContent();
        } else {
            showError(accountData.error || 'Failed to load account details');
        }
    } catch (error) {
        console.error('Error loading account details:', error);
        showError('Network error. Please check your connection and try again.');
    } finally {
        hideLoading();
    }
}

// Load snapshots for the current account
async function loadSnapshots() {
    try {
        const response = await fetch(`${API_BASE_URL}/account-snapshots/${accountIdFromUrl}`);
        const data = await response.json();
        displaySnapshots(data.snapshots);
        
    } catch (error) {
        console.error('Error loading snapshots:', error);
        displaySnapshots([]);
    }
}

// Display account details in the UI
function displayAccountDetails(account) {
    accountName.textContent = account.account_name;
    accountType.textContent = formatAccountType(account.account_type);
    accountType.className = `account-type ${account.account_type}`;
    accountDescription.textContent = account.description;
    accountId.textContent = `ID: ${account.id}`;
    accountCreated.textContent = `Created: ${new Date(account.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}`;
    
    // Update navigation link
    currentAccountLink.textContent = account.account_name;
}

// Display snapshots in the UI
function displaySnapshots(snapshots) {
    if (!snapshots || snapshots.length === 0) {
        showEmptySnapshotsState();
        return;
    }
    
    hideEmptySnapshotsState();
    
    // Sort snapshots by date (newest first)
    const sortedSnapshots = snapshots.sort((a, b) => new Date(b.snapshot_date) - new Date(a.snapshot_date));
    
    snapshotsList.innerHTML = sortedSnapshots.map(snapshot => createSnapshotItem(snapshot)).join('');
    
    // Update stats
    totalSnapshots.textContent = `${snapshots.length} snapshot${snapshots.length !== 1 ? 's' : ''}`;
    
    // Show latest amount
    const latestSnapshot = sortedSnapshots[0];
    latestAmount.textContent = `Latest: $${formatAmount(latestSnapshot.amount)}`;
}

// Create HTML for a single snapshot item
function createSnapshotItem(snapshot) {
    const snapshotDate = new Date(snapshot.snapshot_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    return `
        <div class="snapshot-item">
            <div class="snapshot-info">
                <div class="snapshot-date">${snapshotDate}</div>
                <div class="snapshot-meta">Snapshot ID: ${snapshot.id}</div>
            </div>
            <div class="snapshot-amount">$${formatAmount(snapshot.amount)}</div>
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

// Format amount for display
function formatAmount(amount) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Open add snapshot modal
function openAddSnapshotModal() {
    addSnapshotModal.style.display = 'flex';
    // Set today's date as default
    snapshotDate.value = new Date().toISOString().split('T')[0];
    snapshotAmount.focus();
}

// Close add snapshot modal
function closeAddSnapshotModal() {
    addSnapshotModal.style.display = 'none';
    snapshotForm.reset();
    hideMessage();
}

// Handle snapshot form submission
async function handleSnapshotSubmit(event) {
    event.preventDefault();
    
    // Disable submit button and show loading state
    setLoadingState(true);
    hideMessage();
    
    try {
        // Get form data
        const formData = {
            account_id: parseInt(accountIdFromUrl),
            snapshot_date: snapshotDate.value,
            amount: parseFloat(snapshotAmount.value)
        };
        
        // Validate form data
        if (!validateSnapshotData(formData)) {
            return;
        }
        // Make API request
        const response = await fetch(`${API_BASE_URL}/account-snapshots`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                snapshots: [formData]
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success
            showMessage('Snapshot added successfully!', 'success');
            closeAddSnapshotModal();
            
            // Reload snapshots
            await loadSnapshots();
        } else {
            // Error
            showMessage(data.error || 'An error occurred while adding the snapshot.', 'error');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        setLoadingState(false);
    }
}

// Validate snapshot form data
function validateSnapshotData(data) {
    if (!data.snapshot_date) {
        showMessage('Snapshot date is required.', 'error');
        snapshotDate.focus();
        return false;
    }
    
    if (!data.amount || data.amount <= 0) {
        showMessage('Amount must be a positive number.', 'error');
        snapshotAmount.focus();
        return false;
    }
    
    return true;
}

// Show/hide different states
function showLoading() {
    loadingContainer.style.display = 'block';
}

function hideLoading() {
    loadingContainer.style.display = 'none';
}

function showError(message) {
    errorText.textContent = message;
    errorContainer.style.display = 'block';
    hideAccountContent();
}

function hideError() {
    errorContainer.style.display = 'none';
}

function showAccountContent() {
    accountContent.style.display = 'block';
}

function hideAccountContent() {
    accountContent.style.display = 'none';
}

function showEmptySnapshotsState() {
    emptySnapshotsState.style.display = 'block';
    snapshotsList.style.display = 'none';
}

function hideEmptySnapshotsState() {
    emptySnapshotsState.style.display = 'none';
    snapshotsList.style.display = 'block';
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

// Set loading state for form submission
function setLoadingState(loading) {
    if (loading) {
        submitSnapshotBtn.disabled = true;
        submitSnapshotBtn.classList.add('loading');
        submitSnapshotBtn.textContent = 'Adding Snapshot...';
    } else {
        submitSnapshotBtn.disabled = false;
        submitSnapshotBtn.classList.remove('loading');
        submitSnapshotBtn.textContent = 'Add Snapshot';
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}