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
        // Fallback to localStorage with a persistent data URL for the image
        const local = JSON.parse(localStorage.getItem('adminProducts') || '[]');
        // Convert imageFile to data URL so it persists in localStorage
        let previewUrl = '';
        try {
          if (imageFile && imageFile.size) {
            previewUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result || '');
              reader.onerror = () => resolve('');
              reader.readAsDataURL(imageFile);
            });
          }
        } catch (e) {
          previewUrl = '';
        }

        const localProduct = { 
          _id: 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8), 
          name, 
          category, 
          price: Number(price),
          image: previewUrl || 'img1.png', 
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
        // Try to read image as data URL for persistence
        let previewUrl = '';
        try {
          if (imageFile && imageFile.size) {
            previewUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result || '');
              reader.onerror = () => resolve('');
              reader.readAsDataURL(imageFile);
            });
          }
        } catch (e) {
          previewUrl = '';
        }

        const localProduct = { 
          _id: 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8), 
          name, 
          category, 
          price: Number(price),
          image: previewUrl || 'img1.png', 
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
    el.className = 'Pro';  // Use same class as shop products for consistent sizing
    el.style.cssText = 'margin: 10px; cursor: pointer;';
    
    // Create image element with fallback
    const imgSrc = p.image && (
      p.image.startsWith('blob:') ||
      p.image.startsWith('data:') ||
      p.image.startsWith('http') ||
      p.image.startsWith('/')
    ) ? p.image : 'img1.png';
    
    el.innerHTML = `
      <img src="${imgSrc}" alt="${p.name}" style="width: 100%; height: 250px; object-fit: cover; border-radius: 4px;" 
           onerror="this.src='https://placehold.co/250x250/111/FFF?text=No+Image'" />
      <div class="des">
        <span>${p.name}</span>
        <h5>${p.category}</h5>
        <div class="star">
          <i class="fas fa-star" style="color:#F59E0B;"></i>
          <i class="fas fa-star" style="color:#F59E0B;"></i>
          <i class="fas fa-star" style="color:#F59E0B;"></i>
          <i class="fas fa-star" style="color:#F59E0B;"></i>
          <i class="fas fa-star" style="color:#F59E0B;"></i>
        </div>
        <h4>UGX ${Number(p.price).toLocaleString()}</h4>
      </div>
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
