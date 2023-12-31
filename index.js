const express = require('express')
const app = express()
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
require('dotenv').config()

const port = process.env.PORT || 3000


app.use(cors({
  origin : [
    'http://localhost:5174',
    "https://bookstack-auth-7442e.web.app",
    "https://bookstack-auth-7442e.firebaseapp.com"
  ],
  credentials : true
}))
app.use(express.json())
app.use(cookieParser())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lwsgehv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// Middlewares 

const logger = (req,res,next) => {
  next()
}

const verifyToken = (req,res,next) =>{
  const token = req?.cookies?.token
 if (!token) {
      return res.status(401).send({message : "unauthorized access"})
 }
 jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded) => {
     if (err) {
        return res.status(401).send({message : "unauthorized access"})
     } 
     req.user = decoded;
     next()
 })
}




async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const categoryCollection = client.db("BooksLibrary").collection('bookCategory');
    const booksCollection = client.db("BooksLibrary").collection('booksAdded');
    const borrowedCollection = client.db("BooksLibrary").collection('borrowedBooks');
   
    // book category collection by get api method
          app.get("/book_category",async(req,res)=>{
            const result = await categoryCollection.find().toArray()
            res.send(result)
          })
   
    // book added in database using post method
       app.post('/books-add',logger,verifyToken,async(req,res)=>{
        if (!req.user.email) {
          res.status(403).send({message : "forbidden access"})
         }
           const books = req.body
           const result = await booksCollection.insertOne(books)
           res.send(result)
       })
      // all category books getting form database using get method
         app.get('/books-add',logger,verifyToken,async(req,res)=>{
          if (!req.user.email) {
            res.status(403).send({message : "forbidden access"})
         }
          const result = await booksCollection.find().toArray()
          res.send(result) 
         })

        // books updated by put api method

        app.put("/books-add/:id",async(req,res)=>{
          const id = req.params.id
          const book = req.body
          const filter = {_id : new ObjectId(id)}
          const options = { upsert: true };
          const updateDoc = {
           $set: {
             bookName :   book.bookName,
             authorName :    book.authorName,
             rating :   book.rating,
             bookImage :   book.bookImage,
             category :   book.category,
           },
         };
         const updatedBook = await booksCollection.updateOne(filter,updateDoc,options)
         res.send(updatedBook)
     })

        // specific category wise all books collect using get method
        app.get('/books/:category',async(req,res)=>{
            const category = req.params.category
            const query = {category : category}
            const result = await booksCollection.find(query).toArray()
            res.send(result)
        })

        // all information collect of book by specific id using get api

        app.get('/bookDetails/:id',async(req,res)=>{
          const id = req.params.id
          const query = {_id: new ObjectId(id)}
          const result = await booksCollection.findOne(query)
          res.send(result) 
      }) 
  
      //  specific Book for some core concept reading of this book.
        app.get('/readBook/:id',async(req,res)=>{
              const id = req.params.id
              const query = {_id: new ObjectId(id)}
              const result = await booksCollection.findOne(query)
              res.send(result)  

        })

        // borrowed books added in database using post api
        app.post('/borrowd-books',async(req,res)=>{
          const borrowedBooks = req.body
          const result = await borrowedCollection.insertOne(borrowedBooks)
          res.send(result)
        })

        // specific email based borrowed books collect 
        app.get('/borrowd-books',async(req,res)=>{ 
          let query = {} 
          if (req.query?.email) {
             query = { email : req.query.email } 
          }
          const result = await borrowedCollection.find(query).toArray()
          res.send(result)
        })

        // updated quantity decrease and increase. 
        // if user borrowed the book then decrease quantity of this book.
        // If user return the book then increase quantity of this book.

          app.patch('/books/:id',async(req,res)=>{
            const id = req.params.id
            const filter = {_id : new ObjectId(id)}
            const updateQuantity =  req.body;
         
            const updatedDoc =  {
              $set : {
                quantity : updateQuantity.quantity
              }
            }
            const result = await booksCollection.updateOne(filter,updatedDoc)
            res.send(result)
          })
        
          // deleted return book by delete api
          app.delete('/borrowd-books/:id',async(req,res)=>{
            const id = req.params.id
            const query = { _id : new ObjectId(id) };
            const result = await borrowedCollection.deleteOne(query);
            res.send(result)
          })

          // auth related api 
          app.post('/jwt',async(req,res) => {
          const user = req.body;
  
          const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET , {expiresIn : '2h'})
          
          res.cookie('token',token,{
            httpOnly : true,
            secure : true,
            sameSite : 'none'
        })
        .send({success : true})
      })

     // logout api => when user logout then token get out form cooke.
         app.post('/logout',async(req,res) => {
         const user  =  req.body;
        res.clearCookie('token',{maxAge:0})
        .send({success : true})
})

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('BookStack is running')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


