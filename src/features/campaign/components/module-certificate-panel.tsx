import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/components/ui/notifications';
import {
    attachRenderedCertificateFiles,
    type CampaignCertificate,
    type CertificateCandidate,
    generateCertificates,
    renderCertificate,
    revokeCertificate,
    listCampaignCertificates,
    previewCertificateCandidates,
} from '@/features/certificates/api/management';
import {
    createTemplate,
    getTemplates,
    updateTemplate,
    type CertificateTemplate,
} from '@/features/certificates/api/templates';
import { uploadStorageFile } from '@/features/storage/api/storage';
import { toDisplayTitle } from '@/utils/display-text';

type ModuleCertificatePanelProps = {
    campaignId: string;
    module: {
        id: string;
        title: string;
        type: string;
    };
    canMutateCampaign: boolean;
};

type SignaturePoint = {
    x: number;
    y: number;
};

type SignatureStroke = SignaturePoint[];

type LayoutConfig = {
    recipientName: {
        x: number;
        y: number;
        fontSize: number;
        color: string;
        align: 'left' | 'center' | 'right';
        fontWeight: '400' | '500' | '600' | '700';
    };
    signature: {
        enabled: boolean;
        x: number;
        y: number;
        width: number;
        height: number;
        color: string;
        lineWidth: number;
        strokes: SignatureStroke[];
    };
};

type PlacementMode = 'recipientName' | 'signature' | null;

const defaultLayout: LayoutConfig = {
    recipientName: {
        x: 50,
        y: 55,
        fontSize: 44,
        color: '#0f172a',
        align: 'center',
        fontWeight: '700',
    },
    signature: {
        enabled: false,
        x: 76,
        y: 82,
        width: 22,
        height: 12,
        color: '#0f172a',
        lineWidth: 2.6,
        strokes: [],
    },
};

const getTemplateTypeByModule = (moduleType: string) =>
    moduleType === 'fundraising' ||
    moduleType === 'item_donation' ||
    moduleType === 'FUNDRAISING_MONEY' ||
    moduleType === 'ITEM_DONATION'
        ? 'DONOR'
        : 'VOLUNTEER';

const buildDefaultTemplateName = (moduleTitle: string) =>
    `Giấy chứng nhận ${moduleTitle}`;

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

const readImageDimensions = (file: File) =>
    new Promise<{ width: number; height: number; image: HTMLImageElement }>(
        (resolve, reject) => {
            const objectUrl = URL.createObjectURL(file);
            const image = new Image();

            image.onload = () => {
                resolve({
                    width: image.naturalWidth,
                    height: image.naturalHeight,
                    image,
                });
                URL.revokeObjectURL(objectUrl);
            };

            image.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Không thể đọc ảnh nền chứng nhận.'));
            };

            image.src = objectUrl;
        },
    );

const replaceFileExtension = (name: string, extension: string) => {
    const normalized = extension.startsWith('.') ? extension : `.${extension}`;
    return name.replace(/\.[^.]+$/, '') + normalized;
};

const optimizeBackgroundImage = async (file: File) => {
    const { width, height, image } = await readImageDimensions(file);
    const maxSide = 2200;
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    if (
        scale === 1 &&
        file.size <= 1_500_000 &&
        (file.type === 'image/webp' || file.type === 'image/jpeg')
    ) {
        return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d');
    if (!context) {
        return file;
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const targetType = file.type === 'image/png' ? 'image/webp' : file.type;
    const quality = targetType === 'image/png' ? undefined : 0.9;

    const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, targetType, quality);
    });

    if (!blob) {
        return file;
    }

    return new File(
        [blob],
        replaceFileExtension(
            file.name,
            targetType === 'image/webp' ? '.webp' : '.jpg',
        ),
        {
            type: targetType,
            lastModified: file.lastModified,
        },
    );
};

const normalizeLayout = (
    value?: Record<string, unknown> | null,
): LayoutConfig => {
    const recipientName =
        value &&
        typeof value.recipientName === 'object' &&
        value.recipientName !== null
            ? (value.recipientName as Record<string, unknown>)
            : {};
    const signature =
        value && typeof value.signature === 'object' && value.signature !== null
            ? (value.signature as Record<string, unknown>)
            : {};

    const rawStrokes = Array.isArray(signature.strokes)
        ? signature.strokes
        : [];
    const strokes = rawStrokes
        .map((stroke) =>
            Array.isArray(stroke)
                ? stroke
                      .map((point) =>
                          point && typeof point === 'object'
                              ? {
                                    x:
                                        typeof (
                                            point as Record<string, unknown>
                                        ).x === 'number'
                                            ? clamp(
                                                  (
                                                      point as Record<
                                                          string,
                                                          number
                                                      >
                                                  ).x,
                                                  0,
                                                  1,
                                              )
                                            : 0,
                                    y:
                                        typeof (
                                            point as Record<string, unknown>
                                        ).y === 'number'
                                            ? clamp(
                                                  (
                                                      point as Record<
                                                          string,
                                                          number
                                                      >
                                                  ).y,
                                                  0,
                                                  1,
                                              )
                                            : 0,
                                }
                              : null,
                      )
                      .filter(Boolean)
                : [],
        )
        .filter((stroke) => stroke.length > 0) as SignatureStroke[];

    return {
        recipientName: {
            x:
                typeof recipientName.x === 'number'
                    ? clamp(recipientName.x, 0, 100)
                    : defaultLayout.recipientName.x,
            y:
                typeof recipientName.y === 'number'
                    ? clamp(recipientName.y, 0, 100)
                    : defaultLayout.recipientName.y,
            fontSize:
                typeof recipientName.fontSize === 'number'
                    ? clamp(recipientName.fontSize, 18, 96)
                    : defaultLayout.recipientName.fontSize,
            color:
                typeof recipientName.color === 'string'
                    ? recipientName.color
                    : defaultLayout.recipientName.color,
            align:
                recipientName.align === 'left' ||
                recipientName.align === 'right' ||
                recipientName.align === 'center'
                    ? recipientName.align
                    : defaultLayout.recipientName.align,
            fontWeight:
                recipientName.fontWeight === '400' ||
                recipientName.fontWeight === '500' ||
                recipientName.fontWeight === '600' ||
                recipientName.fontWeight === '700'
                    ? recipientName.fontWeight
                    : defaultLayout.recipientName.fontWeight,
        },
        signature: {
            enabled:
                typeof signature.enabled === 'boolean'
                    ? signature.enabled
                    : defaultLayout.signature.enabled,
            x:
                typeof signature.x === 'number'
                    ? clamp(signature.x, 0, 100)
                    : defaultLayout.signature.x,
            y:
                typeof signature.y === 'number'
                    ? clamp(signature.y, 0, 100)
                    : defaultLayout.signature.y,
            width:
                typeof signature.width === 'number'
                    ? clamp(signature.width, 8, 40)
                    : defaultLayout.signature.width,
            height:
                typeof signature.height === 'number'
                    ? clamp(signature.height, 6, 30)
                    : defaultLayout.signature.height,
            color:
                typeof signature.color === 'string'
                    ? signature.color
                    : defaultLayout.signature.color,
            lineWidth:
                typeof signature.lineWidth === 'number'
                    ? clamp(signature.lineWidth, 1, 8)
                    : defaultLayout.signature.lineWidth,
            strokes,
        },
    };
};

const formatIssuedStatus = (status: string) => {
    switch (status) {
        case 'PENDING':
            return 'Chờ render';
        case 'READY':
            return 'Sẵn sàng tải';
        case 'SIGNED':
            return 'Đã cấp';
        case 'REVOKED':
            return 'Đã thu hồi';
        default:
            return status;
    }
};

const formatEligibilitySource = (source?: string) => {
    switch (source) {
        case 'VOLUNTEER':
            return 'Hoàn thành tình nguyện';
        case 'FUNDRAISING':
            return 'Đóng góp gây quỹ';
        case 'ITEM_DONATION':
            return 'Quyên góp hiện vật';
        default:
            return 'Đủ điều kiện';
    }
};

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return 'Chưa cập nhật';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Chưa cập nhật';
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const getCertificatePreviewImageUrl = (certificate: CampaignCertificate) =>
    certificate.generated_file_url ??
    certificate.signed_file_url ??
    certificate.preview_image_url;

const getCertificateOpenUrl = (certificate: CampaignCertificate) => {
    const directUrl =
        certificate.preview_image_url ??
        certificate.signed_file_url ??
        certificate.generated_file_url;

    if (directUrl) {
        return directUrl;
    }

    if (
        certificate.file_url &&
        !certificate.file_url.startsWith('data:text/plain')
    ) {
        return certificate.file_url;
    }

    return null;
};

const getCertificateRecipientName = (certificate: CampaignCertificate) => {
    const snapshot =
        certificate.snapshot_json &&
        typeof certificate.snapshot_json === 'object'
            ? (certificate.snapshot_json as Record<string, unknown>)
            : null;

    const snapshotName = snapshot?.student_name;
    return typeof snapshotName === 'string' && snapshotName.trim().length > 0
        ? snapshotName.trim()
        : certificate.student_name;
};

const loadImageElement = (source: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = () =>
            reject(new Error('Không thể tải ảnh nền chứng nhận để render.'));
        image.src = source;
    });

const sanitizeFileNamePart = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();

const renderCertificateSnapshotFile = async (
    certificate: CampaignCertificate,
) => {
    const layout = normalizeLayout(
        certificate.layout_json && typeof certificate.layout_json === 'object'
            ? (certificate.layout_json as Record<string, unknown>)
            : null,
    );
    const backgroundSource =
        certificate.background_file_url ??
        getCertificatePreviewImageUrl(certificate) ??
        null;
    const recipientName = getCertificateRecipientName(certificate);
    const backgroundImage = backgroundSource
        ? await loadImageElement(backgroundSource)
        : null;
    const width = backgroundImage?.naturalWidth || 1600;
    const height = backgroundImage?.naturalHeight || 1200;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Không thể khởi tạo vùng vẽ chứng nhận.');
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    if (backgroundImage) {
        context.drawImage(backgroundImage, 0, 0, width, height);
    }

    const textX = (layout.recipientName.x / 100) * width;
    const textY = (layout.recipientName.y / 100) * height;
    context.textAlign = layout.recipientName.align;
    context.textBaseline = 'middle';
    context.fillStyle = layout.recipientName.color;
    context.font = `${layout.recipientName.fontWeight} ${layout.recipientName.fontSize}px "Times New Roman"`;
    context.fillText(recipientName, textX, textY, width * 0.8);

    if (layout.signature.enabled && layout.signature.strokes.length > 0) {
        const signatureWidth = (layout.signature.width / 100) * width;
        const signatureHeight = (layout.signature.height / 100) * height;
        const signatureLeft =
            (layout.signature.x / 100) * width - signatureWidth / 2;
        const signatureTop =
            (layout.signature.y / 100) * height - signatureHeight / 2;

        context.strokeStyle = layout.signature.color;
        context.lineWidth = layout.signature.lineWidth;
        context.lineCap = 'round';
        context.lineJoin = 'round';

        layout.signature.strokes.forEach((stroke) => {
            if (stroke.length === 0) {
                return;
            }

            context.beginPath();
            context.moveTo(
                signatureLeft + stroke[0].x * signatureWidth,
                signatureTop + stroke[0].y * signatureHeight,
            );

            if (stroke.length === 1) {
                context.lineTo(
                    signatureLeft + stroke[0].x * signatureWidth + 0.5,
                    signatureTop + stroke[0].y * signatureHeight + 0.5,
                );
            } else {
                stroke.slice(1).forEach((point) => {
                    context.lineTo(
                        signatureLeft + point.x * signatureWidth,
                        signatureTop + point.y * signatureHeight,
                    );
                });
            }

            context.stroke();
        });
    }

    const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
    });

    if (!blob) {
        throw new Error('Không thể xuất ảnh chứng nhận.');
    }

    const safeCode = sanitizeFileNamePart(
        certificate.student_code || 'student',
    );
    const safeCertificateNo = sanitizeFileNamePart(certificate.certificate_no);

    return new File([blob], `${safeCode}-${safeCertificateNo}.png`, {
        type: 'image/png',
        lastModified: Date.now(),
    });
};

const getSignatureStrokePath = (stroke: SignatureStroke) => {
    if (stroke.length === 0) {
        return '';
    }

    const [firstPoint, ...remainingPoints] = stroke;
    return `M ${firstPoint.x * 100} ${firstPoint.y * 100} ${remainingPoints
        .map((point) => `L ${point.x * 100} ${point.y * 100}`)
        .join(' ')}`;
};

const SignatureCanvas = ({
    color,
    lineWidth,
    strokes,
    onChange,
}: {
    color: string;
    lineWidth: number;
    strokes: SignatureStroke[];
    onChange: (next: SignatureStroke[]) => void;
}) => {
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const strokesRef = React.useRef<SignatureStroke[]>(strokes);
    const isDrawingRef = React.useRef(false);
    const currentStrokeRef = React.useRef<SignatureStroke>([]);

    React.useEffect(() => {
        strokesRef.current = strokes;
    }, [strokes]);

    const redrawCanvas = React.useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        const width = canvas.width;
        const height = canvas.height;
        context.clearRect(0, 0, width, height);
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = color;
        context.lineWidth = lineWidth;

        strokes.forEach((stroke) => {
            if (stroke.length === 1) {
                const [point] = stroke;
                context.beginPath();
                context.arc(
                    point.x * width,
                    point.y * height,
                    Math.max(lineWidth, 2),
                    0,
                    Math.PI * 2,
                );
                context.fillStyle = color;
                context.fill();
                return;
            }

            if (stroke.length < 2) {
                return;
            }

            context.beginPath();
            context.moveTo(stroke[0].x * width, stroke[0].y * height);
            stroke.slice(1).forEach((point) => {
                context.lineTo(point.x * width, point.y * height);
            });
            context.stroke();
        });
    }, [color, lineWidth, strokes]);

    React.useEffect(() => {
        redrawCanvas();
    }, [redrawCanvas]);

    const getRelativePoint = React.useCallback(
        (event: PointerEvent | React.PointerEvent) => {
            const canvas = canvasRef.current;
            if (!canvas) {
                return null;
            }

            const rect = canvas.getBoundingClientRect();
            if (!rect.width || !rect.height) {
                return null;
            }

            return {
                x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
                y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
            };
        },
        [],
    );

    const handlePointerDown = (
        event: React.PointerEvent<HTMLCanvasElement>,
    ) => {
        const point = getRelativePoint(event);
        if (!point) {
            return;
        }

        isDrawingRef.current = true;
        currentStrokeRef.current = [point];
        event.currentTarget.setPointerCapture(event.pointerId);
        const nextStrokes = [...strokesRef.current, [point]];
        strokesRef.current = nextStrokes;
        onChange(nextStrokes);
    };

    const handlePointerMove = (
        event: React.PointerEvent<HTMLCanvasElement>,
    ) => {
        if (!isDrawingRef.current) {
            return;
        }

        const point = getRelativePoint(event);
        if (!point) {
            return;
        }

        currentStrokeRef.current = [...currentStrokeRef.current, point];
        const nextStrokes = [...strokesRef.current];
        nextStrokes[nextStrokes.length - 1] = currentStrokeRef.current;
        strokesRef.current = nextStrokes;
        onChange(nextStrokes);
    };

    const endDrawing = (event?: React.PointerEvent<HTMLCanvasElement>) => {
        if (event?.currentTarget && event.pointerId !== undefined) {
            try {
                event.currentTarget.releasePointerCapture(event.pointerId);
            } catch {
                // Ignore browsers that already released the pointer capture.
            }
        }

        isDrawingRef.current = false;
        currentStrokeRef.current = [];
    };

    return (
        <div className="space-y-2">
            <canvas
                ref={canvasRef}
                width={900}
                height={260}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrawing}
                onPointerLeave={endDrawing}
                className="h-52 w-full touch-none rounded-lg border border-slate-300 bg-white"
            />
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <span>Giữ chuột hoặc bút cảm ứng để vẽ chữ ký.</span>
                <button
                    type="button"
                    onClick={() => onChange([])}
                    className="font-semibold text-slate-700 underline underline-offset-2"
                >
                    Xóa chữ ký
                </button>
            </div>
        </div>
    );
};

const CertificatePreviewSurface = ({
    backgroundUrl,
    layout,
    recipientName,
    onPlacementSelect,
    placementMode,
}: {
    backgroundUrl: string | null;
    layout: LayoutConfig;
    recipientName: string;
    onPlacementSelect?: (
        target: Exclude<PlacementMode, null>,
        x: number,
        y: number,
    ) => void;
    placementMode?: PlacementMode;
}) => {
    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!placementMode || !onPlacementSelect) {
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        if (!rect.width || !rect.height) {
            return;
        }

        const x = clamp(
            ((event.clientX - rect.left) / rect.width) * 100,
            0,
            100,
        );
        const y = clamp(
            ((event.clientY - rect.top) / rect.height) * 100,
            0,
            100,
        );
        onPlacementSelect(placementMode, x, y);
    };

    return (
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-300 bg-slate-100">
            <div
                className={`relative h-full w-full ${
                    placementMode ? 'cursor-crosshair' : ''
                }`}
                onClick={handleClick}
            >
                {backgroundUrl ? (
                    <img
                        src={backgroundUrl}
                        alt="Nền chứng nhận"
                        className="h-full w-full object-contain bg-white"
                    />
                ) : (
                    <div className="grid h-full place-items-center px-6 text-center text-sm text-slate-500">
                        Chưa có ảnh nền chứng nhận. Hãy tải ảnh lên để xem trước
                        bố cục.
                    </div>
                )}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{ fontFamily: '"Times New Roman", serif' }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            left: `${layout.recipientName.x}%`,
                            top: `${layout.recipientName.y}%`,
                            transform: 'translate(-50%, -50%)',
                            color: layout.recipientName.color,
                            fontSize: `${layout.recipientName.fontSize}px`,
                            fontWeight: layout.recipientName.fontWeight,
                            textAlign: layout.recipientName.align,
                            width: '80%',
                        }}
                    >
                        {recipientName}
                    </div>
                    {layout.signature.enabled &&
                    layout.signature.strokes.length > 0 ? (
                        <div
                            style={{
                                position: 'absolute',
                                left: `${layout.signature.x}%`,
                                top: `${layout.signature.y}%`,
                                width: `${layout.signature.width}%`,
                                height: `${layout.signature.height}%`,
                                transform: 'translate(-50%, -50%)',
                            }}
                        >
                            <svg
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                                className="h-full w-full"
                            >
                                {layout.signature.strokes.map(
                                    (stroke, index) => (
                                        <path
                                            key={`signature-stroke-${index}`}
                                            d={getSignatureStrokePath(stroke)}
                                            fill="none"
                                            stroke={layout.signature.color}
                                            strokeWidth={
                                                layout.signature.lineWidth
                                            }
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            vectorEffect="non-scaling-stroke"
                                        />
                                    ),
                                )}
                            </svg>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export const ModuleCertificatePanel: React.FC<ModuleCertificatePanelProps> = ({
    campaignId,
    module,
    canMutateCampaign,
}) => {
    const { addNotification } = useNotifications();
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const uploadRequestIdRef = React.useRef(0);

    const [templates, setTemplates] = React.useState<CertificateTemplate[]>([]);
    const [certificates, setCertificates] = React.useState<
        CampaignCertificate[]
    >([]);
    const [candidates, setCandidates] = React.useState<CertificateCandidate[]>(
        [],
    );
    const [selectedTemplateId, setSelectedTemplateId] = React.useState('');
    const [selectedStudentIds, setSelectedStudentIds] = React.useState<
        string[]
    >([]);
    const [selectedCertificateIds, setSelectedCertificateIds] = React.useState<
        string[]
    >([]);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(true);
    const [isUploading, setIsUploading] = React.useState(false);
    const [isSavingTemplate, setIsSavingTemplate] = React.useState(false);
    const [isIssuing, setIsIssuing] = React.useState(false);
    const [isSavingIssuedCertificate, setIsSavingIssuedCertificate] =
        React.useState<string | null>(null);
    const [isRevokingCertificates, setIsRevokingCertificates] =
        React.useState(false);
    const [previewCertificate, setPreviewCertificate] =
        React.useState<CampaignCertificate | null>(null);
    const [isEditorOpen, setIsEditorOpen] = React.useState(false);
    const [isRevokeDialogOpen, setIsRevokeDialogOpen] = React.useState(false);
    const [revokeReason, setRevokeReason] = React.useState('');
    const [revokeTargetIds, setRevokeTargetIds] = React.useState<string[]>([]);
    const [templateName, setTemplateName] = React.useState(
        buildDefaultTemplateName(module.title),
    );
    const [backgroundFileId, setBackgroundFileId] = React.useState<
        string | null
    >(null);
    const [backgroundPreviewUrl, setBackgroundPreviewUrl] = React.useState<
        string | null
    >(null);
    const [localBackgroundPreviewUrl, setLocalBackgroundPreviewUrl] =
        React.useState<string | null>(null);
    const [backgroundFileLabel, setBackgroundFileLabel] = React.useState<
        string | null
    >(null);
    const [digitalSignatureEnabled, setDigitalSignatureEnabled] =
        React.useState(false);
    const [layout, setLayout] = React.useState<LayoutConfig>(defaultLayout);
    const [placementMode, setPlacementMode] =
        React.useState<PlacementMode>(null);

    React.useEffect(() => {
        return () => {
            if (localBackgroundPreviewUrl) {
                URL.revokeObjectURL(localBackgroundPreviewUrl);
            }
        };
    }, [localBackgroundPreviewUrl]);

    const loadData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const [templateItems, certificateItems, candidateItems] =
                await Promise.all([
                    getTemplates({
                        campaign_id: campaignId,
                        module_id: module.id,
                    }),
                    listCampaignCertificates(campaignId, {
                        module_id: module.id,
                    }),
                    previewCertificateCandidates(campaignId, module.id),
                ]);

            setTemplates(templateItems);
            setCertificates(certificateItems);
            setCandidates(candidateItems);
            setSelectedCertificateIds((current) =>
                current.filter((id) =>
                    certificateItems.some(
                        (certificate) => certificate.id === id,
                    ),
                ),
            );

            const moduleTemplate =
                templateItems.find((item) =>
                    item.policies?.some(
                        (policy) => policy.module_id === module.id,
                    ),
                ) ?? null;

            if (moduleTemplate) {
                setSelectedTemplateId(moduleTemplate.id);
                setTemplateName(moduleTemplate.name);
                setBackgroundFileId(moduleTemplate.background_file_id ?? null);
                setBackgroundPreviewUrl(moduleTemplate.file_url ?? null);
                setBackgroundFileLabel(moduleTemplate.name);
                setDigitalSignatureEnabled(
                    moduleTemplate.digital_signature_enabled === true,
                );
                setLayout(normalizeLayout(moduleTemplate.layout_json));
            } else {
                setSelectedTemplateId('');
                setTemplateName(buildDefaultTemplateName(module.title));
                setBackgroundFileId(null);
                setBackgroundPreviewUrl(null);
                setBackgroundFileLabel(null);
                setDigitalSignatureEnabled(false);
                setLayout(defaultLayout);
            }
        } catch {
            addNotification({
                type: 'error',
                title: 'Không thể tải dữ liệu chứng nhận',
                message:
                    'Danh sách mẫu, sinh viên đủ điều kiện hoặc chứng nhận đã cấp chưa phản hồi.',
            });
        } finally {
            setIsLoading(false);
        }
    }, [addNotification, campaignId, module.id, module.title]);

    React.useEffect(() => {
        setSelectedStudentIds([]);
        void loadData();
    }, [loadData]);

    const currentTemplate = React.useMemo(
        () => templates.find((item) => item.id === selectedTemplateId) ?? null,
        [selectedTemplateId, templates],
    );

    React.useEffect(() => {
        if (!currentTemplate) {
            return;
        }

        setTemplateName(currentTemplate.name);
        setBackgroundFileId(currentTemplate.background_file_id ?? null);
        setBackgroundPreviewUrl(currentTemplate.file_url ?? null);
        setBackgroundFileLabel(currentTemplate.name);
        setDigitalSignatureEnabled(
            currentTemplate.digital_signature_enabled === true,
        );
        setLayout(normalizeLayout(currentTemplate.layout_json));
    }, [currentTemplate]);

    const filteredCandidates = React.useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();
        if (!normalizedQuery) {
            return candidates;
        }

        return candidates.filter((candidate) =>
            [
                candidate.student_name,
                candidate.student_code,
                candidate.faculty_name ?? '',
                candidate.class_name ?? '',
            ]
                .join(' ')
                .toLowerCase()
                .includes(normalizedQuery),
        );
    }, [candidates, searchQuery]);

    const previewCandidate =
        filteredCandidates.find((candidate) =>
            selectedStudentIds.includes(candidate.student_id),
        ) ??
        filteredCandidates[0] ??
        candidates[0] ??
        null;

    const displayBackgroundPreviewUrl =
        localBackgroundPreviewUrl ?? backgroundPreviewUrl;

    const toggleStudent = (studentId: string) => {
        setSelectedStudentIds((current) =>
            current.includes(studentId)
                ? current.filter((id) => id !== studentId)
                : [...current, studentId],
        );
    };

    const toggleAllVisibleStudents = () => {
        const visibleIds = filteredCandidates.map(
            (candidate) => candidate.student_id,
        );
        const isAllSelected =
            visibleIds.length > 0 &&
            visibleIds.every((studentId) =>
                selectedStudentIds.includes(studentId),
            );

        setSelectedStudentIds((current) => {
            if (isAllSelected) {
                return current.filter(
                    (studentId) => !visibleIds.includes(studentId),
                );
            }

            return Array.from(new Set([...current, ...visibleIds]));
        });
    };

    const activeCertificates = React.useMemo(
        () =>
            certificates.filter(
                (certificate) => certificate.status !== 'REVOKED',
            ),
        [certificates],
    );

    const toggleCertificate = (certificateId: string) => {
        setSelectedCertificateIds((current) =>
            current.includes(certificateId)
                ? current.filter((id) => id !== certificateId)
                : [...current, certificateId],
        );
    };

    const toggleAllCertificates = () => {
        const visibleIds = activeCertificates.map(
            (certificate) => certificate.id,
        );
        const isAllSelected =
            visibleIds.length > 0 &&
            visibleIds.every((certificateId) =>
                selectedCertificateIds.includes(certificateId),
            );

        setSelectedCertificateIds((current) => {
            if (isAllSelected) {
                return current.filter(
                    (certificateId) => !visibleIds.includes(certificateId),
                );
            }

            return Array.from(new Set([...current, ...visibleIds]));
        });
    };

    const openRevokeDialog = (certificateIds: string[]) => {
        if (certificateIds.length === 0) {
            addNotification({
                type: 'error',
                title: 'Chưa chọn giấy chứng nhận',
                message:
                    'Hãy chọn ít nhất một giấy chứng nhận còn hiệu lực để thu hồi.',
            });
            return;
        }

        setRevokeTargetIds(certificateIds);
        setRevokeReason('');
        setIsRevokeDialogOpen(true);
    };

    const closeRevokeDialog = () => {
        setIsRevokeDialogOpen(false);
        setRevokeTargetIds([]);
        setRevokeReason('');
    };

    const handleSaveAndOpenCertificate = async (
        certificate: CampaignCertificate,
    ) => {
        const storedUrl = getCertificateOpenUrl(certificate);
        if (storedUrl) {
            setPreviewCertificate(certificate);
            return;
        }

        setIsSavingIssuedCertificate(certificate.id);
        try {
            await renderCertificate(certificate.id);
            const renderedFile =
                await renderCertificateSnapshotFile(certificate);
            const uploaded = await uploadStorageFile({
                file: renderedFile,
                kind: 'image',
                folder: `campaigns/${campaignId}/certificates/${module.id}/issued`,
            });

            const updated = await attachRenderedCertificateFiles(
                certificate.id,
                {
                    preview_image_file_id: uploaded.id,
                    generated_file_id: uploaded.id,
                },
            );

            addNotification({
                type: 'success',
                title: 'Đã lưu giấy chứng nhận vào storage',
                message:
                    'File chứng nhận đã được render, lưu vào storage và gắn lại với sinh viên.',
            });

            await loadData();

            const nextUrl =
                getCertificateOpenUrl(updated) ??
                uploaded.publicUrl ??
                uploaded.accessUrl;

            if (nextUrl) {
                setPreviewCertificate(updated);
                return;
            }

            setPreviewCertificate(updated);
        } catch {
            addNotification({
                type: 'error',
                title: 'Không thể lưu giấy chứng nhận vào storage',
                message:
                    'Hệ thống chưa render hoặc gắn được file chứng nhận thật cho sinh viên này.',
            });
        } finally {
            setIsSavingIssuedCertificate(null);
        }
    };

    const handleRevokeCertificates = async () => {
        if (revokeTargetIds.length === 0) {
            return;
        }

        setIsRevokingCertificates(true);
        try {
            for (const certificateId of revokeTargetIds) {
                await revokeCertificate(certificateId, {
                    revoke_reason: revokeReason.trim() || undefined,
                });
            }

            addNotification({
                type: 'success',
                title:
                    revokeTargetIds.length === 1
                        ? 'Đã thu hồi giấy chứng nhận'
                        : 'Đã thu hồi hàng loạt giấy chứng nhận',
                message:
                    revokeTargetIds.length === 1
                        ? 'Giấy chứng nhận đã được thu hồi khỏi trạng thái hiệu lực.'
                        : `Đã thu hồi ${revokeTargetIds.length} giấy chứng nhận đã chọn.`,
            });

            setSelectedCertificateIds((current) =>
                current.filter((id) => !revokeTargetIds.includes(id)),
            );
            closeRevokeDialog();
            await loadData();
        } catch {
            addNotification({
                type: 'error',
                title: 'Thu hồi giấy chứng nhận thất bại',
                message:
                    'Không thể hoàn tất thao tác thu hồi cho danh sách giấy chứng nhận đã chọn.',
            });
        } finally {
            setIsRevokingCertificates(false);
        }
    };

    const handleBackgroundUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const sourceFile = event.target.files?.[0];
        if (!sourceFile) {
            return;
        }

        const requestId = ++uploadRequestIdRef.current;
        const objectUrl = URL.createObjectURL(sourceFile);

        setLocalBackgroundPreviewUrl((current) => {
            if (current) {
                URL.revokeObjectURL(current);
            }
            return objectUrl;
        });
        setBackgroundFileLabel(sourceFile.name);
        setIsUploading(true);

        try {
            const optimizedFile = await optimizeBackgroundImage(sourceFile);
            const uploaded = await uploadStorageFile({
                file: optimizedFile,
                kind: 'image',
                folder: `campaigns/${campaignId}/certificates/${module.id}`,
            });

            if (requestId !== uploadRequestIdRef.current) {
                return;
            }

            setBackgroundFileId(uploaded.id);
            setBackgroundPreviewUrl(uploaded.publicUrl ?? uploaded.accessUrl);
            addNotification({
                type: 'success',
                title: 'Đã tải ảnh nền chứng nhận',
                message:
                    optimizedFile.size < sourceFile.size
                        ? 'Ảnh đã được tối ưu trước khi tải lên để thao tác nhanh hơn.'
                        : 'Ảnh nền đã được lưu lên Supabase Storage.',
            });
        } catch {
            if (requestId === uploadRequestIdRef.current) {
                addNotification({
                    type: 'error',
                    title: 'Tải ảnh nền chứng nhận thất bại',
                    message:
                        'Không thể lưu ảnh nền lên hệ thống lưu trữ. Bạn có thể chọn ảnh khác để thử lại ngay.',
                });
            }
        } finally {
            if (requestId === uploadRequestIdRef.current) {
                setIsUploading(false);
            }
            event.target.value = '';
        }
    };

    const handlePlacementSelect = (
        target: Exclude<PlacementMode, null>,
        x: number,
        y: number,
    ) => {
        setLayout((current) => {
            if (target === 'recipientName') {
                return {
                    ...current,
                    recipientName: {
                        ...current.recipientName,
                        x,
                        y,
                    },
                };
            }

            return {
                ...current,
                signature: {
                    ...current.signature,
                    x,
                    y,
                },
            };
        });
        setPlacementMode(null);
    };

    const handleSignatureStrokeChange = (strokes: SignatureStroke[]) => {
        setLayout((current) => ({
            ...current,
            signature: {
                ...current.signature,
                strokes,
            },
        }));
    };

    const saveTemplate = async () => {
        if (!templateName.trim()) {
            addNotification({
                type: 'error',
                title: 'Thiếu tên mẫu chứng nhận',
                message: 'Hãy nhập tên mẫu trước khi lưu.',
            });
            return;
        }

        if (!backgroundFileId) {
            addNotification({
                type: 'error',
                title: 'Thiếu ảnh nền chứng nhận',
                message: 'Mỗi module cần một ảnh nền chứng nhận riêng.',
            });
            return;
        }

        setIsSavingTemplate(true);
        try {
            const basePayload = {
                name: templateName.trim(),
                type: getTemplateTypeByModule(module.type),
                background_file_id: backgroundFileId,
                digital_signature_enabled: digitalSignatureEnabled,
                layout_json: {
                    ...layout,
                    signature: {
                        ...layout.signature,
                        enabled: digitalSignatureEnabled,
                    },
                } as unknown as Record<string, unknown>,
            };

            const selectedTemplateMatchesModule =
                currentTemplate?.policies?.some(
                    (policy) => policy.module_id === module.id,
                ) ?? false;

            const saved =
                selectedTemplateId && selectedTemplateMatchesModule
                    ? await updateTemplate(selectedTemplateId, basePayload)
                    : await createTemplate({
                          ...basePayload,
                          module_id: module.id,
                          campaign_id: campaignId,
                      });

            setSelectedTemplateId(saved.id);
            setBackgroundPreviewUrl(saved.file_url ?? backgroundPreviewUrl);
            addNotification({
                type: 'success',
                title: 'Đã lưu mẫu chứng nhận',
                message:
                    'Mẫu nền, vị trí tên và chữ ký mô phỏng của module đã được lưu.',
            });
            await loadData();
        } catch {
            addNotification({
                type: 'error',
                title: 'Lưu mẫu chứng nhận thất bại',
                message:
                    'Không thể lưu cấu hình tên, nền hoặc chữ ký số mô phỏng của module này.',
            });
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const issueCertificates = async () => {
        if (!selectedTemplateId) {
            addNotification({
                type: 'error',
                title: 'Chưa chọn mẫu chứng nhận',
                message: 'Hãy lưu hoặc chọn mẫu chứng nhận cho module trước.',
            });
            return;
        }

        if (selectedStudentIds.length === 0) {
            addNotification({
                type: 'error',
                title: 'Chưa chọn sinh viên',
                message:
                    'Hãy chọn ít nhất một sinh viên đủ điều kiện để cấp chứng nhận.',
            });
            return;
        }

        setIsIssuing(true);
        try {
            const result = await generateCertificates(campaignId, {
                template_id: selectedTemplateId,
                module_id: module.id,
                student_ids: selectedStudentIds,
            });

            addNotification({
                type: 'success',
                title: 'Đã cấp chứng nhận theo module',
                message: `Đã tạo ${result.created_count} chứng nhận và lưu snapshot vào lịch sử tham gia của sinh viên.`,
            });

            setSelectedStudentIds([]);
            await loadData();
        } catch {
            addNotification({
                type: 'error',
                title: 'Cấp chứng nhận thất bại',
                message:
                    'Không thể tạo chứng nhận hàng loạt cho danh sách sinh viên đã chọn.',
            });
        } finally {
            setIsIssuing(false);
        }
    };

    if (!canMutateCampaign) {
        return null;
    }

    const previewStudentName = previewCandidate?.student_name ?? 'Nguyễn Văn A';

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h4 className="text-lg font-semibold text-slate-900">
                        Chứng nhận theo module
                    </h4>
                    <p className="mt-1 text-sm text-slate-600">
                        Cấp riêng cho module{' '}
                        <span className="font-semibold text-slate-800">
                            {toDisplayTitle(module.title)}
                        </span>
                        . Mẫu nền, bố cục tên, chữ ký và danh sách sinh viên đều
                        tách biệt với chiến dịch tổng.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => void loadData()}
                    >
                        Làm mới
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditorOpen(true)}
                    >
                        Mở trình chỉnh sửa lớn
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Đang tải dữ liệu chứng nhận của module...
                </div>
            ) : null}

            <div className="mt-5 grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
                <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="text-sm font-semibold text-slate-900">
                            Mẫu nền và định dạng chứng nhận
                        </div>
                        <div className="mt-3 space-y-3">
                            <select
                                value={selectedTemplateId}
                                onChange={(event) =>
                                    setSelectedTemplateId(event.target.value)
                                }
                                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                            >
                                <option value="">
                                    Tạo mẫu mới cho module này
                                </option>
                                {templates.map((template) => (
                                    <option
                                        key={template.id}
                                        value={template.id}
                                    >
                                        {template.name}
                                    </option>
                                ))}
                            </select>

                            <Input
                                value={templateName}
                                onChange={(event) =>
                                    setTemplateName(event.target.value)
                                }
                                placeholder="Tên mẫu chứng nhận"
                            />

                            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900">
                                            Ảnh nền chứng nhận
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">
                                            Tải lên xong là có xem trước ngay.
                                            Bạn có thể chọn ảnh khác bất kỳ lúc
                                            nào.
                                        </div>
                                        <div className="mt-2 text-xs text-slate-600">
                                            {backgroundFileLabel ??
                                                'Chưa chọn ảnh nền'}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={handleBackgroundUpload}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            disabled={isUploading}
                                        >
                                            {isUploading
                                                ? 'Đang tải ảnh...'
                                                : 'Chọn hoặc thay ảnh'}
                                        </Button>
                                        {displayBackgroundPreviewUrl ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    setIsEditorOpen(true)
                                                }
                                            >
                                                Xem lớn
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="grid gap-2 text-sm text-slate-700">
                                    <span>Vị trí ngang tên (%)</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={layout.recipientName.x}
                                        onChange={(event) =>
                                            setLayout((current) => ({
                                                ...current,
                                                recipientName: {
                                                    ...current.recipientName,
                                                    x: clamp(
                                                        Number(
                                                            event.target
                                                                .value || 0,
                                                        ),
                                                        0,
                                                        100,
                                                    ),
                                                },
                                            }))
                                        }
                                    />
                                </label>
                                <label className="grid gap-2 text-sm text-slate-700">
                                    <span>Vị trí dọc tên (%)</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={layout.recipientName.y}
                                        onChange={(event) =>
                                            setLayout((current) => ({
                                                ...current,
                                                recipientName: {
                                                    ...current.recipientName,
                                                    y: clamp(
                                                        Number(
                                                            event.target
                                                                .value || 0,
                                                        ),
                                                        0,
                                                        100,
                                                    ),
                                                },
                                            }))
                                        }
                                    />
                                </label>
                                <label className="grid gap-2 text-sm text-slate-700">
                                    <span>Cỡ chữ tên</span>
                                    <Input
                                        type="number"
                                        min={18}
                                        max={96}
                                        value={layout.recipientName.fontSize}
                                        onChange={(event) =>
                                            setLayout((current) => ({
                                                ...current,
                                                recipientName: {
                                                    ...current.recipientName,
                                                    fontSize: clamp(
                                                        Number(
                                                            event.target
                                                                .value || 0,
                                                        ),
                                                        18,
                                                        96,
                                                    ),
                                                },
                                            }))
                                        }
                                    />
                                </label>
                                <label className="grid gap-2 text-sm text-slate-700">
                                    <span>Màu chữ tên</span>
                                    <input
                                        type="color"
                                        value={layout.recipientName.color}
                                        onChange={(event) =>
                                            setLayout((current) => ({
                                                ...current,
                                                recipientName: {
                                                    ...current.recipientName,
                                                    color: event.target.value,
                                                },
                                            }))
                                        }
                                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-2"
                                    />
                                </label>
                                <label className="grid gap-2 text-sm text-slate-700">
                                    <span>Căn lề tên</span>
                                    <select
                                        value={layout.recipientName.align}
                                        onChange={(event) =>
                                            setLayout((current) => ({
                                                ...current,
                                                recipientName: {
                                                    ...current.recipientName,
                                                    align: event.target
                                                        .value as LayoutConfig['recipientName']['align'],
                                                },
                                            }))
                                        }
                                        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                    >
                                        <option value="left">Trái</option>
                                        <option value="center">Giữa</option>
                                        <option value="right">Phải</option>
                                    </select>
                                </label>
                                <label className="grid gap-2 text-sm text-slate-700">
                                    <span>Độ đậm tên</span>
                                    <select
                                        value={layout.recipientName.fontWeight}
                                        onChange={(event) =>
                                            setLayout((current) => ({
                                                ...current,
                                                recipientName: {
                                                    ...current.recipientName,
                                                    fontWeight: event.target
                                                        .value as LayoutConfig['recipientName']['fontWeight'],
                                                },
                                            }))
                                        }
                                        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                    >
                                        <option value="400">Thường</option>
                                        <option value="500">Trung bình</option>
                                        <option value="600">Đậm vừa</option>
                                        <option value="700">Đậm</option>
                                    </select>
                                </label>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
                                    <input
                                        type="checkbox"
                                        checked={digitalSignatureEnabled}
                                        onChange={(event) => {
                                            const enabled =
                                                event.target.checked;
                                            setDigitalSignatureEnabled(enabled);
                                            setLayout((current) => ({
                                                ...current,
                                                signature: {
                                                    ...current.signature,
                                                    enabled,
                                                },
                                            }));
                                        }}
                                    />
                                    Hiển thị chữ ký số mô phỏng bằng chữ ký tay
                                </label>
                                <div className="mt-2 text-xs text-slate-500">
                                    Người quản lý tự vẽ chữ ký, sau đó chọn vị
                                    trí đặt chữ ký trên giấy chứng nhận.
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant={
                                        placementMode === 'recipientName'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() =>
                                        setPlacementMode((current) =>
                                            current === 'recipientName'
                                                ? null
                                                : 'recipientName',
                                        )
                                    }
                                >
                                    Đặt vị trí tên bằng cách bấm lên ảnh
                                </Button>
                                <Button
                                    type="button"
                                    variant={
                                        placementMode === 'signature'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    disabled={!digitalSignatureEnabled}
                                    onClick={() =>
                                        setPlacementMode((current) =>
                                            current === 'signature'
                                                ? null
                                                : 'signature',
                                        )
                                    }
                                >
                                    Đặt vị trí chữ ký bằng cách bấm lên ảnh
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    disabled={isSavingTemplate || isUploading}
                                    onClick={() => void saveTemplate()}
                                >
                                    {isSavingTemplate
                                        ? 'Đang lưu mẫu...'
                                        : 'Lưu mẫu của module'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedTemplateId('');
                                        setTemplateName(
                                            buildDefaultTemplateName(
                                                module.title,
                                            ),
                                        );
                                        setBackgroundFileId(null);
                                        setBackgroundPreviewUrl(null);
                                        setBackgroundFileLabel(null);
                                        setDigitalSignatureEnabled(false);
                                        setPlacementMode(null);
                                        setLayout(defaultLayout);
                                    }}
                                >
                                    Tạo mẫu mới
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="text-sm font-semibold text-slate-900">
                                    Xem trước chứng nhận
                                </div>
                                <div className="mt-1 text-sm text-slate-600">
                                    Khung xem trước đã được mở lớn hơn để căn
                                    tên và chữ ký dễ hơn.
                                </div>
                            </div>
                            <div className="text-xs text-slate-500">
                                {placementMode === 'recipientName'
                                    ? 'Đang chờ bạn bấm lên ảnh để đặt tên.'
                                    : placementMode === 'signature'
                                      ? 'Đang chờ bạn bấm lên ảnh để đặt chữ ký.'
                                      : 'Bạn có thể bấm “Mở trình chỉnh sửa lớn” để thao tác thoải mái hơn.'}
                            </div>
                        </div>
                        <div className="mt-4">
                            <CertificatePreviewSurface
                                backgroundUrl={displayBackgroundPreviewUrl}
                                layout={{
                                    ...layout,
                                    signature: {
                                        ...layout.signature,
                                        enabled: digitalSignatureEnabled,
                                    },
                                }}
                                recipientName={previewStudentName}
                                placementMode={placementMode}
                                onPlacementSelect={handlePlacementSelect}
                            />
                        </div>
                    </div>

                    {digitalSignatureEnabled ? (
                        <div className="rounded-lg border border-slate-200 p-4">
                            <div className="text-sm font-semibold text-slate-900">
                                Vẽ chữ ký mô phỏng
                            </div>
                            <div className="mt-1 text-sm text-slate-600">
                                Chữ ký tay được lưu trong cấu hình mẫu để hiển
                                thị đúng theo từng module.
                            </div>
                            <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                <label className="grid gap-2 text-sm text-slate-700">
                                    <span>Vị trí ngang chữ ký (%)</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={layout.signature.x}
                                        onChange={(event) =>
                                            setLayout((current) => ({
                                                ...current,
                                                signature: {
                                                    ...current.signature,
                                                    x: clamp(
                                                        Number(
                                                            event.target
                                                                .value || 0,
                                                        ),
                                                        0,
                                                        100,
                                                    ),
                                                },
                                            }))
                                        }
                                    />
                                </label>
                                <label className="grid gap-2 text-sm text-slate-700">
                                    <span>Vị trí dọc chữ ký (%)</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={layout.signature.y}
                                        onChange={(event) =>
                                            setLayout((current) => ({
                                                ...current,
                                                signature: {
                                                    ...current.signature,
                                                    y: clamp(
                                                        Number(
                                                            event.target
                                                                .value || 0,
                                                        ),
                                                        0,
                                                        100,
                                                    ),
                                                },
                                            }))
                                        }
                                    />
                                </label>
                                <label className="grid gap-2 text-sm text-slate-700">
                                    <span>Rộng khung chữ ký (%)</span>
                                    <Input
                                        type="number"
                                        min={8}
                                        max={40}
                                        value={layout.signature.width}
                                        onChange={(event) =>
                                            setLayout((current) => ({
                                                ...current,
                                                signature: {
                                                    ...current.signature,
                                                    width: clamp(
                                                        Number(
                                                            event.target
                                                                .value || 0,
                                                        ),
                                                        8,
                                                        40,
                                                    ),
                                                },
                                            }))
                                        }
                                    />
                                </label>
                                <label className="grid gap-2 text-sm text-slate-700">
                                    <span>Cao khung chữ ký (%)</span>
                                    <Input
                                        type="number"
                                        min={6}
                                        max={30}
                                        value={layout.signature.height}
                                        onChange={(event) =>
                                            setLayout((current) => ({
                                                ...current,
                                                signature: {
                                                    ...current.signature,
                                                    height: clamp(
                                                        Number(
                                                            event.target
                                                                .value || 0,
                                                        ),
                                                        6,
                                                        30,
                                                    ),
                                                },
                                            }))
                                        }
                                    />
                                </label>
                                <label className="grid gap-2 text-sm text-slate-700">
                                    <span>Màu chữ ký</span>
                                    <input
                                        type="color"
                                        value={layout.signature.color}
                                        onChange={(event) =>
                                            setLayout((current) => ({
                                                ...current,
                                                signature: {
                                                    ...current.signature,
                                                    color: event.target.value,
                                                },
                                            }))
                                        }
                                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-2"
                                    />
                                </label>
                                <label className="grid gap-2 text-sm text-slate-700">
                                    <span>Độ đậm nét ký</span>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={8}
                                        step={0.2}
                                        value={layout.signature.lineWidth}
                                        onChange={(event) =>
                                            setLayout((current) => ({
                                                ...current,
                                                signature: {
                                                    ...current.signature,
                                                    lineWidth: clamp(
                                                        Number(
                                                            event.target
                                                                .value || 0,
                                                        ),
                                                        1,
                                                        8,
                                                    ),
                                                },
                                            }))
                                        }
                                    />
                                </label>
                            </div>
                            <div className="mt-4">
                                <SignatureCanvas
                                    color={layout.signature.color}
                                    lineWidth={layout.signature.lineWidth}
                                    strokes={layout.signature.strokes}
                                    onChange={handleSignatureStrokeChange}
                                />
                            </div>
                        </div>
                    ) : null}

                    <div className="rounded-lg border border-slate-200 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="text-sm font-semibold text-slate-900">
                                    Danh sách sinh viên đủ điều kiện
                                </div>
                                <div className="mt-1 text-sm text-slate-600">
                                    Chọn tên sinh viên theo từng module để cấp
                                    chứng nhận hàng loạt.
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={toggleAllVisibleStudents}
                                >
                                    {filteredCandidates.length > 0 &&
                                    filteredCandidates.every((candidate) =>
                                        selectedStudentIds.includes(
                                            candidate.student_id,
                                        ),
                                    )
                                        ? 'Bỏ chọn danh sách đang xem'
                                        : 'Chọn danh sách đang xem'}
                                </Button>
                                <Button
                                    type="button"
                                    disabled={isIssuing}
                                    onClick={() => void issueCertificates()}
                                >
                                    {isIssuing
                                        ? 'Đang cấp chứng nhận...'
                                        : 'Cấp chứng nhận hàng loạt'}
                                </Button>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Input
                                value={searchQuery}
                                onChange={(event) =>
                                    setSearchQuery(event.target.value)
                                }
                                placeholder="Tìm theo họ tên, MSSV, khoa hoặc lớp"
                            />
                        </div>
                        <div className="mt-4 max-h-[360px] overflow-auto rounded-lg border border-slate-200">
                            <div className="hidden grid-cols-[44px_minmax(0,1.2fr)_160px_160px_180px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 lg:grid">
                                <div />
                                <div>Sinh viên</div>
                                <div>Khoa / lớp</div>
                                <div>Nguồn đủ điều kiện</div>
                                <div>Thời gian dữ liệu</div>
                            </div>
                            {filteredCandidates.map((candidate) => (
                                <label
                                    key={`${candidate.student_id}-${candidate.eligibility_source}`}
                                    className="grid gap-3 border-b border-slate-200 px-4 py-3 last:border-b-0 lg:grid-cols-[44px_minmax(0,1.2fr)_160px_160px_180px]"
                                >
                                    <div className="pt-1">
                                        <input
                                            type="checkbox"
                                            checked={selectedStudentIds.includes(
                                                candidate.student_id,
                                            )}
                                            onChange={() =>
                                                toggleStudent(
                                                    candidate.student_id,
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900">
                                            {candidate.student_name}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-600">
                                            MSSV: {candidate.student_code}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">
                                            {candidate.student_email ??
                                                'Chưa có email'}
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-700">
                                        <div>
                                            {candidate.faculty_name ??
                                                'Chưa có khoa'}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">
                                            {candidate.class_name ??
                                                'Chưa có lớp'}
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-700">
                                        {formatEligibilitySource(
                                            candidate.eligibility_source,
                                        )}
                                    </div>
                                    <div className="text-sm text-slate-700">
                                        {formatDateTime(candidate.updated_at)}
                                    </div>
                                </label>
                            ))}
                            {filteredCandidates.length === 0 ? (
                                <div className="px-4 py-6 text-sm text-slate-500">
                                    Chưa có sinh viên đủ điều kiện trong module
                                    này.
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <div className="text-sm font-semibold text-slate-900">
                                    Chứng nhận đã cấp trong module
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                    Chọn từng bản ghi hoặc chọn hàng loạt để thu
                                    hồi.
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={toggleAllCertificates}
                                    disabled={activeCertificates.length === 0}
                                    className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {activeCertificates.length > 0 &&
                                    activeCertificates.every((certificate) =>
                                        selectedCertificateIds.includes(
                                            certificate.id,
                                        ),
                                    )
                                        ? 'Bỏ chọn tất cả'
                                        : 'Chọn tất cả'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        openRevokeDialog(selectedCertificateIds)
                                    }
                                    disabled={
                                        selectedCertificateIds.length === 0
                                    }
                                    className="inline-flex items-center justify-center rounded-md border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Thu hồi hàng loạt
                                </button>
                            </div>
                        </div>
                        <div className="mt-3 space-y-3">
                            {certificates.map((certificate) => {
                                const openUrl =
                                    getCertificateOpenUrl(certificate);
                                const isRevoked =
                                    certificate.status === 'REVOKED';
                                const isSelected =
                                    selectedCertificateIds.includes(
                                        certificate.id,
                                    );
                                const isSavingCurrent =
                                    isSavingIssuedCertificate ===
                                    certificate.id;

                                return (
                                    <div
                                        key={certificate.id}
                                        className="rounded-lg border border-slate-200 px-4 py-3"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <div className="pt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        disabled={isRevoked}
                                                        onChange={() =>
                                                            toggleCertificate(
                                                                certificate.id,
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900">
                                                        {
                                                            certificate.student_name
                                                        }
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-600">
                                                        {
                                                            certificate.certificate_no
                                                        }{' '}
                                                        ?{' '}
                                                        {formatIssuedStatus(
                                                            certificate.status,
                                                        )}
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-500">
                                                        {formatDateTime(
                                                            certificate.issued_at ??
                                                                certificate.created_at,
                                                        )}
                                                    </div>
                                                    {certificate.revoke_reason ? (
                                                        <div className="mt-2 text-xs text-rose-700">
                                                            Lý do thu hồi:{' '}
                                                            {
                                                                certificate.revoke_reason
                                                            }
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <div className="text-right text-sm text-slate-600">
                                                <div>
                                                    {certificate.student_history_saved
                                                        ? 'Đã lưu vào lịch sử tham gia của sinh viên'
                                                        : 'Chưa xác nhận được bản ghi trong hồ sơ sinh viên'}
                                                </div>
                                                <div className="mt-2 flex flex-wrap justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void handleSaveAndOpenCertificate(
                                                                certificate,
                                                            )
                                                        }
                                                        disabled={
                                                            isSavingCurrent
                                                        }
                                                        className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {isSavingCurrent
                                                            ? 'Đang lưu...'
                                                            : openUrl
                                                              ? 'Xem giấy chứng nhận'
                                                              : 'Xem giấy chứng nhận và lưu vào storage'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openRevokeDialog([
                                                                certificate.id,
                                                            ])
                                                        }
                                                        disabled={isRevoked}
                                                        className="inline-flex items-center justify-center rounded-md border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {isRevoked
                                                            ? 'Đã thu hồi'
                                                            : 'Thu hồi'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {certificates.length === 0 ? (
                                <div className="text-sm text-slate-500">
                                    Chưa có giấy chứng nhận nào được cấp cho
                                    module này.
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
            <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                <DialogContent className="max-h-[92vh] max-w-7xl overflow-y-auto">
                    <DialogTitle>
                        Trình chỉnh sửa chứng nhận của module
                    </DialogTitle>
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                        <div className="space-y-3">
                            <CertificatePreviewSurface
                                backgroundUrl={displayBackgroundPreviewUrl}
                                layout={{
                                    ...layout,
                                    signature: {
                                        ...layout.signature,
                                        enabled: digitalSignatureEnabled,
                                    },
                                }}
                                recipientName={previewStudentName}
                                placementMode={placementMode}
                                onPlacementSelect={handlePlacementSelect}
                            />
                            <div className="text-sm text-slate-600">
                                Mẹo: chọn “Đặt vị trí tên” hoặc “Đặt vị trí chữ
                                ký”, sau đó bấm trực tiếp lên giấy chứng nhận để
                                chốt tọa độ.
                            </div>
                        </div>
                        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div>
                                <div className="text-sm font-semibold text-slate-900">
                                    Điều chỉnh nhanh
                                </div>
                                <div className="mt-1 text-sm text-slate-600">
                                    Khung bên phải giữ nguyên dữ liệu đang
                                    chỉnh, không cần rời khỏi màn hình quản lý
                                    chiến dịch.
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant={
                                        placementMode === 'recipientName'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() =>
                                        setPlacementMode((current) =>
                                            current === 'recipientName'
                                                ? null
                                                : 'recipientName',
                                        )
                                    }
                                >
                                    Đặt tên
                                </Button>
                                <Button
                                    type="button"
                                    variant={
                                        placementMode === 'signature'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    disabled={!digitalSignatureEnabled}
                                    onClick={() =>
                                        setPlacementMode((current) =>
                                            current === 'signature'
                                                ? null
                                                : 'signature',
                                        )
                                    }
                                >
                                    Đặt chữ ký
                                </Button>
                            </div>
                            {digitalSignatureEnabled ? (
                                <SignatureCanvas
                                    color={layout.signature.color}
                                    lineWidth={layout.signature.lineWidth}
                                    strokes={layout.signature.strokes}
                                    onChange={handleSignatureStrokeChange}
                                />
                            ) : null}
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    onClick={() => void saveTemplate()}
                                    disabled={isSavingTemplate || isUploading}
                                >
                                    {isSavingTemplate
                                        ? 'Đang lưu...'
                                        : 'Lưu mẫu'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditorOpen(false)}
                                >
                                    Đóng trình chỉnh sửa
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isRevokeDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeRevokeDialog();
                    }
                }}
            >
                <DialogContent className="max-w-xl">
                    <DialogTitle>Thu hồi giấy chứng nhận</DialogTitle>
                    <div className="space-y-4">
                        <div className="text-sm text-slate-600">
                            {revokeTargetIds.length === 1
                                ? 'Bạn đang thu hồi 1 giấy chứng nhận.'
                                : `Bạn đang thu hồi ${revokeTargetIds.length} giấy chứng nhận.`}
                        </div>
                        <label className="grid gap-2 text-sm text-slate-700">
                            <span>Lý do thu hồi</span>
                            <textarea
                                value={revokeReason}
                                onChange={(event) =>
                                    setRevokeReason(event.target.value)
                                }
                                rows={4}
                                placeholder="Nhập lý do thu hồi để lưu vào lịch sử chứng nhận"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20"
                            />
                        </label>
                        <div className="flex flex-wrap justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeRevokeDialog}
                                disabled={isRevokingCertificates}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="button"
                                onClick={() => void handleRevokeCertificates()}
                                disabled={isRevokingCertificates}
                            >
                                {isRevokingCertificates
                                    ? 'Đang thu hồi...'
                                    : 'Xác nhận thu hồi'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(previewCertificate)}
                onOpenChange={(open) => !open && setPreviewCertificate(null)}
            >
                <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
                    <DialogTitle>
                        {previewCertificate
                            ? `Ảnh snapshot chứng nhận - ${previewCertificate.student_name}`
                            : 'Ảnh snapshot chứng nhận'}
                    </DialogTitle>
                    {previewCertificate ? (
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                <div>
                                    <span className="font-semibold text-slate-800">
                                        Mã chứng nhận:
                                    </span>{' '}
                                    {previewCertificate.certificate_no}
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-800">
                                        Đã lưu vào hồ sơ sinh viên:
                                    </span>{' '}
                                    {previewCertificate.student_history_saved
                                        ? 'Có'
                                        : 'Chưa'}
                                </div>
                            </div>
                            <CertificatePreviewSurface
                                backgroundUrl={
                                    previewCertificate.background_file_url ??
                                    getCertificatePreviewImageUrl(
                                        previewCertificate,
                                    )
                                }
                                layout={normalizeLayout(
                                    previewCertificate.layout_json &&
                                        typeof previewCertificate.layout_json ===
                                            'object'
                                        ? (previewCertificate.layout_json as Record<
                                              string,
                                              unknown
                                          >)
                                        : null,
                                )}
                                recipientName={getCertificateRecipientName(
                                    previewCertificate,
                                )}
                            />
                            <div className="flex flex-wrap gap-2">
                                {getCertificateOpenUrl(previewCertificate) ? (
                                    <a
                                        href={
                                            getCertificateOpenUrl(
                                                previewCertificate,
                                            ) ?? undefined
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        Mở file chứng nhận
                                    </a>
                                ) : (
                                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                        Chưa có file ảnh/PDF render thật trên
                                        storage. Bạn đang xem snapshot đúng theo
                                        dữ liệu đã lưu trong database.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </section>
    );
};
