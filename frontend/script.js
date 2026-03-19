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
				injectSearchBanner(decodedQuery, 0);
				container.innerHTML = `
					<div class="no-results-wrap">
						<div class="no-results-icon"><i class="fas fa-search"></i></div>
						<h3>No results for "${decodedQuery}"</h3>
						<p>Try a different keyword or browse all our products</p>
						<a href="shop.html" class="normal">View All Products</a>
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

		// Inject search banner + activate search mode on section
		function injectSearchBanner(query, count) {
			const section = document.getElementById('product1');
			if (!section) return;
			section.classList.add('search-active');
			const existing = document.getElementById('search-results-banner');
			if (existing) existing.remove();
			const banner = document.createElement('div');
			banner.id = 'search-results-banner';
			banner.className = 'search-banner';
			banner.innerHTML = `
				<div class="search-banner-left">
					<span class="search-banner-label">Search Results</span>
					<div class="search-banner-query">
						<i class="fas fa-search"></i> ${query}
					</div>
					<span class="search-banner-count">${count > 0 ? count + ' product' + (count !== 1 ? 's' : '') + ' found' : 'No products found'}</span>
				</div>
				<a href="shop.html" class="search-banner-back">
					<i class="fas fa-arrow-left"></i> All Products
				</a>
			`;
			section.insertBefore(banner, section.firstChild);
		}

		// Render beautiful search results with suggestions panel
		function renderSearchResults(products, decodedQuery) {
			if (!Array.isArray(products) || products.length === 0) return;

			injectSearchBanner(decodedQuery, products.length);

			const main = products[0];
			const others = products.slice(1);
			const sameCategory = (merged || []).filter(p =>
				p._id !== main._id &&
				p.category === main.category &&
				!others.find(o => o._id === p._id)
			);
			const suggestions = others.concat(sameCategory).slice(0, 12);
			const isFavorited = isProductInWishlist(main.id || main._id);

			container.innerHTML = `
				<div class="search-results-body">
					<div class="search-main-panel">

						<!-- Image with hover overlay -->
						<div class="main-product-img-wrap">
							<img class="main-product-img"
								src="${main.image}"
								onerror="this.src='https://placehold.co/400x300/f0f4f3/088178?text=IMG'"
								alt="${(main.name||'').replace(/"/g,'&quot;')}">
						</div>

						<!-- Gradient divider -->
						<div class="main-panel-divider"></div>

						<!-- Product info -->
						<div class="main-product-body">

							<!-- Category + hot badge -->
							<div class="main-product-top-row">
								<span class="main-product-category">
									<i class="fas fa-tag"></i> ${main.category}
								</span>
								<span class="main-product-badge">🔥 Hot Pick</span>
							</div>

							<!-- Name -->
							<h2 class="main-product-name">${main.name}</h2>

							<!-- Stars -->
							<div class="main-product-stars-row">
								<div class="main-product-stars">
									<i class="fas fa-star"></i><i class="fas fa-star"></i>
									<i class="fas fa-star"></i><i class="fas fa-star"></i>
									<i class="fas fa-star"></i>
								</div>
								<span class="main-product-rating-text">5.0 · Verified Purchase</span>
							</div>

							<!-- Price box -->
							<div class="main-product-price-box">
								<span class="main-product-price">${formatUGX(main.price)}</span>
								<span class="main-product-price-note">incl. taxes</span>
							</div>

							<!-- Quick highlights -->
							<div class="main-product-highlights">
								<div class="main-highlight-row"><i class="fas fa-check-circle"></i>Genuine product — quality guaranteed</div>
								<div class="main-highlight-row"><i class="fas fa-shield-alt"></i>Warranty included on all electronics</div>
								<div class="main-highlight-row"><i class="fas fa-truck"></i>Free delivery in Kampala</div>
							</div>

							<!-- Description -->
							${main.description ? '<p class="main-product-desc">' + main.description.slice(0,200) + '</p>' : ''}

							<!-- Action buttons -->
							<div class="main-product-actions"
								data-id="${main._id}"
								data-name="${(main.name||'').replace(/"/g,'&quot;')}"
								data-category="${(main.category||'').replace(/"/g,'&quot;')}"
								data-price="${main.price}"
								data-image="${(main.image||'').replace(/"/g,'&quot;')}">
								<button class="cart-btn main-cart-btn">
									<i class="fa-solid fa-cart-shopping"></i> Add to Cart
								</button>
								<button class="fav-btn ${isFavorited ? 'favorited' : ''}" data-id="${main._id}">
									<i class="${isFavorited ? 'fas' : 'far'} fa-heart"></i>
								</button>
							</div>

						</div>

						<!-- Bottom delivery strip -->
						<div class="main-product-delivery">
							<div class="main-delivery-item">
								<i class="fas fa-map-marker-alt"></i> Kampala
							</div>
							<div class="main-delivery-item">
								<i class="fas fa-undo"></i> Returns
							</div>
							<div class="main-delivery-item">
								<i class="fas fa-lock"></i> Secure
							</div>
						</div>

					</div>
					${suggestions.length > 0 ? `
					<div class="search-suggestions-panel">
						<div class="suggestions-heading">Similar Items (${suggestions.length})</div>
						<div class="suggestions-grid">
							${suggestions.map(s => `
								<div class="suggestion-card"
									data-id="${s._id}"
									data-name="${(s.name||'').replace(/"/g,'&quot;')}"
									data-price="${s.price}"
									data-image="${(s.image||'').replace(/"/g,'&quot;')}"
									data-category="${(s.category||'').replace(/"/g,'&quot;')}">
									<img src="${s.image}" onerror="this.src='https://placehold.co/200x160/111/FFF?text=IMG'" alt="${(s.name||'').replace(/"/g,'&quot;')}">
									<div class="suggestion-card-body">
										<div class="suggestion-card-name">${s.name}</div>
										<div class="suggestion-card-cat">${s.category}</div>
										<div class="suggestion-card-price">${formatUGX(s.price)}</div>
									</div>
									<button class="cart-btn s-cart-btn" data-sid="${s._id}">
										<i class="fa-solid fa-cart-shopping"></i> Add
									</button>
								</div>
							`).join('')}
						</div>
					</div>` : ''}
				</div>
			`;

			// Click main product image or body → open modal
			const mainPanel = container.querySelector('.search-main-panel');
			if (mainPanel) {
				mainPanel.addEventListener('click', (e) => {
					if (e.target.closest('.main-cart-btn') || e.target.closest('.fav-btn') || e.target.closest('.main-product-delivery')) return;
					if (typeof openProductModal === 'function') {
						openProductModal({
							id: main._id,
							name: main.name,
							category: main.category,
							price: main.price,
							image: main.image,
							description: main.description || ''
						});
					}
				});
			}

			// Cart: main product
			const mainCartBtn = container.querySelector('.main-cart-btn');
			if (mainCartBtn) {
				mainCartBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					const a = container.querySelector('.main-product-actions');
					if (typeof addToCart === 'function') addToCart({
						id: a.dataset.id, name: a.dataset.name, category: a.dataset.category,
						price: parseFloat(a.dataset.price), image: a.dataset.image
					});
				});
			}

			// Favorite: main product
			const favBtn = container.querySelector('.fav-btn');
			if (favBtn) {
				favBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					const pid = favBtn.dataset.id;
					const isNow = toggleWishlist(pid, { id: pid, name: main.name, category: main.category, price: main.price, image: main.image });
					favBtn.classList.toggle('favorited', isNow);
					favBtn.querySelector('i').className = isNow ? 'fas fa-heart' : 'far fa-heart';
				});
			}

			// Cart: suggestion cards
			container.querySelectorAll('.s-cart-btn').forEach(btn => {
				btn.addEventListener('click', (e) => {
					e.stopPropagation();
					const sid = btn.dataset.sid;
					const sp = (merged || []).find(p => p._id === sid);
					if (sp && typeof addToCart === 'function') addToCart({ id: sp._id, name: sp.name, category: sp.category, price: sp.price, image: sp.image });
				});
			});

			// Click suggestion card → swap to main panel AND open modal
			container.querySelectorAll('.suggestion-card').forEach(card => {
				card.addEventListener('click', (e) => {
					if (e.target.closest('.s-cart-btn')) return;
					const sid = card.dataset.id;
					const sp = (merged || []).find(p => p._id === sid);
					if (!sp) return;
					// 1. Swap to main panel
					const rest = products.filter(p => p._id !== sid);
					renderSearchResults([sp, ...rest], decodedQuery);
					window.scrollTo({ top: 0, behavior: 'smooth' });
					// 2. Open modal on top
					if (typeof openProductModal === 'function') {
						openProductModal({
							id: sp._id,
							name: sp.name,
							category: sp.category,
							price: sp.price,
							image: sp.image,
							description: sp.description || ''
						});
					}
				});
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

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
  const bar = document.getElementById('bar');
  const close = document.getElementById('close');
  const nav = document.getElementById('navbar');
  
  if (bar) {
    bar.addEventListener('click', (e) => {
      e.preventDefault();
      nav.classList.add('active');
    });
  }
  
  if (close) {
    close.addEventListener('click', (e) => {
      e.preventDefault();
      nav.classList.remove('active');
    });
  }

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (nav && !nav.contains(e.target) && !bar?.contains(e.target) && nav.classList.contains('active')) {
      nav.classList.remove('active');
    }
  });

  // Mobile search toggle
  const mobileSearch = document.getElementById('mobile-search');
  const mobileSearchLink = document.getElementById('mobile-search-link');
  const searchOverlay = document.getElementById('mobile-search-overlay');
  const closeSearch = document.getElementById('close-search');
  
  const openSearch = (e) => {
    e.preventDefault();
    if (searchOverlay) {
      searchOverlay.classList.add('active');
      // Close mobile menu if open
      if (nav) nav.classList.remove('active');
    }
  };
  
  if (mobileSearch) {
    mobileSearch.addEventListener('click', openSearch);
  }
  
  if (mobileSearchLink) {
    mobileSearchLink.addEventListener('click', openSearch);
  }
  
  if (closeSearch && searchOverlay) {
    closeSearch.addEventListener('click', () => {
      searchOverlay.classList.remove('active');
    });
  }

  // Mobile account dropdown
  const mobileAccount = document.getElementById('mobile-account');
  const mobileAccountDropdown = document.querySelector('.mobile-account-dropdown');
  
  if (mobileAccount && mobileAccountDropdown) {
    mobileAccount.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      mobileAccountDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!mobileAccountDropdown?.contains(e.target)) {
        mobileAccountDropdown?.classList.remove('active');
      }
    });
  }

  // Close search overlay with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchOverlay?.classList.contains('active')) {
      searchOverlay.classList.remove('active');
    }
  });
});

/* ═══════════════════════════════════════════
   NOVUNA PRODUCT DETAIL MODAL
   ═══════════════════════════════════════════ */
(function () {
    function buildModal() {
        if (document.getElementById('product-modal-overlay')) return;
        if (!document.querySelector('link[href*="product-modal.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'product-modal.css';
            document.head.appendChild(link);
        }
        const overlay = document.createElement('div');
        overlay.id = 'product-modal-overlay';
        overlay.innerHTML = `
            <div id="product-modal" role="dialog" aria-modal="true" aria-labelledby="modal-product-name">
                <button id="modal-close-btn" aria-label="Close"><i class="fas fa-times"></i></button>
                <div class="modal-body">
                    <div class="modal-image-panel">
                        <div class="modal-main-image-wrap">
                            <span class="modal-img-badge" id="modal-img-badge"></span>
                            <img id="modal-main-image" src="" alt="">
                        </div>
                    </div>
                    <div class="modal-info-panel">
                        <span class="modal-category" id="modal-category"><i class="fas fa-tag"></i> <span id="modal-category-text"></span></span>
                        <h2 class="modal-name" id="modal-product-name"></h2>
                        <div class="modal-stars">
                            <div class="stars">
                                <i class="fas fa-star"></i><i class="fas fa-star"></i>
                                <i class="fas fa-star"></i><i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                            </div>
                            <span class="review-count">(Verified Purchase)</span>
                        </div>
                        <div class="modal-price-wrap">
                            <span class="modal-price" id="modal-price"></span>
                            <span class="modal-price-label">Incl. all taxes</span>
                        </div>
                        <div class="modal-divider"></div>
                        <div class="modal-highlights">
                            <div class="modal-highlights-title">Product Highlights</div>
                            <div class="modal-highlight-row"><i class="fas fa-check-circle"></i><span>Genuine product — quality guaranteed</span></div>
                            <div class="modal-highlight-row"><i class="fas fa-shield-alt"></i><span>Warranty included on all electronics</span></div>
                            <div class="modal-highlight-row"><i class="fas fa-truck"></i><span>Free delivery on orders in Kampala</span></div>
                            <div class="modal-highlight-row" id="modal-desc-highlight" style="display:none;"><i class="fas fa-info-circle"></i><span id="modal-desc-text"></span></div>
                        </div>
                        <div class="modal-divider"></div>
                        <div class="modal-qty-wrap">
                            <span class="modal-qty-label">Quantity:</span>
                            <div class="modal-qty-controls">
                                <button class="qty-btn" id="qty-minus">−</button>
                                <input type="number" id="modal-qty-display" value="1" min="1" max="99" readonly>
                                <button class="qty-btn" id="qty-plus">+</button>
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button class="modal-add-cart-btn" id="modal-add-cart-btn">
                                <i class="fa-solid fa-cart-shopping"></i> Add to Cart
                            </button>
                            <button class="modal-wishlist-btn" id="modal-wishlist-btn" title="Add to Wishlist">
                                <i class="far fa-heart"></i>
                            </button>
                        </div>
                        <div class="modal-delivery-strip">
                            <div class="delivery-item"><i class="fas fa-map-marker-alt"></i> Delivery to Kampala</div>
                            <div class="delivery-item"><i class="fas fa-phone"></i> +256 754 030391</div>
                            <div class="delivery-item"><i class="fas fa-undo"></i> Easy Returns</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('modal-close-btn').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

        let qty = 1;
        document.getElementById('qty-minus').addEventListener('click', () => {
            if (qty > 1) { qty--; document.getElementById('modal-qty-display').value = qty; }
        });
        document.getElementById('qty-plus').addEventListener('click', () => {
            if (qty < 99) { qty++; document.getElementById('modal-qty-display').value = qty; }
        });

        document.getElementById('modal-add-cart-btn').addEventListener('click', () => {
            const btn = document.getElementById('modal-add-cart-btn');
            const product = window._modalCurrentProduct;
            if (!product || typeof addToCart !== 'function') return;
            const finalQty = parseInt(document.getElementById('modal-qty-display').value) || 1;
            for (let i = 0; i < finalQty; i++) addToCart(product);
            btn.classList.add('added');
            btn.innerHTML = '<i class="fas fa-check"></i> Added to Cart!';
            setTimeout(() => {
                btn.classList.remove('added');
                btn.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> Add to Cart';
            }, 2000);
        });

        document.getElementById('modal-wishlist-btn').addEventListener('click', () => {
            const btn = document.getElementById('modal-wishlist-btn');
            const product = window._modalCurrentProduct;
            if (!product) return;
            const isNow = toggleWishlist(product.id, product);
            btn.classList.toggle('active', isNow);
            btn.querySelector('i').className = isNow ? 'fas fa-heart' : 'far fa-heart';
        });
    }

    function openModal(product) {
        buildModal();
        window._modalCurrentProduct = product;
        const qtyInput = document.getElementById('modal-qty-display');
        if (qtyInput) qtyInput.value = 1;

        document.getElementById('modal-main-image').src = product.image || '';
        document.getElementById('modal-main-image').alt = product.name || '';
        document.getElementById('modal-main-image').onerror = function() {
            this.src = 'https://placehold.co/400x400/f0f4f3/088178?text=IMG';
        };
        document.getElementById('modal-product-name').textContent = product.name || 'Product';
        document.getElementById('modal-category-text').textContent = product.category || 'General';
        document.getElementById('modal-img-badge').textContent = product.category || '';

        const price = Number(product.price || 0);
        document.getElementById('modal-price').textContent =
            'UGX.' + price.toLocaleString(undefined, { maximumFractionDigits: 0 });

        const descRow = document.getElementById('modal-desc-highlight');
        const descText = document.getElementById('modal-desc-text');
        if (product.description && product.description.trim()) {
            descText.textContent = product.description.slice(0, 200);
            descRow.style.display = 'flex';
        } else {
            descRow.style.display = 'none';
        }

        const favBtn = document.getElementById('modal-wishlist-btn');
        const isFav = typeof isProductInWishlist === 'function' && isProductInWishlist(product.id);
        favBtn.classList.toggle('active', isFav);
        favBtn.querySelector('i').className = isFav ? 'fas fa-heart' : 'far fa-heart';

        const cartBtn = document.getElementById('modal-add-cart-btn');
        cartBtn.classList.remove('added');
        cartBtn.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> Add to Cart';

        document.getElementById('product-modal-overlay').classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        const overlay = document.getElementById('product-modal-overlay');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    window.openProductModal = openModal;

    // Global click — open modal on any .Pro card click (except buttons)
    document.addEventListener('click', function (e) {
        if (e.target.closest('.cart-btn') || e.target.closest('.favorite-btn') ||
            e.target.closest('.fav-btn') || e.target.closest('.s-cart-btn') ||
            e.target.closest('.main-cart-btn') || e.target.closest('#product-modal')) return;

        const card = e.target.closest('.Pro');
        if (!card) return;

        const id       = card.getAttribute('data-id');
        const name     = card.getAttribute('data-name');
        const category = card.getAttribute('data-category');
        const price    = card.getAttribute('data-price');
        const image    = card.getAttribute('data-image');

        if (!name || !price) return;

        let description = '';
        if (window._shopMergedProducts) {
            const found = window._shopMergedProducts.find(p => p._id === id || p.id === id);
            if (found) description = found.description || '';
        }

        openModal({ id, name, category, price: Number(price), image, description });
    }, true);

})();