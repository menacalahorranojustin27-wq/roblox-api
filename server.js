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

        // 2. Recorrer juegos
        for (const game of gamesData.data) {
            const universeId = game.id;
            
            // 3. Obtener lista de pases
            const passesRes = await fetch(`https://apis.roproxy.com/game-passes/v1/universes/${universeId}/game-passes?pageSize=100`);
            const passesData = await passesRes.json();

            if (passesData && passesData.gamePasses) {
                // --- TRUCO DE VELOCIDAD: Preguntamos todos los precios A LA VEZ ---
                const promesasPrecios = passesData.gamePasses.map(async (item) => {
                    try {
                        const ecoRes = await fetch(`https://economy.roproxy.com/v1/game-pass/${item.id}/game-pass-product-info`);
                        const ecoData = await ecoRes.json();
                        
                        const price =
                            ecoData.PriceInRobux ??
                            ecoData.priceInRobux ??
                            item.price ??
                            item.priceInRobux ??
                            0;
                        console.log("Respuesta economía:", ecoData);
                        return {
                            id: item.id,
                            name: item.name,
                            price: price,
                            productId: item.productId,
                            isForSale: ecoData.IsForSale ?? item.isForSale ?? false
                        };
                    } catch (e) {
                        return null; // Si uno falla, lo ignoramos
                    }
                });

                // Esperamos a que todas las preguntas de precios terminen juntas
                const resultados = await Promise.all(promesasPrecios);
                allPasses = allPasses.concat(resultados.filter(p => p !== null));
            }
        }

        res.json(allPasses);

    } catch (err) {
        console.error("Error total:", err);
        res.status(500).json({ error: "Error en la conexión con Roblox" });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor activo en puerto " + PORT));
