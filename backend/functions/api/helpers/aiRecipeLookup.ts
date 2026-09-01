import type { Recipe } from "../../../shared/types/domain";
import { findMatchingFavoriteRecipeIds, getRecipeById, type RecipeTimeRange } from "../../../shared/database";

export interface FindRecipesSubmission {
  userId: string;
  timePreference: string;
  memberIds: string[];
  tastePreference: string;
  preferLikedRecipes: boolean;
  dietaryExclusions: string[];
}

// API-facing shape: persisted Recipe fields relevant for display, plus fields computed at
// request time (cookTime display string, ingredient match summary) that aren't stored in the DB.
export type RecipeDto = Pick<Recipe, "id" | "name" | "description" | "difficulty" | "tags"> & {
  cookTime: string;
  matchSummary: string;
};

type MockRecipe = Pick<Recipe, "id" | "name" | "description" | "difficulty" | "time" | "tags"> & {
  matchSummary: string;
};

function formatCookTime(minutes: number | null): string {
  if (minutes === null) return "时间待定";
  return minutes >= 60 ? `${Math.round(minutes / 60)} 小时` : `${minutes} 分钟`;
}

function toDto(recipe: Recipe, matchSummary: string): RecipeDto {
  return {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description,
    difficulty: recipe.difficulty,
    tags: recipe.tags,
    cookTime: formatCookTime(recipe.time),
    matchSummary,
  };
}

// Matches the two fixed timePreference options surfaced by the frontend
// ("快速解决（15–30 分钟）" and "慢慢做饭（30 分钟以上）"); unrecognized values fall back to the fast bracket.
function parseTimeRange(timePreference: string): RecipeTimeRange {
  return timePreference.includes("以上") ? { minMinutesExclusive: 30 } : { maxMinutes: 30 };
}

const mockRecipes: MockRecipe[] = [
  {
    id: "9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b",
    name: "番茄炒蛋",
    description: "番茄和鸡蛋家里都有，不需要额外购买主要食材，15 分钟左右就能做好，很适合今天快速做一顿家常菜。",
    difficulty: "简单",
    time: 15,
    tags: [],
    matchSummary: "主要食材全部已有",
  },
  {
    id: "3c1d6e4a-7b5f-4e9a-8a1d-6e4a7b5f4e9a",
    name: "青椒肉丝",
    description: "青椒和猪里脊都可以直接用，只需要补充一种主要食材，制作时间也符合当前需求。",
    difficulty: "简单",
    time: 25,
    tags: [],
    matchSummary: "已有 2 / 3 种主要食材 · 缺少蒜苗",
  },
  {
    id: "5a8f3d2c-1e6b-4f7a-9c3d-2c1e6b4f7a9c",
    name: "家常豆腐煲",
    description: "嫩豆腐可以直接使用，只需要补充香菇，整体食材简单，适合这一顿想吃家常口味的需求。",
    difficulty: "中等",
    time: 30,
    tags: [],
    matchSummary: "已有 1 / 2 种主要食材 · 缺少香菇",
  },
];

function searchMock(): RecipeDto[] {
  return mockRecipes.map(({ time, matchSummary, ...recipe }) => ({
    ...recipe,
    cookTime: formatCookTime(time),
    matchSummary,
  }));
}

// Placeholder for the real AI recipe lookup; falls back to fixed mock data unless
// preferLikedRecipes narrows the results down to the user's own favorited recipes.
export async function search(submission: FindRecipesSubmission): Promise<RecipeDto[]> {
  if (!submission.preferLikedRecipes) return searchMock();

  const matchingIds = await findMatchingFavoriteRecipeIds(
    submission.userId,
    parseTimeRange(submission.timePreference),
  );
  if (!matchingIds.length) return searchMock();

  const recipes = await Promise.all(matchingIds.map((id) => getRecipeById(id)));
  return recipes
    .filter((recipe): recipe is Recipe => recipe !== null)
    .map((recipe) => toDto(recipe, "已收藏 · 现有食材可以直接做"));
}
