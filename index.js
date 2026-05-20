// dns related error থেকে বাঁচতে নিচের ২ লাইন আনকমেন্ট করতে পারেন
// const dns = require("node:dns");
// dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
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

async function run() {
    try {
        // daatabase connect kora
        await client.connect();

        const database = client.db("ideaVaultDB");
        const ideasCollection = database.collection("ideas");
        const bannersCollection = database.collection("banners");

        //    banner api root
        app.get("/banners", async (req, res) => {
            try {

                const result = await bannersCollection
                    .find({})
                    .sort({ _id: 1 })
                    .limit(5)
                    .toArray();

                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Data fetch problem", error });
            }
        });


        //  ideas rout 

        app.get("/trending-ideas", async (req, res) => {

            const result = await ideasCollection
                .find()
                .limit(6)
                .toArray();

            res.send(result);
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