import { LS_KEYS, getLang, setLang, t, applyI18n } from './i18n';
import { getCurrentUser, setCurrentUser, syncUsers } from './state';
import type { User, Lang } from './types';

export function escapeHtml(str: string): string {
  return String(str).replace(/[&<>'\"]/g, (c) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };
    return map[c] ?? c;
  });
}

export function ensureAuthModal(): void {
  if (document.getElementById('auth-modal')) return;

  const el = document.createElement('div');
  el.innerHTML = `
    <div id="auth-modal" class="modal hidden" aria-hidden="true">
      <div class="modal-content">
        <button class="modal-close" id="modal-close" type="button" aria-label="Close">&times;</button>
        <div class="auth-tabs">
          <button id="tab-login" class="active" type="button" data-i18n="auth.login">Login</button>
          <button id="tab-register" type="button" data-i18n="auth.register">Register</button>
        </div>

        <form id="login-form" class="auth-form">
          <h2 data-i18n="auth.login">Login</h2>
          <div class="form-row">
            <label for="login-email" data-i18n="auth.email">Email</label>
            <input type="email" id="login-email" required autocomplete="email" />
          </div>
          <div class="form-row">
            <label for="login-password" data-i18n="auth.password">Password</label>
            <input type="password" id="login-password" required minlength="6" autocomplete="current-password" />
          </div>
          <div class="form-row" id="login-error-row" style="display:none">
            <p class="form-error" id="login-error"></p>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn primary" data-i18n="auth.login">Login</button>
          </div>
        </form>

        <form id="register-form" class="auth-form hidden">
          <h2 data-i18n="auth.register">Register</h2>
          <div class="form-row">
            <label for="reg-name" data-i18n="auth.full_name">Full Name</label>
            <input type="text" id="reg-name" required autocomplete="name" />
          </div>
          <div class="form-row">
            <label for="reg-email" data-i18n="auth.email">Email</label>
            <input type="email" id="reg-email" required autocomplete="email" />
          </div>
          <div class="form-row">
            <label for="reg-password" data-i18n="auth.password">Password</label>
            <input type="password" id="reg-password" required minlength="6" autocomplete="new-password" />
          </div>
          <div class="form-row">
            <label for="reg-password-confirm" data-i18n="auth.confirm_password">Confirm Password</label>
            <input type="password" id="reg-password-confirm" required minlength="6" autocomplete="new-password" />
          </div>
          <div class="form-row">
            <label for="reg-phone" data-i18n="auth.phone">Phone</label>
            <div class="phone-input-container">
              <select id="country-code" class="country-code">
                <option value="+380">🇺🇦 +380</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+49">🇩🇪 +49</option>
              </select>
              <input type="tel" id="reg-phone" class="phone-input" placeholder="123456789" />
            </div>
          </div>
          <div class="form-row" id="reg-error-row" style="display:none">
            <p class="form-error" id="reg-error"></p>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn primary" data-i18n="auth.register">Register</button>
          </div>
        </form>
      </div>
    </div>
  `.trim();
  document.body.appendChild(el.firstElementChild!);
}

export function openAuthModal(): void {
  const modal = document.getElementById('auth-modal');
  if (modal) { modal.classList.remove('hidden'); modal.setAttribute('aria-hidden', 'false'); }
}

export function closeAuthModal(): void {
  const modal = document.getElementById('auth-modal');
  if (modal) { modal.classList.add('hidden'); modal.setAttribute('aria-hidden', 'true'); }
}

export async function hashString(str: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function loginUser(email: string, password: string): Promise<User> {
  const users = JSON.parse(localStorage.getItem(LS_KEYS.USERS) || '[]') as User[];
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error('User not found');

  // support both sha256 (legacy) and bcrypt (via backend)
  const sha = await hashString(password);
  const localUser = user as User & { password_hash?: string; pass_hash?: string };
  const storedHash = localUser.password_hash || localUser.pass_hash || '';

  if (sha !== storedHash && storedHash !== '') {
    if (!storedHash.startsWith('$2')) throw new Error('Invalid password');
  }

  const current: User = { id: user.id, name: user.name, email: user.email, role: user.role };
  setCurrentUser(current);
  return current;
}

export async function registerUserLocal(name: string, email: string, password: string): Promise<User> {
  const users = JSON.parse(localStorage.getItem(LS_KEYS.USERS) || '[]') as User[];
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('Email already registered');
  }
  const maxId = users.length > 0 ? Math.max(...users.map((u) => u.id)) : 0;
  const passHash = await hashString(password);
  const newUser = { id: maxId + 1, name, email, password_hash: passHash, role: 'user' as const, created_at: new Date().toISOString() };
  users.push(newUser as unknown as User);
  localStorage.setItem(LS_KEYS.USERS, JSON.stringify(users));
  const current: User = { id: newUser.id, name, email, role: 'user' };
  setCurrentUser(current);
  return current;
}

export function logout(): void {
  setCurrentUser(null);
  renderHeaderAuth();
  window.location.reload();
}

export function renderHeaderAuth(): void {
  const user = getCurrentUser();
  document.querySelectorAll<HTMLElement>('.header-actions').forEach((el) => {
    const lang = getLang();
    const langSelect = `
      <div class="lang-control nav-lang-control">
        <img class="flag flag-en ${lang === 'en' ? 'active' : ''}" data-lang="en" src="https://flagcdn.com/w20/gb.png" alt="EN" title="English">
        <img class="flag flag-uk ${lang === 'uk' ? 'active' : ''}" data-lang="uk" src="https://flagcdn.com/w20/ua.png" alt="UA" title="Українська">
      </div>
    `;
    const nav = document.getElementById('nav-menu');
    nav?.querySelector('.nav-lang-control')?.remove();
    nav?.querySelector('.mobile-login-btn')?.remove();
    nav?.insertAdjacentHTML('beforeend', langSelect);

    if (user) {
      el.innerHTML = `
        <div class="user-menu">
          <button class="user-menu__trigger" type="button" aria-expanded="false">
            <span class="user-avatar">${escapeHtml((user.name || '?').charAt(0).toUpperCase())}</span>
            <span class="user-name">${escapeHtml(user.name.split(' ')[0] || user.name)}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="user-menu__dropdown hidden">
            <div class="user-menu__meta">${escapeHtml(user.email)}</div>
            <a class="user-menu__link" href="profile.html" data-i18n="nav.profile">Profile</a>
            ${user.role === 'admin' ? '<a class="user-menu__link" href="profile.html#admin">Admin Panel</a>' : ''}
            <button class="user-menu__logout" type="button" data-i18n="auth.logout">Logout</button>
          </div>
        </div>
      `;

      const trigger = el.querySelector('.user-menu__trigger');
      const dropdown = el.querySelector<HTMLElement>('.user-menu__dropdown');
      const logoutBtn = el.querySelector('.user-menu__logout');

      trigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown?.classList.toggle('hidden');
        trigger.setAttribute('aria-expanded', dropdown?.classList.contains('hidden') ? 'false' : 'true');
      });
      logoutBtn?.addEventListener('click', logout);
      document.addEventListener('click', (e) => {
        if (!el.contains(e.target as Node) && !nav?.contains(e.target as Node)) dropdown?.classList.add('hidden');
      }, { capture: false });
      if (window.matchMedia('(max-width: 560px)').matches) {
        const mobileMenu = el.querySelector('.user-menu');
        if (mobileMenu) {
          mobileMenu.classList.add('mobile-user-menu');
          nav?.appendChild(mobileMenu);
        }
      }
    } else {
      el.innerHTML = `<button id="login-btn-hdr" class="btn btn-primary" data-i18n="auth.login_register">Login / Register</button>`;
      el.querySelector('#login-btn-hdr')?.addEventListener('click', openAuthModal);
      nav?.insertAdjacentHTML('beforeend', '<button class="btn btn-primary mobile-login-btn" data-i18n="auth.login_register" type="button">Login / Register</button>');
      nav?.querySelector('.mobile-login-btn')?.addEventListener('click', openAuthModal);
    }

    nav?.querySelectorAll<HTMLImageElement>('.flag').forEach((flag) => {
      flag.addEventListener('click', () => {
        setLang(flag.dataset.lang as Lang);
        document.querySelectorAll<HTMLImageElement>('.flag').forEach(f => {
          f.classList.toggle('active', f.dataset.lang === flag.dataset.lang);
        });
      });
    });
  });

  applyI18n();
}

export function setupAuthForms(): void {
  if (document.body.dataset.authBound === '1') return;
  document.body.dataset.authBound = '1';

  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form') as HTMLFormElement | null;
  const registerForm = document.getElementById('register-form') as HTMLFormElement | null;

  tabLogin?.addEventListener('click', () => {
    loginForm?.classList.remove('hidden');
    registerForm?.classList.add('hidden');
    tabLogin.classList.add('active');
    tabRegister?.classList.remove('active');
  });

  tabRegister?.addEventListener('click', () => {
    registerForm?.classList.remove('hidden');
    loginForm?.classList.add('hidden');
    tabRegister.classList.add('active');
    tabLogin?.classList.remove('active');
  });

  document.getElementById('modal-close')?.addEventListener('click', closeAuthModal);
  document.getElementById('auth-modal')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'auth-modal') closeAuthModal();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAuthModal(); });

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (loginForm.querySelector('#login-email') as HTMLInputElement).value.trim();
    const password = (loginForm.querySelector('#login-password') as HTMLInputElement).value;
    const errEl = document.getElementById('login-error');
    const errRow = document.getElementById('login-error-row');
    try {
      await loginUser(email, password);
      closeAuthModal();
      renderHeaderAuth();
      window.location.reload();
    } catch (err) {
      if (errEl && errRow) { errEl.textContent = (err as Error).message; errRow.style.display = 'block'; }
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (registerForm.querySelector('#reg-name') as HTMLInputElement).value.trim();
    const email = (registerForm.querySelector('#reg-email') as HTMLInputElement).value.trim();
    const password = (registerForm.querySelector('#reg-password') as HTMLInputElement).value;
    const confirm = (registerForm.querySelector('#reg-password-confirm') as HTMLInputElement).value;
    const countryCode = (document.getElementById('country-code') as HTMLSelectElement)?.value || '';
    const phone = countryCode + ((document.getElementById('reg-phone') as HTMLInputElement)?.value?.trim() || '');
    const errEl = document.getElementById('reg-error');
    const errRow = document.getElementById('reg-error-row');

    const showError = (msg: string) => { if (errEl && errRow) { errEl.textContent = msg; errRow.style.display = 'block'; } };

    if (password !== confirm) { showError('Passwords do not match'); return; }
    if (password.length < 6) { showError('Password too short'); return; }

    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone }),
      });
      const result = await res.json().catch(() => ({})) as { error?: string; message?: string };
      if (!res.ok) { showError(result.error || 'Registration failed'); return; }

      await syncUsers();
      await registerUserLocal(name, email, password).catch(() => {});
      closeAuthModal();
      renderHeaderAuth();
      window.location.reload();
    } catch (err) {
      showError((err as Error).message);
    }
  });
}

export function initHeaderScroll(): void {
  const header = document.querySelector('.site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

export function initBurgerMenu(): void {
  const burger = document.getElementById('burger-btn');
  const navMenu = document.getElementById('nav-menu');
  if (!burger || !navMenu) return;

  burger.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    burger.classList.toggle('active', open);
  });

  document.addEventListener('click', (e) => {
    if (!burger.contains(e.target as Node) && !navMenu.contains(e.target as Node)) {
      navMenu.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      burger.classList.remove('active');
    }
  });
}

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  const existing = document.querySelector('.toast-container');
  const container = existing || (() => {
    const c = document.createElement('div');
    c.className = 'toast-container';
    document.body.appendChild(c);
    return c;
  })();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

export function initUI(): void {
  ensureAuthModal();
  renderHeaderAuth();
  setupAuthForms();
  initHeaderScroll();
  initBurgerMenu();
  applyI18n();
}
