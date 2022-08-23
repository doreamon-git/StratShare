const express =require('express');
const router = express.Router();
const User = require('../models/user')
const passport = require('passport')
const flash = require('connect-flash')

router.get('/register', (req, res)=>(
    res.render('users/register')
))

router.post('/register', async (req, res)=>{
   const {email, username, password} = req.body
   const user = new User({email, username})
   try{
       await User.register(user, password)
   }catch(e){
    res.render('users/register')
   }
   req.flash('success', 'Welcome to StratShare')
   res.redirect('/reviews')
})

router.get('/login', (req, res)=>(
    res.render('users/login')
))

router.post('/login', passport.authenticate('local', {failureFlash: true, failureRedirect: '/login'}), (req, res)=>{
req.flash('success', 'welcome back')
res.redirect('/reviews')
})

router.get('/logout', (req, res)=>{
    req.logout()
    res.redirect('/reviews')
})


module.exports = router