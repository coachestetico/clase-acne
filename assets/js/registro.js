/* Página de registro: el mismo formulario arriba y en el cierre, con horarios y envío. */
(function () {
  const $ = id => document.getElementById(id);
  const previo = leerRegistro();
  const duracion = textoDuracion(CONFIG.clase.duracionMin);
  const zona = nombreZona();

  if (CONFIG.banner) $("banner").src = CONFIG.banner;
  if (CONFIG.fotoDocente) $("foto-docente").src = CONFIG.fotoDocente;
  $("titulo-clase").textContent = CONFIG.clase.titulo;
  document.querySelectorAll("[data-duracion]").forEach(el => { el.textContent = duracion; });
  document.querySelectorAll("[data-duracion-texto]").forEach(el => { el.textContent = `Alrededor de ${duracion}.`; });
  document.querySelectorAll("[data-wsp]").forEach(a => { a.href = CONFIG.oferta.whatsapp; });

  /* Aviso de único turno: resuelve "aceptar" o "cambiar" */
  function avisoTurno(inicio) {
    const aviso = $("aviso-turno");
    $("aviso-horario").textContent = `Tu turno: ${textoFechaLarga(inicio)} (tu hora local)`;
    aviso.hidden = false;
    $("aviso-aceptar").focus();
    return new Promise(res => {
      const cerrar = respuesta => {
        aviso.hidden = true;
        $("aviso-aceptar").onclick = $("aviso-cambiar").onclick = aviso.onkeydown = null;
        res(respuesta);
      };
      $("aviso-aceptar").onclick = () => cerrar("aceptar");
      $("aviso-cambiar").onclick = () => cerrar("cambiar");
      aviso.onkeydown = e => { if (e.key === "Escape") cerrar("cambiar"); };
    });
  }

  function origen() {
    const p = new URLSearchParams(location.search);
    const datos = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "fuente"].forEach(k => { if (p.get(k)) datos[k] = p.get(k); });
    if (document.referrer) datos.referrer = document.referrer.split("?")[0];
    return datos;
  }

  function montarFormulario(caja, n) {
    caja.appendChild($("plantilla-formulario").content.cloneNode(true));
    const formulario = caja.querySelector("form");
    const pre = `f${n}`;
    const campo = nombre => formulario.querySelector(`[data-campo="${nombre}"]`);
    const entrada = nombre => formulario.querySelector(`[data-entrada="${nombre}"]`);

    formulario.querySelectorAll("[data-entrada]").forEach(el => { el.id = `${pre}-${el.dataset.entrada}`; });
    formulario.querySelectorAll("[data-para]").forEach(el => { el.htmlFor = `${pre}-${el.dataset.para}`; });
    formulario.querySelector("[data-datos-clase]").textContent = `Clase gratuita · ${duracion} · con ${CONFIG.clase.docente}`;
    formulario.querySelector(".zona").textContent = zona ? `Horarios en tu hora local (${zona})` : "Horarios en tu hora local";

    const etiqueta = formulario.querySelector("[data-etiqueta]");
    const selector = formulario.querySelector(".selector-horario");
    const lista = formulario.querySelector(".lista-horarios");
    etiqueta.id = `${pre}-etiqueta-horario`;
    selector.setAttribute("aria-labelledby", etiqueta.id);
    lista.setAttribute("aria-labelledby", etiqueta.id);

    /* ---- Horarios ---- */
    let elegida = null;
    let aceptada = null; // horario para el que ya vio el aviso de único turno
    function pintarHorarios() {
      const ahora = Date.now();
      const clases = proximasClases(ahora);
      if (!elegida || !clases.some(c => c.inicio === elegida)) elegida = clases[0].inicio;
      lista.replaceChildren();
      clases.forEach((c, i) => {
        const li = document.createElement("li");
        li.id = `${pre}-horario-${i}`;
        li.setAttribute("role", "option");
        li.dataset.inicio = c.inicio;
        if (c.pronto) li.className = "pronto";
        li.setAttribute("aria-selected", String(c.inicio === elegida));
        li.innerHTML = "<strong></strong><small></small>";
        li.querySelector("strong").textContent = textoFecha(c.inicio);
        li.querySelector("small").textContent = textoFalta(c.inicio, ahora);
        lista.appendChild(li);
      });
      const actual = clases.find(c => c.inicio === elegida);
      selector.querySelector("strong").textContent = textoFecha(actual.inicio);
      const falta = selector.querySelector("small");
      falta.textContent = textoFalta(actual.inicio, ahora);
      falta.classList.toggle("lejos", !actual.pronto);
    }

    function abrirLista(abrir) {
      lista.hidden = !abrir;
      selector.setAttribute("aria-expanded", String(abrir));
      if (abrir) {
        const marcado = lista.querySelector('[aria-selected="true"]') || lista.firstElementChild;
        marcado.classList.add("activo");
        lista.setAttribute("aria-activedescendant", marcado.id);
      }
    }

    async function elegir(li) {
      elegida = Number(li.dataset.inicio);
      campo("horario").classList.remove("error");
      abrirLista(false);
      pintarHorarios();
      if (await avisoTurno(elegida) === "aceptar") {
        aceptada = elegida;
        entrada("nombre").focus();
      } else {
        abrirLista(true);
        selector.focus();
      }
    }

    selector.addEventListener("click", () => abrirLista(lista.hidden));
    lista.addEventListener("click", e => { const li = e.target.closest("li"); if (li) elegir(li); });
    selector.addEventListener("keydown", e => {
      if (!["ArrowDown", "ArrowUp", "Enter", " ", "Escape"].includes(e.key)) return;
      e.preventDefault();
      if (e.key === "Escape") return abrirLista(false);
      if (lista.hidden) return abrirLista(true);
      const items = [...lista.children];
      const activo = lista.querySelector(".activo") || items[0];
      if (e.key === "Enter" || e.key === " ") return elegir(activo);
      let i = items.indexOf(activo);
      i = e.key === "ArrowDown" ? Math.min(items.length - 1, i + 1) : Math.max(0, i - 1);
      activo.classList.remove("activo");
      items[i].classList.add("activo");
      lista.setAttribute("aria-activedescendant", items[i].id);
    });
    document.addEventListener("click", e => { if (!formulario.querySelector(".horario").contains(e.target)) abrirLista(false); });

    pintarHorarios();
    setInterval(() => { if (lista.hidden) pintarHorarios(); }, 20 * 1000);

    /* ---- Teléfono ---- */
    const codigo = entrada("codigo");
    PAISES.forEach(([iso, nombre, prefijo]) => {
      const op = document.createElement("option");
      op.value = iso;
      op.textContent = iso === "XX" ? "Otro" : `${iso} ${prefijo}`;
      op.title = nombre;
      codigo.appendChild(op);
    });
    codigo.value = (previo && previo.pais) || paisPorZona(zonaLocal()) || "AR";
    if (previo) {
      entrada("nombre").value = previo.nombre || "";
      entrada("telefono").value = previo.telefono || "";
      entrada("email").value = previo.email || "";
    }

    /* ---- Envío ---- */
    const marcar = (nombre, ok) => { campo(nombre).classList.toggle("error", !ok); return ok; };

    formulario.addEventListener("submit", async e => {
      e.preventDefault();
      const nombre = entrada("nombre").value.trim();
      const telefono = entrada("telefono").value.replace(/[^\d]/g, "");
      const email = entrada("email").value.trim().toLowerCase();
      const ok = [
        marcar("horario", Boolean(elegida)),
        marcar("nombre", nombre.length >= 2),
        marcar("telefono", telefono.length >= 6),
        marcar("email", /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
      ];
      if (ok.includes(false)) { formulario.querySelector(".error input, .error button")?.focus(); return; }

      /* Si el horario "en minutos" ya pasó mientras completaba, se pasa al siguiente. */
      if (elegida - Date.now() < MINUTO) { elegida = proximasClases()[0].inicio; pintarHorarios(); }

      /* Antes de reservar tiene que ver el aviso de único turno para este horario */
      if (aceptada !== elegida) {
        if (await avisoTurno(elegida) !== "aceptar") { abrirLista(true); selector.focus(); return; }
        aceptada = elegida;
      }

      const boton = formulario.querySelector('button[type="submit"]');
      boton.disabled = true;
      boton.textContent = "Reservando tu lugar…";

      const pais = codigo.value;
      const prefijo = (PAISES.find(p => p[0] === pais) || [])[2] || "";
      const id = nuevoId();
      await enviarAPlanilla({
        tipo: "registro", id, nombre, pais, codigo: prefijo, telefono, email,
        clase: new Date(elegida).toISOString(), zona: zonaLocal(),
        origen: origen(), web: entrada("web").value
      });
      guardarRegistro({ id, nombre, pais, telefono, email, inicio: elegida });
      location.href = urlConfirmacion(id, elegida, pais);
    });
  }

  document.querySelectorAll("[data-formulario]").forEach((caja, i) => montarFormulario(caja, i + 1));

  /* Los botones de las secciones llevan al formulario de arriba */
  document.querySelectorAll("[data-ir-registro]").forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    $("registro").scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => $("f1-nombre").focus({ preventScroll: true }), 600);
  }));
})();
