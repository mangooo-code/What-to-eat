export interface FindRecipesSubmission {
  timePreference: string;
  memberIds: string[];
  tastePreference: string;
  preferLikedRecipes: boolean;
  dietaryExclusions: string[];
}

export interface RecipeDto {
  name: string;
  cookTime: string;
  difficulty: string;
  matchSummary: string;
  description: string;
}

const mockRecipes: RecipeDto[] = [
  {
    name: "番茄炒蛋",
    cookTime: "15 分钟",
    difficulty: "简单",
    matchSummary: "主要食材全部已有",
    description: "番茄和鸡蛋家里都有，不需要额外购买主要食材，15 分钟左右就能做好，很适合今天快速做一顿家常菜。",
  },
  {
    name: "青椒肉丝",
    cookTime: "25 分钟",
    difficulty: "简单",
    matchSummary: "已有 2 / 3 种主要食材 · 缺少蒜苗",
    description: "青椒和猪里脊都可以直接用，只需要补充一种主要食材，制作时间也符合当前需求。",
  },
  {
    name: "家常豆腐煲",
    cookTime: "30 分钟",
    difficulty: "中等",
    matchSummary: "已有 1 / 2 种主要食材 · 缺少香菇",
    description: "嫩豆腐可以直接使用，只需要补充香菇，整体食材简单，适合这一顿想吃家常口味的需求。",
  },
];

// Placeholder for the real AI recipe lookup; currently returns fixed mock data regardless of input.
export async function search(_submission: FindRecipesSubmission): Promise<RecipeDto[]> {
  return mockRecipes;
}
