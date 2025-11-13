// Admin - Add Product

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('admin-product-form');
  const recent = document.getElementById('recent-products');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const name = (formData.get('name') || '').toString().trim();
    const category = (formData.get('category') || '').toString().trim();
    const price = Number(formData.get('price'));
    const description = (formData.get('description') || '').toString().trim();
    const imageFile = formData.get('image');

    if (!name || !category || !price || !imageFile || (imageFile && imageFile.size === 0)) {
      toast('Please fill in all required fields', 'error');
      return;
    }

    try {
      if (typeof api !== 'undefined') {
        // Send multipart/form-data to backend (supports file upload)
        const created = await api.createProduct(formData);
        toast('Product created successfully');
        appendRecent(created.data || { name, category, price, image: created?.data?.image, description });
      } else {
        // Fallback to localStorage with a temporary preview URL for the image
        const local = JSON.parse(localStorage.getItem('adminProducts') || '[]');
        const previewUrl = imageFile && typeof URL !== 'undefined' ? URL.createObjectURL(imageFile) : '';
        const localProduct = { 
          _id: 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8), 
          name, 
          category, 
          price: Number(price),
          image: previewUrl, 
          description 
        };
        local.unshift(localProduct);
        localStorage.setItem('adminProducts', JSON.stringify(local));
        // Trigger storage event for other tabs
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'adminProducts',
          newValue: JSON.stringify(local)
        }));
        toast('Product added successfully');
        appendRecent(localProduct);
      }
      form.reset();
    } catch (err) {
      console.error(err);
      // As a graceful fallback, save locally so admin doesn't lose data
      try {
        const local = JSON.parse(localStorage.getItem('adminProducts') || '[]');
        const previewUrl = imageFile && typeof URL !== 'undefined' ? URL.createObjectURL(imageFile) : '';
        const localProduct = { 
          _id: 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8), 
          name, 
          category, 
          price: Number(price),
          image: previewUrl, 
          description 
        };
        local.unshift(localProduct);
        localStorage.setItem('adminProducts', JSON.stringify(local));
        // Trigger storage event for other tabs
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'adminProducts',
          newValue: JSON.stringify(local)
        }));
        toast('Saved locally (server unavailable).', 'error');
        appendRecent(localProduct);
        form.reset();
      } catch (e2) {
        toast('Failed to create product', 'error');
      }
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
        <img src="${p.image}" alt="${p.name}" class="item-image" style="border-radius: 4px;" />
        <div class="item-details">
          <h5>${p.name}</h5>
          <small>${p.category}</small>
          <p style="font-size: 12px; color: #999; margin-top: 5px;">${p.description || 'No description'}</p>
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
