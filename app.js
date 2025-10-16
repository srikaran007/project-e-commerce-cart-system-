// E-Commerce Cart System - Phase 4
// Enhanced version with all features implemented

// Configuration
const CONFIG = {
    TAX_RATE: 0.05,
    DEFAULT_SHIPPING: 50,
    STORAGE_KEY: 'ecommerce_cart',
    PROMO_CODES: {
        'SAVE10': { discount: 10, freeShipping: false },
        'FREESHIP': { discount: 0, freeShipping: true },
        'WELCOME20': { discount: 20, freeShipping: false },
        'COMBO25': { discount: 25, freeShipping: true }
    }
};

// Initial product data
let PRODUCTS = [
    {
        id: 'p1',
        name: 'Wireless Bluetooth Headphones',
        price: 2499,
        category: 'electronics',
        description: 'Premium wireless headphones with noise cancellation and 30-hour battery life.',
        image: '/images/Wireless Bluetooth Headphones.jpeg'
    },
    {
        id: 'p2',
        name: 'Smart Watch Series 5',
        price: 3999,
        category: 'electronics',
        description: 'Advanced smartwatch with health monitoring, GPS, and water resistance.',
        image: '/images/smart watch.jpeg'
    },
    {
        id: 'p3',
        name: 'Running Shoes Pro',
        price: 3199,
        category: 'sports',
        description: 'Professional running shoes with advanced cushioning and breathable material.',
        image: '/images/Running Shoes.jpeg'
    },
    {
        id: 'p4',
        name: 'Travel Backpack',
        price: 1499,
        category: 'travel',
        description: 'Durable travel backpack with multiple compartments and laptop sleeve.',
        image: '/images/Travel Backpack.jpeg'
    },
    {
        id: 'p5',
        name: 'Wireless Charger',
        price: 899,
        category: 'electronics',
        description: 'Fast wireless charging pad compatible with all Qi-enabled devices.',
        image: '/images/Wireless Charger.jpg'
    },
    {
        id: 'p6',
        name: 'Coffee Maker Deluxe',
        price: 4999,
        category: 'home',
        description: 'Premium coffee maker with built-in grinder and programmable settings.',
        image: '/images/Coffee Maker Deluxe.jpeg'
    }
];

// Application state
let cart = [];
let appliedPromo = null;
let currentPage = 'products';

// Utility Functions
const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;

const generateId = () => Math.random().toString(36).substr(2, 9);

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Storage Functions
const saveToStorage = () => {
    const data = {
        cart: cart,
        products: PRODUCTS,
        appliedPromo: appliedPromo
    };
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
};

const loadFromStorage = () => {
    try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            cart = parsed.cart || [];
            PRODUCTS = parsed.products || PRODUCTS;
            appliedPromo = parsed.appliedPromo || null;
        }
    } catch (error) {
        console.error('Error loading from storage:', error);
        showToast('Error loading saved data', 'error');
    }
};

// Toast Notification System
const showToast = (message, type = 'success') => {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
};

// Navigation Functions
const showPage = (pageId) => {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    document.getElementById(`${pageId}-page`).classList.add('active');

    // Update navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.page === pageId) {
            tab.classList.add('active');
        }
    });

    currentPage = pageId;

    // Render page-specific content
    if (pageId === 'cart') {
        renderCart();
    } else if (pageId === 'products') {
        renderProducts();
    }
};

// Product Functions
const renderProducts = () => {
    const container = document.getElementById('products');
    const searchTerm = document.getElementById('searchProducts').value.toLowerCase();

    const filteredProducts = PRODUCTS.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
    );

    if (filteredProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No products found</h3>
                <p>Try adjusting your search criteria</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image" 
                 onerror="this.src='https://via.placeholder.com/400x300?text=Product+Image'">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">${formatCurrency(product.price)}</div>
                <button class="btn btn-primary" onclick="addToCart('${product.id}')">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        </div>
    `).join('');
};

// Cart Functions
const addToCart = (productId) => {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) {
        showToast('Product not found', 'error');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
        showToast(`${product.name} quantity updated`, 'success');
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
        showToast(`${product.name} added to cart`, 'success');
    }

    updateCartBadge();
    saveToStorage();

    if (currentPage === 'cart') {
        renderCart();
    }
};

const removeFromCart = (productId) => {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        const item = cart[itemIndex];
        cart.splice(itemIndex, 1);
        showToast(`${item.name} removed from cart`, 'success');
        updateCartBadge();
        saveToStorage();
        renderCart();
    }
};

const updateQuantity = (productId, change) => {
    const item = cart.find(item => item.id === productId);
    if (item) {
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            updateCartBadge();
            saveToStorage();
            renderCart();
        }
    }
};

const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    let discount = 0;
    let shipping = CONFIG.DEFAULT_SHIPPING;

    if (appliedPromo && CONFIG.PROMO_CODES[appliedPromo]) {
        const promoConfig = CONFIG.PROMO_CODES[appliedPromo];
        discount = subtotal * (promoConfig.discount / 100);
        if (promoConfig.freeShipping) {
            shipping = 0;
        }
    }

    const tax = (subtotal - discount) * CONFIG.TAX_RATE;
    const total = subtotal - discount + tax + shipping;

    return {
        subtotal: subtotal,
        discount: discount,
        tax: tax,
        shipping: shipping,
        total: total
    };
};

const renderCart = () => {
    const container = document.getElementById('cartList');
    const itemCount = document.getElementById('cartItemCount');

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p>Add some products to get started</p>
                <button class="btn btn-primary" onclick="showPage('products')">
                    <i class="fas fa-shopping-bag"></i> Shop Now
                </button>
            </div>
        `;
        itemCount.textContent = '0 items';
    } else {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        itemCount.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;

        container.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image"
                     onerror="this.src='https://via.placeholder.com/80x80?text=Product'">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">${formatCurrency(item.price)}</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">
                        Subtotal: ${formatCurrency(item.price * item.quantity)}
                    </div>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="btn btn-danger" onclick="removeFromCart('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateTotalsDisplay();
};

const updateTotalsDisplay = () => {
    const totals = calculateTotals();

    document.getElementById('subtotal').textContent = formatCurrency(totals.subtotal);
    document.getElementById('tax').textContent = formatCurrency(totals.tax);
    document.getElementById('shipping').textContent = formatCurrency(totals.shipping);
    document.getElementById('grandTotal').textContent = formatCurrency(totals.total);

    const discountRow = document.getElementById('discountRow');
    const discountAmount = document.getElementById('discount');

    if (totals.discount > 0) {
        discountRow.style.display = 'flex';
        discountAmount.textContent = `-${formatCurrency(totals.discount)}`;
    } else {
        discountRow.style.display = 'none';
    }

    // Update checkout button state
    const checkoutBtn = document.getElementById('proceedCheckout');
    if (cart.length === 0) {
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Cart is Empty';
    } else {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Proceed to Checkout';
    }
};

const updateCartBadge = () => {
    const badge = document.getElementById('cartBadge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'flex' : 'none';
};

// Promo Code Functions
const applyPromoCode = () => {
    const promoInput = document.getElementById('promoCode');
    const code = promoInput.value.trim().toUpperCase();

    if (!code) {
        showToast('Please enter a promo code', 'error');
        return;
    }

    if (cart.length === 0) {
        showToast('Add items to cart before applying promo code', 'error');
        return;
    }

    if (CONFIG.PROMO_CODES[code]) {
        appliedPromo = code;
        const promoConfig = CONFIG.PROMO_CODES[code];
        let message = `Promo code applied! ${promoConfig.discount}% discount`;
        if (promoConfig.freeShipping) {
            message += ' + Free shipping';
        }
        showToast(message, 'success');
        promoInput.value = '';
        updateTotalsDisplay();
        saveToStorage();
    } else {
        showToast('Invalid promo code', 'error');
    }
};

// Checkout Functions
const handleCheckout = (event) => {
    event.preventDefault();

    if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }

    // Get form data
    const formData = new FormData(event.target);
    const orderData = {
        id: generateId(),
        items: [...cart],
        customer: {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: {
                street: formData.get('address'),
                city: formData.get('city'),
                state: formData.get('state'),
                pincode: formData.get('pincode')
            }
        },
        totals: calculateTotals(),
        appliedPromo: appliedPromo,
        orderDate: new Date().toISOString()
    };

    // Simulate order processing
    setTimeout(() => {
        showToast(`Order placed successfully! Order ID: ${orderData.id}`, 'success');

        // Clear cart and reset
        cart = [];
        appliedPromo = null;
        updateCartBadge();
        saveToStorage();

        // Reset form and redirect to products
        event.target.reset();
        showPage('products');

        // Store order in localStorage for order history (future feature)
        const orders = JSON.parse(localStorage.getItem('order_history') || '[]');
        orders.push(orderData);
        localStorage.setItem('order_history', JSON.stringify(orders));

    }, 1000);
};

// Admin Functions
const handleAddProduct = (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const imageFile = formData.get('productImage');

    const newProduct = {
        id: generateId(),
        name: formData.get('productName'),
        price: parseFloat(formData.get('productPrice')),
        category: formData.get('productCategory'),
        description: formData.get('productDescription') || 'No description available',
        image: 'https://via.placeholder.com/400x300?text=New+Product'
    };

    // Handle image upload (in a real app, this would upload to a server)
    if (imageFile && imageFile.size > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
            newProduct.image = e.target.result;
            addProductToStore(newProduct);
            event.target.reset();
            clearImagePreview();
        };
        reader.readAsDataURL(imageFile);
    } else {
        addProductToStore(newProduct);
        event.target.reset();
        clearImagePreview();
    }
};

const addProductToStore = (product) => {
    PRODUCTS.push(product);
    saveToStorage();
    showToast(`${product.name} added to store`, 'success');
    if (currentPage === 'products') {
        renderProducts();
    }
};

const handleImagePreview = (event) => {
    const file = event.target.files[0];
    const preview = document.getElementById('imagePreview');

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    } else {
        clearImagePreview();
    }
};

const clearImagePreview = () => {
    document.getElementById('imagePreview').innerHTML = '';
};

// Search functionality
const handleSearch = debounce(() => {
    if (currentPage === 'products') {
        renderProducts();
    }
}, 300);

// Clear cart functionality
const clearCart = () => {
    if (cart.length === 0) {
        showToast('Cart is already empty', 'warning');
        return;
    }

    if (confirm('Are you sure you want to clear your cart?')) {
        cart = [];
        appliedPromo = null;
        updateCartBadge();
        saveToStorage();
        showToast('Cart cleared', 'success');

        if (currentPage === 'cart') {
            renderCart();
        }
    }
};

// Initialize Application
const initializeApp = () => {
    loadFromStorage();
    updateCartBadge();
    renderProducts();

    // Event Listeners
    document.getElementById('searchProducts').addEventListener('input', handleSearch);
    document.getElementById('applyPromo').addEventListener('click', applyPromoCode);
    document.getElementById('proceedCheckout').addEventListener('click', () => showPage('checkout'));
    document.getElementById('backToCart').addEventListener('click', () => showPage('cart'));
    document.getElementById('checkoutForm').addEventListener('submit', handleCheckout);
    document.getElementById('addProductForm').addEventListener('submit', handleAddProduct);
    document.getElementById('productImage').addEventListener('change', handleImagePreview);
    document.getElementById('clearCart').addEventListener('click', clearCart);

    // Navigation event listeners
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => showPage(tab.dataset.page));
    });

    // Allow Enter key to apply promo code
    document.getElementById('promoCode').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyPromoCode();
        }
    });

    console.log('E-Commerce Cart System initialized successfully!');
    showToast('Welcome to E-Commerce Cart System!', 'success');
};

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);