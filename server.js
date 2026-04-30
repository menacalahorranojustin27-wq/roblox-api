const express = require("express");
const fetch = require("node-fetch");

const app = express();

// 🔥 Ruta principal (evita "Cannot GET /")
app.get("/", (req, res) => {
    res.send("API Roblox funcionando 🚀");
});

// 🔥 GET PASSES
app.get("/getpasses", async (req, res) => {
    const userId = req.query.userId;

    if (!userId) return res.json([]);

    try {
        const url = `https://catalog.roblox.com/v1/search/items/details?Category=3&CreatorId=${userId}&AssetType=Pass&Limit=30`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data || !data.data) return res.json([]);

        const passes = data.data.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price
        }));

        res.json(passes);

    } catch (err) {
        console.log(err);
        res.json([]);
    }
});

// 🔥 IMPORTANTE para Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("API corriendo en puerto " + PORT);
});
