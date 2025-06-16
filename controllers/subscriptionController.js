const Subscription = require('../models/subscriptions');
const Payment = require('../models/payment');
const SubscriptionPlan = require('../models/subscriptionPlans');
const logEvent = require('../helper/logEvent');

// Create a new subscription
exports.createSubscription = async (req, res) => {
  try {
    const subscription = new Subscription(req.body);
    await subscription.save();
    await logEvent({
      action: 'start_subscription',
      user: req.user._id,
      resource: 'Subscription',
      resourceId: subscription._id,
      details: { plan: subscription.plan, startDate: subscription.startDate },
      organization: req.user.organization
    });
    res.status(201).json(subscription);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all subscriptions
exports.getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find().populate('user plan payment');
    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single subscription by ID
exports.getSubscriptionById = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id).populate('user plan payment');
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
    res.json(subscription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a subscription
exports.updateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
    await logEvent({
      action: 'update_subscription',
      user: req.user._id,
      resource: 'Subscription',
      resourceId: subscription._id,
      details: { before: oldSubscription, after: subscription },
      organization: req.user.organization
    });
    res.json(subscription);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a subscription
exports.deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndDelete(req.params.id);
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
    res.json({ message: 'Subscription deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Assign a plan to a user (create or update subscription)
exports.assignSubscription = async (req, res) => {
  try {
    const { user, plan, billingInterval, currency, startDate, endDate } = req.body;
    let subscription = await Subscription.findOne({ user, plan });
    if (subscription) {
      // Update existing subscription
      subscription.billingInterval = billingInterval;
      subscription.currency = currency;
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.status = 'active';
      await subscription.save();
    } else {
      // Create new subscription
      subscription = new Subscription({ user, plan, billingInterval, currency, startDate, endDate, status: 'active' });
      await subscription.save();
    }
    res.json(subscription);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Renew a subscription
exports.renewSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findById(id);
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
    // Extend endDate by interval (assume monthly/yearly)
    let newEndDate = new Date(subscription.endDate || new Date());
    if (subscription.billingInterval === 'monthly') {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    } else if (subscription.billingInterval === 'yearly') {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    }
    subscription.endDate = newEndDate;
    subscription.status = 'active';
    await subscription.save();
    res.json(subscription);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Cancel a subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findById(id);
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
    subscription.status = 'canceled';
    subscription.isActive = false;
    subscription.canceledAt = new Date();
    await subscription.save();
    await logEvent({
      action: 'cancel_subscription',
      user: req.user._id,
      resource: 'Subscription',
      resourceId: subscription._id,
      details: { plan: subscription.plan, cancelDate: new Date() },
      organization: req.user.organization
    });
    res.json(subscription);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}; 