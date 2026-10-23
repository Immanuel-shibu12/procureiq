const router = require('express').Router();
const { Request, Supplier } = require('../models'); const { wrap, auth, allow } = require('../middleware/auth');
router.use(auth);
const log = (r, u, status, note) => r.history.push({ status, by: u._id, byName: u.name, note });
const fields = b => ({ itemName: b.itemName, category: b.category, quantity: Number(b.quantity), unitPrice: Number(b.unitPrice), requiredDate: b.requiredDate, justification: b.justification });
async function load(req, res) {
  const r = await Request.findById(req.params.id).populate('requester', 'name').populate('order.supplier', 'name');
  if (!r) { res.status(404).json({ message: 'Request not found' }); return null; }
  if (req.user.role === 'requester' && String(r.requester?._id || r.requester) !== String(req.user._id)) { res.status(403).json({ message: 'Not your request' }); return null; }
  return r;
}
const need = (r, res, ...s) => s.includes(r.status) ? true : (res.status(409).json({ message: `Request is "${r.status}"; allowed only when: ${s.join(', ')}` }), false);

router.get('/', wrap(async (req, res) => {
  const f = req.user.role === 'requester' ? { requester: req.user._id } : {};
  if (req.query.status) f.status = req.query.status;
  res.json(await Request.find(f).populate('requester', 'name').sort('-createdAt'));
}));
router.get('/:id', wrap(async (req, res) => { const r = await load(req, res); if (r) res.json(r); }));
router.post('/', allow('requester', 'admin', 'officer', 'approver'), wrap(async (req, res) => {
  const r = new Request({ ...fields(req.body), requester: req.user._id }); log(r, req.user, 'draft', 'Created'); await r.save(); res.status(201).json(r);
}));
router.put('/:id', wrap(async (req, res) => { // owner edits drafts only
  const r = await load(req, res); if (!r || !need(r, res, 'draft')) return;
  if (String(r.requester?._id || r.requester) !== String(req.user._id)) return res.status(403).json({ message: 'Only the owner can edit' });
  Object.assign(r, fields(req.body)); log(r, req.user, 'draft', 'Edited'); await r.save(); res.json(r);
}));
router.post('/:id/submit', wrap(async (req, res) => {
  const r = await load(req, res); if (!r || !need(r, res, 'draft')) return;
  if (String(r.requester?._id || r.requester) !== String(req.user._id)) return res.status(403).json({ message: 'Only the owner can submit' });
  r.status = 'submitted'; log(r, req.user, 'submitted', 'Submitted for approval'); await r.save(); res.json(r);
}));
router.post('/:id/review', allow('officer'), wrap(async (req, res) => {
  const r = await load(req, res); if (!r || !need(r, res, 'submitted')) return;
  r.status = 'under_review'; log(r, req.user, 'under_review', req.body.note || 'Review started'); await r.save(); res.json(r);
}));
router.post('/:id/decision', allow('approver'), wrap(async (req, res) => {
  const r = await load(req, res); if (!r || !need(r, res, 'under_review')) return;
  if (String(r.requester?._id || r.requester) === String(req.user._id) && process.env.ALLOW_SELF_APPROVAL !== 'true')
    return res.status(403).json({ message: 'You cannot approve or reject your own request' });
  const { decision, reason } = req.body;
  if (!['approved', 'rejected'].includes(decision)) return res.status(400).json({ message: 'Decision must be approved or rejected' });
  if (decision === 'rejected' && !(reason || '').trim()) return res.status(400).json({ message: 'A reason is required for rejection' });
  r.status = decision; if (decision === 'rejected') r.rejectionReason = reason;
  log(r, req.user, decision, reason || 'Approved'); await r.save(); res.json(r);
}));
router.post('/:id/order', allow('officer'), wrap(async (req, res) => {
  const r = await load(req, res); if (!r || !need(r, res, 'approved')) return;
  const s = await Supplier.findById(req.body.supplierId);
  if (!s || s.status !== 'active') return res.status(400).json({ message: 'Choose an active supplier' });
  const q = s.quotes.find(x => x.category === r.category && x.price > 0);
  r.order = { supplier: s._id, poNumber: 'PO-' + Date.now(), value: +(r.quantity * (q ? q.price : r.unitPrice)).toFixed(2), orderedAt: new Date() };
  r.status = 'ordered'; log(r, req.user, 'ordered', `PO ${r.order.poNumber} to ${s.name}`); await r.save(); res.json(r);
}));
router.post('/:id/deliver', allow('officer'), wrap(async (req, res) => {
  const r = await load(req, res); if (!r || !need(r, res, 'ordered')) return;
  const isPartial = req.body.partial === true;
  r.order.deliveredAt = new Date();
  if (isPartial) {
    r.status = 'ordered';
    log(r, req.user, 'partial_delivery', req.body.note || 'Partial shipment received');
  } else {
    r.status = 'delivered';
    log(r, req.user, 'delivered', req.body.note || 'Goods received and verified');
  }
  await r.save();
  res.json(r);
}));

module.exports = router;
