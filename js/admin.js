/* ===================================================
   NOVA ADMIN DASHBOARD — Client Logic
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // ── DOM Refs (login screen) ──
  const adminLoginScreen = document.getElementById('admin-login-screen');
  const adminLoginForm   = document.getElementById('admin-login-form');
  const adminEmailInput  = document.getElementById('admin-email');
  const adminPassInput   = document.getElementById('admin-password');
  const adminLoginError  = document.getElementById('admin-login-error');
  const adminLoginBtn    = document.getElementById('admin-login-btn');
  const adminLoginSpinner = document.getElementById('admin-login-spinner');
  const adminLoginBtnText = adminLoginBtn ? adminLoginBtn.querySelector('.admin-login-btn-text') : null;
  const adminNav         = document.getElementById('admin-nav');
  const adminMain        = document.getElementById('admin-main');

  // ── Admin Auth State ──
  let adminToken = localStorage.getItem('nova_admin_token');

  // Check if existing admin token is still valid
  async function verifyAdminToken() {
    if (!adminToken) return false;
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) return true;
      // Token invalid or expired
      localStorage.removeItem('nova_admin_token');
      adminToken = null;
      return false;
    } catch {
      return false;
    }
  }

  // Show dashboard, hide login
  function showDashboard() {
    adminLoginScreen.classList.add('hidden');
    adminNav.style.display = '';
    adminMain.style.display = '';
    initDashboard();
  }

  // Show login, hide dashboard
  function showLogin() {
    adminLoginScreen.classList.remove('hidden');
    adminNav.style.display = 'none';
    adminMain.style.display = 'none';
  }

  // Handle admin login form
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = adminEmailInput.value.trim();
      const password = adminPassInput.value;

      // Show spinner
      adminLoginError.style.display = 'none';
      if (adminLoginBtnText) adminLoginBtnText.textContent = 'Signing in...';
      if (adminLoginSpinner) adminLoginSpinner.style.display = '';
      adminLoginBtn.disabled = true;

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Login failed');
        }

        // Save admin token
        adminToken = data.token;
        localStorage.setItem('nova_admin_token', data.token);
        showDashboard();

      } catch (err) {
        adminLoginError.textContent = err.message || 'Invalid admin credentials';
        adminLoginError.style.display = 'block';
      } finally {
        if (adminLoginBtnText) adminLoginBtnText.textContent = 'Sign In to Dashboard';
        if (adminLoginSpinner) adminLoginSpinner.style.display = 'none';
        adminLoginBtn.disabled = false;
      }
    });
  }

  // On page load: verify token or show login
  verifyAdminToken().then(valid => {
    if (valid) showDashboard();
    else showLogin();
  });

  // ═══════════════════════════════════════════════════
  // DASHBOARD INIT (called after successful login)
  // ═══════════════════════════════════════════════════
  let dashboardInitialized = false;

  function initDashboard() {
    if (dashboardInitialized) return;
    dashboardInitialized = true;

  // ── State ──
  let allProducts = [];
  let allUsers = [];
  let allOrders = [];
  let currentAdminView = 'products';
  let selectedUser = null;
  let editingProductId = null;
  let deletingProductId = null;
  let deletingProductName = '';

  // ── DOM Refs ──
  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);

  const statProductsVal  = $('#stat-products-value');
  const statUsersVal     = $('#stat-users-value');
  const statOrdersVal    = $('#stat-orders-value');
  const statRevenueVal   = $('#stat-revenue-value');
  const adminViewTabs    = $('#admin-view-tabs');
  const adminViewTitle   = $('#admin-view-title');
  const adminTableHead   = $('#admin-table-head');
  const adminTableBody   = $('#admin-table-body');
  const tableEmpty       = $('#table-empty');
  const tableEmptyText   = $('#table-empty-text');
  const productsTable    = $('#products-table');
  const adminSearch      = $('#admin-search');
  const btnAddProduct    = $('#btn-add-product');
  const userDetailPanel  = $('#user-detail-panel');
  const userDetailTitle  = $('#user-detail-title');
  const userDetailMeta   = $('#user-detail-meta');
  const userOrdersBody   = $('#user-orders-body');
  const userOrdersEmpty  = $('#user-orders-empty');
  const btnCloseUserDetail = $('#btn-close-user-detail');

  // Product modal
  const productModalOverlay = $('#product-modal-overlay');
  const modalTitle      = $('#modal-title');
  const modalClose      = $('#modal-close');
  const productForm     = $('#product-form');
  const btnCancel       = $('#btn-cancel');
  const btnSave         = $('#btn-save');
  const formProductId   = $('#form-product-id');
  const formName        = $('#form-name');
  const formCategory    = $('#form-category');
  const formPrice       = $('#form-price');
  const formOrigPrice   = $('#form-original-price');
  const formBadge       = $('#form-badge');
  const formRating      = $('#form-rating');
  const formReviews     = $('#form-reviews');
  const formImageFile   = $('#form-image-file');
  const formImageUrl    = $('#form-image-url');
  const formDescription = $('#form-description');
  const formInstock     = $('#form-instock');
  const formFeatured    = $('#form-featured');
  const specsEditor     = $('#specs-editor');
  const btnAddSpec      = $('#btn-add-spec');
  const imageUploadArea = $('#image-upload-area');
  const imagePreview    = $('#image-preview');
  const imagePreviewImg = $('#image-preview-img');
  const imagePreviewRem = $('#image-preview-remove');
  const imageUploadPrompt = $('#image-upload-prompt');

  // Delete modal
  const deleteModalOverlay = $('#delete-modal-overlay');
  const deleteProductName  = $('#delete-product-name');
  const deleteCancel       = $('#delete-cancel');
  const deleteConfirm      = $('#delete-confirm');

  // Toast
  const toastContainer = $('#admin-toast-container');

  // Logout
  const logoutBtn = $('#admin-logout-btn');

  // ═══════════════════════════════════════════════════
  // AUTH HELPERS
  // ═══════════════════════════════════════════════════
  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    };
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('nova_admin_token');
      adminToken = null;
      dashboardInitialized = false;
      showLogin();
    });
  }

  // ═══════════════════════════════════════════════════
  // TOAST
  // ═══════════════════════════════════════════════════
  function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `admin-toast admin-toast-${type}`;
    toast.textContent = msg;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // ═══════════════════════════════════════════════════
  // FETCH STATS
  // ═══════════════════════════════════════════════════
  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/stats', { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();

      animateCounter(statProductsVal, data.totalProducts || 0);
      animateCounter(statUsersVal, data.totalUsers || 0);
      animateCounter(statOrdersVal, data.totalOrders || 0);
      statRevenueVal.textContent = formatINR(data.totalRevenue || 0);
    } catch (err) {
      console.error('Stats error:', err);
    }
  }

  function animateCounter(el, target) {
    const duration = 600;
    const start = parseInt(el.textContent) || 0;
    const diff = target - start;
    if (diff === 0) { el.textContent = target; return; }
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + diff * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Currency formatting for Indian Rupee
  function formatINR(amount) {
    try {
      const num = Number(amount) || 0;
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
    } catch (e) {
      return '₹' + (amount || 0);
    }
  }

  function updateTableHeader(view) {
    if (!adminTableHead) return;

    if (view === 'users') {
      adminTableHead.innerHTML = `
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Joined</th>
          <th>Actions</th>
        </tr>
      `;
    } else if (view === 'orders') {
      adminTableHead.innerHTML = `
        <tr>
          <th>Order ID</th>
          <th>Date</th>
          <th>Status</th>
          <th>Total</th>
          <th>Customer</th>
          <th>Items</th>
        </tr>
      `;
    } else {
      adminTableHead.innerHTML = `
        <tr>
          <th class="th-image">Image</th>
          <th class="th-name">Name</th>
          <th class="th-category">Category</th>
          <th class="th-price">Price</th>
          <th class="th-badge">Badge</th>
          <th class="th-stock">Stock</th>
          <th class="th-featured">Featured</th>
          <th class="th-actions">Actions</th>
        </tr>
      `;
    }
  }

  function setAdminView(view) {
    currentAdminView = view;
    if (adminViewTabs) {
      adminViewTabs.querySelectorAll('.admin-view-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === view);
      });
    }
    if (adminViewTitle) {
      adminViewTitle.textContent = view === 'users' ? 'User Management' : view === 'orders' ? 'Order Management' : 'Product Management';
    }
    if (adminSearch) {
      adminSearch.value = '';
      adminSearch.placeholder = view === 'users' ? 'Search users...' : view === 'orders' ? 'Search orders...' : 'Search products...';
    }
    if (btnAddProduct) {
      btnAddProduct.style.display = view === 'products' ? '' : 'none';
    }
    if (userDetailPanel) {
      userDetailPanel.classList.add('hidden');
    }
    updateTableHeader(view);
    refreshAdminTable();
  }

  function refreshAdminTable() {
    if (!productsTable || !adminTableBody || !tableEmpty || !tableEmptyText) return;
    if (currentAdminView === 'users') {
      renderUsersTable(allUsers);
    } else if (currentAdminView === 'orders') {
      renderOrdersTable(allOrders);
    } else {
      renderProductsTable(allProducts);
    }
  }

  function renderUsersTable(users) {
    if (!users.length) {
      productsTable.style.display = 'none';
      tableEmpty.style.display = 'block';
      tableEmptyText.textContent = 'No users found';
      return;
    }

    productsTable.style.display = '';
    tableEmpty.style.display = 'none';

    adminTableBody.innerHTML = users.map(user => `
      <tr data-id="${user.id}">
        <td>${user.name || '–'}</td>
        <td>${user.email}</td>
        <td>${user.isAdmin ? 'Admin' : 'Customer'}</td>
        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
        <td>
          <button class="btn-view-user" data-id="${user.id}" data-email="${user.email}" data-name="${user.name}">View Purchases</button>
        </td>
      </tr>
    `).join('');

    adminTableBody.querySelectorAll('.btn-view-user').forEach(btn => {
      btn.addEventListener('click', () => {
        showUserPurchaseHistory({
          id: btn.dataset.id,
          email: btn.dataset.email,
          name: btn.dataset.name
        });
      });
    });
  }

  function renderOrdersTable(orders) {
    if (!orders.length) {
      productsTable.style.display = 'none';
      tableEmpty.style.display = 'block';
      tableEmptyText.textContent = 'No orders found';
      return;
    }

    productsTable.style.display = '';
    tableEmpty.style.display = 'none';

    adminTableBody.innerHTML = orders.map(order => {
      const customerName = order.customer?.name || order.customer?.email || 'Guest';
      const itemCount = Array.isArray(order.cart) ? order.cart.reduce((sum, item) => sum + (item.qty || 1), 0) : 0;
      return `
        <tr data-id="${order.id}">
          <td>${order.id}</td>
          <td>${new Date(order.createdAt).toLocaleString()}</td>
          <td>${order.status}</td>
          <td>${formatINR(order.total)}</td>
          <td>${customerName}</td>
          <td>${itemCount}</td>
        </tr>
      `;
    }).join('');
  }

  function showUserPurchaseHistory(user) {
    selectedUser = user;
    if (userDetailPanel) userDetailPanel.classList.remove('hidden');
    if (userDetailTitle) userDetailTitle.textContent = `${user.name || 'User'} Purchase History`;
    if (userDetailMeta) userDetailMeta.textContent = `Email: ${user.email}`;

    const orders = allOrders.filter(order => {
      const customerEmail = order.customer?.email?.toLowerCase?.();
      const customerId = order.customer?.id;
      return customerEmail === user.email.toLowerCase() || customerId === user.id;
    });

    if (!orders.length) {
      if (userOrdersBody) userOrdersBody.innerHTML = '';
      if (userOrdersEmpty) userOrdersEmpty.style.display = 'block';
      return;
    }

    if (userOrdersEmpty) userOrdersEmpty.style.display = 'none';
    if (userOrdersBody) {
      userOrdersBody.innerHTML = orders.map(order => {
        const items = Array.isArray(order.cart) ? order.cart.map(item => `${item.qty}× ${item.name}`).join(', ') : '–';
        return `
          <tr>
            <td>${order.id}</td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td>${order.status}</td>
            <td>${formatINR(order.total)}</td>
            <td>${items}</td>
          </tr>
        `;
      }).join('');
    }
  }

  if (btnCloseUserDetail) {
    btnCloseUserDetail.addEventListener('click', () => {
      if (userDetailPanel) userDetailPanel.classList.add('hidden');
      selectedUser = null;
    });
  }

  if (adminViewTabs) {
    adminViewTabs.querySelectorAll('.admin-view-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        setAdminView(tab.dataset.view);
      });
    });
  }

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users', { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load users');
      allUsers = await res.json();
      if (currentAdminView === 'users') refreshAdminTable();
    } catch (err) {
      console.error('Users fetch error:', err);
    }
  }

  async function fetchOrders() {
    try {
      const res = await fetch('/api/admin/orders', { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load orders');
      allOrders = await res.json();
      if (currentAdminView === 'orders') refreshAdminTable();
    } catch (err) {
      console.error('Orders fetch error:', err);
    }
  }

  // ═══════════════════════════════════════════════════
  // FETCH & RENDER PRODUCTS
  // ═══════════════════════════════════════════════════
  async function fetchProducts() {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed');
      allProducts = await res.json();
      renderProductsTable(allProducts);
    } catch (err) {
      console.error('Products fetch error:', err);
    }
  }

  function renderProductsTable(products) {
    if (!products.length) {
      productsTable.style.display = 'none';
      tableEmpty.style.display = 'block';
      tableEmptyText.textContent = 'No products found';
      return;
    }

    productsTable.style.display = '';
    tableEmpty.style.display = 'none';

    adminTableBody.innerHTML = products.map(p => {
      const badgeHtml = p.badge
        ? `<span class="table-badge table-badge-${p.badge}">${p.badge.toUpperCase()}</span>`
        : `<span class="table-badge-none">—</span>`;

      const stockHtml = p.inStock
        ? `<span class="status-dot in-stock">In Stock</span>`
        : `<span class="status-dot out-of-stock">Out</span>`;

      const featuredHtml = p.featured ? '⭐' : '<span style="opacity:0.2">☆</span>';

      const priceHtml = p.originalPrice
        ? `${formatINR(p.price)}<span class="table-original-price">${formatINR(p.originalPrice)}</span>`
        : `${formatINR(p.price)}`;

      return `
        <tr data-id="${p.id}">
          <td><img src="${p.image || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2244%22 height=%2244%22%3E%3Crect fill=%22%23222%22 width=%2244%22 height=%2244%22 rx=%228%22/%3E%3Ctext x=%2222%22 y=%2226%22 text-anchor=%22middle%22 fill=%22%23555%22 font-size=%2216%22%3E?%3C/text%3E%3C/svg%3E'}" class="table-product-img" alt="${p.name}" loading="lazy"></td>
          <td class="table-product-name">${p.name}</td>
          <td><span class="table-category">${p.category}</span></td>
          <td class="table-price">${priceHtml}</td>
          <td>${badgeHtml}</td>
          <td>${stockHtml}</td>
          <td class="featured-star">${featuredHtml}</td>
          <td>
            <div class="action-btns">
              <button class="btn-edit" title="Edit" data-id="${p.id}">✏️</button>
              <button class="btn-del" title="Delete" data-id="${p.id}" data-name="${p.name}">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach action events
    adminTableBody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });

    adminTableBody.querySelectorAll('.btn-del').forEach(btn => {
      btn.addEventListener('click', () => openDeleteModal(btn.dataset.id, btn.dataset.name));
    });
  }

  // ═══════════════════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════════════════
  if (adminSearch) {
    adminSearch.addEventListener('input', () => {
      const q = adminSearch.value.toLowerCase().trim();
      if (!q) {
        refreshAdminTable();
        return;
      }
      if (currentAdminView === 'users') {
        const filtered = allUsers.filter(u =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        );
        renderUsersTable(filtered);
      } else if (currentAdminView === 'orders') {
        const filtered = allOrders.filter(o =>
          o.id.toLowerCase().includes(q) ||
          (o.customer && o.customer.email && o.customer.email.toLowerCase().includes(q)) ||
          (o.customer && o.customer.name && o.customer.name.toLowerCase().includes(q))
        );
        renderOrdersTable(filtered);
      } else {
        const filtered = allProducts.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
        );
        renderProductsTable(filtered);
      }
    });
  }

  // ═══════════════════════════════════════════════════
  // PRODUCT MODAL — OPEN / CLOSE
  // ═══════════════════════════════════════════════════
  function openModal() {
    productModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    productModalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    resetForm();
  }

  function resetForm() {
    editingProductId = null;
    productForm.reset();
    formProductId.value = '';
    formInstock.checked = true;
    formFeatured.checked = false;
    specsEditor.innerHTML = '';
    hideImagePreview();
    modalTitle.textContent = 'Add Product';
    btnSave.textContent = 'Save Product';
  }

  // Add product button
  btnAddProduct.addEventListener('click', () => {
    resetForm();
    openModal();
  });

  // Close handlers
  modalClose.addEventListener('click', closeModal);
  btnCancel.addEventListener('click', closeModal);
  productModalOverlay.addEventListener('click', e => {
    if (e.target === productModalOverlay) closeModal();
  });

  // ═══════════════════════════════════════════════════
  // SPECS EDITOR
  // ═══════════════════════════════════════════════════
  function addSpecRow(key = '', value = '') {
    const row = document.createElement('div');
    row.className = 'spec-row';
    row.innerHTML = `
      <input type="text" placeholder="Key (e.g. Battery)" value="${escapeHtml(key)}">
      <input type="text" placeholder="Value (e.g. 60 hours)" value="${escapeHtml(value)}">
      <button type="button" class="btn-remove-spec">✕</button>
    `;
    row.querySelector('.btn-remove-spec').addEventListener('click', () => {
      row.style.opacity = '0';
      row.style.transform = 'translateX(-10px)';
      setTimeout(() => row.remove(), 200);
    });
    specsEditor.appendChild(row);
  }

  btnAddSpec.addEventListener('click', () => addSpecRow());

  function getSpecsFromEditor() {
    const specs = {};
    specsEditor.querySelectorAll('.spec-row').forEach(row => {
      const inputs = row.querySelectorAll('input');
      const key = inputs[0].value.trim();
      const val = inputs[1].value.trim();
      if (key) specs[key] = val;
    });
    return Object.keys(specs).length > 0 ? specs : null;
  }

  // ═══════════════════════════════════════════════════
  // IMAGE UPLOAD
  // ═══════════════════════════════════════════════════
  function showImagePreview(src) {
    imagePreviewImg.src = src;
    imagePreview.style.display = 'inline-block';
    imageUploadPrompt.style.display = 'none';
  }

  function hideImagePreview() {
    imagePreview.style.display = 'none';
    imageUploadPrompt.style.display = '';
    imagePreviewImg.src = '';
    formImageUrl.value = '';
    formImageFile.value = '';
  }

  imageUploadArea.addEventListener('click', (e) => {
    if (e.target === imagePreviewRem || e.target.closest('.image-preview-remove')) return;
    formImageFile.click();
  });

  imagePreviewRem.addEventListener('click', (e) => {
    e.stopPropagation();
    hideImagePreview();
  });

  // Drag and drop
  imageUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageUploadArea.classList.add('drag-over');
  });

  imageUploadArea.addEventListener('dragleave', () => {
    imageUploadArea.classList.remove('drag-over');
  });

  imageUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    imageUploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageFile(file);
    }
  });

  formImageFile.addEventListener('change', () => {
    if (formImageFile.files[0]) {
      handleImageFile(formImageFile.files[0]);
    }
  });

  async function handleImageFile(file) {
    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => showImagePreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload to server
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` },
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      formImageUrl.value = data.url;
      showToast('Image uploaded ✓', 'success');
      // Notify other tabs that products (images) changed
      try { localStorage.setItem('nova_products_updated', Date.now().toString()); } catch (e) {}
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Image upload failed', 'error');
    }
  }

  // URL input manual change
  formImageUrl.addEventListener('change', () => {
    const url = formImageUrl.value.trim();
    if (url) {
      showImagePreview(url);
    } else {
      hideImagePreview();
    }
  });

  // ═══════════════════════════════════════════════════
  // EDIT PRODUCT — populate modal
  // ═══════════════════════════════════════════════════
  function openEditModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    editingProductId = productId;
    modalTitle.textContent = 'Edit Product';
    btnSave.textContent = 'Update Product';

    formProductId.value = product.id;
    formName.value = product.name || '';
    formCategory.value = product.category || '';
    formPrice.value = product.price || '';
    formOrigPrice.value = product.originalPrice || '';
    formBadge.value = product.badge || '';
    formRating.value = product.rating || '';
    formReviews.value = product.reviews || '';
    formDescription.value = product.description || '';
    formInstock.checked = product.inStock !== false;
    formFeatured.checked = !!product.featured;

    // Image
    if (product.image) {
      formImageUrl.value = product.image;
      showImagePreview(product.image);
    } else {
      hideImagePreview();
    }

    // Specs
    specsEditor.innerHTML = '';
    if (product.specs && typeof product.specs === 'object') {
      Object.entries(product.specs).forEach(([key, val]) => addSpecRow(key, val));
    }

    openModal();
  }

  // ═══════════════════════════════════════════════════
  // SAVE PRODUCT (Create / Update)
  // ═══════════════════════════════════════════════════
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const specs = getSpecsFromEditor();

    const body = {
      name: formName.value.trim(),
      category: formCategory.value,
      price: parseFloat(formPrice.value),
      originalPrice: formOrigPrice.value ? parseFloat(formOrigPrice.value) : null,
      image: formImageUrl.value.trim() || null,
      badge: formBadge.value || null,
      rating: formRating.value ? parseFloat(formRating.value) : 0,
      reviews: formReviews.value ? parseInt(formReviews.value) : 0,
      description: formDescription.value.trim(),
      specs: specs,
      inStock: formInstock.checked,
      featured: formFeatured.checked
    };

    try {
      let res;
      if (editingProductId) {
        // Update
        res = await fetch(`/api/admin/products/${editingProductId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(body)
        });
      } else {
        // Create — generate ID
        body.id = 'p' + Date.now();
        res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(body)
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Save failed');
      }

      showToast(editingProductId ? 'Product updated ✓' : 'Product created ✓', 'success');
      closeModal();
      await fetchProducts();
      // Notify other tabs (storefront) that products changed
      try { localStorage.setItem('nova_products_updated', Date.now().toString()); } catch (e) {}
      await fetchStats();
    } catch (err) {
      console.error('Save error:', err);
      showToast(err.message || 'Failed to save product', 'error');
    }
  });

  // ═══════════════════════════════════════════════════
  // DELETE PRODUCT
  // ═══════════════════════════════════════════════════
  function openDeleteModal(id, name) {
    deletingProductId = id;
    deletingProductName = name;
    deleteProductName.textContent = name;
    deleteModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDeleteModal() {
    deleteModalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    deletingProductId = null;
  }

  deleteCancel.addEventListener('click', closeDeleteModal);
  deleteModalOverlay.addEventListener('click', e => {
    if (e.target === deleteModalOverlay) closeDeleteModal();
  });

  deleteConfirm.addEventListener('click', async () => {
    if (!deletingProductId) return;

    try {
      const res = await fetch(`/api/admin/products/${deletingProductId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Delete failed');
      }

      showToast(`"${deletingProductName}" deleted`, 'success');
      closeDeleteModal();
      await fetchProducts();
      // Notify other tabs (storefront) that products changed
      try { localStorage.setItem('nova_products_updated', Date.now().toString()); } catch (e) {}
      await fetchStats();
    } catch (err) {
      console.error('Delete error:', err);
      showToast(err.message || 'Failed to delete', 'error');
    }
  });

  // ═══════════════════════════════════════════════════
  // KEYBOARD SHORTCUTS
  // ═══════════════════════════════════════════════════
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (productModalOverlay.classList.contains('active')) closeModal();
      if (deleteModalOverlay.classList.contains('active')) closeDeleteModal();
    }
  });

  // ═══════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // ═══════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════
  fetchStats();
  fetchProducts();
  fetchUsers();
  fetchOrders();

  console.log('%c⚡ NOVA Admin Dashboard loaded', 'color:#7c5cfc;font-size:14px;font-weight:bold;');

  } // end initDashboard
});
