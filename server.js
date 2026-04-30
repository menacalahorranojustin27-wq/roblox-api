const express = require("express");
const fetch = require("node-fetch");

const app = express();

app.get("/getpasses", async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.json({ error: "Falta el userId en la URL" });

    try {
        // 1. Obtener juegos usando RoProxy
        const gamesRes = await fetch(`https://games.roproxy.com/v2/users/${userId}/games?accessFilter=Public&limit=10`);
        const gamesData = await gamesRes.json();

        if (!gamesData.data || gamesData.data.length === 0) {
            return res.json({ 
                status: "Error", 
                message: "Roblox no devolvió juegos. ¿Tu inventario es público?",
                debug_roblox_response: gamesData 
            });
        }

        let allPasses = [];
        let logDeBusqueda = [];

        // 2. Recorrer juegos
        for (const game of gamesData.data) {
            const universeId = game.id; // El ID que pasaste antes
            
            const passesRes = await fetch(`https://games.roproxy.com/v1/games/${universeId}/game-passes?limit=100`);
            const passesData = await passesRes.json();

            logDeBusqueda.push({
                juego: game.name,
                universeId: universeId,
                pasesEncontrados: passesData.data ? passesData.data.length : 0
            });

            if (passesData.data && passesData.data.length > 0) {
                const passes = passesData.data.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price || 0,
                    image: item.iconId // Por si quieres mostrar la imagen después
                }));
                allPasses = allPasses.concat(passes);
            }
        }

        // Si sigue vacío, te mostrará el log de qué intentó buscar
        if (allPasses.length === 0) {
            return res.json({
                status: "Vacio",
                message: "Se encontraron juegos pero ningún pase dentro de ellos.",
                intentos: logDeBusqueda
            });
        }

        res.json(allPasses);

    } catch (err) {
        res.status(500).json({ error: "Error interno", detalle: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor corriendo"));
