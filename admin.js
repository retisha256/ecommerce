// Admin - Add Product

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('admin-product-form');
  const recent = document.getElementById('recent-products');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const product = {
      name: formData.get('name').trim(),
      category: formData.get('category').trim(),
      price: Number(formData.get('price')),
      image: formData.get('image').trim(),
      description: (formData.get('description') || '').trim()
    };

    if (!product.name || !product.category || !product.price || !product.image) {
      toast('Please fill in all required fields', 'error');
      return;
    }

    try {
      if (typeof api !== 'undefined') {
        const created = await api.createProduct(product);
        toast('Product created successfully');
        appendRecent(created.data || product);
      } else {
        // Fallback to localStorage
        const local = JSON.parse(localStorage.getItem('adminProducts') || '[]');
        const localProduct = { ...product, _id: 'local-' + Date.now() };
        local.unshift(localProduct);
        localStorage.setItem('adminProducts', JSON.stringify(local));
        toast('Saved locally (API unavailable)');
        appendRecent(localProduct);
      }
      form.reset();
    } catch (err) {
      console.error(err);
      toast('Failed to create product', 'error');
    }
  });

  // Load recent from localStorage
  const existing = JSON.parse(localStorage.getItem('adminProducts') || '[]');
  existing.slice(0, 10).forEach(appendRecent);

  function appendRecent(p) {
    const el = document.createElement('div');
    el.className = 'order-item';
    el.innerHTML = `
      <div class="item-info">
        <img src="${p.image}" alt="${p.name}" class="item-image" />
        <div class="item-details">
          <h5>${p.name}</h5>
          <small>${p.category}</small>
        </div>
      </div>
      <div class="item-quantity">UGX ${Number(p.price).toLocaleString()}</div>
    `;
    recent.prepend(el);
  }
});

function toast(message, type = 'success') {
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
