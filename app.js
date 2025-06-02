const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose');
const Usuario = require('./models/usuarios'); 
const { generateHashedPassword, comparePassword } = require('./shared/functions');
const Rating = require('./models/ratings');
const like = require('./models/likes');
const follow = require('./models/follows');

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


// RATINGS
app.post('/addRating',  async (req, res) => {
    const { datosRating } = req.body;

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
            .sort({ fecha_creacion: -1 })
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

app.get('/user-movies', async (req, res) => {
    const { user_id } = req.query;

    try {
        const ratings = await mongoose.connection.db
            .collection('ratings')
            .find({ user_id })
            .sort({ fecha_creacion: -1 })
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

app.get('/users-movies', async (req, res) => {
    const { user_ids } = req.query;

    try {

        const userIdsArray = Array.isArray(user_ids)
            ? user_ids
            : typeof user_ids === 'string'
                ? user_ids.split(',')
                : [];

        if (userIdsArray.length === 0) {
            return res.status(400).json({ result: false, message: 'No user_ids provided' });
        }

        const ratings = await mongoose.connection.db
            .collection('ratings')
            .find({ user_id: { $in: userIdsArray } })
            .sort({ fecha_creacion: -1 })
            .toArray();

        res.status(200).json({ ratings, result: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

app.get('/last-ratings', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        // Usar find() para obtener los ratings y también para contar el total
        const ratings = await mongoose.connection.db
            .collection('ratings')
            .find()
            .sort({ fecha_creacion: -1 })
            .skip(skip) // Saltar documentos según la página
            .limit(limit) // Limitar resultados según el parámetro
            .toArray();
            

        const allRatings = await mongoose.connection.db
            .collection('ratings')
            .find()
            .toArray();
        const total = allRatings.length;

        if (ratings && ratings.length > 0) {
            res.status(200).json({
                ratings: ratings,
                result: true,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
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
    try {
        const newLike = new like({
            user_id: datosLike.user_id,
            movie_id: datosLike.movie_id,
        });
        await newLike.save();

        res.status(201).json({ message: 'Like Creado', result: true  });
    }catch (error) {
        res.status(500).json({ message: error, error: error, result: false });
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
            res.status(200).json({likedMovies: likedMovies, result: true});
        } else {
            res.status(404).json({ result: false });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// FOLLOWS
app.post('/addFollow', async (req, res) => {
    const { datosFollow } = req.body;
    try {
        const newFollow = new follow({
            following_user_id: datosFollow.following_user_id,
            follower_user_id: datosFollow.follower_user_id,
        });
        await newFollow.save();
        res.status(201).json({ message: 'Follow Creado', result: true  });
    }catch (error) {
        res.status(500).json({ message: error, error: error, result: false });
    }
})

app.post('/removeFollow', async (req, res) =>{
    const { datosFollow } = req.body;
    try {
        const result = await mongoose.connection.db
           .collection('follows')
           .deleteOne({
                following_user_id: datosFollow.following_user_id,
                follower_user_id: datosFollow.follower_user_id
            });
        if (result.deletedCount === 1) {
            res.status(200).json({ message: 'Follow removed successfully', result: true });
        } else {
            res.status(404).json({ message: 'Follow not found', result: false });
        }
    } catch (error) {
        console.error('Error removing follow:', error);
        res.status(500).json({ message: 'Internal server error', result: false });
    }
})

app.get('/user-following', async (req, res) => {
    const { user_id, following_user_id } = req.query;
    try {
        const follow = await mongoose.connection.db
           .collection('follows')
           .findOne({ follower_user_id: user_id, following_user_id: following_user_id });
        if (follow) {
            res.status(200).json({ following: true, result: true });
        }
    }catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
})

app.get('/user-followings', async (req, res) => {
    const { user_id } = req.query;
    try {
        const followings = await mongoose.connection.db
         .collection('follows')
         .find({ follower_user_id: user_id })
         .project({ following_user_id: 1 })
         .toArray();
        if (followings) {
            res.status(200).json({ followings: followings, result: true });
        }
    }catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

app.get('/user-followings-count', async (req, res) => {
    const { user_id } = req.query;
    try {
        const followings = await mongoose.connection.db
        .collection('follows')
        .find({ follower_user_id: user_id })
        .toArray();
        if (followings) {
            res.status(200).json({ followings: followings.length, result: true });
        }
    }catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
})

app.get('/user-followers', async (req, res) => {
    const { user_id } = req.query;
    try {
        const followers = await mongoose.connection.db
          .collection('follows')
          .find({ following_user_id: user_id })
          .toArray();
        if (followers) {
            res.status(200).json({ followers: followers, result: true });
        }
    }catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
})

app.get('/user-followers-count', async (req, res) => {
    const { user_id } = req.query;
    try {
        const followers = await mongoose.connection.db
         .collection('follows')
         .find({ following_user_id: user_id })
         .toArray();
        if (followers) {
            res.status(200).json({ followers: followers.length, result: true });
        }
    }catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
})