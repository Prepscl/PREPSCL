/* ────────────────────────────────────────────────────────────────
   Datos para transferir.

   Viven en la configuración del servidor y no en el código: el número
   de cuenta y el RUT del titular no tienen por qué quedar guardados en
   el repositorio. Cambiarlos es cambiar una variable, sin tocar nada.

   Si falta alguno, no se muestra nada: media transferencia mal puesta
   es peor que mandar a la persona a preguntar por WhatsApp.
   ──────────────────────────────────────────────────────────────── */

export interface DatosPago {
  banco: string;
  tipo: string;
  numero: string;
  titular: string;
  rut: string;
  correo: string;
}

export function datosPago(): DatosPago | null {
  const datos = {
    banco: process.env.PAGO_BANCO ?? '',
    tipo: process.env.PAGO_TIPO_CUENTA ?? '',
    numero: process.env.PAGO_NUMERO ?? '',
    titular: process.env.PAGO_TITULAR ?? '',
    rut: process.env.PAGO_RUT ?? '',
    correo: process.env.PAGO_CORREO ?? '',
  };
  const completo = Object.values(datos).every((v) => v.trim().length > 0);
  return completo ? datos : null;
}
