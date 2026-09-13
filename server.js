require("dotenv").config()

const app = require("./src/app")
const cors = require('cors');
app.use(cors());
const connectToDB = require("./src/config/db")


connectToDB();


const PORT=9999;
app.listen((PORT),()=>{
    console.log(`Server Starts on http://localhost${PORT}`);
})