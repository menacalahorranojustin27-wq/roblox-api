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

    if (!userId) {
        return res.json({ error: "Falta userId" });
    }

    try {
        let passes = [];

        // 🔥 Obtener juegos del usuario
        const gamesRes = await fetch(
            `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`
        );

        const gamesData = await gamesRes.json();

        if (!gamesData || !gamesData.data || gamesData.data.length === 0) {
            return res.json([]);
        }

        // 🔥 Recorrer juegos
        for (const game of gamesData.data) {

            const placeId = game.rootPlaceId;
            if (!placeId) continue;

            try {
                const passRes = await fetch(
                    `https://games.roblox.com/v1/games/${placeId}/game-passes?limit=50`
                );

                const passData = await passRes.json();

                if (!passData || !passData.data) continue;

                for (const pass of passData.data) {
                    passes.push({
                        id: pass.id,
                        name: pass.name,
                        price: pass.price || 0
                    });
                }

            } catch (innerErr) {
                console.log("Error gamepasses:", innerErr.message);
            }
        }

        res.json(passes);

    } catch (err) {
        console.log("ERROR GENERAL:", err.message);
        res.json([]);
    }
});

// 🔥 IMPORTANTE para Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("API corriendo en puerto " + PORT);
});
