/**
 * @info perform CRUD on user
 */

import users, { IUser } from "../models/users";
import Bcrypt from "../services/bcrypt";
import mongoose from "mongoose";

export default class userController {
     /**
     * 
     * @param body 
     * @returns 
     */
      static async create(body:any): Promise<IUser> {
        const hash = await Bcrypt.hashing(body.password);
        const data = {
            ...body,
            password: hash,
    };
   
    return users.create(data);
    
}
    /**
     * 
     * @param phone
     * @param password 
     * @returns 
     */
    static async auth(phone:string,password:string): Promise<IUser> {
        //fetch data from database
        const user=  await users.findOne({phone: phone}).lean()
        // check user is exists or not
        if (user)
        {
                //comparing the password with hash
            const res= await Bcrypt.comparing(password, user.password);
                //check correct or not
                if(res) return user;
                else throw new Error("wrong password")
        }
         throw new Error("user does not exist");
       
    }

    /**
     * Get User Profile
     * @param _id
     * @returns user
     */
    static async getUserProfile(_id) {
        const user = await users.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(_id)
                },
            },
            {
                $project:{
                    "password": 0,
                }
            },
        ]).exec();
        if(user) return user;
        else throw new Error("user not exists");
    }

}