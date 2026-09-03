import { randomUUID } from "node:crypto";
import type { Recipe } from "../../../shared/types/domain";
import {
  findMatchingFavoriteRecipeIds,
  getRecipeById,
  listIngredients,
  listMembers,
  listRecipeSeasonings,
  listRecipeSteps,
  MAX_RESULTS,
  type RecipeTimeRange,
} from "../../../shared/database";
import { generate as generateWithAliyun } from "./aliyunHelper";

export interface FindRecipesSubmission {
  userId: string;
  timePreference: string;
  memberIds: string[];
  tastePreference: string;
  preferLikedRecipes: boolean;
  dietaryExclusions: string[];
}

export interface RecipeIngredientDto {
  name: string;
  quantity: string;
}

export interface RecipeStepDto {
  title: string;
  detailedInstructions: string;
  time: number | null;
}

// API-facing shape: persisted Recipe fields relevant for display, plus fields computed at
// request time (cookTime display string, ingredient match summary) that aren't stored in the DB.
// ingredients are only populated for AI-generated recipes for now (no clean match to the
// NUMERIC+unitTypeId RecipeIngredients schema); seasonings/steps are populated for both
// (favorites read theirs from RecipeSeasonings/RecipeSteps).
export type RecipeDto = Pick<Recipe, "id" | "name" | "description" | "difficulty" | "tags"> & {
  cookTime: string;
  matchSummary: string;
  ingredients?: RecipeIngredientDto[];
  seasonings?: RecipeIngredientDto[];
  steps?: RecipeStepDto[];
};

function formatCookTime(minutes: number | null): string {
  if (minutes === null) return "时间待定";
  return minutes >= 60 ? `${Math.round(minutes / 60)} 小时` : `${minutes} 分钟`;
}

function toDto(
  recipe: Recipe,
  matchSummary: string,
  seasonings: RecipeIngredientDto[],
  steps: RecipeStepDto[],
): RecipeDto {
  return {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description,
    difficulty: recipe.difficulty,
    tags: recipe.tags,
    cookTime: formatCookTime(recipe.time),
    matchSummary,
    seasonings,
    steps,
  };
}

// Matches the two fixed timePreference options surfaced by the frontend
// ("快速解决（15–30 分钟）" and "慢慢做饭（30 分钟以上）"); unrecognized values fall back to the fast bracket.
function parseTimeRange(timePreference: string): RecipeTimeRange {
  return timePreference.includes("以上") ? { minMinutesExclusive: 30 } : { maxMinutes: 30 };
}

interface AiGeneratedRecipe {
  name: string;
  description: string;
  difficulty: string;
  time: number;
  tags: string[];
  ingredients: RecipeIngredientDto[];
  seasonings: RecipeIngredientDto[];
  steps: RecipeStepDto[];
}

async function collectMemberDietaryInfo(
  userId: string,
  memberIds: string[],
): Promise<{ dietaryExclusions: string[]; allergens: string[] }> {
  if (!memberIds.length) return { dietaryExclusions: [], allergens: [] };
  const members = await listMembers(userId);
  const selected = members.filter((member) => memberIds.includes(member.memberId));
  return {
    dietaryExclusions: [...new Set(selected.flatMap((member) => member.dietaryRestrictions))],
    allergens: [...new Set(selected.flatMap((member) => member.allergens))],
  };
}

function buildAiRecipePrompt(input: {
  ingredientNames: string[];
  timePreference: string;
  tastePreference: string;
  dietaryExclusions: string[];
  memberDietaryExclusions: string[];
  allergens: string[];
}): string {
  return [
    "请推荐 1 道菜谱。",
    `可用食材：${input.ingredientNames.length ? input.ingredientNames.join("、") : "无"}`,
    `时间要求：${input.timePreference}`,
    `口味偏好：${input.tastePreference}`,
    `本人忌口：${input.dietaryExclusions.length ? input.dietaryExclusions.join("、") : "无"}`,
    `同桌家庭成员忌口：${input.memberDietaryExclusions.length ? input.memberDietaryExclusions.join("、") : "无"}`,
    `过敏源（必须避免）：${input.allergens.length ? input.allergens.join("、") : "无"}`,
    "请仅返回一个 JSON 数组，不要包含 Markdown 代码块标记或其他任何说明文字，每个元素包含以下字段：",
    'name（string，菜名）、description（string，简要说明）、difficulty（string，简单/中等/困难）、time（number，预计所需分钟数）、tags（string[]，菜系或口味标签）、',
    'ingredients（数组，主料，每项包含 name 食材名和 quantity 用量，例如 {"name":"番茄","quantity":"2 个"}）、',
    'seasonings（数组，调料，格式同 ingredients，quantity 可为“适量”“少许”等，例如 {"name":"盐","quantity":"适量"}）、',
    'steps（数组，按顺序排列的制作步骤，每项包含 title 步骤标题、detailedInstructions 详细做法、time 预计耗时分钟数（数字，不确定则为 null），与数据库 RecipeSteps 表结构一致）。',
  ].join("\n");
}

function isRecipeIngredientDto(value: unknown): value is RecipeIngredientDto {
  return typeof value === "object" && value !== null &&
    typeof (value as RecipeIngredientDto).name === "string" &&
    typeof (value as RecipeIngredientDto).quantity === "string";
}

function isRecipeStepDto(value: unknown): value is RecipeStepDto {
  return typeof value === "object" && value !== null &&
    typeof (value as RecipeStepDto).title === "string" &&
    typeof (value as RecipeStepDto).detailedInstructions === "string" &&
    ((value as RecipeStepDto).time === null || typeof (value as RecipeStepDto).time === "number");
}

function parseAiRecipes(raw: string): AiGeneratedRecipe[] {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    console.error("parseAiRecipes: response was not valid JSON", error, raw);
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is AiGeneratedRecipe =>
    typeof item === "object" && item !== null &&
    typeof (item as AiGeneratedRecipe).name === "string" &&
    typeof (item as AiGeneratedRecipe).description === "string" &&
    typeof (item as AiGeneratedRecipe).difficulty === "string" &&
    typeof (item as AiGeneratedRecipe).time === "number" &&
    Array.isArray((item as AiGeneratedRecipe).tags) &&
    Array.isArray((item as AiGeneratedRecipe).ingredients) &&
    (item as AiGeneratedRecipe).ingredients.every(isRecipeIngredientDto) &&
    Array.isArray((item as AiGeneratedRecipe).seasonings) &&
    (item as AiGeneratedRecipe).seasonings.every(isRecipeIngredientDto) &&
    Array.isArray((item as AiGeneratedRecipe).steps) &&
    (item as AiGeneratedRecipe).steps.every(isRecipeStepDto));
}

function toAiDto(recipe: AiGeneratedRecipe): RecipeDto {
  return {
    id: randomUUID(),
    name: recipe.name,
    description: recipe.description,
    difficulty: recipe.difficulty,
    tags: recipe.tags,
    cookTime: formatCookTime(recipe.time),
    matchSummary: "AI 推荐 · 根据现有食材生成",
    ingredients: recipe.ingredients,
    seasonings: recipe.seasonings,
    steps: recipe.steps,
  };
}

const AI_CALL_TIMEOUT_MS = 110_000;
const AI_MAX_ATTEMPTS = 1;

// Aliyun DashScope (this account's MaaS deployment) has been observed to take a long time to
// respond rather than erroring quickly, so retries don't help - just give the single call room.
async function callAiForRecipes(promptText: string): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= AI_MAX_ATTEMPTS; attempt++) {
    try {
      return await generateWithAliyun(
        [
          {
            role: "system",
            content: [{ text: "你是一个菜谱推荐助手。只返回 JSON 数组，不要包含任何解释文字或 Markdown 代码块标记。" }],
          },
          { role: "user", content: [{ text: promptText }] },
        ],
        { model: "qwen3.8-max", timeoutMs: AI_CALL_TIMEOUT_MS },
      );
    } catch (error) {
      lastError = error;
      console.error(`Aliyun recipe generation attempt ${attempt}/${AI_MAX_ATTEMPTS} failed`, error);
    }
  }
  throw lastError;
}

// One recipe per AI call; failures are swallowed so one bad call doesn't sink the others.
async function generateSingleRecipeWithAi(promptText: string): Promise<RecipeDto | null> {
  try {
    const raw = await callAiForRecipes(promptText);
    const [recipe] = parseAiRecipes(raw);
    return recipe ? toAiDto(recipe) : null;
  } catch (error) {
    console.error("generateSingleRecipeWithAi: giving up", error);
    return null;
  }
}

// Fills any spots not covered by the user's favorited recipes by asking Aliyun DashScope
// to generate new recipe ideas from the user's current fridge contents and preferences.
// Each recipe is requested in its own concurrent AI call rather than one batched call.
async function generateRecipesWithAi(
  submission: FindRecipesSubmission,
  count: number,
): Promise<RecipeDto[]> {
  if (count <= 0) return [];

  const [ingredients, memberDietaryInfo] = await Promise.all([
    listIngredients(submission.userId),
    collectMemberDietaryInfo(submission.userId, submission.memberIds),
  ]);
  const promptText = buildAiRecipePrompt({
    ingredientNames: [...new Set(ingredients.map((ingredient) => ingredient.name))],
    timePreference: submission.timePreference,
    tastePreference: submission.tastePreference,
    dietaryExclusions: submission.dietaryExclusions,
    memberDietaryExclusions: memberDietaryInfo.dietaryExclusions,
    allergens: memberDietaryInfo.allergens,
  });

  const results = await Promise.all(
    Array.from({ length: count }, () => generateSingleRecipeWithAi(promptText)),
  );
  return results.filter((recipe): recipe is RecipeDto => recipe !== null);
}

// Returns the user's favorited recipes that match the current request, topped up with
// AI-generated recipes (via generateRecipesWithAi) until MAX_RESULTS recipes are found.
export async function search(submission: FindRecipesSubmission): Promise<RecipeDto[]> {
  let remaining = MAX_RESULTS;
  let favoriteRecipes: RecipeDto[] = [];

  if (submission.preferLikedRecipes) {
    const matchingIds = await findMatchingFavoriteRecipeIds(
      submission.userId,
      parseTimeRange(submission.timePreference),
    );
    const recipes = matchingIds.length ? await Promise.all(matchingIds.map((id) => getRecipeById(id))) : [];
    const validRecipes = recipes.filter((recipe): recipe is Recipe => recipe !== null);
    const [seasoningsByRecipe, stepsByRecipe] = await Promise.all([
      Promise.all(validRecipes.map((recipe) => listRecipeSeasonings(recipe.id))),
      Promise.all(validRecipes.map((recipe) => listRecipeSteps(recipe.id))),
    ]);
    favoriteRecipes = validRecipes.map((recipe, index) =>
      toDto(
        recipe,
        "已收藏 · 现有食材可以直接做",
        seasoningsByRecipe[index].map((seasoning) => ({ name: seasoning.name, quantity: seasoning.quantity ?? "" })),
        stepsByRecipe[index].map((step) => ({ title: step.title, detailedInstructions: step.detailedInstructions, time: step.time })),
      ),
    );
    remaining -= favoriteRecipes.length;
  }

  const generatedRecipes = remaining > 0 ? await generateRecipesWithAi(submission, remaining) : [];
  return [...favoriteRecipes, ...generatedRecipes];
}
