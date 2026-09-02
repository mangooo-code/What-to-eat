import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../../../shared/errors/AppError";
import {
  parseIngredientRecognitionResponse,
  recognizeIngredientImage,
} from "./ingredientRecognition";

const validItem = {
  name: "番茄",
  normalizedName: "番茄",
  quantity: 2,
  unit: "个",
};

test("parses normal AI JSON", () => {
  assert.deepEqual(
    parseIngredientRecognitionResponse(JSON.stringify({ items: [validItem] })),
    { items: [validItem] },
  );
});

test("parses a Markdown JSON code fence", () => {
  const raw = `\`\`\`json\n${JSON.stringify({ items: [validItem] })}\n\`\`\``;
  assert.deepEqual(parseIngredientRecognitionResponse(raw), { items: [validItem] });
});

test("allows empty items", () => {
  assert.deepEqual(parseIngredientRecognitionResponse('{"items":[]}'), { items: [] });
});

test("allows quantity and unit to be null", () => {
  const item = { ...validItem, quantity: null, unit: null };
  assert.deepEqual(parseIngredientRecognitionResponse(JSON.stringify({ items: [item] })), {
    items: [item],
  });
});

test("rejects invalid JSON", () => {
  assert.throws(
    () => parseIngredientRecognitionResponse("not json"),
    (error) => error instanceof AppError && error.code === "INVALID_INGREDIENT_RECOGNITION_RESPONSE",
  );
});

test("rejects invalid field types and string quantities", () => {
  assert.throws(
    () => parseIngredientRecognitionResponse(JSON.stringify({ items: [{ ...validItem, quantity: "2" }] })),
    (error) => error instanceof AppError && error.code === "INVALID_INGREDIENT_RECOGNITION_RESPONSE",
  );
  assert.throws(
    () => parseIngredientRecognitionResponse(JSON.stringify({ items: [{ ...validItem, normalizedName: 1 }] })),
    (error) => error instanceof AppError && error.code === "INVALID_INGREDIENT_RECOGNITION_RESPONSE",
  );
});

test("rejects quantities less than or equal to zero", () => {
  for (const quantity of [0, -1]) {
    assert.throws(
      () => parseIngredientRecognitionResponse(JSON.stringify({ items: [{ ...validItem, quantity }] })),
      (error) => error instanceof AppError && error.code === "INVALID_INGREDIENT_RECOGNITION_RESPONSE",
    );
  }
});

test("propagates generate errors without a Mock fallback", async () => {
  const expected = new AppError("ALIYUN_REQUEST_FAILED", "failed", 502);
  await assert.rejects(
    recognizeIngredientImage(Buffer.from("image"), "image/jpeg", async () => {
      throw expected;
    }),
    (error) => error === expected,
  );
});

test("sends a data URL and the dedicated model without a system message", async () => {
  let capturedMessages: unknown;
  let capturedOptions: unknown;
  await recognizeIngredientImage(Buffer.from([0xff, 0xd8]), "image/jpeg", async (messages, options) => {
    capturedMessages = messages;
    capturedOptions = options;
    return '{"items":[]}';
  });

  assert.deepEqual(capturedOptions, { model: "qwen3-vl-flash", timeoutMs: 60_000 });
  assert.equal(Array.isArray(capturedMessages), true);
  const messages = capturedMessages as Array<{ role: string; content: Array<Record<string, string>> }>;
  assert.equal(messages.length, 1);
  assert.equal(messages[0]?.role, "user");
  assert.equal(messages[0]?.content[0]?.image, "data:image/jpeg;base64,/9g=");
  assert.equal(typeof messages[0]?.content[1]?.text, "string");
});

test("prompt covers meat, seafood, packaged ingredients, and quantity-unit rules", async () => {
  let prompt = "";
  await recognizeIngredientImage(Buffer.from("image"), "image/png", async (messages) => {
    prompt = messages[0]?.content.find((part) => part.text)?.text ?? "";
    return '{"items":[]}';
  });

  assert.match(prompt, /猪肉、牛肉、羊肉/);
  assert.match(prompt, /鸡肉、鸭肉/);
  assert.match(prompt, /鱼、虾、蟹、贝类等海鲜/);
  assert.match(prompt, /包装、托盘、保鲜盒或塑料袋中明显装有可识别食材，必须识别其中的食材/);
  assert.match(prompt, /不要因为食材处于包装或容器中就忽略/);
  for (const unit of ["盒", "袋", "瓶", "个", "根", "条"]) {
    assert.match(prompt, new RegExp(`"${unit}"`));
  }
  assert.match(prompt, /无法可靠判断数量时，quantity 必须为 null，unit 也必须为 null/);
  assert.match(prompt, /禁止把所有食材统一使用“个”/);
  assert.match(prompt, /示例仅用于说明 JSON 格式和单位选择方式，不得照搬/);
});
