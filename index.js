const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


app.use(cors({
    origin: [
        'http://localhost:5173'
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ogz7mxs.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

//middlewares
const logger = (req, res ,next) =>{
    console.log(req.method, req.url);
    next();
}

const verifyToken = (req, res, next) =>{
    const token = req.cookies?.token;
    if(!token){
        return res.status(401).send({message: 'unauthorized access'});
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
            return res.status(401).send({message: 'unatuhorized access'})
        }
        req.user = decoded;
        next();
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        //await client.connect();

        const foodCollection = client.db('foodDB').collection('foods');
        const userCollection = client.db('foodDB').collection('users');
        const cartCollection = client.db('foodDB').collection('carts');

        app.get('/foods', async (req, res) => {
            const cursor = foodCollection.find().sort({ count: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        });
        app.get('/all-foods', async (req, res) => {
            const cursor = foodCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });
        app.get('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await foodCollection.findOne(query);
            res.send(result);
        });

        app.get('/users', async (req, res) => {
            const cursor = userCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/carts', logger, verifyToken, async (req, res) => {
            const cursor = cartCollection.find(); 
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/foods/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await foodCollection.findOne(query);
            res.send(result);
          })

        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        })

        app.post('/users', async (req, res) => {
            const newUser = req.body;
            console.log(newUser);
            const result = await userCollection.insertOne(newUser);
            res.send(result);
        })
        app.post('/carts', async (req, res) => {
            const newCart = req.body;
            console.log(newCart);
            const result = await cartCollection.insertOne(newCart);
            res.send(result);
        })
        app.post('/foods', async (req, res) => {
            const newFood = req.body;
            console.log(newFood);
            const result = await foodCollection.insertOne(newFood);
            res.send(result);
        })
        app.post('/jwt', verifyToken, async (req, res) =>{
            const user = req.body;
            console.log("user: ", user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '2h'} )
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
            .send({success: true});
        })
        app.post('/logout', async(req, res) =>{
            const user = req.body;
            console.log('Logging out..', user);
            res.clearCookie('token', {maxAge: 0}).send({success: true})
        })

        app.put('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedFood = req.body;
            const food = {
                $set: {
                    food_name: updatedFood.food_name,
                    food_image: updatedFood.food_image,
                    food_category: updatedFood.food_category,
                    quantity: updatedFood.quantity,
                    price: updatedFood.price,
                    add_by: updatedFood.add_by,
                    food_origin: updatedFood.food_origin,
                    description: updatedFood.description,
                    count: updatedFood.count,
                }
            }

            const result = await foodCollection.updateOne(filter, food, options);
            res.send(result);

        })

        // Send a ping to confirm a successful connection
        //await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('flavor fusion is running')
})

app.listen(port, () => {
    console.log(`Fusion flavor is running on port ${port}`)
})