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

mongoose.connect('mongodb://localhost:27017/blogDB')
.then(()=>{
  console.log("CONNECTION ESTABLISHED!!!");
})
.catch(err =>{ 
console.log("CONNECTION FAILED!!!");
});
const Review = require('./models/review');
const res = require('express/lib/response');

//app.set('views', path.join(__dirname, '\views'))
app.set('view engine', 'ejs')
app.use(express.urlencoded({extended:true}))
app.use(methodOverride('_method'))
const sessionConfig={
    secret: 'NothingSerious',
    resave: false,
    saveUninitialized: false
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

app.use('/', userRoutes)

// Routing starts from here


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

app.put('/reviews/:id', async (req, res)=>{
    const { id } = req.params
    req.body.draft = false
    const review = await Review.findByIdAndUpdate(id, req.body, {runValidators: true, new: true})
    res.redirect('/reviews')
})


app.delete('/reviews/:id', async (req, res)=>{
    const { id } = req.params
    await Review.findByIdAndDelete(id)
    res.redirect('/reviews') 
})

app.post('/reviews/filter',async (req, res)=>{
  const {username} = req.body
  const reviews = await Review.find({author: username})
  res.render('reviews/index', {reviews})       
})

app.post('/reviews/draft', async (req, res)=>{
    const review = new Review(req.body)
    review.author = req.user.username
    review.draft = true
    await review.save()
    res.redirect('/reviews/draft')
 })

 app.put('/reviews/draft/:id', async (req, res)=>{
    const { id } = req.params
    req.body.draft = true
    const review = await Review.findByIdAndUpdate(id, req.body, {runValidators: true, new: true})
    res.redirect('/reviews')
})

app.listen(3000, ()=> {
    console.log("Listening on port 3000")
})




