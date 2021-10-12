const express = require('express')
const cors = require('cors')
const validator = require('email-validator')
const db = require("./db/core")
const {
  generateHash,
  verifyPassword
} = require("./hash")
const {sendOtp} = require("./otpMobile")
const { generateToken, verifyToken } = require('./jwt')

const app = express()
const port = 5000

app.use(cors())
app.use(express.json())

const authentication = (req,res,next)=>{
  
  if(!verifyToken(req.headers.autharization)){
    res.sendStatus(401);
    return;
  };
  next();
}




app.get('/api/v1/todo-list', async(req, res) => {
  const todoList =await db.selectData("todo");
  res.send(todoList);
});



app.post('/api/v1/login', async(req, res) => {
  const{userName,password} = req.body
  const User = await  db.selectData("users", {
    fields: [],
    filteringConditions: [
      ["userName", "=" , userName]
    ]
  })
  if(!User.length){
    res.send({status: false, data: "User doesnot exist"})
 return
  }
  if(!User[0].status){
    res.send({status: false, data: "Account is not activated"})
  return
}
const passwordMatch = await verifyPassword(password,User[0].password)
 if(!passwordMatch){
  res.send({status: false, data: "wrong password"})
  return
 }   
  console.log(passwordMatch)
  res.send({status: true, token: generateToken(userName)})

 })

 app.post("/api/v1/create-todo", authentication, async(req, res)=>{
  const {name}= req.body;
  db.insertData("todo",{
    name
    
  })
  
  res.send({
    status:true,
    data:"Success"
  })
})



app.post('/api/v1/signup',async(req, res) => {
  const {name, userName, email, phone, password} = req.body

  if(!name || !userName || !email || phone.length !== 10 || !Number(phone)){
    res.send({status:false, data: "Required Fields are empty"})
    return
  }

  if(!validator.validate(email)){
    res.send({status:false, data: "Invalid Email Address!"})
    return
  }
  const existingUser = await db.selectData('users', {
    filteringConditions: [
        ['userName', '=', userName],
    ]
  })

  if(existingUser.length){
    res.send({status:false, data: "User Already Exists"})
    return
  }

  const existingPhone = await db.selectData('users', {
    filteringConditions: [
        ['phone', '=', phone],
    ]
  })
  if(existingPhone.length){
    res.send({status:false, data: "Phone Number Already Exists"})
    return
  }

  const hashedPassword = await generateHash(password)
  const insertedId = await db.insertData("users", {
    name,
    userName,
    email,
    phone,
    password: hashedPassword
  })
  if(!insertedId){
    res.send({status:false , data: "failed to add user" })
    return
    }

    const otpResponse = await sendOtp(phone)
    if(!otpResponse.status){
      res.send({status:false, data:"failed to send otp"})
      return
    }
    const insertedOtpId = await db.insertData("otps", {
      otp: otpResponse.otp,
      phone
    })
    if(!insertedOtpId){
      res.send({status:false , data: "failed to add user" })
      return
      }
    console.log(otpResponse.status);
    res.send({status:true, data:"Sign Up success"})
  })



app.post("/api/v1/signup/otp-verification", async(req, res) => {
  const {phone, otp} = req.body
  const otpData = await db.selectData('otps', {
    fields: [],
    filteringConditions: [
        ['phone', '=', phone],
    ]
  })
  if(!otpData.length){
    res.send({status: false, data:"otp doesn't exist"})
    return
  }
  console.log(otpData[otpData.length - 1].otp, otp)
  if(otpData[otpData.length-1].otp != otp){
    res.send({status: false, data: "Wrong Otp"})
    return
  }
  await db.updateData("users",
   { fields: {
     status: true
   },filteringConditions: [
     ["phone","=",phone]
   ] }
  )
    res.send({status: true, data:"otp verified"})
    
 })
  
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})