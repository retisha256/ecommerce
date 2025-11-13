# Cart System Debugging Guide

## Problem
Cart page doesn't display items that were added to cart from shop/home page.

## Root Causes Fixed

### 1. **Script Loading Issue** ✅
- **Problem**: `cart.html` was loading `models/cart.js` instead of `cart.js`
- **Fix**: Updated line in cart.html to load correct script path: `<script src="cart.js"></script>`

### 2. **Data Reload on Page Load** ✅
- **Problem**: Cart variable wasn't being reloaded from localStorage when cart.html was first loaded
- **Fix**: Added explicit reload in DOMContentLoaded event:
  ```javascript
  document.addEventListener('DOMContentLoaded', function() {
      // Reload cart from localStorage to ensure we have latest data
      cart = JSON.parse(localStorage.getItem('cart')) || [];
      updateCartDisplay();
      updateCartIcon();
  });
  ```

### 3. **Page Visibility Handling** ✅
- **Problem**: Switching tabs and coming back wouldn't refresh cart
- **Fix**: Added visibility change listener:
  ```javascript
  document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
          cart = JSON.parse(localStorage.getItem('cart')) || [];
          updateCartDisplay();
          updateCartIcon();
      }
  });
  ```

### 4. **Storage Event Listener** ✅
- **Problem**: localStorage changes from other tabs wouldn't sync
- **Fix**: Added storage event listener:
  ```javascript
  window.addEventListener('storage', function(e) {
      if (e.key === 'cart') {
          cart = JSON.parse(e.newValue || '[]');
          updateCartDisplay();
          updateCartIcon();
      }
  });
  ```

### 5. **Enhanced Data Reloading in Display Function** ✅
- **Problem**: updateCartDisplay wasn't always using latest localStorage data
- **Fix**: Added explicit reload at start of function:
  ```javascript
  function updateCartDisplay() {
      // ... validation code ...
      
      // Reload cart from localStorage to ensure we have the latest data
      cart = JSON.parse(localStorage.getItem('cart')) || [];
  ```

## How to Test

### Option 1: Using Browser Developer Console
1. Open DevTools (F12)
2. Go to Application > LocalStorage
3. Add items to cart from shop/home page
4. Watch for "Cart saved to localStorage" message
5. Navigate to cart.html
6. Check if items appear
7. Look at console logs for debugging info

### Option 2: Using Test Page
1. Open `test-cart.html` in your browser
2. Use the buttons to:
   - Add test products
   - View localStorage data
   - Navigate to different pages
   - Clear cart
3. This helps verify localStorage is working

### Option 3: Manual Testing
1. Go to shop.html or index.html
2. Click "Add to Cart" button on a product
3. Check DevTools Console for logs:
   - "Adding to cart: {...}"
   - "Cart saved to localStorage: [...]"
4. Navigate to cart.html
5. Cart items should appear
6. Check console for "Cart display updated"

## Console Output Expected

When adding a product:
```
Adding to cart: {id: 'iphone-xr', name: 'iPhone XR', ...}
New item added to cart
Cart saved to localStorage: [{id: 'iphone-xr', ...}]
updateCartIcon called - Total items: 1 Icons found: 2
Cart display updated with total: 2000000
```

When navigating to cart page:
```
Cart items: [{id: 'iphone-xr', name: 'iPhone XR', ...}]
Cart display updated with total: 2000000
```

## Files Modified

1. **cart.html**
   - Fixed script path from `models/cart.js` to `cart.js`

2. **cart.js**
   - Added console logging throughout
   - Added DOMContentLoaded reload
   - Added visibilitychange listener
   - Added storage change listener
   - Enhanced updateCartDisplay() to reload from localStorage
   - Added logging to updateCartIcon()

## Troubleshooting

### Issue: Items still not showing
1. Check DevTools Console for error messages
2. Verify localStorage is enabled in browser
3. Check that cart-items element exists in HTML:
   ```html
   <tbody id="cart-items">
   ```
4. Look for "Cart container not found" message (means not on cart page)

### Issue: Badge not updating
1. Check if #lg-cart and #mobile selectors exist in navbar
2. Verify updateCartIcon is being called (look for console log)
3. Check browser console for any errors

### Issue: Cart empties after refresh
1. This is normal - localStorage only persists between page loads
2. Items should reappear when you add to cart again
3. If items disappear immediately, check browser's privacy settings

## Next Steps

1. Test the cart with console logs open
2. Verify items appear on cart page after adding from shop
3. Test switching tabs and coming back
4. Remove console.log statements once working (optional, but recommended for production)

