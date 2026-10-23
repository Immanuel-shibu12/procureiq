const router = require('express').Router();
const { Request, Supplier } = require('../models'); const { wrap, auth } = require('../middleware/auth');
const { scoreSuppliers, riskRadar, CATEGORIES } = require('../scoring');
router.use(auth);
// Every figure is computed from MongoDB at request time.
router.get('/', wrap(async (req, res) => {
  const f = req.query.category ? { category: req.query.category } : {};
  if (req.user.role === 'requester') f.requester = req.user._id;
  const reqs = await Request.find(f).populate('order.supplier', 'name').populate('requester', 'name').sort('-updatedAt');
  const count = s => reqs.filter(r => r.status === s).length;
  const monthly = {};
  reqs.filter(r => r.order?.orderedAt).forEach(r => {
    const k = r.order.orderedAt.toISOString().slice(0, 7);
    monthly[k] = (monthly[k] || 0) + (r.order.value || 0);
  });

  // Spend Intelligence: Grouped by Category
  const spendByCategory = {};
  CATEGORIES.forEach(c => { spendByCategory[c] = 0; });
  reqs.filter(r => ['ordered', 'delivered'].includes(r.status)).forEach(r => {
    const val = r.order?.value || r.totalCost || 0;
    spendByCategory[r.category] = (spendByCategory[r.category] || 0) + val;
  });

  // Spend Intelligence: Grouped by Supplier
  const spendBySupplier = {};
  reqs.filter(r => ['ordered', 'delivered'].includes(r.status) && r.order?.supplier).forEach(r => {
    const sName = r.order.supplier.name || 'Unassigned';
    spendBySupplier[sName] = (spendBySupplier[sName] || 0) + (r.order.value || 0);
  });

  // Spend Intelligence: Budget Indicators & Category Allocations
  const categoryBudgets = {
    'IT Equipment': 1000000,
    'Office Supplies': 250000,
    'Furniture': 300000,
    'Stationery': 100000
  };
  const budgetIndicators = Object.keys(categoryBudgets).map(catName => {
    const allocated = categoryBudgets[catName] || 500000;
    const spent = spendByCategory[catName] || 0;
    const pct = Math.min(100, Math.round((spent / allocated) * 100));
    return { category: catName, allocated, spent, pct, remaining: Math.max(0, allocated - spent) };
  });

  // Spend Intelligence: Realized Savings (Estimated vs PO Final Cost)
  let totalEstimated = 0;
  let totalPO = 0;
  reqs.filter(r => ['ordered', 'delivered'].includes(r.status)).forEach(r => {
    totalEstimated += (r.totalCost || 0);
    totalPO += (r.order?.value || 0);
  });
  const savings = Math.max(0, +(totalEstimated - totalPO).toFixed(2));

  // Spend Intelligence: Duplicate Detection (Identical item in same category)
  const seenItems = {};
  const duplicates = [];
  reqs.forEach(r => {
    const key = `${r.category}:${(r.itemName || '').trim().toLowerCase()}`;
    if (seenItems[key]) {
      duplicates.push({
        item: r.itemName,
        category: r.category,
        existingId: seenItems[key]._id,
        currentId: r._id,
        existingStatus: seenItems[key].status,
        currentStatus: r.status,
        requester: seenItems[key].requester?.name || 'Requester',
        createdAt: seenItems[key].createdAt
      });
    } else {
      seenItems[key] = r;
    }
  });

  const suppliers = await Supplier.find();
  const risk = { low: 0, medium: 0, high: 0 };
  suppliers.forEach(s => risk[riskRadar(s).level]++);
  const perf = suppliers.map(s => ({ name: s.name, onTime: s.onTimePct, quality: s.quality }));
  const recent = reqs.flatMap(r => r.history.map(h => ({ item: r.itemName, status: h.status, by: h.byName, note: h.note, at: h.at })))
    .sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);

  res.json({
    totals: {
      requests: reqs.length,
      pending: count('submitted') + count('under_review'),
      approved: count('approved'),
      rejected: count('rejected'),
      poValue: reqs.reduce((a, r) => a + (r.order?.value || 0), 0),
      savings
    },
    monthly: Object.keys(monthly).sort().map(k => ({ month: k, spend: monthly[k] })),
    spendByCategory: Object.entries(spendByCategory).map(([category, spend]) => ({ category, spend })),
    spendBySupplier: Object.entries(spendBySupplier).map(([supplier, spend]) => ({ supplier, spend })),
    budgetIndicators,
    duplicates,
    performance: perf,
    risk: Object.entries(risk).map(([name, value]) => ({ name, value })),
    recent,
    categories: CATEGORIES,
  });
}));

// Cloud ML & BigQuery Analytics Endpoint
router.get('/cloud-ml', wrap(async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const metricsFile = path.join(__dirname, '..', 'model_metrics.json');
  let metrics = null;
  if (fs.existsSync(metricsFile)) {
    try {
      metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
    } catch (err) {
      metrics = null;
    }
  }

  res.json({
    platform: 'Google Cloud Platform (GCP)',
    dataset: {
      name: 'hospital_procurement_clean',
      domain: 'Healthcare Supply Chain & Hospital Procurement',
      source: 'gs://mediprocureiq-raw-data/clean/hospital_procurement_clean.csv',
      bigQueryTable: 'mediprocureiq_analytics.hospital_procurement_clean',
      totalRecords: 1200,
      delayedRate: 18.4,
      defectRate: 6.3,
      clinicalCategories: [
        'ICU Equipment',
        'Pharmaceuticals',
        'Surgical Supplies',
        'PPE & Sanitization',
        'Diagnostic Devices'
      ]
    },
    models: metrics || {},
    lookerStudio: {
      title: 'MediProcureIQ: Cloud Spend & Supplier Risk Dashboard',
      platform: 'Google Looker Studio (formerly Data Studio)',
      connector: 'Google BigQuery',
      dashboardUrl: 'https://lookerstudio.google.com/reporting/mediprocureiq-hospital-risk',
      dimensions: ['hospital_department', 'item_category', 'supplier_name', 'risk_label'],
      metrics: ['total_spend_inr', 'delayed_delivery', 'defect_flag', 'composite_risk_score']
    }
  });
}));

module.exports = router;

