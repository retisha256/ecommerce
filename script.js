const bar = document.getElementById('bar');
const close = document.getElementById('close');
const nav = document.getElementById('navbar');

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

// Initialize cart functionality
document.addEventListener('DOMContentLoaded', function() {
  // Load cart.js if it exists
  if (typeof updateCartIcon === 'function') {
    updateCartIcon();
  }

  // Newsletter subscribe handler
  const newsletter = document.getElementById('newsletter');
  if (newsletter) {
    const input = newsletter.querySelector('input[type="text"], input[type="email"]');
    const button = newsletter.querySelector('button');
    if (input && button) {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = (input.value || '').trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
          showToast('Please enter a valid email address', 'error');
          input.focus();
          return;
        }
        try {
          // Persist in localStorage as a simple demo; hook to API if available
          const subs = JSON.parse(localStorage.getItem('subscribers') || '[]');
          if (!subs.includes(email)) {
            subs.push(email);
            localStorage.setItem('subscribers', JSON.stringify(subs));
          }
          showToast('Subscribed! You will receive our updates.');
          input.value = '';
        } catch (err) {
          console.error(err);
          showToast('Subscription failed. Try again later.', 'error');
        }
      });
    }
  }
});

function showToast(message, type = 'success') {
  const note = document.createElement('div');
  note.className = 'auth-notification';
  note.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 10000;
    background: ${type === 'error' ? '#DC2626' : '#088178'}; color: #fff;
    padding: 12px 16px; border-radius: 8px; box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    font-weight: 600;
  `;
  note.textContent = message;
  document.body.appendChild(note);
  setTimeout(() => note.remove(), 2500);
}

// =====================
// Shop page rendering
// =====================
(function initShopPage() {
  document.addEventListener('DOMContentLoaded', async () => {
    const container = document.querySelector('#product1 .pro-container');
    if (!container) return; // Not on shop page

    // Helper: UGX formatter
    const formatUGX = (value) => `UGX.${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

    // Load products from API; fall back to local admin storage; if all fail, keep existing markup
    let productsFromApi = [];
    try {
      if (typeof api !== 'undefined' && typeof api.getProducts === 'function') {
        const res = await api.getProducts({ limit: 100 });
        productsFromApi = Array.isArray(res?.data) ? res.data : [];
      }
    } catch (e) {
      // Silently fall back
      console.warn('Failed to load products from API. Falling back to local products.');
    }

    const localAdminProducts = (() => {
      try { return JSON.parse(localStorage.getItem('adminProducts') || '[]'); }
      catch { return []; }
    })();

    // Merge products (API first), then any local ones not present by name
    const existingNames = new Set(productsFromApi.map(p => (p.name || '').trim().toLowerCase()));
    const merged = [
      ...productsFromApi,
      ...localAdminProducts.filter(p => !existingNames.has((p.name || '').trim().toLowerCase()))
    ]
    // Normalize fields we depend on
    .map(p => ({
      _id: p._id || `local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      name: p.name || 'Product',
      category: p.category || 'General',
      price: typeof p.price === 'string' ? parseFloat(String(p.price).replace(/[^\d.-]/g, '')) || 0 : Number(p.price || 0),
      image: p.image || ''
    }));

    if (!merged.length) return; // Nothing to render; leave static content

    // Build product cards
    const cards = merged.map(p => {
      const imgSrc = p.image || 'img1.png';
      return `
        <div class="Pro" data-id="${p._id}" data-name="${p.name.replace(/"/g, '&quot;')}" data-category="${(p.category||'').replace(/"/g, '&quot;')}" data-price="${p.price}" data-image="${imgSrc}">
          <img src="${imgSrc}" alt="${p.name.replace(/"/g, '&quot;')}">
          <div class="des">
            <span>${p.name}</span>
            <h5>${p.category}</h5>
            <div class="star">
              <i class="fas fa-star"></i>
              <i class="fas fa-star"></i>
              <i class="fas fa-star"></i>
              <i class="fas fa-star"></i>
              <i class="fas fa-star"></i>
            </div>
            <h4>${formatUGX(p.price)}</h4>
          </div>
          <a href="#"><i class="fa-solid fa-cart-shopping cart"></i></a>
        </div>
      `;
    }).join('');

    container.innerHTML = cards;

    // Ensure cart icon badge is accurate after rendering
    if (typeof updateCartIcon === 'function') {
      updateCartIcon();
    }
  });
})();