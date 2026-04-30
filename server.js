const express = require("express");
const fetch = require("node-fetch");

const app = express();

app.get("/getpasses", async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.json([]);

    try {
        // 1. Usamos ROPIROXY para saltar el bloqueo de Render
        const gamesRes = await fetch(`https://games.roproxy.com/v2/users/${userId}/games?accessFilter=Public&limit=10`);
        const gamesData = await gamesRes.json();

        // Si la API de juegos falla o viene vacía, devolvemos el error para saber qué pasa
        if (!gamesData.data || gamesData.data.length === 0) {
            return res.json({ error: "No se detectaron juegos públicos", raw: gamesData });
        }

        let allPasses = [];

        for (const game of gamesData.data) {
            const universeId = game.id; // En esta API, el 'id' es el Universe ID

            // 2. También usamos ROPROXY aquí
            const passesRes = await fetch(`https://games.roproxy.com/v1/games/${universeId}/game-passes?limit=100`);
            const passesData = await passesRes.json();

            if (passesData.data && passesData.data.length > 0) {
                const passes = passesData.data.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price || 0
                }));
                allPasses = allPasses.concat(passes);
            }
        }

        res.json(allPasses);

    } catch (err) {
        console.log("Error en la API:", err);
        res.json({ error: "Error de conexión", detall: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("API Online"));
