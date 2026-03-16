// Permite usar um ficheiro .env caso queira testar localmente antes de subir
require('dotenv').config(); 

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Configurações base
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Limite alto porque planilhas podem ser grandes

// Servir os ficheiros estáticos (O seu site HTML/CSS/JS que ficará na pasta 'public')
app.use(express.static(path.join(__dirname, 'public')));

// 1. Conexão Segura com o MongoDB (Puxando a variável de ambiente)
// O Render vai injetar a sua URL aqui automaticamente!
const dbURI = process.env.MONGODB_URI;

if (!dbURI) {
    console.error("❌ ERRO FATAL: Variável MONGODB_URI não encontrada.");
    process.exit(1);
}

// CORREÇÃO: No Mongoose 7+, já não precisamos de useNewUrlParser e useUnifiedTopology.
// Basta passar a string de ligação.
mongoose.connect(dbURI)
  .then(() => console.log("✅ Conectado ao MongoDB Atlas com sucesso!"))
  .catch(err => console.error("❌ Erro ao conectar no MongoDB:", err));

// 2. Modelo da Base de Dados
const FechamentoSchema = new mongoose.Schema({
    nome: { type: String, required: true, unique: true },
    dataCriacao: { type: Date, default: Date.now },
    dadosPlanilha: { type: Array, required: true }
});

const Fechamento = mongoose.model('Fechamento', FechamentoSchema);

// 3. Rotas da API (O que o Frontend vai chamar)

// Criar ou Atualizar Fechamento
app.post('/api/fechamentos', async (req, res) => {
    try {
        const { nome, dadosPlanilha } = req.body;
        const resultado = await Fechamento.findOneAndUpdate(
            { nome: nome },
            { dadosPlanilha: dadosPlanilha },
            { upsert: true, new: true }
        );
        res.status(200).json({ mensagem: "Guardado com sucesso!", dados: resultado });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Listar todos os Fechamentos (apenas nomes para o menu)
app.get('/api/fechamentos', async (req, res) => {
    try {
        const fechamentos = await Fechamento.find({}, 'nome dataCriacao').sort({ dataCriacao: -1 });
        res.status(200).json(fechamentos);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Ler dados de um Fechamento específico
app.get('/api/fechamentos/:nome', async (req, res) => {
    try {
        const fechamento = await Fechamento.findOne({ nome: req.params.nome });
        if (!fechamento) return res.status(404).json({ erro: "Não encontrado" });
        res.status(200).json(fechamento);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Eliminar um Fechamento
app.delete('/api/fechamentos/:nome', async (req, res) => {
    try {
        await Fechamento.findOneAndDelete({ nome: req.params.nome });
        res.status(200).json({ mensagem: "Eliminado com sucesso" });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// 4. Encaminhamento de rotas para o Frontend (CORREÇÃO PARA EXPRESS 5+)
// Qualquer pedido que não seja para a `/api` vai carregar o seu index.html
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 5. Ligar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor a correr na porta ${PORT}`);
});