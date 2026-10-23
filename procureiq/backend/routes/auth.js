const router = require('express').Router(), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const { User } = require('../models'); const { wrap, auth } = require('../middleware/auth');
const sign = u => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '8h' });
const pub = u => ({ id: u._id, name: u.name, email: u.email, role: u.role });
const emailOk = e => /^\S+@\S+\.\S+$/.test(e || '');

router.post('/register', wrap(async (req, res) => { // public sign-up always creates a Requester
  const { name, email, password } = req.body;
  if (!name || !emailOk(email) || (password || '').length < 8) return res.status(400).json({ message: 'Name, valid email and 8+ character password required' });
  if (await User.findOne({ email })) return res.status(409).json({ message: 'Email already registered' });
  const u = await User.create({ name, email, password: await bcrypt.hash(password, 10), role: 'requester' });
  res.status(201).json({ token: sign(u), user: pub(u) });
}));
router.post('/login', wrap(async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password))) return res.status(401).json({ message: 'Invalid email or password' });
  res.json({ token: sign(u), user: pub(u) });
}));
router.get('/me', auth, (req, res) => res.json(pub(req.user)));
module.exports = router;
