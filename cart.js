// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Initialize cart display
document.addEventListener('DOMContentLoaded', function() {
    updateCartDisplay();
    updateCartIcon(); // Initial icon update
});

// Add product to cart
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        // Ensure price is stored correctly when adding
        const priceNumber = typeof product.price === 'string' 
                            ? parseFloat(product.price.replace(/[^\d.-]/g, '')) || 0 
                            : (typeof product.price === 'number' ? product.price : 0);

        cart.push({
            ...product,
            price: `UGX.${priceNumber.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, // Store with formatting (no decimals)
            _priceValue: priceNumber, // Store raw number value
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay(); // Update cart page if open
    updateCartIcon();    // Update navbar icon count
    showCartNotification();
}

// Remove product from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    updateCartIcon();
}

// Update product quantity (e.g., from +/- buttons, not direct input)
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId); // Remove if quantity is zero or less
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartDisplay();
            updateCartIcon();
        }
    }
}

// *** UPDATED FUNCTION ***
// Update cart display on the dedicated cart page (cart.html)
function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartTotal = document.getElementById('cart-total');
    
    // Only proceed if we are on the cart page (these elements exist)
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
        // Ensure subtotal/total elements exist before updating
        if (cartSubtotal) cartSubtotal.textContent = 'UGX.0';
        if (cartTotal) cartTotal.textContent = 'UGX.0';
        return;
    }
    
    let total = 0;
    cartItemsContainer.innerHTML = cart.map(item => {
        
        // Prefer raw stored value when present; fallback to robust parsing
        let priceNumber = (typeof item._priceValue === 'number' && !isNaN(item._priceValue)) 
            ? item._priceValue 
            : (function() {
                let priceString = String(item.price || '0');
                priceString = priceString.replace(/ugx\.?\s?/i, ''); // remove UGX prefix
                priceString = priceString.replace(/,/g, ''); // remove commas
                return parseFloat(priceString) || 0;
            })();

        const itemTotal = priceNumber * item.quantity;
        total += itemTotal;
        
        // Use the original formatted price for display, calculated price for subtotal
        const displayPrice = item.price || `UGX.${priceNumber.toLocaleString(undefined, { maximumFractionDigits: 0 })}`; 

        return `
            <tr>
                <td><a href="#" onclick="event.preventDefault(); removeFromCart('${item.id}')"><i class="far fa-times-circle"></i></a></td>
                <td><img src="${item.image}" alt="${item.name}" style="width: 50px; height: auto;"></td>
                <td>
                    <h5>${item.name}</h5>
                    <small>${item.category || ''}</small> 
                </td>
                <td>${displayPrice}</td> 
                <td>
                    <input type="number" value="${item.quantity}" min="1" 
                           style="width: 60px; text-align: center;"
                           onchange="updateQuantityFromInput('${item.id}', this.value)">
                </td>
                <td>UGX.${itemTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td> 
            </tr>
        `;
    }).join('');
    
    // Update totals if elements exist
    if (cartSubtotal) cartSubtotal.textContent = `UGX.${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    if (cartTotal) cartTotal.textContent = `UGX.${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}


// Update quantity specifically from the input field on the cart page
function updateQuantityFromInput(productId, newQuantity) {
    const quantity = parseInt(newQuantity);
    
    // Validate quantity is a positive number
    if (isNaN(quantity) || quantity <= 0) {
        // If invalid, remove the item
        removeFromCart(productId);
        return; 
    }

    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = quantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay(); // Update cart table totals
        updateCartIcon();    // Update navbar icon count
    }
}


// Update ONLY the cart icons in the main navigation bar (#navbar and #mobile)
function updateCartIcon() {
    // Select only the cart icons within the main navigation areas
    const cartIcons = document.querySelectorAll('#lg-cart .fa-cart-shopping, #mobile .fa-cart-shopping');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    cartIcons.forEach(icon => {
        let badgeContainer = icon.parentElement; // The <a> tag usually

        // Ensure the container is suitable for positioning the badge
        if (badgeContainer && window.getComputedStyle(badgeContainer).position === 'static') {
            badgeContainer.style.position = 'relative'; // Needed for absolute positioning of badge
        }

        // Remove existing badge first
        const existingBadge = badgeContainer ? badgeContainer.querySelector('.cart-badge') : null;
        if (existingBadge) {
            existingBadge.remove();
        }
        
        // Add new badge only if there are items in the cart
        if (totalItems > 0 && badgeContainer) {
            const badge = document.createElement('span');
            badge.className = 'cart-badge'; // Ensure this class is styled in your CSS
            badge.textContent = totalItems;
            
            // Basic styling for the badge (Add this to your style.css for better control)
            badge.style.cssText = `
                position: absolute;
                top: -8px;       /* Adjust position as needed */
                right: -10px;    /* Adjust position as needed */
                background-color: red;
                color: white;
                border-radius: 50%;
                padding: 2px 6px;
                font-size: 10px;
                font-weight: bold;
                line-height: 1;
                min-width: 18px; /* Ensure circle shape for single digit */
                text-align: center;
                z-index: 1; /* Ensure badge is above icon */
            `;
            
            badgeContainer.appendChild(badge);
        }
    });
}


// Show cart notification (popup)
function showCartNotification() {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = 'Product added to cart!';
    // Apply basic styles (consider moving to CSS)
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #088178; /* Theme color */
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 10001; /* High z-index */
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-size: 1rem;
        font-weight: 500;
        opacity: 0; /* Start hidden */
        transform: translateX(100%); /* Start off-screen */
        transition: opacity 0.3s ease, transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10); // Small delay to allow transition

    // Animate out and remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
             if (notification.parentNode) { // Check if it's still in the DOM
                notification.remove();
             }
        }, 300); // Wait for animation to finish
    }, 3000); // Notification duration
}


// Proceed to checkout page
function proceedToCheckout() {
    if (cart.length === 0) {
        // Replace alert with a nicer modal or message if possible
        alert('Your cart is empty! Please add items before proceeding.'); 
        return;
    }
    // Redirect to your checkout page
    window.location.href = 'checkout.html'; 
}


// Product data - will eventually be loaded from an API
let products = [];

// Load products (currently uses fallback sample data)
async function loadProducts() {
    try {
        // Placeholder for API call - Replace with your actual API endpoint if available
        if (typeof api !== 'undefined' && typeof api.getProducts === 'function') {
             const response = await api.getProducts();
             // Assuming API returns { data: [...] } structure
             products = response.data || []; 
             console.log("Products loaded from API:", products);
        } else {
             console.log("API not available, using fallback product data.");
             throw new Error("API not defined or getProducts not a function"); // Force fallback
        }

        // Basic validation of loaded product data
        if (!Array.isArray(products) || products.length === 0) {
            console.warn("API returned invalid or empty product data, using fallback.");
            throw new Error("Invalid product data from API");
        }

    } catch (error) {
        console.error('Error loading products, using fallback:', error);
        // Fallback sample data - Make sure image paths are correct relative to HTML file
        products = [
            { _id: 'iphone-xr', name: 'Iphone XR', category: 'Mobile devices', price: 2000000, image: 'jpeg.jpeg' },
            { _id: 'cctv-camera', name: 'CCTV Camera', category: 'Home security', price: 350000, image: 'security.jpeg' },
            { _id: 'jbl-speaker', name: 'JBL Speaker', category: 'Smart devices', price: 150000, image: 'portablespeaker.jpeg' },
            { _id: 'iwatch', name: 'Iwatch', category: 'Mobile devices', price: 80000, image: 'watch.jpeg' },
            { _id: 'ipad', name: 'Ipad', category: 'Tablet', price: 450000, image: 'jpeg1.jpeg' },
            { _id: 'earpods', name: 'Ear pods', category: 'Phone accesories', price: 20000, image: 'airpods.jpeg' }
        ];
        console.log("Using fallback products:", products);
    }

    // Ensure prices are consistently numbers if not already
    products = products.map(p => ({
        ...p,
        // Attempt to convert price string (like "UGX.2,000,000") to number
        price: typeof p.price === 'string' 
               ? parseFloat(p.price.replace(/[^\d.-]/g, '')) || 0 
               : (typeof p.price === 'number' ? p.price : 0)
    }));
}


// Add click handlers to "Add to Cart" buttons after products are loaded
document.addEventListener('DOMContentLoaded', async function() {
    
    // Load products first
    await loadProducts();
    
    // Find all "Add to Cart" icons/buttons
    const cartButtons = document.querySelectorAll('.cart'); 

    cartButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default link behavior
            
            // Find the closest parent product container element
            const productElement = this.closest('.Pro'); 
            
            if (productElement) {
                // Extract identifier (assuming the <span> holds the unique name used as ID in sample data)
                const productNameSpan = productElement.querySelector('.des span');
                const productIDAttempt = productNameSpan ? productNameSpan.textContent.trim() : null;

                // Attempt to find the full product details from the loaded 'products' array
                // We match based on the name extracted from the span, case-insensitive.
                const productData = products.find(p => p.name.trim().toLowerCase() === productIDAttempt?.toLowerCase());
                
                if (productData) {
                    // Prepare the product object in the format needed for the cart
                    const cartProduct = {
                        id: productData._id, // Use the actual ID from loaded data
                        name: productData.name,
                        category: productData.category,
                        // Format price for display, but ensure it was loaded as a number
                        price: `UGX.${(productData.price || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 
                        image: productData.image // Use the image path from loaded data
                    };
                    addToCart(cartProduct);
                } else {
                    console.warn(`Product data not found for item: ${productIDAttempt}. Check if products loaded correctly or if HTML matches data.`);
                }
            } else {
                console.error("Could not find parent '.Pro' element for the clicked cart button.");
            }
        });
    });

    // Initial cart display update (for cart page) and icon update (for navbar)
    // Run these AFTER attaching handlers
    updateCartDisplay(); 
    updateCartIcon(); 
});

