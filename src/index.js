import express, { json } from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import joi from "joi";
import dotenv from "dotenv";
import dayjs from "dayjs";

dotenv.config();
const server = express();
server.use(cors());
server.use(json());

const userSchema = joi.object({
  name: joi.string().required(),
});
const messageSchema = joi.object({
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.valid("message", "private_message").required(),
});

server.get("/participants", async (req, res) => {
  try {
    const mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect();

    const dbChatUol = mongoClient.db("participants");
    const participantsCollection = dbChatUol.collection("users");
    const users = await participantsCollection.find({}).toArray();

    res.send(users);
    mongoClient.close();
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

server.post("/participants", async (req, res) => {
  const validation = userSchema.validate(req.body);

  if (validation.error) {
    res.status(422).send(validation.error);
    return;
  }
  try {
    const mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect();

    const dbChatUol = mongoClient.db("participants");
    const participantsCollection = dbChatUol.collection("users");

    if (await participantsCollection.findOne({ name: req.body.name })) {
      res.status(409).send("Ops, esse participante já existe");
      mongoClient.close();
      return;
    }
    const userData = {
      name: req.body.name,
      lastStatus: Date.now(),
    };

    await participantsCollection.insertOne(userData);
    res.sendStatus(201);
    mongoClient.close();
  } catch (error) {
    res.sendStatus(500);
  }
});

server.listen(5000, () => {
  console.log("Funciona");
});

server.delete("");
