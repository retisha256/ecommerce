// Authentication functionality
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Initialize authentication
document.addEventListener('DOMContentLoaded', function() {
    setupAuthForms();
    updateAuthUI();
});

// Inject notification styles (only once)
(function injectAuthStyles(){
    const css = `
    .auth-notification { font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
    @keyframes slideIn { from { transform: translateY(-8px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
    .auth-notification .checkmark { width:28px; height:28px; flex:0 0 28px; }
    .auth-notification .msg { line-height:1.1; }
    .checkmark svg { width:28px; height:28px; }
    .checkmark .path { stroke-dasharray: 48; stroke-dashoffset: 48; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; fill:none; animation: dash 0.5s ease forwards 0.08s; }
    @keyframes dash { to { stroke-dashoffset: 0; } }
    `;
    const style = document.createElement('style');
    style.id = 'auth-notification-styles';
    style.appendChild(document.createTextNode(css));
    if (!document.getElementById('auth-notification-styles')) document.head.appendChild(style);
})();

// Ensure a notification container exists (for accessibility)
document.addEventListener('DOMContentLoaded', function(){
    if (!document.getElementById('auth-notification-container')){
        const container = document.createElement('div');
        container.id = 'auth-notification-container';
        container.setAttribute('aria-live','polite');
        container.setAttribute('role','status');
        container.style.cssText = 'position:fixed; top:16px; right:16px; z-index:10000; display:flex; flex-direction:column; gap:8px;';
        document.body.appendChild(container);
    }
});

// Setup authentication forms
function setupAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password'),
        rememberMe: document.getElementById('rememberMe').checked
    };
    
    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Signing In...';
        submitBtn.disabled = true;
        
        // Simulate API call (replace with actual backend integration)
        const user = await simulateLogin(loginData);
        
        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            updateAuthUI();
            showAuthNotification('Login successful! Welcome back.', 'success');
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showAuthNotification('Invalid email or password. Please try again.', 'error');
        }
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
    } catch (error) {
        console.error('Login error:', error);
        showAuthNotification('Login failed. Please try again.', 'error');
        
        // Reset button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Sign In';
        submitBtn.disabled = false;
    }
}

// Handle signup
async function handleSignup(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const signupData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword')
    };
    
    // Validate passwords match
    if (signupData.password !== signupData.confirmPassword) {
        showAuthNotification('Passwords do not match. Please try again.', 'error');
        return;
    }
    
    // Validate password strength
    if (signupData.password.length < 6) {
        showAuthNotification('Password must be at least 6 characters long.', 'error');
        return;
    }
    
    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating Account...';
        submitBtn.disabled = true;
        
        // Simulate API call (replace with actual backend integration)
        const user = await simulateSignup(signupData);
        
        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            updateAuthUI();
            showAuthNotification('Account created successfully! Redirecting to login...', 'success');
            
            // Redirect to LOGIN form (not home page)
            setTimeout(() => {
                // Show login tab and hide signup
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                const loginForm = document.getElementById('login-form');
                if (loginForm) {
                    loginForm.classList.add('active');
                    // Find and activate the login tab
                    document.querySelectorAll('[onclick*="showTab"]').forEach(tab => {
                        if (tab.textContent.includes('Sign In')) {
                            tab.classList.add('active');
                        }
                    });
                }
                // Clear signup form
                document.getElementById('signupForm').reset();
                showAuthNotification('Please log in with your new credentials', 'info');
            }, 1500);
        } else {
            showAuthNotification('Account creation failed. Please try again.', 'error');
        }
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
    } catch (error) {
        console.error('Signup error:', error);
        showAuthNotification('Account creation failed. Please try again.', 'error');
        
        // Reset button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Create Account';
        submitBtn.disabled = false;
    }
}

// Simulate login (replace with actual API call)
async function simulateLogin(loginData) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Check if user exists in localStorage
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email === loginData.email && u.password === loginData.password);
            
            if (user) {
                resolve({
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    isLoggedIn: true
                });
            } else {
                resolve(null);
            }
        }, 1000);
    });
}

// Simulate signup (replace with actual API call)
async function simulateSignup(signupData) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Check if user already exists
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const existingUser = users.find(u => u.email === signupData.email);
            
            if (existingUser) {
                resolve(null);
                return;
            }
            
            // Create new user
            const newUser = {
                id: Date.now().toString(),
                firstName: signupData.firstName,
                lastName: signupData.lastName,
                email: signupData.email,
                phone: signupData.phone,
                password: signupData.password,
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            resolve({
                id: newUser.id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                phone: newUser.phone,
                isLoggedIn: true
            });
        }, 1000);
    });
}

// Show authentication notification
function showAuthNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `auth-notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.28s ease;
        max-width: 420px;
        display:flex; align-items:center; gap:12px;
    `;

    // Build inner content with optional animated checkmark for success
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #10B981, #059669)';
        notification.innerHTML = `
            <div class="checkmark" aria-hidden>
              <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
                <circle cx="26" cy="26" r="25" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" />
                <path class="path" fill="none" stroke="#fff" d="M14 27 l8 8 l16 -16" />
              </svg>
            </div>
            <div class="msg">${message}</div>
        `;
    } else if (type === 'info') {
        notification.style.background = 'linear-gradient(135deg, #3B82F6, #2563EB)';
        notification.innerHTML = `<div class="msg">${message}</div>`;
    } else {
        // error or default
        notification.style.background = 'linear-gradient(135deg, #EF4444, #DC2626)';
        notification.innerHTML = `<div class="msg">${message}</div>`;
    }

    // Append into the notification container for aria-live
    const container = document.getElementById('auth-notification-container') || document.body;
    // Make notification keyboard-focusable and dismissible
    notification.tabIndex = 0;
    notification.setAttribute('role','alert');
    notification.style.cursor = 'pointer';
    const removeNotification = () => { if (notification && notification.parentNode) notification.parentNode.removeChild(notification); };
    notification.addEventListener('click', removeNotification);
    notification.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') removeNotification(); });

    container.appendChild(notification);

    // Remove notification after 4 seconds
    const timeoutId = setTimeout(() => { removeNotification(); }, 4000);
    // Clear timeout if removed manually
    notification.addEventListener('remove', () => clearTimeout(timeoutId));
}

// Update authentication UI
function updateAuthUI() {
    // Update navigation based on login status
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    // Update logout button visibility in shop.html
    const logoutBtnShop = document.getElementById('account-logout');
    if (logoutBtnShop && currentUser) {
        logoutBtnShop.style.display = 'flex';
        logoutBtnShop.addEventListener('click', (e) => { e.preventDefault(); logout(); });
    } else if (logoutBtnShop) {
        logoutBtnShop.style.display = 'none';
    }

    // Update account dropdown if present (preferred)
    const accountMenu = document.getElementById('account-menu');
    if (accountMenu) {
        accountMenu.innerHTML = '';
        if (currentUser) {
            accountMenu.innerHTML = `
                <a href="#" class="dropdown-item" id="account-logout"><i class="fas fa-sign-out-alt"></i> Logout</a>
                <a href="#" class="dropdown-item"><i class="fas fa-user"></i> ${currentUser.firstName}</a>
            `;
            // Attach logout handler
            const logoutEl = document.getElementById('account-logout');
            if (logoutEl) logoutEl.addEventListener('click', (e) => { e.preventDefault(); logout(); });
        } else {
            accountMenu.innerHTML = `
                <a href="login.html" class="dropdown-item"><i class="fas fa-sign-in-alt"></i> Sign In</a>
                <a href="login.html" class="dropdown-item"><i class="fas fa-user-plus"></i> Create Account</a>
            `;
        }
        return;
    }

    // Fallback: append standalone auth links to navbar
    const existing = navbar.querySelector('.auth-links');
    if (existing) existing.remove();
    const authLinks = document.createElement('div');
    authLinks.className = 'auth-links';
    if (currentUser) {
        authLinks.innerHTML = `
            <li><a href="#" onclick="logout()">Logout</a></li>
            <li><a href="#" class="user-profile"><i class="fas fa-user"></i> ${currentUser.firstName}</a></li>
        `;
    } else {
        authLinks.innerHTML = `
            <li><a href="login.html">Login</a></li>
            <li><a href="login.html">Sign Up</a></li>
        `;
    }
    navbar.appendChild(authLinks);
}

// Logout function
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart');  // Clear shopping cart
    updateAuthUI();
    if (typeof updateCartIcon === 'function') updateCartIcon();
    showAuthNotification('You have been logged out successfully. Your cart has been cleared.', 'success');
    
    // Redirect to home page
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// Show/hide auth tabs
function showTab(tabName) {
    // Hide all forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected form
    document.getElementById(tabName + '-form').classList.add('active');
    
    // Add active class to selected tab
    event.target.classList.add('active');
}

// Check if user is logged in
function isLoggedIn() {
    return currentUser !== null;
}

// Get current user
function getCurrentUser() {
    return currentUser;
}
