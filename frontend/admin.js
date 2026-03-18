// Admin Management System
// Consolidates Authentication, Product Management, and Order Tracking

document.addEventListener('DOMContentLoaded', () => {
  // Constants and State
  const ADMIN_AUTH_KEY = 'adminAuthenticated';
  const ADMIN_SESSION_KEY = 'adminSessionActive';
  const ADMIN_PASSWORD = 'admin123';

  // DOM Elements
  const loginModal = document.getElementById('admin-login-modal');
  const adminContent = document.querySelector('.admin-content');
  const loginForm = document.getElementById('admin-login-form');
  const passwordInput = document.getElementById('admin-password');
  const closeLoginBtn = document.getElementById('close-login-modal');
  const forgotBtn = document.getElementById('forgot-password-btn');

  const productForm = document.getElementById('admin-product-form');
  const recentProductsContainer = document.getElementById('recent-products');
  const productsList = document.getElementById('products-list');

  const editModal = document.getElementById('edit-modal');
  const closeEditModalBtn = document.querySelector('#edit-modal .close-modal');
  const editProductForm = document.getElementById('edit-product-form');
  const editIdInput = document.getElementById('edit-product-id');
  const editNameInput = document.getElementById('edit-name');
  const editCategoryInput = document.getElementById('edit-category');
  const editPriceInput = document.getElementById('edit-price');
  const editStockInput = document.getElementById('edit-stock');
  const editDescriptionInput = document.getElementById('edit-description');

  // ===============================
  // AUTHENTICATION LOGIC
  // ===============================

  const wasAuthenticated = sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  const isAuthenticated = sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true' && wasAuthenticated;

  function showLoginModal() {
    if (loginModal) loginModal.style.display = 'flex';
    if (adminContent) adminContent.style.display = 'none';
  }

  function showAdminContent() {
    if (loginModal) loginModal.style.display = 'none';
    if (adminContent) adminContent.style.display = 'block';
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');

    // Initial data load
    loadAllProducts();
    loadPendingOrders();

    // Start auto-refresh for orders
    startOrdersRefresh();
    // Add logout button to navbar
    addLogoutButton();
  }

  function logout() {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    stopOrdersRefresh();
    showLoginModal();
    toast('You have been logged out', 'error');
  }

  // Initial Auth Check
  if (!isAuthenticated) {
    showLoginModal();
  } else {
    showAdminContent();
  }

  // Login Form Events
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const override = sessionStorage.getItem('ADMIN_PASSWORD_OVERRIDE');
      const finalPassword = override || ADMIN_PASSWORD;

      if (passwordInput.value === finalPassword) {
        sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        showAdminContent();
        toast('Admin access granted', 'success');
      } else {
        alert('❌ Incorrect password.');
      }
    });
  }

  if (closeLoginBtn) {
    closeLoginBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  if (forgotBtn) {
    forgotBtn.addEventListener('click', () => {
      const code = prompt('Enter reset code:');
      if (code !== 'reset123') {
        alert('❌ Wrong reset code');
        return;
      }
      const newPass = prompt('Enter new password:');
      if (newPass && newPass.length >= 6) {
        sessionStorage.setItem('ADMIN_PASSWORD_OVERRIDE', newPass);
        alert('Password reset. Use it to log in.');
      } else {
        alert('Password must be at least 6 characters.');
      }
    });

    // Add hover effect
    forgotBtn.addEventListener('mouseenter', function() {
      this.style.background = '#FF6B6B';
      this.style.color = 'white';
    });

    forgotBtn.addEventListener('mouseleave', function() {
      this.style.background = '#FFB74D';
      this.style.color = '#1a1a1a';
    });
  }

  // Auto-logout features
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true') {
      setTimeout(() => {
        if (document.hidden) logout();
      }, 300000); // 5 minutes inactivity
    }
  });

  function addLogoutButton() {
    const navbar = document.getElementById('navbar');
    if (navbar && !document.getElementById('admin-logout')) {
      const logoutLi = document.createElement('li');
      logoutLi.innerHTML = '<a href="#" id="admin-logout" style="color: #FF6B6B;"><i class="fas fa-sign-out-alt"></i> Logout</a>';
      navbar.appendChild(logoutLi);
      document.getElementById('admin-logout').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    }
  }

  // ===============================
  // PRODUCT MANAGEMENT
  // ===============================

  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(productForm);
      try {
        if (typeof api !== 'undefined') {
          await api.createProduct(formData);
          toast('Product created successfully');
          loadAllProducts();
          productForm.reset();
        }
      } catch (err) {
        console.error(err);
        toast('Failed to create product', 'error');
      }
    });
  }

  async function loadAllProducts() {
    try {
      if (typeof api !== 'undefined') {
        const response = await api.getProducts({ limit: 100 });
        const products = response.data || [];
        if (productsList) productsList.innerHTML = '';
        if (recentProductsContainer) recentProductsContainer.innerHTML = '';

        products.forEach(p => renderProductCard(p));
        if (products.length > 0) appendRecent(products[products.length - 1]);
      }
    } catch (error) {
      console.error(error);
      toast('Could not load products', 'error');
    }
  }

  function renderProductCard(p) {
    if (!productsList) return;
    const el = document.createElement('div');
    el.className = 'Pro';
    const imgSrc = p.image || 'img1.png';
    const stockStatus = p.stock > 0
      ? `<div style="color: #28a745; font-weight: 600; margin-top: 5px; font-size: 14px;"><i class="fas fa-check-circle"></i> In Stock (${p.stock})</div>`
      : `<div style="color: #dc2626; font-weight: 600; margin-top: 5px; font-size: 14px;"><i class="fas fa-times-circle"></i> Out of Stock</div>`;

    el.innerHTML = `
      <img src="${imgSrc}" alt="${p.name}" onerror="this.src='img1.png'">
      <div class="des">
        <span>${p.name}</span>
        <h5>${p.category}</h5>
        <h4>UGX ${Number(p.price).toLocaleString()}</h4>
        ${stockStatus}
      </div>
      <div class="btn-container">
        <button class="normal edit-btn" style="background: linear-gradient(135deg, #088178, #06655e);"><i class="fas fa-edit"></i> Edit</button>
        <button class="normal delete-btn" style="background: linear-gradient(135deg, #dc2626, #b91c1c);"><i class="fas fa-trash"></i> Delete</button>
      </div>
    `;

    el.querySelector('.edit-btn').addEventListener('click', () => openEditModal(p));
    el.querySelector('.delete-btn').addEventListener('click', () => deleteProduct(p._id));
    productsList.appendChild(el);
  }

  function appendRecent(p) {
    if (!recentProductsContainer) return;
    const el = document.createElement('div');
    el.className = 'Pro';
    el.innerHTML = `
      <img src="${p.image || 'img1.png'}" alt="${p.name}" onerror="this.src='img1.png'">
      <div class="des">
        <span>${p.name}</span>
        <h5>${p.category}</h5>
        <h4>UGX ${Number(p.price).toLocaleString()}</h4>
      </div>
    `;
    recentProductsContainer.prepend(el);
  }

  function openEditModal(p) {
    if (!editModal) return;
    editIdInput.value = p._id;
    editNameInput.value = p.name;
    editCategoryInput.value = p.category;
    editPriceInput.value = p.price;
    editStockInput.value = p.stock || 0;
    editDescriptionInput.value = p.description || '';
    editModal.style.display = 'flex';
  }

  if (editProductForm) {
    editProductForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = editIdInput.value;
      const formData = new FormData(editProductForm);
      try {
        await api.updateProduct(id, formData);
        toast('Product updated successfully');
        editModal.style.display = 'none';
        editProductForm.reset();
        loadAllProducts();
      } catch (error) {
        toast('Failed to update', 'error');
      }
    });
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    try {
      await api.deleteProduct(id);
      toast('Deleted successfully');
      loadAllProducts();
    } catch (error) {
      toast('Failed to delete', 'error');
    }
  }

  if (closeEditModalBtn) {
    closeEditModalBtn.addEventListener('click', () => editModal.style.display = 'none');
  }

  // ===============================
  // ORDER MANAGEMENT
  // ===============================

  window.updateOrderStatus = async function (orderId, status) {
    try {
      if (typeof api !== 'undefined') {
        const updateData = status === 'confirmed' ? { paymentStatus: 'confirmed', orderStatus: 'confirmed' } : { orderStatus: status };
        await api.updateOrderStatus(orderId, updateData);
        toast(`Order ${status} successfully`);
        loadPendingOrders();
      }
    } catch (error) {
      toast('Error updating order', 'error');
    }
  };

  window.clearOrder = async function (orderId) {
    if (!confirm('Clear this order?')) return;
    try {
      await api.deleteOrder(orderId);
      toast('Order cleared');
      loadPendingOrders();
    } catch (error) {
      toast('Error clearing order', 'error');
    }
  };

  window.clearCompletedOrders = async function() {
    if (!confirm('Clear all completed orders?')) return;
    try {
      const response = await api.getOrders();
      const orders = response.data || [];
      const completedOrders = orders.filter(o => o.paymentStatus === 'confirmed');
      
      for (const order of completedOrders) {
        await api.deleteOrder(order._id || order.orderId);
      }
      toast('Completed orders cleared');
      loadPendingOrders();
    } catch (error) {
      toast('Error clearing orders', 'error');
    }
  };

  async function loadPendingOrders() {
    try {
      if (typeof api !== 'undefined') {
        const response = await api.getOrders();
        const orders = response.data || [];

        // Stats
        document.getElementById('pending-count').textContent = orders.filter(o => o.paymentStatus === 'pending').length;
        document.getElementById('total-orders-count').textContent = orders.length;
        const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
        document.getElementById('total-revenue').textContent = `UGX ${revenue.toLocaleString()}`;

        const container = document.getElementById('pending-orders-list');
        if (!container) return;

        if (orders.length === 0) {
          container.innerHTML = '<p class="no-orders" style="grid-column: 1/-1; text-align: center; padding: 20px;">No orders yet</p>';
          return;
        }

        container.innerHTML = orders.map(order => {
          const statusClass = order.paymentStatus === 'confirmed' ? 'status-completed' : 'status-pending';
          const statusText = order.paymentStatus === 'confirmed' ? 'Paid' : 'Pending';

          const itemsHtml = order.items ? order.items.map(item => `
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px;">
              <span>${item.name} (x${item.quantity})</span>
              <span>UGX ${((typeof item.price === 'number' ? item.price : parseFloat(String(item.price).replace(/[^\d]/g, '')) || 0) * item.quantity).toLocaleString()}</span>
            </div>
          `).join('') : '';

          return `
            <div class="order-summary" style="background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(8,129,120,0.05); margin-bottom: 20px; border-left: 4px solid ${order.paymentStatus === 'confirmed' ? '#28a745' : '#FFB74D'};">
              <div style="border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; display: flex; justify-content: space-between;">
                <strong style="color: #088178;">Order #${order.orderId || order._id.slice(-6)}</strong>
                <span class="status-badge ${statusClass}" style="background: ${order.paymentStatus === 'confirmed' ? '#d4edda' : '#fff3cd'}; color: ${order.paymentStatus === 'confirmed' ? '#155724' : '#856404'}; padding: 4px 12px; border-radius: 20px; font-size: 12px;">${statusText}</span>
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Customer:</strong> ${order.customer?.firstName || ''} ${order.customer?.lastName || ''}<br>
                <strong>Phone:</strong> ${order.customer?.phone || 'N/A'}<br>
                <strong>Email:</strong> ${order.customer?.email || 'N/A'}<br>
                <strong>Address:</strong> ${order.customer?.address || 'N/A'}, ${order.customer?.city || ''}
              </div>
              <div style="border-top: 1px solid #f0f0f0; padding-top: 10px; margin-bottom: 10px;">
                <strong style="color: #088178;">Items:</strong>
                ${itemsHtml}
              </div>
              <div style="font-weight: 700; font-size: 18px; color: #FF6B6B; margin-bottom: 15px; text-align: right;">
                Total: UGX ${(order.total || 0).toLocaleString()}
              </div>
              <div style="display: flex; gap: 10px; justify-content: flex-end;">
                ${order.paymentStatus === 'pending' ?
              `<button class="btn" onclick="updateOrderStatus('${order.orderId || order._id}', 'confirmed')" style="padding: 8px 16px; background: #088178; color: #fff; border: none; border-radius: 4px; cursor: pointer;"><i class="fas fa-check"></i> Confirm Payment</button>` :
              `<button class="btn" onclick="clearOrder('${order.orderId || order._id}')" style="padding: 8px 16px; background: #FF6B6B; color: #fff; border: none; border-radius: 4px; cursor: pointer;"><i class="fas fa-trash"></i> Clear Order</button>`
            }
              </div>
            </div>
          `;
        }).join('');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast('Error loading orders', 'error');
    }
  }

  let ordersRefreshInterval;
  function startOrdersRefresh() {
    if (ordersRefreshInterval) clearInterval(ordersRefreshInterval);
    ordersRefreshInterval = setInterval(() => {
      if (adminContent && adminContent.style.display !== 'none') {
        loadPendingOrders();
      }
    }, 15000); // Refresh every 15 seconds
  }

  function stopOrdersRefresh() {
    clearInterval(ordersRefreshInterval);
  }

  // ===============================
  // TOAST NOTIFICATION FUNCTION
  // ===============================

  function toast(message, type = 'success') {
    const note = document.createElement('div');
    note.className = 'auth-notification';
    note.style.cssText = `
      position: fixed; 
      top: 20px; 
      right: 20px; 
      z-index: 10000;
      background: ${type === 'error' ? '#dc2626' : '#088178'}; 
      color: #fff;
      padding: 12px 16px; 
      border-radius: 8px; 
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
      font-weight: 600;
      animation: slideIn 0.3s ease;
    `;
    note.textContent = message;
    document.body.appendChild(note);
    setTimeout(() => {
      note.style.opacity = '0';
      setTimeout(() => note.remove(), 300);
    }, 2500);
  }

  // ===============================
  // MOBILE MENU TOGGLE
  // ===============================

  const bar = document.getElementById('bar');
  const nav = document.getElementById('navbar');
  const close = document.getElementById('close');

  if (bar) {
    bar.addEventListener('click', () => {
      nav.classList.add('active');
    });
  }

  if (close) {
    close.addEventListener('click', () => {
      nav.classList.remove('active');
    });
  }

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (nav && nav.classList.contains('active') && 
        !nav.contains(e.target) && 
        !bar?.contains(e.target)) {
      nav.classList.remove('active');
    }
  });

  // Add CSS animation for toast
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
});