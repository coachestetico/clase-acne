/* Funciones que usan las tres páginas: horarios, fechas, país, envío a la planilla y datos guardados. */
const MINUTO = 60 * 1000;
const HORA = 60 * MINUTO;
const CLAVE_LOCAL = "clase-bootcamp:registro";

const PAISES = [
  ["AR", "Argentina", "+54"], ["UY", "Uruguay", "+598"], ["CL", "Chile", "+56"], ["PY", "Paraguay", "+595"],
  ["BO", "Bolivia", "+591"], ["PE", "Perú", "+51"], ["EC", "Ecuador", "+593"], ["CO", "Colombia", "+57"],
  ["VE", "Venezuela", "+58"], ["PA", "Panamá", "+507"], ["CR", "Costa Rica", "+506"], ["NI", "Nicaragua", "+505"],
  ["HN", "Honduras", "+504"], ["SV", "El Salvador", "+503"], ["GT", "Guatemala", "+502"], ["MX", "México", "+52"],
  ["DO", "Rep. Dominicana", "+1"], ["PR", "Puerto Rico", "+1"], ["CU", "Cuba", "+53"], ["US", "Estados Unidos", "+1"],
  ["ES", "España", "+34"], ["IT", "Italia", "+39"], ["BR", "Brasil", "+55"], ["XX", "Otro país", "+"]
];

const ZONAS_PAIS = {
  "America/Montevideo": "UY", "America/Santiago": "CL", "America/Asuncion": "PY", "America/La_Paz": "BO",
  "America/Lima": "PE", "America/Guayaquil": "EC", "America/Bogota": "CO", "America/Caracas": "VE",
  "America/Panama": "PA", "America/Costa_Rica": "CR", "America/Managua": "NI", "America/Tegucigalpa": "HN",
  "America/El_Salvador": "SV", "America/Guatemala": "GT", "America/Santo_Domingo": "DO",
  "America/Puerto_Rico": "PR", "America/Havana": "CU", "Europe/Madrid": "ES", "Atlantic/Canary": "ES",
  "Europe/Rome": "IT"
};

function zonaLocal() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { return ""; }
}

function paisPorZona(zona) {
  if (!zona) return "";
  if (zona.startsWith("America/Argentina") || zona === "America/Buenos_Aires") return "AR";
  if (ZONAS_PAIS[zona]) return ZONAS_PAIS[zona];
  if (/^America\/(Mexico_City|Cancun|Merida|Monterrey|Matamoros|Chihuahua|Ciudad_Juarez|Ojinaga|Hermosillo|Mazatlan|Bahia_Banderas|Tijuana)$/.test(zona)) return "MX";
  if (/^America\/(Sao_Paulo|Fortaleza|Recife|Bahia|Belem|Manaus|Cuiaba|Campo_Grande|Porto_Velho|Boa_Vista|Rio_Branco|Maceio|Araguaina|Santarem|Noronha)$/.test(zona)) return "BR";
  if (/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Indiana\/.+|Kentucky\/.+|Boise)$/.test(zona) || zona === "Pacific/Honolulu") return "US";
  return "";
}

/* Próximas clases: siempre una "en minutos" y después las fijas de hoy y de mañana. */
function proximasClases(ahora = Date.now()) {
  const h = CONFIG.horarios;
  const paso = h.cadaMinutos * MINUTO;
  const pronto = Math.ceil((ahora + h.anticipacionMin * MINUTO) / paso) * paso;
  const clases = [{ inicio: pronto, pronto: true }];

  const base = new Date(ahora + h.utcBase * HORA);
  for (let dia = 0; dia < 2; dia++) {
    for (const fija of h.fijos) {
      const [hh, mm] = fija.split(":").map(Number);
      const inicio = Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + dia, hh - h.utcBase, mm);
      if (inicio > pronto + 5 * MINUTO && inicio <= ahora + h.horizonteHoras * HORA) clases.push({ inicio, pronto: false });
    }
  }
  return clases.sort((a, b) => a.inicio - b.inicio).slice(0, h.cantidad);
}

function mismoDia(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function horaLocal(ms) {
  return new Date(ms).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/* "Hoy, 19:00" · "Mañana, 10:00" · "jueves 6 de noviembre, 10:00" */
function textoFecha(ms) {
  const fecha = new Date(ms);
  const hoy = new Date();
  const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
  let dia;
  if (mismoDia(fecha, hoy)) dia = "Hoy";
  else if (mismoDia(fecha, manana)) dia = "Mañana";
  else dia = fecha.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
  return `${dia}, ${horaLocal(ms)}`;
}

function textoFechaLarga(ms) {
  const fecha = new Date(ms);
  const dia = fecha.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)}, ${horaLocal(ms)} h`;
}

/* "Comienza en 7 minutos" · "Comienza en 2 h 20 min" · "Comienza en 20 horas" */
function textoFalta(ms, ahora = Date.now()) {
  const min = Math.max(0, Math.round((ms - ahora) / MINUTO));
  if (min <= 1) return "Comienza en 1 minuto";
  if (min < 60) return `Comienza en ${min} minutos`;
  if (min < 180) {
    const resto = min % 60;
    return `Comienza en ${Math.floor(min / 60)} h${resto ? ` ${resto} min` : ""}`;
  }
  return `Comienza en ${Math.round(min / 60)} horas`;
}

function textoDuracion(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} h${m ? ` ${m}` : ""}` : `${m} min`;
}

function nombreZona() {
  try {
    const parte = new Intl.DateTimeFormat("es", { timeZoneName: "long" }).formatToParts(new Date())
      .find(p => p.type === "timeZoneName");
    return parte ? parte.value : "";
  } catch (e) { return ""; }
}

function relojRegresivo(ms, ahora = Date.now()) {
  let s = Math.max(0, Math.floor((ms - ahora) / 1000));
  const dias = Math.floor(s / 86400); s %= 86400;
  const dos = n => String(n).padStart(2, "0");
  const hms = `${dos(Math.floor(s / 3600))}:${dos(Math.floor(s % 3600 / 60))}:${dos(s % 60)}`;
  return dias ? `${dias} d ${hms}` : hms;
}

function nuevoId() {
  const azar = (window.crypto && crypto.getRandomValues) ? crypto.getRandomValues(new Uint32Array(2)) : [Math.random() * 1e9, Math.random() * 1e9];
  return Array.from(azar, n => Math.floor(n).toString(36)).join("").slice(0, 12);
}

function urlSala(id, inicio, pais) {
  const u = new URL("sala.html", location.href);
  u.search = new URLSearchParams({ id, t: String(inicio), pa: pais || "" }).toString();
  return u.toString();
}

function urlConfirmacion(id, inicio, pais) {
  const u = new URL("confirmacion.html", location.href);
  u.search = new URLSearchParams({ id, t: String(inicio), pa: pais || "" }).toString();
  return u.toString();
}

function parametros() {
  const p = new URLSearchParams(location.search);
  const t = Number(p.get("t"));
  return { id: p.get("id") || "", inicio: Number.isFinite(t) && t > 0 ? t : 0, pais: (p.get("pa") || "").toUpperCase() };
}

function guardarRegistro(datos) {
  try { localStorage.setItem(CLAVE_LOCAL, JSON.stringify(datos)); } catch (e) { /* sin almacenamiento */ }
}

function leerRegistro() {
  try { return JSON.parse(localStorage.getItem(CLAVE_LOCAL)) || null; } catch (e) { return null; }
}

/* Manda datos a la planilla (Apps Script). No espera respuesta: el navegador no la deja leer. */
function enviarAPlanilla(datos) {
  if (!CONFIG.registroUrl) { console.info("registroUrl vacío: no se guarda", datos); return Promise.resolve(); }
  const envio = fetch(CONFIG.registroUrl, {
    method: "POST", mode: "no-cors", keepalive: true,
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(datos)
  }).catch(err => console.warn("No se pudo enviar a la planilla", err));
  const espera = new Promise(res => setTimeout(res, 4000));
  return Promise.race([envio, espera]);
}

function registrarEvento(evento, extra = {}) {
  const { id, inicio } = parametros();
  return enviarAPlanilla({ tipo: "evento", evento, id, clase: inicio ? new Date(inicio).toISOString() : "", ...extra });
}

function fechaCalendario(ms) {
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function linkGoogleCalendar(inicio, sala) {
  const fin = inicio + CONFIG.clase.duracionMin * MINUTO;
  const u = new URL("https://calendar.google.com/calendar/render");
  u.search = new URLSearchParams({
    action: "TEMPLATE",
    text: `Clase gratuita · ${CONFIG.clase.titulo}`,
    dates: `${fechaCalendario(inicio)}/${fechaCalendario(fin)}`,
    details: `Entra desde este link 5 minutos antes:\n${sala}\n\nLa clase empieza puntual.`,
    location: sala
  }).toString();
  return u.toString();
}

function archivoIcs(inicio, sala) {
  const fin = inicio + CONFIG.clase.duracionMin * MINUTO;
  const escapar = s => s.replace(/[\\,;]/g, m => `\\${m}`).replace(/\n/g, "\\n");
  const texto = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Coach Estetico//Clase//ES", "BEGIN:VEVENT",
    `UID:${inicio}-${nuevoId()}@coachestetico`, `DTSTAMP:${fechaCalendario(Date.now())}`,
    `DTSTART:${fechaCalendario(inicio)}`, `DTEND:${fechaCalendario(fin)}`,
    `SUMMARY:${escapar(`Clase gratuita · ${CONFIG.clase.titulo}`)}`,
    `DESCRIPTION:${escapar(`Entra desde este link 5 minutos antes:\n${sala}`)}`,
    `URL:${sala}`,
    "BEGIN:VALARM", "TRIGGER:-PT15M", "ACTION:DISPLAY", "DESCRIPTION:Tu clase empieza en 15 minutos", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR"
  ].join("\r\n");
  return URL.createObjectURL(new Blob([texto], { type: "text/calendar;charset=utf-8" }));
}

function copiar(texto, boton) {
  const listo = () => { const antes = boton.textContent; boton.textContent = "¡Copiado!"; setTimeout(() => { boton.textContent = antes; }, 1800); };
  if (navigator.clipboard) navigator.clipboard.writeText(texto).then(listo, () => prompt("Copia el link:", texto));
  else prompt("Copia el link:", texto);
}
