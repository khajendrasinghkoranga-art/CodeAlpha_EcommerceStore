(function () {
  const $ = sel => document.querySelector(sel);
  const authToken = localStorage.getItem('nova_token');
  const user = JSON.parse(localStorage.getItem('nova_user') || 'null');

  const profileName = $('#profile-name');
  const profileEmail = $('#profile-email');
  const profileId = $('#profile-id');
  const profileFullname = $('#profile-fullname');
  const profileAccountEmail = $('#profile-account-email');
  const orderList = $('#order-list');
  const logoutBtn = $('#logout-btn');

  function formatINR(amount) {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  }

  function renderOrders(orders) {
    if (!orders || !orders.length) {
      orderList.innerHTML = '<p class="profile-note">No orders yet. Start shopping to see order history.</p>';
      return;
    }
    orderList.innerHTML = orders.map(order => `
      <div class="order-item">
        <div class="order-item-header">
          <div><strong>${order.id}</strong></div>
          <div>${new Date(order.createdAt).toLocaleDateString()}</div>
        </div>
        <div class="order-item-body">
          <div>${order.cart.length} item${order.cart.length === 1 ? '' : 's'}</div>
          <div><strong>${formatINR(order.total)}</strong></div>
        </div>
      </div>
    `).join('');
  }

  if (!authToken || !user) {
    window.location.href = '/login';
    return;
  }

  profileName.textContent = user.name || 'Valued customer';
  profileEmail.textContent = user.email;
  profileId.textContent = user.id || '—';
  profileFullname.textContent = user.name || '—';
  profileAccountEmail.textContent = user.email || '—';
  const firstName = user.name ? user.name.split(' ')[0] : 'Shopper';
  const profileFirstname = $('#profile-firstname');
  if (profileFirstname) profileFirstname.textContent = firstName;

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('nova_token');
    localStorage.removeItem('nova_user');
    window.location.href = '/login';
  });

  async function fetchOrders() {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load orders');
      const userOrders = data.filter(order => order.customer && order.customer.email === user.email);
      renderOrders(userOrders);
      const orderCount = userOrders.length;
      const orderTotal = userOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const orderCountPill = $('#order-count-pill');
      const orderTotalPill = $('#order-total-pill');
      if (orderCountPill) orderCountPill.textContent = `${orderCount} order${orderCount === 1 ? '' : 's'}`;
      if (orderTotalPill) orderTotalPill.textContent = `${formatINR(orderTotal)} spent`;
    } catch (err) {
      console.error(err);
      orderList.innerHTML = '<p class="profile-note">Unable to load order history.</p>';
    }
  }

  fetchOrders();
})();
