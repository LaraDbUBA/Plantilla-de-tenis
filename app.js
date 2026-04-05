import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } 
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC8zNV4w-qJiKJJMlAU_SNjCZ1nsQ9YBe4",
  authDomain: "planilla-tenis.firebaseapp.com",
  projectId: "planilla-tenis",
  storageBucket: "planilla-tenis.firebasestorage.app",
  messagingSenderId: "821417586455",
  appId: "1:821417586455:web:3c1ef1fb4892939a50d152",
  measurementId: "G-3R2QCHJ7VT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);
let idPartido = new URLSearchParams(window.location.search).get("id");

function generarId() {
  return Date.now().toString();
}

function nuevoPartido() {

  let idNuevo = generarId();

  // redirige con nuevo ID
  window.location.href = `${window.location.pathname}?id=${idNuevo}`;
}
if (!idPartido) {
  idPartido = Date.now().toString();
  window.location.search = "?id=" + idPartido;
}
async function guardarEnFirebase() {
  await setDoc(doc(db, "partidos", idPartido), partido);
}
const params = new URLSearchParams(window.location.search);
const esAdmin = params.get("admin") === "1";
if (!esAdmin) {
  document.querySelector(".botones").style.display = "none";
}
function escucharFirebase() {
  onSnapshot(doc(db, "partidos", idPartido), (docSnap) => {

    console.log("🔥 Firebase respondió");

    if (docSnap.exists()) {
      partido = docSnap.data();
    } else {
      console.log("🆕 creando partido");
      guardarEnFirebase();
    }

    if (!partido.sorteoHecho && !sorteoMostrado) {
      console.log("🎾 haciendo sorteo");
      sorteoMostrado = true;
      sorteoInicial();
      guardarEnFirebase();
      return;
    }

    actualizarInfo();
    crearGrilla();
    crearResumen();
  });
}
// ESTADO DEL PARTIDO
let sorteoMostrado = false
let partido = {
  puntos: [0, 0],

  puntosSet: {
    0: {0:0,1:0,2:0},
    1: {0:0,1:0,2:0}
  },

  setsGanados: [0,0],
  setActual: 0,
  saque: 0,

  historial: {
    0: {},
    1: {}
  },

  terminado: false,
  sorteoHecho: false,

  maxPuntos : 0
};
document.getElementById("formDatos").addEventListener("submit", function(e) {
  e.preventDefault(); // 👈 evita recarga
});

function sorteoInicial() {
  if (partido.sorteoHecho)return;
  let cantPuntos = prompt("A cuántos puntos se juega el set?");
  partido.maxPuntos = parseInt(cantPuntos);

  let ganador;
  let sacador;

  while (true) {
    ganador = prompt("¿Quién ganó el sorteo? (1 o 2)");

    if (ganador === "1" || ganador === "2") {
      break;
    }

    alert("Por favor ingresá 1 o 2");
  }

  // definir quién saca
  while(true){
    sacador = prompt("Saca o recibe? (S o R)").toUpperCase();

    if (sacador === "R" || sacador === "S"){
      break;
    }
  }

  if (sacador === "S"){
    partido.saque = parseInt(ganador) -1;
    alert(`🎾 Saca primero el Equipo ${ganador}`);

  } else {
    if (parseInt(ganador) == 1){
      partido.saque = 1;
      alert(`🎾 Saca primero el Equipo 2`);
    } else {
      partido.saque = 0;
      alert(`🎾 Saca primero el Equipo 1`);
    }
  }

  partido.sorteoHecho = true;


}

// CREAR GRILLA
function crearGrilla() {
  const grilla = document.getElementById("grilla");
  grilla.innerHTML = "";

  grilla.className = "grid";

  grilla.appendChild(cell("SET", "header"));
  for (let i=1;i<=24;i++) {
    grilla.appendChild(cell(i, "header"));
  }
  grilla.appendChild(cell("TOTAL", "header"));

  for (let s=0;s<3;s++) {
    let claseEquipo1 = "";

    if (partido.terminado && partido.setsGanados[0] === 2) {
    claseEquipo1 = "ganador";
    } else {
    claseEquipo1 = (partido.saque === 0) ? "sacando" : "recibiendo";
    }

    grilla.appendChild(cell(`1 - Set ${s+1}`, claseEquipo1));
    for (let i=0;i<24;i++) {
      let val = partido.historial[0][s]?.[i] || "";
      grilla.appendChild(cell(val, "team1"));
    }
    grilla.appendChild(cell(partido.puntosSet[0][s], "total"));
  }

  for (let s=0;s<3;s++) {
    let claseEquipo2 = "";

    if (partido.terminado && partido.setsGanados[1] === 2) {
    claseEquipo2 = "ganador";
    } else {
    claseEquipo2 = (partido.saque === 1) ? "sacando" : "recibiendo";
    }

    grilla.appendChild(cell(`2 - Set ${s+1}`, claseEquipo2));
    for (let i=0;i<24;i++) {
      let val = partido.historial[1][s]?.[i] || "";
      grilla.appendChild(cell(val, "team2"));
    }
    grilla.appendChild(cell(partido.puntosSet[1][s], "total"));
  }
}

function cell(text, extra="") {
  let div = document.createElement("div");
  div.className = "cell " + extra;
  div.innerText = text;
  return div;
}

// SUMAR PUNTO
function sumarPunto(equipo) {
    

  if (partido.terminado) return;

  let set = partido.setActual;

  if (!partido.historial[equipo][set]) {
    partido.historial[equipo][set] = [];
  }

  partido.historial[equipo][set].push("X");

  partido.puntos[equipo]++;
  partido.puntosSet[equipo][set]++;

  // 👇 TOTAL DEL SET (NO global)
  let totalSet = partido.puntosSet[0][set] + partido.puntosSet[1][set];
  crearResumen();

  // 🔁 CAMBIO DE SAQUE
  if (totalSet % 4 === 0) {
    partido.saque = 1 - partido.saque;
    alert("🔁 Cambio de saque");
  }

  // 🔄 CAMBIO DE LADO
  if (totalSet % 8 === 0) {
    alert("🔄 Cambio de lado");
  }
  let puntos1 = partido.puntosSet[0][set];
  let puntos2 = partido.puntosSet[1][set];
  let diferencia = Math.abs(puntos1 - puntos2);

  // 🏁 FIN DE SET (a 16 puntos)
  if (partido.puntosSet[equipo][set] >= partido.maxPuntos && diferencia >= 2) {

    partido.setsGanados[equipo]++;
    alert(`🏆 Equipo ${equipo+1} ganó el set ${set+1}`);

    // 🏆 GANADOR DEL PARTIDO
    if (partido.setsGanados[equipo] === 2) {
      partido.terminado = true;
      alert(`🎉 Equipo ${equipo+1} ganó el partido`);
      actualizarInfo();
      crearGrilla();
      return;
    }

    partido.setActual++;
    // 🎾 SET 2 → invertir saque SIEMPRE
    if (partido.setActual === 1) {
      partido.saque = 1 - partido.saque;
      alert("🎾 Set 2: cambia el saque inicial");
    }

    // 🎾 REGLA DEL TERCER SET
    if (partido.setActual === 2) {
      let total1 = partido.puntosSet[0][0] + partido.puntosSet[0][1];
      let total2 = partido.puntosSet[1][0] + partido.puntosSet[1][1];

      if (total1 > total2) {
        partido.saque = 0;
      } else if (total2 > total1) {
        partido.saque = 1;
      } else {
        partido.saque = Math.random() < 0.5 ? 0 : 1;
      }

      alert(`🎾 Tercer set: saca Equipo ${partido.saque+1}`);
    }
    
  }
  console.log("maxPuntos:", partido.maxPuntos);
  console.log("historial:", partido.historial);

  actualizarInfo();
  crearGrilla();
  guardarEnFirebase();

}

function restarPunto(equipo) {

  if (partido.terminado) return;

  let set = partido.setActual;

  if (!partido.historial[equipo][set] || partido.historial[equipo][set].length === 0) {
    return;
  }

  // borrar último punto
  partido.historial[equipo][set].pop();

  partido.puntos[equipo]--;
  partido.puntosSet[equipo][set]--;

  let totalSet = partido.puntosSet[0][set] + partido.puntosSet[1][set];

  // revertir saque
  if (totalSet % 4 === 3) {
    partido.saque = 1 - partido.saque;
  }

  // reabrir set si hacía falta
  if (partido.puntosSet[equipo][set] === partido.maxPuntos-1) {
    partido.setsGanados[equipo]--;
    partido.terminado = false;
  }

  actualizarInfo();
  crearResumen();
  crearGrilla();
  guardarEnFirebase();
}
window.sumarPunto = sumarPunto;
window.restarPunto = restarPunto;
// INFO
function actualizarInfo() {
    let nombre1 = document.getElementById("equipo1")?.value || "Equipo 1";
    let nombre2 = document.getElementById("equipo2")?.value || "Equipo 2";
    let torneo = document.getElementById("torneo")?.value || "-";
    let categoria = document.getElementById("categoria")?.value || "-";
    let ganador = "";

    if (partido.terminado) {
    ganador = partido.setsGanados[0] === 2 ? nombre1 : nombre2;
    }
    document.getElementById("info").innerHTML = `
    <p><strong>${nombre1}</strong> vs <strong>${nombre2}</strong></p>
    <p>Torneo: ${torneo} | Categoría: ${categoria}</p>
    <p>Set actual: ${partido.setActual+1}</p>
    <p>Saca: ${partido.saque === 0 ? nombre1 : nombre2}</p>
    <p>Sets: ${partido.setsGanados[0]} - ${partido.setsGanados[1]}</p>
    <p>Puntos totales: ${partido.puntos[0]} - ${partido.puntos[1]}</p>
    ${ganador ? `<p>🏆 Ganador: ${ganador}</p>` : ""}
  `;
}

function crearResumen() {
  const resumen = document.getElementById("resumen");
  resumen.innerHTML = "";
  resumen.className = "resumen-grid";

  // encabezado
  resumen.appendChild(rCell("Equipo", "resumen-header"));
  resumen.appendChild(rCell("Set 1", "resumen-header"));
  resumen.appendChild(rCell("Set 2", "resumen-header"));
  resumen.appendChild(rCell("Set 3", "resumen-header"));
  resumen.appendChild(rCell("Total", "resumen-header"));

  // equipo 1
  resumen.appendChild(rCell("Equipo 1", "equipo1"));
  let total1 = 0;
  for (let s=0;s<3;s++) {
    let val = partido.puntosSet[0][s];
    total1 += val;
    resumen.appendChild(rCell(val, "equipo1"));
  }
  resumen.appendChild(rCell(total1, "total-set"));

  // equipo 2
  resumen.appendChild(rCell("Equipo 2", "equipo2"));
  let total2 = 0;
  for (let s=0;s<3;s++) {
    let val = partido.puntosSet[1][s];
    total2 += val;
    resumen.appendChild(rCell(val, "equipo2"));
  }
  resumen.appendChild(rCell(total2, "total-set"));

  // suma por set (entre ambos equipos)
  resumen.appendChild(rCell("Total Set", "resumen-header"));
  for (let s=0;s<3;s++) {
    let totalSet = partido.puntosSet[0][s] + partido.puntosSet[1][s];
    resumen.appendChild(rCell(totalSet, "total-set"));
  }
  resumen.appendChild(rCell(total1 + total2, "total-set"));
}

function rCell(texto, clase="") {
  let div = document.createElement("div");
  div.className = "resumen-cell " + clase;
  div.innerText = texto;
  return div;
}
function descargarImagen() {

  const contenedor = document.getElementById("exportar");

  html2canvas(contenedor).then(canvas => {
    let link = document.createElement("a");
    link.download = "partido-tenis.png";
    link.href = canvas.toDataURL();
    link.click();
  });

}

// INIT
window.nuevoPartido = nuevoPartido;
escucharFirebase();
