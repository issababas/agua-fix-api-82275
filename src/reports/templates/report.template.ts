import { CreateReportDto } from '../dto/create-report.dto';

export const generateReportTemplate = (
  dto: CreateReportDto,
): string => {
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
                ${dto.address}
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
                ${dto.description}
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
                ${dto.severity}
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
                ${dto.reporterPhone}
              </td>
            </tr>

          </table>

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