import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Settings, Key, FileJson, Bot } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";
import { 
    GEMINI_MODELS, DEFAULT_GEMINI_MODEL, type GeminiModelId, 
    POLLINATIONS_IMAGE_MODELS, DEFAULT_POLLINATIONS_IMAGE_MODEL, type PollinationsImageModelId 
} from "@/lib/models";
import { STORAGE_KEYS } from "@/lib/storage";

export default function SettingsModal() {
    const [geminiKey, setGeminiKey] = useLocalStorage<string>(STORAGE_KEYS.gemini.apiKey, "");
    const [convertKey, setConvertKey] = useLocalStorage<string>(STORAGE_KEYS.convert.apiKey, "");
    const [geminiModel, setGeminiModel] = useLocalStorage<GeminiModelId>(
        STORAGE_KEYS.gemini.model,
        DEFAULT_GEMINI_MODEL
    );

    const [pollinationsKey, setPollinationsKey] = useLocalStorage<string>(STORAGE_KEYS.pollinations.apiKey, "");
    
    const [pollinationsImageModel, setPollinationsImageModel] = useLocalStorage<PollinationsImageModelId>(
        STORAGE_KEYS.pollinations.imageModel,
        DEFAULT_POLLINATIONS_IMAGE_MODEL
    );

    const [tempGemini, setTempGemini] = React.useState(geminiKey);
    const [tempConvert, setTempConvert] = React.useState(convertKey);
    const [tempPollinations, setTempPollinations] = React.useState(pollinationsKey);
    const resolvedModel = (GEMINI_MODELS.some((m) => m.id === geminiModel)
        ? geminiModel
        : DEFAULT_GEMINI_MODEL) as GeminiModelId;
    const [tempModel, setTempModel] = React.useState<GeminiModelId>(resolvedModel);

    const resolvedImageModel = (POLLINATIONS_IMAGE_MODELS.some((m) => m.id === pollinationsImageModel)
        ? pollinationsImageModel
        : DEFAULT_POLLINATIONS_IMAGE_MODEL) as PollinationsImageModelId;
    const [tempImageModel, setTempImageModel] = React.useState<PollinationsImageModelId>(resolvedImageModel);

    const [isOpen, setIsOpen] = React.useState(false);

    // Sync temp values when dialog opens
    React.useEffect(() => {
        if (isOpen) {
            setTempGemini(geminiKey);
            setTempConvert(convertKey);
            setTempPollinations(pollinationsKey);
            // Re-validate on every open in case registry changed since last render
            const valid = GEMINI_MODELS.some((m) => m.id === geminiModel)
                ? geminiModel
                : DEFAULT_GEMINI_MODEL;
            setTempModel(valid as GeminiModelId);
            
            const validImage = POLLINATIONS_IMAGE_MODELS.some((m) => m.id === pollinationsImageModel)
                ? pollinationsImageModel
                : DEFAULT_POLLINATIONS_IMAGE_MODEL;
            setTempImageModel(validImage as PollinationsImageModelId);
        }
    }, [isOpen, geminiKey, convertKey, pollinationsKey, geminiModel, pollinationsImageModel]);

    const handleSave = () => {
        setGeminiKey(tempGemini);
        setConvertKey(tempConvert);
        setPollinationsKey(tempPollinations);
        setGeminiModel(tempModel);
        setPollinationsImageModel(tempImageModel);
        setIsOpen(false);
        toast.success("Settings saved successfully.");
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button className="flex items-center space-x-3 w-full px-2.5 py-2 rounded-md text-sm transition-colors text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100">
                    <Settings className="w-4 h-4 opacity-70" />
                    <span>Settings</span>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Toolkit Settings</DialogTitle>
                    <DialogDescription>
                        Configure your local preferences and API keys for the tools.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">

                    {/* ── Gemini Model Selection ── */}
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="geminiModel" className="flex items-center space-x-2">
                            <Bot className="w-4 h-4" />
                            <span>Gemini Model</span>
                        </Label>
                        <Select
                            value={tempModel}
                            onValueChange={(val) => setTempModel(val as GeminiModelId)}
                        >
                            <SelectTrigger id="geminiModel" className="w-full">
                                <SelectValue placeholder="Select a model..." />
                            </SelectTrigger>
                            <SelectContent>
                                {GEMINI_MODELS.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Applied globally across all AI text tools. Stored locally.
                        </p>
                    </div>

                    {/* ── Pollinations Image Model Selection ── */}
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="pollinationsImageModel" className="flex items-center space-x-2">
                            <Bot className="w-4 h-4" />
                            <span>Pollinations Image Model</span>
                        </Label>
                        <Select
                            value={tempImageModel}
                            onValueChange={(val) => setTempImageModel(val as PollinationsImageModelId)}
                        >
                            <SelectTrigger id="pollinationsImageModel" className="w-full">
                                <SelectValue placeholder="Select an image model..." />
                            </SelectTrigger>
                            <SelectContent>
                                {POLLINATIONS_IMAGE_MODELS.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Applied globally across all AI image generation tools. Stored locally.
                        </p>
                    </div>

                    {/* ── Pollinations API Key ── */}
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="pollinationsKey" className="flex items-center space-x-2">
                            <Key className="w-4 h-4" />
                            <span>Pollinations API Key</span>
                        </Label>
                        <Input
                            id="pollinationsKey"
                            type="password"
                            placeholder="sk_..."
                            value={tempPollinations}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempPollinations(e.target.value)}
                            className="col-span-3 font-mono text-sm"
                        />
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Required for image generation. Stored locally.
                        </p>
                    </div>

                    {/* ── Gemini API Key ── */}
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="geminiKey" className="flex items-center space-x-2">
                            <Key className="w-4 h-4" />
                            <span>Gemini API Key</span>
                        </Label>
                        <Input
                            id="geminiKey"
                            type="password"
                            placeholder="AIzaSy..."
                            value={tempGemini}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempGemini(e.target.value)}
                            className="col-span-3 font-mono text-sm"
                        />
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Required for "Web to Obsidian", "Prompt Generator", and "Scribe to Vault". Stored locally.
                        </p>
                    </div>

                    {/* ── ConvertAPI Key ── */}
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="convertKey" className="flex items-center space-x-2">
                            <FileJson className="w-4 h-4" />
                            <span>ConvertAPI Secret</span>
                        </Label>
                        <Input
                            id="convertKey"
                            type="password"
                            placeholder="secret_xyZaBC..."
                            value={tempConvert}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempConvert(e.target.value)}
                            className="col-span-3 font-mono text-sm"
                        />
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Required for converting Office documents in the "Universal PDF Pipeline". Stored locally.
                        </p>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleSave} className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200">
                        Save changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
