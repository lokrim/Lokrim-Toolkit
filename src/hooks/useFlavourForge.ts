import { useState } from "react";
import { toast } from "sonner";
import { createGeminiModel, getActivePollinationsApiKey, getActivePollinationsImageModel } from "@/lib/models";

import { STORAGE_KEYS } from "@/lib/storage";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
    FLAVOUR_FORGE_CONCEPT_SYSTEM_PROMPT,
    FLAVOUR_FORGE_RECIPE_SYSTEM_PROMPT,
    buildConceptInput,
    buildDetailedInput,
    type FlavourForgeParams
} from "@/lib/prompts/flavourForge";

export interface DishConcept {
    title: string;
    cuisine: string;
    calories: number;
    matchPercentage: number;
    description: string;
    macrosPreview: string;
}

export interface DetailedRecipeSections {
    about: string;
    ingredients: string;
    equipment: string;
    steps: string;
    tips: string;
}

export interface DetailedRecipeData {
    id: string;
    concept: DishConcept;
    sections: DetailedRecipeSections | null;
    imageRender: string | null;
    macros: { protein: number; carbs: number; fat: number; calories: number } | null;
    isLoading: boolean;
}

export interface FlavourForgeDefaults {
    heatSources: string[];
    utensils: string[];
    spices?: string[];
    veggies?: string[];
    sauces?: string[];
    cuisine: string;
}

const DEFAULT_KITCHEN: FlavourForgeDefaults = {
    heatSources: ["Stove", "Oven", "Microwave"],
    utensils: ["Pan", "Pot", "Cutting Board", "Knife"],
    spices: ["Salt", "Black Pepper", "Garlic Powder", "Garam Masala", "Cumin"],
    veggies: ["Onion", "Tomato", "Garlic"],
    sauces: ["Soy Sauce", "Hot Sauce"],
    cuisine: "Surprise Me",
};

export function useFlavourForge() {
    // Persistent profile
    const [kitchenDefaults, setKitchenDefaults] = useLocalStorage<FlavourForgeDefaults>(
        STORAGE_KEYS.flavourForge.defaults,
        DEFAULT_KITCHEN
    );

    // Runtime state (Append-Only Feed Model)
    const [concepts, setConcepts] = useState<DishConcept[]>([]);
    const [detailedRecipes, setDetailedRecipes] = useState<DetailedRecipeData[]>([]);
    const [isGeneratingConcepts, setIsGeneratingConcepts] = useState<boolean>(false);
    const [ingredientInput, setIngredientInput] = useState<string>("");

    async function generateConcepts(params: FlavourForgeParams) {
        setIsGeneratingConcepts(true);
        try {
            const model = createGeminiModel({
                systemInstruction: FLAVOUR_FORGE_CONCEPT_SYSTEM_PROMPT,
                generationConfig: { temperature: 0.8 },
            });
            const input = buildConceptInput(params);
            const result = await model.generateContent(input);
            const textResponse = result.response.text();
            
            // Clean markdown blocking
            let cleanJson = textResponse.replace(/^```json/g, "").replace(/^```/g, "").replace(/```$/g, "").trim();
            const parsed: DishConcept[] = JSON.parse(cleanJson);
            
            setConcepts(prev => [...prev, ...parsed]);
            
            // Persist the UI selections so they stick around for the next visit
            setKitchenDefaults(prev => ({
                ...prev,
                heatSources: params.heatSources,
                utensils: params.utensils,
                spices: params.spices,
                veggies: params.veggies,
                sauces: params.sauces,
                cuisine: params.cuisine
            }));
            
            toast.success("Concepts generated!");

        } catch (err: unknown) {
             toast.error(err instanceof Error ? err.message : "Failed to generate concepts. The AI output might have been malformed.");
        } finally {
            setIsGeneratingConcepts(false);
        }
    }

    async function generateDetailedRecipe(concept: DishConcept, params: FlavourForgeParams) {
        // Remove from concepts array immediately
        setConcepts(prev => prev.filter(c => c.title !== concept.title));

        const recipeId = Date.now().toString();
        // Add placeholder
        setDetailedRecipes(prev => [...prev, {
            id: recipeId,
            concept: concept,
            sections: null,
            imageRender: null,
            macros: null,
            isLoading: true
        }]);

        try {
            const model = createGeminiModel({
                systemInstruction: FLAVOUR_FORGE_RECIPE_SYSTEM_PROMPT,
                generationConfig: { temperature: 0.6 },
            });
            const input = buildDetailedInput(concept.title, concept.cuisine, params);
            const result = await model.generateContent(input);
            const rawMarkdown = result.response.text();
            
            let finalImageRender = null;
            // 1. Extract Images
            const imagePromptMatch = rawMarkdown.match(/<ImagePrompt>\s*(.*?)\s*<\/ImagePrompt>/is);
            const imgPrompt = imagePromptMatch ? imagePromptMatch[1].trim() : `${concept.title} professional food photography`;
            
            try {
                const apiKey = getActivePollinationsApiKey();
                const imageModelName = getActivePollinationsImageModel();
                
                const response = await fetch(`https://gen.pollinations.ai/v1/images/generations`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        prompt: imgPrompt,
                        model: imageModelName,
                        size: "1024x1024",
                        response_format: "b64_json"
                    })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`API Error ${response.status}: ${errText}`);
                }

                const data = await response.json();
                if (data.data && data.data.length > 0) {
                    const imgB64 = data.data[0].b64_json;
                    if (imgB64) {
                        finalImageRender = `data:image/jpeg;base64,${imgB64}`;
                    }
                }
            } catch (imgError: unknown) {
                console.error("Failed to generate image:", imgError);
                toast.error(`Image generation failed: ${imgError instanceof Error ? imgError.message : String(imgError)}`);
            }

            // 2. Extract Macros
            const macrosMatch = rawMarkdown.match(/<Macros>\s*(.*?)\s*<\/Macros>/is);
            const macrosStr = macrosMatch ? macrosMatch[1] : "";
            const proteinMatch = macrosStr.match(/Protein:\s*([\d.]+)/i);
            const carbsMatch = macrosStr.match(/Carbs:\s*([\d.]+)/i);
            const fatMatch = macrosStr.match(/Fat:\s*([\d.]+)/i);
            const caloriesMatch = macrosStr.match(/Calories:\s*([\d.]+)/i);

            let finalMacros = null;
            if (proteinMatch || carbsMatch || fatMatch) {
               finalMacros = {
                   protein: proteinMatch ? parseFloat(proteinMatch[1]) : 0,
                   carbs: carbsMatch ? parseFloat(carbsMatch[1]) : 0,
                   fat: fatMatch ? parseFloat(fatMatch[1]) : 0,
                   calories: caloriesMatch ? parseFloat(caloriesMatch[1]) : concept.calories,
               };
            }

            // 3. Extract Sections
            const extractSection = (tag: string) => {
                const match = rawMarkdown.match(new RegExp(`<${tag}>\\s*(.*?)\\s*</${tag}>`, 'is'));
                return match ? match[1].trim() : '';
            };

            let stepsText = extractSection("Steps");
            let tipsText = extractSection("Tips");

            // Explicit mapping to guarantee numbering and bullets with newlines regardless of what AI returns
            stepsText = extractSection("Steps")
                .split('\n')
                .map(s => s.trim())
                .filter(Boolean)
                .map((step, index) => {
                     if (/^\d+\./.test(step)) return step;
                     return `${index + 1}. ${step}`;
                })
                .join('\n\n');

            tipsText = extractSection("Tips")
                .split('\n')
                .map(s => s.trim())
                .filter(Boolean)
                .map(tip => {
                     if (/^[-*]\s/.test(tip)) return tip;
                     return `- ${tip}`;
                })
                .join('\n\n');

            const finalSections = {
                about: extractSection("About"),
                ingredients: extractSection("Ingredients"),
                equipment: extractSection("Equipment"),
                steps: stepsText,
                tips: tipsText,
            };

            // Update placeholder with data
            setDetailedRecipes(prev => prev.map(recipe => {
                if (recipe.id === recipeId) {
                    return { ...recipe, isLoading: false, sections: finalSections, imageRender: finalImageRender, macros: finalMacros };
                }
                return recipe;
            }));

            toast.success(`${concept.title} recipe forged!`);

        } catch (err: unknown) {
             toast.error(err instanceof Error ? err.message : "Failed to generate detailed recipe.");
             // Remove placeholder if failed
             setDetailedRecipes(prev => prev.filter(r => r.id !== recipeId));
             // Re-add to concepts grid so user can retry
             setConcepts(prev => [...prev, concept]);
        }
    }

    function resetAll() {
        setDetailedRecipes([]);
        setConcepts([]);
        setIngredientInput("");
    }

    return {
        kitchenDefaults,
        concepts,
        detailedRecipes,
        isGeneratingConcepts,
        generateConcepts,
        generateDetailedRecipe,
        resetAll,
        ingredientInput,
        setIngredientInput,
    };
}
