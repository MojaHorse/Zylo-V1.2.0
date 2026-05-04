import { supabase } from '../../lib/supabase';
import type { CartItem } from '../../types';

export async function validateOrderStock(cart: CartItem[]): Promise<{success: boolean, message?: string, warnings?: string[]}> {
    try {
        if (cart.length === 0) return { success: true, warnings: [] };

        // 1. Gather exact demand of raw materials based on Cart Items
        const productIds = Array.from(new Set(cart.map(c => c.id)));
        
        // 2. Fetch recipes
        const { data: recipes, error: recipeErr } = await supabase
            .from('product_ingredients')
            .select(`
                product_id,
                quantity_required,
                inventory_item_id,
                inventory_items (
                    name,
                    quantity
                )
            `)
            .in('product_id', productIds);

        if (recipeErr) throw recipeErr;

        // Structure to track global totals needed
        const ingredientDemand: Record<string, {name: string, required: number, available: number}> = {};

        // 3. Process Products
        for (const item of cart) {
            const itemRecipes = recipes?.filter(r => r.product_id === item.id) || [];
            
            for (const r of itemRecipes) {
                // PostgREST returns linked tables as object arrays or objects depending on foreign keys
                const inv = Array.isArray(r.inventory_items) ? r.inventory_items[0] : r.inventory_items;
                if (!inv) continue;

                if (!ingredientDemand[r.inventory_item_id]) {
                    ingredientDemand[r.inventory_item_id] = {
                        name: inv.name,
                        required: 0,
                        available: Number(inv.quantity)
                    };
                }
                ingredientDemand[r.inventory_item_id].required += (Number(r.quantity_required) * item.quantity);
            }
        }

        // 4. Process Modifiers (Extras)
        // Check if modifiers specify an exact inventory item ID (which our Add to Cart modal maps them to)
        const modifierInvIds = cart.flatMap(c => c.modifiers?.map(m => m.id) || []);
        if (modifierInvIds.length > 0) {
            const { data: modInv, error: modErr } = await supabase
                .from('inventory_items')
                .select('id, name, quantity')
                .in('id', modifierInvIds);
            
            if (!modErr && modInv) {
                for (const item of cart) {
                    if (!item.modifiers) continue;
                    for (const mod of item.modifiers) {
                        const invData = modInv.find(i => i.id === mod.id);
                        if (!invData) continue;

                        if (!ingredientDemand[mod.id]) {
                            ingredientDemand[mod.id] = {
                                name: invData.name,
                                required: 0,
                                available: Number(invData.quantity)
                            };
                        }
                        // Modifiers are assumed to use qty=1 per addition per product
                        ingredientDemand[mod.id].required += (1 * item.quantity);
                    }
                }
            }
        }

        // 5. Final validation check
        const warnings: string[] = [];
        for (const id in ingredientDemand) {
            const demand = ingredientDemand[id];
            if (demand.required > demand.available) {
                warnings.push(`${demand.name} (Need: ${demand.required}, Have: ${demand.available})`);
            }
        }

        return { success: true, warnings };

    } catch (e: any) {
        console.error("Soft validation bypassed:", e);
        return { success: true, warnings: [] };
    }
}
