// dns related error থেকে বাঁচতে নিচের ২ লাইন আনকমেন্ট করতে পারেন
// const dns = require("node:dns");
// dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion } = require('mongodb');

// dotenv 
dotenv.config();

// first app toire
const app = express();
const PORT = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI;

// Middleware (app toirer por dea lage)
app.use(express.json());

// MongoDB Client create
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // daatabase connect kora
        await client.connect();


        const database = client.db("ideaVaultDB");
        const bannersCollection = database.collection("banners");

        // banner api route holo
        app.get("/banners", async (req, res) => {
            try {
                const result = await bannersCollection
                    .aggregate([
                        {
                            $limit: 3
                        }
                    ])
                    .toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Data fetch problem", error });
            }
        });





        // root api ata
        app.get('/', (req, res) => {
            res.send("server is running fine!");
        });

        // check korlam connect hoise bole
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

    } catch (error) {
        console.error("Database connection error:", error);
    }

}

// database funstion run kora
run().catch(console.dir);

// server
app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});