// syncProductWorker.js
const { parentPort, workerData } = require('worker_threads');
const Inventory = require('../models/inventory');
const Store = require('../models/store');
const Organization = require('../models/organization');
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const connectDB = require('./connectDB');

const syncProductJob = async (jobData) => {
  try {
    const { storeId, store, organizationId, userId } = workerData;

    console.log(workerData);

    // Connect to MongoDB
    connectDB();

    // Initialize WooCommerce API
    const wooCommerce = new WooCommerceRestApi({
      url: store._doc.url,
      consumerKey: store._doc.apiKey,
      consumerSecret: store._doc.secretKey,
      version: 'wc/v3',
    });

    // Fetch all products from WooCommerce
    const getAllProducts = async (page = 1) => {
      const response = await wooCommerce.get('products', { per_page: 100, page });
      return response.data;
    };

    let products = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const currentPageProducts = await getAllProducts(page);
      if (currentPageProducts.length === 0) hasMore = false;
      else {
        products = [...products, ...currentPageProducts];
        page++;
      }
    }

    console.log(products);

    // Process and sync products to the Inventory
    for (const product of products) {
      const existingProduct = await Inventory.findOne({ product_Id: product.id.toString(), storeId });
      const productData = {
        storeId,
        organizationId,
        userId,
        product_Id: product.id.toString(),
        name: product.name || 'N/A',
        sku: product.sku || 'N/A',
        description: product.description || 'N/A',
        short_description: product.short_description || 'N/A',
        price: parseFloat(product.price) || 0,
        sale_price: parseFloat(product.sale_price) || 0,
        regular_price: parseFloat(product.regular_price) || 0,
        date_on_sale_from: product.date_on_sale_from ? new Date(product.date_on_sale_from) : null,
        date_on_sale_to: product.date_on_sale_to ? new Date(product.date_on_sale_to) : null,
        on_sale: product.on_sale || false,
        purchasable: product.purchasable || true,
        total_sales: product.total_sales || 0,
        status: product.status || 'N/A',
        featured: product.featured || false,
        catalog_visibility: product.catalog_visibility || 'visible',
        manage_stock: product.manage_stock || false,
        stock_quantity: product.stock_quantity || 0,
        stock_status: product.stock_status || 'N/A',
        backorders: product.backorders || 'no',
        backorders_allowed: product.backorders_allowed || false,
        weight: product.weight || null,
        dimensions: product.dimensions || { length: null, width: null, height: null },
        shipping_required: product.shipping_required || false,
        shipping_taxable: product.shipping_taxable || false,
        shipping_class: product.shipping_class || 'N/A',
        shipping_class_id: product.shipping_class_id || 0,
        categories: product.categories || [],
        tags: product.tags || [],
        images: product.images || [],
        average_rating: product.average_rating || '0.00',
        rating_count: product.rating_count || 0,
        reviews_allowed: product.reviews_allowed || true,
        permalink: product.permalink || 'N/A',
        slug: product.slug || 'N/A',
        type: product.type || 'N/A',
        external_url: product.external_url || '',
        button_text: product.button_text || '',
        upsell_ids: product.upsell_ids || [],
        cross_sell_ids: product.cross_sell_ids || [],
        related_ids: product.related_ids || [],
        purchase_note: product.purchase_note || '',
        sold_individually: product.sold_individually || false,
        grouped_products: product.grouped_products || [],
        menu_order: product.menu_order || 0,
        date_created: new Date(product.date_created),
        date_modified: new Date(product.date_modified),
      };

      console.log(product.manage_stock, product.stock_quantity, product.stock_status);

      if (existingProduct) {
        await Inventory.findOneAndUpdate(
          { product_Id: product.id.toString(), storeId },
          { $set: productData },
          { new: true }
        );
      } else {
        await Inventory.create({ ...productData, storeId, organizationId, userId });
      }
    }

    parentPort.postMessage({ status: 'success', message: 'Products synchronized successfully' });
  } catch (error) {
    console.error(error);
    parentPort.postMessage({ status: 'error', message: error.message });
  }
};

syncProductJob(workerData);
