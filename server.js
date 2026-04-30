const express = require("express");
const fetch = require("node-fetch");

const app = express();

app.get("/getpasses", async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.json({ error: "Falta el userId" });

    try {
        // 1. Obtener juegos del usuario
        const gamesRes = await fetch(`https://games.roproxy.com/v2/users/${userId}/games?accessFilter=Public&limit=10`);
        const gamesData = await gamesRes.json();

        if (!gamesData.data || gamesData.data.length === 0) return res.json([]);

        let allPasses = [];

        // 2. Recorrer juegos y buscar sus pases
        for (const game of gamesData.data) {
            const universeId = game.id;
            const passesRes = await fetch(`https://apis.roproxy.com/game-passes/v1/universes/${universeId}/game-passes?pageSize=100`);
            const passesData = await passesRes.json();

            if (passesData.gamePasses) {
                // 3. Consultar el precio real de cada pase en la API de Economía
                for (const item of passesData.gamePasses) {
                    try {
                        const ecoRes = await fetch(`https://economy.roproxy.com/v1/game-pass/${item.id}/game-pass-product-info`);
                        const ecoData = await ecoRes.json();

                        allPasses.push({
                            id: item.id,
                            name: item.name,
                            // Aquí está el truco: la API de economía usa 'PriceInRobux' con P mayúscula
                            price: ecoData.PriceInRobux || 0,
                            productId: item.productId,
                            isForSale: ecoData.IsForSale
                        });
                    } catch (e) {
                        // Si falla la economía, guardamos el pase con precio 0 para no trabar todo
                        allPasses.push({ id: item.id, name: item.name, price: 0 });
                    }
                }
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
