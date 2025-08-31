// ===== Ruleta con truco camuflado y parada precisa =====
const canvas = document.getElementById('ruleta');
const ctx = canvas.getContext('2d');
const centroX = canvas.width / 2;
const centroY = canvas.height / 2;
const radio = canvas.width / 2 - 10;

const opciones = ["Beso", "Tira otra vez", "Abrazo", "Cachetada", "Caricia", "Regalo", "Piropo", "Chiste"];
const colores = ["#FF6384","#36A2EB","#FFCE56","#4BC0C0","#9966FF","#FF9F40","#8BC34A","#E91E63"];

// Pesos: más = más probabilidad, menos = menos probabilidad
const pesos = [3, 1, 3, 2, 2, 1, 2, 2];

// Audio
const sonidoGiro = new Audio("audio/spin.wav");
const sonidoResultado = new Audio("audio/win.wav");

let angulo = 0;               // ángulo actual (radianes)
let girando = false;

let indiceSeleccionado = null;
let anguloInicio = 0;
let anguloFinal = 0;
let tiempoInicio = 0;
let duracionGiro = 0;

const btnGirar = document.getElementById("girar");
const resultadoElem = document.getElementById("resultado");
const sonidoCheck = document.getElementById("sonidoCheck");
let sonidoActivo = true;
sonidoCheck.addEventListener('change', () => sonidoActivo = sonidoCheck.checked);

function playSonidoGiro() {
    if (sonidoActivo) { try { sonidoGiro.currentTime = 0; sonidoGiro.play(); } catch(e){} }
}
function playSonidoResultado() {
    if (sonidoActivo) { try { sonidoResultado.currentTime = 0; sonidoResultado.play(); } catch(e){} }
}

// Dibujo con sectores IGUALES (no se nota el truco)
function dibujarRuleta() {
    const n = opciones.length;
    const seg = (2 * Math.PI) / n;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < n; i++) {
        const inicio = angulo + i * seg;
        const fin = inicio + seg;

        const grad = ctx.createRadialGradient(centroX, centroY, radio * 0.3, centroX, centroY, radio);
        grad.addColorStop(0, "#fff");
        grad.addColorStop(1, colores[i % colores.length]);
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.moveTo(centroX, centroY);
        ctx.arc(centroX, centroY, radio, inicio, fin);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Texto centrado del sector
        ctx.save();
        ctx.translate(centroX, centroY);
        ctx.rotate(inicio + seg / 2);
        ctx.fillStyle = "#000";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "right";
        ctx.fillText(opciones[i], radio - 15, 5);
        ctx.restore();
    }

    // Centro
    ctx.beginPath();
    ctx.arc(centroX, centroY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = "#ff5722";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.stroke();
}

// Easing para parar SUAVE y exacto
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function animar(timestamp) {
    if (!girando) return;

    const t = Math.min((timestamp - tiempoInicio) / duracionGiro, 1);
    const e = easeOutCubic(t);
    angulo = anguloInicio + (anguloFinal - anguloInicio) * e;

    dibujarRuleta();

    if (t < 1) {
        requestAnimationFrame(animar);
    } else {
        girando = false;
        mostrarResultado(); // usa indiceSeleccionado predefinido
    }
}

// Sorteo ponderado oculto
function sorteoPonderado() {
    const total = pesos.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let acc = 0;
    for (let i = 0; i < opciones.length; i++) {
        acc += pesos[i];
        if (r < acc) return i;
    }
    return opciones.length - 1; // fallback
}

// Preparar animación para que PARE EXACTO en el ganador bajo la flecha
function prepararGiro(indiceGanador) {
    const n = opciones.length;
    const seg = (2 * Math.PI) / n;
    const flechaArriba = -Math.PI / 2;

    // Queremos que el CENTRO del sector ganador quede en flechaArriba
    // Centro del sector i (en coords del canvas) cuando el ángulo total es 'A':
    //    centro = A + (i + 0.5) * seg
    // Igualamos centro = flechaArriba -> Aobjetivo = flechaArriba - (i + 0.5) * seg
    const objetivoBase = flechaArriba - (indiceGanador + 0.5) * seg;

    // Elegimos vueltas extra para que pare más "natural"
    const vueltasExtra = 4 + Math.floor(Math.random() * 3); // 4..6 vueltas
    const diffActual = ((objetivoBase - (angulo % (2 * Math.PI))) + 2 * Math.PI) % (2 * Math.PI);

    anguloInicio = angulo;
    anguloFinal = angulo + diffActual + 2 * Math.PI * vueltasExtra;

    // Duración aleatoria pero razonable
    duracionGiro = 2600 + Math.random() * 1200; // 2.6s - 3.8s
    tiempoInicio = performance.now();
}

// Mostrar resultado YA seleccionado
function mostrarResultado() {
    resultadoElem.textContent = "Resultado: " + opciones[indiceSeleccionado];
    resultadoElem.style.animation = "none";
    setTimeout(() => {
        resultadoElem.style.animation = "pulse 0.5s";
    }, 10);
    playSonidoResultado();
    btnGirar.disabled = false;
}

// Evento: Girar
btnGirar.addEventListener("click", () => {
    if (girando) return;
    girando = true;
    btnGirar.disabled = true;
    resultadoElem.textContent = "";

    // 1) Elegimos ganador con PESOS (no visible)
    indiceSeleccionado = sorteoPonderado();

    // 2) Preparamos una animación que asegure que el sector ganador quede arriba
    prepararGiro(indiceSeleccionado);

    // 3) Sonido y animación
    playSonidoGiro();
    requestAnimationFrame(animar);
});

// Inicial
dibujarRuleta();
