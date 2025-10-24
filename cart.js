// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Initialize cart display
document.addEventListener('DOMContentLoaded', function() {
    updateCartDisplay();
    updateCartIcon();
});

// Add product to cart
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    updateCartIcon();
    showCartNotification();
}

// Remove product from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    updateCartIcon();
}

// Update product quantity
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartDisplay();
            updateCartIcon();
        }
    }
}

// Update cart display on cart page
function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartTotal = document.getElementById('cart-total');
    
    if (!cartItemsContainer) return;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 50px;">
                    <h3>Your cart is empty</h3>
                    <a href="shop.html" class="normal">Continue Shopping</a>
                </td>
            </tr>
        `;
        cartSubtotal.textContent = 'UGX.0';
        cartTotal.textContent = 'UGX.0';
        return;
    }
    
    let total = 0;
    cartItemsContainer.innerHTML = cart.map(item => {
        const itemTotal = parseFloat(item.price.replace(/[^\d]/g, '')) * item.quantity;
        total += itemTotal;
        
        return `
            <tr>
                <td><a href="#" onclick="removeFromCart('${item.id}')"><i class="far fa-times-circle"></i></a></td>
                <td><img src="${item.image}" alt="${item.name}"></td>
                <td>
                    <h5>${item.name}</h5>
                    <small>${item.category}</small>
                </td>
                <td>${item.price}</td>
                <td>
                    <input type="number" value="${item.quantity}" min="1" 
                           onchange="updateQuantityFromInput('${item.id}', this.value)">
                </td>
                <td>UGX.${itemTotal.toLocaleString()}</td>
            </tr>
        `;
    }).join('');
    
    cartSubtotal.textContent = `UGX.${total.toLocaleString()}`;
    cartTotal.textContent = `UGX.${total.toLocaleString()}`;
}

// Update quantity from input field
function updateQuantityFromInput(productId, newQuantity) {
    const quantity = parseInt(newQuantity);
    if (quantity > 0) {
        const item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity = quantity;
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartDisplay();
            updateCartIcon();
        }
    }
}

// Update cart icon with item count
function updateCartIcon() {
    const cartIcons = document.querySelectorAll('.fa-cart-shopping');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    cartIcons.forEach(icon => {
        // Remove existing badge
        const existingBadge = icon.parentElement.querySelector('.cart-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        // Add new badge if there are items
        if (totalItems > 0) {
            const badge = document.createElement('span');
            badge.className = 'cart-badge';
            badge.textContent = totalItems;
            
            // Ensure parent element has relative positioning
            if (icon.parentElement.style.position !== 'relative') {
                icon.parentElement.style.position = 'relative';
            }
            
            icon.parentElement.appendChild(badge);
        }
    });
    
    // Also update the mobile cart icon
    const mobileCartIcon = document.querySelector('#mobile .fa-cart-shopping');
    if (mobileCartIcon) {
        const existingBadge = mobileCartIcon.parentElement.querySelector('.cart-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        if (totalItems > 0) {
            const badge = document.createElement('span');
            badge.className = 'cart-badge';
            badge.textContent = totalItems;
            mobileCartIcon.parentElement.style.position = 'relative';
            mobileCartIcon.parentElement.appendChild(badge);
        }
    }
}

// Show cart notification
function showCartNotification() {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = 'Product added to cart!';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #088178;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Proceed to checkout
function proceedToCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    window.location.href = 'checkout.html';
}

// Product data - will be loaded from API
let products = [];

// Load products from API
async function loadProducts() {
    try {
        if (typeof api !== 'undefined') {
            const response = await api.getProducts();
            products = response.data || [];
        } else {
            // Fallback to sample data if API is not available
            products = [
                {
                    _id: 'iphone-xr',
                    name: 'iPhone XR',
                    category: 'Mobile devices',
                    price: 2000000,
                    image: 'jpeg.jpeg'
                },
                {
                    _id: 'cctv-camera',
                    name: 'CCTV Camera',
                    category: 'Home security',
                    price: 350000,
                    image: 'security.jpeg'
                },
                {
                    _id: 'jbl-speaker',
                    name: 'JBL Speaker',
                    category: 'Smart devices',
                    price: 150000,
                    image: 'portablespeaker.jpeg'
                },
                {
                    _id: 'iwatch',
                    name: 'iWatch',
                    category: 'Mobile devices',
                    price: 80000,
                    image: 'watch.jpeg'
                },
                {
                    _id: 'ipad',
                    name: 'iPad',
                    category: 'Tablet',
                    price: 450000,
                    image: 'jpeg1.jpeg'
                },
                {
                    _id: 'earpods',
                    name: 'Ear Pods',
                    category: 'Phone accessories',
                    price: 20000,
                    image: 'airpods.jpeg'
                }
            ];
        }
    } catch (error) {
        console.error('Error loading products:', error);
        // Use fallback data
        products = [
            {
                _id: 'iphone-xr',
                name: 'iPhone XR',
                category: 'Mobile devices',
                price: 2000000,
                image: 'jpeg.jpeg'
            },
            {
                _id: 'cctv-camera',
                name: 'CCTV Camera',
                category: 'Home security',
                price: 350000,
                image: 'security.jpeg'
            },
            {
                _id: 'jbl-speaker',
                name: 'JBL Speaker',
                category: 'Smart devices',
                price: 150000,
                image: 'portablespeaker.jpeg'
            },
            {
                _id: 'iwatch',
                name: 'iWatch',
                category: 'Mobile devices',
                price: 80000,
                image: 'watch.jpeg'
            },
            {
                _id: 'ipad',
                name: 'iPad',
                category: 'Tablet',
                price: 450000,
                image: 'jpeg1.jpeg'
            },
            {
                _id: 'earpods',
                name: 'Ear Pods',
                category: 'Phone accessories',
                price: 20000,
                image: 'airpods.jpeg'
            }
        ];
    }
}

// Add click handlers to cart buttons
document.addEventListener('DOMContentLoaded', async function() {
    // Load products from API
    await loadProducts();
    
    const cartButtons = document.querySelectorAll('.cart');
    cartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Find the product data from the clicked item
            const productElement = this.closest('.Pro');
            if (productElement) {
                const productName = productElement.querySelector('.des h5').textContent;
                const productPrice = productElement.querySelector('.des h4').textContent;
                const productImage = productElement.querySelector('img').src.split('/').pop();
                const productSpan = productElement.querySelector('.des span').textContent;
                
                // Find matching product in products data
                const product = products.find(p => p.name === productSpan);
                
                if (product) {
                    // Convert product to cart format
                    const cartProduct = {
                        id: product._id,
                        name: product.name,
                        category: product.category,
                        price: `UGX.${product.price.toLocaleString()}`,
                        image: product.image
                    };
                    addToCart(cartProduct);
                } else {
                    // Fallback: create product object from DOM data
                    const fallbackProduct = {
                        id: productSpan.toLowerCase().replace(/\s+/g, '-'),
                        name: productSpan,
                        category: productName,
                        price: productPrice,
                        image: productImage
                    };
                    addToCart(fallbackProduct);
                }
            }
        });
    });
});
