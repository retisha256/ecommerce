// Checkout functionality
document.addEventListener('DOMContentLoaded', function() {
    loadCartToCheckout();
    setupCheckoutForm();
});

// Load cart items to checkout page
function loadCartToCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const orderItemsContainer = document.getElementById('order-items');
    const orderSubtotal = document.getElementById('order-subtotal');
    const orderTotal = document.getElementById('order-total');
    
    if (!orderItemsContainer) return;
    
    if (cart.length === 0) {
        orderItemsContainer.innerHTML = '<p>Your cart is empty</p>';
        orderSubtotal.textContent = 'UGX.0';
        orderTotal.textContent = 'UGX.0';
        return;
    }
    
    let total = 0;
    orderItemsContainer.innerHTML = cart.map(item => {
        const itemTotal = parseFloat(item.price.replace(/[^\d]/g, '')) * item.quantity;
        total += itemTotal;
        
        return `
            <div class="order-item">
                <div class="item-info">
                    <img src="${item.image}" alt="${item.name}" class="item-image">
                    <div class="item-details">
                        <h5>${item.name}</h5>
                        <small>${item.category}</small>
                    </div>
                </div>
                <div class="item-quantity">${item.quantity}</div>
                <div class="item-price">UGX.${itemTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
        `;
    }).join('');
    
    orderSubtotal.textContent = `UGX.${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    orderTotal.textContent = `UGX.${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

// Setup checkout form submission
function setupCheckoutForm() {
    const form = document.getElementById('checkout-form');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Client-side validation
        if (!validateCheckoutForm(form)) {
            return;
        }
        
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        
        // Get form data
        const formData = new FormData(form);
        const orderData = {
            customer: {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                city: formData.get('city'),
                notes: formData.get('notes') || ''
            },
            payment: formData.get('payment'),
            items: cart,
            total: calculateTotal(cart),
            date: new Date().toISOString()
        };
        
        // Process order
        processOrder(orderData);
    });
}

// Simple inline validation helpers
function validateCheckoutForm(form) {
    clearFormErrors(form);
    let isValid = true;

    const firstName = form.querySelector('#firstName');
    const lastName = form.querySelector('#lastName');
    const email = form.querySelector('#email');
    const phone = form.querySelector('#phone');
    const address = form.querySelector('#address');
    const city = form.querySelector('#city');
    const agree = form.querySelector('#agree');

    if (!firstName.value.trim()) {
        showFieldError(firstName, 'First name is required');
        isValid = false;
    }
    if (!lastName.value.trim()) {
        showFieldError(lastName, 'Last name is required');
        isValid = false;
    }
    if (!email.value.trim() || !/^\S+@\S+\.[\w-]{2,}$/.test(email.value)) {
        showFieldError(email, 'Enter a valid email address');
        isValid = false;
    }
    // Allow numbers, spaces, + and leading zeros; ensure 9-12 digits total
    const digits = phone.value.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 12) {
        showFieldError(phone, 'Enter a valid phone number');
        isValid = false;
    }
    if (!address.value.trim()) {
        showFieldError(address, 'Address is required');
        isValid = false;
    }
    if (!city.value.trim()) {
        showFieldError(city, 'City is required');
        isValid = false;
    }
    if (!agree.checked) {
        showFieldError(agree, 'You must agree to the Terms');
        isValid = false;
    }

    return isValid;
}

function showFieldError(inputEl, message) {
    const group = inputEl.closest('.form-group') || inputEl.parentElement;
    if (!group) return;
    const small = document.createElement('small');
    small.className = 'error-text';
    small.textContent = message;
    group.appendChild(small);
}

function clearFormErrors(form) {
    form.querySelectorAll('.error-text').forEach(el => el.remove());
}

// Calculate total
function calculateTotal(cart) {
    return cart.reduce((sum, item) => {
        return sum + (parseFloat(item.price.replace(/[^\d]/g, '')) * item.quantity);
    }, 0);
}

// Process order
function processOrder(orderData) {
    // Show loading state
    const submitButton = document.querySelector('#checkout-form button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Processing...';
    submitButton.disabled = true;
    
    // Generate mobile money payment request
    const paymentData = generateMobileMoneyPayment(orderData);
    
    // Show mobile money payment instructions
    showMobileMoneyInstructions(paymentData, orderData);
    
    // Reset button
    submitButton.textContent = originalText;
    submitButton.disabled = false;
}

// Generate mobile money payment request
function generateMobileMoneyPayment(orderData) {
    const orderId = 'ORD' + Date.now();
    const totalAmount = calculateTotal(orderData.items);
    
    return {
        orderId: orderId,
        amount: totalAmount,
        phone: orderData.customer.phone,
        paymentMethod: orderData.payment,
        timestamp: new Date().toISOString()
    };
}

// Show mobile money payment instructions
function showMobileMoneyInstructions(paymentData, orderData) {
    const paymentMethod = paymentData.paymentMethod === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money';
    const paymentNumber = paymentData.paymentMethod === 'mtn' ? '256754030391' : '256705030391';
    
    const instructionsHTML = `
        <div class="payment-instructions">
            <div class="payment-header">
                <h2>Complete Your Payment</h2>
                <p>Order ID: ${paymentData.orderId}</p>
            </div>
            
            <div class="payment-steps">
                <h3>Payment Instructions for ${paymentMethod}:</h3>
                <ol>
                    <li>Dial *${paymentData.paymentMethod === 'mtn' ? '165*3' : '*185*9*1'}# on your phone</li>
                    <li>Select "Send Money" or "Pay Bill"</li>
                    <li>Enter merchant number: <strong>${paymentNumber}</strong></li>
                    <li>Enter amount: <strong>UGX ${paymentData.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></li>
                    <li>Enter reference: <strong>${paymentData.orderId}</strong></li>
                    <li>Enter your PIN to complete payment</li>
                </ol>
                
                <div class="payment-alternative">
                    <h4>Alternative Payment Method:</h4>
                    <p>You can also pay directly via WhatsApp:</p>
                    <a href="https://wa.me/${paymentNumber}?text=Hi, I want to pay for Order ${paymentData.orderId} - UGX ${paymentData.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}" 
                       class="whatsapp-pay-btn" target="_blank">
                        <i class="fab fa-whatsapp"></i> Pay via WhatsApp
                    </a>
                </div>
                
                <div class="payment-verification">
                    <h4>After Payment:</h4>
                    <p>Once you've completed the payment, click the button below to confirm your order:</p>
                    <button class="confirm-payment-btn" onclick="confirmPayment('${paymentData.orderId}')">
                        I Have Made Payment
                    </button>
                </div>
                
                <div class="payment-note">
                    <p><strong>Note:</strong> Your order will be processed within 24 hours after payment confirmation.</p>
                </div>
            </div>
        </div>
    `;
    
    // Replace form with payment instructions
    const formContainer = document.querySelector('.checkout-form');
    formContainer.innerHTML = instructionsHTML;
    
    // Store order data for confirmation
    localStorage.setItem('pendingOrder', JSON.stringify(orderData));
    localStorage.setItem('paymentData', JSON.stringify(paymentData));
}

// Confirm payment
async function confirmPayment(orderId) {
    const orderData = JSON.parse(localStorage.getItem('pendingOrder'));
    const paymentData = JSON.parse(localStorage.getItem('paymentData'));
    
    if (orderData && paymentData) {
        try {
            // Add order ID to order data
            orderData.orderId = orderId;
            orderData.paymentStatus = 'pending';
            orderData.paymentMethod = paymentData.paymentMethod;
            
            // Save order to backend API
            if (typeof api !== 'undefined') {
                await api.createOrder(orderData);
                
                // Verify payment
                await api.verifyPayment({
                    orderId: orderId,
                    paymentReference: paymentData.paymentReference
                });
            } else {
                // Fallback to localStorage
                const orders = JSON.parse(localStorage.getItem('orders')) || [];
                orders.push(orderData);
                localStorage.setItem('orders', JSON.stringify(orders));
            }
            
            // Clear cart and pending data
            localStorage.removeItem('cart');
            localStorage.removeItem('pendingOrder');
            localStorage.removeItem('paymentData');
            
            // Show success message
            showOrderSuccess(orderData);
            
            // Update cart icon
            updateCartIcon();
            
        } catch (error) {
            console.error('Error confirming payment:', error);
            alert('Error confirming payment. Please try again or contact support.');
        }
    }
}

// Show order success message
function showOrderSuccess(orderData) {
    const successMessage = `
        <div class="order-success">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2>Order Placed Successfully!</h2>
            <p>Thank you for your order, ${orderData.customer.firstName}!</p>
            <p>Order Total: ${orderData.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p>Payment Method: ${orderData.payment.toUpperCase()}</p>
            <p>We'll send you a confirmation email shortly.</p>
            <div class="success-actions">
                <a href="index.html" class="normal">Continue Shopping</a>
                <a href="shop.html" class="normal">View Products</a>
            </div>
        </div>
    `;
    
    // Replace form with success message
    const formContainer = document.querySelector('.checkout-form');
    formContainer.innerHTML = successMessage;
    
    // Update cart icon
    updateCartIcon();
}

// Update cart icon
function updateCartIcon() {
    const cartIcons = document.querySelectorAll('.fa-cart-shopping');
    cartIcons.forEach(icon => {
        const existingBadge = icon.parentElement.querySelector('.cart-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
    });
}
