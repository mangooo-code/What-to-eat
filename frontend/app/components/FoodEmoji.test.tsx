import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FoodEmoji } from "./FoodEmoji";

describe("FoodEmoji", () => {
  it.each([
    ["西红柿", "🍅"], ["马铃薯", "🥔"], ["菠菜", "🥬"], ["鸡胸肉", "🍗"],
    ["五花肉", "🥩"], ["螃蟹", "🦀"], ["豆腐", "◻️"], ["饺子", "🥟"],
  ])("uses the specific mapping for %s", (name, emoji) => {
    render(<FoodEmoji name={name} />);
    expect(screen.getByRole("img", { name })).toHaveTextContent(emoji);
  });

  it.each([
    ["有机小白菜", "🥬"], ["新鲜山药段", "🥔"], ["混合菌菇", "🍄"],
    ["进口水果拼盘", "🍎"], ["去骨鸭腿肉", "🍗"], ["深海鱼片", "🐟"],
    ["冷冻海鲜组合", "🦐"], ["鹌鹑蛋", "🥚"], ["低脂酸奶", "🥛"],
    ["猪肉馅", "🥩"], ["杂粮米饭", "🍚"], ["手工面食", "🍜"],
  ])("uses a category fallback for %s", (name, emoji) => {
    render(<FoodEmoji name={name} />);
    expect(screen.getByRole("img", { name })).toHaveTextContent(emoji);
  });

  it("keeps the existing generic fallback for an unknown ingredient", () => {
    render(<FoodEmoji name="神秘食材" />);
    expect(screen.getByRole("img", { name: "神秘食材" })).toHaveTextContent("🍽️");
  });

  it.each([
    ["白玉菇", "🍄"],
    ["豆芽", "🌱"],
    ["青豆", "🫛"],
    ["鸭蛋", "🥚"],
    ["蟹味菇", "🍄"],
    ["鸡蛋面", "🍜"],
    ["鸡蛋面条", "🍜"],
    ["牛奶面包", "🍞"],
  ])("resolves overlapping keywords for %s", (name, emoji) => {
    render(<FoodEmoji name={name} />);
    expect(screen.getByRole("img", { name })).toHaveTextContent(emoji);
  });

  it.each([
    ["娃娃菜", "🥬"], ["芦笋", "🥬"], ["紫甘蓝", "🥬"],
    ["南瓜", "🎃"], ["紫薯", "🍠"], ["白萝卜", "🥕"],
    ["鸡腿菇", "🍄"], ["银耳", "🍄"],
    ["绿豆芽", "🌱"], ["毛豆", "🫛"], ["油豆腐", "◻️"],
    ["猪蹄", "🥩"], ["牛腩", "🥩"], ["午餐肉", "🌭"],
    ["鳕鱼", "🐟"], ["虾仁", "🦐"], ["蛏子", "🦪"],
    ["鹅蛋", "🥚"], ["黄油", "🧈"], ["奶酪", "🧀"],
    ["燕麦", "🥣"], ["米粉", "🍜"], ["馄饨", "🥟"], ["玉米面", "🌾"],
    ["牛油果", "🥑"], ["蓝莓", "🫐"], ["樱桃", "🍒"], ["猕猴桃", "🥝"],
    ["芒果", "🥭"], ["菠萝", "🍍"], ["椰子", "🥥"],
    ["海带", "🥬"], ["魔芋", "◻️"],
  ])("follows the explicit mapping for %s", (name, emoji) => {
    render(<FoodEmoji name={name} />);
    expect(screen.getByRole("img", { name })).toHaveTextContent(emoji);
  });

  it("covers the common ingredient audit set without using the generic fallback", () => {
    const commonIngredients = [
      "白玉菇", "金针菇", "杏鲍菇", "平菇", "口蘑", "茶树菇", "蟹味菇", "木耳",
      "豆芽", "绿豆芽", "黄豆芽", "青豆", "黄豆", "绿豆", "豌豆", "毛豆", "豆角", "四季豆", "腐竹", "豆皮", "千张", "豆干", "豆腐",
      "菠菜", "生菜", "白菜", "小白菜", "油麦菜", "菜心", "空心菜", "苋菜", "芥蓝", "茼蒿", "韭菜", "香菜",
      "番茄", "黄瓜", "冬瓜", "南瓜", "丝瓜", "苦瓜", "西葫芦", "茄子", "青椒", "西兰花", "花菜", "芹菜",
      "土豆", "红薯", "山药", "芋头", "白萝卜", "胡萝卜", "莲藕", "荸荠",
      "大葱", "小葱", "葱", "生姜", "姜", "大蒜", "蒜苗", "蒜薹",
      "猪肉", "五花肉", "猪里脊", "排骨", "牛肉", "羊肉", "鸡肉", "鸡胸肉", "鸡翅", "鸭肉", "鹅肉",
      "鱼", "鲈鱼", "带鱼", "三文鱼", "虾", "基围虾", "螃蟹", "花蛤", "扇贝", "生蚝", "鱿鱼", "章鱼",
      "鸡蛋", "鸭蛋", "鹌鹑蛋", "牛奶", "酸奶", "奶酪", "芝士", "黄油", "奶油",
      "大米", "米饭", "小米", "糯米", "面条", "挂面", "意面", "面粉", "面包", "吐司", "馒头", "包子", "饺子", "年糕",
    ];
    render(<>{commonIngredients.map((name) => <FoodEmoji key={name} name={name} />)}</>);
    for (const name of commonIngredients) {
      expect(screen.getByRole("img", { name })).not.toHaveTextContent("🍽️");
    }
  });

  it.each([
    ["鸡油菌", "🍄"],
    ["黑豆", "🫛"],
    ["嫩芽菜", "🌱"],
    ["多宝鱼", "🐟"],
    ["小龙虾", "🦐"],
    ["青蟹", "🦀"],
    ["蛤蜊", "🦪"],
    ["墨鱼", "🦑"],
    ["皮蛋", "🥚"],
    ["羽衣甘蓝", "🥬"],
    ["节瓜", "🥒"],
    ["牛蒡", "🥔"],
    ["鹿肉", "🥩"],
    ["火鸡肉", "🍗"],
    ["干酪", "🧀"],
    ["荞麦", "🌾"],
    ["山竹", "🍎"],
    ["核桃", "🥜"],
    ["裙带菜", "🥬"],
    ["素鸡", "◻️"],
  ])("uses the category fallback for an unlisted %s", (name, emoji) => {
    render(<FoodEmoji name={name} />);
    expect(screen.getByRole("img", { name })).toHaveTextContent(emoji);
  });
});
