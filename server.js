const express = require("express");
const fetch = require("node-fetch");

const app = express();

app.get("/getpasses", async (req, res) => {
    const userId = req.query.userId;

    if (!userId) return res.json([]);

    try {
        let passes = [];

        const gamesRes = await fetch(`https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`);
        const gamesData = await gamesRes.json();

        if (!gamesData.data) return res.json([]);

        for (const game of gamesData.data) {

            const placeId = game.rootPlaceId;
            if (!placeId) continue;

            const passRes = await fetch(`https://games.roblox.com/v1/games/${placeId}/game-passes?limit=50`);
            const passData = await passRes.json();

            if (!passData.data) continue;

            for (const pass of passData.data) {
                passes.push({
                    id: pass.id,
                    name: pass.name,
                    price: pass.price || 0
                });
            }
        }

        res.json(passes);

    } catch (err) {
        console.log(err);
        res.json([]);
    }
});

app.listen(3000, () => {
    console.log("API corriendo");
});
