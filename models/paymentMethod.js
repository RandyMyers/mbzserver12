const mongoose = require('mongoose');


const paymentMethodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  methodType: {
    type: String,
    enum: ['Bank Transfer', 'Crypto', 'Card'],
    required: true,
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'BTC', 'USDT'], // Define supported currencies
    required: true,
  },
  // Bank accounts
  bankAccountsUSD: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccountUSD',
  },
  bankAccountsEUR: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccountEUR',
    
  },
  bankAccountsGBP: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccountGBP',
    
  },
  // Crypto wallets
  cryptoWalletsBTC: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CryptoWalletBTC',
  },
  
  cryptoWalletsUSDT: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CryptoWalletUSDT',
    
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Card payment gateway type (for card payments)
  cardGateway: {
    type: String,
    enum: ['flutterwave', 'paystack'],
  },
  // Optionally, reference to a saved card (for future use)
  cardReference: {
    type: String,
  },
});

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

module.exports = PaymentMethod;
