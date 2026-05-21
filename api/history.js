export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://blaze.com/api/roulette_games/recent",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36",
          Accept: "application/json",
          Referer: "https://blaze.com/",
          Origin: "https://blaze.com",
        },
      }
    );

    const data = await response.json();

    const resultados = data.map((item) => ({
      numero: item.roll,
      cor:
        item.color === 0
          ? "Branco"
          : item.color === 1
          ? "Vermelho"
          : "Preto",
      color: item.color,
    }));

    res.status(200).json(resultados);
  } catch (e) {
    res.status(500).json({
      erro: e.message,
    });
  }
}