const express = require('express');
const router = express.Router();
const Product = require('../models/product.model');

router.post('/', async (req, res) => {
    try {
        const { message, localProducts } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, reply: "Please provide a message." });
        }

        const msgLower = message.toLowerCase();
        let reply = "I'm sorry, I can't help you with that at the moment. You can ask me about our products, prices, or availability.";

        // Fetch products from database
        let products = await Product.find({ isActive: true });

        // Hydrate with localProducts from frontend admin.html
        if (localProducts && Array.isArray(localProducts)) {
            const dbNames = new Set(products.map(p => p.name.toLowerCase()));
            for (const lp of localProducts) {
                if (lp && lp.name && !dbNames.has(lp.name.toLowerCase())) {
                    lp.stock = lp.stock !== undefined ? Number(lp.stock) : 10;
                    lp.isActive = lp.isActive !== undefined ? lp.isActive : true;
                    lp.price = Number(lp.price) || 0;
                    products.push(lp);
                }
            }
        }

        // Check if there are any products in the database
        const hasProducts = products.length > 0;

        // Gratitude Intent
        if (msgLower.includes('thank you') || msgLower.includes('thanks') || msgLower.includes('appreciated') || msgLower.includes('grateful')) {
            reply = "You're welcome! 😇 Thank you for shopping at Novuna Electronics. Is there anything else you'd like to know about our products?";
            return res.json({ success: true, reply });
        }

        // Contact Intent
        if (msgLower.includes('contact') || msgLower.includes('help') || msgLower.includes('email') || msgLower.includes('phone') || msgLower.includes('manager') || msgLower.includes('incharge') || msgLower.includes('details')) {
            reply = "You can contact our customer service team via email at customerservice.novuna@gmail.com or call us at +256 754 030391. We're happy to help with any product inquiries!";
            return res.json({ success: true, reply });
        }

        // Simple Greeting
        const textWords = msgLower.split(' ');
        if (textWords.includes('hi') || textWords.includes('hello') || textWords.includes('hey') || textWords.includes('good morning') || textWords.includes('good afternoon')) {
            if (hasProducts) {
                const categories = [...new Set(products.map(p => p.category))];
                reply = `Hello! I'm Novuna AI. 👋 I can help you with information about our ${categories.length} product categories including ${categories.slice(0, 3).join(', ')}${categories.length > 3 ? ' and more' : ''}. What would you like to know?`;
            } else {
                reply = "Hello! I'm Novuna AI. 👋 How can I assist you today? You can ask me about product availability, prices, or information.";
            }
            return res.json({ success: true, reply });
        }

        // List all products
        if (msgLower.includes('list all products') || msgLower.includes('show all products') || msgLower.includes('what products do you have')) {
            if (hasProducts) {
                const productList = products.map(p => `${p.name} (${p.category}) - ${p.stock > 0 ? 'In Stock' : 'Out of Stock'}`).join('\n• ');
                reply = `Here are all our available products:\n• ${productList}`;
            } else {
                reply = "We currently don't have any products listed. Please check back later!";
            }
            return res.json({ success: true, reply });
        }

        // Show products by category
        if (msgLower.includes('show ') && msgLower.includes(' category') || msgLower.includes('products in ')) {
            const categoryMatch = msgLower.match(/(?:show|in)\s+(\w+)\s+(?:category|products)?/);
            if (categoryMatch && categoryMatch[1]) {
                const searchCategory = categoryMatch[1];
                const categoryProducts = products.filter(p => 
                    p.category.toLowerCase().includes(searchCategory) || 
                    p.name.toLowerCase().includes(searchCategory)
                );
                
                if (categoryProducts.length > 0) {
                    const productList = categoryProducts.map(p => `${p.name} - UGX ${p.price.toLocaleString()}`).join('\n• ');
                    reply = `Products in ${searchCategory} category:\n• ${productList}`;
                } else {
                    reply = `I couldn't find any products in the "${searchCategory}" category. Try asking about: ${[...new Set(products.map(p => p.category))].join(', ')}`;
                }
                return res.json({ success: true, reply });
            }
        }

        // Check stock of all products
        if (msgLower.includes('what is in stock') || msgLower.includes('available products') || msgLower.includes('products in stock')) {
            const inStockProducts = products.filter(p => p.stock > 0 && p.isActive);
            if (inStockProducts.length > 0) {
                const productList = inStockProducts.map(p => `${p.name} - UGX ${p.price.toLocaleString()} (${p.stock} available)`).join('\n• ');
                reply = `Here are the products currently in stock:\n• ${productList}`;
            } else {
                reply = "Sorry, we currently don't have any products in stock. Please check back later!";
            }
            return res.json({ success: true, reply });
        }

        // Identify product mention by exact or partial name match
        let matchedProduct = null;
        let matchedCategoryProducts = [];

        for (const product of products) {
            if (msgLower.includes(product.name.toLowerCase())) {
                matchedProduct = product;
                break;
            }
        }

        // If no exact match, try partial matching
        if (!matchedProduct) {
            const searchTerms = msgLower.split(' ');
            for (const product of products) {
                const productNameLower = product.name.toLowerCase();
                for (const term of searchTerms) {
                    if (term.length > 2 && productNameLower.includes(term)) {
                        matchedProduct = product;
                        break;
                    }
                }
                if (matchedProduct) break;
            }
        }

        // Identify category mention if no specific product is matched
        if (!matchedProduct) {
            for (const product of products) {
                if (msgLower.includes(product.category.toLowerCase())) {
                    matchedCategoryProducts.push(product);
                }
            }

            // Handle common fuzzy categories
            if (msgLower.includes('tv') || msgLower.includes('tvs') || msgLower.includes('television') || msgLower.includes('screen')) {
                matchedCategoryProducts = products.filter(p => 
                    p.category.toLowerCase().includes('tv') || 
                    p.category.toLowerCase().includes('electronic') || 
                    p.name.toLowerCase().includes('tv') || 
                    p.name.toLowerCase().includes('television') ||
                    p.name.toLowerCase().includes('screen')
                );
            }
            if (msgLower.includes('sound') || msgLower.includes('speaker') || msgLower.includes('audio') || msgLower.includes('headphone')) {
                matchedCategoryProducts = products.filter(p => 
                    p.category.toLowerCase().includes('audio') || 
                    p.category.toLowerCase().includes('sound') ||
                    p.name.toLowerCase().includes('speaker') || 
                    p.name.toLowerCase().includes('headphone') ||
                    p.name.toLowerCase().includes('sound')
                );
            }
            if (msgLower.includes('phone') || msgLower.includes('mobile') || msgLower.includes('smartphone') || msgLower.includes('cell')) {
                matchedCategoryProducts = products.filter(p => 
                    p.category.toLowerCase().includes('phone') || 
                    p.category.toLowerCase().includes('mobile') ||
                    p.name.toLowerCase().includes('phone') || 
                    p.name.toLowerCase().includes('mobile')
                );
            }
            if (msgLower.includes('laptop') || msgLower.includes('computer') || msgLower.includes('notebook') || msgLower.includes('macbook')) {
                matchedCategoryProducts = products.filter(p => 
                    p.category.toLowerCase().includes('laptop') || 
                    p.category.toLowerCase().includes('computer') ||
                    p.name.toLowerCase().includes('laptop') || 
                    p.name.toLowerCase().includes('notebook')
                );
            }
        }

        if (matchedProduct) {
            // Price Intent
            if (msgLower.includes('price') || msgLower.includes('cost') || msgLower.includes('how much') || msgLower.includes('how much is')) {
                const formattedPrice = new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(matchedProduct.price);
                reply = `The ${matchedProduct.name} is priced at ${formattedPrice}.`;
                
                if (matchedProduct.stock > 0) {
                    reply += ` We currently have ${matchedProduct.stock} units in stock.`;
                } else {
                    reply += ` Unfortunately, it's currently out of stock.`;
                }
            }
            // Availability Intent
            else if (msgLower.includes('available') || msgLower.includes('stock') || msgLower.includes('have') || msgLower.includes('do you have')) {
                if (matchedProduct.stock > 0 && matchedProduct.isActive) {
                    reply = `Yes, the ${matchedProduct.name} is currently in stock! We have ${matchedProduct.stock} units available.`;
                } else {
                    reply = `Sorry, the ${matchedProduct.name} is currently out of stock. Would you like me to show you similar products?`;
                }
            }
            // Info Intent - Enhanced with more details
            else if (msgLower.includes('info') || msgLower.includes('about') || msgLower.includes('tell me about') || msgLower.includes('details') || msgLower.includes('specifications') || msgLower.includes('specs')) {
                reply = `📱 **${matchedProduct.name}**\n`;
                reply += `Category: ${matchedProduct.category}\n`;
                reply += `Price: ${new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(matchedProduct.price)}\n`;
                reply += `Availability: ${matchedProduct.stock > 0 ? `In Stock (${matchedProduct.stock} units)` : 'Out of Stock'}\n`;
                reply += matchedProduct.description ? `Description: ${matchedProduct.description}` : '';
            }
            // Generic product match without specific intent
            else {
                if (matchedProduct.stock > 0 && matchedProduct.isActive) {
                    const formattedPrice = new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(matchedProduct.price);
                    reply = `I see you're asking about the ${matchedProduct.name}. It costs ${formattedPrice} and is currently ${matchedProduct.stock > 0 ? `in stock (${matchedProduct.stock} available)` : 'out of stock'}.`;
                    
                    if (matchedProduct.description) {
                        reply += ` ${matchedProduct.description}`;
                    }
                } else {
                    reply = `Sorry, the ${matchedProduct.name} is currently out of stock. Would you like to see similar products in the ${matchedProduct.category} category?`;
                }
            }
        } else if (matchedCategoryProducts.length > 0) {
            const uniqueProducts = matchedCategoryProducts.reduce((acc, current) => {
                const x = acc.find(item => item.name === current.name);
                if (!x) {
                    return acc.concat([current]);
                } else {
                    return acc;
                }
            }, []);
            
            if (uniqueProducts.length > 5) {
                reply = `We have ${uniqueProducts.length} products in this category. Here are some of them: ${uniqueProducts.slice(0, 5).map(p => p.name).join(', ')}. Would you like more details about any specific product?`;
            } else {
                reply = `Here are the products we have in this category: ${uniqueProducts.map(p => p.name).join(', ')}. You can ask about prices or availability for any of these.`;
            }
        } else {
            // Enhanced fallbacks
            if (hasProducts) {
                if (msgLower.includes('available') || msgLower.includes('what do you have') || msgLower.includes('products')) {
                    const categories = [...new Set(products.map(p => p.category))];
                    reply = `We have products in the following categories: ${categories.join(', ')}. You can ask me things like:\n• "Do you have laptops?"\n• "What's the price of [product name]?"\n• "Show me all phones"\n• "What's in stock?"`;
                } else if (msgLower.includes('return') || msgLower.includes('policy')) {
                    reply = "Our return policy allows returns within 14 days of purchase. Please ensure the item is in its original packaging with all accessories.";
                } else if (msgLower.includes('size') || msgLower.includes('dimension')) {
                    reply = "Product dimensions vary by model. Please ask about a specific product, and I can provide detailed specifications.";
                } else if (msgLower.includes('warranty')) {
                    reply = "Most of our products come with a manufacturer's warranty. The warranty period varies by product type. Please ask about a specific product for warranty details.";
                } else if (msgLower.includes('delivery') || msgLower.includes('shipping')) {
                    reply = "We offer free delivery within Kampala for orders above UGX 500,000. Delivery typically takes 1-3 business days. For other locations, delivery fees may apply.";
                } else if (msgLower.includes('payment')) {
                    reply = "We accept various payment methods including cash on delivery, mobile money (MTN/Airtel), and bank transfers.";
                }
            } else {
                reply = "I'm here to help with product information, but it looks like our product catalog is currently empty. Please check back later or contact our customer service for assistance.";
            }
        }

        return res.json({ success: true, reply });

    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ success: false, reply: "I'm having trouble connecting right now. Please try again later or contact customer service." });
    }
});

module.exports = router;