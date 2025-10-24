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
});