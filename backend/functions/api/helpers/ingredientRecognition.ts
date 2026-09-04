import { AppError } from "../../../shared/errors/AppError";
import type {
  RecognizedIngredientCandidate,
  RecognizeIngredientsResponse,
} from "../contracts";
import {
  generate,
  type AliyunMessage,
  type AliyunGenerationOptions,
} from "./aliyunHelper";

const INGREDIENT_RECOGNITION_MODEL = "qwen3-vl-flash";
const INGREDIENT_RECOGNITION_TIMEOUT_MS = 60_000;

const recognitionPrompt = `识别图片中真实可见、可以用于做饭的食材。

规则：
- 主动、完整地检查图片中的所有区域和所有可用于烹饪的食材，不要只关注水果和蔬菜。
- 识别范围包括但不限于：蔬菜、水果、猪肉、牛肉、羊肉、鸡肉、鸭肉等禽肉、鱼、虾、蟹、贝类等海鲜、鸡蛋、豆腐及豆制品、牛奶、酸奶等乳制品、火腿、香肠等加工肉制品、面条、饺子等可直接用于烹饪的食品，以及明确可判断内容物的包装食材。
- 不要把锅、碗、冰箱、包装盒、托盘、保鲜盒、塑料袋等容器或包装本身识别成食材。
- 如果包装、托盘、保鲜盒或塑料袋中明显装有可识别食材，必须识别其中的食材；不要因为食材处于包装或容器中就忽略。例如：托盘中的鸡胸肉识别为鸡胸肉，保鲜盒中的猪肉识别为猪肉，塑料袋中的鱼识别为鱼，一盒鸡蛋识别为鸡蛋，一盒豆腐识别为豆腐。
- 不确定是什么时不要猜。
- 不根据常识补充图片中不存在的食材。
- 禁止根据常识推断图片中不可见的食材。
- 相同食材合并成一项。
- name 使用自然中文名称。
- normalizedName 使用标准、简洁的中文食材名称。
- quantity 和 unit 必须根据图片中用户实际拥有的呈现形态判断，禁止把所有食材统一使用“个”。
- unit 只能从以下集合中选择：个、颗、根、块、盒、袋、瓶、把、条、片、罐、g、kg、ml、L。禁止生成集合之外的新单位。
- 明确为包装形式时按包装计数：一盒为 quantity 1、unit "盒"，两盒为 quantity 2、unit "盒"；一袋为 1、"袋"；一瓶为 1、"瓶"；一罐为 1、"罐"。
- 明确为独立食材时，根据食材实际包装或形态选择上述集合中的单位，例如：3 个番茄为 3、"个"；2 根黄瓜为 2、"根"；4 个鸡蛋为 4、"个"；1 条鱼为 1、"条"。
- 明确是肉块、鱼片等且数量可数时，根据实际视觉形态使用 "块"、"片"、"条" 等合适单位。
- 无法可靠判断数量时，quantity 必须为 null，unit 也必须为 null；禁止 quantity 为 null 但 unit 不为 null。
- 禁止根据包装标注的重量推算数量，不推测重量。
- 禁止推测重量、保质期、新鲜度。
- 没识别到食材时返回空 items。

只返回 JSON，不要返回解释文字。以下示例仅用于说明 JSON 格式和单位选择方式，不得照搬示例中的食材内容或单位：
{
  "items": [
    {
      "name": "番茄",
      "normalizedName": "番茄",
      "quantity": 3,
      "unit": "个"
    },
    {
      "name": "鸡胸肉",
      "normalizedName": "鸡胸肉",
      "quantity": 1,
      "unit": "盒"
    },
    {
      "name": "牛奶",
      "normalizedName": "牛奶",
      "quantity": 1,
      "unit": "瓶"
    }
  ]
}`;

type Generate = (
  messages: AliyunMessage[],
  options?: AliyunGenerationOptions,
) => Promise<string>;

function invalidResponse(): never {
  throw new AppError(
    "INVALID_INGREDIENT_RECOGNITION_RESPONSE",
    "Ingredient recognition returned an invalid response",
    502,
  );
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function parseCandidate(value: unknown): RecognizedIngredientCandidate {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return invalidResponse();
  }

  const item = value as Record<string, unknown>;
  if (
    typeof item.name !== "string" ||
    item.name.trim().length === 0 ||
    !Object.prototype.hasOwnProperty.call(item, "normalizedName") ||
    !isNullableString(item.normalizedName) ||
    !Object.prototype.hasOwnProperty.call(item, "quantity") ||
    (item.quantity !== null &&
      (typeof item.quantity !== "number" ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0)) ||
    !Object.prototype.hasOwnProperty.call(item, "unit") ||
    !isNullableString(item.unit)
  ) {
    return invalidResponse();
  }

  return {
    name: item.name,
    normalizedName: item.normalizedName,
    quantity: item.quantity,
    unit: item.unit,
  };
}

export function parseIngredientRecognitionResponse(raw: string): RecognizeIngredientsResponse {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return invalidResponse();
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return invalidResponse();
  }
  const result = parsed as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(result, "items") || !Array.isArray(result.items)) {
    return invalidResponse();
  }

  return { items: result.items.map(parseCandidate) };
}

export async function recognizeIngredientImage(
  content: Buffer,
  mimeType: string,
  generateResponse: Generate = generate,
): Promise<RecognizeIngredientsResponse> {
  const image = `data:${mimeType};base64,${content.toString("base64")}`;
  const raw = await generateResponse(
    [{ role: "user", content: [{ image }, { text: recognitionPrompt }] }],
    { model: INGREDIENT_RECOGNITION_MODEL, timeoutMs: INGREDIENT_RECOGNITION_TIMEOUT_MS },
  );
  return parseIngredientRecognitionResponse(raw);
}
