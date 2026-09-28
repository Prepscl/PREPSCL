import Link from 'next/link';

/** Plan semanal; la disponibilidad se confirma antes del pago. */
export default function CompraInfo({ compacto = false }: { compacto?: boolean }) {
  return (
    <section className="compra-info" aria-label="Antes de pedir">
      {/* También en compacto: sin encabezado, las cuatro preguntas caían justo
          debajo del botón y se leían como más letra chica en vez de como una
          sección aparte a la que se entra solo si hace falta. */}
      <h2 className={compacto ? 'compra-info-titulo' : undefined}>Antes de pedir</h2>
      <details open={compacto ? undefined : true}>
        <summary>¿Cómo funcionan los cupos semanales?</summary>
        <p>Cocinamos por semana y con capacidad limitada. Mientras el carrito esté abierto, hay cupo: cuando se llena la semana cerramos los pedidos y el carrito lo avisa. Puedes pedir hasta 5 packs en un mismo pedido, de cualquier tamaño: 5, 15 o 28 comidas.</p>
      </details>
      <details open={compacto ? undefined : true}>
        <summary>¿Cuándo se despacha mi pedido?</summary>
        <p>Despachamos una vez por semana, los lunes por la mañana. El horario lo coordinamos por WhatsApp cuando confirmamos tu pedido. Si la semana ya está cerrada, el carrito te lo dice antes de que llenes tus datos.</p>
      </details>
      <details>
        <summary>¿Cuánto cuesta el despacho y cómo pago?</summary>
        <p>El despacho depende de tu comuna y lo ves sumado al total antes de confirmar, en el carrito. Si tu comuna está fuera del reparto, el pedido queda anotado y lo coordinamos por WhatsApp. El pago es por transferencia: al confirmar te mostramos los datos y el número de pedido para poner en el mensaje, y nos mandas el comprobante por WhatsApp.</p>
      </details>
      <details>
        <summary>¿Dónde reviso conservación y preparación?</summary>
        <p>Revisa las indicaciones de <Link href="/protocolo">conservación y condiciones</Link> y la <Link href="/calentar">guía para calentar tu PREPS</Link>. Si tienes alergias o restricciones, consulta los ingredientes antes de pedir.</p>
      </details>
    </section>
  );
}
