# Novuna Electronics Ecommerce Website

A complete ecommerce website with mobile money integration for electronics sales in Uganda.

## Features

- 🛒 **Shopping Cart**: Add/remove products, quantity management
- 💳 **Mobile Money Integration**: MTN Mobile Money and Airtel Money payments
- 📱 **WhatsApp Integration**: Direct chat support and payment via WhatsApp
- 🎨 **Responsive Design**: Works on desktop, tablet, and mobile devices
- 🛍️ **Product Management**: Complete product catalog with categories
- 📊 **Order Management**: Track orders and payment status
- 🔒 **Secure Payments**: Secure payment processing with verification

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript
- Responsive design with mobile-first approach
- Local storage for cart persistence

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- RESTful API design
- Mobile money payment integration

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Update the connection string in `config.js`

4. **Configure environment variables**
   - Copy `config.js` and update with your settings
   - Set up mobile money merchant numbers
   - Configure WhatsApp number

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   - Frontend: Open `index.html` in your browser
   - API: http://localhost:5000/api

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/:orderId` - Get order details
- `PUT /api/orders/:orderId/status` - Update order status

### Payments
- `POST /api/payments/generate` - Generate payment request
- `POST /api/payments/verify` - Verify payment

## Mobile Money Integration

### MTN Mobile Money
- Merchant Number: 256774503039
- USSD Code: *165*3#
- Process: Send Money → Enter merchant number → Enter amount → Enter reference

### Airtel Money
- Merchant Number: 256705030391
- USSD Code: *185*9*1#
- Process: Send Money → Enter merchant number → Enter amount → Enter reference

## WhatsApp Integration

- Support Number: +2567745030391
- Direct chat support for customers
- Payment confirmation via WhatsApp
- Order updates and notifications

## File Structure

```
ecommerce/
├── index.html          # Home page
├── shop.html           # Product catalog
├── cart.html           # Shopping cart
├── checkout.html       # Checkout process
├── style.css           # Main stylesheet
├── script.js           # Main JavaScript
├── cart.js             # Cart functionality
├── checkout.js         # Checkout functionality
├── server.js           # Backend server
├── package.json        # Dependencies
├── config.js           # Configuration
└── README.md           # This file
```

## Usage

### For Customers
1. Browse products on the home page or shop page
2. Add products to cart by clicking the cart icon
3. View cart and adjust quantities
4. Proceed to checkout
5. Fill in billing information
6. Select payment method (MTN or Airtel)
7. Follow payment instructions
8. Confirm payment to complete order

### For Administrators
1. Use the API endpoints to manage products
2. Monitor orders and payment status
3. Update order status as needed
4. Handle customer support via WhatsApp

## Payment Flow

1. Customer adds products to cart
2. Customer proceeds to checkout
3. Customer fills billing information
4. Customer selects payment method
5. System generates payment instructions
6. Customer makes payment via mobile money
7. Customer confirms payment
8. Order is processed and confirmed

## Security Features

- Input validation on all forms
- Secure payment processing
- Order verification system
- Data encryption for sensitive information

## Deployment

### Frontend
- Deploy static files to any web hosting service
- Update API endpoints in JavaScript files

### Backend
- Deploy to cloud platforms like Heroku, AWS, or DigitalOcean
- Set up MongoDB Atlas for database
- Configure environment variables
- Set up SSL certificates for production

## Support

For support and questions:
- WhatsApp: +2567745030391
- Email: Customerservice.Novuna@gmail.com

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Roadmap

- [ ] User authentication system
- [ ] Admin dashboard
- [ ] Email notifications
- [ ] Inventory management
- [ ] Advanced payment integration
- [ ] Multi-language support
- [ ] Mobile app development
