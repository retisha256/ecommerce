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

// Ensure cart icon gets updated if updateCartIcon exists
if (typeof updateCartIcon === 'function') {
	// run once at script load if DOM already loaded; otherwise it will be called on DOMContentLoaded below
	updateCartIcon();
}

// Single consolidated DOMContentLoaded handler
document.addEventListener('DOMContentLoaded', async () => {
	// Optional instrumentation: enable by visiting `shop.html?traceLocalStorage=1`
	try {
		const traceParam = new URLSearchParams(window.location.search).get('traceLocalStorage');
		if (traceParam === '1') {
			(function () {
				const origSet = localStorage.setItem.bind(localStorage);
				const origRemove = localStorage.removeItem.bind(localStorage);
				localStorage.setItem = function (k, v) {
					if (k === 'adminProducts') {
						console.warn('TRACE: localStorage.setItem called for', k, 'valueLen=', String(v || '').length);
						console.warn(new Error('stack trace for setItem').stack);
					}
					return origSet(k, v);
				};
				localStorage.removeItem = function (k) {
					if (k === 'adminProducts') {
						console.warn('TRACE: localStorage.removeItem called for', k);
						console.warn(new Error('stack trace for removeItem').stack);
					}
					return origRemove(k);
				};
			})();
			console.info('shop: localStorage tracing enabled for adminProducts');
		}
	} catch (e) {
		console.warn('shop: failed to enable localStorage tracing', e);
	}
	// Ensure cart icon on DOM ready
	if (typeof updateCartIcon === 'function') updateCartIcon();

	// Shop page product rendering logic (runs only if the container exists)
	const container = document.querySelector('#product1 .pro-container');
	if (container) {
		// Check if we're on a search results page
		const urlParams = new URLSearchParams(window.location.search);
		const searchQuery = urlParams.get('search');

		// Load products from API
		let apiProducts = [];
		try {
			if (typeof api !== 'undefined' && api.getProducts) {
				// If we're on a search results page, ask the API to filter by query
				const params = { limit: 100 };
				if (searchQuery) params.q = searchQuery;
				const res = await api.getProducts(params);
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
		let merged = [
			...apiProducts,
			...localProducts.filter(p => !existingNames.has((p.name || '').trim().toLowerCase()))
		].map(p => ({
			_id: p._id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			name: p.name || 'Product',
			category: p.category || 'General',
			price: Number(p.price || 0),
			image: p.image || 'img1.png',
			description: p.description || ''
		}));
		console.log('shop: merged products - API:', apiProducts.length, '+ Local:', localProducts.length, '= Total:', merged.length);

		// Apply search filter if on search results page
		if (searchQuery) {
			const decodedQuery = decodeURIComponent(searchQuery).trim().toLowerCase();
			console.log('shop: search query=', decodedQuery);
			const filtered = merged.filter(p =>
				String(p.name || '').toLowerCase().includes(decodedQuery) ||
				String(p.category || '').toLowerCase().includes(decodedQuery) ||
				String(p.description || '').toLowerCase().includes(decodedQuery)
			);

			if (filtered.length === 0) {
				container.innerHTML = `
					<div style="grid-column: 1/-1; text-align: center; padding: 40px;">
						<h3 style="color: #f59e0b;">Product Not Found</h3>
						<p style="color: #999;">No products match "<strong>${decodedQuery}</strong>"</p>
						<a href="shop.html" class="normal" style="display: inline-block; margin-top: 20px;">View All Products</a>
					</div>
				`;
				return;
			}
			merged = filtered;
		}

		// Flag to prevent multiple render operations
		let isRendering = false;

		// Function to attach cart listeners to dynamically rendered products
		function attachCartListeners() {
			// Use event delegation on the container so dynamically added/removed
			// product cards always have working cart buttons. Only attach once.
			if (container._cartDelegationAttached) return;
			container._cartDelegationAttached = true;

			container.addEventListener('click', function (e) {
				const btn = e.target.closest && e.target.closest('.cart');
				if (!btn) return;
				e.preventDefault();
				const productCard = btn.closest('.Pro');
				if (!productCard) return;
				const productData = {
					id: productCard.getAttribute('data-id'),
					name: productCard.getAttribute('data-name'),
					category: productCard.getAttribute('data-category'),
					price: parseFloat(productCard.getAttribute('data-price')),
					image: productCard.getAttribute('data-image')
				};
				console.log('shop: delegated add button clicked', productData);
				if (typeof addToCart === 'function') {
					addToCart(productData);
				} else {
					console.warn('shop: addToCart not available');
				}
			});
		}

		// Render products
		const renderProducts = (products) => {
			if (isRendering) return;
			isRendering = true;

			if (!Array.isArray(products)) products = [];
			const fragment = document.createDocumentFragment();

			products.forEach(p => {
				const div = document.createElement('div');
				div.className = 'Pro';
				div.setAttribute('data-id', p._id);
				div.setAttribute('data-name', p.name);
				div.setAttribute('data-category', p.category);
				div.setAttribute('data-price', p.price);
				div.setAttribute('data-image', p.image);
				div.innerHTML = `
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
				`;
				fragment.appendChild(div);
			});

			container.innerHTML = '';
			container.appendChild(fragment);

			attachCartListeners();
			if (typeof updateCartIcon === 'function') updateCartIcon();

			isRendering = false;
		};

		// Initial render
		console.log('shop: renderProducts called with', merged.length, 'products');
		renderProducts(merged);
		console.log('shop: initial render complete');

		// Watch for unexpected clears (helps prevent other scripts from wiping products)
		let mutationObserverActive = false;
		try {
			const obs = new MutationObserver((mutations) => {
				if (!isRendering && !mutationObserverActive && container.children.length === 0) {
					console.warn('shop: container became empty — restoring products (merged count=', merged.length, ')');
					mutationObserverActive = true;
					setTimeout(() => {
						renderProducts(merged);
						mutationObserverActive = false;
					}, 100);
				}
				// Log notable mutations for debugging
				mutations.forEach(m => {
					if (m.removedNodes && m.removedNodes.length) {
						console.debug('shop: mutation removed nodes count=', m.removedNodes.length);
					}
				});
			});
			obs.observe(container, { childList: true });
		} catch (e) {
			console.warn('shop: MutationObserver unavailable', e);
		}

		// Listen for localStorage changes (from Admin page)
		// Debounced storage handler: when adminProducts changes, recompute merged list (API products stay the same)
		let storageDebounce = null;
		window.addEventListener('storage', (e) => {
			if (e.key === 'adminProducts') {
				console.log('shop: storage event for adminProducts received');
				if (storageDebounce) clearTimeout(storageDebounce);
				storageDebounce = setTimeout(() => {
					try {
						const updatedLocal = JSON.parse(e.newValue || '[]');
						console.log('shop: updatedLocal count=', updatedLocal.length, 'merged before=', merged.length);
						// Rebuild merged from apiProducts + updatedLocal to avoid accidental overwrite
						const existingNames2 = new Set((apiProducts || []).map(p => (p.name || '').trim().toLowerCase()));
						merged = [
							...(apiProducts || []),
							...updatedLocal.filter(p => !existingNames2.has((p.name || '').trim().toLowerCase()))
						].map(p => ({
							_id: p._id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
							name: p.name || 'Product',
							category: p.category || 'General',
							price: Number(p.price || 0),
							image: p.image || 'img1.png',
							description: p.description || ''
						}));
						renderProducts(merged);
						console.log('shop: merged after storage update=', merged.length);
					} catch (err) {
						console.warn('shop: failed to handle adminProducts storage event', err);
					}
				}, 150);
			}
		});
	} // end if (container)

	// Search and Account Dropdown Functionality (runs on all pages)
	// Account dropdown toggle
	const accountToggle = document.getElementById('account-toggle');
	const accountDropdown = document.querySelector('.account-dropdown');

	if (accountToggle && accountDropdown) {
		accountToggle.addEventListener('click', function (e) {
			e.preventDefault();
			accountDropdown.classList.toggle('active');
		});

		// Close dropdown when clicking outside
		document.addEventListener('click', function (e) {
			if (!accountDropdown.contains(e.target)) {
				accountDropdown.classList.remove('active');
			}
		});
	}

	// Search functionality
	const searchBtn = document.getElementById('search-btn');
	const searchInput = document.getElementById('search-input');

	if (searchBtn && searchInput) {
		searchBtn.addEventListener('click', function () {
			performSearch(searchInput.value);
		});

		searchInput.addEventListener('keypress', function (e) {
			if (e.key === 'Enter') {
				performSearch(searchInput.value);
			}
		});
	}

	// Newsletter subscription
	const newsletterBtn = document.getElementById('newsletter-btn');
	const newsletterEmail = document.getElementById('newsletter-email');

	if (newsletterBtn && newsletterEmail) {
		newsletterBtn.addEventListener('click', async function (e) {
			e.preventDefault();
			const email = newsletterEmail.value.trim();

			if (!email || !email.includes('@')) {
				showAuthNotification('Please enter a valid email address', 'error');
				return;
			}

			newsletterBtn.disabled = true;
			newsletterBtn.textContent = 'Subscribing...';

			try {
				const response = await fetch('/api/subscribe', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email })
				});

				const data = await response.json();

				if (data.success) {
					showAuthNotification('🎉 You have successfully subscribed to our newsletter!', 'success');
					newsletterEmail.value = '';
				} else {
					showAuthNotification('Subscription failed: ' + data.message, 'error');
				}
			} catch (err) {
				console.error('Newsletter subscription error:', err);
				showAuthNotification('An error occurred. Please try again.', 'error');
			} finally {
				newsletterBtn.disabled = false;
				newsletterBtn.textContent = 'Sign Up';
			}
		});
	}
});

// Search function
function performSearch(query) {
	if (!query || query.trim() === '') {
		console.warn('Please enter a search term');
		return;
	}

	console.log('Searching for:', query);
	window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
}
