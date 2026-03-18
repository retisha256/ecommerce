// API Service for Novuna Electronics

// Determine the base URL - works in both development and production
const getBaseUrl = () => {
    // Check if we're running on Render (production)
    // In production (Render), use the current host
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return `${window.location.protocol}//${window.location.hostname}/api`;
    }
    // In development, detect the port automatically (e.g. 5003 or 5004)
    const port = window.location.port || '5003';
    return `http://localhost:${port}/api`;
};

const API_BASE_URL = getBaseUrl();
// Expose API_BASE_URL globally so other scripts can access it
window.API_BASE_URL = API_BASE_URL;
console.log('API Base URL:', API_BASE_URL); // For debugging

class ApiService {
    constructor() {
        this.API_BASE_URL = API_BASE_URL;
    }
    // Generic API call method
    async makeRequest(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        console.log('Making request to:', url); // For debugging

        const isFormData = (typeof FormData !== 'undefined') && options && options.body instanceof FormData;
        const headers = { ...(options && options.headers ? options.headers : {}) };

        if (!isFormData) {
            headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        }

        const config = {
            headers,
            ...options
        };

        try {
            const response = await fetch(url, config);

            // Check if response is empty
            const text = await response.text();
            const data = text ? JSON.parse(text) : {};

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Product methods
    async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
        return this.makeRequest(endpoint);
    }

    async getProduct(id) {
        return this.makeRequest(`/products/${id}`);
    }

    async createProduct(productData) {
        const isFormData = (typeof FormData !== 'undefined') && productData instanceof FormData;
        return this.makeRequest('/products', {
            method: 'POST',
            body: isFormData ? productData : JSON.stringify(productData)
        });
    }

    async updateProduct(id, productData) {
        const isFormData = (typeof FormData !== 'undefined') && productData instanceof FormData;
        return this.makeRequest(`/products/${id}`, {
            method: 'PUT',
            body: isFormData ? productData : JSON.stringify(productData)
        });
    }

    async deleteProduct(id) {
        return this.makeRequest(`/products/${id}`, {
            method: 'DELETE'
        });
    }

    // Order methods
    async createOrder(orderData) {
        return this.makeRequest('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async getOrders() {
        return this.makeRequest('/orders');
    }

    async getOrder(orderId) {
        return this.makeRequest(`/orders/${orderId}`);
    }

    async updateOrderStatus(orderId, statusData) {
        return this.makeRequest(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify(statusData)
        });
    }

    async deleteOrder(orderId) {
        return this.makeRequest(`/orders/${orderId}`, {
            method: 'DELETE'
        });
    }

    // Payment methods
    async generatePayment(paymentData) {
        return this.makeRequest('/payments/generate', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    async verifyPayment(verificationData) {
        return this.makeRequest('/payments/verify', {
            method: 'POST',
            body: JSON.stringify(verificationData)
        });
    }

    // Health check
    async healthCheck() {
        return this.makeRequest('/health');
    }
}

// Create global API instance
const api = new ApiService();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
} else {
    window.api = api;
}

// Cart functionality (keeping your existing cart code)
document.addEventListener('DOMContentLoaded', function () {
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartDisplay();
});

document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
        cart = JSON.parse(localStorage.getItem('cart')) || [];
        updateCartDisplay();
    }
});

window.addEventListener('storage', function (e) {
    if (e.key === 'cart') {
        cart = JSON.parse(e.newValue || '[]');
        updateCartDisplay();
    }
});

function updateCartDisplay() {
    cart = JSON.parse(localStorage.getItem('cart')) || [];
}