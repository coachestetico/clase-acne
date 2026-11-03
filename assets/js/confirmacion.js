/* Página de confirmación: fecha en hora local, calendario y explicación del acceso. */
(function () {
  const $ = id => document.getElementById(id);
  const { id, inicio, pais } = parametros();

  document.querySelectorAll("[data-wsp]").forEach(a => { a.href = CONFIG.oferta.whatsapp; });
  $("titulo-clase").textContent = CONFIG.clase.titulo;
  $("docente").textContent = CONFIG.clase.docente;
  $("paso-duracion").textContent = `Empieza puntual, dura alrededor de ${textoDuracion(CONFIG.clase.duracionMin)} y se transmite una sola vez: no se puede pausar ni volver a ver. Si no entras en tu turno, te la pierdes.`;

  if (!inicio) {
    $("saludo").textContent = "No encontramos tu horario";
    $("intro").textContent = "Vuelve a elegirlo: te toma un minuto.";
    ["cuando-caja", "link-sala", "ics", "entrar"].forEach(x => { $(x).hidden = true; });
    document.querySelector(".avisos").hidden = true;
    $("principal").textContent = "Elegir horario";
    $("principal").href = "index.html";
    $("principal").removeAttribute("target");
    return;
  }

  const registro = leerRegistro();
  const propio = registro && registro.id === id;
  if (propio && registro.nombre) $("saludo").textContent = `¡${registro.nombre}, tu lugar está reservado!`;
  if (propio && registro.email) {
    $("paso-correo").textContent = `Te enviamos un mensaje a ${registro.email} con tu link de acceso. Si no lo encuentras en los próximos minutos, revisa Promociones o Spam.`;
  }

  const sala = urlSala(id, inicio, pais);
  const google = linkGoogleCalendar(inicio, sala);
  const zona = nombreZona();
  $("cuando").textContent = textoFechaLarga(inicio);
  $("zona").textContent = zona ? `En tu hora local (${zona})` : "En tu hora local";
  $("entrar").href = sala;
  $("google").href = google;
  $("ics").href = archivoIcs(inicio, sala);
  $("link").value = sala;
  $("copiar").addEventListener("click", e => copiar(sala, e.currentTarget));

  /* Botón principal: agendar; si falta poco o ya empezó, entrar. */
  function actualizar() {
    const falta = inicio - Date.now();
    const yaCasi = falta <= 15 * MINUTO && -falta < CONFIG.sala.toleranciaMin * MINUTO;
    const principal = $("principal");
    if (yaCasi) {
      principal.textContent = falta > 0 ? "Entrar a la clase ahora" : "La clase empezó: entrar";
      principal.href = sala;
      principal.removeAttribute("target");
    } else {
      principal.textContent = "Agregar a mi calendario";
      principal.href = google;
      principal.target = "_blank";
    }
    $("google").hidden = !yaCasi;
    $("entrar").hidden = yaCasi;

    if (falta > 0) $("falta").textContent = textoFalta(inicio);
    else if (yaCasi) $("falta").textContent = "Ya empezó";
    else $("falta").textContent = "Esta clase ya empezó";
  }
  actualizar();
  setInterval(actualizar, 15 * 1000);
})();
