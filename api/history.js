export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://blaze.com/api/roulette_games/recent"
    );

    const data = await response.json();

    const formatado = data.map((item) => ({
      numero: item.roll,
      cor:
        item.color === 0
          ? "Branco"
          : item.color === 1
          ? "Vermelho"
          : "Preto",
      color: item.color,
    }));

    res.status(200).json(formatado);
  } catch (e) {
    res.status(500).json({
      erro: "erro ao buscar blaze",
      detalhe: e.message,
    });
  }
}