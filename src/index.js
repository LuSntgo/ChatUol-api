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

const mongoClient = new MongoClient(process.env.MONGO_URI);
await mongoClient.connect();
const dbChatUol = mongoClient.db("chatuol");

const userSchema = joi.object({
  name: joi.string().required(),
});
const messageSchema = joi.object({
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.valid("message", "private_message").required(),
});

//* Participants
server.get("/participants", async (req, res) => {
  try {
    const participantsCollection = dbChatUol.collection("participants");
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
    const participantsCollection = dbChatUol.collection("participants");

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

//* Messages

server.post("/messages", async (req, res) => {
  const messageFrom = req.header.user;
  const validation = messageSchema.validate(req.body, { abortEarly: false });
  try {
    let authorization = await participants.findOne({ name: messageFrom });

    if (!authorization) {
      res.sendStatus(422);
      mongoClient.close();
      return;
    }
    if (validation.error) {
      res.status(422).send("Erro na validação dos dados");
      mongoClient.close();
      return;
    }
    const message = {
      ...req.body,
      from: messageFrom,
      time: dayjs().format("HH:mm:ss"),
    };
    await dbChatUol.collection("messages").insertOne(message);
    res.sendStatus(201);
    mongoClient.close();
  } catch (error) {
    res.sendStatus(500);
  }
});

server.get("/messages", async (req, res) => {
  const username = req.header.user;
  const limit = parseInt(req.query.limit);
  try {
    const chatCollection = dbChatUol.collection("messages");
    const filterChat = await chatCollection
      .find({
        $or: [
          { type: "message" },
          { $and: [{ type: "private_message" }, { to: username }] },
          { $and: [{ type: "private_message" }, { from: username }] },
        ],
      })
      .toArray();
    if (!limit) {
      res.send(filterChat);
    } else {
      res.send(filterChat.slice(-limit));
    }
  } catch (error) {
    res.sendStatus(500);
  }
});

//* Status

server.post("/status", async (req, res) => {
  const username = req.header.user;

  try {
    const participantsCollection = dbChatUol.collection("participants");
    const participantsList = await participantsCollection.find({}).toArray();
    if (!participantsList.find((p) => p.name === username)) {
      res.sendStatus(404);
    } else {
      await participantsCollection.updateOne(
        { name: username },
        { $set: { lastStatus: Date.now() } }
      );
      res.sendStatus(200);
    }
  } catch (error) {
    res.sendStatus(500);
  }
});

//* Delete
server.delete("/messages/:id", async (req, res) => {
  const { id } = req.params;
  const username = req.header.user;
  const chatCollection = dbChatUol.collection("messages");
  const message = await chatCollection.findOne({ _id: new ObjectId(id) });

  if (!message) {
    res.sendStatus(404);
    return;
  }
  if (username !== message.from || message.type === "status") {
    res.sendStatus(401);
    return;
  }
  await chatCollection.deleteOne({ _id: new ObjectId(id) });
  res.sendStatus(200);
});

server.listen(5000, () => {
  console.log("Rodando em http://localhost:5000");
});
