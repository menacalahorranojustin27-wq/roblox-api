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
for (const game of gamesData.data) {
            const universeId = game.id;

            // 1. Obtenemos la lista de pases (esto ya te funciona)
            const passesRes = await fetch(`https://apis.roproxy.com/game-passes/v1/universes/${universeId}/game-passes?pageSize=100`);
            const passesData = await passesRes.json();

            if (passesData && passesData.gamePasses) {
                // 2. Para cada pase, vamos a "forzar" la lectura del precio real
                const pasesConPrecioReal = await Promise.all(passesData.gamePasses.map(async (item) => {
                    try {
                        // Consultamos la API de economía individual (la que no miente con el precio)
                        const detailRes = await fetch(`https://economy.roproxy.com/v1/game-pass/${item.id}/game-pass-product-info`);
                        const detailData = await detailRes.json();

                        return {
                            id: item.id,
                            name: item.name,
                            // Si la API de economía tiene el precio, lo usamos; si no, el de la lista original
                            price: detailData.PriceInRobux || item.price || 0,
                            productId: item.productId,
                            isForSale: detailData.IsForSale || item.isForSale
                        };
                    } catch (e) {
                        // Si falla la segunda API, devolvemos lo que tengamos
                        return {
                            id: item.id,
                            name: item.name,
                            price: item.price || 0,
                            productId: item.productId,
                            isForSale: item.isForSale
                        };
                    }
                }));

                allPasses = allPasses.concat(pasesConPrecioReal);
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
