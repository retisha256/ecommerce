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

// Global Wishlist Functions (available on all pages)
function getWishlist() {
	const wishlist = localStorage.getItem('wishlist');
	return wishlist ? JSON.parse(wishlist) : [];
}

function saveWishlist(wishlist) {
	localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

function isProductInWishlist(productId) {
	const wishlist = getWishlist();
	return wishlist.some(item => item.id === productId);
}

function toggleWishlist(productId, productData) {
	let wishlist = getWishlist();
	const index = wishlist.findIndex(item => item.id === productId);
	if (index > -1) {
		wishlist.splice(index, 1);
	} else {
		wishlist.push(productData);
	}
	saveWishlist(wishlist);
	return index === -1; // true if added, false if removed
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

	// Global delegation for add-to-cart buttons (covers index page static product cards)
	// This is intentionally lightweight and only builds product data from DOM
	// if the container doesn't already have a delegated handler (avoids double-calls).
	document.body.addEventListener('click', function (e) {
		const btn = e.target.closest && e.target.closest('.cart-btn');
		if (!btn) return;

		// Prevent multiple firing
		// If a specific pro-container has already attached delegation, let it handle the event
		const proContainer = btn.closest('.pro-container');
		if (proContainer && proContainer._cartDelegationAttached) return;

		const productCard = btn.closest('.Pro');
		if (!productCard) return;

		// Extract product data from the static card markup or data attributes
		const dataId = productCard.getAttribute('data-id');
		const dataName = productCard.getAttribute('data-name');
		const dataCategory = productCard.getAttribute('data-category');
		const dataPrice = productCard.getAttribute('data-price');
		const dataImage = productCard.getAttribute('data-image');

		// Use data attributes if available, fall back to DOM parsing
		if (dataId && dataName && dataPrice) {
			// We will handle the event here — prevent default action and stop other handlers
			e.preventDefault();
			e.stopPropagation();
			const productData = {
				id: dataId,
				name: dataName,
				category: dataCategory || 'General',
				price: parseFloat(dataPrice) || 0,
				image: dataImage || ''
			};
			
			if (typeof addToCart === 'function') {
				addToCart(productData);
			} else {
				console.warn('addToCart function not available');
			}
		} else {
			// Fallback: extract product data from the static card markup
			const nameEl = productCard.querySelector('.des span');
			const categoryEl = productCard.querySelector('.des h5');
			const priceEl = productCard.querySelector('.des h4');
			const imgEl = productCard.querySelector('img');

			const rawPrice = (priceEl && priceEl.textContent) ? priceEl.textContent : '';
			const numericPrice = parseFloat(String(rawPrice).replace(/[^0-9\.]+/g, '')) || 0;

			const productData = {
				id: `local-${(nameEl && nameEl.textContent||'').trim().replace(/\s+/g,'-').toLowerCase()}-${Date.now()}`,
				name: (nameEl && nameEl.textContent) ? nameEl.textContent.trim() : 'Product',
				category: (categoryEl && categoryEl.textContent) ? categoryEl.textContent.trim() : 'General',
				price: numericPrice,
				image: (imgEl && imgEl.getAttribute('src')) ? imgEl.getAttribute('src') : ''
			};

			if (typeof addToCart === 'function') {
				addToCart(productData);
			} else {
				console.warn('addToCart function not available');
			}
		}
	}, true); // Use capture phase to fire before other listeners

	// Global delegation for favorite buttons (covers index page static product cards)
	document.body.addEventListener('click', function (e) {
		const btn = e.target.closest && e.target.closest('.favorite-btn');
		if (!btn) return;

		// If it's in a pro-container with delegation, skip (for dynamic products)
		const proContainer = btn.closest('.pro-container');
		if (proContainer && proContainer._favoriteDelegationAttached) return;

		const productCard = btn.closest('.Pro');
		if (!productCard) return;

		const productId = btn.getAttribute('data-id');
		const nameEl = productCard.querySelector('.des span');
		const categoryEl = productCard.querySelector('.des h5');
		const priceEl = productCard.querySelector('.des h4');
		const imgEl = productCard.querySelector('img');

		const rawPrice = (priceEl && priceEl.textContent) ? priceEl.textContent : '';
		const numericPrice = parseFloat(String(rawPrice).replace(/[^0-9\.]/g, '')) || 0;

		const productData = {
			id: productId,
			name: (nameEl && nameEl.textContent) ? nameEl.textContent.trim() : 'Product',
			category: (categoryEl && categoryEl.textContent) ? categoryEl.textContent.trim() : 'General',
			price: numericPrice,
			image: (imgEl && imgEl.getAttribute('src')) ? imgEl.getAttribute('src') : ''
		};

		const isNowFavorited = toggleWishlist(productId, productData);
		btn.classList.toggle('favorited', isNowFavorited);
		const icon = btn.querySelector('i');
		icon.className = isNowFavorited ? 'fas fa-heart' : 'far fa-heart';
		console.log(isNowFavorited ? 'Added to wishlist' : 'Removed from wishlist', productData.name);
	});

	// Setup logout button handler
	const logoutBtn = document.getElementById('account-logout');
	if (logoutBtn) {
		logoutBtn.addEventListener('click', function(e) {
			e.preventDefault();
			localStorage.removeItem('currentUser');
			localStorage.removeItem('cart');
			// Show logout notification
			const notification = document.createElement('div');
			notification.style.cssText = `
				position: fixed; top: 20px; right: 20px; padding: 15px 20px;
				border-radius: 8px; background: #ffd400; color: #2b0b4a;
				font-weight: 600; z-index: 10000;
			`;
			notification.textContent = 'You have been logged out. Redirecting...';
			document.body.appendChild(notification);
			setTimeout(() => {
				window.location.href = 'login.html';
			}, 1500);
		});
	}

	// Initialize account dropdown based on current user
	if (typeof updateAuthUI === 'function') {
		updateAuthUI();
	}

	// Shop page product rendering logic (runs only if the container exists)
	const container = document.querySelector('#product1 .pro-container');
	if (container) {
		// Check if we're on wishlist page
		if (window.location.pathname.includes('wishlist.html')) {
			const wishlist = getWishlist();
			if (wishlist.length === 0) {
				container.innerHTML = `
					<div style="grid-column: 1/-1; text-align: center; padding: 40px;">
						<h3 style="color: #f59e0b;">Your Wishlist is Empty</h3>
						<p style="color: #999;">Add some products to your wishlist</p>
						<a href="shop.html" class="normal" style="display: inline-block; margin-top: 20px;">Shop Now</a>
					</div>
				`;
				return;
			}
			renderProducts(wishlist);
			return;
		}

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
				console.log('shop: API products loaded successfully:', apiProducts.length);
				console.log('shop: API product images:', apiProducts.map(p => ({ name: p.name, image: p.image })));
			}
		} catch (e) {
			console.warn('API products load failed, falling back to local products.', e.message);
			// Continue with empty apiProducts array
		}

		// Load local admin products
		let localProducts = [];
		try {
			localProducts = JSON.parse(localStorage.getItem('adminProducts') || '[]');
			console.log('shop: localProducts loaded from localStorage:', localProducts.length);
			// Log local products for debugging
			if (localProducts.length > 0) {
				console.log('shop: local product details:', localProducts.map(p => ({ name: p.name, price: p.price, image: p.image })));
			}
		} catch (e) {
			console.error('shop: Error parsing localStorage adminProducts:', e);
			localProducts = [];
		}

		// Merge products, ensuring no duplicates by _id (more reliable than name)
		const existingIds = new Set(apiProducts.map(p => p._id || ''));
		let merged = [
			...apiProducts,
			...localProducts.filter(p => !existingIds.has(p._id || ''))
		].map(p => ({
			_id: p._id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			name: p.name || 'Product',
			category: p.category || 'General',
			price: Number(p.price || 0),
			image: p.image || 'img1.png',
			description: p.description || ''
		}));

		// Log detailed merge information
		console.log('shop: Final merged products array:', merged.map(p => ({ name: p.name, price: p.price, image: p.image })));
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

			// If we have matches, show a focused result with suggestions
			renderSearchResults(filtered, decodedQuery);
			return;
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
				const btn = e.target.closest && e.target.closest('.cart-btn');
				if (!btn) return;
				e.preventDefault();
				const productCard = btn.closest('.Pro');
				if (!productCard) return;
				const productData = {
					id: productCard.getAttribute('data-id'),
					name: productCard.getAttribute('data-name'),
					category: productCard.getAttribute('data-category'),
					image: productCard.getAttribute('data-image'),
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

		// Function to attach favorite listeners
		function attachFavoriteListeners() {
			if (container._favoriteDelegationAttached) return;
			container._favoriteDelegationAttached = true;

			container.addEventListener('click', function (e) {
				const btn = e.target.closest && e.target.closest('.favorite-btn');
				if (!btn) return;
				e.preventDefault();
				const productCard = btn.closest('.Pro');
				if (!productCard) return;
				const productId = btn.getAttribute('data-id');
				const productData = {
					id: productCard.getAttribute('data-id'),
					name: productCard.getAttribute('data-name'),
					category: productCard.getAttribute('data-category'),
					price: parseFloat(productCard.getAttribute('data-price')),
					image: productCard.getAttribute('data-image')
				};
				const isNowFavorited = toggleWishlist(productId, productData);
				btn.classList.toggle('favorited', isNowFavorited);
				const icon = btn.querySelector('i');
				icon.className = isNowFavorited ? 'fas fa-heart' : 'far fa-heart';
				console.log(isNowFavorited ? 'Added to wishlist' : 'Removed from wishlist', productData.name);
			});
		}

		// Render a focused search result with suggestions
		function renderSearchResults(products, decodedQuery) {
			if (!Array.isArray(products) || products.length === 0) return;
			const main = products[0];
			// Build suggestions: other matches first, then same-category items from merged
			const others = products.slice(1);
			const sameCategory = (merged || []).filter(p => p._id !== main._id && p.category === main.category && !others.find(o => o._id === p._id));
			const suggestions = others.concat(sameCategory).slice(0, 8);

			const isFavorited = isProductInWishlist(main.id || main._id);

			container.innerHTML = `
				<div class="search-results">
					<div class="search-main">
						<div class="Pro main-pro" data-id="${main._id}" data-name="${(main.name||'').replace(/"/g,'&quot;')}" data-category="${(main.category||'').replace(/"/g,'&quot;')}" data-price="${main.price}" data-image="${(main.image||'').replace(/"/g,'&quot;')}">
							<img src="${main.image}" onerror="this.src='https://placehold.co/450x450/111/FFF?text=IMG'" alt="${(main.name||'Product').replace(/"/g,'&quot;')}">
							<button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-id="${main._id}"><i class="${isFavorited ? 'fas' : 'far'} fa-heart"></i></button>
							<div class="des">
								<span>${main.name}</span>
								<h5>${main.category}</h5>
								<div class="star">
									<i class="fas fa-star" style="color:#F59E0B;"></i>
									<i class="fas fa-star" style="color:#F59E0B;"></i>
									<i class="fas fa-star" style="color:#F59E0B;"></i>
									<i class="fas fa-star" style="color:#F59E0B;"></i>
									<i class="fas fa-star" style="color:#F59E0B;"></i>
								</div>
								<p style="color:#444; margin-top:8px;">${(main.description||'').slice(0,300)}</p>
								<h4>${formatUGX(main.price)}</h4>
							</div>
							<button class="cart-btn"><i class="fa-solid fa-cart-shopping"></i> Add to cart</button>
						</div>
					</div>
					<aside class="search-suggestions">
						<h3>Similar items</h3>
						<div class="suggestion-grid">
							${suggestions.map(s => `
								<div class="suggestion-item" data-id="${s._id}" data-name="${(s.name||'').replace(/"/g,'&quot;')}" data-price="${s.price}" data-image="${(s.image||'').replace(/"/g,'&quot;')}" data-category="${(s.category||'').replace(/"/g,'&quot;')}" data-description="${(s.description||'').replace(/"/g,'&quot;')}">
									<img src="${s.image}" onerror="this.src='https://placehold.co/100x100/111/FFF?text=IMG'" alt="${(s.name||'').replace(/"/g,'&quot;')}">
									<div class="s-info">
										<strong>${s.name}</strong>
										<div class="s-cat">${s.category}</div>
										<div class="s-price">${formatUGX(s.price)}</div>
									</div>
									<button class="cart-btn s-add" aria-label="Add ${s.name} to cart"><i class="fa-solid fa-cart-shopping"></i></button>
								</div>
							`).join('')}
						</div>
					</aside>
				</div>
			`;

		// Reset delegation flags to allow fresh listeners on new searches
		container._cartDelegationAttached = false;
		container._favoriteDelegationAttached = false;

			attachFavoriteListeners();
			
			// Add click handler for suggestion items to view their details
			container.addEventListener('click', function (e) {
				const suggestionItem = e.target.closest && e.target.closest('.suggestion-item');
				if (!suggestionItem) return;
				// Don't navigate if the cart button was clicked
				if (e.target.closest('.cart-btn')) return;
				e.preventDefault();
				
				// Find the suggestion product in merged array
				const suggestionId = suggestionItem.getAttribute('data-id');
				const suggestionProduct = (merged || []).find(p => p._id === suggestionId);
				if (suggestionProduct) {
					// Re-render with this product as the main one
					const filtered = (merged || []).filter(p =>
						String(p.name || '').toLowerCase().includes(decodedQuery) ||
						String(p.category || '').toLowerCase().includes(decodedQuery) ||
						String(p.description || '').toLowerCase().includes(decodedQuery)
					);
					renderSearchResults(filtered, decodedQuery);
				}
			});
			
			if (typeof updateCartIcon === 'function') updateCartIcon();
		}

		// Render products
		const renderProducts = (products) => {
			if (isRendering) return;
			isRendering = true;

			if (!Array.isArray(products)) products = [];
			const fragment = document.createDocumentFragment();

			products.forEach(p => {
				console.log('Rendering product:', p.name, 'image:', p.image);
				const div = document.createElement('div');
				div.className = 'Pro';
				div.setAttribute('data-id', p.id || p._id);
				div.setAttribute('data-name', p.name);
				div.setAttribute('data-category', p.category);
				div.setAttribute('data-price', p.price);
				div.setAttribute('data-image', p.image);
				const isSearch = window.location.search.includes('search');
				const descriptionHtml = ''; // Removed description to keep same size
				const isFavorited = isProductInWishlist(p.id || p._id);
				div.innerHTML = `
					<img src="${p.image}" onerror="console.error('Image load failed for', '${p.name}', 'src:', '${p.image}'); this.src='https://placehold.co/250x250/111/FFF?text=IMG'" alt="${p.name}">
					<button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-id="${p.id || p._id}">
						<i class="${isFavorited ? 'fas' : 'far'} fa-heart"></i>
					</button>
					<div class="des">
						<span>${p.name}</span>
						<h5>${p.category}</h5>
						${descriptionHtml}
						<div class="star">
							<i class="fas fa-star" style="color:#F59E0B;"></i>
							<i class="fas fa-star" style="color:#F59E0B;"></i>
							<i class="fas fa-star" style="color:#F59E0B;"></i>
							<i class="fas fa-star" style="color:#F59E0B;"></i>
							<i class="fas fa-star" style="color:#F59E0B;"></i>
						</div>
						<h4>${formatUGX(p.price)}</h4>
					</div>
					<button class="cart-btn"><i class="fa-solid fa-cart-shopping"></i> Add to cart</button>
				`;
				fragment.appendChild(div);
			});

			container.innerHTML = '';
			container.appendChild(fragment);

			attachCartListeners();
			attachFavoriteListeners();
			if (typeof updateCartIcon === 'function') updateCartIcon();

			isRendering = false;
		};

		// Initial render
		console.log('shop: renderProducts called with', merged.length, 'products');
		
		// If merged array is empty, log detailed information for debugging
		if (merged.length === 0) {
			console.error('shop: WARNING - No products to render! Debugging info:');
			console.error('  - API products count:', apiProducts.length);
			console.error('  - Local products count:', localProducts.length);
			console.error('  - API products:', apiProducts);
			console.error('  - Local products:', localProducts);
			
			// Show message to user about data loading issue
			container.innerHTML = `
				<div style="grid-column: 1/-1; text-align: center; padding: 40px;">
					<h3 style="color: #f59e0b;">Loading Products...</h3>
					<p style="color: #999;">Please wait while we load the products. If this persists, try refreshing the page.</p>
				</div>
			`;
			return;
		}
		
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
						const existingIds2 = new Set((apiProducts || []).map(p => p._id || ''));
						merged = [
							...(apiProducts || []),
							...updatedLocal.filter(p => !existingIds2.has(p._id || ''))
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

	// Mobile search functionality
	const mobileSearchBtn = document.getElementById('mobile-search');
	const mobileSearchOverlay = document.getElementById('mobile-search-overlay');
	const mobileSearchInput = document.getElementById('mobile-search-input');
	const mobileSearchSubmitBtn = document.getElementById('mobile-search-btn');
	const closeSearchBtn = document.getElementById('close-search');

	if (mobileSearchBtn && mobileSearchOverlay) {
		mobileSearchBtn.addEventListener('click', function (e) {
			e.preventDefault();
			mobileSearchOverlay.style.display = 'flex';
			if (mobileSearchInput) mobileSearchInput.focus();
		});
	}

	if (closeSearchBtn && mobileSearchOverlay) {
		closeSearchBtn.addEventListener('click', function () {
			mobileSearchOverlay.style.display = 'none';
		});
	}

	if (mobileSearchSubmitBtn && mobileSearchInput) {
		mobileSearchSubmitBtn.addEventListener('click', function () {
			performSearch(mobileSearchInput.value);
			mobileSearchOverlay.style.display = 'none';
		});

		mobileSearchInput.addEventListener('keypress', function (e) {
			if (e.key === 'Enter') {
				performSearch(mobileSearchInput.value);
				mobileSearchOverlay.style.display = 'none';
			}
		});
	}

	// Mobile account functionality
	const mobileAccountBtn = document.getElementById('mobile-account');
	const mobileAccountDropdown = document.querySelector('.mobile-account-dropdown');

	if (mobileAccountBtn && mobileAccountDropdown) {
		mobileAccountBtn.addEventListener('click', function (e) {
			e.preventDefault();
			mobileAccountDropdown.classList.toggle('active');
		});
	}

	// Close mobile dropdown when clicking outside
	document.addEventListener('click', function (e) {
		if (mobileAccountDropdown && !mobileAccountDropdown.contains(e.target)) {
			mobileAccountDropdown.classList.remove('active');
		}
	});

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

	// Initialize static favorite buttons on index page
	const staticFavoriteBtns = document.querySelectorAll('#featuredproducts .favorite-btn');
	staticFavoriteBtns.forEach(btn => {
		const productId = btn.getAttribute('data-id');
		const isFavorited = isProductInWishlist(productId);
		btn.classList.toggle('favorited', isFavorited);
		const icon = btn.querySelector('i');
		if (icon) {
			icon.className = isFavorited ? 'fas fa-heart' : 'far fa-heart';
		}
	});
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
