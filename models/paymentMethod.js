const mongoose = require('mongoose');


const paymentMethodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  methodType: {
    type: String,
    enum: ['Bank Transfer', 'Crypto'],
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
});

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

module.exports = PaymentMethod;
