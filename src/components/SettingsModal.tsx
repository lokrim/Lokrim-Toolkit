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
import { Settings, Key, FileJson } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";

export default function SettingsModal() {
    const [geminiKey, setGeminiKey] = useLocalStorage<string>("lokrim_gemini_key", "");
    const [convertKey, setConvertKey] = useLocalStorage<string>("lokrim_convert_key", "");

    const [tempGemini, setTempGemini] = React.useState(geminiKey);
    const [tempConvert, setTempConvert] = React.useState(convertKey);

    const [isOpen, setIsOpen] = React.useState(false);

    // Sync temp keys when open
    React.useEffect(() => {
        if (isOpen) {
            setTempGemini(geminiKey);
            setTempConvert(convertKey);
        }
    }, [isOpen, geminiKey, convertKey]);

    const handleSave = () => {
        setGeminiKey(tempGemini);
        setConvertKey(tempConvert);
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Toolkit Settings</DialogTitle>
                    <DialogDescription>
                        Configure your local preferences and API keys for the tools.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
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
                            Required for "Web to Obsidian" and "Prompt Generator". Stored locally.
                        </p>
                    </div>

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
