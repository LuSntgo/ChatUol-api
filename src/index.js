import express, { json } from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import joi from "joi";
import dotenv from "dotenv";
dotenv.config();

const server = express();
server.use(cors());
server.use(json());

const participants = [];

server.get("/participants", (req, res) => {
  const mongoClient = new MongoClient(
    "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=chatUol"
  );
  const promise = mongoClient.connect();

  promise.then((connectedMongoClient) => {
    console.log("SUCESSOOOO");

    const dbParticipants = connectedMongoClient.db("participants");
    const participantsCollection = dbParticipants.collection("participants");

    const promiseParticipants = participantsCollection.find({}).toArray();

    promiseParticipants.then((participants) => {
      res.send(participants);
      mongoClient.close();
    });

    promise.catch((error) => {
      console.log("Error nos dados", error);
      res.send(error);
      mongoClient.close();
    });
  });

  promise.catch((error) => {
    console.log("Error", error);
    res.send(error);
    mongoClient.close();
  });
});

server.post("/participants", (req, res) => {
  const name = req.body;
  if (name === "") {
    res.status(422).send("Não deixe vazio");
    return;
  }

  const mongoClient = new MongoClient(
    "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=chatUol"
  );
  const promise = mongoClient.connect();

  promise.then((connectedMongoClient) => {
    console.log("SUCESSOOOO");

    const dbParticipants = connectedMongoClient.db("participants");
    const participantsCollection = dbParticipants.collection("participants");

    const promiseInsert = participantsCollection.insertOne(req.body);

    promiseInsert.then(() => {
      res.sendStatus(201);
      mongoClient.close();
    });

    promiseInsert.catch((error) => {
      console.log("Error nos dados", error);
      res.send(error);
      mongoClient.close();
    });
  });

  promise.catch((error) => {
    console.log("Error", error);
    res.send(error);
    mongoClient.close();
  });

  res.sendStatus(201);
});

server.listen(5000, () => {
  console.log("Funciona");
});
