/**
 * Quote Generator with Inventory Integration
 */

(function() {
    'use strict';

    let inventory = [];
    let quoteItems = [];
    let customItems = [];
    let savedQuotes = [];
    let currentQuote = null;

    const TAX_RATE = 0.0875; // 8.75%

    /**
     * Initialize quote generator
     */
    function init() {
        loadInventory();
        setupFormListeners();
        generateQuoteNumber();
        updatePreview();
    }

    /**
     * Load inventory from S3
     */
    async function loadInventory() {
        try {
            inventory = await window.S3Service.getInventory();
            if (!Array.isArray(inventory)) {
                inventory = [];
            }
            // Filter only available items for quoting
            inventory = inventory.filter(item => item.status === 'available');
        } catch (error) {
            console.error('Error loading inventory:', error);
            inventory = [];
        }
    }

    /**
     * Setup form listeners for real-time preview update
     */
    function setupFormListeners() {
        const inputs = [
            'client-name', 'client-email', 'client-phone',
            'event-type', 'event-date', 'guest-count', 
            'event-location', 'quote-notes'
        ];

        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', updatePreview);
            }
        });
    }

    /**
     * Generate quote number
     */
    function generateQuoteNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        return `Q-${year}${month}-${random}`;
    }

    /**
     * New quote
     */
    window.newQuote = function() {
        if (confirm('Start a new quote? Any unsaved changes will be lost.')) {
            location.reload();
        }
    };

    /**
     * Show inventory selector
     */
    window.showInventorySelector = function() {
        const modal = document.getElementById('inventory-modal');
        const list = document.getElementById('inventory-list');

        list.innerHTML = inventory.map(item => `
            <div class="inventory-item-select" onclick="addItemToQuote('${item.id}')">
                <div class="item-thumbnail">
                    ${item.image ? 
                        `<img src="${item.image}" alt="${item.name}">` : 
                        `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                        </svg>`
                    }
                </div>
                <div class="item-select-info">
                    <div class="item-select-name">${item.name}</div>
                    <div class="item-select-meta">
                        ${item.category} ΓÇó ${item.serialNumbers.length} available
                    </div>
                </div>
                <div class="item-select-price">
                    ${item.rentalPrice ? `$${item.rentalPrice.toFixed(2)}` : 'Custom'}
                </div>
            </div>
        `).join('');

        modal.classList.add('active');
    };

    /**
     * Close inventory selector
     */
    window.closeInventorySelector = function() {
        document.getElementById('inventory-modal').classList.remove('active');
    };

    /**
     * Filter inventory in modal
     */
    window.filterInventoryModal = function() {
        const search = document.getElementById('inventory-search-input').value.toLowerCase();
        const filtered = inventory.filter(item => 
            item.name.toLowerCase().includes(search) ||
            (item.model && item.model.toLowerCase().includes(search)) ||
            item.category.toLowerCase().includes(search)
        );

        const list = document.getElementById('inventory-list');
        list.innerHTML = filtered.map(item => `
            <div class="inventory-item-select" onclick="addItemToQuote('${item.id}')">
                <div class="item-thumbnail">
                    ${item.image ? 
                        `<img src="${item.image}" alt="${item.name}">` : 
                        `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                        </svg>`
                    }
                </div>
                <div class="item-select-info">
                    <div class="item-select-name">${item.name}</div>
                    <div class="item-select-meta">
                        ${item.category} ΓÇó ${item.serialNumbers.length} available
                    </div>
                </div>
                <div class="item-select-price">
                    ${item.rentalPrice ? `$${item.rentalPrice.toFixed(2)}` : 'Custom'}
                </div>
            </div>
        `).join('');
    };

    /**
     * Add item to quote
     */
    window.addItemToQuote = function(itemId) {
        const item = inventory.find(i => i.id === itemId);
        if (!item) return;

        // Check if item already added
        if (quoteItems.find(qi => qi.inventoryId === itemId)) {
            showToast('Item already added to quote', 'info');
            return;
        }

        quoteItems.push({
            id: Date.now().toString(),
            inventoryId: itemId,
            name: item.name,
            category: item.category,
            quantity: 1,
            rate: item.rentalPrice || 0,
            maxQuantity: item.serialNumbers.length
        });

        closeInventorySelector();
        renderQuoteItems();
        updatePreview();
        showToast('Item added to quote');
    };

    /**
     * Add custom line item
     */
    window.addCustomLineItem = function() {
        document.getElementById('custom-item-modal').classList.add('show');
        document.getElementById('custom-item-form').reset();
        document.getElementById('custom-item-image-preview').style.display = 'none';
        document.getElementById('custom-item-name').focus();
        
        // Add image preview handler
        document.getElementById('custom-item-image').onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const preview = document.getElementById('custom-item-image-preview');
                    const img = document.getElementById('custom-item-preview-img');
                    img.src = event.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                document.getElementById('custom-item-image-preview').style.display = 'none';
            }
        };
    };

    /**
     * Close custom item modal
     */
    window.closeCustomItemModal = function() {
        document.getElementById('custom-item-modal').classList.remove('show');
        document.getElementById('custom-item-form').reset();
        document.getElementById('custom-item-image-preview').style.display = 'none';
    };

    /**
     * Save custom item with image
     */
    window.saveCustomItem = async function() {
        const name = document.getElementById('custom-item-name').value.trim();
        const description = document.getElementById('custom-item-description').value.trim();
        const rate = parseFloat(document.getElementById('custom-item-rate').value) || 0;
        const imageFile = document.getElementById('custom-item-image').files[0];

        if (!name) {
            showToast('Please enter an item name', 'error');
            return;
        }

        const itemId = Date.now().toString();
        let imageUrl = null;

        // Upload image if provided
        if (imageFile) {
            try {
                showToast('Uploading image...', 'info');
                const imagePath = `admin-data/quote-items/images/${itemId}-${imageFile.name}`;
                imageUrl = await window.S3Service.uploadFile(imageFile, imagePath);
                if (!imageUrl) {
                    throw new Error('Image upload failed');
                }
            } catch (error) {
                console.error('Failed to upload image:', error);
                showToast('Failed to upload image. Adding item without image.', 'warning');
                imageUrl = null;
            }
        }

        customItems.push({
            id: itemId,
            name: name,
            description: description,
            quantity: 1,
            rate: rate,
            imageUrl: imageUrl
        });

        renderCustomItems();
        updatePreview();
        closeCustomItemModal();
        showToast('Custom item added successfully!', 'success');
    };

    /**
     * Render quote items
     */
    function renderQuoteItems() {
        const container = document.getElementById('quote-items');
        const emptyState = document.getElementById('empty-items');

        if (quoteItems.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'flex';
        emptyState.style.display = 'none';

        container.innerHTML = quoteItems.map(item => `
            <div class="quote-item">
                <div class="item-details">
                    <div class="item-name-line">
                        <span class="item-name">${item.name}</span>
                        <span class="item-category-tag">${item.category}</span>
                    </div>
                    <div class="item-pricing">
                        <label>Qty:</label>
                        <input type="number" min="1" max="${item.maxQuantity}" value="${item.quantity}" 
                            onchange="updateItemQuantity('${item.id}', this.value)">
                        <label>├ù</label>
                        <label>$</label>
                        <input type="number" step="0.01" min="0" value="${item.rate}" 
                            onchange="updateItemRate('${item.id}', this.value)" style="width: 90px;">
                        <span>= $${(item.quantity * item.rate).toFixed(2)}</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="delete" onclick="removeQuoteItem('${item.id}')" title="Remove">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render custom items
     */
    /**
     * Render custom items
     */
    function renderCustomItems() {
        const container = document.getElementById('custom-items');

        if (customItems.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = customItems.map(item => {
            const hasImage = item.imageUrl;
            const hasDescription = item.description;
            
            return `
            <div class="quote-item" style="display: flex; align-items: center;">
                ${hasImage ? `<div class="item-image-preview"><img src="${item.imageUrl}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; margin-right: 12px;"></div>` : ''}
                <div class="item-details" style="flex: 1;">
                    <div class="item-name-line">
                        <span class="item-name">${item.name}</span>
                        ${hasDescription ? `<span class="item-description" style="font-size: 12px; color: #888; margin-top: 4px; display: block;">${item.description}</span>` : ''}
                    </div>
                    <div class="item-pricing">
                        <label>Qty:</label>
                        <input type="number" min="1" value="${item.quantity}" 
                            onchange="updateCustomItemQuantity('${item.id}', this.value)">
                        <label>Ã—</label>
                        <label>$</label>
                        <input type="number" step="0.01" min="0" value="${item.rate}" 
                            onchange="updateCustomItemRate('${item.id}', this.value)" style="width: 90px;">
                        <span>= $${(item.quantity * item.rate).toFixed(2)}</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="delete" onclick="removeCustomItem('${item.id}')" title="Remove">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }


    /**
     * Update item quantity
     */
    window.updateItemQuantity = function(itemId, quantity) {
        const item = quoteItems.find(i => i.id === itemId);
        if (item) {
            item.quantity = Math.min(parseInt(quantity) || 1, item.maxQuantity);
            updatePreview();
        }
    };

    /**
     * Update item rate
     */
    window.updateItemRate = function(itemId, rate) {
        const item = quoteItems.find(i => i.id === itemId);
        if (item) {
            item.rate = parseFloat(rate) || 0;
            updatePreview();
        }
    };

    /**
     * Update custom item quantity
     */
    window.updateCustomItemQuantity = function(itemId, quantity) {
        const item = customItems.find(i => i.id === itemId);
        if (item) {
            item.quantity = parseInt(quantity) || 1;
            updatePreview();
        }
    };

    /**
     * Update custom item rate
     */
    window.updateCustomItemRate = function(itemId, rate) {
        const item = customItems.find(i => i.id === itemId);
        if (item) {
            item.rate = parseFloat(rate) || 0;
            updatePreview();
        }
    };

    /**
     * Remove quote item
     */
    window.removeQuoteItem = function(itemId) {
        quoteItems = quoteItems.filter(i => i.id !== itemId);
        renderQuoteItems();
        updatePreview();
    };

    /**
     * Remove custom item
     */
    window.removeCustomItem = function(itemId) {
        customItems = customItems.filter(i => i.id !== itemId);
        renderCustomItems();
        updatePreview();
    };

    /**
     * Update preview
     */
    function updatePreview() {
        // Client info
        const clientName = document.getElementById('client-name').value || '-';
        const clientEmail = document.getElementById('client-email').value;
        const clientPhone = document.getElementById('client-phone').value;
        
        document.getElementById('preview-client-name').textContent = clientName;
        
        let contactInfo = [];
        if (clientEmail) contactInfo.push(clientEmail);
        if (clientPhone) contactInfo.push(clientPhone);
        document.getElementById('preview-client-contact').textContent = contactInfo.join(' ΓÇó ');

        // Quote info
        const quoteNumber = document.getElementById('preview-quote-number').textContent;
        const today = new Date().toLocaleDateString();
        document.getElementById('preview-quote-date').textContent = today;

        // Event details
        const eventType = document.getElementById('event-type').value || '-';
        const eventDate = document.getElementById('event-date').value;
        const guestCount = document.getElementById('guest-count').value;
        const eventLocation = document.getElementById('event-location').value;

        let eventDetails = [eventType];
        if (eventDate) eventDetails.push(new Date(eventDate).toLocaleDateString());
        if (guestCount) eventDetails.push(`${guestCount} guests`);
        if (eventLocation) eventDetails.push(eventLocation);
        document.getElementById('preview-event-details').textContent = eventDetails.join(' ΓÇó ');

        // Items table
        const allItems = [...quoteItems, ...customItems];
        const tbody = document.getElementById('preview-items-table');
        
        if (allItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No items added</td></tr>';
        } else {
            tbody.innerHTML = allItems.map(item => `
                <tr>
                    <td>${item.name}${item.category ? ` (${item.category})` : ''}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.rate.toFixed(2)}</td>
                    <td>$${(item.quantity * item.rate).toFixed(2)}</td>
                </tr>
            `).join('');
        }

        // Calculate totals
        const subtotal = allItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
        const tax = subtotal * TAX_RATE;
        const total = subtotal + tax;

        // Update summary card
        document.getElementById('summary-subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('summary-tax').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('summary-total').textContent = `$${total.toFixed(2)}`;

        // Update preview document
        document.getElementById('preview-subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('preview-tax').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('preview-total').textContent = `$${total.toFixed(2)}`;

        // Notes
        const notes = document.getElementById('quote-notes').value;
        const notesSection = document.getElementById('preview-notes-section');
        if (notes.trim()) {
            notesSection.style.display = 'block';
            document.getElementById('preview-notes').textContent = notes;
        } else {
            notesSection.style.display = 'none';
        }
    }

    /**
     * Save quote
     */
    window.saveQuote = async function() {
        const clientName = document.getElementById('client-name').value.trim();
        if (!clientName) {
            showToast('Please enter a client name', 'error');
            return;
        }

        if (quoteItems.length === 0 && customItems.length === 0) {
            showToast('Please add at least one item to the quote', 'error');
            return;
        }

        try {
            showToast('Saving quote...', 'info');

            const quote = {
                id: currentQuote ? currentQuote.id : Date.now().toString(),
                quoteNumber: document.getElementById('preview-quote-number').textContent,
                dateCreated: currentQuote ? currentQuote.dateCreated : new Date().toISOString(),
                dateModified: new Date().toISOString(),
                client: {
                    name: clientName,
                    email: document.getElementById('client-email').value,
                    phone: document.getElementById('client-phone').value
                },
                event: {
                    type: document.getElementById('event-type').value,
                    date: document.getElementById('event-date').value,
                    guestCount: document.getElementById('guest-count').value,
                    location: document.getElementById('event-location').value
                },
                items: quoteItems,
                customItems: customItems,
                notes: document.getElementById('quote-notes').value,
                subtotal: parseFloat(document.getElementById('summary-subtotal').textContent.replace('$', '')),
                tax: parseFloat(document.getElementById('summary-tax').textContent.replace('$', '')),
                total: parseFloat(document.getElementById('summary-total').textContent.replace('$', ''))
            };

            // Load existing quotes
            let quotes = await window.S3Service.getQuotes().catch(() => []);
            if (!Array.isArray(quotes)) quotes = [];

            // Update or add quote
            const existingIndex = quotes.findIndex(q => q.id === quote.id);
            if (existingIndex >= 0) {
                quotes[existingIndex] = quote;
            } else {
                quotes.push(quote);
            }

            // Save to S3
            await window.S3Service.saveQuotes(quotes);

            currentQuote = quote;
            showToast('Quote saved successfully');
        } catch (error) {
            console.error('Error saving quote:', error);
            showToast('Error saving quote. Please try again.', 'error');
        }
    };

    /**
     * Export quote as PDF
     */
    window.exportQuotePDF = function() {
        showToast('PDF export feature coming soon!', 'info');
        // In production, integrate with jsPDF or similar library
        window.print();
    };

    /**
     * Email quote
     */
    window.emailQuote = function() {
        const email = document.getElementById('client-email').value;
        if (!email) {
            showToast('Please enter a client email address', 'error');
            return;
        }
        showToast('Email feature coming soon!', 'info');
        // In production, integrate with EmailJS or backend email service
    };

    /**
     * Load saved quotes
     */
    window.loadSavedQuotes = async function() {
        try {
            savedQuotes = await window.S3Service.getQuotes().catch(() => []);
            if (!Array.isArray(savedQuotes)) savedQuotes = [];

            const list = document.getElementById('saved-quotes-list');
            
            if (savedQuotes.length === 0) {
                list.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 40px;">No saved quotes yet.</p>';
            } else {
                list.innerHTML = savedQuotes.sort((a, b) => 
                    new Date(b.dateModified) - new Date(a.dateModified)
                ).map(quote => `
                    <div class="saved-quote-item" onclick="loadQuote('${quote.id}')">
                        <div class="saved-quote-header">
                            <div class="saved-quote-number">${quote.quoteNumber}</div>
                            <div class="saved-quote-date">${new Date(quote.dateModified).toLocaleDateString()}</div>
                        </div>
                        <div class="saved-quote-client">${quote.client.name}</div>
                        <div class="saved-quote-total">$${quote.total.toFixed(2)}</div>
                    </div>
                `).join('');
            }

            document.getElementById('quotes-modal').classList.add('active');
        } catch (error) {
            console.error('Error loading quotes:', error);
            showToast('Error loading saved quotes', 'error');
        }
    };

    /**
     * Close quotes modal
     */
    window.closeQuotesModal = function() {
        document.getElementById('quotes-modal').classList.remove('active');
    };

    /**
     * Load a saved quote
     */
    window.loadQuote = function(quoteId) {
        const quote = savedQuotes.find(q => q.id === quoteId);
        if (!quote) return;

        currentQuote = quote;

        // Fill form
        document.getElementById('client-name').value = quote.client.name || '';
        document.getElementById('client-email').value = quote.client.email || '';
        document.getElementById('client-phone').value = quote.client.phone || '';
        document.getElementById('event-type').value = quote.event.type || '';
        document.getElementById('event-date').value = quote.event.date || '';
        document.getElementById('guest-count').value = quote.event.guestCount || '';
        document.getElementById('event-location').value = quote.event.location || '';
        document.getElementById('quote-notes').value = quote.notes || '';
        document.getElementById('preview-quote-number').textContent = quote.quoteNumber;

        // Load items
        quoteItems = quote.items || [];
        customItems = quote.customItems || [];

        renderQuoteItems();
        renderCustomItems();
        updatePreview();

        closeQuotesModal();
        showToast('Quote loaded successfully');
    };

    /**
     * Show toast notification
     */
    function showToast(message, type = 'success') {
        const toast = document.getElementById('admin-toast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = `admin-toast toast-visible ${type}`;

        setTimeout(() => {
            toast.classList.remove('toast-visible');
        }, 4000);
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
