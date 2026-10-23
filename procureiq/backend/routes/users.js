const router = require('express').Router(), bcrypt = require('bcryptjs');
const { User } = require('../models'); const { wrap, auth, allow } = require('../middleware/auth');
router.use(auth, allow('admin')); // admin only
router.get('/', wrap(async (req, res) => res.json(await User.find().select('-password').sort('name'))));
router.post('/', wrap(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 8) return res.status(400).json({ message: 'Name, valid email and 8+ char password required' });
  const u = await User.create({ name, email, role, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ id: u._id });
}));
router.put('/:id', wrap(async (req, res) => {
  const u = await User.findByIdAndUpdate(req.params.id, { role: req.body.role, name: req.body.name }, { new: true, runValidators: true }).select('-password');
  res.json(u);
}));
router.delete('/:id', wrap(async (req, res) => {
  if (req.params.id === String(req.user._id)) return res.status(400).json({ message: 'You cannot delete yourself' });
  await User.findByIdAndDelete(req.params.id); res.json({ ok: true });
}));
module.exports = router;
