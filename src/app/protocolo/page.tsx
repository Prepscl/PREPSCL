import PaginaConRail from '@/components/PaginaConRail';

export const metadata = {
  title: 'Protocolo de operación — PREPS',
  description: 'Términos y condiciones de PREPS: producción, cadena de frío y reembolsos.',
};

export default function ProtocoloPage() {
  return (
    <PaginaConRail tema="oscuro" ancho={850}>
      <div className="text-center">
        <h1 className="text-[32px] font-semibold uppercase leading-[0.9] tracking-[-1.5px] max-[520px]:text-2xl">
          Protocolo de operación
        </h1>
        <p className="mt-3 text-[10px] uppercase tracking-[2px] text-white/55">
          Términos y condiciones V1.0
        </p>
      </div>

      {/* ── 01 ─────────────────────────────────────────────── */}
      <section className="mt-14 border border-white p-10 max-[520px]:p-6">
        <h2 className="text-base font-semibold uppercase tracking-[-0.5px]">
          01. Ventanas de producción
        </h2>
        <p className="mt-4 text-[13px] uppercase leading-[1.7] tracking-[.5px]">
          PREPS trabaja con pedidos semanales y cupos limitados:
        </p>

        <ul className="mt-5 space-y-4">
          <li className="text-[13px] uppercase leading-[1.7] tracking-[.5px]">
            <span className="mr-2 inline-block bg-white/10 px-2 py-1 text-[10px] font-semibold text-white">
              5 packs
            </span>
            <strong className="font-semibold">Cupos semanales:</strong> la producción de cada semana es limitada. Mientras el carrito esté abierto hay cupo; al llenarse la semana, los pedidos se cierran y el carrito lo indica. Hasta 5 packs por pedido, de cualquier tamaño.
          </li>
          <li className="text-[13px] uppercase leading-[1.7] tracking-[.5px]">
            <span className="mr-2 inline-block bg-white/10 px-2 py-1 text-[10px] font-semibold text-white">
              Lunes AM
            </span>
            <strong className="font-semibold">Despacho semanal:</strong>{' '}
            los lunes por la mañana. El costo depende de la comuna y se suma al total en el carrito, antes de confirmar. El horario se coordina por WhatsApp.
          </li>
        </ul>

        <p className="mt-5 text-[13px] uppercase leading-[1.7] tracking-[.5px]">
          <strong className="font-semibold">Semana completa:</strong> cuando se cierra, el carrito lo avisa y los pedidos entran recién en la siguiente apertura.
        </p>
        <p className="mt-5 text-[10px] uppercase tracking-[1px] text-white/55">
          * El pago es por transferencia. Al confirmar el pedido se muestran los datos y el número que hay que escribir en el mensaje de la transferencia.
        </p>
      </section>

      {/* ── 02 ─────────────────────────────────────────────── */}
      <section className="mt-10 border border-white p-10 max-[520px]:p-6">
        <h2 className="text-base font-semibold uppercase tracking-[-0.5px]">
          02. Cadena de frío y manipulación
        </h2>
        <p className="mt-4 text-[13px] uppercase leading-[1.7] tracking-[.5px]">
          Los productos PREPS son perecederos. El cliente asume la responsabilidad total de
          refrigeración (0 °C a 5 °C) o consumir inmediatamente tras la entrega.
        </p>
        <p className="mt-4 text-[13px] uppercase leading-[1.7] tracking-[.5px]">
          <strong className="font-semibold">Vida útil:</strong> consumir preferentemente antes
          de 4 días en refrigeración, o 3 meses si se mantiene congelado.
        </p>
      </section>

      {/* ── 03 ─────────────────────────────────────────────── */}
      <section className="mt-10 border border-white p-10 max-[520px]:p-6">
        <h2 className="text-base font-semibold uppercase tracking-[-0.5px]">
          03. Política de reembolso y cambios
        </h2>
        <p className="mt-4 text-[13px] uppercase leading-[1.7] tracking-[.5px]">
          Al ser alimentos preparados bajo demanda y personalizados (custom), se aplican las
          siguientes reglas:
        </p>
        <ul className="mt-4 list-square space-y-3 pl-5 [list-style-type:square]">
          <li className="text-[13px] uppercase leading-[1.7] tracking-[.5px]">
            <strong className="font-semibold">Reembolso aplicable:</strong> únicamente si existe
            un error por parte de PREPS en la entrega de un menú equivocado al solicitado.
          </li>
          <li className="text-[13px] uppercase leading-[1.7] tracking-[.5px]">
            <strong className="font-semibold">Reembolso no aplicable:</strong> bajo ninguna otra
            circunstancia se realizarán devoluciones una vez que el ticket ha ingresado a
            fase de cocción.
          </li>
        </ul>
      </section>

      <p className="mt-16 text-center text-xs uppercase tracking-[2px]">
        Al finalizar su compra, el cliente acepta este protocolo.
      </p>
    </PaginaConRail>
  );
}
