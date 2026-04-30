const express = require("express");
const fetch = require("node-fetch");

const app = express();

app.get("/getpasses", async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.json({ error: "Falta el userId" });

    try {
        // 1. Obtener los juegos del usuario (Esta API sigue funcionando igual)
        const gamesRes = await fetch(`https://games.roproxy.com/v2/users/${userId}/games?accessFilter=Public&limit=10`);
        const gamesData = await gamesRes.json();

        if (!gamesData.data || gamesData.data.length === 0) {
            return res.json([]);
        }

        let allPasses = [];

        // 2. Recorrer los juegos para buscar pases con la NUEVA API
// 2. Recorrer los juegos para buscar pases
        for (const game of gamesData.data) {
            const universeId = game.id;

            const passesRes = await fetch(`https://apis.roproxy.com/game-passes/v1/universes/${universeId}/game-passes?pageSize=100`);
            const passesData = await passesRes.json();

            if (passesData.gamePasses && passesData.gamePasses.length > 0) {
                const passes = passesData.gamePasses.map(item => ({
                    id: item.id,
                    name: item.name,
                    // Si 'price' es null o no existe, ponemos 0
                    price: item.price || 0,
                    productId: item.productId,
                    isForSale: item.isForSale
                }));

                allPasses = allPasses.concat(passes);
            }
        }

        res.json(allPasses);

    } catch (err) {
        console.error("Error detectado:", err);
        res.status(500).json({ error: "Error en la conexión con Roblox" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor activo en puerto " + PORT));
