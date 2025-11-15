const mongoose = require('mongoose');

// Define the schema (structure) for a Product document
const productSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please enter a product name'],
            trim: true,
        },
        category: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: false,
        },
        price: {
            type: Number,
            required: true,
            default: 0,
        },
        imageUrl: {
            type: String,
            required: false, // Set to false since we're using placeholders for now
        },
        rating: {
            type: Number,
            required: true,
            default: 0,
        },
        stock: {
            type: Number,
            required: true,
            default: 0,
        },
        // Mongoose automatically adds timestamps (createdAt, updatedAt)
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Create the model using the schema
// Provide a virtual `image` property that maps to `imageUrl` for frontend compatibility
if (!productSchema.virtuals || !productSchema.virtuals.image) {
    productSchema.virtual('image')
        .get(function () { return this.imageUrl; })
        .set(function (v) { this.imageUrl = v; });
}

// Create the model using the schema
// Avoid OverwriteModelError in environments that may load this file twice
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

module.exports = Product;
