import { generateReportTemplate } from './report.template';

const baseDto = {
  address: 'Calle Falsa 123',
  description: 'Fuga en la banqueta',
  severity: 'high',
  reporterPhone: '4771234567',
};

describe('generateReportTemplate', () => {
  it('contiene los datos del reporte', () => {
    const html = generateReportTemplate(baseDto);
    expect(html).toContain('Calle Falsa 123');
    expect(html).toContain('Fuga en la banqueta');
    expect(html).toContain('high');
    expect(html).toContain('4771234567');
  });

  it('muestra la imagen cuando se pasa photoUrl válida', () => {
    const html = generateReportTemplate(
      baseDto,
      'https://s3.example.com/reports/uuid.jpg',
    );
    expect(html).toContain('<img');
    expect(html).toContain('https://s3.example.com/reports/uuid.jpg');
  });

  it('NO muestra la imagen cuando photoUrl no se pasa', () => {
    const html = generateReportTemplate(baseDto);
    expect(html).not.toContain('<img');
  });

  it('escapa caracteres HTML en address', () => {
    const html = generateReportTemplate({
      ...baseDto,
      address: '<script>alert("xss")</script>',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escapa caracteres HTML en description', () => {
    const html = generateReportTemplate({
      ...baseDto,
      description: '<b>bold</b> & "quoted"',
    });
    expect(html).not.toContain('<b>');
    expect(html).toContain('&lt;b&gt;');
    expect(html).toContain('&amp;');
    expect(html).toContain('&quot;');
  });

  it('rechaza photoUrl con protocolo no http/https', () => {
    const html = generateReportTemplate(
      baseDto,
      'javascript:alert(1)',
    );
    expect(html).not.toContain('<img');
    expect(html).not.toContain('javascript:');
  });

  it('rechaza photoUrl con credenciales embebidas', () => {
    const html = generateReportTemplate(
      baseDto,
      'https://user:pass@s3.example.com/key',
    );
    expect(html).not.toContain('<img');
  });
});
