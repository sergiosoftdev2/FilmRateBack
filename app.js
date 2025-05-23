const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose');
const Usuario = require('./models/usuarios'); 
const { generateHashedPassword, comparePassword } = require('./shared/functions');
const Rating = require('./models/ratings');
const like = require('./models/likes');

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


// USER MOVIE RATINGS
app.post('/addRating',  async (req, res) => {
    const { datosRating } = req.body;

    console.log(datosRating)

    try {
        const newRating = new Rating({
            user_id: datosRating.user_id,
            movie_id: datosRating.movie_id,
            movie_poster: datosRating.movie_poster,
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

app.get('/user-movie', async (req, res) => {
    const { user_id, movie_id } = req.query;

    try {
        const rating = await mongoose.connection.db
            .collection('ratings')
            .findOne({ user_id, movie_id });

        if (rating) {
            res.status(200).json({rating: rating, result: true});
        } else {
            res.status(404).json({ result: false });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

app.get('/user-movies', async (req, res) => {
    const { user_id } = req.query;

    try {
        const ratings = await mongoose.connection.db
            .collection('ratings')
            .find({ user_id })
            .toArray();

        if (ratings) {
            res.status(200).json({ratings: ratings, result: true});
        } else {
            res.status(404).json({ result: false });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


// LIKES
app.post('/addLike', async (req, res) => {
    const { datosLike } = req.body;
    console.log(datosLike)
    try {
        const newLike = new like({
            user_id: datosLike.user_id,
            movie_id: datosLike.movie_id,
        });
        await newLike.save();

        res.status(201).json({ message: 'Like Creado', result: true  });
    }catch (error) {
        res.status(500).json({ message: 'Internal server error', result: false });
    }
});

app.post('/removeLike', async (req, res) =>{

    const { datosLike } = req.body;
    try {
        const result = await mongoose.connection.db
            .collection('likes')
            .deleteOne({ 
                user_id: datosLike.user_id, 
                movie_id: datosLike.movie_id 
            });

        if (result.deletedCount === 1) {
            res.status(200).json({ 
                message: 'Like removed successfully', 
                result: true 
            });
        } else {
            res.status(404).json({ 
                message: 'Like not found', 
                result: false 
            });
        }
    } catch (error) {
        console.error('Error removing like:', error);
        res.status(500).json({ 
            message: 'Internal server error', 
            result: false 
        });
    }
    
}); 

app.get('/user-liked-movie', async (req, res) => {
    const { user_id, movie_id } = req.query;

    try {
        const like = await mongoose.connection.db
            .collection('likes')
            .findOne({ user_id, movie_id });

        if (like) {
            res.status(200).json({likedMovie: true, result: true});
        } else {
            res.status(404).json({likedMovie: false, result: false });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

app.get('/user-liked-movies', async (req, res) => {
    const { user_id } = req.query;

    try {
        const likedMovies = await mongoose.connection.db
            .collection('likes')
            .find({ user_id })
            .toArray();

        if (likedMovies) {
            res.status(200).json({likedMovies: rating, result: true});
        } else {
            res.status(404).json({ result: false });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});