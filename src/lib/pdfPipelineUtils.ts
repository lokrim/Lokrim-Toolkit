import { PDFDocument } from 'pdf-lib';

const ENV_API_KEY = import.meta.env.VITE_CONVERT_API_KEY || "";

/**
 * Retrieves the active ConvertAPI key securely.
 * Prioritizes the user's local BYOK storage.
 */
function getActiveConvertApiKey(): string {
    let customKey = "";
    try {
        const stored = window.localStorage.getItem("lokrim_convert_key");
        if (stored) {
            customKey = JSON.parse(stored);
        }
    } catch (e) {
        console.error("Failed to parse stored API key", e);
    }
    const activeKey = customKey || ENV_API_KEY;
    if (!activeKey) {
        throw new Error("ConvertAPI key is not configured. Please add it in Settings.");
    }
    return activeKey;
}

export interface PipelineFile {
    id: string;
    file: File;
    status?: 'wait' | 'uploading' | 'converting' | 'merging' | 'done' | 'error';
    uploadProgress?: number;
    errorMessage?: string;
}

/**
 * Helper to upload a file to ConvertAPI and convert to PDF using XMLHttpRequest for progress.
 * Uses strict Base64 JSON payload to avoid multipart boundary/parameter validation issues.
 */
async function convertToPdfViaApi(
    file: File,
    activeKey: string,
    onProgressUpdate: (progress: number) => void
): Promise<Uint8Array> {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext) throw new Error("Unknown file extension.");

    // Explicitly targeting the format-to-pdf endpoint as required by ConvertAPI REST
    const url = `https://v2.convertapi.com/convert/${ext}/to/pdf`;

    // 1. Convert File buffer to Base64 String
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64File = window.btoa(binary);

    // 2. Prepare exact JSON payload that ConvertAPI REST expects
    const payload = {
        Parameters: [
            {
                Name: "File",
                FileValue: {
                    Name: file.name,
                    Data: base64File
                }
            },
            {
                Name: "StoreFile",
                Value: true
            }
        ]
    };

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader('Authorization', `Bearer ${activeKey}`);
        xhr.setRequestHeader('Content-Type', 'application/json');

        // Track upload progress of the JSON payload
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                onProgressUpdate(percent);
            }
        };

        xhr.onload = async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    if (!data.Files || data.Files.length === 0) {
                        return reject(new Error("ConvertAPI returned no files."));
                    }

                    if (data.Files[0].Url) {
                        // Download the actual bytes from the returned URL
                        const res = await fetch(data.Files[0].Url);
                        if (!res.ok) throw new Error("Failed to download converted file.");
                        const arrayBuf = await res.arrayBuffer();
                        resolve(new Uint8Array(arrayBuf));
                    } else if (data.Files[0].FileData) {
                        // Fallback if base64 is returned directly instead of a URL
                        const base64Data = data.Files[0].FileData;
                        const binaryStr = atob(base64Data);
                        const len = binaryStr.length;
                        const outBytes = new Uint8Array(len);
                        for (let i = 0; i < len; i++) {
                            outBytes[i] = binaryStr.charCodeAt(i);
                        }
                        resolve(outBytes);
                    } else {
                        reject(new Error("No file data or URL returned from ConvertAPI."));
                    }
                } catch (e) {
                    reject(e);
                }
            } else {
                try {
                    const errorData = JSON.parse(xhr.responseText);
                    let errMsg = errorData.Message || "Failed to convert file via ConvertAPI.";

                    // ConvertAPI often returns precise parameter errors in an InvalidParameters sub-dictionary
                    if (errorData.InvalidParameters && Object.keys(errorData.InvalidParameters).length > 0) {
                        const badParams = Object.entries(errorData.InvalidParameters)
                            .map(([key, val]) => `${key}: ${val}`)
                            .join(', ');
                        errMsg += ` (${badParams})`;
                    }

                    reject(new Error(errMsg));
                } catch {
                    reject(new Error(`ConvertAPI error: ${xhr.status} ${xhr.statusText}`));
                }
            }
        };

        xhr.onerror = () => reject(new Error("Network error occurred during upload."));
        xhr.send(JSON.stringify(payload));
    });
}

/**
 * Processes the ordered list of files, converting and merging them into one PDF.
 */
export async function processPdfPipeline(
    files: PipelineFile[],
    compressOutput: boolean,
    onProgress: (fileId: string, status: PipelineFile['status'], error?: string, uploadProgress?: number) => void
): Promise<Uint8Array> {
    const needsApi = compressOutput || files.some(f => {
        const ext = f.file.name.split('.').pop()?.toLowerCase() || '';
        return ['docx', 'xlsx', 'pptx', 'txt'].includes(ext);
    });
    const activeKey = needsApi ? getActiveConvertApiKey() : "";
    const mergedPdf = await PDFDocument.create();

    for (const pipelineFile of files) {
        const { id, file } = pipelineFile;
        const ext = file.name.split('.').pop()?.toLowerCase() || '';

        try {
            if (ext === 'pdf') {
                onProgress(id, 'merging');
                const arrayBuffer = await file.arrayBuffer();
                const srcDoc = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
                onProgress(id, 'done');

            } else if (['jpg', 'jpeg', 'png'].includes(ext)) {
                onProgress(id, 'merging');
                const arrayBuffer = await file.arrayBuffer();
                let image;
                if (ext === 'png') {
                    image = await mergedPdf.embedPng(arrayBuffer);
                } else {
                    image = await mergedPdf.embedJpg(arrayBuffer);
                }

                // Create a standard A4 page (595 x 842 points)
                const page = mergedPdf.addPage([595.28, 842.89]);
                const { width, height } = page.getSize();

                // Scale image to fit within the page margins (10% margin)
                const margin = width * 0.1;
                const maxImgWidth = width - (margin * 2);
                const maxImgHeight = height - (margin * 2);

                const dims = image.scaleToFit(maxImgWidth, maxImgHeight);

                page.drawImage(image, {
                    x: width / 2 - dims.width / 2,
                    y: height / 2 - dims.height / 2,
                    width: dims.width,
                    height: dims.height,
                });
                onProgress(id, 'done');

            } else if (['docx', 'xlsx', 'pptx', 'txt'].includes(ext)) {
                // Requires ConvertAPI
                onProgress(id, 'uploading', undefined, 0);
                const convertedPdfBytes = await convertToPdfViaApi(file, activeKey, (progress) => {
                    onProgress(id, 'uploading', undefined, progress);
                });

                onProgress(id, 'converting');
                // The actual conversion on ConvertAPI side happens fast and then downloads.
                // We've already awaited the download completion in `convertToPdfViaApi`.

                onProgress(id, 'merging');
                const srcDoc = await PDFDocument.load(convertedPdfBytes);
                const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
                onProgress(id, 'done');

            } else {
                throw new Error(`Unsupported file type: .${ext}`);
            }

        } catch (error: any) {
            console.error(`Error processing file ${file.name}:`, error);
            onProgress(id, 'error', error.message || "Failed to process file.");
            throw error; // Halt pipeline on first error
        }
    }

    let finalPdfBytes = await mergedPdf.save();

    if (compressOutput) {
        // Send the entire merged Uint8Array buffer back to ConvertAPI for compression
        const formData = new FormData();
        const blob = new Blob([finalPdfBytes as any], { type: 'application/pdf' });
        formData.append('File', blob, 'merged.pdf');
        formData.append('StoreFile', 'true');

        const response = await fetch(`https://v2.convertapi.com/convert/pdf/to/compress`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${activeKey}` },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.Message || "Failed to compress final output.");
        }

        const data = await response.json();
        if (data.Files && data.Files[0].Url) {
            const res = await fetch(data.Files[0].Url);
            const arrayBuf = await res.arrayBuffer();
            finalPdfBytes = new Uint8Array(arrayBuf);
        } else if (data.Files && data.Files[0].FileData) {
            const base64Data = data.Files[0].FileData;
            const binaryStr = atob(base64Data);
            finalPdfBytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
                finalPdfBytes[i] = binaryStr.charCodeAt(i);
            }
        }
    }

    return finalPdfBytes;
}
