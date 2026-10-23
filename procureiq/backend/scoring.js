// Transparent rule-based Supplier Fit Score + Risk Radar (no machine learning).
const CATEGORIES = ['IT Equipment', 'Office Supplies', 'Furniture', 'Stationery'];
const DEFAULT_WEIGHTS = { price: 35, delivery: 30, quality: 25, compliance: 10 };
const REQUIRED_DOCS = ['Tax Certificate', 'Business License', 'Insurance'];
const r1 = n => Math.round(n * 10) / 10;

function validateWeights(w) {
  for (const k of Object.keys(DEFAULT_WEIGHTS))
    if (typeof w?.[k] !== 'number' || isNaN(w[k]) || w[k] < 0) return `Weight "${k}" must be a number >= 0`;
  const sum = Object.keys(DEFAULT_WEIGHTS).reduce((a, k) => a + w[k], 0);
  return Math.abs(sum - 100) > 0.01 ? `Weights must total 100% (currently ${sum})` : null;
}
const quoteFor = (s, cat) => (s.quotes.find(q => q.category === cat && q.price > 0) || {}).price ?? null;

function complianceScore(s) {
  const ok = REQUIRED_DOCS.filter(d => s.documents.some(x => x.name === d && x.status === 'valid')).length;
  return r1((ok / REQUIRED_DOCS.length) * 100);
}

// Score all suppliers for one category. Missing data is reported, not guessed.
function scoreSuppliers(suppliers, category, weights = DEFAULT_WEIGHTS) {
  const prices = suppliers.map(s => quoteFor(s, category)).filter(p => p != null);
  const lowest = prices.length ? Math.min(...prices) : null;
  const rows = suppliers.map(s => {
    const p = quoteFor(s, category);
    const comp = {
      price: p != null ? r1((lowest / p) * 100) : null,           // lowest valid quote / this quote
      delivery: s.onTimePct != null ? s.onTimePct : null,          // on-time % used directly
      quality: s.quality != null ? r1((s.quality / 5) * 100) : null, // 0-5 rating scaled to 0-100
      compliance: complianceScore(s),                               // valid required docs / required docs
    };
    const keys = Object.keys(comp).filter(k => comp[k] !== null);
    const missing = Object.keys(comp).filter(k => comp[k] === null);
    const used = keys.reduce((a, k) => a + weights[k], 0);
    // If data is missing, remaining weights are re-scaled so the gap isn't scored as zero.
    const total = used > 0 ? r1(keys.reduce((a, k) => a + comp[k] * weights[k], 0) / used) : null;
    const explain = [
      comp.price != null ? `Price ${comp.price}: quote ${p} vs lowest valid quote ${lowest}.` : 'Price: no valid quotation for this category (not scored).',
      comp.delivery != null ? `Delivery ${comp.delivery}: ${s.onTimePct}% on-time.` : 'Delivery: no performance data (not scored).',
      comp.quality != null ? `Quality ${comp.quality}: rating ${s.quality}/5.` : 'Quality: no rating (not scored).',
      `Compliance ${comp.compliance}: valid required documents.`,
    ];
    return { supplierId: s._id, name: s.name, status: s.status, quote: p, components: comp, missing,
      total, incomplete: missing.length > 0, explain, risk: riskRadar(s) };
  });
  rows.sort((a, b) => (b.total ?? -1) - (a.total ?? -1));
  rows.forEach((r, i) => (r.rank = i + 1));
  return { category, lowestQuote: lowest, weights, rows };
}

// Calculated indicators only: these are warnings, NOT confirmed violations.
function riskRadar(s) {
  const flags = [];
  if (s.onTimePct != null && s.onTimePct < 80) flags.push('Low delivery reliability (on-time below 80%)');
  if (s.quality != null && s.quality < 3) flags.push('Poor quality rating (below 3/5)');
  REQUIRED_DOCS.forEach(d => {
    const doc = s.documents.find(x => x.name === d);
    if (!doc || doc.status === 'missing') flags.push(`Missing document: ${d}`);
    else if (doc.status === 'expired') flags.push(`Expired document: ${d}`);
  });
  if (s.delayedDeliveries >= 3) flags.push(`Repeated delays (${s.delayedDeliveries} delayed deliveries)`);
  if (['inactive', 'suspended'].includes(s.status)) flags.push(`Supplier status is ${s.status}`);
  const level = s.status === 'suspended' || flags.length >= 3 ? 'high' : flags.length >= 1 ? 'medium' : 'low';
  return { level, flags, note: 'Calculated indicator from recorded data. It is not a confirmed violation.' };
}
module.exports = { CATEGORIES, DEFAULT_WEIGHTS, validateWeights, scoreSuppliers, riskRadar };
