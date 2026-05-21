export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://www.tipminer.com/br/historico/blaze/double"
    );

    const html = await response.text();

    const numeros = [...html.matchAll(/\/(\d+)\.svg/g)];

    const resultados = numeros.map((m) => {
      const numero = Number(m[1]);

      return {
        numero,
        cor:
          numero === 0
            ? "Branco"
            : numero <= 7
            ? "Vermelho"
            : "Preto",
      };
    });

    res.status(200).json(resultados.slice(0, 200));
  } catch (e) {
    res.status(500).json({
      erro: e.message,
    });
  }
}