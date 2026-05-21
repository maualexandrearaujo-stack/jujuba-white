export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://www.tipminer.com/br/historico/blaze/double"
    );

    const html = await response.text();

    res.status(200).send(html);
  } catch (e) {
    res.status(500).json({
      error: "erro ao buscar tipminer",
    });
  }
}