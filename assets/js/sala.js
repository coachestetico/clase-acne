/* Sala: cuenta regresiva, video sin controles y oferta que aparece en el segundo configurado. */
(function () {
  const $ = id => document.getElementById(id);
  const { id, inicio: inicioLink, pais: paisLink } = parametros();
  /* Para probar sin esperar: sala.html?prueba arranca en 10 segundos; &desde=4870 empieza en ese segundo del video. */
  const busqueda = new URLSearchParams(location.search);
  const prueba = busqueda.has("prueba");
  const inicio = prueba ? Date.now() + 10 * 1000 : inicioLink;
  const registro = leerRegistro();
  const pais = paisLink || (registro && registro.pais) || paisPorZona(zonaLocal());
  const oferta = CONFIG.oferta;
  const tolerancia = CONFIG.sala.toleranciaMin * MINUTO;
  const capas = ["capa-espera", "capa-sonido", "capa-otro-horario", "capa-sin-datos", "capa-fin", "capa-error"];
  const esperar = ms => new Promise(res => setTimeout(res, ms));

  function mostrar(capa) {
    capas.forEach(c => { $(c).hidden = c !== capa; });
    $("pantalla").classList.toggle("con-capa", Boolean(capa) && capa !== "capa-sonido");
  }

  /* ---- Textos ---- */
  $("titulo-clase").textContent = CONFIG.clase.titulo;
  $("docente-clase").textContent = `Clase gratuita con ${CONFIG.clase.docente}`;
  $("panel-docente").textContent = `Con ${CONFIG.clase.docente}, fundadora de Coach Estético.`;
  $("fechas").textContent = oferta.fechas.split("·")[0].trim();
  if (CONFIG.logoBootcamp) {
    const img = new Image();
    img.src = CONFIG.logoBootcamp;
    img.alt = `Bootcamp ${oferta.producto}`;
    $("logo-bootcamp").querySelectorAll(".palabra, .raya, .nombre").forEach(el => el.remove());
    $("logo-bootcamp").prepend(img);
  }
  if (CONFIG.banner) document.querySelectorAll(".capa.con-fondo").forEach(c => { c.style.backgroundImage = `url("${CONFIG.banner}")`; });

  $("precio-lista").textContent = oferta.precioLista;
  $("precio").textContent = oferta.precio;
  $("cupos").textContent = `Solo para los primeros ${oferta.cupos} lugares`;
  oferta.incluye.forEach(texto => { const li = document.createElement("li"); li.textContent = texto; $("incluye").appendChild(li); });
  $("wsp").href = oferta.whatsapp;
  $("nota-alumnas").textContent = oferta.notaAlumnas || "";

  /* ---- Pagos: Argentina con Mercado Pago, el resto con Hotmart ---- */
  let pagoArgentina = pais === "AR" && Boolean(oferta.mercadoPago);
  function pintarPagos() {
    $("pagar-mp").href = oferta.mercadoPago || "#";
    $("pagar-mp").textContent = oferta.precioAR ? `Inscribirme con Mercado Pago · ${oferta.precioAR}` : "Inscribirme con Mercado Pago";
    $("pagar-hotmart").href = oferta.hotmart;
    $("pagar-hotmart").textContent = `Inscribirme ahora · ${oferta.precio}`;
    $("pagar-mp").hidden = !pagoArgentina;
    $("pagar-hotmart").hidden = pagoArgentina;
    $("otro-pais").hidden = !oferta.mercadoPago;
    $("otro-pais").textContent = pagoArgentina ? "¿Pagas desde otro país? Paga con tarjeta internacional" : "¿Estás en Argentina? Paga con Mercado Pago";
    $("nota-pago").textContent = pagoArgentina
      ? "Después de pagar, envía el comprobante por WhatsApp y te damos el acceso."
      : "Pago seguro por Hotmart. El acceso te llega al correo.";
    $("chip-link").href = pagoArgentina ? oferta.mercadoPago : oferta.hotmart;
  }
  $("otro-pais").addEventListener("click", () => { pagoArgentina = !pagoArgentina; pintarPagos(); });
  pintarPagos();
  [["pagar-mp", "clic_mercadopago"], ["pagar-hotmart", "clic_hotmart"], ["wsp", "clic_whatsapp"], ["chip-link", "clic_chip"]]
    .forEach(([boton, evento]) => $(boton).addEventListener("click", () => registrarEvento(evento, { segundo: segundoActual() })));

  if (!inicio) { mostrar("capa-sin-datos"); return; }

  /* ---- Video ---- */
  let video;
  let empezo = false;
  let termino = false;
  let ofertaLanzada = false;

  function alTerminar() {
    termino = true;
    lanzarOferta();
    mostrar("capa-fin");
    registrarEvento("fin");
  }

  function videoMp4(lugar, fuente) {
    const v = document.createElement("video");
    v.src = fuente;
    v.preload = "auto";
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.disablePictureInPicture = true;
    v.setAttribute("controlslist", "nodownload noplaybackrate noremoteplayback");
    v.addEventListener("contextmenu", e => e.preventDefault());
    v.addEventListener("ended", alTerminar);
    lugar.replaceWith(v);
    const metadatos = () => v.readyState >= 1 ? Promise.resolve() : new Promise((res, rej) => {
      v.addEventListener("loadedmetadata", res, { once: true });
      v.addEventListener("error", () => rej(new Error("video")), { once: true });
      if (v.error) rej(new Error("video"));
      setTimeout(() => rej(new Error("tiempo")), 20000);
    });
    return {
      elemento: v,
      async preparar() {
        try { v.muted = false; await v.play(); v.pause(); v.currentTime = 0; } catch (e) { /* se resuelve al empezar */ }
      },
      async iniciar(segundo) {
        await metadatos();
        if (segundo > 0) v.currentTime = Math.min(segundo, Math.max(0, v.duration - 1));
        v.muted = false;
        try { await v.play(); return true; } catch (e) {
          v.muted = true;
          try { await v.play(); } catch (e2) { /* queda la capa para tocar */ }
          return false;
        }
      },
      sonar() { v.muted = false; return v.play().catch(() => {}); },
      tiempo: () => v.currentTime || 0,
      reproduciendo: () => !v.paused && !v.ended,
      conSonido: () => !v.muted
    };
  }

  function videoYoutube(lugar, idVideo) {
    let reproductor;
    let avisarListo;
    const listo = new Promise(res => { avisarListo = res; });
    window.onYouTubeIframeAPIReady = () => {
      reproductor = new YT.Player(lugar, {
        videoId: idVideo, width: "100%", height: "100%",
        playerVars: { controls: 0, disablekb: 1, modestbranding: 1, rel: 0, playsinline: 1, fs: 0, iv_load_policy: 3 },
        events: {
          onReady: () => avisarListo(),
          onStateChange: e => { if (e.data === YT.PlayerState.ENDED) alTerminar(); },
          onError: () => mostrarError()
        }
      });
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
    return {
      async preparar() { /* YouTube no se puede desbloquear desde afuera: si hace falta, aparece "Tocar para escuchar" */ },
      async iniciar(segundo) {
        await listo;
        reproductor.seekTo(segundo, true);
        reproductor.unMute();
        reproductor.playVideo();
        await esperar(1500);
        if (reproductor.getPlayerState() !== YT.PlayerState.PLAYING) { reproductor.mute(); reproductor.playVideo(); return false; }
        return !reproductor.isMuted();
      },
      sonar() { reproductor.unMute(); reproductor.playVideo(); },
      tiempo: () => (reproductor && reproductor.getCurrentTime ? reproductor.getCurrentTime() : 0),
      reproduciendo: () => Boolean(reproductor && reproductor.getPlayerState && reproductor.getPlayerState() === YT.PlayerState.PLAYING),
      conSonido: () => Boolean(reproductor && !reproductor.isMuted())
    };
  }

  function segundoActual() { return video ? Math.round(video.tiempo()) : 0; }

  /* ---- Oferta ---- */
  function lanzarOferta() {
    if (ofertaLanzada) return;
    ofertaLanzada = true;
    $("panel-clase").hidden = true;
    $("logo-bootcamp").hidden = false;
    $("oferta").hidden = false;
    $("chip-oferta").hidden = false;
    registrarEvento("oferta", { segundo: segundoActual() });
  }

  /* ---- Clase ---- */
  let pausadaDesde = 0;
  async function empezar(segundo) {
    empezo = true;
    mostrar(null);
    $("pantalla-completa").hidden = false;
    let conSonido;
    try { conSonido = await video.iniciar(segundo); } catch (err) { mostrarError(); return; }
    if (!conSonido) pedirToque("La clase ya empezó", "Tocar para escuchar");
    registrarEvento("inicio", { segundo: Math.round(segundo) });

    setInterval(() => {
      if (termino) return;
      if (!ofertaLanzada && video.tiempo() >= CONFIG.ofertaSegundo) lanzarOferta();
      /* Si se pausó sola (celular bloqueado, pestaña en segundo plano), se ofrece seguir */
      if (!video.reproduciendo() && $("capa-sonido").hidden) {
        pausadaDesde = pausadaDesde || Date.now();
        if (Date.now() - pausadaDesde > 2500) pedirToque("La clase sigue", "Tocar para continuar");
      } else if (video.reproduciendo()) {
        pausadaDesde = 0;
      }
    }, 500);
  }

  function mostrarError() {
    termino = true;
    mostrar("capa-error");
    registrarEvento("error_video", { segundo: segundoActual() });
  }

  function pedirToque(titulo, boton) {
    $("capa-sonido").querySelector("h2").textContent = titulo;
    $("poner-sonido").textContent = boton;
    mostrar("capa-sonido");
  }
  $("poner-sonido").addEventListener("click", () => { video.sonar(); mostrar(null); pausadaDesde = 0; });

  /* ---- Otro horario (llegó tarde) ---- */
  function ofrecerOtroHorario(titulo, texto) {
    $("otro-titulo").textContent = titulo;
    $("otro-texto").textContent = texto;
    const caja = $("horarios-nuevos");
    caja.replaceChildren();
    proximasClases().slice(0, 3).forEach((c, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = i === 0 ? "boton" : "boton borde";
      b.textContent = `${textoFecha(c.inicio)} · ${textoFalta(c.inicio).replace("Comienza ", "")}`;
      b.addEventListener("click", () => reagendar(c.inicio, b));
      caja.appendChild(b);
    });
    mostrar("capa-otro-horario");
    registrarEvento("tarde");
  }

  async function reagendar(nuevoInicio, boton) {
    if (!registro || !registro.email) { location.href = "index.html"; return; }
    boton.disabled = true;
    boton.textContent = "Reservando…";
    const nuevo = nuevoId();
    const prefijo = (PAISES.find(p => p[0] === registro.pais) || [])[2] || "";
    await enviarAPlanilla({
      tipo: "registro", id: nuevo, nombre: registro.nombre, pais: registro.pais, codigo: prefijo,
      telefono: registro.telefono, email: registro.email, clase: new Date(nuevoInicio).toISOString(),
      zona: zonaLocal(), origen: { fuente: "reagenda" }, reagendaDe: id
    });
    guardarRegistro({ ...registro, id: nuevo, inicio: nuevoInicio });
    location.href = urlConfirmacion(nuevo, nuevoInicio, registro.pais);
  }

  /* ---- Pantalla completa ---- */
  const pantalla = $("pantalla");
  $("pantalla-completa").addEventListener("click", () => {
    const activo = document.fullscreenElement || document.webkitFullscreenElement;
    if (activo) return (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    if (pantalla.requestFullscreen) pantalla.requestFullscreen();
    else if (pantalla.webkitRequestFullscreen) pantalla.webkitRequestFullscreen();
    else if (video && video.elemento && video.elemento.webkitEnterFullscreen) video.elemento.webkitEnterFullscreen();
  });
  ["fullscreenchange", "webkitfullscreenchange"].forEach(ev => document.addEventListener(ev, () => {
    const activo = document.fullscreenElement || document.webkitFullscreenElement;
    $("pantalla-completa").textContent = activo ? "Salir de pantalla completa" : "Pantalla completa";
  }));

  /* ---- Arranque según la hora ---- */
  const transcurrido = Date.now() - inicio;
  registrarEvento("entro", { minutos: Math.round(transcurrido / MINUTO) });

  if (transcurrido > tolerancia) {
    ofrecerOtroHorario(`Esta clase empezó hace más de ${CONFIG.sala.toleranciaMin} minutos`, "Para que la aproveches desde el principio, elige otro horario:");
    return;
  }

  /* YouTube no reproduce si la página se abre como archivo (doble clic): tiene que estar en una dirección web. */
  if (location.protocol === "file:" && CONFIG.video.tipo === "youtube") {
    $("capa-error").querySelector("h2").textContent = "El video no se ve abriendo el archivo";
    $("capa-error").querySelector("p").textContent = "YouTube solo reproduce si la página está en una dirección web. Ábrela publicada o desde http://localhost:5180.";
    mostrar("capa-error");
    return;
  }

  const lugar = $("video-lugar");
  video = CONFIG.video.tipo === "youtube" ? videoYoutube(lugar, CONFIG.video.fuente) : videoMp4(lugar, CONFIG.video.fuente);

  const desde = prueba && Number(busqueda.get("desde")) > 0 ? Number(busqueda.get("desde")) : (CONFIG.video.inicioSegundo || 0);
  if (transcurrido >= 0) {
    empezar(desde + (CONFIG.sala.entrarDondeVa ? transcurrido / 1000 : 0));
    return;
  }

  mostrar("capa-espera");
  $("hora-inicio").textContent = `${textoFechaLarga(inicio)} · tu hora local`;
  $("activar-sonido").addEventListener("click", async () => {
    await video.preparar();
    $("activar-sonido").hidden = true;
    $("sonido-ok").hidden = false;
  });
  const reloj = setInterval(() => {
    const falta = inicio - Date.now();
    $("reloj").textContent = relojRegresivo(inicio);
    document.title = `${relojRegresivo(inicio)} · Clase gratuita | Coach Estético`;
    if (falta <= 0) {
      clearInterval(reloj);
      document.title = "Clase gratuita | Coach Estético";
      empezar(desde);
    }
  }, 250);
  $("reloj").textContent = relojRegresivo(inicio);
})();
