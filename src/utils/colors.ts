export const CATEGORY_COLORS: Record<string, string> = {
    'Meat': '#ef4444',
    'Bread': '#f59e0b',
    'Veggies': '#22c55e',
    'Drinks': '#3b82f6',
    'Packaging': '#8b5cf6',
    'Other': '#64748b',
};

export const getCategoryColor = (category: string) => {
    if (!category) return CATEGORY_COLORS['Other'];
    if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
    
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 45%)`; // A bit more vibrant and accessible
};
