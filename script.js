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

// Utility function for formatting UGX
const formatUGX = (value) => `UGX.${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;


// Initialize cart functionality (Ensuring cart icon update runs on all pages)
document.addEventListener('DOMContentLoaded', function() {
	// Load cart.js if it exists
	if (typeof updateCartIcon === 'function') {
		updateCartIcon();
	}
});

// Shop page product rendering logic
document.addEventListener('DOMContentLoaded', async () => {
	const container = document.querySelector('#product1 .pro-container');
	if (!container) return; // Not a shop page

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
		// Ensure price is stored as a clean NUMBER
		price: Number(p.price || 0), 
		image: p.image || 'img1.png'
	}));

	// Render products
	const renderProducts = (products) => {
		container.innerHTML = products.map(p => `
			<div class="Pro" data-id="${p._id}" data-name="${p.name}" data-category="${p.category}" data-price="${p.price}" data-image="${p.image}">
				<img src="${p.image}" onerror="this.src='https://placehold.co/250x250/111/FFF?text=IMG'" alt="${p.name}">
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
					<h4>${formatUGX(p.price)}</h4>
				</div>
				<a href="#"><i class="fa-solid fa-cart-shopping cart" style="color:#fff; background-color:#6B46C1; padding: 10px; border-radius: 50%;"></i></a>
			</div>
		`).join('');

		if (typeof updateCartIcon === 'function') updateCartIcon();
	};

	renderProducts(merged);

	// Listen for localStorage changes (from Admin page)
	window.addEventListener('storage', (e) => {
		if (e.key === 'adminProducts') {
			try {
				const updatedLocal = JSON.parse(e.newValue || '[]');
				// Re-run the merge logic to ensure the display is updated
				const currentNames = new Set(merged.map(p => (p.name || '').trim().toLowerCase()));
				const newProducts = updatedLocal.filter(lp => !currentNames.has((lp.name || '').trim().toLowerCase()));
				
				if (newProducts.length > 0) {
					// Add new products to the merged list (ensuring price is number)
					const newMergedItems = newProducts.map(p => ({
						_id: p._id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
						name: p.name || 'Product',
						category: p.category || 'General',
						price: Number(p.price || 0),
						image: p.image || 'img1.png'
					}));
					merged.push(...newMergedItems);
					renderProducts(merged);
				}
			} catch {}
		}
	});
});


// Search and Account Dropdown Functionality
document.addEventListener('DOMContentLoaded', function() {
	// Account dropdown toggle
	const accountToggle = document.getElementById('account-toggle');
	const accountDropdown = document.querySelector('.account-dropdown');
	
	if (accountToggle && accountDropdown) {
		accountToggle.addEventListener('click', function(e) {
			e.preventDefault();
			accountDropdown.classList.toggle('active');
		});

		// Close dropdown when clicking outside
		document.addEventListener('click', function(e) {
			if (!accountDropdown.contains(e.target)) {
				accountDropdown.classList.remove('active');
			}
		});
	}

	// Search functionality
	const searchBtn = document.getElementById('search-btn');
	const searchInput = document.getElementById('search-input');
	
	if (searchBtn && searchInput) {
		searchBtn.addEventListener('click', function() {
			performSearch(searchInput.value);
		});

		searchInput.addEventListener('keypress', function(e) {
			if (e.key === 'Enter') {
				performSearch(searchInput.value);
			}
		});
	}
});

// Search function - customize this based on your needs
function performSearch(query) {
	if (query.trim() === '') {
		// NOTE: Replace alert() with console message as per instructions.
		console.warn('Please enter a search term');
		return;
	}
	
	console.log('Searching for:', query);
	// For example, redirect to shop page with search parameter:
	window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
}
