// API Service for Novuna Electronics
const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
    // Generic API call method
    async makeRequest(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
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
            const data = await response.json();
            
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
        return this.makeRequest(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
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

    async getOrder(orderId) {
        return this.makeRequest(`/orders/${orderId}`);
    }

    async updateOrderStatus(orderId, statusData) {
        return this.makeRequest(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify(statusData)
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
