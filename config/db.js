const mongoose = require("mongoose");
const config = require("config");
//const db = config.get("mongoURI");
const URI = "mongodb+srv://rajatbhatt123:rajatbhatt123@cluster0.hdttm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const connectDB = async () => {
  try {
    await mongoose.connect(URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
    console.log("MongoDb is Successfully Connected");
  } catch (err) {
    console.error(err.message);
    //exit from the process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
