const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose');

const Usuario = require('./models/usuarios'); 

const uri = "mongodb+srv://sergiogarlo12:FilmRate2025@filmrate.wnqbttl.mongodb.net/?retryWrites=true&w=majority&appName=filmRate";
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

const app = express()
const port = 4080

app.use(cors()); // Permite a todo el mundo. También puedes configurar.

// Conexión a MongoDB una sola vez al iniciar el servidor
async function connectToMongo() {
    try {
        await mongoose.connect(uri, clientOptions);
        console.log("✅ Connected to MongoDB Atlas successfully.");
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB Atlas:", error);
        process.exit(1); // Mata el servidor si falla la conexión inicial
    }
}

// Iniciar el servidor después de conectar a Mongo
connectToMongo().then(() => {
    app.listen(port, () => {
      console.log(`🚀 Server is running at http://localhost:${port}`);
    });
  });

app.get('/', async (req, res) => {
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    res.send({message: "Hello World!"})
})

app.get('/user/:id', async (req, res) => {

    const userId = req.params.id;
    const user = await mongoose.connection.db.collection('usuarios').findOne({ _id: new mongoose.Types.ObjectId(userId) });
    if (user) {
        res.status(200).json(user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }

})

app.get('/login', async (req, res) => {
    const { email, password } = req.query;
    const user = await mongoose.connection.db.collection('usuarios').findOne({ email: email, password: password });
    if (user) {
        res.status(200).json(user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
})