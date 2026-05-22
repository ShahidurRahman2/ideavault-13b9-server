// dns related error teke baste next 2line
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { ObjectId } = require("mongodb");
const { MongoClient, ServerApiVersion } = require('mongodb');

// dotenv
dotenv.config();

// first app toire
const app = express();
const PORT = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI;

// Middleware (app toirer por dea lage)
app.use(cors());
app.use(express.json());

// MongoDB Client create
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get('/', (req, res) => {
    res.send("server is running fine!");
});

async function run() {

    try {

        // daatabase connect kora
        await client.connect();

        console.log("Connected to MongoDB successfully!");

        const database = client.db("ideaVaultDB");

        const ideasCollection = database.collection("ideas");

        const bannersCollection = database.collection("banners");

        // NEWLY ADDED
        const commentsCollection = database.collection("comments");

        // ============================================================
        // banner api root
        // ============================================================

        app.get("/banners", async (req, res) => {

            try {

                const result = await bannersCollection
                    .find({})
                    .sort({ _id: 1 })
                    .limit(5)
                    .toArray();

                res.send(result);

            }

            catch (error) {

                res.status(500).send({
                    message: "Data fetch problem",
                    error
                });
            }
        });

        // POST API to save idea from frontend form

        app.post("/ideas", async (req, res) => {

            try {

                const newIdea = req.body;

                if (!newIdea.title || !newIdea.description) {

                    return res.status(400).send({
                        message: "Title and description are required"
                    });
                }

                // collection
                const result = await ideasCollection.insertOne(newIdea);

                res.status(201).send(result);

            }

            catch (error) {

                console.error("Error inserting new idea:", error);

                res.status(500).send({
                    message: "Failed to store idea data",
                    error
                });
            }
        });

        // ideas trending route

        app.get("/trending-ideas", async (req, res) => {

            try {

                const result = await ideasCollection
                    .find()
                    .limit(6)
                    .toArray();

                res.send(result);

            }

            catch (error) {

                res.status(500).send({
                    message: "Error fetching trending ideas",
                    error
                });
            }
        });

        // get all ideas

        app.get("/ideas", async (req, res) => {

            try {

                const search = req.query.search || "";

                const category = req.query.category || "";

                let andConditions = [];

                // search
                if (search) {

                    andConditions.push({
                        title: {
                            $regex: search,
                            $options: "i"
                        }
                    });
                }

                // filter condition
                if (
                    category &&
                    category.trim().toLowerCase() !== "all"
                ) {

                    const cleanCategory = category.trim();

                    andConditions.push({

                        $or: [

                            {
                                category: {
                                    $regex: `^${cleanCategory}$`,
                                    $options: "i"
                                }
                            },

                            {
                                category: {
                                    $in: [
                                        new RegExp(`^${cleanCategory}$`, "i")
                                    ]
                                }
                            },

                            {
                                Category: {
                                    $regex: `^${cleanCategory}$`,
                                    $options: "i"
                                }
                            },

                            {
                                Category: {
                                    $in: [
                                        new RegExp(`^${cleanCategory}$`, "i")
                                    ]
                                }
                            }
                        ]
                    });
                }

                let query = {};

                if (andConditions.length > 0) {

                    query = {
                        $and: andConditions
                    };
                }

                const result = await ideasCollection
                    .find(query)
                    .sort({ _id: -1 })
                    .toArray();

                res.send(result);

            }

            catch (error) {

                console.error("Error fetching ideas:", error);

                res.status(500).send({
                    message: "Error fetching ideas",
                    error
                });
            }
        });

        // get single idea by id

        app.get("/ideas/:id", async (req, res) => {

            try {

                const id = req.params.id;

                // NEWLY ADDED
                console.log("Idea ID:", id);

                // NEWLY ADDED
                if (!ObjectId.isValid(id)) {

                    return res.status(400).send({
                        message: "Invalid ID format provided"
                    });
                }

                const query = {
                    _id: new ObjectId(id)
                };

                const result = await ideasCollection.findOne(query);

                if (!result) {

                    return res.status(404).send({
                        message: "Idea not found"
                    });
                }

                res.send(result);

            }

            catch (error) {

                console.error("Error fetching single idea:", error);

                res.status(500).send({
                    message: "Internal Server Error",
                    error
                });
            }
        });

        // get specific user data

        app.get("/my-ideas", async (req, res) => {

            try {

                const email = req.query.email;

                const query = {
                    userEmail: email
                };

                const result = await ideasCollection
                    .find(query)
                    .sort({ _id: -1 })
                    .toArray();

                res.send(result);

            }

            catch (error) {

                console.error(error);

                res.status(500).send({
                    message: "Failed to fetch my ideas"
                });
            }
        });

        // ============================================================
        // delete data from database by id
        // ============================================================

        app.delete("/ideas/:id", async (req, res) => {

            try {

                const id = req.params.id;

                // NEWLY ADDED
                if (!ObjectId.isValid(id)) {

                    return res.status(400).send({
                        message: "Invalid ID"
                    });
                }

                const query = {
                    _id: new ObjectId(id)
                };

                const result = await ideasCollection.deleteOne(query);

                res.send(result);

            }

            catch (error) {

                console.error(error);

                res.status(500).send({
                    message: "Failed to delete idea"
                });
            }
        });

        // add comment in mongodb

        app.post("/comments", async (req, res) => {

            try {

                const commentData = req.body;

                const result = await commentsCollection.insertOne(commentData);

                res.send(result);

            }

            catch (error) {

                console.error(error);

                res.status(500).send({
                    message: "Failed to add comment"
                });
            }
        });

        // ============================================================
        // comment get from mongodb
        // ============================================================

        app.get("/my-interactions", async (req, res) => {

            try {

                const email = req.query.email;

                const result = await commentsCollection
                    .find({
                        userEmail: email
                    })
                    .sort({ _id: -1 })
                    .toArray();

                res.send(result);

            }

            catch (error) {

                console.error(error);

                res.status(500).send({
                    message: "Failed to fetch interactions"
                });
            }
        });


        // comment by idea id


        app.get("/comments/:ideaId", async (req, res) => {

            try {

                const ideaId = req.params.ideaId;

                const result = await commentsCollection
                    .find({
                        ideaId
                    })
                    .sort({ _id: -1 })
                    .toArray();

                res.send(result);

            }

            catch (error) {

                console.error(error);

                res.status(500).send({
                    message: "Failed to fetch comments"
                });
            }
        });

        // ============================================================
        // update comment
        // ============================================================

        app.patch("/comments/:id", async (req, res) => {

            try {

                const id = req.params.id;

                // NEWLY ADDED
                if (!ObjectId.isValid(id)) {

                    return res.status(400).send({
                        message: "Invalid ID"
                    });
                }

                const updatedData = req.body;

                const query = {
                    _id: new ObjectId(id)
                };

                const updateDoc = {

                    $set: {
                        comment: updatedData.comment
                    }
                };

                const result = await commentsCollection.updateOne(
                    query,
                    updateDoc
                );

                res.send(result);

            }

            catch (error) {

                console.error(error);

                res.status(500).send({
                    message: "Failed to update comment"
                });
            }
        });

        // ============================================================
        // delete comment
        // ============================================================

        app.delete("/comments/:id", async (req, res) => {

            try {

                const id = req.params.id;

                // NEWLY ADDED
                if (!ObjectId.isValid(id)) {

                    return res.status(400).send({
                        message: "Invalid ID"
                    });
                }

                const query = {
                    _id: new ObjectId(id)
                };

                const result = await commentsCollection.deleteOne(query);

                res.send(result);

            }

            catch (error) {

                console.error(error);

                res.status(500).send({
                    message: "Failed to delete comment"
                });
            }
        });

        // ============================================================
        // check connection
        // ============================================================

        await client.db("admin").command({ ping: 1 });

        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );



        //   update idea is here 

        app.patch("/ideas/:id", async (req, res) => {

            try {

                const id = req.params.id;

                const updatedIdea = req.body;

                const query = {
                    _id: new ObjectId(id)
                };

                const updateDoc = {

                    $set: updatedIdea
                };

                const result = await ideasCollection.updateOne(
                    query,
                    updateDoc
                );

                res.send(result);

            }

            catch (error) {

                console.error(error);

                res.status(500).send({
                    message: "Failed to update idea"
                });
            }
        });


        // server run
        app.listen(PORT, () => {

            console.log(`🚀 server running on port ${PORT}`);
        });

    }

    catch (error) {

        console.error(
            "Database connection error during startup:",
            error
        );

        process.exit(1);
    }
}

// database function run kora
run().catch(console.dir);