/* ===================================================
   NOVA STORE — Main Application Logic
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // ── State ──
  const savedCart = localStorage.getItem('nova_cart');
  const savedWishlist = localStorage.getItem('nova_wishlist');
  const state = {
    cart: savedCart ? JSON.parse(savedCart) : [],
    wishlist: savedWishlist ? new Set(JSON.parse(savedWishlist)) : new Set(),
    isCartOpen: false,
    isSearchOpen: false,
    currentCategory: 'All',
    currentSort: 'featured',
    currentSearch: '',
  };

  // Products loaded from backend (fallback to in-browser PRODUCTS)
  let SERVER_PRODUCTS = null;

  // ── Local Storage Helpers ──
  function saveCartToLocalStorage() {
    localStorage.setItem('nova_cart', JSON.stringify(state.cart));
  }
  function saveWishlistToLocalStorage() {
    localStorage.setItem('nova_wishlist', JSON.stringify(Array.from(state.wishlist)));
  }

  function formatINR(amount, minimumFractionDigits = 0) {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits,
      maximumFractionDigits: minimumFractionDigits
    }).format(num);
  }

  // ── DOM References ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const navbar = $('#navbar');
  const hamburger = $('#hamburger');
  const navMenu = $('#nav-menu');
  const navHome = $('#nav-home');
  const navLogo = $('#nav-logo');
  const cartBtn = $('#cart-btn');
  const cartOverlay = $('#cart-overlay');
  const cartSidebar = $('#cart-sidebar');
  const cartClose = $('#cart-close');
  const cartItems = $('#cart-items');
  const cartEmpty = $('#cart-empty');
  const cartCount = $('#cart-count');
  const cartItemCount = $('#cart-item-count');
  const cartSubtotal = $('#cart-subtotal');
  const wishlistBtn = $('#wishlist-btn');
  const wishlistCount = $('#wishlist-count');
  const searchBtn = $('#search-btn');
  const searchOverlay = $('#search-overlay');
  const searchInput = $('#search-input');
  const searchSubmitBtn = $('#search-submit-btn');
  const searchSuggestions = $('.search-suggestions');
  const productsStatus = $('#products-status');
  const backToTop = $('#back-to-top');
  const newsletterForm = $('#newsletter-form');
  const toastContainer = $('#toast-container');

  // Quick View references
  const quickviewOverlay = $('#quickview-overlay');
  const quickviewClose = $('#quickview-close');
  const quickviewContent = $('#quickview-content');

  // Checkout references
  const checkoutOverlay = $('#checkout-overlay');
  const checkoutClose = $('#checkout-close');
  const checkoutForm = $('#checkout-form');
  const checkoutBtn = $('#cart-checkout-btn');
  const checkoutItems = $('#checkout-summary-items');
  const checkoutSubtotalVal = $('#checkout-subtotal');
  const checkoutTotalVal = $('#checkout-total');
  const checkoutStepForm = $('#checkout-step-form');
  const checkoutStepProcessing = $('#checkout-step-processing');
  const checkoutStepSuccess = $('#checkout-step-success');
  const successOrderId = $('#success-order-id');
  const successCloseBtn = $('#success-close-btn');
  // Auth references
  const loginBtn = $('#login-btn');

  let pendingOtpPhone = null;

  function getAuthToken() {
    return localStorage.getItem('nova_token');
  }

  function setAuthToken(token) {
    if (token) localStorage.setItem('nova_token', token);
    else localStorage.removeItem('nova_token');
  }

  function setAuthUser(user) {
    if (user) localStorage.setItem('nova_user', JSON.stringify(user));
    else localStorage.removeItem('nova_user');
    updateAuthUI();
  }

  function getAuthUser() {
    try { return JSON.parse(localStorage.getItem('nova_user') || 'null'); } catch { return null; }
  }

  function isAuthenticated() {
    return !!getAuthToken();
  }

  function updateAuthUI() {
    const user = getAuthUser();
    if (user && loginBtn) {
      loginBtn.textContent = `👤 ${user.name || user.email}`;
      loginBtn.classList.add('logged-in');
    } else if (loginBtn) {
      loginBtn.textContent = '👤 Login';
      loginBtn.classList.remove('logged-in');
    }
  }

  if (loginBtn) loginBtn.addEventListener('click', () => {
    if (isAuthenticated()) {
      window.location.href = '/profile';
    } else {
      window.location.href = '/login';
    }
  });

  if (wishlistBtn) wishlistBtn.addEventListener('click', () => {
    window.location.href = '/wishlist.html';
  });

  // Logout via long-press on login button (simple approach)
  if (loginBtn) {
    loginBtn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      setAuthToken(null); setAuthUser(null);
      showToast('Signed out', 'info');
    });
  }

  // Initialize auth UI
  updateAuthUI();


  // ═══════════════════════════════════════════════════
  // NAVBAR — Scroll Effect & Hamburger
  // ═══════════════════════════════════════════════════
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    // Navbar background on scroll
    if (navbar) {
      if (scrollY > 50) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    }

    // Back to Top visibility
    if (backToTop) {
      if (scrollY > 600) backToTop.classList.add('visible');
      else backToTop.classList.remove('visible');
    }

    // Active nav link based on section
    updateActiveNavLink();

    lastScroll = scrollY;
  }, { passive: true });

  // Hamburger toggle
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const spans = hamburger.querySelectorAll('span');
      if (navMenu.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });
  }

  // Close mobile menu on link click
  $$('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (!navMenu || !hamburger) return;
      navMenu.classList.remove('active');
      const spans = hamburger.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    });
  });

  // Active nav link
  function updateActiveNavLink() {
    const sections = ['hero', 'categories', 'products', 'deals', 'reviews'];
    const navLinks = $$('.nav-link');

    for (let i = sections.length - 1; i >= 0; i--) {
      const section = document.getElementById(sections[i]);
      if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 150) {
          navLinks.forEach(l => l.classList.remove('active'));
          const matchLink = [...navLinks].find(l =>
            l.getAttribute('href') === `#${sections[i]}` ||
            (sections[i] === 'hero' && l.getAttribute('href') === '#')
          );
          if (matchLink) matchLink.classList.add('active');
          break;
        }
      }
    }
  }

  // Back to Top
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ═══════════════════════════════════════════════════
  // CART
  // ═══════════════════════════════════════════════════
  function openCart() {
    state.isCartOpen = true;
    cartOverlay.classList.add('active');
    cartSidebar.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    state.isCartOpen = false;
    cartOverlay.classList.remove('active');
    cartSidebar.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (cartClose) cartClose.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
  if (navHome) {
    navHome.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.reload();
    });
  }
  if (navLogo) {
    navLogo.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.reload();
    });
  }

  function addToCart(productId) {
    let name = '';
    let price = 0;
    let image = '';
    // Prefer server-loaded products when available
    const PROD_SRC = (Array.isArray(SERVER_PRODUCTS) && SERVER_PRODUCTS.length) ? SERVER_PRODUCTS : (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []);
    if (Array.isArray(PROD_SRC) && PROD_SRC.length) {
      const product = PROD_SRC.find(p => p.id === productId);
      if (product) {
        name = product.name;
        price = product.price;
        image = product.image;
      }
    }
    
    if (!name) {
      const card = document.querySelector(`[data-product-id="${productId}"]`);
      if (card) {
        name = card.dataset.name;
        price = parseFloat(card.dataset.price);
        image = card.dataset.image;
      }
    }
    
    if (!name) return;

    const existingItem = state.cart.find(item => item.id === productId);
    if (existingItem) {
      existingItem.qty += 1;
    } else {
      state.cart.push({ id: productId, name, price, image, qty: 1 });
    }

    renderCart();
    saveCartToLocalStorage();
    showToast(`${name} added to cart`, 'success');

    // Animate the cart button
    if (cartBtn) {
      cartBtn.style.transform = 'scale(1.3)';
      setTimeout(() => { cartBtn.style.transform = ''; }, 300);
    }
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    renderCart();
    saveCartToLocalStorage();
  }

  function updateCartQty(productId, delta) {
    const item = state.cart.find(i => i.id === productId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
      removeFromCart(productId);
      return;
    }
    renderCart();
    saveCartToLocalStorage();
  }

  function renderCart() {
    const totalItems = state.cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    if (cartCount) cartCount.textContent = totalItems;
    if (cartItemCount) cartItemCount.textContent = totalItems;
    if (cartSubtotal) cartSubtotal.textContent = formatINR(subtotal, 2);

    if (!cartItems) return;

    if (state.cart.length === 0) {
      cartItems.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">🛒</div>
          <div class="cart-empty-text">Your cart is empty</div>
        </div>
      `;
      return;
    }

    cartItems.innerHTML = state.cart.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${formatINR(item.price * item.qty, 2)}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="window.novaStore.updateQty('${item.id}', -1)">−</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn" onclick="window.novaStore.updateQty('${item.id}', 1)">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="window.novaStore.removeItem('${item.id}')">✕</button>
      </div>
    `).join('');
  }

  // Update cart item prices from SERVER_PRODUCTS (keep qty & id/name)
  function updateCartPricesFromServer() {
    if (!Array.isArray(SERVER_PRODUCTS) || SERVER_PRODUCTS.length === 0) return;
    let changed = false;
    state.cart.forEach(item => {
      const prod = SERVER_PRODUCTS.find(p => p.id === item.id);
      if (prod && prod.price !== item.price) {
        item.price = prod.price;
        changed = true;
      }
    });
    if (changed) {
      saveCartToLocalStorage();
      renderCart();
    }
  }

  // Expose cart methods globally for onclick handlers and external pages
  window.novaStore = {
    updateQty: (id, delta) => updateCartQty(id, delta),
    removeItem: (id) => removeFromCart(id),
    addToCart: (id) => addToCart(id),
  };

    // Re-attach product events happens after render products, but we still need to remove old ones.
    // Instead of attaching here globally, we handle it inside attachProductEvents for all buttons.

  // Wishlist toggle is also handled inside attachProductEvents now.

  // ═══════════════════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════════════════
  function openSearch() {
    state.isSearchOpen = true;
    if (searchOverlay) searchOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (searchInput) {
      searchInput.value = state.currentSearch || '';
      setTimeout(() => searchInput.focus(), 200);
    }
  }

  function closeSearch(resetSearch = false) {
    state.isSearchOpen = false;
    if (searchOverlay) searchOverlay.classList.remove('active');
    document.body.style.overflow = '';
    if (resetSearch && searchInput) {
      searchInput.value = '';
      state.currentSearch = '';
      applyFiltersAndSort();
      renderSearchSuggestions('');
    }
  }

  function getSearchProducts() {
    const PRODUCTS_SOURCE = (Array.isArray(SERVER_PRODUCTS) && SERVER_PRODUCTS.length) ? SERVER_PRODUCTS : (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []);
    return Array.isArray(PRODUCTS_SOURCE) ? PRODUCTS_SOURCE : [];
  }

  function renderSearchSuggestions(query) {
    if (!searchSuggestions) return;
    const normalized = String(query || '').trim().toLowerCase();
    const allProducts = getSearchProducts();
    let matched = [];

    if (normalized.length > 0) {
      matched = allProducts.filter(p =>
        p.name.toLowerCase().includes(normalized) ||
        p.category.toLowerCase().includes(normalized) ||
        (p.description && p.description.toLowerCase().includes(normalized))
      ).slice(0, 6);
    }

    if (!matched.length) {
      matched = [
        { text: 'Wireless Headphones', sub: 'Popular search' },
        { text: 'Smartwatch', sub: 'Popular search' },
        { text: 'Mechanical Keyboard', sub: 'Popular search' },
        { text: 'Bluetooth Speaker', sub: 'Popular search' },
      ];
    }

    searchSuggestions.innerHTML = `
      <div class="search-suggestion-title">${normalized.length > 0 ? 'Related searches' : 'Popular searches'}</div>
      ${matched.map(item => {
        const title = item.text || item.name || '';
        const subtitle = item.sub || item.category || '';
        return `
          <div class="search-suggestion-item">
            <span class="search-suggestion-icon">🔎</span>
            <div>
              <div class="search-suggestion-text">${title}</div>
              <div class="search-suggestion-sub">${subtitle}</div>
            </div>
          </div>
        `;
      }).join('')}
    `;
  }

  function handleSearchSubmit() {
    const query = state.currentSearch.trim();
    if (!query.length) {
      showToast('Please enter a search keyword.', 'warning');
      return;
    }
    applyFiltersAndSort();
    closeSearch();
    const productsSection = $('#products');
    if (productsSection) {
      const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
      const top = productsSection.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  if (searchBtn) searchBtn.addEventListener('click', openSearch);
  if (searchOverlay) {
    searchOverlay.addEventListener('click', (e) => {
      if (e.target === searchOverlay) closeSearch();
    });
  }

  // Keyboard shortcut: Ctrl+K to open search, ESC to close
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (state.isSearchOpen) closeSearch();
      else openSearch();
    }
    if (e.key === 'Escape') {
      if (state.isSearchOpen) closeSearch();
      if (state.isCartOpen) closeCart();
    }
  });

  // ═══════════════════════════════════════════════════
  // COUNTDOWN TIMER
  // ═══════════════════════════════════════════════════
  function startCountdown() {
    // Set deal end to 3 days from now
    const endTime = new Date().getTime() + 3 * 24 * 60 * 60 * 1000;

    function update() {
      const now = new Date().getTime();
      const diff = endTime - now;

      if (diff <= 0) return;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const daysEl = $('#countdown-days');
      const hoursEl = $('#countdown-hours');
      const minsEl = $('#countdown-mins');
      const secsEl = $('#countdown-secs');

      if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
      if (minsEl) minsEl.textContent = String(mins).padStart(2, '0');
      if (secsEl) secsEl.textContent = String(secs).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
  }

  startCountdown();

  // ═══════════════════════════════════════════════════
  // SCROLL REVEAL
  // ═══════════════════════════════════════════════════
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px',
  });

  $$('.reveal').forEach(el => revealObserver.observe(el));
  renderDealProducts();

  // ═══════════════════════════════════════════════════
  // NEWSLETTER
  // ═══════════════════════════════════════════════════
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = $('#newsletter-email').value;
      if (email) {
        showToast('Welcome aboard! Check your inbox 📧', 'success');
        $('#newsletter-email').value = '';
      }
    });
  }

  // ═══════════════════════════════════════════════════
  // TOAST NOTIFICATIONS
  // ═══════════════════════════════════════════════════
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      padding: 14px 24px;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      color: white;
      pointer-events: auto;
      animation: toastIn 0.3s ease-out forwards;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      white-space: nowrap;
    `;

    const colors = {
      success: 'linear-gradient(135deg, rgba(81,207,102,0.9), rgba(52,168,83,0.9))',
      info: 'linear-gradient(135deg, rgba(124,92,252,0.9), rgba(92,225,230,0.9))',
      warning: 'linear-gradient(135deg, rgba(255,169,77,0.9), rgba(255,107,157,0.9))',
    };

    toast.style.background = colors[type] || colors.info;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease-in forwards';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // Toast keyframes
  const toastStyles = document.createElement('style');
  toastStyles.textContent = `
    @keyframes toastIn {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes toastOut {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to { opacity: 0; transform: translateY(-10px) scale(0.95); }
    }
  `;
  document.head.appendChild(toastStyles);

  // ═══════════════════════════════════════════════════
  // PRODUCT RENDERING
  // ═══════════════════════════════════════════════════
  function deriveProductWeight(product) {
    if (!product || !product.specs) return 'Standard';
    if (product.specs.Weight) return product.specs.Weight;

    const sizeSpec = product.specs.Dimensions || product.specs.Size || product.specs['Product Size'];
    if (!sizeSpec) return 'Standard';

    const digits = sizeSpec.match(/[\d.]+/g);
    if (!digits || !digits.length) return 'Standard';

    const values = digits.map(Number).filter(v => !Number.isNaN(v));
    if (!values.length) return 'Standard';

    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const estimatedGrams = sizeSpec.toLowerCase().includes('mm') ? avg : avg;

    if (estimatedGrams >= 1000) {
      return `${(estimatedGrams / 1000).toFixed(1)}kg`;
    }
    return `${Math.round(estimatedGrams)}g`;
  }

  function renderProducts(productsToRender) {
    const productsGrid = $('#products-grid');
    if (!productsGrid) return;

    if (productsStatus) {
      if (state.currentSearch.trim().length >= 2) {
        productsStatus.innerHTML = productsToRender.length === 0
          ? `<div class="products-status-message">No products matched "<strong>${state.currentSearch}</strong>". Try a different search term.</div>`
          : `<div class="products-status-message">Showing ${productsToRender.length} results for "<strong>${state.currentSearch}</strong>".</div>`;
      } else if (state.currentCategory !== 'All') {
        productsStatus.innerHTML = productsToRender.length === 0
          ? `<div class="products-status-message">No products found in <strong>${state.currentCategory}</strong>. Try another category.</div>`
          : `<div class="products-status-message">Showing ${productsToRender.length} products in <strong>${state.currentCategory}</strong>.</div>`;
      } else {
        productsStatus.innerHTML = '';
      }
    }

    if (productsToRender.length === 0) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-4xl) 0;">
          <h3 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 1rem;">No products found</h3>
          <p style="color: var(--clr-text-secondary);">Try adjusting your search or category filters.</p>
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = productsToRender.map((product, index) => {
      const delayClass = `reveal-delay-${(index % 4) + 1}`;
      
      let badgeHtml = '';
      if (product.badge === 'hot') badgeHtml = '<span class="product-badge product-badge-hot">Hot</span>';
      else if (product.badge === 'new') badgeHtml = '<span class="product-badge product-badge-new">New</span>';
      else if (product.badge === 'sale') badgeHtml = '<span class="product-badge product-badge-sale">Sale</span>';

      let priceHtml = `<span class="product-price-current">${formatINR(product.price, 0)}</span>`;
      if (product.originalPrice) {
        priceHtml += `<span class="product-price-original">${formatINR(product.originalPrice, 0)}</span>`;
      }

      let starsHtml = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating));

      const displayWeight = deriveProductWeight(product);
      return `
        <div class="product-card reveal visible ${delayClass}" data-product-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-image="${product.image}">
          <div class="product-image-wrapper">
            <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
            ${badgeHtml}
            <div class="product-actions">
              <button class="product-action-btn wishlist-toggle" aria-label="Add to wishlist" data-product-id="${product.id}">
                ${state.wishlist.has(product.id) ? '♥' : '♡'}
              </button>
              <button class="product-action-btn quick-view-btn" aria-label="Quick view" data-product-id="${product.id}">👁</button>
            </div>
          </div>
          <div class="product-info">
            <div class="product-category">${product.category}</div>
            <div class="product-name">${product.name}</div>
            <div class="product-weight">${displayWeight}</div>
            <div class="product-rating">
              <div class="product-stars">${starsHtml}</div>
              <span class="product-rating-text">(${product.rating} · ${(product.reviews/1002).toFixed(1)}k)</span>
            </div>
            <div class="product-footer">
              <div class="product-price">${priceHtml}</div>
              <button class="product-add-btn add-to-cart" aria-label="Add to cart" data-product-id="${product.id}">+</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Re-attach event listeners to new elements
    attachProductEvents();
  }

  function renderDealProducts() {
    const dealGrid = $('#deals-grid');
    if (!dealGrid) return;

    const PRODUCTS_SOURCE = (Array.isArray(SERVER_PRODUCTS) && SERVER_PRODUCTS.length) ? SERVER_PRODUCTS : (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []);
    const uniqueDealItems = [];
    const seenImages = new Set();

    for (const product of (Array.isArray(PRODUCTS_SOURCE) ? PRODUCTS_SOURCE : [])) {
      if (product.badge === 'sale' || product.badge === 'hot' || product.featured) {
        if (!seenImages.has(product.image)) {
          uniqueDealItems.push(product);
          seenImages.add(product.image);
        }
      }
      if (uniqueDealItems.length === 8) break;
    }

    if (!uniqueDealItems.length) {
      dealGrid.innerHTML = '<div class="deal-placeholder">No deals available right now.</div>';
      return;
    }

    dealGrid.innerHTML = uniqueDealItems.map((product, index) => {
      const badgeLabel = product.badge === 'hot' ? 'Hot' : product.badge === 'sale' ? 'Sale' : 'Featured';
      return `
        <article class="deal-card reveal reveal-delay-${(index % 4) + 1}" data-product-id="${product.id}">
          <img src="${product.image}" alt="${product.name}">
          <div class="deal-card-actions">
            <button class="product-action-btn wishlist-toggle" aria-label="Add to wishlist" data-product-id="${product.id}">
              ${state.wishlist.has(product.id) ? '♥' : '♡'}
            </button>
            <button class="product-action-btn quick-view-btn" aria-label="Quick view" data-product-id="${product.id}">👁</button>
          </div>
          <div class="deal-card-category">${product.category}</div>
          <h3 class="deal-card-title">${product.name}</h3>
          <div class="deal-card-price">${formatINR(product.price, 0)}</div>
          ${product.originalPrice ? `<div class="deal-card-original">${formatINR(product.originalPrice, 0)}</div>` : ''}
          ${product.badge ? `<span class="deal-card-badge">${badgeLabel}</span>` : ''}
          <div class="deal-card-footer">
            <button class="product-add-btn add-to-cart" aria-label="Add to cart" data-product-id="${product.id}">+</button>
          </div>
        </article>
      `;
    }).join('');

    dealGrid.querySelectorAll('.deal-card.reveal').forEach(card => {
      revealObserver.observe(card);
    });

    // Attach shared product events for deal cards as well
    attachProductEvents();
  }

  function attachProductEvents() {
    // Add to cart
    $$('.add-to-cart').forEach(btn => {
      if (btn.dataset.novaBound) return;
      btn.dataset.novaBound = 'true';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = btn.dataset.productId;
        addToCart(productId);
      });
    });

    // Wishlist toggle
    $$('.wishlist-toggle').forEach(btn => {
      if (btn.dataset.novaBound) return;
      btn.dataset.novaBound = 'true';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.productId;

        if (state.wishlist.has(id)) {
          state.wishlist.delete(id);
          btn.textContent = '♡';
          btn.style.color = '';
          showToast('Removed from wishlist', 'info');
        } else {
          state.wishlist.add(id);
          btn.textContent = '♥';
          btn.style.color = '#ff6b9d';
          showToast('Added to wishlist', 'success');
        }

        saveWishlistToLocalStorage();
        if (wishlistCount) wishlistCount.textContent = state.wishlist.size;
      });
    });

    // Quick View click handler
    $$('.quick-view-btn').forEach(btn => {
      if (btn.dataset.novaBound) return;
      btn.dataset.novaBound = 'true';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.productId;
        openQuickView(id);
      });
    });

    // Tilt effect
    $$('.product-card').forEach(card => {
      if (card.dataset.novaTiltBound) return;
      card.dataset.novaTiltBound = 'true';
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const rotateX = (y - 0.5) * -8;
        const rotateY = (x - 0.5) * 8;
        card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ═══════════════════════════════════════════════════
  // QUICK VIEW MODAL
  // ═══════════════════════════════════════════════════
  function openQuickView(productId) {
    const PROD_SRC = (Array.isArray(SERVER_PRODUCTS) && SERVER_PRODUCTS.length) ? SERVER_PRODUCTS : (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []);
    const product = Array.isArray(PROD_SRC) ? PROD_SRC.find(p => p.id === productId) : null;
    if (!product) return;

    let starsHtml = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating));
let priceHtml = `<span class="quickview-price">${formatINR(product.price, 0)}</span>`;
      if (product.originalPrice) {
        priceHtml += `<span class="quickview-price-original">${formatINR(product.originalPrice, 0)}</span>`;
    }

    let specsHtml = '';
    if (product.specs) {
      specsHtml = Object.entries(product.specs).map(([key, val]) => `
        <div class="quickview-spec-item">
          <span class="quickview-spec-label">${key}:</span> ${val}
        </div>
      `).join('');
    }

    quickviewContent.innerHTML = `
      <div class="quickview-grid">
        <div class="quickview-img-area">
          <img src="${product.image}" alt="${product.name}" id="qv-img">
        </div>
        <div class="quickview-info-area">
          <span class="quickview-cat">${product.category}</span>
          <h2 class="quickview-title">${product.name}</h2>
          <div class="quickview-rating">
            <div class="quickview-stars">${starsHtml}</div>
            <span class="quickview-reviews">(${product.rating} · ${(product.reviews/1000).toFixed(1)}k reviews)</span>
          </div>
          <div class="quickview-price-row">
            ${priceHtml}
          </div>
          <p class="quickview-desc">${product.description || 'No description available.'}</p>
          
          ${specsHtml ? `
            <h4 class="quickview-specs-title">Specifications</h4>
            <div class="quickview-specs-grid">
              ${specsHtml}
            </div>
          ` : ''}

          <div class="quickview-weight">Weight: ${deriveProductWeight(product)}</div>
      <div class="quickview-actions">
            <div class="quickview-qty">
              <button class="qty-btn" id="qv-qty-minus">−</button>
              <span class="qty-value" id="qv-qty-val">1</span>
              <button class="qty-btn" id="qv-qty-plus">+</button>
            </div>
            <button class="btn btn-primary quickview-add-btn" id="qv-add-to-cart">Add to Cart →</button>
          </div>
        </div>
      </div>
    `;

    let qty = 1;
    const qvMinus = $('#qv-qty-minus');
    const qvPlus = $('#qv-qty-plus');
    const qvVal = $('#qv-qty-val');
    
    qvMinus.addEventListener('click', () => {
      if (qty > 1) {
        qty--;
        qvVal.textContent = qty;
      }
    });
    
    qvPlus.addEventListener('click', () => {
      qty++;
      qvVal.textContent = qty;
    });

    const qvAddBtn = $('#qv-add-to-cart');
    qvAddBtn.addEventListener('click', () => {
      for (let i = 0; i < qty; i++) {
        addToCart(product.id);
      }
      closeQuickView();
    });

    quickviewOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeQuickView() {
    quickviewOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (quickviewClose) {
    quickviewClose.addEventListener('click', closeQuickView);
  }
  if (quickviewOverlay) {
    quickviewOverlay.addEventListener('click', (e) => {
      if (e.target === quickviewOverlay) closeQuickView();
    });
  }

  // ═══════════════════════════════════════════════════
  // CHECKOUT MODAL
  // ═══════════════════════════════════════════════════
  function openCheckout() {
    if (state.cart.length === 0) {
      showToast('Your cart is empty!', 'warning');
      return;
    }
    // Require auth before checkout
    if (!isAuthenticated()) {
      showToast('Please sign in to continue to checkout', 'info');
      window.location.href = '/login';
      return;
    }
    
    closeCart();
    
    checkoutStepForm.classList.add('active');
    checkoutStepProcessing.classList.remove('active');
    checkoutStepSuccess.classList.remove('active');
    
    checkoutItems.innerHTML = state.cart.map(item => `
      <div class="checkout-summary-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="checkout-summary-details">
          <div class="checkout-summary-name">${item.name}</div>
          <div class="checkout-summary-qty">Qty: ${item.qty}</div>
        </div>
        <div class="checkout-summary-price">${formatINR(item.price * item.qty, 2)}</div>
      </div>
    `).join('');
    
    const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const totalStr = formatINR(subtotal, 2);
    checkoutSubtotalVal.textContent = totalStr;
    checkoutTotalVal.textContent = totalStr;
    
    checkoutOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCheckout() {
    checkoutOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckout);
  if (checkoutClose) checkoutClose.addEventListener('click', closeCheckout);
  if (checkoutOverlay) {
    checkoutOverlay.addEventListener('click', (e) => {
      if (e.target === checkoutOverlay) closeCheckout();
    });
  }
  if (successCloseBtn) successCloseBtn.addEventListener('click', closeCheckout);

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Gather basic customer info (do not send card details in this demo)
      const customer = {
        name: ($('#shipping-name') && $('#shipping-name').value) || '',
        email: ($('#shipping-email') && $('#shipping-email').value) || '',
        address: ($('#shipping-address') && $('#shipping-address').value) || '',
        city: ($('#shipping-city') && $('#shipping-city').value) || '',
        zip: ($('#shipping-zip') && $('#shipping-zip').value) || ''
      };

      checkoutStepForm.classList.remove('active');
      checkoutStepProcessing.classList.add('active');

      try {
        const token = getAuthToken();
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify({ cart: state.cart, customer })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Checkout failed');

        const orderId = data.orderId;

        // Simulate payment by calling the pay endpoint
        try {
          const payRes = await fetch(`/api/pay/${orderId}`, { method: 'POST' });
          const payData = await payRes.json();
          if (!payRes.ok) throw new Error(payData.error || 'Payment failed');

          successOrderId.textContent = payData.orderId || orderId;

          state.cart = [];
          renderCart();
          saveCartToLocalStorage();

          checkoutStepProcessing.classList.remove('active');
          checkoutStepSuccess.classList.add('active');
          showToast('Order placed and paid successfully! 🎉', 'success');
        } catch (payErr) {
          console.error('Payment step failed', payErr);
          checkoutStepProcessing.classList.remove('active');
          checkoutStepForm.classList.add('active');
          showToast('Payment failed. Please try again.', 'warning');
        }
      } catch (err) {
        console.error('Checkout error', err);
        checkoutStepProcessing.classList.remove('active');
        checkoutStepForm.classList.add('active');
        showToast('Checkout failed. Please try again.', 'warning');
      }
    });
  }

  // ═══════════════════════════════════════════════════
  // FILTERING & SORTING PIPELINE
  // ═══════════════════════════════════════════════════
  function applyFiltersAndSort() {
    const PRODUCTS_SOURCE = (Array.isArray(SERVER_PRODUCTS) && SERVER_PRODUCTS.length) ? SERVER_PRODUCTS : (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []);
    if (!Array.isArray(PRODUCTS_SOURCE)) return;

    let result = [...PRODUCTS_SOURCE];

    // 1. Apply category filter
    if (state.currentCategory !== 'All') {
      result = result.filter(p => p.category === state.currentCategory);
    }

    // 2. Apply search filter
    if (state.currentSearch.trim().length >= 2) {
      const q = state.currentSearch.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // 3. Apply sorting
    const sortComparators = {
      'price-low': (a, b) => a.price - b.price || a.name.localeCompare(b.name),
      'price-high': (a, b) => b.price - a.price || a.name.localeCompare(b.name),
      'rating': (a, b) => b.rating - a.rating || a.name.localeCompare(b.name),
      'popularity': (a, b) => b.reviews - a.reviews || a.name.localeCompare(b.name),
      'featured': (a, b) => {
        const featuredDiff = (b.featured === a.featured) ? 0 : (b.featured ? 1 : -1);
        return featuredDiff || a.name.localeCompare(b.name);
      },
    };

    const comparator = sortComparators[state.currentSort] || sortComparators.featured;
    result.sort(comparator);

    renderProducts(result);
  }
  
  // Fetch products from backend (falls back to in-browser PRODUCTS)
  async function fetchAndInitProducts() {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        SERVER_PRODUCTS = Array.isArray(data) ? data : [];
      } else {
        SERVER_PRODUCTS = (typeof PRODUCTS !== 'undefined') ? PRODUCTS : [];
      }
    } catch (err) {
      SERVER_PRODUCTS = (typeof PRODUCTS !== 'undefined') ? PRODUCTS : [];
    }

    applyFiltersAndSort();
    // Ensure cart prices reflect server-authoritative product prices on initial load
    updateCartPricesFromServer();

    // Start SSE to receive real-time product updates from server
    startSSE();

    // Bind category cards click (in categories section)
    $$('.category-card').forEach(card => {
      card.addEventListener('click', () => {
        const catName = card.querySelector('.category-name').textContent;
        state.currentCategory = catName;

        if (state.currentSearch) {
          state.currentSearch = '';
          if (searchInput) searchInput.value = '';
        }

        // Update control filter tabs active state
        $$('.filter-tab').forEach(t => {
          if (t.dataset.category === catName) t.classList.add('active');
          else t.classList.remove('active');
        });

        applyFiltersAndSort();
        showToast(`Showing ${catName} products`, 'info');

        // Scroll to products
        const productsSection = $('#products');
        if (productsSection) {
          const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
          const top = productsSection.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });

    // Bind control filter tabs click (in products controls section)
    $$('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.currentCategory = tab.dataset.category;

        if (state.currentSearch) {
          state.currentSearch = '';
          if (searchInput) searchInput.value = '';
        }

        applyFiltersAndSort();
        showToast(`Filter: ${state.currentCategory}`, 'info');
      });
    });

    // Bind sort select
    const sortSelect = $('#sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.currentSort = e.target.value;
        applyFiltersAndSort();
      });
    }

    // Bind navbar search input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.currentSearch = e.target.value;
        renderSearchSuggestions(state.currentSearch);
        applyFiltersAndSort();
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSearchSubmit();
        }
      });
    }

    if (searchSubmitBtn) {
      searchSubmitBtn.addEventListener('click', handleSearchSubmit);
    }

    if (searchSuggestions) {
      searchSuggestions.addEventListener('click', (e) => {
        const item = e.target.closest('.search-suggestion-item');
        if (!item) return;
        const textEl = item.querySelector('.search-suggestion-text');
        const txt = textEl ? textEl.textContent.trim() : '';
        if (!txt || !searchInput) return;
        searchInput.value = txt;
        state.currentSearch = txt;
        renderSearchSuggestions(txt);
        applyFiltersAndSort();
        closeSearch();

        const productsSection = $('#products');
        if (productsSection) {
          const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
          const top = productsSection.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    }
  }

  // Poll backend for product updates and refresh UI when data changes
  let _productPollIntervalId = null;
  function startProductPolling(intervalMs = 15000) {
    if (_productPollIntervalId) return; // already running
    _productPollIntervalId = setInterval(async () => {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) return;
        const data = await res.json();
        const newProducts = Array.isArray(data) ? data : [];
        // shallow compare via JSON; acceptable for small product sets
        if (!SERVER_PRODUCTS) {
          SERVER_PRODUCTS = newProducts;
        } else if (JSON.stringify(newProducts) !== JSON.stringify(SERVER_PRODUCTS)) {
          SERVER_PRODUCTS = newProducts;
          applyFiltersAndSort();
          updateCartPricesFromServer();
          showToast('Prices updated', 'info');
          console.log('[Products Poll] Updated products from server');
        }
      } catch (e) {
        // ignore polling errors silently
      }
    }, intervalMs);
  }

  // SSE real-time updates (preferred)
  let _sse = null;
  function startSSE() {
    if (typeof EventSource === 'undefined') return; // not supported
    if (_sse) return;
    try {
      _sse = new EventSource('/events');
      _sse.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload && payload.type === 'products' && Array.isArray(payload.products)) {
            SERVER_PRODUCTS = payload.products;
            applyFiltersAndSort();
            updateCartPricesFromServer();
            showToast('Prices updated', 'info');
            console.log('[SSE] Products updated from server');
          }
        } catch (e) { console.error('SSE parse error', e); }
      };
      _sse.onerror = (e) => {
        console.warn('SSE error, will attempt reconnect');
        _sse.close();
        _sse = null;
        setTimeout(startSSE, 3000);
      };
    } catch (e) {
      console.warn('SSE start failed', e);
    }
  }

  // Kick off product fetch and init
  fetchAndInitProducts();

  // Listen for product change notifications from other tabs (admin)
  window.addEventListener('storage', async (e) => {
    if (e.key !== 'nova_products_updated') return;
    try {
      const res = await fetch('/api/products');
      if (!res.ok) return;
      const data = await res.json();
      const newProducts = Array.isArray(data) ? data : [];
      if (JSON.stringify(newProducts) !== JSON.stringify(SERVER_PRODUCTS)) {
        SERVER_PRODUCTS = newProducts;
        applyFiltersAndSort();
        updateCartPricesFromServer();
        showToast('Prices updated', 'info');
        console.log('[Products Storage] Updated products from admin tab');
      }
    } catch (err) {
      // ignore
    }
  });
  

  // Bind popular suggestion items in search modal
  $$('.search-suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      const txt = item.querySelector('.search-suggestion-text').textContent;
      if (searchInput) {
        searchInput.value = txt;
        state.currentSearch = txt;
        applyFiltersAndSort();
        closeSearch();
        
        const productsSection = $('#products');
        if (productsSection) {
          const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
          const top = productsSection.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
    });
  });

  // Render initial cart and wishlist
  renderCart();
  if (wishlistCount) wishlistCount.textContent = state.wishlist.size;

  // Log for dev
  console.log('%c⚡ NOVA Store loaded successfully', 'color:#7c5cfc;font-size:14px;font-weight:bold;');
});
