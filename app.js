const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose');
const Usuario = require('./models/usuarios'); 
const { generateHashedPassword, comparePassword } = require('./shared/functions');
const Rating = require('./models/ratings')

const uri = "mongodb+srv://sergiogarlo12:FilmRate2025@filmrate.wnqbttl.mongodb.net/?retryWrites=true&w=majority&appName=filmRate";
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

const app = express()
const port = 4080

app.use(cors()); // Permite a todo el mundo. También puedes configurar.
app.use(express.json()); // Para poder recibir JSON en el body de las peticiones

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

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await mongoose.connection.db.collection('usuarios').findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordMatch = await comparePassword(password, user.password);
        
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Respuesta exitosa
        res.status(200).json({ 
            message: 'Login successful', 
            userId: user._id,
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/register', async (req, res) => {
    const { datosUsuario } = req.body;

    try {
        const myPassword = await generateHashedPassword(datosUsuario.password);
        const newUser = new Usuario({
            nombre: datosUsuario.nombre,
            apellidos: datosUsuario.apellidos,
            username: datosUsuario.username,
            email: datosUsuario.email,
            password: myPassword,
            fecha_nacimiento: datosUsuario.fecha_nacimiento,
            imagen: datosUsuario.imagen,
        });

        console.log('Password en el modelo:', newUser.password);

        await newUser.save();
        
        // Send a success response
        res.status(201).json({ 
            message: 'Usuario registrado correctamente',
            userId: newUser._id,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'El email ya está registrado' });
        }
        console.error('Error during register:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/addRating',  async (req, res) => {
    const { datosRating } = req.body;

    console.log(datosRating)

    try {
        const newRating = new Rating({
            user_id: datosRating.user_id,
            movie_id: datosRating.movie_id,
            critic: datosRating.critic,
            rating: datosRating.rating
        });

        await newRating.save();
        
        // Send a success response
        res.status(201).json({ 
            message: 'Rating Creado',
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }

})