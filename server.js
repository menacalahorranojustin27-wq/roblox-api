const express = require("express");
const fetch = require("node-fetch");

const app = express();

app.get("/getpasses", async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.json({ error: "No userId provided" });

    try {
        // 1. Obtener juegos
        const gamesRes = await fetch(`https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=10`, {
            headers: { 'User-Agent': 'Mozilla/5.0' } // Engañamos un poco a la API
        });
        const gamesData = await gamesRes.json();

        if (!gamesData.data || gamesData.data.length === 0) {
            return res.json({ message: "No se encontraron juegos públicos", debug: gamesData });
        }

        let allPasses = [];

        for (const game of gamesData.data) {
            // Según tu JSON, el Universe ID es 'id'
            const universeId = game.id; 

            const passesRes = await fetch(`https://games.roblox.com/v1/games/${universeId}/game-passes?limit=100`, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            // Si Roblox nos bloquea, esto nos avisará en la consola de Render
            if (passesRes.status === 403) {
                console.log(`Bloqueo 403 de Roblox en el juego ${universeId}`);
                continue;
            }

            const passesData = await passesRes.json();

            if (passesData.data && passesData.data.length > 0) {
                const passes = passesData.data.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price || 0,
                    seller: game.name // Para saber de qué juego es cada pase
                }));
                allPasses = allPasses.concat(passes);
            }
        }

        res.json(allPasses);

    } catch (err) {
        console.error("Error crítico:", err);
        res.status(500).json({ error: "Error en el servidor", details: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor listo"));
