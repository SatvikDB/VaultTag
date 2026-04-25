/* ============================================
   VaultTag — Shared App Utilities
   API calls, auth management, toast system
   ============================================ */

const API_BASE = window.location.origin + '/api';

// ── Auth Helpers ──
const Auth = {
  getToken() {
    return localStorage.getItem('vt_token');
  },
  setToken(token) {
    localStorage.setItem('vt_token', token);
  },
  getUser() {
    const u = localStorage.getItem('vt_user');
    return u ? JSON.parse(u) : null;
  },
  setUser(user) {
    localStorage.setItem('vt_user', JSON.stringify(user));
  },
  isLoggedIn() {
    return !!this.getToken();
  },
  isAdmin() {
    const u = this.getUser();
    return u && (u.role === 'admin' || u.role === 'superadmin');
  },
  isSuperAdmin() {
    const u = this.getUser();
    return u && u.role === 'superadmin';
  },
  isSeller() {
    const u = this.getUser();
    return u && u.role === 'seller';
  },
  logout() {
    localStorage.removeItem('vt_token');
    localStorage.removeItem('vt_user');
    window.location.href = '/login.html';
  },
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  },
  requireAdmin() {
    if (!this.isAdmin()) {
      window.location.href = '/login.html?role=admin';
      return false;
    }
    return true;
  },
  requireSeller() {
    const u = this.getUser();
    if (!u || !['seller','admin','superadmin'].includes(u.role)) {
      window.location.href = '/login.html?role=seller';
      return false;
    }
    return true;
  }
};

// ── API Client ──
const API = {
  async request(method, path, body = null, requiresAuth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (requiresAuth && Auth.getToken()) {
      headers['Authorization'] = `Bearer ${Auth.getToken()}`;
    }

    const opts = { method, headers };
    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      opts.body = JSON.stringify(body);
    }

    try {
      const res = await fetch(`${API_BASE}${path}`, opts);
      const data = await res.json();

      if (res.status === 401) {
        Auth.logout();
        return data;
      }

      if (!res.ok) {
        throw new Error(data.message || 'Request failed');
      }
      return data;
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw new Error('Network error — is the server running?');
      }
      throw err;
    }
  },
  // Auth
  login: (email, password) => API.request('POST', '/auth/login', { email, password }, false),
  register: (name, email, password) => API.request('POST', '/auth/register', { name, email, password }, false),
  getMe: () => API.request('GET', '/auth/me'),

  // NFT
  mintNFT: (data) => API.request('POST', '/nft/mint', data),
  linkTag: (tokenId, nfcUid) => API.request('PATCH', '/nft/link-tag', { tokenId, nfcUid }),
  verify: (tokenId) => API.request('POST', '/nft/verify', { tokenId }, false),
  getMyNfts: () => API.request('GET', '/nft/my-nfts'),
  browseNfts: (params = '') => API.request('GET', `/nft/browse${params ? '?' + params : ''}`),
  getAllNfts: (params = '') => API.request('GET', `/nft/all${params ? '?' + params : ''}`),
  getNftDetail: (tokenId) => API.request('GET', `/nft/${tokenId}`),
  redeem: (tokenId) => API.request('POST', '/nft/redeem', { tokenId }),
  transfer: (tokenId, toEmail) => API.request('POST', '/nft/transfer', { tokenId, toEmail }),

  // Admin
  getStats: () => API.request('GET', '/admin/stats'),
  getUsers: () => API.request('GET', '/admin/users'),
  deleteNft: (tokenId) => API.request('DELETE', `/admin/nft/${tokenId}`),
  dbExplorer: (collection, page, limit) => API.request('GET', `/admin/db-explorer?collection=${collection}&page=${page||1}&limit=${limit||10}`),
  // SuperAdmin
  createAdmin: (data) => API.request('POST', '/admin/create-admin', data),
  deleteUser: (userId) => API.request('DELETE', `/admin/user/${userId}`),
  toggleBlockUser: (userId) => API.request('PATCH', `/admin/user/${userId}/block`),
  getRevenueReport: () => API.request('GET', '/admin/revenue-report'),

  // Orders
  createOrder: (data) => API.request('POST', '/orders', data),
  getMyOrders: () => API.request('GET', '/orders/my'),
  getAllOrders: (status) => API.request('GET', `/orders/all${status ? '?status='+status : ''}`),
  acceptOrder: (orderId, adminNote) => API.request('POST', `/orders/${orderId}/accept`, { adminNote }),
  transferOrder: (orderId) => API.request('POST', `/orders/${orderId}/transfer`, {}),
  rejectOrder: (orderId, adminNote) => API.request('POST', `/orders/${orderId}/reject`, { adminNote }),
  getOrderSettings: () => API.request('GET', '/orders/settings'),
  saveOrderSettings: (data) => API.request('POST', '/orders/settings', data),
  getPublicPaymentInfo: () => API.request('GET', '/orders/payment-info', null, false)
};

// ── Toast Notifications ──
const Toast = {
  container: null,
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(message, type = 'success', duration = 4000) {
    this.init();
    const icons = { success: '✓', error: '✕', warning: '⚠' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || '●'}</span><span>${message}</span>`;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  success: (msg) => Toast.show(msg, 'success'),
  error: (msg) => Toast.show(msg, 'error'),
  warning: (msg) => Toast.show(msg, 'warning')
};

// ── Particles Background ──
function initParticles(container) {
  const el = container || document.querySelector('.particles-bg');
  if (!el) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (8 + Math.random() * 12) + 's';
    p.style.animationDelay = Math.random() * 10 + 's';
    p.style.width = (1 + Math.random() * 2) + 'px';
    p.style.height = p.style.width;
    el.appendChild(p);
  }
}

// ── Navbar Scroll Effect ──
function initNavbar() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });

  const actions = document.querySelector('.nav-actions');
  if (actions) {
    if (Auth.isLoggedIn()) {
      const user = Auth.getUser();
      const role = user ? user.role : 'buyer';
      let links = '';

      if (role === 'superadmin') {
        links = ``;
      } else if (role === 'admin') {
        links = ``;
      } else if (role === 'seller') {
        links = `
          <a href="/admin-nfts.html" class="btn btn-sm btn-secondary">Manage NFTs</a>
          <a href="/admin-orders.html" class="btn btn-sm btn-secondary">Orders</a>
          <a href="/admin-settings.html" class="btn btn-sm btn-secondary">Settings</a>
        `;
      } else {
        links = `
          <a href="/buyer-dashboard.html" class="btn btn-sm btn-secondary">Dashboard</a>
          <a href="/my-nfts.html" class="btn btn-sm btn-secondary">My NFTs</a>
          <a href="/my-orders.html" class="btn btn-sm btn-secondary">My Orders</a>
        `;
      }

      actions.innerHTML = (role === 'superadmin' || role === 'admin')
        ? links
        : `
        ${links}
        <a href="/profile.html" class="btn btn-sm btn-secondary">Profile</a>
        <button onclick="Auth.logout()" class="btn btn-sm btn-secondary">Logout</button>
      `;
    } else {
      actions.innerHTML = `
        <a href="/login.html" class="btn btn-sm btn-secondary">Login</a>
        <a href="/login.html#register" class="btn btn-sm btn-primary">Get Started</a>
      `;
    }
  }
}

// ── Scroll Animations ──
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

// ── Format Helpers ──
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
}

function truncateId(id, len = 16) {
  if (!id) return '—';
  const s = String(id);
  return s.length > len ? s.substring(0, len) + '...' : s;
}

function maskEmail(email) {
  if (!email) return '—';
  return email.replace(/(.{2}).*(@.*)/, '$1***$2');
}

// ── Cart System ──
const Cart = {
  getItems() {
    try { return JSON.parse(localStorage.getItem('vt_cart') || '[]'); } catch { return []; }
  },
  saveItems(items) {
    localStorage.setItem('vt_cart', JSON.stringify(items));
    Cart.updateBadge();
  },
  add(nft) {
    const items = Cart.getItems();
    if (items.find(i => String(i.tokenId) === String(nft.tokenId))) {
      Toast.warning('Already in cart');
      return false;
    }
    items.push({
      tokenId   : nft.tokenId,
      productName: nft.productName,
      price     : nft.price,
      imageUrl  : nft.imageUrl || '',
      category  : nft.category || 'Footwear',
      status    : nft.status   || 'active'
    });
    Cart.saveItems(items);
    Toast.success('Added to cart');
    return true;
  },
  remove(tokenId) {
    Cart.saveItems(Cart.getItems().filter(i => String(i.tokenId) !== String(tokenId)));
  },
  clear() { Cart.saveItems([]); },
  count() { return Cart.getItems().length; },
  total() { return Cart.getItems().reduce((s, i) => s + (parseFloat(i.price) || 0), 0); },
  updateBadge() {
    const badge = document.getElementById('cartBadge');
    const count = Cart.count();
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }
};

// ── Auto-init on every page ──
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollAnimations();
});
