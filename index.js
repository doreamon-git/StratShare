if(process.env.NODE_ENV !== "productin"){
    require('dotenv').config();
}

const express =require('express')
const app = express();
const mongoose = require('mongoose');
const methodOverride = require('method-override')
const session = require('express-session')
const ejsMate = require('ejs-mate')
const flash = require('connect-flash')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const User = require('./models/user')
const userRoutes = require('./routes/user')
const {isLoggedIn} = require('./routes/middleware')
const dbUrl = process.env.DB_URL ;
const MongoDBStore = require("connect-mongo");

//mongodb://localhost:27017/blogDB
mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  //useCreateIndex: true,
  //useUndefinedTopology: true
  //useFindAndModify: false    
});

const db=mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", ()=>{
    console.log("Database Connected");
});



const Review = require('./models/review');
const res = require('express/lib/response');

//app.set('views', path.join(__dirname, '\views'))
app.set('view engine', 'ejs')
app.use(express.urlencoded({extended:true}))
app.use(methodOverride('_method'))

const store = new MongoDBStore({
    mongoUrl: dbUrl,
    secret: 'NothingSerious',
    touchAfter: 24*60*60
});

store.on("error", function(e){
    console.log("SESSION STORE ERROR", e)
})

const sessionConfig={
    store,
    name: 'session',
    secret: 'NothingSerious',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now()+ 1000*60*60*24*7,
        maxAge: 1000*60*60*24*7
    }

}
app.use(session(sessionConfig))

app.use(flash())
app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use((req, res, next)=>{
    res.locals.currentUser = req.user
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    next();
})

// Routing starts from here

app.use('/', userRoutes)


app.use(express.static('public1'))
app.use(express.static('public'))

app.get('/reviews', async (req, res)=>{
const reviews = await Review.find({draft:false})
res.render('reviews/index', {reviews})
})


app.get('/reviews/new', isLoggedIn , (req, res)=>{
    res.render('reviews/new')
})

app.get('/reviews/draft', isLoggedIn ,async (req, res)=>{
    const reviews = await Review.find({draft:true, author: req.user.username})
    res.render('reviews/draft', {reviews})
 })
 

app.get('/reviews/:id', async (req, res)=>{
   const { id } = req.params
   const review = await Review.findById(id)
   res.render('reviews/show', { review })  
})

app.post('/reviews',isLoggedIn ,async (req, res)=>{
   
   const review = new Review(req.body)
   review.author = req.user.username
   review.draft = false
   await review.save()
   res.redirect('/reviews')
})

app.get('/reviews/:id/edit', async (req, res)=>{
    const { id } = req.params
    const review = await Review.findById(id)
    res.render('reviews/edit', {review}) 
})

app.put('/reviews/:id',isLoggedIn, async (req, res)=>{
    const { id } = req.params
    const review = await Review.findById(id)
    req.body.draft = false
    if(review.author!=req.user._id){
       req.flash('error', 'You do not have permission');
       return res.redirect(`/reviews/${id}`)
    }
    await Review.findByIdAndUpdate(id, req.body, {runValidators: true, new: true})
    req.flash('success', 'Updated');
    res.redirect('/reviews')
})


app.delete('/reviews/:id', async (req, res)=>{
    const { id } = req.params
    const review = await Review.findById(id)
    if(review.author!=req.user._id){
        req.flash('error', 'You do not have permission');
        return res.redirect(`/reviews/${id}`)
     }
    await Review.findByIdAndDelete(id)
    req.flash('success', 'Deleted');
    res.redirect('/reviews') 
})

app.post('/reviews/filter',async (req, res)=>{
  const {username} = req.body
  const reviews = await Review.find({author: username})
  res.render('reviews/index', {reviews})       
})

app.post('/reviews/draft',isLoggedIn, async (req, res)=>{
    const review = new Review(req.body)
    review.author = req.user.username
    review.draft = true
    await review.save()
    res.redirect('/reviews/draft')
 })

 app.put('/reviews/draft/:id', isLoggedIn, async (req, res)=>{
    const { id } = req.params
    const review = await Review.findById(id)
    req.body.draft = true
    if(review.author!=req.user._id){
        req.flash('error', 'You do not have permission');
        return res.redirect(`/reviews/${id}`)
     }
    await Review.findByIdAndUpdate(id, req.body, {runValidators: true, new: true})
    req.flash('success', 'Updated');
    res.redirect('/reviews')
})

const port = process.env.PORT || 3000
app.listen(port, ()=> {
    console.log(`Listening on port ${port}`)
})




