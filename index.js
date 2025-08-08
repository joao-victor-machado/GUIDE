// backend/index.js
// Expansão do backend com autenticação JWT, banco MongoDB e painel admin
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET = process.env.SECRET || 'segredo123';

app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/guiaextrema';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB conectado'))
  .catch((err) => console.error('Erro MongoDB:', err));

// Esquemas MongoDB
const UserSchema = new mongoose.Schema({
  email: String,
  senha: String,
  admin: Boolean
});
const PlaceSchema = new mongoose.Schema({
  nome: String,
  endereco: String,
  horario: String,
  nota: Number,
  categoria: String
});

const User = mongoose.model('User', UserSchema);
const Place = mongoose.model('Place', PlaceSchema);

// Middleware de autenticação
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).send('Token ausente');
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error(err);
    res.status(403).send('Token inválido');
  }
}

// Rotas públicas para teste
app.get('/', (req, res) => res.send('API Guia Extrema - OK'));

// Cadastro e login
app.post('/register', async (req, res) => {
  try {
    const { email, senha, admin } = req.body;
    const hashed = await bcrypt.hash(senha, 10);
    const user = await User.create({ email, senha: hashed, admin: !!admin });
    res.json({ id: user._id, email: user.email, admin: user.admin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao cadastrar' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).send('Usuário não encontrado');
    const match = await bcrypt.compare(senha, user.senha);
    if (!match) return res.status(403).send('Senha incorreta');
    const token = jwt.sign({ id: user._id, admin: user.admin }, SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no login');
  }
});

// CRUD de locais (somente admin cria)
app.post('/places', auth, async (req, res) => {
  try {
    if (!req.user.admin) return res.status(403).send('Acesso negado');
    const place = await Place.create(req.body);
    res.json(place);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao criar local');
  }
});

app.get('/places/:categoria', async (req, res) => {
  try {
    const { categoria } = req.params;
    const list = await Place.find({ categoria });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao buscar locais');
  }
});

// "Flow": sugestão baseada na categoria com mais locais cadastrados (exemplo simples)
app.get('/flow', auth, async (req, res) => {
  try {
    const categorias = await Place.aggregate([
      { $group: { _id: "$categoria", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 1 }
    ]);
    if (categorias.length === 0) return res.json([]);
    const sugestoes = await Place.find({ categoria: categorias[0]._id }).limit(3);
    res.json(sugestoes);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no flow');
  }
});

// Endpoint para popular dados iniciais (opcional)
app.post('/seed', async (req, res) => {
  try {
    await Place.deleteMany({});
    const dados = [
      { nome: 'Chopada Medness', endereco: 'Av. Exemplo, 123', horario: '22:00', nota: 4.8, categoria: 'Festas' },
      { nome: 'Boteco Woods', endereco: 'Rua Secundária, 45', horario: '18:00', nota: 4.5, categoria: 'Bares' },
      { nome: 'Bar do Zé', endereco: 'Praça Central, 10', horario: '17:00', nota: 4.2, categoria: 'Bares' }
    ];
    await Place.insertMany(dados);
    res.json({ ok: true, inserted: dados.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao semear dados' });
  }
});

const PORT_LISTEN = PORT;
app.listen(PORT_LISTEN, () => console.log(`Servidor rodando na porta ${PORT_LISTEN}`));
