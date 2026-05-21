import React, { useEffect, useMemo, useState } from "react";
const API_HISTORY_URL = "https://blaze.com/api/roulette_games/history";
const API_RECENT_URL = "https://blaze.com/api/roulette_games/recent" ;


const corPorCodigo = (color) => {
  if (Number(color) === 0) return "⚪ Branco";
  if (Number(color) === 1) return "🔴 Vermelho";
  if (Number(color) === 2) return "⚫ Preto";
  return "—";
};

const corClasse = (cor) => {
  if (cor?.includes("Vermelho")) return { bg: "#dc2626", color: "#fff", border: "#ef4444" };
  if (cor?.includes("Preto")) return { bg: "#111827", color: "#fff", border: "#475569" };
  if (cor?.includes("Branco")) return { bg: "#ffffff", color: "#dc2626", border: "#e5e7eb" };
  return { bg: "#1e293b", color: "#fff", border: "#334155" };
};

const corDaPedra = (numero) => {
  const n = Number(numero);
  if (n === 0) return "⚪ Branco";
  if (n >= 1 && n <= 7) return "🔴 Vermelho";
  if (n >= 8 && n <= 14) return "⚫ Preto";
  return "—";
};

const horaBR = (iso) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const addMin = (hora, min) => {
  if (!hora || !hora.includes(":")) return "—";
  const [h, m] = hora.split(":").map(Number);
  const d = new Date(2026, 0, 1, h, m + Number(min));
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const horaParaMinutos = (hora) => {
  if (!hora || !hora.includes(":")) return 0;
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

const diffMin = (alvo, atual) => {
  let d = horaParaMinutos(alvo) - horaParaMinutos(atual);
  if (d < -720) d += 1440;
  if (d > 720) d -= 1440;
  return d;
};

const falar = (texto) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const voz = new SpeechSynthesisUtterance(texto);
  voz.lang = "pt-BR";
  voz.rate = 1.05;
  window.speechSynthesis.speak(voz);
};

const tocarSomIA = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    [520, 680, 860].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.08 + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.14);
    });
  } catch {}
};

function analisarCorIA(dados) {
  const ultimo = dados[dados.length - 1];

  if (!ultimo || dados.length < 30) {
    return {
      titulo: "Estratégia Cor",
      hora: "—",
      cor: "⏸️ Aguardar",
      texto: "Pouco histórico para análise.",
      forca: 0,
    };
  }

  const base = dados.slice(-60).filter((x) => !x.cor.includes("Branco"));
  const ult12 = base.slice(-12);
  const ult8 = base.slice(-8);
  const ult4 = base.slice(-4);

  const alternancias = ult12.filter((x, i, arr) => i > 0 && x.cor !== arr[i - 1].cor).length;
  if (alternancias >= 8) {
    return {
      titulo: "Estratégia Cor",
      hora: addMin(ultimo.hora, 1),
      cor: "⏸️ Aguardar",
      texto: "Mercado alternando. Sem entrada.",
      forca: 55,
    };
  }

  const vermelho = ult12.filter((x) => x.cor.includes("Vermelho")).length + ult8.filter((x) => x.cor.includes("Vermelho")).length;
  const preto = ult12.filter((x) => x.cor.includes("Preto")).length + ult8.filter((x) => x.cor.includes("Preto")).length;

  let cor = vermelho >= preto ? "🔴 Vermelho" : "⚫ Preto";
  let margem = Math.abs(vermelho - preto);
  let forca = Math.min(96, Math.max(70, 78 + margem * 4));

  const surf =
    ult4.length === 4 &&
    ult4.every((x) => x.cor === ult4[0].cor) &&
    !ult4[0].cor.includes("Branco");

  if (surf) {
    cor = ult4[0].cor;
    forca = 94;
  }

  if (forca < 80) {
    return {
      titulo: "Estratégia Cor",
      hora: addMin(ultimo.hora, 1),
      cor: "⏸️ Aguardar",
      texto: "Filtro abaixo de 80%. Sem entrada.",
      forca,
    };
  }

  return {
    titulo: "Estratégia Cor",
    hora: addMin(ultimo.hora, 1),
    cor: `${cor} + ⚪ Branco`,
    texto: surf ? "Tendência de surf. Mesma cor + G1." : "Entrada + G1",
    forca,
    g1Hora: addMin(ultimo.hora, 1),
  };
}

function analisarBrancoIA(dados) {
  const historico = [...dados].slice(-500);
  const ultimo = historico[historico.length - 1];

  if (!ultimo || historico.length < 80) {
    return {
      titulo: "Estratégia Branco",
      hora: "—",
      cor: "⏸️ Aguardar",
      texto: "Aguardando histórico maior para branco.",
      forca: 0,
    };
  }

  const brancos = historico
    .map((item, index) => ({ ...item, index }))
    .filter((x) => x.cor.includes("Branco"));

  if (brancos.length < 3) {
    return {
      titulo: "Estratégia Branco",
      hora: "—",
      cor: "⏸️ Aguardar",
      texto: "Poucos brancos nos 500 históricos. Aguardar.",
      forca: 0,
    };
  }

  const gapsCasas = [];
  for (let i = 1; i < brancos.length; i++) {
    gapsCasas.push(brancos[i].index - brancos[i - 1].index);
  }

  const ultimosGaps = gapsCasas.slice(-6);
  const mediaCasas =
    ultimosGaps.reduce((acc, n) => acc + n, 0) / Math.max(1, ultimosGaps.length);

  const gapsOrdenados = [...ultimosGaps].sort((a, b) => a - b);
  const medianaCasas = gapsOrdenados[Math.floor(gapsOrdenados.length / 2)] || mediaCasas;

  const ultimoBranco = brancos[brancos.length - 1];
  const atrasoCasas = historico.length - 1 - ultimoBranco.index;

  // Leitura de espaçamento: usa média + mediana dos últimos ciclos de branco.
  const alvoCasas = Math.round((mediaCasas * 0.6) + (medianaCasas * 0.4));
  let casasRestantes = alvoCasas - atrasoCasas;

  // Se ainda está muito cedo no ciclo, não força branco de 1 minuto.
  if (casasRestantes > 18) {
    return {
      titulo: "Estratégia Branco",
      hora: "—",
      cor: "⏸️ Aguardar",
      texto: "Branco ainda longe pelo espaçamento dos 500 históricos.",
      forca: Math.max(55, Math.min(78, Math.round(70 + atrasoCasas / 3))),
    };
  }

  // Se passou do ponto médio, procura uma janela sniper, nunca minuto imediato aleatório.
  casasRestantes = Math.max(4, Math.min(26, casasRestantes <= 0 ? Math.round(mediaCasas * 0.25) : casasRestantes));

  // 2 casas por minuto.
  const minutosProjetados = Math.max(2, Math.round(casasRestantes / 2));

  // Ajuste por coluna/minuto: usa os minutos em que brancos costumaram cair.
  const minutosBranco = brancos.map((b) => Number(b.hora.split(":")[1]));
  const freqMinuto = {};
  minutosBranco.forEach((m) => {
    const chave = m % 10;
    freqMinuto[chave] = (freqMinuto[chave] || 0) + 1;
  });

  const melhorFinal = Object.entries(freqMinuto).sort((a, b) => b[1] - a[1])[0]?.[0];
  let horaEntrada = addMin(ultimo.hora, minutosProjetados);

  if (melhorFinal !== undefined) {
    // Procura dentro dos próximos 12 minutos um minuto com final forte de branco.
    let melhorHora = horaEntrada;
    let melhorDist = 999;

    for (let add = 2; add <= 14; add++) {
      const h = addMin(ultimo.hora, add);
      const final = Number(h.split(":")[1]) % 10;
      const dist = Math.abs(add - minutosProjetados);

      if (String(final) === String(melhorFinal) && dist < melhorDist) {
        melhorHora = h;
        melhorDist = dist;
      }
    }

    horaEntrada = melhorHora;
  }

  const consistencia = Math.max(0, 100 - Math.round(Math.abs(mediaCasas - medianaCasas) * 2));
  const forca = Math.max(85, Math.min(97, Math.round(85 + brancos.length / 4 + consistencia / 15)));

  return {
    titulo: "Estratégia Branco",
    hora: horaEntrada,
    cor: "⚪ Branco",
    texto: "Branco Sniper IA: 500 históricos analisados.",
    forca,
    g1Hora: addMin(horaEntrada, 1),
  };
}

function gerarListaCores(dados, tipo = "mista") {
  const sinais = [];
  const ultimo = dados[dados.length - 1];

  if (!ultimo) return [];

  const espacamentos = [2, 4, 7, 10, 13, 17, 21, 25, 30, 35];

  espacamentos.forEach((m, i) => {
    let cor = "🔴 Vermelho + ⚪ Branco";

    if (tipo === "preta") {
      cor = "⚫ Preto + ⚪ Branco";
    }

    if (tipo === "mista") {
      cor = i % 2 === 0 ? "🔴 Vermelho + ⚪ Branco" : "⚫ Preto + ⚪ Branco";
    }

    sinais.push({
      titulo: `Sinal ${i + 1}`,
      hora: addMin(ultimo.hora, m),
      cor,
      texto: "Entrada + G1",
      forca: (98.90 - i * 0.37).toFixed(2),
      g1Hora: addMin(ultimo.hora, m + 1),
    });
  });

  return sinais;
}



function analisarEstrategiaOuro2(dados) {
  if (!dados || dados.length === 0) {
    return {
      titulo: "🏆 Estratégia de Ouro 2",
      hora: "—",
      cor: "⏸️ Aguardar",
      texto: "Sem histórico.",
      forca: 0,
    };
  }

  const grupos = {};

  dados.forEach((item) => {
    if (!grupos[item.hora]) grupos[item.hora] = [];
    grupos[item.hora].push(item);
  });

  const candidatos = [];

  Object.entries(grupos).forEach(([hora, lista]) => {
    const minuto = Number(hora.split(":")[1]);

    const casa9 = minuto === 9 || minuto === 19 || minuto === 29 || minuto === 39 || minuto === 49 || minuto === 59;

    if (casa9 && lista.length > 0) {
      candidatos.push({
        base: lista[lista.length - 1],
        hora
      });
    }
  });

  if (!candidatos.length) {
    return {
      titulo: "🏆 Estratégia de Ouro 2",
      hora: "—",
      cor: "⏸️ Aguardar",
      texto: "Aguardando final 09.",
      forca: 0,
    };
  }

  const ultimo = candidatos[candidatos.length - 1];
  const numero = Number(ultimo.base.numero);

  const horaEntrada = addMin(ultimo.hora, numero);
  const corBase = corDaPedra(numero);

  const cor = corBase.includes("Branco")
    ? "⚪ Branco"
    : `${corBase} + ⚪ Branco`;

  return {
    titulo: "🏆 Estratégia de Ouro 2",
    hora: horaEntrada,
    cor,
    texto: "Final 09.",
    forca: 99,
    g1Hora: addMin(horaEntrada, 1),
  };
}


function analisarEstrategiaOuro(dados) {
  if (!dados || dados.length === 0) {
    return {
      titulo: "🏆 Estratégia de Ouro",
      hora: "—",
      cor: "⏸️ Aguardar",
      texto: "Sem histórico.",
      forca: 0,
    };
  }

  const grupos = {};

  dados.forEach((item) => {
    if (!grupos[item.hora]) grupos[item.hora] = [];
    grupos[item.hora].push(item);
  });

  const candidatos = [];

  Object.entries(grupos).forEach(([hora, lista]) => {
    if (!lista || lista.length === 0) return;

    const minuto = Number(hora.split(":")[1]);

    const casa0 = minuto === 0 || minuto === 10 || minuto === 20 || minuto === 30 || minuto === 40 || minuto === 50;
    const casa9 = minuto === 9 || minuto === 19 || minuto === 29 || minuto === 39 || minuto === 49 || minuto === 59;

    if (casa0) {
      candidatos.push({ base: lista[0], hora });
    }

    if (casa9) {
      candidatos.push({ base: lista[lista.length - 1], hora });
    }
  });

  if (!candidatos.length) {
    return {
      titulo: "🏆 Estratégia de Ouro",
      hora: "—",
      cor: "⏸️ Aguardar",
      texto: "Aguardando sinal.",
      forca: 0,
    };
  }

  const ultimoCandidato = candidatos[candidatos.length - 1];
  const pedra = ultimoCandidato.base;
  const numero = Number(pedra.numero);
  const horaEntrada = addMin(ultimoCandidato.hora, numero);
  const corBase = corDaPedra(numero);

  const cor = corBase.includes("Branco") ? "⚪ Branco" : `${corBase} + ⚪ Branco`;

  return {
    titulo: "🏆 Estratégia de Ouro",
    hora: horaEntrada,
    cor,
    texto: "Estratégia de Ouro.",
    forca: 99,
    g1Hora: addMin(horaEntrada, 1),
  };
}


export default function App() {
  const [dados, setDados] = useState([]);
  const [status, setStatus] = useState("Aguardando conexão...");
  const [auto, setAuto] = useState(true);
  const [tick, setTick] = useState(0);
  const [audio, setAudio] = useState(true);
  const [sinais, setSinais] = useState([]);
  const [listaSinais, setListaSinais] = useState([]);
  const [listaPos, setListaPos] = useState({ x: window.innerWidth - 340, y: 110 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [listaVisible, setListaVisible] = useState(true);
  const [listaMinimizada, setListaMinimizada] = useState(false);
  const [cooldowns, setCooldowns] = useState({
    cor: 0,
    branco: 0,
    lista: 0,
  });

  const iniciarDrag = (e) => {
    if (e.target.closest("button")) return;

    setDragging(true);
    setDragOffset({
      x: e.clientX - listaPos.x,
      y: e.clientY - listaPos.y,
    });
  };

  const moverLista = (e) => {
    if (!dragging) return;

    setListaPos({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const pararDrag = () => {
    setDragging(false);
  };

  const carregar = async () => {
    try {
      setStatus(`Buscando resultados... ${new Date().toLocaleTimeString()}`);

      let resposta = await fetch(`${API_HISTORY_URL}?t=${Date.now()}`, { cache: "no-store" });
      if (!resposta.ok) resposta = await fetch(`${API_RECENT_URL}?t=${Date.now()}`, { cache: "no-store" });

      const json = await resposta.json();
      const lista = Array.isArray(json) ? json : [];

      const formatado = lista
        .map((item) => ({
          id: item.id,
          numero: Number(item.roll),
          cor: corPorCodigo(item.color),
          hora: horaBR(item.created_at),
          created_at: item.created_at,
        }))
        .filter((x) => x.numero >= 0 && x.numero <= 14)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      setDados(formatado);
      setTick((v) => v + 1);

      const ultimo = formatado[formatado.length - 1];

      setStatus(`On-line • ${formatado.length} resultados • Último: ${ultimo?.numero ?? "—"} às ${ultimo?.hora ?? "—"} • Auto ${auto ? "ON" : "OFF"}`);
    } catch (e) {
      setStatus("Conectando ao radar online...")
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", moverLista);
    window.addEventListener("mouseup", pararDrag);

    return () => {
      window.removeEventListener("mousemove", moverLista);
      window.removeEventListener("mouseup", pararDrag);
    };
  }, [dragging, dragOffset]);

  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(() => carregar(), 2000);
    return () => clearInterval(timer);
  }, [auto]);

  useEffect(() => {
    const t = setInterval(() => {
      setCooldowns((c) => ({
        cor: Math.max(0, c.cor - 1),
        branco: Math.max(0, c.branco - 1),
        lista: Math.max(0, c.lista - 1),
      }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const ultimos = useMemo(() => [...dados].slice(-500).reverse(), [dados]);

  const resumo = useMemo(() => {
    return {
      total: ultimos.length,
      vermelho: ultimos.filter((x) => x.cor.includes("Vermelho")).length,
      preto: ultimos.filter((x) => x.cor.includes("Preto")).length,
      branco: ultimos.filter((x) => x.cor.includes("Branco")).length,
    };
  }, [ultimos]);

  const removerSinal = (id, tipo = "normal") => {
    const idStr = String(id);

    if (tipo === "lista") {
      setListaSinais((atual) =>
        atual.filter((s) => String(s.id) !== idStr)
      );
      return;
    }

    setSinais((atual) =>
      atual.filter((s) => String(s.id) !== idStr)
    );
  };

  const adicionarSinal = (sinal) => {
    if (!sinal) return;

    setSinais((atual) => {
      if (sinal.cor.includes("Aguardar")) {
        return [
          {
            ...sinal,
            id: `normal-${Date.now()}-${sinal.hora}-${sinal.cor}`,
          },
          ...atual,
        ].slice(0, 20);
      }

      const existe = atual.some((x) => x.hora === sinal.hora && x.cor === sinal.cor && x.titulo === sinal.titulo);
      if (existe) return atual;

      return [
        {
          ...sinal,
          id: `normal-${Date.now()}-${sinal.hora}-${sinal.cor}`,
        },
        ...atual,
      ].slice(0, 20);
    });
  };

  const clicar = (tipo) => {
    tocarSomIA();

    let sinal = null;
    let novos = [];
    if (tipo === "cor") sinal = analisarCorIA(dados);
    if (tipo === "branco") sinal = analisarBrancoIA(dados);
    if (tipo === "ouro") sinal = analisarEstrategiaOuro(dados);
    if (tipo === "ouro2") sinal = analisarEstrategiaOuro2(dados);
    if (tipo === "listaVermelha") novos = gerarListaCores(dados, "vermelha");
    if (tipo === "listaPreta") novos = gerarListaCores(dados, "preta");
    if (tipo === "listaMista") novos = gerarListaCores(dados, "mista");

    if (tipo === "listaVermelha" || tipo === "listaPreta" || tipo === "listaMista") {
      setListaSinais((atual) => [...novos.map((x, i) => ({ ...x, id: `lista-${Date.now()}-${i}-${x.hora}-${x.cor}` })), ...atual].slice(0, 30));
      if (audio) falar(novos.length ? "Lista de cores liberada." : "Sem histórico carregado.");
    } else {
      adicionarSinal(sinal);

      if (audio && sinal) {
        let frase = sinal.titulo && sinal.titulo.includes("Branco") ? `Às ${sinal.hora}, entrada no branco. Branco Sniper IA.` : `Às ${sinal.hora}, entrada no branco.`;

        if (sinal.cor.includes("Vermelho")) {
          frase = `Às ${sinal.hora}, entrada no vermelho com proteção do branco.`;
        }

        if (sinal.cor.includes("Preto")) {
          frase = `Às ${sinal.hora}, entrada no preto com proteção do branco.`;
        }

        if (sinal.cor.includes("Branco") && !sinal.cor.includes("Vermelho") && !sinal.cor.includes("Preto")) {
          frase = `Às ${sinal.hora}, entrada no branco.`;
        }

        falar(frase);
      }
    }

    // sem cooldown visual nos botões
  };

  const btnIA = (tipo, label, style = {}) => (
    <button
      onClick={() => clicar(tipo)}
      disabled={false}
      style={{
        ...btn,
        ...style,
        opacity: 1, cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "white", padding: 22, fontFamily: "Arial" }}>
      <h1 style={{ fontSize: 46, textAlign: "center", marginBottom: 4, color: "#ef4444" }}>Jujuba White</h1>
      <h2 style={{ textAlign: "center", marginTop: 0, color: "#e5e7eb" }}>APP Jujuba White</h2>
      <p style={{ textAlign: "center", color: "#cbd5e1" }}>{status}</p>

      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 18 }}>
        <button onClick={carregar} style={btn}>Atualizar agora</button>

        <button onClick={() => setAuto(!auto)} style={{ ...btn, background: auto ? "#166534" : "#7f1d1d" }}>
          {auto ? "Ligado automaticamente" : "Desligado"}
        </button>

        <button onClick={() => setAudio(!audio)} style={btn}>
          {audio ? "Áudio LIGADO" : "Áudio DESLIGADO"}
        </button>
{btnIA("ouro", "🏆 Estratégia de Ouro", { background: "#b91c1c", borderColor: "#ef4444" })}
        {btnIA("ouro2", "🏆 Estratégia de Ouro 2", { background: "#b91c1c", borderColor: "#ef4444" })}
        {btnIA("cor", "🐶 Zuba Cor IA", { background: "#312e81", borderColor: "#818cf8" })}
        {btnIA("branco", "⚪ Estratégia Branco", { background: "#ffffff", color: "#000", borderColor: "#ef4444" })}
        {btnIA("listaVermelha", "🔴 Lista Vermelha", { background: "#b91c1c", borderColor: "#ef4444" })}
        {btnIA("listaPreta", "⚫ Lista Preta", { background: "#b91c1c", borderColor: "#ef4444" })}
        {btnIA("listaMista", "🔀 Lista Mista", { background: "#b91c1c", borderColor: "#ef4444" })}

        <a href="https://www.youtube.com/@jujubawhite" target="_blank" rel="noreferrer" style={{ ...btn, background: "#b91c1c", textDecoration: "none" }}>
          ▶️ Canal YouTube
        </a>

        <span style={{ color: "#94a3b8", alignSelf: "center", fontSize: 13 }}>Ciclos: {tick}</span>
      </div>

      {listaSinais.length > 0 && listaVisible && (
        <section style={{
          ...box,
          position: "fixed",
          left: listaPos.x,
          top: listaPos.y,
          width: 320,
          maxHeight: "80vh",
          overflowY: "auto",
          zIndex: 999,
          background: "#020617ee",
          backdropFilter: "blur(6px)"
        }}>
          <div
            onMouseDown={iniciarDrag}
            style={{
              cursor: "grab",
              background: "#b91c1c",
              padding: "8px 10px",
              borderRadius: 8,
              marginBottom: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <h2 style={{ margin: 0, fontSize: 18 }}>🎯 Lista de Cores</h2>

            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setListaMinimizada(!listaMinimizada)}
                style={{
                  width: 24,
                  height: 24,
                  border: "none",
                  borderRadius: 6,
                  background: "#1d4ed8",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                {listaMinimizada ? "▢" : "—"}
              </button>

              <button
                onClick={() => setListaVisible(false)}
                style={{
                  width: 24,
                  height: 24,
                  border: "none",
                  borderRadius: 6,
                  background: "#7f1d1d",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {!listaMinimizada && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {listaSinais.map((s) => (
              <div
                key={s.id}
                style={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 10,
                  padding: "10px 12px",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10
                }}
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removerSinal(s.id, "lista");
                  }}
                  style={{
                    position: "absolute",
                    top: 5,
                    right: 5,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: "none",
                    background: "#7f1d1d",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontSize: 10,
                    fontWeight: "bold"
                  }}
                >
                  ✕
                </button>

                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ fontSize: 18, fontWeight: "bold" }}>
                    {s.hora} – {s.cor}
                  </div>

                  <div style={{ fontSize: 13, color: "#22c55e" }}>
                    {s.forca}%
                  </div>
                </div>
                
                
                
                
                
                
              </div>
            ))}
          </div>
        )}
        </section>
      )}

      {!listaVisible && (
        <button
          onClick={() => setListaVisible(true)}
          style={{
            position: "fixed",
            right: 20,
            bottom: 20,
            zIndex: 999,
            background: "#b91c1c",
            color: "#ffffff",
            border: "none",
            borderRadius: 12,
            padding: "12px 18px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          🎯 Abrir Lista
        </button>
      )}

      
      {sinais.length > 0 && (
        <section style={box}>
          <h2>📢 Sinais IA</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            {sinais.map((s) => (
              <div
                key={s.id}
                style={{
                  background: "#020617",
                  border: "1px solid #334155",
                  borderRadius: 14,
                  padding: 16,
                  position: "relative"
                }}
              >
                <button
                  onClick={() => removerSinal(s.id)}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 20,
                    height: 20,
                    border: "none",
                    borderRadius: "50%",
                    background: "#7f1d1d",
                    color: "#ffffff",
                    cursor: "pointer"
                  }}
                >
                  ✕
                </button>

                <div style={{ color: "#93c5fd", fontSize: 13 }}>
                  {s.titulo}
                </div>

                <div style={{ fontSize: 28, fontWeight: "bold", marginTop: 6 }}>
                  {s.hora}
                </div>

                <div style={{ marginTop: 8, fontSize: 18 }}>
                  {s.cor}
                </div>

                <div style={{ marginTop: 10, color: "#22c55e", fontWeight: "bold" }}>
                  {s.forca}%
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 18 }}>
        <CardInfo titulo="Lido total" valor={resumo.total} cor="#38bdf8" />
        <CardInfo titulo="Vermelho" valor={resumo.vermelho} cor="#ef4444" />
        <CardInfo titulo="Preto" valor={resumo.preto} cor="#94a3b8" />
        <CardInfo titulo="Branco" valor={resumo.branco} cor="#fff" />
      </div>

      <section style={box}>
        <h2>🔴⚫⚪ Histórico em tempo real - 500 casas</h2>
        <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 8 }}>Pedras válidas: 0 a 14</div>
        <div style={{ color: "#cbd5e1", fontSize: 13, marginBottom: 10 }}>
          Último resultado: <b>{ultimos[0]?.numero ?? "—"}</b> às <b>{ultimos[0]?.hora ?? "—"}</b> • Atualiza automático
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, minmax(54px, 1fr))", gap: 10 }}>
          {ultimos.slice(0, 500).map((item, i) => {
            const st = corClasse(item.cor);

            return (
              <div
                key={`${item.id}-${item.hora}-${i}`}
                title={`${item.numero} • ${item.hora}`}
                style={{
                  background: st.bg,
                  color: st.color,
                  border: `1px solid ${st.border}`,
                  borderRadius: 12,
                  padding: 8,
                  textAlign: "center",
                  fontWeight: "bold",
                  minHeight: 58,
                }}
              >
                <div style={{ fontSize: 24 }}>{item.numero === 0 ? "J" : item.numero}</div>
                <div style={{ fontSize: 11, marginTop: 3 }}>{item.hora}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function CardInfo({ titulo, valor, cor }) {
  return (
    <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 14, padding: 16, textAlign: "center" }}>
      <div style={{ color: "#cbd5e1", fontSize: 13 }}>{titulo}</div>
      <div style={{ color: cor, fontSize: 34, fontWeight: "bold" }}>{valor}</div>
    </div>
  );
}

const btn = {
  background: "#b91c1c",
  color: "#ffffff",
  border: "1px solid #ef4444",
  borderRadius: 8,
  padding: "10px 14px",
  fontWeight: "bold",
};

const box = {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 16,
  padding: 18,
  marginBottom: 18,
};

const box2 = {
  background: "#020617",
  border: "1px solid #334155",
  borderRadius: 16,
  padding: 16,
};

