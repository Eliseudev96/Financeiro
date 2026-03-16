// server.js
require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// IMPORTANTE: O CORS permite que o seu site na Hostinger acesse esta API
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 1. Conexão com o MongoDB Atlas (A variável MONGODB_URI deve ser configurada no painel do Render)
const dbURI = process.env.MONGODB_URI;

if (!dbURI) {
    console.error("❌ ERRO: Variável MONGODB_URI não configurada no Render.");
    process.exit(1);
}

mongoose.connect(dbURI)
  .then(() => console.log("✅ Conectado ao MongoDB Atlas"))
  .catch(err => console.error("❌ Erro MongoDB:", err));

// 2. Modelo de Dados
const Fechamento = mongoose.model('Fechamento', new mongoose.Schema({
    nome: { type: String, required: true, unique: true },
    dataCriacao: { type: Date, default: Date.now },
    dadosPlanilha: { type: Array, required: true }
}));

// 3. Rotas da API
app.get('/', (req, res) => res.send('API Financeira L2P/Climate Online 🚀'));

app.post('/api/fechamentos', async (req, res) => {
    try {
        const { nome, dadosPlanilha } = req.body;
        const result = await Fechamento.findOneAndUpdate(
            { nome }, { dadosPlanilha }, { upsert: true, new: true }
        );
        res.json({ mensagem: "Salvo!", dados: result });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.get('/api/fechamentos', async (req, res) => {
    try {
        const docs = await Fechamento.find({}, 'nome dataCriacao').sort({ dataCriacao: -1 });
        res.json(docs);
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.get('/api/fechamentos/:nome', async (req, res) => {
    try {
        const doc = await Fechamento.findOne({ nome: req.params.nome });
        if (!doc) return res.status(404).json({ erro: "Não encontrado" });
        res.json(doc);
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.delete('/api/fechamentos/:nome', async (req, res) => {
    try {
        await Fechamento.findOneAndDelete({ nome: req.params.nome });
        res.json({ mensagem: "Excluído" });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API rodando na porta ${PORT}`));
