const router = require('express').Router();
const { Supplier } = require('../models'); const { wrap, auth, allow } = require('../middleware/auth');
const { riskRadar } = require('../scoring');
router.use(auth);
const withRisk = s => ({ ...s.toObject(), risk: riskRadar(s) });

router.get('/', wrap(async (req, res) => { // search, filter, sort
  const { q, status, category, sort = 'name' } = req.query, f = {};
  if (q) f.name = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (status) f.status = status; if (category) f.categories = category;
  const list = await Supplier.find(f).sort(sort === 'quality' ? '-quality' : sort === 'ontime' ? '-onTimePct' : 'name');
  res.json(list.map(withRisk));
}));
router.get('/:id', wrap(async (req, res) => {
  const s = await Supplier.findById(req.params.id); if (!s) return res.status(404).json({ message: 'Not found' });
  res.json(withRisk(s));
}));
router.post('/', allow('admin', 'officer'), wrap(async (req, res) => res.status(201).json(await Supplier.create(req.body))));
router.put('/:id', allow('admin', 'officer'), wrap(async (req, res) =>
  res.json(await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }))));
router.delete('/:id', allow('admin'), wrap(async (req, res) => { await Supplier.findByIdAndDelete(req.params.id); res.json({ ok: true }); }));
module.exports = router;
