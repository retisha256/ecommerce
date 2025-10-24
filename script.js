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

// Initialize cart functionality
document.addEventListener('DOMContentLoaded', function() {
  // Load cart.js if it exists
  if (typeof updateCartIcon === 'function') {
    updateCartIcon();
  }

  // Newsletter subscribe handler
  const newsletter = document.getElementById('newsletter');
  if (newsletter) {
    const input = newsletter.querySelector('input[type="text"], input[type="email"]');
    const button = newsletter.querySelector('button');
    if (input && button) {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = (input.value || '').trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
          showToast('Please enter a valid email address', 'error');
          input.focus();
          return;
        }
        try {
          // Persist in localStorage as a simple demo; hook to API if available
          const subs = JSON.parse(localStorage.getItem('subscribers') || '[]');
          if (!subs.includes(email)) {
            subs.push(email);
            localStorage.setItem('subscribers', JSON.stringify(subs));
          }
          showToast('Subscribed! You will receive our updates.');
          input.value = '';
        } catch (err) {
          console.error(err);
          showToast('Subscription failed. Try again later.', 'error');
        }
      });
    }
  }
  // Ensure Admin link exists in navbar across pages
  try {
    const navbarEl = document.getElementById('navbar');
    if (navbarEl && !navbarEl.querySelector('a[href="admin.html"]')) {
      const adminLi = document.createElement('li');
      const adminA = document.createElement('a');
      adminA.href = 'admin.html';
      adminA.textContent = 'Admin';
      adminLi.appendChild(adminA);
      const insertBeforeEl = navbarEl.querySelector('#lg-cart') || navbarEl.querySelector('#close');
      if (insertBeforeEl && insertBeforeEl.parentElement === navbarEl) {
        navbarEl.insertBefore(adminLi, insertBeforeEl);
      } else {
        navbarEl.appendChild(adminLi);
      }
    }
  } catch (err) {
    console.error('Failed to inject Admin link', err);
  }
});

function showToast(message, type = 'success') {
  const note = document.createElement('div');
  note.className = 'auth-notification';
  note.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 10000;
    background: ${type === 'error' ? '#DC2626' : '#088178'}; color: #fff;
    padding: 12px 16px; border-radius: 8px; box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    font-weight: 600;
  `;
  note.textContent = message;
  document.body.appendChild(note);
  setTimeout(() => note.remove(), 2500);
}