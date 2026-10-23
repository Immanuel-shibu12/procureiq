const router = require('express').Router();
const { Supplier } = require('../models'); const { wrap, auth } = require('../middleware/auth');
const { CATEGORIES, DEFAULT_WEIGHTS, validateWeights, scoreSuppliers } = require('../scoring');
router.use(auth);
router.get('/meta', (req, res) => res.json({ categories: CATEGORIES, defaultWeights: DEFAULT_WEIGHTS }));
// Score + rank suppliers. Optional custom weights power the What-if comparison.
router.post('/score', wrap(async (req, res) => {
  const { category, weights = DEFAULT_WEIGHTS } = req.body;
  if (!CATEGORIES.includes(category)) return res.status(400).json({ message: 'Valid category required' });
  const err = validateWeights(weights); if (err) return res.status(400).json({ message: err });
  const suppliers = await Supplier.find({ categories: category });
  res.json({ ...scoreSuppliers(suppliers, category, weights), baseline: scoreSuppliers(suppliers, category, DEFAULT_WEIGHTS).rows.map(r => ({ supplierId: r.supplierId, rank: r.rank, total: r.total })) });
}));
module.exports = router;
