import express, { json } from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import joi from "joi";
import dotenv from "dotenv";
dotenv.config();

const server = express();
server.use(cors());
server.use(json());

const users = [];

server.get("/participants", (req, res) => {
  const mongoClient = new MongoClient(
    "mongodb://localhost:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=chatUol"
  );
  const promiseConnect = mongoClient.connect();

  promiseConnect.then((connectedMongoClient) => {
    console.log("SUCESSOOOO");

    const dbParticipants = connectedMongoClient.db("participants");
    const participantsCollection = dbParticipants.collection("users");

    const promiseParticipants = participantsCollection.find({}).toArray();

    promiseParticipants.then((users) => {
      res.send(users);
      mongoClient.close();
    });

    promiseParticipants.catch((error) => {
      console.log("Error nos dados", error);
      res.sendStatus(500);
      mongoClient.close();
    });
  });

  promiseConnect.catch((error) => {
    console.log("Error de conexão", error);
    res.send(500);
    mongoClient.close();
  });
});

server.post("/participants", (req, res) => {
  if (!req.body.name || !req.body.lastStatus) {
    res.status(422).send("Todos os campos são obrigatórios!");
    return;
  }

  const mongoClient = new MongoClient(
    "mongodb://localhost:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=chatUol"
  );
  const promiseConnect = mongoClient.connect();

  promiseConnect.then((connectedMongoClient) => {
    console.log("SUCESSOOOO");

    const dbParticipants = connectedMongoClient.db("participants");
    const participantsCollection = dbParticipants.collection("users");

    const promiseInsert = participantsCollection.insertOne(req.body);

    promiseInsert.then(() => {
      res.sendStatus(201);
      mongoClient.close();
    });

    promiseInsert.catch((error) => {
      console.log("Error no push de dados", error);
      res.sendStatus(500);
      mongoClient.close();
    });
  });

  promiseConnect.catch((error) => {
    console.log("Error de conexão", error);
    res.send(500);
    mongoClient.close();
  });

  res.sendStatus(201);
});

server.listen(5000, () => {
  console.log("Funciona");
});
