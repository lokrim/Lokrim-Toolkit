import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, GripVertical, FileImage, FileText, Trash2, Cloud, HardDrive, Plus, Download } from 'lucide-react';
import { processPdfPipeline, type PipelineFile } from '@/lib/pdfPipelineUtils';
import { toast } from 'sonner';

/** Sortable Item Component */
interface SortableItemProps {
    file: PipelineFile;
    onRemove: (id: string) => void;
}

function SortableItem({ file, onRemove }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: file.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    const ext = file.file.name.split('.').pop()?.toLowerCase();
    const isLocal = ['pdf', 'jpg', 'jpeg', 'png'].includes(ext || '');

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-4 py-3 px-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm w-full mb-3 ${isDragging ? 'shadow-md border-zinc-400 dark:border-zinc-600' : ''}`}
        >
            <div {...attributes} {...listeners} className="cursor-grab hover:text-zinc-900 dark:hover:text-zinc-100 text-zinc-400 focus:outline-none">
                <GripVertical className="w-5 h-5" />
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-md hidden sm:block">
                {['png', 'jpg', 'jpeg'].includes(ext || '') ? (
                    <FileImage className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
                ) : (
                    <FileText className="w-5 h-5 text-indigo-500" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate pr-4">
                        {file.file.name}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 border rounded-full ${isLocal ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'}`}>
                            {isLocal ? <><HardDrive className="w-3 h-3 inline mr-1" /> Local</> : <><Cloud className="w-3 h-3 inline mr-1" /> ConvertAPI</>}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ease-out ${file.status === 'error' ? 'bg-red-500' :
                                file.status === 'done' ? 'bg-emerald-500' :
                                    'bg-indigo-500'
                                } ${(file.status === 'converting' || file.status === 'merging') ? 'animate-pulse' : ''}`}
                            style={{
                                width: file.status === 'wait' ? '0%' :
                                    file.status === 'uploading' ? `${(file.uploadProgress || 0) * 0.4}%` :
                                        file.status === 'converting' ? '70%' :
                                            file.status === 'merging' ? '90%' :
                                                '100%'
                            }}
                        />
                    </div>
                    <span className={`text-[10px] uppercase font-bold tracking-wide w-20 text-right ${file.status === 'error' ? 'text-red-500' :
                        file.status === 'done' ? 'text-emerald-500' :
                            'text-zinc-500 dark:text-zinc-400'
                        }`}>
                        {file.status === 'error' ? 'Error' :
                            file.status === 'uploading' ? `Upload ${file.uploadProgress}%` :
                                file.status || 'Ready'}
                    </span>
                </div>

                {file.errorMessage && (
                    <p className="text-xs text-red-500 mt-1 truncate">{file.errorMessage}</p>
                )}
            </div>

            <button onClick={() => onRemove(file.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}


export default function PdfPipeline() {
    const [files, setFiles] = useState<PipelineFile[]>([]);
    const [compress, setCompress] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [globalProgress, setGlobalProgress] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles: PipelineFile[] = acceptedFiles.map(file => ({
            id: `file-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            file,
            status: 'wait'
        }));
        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
            'text/plain': ['.txt']
        }
    });

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setFiles((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleProcess = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        setGlobalProgress("Initializing...");

        // Reset all statuses
        setFiles(prev => prev.map(f => ({ ...f, status: 'wait', errorMessage: undefined })));

        try {
            const finalPdfBytes = await processPdfPipeline(
                files,
                compress,
                (id, status, error, uploadProgress) => {
                    setFiles(prev => prev.map(f => f.id === id ? { ...f, status, errorMessage: error, uploadProgress: uploadProgress !== undefined ? uploadProgress : f.uploadProgress } : f));
                    if (status === 'converting') setGlobalProgress("Converting via API...");
                    if (status === 'merging') setGlobalProgress("Merging PDF blocks locally...");
                }
            );

            if (compress) {
                setGlobalProgress("Compressing final PDF...");
            }

            // Trigger Download
            const blob = new Blob([finalPdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lokrim-toolkit-merged-${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("Pipeline executed successfully!");

        } catch (error: any) {
            toast.error(error.message || "An error occurred during processing.");
            setGlobalProgress("Failed.");
        } finally {
            setIsProcessing(false);
            if (!globalProgress.includes("Failed")) setGlobalProgress("");
        }
    };


    return (
        <div className="max-w-4xl min-h-full flex flex-col p-6 lg:p-10 space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">Universal PDF Pipeline</h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Merge diverse files (PDFs, Images, Office Docs, Text) into a single, perfectly ordered PDF.
                </p>
            </div>

            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={`p-10 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${isDragActive
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10'
                    : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:border-zinc-400 dark:hover:border-zinc-500'
                    }`}
            >
                <input {...getInputProps()} />
                <Plus className={`w-10 h-10 mb-4 ${isDragActive ? 'text-indigo-500' : 'text-zinc-400'}`} />
                <p className="text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                    {isDragActive ? "Drop the files here ..." : "Drag & drop files here, or click to select files"}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                    Supported: .pdf, .png, .jpg, .docx, .xlsx, .pptx, .txt
                </p>
            </div>

            {/* List & Execution Section */}
            {files.length > 0 && (
                <div className="flex flex-col space-y-6 flex-1 bg-zinc-50/50 dark:bg-zinc-900/20 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">

                    <div>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 uppercase tracking-wider flex items-center justify-between">
                            Pipeline Queue ({files.length})
                        </h3>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={files.map(f => f.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {files.map((obj) => (
                                    <SortableItem key={obj.id} file={obj} onRemove={removeFile} />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>

                    <div className="mt-auto border-t border-zinc-200 dark:border-zinc-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center space-x-3 bg-white dark:bg-zinc-900 px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                            <Switch
                                id="compress-output"
                                checked={compress}
                                onCheckedChange={setCompress}
                            />
                            <Label htmlFor="compress-output" className="cursor-pointer">
                                Compress Final Output
                                <span className="block text-[10px] text-zinc-500 leading-tight mt-0.5"><Cloud className="inline w-3 h-3 mr-0.5" /> Uses ConvertAPI</span>
                            </Label>
                        </div>

                        <Button
                            onClick={handleProcess}
                            disabled={isProcessing || files.length === 0}
                            className="w-full sm:w-auto px-8 h-12 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-purple-600 dark:text-zinc-50 dark:hover:bg-purple-500 disabled:bg-zinc-100 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 font-medium transition-all rounded-xl shadow-sm"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    {globalProgress || "Processing..."}
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-5 w-5" />
                                    Process & Download ({files.length})
                                </>
                            )}
                        </Button>
                    </div>

                </div>
            )}
        </div>
    );
}
