const Review = require('./models/review')

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/blogDB')
.then(()=>{
  console.log("CONNECTION ESTABLISHED!!!");
})
.catch(err =>{ 
console.log("CONNECTION FAILED!!!");
});


const p = new Review({
 author: 'doreamon_',
 title: 'Time Manegement',
 tag: ['time', 'management'],
 content: "fuefhchadbjcjekufbhajd,cahj cad iuchaduich aduisch aidugc iadciuadsg cirgfigedfuicued"
})
p.save().then(p => {
    console.log(p)
})
.catch(e => {
    console.log(e)
})

