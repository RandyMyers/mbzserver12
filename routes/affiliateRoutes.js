const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { isAffiliate, hasAffiliatePermission } = require('../middleware/affiliateAuth');
const affiliateController = require('../controllers/affiliateController');
const referralController = require('../controllers/referralController');
const commissionController = require('../controllers/commissionController');
const payoutController = require('../controllers/payoutController');
const marketingMaterialController = require('../controllers/marketingMaterialController');

// Affiliate Management Routes
router.use(protect); // All affiliate routes require authentication

// Admin only routes
router.use(restrictTo('admin')); // Restrict all affiliate management routes to admin only

// Affiliate CRUD routes
router.route('/')
  .get(affiliateController.getAllAffiliates)
  .post(affiliateController.createAffiliate);

router.route('/:id')
  .get(affiliateController.getAffiliate)
  .patch(affiliateController.updateAffiliate)
  .delete(affiliateController.deleteAffiliate);

// Affiliate status management
router.patch('/:id/status', affiliateController.updateAffiliateStatus);
router.patch('/:id/commission-rate', affiliateController.updateCommissionRate);

// Referral routes
router.route('/:affiliateId/referrals')
  .get(referralController.getAffiliateReferrals)
  .post(referralController.createReferral);

router.route('/:affiliateId/referrals/:id')
  .get(referralController.getReferral)
  .patch(referralController.updateReferral);

// Commission routes
router.route('/:affiliateId/commissions')
  .get(commissionController.getAffiliateCommissions)
  .post(commissionController.createCommission);

router.route('/:affiliateId/commissions/:id')
  .get(commissionController.getCommission)
  .patch(commissionController.updateCommission);

// Payout routes
router.route('/:affiliateId/payouts')
  .get(payoutController.getAffiliatePayouts)
  .post(payoutController.createPayout);

router.route('/:affiliateId/payouts/:id')
  .get(payoutController.getPayout)
  .patch(payoutController.updatePayout);

// Marketing Material routes
router.route('/:affiliateId/materials')
  .get(marketingMaterialController.getAffiliateMaterials)
  .post(marketingMaterialController.createMaterial);

router.route('/:affiliateId/materials/:id')
  .get(marketingMaterialController.getMaterial)
  .patch(marketingMaterialController.updateMaterial)
  .delete(marketingMaterialController.deleteMaterial);

// Affiliate Dashboard Routes (for affiliates themselves)
router.use('/dashboard', isAffiliate); // Require affiliate authentication

router.get('/dashboard/overview', affiliateController.getDashboardOverview);
router.get('/dashboard/referrals', referralController.getMyReferrals);
router.get('/dashboard/commissions', commissionController.getMyCommissions);
router.get('/dashboard/payouts', payoutController.getMyPayouts);
router.get('/dashboard/materials', marketingMaterialController.getMyMaterials);

// Affiliate Profile Routes
router.get('/profile', isAffiliate, affiliateController.getMyProfile);
router.patch('/profile', isAffiliate, affiliateController.updateMyProfile);

// Affiliate Settings Routes
router.get('/settings', isAffiliate, affiliateController.getMySettings);
router.patch('/settings', isAffiliate, affiliateController.updateMySettings);

// Affiliate Payout Settings
router.get('/payout-settings', isAffiliate, affiliateController.getPayoutSettings);
router.patch('/payout-settings', isAffiliate, affiliateController.updatePayoutSettings);

// Affiliate Marketing Material Management
router.post('/materials', isAffiliate, marketingMaterialController.createMyMaterial);
router.patch('/materials/:id', isAffiliate, marketingMaterialController.updateMyMaterial);
router.delete('/materials/:id', isAffiliate, marketingMaterialController.deleteMyMaterial);

// Affiliate Performance Routes
router.get('/performance', isAffiliate, affiliateController.getMyPerformance);
router.get('/performance/referrals', isAffiliate, referralController.getMyReferralStats);
router.get('/performance/commissions', isAffiliate, commissionController.getMyCommissionStats);

// Affiliate Reports Routes
router.get('/reports', isAffiliate, affiliateController.getMyReports);
router.get('/reports/referrals', isAffiliate, referralController.getMyReferralReport);
router.get('/reports/commissions', isAffiliate, commissionController.getMyCommissionReport);
router.get('/reports/payouts', isAffiliate, payoutController.getMyPayoutReport);

module.exports = router; 