// retos.js (CommonJS)
// Módulo simple en memoria para entregar retos por nivel y validar respuestas.

const niveles = ["fácil", "medio", "difícil"];

/** Catálogo de retos por nivel */
const banco = {
  fácil: [
    {
      id: "f1",
      pregunta: "¿Cuánto es 2 + 2?",
      opciones: ["3", "4", "5", "22"],
      correcta: "4",
      explicacion: "2 + 2 = 4."
    },
    {
      id: "f2",
      pregunta: "Selecciona la palabra que rima con 'casa'",
      opciones: ["taza", "coche", "luz", "taza "], // la última tiene espacio intencional para ver normalización
      correcta: "taza",
      explicacion: "“Casa” rima con “taza”."
    },
  ],
  medio: [
    {
      id: "m1",
      pregunta: "¿Qué devuelve  'hola'.toUpperCase()  en JavaScript?",
      opciones: ["'HOLA'", "'Hola'", "'hola'", "Error"],
      correcta: "'HOLA'",
      explicacion: "toUpperCase convierte todas las letras a mayúsculas."
    },
    {
      id: "m2",
      pregunta: "¿Cuál es la capital de Chile?",
      opciones: ["Lima", "Bogotá", "Santiago", "Quito"],
      correcta: "Santiago",
      explicacion: "La capital de Chile es Santiago."
    },
  ],
  difícil: [
    {
      id: "d1",
      pregunta: "Completa:  Fibonacci empieza 0, 1, 1, 2, 3, __",
      opciones: ["3", "5", "6", "8"],
      correcta: "5",
      explicacion: "0,1,1,2,3,5… cada término es la suma de los dos anteriores."
    },
    {
      id: "d2",
      pregunta: "Si x=3, y=2: evalúa  x**y + y**x  (JS)",
      opciones: ["13", "17", "5", "12"],
      correcta: "17",
      explicacion: "3**2=9 y 2**3=8; 9+8=17."
    },
  ],
};

/** Devuelve un reto aleatorio del nivel indicado */
function getReto(nivel = "fácil") {
  const key = normalizaNivel(nivel);
  const pool = banco[key] || banco.fácil;
  const reto = pool[Math.floor(Math.random() * pool.length)];
  return { ...reto, nivel: key };
}

/** Verifica si el texto del usuario coincide con la respuesta */
function verificarRespuesta(reto, textoUsuario) {
  if (!reto) return { correcta: false, detalle: "No hay reto activo." };
  const a = normalizaTexto(textoUsuario);
  const b = normalizaTexto(reto.correcta);
  return {
    correcta: a === b,
    detalle: a === b ? "¡Correcto!" : `Incorrecto. Respuesta correcta: ${reto.correcta}.`,
  };
}

/** Normaliza texto para comparación robusta */
function normalizaTexto(t = "") {
  return String(t)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // quita acentos
}

/** Asegura que el nivel exista */
function normalizaNivel(n) {
  const t = normalizaTexto(n);
  if (t.startsWith("fac")) return "fácil";
  if (t.startsWith("med")) return "medio";
  if (t.startsWith("dif")) return "difícil";
  return "fácil";
}

module.exports = { niveles, getReto, verificarRespuesta };