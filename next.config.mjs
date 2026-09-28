/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * El sitio antes era HTML plano y esas URLs siguen circulando: los códigos QR
   * de tarjetas y afiches apuntan a /access.html, y hay links compartidos por
   * WhatsApp e Instagram a las demás. El material impreso no se puede corregir,
   * así que estas rutas tienen que seguir resolviendo para siempre.
   *
   * Los enlaces antiguos usan 308, salvo el QR de marketing: su destino
   * usa 307 para poder cambiarlo en futuras campañas sin caché permanente.
   */
  async redirects() {
    return [
      // El dominio grabado en los QR se conserva; solo cambia el destino.
      // Limitar al dominio público antiguo evita redirigir localhost y previews.
      ...['/', '/access', '/access.html', '/index.html'].map((source) => ({
        source,
        has: [{ type: 'host', value: 'prepscl.vercel.app' }],
        destination: 'https://www.preps.cl/',
        permanent: false,
      })),
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'prepscl.vercel.app' }],
        destination: 'https://www.preps.cl/:path*',
        permanent: false,
      },
      // Conservar ambas direcciones impresas y omitir la antigua introducción.
      { source: '/access.html', destination: '/', permanent: false },
      { source: '/access', destination: '/', permanent: false },

      { source: '/index.html', destination: '/', permanent: true },
      { source: '/nosotros.html', destination: '/nosotros', permanent: true },
      { source: '/protocolo.html', destination: '/protocolo', permanent: true },
      { source: '/calentar.html', destination: '/calentar', permanent: true },
      { source: '/carrito.html', destination: '/carrito', permanent: true },

      // El catálogo viejo mostraba los menús, que ahora viven en Meal Preps.
      // Mandarlo a /catalogo dejaría a la gente en "Próximamente".
      { source: '/catalogo.html', destination: '/personalizar', permanent: true },
      { source: '/producto.html', destination: '/personalizar', permanent: true },

      // personalizar.html era el configurador por gramos
      { source: '/personalizar.html', destination: '/personalizar/lab', permanent: true },
    ];
  },
};

export default nextConfig;
