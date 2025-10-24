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

    const product = {
      name,
      category,
      price,
      image: '',
      description
    };

    if (!product.name || !product.category || !product.price || !imageFile) {
      toast('Please fill in all required fields', 'error');
      return;
    }

    try {
      // If API is available, upload image first then create product with returned URL
      if (typeof api !== 'undefined' && typeof api.uploadImage === 'function') {
        let imageUrl = '';
        try {
          const uploadRes = await api.uploadImage(imageFile);
          imageUrl = uploadRes.imageUrl || uploadRes.fullUrl || uploadRes.filename || '';
        } catch (uploadErr) {
          console.warn('Upload failed, will fallback to local filename if possible.', uploadErr);
          // Fallback: create an object URL for preview and store name only
          imageUrl = imageFile && imageFile.name ? imageFile.name : '';
        }

        product.image = imageUrl;
        const created = await api.createProduct(product);
        toast('Product created successfully');
        appendRecent(created.data || product);
      } else {
        // Fallback to localStorage with base64 image for persistence
        const local = JSON.parse(localStorage.getItem('adminProducts') || '[]');
        const dataUrl = imageFile ? await readFileAsDataURL(imageFile) : '';
        const localProduct = { ...product, image: dataUrl || (imageFile?.name || ''), _id: 'local-' + Date.now() };
        local.unshift(localProduct);
        localStorage.setItem('adminProducts', JSON.stringify(local));
        toast('Saved locally (API unavailable)');
        appendRecent(localProduct);
      }
      form.reset();
    } catch (err) {
      console.warn('API create failed, falling back to local save', err);
      try {
        const local = JSON.parse(localStorage.getItem('adminProducts') || '[]');
        const dataUrl = imageFile ? await readFileAsDataURL(imageFile) : '';
        const localProduct = { ...product, image: dataUrl || (imageFile?.name || ''), _id: 'local-' + Date.now() };
        local.unshift(localProduct);
        localStorage.setItem('adminProducts', JSON.stringify(local));
        toast('Saved locally (server unavailable)');
        appendRecent(localProduct);
        form.reset();
      } catch (fallbackErr) {
        console.error('Local fallback also failed', fallbackErr);
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

  // Helper to convert File to data URL for persistence in localStorage
  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      } catch (e) {
        reject(e);
      }
    });
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
