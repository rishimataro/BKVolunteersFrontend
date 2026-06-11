import { strFromU8, unzipSync } from 'fflate';

import type { UserManagementItem } from '@/features/users/api/users';
import type { UserRole } from '@/types/api';

import { getImportFieldConfigs, type ParsedImportRow } from './bulk-user-transfer';

const XLSX_CONTENT_TYPE =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const MAIN_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const REL_NS =
    'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const ROWS_PER_EXPORT_SHEET = 24;
const EXPORT_UNIT_NAME = 'BK VOLUNTEERS';

const IMPORT_SHEET_NAME_BY_ROLE: Record<UserRole, string> = {
    SINHVIEN: 'NhapSinhVien',
    LCD: 'NhapLCD',
    CLB: 'NhapCLB',
    DOANTRUONG: 'NhapDoanTruong',
};

type StringCell = {
    type: 'string';
    value: string;
    style: number;
};

type NumberCell = {
    type: 'number';
    value: number;
    style: number;
};

type BlankCell = {
    type: 'blank';
    style: number;
};

type CellDefinition = StringCell | NumberCell | BlankCell;

type RowDefinition = {
    rowNumber: number;
    height?: number;
    cells: Record<number, CellDefinition>;
};

type SheetDefinition = {
    name: string;
    columnWidths: number[];
    rows: RowDefinition[];
    merges?: string[];
    freezePaneTopLeftCell?: string;
    freezeRowCount?: number;
};

type ExportWorkbookOptions = {
    roleFilter?: UserRole | '';
    statusFilter?: '' | 'ACTIVE' | 'LOCKED';
};

const escapeXml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

const columnIndexToName = (index: number) => {
    let current = index + 1;
    let result = '';

    while (current > 0) {
        const remainder = (current - 1) % 26;
        result = String.fromCharCode(65 + remainder) + result;
        current = Math.floor((current - 1) / 26);
    }

    return result;
};

const columnNameToIndex = (value: string) => {
    let result = 0;

    for (const character of value) {
        result = result * 26 + (character.toUpperCase().charCodeAt(0) - 64);
    }

    return result - 1;
};

const normalizeWhitespace = (value: string) => value.replace(/\r/g, '').trim();

const getRoleLabel = (role: UserRole) => {
    if (role === 'SINHVIEN') {
        return 'Sinh viên';
    }

    if (role === 'LCD') {
        return 'Liên chi đoàn khoa';
    }

    if (role === 'CLB') {
        return 'Chủ nhiệm câu lạc bộ';
    }

    return 'Đoàn trường';
};

const getStatusLabel = (status: UserManagementItem['status']) => {
    if (status === 'ACTIVE') {
        return 'Đang hoạt động';
    }

    if (status === 'LOCKED') {
        return 'Tạm khóa';
    }

    return 'Đã vô hiệu';
};

const addSharedString = (
    value: string,
    sharedStrings: string[],
    indexByValue: Map<string, number>,
) => {
    const normalizedValue = value ?? '';
    const existingIndex = indexByValue.get(normalizedValue);

    if (existingIndex !== undefined) {
        return existingIndex;
    }

    const nextIndex = sharedStrings.length;
    sharedStrings.push(normalizedValue);
    indexByValue.set(normalizedValue, nextIndex);
    return nextIndex;
};

const buildStylesXml = () =>
    `${XML_HEADER}
<styleSheet xmlns="${MAIN_NS}">
    <fonts count="5">
    <font><sz val="12"/><name val="Times New Roman"/></font>
    <font><b/><sz val="12"/><name val="Times New Roman"/></font>
    <font><i/><sz val="12"/><name val="Times New Roman"/></font>
    <font><b/><i/><sz val="12"/><name val="Times New Roman"/></font>
        <font><b/><sz val="15"/><name val="Times New Roman"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color auto="1"/></left>
      <right style="thin"><color auto="1"/></right>
      <top style="thin"><color auto="1"/></top>
      <bottom style="thin"><color auto="1"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
    <cellXfs count="9">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
        <xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1">
            <alignment horizontal="center" vertical="center" wrapText="1"/>
        </xf>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
  <dxfs count="0"/>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`;

const buildSharedStringsXml = (sharedStrings: string[]) =>
    `${XML_HEADER}
<sst xmlns="${MAIN_NS}" count="${sharedStrings.length}" uniqueCount="${sharedStrings.length}">
${sharedStrings
    .map(
        (value) =>
            `  <si><t${/^\s|\s$/.test(value) ? ' xml:space="preserve"' : ''}>${escapeXml(value)}</t></si>`,
    )
    .join('\n')}
</sst>`;

const buildWorkbookXml = (sheetNames: string[]) =>
    `${XML_HEADER}
<workbook xmlns="${MAIN_NS}" xmlns:r="${REL_NS}">
  <sheets>
${sheetNames
    .map(
        (sheetName, index) =>
            `    <sheet name="${escapeXml(sheetName)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
    )
    .join('\n')}
  </sheets>
</workbook>`;

const buildWorkbookRelsXml = (sheetCount: number) =>
    `${XML_HEADER}
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${Array.from({ length: sheetCount }, (_, index) => {
    const sheetNumber = index + 1;
    return `  <Relationship Id="rId${sheetNumber}" Type="${REL_NS}/worksheet" Target="worksheets/sheet${sheetNumber}.xml"/>`;
}).join('\n')}
  <Relationship Id="rId${sheetCount + 1}" Type="${REL_NS}/styles" Target="styles.xml"/>
  <Relationship Id="rId${sheetCount + 2}" Type="${REL_NS}/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`;

const buildRootRelsXml = () =>
    `${XML_HEADER}
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="${REL_NS}/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

const buildContentTypesXml = (sheetCount: number) =>
    `${XML_HEADER}
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
    <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
    <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
${Array.from({ length: sheetCount }, (_, index) => {
    const sheetNumber = index + 1;
    return `  <Override PartName="/xl/worksheets/sheet${sheetNumber}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
}).join('\n')}
</Types>`;

const buildAppXml = (sheetNames: string[]) =>
    `${XML_HEADER}
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>BK Volunteers</Application>
  <HeadingPairs>
    <vt:vector size="2" baseType="variant">
      <vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant>
      <vt:variant><vt:i4>${sheetNames.length}</vt:i4></vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector size="${sheetNames.length}" baseType="lpstr">
${sheetNames
    .map((sheetName) => `      <vt:lpstr>${escapeXml(sheetName)}</vt:lpstr>`)
    .join('\n')}
    </vt:vector>
  </TitlesOfParts>
  <Company>BK Volunteers</Company>
</Properties>`;

const buildCoreXml = () => {
    const now = new Date().toISOString();

    return `${XML_HEADER}
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>BK Volunteers</dc:creator>
  <cp:lastModifiedBy>BK Volunteers</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`;
};

const buildCellXml = (
    columnIndex: number,
    rowNumber: number,
    cell: CellDefinition,
    sharedStrings: string[],
    indexByValue: Map<string, number>,
) => {
    const cellRef = `${columnIndexToName(columnIndex)}${rowNumber}`;

    if (cell.type === 'blank') {
        return `<c r="${cellRef}" s="${cell.style}"/>`;
    }

    if (cell.type === 'number') {
        return `<c r="${cellRef}" s="${cell.style}"><v>${cell.value}</v></c>`;
    }

    const sharedIndex = addSharedString(
        cell.value,
        sharedStrings,
        indexByValue,
    );
    return `<c r="${cellRef}" s="${cell.style}" t="s"><v>${sharedIndex}</v></c>`;
};

const buildSheetXml = (
    sheet: SheetDefinition,
    sharedStrings: string[],
    indexByValue: Map<string, number>,
) => {
    const maxColumnCount = Math.max(
        sheet.columnWidths.length,
        ...sheet.rows.map((row) =>
            Math.max(
                0,
                ...Object.keys(row.cells).map((value) => Number(value) + 1),
            ),
        ),
    );
    const lastColumnName = columnIndexToName(Math.max(maxColumnCount - 1, 0));
    const maxRowNumber = Math.max(...sheet.rows.map((row) => row.rowNumber));

    const columnsXml = sheet.columnWidths
        .map(
            (width, index) =>
                `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`,
        )
        .join('');

    const rowsXml = sheet.rows
        .map((row) => {
            const sortedEntries = Object.entries(row.cells).sort(
                ([left], [right]) => Number(left) - Number(right),
            );

            const cellsXml = sortedEntries
                .map(([columnIndex, cell]) =>
                    buildCellXml(
                        Number(columnIndex),
                        row.rowNumber,
                        cell,
                        sharedStrings,
                        indexByValue,
                    ),
                )
                .join('');

            const heightAttrs = row.height
                ? ` ht="${row.height}" customHeight="1"`
                : '';

            return `<row r="${row.rowNumber}" spans="1:${maxColumnCount}"${heightAttrs}>${cellsXml}</row>`;
        })
        .join('');

    const mergeCellsXml =
        sheet.merges && sheet.merges.length
            ? `<mergeCells count="${sheet.merges.length}">${sheet.merges
                  .map((merge) => `<mergeCell ref="${merge}"/>`)
                  .join('')}</mergeCells>`
            : '';

    const sheetViewsXml =
        sheet.freezePaneTopLeftCell && sheet.freezeRowCount
            ? `<sheetViews><sheetView tabSelected="1" workbookViewId="0"><pane ySplit="${sheet.freezeRowCount}" topLeftCell="${sheet.freezePaneTopLeftCell}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="${sheet.freezePaneTopLeftCell}" sqref="${sheet.freezePaneTopLeftCell}"/></sheetView></sheetViews>`
            : '<sheetViews><sheetView tabSelected="1" workbookViewId="0"/></sheetViews>';

    return `${XML_HEADER}
<worksheet xmlns="${MAIN_NS}" xmlns:r="${REL_NS}">
  <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
  <dimension ref="A1:${lastColumnName}${maxRowNumber}"/>
  ${sheetViewsXml}
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${columnsXml}</cols>
  <sheetData>${rowsXml}</sheetData>
  ${mergeCellsXml}
  <pageMargins left="0.3" right="0.3" top="0.3" bottom="0.3" header="0.3" footer="0.3"/>
  <pageSetup paperSize="9" orientation="portrait"/>
</worksheet>`;
};

const CRC_TABLE = (() => {
    const table = new Uint32Array(256);

    for (let index = 0; index < 256; index += 1) {
        let value = index;

        for (let bit = 0; bit < 8; bit += 1) {
            value =
                (value & 1) !== 0
                    ? 0xedb88320 ^ (value >>> 1)
                    : value >>> 1;
        }

        table[index] = value >>> 0;
    }

    return table;
})();

const textEncoder = new TextEncoder();

const toDosDateTime = (date: Date) => {
    const year = Math.max(date.getFullYear(), 1980);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = Math.floor(date.getSeconds() / 2);

    const dosTime = (hours << 11) | (minutes << 5) | seconds;
    const dosDate = ((year - 1980) << 9) | (month << 5) | day;

    return {
        dosDate,
        dosTime,
    };
};

const createCrc32 = (bytes: Uint8Array) => {
    let crc = 0xffffffff;

    for (const byte of bytes) {
        crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }

    return (crc ^ 0xffffffff) >>> 0;
};

const writeUint16 = (target: Uint8Array, offset: number, value: number) => {
    target[offset] = value & 0xff;
    target[offset + 1] = (value >>> 8) & 0xff;
};

const writeUint32 = (target: Uint8Array, offset: number, value: number) => {
    target[offset] = value & 0xff;
    target[offset + 1] = (value >>> 8) & 0xff;
    target[offset + 2] = (value >>> 16) & 0xff;
    target[offset + 3] = (value >>> 24) & 0xff;
};

const createStoredZip = (files: Array<{ path: string; content: string }>) => {
    const fileEntries = files.map((file) => {
        const nameBytes = textEncoder.encode(file.path);
        const dataBytes = textEncoder.encode(file.content);
        const crc32 = createCrc32(dataBytes);
        const timestamp = toDosDateTime(new Date());

        return {
            ...file,
            nameBytes,
            dataBytes,
            crc32,
            ...timestamp,
        };
    });

    let totalSize = 0;
    fileEntries.forEach((entry) => {
        totalSize += 30 + entry.nameBytes.length + entry.dataBytes.length;
    });

    const centralDirectoryOffset = totalSize;

    fileEntries.forEach((entry) => {
        totalSize += 46 + entry.nameBytes.length;
    });

    const endOfCentralDirectoryOffset = totalSize;
    totalSize += 22;

    const archive = new Uint8Array(totalSize);
    let cursor = 0;
    const localHeaderOffsets: number[] = [];

    fileEntries.forEach((entry) => {
        localHeaderOffsets.push(cursor);

        writeUint32(archive, cursor, 0x04034b50);
        writeUint16(archive, cursor + 4, 20);
        writeUint16(archive, cursor + 6, 0x0800);
        writeUint16(archive, cursor + 8, 0);
        writeUint16(archive, cursor + 10, entry.dosTime);
        writeUint16(archive, cursor + 12, entry.dosDate);
        writeUint32(archive, cursor + 14, entry.crc32);
        writeUint32(archive, cursor + 18, entry.dataBytes.length);
        writeUint32(archive, cursor + 22, entry.dataBytes.length);
        writeUint16(archive, cursor + 26, entry.nameBytes.length);
        writeUint16(archive, cursor + 28, 0);
        archive.set(entry.nameBytes, cursor + 30);
        archive.set(entry.dataBytes, cursor + 30 + entry.nameBytes.length);

        cursor += 30 + entry.nameBytes.length + entry.dataBytes.length;
    });

    const centralDirectoryStart = cursor;

    fileEntries.forEach((entry, index) => {
        writeUint32(archive, cursor, 0x02014b50);
        writeUint16(archive, cursor + 4, 20);
        writeUint16(archive, cursor + 6, 20);
        writeUint16(archive, cursor + 8, 0x0800);
        writeUint16(archive, cursor + 10, 0);
        writeUint16(archive, cursor + 12, entry.dosTime);
        writeUint16(archive, cursor + 14, entry.dosDate);
        writeUint32(archive, cursor + 16, entry.crc32);
        writeUint32(archive, cursor + 20, entry.dataBytes.length);
        writeUint32(archive, cursor + 24, entry.dataBytes.length);
        writeUint16(archive, cursor + 28, entry.nameBytes.length);
        writeUint16(archive, cursor + 30, 0);
        writeUint16(archive, cursor + 32, 0);
        writeUint16(archive, cursor + 34, 0);
        writeUint16(archive, cursor + 36, 0);
        writeUint32(archive, cursor + 38, 0);
        writeUint32(archive, cursor + 42, localHeaderOffsets[index] ?? 0);
        archive.set(entry.nameBytes, cursor + 46);

        cursor += 46 + entry.nameBytes.length;
    });

    const centralDirectorySize = cursor - centralDirectoryStart;

    writeUint32(archive, endOfCentralDirectoryOffset, 0x06054b50);
    writeUint16(archive, endOfCentralDirectoryOffset + 4, 0);
    writeUint16(archive, endOfCentralDirectoryOffset + 6, 0);
    writeUint16(
        archive,
        endOfCentralDirectoryOffset + 8,
        fileEntries.length,
    );
    writeUint16(
        archive,
        endOfCentralDirectoryOffset + 10,
        fileEntries.length,
    );
    writeUint32(
        archive,
        endOfCentralDirectoryOffset + 12,
        centralDirectorySize,
    );
    writeUint32(
        archive,
        endOfCentralDirectoryOffset + 16,
        centralDirectoryOffset,
    );
    writeUint16(archive, endOfCentralDirectoryOffset + 20, 0);

    return archive;
};

const buildWorkbookBuffer = (sheets: SheetDefinition[]) => {
    const sharedStrings: string[] = [];
    const sharedStringIndex = new Map<string, number>();

    const files: Array<{ path: string; content: string }> = [
        {
            path: '[Content_Types].xml',
            content: buildContentTypesXml(sheets.length),
        },
        {
            path: '_rels/.rels',
            content: buildRootRelsXml(),
        },
        {
            path: 'docProps/app.xml',
            content: buildAppXml(sheets.map((sheet) => sheet.name)),
        },
        {
            path: 'docProps/core.xml',
            content: buildCoreXml(),
        },
        {
            path: 'xl/workbook.xml',
            content: buildWorkbookXml(sheets.map((sheet) => sheet.name)),
        },
        {
            path: 'xl/_rels/workbook.xml.rels',
            content: buildWorkbookRelsXml(sheets.length),
        },
        {
            path: 'xl/styles.xml',
            content: buildStylesXml(),
        },
    ];

    sheets.forEach((sheet, index) => {
        files.push({
            path: `xl/worksheets/sheet${index + 1}.xml`,
            content: buildSheetXml(sheet, sharedStrings, sharedStringIndex),
        });
    });

    files.push({
        path: 'xl/sharedStrings.xml',
        content: buildSharedStringsXml(sharedStrings),
    });

    return createStoredZip(files);
};

const buildImportSheet = (role: UserRole): SheetDefinition => {
    const headers = getImportFieldConfigs(role).map((field) => field.label);
    const columnWidths = headers.map((header) => {
        if (header === 'Họ và tên') {
            return 28;
        }

        if (header === 'Tên đăng nhập') {
            return 22;
        }

        if (header === 'Email') {
            return 32;
        }

        if (header === 'Mật khẩu') {
            return 18;
        }

        if (header === 'Số điện thoại') {
            return 18;
        }

        if (header === 'Câu lạc bộ') {
            return 24;
        }

        return 16;
    });

    const headerRow: RowDefinition = {
        rowNumber: 1,
        height: 22,
        cells: headers.reduce<Record<number, CellDefinition>>(
            (accumulator, header, index) => {
                accumulator[index] = {
                    type: 'string',
                    value: header,
                    style: 3,
                };
                return accumulator;
            },
            {},
        ),
    };

    const blankRows: RowDefinition[] = Array.from(
        { length: ROWS_PER_EXPORT_SHEET },
        (_, index) => ({
            rowNumber: index + 2,
            height: 20,
            cells: headers.reduce<Record<number, CellDefinition>>(
                (accumulator, _, columnIndex) => {
                    accumulator[columnIndex] = {
                        type: 'blank',
                        style: 4,
                    };
                    return accumulator;
                },
                {},
            ),
        }),
    );

    return {
        name: IMPORT_SHEET_NAME_BY_ROLE[role],
        columnWidths,
        rows: [headerRow, ...blankRows],
        freezePaneTopLeftCell: 'A2',
        freezeRowCount: 1,
    };
};

const buildExportSheet = (
    users: UserManagementItem[],
    pageNumber: number,
    totalPages: number,
    options: ExportWorkbookOptions,
): SheetDefinition => {
    const roleText = options.roleFilter
        ? getRoleLabel(options.roleFilter)
        : 'Tất cả vai trò';
    const statusText =
        options.statusFilter === 'ACTIVE'
            ? 'Đang hoạt động'
            : options.statusFilter === 'LOCKED'
              ? 'Tạm khóa'
              : 'Tất cả trạng thái';

    const now = new Date();
    const dateText = `Đà Nẵng, ngày ${String(now.getDate()).padStart(2, '0')} tháng ${String(
        now.getMonth() + 1,
    ).padStart(2, '0')} năm ${now.getFullYear()}`;

    const rows: RowDefinition[] = [
        {
            rowNumber: 1,
            height: 22,
            cells: {
                0: {
                    type: 'string',
                    value: 'TRƯỜNG ĐẠI HỌC BÁCH KHOA - ĐẠI HỌC ĐÀ NẴNG',
                    style: 1,
                },
                4: {
                    type: 'string',
                    value: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                    style: 1,
                },
            },
        },
        {
            rowNumber: 2,
            height: 22,
            cells: {
                0: { type: 'string', value: '***', style: 1 },
                4: {
                    type: 'string',
                    value: 'Độc lập - Tự do - Hạnh phúc',
                    style: 1,
                },
            },
        },
        {
            rowNumber: 3,
            height: 20,
            cells: {
                0: {
                    type: 'string',
                    value: '------------------------------',
                    style: 1,
                },
                4: {
                    type: 'string',
                    value: '------------------------------',
                    style: 1,
                },
            },
        },
        {
            rowNumber: 5,
            height: 22,
            cells: {
                0: {
                    type: 'string',
                    value: 'DANH SÁCH TÀI KHOẢN ĐƯỢC CẤP',
                    style: 8,
                },
            },
        },
        {
            rowNumber: 6,
            height: 20,
            cells: {
                0: {
                    type: 'string',
                    value: `TÊN ĐƠN VỊ: ${EXPORT_UNIT_NAME}`,
                    style: 6,
                },
            },
        },
        {
            rowNumber: 7,
            height: 20,
            cells: {
                0: {
                    type: 'string',
                    value: `VAI TRÒ: ${roleText}`,
                    style: 6,
                },
                4: {
                    type: 'string',
                    value: `Trang ${pageNumber}/${totalPages}`,
                    style: 1,
                },
            },
        },
        {
            rowNumber: 8,
            height: 20,
            cells: {
                0: {
                    type: 'string',
                    value: `TRẠNG THÁI: ${statusText}`,
                    style: 6,
                },
            },
        },
        {
            rowNumber: 10,
            height: 22,
            cells: {
                0: { type: 'string', value: 'STT', style: 3 },
                1: { type: 'string', value: 'Họ và tên', style: 3 },
                2: { type: 'string', value: 'Tên đăng nhập', style: 3 },
                3: { type: 'string', value: 'Email', style: 3 },
                4: { type: 'string', value: 'MSSV', style: 3 },
                5: { type: 'string', value: 'Đơn vị', style: 3 },
                6: { type: 'string', value: 'Trạng thái', style: 3 },
            },
        },
    ];

    Array.from({ length: ROWS_PER_EXPORT_SHEET }, (_, index) => {
        const user = users[index];

        rows.push({
            rowNumber: 11 + index,
            height: 20,
            cells: {
                0: user
                    ? { type: 'number', value: index + 1, style: 5 }
                    : { type: 'blank', style: 5 },
                1: user
                    ? {
                          type: 'string',
                          value: user.fullName || user.username || user.email,
                          style: 4,
                      }
                    : { type: 'blank', style: 4 },
                2: user
                    ? { type: 'string', value: user.username, style: 4 }
                    : { type: 'blank', style: 4 },
                3: user
                    ? { type: 'string', value: user.email, style: 4 }
                    : { type: 'blank', style: 4 },
                4: user
                    ? { type: 'string', value: user.mssv ?? '', style: 5 }
                    : { type: 'blank', style: 5 },
                5: user
                    ? {
                          type: 'string',
                          value:
                              user.managedClubName || user.facultyName || '',
                          style: 4,
                      }
                    : { type: 'blank', style: 4 },
                6: user
                    ? {
                          type: 'string',
                          value: getStatusLabel(user.status),
                          style: 5,
                      }
                    : { type: 'blank', style: 5 },
            },
        });
    });

    const signatureRow = 11 + ROWS_PER_EXPORT_SHEET + 2;
    rows.push(
        {
            rowNumber: signatureRow,
            height: 20,
            cells: {
                4: {
                    type: 'string',
                    value: dateText,
                    style: 1,
                },
            },
        },
        {
            rowNumber: signatureRow + 1,
            height: 20,
            cells: {
                4: {
                    type: 'string',
                    value: 'NGƯỜI LẬP BIỂU',
                    style: 1,
                },
            },
        },
        {
            rowNumber: signatureRow + 2,
            height: 20,
            cells: {
                4: {
                    type: 'string',
                    value: '(Ký, ghi rõ họ tên)',
                    style: 2,
                },
            },
        },
    );

    return {
        name: `DanhSach${pageNumber}`,
        columnWidths: [7, 28, 22, 34, 16, 24, 18],
        rows,
        merges: [
            'A1:D1',
            'E1:G1',
            'A2:D2',
            'E2:G2',
            'A3:D3',
            'E3:G3',
            'A5:G5',
            'A6:G6',
            'A7:D7',
            'A8:D8',
            `E${signatureRow}:G${signatureRow}`,
            `E${signatureRow + 1}:G${signatureRow + 1}`,
            `E${signatureRow + 2}:G${signatureRow + 2}`,
        ],
    };
};

const extractTextFromNode = (node: Element) => {
    const textNodes = Array.from(node.getElementsByTagNameNS(MAIN_NS, 't'));
    if (!textNodes.length) {
        return normalizeWhitespace(node.textContent ?? '');
    }

    return textNodes.map((textNode) => textNode.textContent ?? '').join('').trim();
};

const getFirstWorksheetPath = (
    workbookDocument: XMLDocument,
    workbookRelsDocument: XMLDocument,
) => {
    const sheet = workbookDocument.getElementsByTagNameNS(MAIN_NS, 'sheet')[0];
    const relationshipId =
        sheet?.getAttributeNS(REL_NS, 'id') ?? sheet?.getAttribute('r:id');

    if (!relationshipId) {
        return 'xl/worksheets/sheet1.xml';
    }

    const relationships = Array.from(
        workbookRelsDocument.getElementsByTagName('Relationship'),
    );
    const relationship = relationships.find(
        (item) => item.getAttribute('Id') === relationshipId,
    );

    return relationship?.getAttribute('Target')
        ? `xl/${relationship.getAttribute('Target')}`
        : 'xl/worksheets/sheet1.xml';
};

export const createImportTemplateWorkbook = (role: UserRole) =>
    buildWorkbookBuffer([buildImportSheet(role)]);

export const createUsersExportWorkbook = (
    users: UserManagementItem[],
    options: ExportWorkbookOptions = {},
) => {
    const totalPages = Math.max(
        1,
        Math.ceil(users.length / ROWS_PER_EXPORT_SHEET),
    );
    const sheets = Array.from({ length: totalPages }, (_, index) => {
        const pageNumber = index + 1;
        const startIndex = index * ROWS_PER_EXPORT_SHEET;
        const pageUsers = users.slice(
            startIndex,
            startIndex + ROWS_PER_EXPORT_SHEET,
        );

        return buildExportSheet(pageUsers, pageNumber, totalPages, options);
    });

    return buildWorkbookBuffer(sheets);
};

export const parseXlsxRows = (buffer: ArrayBuffer): string[][] => {
    const files = unzipSync(new Uint8Array(buffer));
    const workbookXml = files['xl/workbook.xml'];
    const workbookRelsXml = files['xl/_rels/workbook.xml.rels'];

    if (!workbookXml || !workbookRelsXml) {
        throw new Error('Không tìm thấy cấu trúc workbook trong tệp Excel.');
    }

    const parser = new DOMParser();
    const workbookDocument = parser.parseFromString(
        strFromU8(workbookXml),
        'application/xml',
    );
    const workbookRelsDocument = parser.parseFromString(
        strFromU8(workbookRelsXml),
        'application/xml',
    );
    const firstWorksheetPath = getFirstWorksheetPath(
        workbookDocument,
        workbookRelsDocument,
    );
    const sheetXml = files[firstWorksheetPath];

    if (!sheetXml) {
        throw new Error('Không tìm thấy sheet dữ liệu trong tệp Excel.');
    }

    const sheetDocument = parser.parseFromString(
        strFromU8(sheetXml),
        'application/xml',
    );
    const sharedStringsXml = files['xl/sharedStrings.xml'];
    const sharedStrings = sharedStringsXml
        ? Array.from(
              parser
                  .parseFromString(
                      strFromU8(sharedStringsXml),
                      'application/xml',
                  )
                  .getElementsByTagNameNS(MAIN_NS, 'si'),
          ).map((node) => extractTextFromNode(node))
        : [];

    const rowNodes = Array.from(
        sheetDocument.getElementsByTagNameNS(MAIN_NS, 'row'),
    );

    const rows = rowNodes.map((rowNode) => {
        const cells = Array.from(rowNode.getElementsByTagNameNS(MAIN_NS, 'c'));
        const values: string[] = [];

        cells.forEach((cellNode) => {
            const cellRef = cellNode.getAttribute('r') ?? '';
            const columnLetters = cellRef.replace(/[0-9]/g, '');
            const columnIndex = columnLetters
                ? columnNameToIndex(columnLetters)
                : values.length;
            const cellType = cellNode.getAttribute('t');
            const valueNode = cellNode.getElementsByTagNameNS(MAIN_NS, 'v')[0];
            const inlineStringNode = cellNode.getElementsByTagNameNS(
                MAIN_NS,
                'is',
            )[0];

            let value = '';
            if (cellType === 's' && valueNode?.textContent) {
                value = sharedStrings[Number(valueNode.textContent)] ?? '';
            } else if (cellType === 'inlineStr' && inlineStringNode) {
                value = extractTextFromNode(inlineStringNode);
            } else if (valueNode?.textContent) {
                value = valueNode.textContent.trim();
            }

            while (values.length < columnIndex) {
                values.push('');
            }

            values[columnIndex] = value;
        });

        return values;
    });

    return rows
        .map((row) => {
            let lastNonEmptyIndex = row.length - 1;
            while (lastNonEmptyIndex >= 0 && !row[lastNonEmptyIndex]?.trim()) {
                lastNonEmptyIndex -= 1;
            }

            return row.slice(0, lastNonEmptyIndex + 1);
        })
        .filter((row) => row.some((cell) => cell.trim().length > 0));
};

export const convertXlsxRowsToObjects = (rows: string[][]) => {
    if (!rows.length) {
        return {
            headers: [] as string[],
            records: [] as ParsedImportRow[],
        };
    }

    const headers = rows[0].map((header) => header.trim());
    const records = rows
        .slice(1)
        .filter((row) => row.some((cell) => cell.trim().length > 0))
        .map((row) =>
            headers.reduce<ParsedImportRow>((accumulator, header, index) => {
                accumulator[header] = row[index]?.trim() ?? '';
                return accumulator;
            }, {}),
        );

    return { headers, records };
};

export const getWorkbookMimeType = () => XLSX_CONTENT_TYPE;
