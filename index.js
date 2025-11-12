require('dotenv').config();
const express = require('express');
const bcrypt= require('bcryptjs');
const jwt= require('jsonwebtoken');
const app = express();

app.use(express.json());

let users=[];
let flights=[
    {id:1,name:"AirIndia",origin:"BLR",dest:"CHE",departure:"2025-11-12T10:00:00",availSeats:20},
    {id:2,name:"IndiGo",origin:"BLR",dest:"DEL",departure:"2025-11-12T12:20:00",availSeats:1},
    {id:3,name:"SpiceJet",origin:"VJA",dest:"BLR",departure:"2025-11-13T00:00:00",availSeats:0},
    {id:4,name:"AirAsia",origin:"BOM",dest:"CHE",departure:"2025-11-13T23:00:00",availSeats:100},
    {id:5,name:"Vistara",origin:"TVM",dest:"VJA",departure:"2025-11-14T20:05:30",availSeats:20},
    {id:6,name:"AirIndia",origin:"TVM",dest:"CHE",departure:"2025-11-15T02:15:00",availSeats:10},
    {id:7,name:"IndiGo",origin:"BOM",dest:"DEL",departure:"2025-11-15T10:00:00",availSeats:19},
    {id:8,name:"SpiceJet",origin:"LUC",dest:"CHE",departure:"2025-11-16T11:00:00",availSeats:23},
    {id:9,name:"AirAsia",origin:"VJA",dest:"CHE",departure:"2025-11-16T16:30:00",availSeats:86},
    {id:10,name:"Vistara",origin:"BLR",dest:"BOM",departure:"2025-11-20T19:30:00",availSeats:9},
];
let bookings=[];
let nextBookingId=1; 
let nextUserId=1;

//signup endpoint
app.post('/users/signup',(req,res)=>{const{name,email,password}=req.body;
if(!name||!email||!password){
    return res.status(400).json({error:'Name,Email,Password are required'});
}
const existingUser=users.find(u=>u.email===email);
if(existingUser){
    return res.status(400).json({error:'Email is already registered'})
}

const hashedpassword=bcrypt.hashSync(password,8);

const newUser={
    id:nextUserId++,
    name,
    email,
    password:hashedpassword
};

users.push(newUser); //saving to the array
return res.status(201).json({message:'User created successfully',userId:newUser.id});
});

//login endpoint
app.post('/users/login',(req,res)=>{
    const{email,password}=req.body;
    if(!email||!password){
        return res.status(400).json({error:'Email and Password are required'});
    }
    const user=users.find(u=>u.email===email);
    if(!user){
        return res.status(401).json({error:'User not found'});
    }
    const isValid=bcrypt.compareSync(password,user.password);
    if(!isValid){
        return res.status(401).json({error:'Invalid password'});
    }
    const token=jwt.sign({id:user.id,email:user.email},process.env.JWT_SECRET,{expiresIn: '30m'});
    res.json({token});
});

// // listing the flights
// app.get('/flights',(req,res)=>{res.json(flights);});
//including pagination here
app.get('/flights',(req,res)=>{
    let results= flights;
    const {origin,dest,page,limit}=req.query;
    if(origin){
        results=results.filter(f=>f.origin.toLowerCase()===origin.toLowerCase());
    }
    if(dest){
        results=results.filter(f=>f.dest.toLowerCase()===dest.toLowerCase());
    }
    const pageInt=parseInt(page)||1;
    const limitInt=parseInt(limit)||10;
    const startIndex=(pageInt-1)*limitInt;
    const endIndex=pageInt*limitInt;

    const paginatedResults=results.slice(startIndex,endIndex);

    res.json({page:pageInt,
        limit:limitInt,
        total: results.length,
        totalPages: Math.ceil(results.length/limitInt),
        data: paginatedResults
    });
});

//auth middleware
function authenticateToken(req,res,next){
    const authHeader=req.headers['authorization'];
    const token= authHeader && authHeader.split(' ')[1];
    if(!token){
        return res.status(401).json({error:'Access token required'});
    }
    jwt.verify(token,process.env.JWT_SECRET,(err,user)=>{
        if(err){
            return res.status(403).json({error:'Invalid or expired token'});
        }
        req.user=user;
        next();
    });
}

//booking endpoint
app.post('/bookings',authenticateToken,(req,res)=>{
    const {flightId}=req.body;
    const userId=req.user.id;
    if(!flightId){
        return res.status(400).json({error:'flightId is required'});
    }
    const flight=flights.find(f=>f.id==flightId);
    if(!flight){
        return res.status(404).json({error:'Flight not found'});
    }
    if(flight.availSeats<=0){
        return res.status(400).json({error:'No seats available'});
    }
    flight.availSeats-=1;
    const newBooking={
        id:nextBookingId++,
        userId,
        flightId,
        status: 'booked',
        timestamp: new Date().toISOString()
    };
    bookings.push(newBooking);
    res.status(201).json({
        message: 'Booking confirmed',
        booking: newBooking
    });
});

//cancelling endpoint
app.post('/bookings/:id/cancel',authenticateToken,(req,res)=>{
    const {id} = req.params;
    const userId = req.user.id;
    const booking=bookings.find(b=>b.id==id);
    if (!booking) {
        return res.status(404).json({error:'Booking not found'});
      }
    if (booking.userId!=userId) {
        return res.status(403).json({error:'Not authorized to cancel this booking'});
      }
    if (booking.status==='cancelled') {
        return res.status(400).json({ error:'Booking already cancelled'});
      }
    booking.status = 'cancelled';
    const flight=flights.find(f=>f.id==booking.flightId);
    if(flight){
        flight.availSeats+=1;
    }
    res.json({
        message:'Booking cancelled successfully',
        bookingId:booking.id
    });
});

//booking history endpoint
app.get('/bookings/:userId',authenticateToken,(req,res)=>{
    const {userId}=req.params;
    if(req.user.id!=userId){
        return res.status(403).json({error:'Not authorizwd'});
    }
    const userBookings=bookings.filter(b=>b.userId==userId);
    res.json(userBookings);
});

//server
const PORT=process.env.PORT || 3000;    
app.listen(PORT,()=>{
    console.log(`Server running on http://localhost:${PORT}`);
});

