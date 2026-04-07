import { useState } from "react";
import { Flame, UtensilsCrossed, Clock, Zap, Target, RefreshCcw, ChefHat, Copy, CheckCircle2, Leaf, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useFlavourForge, type DetailedRecipeData } from "@/hooks/useFlavourForge";

const HEAT_SOURCE_OPTIONS = ["Stove", "Oven", "Microwave", "Air Fryer", "Grill", "Toaster"];
const UTENSIL_OPTIONS = ["Pan", "Pot", "Blender", "Pressure Cooker"];
const SPICE_OPTIONS = ["Salt", "Black Pepper", "Chilly Powder", "Chaat Masala", "Garlic Powder", "Garam Masala", "Cumin", "Turmeric", "Coriander", "Paprika"];
const VEGGIE_OPTIONS = ["Onion", "Tomato", "Garlic", "Ginger", "Bell Pepper", "Potato", "Carrot", "Broccoli", "Spinach", "Beetroot", "Cabbage"];
const SAUCE_OPTIONS = ["Soy Sauce", "Mayonnaise", "Ketchup", "Mustard", "Hot Sauce", "Vinegar", "Olive Oil", "Dressing"];
const CUISINES = ["Surprise Me", "Italian", "Mexican", "Japanese", "Indian", "Mediterranean", "American", "Thai", "French", "Peruvian-Fusion"];

function CopyRecipeButton({ recipe, time, effort }: { recipe: DetailedRecipeData, time: number, effort: number }) {
    const [copied, setCopied] = useState(false);

    const handleCopyMarkdown = () => {
        if (!recipe.sections) return;

        let md = `# ${recipe.concept.title}\n\n`;
        md += `_${recipe.concept.cuisine}_ | Constraints: ${time} mins, Effort ${effort}/5\n\n`;

        md += `## About\n${recipe.sections.about}\n\n`;

        if (recipe.macros) {
            md += `## Nutritional Profile\n**Calories**: ${recipe.macros.calories} kcal\n**Protein**: ${recipe.macros.protein}g | **Carbs**: ${recipe.macros.carbs}g | **Fat**: ${recipe.macros.fat}g\n\n`;
        }

        md += `## Ingredients\n${recipe.sections.ingredients}\n\n`;
        md += `## Equipment\n${recipe.sections.equipment}\n\n`;
        md += `## Instructions\n${recipe.sections.steps}\n\n`;

        if (recipe.sections.tips) {
            md += `## Chef's Tips\n${recipe.sections.tips}\n\n`;
        }

        navigator.clipboard.writeText(md);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button variant="outline" size="sm" onClick={handleCopyMarkdown} className="gap-2 text-zinc-700 dark:text-zinc-300">
            {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy MD"}
        </Button>
    )
}

export default function FlavourForge() {
    const {
        kitchenDefaults,
        concepts,
        detailedRecipes,
        isGeneratingConcepts,
        generateConcepts,
        generateDetailedRecipe,
        resetAll,
        ingredientInput,
        setIngredientInput,
    } = useFlavourForge();

    const [localTime, setLocalTime] = useState<number>(30);
    const [localEffort, setLocalEffort] = useState<number>(3);
    const [localHeatSources, setLocalHeatSources] = useState<string[]>(kitchenDefaults.heatSources);
    const [localUtensils, setLocalUtensils] = useState<string[]>(kitchenDefaults.utensils);
    const [localSpices, setLocalSpices] = useState<string[]>(kitchenDefaults.spices || []);
    const [localVeggies, setLocalVeggies] = useState<string[]>(kitchenDefaults.veggies || []);
    const [localSauces, setLocalSauces] = useState<string[]>(kitchenDefaults.sauces || []);
    const [localCuisine, setLocalCuisine] = useState<string>(kitchenDefaults.cuisine);

    const toggleArray = (_arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
        setArr(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    };

    const handleGenerateConcepts = (count = 10) => {
        generateConcepts({
            ingredients: ingredientInput,
            cuisine: localCuisine,
            heatSources: localHeatSources,
            utensils: localUtensils,
            spices: localSpices,
            veggies: localVeggies,
            sauces: localSauces,
            time: [localTime],
            effort: [localEffort],
            count
        });
    };

    const isAppEmpty = concepts.length === 0 && detailedRecipes.length === 0 && !isGeneratingConcepts;

    return (
        <div className="flex flex-col h-full w-full p-4 lg:p-8 overflow-y-auto space-y-8 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                        <ChefHat className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        Flavour Forge
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
                        Your multi-pass culinary architect. Provide constraints to generate dynamic concepts, and expand them iteratively into full recipes.
                    </p>
                </div>
                {!isAppEmpty && (
                    <Button variant="outline" size="sm" onClick={resetAll} className="gap-2">
                        <RefreshCcw className="h-4 w-4" />
                        Start Over
                    </Button>
                )}
            </div>

            {/* HORIZONTAL INPUT DASHBOARD */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-white dark:bg-zinc-950 shadow-sm flex flex-col gap-6">

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Col 1: Pantry */}
                    <div className="space-y-2 md:col-span-1 border-r border-zinc-200 dark:border-zinc-800 md:pr-6 flex flex-col">
                        <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <Target className="h-4 w-4 text-purple-600" /> Main Ingredients
                        </label>
                        <Textarea
                            placeholder="Chicken breast, rice, soy sauce..."
                            value={ingredientInput}
                            onChange={(e) => setIngredientInput(e.target.value)}
                            className="w-full flex-1 min-h-[250px] resize-none border-zinc-200 bg-zinc-50 dark:bg-zinc-900/50 mb-2"
                        />
                    </div>

                    {/* Col 2: Aromatics / Veggies */}
                    <div className="space-y-4 md:col-span-1 border-r border-zinc-200 dark:border-zinc-800 md:pr-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-purple-600" /> Spices / Aromatics
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {SPICE_OPTIONS.map(spice => (
                                    <button key={spice} onClick={() => toggleArray(localSpices, setLocalSpices, spice)}
                                        className={`px-2 py-1 text-[10px] rounded border transition-colors ${localSpices.includes(spice) ? 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-300 font-medium' : 'bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-zinc-900/50 dark:border-zinc-800 dark:text-zinc-400'}`}>
                                        {spice}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                <Leaf className="h-4 w-4 text-emerald-600" /> Standard Veggies
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {VEGGIE_OPTIONS.map(veg => (
                                    <button key={veg} onClick={() => toggleArray(localVeggies, setLocalVeggies, veg)}
                                        className={`px-2 py-1 text-[10px] rounded border transition-colors ${localVeggies.includes(veg) ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300 font-medium' : 'bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-zinc-900/50 dark:border-zinc-800 dark:text-zinc-400'}`}>
                                        {veg}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Col 3: Hardware */}
                    <div className="space-y-4 md:col-span-1 border-r border-zinc-200 dark:border-zinc-800 md:pr-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                <Flame className="h-4 w-4 text-orange-500" /> Heat Sources
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {HEAT_SOURCE_OPTIONS.map(src => (
                                    <button key={src} onClick={() => toggleArray(localHeatSources, setLocalHeatSources, src)}
                                        className={`px-2 py-1 text-[10px] rounded border transition-colors ${localHeatSources.includes(src) ? 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300 font-medium' : 'bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-zinc-900/50 dark:border-zinc-800 dark:text-zinc-400'}`}>
                                        {src}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                <UtensilsCrossed className="h-4 w-4 text-zinc-500" /> Utensils
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {UTENSIL_OPTIONS.map(utensil => (
                                    <button key={utensil} onClick={() => toggleArray(localUtensils, setLocalUtensils, utensil)}
                                        className={`px-2 py-1 text-[10px] rounded border transition-colors ${localUtensils.includes(utensil) ? 'bg-zinc-200 border-zinc-400 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100 font-medium' : 'bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-zinc-900/50 dark:border-zinc-800 dark:text-zinc-400'}`}>
                                        {utensil}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                <UtensilsCrossed className="h-4 w-4 text-blue-600" /> Sauces / Oils
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {SAUCE_OPTIONS.map(sauce => (
                                    <button key={sauce} onClick={() => toggleArray(localSauces, setLocalSauces, sauce)}
                                        className={`px-2 py-1 text-[10px] rounded border transition-colors ${localSauces.includes(sauce) ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300 font-medium' : 'bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-zinc-900/50 dark:border-zinc-800 dark:text-zinc-400'}`}>
                                        {sauce}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Col 4: Constraints & Action */}
                    <div className="space-y-4 md:col-span-1 flex flex-col justify-between">
                        <div className="w-full space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Cuisine Focus</label>
                            <select
                                value={localCuisine}
                                onChange={(e) => setLocalCuisine(e.target.value)}
                                className="flex h-9 w-full items-center justify-between rounded border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            >
                                {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="w-full space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1"><Clock className="h-3 w-3" /> Time Limit</label>
                                <span className="text-xs text-purple-600 font-bold">{localTime}m</span>
                            </div>
                            <input
                                type="range"
                                min="10" max="180" step="5"
                                value={localTime}
                                onChange={(e) => setLocalTime(Number(e.target.value))}
                                className="w-full appearance-none h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 accent-purple-600 outline-none cursor-pointer"
                            />
                        </div>

                        <div className="w-full space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1"><Zap className="h-3 w-3" /> Effort Level</label>
                                <span className="text-xs text-purple-600 font-bold">{localEffort}/5</span>
                            </div>
                            <input
                                type="range"
                                min="1" max="5" step="1"
                                value={localEffort}
                                onChange={(e) => setLocalEffort(Number(e.target.value))}
                                className="w-full appearance-none h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 accent-purple-600 outline-none cursor-pointer"
                            />
                        </div>

                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow shadow-purple-500/20"
                            onClick={() => handleGenerateConcepts(10)}
                            disabled={isGeneratingConcepts}
                        >
                            {isGeneratingConcepts ? "Scouting..." : "Forge 10 Concepts"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* FEED SECTION */}

            {/* Empty State */}
            {isAppEmpty && (
                <div className="w-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center bg-zinc-50/50 dark:bg-zinc-900/30">
                    <ChefHat className="h-16 w-16 text-zinc-300 dark:text-zinc-700 mb-4" />
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Ready to Architect Your Meal</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm">
                        Adjust your parameters above and hit Forge to receive a batch of curated dish concepts.
                    </p>
                </div>
            )}

            <div className="flex flex-col space-y-12">

                {/* Detailed Recipes Stream */}
                {detailedRecipes.map((recipe) => (
                    <div key={recipe.id} className="relative">
                        {recipe.isLoading ? (
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 bg-zinc-50 dark:bg-zinc-950/50 space-y-6">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <Skeleton className="h-8 w-1/3" />
                                </div>
                                <Skeleton className="h-[300px] w-full rounded-lg" />
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                    <Skeleton className="h-4 w-4/6" />
                                </div>
                                <div className="text-center pt-4 text-sm font-medium text-zinc-500 animate-pulse">
                                    Drafting your detailed {recipe.concept.title} recipe...
                                </div>
                            </div>
                        ) : recipe.sections && (
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-md overflow-hidden flex flex-col ring-1 ring-black/5 dark:ring-white/5">

                                {/* Toolbar */}
                                <div className="bg-zinc-50/80 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 p-3 flex justify-between items-center backdrop-blur-sm">
                                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 px-2">
                                        <ChefHat className="w-5 h-5 text-purple-600" /> Expanded Recipe
                                    </h2>
                                    <CopyRecipeButton recipe={recipe} time={localTime} effort={localEffort} />
                                </div>

                                <div className="p-6 md:p-8 overflow-y-auto w-full space-y-8">
                                    <div className="space-y-3">
                                        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                            {recipe.concept.title}
                                        </h2>
                                        <div className="flex gap-2 flex-wrap">
                                            <span className="px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                                                {recipe.concept.cuisine}
                                            </span>
                                            <span className="px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                                {localTime} mins
                                            </span>
                                            <span className="px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400">
                                                Effort: {localEffort}/5
                                            </span>
                                        </div>
                                    </div>

                                    {/* Generated Image */}
                                    {recipe.imageRender ? (
                                        <div className="w-full aspect-video md:aspect-[21/9] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 shadow-inner relative">
                                            <img
                                                src={recipe.imageRender}
                                                alt={recipe.concept.title}
                                                className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-xl pointer-events-none"></div>
                                        </div>
                                    ) : (
                                        <div className="w-full aspect-[21/9] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-sm font-medium text-zinc-500 border border-zinc-200 dark:border-zinc-800 shadow-inner">
                                            <div className="flex flex-col items-center gap-2">
                                                <Skeleton className="h-12 w-12 rounded-full" />
                                                <span>Visual representation unavailable</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* About Section */}
                                    <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-p:leading-relaxed prose-lg">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {recipe.sections.about}
                                        </ReactMarkdown>
                                    </div>

                                    {/* Macros Visualizer */}
                                    {recipe.macros && (
                                        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
                                            <h4 className="text-sm uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-400 mb-4">Nutritional Profile</h4>
                                            <div className="flex flex-col gap-4">
                                                <div className="flex justify-between items-end">
                                                    <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                                                        {recipe.macros.calories} <span className="text-base font-medium text-zinc-500 dark:text-zinc-400">kcal</span>
                                                    </div>
                                                </div>

                                                <div className="w-full h-4 rounded-full overflow-hidden flex">
                                                    {(() => {
                                                        const m = recipe.macros;
                                                        if (!m) return null;
                                                        const total = m.protein + m.carbs + m.fat;
                                                        const p = total > 0 ? (m.protein / total) * 100 : 33.3;
                                                        const c = total > 0 ? (m.carbs / total) * 100 : 33.3;
                                                        const f = total > 0 ? (m.fat / total) * 100 : 33.4;
                                                        return (
                                                            <>
                                                                <div style={{ width: `${p}%` }} className="bg-blue-500" title={`Protein ${m.protein}g`}></div>
                                                                <div style={{ width: `${c}%` }} className="bg-emerald-500" title={`Carbs ${m.carbs}g`}></div>
                                                                <div style={{ width: `${f}%` }} className="bg-amber-500" title={`Fat ${m.fat}g`}></div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>

                                                <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-bold">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                                                        <span className="text-zinc-700 dark:text-zinc-300">Protein: {recipe.macros.protein}g</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
                                                        <span className="text-zinc-700 dark:text-zinc-300">Carbs: {recipe.macros.carbs}g</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></div>
                                                        <span className="text-zinc-700 dark:text-zinc-300">Fat: {recipe.macros.fat}g</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Specs Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-4 shadow-sm bg-zinc-50/50 dark:bg-zinc-900/30 overflow-x-hidden break-words w-full">
                                            <h4 className="font-extrabold flex items-center gap-2 text-zinc-900 dark:text-zinc-100 text-lg border-b border-zinc-200 dark:border-zinc-800 pb-2">
                                                <Target className="h-5 w-5 text-purple-600" /> Ingredients
                                            </h4>
                                            <div className="prose prose-sm xl:prose-base prose-zinc dark:prose-invert prose-ul:pl-0 font-medium">
                                                <ul className="mt-2 space-y-2 list-disc pl-5 font-medium">
                                                    {recipe.sections.ingredients
                                                        ?.split("\n")
                                                        .map(i => i.trim())
                                                        .filter(Boolean)
                                                        .map((item, idx) => (
                                                            <li key={idx}>
                                                                {item.replace(/^\d+\.\s*/, "").replace(/^[-*]\s*/, "")}
                                                            </li>
                                                        ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-4 shadow-sm bg-zinc-50/50 dark:bg-zinc-900/30 overflow-x-hidden break-words w-full">
                                            <h4 className="font-extrabold flex items-center gap-2 text-zinc-900 dark:text-zinc-100 text-lg border-b border-zinc-200 dark:border-zinc-800 pb-2">
                                                <UtensilsCrossed className="h-5 w-5 text-yellow-600" /> Equipment Required
                                            </h4>
                                            <div className="prose prose-sm xl:prose-base prose-zinc dark:prose-invert prose-ul:pl-0 font-medium">
                                                <ul className="mt-2 space-y-2 list-disc pl-5 font-medium">
                                                    {recipe.sections.equipment
                                                        ?.split("\n")
                                                        .map(i => i.trim())
                                                        .filter(Boolean)
                                                        .map((item, idx) => (
                                                            <li key={idx}>
                                                                {item.replace(/^\d+\.\s*/, "").replace(/^[-*]\s*/, "")}
                                                            </li>
                                                        ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Directions */}
                                    <div className="space-y-4 pt-4">
                                        <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-200 dark:border-zinc-800 pb-3">
                                            Directions
                                        </h3>
                                        <div className="prose prose-zinc dark:prose-invert prose-purple max-w-none pt-2 prose-ol:font-medium prose-ol:space-y-4 prose-li:marker:text-purple-600 prose-li:marker:font-bold prose-lg">
                                            <ul className="mt-2 space-y-2 list-disc pl-5 font-medium">
                                                {recipe.sections.steps
                                                    ?.split("\n")
                                                    .map(i => i.trim())
                                                    .filter(Boolean)
                                                    .map((step, idx) => (
                                                        <li key={idx}>
                                                            {step.replace(/^\d+\.\s*/, "").replace(/^[-*]\s*/, "")}
                                                        </li>
                                                    ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Tips */}
                                    {recipe.sections.tips && recipe.sections.tips.length > 5 && (
                                        <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-xl p-6 mt-8 space-y-4 shadow-sm">
                                            <h4 className="font-extrabold text-purple-900 dark:text-purple-300 flex items-center gap-2 text-lg">
                                                <ChefHat className="h-5 w-5" /> Chef's Tips
                                            </h4>
                                            <div className="prose prose-zinc dark:prose-invert font-medium text-purple-900/80 dark:text-purple-200/80 prose-ul:space-y-2">
                                                <ul className="mt-2 space-y-2 list-disc pl-5 font-medium">
                                                    {recipe.sections.tips
                                                        ?.split("\n")
                                                        .map(i => i.trim())
                                                        .filter(Boolean)
                                                        .map((tip, idx) => (
                                                            <li key={idx}>
                                                                {tip.replace(/^\d+\.\s*/, "").replace(/^[-*]\s*/, "")}
                                                            </li>
                                                        ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        )}
                    </div>
                ))}


                {/* Loading State - Concepts */}
                {isGeneratingConcepts && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-white dark:bg-zinc-950 space-y-4">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/4" />
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-5/6" />
                                </div>
                                <Skeleton className="h-10 w-full mt-4" />
                            </div>
                        ))}
                    </div>
                )}


                {/* Concepts Grid (Moves down as recipes expand) */}
                {concepts.length > 0 && !isGeneratingConcepts && (
                    <div className="space-y-6 pb-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="flex justify-between items-end">
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                                    Unexpanded Concepts
                                </h3>
                                <p className="text-zinc-500 text-sm">Expand a concept to generate a fully documented recipe.</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleGenerateConcepts(3)} className="hidden md:flex bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-dashed">
                                Generate 3 More
                            </Button>
                        </div>

                        {/* Grid wraps cleanly based on width */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {concepts.map((concept, idx) => {
                                const m = concept.matchPercentage;
                                const matchColor = m >= 80 ? "bg-emerald-500" : m >= 50 ? "bg-yellow-500" : "bg-red-500";

                                return (
                                    <div key={`${concept.title}-${idx}`} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5 relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: m >= 80 ? '#10b981' : m >= 50 ? '#eab308' : '#ef4444' }} />
                                        <div className="pl-2">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 leading-tight">
                                                    {concept.title}
                                                </h4>
                                            </div>
                                            <span className="inline-block mb-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                                                {concept.cuisine}
                                            </span>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
                                                {concept.description}
                                            </p>

                                            <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-bold">
                                                <span>{concept.calories} kcal</span>
                                                <span className="truncate ml-2">{concept.macrosPreview}</span>
                                            </div>

                                            <div className="mt-3 space-y-1">
                                                <div className="flex justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                                                    <span>Ingredient Match</span>
                                                    <span>{concept.matchPercentage}%</span>
                                                </div>
                                                <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                                                    <div className={`h-full ${matchColor}`} style={{ width: `${concept.matchPercentage}%` }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 mt-2 shadow-sm font-semibold"
                                            onClick={() => generateDetailedRecipe(concept, {
                                                ingredients: ingredientInput,
                                                cuisine: localCuisine,
                                                heatSources: localHeatSources,
                                                utensils: localUtensils,
                                                spices: localSpices,
                                                veggies: localVeggies,
                                                sauces: localSauces,
                                                time: [localTime],
                                                effort: [localEffort]
                                            })}
                                        >
                                            Expand Recipe
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="w-full pt-4 flex justify-center md:hidden">
                            <Button variant="outline" onClick={() => handleGenerateConcepts(3)} className="w-full border-dashed bg-zinc-50 dark:bg-zinc-900">
                                Generate 3 More Concepts
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
