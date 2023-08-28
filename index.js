const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3500;
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser")
const session = require("express-session")
const bodyParser = require("body-parser")
const multer = require('multer');

const upload =multer()
const saltRounds = 10;
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Erick4472#",
  database: "question_deck"
});
app.use(cookieParser())
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended:true}))
app.use(cors({
    origin: ['http://localhost:3000', "https://question-deck.onrender.com"],
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    credentials: true
  }));
  app.use(session({
    key:"userId",
    secret:"I'll change this secret key",
    resave:false,
    saveUninitialized:false,
    cookie:{
       expires:60*60*60*60*24
    }
  }))
app.use(express.json());
app.use(express.urlencoded({extended:false}))
app.post("/signUp", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const username = req.body.userName;
  const time = req.body.time;
  
  db.query(`SELECT * FROM users WHERE username = ? OR email = ?`, [username, email], (err, rows) => {
     if(err){
      res.status(500).send({error:err})
     }else{
      if(rows.length>0){
        const existingEntry = rows.find(existingEntry=>existingEntry.username=== username || existingEntry.email===email)
        if(existingEntry.username=== username){
          console.log("User exists");
          res.status(400).send({error:"Username exists. Please choose another"})
        }else if(existingEntry.email===email){
          console.log("Email exists");
          res.status(400).send({error:"Email exist. Please Log in to your account"})
        }
      }else{
        bcrypt.hash(password, saltRounds, (err, hash)=>{
          if(err){
            res.status(500).send({error:err})
          }else{
            db.query(`INSERT INTO users(username, email, password, created_at) VALUES (?,?,?,?)`,[username, email, hash, time], (err, response)=>{
              if(err){
                res.status(400).send({error:err})
              }
              else{
             
                res.status(200).send({...response, msg:"You have successfully logged in to you account"})
              }
            })
          }
        })
      }
     
     }
  });
});
app.get('/login', (req,res)=>{
  if(req.session.user){
    res.send({LoggedIn:true, user:req.session.user})
  }else{
    res.send({LoggedIn:false})
  }
})

app.post('/login', (req, res)=>{
const email = req.body.email
const password = req.body.password
db.query(`SELECT * FROM users WHERE email = ?`, [email], (err, response)=>{
  if(err){
    res.status(500).send({error:err})
  }
  else if(response.length>0){
    bcrypt.compare(password, response[0].password, (error, result)=>{
      if(result){
        req.session.user =response
        console.log(req.session.user);
        res.status(200).send({...response, msg:"user Logged in successfully"})  
      }
      else{
        res.status(400).send({message:"password incorrect"})
      }
    })
  }else{
    res.status(400).send({message:"user doesn't exist"})
  }
})

})
app.post('/postQuestion', (req, res)=>{
  const question = req.body.question
  const category = req.body.category
  const idusers = req.body. userId

  db.query(`INSERT INTO questions (questions, idusers, category) VALUES(?,?,?)`, [question,idusers, category], (err, response)=>{
    if(err){
      res.status(500).send({error:err})
      res.redirect('/home')
    }
    else{
    res.status(200).send({...response, msg:"Question Posted successfully"})
    }
  })
})
app.get(`/getQuestions`, (req, res) => {
  db.query(`SELECT * FROM question_deck.questions`, (err, response) => {
    if (err) {
      res.status(500).send({ error: err });
    } else {
      res.status(200).send({ questions: response, msg: "Successfully fetched questions." });
    }
  });
});
app.get('/specificQuesiton', (req, res)=>{

  const id = req.query.questionId
  console.log(id);
  db.query(`SELECT questions FROM questions WHERE idquestions = ?`, [id], (err, response)=>{
    if(err){
      res.status(500).send({error:err})
    }else{
      res.status(200).send({...response, msg:"success in answering the question"})
    }
  })
})
app.post('/publishAnswer', (req, res)=>{
  const answer = req.body.answer
  const questionId = req.body.questionId
  const userId = req.body.userId
  db.query(`INSERT INTO answers (answer, idquestions, userId, upvote, downvote) VALUES (?,?,?,?,?)`, [answer, questionId, userId, 0, 0], (err, response)=>{
    if(err){
      res.status(500).send({error:err})
      console.log(err);
    }else{
      res.status(200).send({...response, msg:"Successfull post of answer"})
    }
  })
})
app.get('/getAnswers', (req, res) => {

  const questionId = req.query.questionId;

  db.query(`SELECT DISTINCT answer, idanswers, username, userId, upvote, downvote FROM question_deck.questions, question_deck.answers, question_deck.users WHERE questions.idquestions = answers.idquestions  AND users.idusers = answers.userId AND questions.idquestions = ? ORDER BY idanswers`, [questionId], (err, response) => {
    if (err) {
      res.status(500).send({ error: err });
    } else {
      res.status(200).json(response);
    }
  });
});
app.get('/getQuestionsProfile', (req,res)=>{
  const id = req.query.userId

  db.query(`SELECT DISTINCT questions FROM question_deck.questions, question_deck.users WHERE questions.idusers = users.idusers AND users.idusers = ? `, [id], (err, response)=>{
    if(err){
      res.status(500).send({ error: err });
    }else{
      res.status(200).json(response)
    }
  } )
})
 
app.post('/updateUser', (req, res) => {
  const username = req.body.username;
  const age = req.body.age;
  const location = req.body.location;
  const userId = req.body.userId;
  const findMeOn = req.body.findMeOn;
  const whatI_Do = req.body.whatI_Do;
  const aboutMe = req.body.aboutMe;



  db.query(
    `UPDATE users SET username = ?, age = ?, location = ?, profession = ?, AboutMe = ?, findMeOn = ?  WHERE idusers = ?`,
    [username, age, location, whatI_Do, aboutMe, findMeOn,  userId],
    (err, response) => {
      if (err) {
        res.status(500).send({ error: err });
      } else {
        res.status(200).send({...response, msg:"successfull update of profile"});
      
      }
    }
  );
});

app.get('/imgUpload', (req, res)=>{

  res.render('imgUpload.ejs')
})
app.post('/uploadImage', upload.single('image'),(req,res)=>{
 const image = req.file
 const userId = req.body.userId
 console.log(image);
 console.log(userId);

 if(req.file){
  const imageBuffer = req.file.buffer
   console.log(imageBuffer);
   db.query(`UPDATE users SET userImage = ? WHERE idusers = ? `, [imageBuffer, userId], (err,response)=>{
    if(err){
      res.status(500).send({err:err})
    }else{
      res.status(200).send({msg:'Image updated'})
    }
   })
 }
})
app.get('/getUserDetails', (req,res)=>{
  const userId = req.query.userId
 if(userId){
  console.log(userId);
  db.query(`SELECT * FROM users WHERE idusers = ?`, [userId], (err, response)=>{
    if(err){
      res.status(500).send({err:err})
    }else{
      res.status(200).send({...response, msg:"Successfull fetch of user's details"})
    }
  })
 }
 
})
app.delete('/delAns', (req, res)=>{
  const id = req.query.id
  db.query(`DELETE FROM answers WHERE idanswers = ?`, [id], (err, response)=>{
    if(err){
      res.status(500).send({error:err})
    }else{
      res.status(200).send({msg:'Deleted successfully'})
    }
  })
})
app.put('/updateAns', (req,res)=>{
  const id = req.body.id
  const edit = req.body.edit
  console.log(edit);
  db.query(`UPDATE answers SET answer = ? WHERE idanswers = ?`, [edit, id], (err, response)=>{
    if(err){
      res.status(500).send({err:err})
    }else{
      res.status(200).send({msg:"Updated successfully"})
    }
  })
})
app.put('/upvote', (req,res)=>{
  const id = req.body.id
  const upvote = req.body.upvote
  const downvote = req.body.downvote
  console.log(id, upvote, downvote);
  db.query(`UPDATE answers SET upvote = upvote + ? ,downvote = downvote + ?  WHERE idanswers = ? `, [upvote,downvote, id], (err, response)=>{
    if(err){
      res.status(500).send({err})
    }else{
      console.log('successful upvote');
      res.status(200).send({...response, msg:'successful upvote'})
    }
  })
})
app.put('/downvote', (req,res)=>{
  const id = req.body.id
  const downvote = req.body.downvote
  db.query(`UPDATE answers SET downvote = downvote + ?  WHERE idanswers = ?`, [downvote, id], (err, response)=>{
    if(err){
      res.status(500).send({err})
    }else{
     
      res.status(200).send({...response, msg:'successful upvote'})
    }
  })
})
app.post('/votes', (req, res)=>{
  const answerId = req.body.answerId
  const userId = req.body.userId
  const hasvoted = req.body.hasvoted
  const vote = req.body.vote
 
  db.query('SELECT * FROM ansvote WHERE answerId = ? AND userId = ?', [answerId, userId], (err, result)=>{
    if(err){
      res.status(500).send({err})
      
    }else{
      if(result.length>0){
        console.log('hasVoted');
       db.query('UPDATE ansvote SET vote = ? WHERE answerId =  ? AND userId = ?', [vote, answerId], (err,response)=>{
        if(err){
          res.status(500).send({err})
        }else{
          res.status(200).send({...response, msg:'successpost of vote'})
        }
       }) 
      }else{
        console.log('hasNeverVotted');
        console.log(answerId, userId, hasvoted, vote);
        db.query('INSERT INTO ansvote (answerId, userId, hasvoted, vote) VALUES(?,?,?,?)',[answerId, userId, hasvoted, vote], (err, response)=>{
          if(err){
            res.status(500).send({err})
            console.log(err);
          }else{
            res.status(200).send({...response, msg:'successpost of vote'})
          }
        })
      }
    }
  })
})
app.get('/getVote', (req, res)=>{
  const answerId = req.query.answerId
  const userId =req.query.userId
  console.log(answerId, userId);
  db.query('SELECT * FROM ansvote WHERE answerId = ? AND userId = ?', [answerId, userId], (err, response)=>{
    if(err){
      res.send({err});
      console.log(err);
    }else{
      console.log(response);
      res.send({...response, msg:'successful fetch of vote type'})
    }
  })
})
app.put('/votes', (req, res)=>{
  const answerId = req.body.answerId
  const userId = req.body.userId
  const vote = req.body.vote
  db.query('UPDATE ansvote SET vote = ? WHERE answerId = ? AND userId = ?', [vote, answerId, userId], (err, response)=>{
    if(err){
      res.send({err})
    }else{
      res.send({response})
    }
  }) 
})
app.delete('/delQuestion', (req, res)=>{
  const id = req.query.questionId
  console.log(id);
  db.query('DELETE  FROM answers WHERE idquestions = ?', [id], (err, response)=>{
    if(err){
      res.status(500).send({err:err})
      console.log(err);
    }else{
    db.query('DELETE FROM questions WHERE idquestions = ?', [id], (err, result)=>{
      if(err){
        console.log(err);
      }else{
        res.status(200).send({ ...result,msg:'delete successfull'})
      }
    })
    }
  })
})
app.put('/updateQuestion', (req, res)=>{
  const id = req.body.idquestions
  const question = req.body.question
 db.query('UPDATE questions SET questions = ? WHERE idquestions = ?', [question, id], (err, response)=>{
  if(err){
    res.status(500).send({err:err})
  }else{
    res.status(200).send({...response,msg:"update successfull"})
  }
 })
})
app.listen(PORT, () => {
  console.log(`Running on port: ${PORT}`)
});
