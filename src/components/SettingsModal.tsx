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
import { Settings, Key } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";

export default function SettingsModal() {
    const [apiKey, setApiKey] = useLocalStorage<string>("lokrim_gemini_key", "");
    const [tempKey, setTempKey] = React.useState(apiKey);
    const [isOpen, setIsOpen] = React.useState(false);

    // Sync temp key when open
    React.useEffect(() => {
        if (isOpen) {
            setTempKey(apiKey);
        }
    }, [isOpen, apiKey]);

    const handleSave = () => {
        setApiKey(tempKey);
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
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="apiKey" className="flex items-center space-x-2">
                            <Key className="w-4 h-4" />
                            <span>Gemini API Key</span>
                        </Label>
                        <Input
                            id="apiKey"
                            type="password"
                            placeholder="AIzaSy..."
                            value={tempKey}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempKey(e.target.value)}
                            className="col-span-3 font-mono text-sm"
                        />
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Provide your own API key to use the features without relying on the host's quota. This key is securely stored in your browser's local storage.
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
