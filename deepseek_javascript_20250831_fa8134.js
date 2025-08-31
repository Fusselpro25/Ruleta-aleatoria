// Variables globales
const canvas = document.getElementById('ruleta');
const ctx = canvas.getContext('2d');
const centroX = canvas.width / 2;
const centroY = canvas.height / 2;
const radio = canvas.width / 2 - 10;

// Opciones con probabilidades diferentes
// Beso y Abrazo tienen 3 veces más probabilidades que las demás opciones
const opciones = [
    "Beso", "Beso", "Beso",           // 3 entradas para Beso (25%)
    "Abrazo", "Abrazo", "Abrazo",     // 3 entradas para Abrazo (25%)
    "1$", "Cachetada", "Caricia",     // 1 entrada para cada uno (8.3% c/u)
    "Regalo", "Piropo", "Chiste"      // 1 entrada para cada uno (8.3% c/u)
];

const colores = [
    "#FF6384", "#FF6384", "#FF6384",      // Beso - Rosa
    "#36A2EB", "#36A2EB", "#36A2EB",      // Abrazo - Azul
    "#FFCE56", "#4BC0C0", "#9966FF",      // 1$, Cachetada, Caricia
    "#FF9F40", "#8BC34A", "#E91E63"       // Regalo, Piropo, Chiste
];

let angulo = 0;
let velocidad = 0;
let girando = false;
let sonidoActivo = true;

// Elementos DOM
const btnGirar = document.getElementById("girar");
const resultadoElem = document.getElementById("resultado");
const sonidoCheck = document.getElementById("sonidoCheck");

// Control de sonido
sonidoCheck.addEventListener('change', function() {
    sonidoActivo = this.checked;
});

// Efectos de sonido (simulados con AudioContext)
function playSonidoGiro() {
    if (!sonidoActivo) return;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 2);
    } catch (e) {
        console.log("Error de audio:", e);
    }
}

function playSonidoResultado() {
    if (!sonidoActivo) return;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // Nota Do
        
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log("Error de audio:", e);
    }
}

// Dibujar la ruleta
function dibujarRuleta() {
    const numOpciones = opciones.length;
    const anguloPorSegmento = (2 * Math.PI) / numOpciones;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < numOpciones; i++) {
        const inicio = angulo + i * anguloPorSegmento;
        const fin = inicio + anguloPorSegmento;

        // Crear gradiente para cada segmento
        const grad = ctx.createRadialGradient(centroX, centroY, radio * 0.3, centroX, centroY, radio);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(1, colores[i % colores.length]);
        ctx.fillStyle = grad;

        // Dibujar segmento
        ctx.beginPath();
        ctx.moveTo(centroX, centroY);
        ctx.arc(centroX, centroY, radio, inicio, fin);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dibujar texto
        ctx.save();
        ctx.translate(centroX, centroY);
        ctx.rotate(inicio + anguloPorSegmento / 2);
        ctx.fillStyle = "#000";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "right";
        ctx.fillText(opciones[i], radio - 15, 5);
        ctx.restore();
    }

    // Dibujar centro de la ruleta
    ctx.beginPath();
    ctx.arc(centroX, centroY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = "#ff5722";
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.stroke();
}

// Animación de giro
function animar() {
    if (velocidad > 0.001) {
        angulo += velocidad;
        velocidad *= 0.98; // Reducir velocidad gradualmente
        dibujarRuleta();
        requestAnimationFrame(animar);
    } else if (girando) {
        girando = false;
        mostrarResultado();
    }
}

// Mostrar resultado
function mostrarResultado() {
    const numOpciones = opciones.length;
    const anguloPorSegmento = (2 * Math.PI) / numOpciones;
    
    // Calcular el ángulo normalizado (entre 0 y 2π)
    let anguloNormalizado = (2 * Math.PI - (angulo % (2 * Math.PI))) % (2 * Math.PI);
    
    // Calcular el índice basado en el ángulo (considerando que la flecha está en la parte superior)
    let indice = Math.floor(anguloNormalizado / anguloPorSegmento);
    indice = (numOpciones - indice) % numOpciones;
    
    // Mostrar resultado con animación
    resultadoElem.textContent = "Girando...";
    
    setTimeout(() => {
        resultadoElem.textContent = "Resultado: " + opciones[indice];
        resultadoElem.style.animation = "none";
        setTimeout(() => {
            resultadoElem.style.animation = "pulse 0.5s";
        }, 10);
        playSonidoResultado();
    }, 500);
    
    // Habilitar el botón nuevamente
    btnGirar.disabled = false;
}

// Evento para girar la ruleta
btnGirar.addEventListener("click", () => {
    if (!girando) {
        girando = true;
        btnGirar.disabled = true;
        resultadoElem.textContent = "";
        velocidad = Math.random() * 0.2 + 0.2; // Velocidad aleatoria
        playSonidoGiro();
        animar();
    }
});

// Inicializar ruleta
dibujarRuleta();