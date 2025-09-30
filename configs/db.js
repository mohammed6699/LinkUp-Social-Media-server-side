import mongoose from "mongoose";
import  dotenv  from 'dotenv';
dotenv.config();
const connectToDb = async () => {
    try {
        mongoose.connection.on('connected', () => {
            console.log("Data base connected")
        })
        await mongoose.connect(`${process.env.MONGODB_URL}/linkUp`)
    } catch (error) {
        console.log(error.message)
    }   
}
export default connectToDb