const express = require("express");
const fetch = require("node-fetch");

const app = express();

app.get("/", (req, res) => {
    res.send("API Roblox funcionando 🚀");
});

app.get("/getpasses", async (req, res) => {
    const userId = req.query.userId;

    if (!userId) return res.json({ error: "Falta el userId" });

    try {
        // 1. Obtener juegos del usuario
        const gamesRes = await fetch(`https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=10`);
        const gamesData = await gamesRes.json();

        if (!gamesData.data || gamesData.data.length === 0) {
            return res.json([]);
        }

        let allPasses = [];

        // 2. Recorrer los juegos usando universeId
        for (const game of gamesData.data) {
            // CAMBIO CLAVE: Usamos game.universeId en lugar de game.id
            const universeId = game.universeId; 

            if (!universeId) continue;

            const passesRes = await fetch(`https://games.roblox.com/v1/games/${universeId}/game-passes?limit=100`);
            const passesData = await passesRes.json();

            if (passesData.data && passesData.data.length > 0) {
                const passes = passesData.data.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price || 0,
                    productId: item.productId // Útil por si necesitas procesar la compra
                }));

                allPasses = allPasses.concat(passes);
            }
        }

        res.json(allPasses);

    } catch (err) {
        console.error("Error en la petición:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("API corriendo en puerto " + PORT);
});
