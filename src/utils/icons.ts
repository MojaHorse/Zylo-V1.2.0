import {
    Beef, Carrot, Croissant, CupSoda, Drumstick, Fish, Box, Pizza, Coffee, Milk, Beer, Wine, Package
} from 'lucide-react-native';

export const getCategoryIcon = (category: string) => {
    const lower = category?.toLowerCase() || '';
    
    if (lower.includes('meat') || lower.includes('beef') || lower.includes('pork')) return Beef;
    if (lower.includes('chicken') || lower.includes('poultry')) return Drumstick;
    if (lower.includes('fish') || lower.includes('seafood')) return Fish;
    
    if (lower.includes('veg') || lower.includes('fruit') || lower.includes('produce')) return Carrot;
    
    if (lower.includes('bread') || lower.includes('bakery') || lower.includes('pastry')) return Croissant;
    if (lower.includes('pizza')) return Pizza;
    
    if (lower.includes('drink') || lower.includes('beverage') || lower.includes('soda') || lower.includes('cold')) return CupSoda;
    if (lower.includes('coffee') || lower.includes('tea') || lower.includes('hot')) return Coffee;
    if (lower.includes('milk') || lower.includes('dairy')) return Milk;
    if (lower.includes('beer') || lower.includes('alcohol')) return Beer;
    if (lower.includes('wine') || lower.includes('liquor')) return Wine;
    
    if (lower.includes('box') || lower.includes('packaging') || lower.includes('supplies')) return Box;
    
    return Package; // Default
};
