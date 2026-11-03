/* Todo lo que se cambia está acá. Los demás archivos no hace falta tocarlos.
   Lo marcado con PRUEBA o FALTA se completa cuando esté el video definitivo. */
const CONFIG = {
  clase: {
    titulo: "¿Por qué este acné no mejora aunque estés haciendo todo “bien”?",
    bajada: "Aprende a identificar qué está sosteniendo el cuadro y qué deberías priorizar antes de seguir cambiando productos o protocolos.",
    docente: "Dianela Draganov",
    duracionMin: 90
  },

  /* Banner de la clase: ya trae el título y la foto. La parte derecha tiene que quedar libre para el formulario. */
  banner: "assets/img/banner-clase-acne.jpg",
  fotoDocente: "assets/img/dianela.png",
  logoBootcamp: "assets/img/logo-bootcamp.png", // vacío = logo armado con texto

  horarios: {
    cadaMinutos: 10,              // siempre hay una clase que empieza en menos de 10–13 minutos
    anticipacionMin: 3,           // si falta menos que esto, se ofrece la siguiente
    fijos: ["10:00", "16:00", "20:00", "22:00"], // en hora de Argentina; a cada persona se le muestran en su hora local
    utcBase: -3,                  // Argentina
    horizonteHoras: 24,           // nunca se ofrece una clase a más de 24 horas
    cantidad: 5                   // cuántos horarios se muestran
  },

  sala: {
    toleranciaMin: 15,            // si entra más tarde que esto, se le ofrece otro horario
    entrarDondeVa: true           // si entra tarde (dentro de la tolerancia), el video arranca en el minuto en que va
  },

  /* Video: tipo "mp4" con la URL del archivo, o tipo "youtube" con el id del video no listado. */
  video: {
    tipo: "youtube",
    fuente: "ft33J5L1VHU",        // Webinar del 2/11 (dura 1 h 31 min 34 s)
    inicioSegundo: 33             // arranca acá: antes se ve la grilla de Zoom con caras y nombres de alumnas
  },
  ofertaSegundo: 4886,            // 1:21:26, "creamos un bootcamp a los que los quiero invitar" (precio en 1:26:22)

  oferta: {
    producto: "¿Qué hago con esta piel?",
    fechas: "24, 25 y 26 de noviembre · en vivo por Zoom",
    cupos: 40,
    incluye: [
      "Clase 0 nivelatoria apenas te inscribes",
      "3 jornadas en vivo: acné, pigmentación y envejecimiento",
      "12 casos y 12 planes de acción completos",
      "Grupo de WhatsApp de acompañamiento hasta el 14/12"
    ],
    hotmart: "https://pay.hotmart.com/F108130345D?off=khch8zx2", // link solo para esta página
    whatsapp: "https://wa.link/1c5v5w", // botón flotante y "¿Dudas?" de la oferta (salvo Argentina y Venezuela)

    /* Precio según el país de la persona (sale del código de su WhatsApp o de su zona horaria).
       Si a una región le falta el precio o el link, ve la de dólares. */
    regiones: {
      USD: {
        precio: "125 USD", lista: "245 USD", pago: "hotmart",
        boton: "Inscribirme ahora · 125 USD",
        nota: "Pago seguro por Hotmart. El acceso te llega al correo."
      },
      EUR: {                      // Europa: es el precio que muestra Hotmart para España
        precio: "119 €", lista: "233 €", pago: "hotmart",
        boton: "Inscribirme ahora · 119 €",
        nota: "Pago seguro por Hotmart. El acceso te llega al correo."
      },
      AR: {
        precio: "$ 195.000", lista: "245 USD",
        pago: "https://mpago.li/2raEe9D",
        boton: "Inscribirme con Mercado Pago · $ 195.000",
        nota: "Hasta 3 cuotas sin interés. Después de pagar, envía el comprobante por WhatsApp y te damos el acceso.",
        dudas: "https://wa.link/x5jiat"
      },
      VE: {
        precio: "111.500 Bs", lista: "245 USD",
        pago: "https://wa.link/0t6247", // se paga por Pago Móvil: los datos se pasan por WhatsApp
        boton: "Quiero pagar en bolívares",
        nota: "Te pasamos los datos de Pago Móvil por WhatsApp.",
        dudas: "https://wa.link/0t6247"
      }
    },
    notaAlumnas: "¿Ya eres alumna de Coach Estético? Tu precio es 99 USD: escríbenos por WhatsApp. Si eres miembro activo de LIFE+ o Lifetime, ya lo tienes incluido."
  },

  /* URL de la aplicación web de Apps Script que guarda los registros y manda los emails (ver LEEME.md).
     Vacía: la página funciona igual, pero no guarda nada. */
  registroUrl: "https://script.google.com/macros/s/AKfycbxfqI35QIK0DKLtMXlmpfUvZPBi0SxNVem2_JQcCsEHRVm-PxgkdXvByV5KlHIm5Ux1/exec"
};
