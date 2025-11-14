// Authentication functionality
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Initialize authentication
document.addEventListener('DOMContentLoaded', function() {
    setupAuthForms();
    updateAuthUI();
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
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #10B981, #059669)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #EF4444, #DC2626)';
    }
    
    document.body.appendChild(notification);
    
    // Remove notification after 4 seconds
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

// Update authentication UI
function updateAuthUI() {
    // Update navigation based on login status
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

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
