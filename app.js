const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const cors = require('cors');
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config()
}
const hostname = '0.0.0.0';
const port = process.env.PORT || 8000;

app.use(require('./routes'));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control_Allow-Headers', "x-access token, Origin, Content-Type, Accept");
    res.setHeader("x-access-token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTYzNjQ5MTkyNzA5MiIsImVtYWlsIjoiY0BjIiwiaWF0IjoxNjM2NDkxOTI3LCJleHAiOjE2MzY0OTkxMjd9.3nKmcqEh9NSx8qLX-OaVjOqIeTSBFk4BjQxELrQf1O4");
    next();
})
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.get('/',(req,res,next)=>{
    return res.send(`Server running at Port ${port}`)
})

app.listen(port, hostname, () => {
    console.log(`Server running at Port ${port}`);
});
