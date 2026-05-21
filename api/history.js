export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://blaze.com/api/roulette_games/recent"
    );

    const data = await response.json();

    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({
      error: "erro ao buscar blaze",
    });
  }
}