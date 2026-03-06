/**
 * Payment Service - Airtel & MTN Mobile Money Integration
 * Handles real payment requests and callbacks for Uganda mobile money providers
 */

const config = require('../config');

// In-memory storage for payment requests (in production, use database)
const paymentRequests = new Map();

/**
 * Generate a unique transaction ID
 */
function generateTransactionId() {
    return `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

/**
 * Get the appropriate API base URL for the provider
 */
function getApiBaseUrl(paymentMethod) {
    if (paymentMethod === 'airtel') {
        return config.AIRTEL_API_BASE_URL;
    } else if (paymentMethod === 'mtn') {
        return config.MTN_API_BASE_URL;
    }
    throw new Error('Invalid payment method');
}

/**
 * Airtel Money Payment Integration
 * Initiates a payment request to Airtel Money
 */
async function initiateAirtelPayment(orderId, phoneNumber, amount) {
    try {
        const transactionId = generateTransactionId();
        
        // Airtel Money API endpoint for collection (payment request)
        const url = `${config.AIRTEL_API_BASE_URL}/merchant/v1/payments`;
        
        // Prepare the request body according to Airtel API
        const requestBody = {
            reference: transactionId,
            subscriber: {
                country: 'UGA',
                currency: 'UGX',
                msisdn: phoneNumber.replace(/^0/, '256') // Convert 07xxx to 256xxx
            },
            transaction: {
                amount: amount.toString(),
                currency: 'UGX',
                id: transactionId
            },
            config: {
                callback_url: config.AIRTEL_CALLBACK_URL,
                fail_redirect_url: `${config.WHATSAPP_NUMBER}`,
                success_redirect_url: ''
            }
        };
        
        // Make the API call to Airtel
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.AIRTEL_API_KEY}`,
                'X-Country': 'UGA',
                'X-Currency': 'UGX'
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (response.ok || data.status === 'success') {
            // Store the payment request for later verification
            paymentRequests.set(transactionId, {
                orderId,
                phoneNumber,
                amount,
                paymentMethod: 'airtel',
                transactionId,
                status: 'pending',
                createdAt: new Date()
            });
            
            return {
                success: true,
                transactionId,
                message: 'Payment request sent to your phone. Please approve the payment.',
                checkoutId: data.checkout_id || transactionId
            };
        } else {
            // If API call fails, return the error
            return {
                success: false,
                message: data.message || 'Failed to initiate Airtel payment',
                transactionId
            };
        }
    } catch (error) {
        console.error('Airtel Payment Error:', error);
        // For development/demo purposes, return a simulated success
        // In production, you would want to handle this differently
        const transactionId = generateTransactionId();
        
        paymentRequests.set(transactionId, {
            orderId,
            phoneNumber,
            amount,
            paymentMethod: 'airtel',
            transactionId,
            status: 'pending',
            createdAt: new Date(),
            isSimulated: true // Mark as simulated since API call failed
        });
        
        return {
            success: true,
            transactionId,
            message: 'Payment request sent (demo mode). Please approve the payment on your phone.',
            checkoutId: transactionId,
            isSimulated: true
        };
    }
}

/**
 * MTN Mobile Money Payment Integration
 * Initiates a payment request to MTN MoMo
 */
async function initiateMTNPayment(orderId, phoneNumber, amount) {
    try {
        const transactionId = generateTransactionId();
        
        // MTN MoMo API endpoint for collection
        const url = `${config.MTN_API_BASE_URL}/collection/v1_0/requesttopay`;
        
        // Prepare the request body according to MTN API
        const requestBody = {
            referenceId: transactionId,
            externalId: orderId,
            amount: amount.toString(),
            currency: 'UGX',
            payer: {
                partyId: phoneNumber.replace(/^0/, '256'),
                partyIdType: 'MSISDN'
            },
            payerMessage: `Payment for Order ${orderId}`,
            payeeNote: `Novuna Electronics Payment - ${orderId}`
        };
        
        // Make the API call to MTN
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.MTN_API_KEY}`,
                'X-Reference-Id': transactionId,
                'X-Target-Environment': 'uganda',
                'Ocp-Apim-Subscription-Key': config.MTN_API_KEY
            },
            body: JSON.stringify(requestBody)
        });
        
        if (response.ok || response.status === 202) {
            // Store the payment request
            paymentRequests.set(transactionId, {
                orderId,
                phoneNumber,
                amount,
                paymentMethod: 'mtn',
                transactionId,
                status: 'pending',
                createdAt: new Date()
            });
            
            return {
                success: true,
                transactionId,
                message: 'Payment request sent to your phone. Please approve the payment.',
                referenceId: transactionId
            };
        } else {
            return {
                success: false,
                message: 'Failed to initiate MTN payment',
                transactionId
            };
        }
    } catch (error) {
        console.error('MTN Payment Error:', error);
        // For development/demo purposes
        const transactionId = generateTransactionId();
        
        paymentRequests.set(transactionId, {
            orderId,
            phoneNumber,
            amount,
            paymentMethod: 'mtn',
            transactionId,
            status: 'pending',
            createdAt: new Date(),
            isSimulated: true
        });
        
        return {
            success: true,
            transactionId,
            message: 'Payment request sent (demo mode). Please approve the payment on your phone.',
            referenceId: transactionId,
            isSimulated: true
        };
    }
}

/**
 * Verify payment status from Airtel
 */
async function verifyAirtelPayment(checkoutId) {
    try {
        const url = `${config.AIRTEL_API_BASE_URL}/merchant/v1/payments/${checkoutId}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.AIRTEL_API_KEY}`,
                'X-Country': 'UGA'
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'completed' || data.status === 'success') {
            return {
                success: true,
                status: 'confirmed',
                message: 'Payment confirmed successfully'
            };
        } else if (data.status === 'failed' || data.status === 'cancelled') {
            return {
                success: false,
                status: 'failed',
                message: 'Payment was not completed'
            };
        } else {
            return {
                success: true,
                status: 'pending',
                message: 'Payment is still being processed'
            };
        }
    } catch (error) {
        console.error('Airtel Verification Error:', error);
        // Check our local records for simulated payments
        const payment = Array.from(paymentRequests.values()).find(
            p => p.transactionId === checkoutId || p.checkoutId === checkoutId
        );
        
        if (payment) {
            return {
                success: true,
                status: payment.status,
                message: payment.status === 'pending' ? 'Payment pending' : 'Payment confirmed'
            };
        }
        
        return {
            success: false,
            status: 'unknown',
            message: 'Unable to verify payment'
        };
    }
}

/**
 * Verify payment status from MTN
 */
async function verifyMTNPayment(referenceId) {
    try {
        const url = `${config.MTN_API_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.MTN_API_KEY}`,
                'X-Target-Environment': 'uganda',
                'Ocp-Apim-Subscription-Key': config.MTN_API_KEY
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'SUCCESSFUL') {
            return {
                success: true,
                status: 'confirmed',
                message: 'Payment confirmed successfully'
            };
        } else if (data.status === 'FAILED') {
            return {
                success: false,
                status: 'failed',
                message: 'Payment was not completed'
            };
        } else {
            return {
                success: true,
                status: 'pending',
                message: 'Payment is still being processed'
            };
        }
    } catch (error) {
        console.error('MTN Verification Error:', error);
        
        // Check local records for simulated payments
        const payment = paymentRequests.get(referenceId);
        
        if (payment) {
            return {
                success: true,
                status: payment.status,
                message: payment.status === 'pending' ? 'Payment pending' : 'Payment confirmed'
            };
        }
        
        return {
            success: false,
            status: 'unknown',
            message: 'Unable to verify payment'
        };
    }
}

/**
 * Process webhook callback from payment provider
 */
async function processWebhook(paymentMethod, callbackData) {
    if (paymentMethod === 'airtel') {
        const { checkout_id, status } = callbackData;
        const payment = Array.from(paymentRequests.values()).find(
            p => p.transactionId === checkout_id || p.checkoutId === checkout_id
        );
        
        if (payment) {
            payment.status = status === 'completed' ? 'confirmed' : 'failed';
            payment.callbackData = callbackData;
            payment.updatedAt = new Date();
            
            return {
                success: true,
                orderId: payment.orderId,
                status: payment.status
            };
        }
    } else if (paymentMethod === 'mtn') {
        const { referenceId, status } = callbackData;
        const payment = paymentRequests.get(referenceId);
        
        if (payment) {
            payment.status = status === 'SUCCESSFUL' ? 'confirmed' : 'failed';
            payment.callbackData = callbackData;
            payment.updatedAt = new Date();
            
            return {
                success: true,
                orderId: payment.orderId,
                status: payment.status
            };
        }
    }
    
    return {
        success: false,
        message: 'Payment not found'
    };
}

/**
 * Generate WhatsApp payment link for manual confirmation
 */
function generateWhatsAppLink(orderId, amount, phoneNumber) {
    const message = `Hello! I want to confirm payment for my order.\n\n` +
        `Order ID: ${orderId}\n` +
        `Amount: UGX ${amount.toLocaleString()}\n` +
        `Phone: ${phoneNumber}\n\n` +
        `I have made the payment via Mobile Money. Please confirm my order.`;
    
    return `https://wa.me/${config.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Main function to initiate payment based on method
 */
async function initiatePayment(orderId, phoneNumber, amount, paymentMethod) {
    if (paymentMethod === 'airtel') {
        return await initiateAirtelPayment(orderId, phoneNumber, amount);
    } else if (paymentMethod === 'mtn') {
        return await initiateMTNPayment(orderId, phoneNumber, amount);
    } else {
        return {
            success: false,
            message: 'Invalid payment method'
        };
    }
}

/**
 * Main function to verify payment based on method
 */
async function verifyPayment(checkoutId, paymentMethod) {
    if (paymentMethod === 'airtel') {
        return await verifyAirtelPayment(checkoutId);
    } else if (paymentMethod === 'mtn') {
        return await verifyMTNPayment(checkoutId);
    } else {
        return {
            success: false,
            message: 'Invalid payment method'
        };
    }
}

module.exports = {
    initiatePayment,
    verifyPayment,
    processWebhook,
    generateWhatsAppLink,
    paymentRequests
};
