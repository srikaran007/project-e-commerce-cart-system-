const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Body parser middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// In-memory storage (In production, use MongoDB/PostgreSQL)
let products = [
    {
        id: 'p1',
        name: 'Wireless Bluetooth Headphones',
        price: 2499,
        category: 'electronics',
        description: 'Premium wireless headphones with noise cancellation and 30-hour battery life.',
        image: '/images/Wireless Bluetooth Headphones.jpeg',
        stock: 50,
        createdAt: new Date().toISOString()
    },
    {
        id: 'p2',
        name: 'Smart Watch Series 5',
        price: 3999,
        category: 'electronics',
        description: 'Advanced smartwatch with health monitoring, GPS, and water resistance.',
        image: '/images/smart watch.jpeg',
        stock: 30,
        createdAt: new Date().toISOString()
    },
    {
        id: 'p3',
        name: 'Running Shoes Pro',
        price: 3199,
        category: 'sports',
        description: 'Professional running shoes with advanced cushioning and breathable material.',
        image: '/images/Running Shoes.jpeg',
        stock: 75,
        createdAt: new Date().toISOString()
    },
    {
        id: 'p4',
        name: 'Travel Backpack',
        price: 1499,
        category: 'travel',
        description: 'Durable travel backpack with multiple compartments and laptop sleeve.',
        image: '/images/Travel Backpack.jpeg',
        stock: 25,
        createdAt: new Date().toISOString()
    },
    {
        id: 'p5',
        name: 'Wireless Charger',
        price: 899,
        category: 'electronics',
        description: 'Fast wireless charging pad compatible with all Qi-enabled devices.',
        image: '/images/Wireless Charger.jpg',
        stock: 100,
        createdAt: new Date().toISOString()
    },
    {
        id: 'p6',
        name: 'Coffee Maker Deluxe',
        price: 4999,
        category: 'home',
        description: 'Premium coffee maker with built-in grinder and programmable settings.',
        image: '/images/Coffee Maker Deluxe.jpeg',
        stock: 15,
        createdAt: new Date().toISOString()
    }
];

let orders = [];
let carts = {};

// Promo codes configuration
const PROMO_CODES = {
    'SAVE10': { discount: 10, freeShipping: false },
    'FREESHIP': { discount: 0, freeShipping: true },
    'WELCOME20': { discount: 20, freeShipping: false },
    'COMBO25': { discount: 25, freeShipping: true }
};

const TAX_RATE = 0.05;
const DEFAULT_SHIPPING = 50;

// Helper functions
const calculateTotals = (cartItems, promoCode = null) => {
    const subtotal = cartItems.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    let discount = 0;
    let shipping = DEFAULT_SHIPPING;

    if (promoCode && PROMO_CODES[promoCode]) {
        const promoConfig = PROMO_CODES[promoCode];
        discount = subtotal * (promoConfig.discount / 100);
        if (promoConfig.freeShipping) {
            shipping = 0;
        }
    }

    const tax = (subtotal - discount) * TAX_RATE;
    const total = subtotal - discount + tax + shipping;

    return {
        subtotal: Math.round(subtotal * 100) / 100,
        discount: Math.round(discount * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        shipping: Math.round(shipping * 100) / 100,
        total: Math.round(total * 100) / 100
    };
};

// API Routes

// Get all products
app.get('/api/products', (req, res) => {
    try {
        const { search, category } = req.query;
        let filteredProducts = [...products];

        if (search) {
            filteredProducts = filteredProducts.filter(product =>
                product.name.toLowerCase().includes(search.toLowerCase()) ||
                product.description.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (category) {
            filteredProducts = filteredProducts.filter(product =>
                product.category === category
            );
        }

        res.json({
            success: true,
            data: filteredProducts,
            count: filteredProducts.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
            error: error.message
        });
    }
});

// Get single product
app.get('/api/products/:id', (req, res) => {
    try {
        const product = products.find(p => p.id === req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product',
            error: error.message
        });
    }
});

// Add new product (Admin)
app.post('/api/products', (req, res) => {
    try {
        const { name, price, category, description, image, stock } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({
                success: false,
                message: 'Name, price, and category are required'
            });
        }

        const newProduct = {
            id: uuidv4(),
            name,
            price: parseFloat(price),
            category,
            description: description || '',
            image: image || 'https://via.placeholder.com/400x300?text=New+Product',
            stock: parseInt(stock) || 0,
            createdAt: new Date().toISOString()
        };

        products.push(newProduct);

        res.status(201).json({
            success: true,
            data: newProduct,
            message: 'Product added successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to add product',
            error: error.message
        });
    }
});

// Get cart
app.get('/api/cart/:sessionId', (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const cart = carts[sessionId] || { items: [], promoCode: null };
        const totals = calculateTotals(cart.items, cart.promoCode);

        // Add product details to cart items
        const cartWithDetails = {
            ...cart,
            items: cart.items.map(item => {
                const product = products.find(p => p.id === item.productId);
                return {
                    ...item,
                    product: product
                };
            })
        };

        res.json({
            success: true,
            data: {
                cart: cartWithDetails,
                totals: totals
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cart',
            error: error.message
        });
    }
});

// Add to cart
app.post('/api/cart/:sessionId/add', (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const { productId, quantity = 1 } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        const product = products.find(p => p.id === productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (!carts[sessionId]) {
            carts[sessionId] = { items: [], promoCode: null };
        }

        const existingItem = carts[sessionId].items.find(item => item.productId === productId);

        if (existingItem) {
            existingItem.quantity += parseInt(quantity);
        } else {
            carts[sessionId].items.push({
                productId,
                quantity: parseInt(quantity),
                addedAt: new Date().toISOString()
            });
        }

        const totals = calculateTotals(carts[sessionId].items, carts[sessionId].promoCode);

        res.json({
            success: true,
            data: {
                cart: carts[sessionId],
                totals: totals
            },
            message: 'Product added to cart'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to add to cart',
            error: error.message
        });
    }
});

// Update cart item quantity
app.put('/api/cart/:sessionId/update', (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const { productId, quantity } = req.body;

        if (!carts[sessionId]) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const itemIndex = carts[sessionId].items.findIndex(item => item.productId === productId);

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        if (quantity <= 0) {
            carts[sessionId].items.splice(itemIndex, 1);
        } else {
            carts[sessionId].items[itemIndex].quantity = parseInt(quantity);
        }

        const totals = calculateTotals(carts[sessionId].items, carts[sessionId].promoCode);

        res.json({
            success: true,
            data: {
                cart: carts[sessionId],
                totals: totals
            },
            message: 'Cart updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update cart',
            error: error.message
        });
    }
});

// Apply promo code
app.post('/api/cart/:sessionId/promo', (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const { promoCode } = req.body;

        if (!carts[sessionId] || carts[sessionId].items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        if (!PROMO_CODES[promoCode]) {
            return res.status(400).json({
                success: false,
                message: 'Invalid promo code'
            });
        }

        carts[sessionId].promoCode = promoCode;
        const totals = calculateTotals(carts[sessionId].items, promoCode);

        res.json({
            success: true,
            data: {
                cart: carts[sessionId],
                totals: totals
            },
            message: 'Promo code applied successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to apply promo code',
            error: error.message
        });
    }
});

// Place order
app.post('/api/orders', (req, res) => {
    try {
        const { sessionId, customer } = req.body;

        if (!carts[sessionId] || carts[sessionId].items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        if (!customer || !customer.fullName || !customer.email) {
            return res.status(400).json({
                success: false,
                message: 'Customer information is required'
            });
        }

        const cart = carts[sessionId];
        const totals = calculateTotals(cart.items, cart.promoCode);

        // Create order
        const order = {
            id: uuidv4(),
            sessionId,
            customer,
            items: cart.items.map(item => {
                const product = products.find(p => p.id === item.productId);
                return {
                    ...item,
                    productName: product?.name || 'Unknown Product',
                    productPrice: product?.price || 0
                };
            }),
            totals,
            promoCode: cart.promoCode,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };

        orders.push(order);

        // Clear cart
        delete carts[sessionId];

        res.status(201).json({
            success: true,
            data: order,
            message: 'Order placed successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to place order',
            error: error.message
        });
    }
});

// Get orders (for a session or all)
app.get('/api/orders', (req, res) => {
    try {
        const { sessionId } = req.query;
        let filteredOrders = orders;

        if (sessionId) {
            filteredOrders = orders.filter(order => order.sessionId === sessionId);
        }

        res.json({
            success: true,
            data: filteredOrders,
            count: filteredOrders.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
});

// Get available promo codes
app.get('/api/promo-codes', (req, res) => {
    try {
        res.json({
            success: true,
            data: Object.keys(PROMO_CODES).map(code => ({
                code,
                ...PROMO_CODES[code]
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch promo codes',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});

// Serve the main HTML file for any non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 E-Commerce Cart System Server`);
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔌 API: http://localhost:${PORT}/api`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   GET  /api/products - Get all products`);
    console.log(`   POST /api/products - Add new product`);
    console.log(`   GET  /api/cart/:sessionId - Get cart`);
    console.log(`   POST /api/cart/:sessionId/add - Add to cart`);
    console.log(`   PUT  /api/cart/:sessionId/update - Update cart`);
    console.log(`   POST /api/cart/:sessionId/promo - Apply promo code`);
    console.log(`   POST /api/orders - Place order`);
    console.log(`   GET  /api/orders - Get orders`);
    console.log(`   GET  /api/promo-codes - Get promo codes`);
    console.log(`   GET  /api/health - Health check\n`);
});

module.exports = app;