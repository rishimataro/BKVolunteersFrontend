const EXCEL_CONTENT_TYPE = 'application/vnd.ms-excel;charset=utf-8;';
const EXCEL_FONT_NAME = 'Times New Roman';
const EXCEL_FONT_SIZE = '13';

type ExportActor = {
    fullName: string;
    roleLabel: string;
    organizationName: string;
};

type SummaryMetric = {
    label: string;
    value: string;
};

type ModuleOverviewRow = {
    title: string;
    moduleType: string;
    status: string;
    timeWindow: string;
    progress: string;
};

type ModuleSheet = {
    name: string;
    title: string;
    subtitle: string;
    columns: string[];
    rows: Array<Array<string | number>>;
};

export type CampaignReportWorkbookInput = {
    campaignTitle: string;
    campaignSlug: string;
    campaignStatus: string;
    organizationName: string;
    generatedAt: string;
    actor: ExportActor;
    summaryMetrics: SummaryMetric[];
    moduleOverviewRows: ModuleOverviewRow[];
    moduleSheets: ModuleSheet[];
};

type WorksheetDefinition = {
    name: string;
    widths: number[];
    rows: string[];
};

const escapeXml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

const sanitizeSheetName = (value: string) =>
    value
        .replace(/[\\/*?:\[\]]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 31) || 'BaoCao';

const createCell = ({
    value,
    style = 'cell',
    type = 'String',
    mergeAcross,
}: {
    value: string | number;
    style?: string;
    type?: 'String' | 'Number';
    mergeAcross?: number;
}) => {
    const merge = mergeAcross != null ? ` ss:MergeAcross="${mergeAcross}"` : '';
    return `<Cell ss:StyleID="${style}"${merge}><Data ss:Type="${type}">${escapeXml(
        String(value),
    )}</Data></Cell>`;
};

const createRow = (cells: string[]) => `<Row>${cells.join('')}</Row>`;

const formatDisplayDateTime = (value: string) =>
    new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));

const buildSignatureRows = (
    actor: ExportActor,
    generatedAt: string,
    verificationCode: string,
) => [
    createRow([]),
    createRow([
        createCell({
            value: `CHỮ KÝ SỐ NỘI BỘ - ${actor.roleLabel.toUpperCase()}`,
            style: 'signatureTitle',
            mergeAcross: 4,
        }),
    ]),
    createRow([
        createCell({
            value: `Người ký: ${actor.fullName}`,
            style: 'metaValue',
            mergeAcross: 2,
        }),
        createCell({
            value: `Đơn vị: ${actor.organizationName}`,
            style: 'metaValue',
            mergeAcross: 2,
        }),
    ]),
    createRow([
        createCell({
            value: `Thời gian ký: ${formatDisplayDateTime(generatedAt)}`,
            style: 'metaValue',
            mergeAcross: 2,
        }),
        createCell({
            value: `Mã xác thực: ${verificationCode}`,
            style: 'metaValue',
            mergeAcross: 2,
        }),
    ]),
    createRow([
        createCell({
            value: 'Tệp được xác nhận điện tử theo ngữ cảnh phiên xuất báo cáo hiện tại.',
            style: 'note',
            mergeAcross: 4,
        }),
    ]),
];

const buildBannerRows = (
    title: string,
    subtitle: string,
    totalColumns = 6,
) => {
    const normalizedColumns = Math.max(totalColumns, 2);
    const leftSpan = Math.max(Math.floor(normalizedColumns / 2), 1);
    const rightSpan = Math.max(normalizedColumns - leftSpan, 1);

    return [
        createRow([
            createCell({
                value: 'TRƯỜNG ĐẠI HỌC BÁCH KHOA - ĐẠI HỌC ĐÀ NẴNG',
                style: 'banner',
                mergeAcross: Math.max(leftSpan - 1, 0),
            }),
            createCell({
                value: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                style: 'banner',
                mergeAcross: Math.max(rightSpan - 1, 0),
            }),
        ]),
        createRow([
            createCell({
                value: 'BK VOLUNTEERS',
                style: 'banner',
                mergeAcross: Math.max(leftSpan - 1, 0),
            }),
            createCell({
                value: 'Độc lập - Tự do - Hạnh phúc',
                style: 'banner',
                mergeAcross: Math.max(rightSpan - 1, 0),
            }),
        ]),
        createRow([]),
        createRow([
            createCell({
                value: title,
                style: 'title',
                mergeAcross: Math.max(normalizedColumns - 1, 0),
            }),
        ]),
        createRow([
            createCell({
                value: subtitle,
                style: 'subtitle',
                mergeAcross: Math.max(normalizedColumns - 1, 0),
            }),
        ]),
        createRow([]),
    ];
};

const buildSummaryWorksheet = (
    input: CampaignReportWorkbookInput,
    verificationCode: string,
): WorksheetDefinition => {
    const rows: string[] = [];
    rows.push(
        ...buildBannerRows(
            'BÁO CÁO CHIẾN DỊCH THEO THỜI GIAN THỰC',
            input.campaignTitle,
            6,
        ),
    );

    rows.push(
        createRow([
            createCell({ value: 'Đơn vị tổ chức', style: 'metaLabel' }),
            createCell({
                value: input.organizationName,
                style: 'metaValue',
                mergeAcross: 2,
            }),
            createCell({ value: 'Trạng thái', style: 'metaLabel' }),
            createCell({ value: input.campaignStatus, style: 'metaValue' }),
        ]),
        createRow([
            createCell({ value: 'Slug chiến dịch', style: 'metaLabel' }),
            createCell({
                value: input.campaignSlug,
                style: 'metaValue',
                mergeAcross: 2,
            }),
            createCell({ value: 'Thời điểm xuất', style: 'metaLabel' }),
            createCell({
                value: formatDisplayDateTime(input.generatedAt),
                style: 'metaValue',
            }),
        ]),
        createRow([]),
        createRow([
            createCell({
                value: 'TỔNG HỢP CHỈ SỐ THỜI GIAN THỰC',
                style: 'sectionTitle',
                mergeAcross: 5,
            }),
        ]),
        createRow([
            createCell({ value: 'Chỉ số', style: 'tableHeader' }),
            createCell({
                value: 'Giá trị',
                style: 'tableHeader',
                mergeAcross: 4,
            }),
        ]),
    );

    input.summaryMetrics.forEach((metric) => {
        rows.push(
            createRow([
                createCell({ value: metric.label, style: 'tableCell' }),
                createCell({
                    value: metric.value,
                    style: 'tableCell',
                    mergeAcross: 4,
                }),
            ]),
        );
    });

    rows.push(
        createRow([]),
        createRow([
            createCell({
                value: 'TỔNG HỢP THEO MODULE',
                style: 'sectionTitle',
                mergeAcross: 5,
            }),
        ]),
        createRow([
            createCell({ value: 'Module', style: 'tableHeader' }),
            createCell({ value: 'Loại', style: 'tableHeader' }),
            createCell({ value: 'Trạng thái', style: 'tableHeader' }),
            createCell({ value: 'Thời gian', style: 'tableHeader' }),
            createCell({
                value: 'Tiến độ',
                style: 'tableHeader',
                mergeAcross: 1,
            }),
        ]),
    );

    input.moduleOverviewRows.forEach((moduleRow) => {
        rows.push(
            createRow([
                createCell({ value: moduleRow.title, style: 'tableCell' }),
                createCell({ value: moduleRow.moduleType, style: 'tableCell' }),
                createCell({ value: moduleRow.status, style: 'tableCell' }),
                createCell({ value: moduleRow.timeWindow, style: 'tableCell' }),
                createCell({
                    value: moduleRow.progress,
                    style: 'tableCell',
                    mergeAcross: 1,
                }),
            ]),
        );
    });

    rows.push(...buildSignatureRows(input.actor, input.generatedAt, verificationCode));

    return {
        name: sanitizeSheetName('TongQuan'),
        widths: [180, 140, 140, 180, 150, 150],
        rows,
    };
};

const buildModuleWorksheet = (
    sheet: ModuleSheet,
    actor: ExportActor,
    generatedAt: string,
    verificationCode: string,
): WorksheetDefinition => {
    const rows: string[] = [];
    rows.push(...buildBannerRows(sheet.title, sheet.subtitle, sheet.columns.length));
    rows.push(
        createRow(
            sheet.columns.map((column) =>
                createCell({ value: column, style: 'tableHeader' }),
            ),
        ),
    );

    if (sheet.rows.length === 0) {
        rows.push(
            createRow([
                createCell({
                    value: 'Chưa có dữ liệu phát sinh cho module này.',
                    style: 'note',
                    mergeAcross: Math.max(0, sheet.columns.length - 1),
                }),
            ]),
        );
    } else {
        sheet.rows.forEach((row) => {
            rows.push(
                createRow(
                    row.map((value) =>
                        createCell({
                            value,
                            style:
                                typeof value === 'number'
                                    ? 'tableCellCenter'
                                    : 'tableCell',
                            type:
                                typeof value === 'number' ? 'Number' : 'String',
                        }),
                    ),
                ),
            );
        });
    }

    rows.push(...buildSignatureRows(actor, generatedAt, verificationCode));

    return {
        name: sanitizeSheetName(sheet.name),
        widths: Array.from({ length: sheet.columns.length }, () => 120),
        rows,
    };
};

const buildWorkbookXml = (sheets: WorksheetDefinition[]) => {
    const styles = `
<Styles>
  <Style ss:ID="Default" ss:Name="Normal">
    <Alignment ss:Vertical="Center" ss:WrapText="1"/>
    <Borders/>
    <Font ss:FontName="${EXCEL_FONT_NAME}" ss:Size="${EXCEL_FONT_SIZE}"/>
    <Interior/>
    <NumberFormat/>
    <Protection/>
  </Style>
  <Style ss:ID="banner">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    <Font ss:FontName="${EXCEL_FONT_NAME}" ss:Size="${EXCEL_FONT_SIZE}" ss:Bold="1"/>
  </Style>
  <Style ss:ID="title">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    <Font ss:FontName="${EXCEL_FONT_NAME}" ss:Size="${EXCEL_FONT_SIZE}" ss:Bold="1"/>
  </Style>
  <Style ss:ID="subtitle">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    <Font ss:FontName="${EXCEL_FONT_NAME}" ss:Size="${EXCEL_FONT_SIZE}" ss:Italic="1"/>
  </Style>
  <Style ss:ID="sectionTitle">
    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
    <Font ss:FontName="${EXCEL_FONT_NAME}" ss:Size="${EXCEL_FONT_SIZE}" ss:Bold="1"/>
    <Interior ss:Color="#EAF1FB" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="metaLabel">
    <Font ss:FontName="${EXCEL_FONT_NAME}" ss:Size="${EXCEL_FONT_SIZE}" ss:Bold="1"/>
    <Borders>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
    </Borders>
  </Style>
  <Style ss:ID="metaValue">
    <Borders>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
    </Borders>
  </Style>
  <Style ss:ID="tableHeader">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    <Font ss:FontName="${EXCEL_FONT_NAME}" ss:Size="${EXCEL_FONT_SIZE}" ss:Bold="1"/>
    <Borders>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
    </Borders>
    <Interior ss:Color="#DCE6F2" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="tableCell">
    <Borders>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
    </Borders>
  </Style>
  <Style ss:ID="tableCellCenter">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    <Borders>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
    </Borders>
  </Style>
  <Style ss:ID="signatureTitle">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    <Font ss:FontName="${EXCEL_FONT_NAME}" ss:Size="${EXCEL_FONT_SIZE}" ss:Bold="1"/>
  </Style>
  <Style ss:ID="note">
    <Font ss:FontName="${EXCEL_FONT_NAME}" ss:Size="${EXCEL_FONT_SIZE}" ss:Italic="1"/>
  </Style>
</Styles>`;

    const worksheets = sheets
        .map((sheet) => {
            const columns = sheet.widths
                .map((width) => `<Column ss:AutoFitWidth="0" ss:Width="${width}"/>`)
                .join('');

            return `<Worksheet ss:Name="${escapeXml(sheet.name)}"><Table>${columns}${sheet.rows.join(
                '',
            )}</Table></Worksheet>`;
        })
        .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
${styles}
${worksheets}
</Workbook>`;
};

const createVerificationCode = async (input: CampaignReportWorkbookInput) => {
    const encoder = new TextEncoder();
    const payload = JSON.stringify({
        campaignSlug: input.campaignSlug,
        generatedAt: input.generatedAt,
        actor: input.actor,
        moduleSheets: input.moduleSheets.map((sheet) => ({
            name: sheet.name,
            rows: sheet.rows.length,
        })),
        summaryMetrics: input.summaryMetrics,
    });

    if (!globalThis.crypto?.subtle) {
        return btoa(payload).slice(0, 24).toUpperCase();
    }

    const digest = await globalThis.crypto.subtle.digest(
        'SHA-256',
        encoder.encode(payload),
    );
    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 24)
        .toUpperCase();
};

export const createCampaignReportWorkbook = async (
    input: CampaignReportWorkbookInput,
) => {
    const verificationCode = await createVerificationCode(input);
    const sheets: WorksheetDefinition[] = [
        buildSummaryWorksheet(input, verificationCode),
        ...input.moduleSheets.map((sheet) =>
            buildModuleWorksheet(
                sheet,
                input.actor,
                input.generatedAt,
                verificationCode,
            ),
        ),
    ];

    return new Blob([`\ufeff${buildWorkbookXml(sheets)}`], {
        type: EXCEL_CONTENT_TYPE,
    });
};

export const downloadCampaignReportWorkbook = async (
    filename: string,
    input: CampaignReportWorkbookInput,
) => {
    const blob = await createCampaignReportWorkbook(input);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
};
