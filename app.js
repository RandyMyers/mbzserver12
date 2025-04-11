const express = require('express');
const http = require('http');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');

const fileUpload = require('express-fileupload');
const receiverEvent = require('./helper/receiverEvent');
//const currencyEvent = require('./helper/exchangeRateEvent')
// Importing route files
const userRoutes = require('./routes/userRoutes');
//const policiesRoutes = require('./routes/policyRoutes');
const authRoutes = require('./routes/authRoutes');
//const blogRoutes = require('./routes/blogRoutes');
//const affiliateRoutes = require('./routes/affiliateRoutes');
//const visitorRoutes = require('./routes/visitorRoutes');
//const interactionRoutes = require('./routes/interactionRoutes');
//const triggerRoutes = require('./routes/triggerRoutes');
//const actionRoutes = require('./routes/actionRoutes');
//const conditionRoutes = require('./routes/conditionRoutes');
//const bankAccountEURRoutes = require('./routes/bankAccountEURRoutes');
//const bankAccountUSDRoutes = require('./routes/bankAccountUSDRoutes');
//const bankAccountGBPRoutes = require('./routes/bankAccountGBPRoutes');
//const dealRoutes = require('./routes/dealRoutes');
const organizationRoutes = require('./routes/organizationRoutes');  // New Coupon Routes
const storeRoutes = require('./routes/storeRoutes'); 
//const exchangeRateRoutes = require('./routes/exchangeRateRoutes');
//const categoryRoutes = require('./routes/categoryRoutes');  // New Category Routes
//const cryptoWalletBTCRoutes = require('./routes/cryptoWalletBTCRoutes');
//const cryptoWalletUSDTRoutes = require('./routes/cryptoWalletUSDTRoutes');
//const cartRoutes = require('./routes/cartRoutes');
const customerRoutes = require('./routes/customerRoutes');
const emailRoutes = require('./routes/emailRoutes');
const emailTemplateRoutes = require('./routes/emailTemplateRoutes');
const inboxRoutes = require('./routes/inboxRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
//const paymentMethodRoutes = require('./routes/paymentMethodRoutes');
const productRoutes = require('./routes/productRoutes');
const senderRoutes = require('./routes/senderRoutes');
const receiverRoutes = require('./routes/receiverRoutes');
//const smsTemplateRoutes = require('./routes/smsTemplateRoutes');
//const connectedAccountRoutes = require('./routes/connectedAccountRoutes');
const taskRoutes = require('./routes/taskRoutes');
//const workflowRoutes = require('./routes/workflowRoutes');
//const siteRoutes = require('./routes/siteRoutes');
//const subscriptionRoutes = require('./routes/subscriptionRoutes');  // New Subscription Routes
//const discountRoutes = require('./routes/discountRoutes');  // New Discount Routes
//const discountUsageRoutes = require('./routes/discountUsageRoutes');  // New Discount Usage Routes
//const paymentRoutes = require('./routes/paymentRoutes');  // New Payment Routes
//const subscriptionPlanRoutes = require('./routes/subscriptionPlanRoutes');  // New Subscription Plan Routes
//const paymentLinkRoutes = require('./routes/paymentLinkRoutes');  // New Payment Link Routes

dotenv.config();

const cloudinary = require('cloudinary').v2;
const app = express();

// Cloudinary Configuration
const cloudinaryConfig = require('./config/cloudinary');

// Set Cloudinary configuration as a local variable
app.use((req, res, next) => {
  cloudinary.config(cloudinaryConfig);
  next();
});

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB', error);
  });

// Middleware
app.use(cors({
  origin: '*',  // Allow requests from the frontend
  methods: ['GET', 'POST', 'PUT', 'PATCH','DELETE'],  // Adjust allowed methods as needed
  allowedHeaders: ['Content-Type', 'Authorization'],  // Allow specific headers if needed
}));
app.use(bodyParser.json({ limit: '10mb' })); // Adjust the limit as needed
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true })); 
app.use(morgan('dev')); 

app.use(
  fileUpload({
    useTempFiles: true, // Store files in memory instead of a temporary directory
    createParentPath: true, // Create the 'uploads' directory if not exists
    tempFileDir: '/tmp/',
    limits: { fileSize: 10 * 1024 * 1024 }
  })
);

// Using imported routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
//app.use('/api/sites', siteRoutes);
//app.use('/api/triggers', triggerRoutes);
//app.use('/api/actions', actionRoutes);
//app.use('/api/conditions', conditionRoutes);
//app.use('/api/connected/accounts', connectedAccountRoutes);

//app.use('/api/bank/accounts/eur', bankAccountEURRoutes);
//app.use('/api/bank/accounts/usd', bankAccountUSDRoutes);
//app.use('/api/bank/accounts/gbp', bankAccountGBPRoutes);
//app.use('/api/exchange-rates', exchangeRateRoutes);
//app.use('/api/deals', dealRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
//app.use('/api/categories', categoryRoutes);

//app.use('/api/wallets/btc', cryptoWalletBTCRoutes);
//app.use('/api/wallets/usdt', cryptoWalletUSDTRoutes);


app.use('/api/customers', customerRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/email/templates', emailTemplateRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/receivers', receiverRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
//app.use('/api/payment/method', paymentMethodRoutes);

app.use('/api/senders', senderRoutes);
//app.use('/api/sms/templates', smsTemplateRoutes);
app.use('/api/tasks', taskRoutes);
//app.use('/api/workflows', workflowRoutes);
//app.use('/api/cart', cartRoutes);
//app.use('/api/subscriptions', subscriptionRoutes);
//app.use('/api/payments', paymentRoutes);
//app.use('/api/plans', subscriptionPlanRoutes);

// Start the cron job for receiver emails
//receiverEvent.scheduleReceiverEmails();
// Start the cron job to update exchange rates


// Start the server
const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
