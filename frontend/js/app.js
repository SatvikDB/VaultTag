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
    return u && u.role === 'admin';
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
      window.location.href = '/';
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
  getAllNfts: (params = '') => API.request('GET', `/nft/all${params ? '?' + params : ''}`),
  getNftDetail: (tokenId) => API.request('GET', `/nft/${tokenId}`),
  redeem: (tokenId) => API.request('POST', '/nft/redeem', { tokenId }),
  transfer: (tokenId, toEmail) => API.request('POST', '/nft/transfer', { tokenId, toEmail }),

  // Admin
  getStats: () => API.request('GET', '/admin/stats'),
  getUsers: () => API.request('GET', '/admin/users'),
  deleteNft: (tokenId) => API.request('DELETE', `/admin/nft/${tokenId}`)
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

  // Update nav based on auth state
  const actions = document.querySelector('.nav-actions');
  if (actions) {
    if (Auth.isLoggedIn()) {
      const user = Auth.getUser();
      actions.innerHTML = `
        ${Auth.isAdmin() ? '<a href="/admin-nfts.html" class="btn btn-sm btn-secondary">Manage NFTs</a>' : ''}
        ${!Auth.isAdmin() ? '<a href="/my-nfts.html" class="btn btn-sm btn-secondary">My NFTs</a>' : ''}
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
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
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

// ── Init on DOM ready ──
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollAnimations();
});
