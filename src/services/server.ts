/**
 * @info the main entry point of express server
 */

 import express, { Request, Response } from "express";

 import bodyParser from "body-parser";
 import responseToPostman from "../middleware/responseToPostman";
 
 import expressLog from "../middleware/expressLog";
 
 import Joi from "joi";
 import session from "express-session";
 import MongoStore from "connect-mongo";
 
 import userController from "../controller/userController";
 import profileController from "../controller/profileController";

 export default class Server {
     app = express();
 
     async start() {
         console.log("Server started");
         this.app.listen(process.env.PORT);
         console.log("Server listening on port: " + process.env.PORT);
 
         this.middleware();
         this.routes();
         this.defRoutes();
     }
 
     /**
      * @info middleware
      */
     middleware() {
         this.app.use(expressLog);
         //this.app.use(bodyParser.urlencoded({ extended: false }));
         this.app.use(bodyParser.json());
 
         this.app.use(
             session({
                 secret: process.env.SESSION_SECRET,
                 resave: false,
                 saveUninitialized: false,
                 store: new MongoStore({
                     mongoUrl: process.env.SESSION_MONGODB_URL,
                     collectionName: "sessions",
                 }),
                 cookie: {
                     maxAge: 7 * 24 * 60 * 60 * 1000,
                 },
             }),
         );
     }
 
     /**
      * @info define all routes
      */
 
     routes() {

        /**
          * @info user routes
          */

         /**
          * creating a user
          */
          this.app.post(
            "/users/create",
            responseToPostman(async (req: Request, resp: Response) => {
                // create joi schema
                const schema = Joi.object({
                    name: Joi.string().required().min(5),
                    phone: Joi.string().required(),
                    password: Joi.string().required().min(8),
                });
                console.log(req.body)
                // validating req.body
                await schema.validateAsync(req.body);
                // creating user
                // @ts-ignore
                const user =  await userController.create(req.body);
                if(user) {
                       return "User created";
                } else {
                       throw new Error("User is not created");
                }
            }),
        );

        /**
         * authorization
         */
        this.app.post(
            "/users/auth",
            responseToPostman(async (req: Request, resp: Response) => {
                // create joi schema
                const schema = Joi.object({
                    phone: Joi.string().required(),
                    password: Joi.string().required().min(8),
                });

                // validating req.body
                await schema.validateAsync(req.body);

                // authenticate user
                const user = await userController.auth(req.body.phone, req.body.password);
                if(user) {
                    // set the user session
                    // @ts-ignore
                    req.session.user = user;
                    // @ts-ignore
                    req.session.admin = null;
                    return "User authenticated successfully";
                } else {
                    throw new Error("User is not authenticated");
                }
            }),
        );
         
         // logging out user 
         this.app.post(
             "/logout",
             responseToPostman((req: Request) => {
                 // destroy session
                 req.session.destroy(() => {});
 
                 // return success to user/admin
                 return "User has logged out";
             }),
         );

         /**
         * Show User Profile
         *  {string} "Userid vai Session"
         *  return "User Profile"
         */
        this.app.get("/users/profile", responseToPostman(async (req: Request, res: Response) => {
            //@ts-ignore
            if(req.session && req.session.user)
            {
                // @ts-ignore
                return await userController.getUserProfile(req.session.user._id);
            }
            else {
                throw new Error("User need to be logged in");
            }
        }));

        /**
         * Changing User Name
         */
        this.app.put("/users/changeName",responseToPostman(async (req: Request, resp: Response) => {
            //authenticating the user
            //@ts-ignore
            if(!(req.session && req.session.user)){
                throw new Error("User Not Authenticated")
            }
            //creating Joi schema
            const schema = Joi.object({
                uid:Joi.string().required(),
                name:Joi.string().required()
            });
            //validate joi schema
            await schema.validateAsync(req.body);
            //Updating Name
            //@ts-ignore
            return profileController.updateName(req.body.uid,req.body.name);
        }));

        /**
         * Changing User Profile Photo
         */
        this.app.put("/users/changePhoto",responseToPostman(async (req: Request, resp: Response) => {
            //authenticating the user
            //@ts-ignore
            if(!(req.session && req.session.user)){
                throw new Error("User Not Authenticated")
            }
            //creating Joi schema
            const schema = Joi.object({
                uid:Joi.string().required(),
                avatar:Joi.string().required()
            });
            //validate joi schema
            await schema.validateAsync(req.body);
            //Updating Name
            //@ts-ignore
            return profileController.updatePhoto(req.body.uid,req.body.avatar);
        }));
}
 
     /**
      * @info define the default routes
      */
 
     defRoutes() {
         // check if server running
         this.app.all("/", (req, resp) => {
             resp.status(200).send({ success: true, message: "Welcome to ChatterBox" });
         });
 
         this.app.all("*", (req, resp) => {
             resp.status(404).send({ success: false, message: `given route [${req.method}] ${req.path} not found` });
         });
     }
 }
 