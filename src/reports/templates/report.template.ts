import { CreateReportDto } from '../dto/create-report.dto';

/**
 * Escapa los caracteres especiales HTML para evitar inyección.
 */
function escHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Valida que una URL sea segura para incluir en un atributo src.
 * Solo acepta http:// o https://, nunca credenciales embebidas.
 */
function safeImgSrc(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    // Rechazar URLs con credenciales (user:pass@host)
    if (parsed.username || parsed.password) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export const generateReportTemplate = (
  dto: CreateReportDto,
  photoUrl?: string,
): string => {
  const safeSrc = photoUrl ? safeImgSrc(photoUrl) : null;

  const photoSection = safeSrc
    ? `
          <div style="margin-top: 20px; text-align: center;">
            <img
              src="${safeSrc}"
              alt="Fotografía de la fuga"
              style="max-width: 100%; border-radius: 8px; border: 1px solid #ddd;"
            />
            <p style="color: #6b7280; font-size: 13px; margin-top: 8px;">
              Fotografía adjunta al reporte
            </p>
          </div>`
    : '';

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Nuevo reporte de fuga de agua</title>
      </head>

      <body style="
        margin: 0;
        padding: 0;
        background-color: #f4f6f8;
        font-family: Arial, sans-serif;
      ">

        <div style="
          max-width: 600px;
          margin: 30px auto;
          background-color: white;
          padding: 30px;
          border-radius: 10px;
        ">

          <h1 style="
            margin-top: 0;
            color: #1f2937;
          ">
            Nuevo reporte de fuga de agua
          </h1>

          <p style="color: #4b5563;">
            Se ha registrado un nuevo reporte ciudadano.
          </p>

          <table style="
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          ">

            <tr>
              <td style="
                padding: 10px;
                font-weight: bold;
                border-bottom: 1px solid #ddd;
              ">
                Dirección
              </td>

              <td style="
                padding: 10px;
                border-bottom: 1px solid #ddd;
              ">
                ${escHtml(dto.address)}
              </td>
            </tr>

            <tr>
              <td style="
                padding: 10px;
                font-weight: bold;
                border-bottom: 1px solid #ddd;
              ">
                Descripción
              </td>

              <td style="
                padding: 10px;
                border-bottom: 1px solid #ddd;
              ">
                ${escHtml(dto.description)}
              </td>
            </tr>

            <tr>
              <td style="
                padding: 10px;
                font-weight: bold;
                border-bottom: 1px solid #ddd;
              ">
                Severidad
              </td>

              <td style="
                padding: 10px;
                border-bottom: 1px solid #ddd;
              ">
                ${escHtml(dto.severity)}
              </td>
            </tr>

            <tr>
              <td style="
                padding: 10px;
                font-weight: bold;
              ">
                Teléfono
              </td>

              <td style="
                padding: 10px;
              ">
                ${escHtml(dto.reporterPhone)}
              </td>
            </tr>

          </table>

          ${photoSection}

          <p style="
            margin-top: 30px;
            color: #6b7280;
            font-size: 14px;
          ">
            Este correo fue generado automáticamente por Agua Fix.
          </p>

        </div>

      </body>
    </html>
  `;
};