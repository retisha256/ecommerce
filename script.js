document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('#product1 .pro-container');
  if (!container) return; // Not a shop page

  const formatUGX = (value) => `UGX.${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  // Load products from API
  let apiProducts = [];
  try {
    if (typeof api !== 'undefined' && api.getProducts) {
      const res = await api.getProducts({ limit: 100 });
      apiProducts = Array.isArray(res?.data) ? res.data : [];
    }
  } catch (e) {
    console.warn('API products load failed, falling back to local products.');
  }

  // Load local admin products
  let localProducts = [];
  try {
    localProducts = JSON.parse(localStorage.getItem('adminProducts') || '[]');
  } catch {}

  // Merge products, ensuring no duplicates by name
  const existingNames = new Set(apiProducts.map(p => (p.name || '').trim().toLowerCase()));
  const merged = [
    ...apiProducts,
    ...localProducts.filter(p => !existingNames.has((p.name || '').trim().toLowerCase()))
  ].map(p => ({
    _id: p._id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: p.name || 'Product',
    category: p.category || 'General',
    price: Number(p.price || 0),
    image: p.image || 'img1.png'
  }));

  // Render products
  const renderProducts = (products) => {
    container.innerHTML = products.map(p => `
      <div class="Pro" data-id="${p._id}" data-name="${p.name}" data-category="${p.category}" data-price="${p.price}" data-image="${p.image}">
        <img src="${p.image}" alt="${p.name}">
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
    `).join('');

    // Update cart badge if needed
    if (typeof updateCartIcon === 'function') updateCartIcon();
  };

  renderProducts(merged);

  // Listen for localStorage changes (from Admin page)
  window.addEventListener('storage', (e) => {
    if (e.key === 'adminProducts') {
      try {
        const updatedLocal = JSON.parse(e.newValue || '[]');
        const newProducts = updatedLocal.filter(lp => !merged.some(mp => mp._id === lp._id));
        if (newProducts.length) {
          merged.push(...newProducts);
          renderProducts(merged);
        }
      } catch {}
    }
  });
});
