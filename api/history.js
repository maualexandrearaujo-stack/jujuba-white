export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://www.tipminer.com/br/historico/blaze/double"
    );

    const html = await response.text();

    const resultados = [];

    const regex = /(\d{1,2})\s*(vermelho|preto|branco)/gi;

    let match;

    while ((match = regex.exec(html)) !== null) {
      resultados.push({
        numero: Number(match[1]),
        cor:
          match[2].toLowerCase() === "vermelho"
            ? "Vermelho"
            : match[2].toLowerCase() === "preto"
            ? "Preto"
            : "Branco",
      });
    }

    res.status(200).json(resultados.slice(0, 100));
  } catch (e) {
    res.status(500).json({
      erro: e.message,
    });
  }
}