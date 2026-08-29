"use client";
import { useEffect, useMemo, useState } from "react";

type Page =
  | "login"
  | "home"
  | "fridge"
  | "edit"
  | "capture"
  | "recognize"
  | "confirm"
  | "needs"
  | "member"
  | "recommend-loading"
  | "recommend"
  | "recipe"
  | "cook"
  | "feedback"
  | "profile"
  | "diet"
  | "recipes";
type Food = {
  name: string;
  qty: number | string;
  unit: string;
  place: string;
  days: number;
};
type ProfileData = {
  taste: string;
  diet: string;
  limits: string[];
  allergens: string[];
};
const initialFoods: Food[] = [
  { name: "番茄", qty: 2, unit: "个", place: "冷藏", days: 3 },
  { name: "鸡蛋", qty: 6, unit: "个", place: "冷藏", days: 10 },
  { name: "嫩豆腐", qty: 1, unit: "盒", place: "冷藏", days: 2 },
  { name: "青椒", qty: 3, unit: "个", place: "冷藏", days: 4 },
  { name: "猪里脊", qty: 300, unit: "g", place: "冷冻", days: 15 },
  { name: "牛奶", qty: 1, unit: "盒", place: "冷藏", days: 2 },
];
const units = ["个", "颗", "根", "块", "盒", "袋", "瓶", "g", "kg", "ml", "L"];
const limits = [
  "不吃辣",
  "不吃香菜",
  "不吃葱",
  "不吃动物内脏",
  "不吃羊肉",
  "不吃海鲜",
];
const recipesA = [
  [
    "番茄炒蛋",
    "15 分钟",
    "简单",
    "主要食材全部已有",
    "番茄和鸡蛋家里都有，不需要额外购买主要食材，15 分钟左右就能做好，很适合今天快速做一顿家常菜。",
  ],
  [
    "青椒肉丝",
    "25 分钟",
    "简单",
    "已有 2 / 3 种主要食材 · 缺少蒜苗",
    "青椒和猪里脊都可以直接用，只需要补充一种主要食材，制作时间也符合当前需求。",
  ],
  [
    "家常豆腐煲",
    "30 分钟",
    "中等",
    "已有 1 / 2 种主要食材 · 缺少香菇",
    "嫩豆腐可以直接使用，只需要补充香菇，整体食材简单，适合这一顿想吃家常口味的需求。",
  ],
];
const recipesB = [
  [
    "可乐鸡翅",
    "30 分钟",
    "简单",
    "缺少 2 种主要食材",
    "换一批后的固定推荐结果。",
  ],
  [
    "肉末豆腐",
    "25 分钟",
    "简单",
    "已有 1 / 2 种主要食材",
    "换一批后的固定推荐结果。",
  ],
  [
    "青椒煎蛋",
    "15 分钟",
    "简单",
    "主要食材全部已有",
    "换一批后的固定推荐结果。",
  ],
];
const steps = [
  ["第 1 步｜准备食材", "番茄切成小块。鸡蛋打入碗中，加少量盐搅匀。", "3 分钟"],
  [
    "第 2 步｜炒鸡蛋",
    "锅中加入食用油，油热后倒入鸡蛋，快速翻炒至刚刚凝固，然后盛出备用。",
    "3 分钟",
  ],
  [
    "第 3 步｜炒番茄",
    "锅中加入少量食用油，倒入番茄，中火翻炒至变软出汁，再加入少量盐和白糖。",
    "5 分钟",
  ],
  [
    "第 4 步｜混合调味",
    "将炒好的鸡蛋倒回锅中，与番茄翻炒均匀，让汤汁均匀裹住鸡蛋后即可出锅。",
    "2 分钟",
  ],
];

function Placeholder({
  kind = "image",
  wide = false,
}: {
  kind?: "image" | "icon";
  wide?: boolean;
}) {
  return (
    <span className={`${kind}-placeholder ${wide ? "wide" : ""}`}>
      {kind === "image" ? "图片占位" : "图标占位"}
    </span>
  );
}
function Header({
  title,
  sub,
  back,
}: {
  title: string;
  sub?: string;
  back?: () => void;
}) {
  return (
    <header className="page-header">
      {back && (
        <button className="back" onClick={back}>
          ‹ 返回
        </button>
      )}
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
    </header>
  );
}
function Choice({
  label,
  selected,
  onClick,
  help,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  help?: string;
}) {
  return (
    <button
      className={`choice ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <Placeholder kind="icon" />
      <span>
        <strong>{label}</strong>
        {help && <small>{help}</small>}
      </span>
    </button>
  );
}
function Field({
  food,
  onChange,
}: {
  food: Food;
  onChange: (f: Food) => void;
}) {
  return (
    <div className="food-form">
      <label>
        食材名称
        <input
          value={food.name}
          onChange={(e) => onChange({ ...food, name: e.target.value })}
        />
      </label>
      <label>
        数量
        <input
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={food.qty}
          onChange={(e) =>
            onChange({
              ...food,
              qty: Math.max(0, Math.floor(Number(e.target.value) || 0)),
            })
          }
        />
      </label>
      <label>
        单位
        <select
          value={food.unit}
          onChange={(e) => onChange({ ...food, unit: e.target.value })}
        >
          {units.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      <label>
        存放位置
        <select
          value={food.place}
          onChange={(e) => onChange({ ...food, place: e.target.value })}
        >
          {["冷藏", "冷冻", "常温"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      <label>
        几天后过期
        <span className="suffix">
          <input
            type="number"
            step="1"
            inputMode="numeric"
            value={food.days}
            onChange={(e) =>
              onChange({
                ...food,
                days: Math.floor(Number(e.target.value) || 0),
              })
            }
          />
          <b>天</b>
        </span>
      </label>
    </div>
  );
}

function ExpiryTag({ days }: { days: number }) {
  const state =
    days < 0
      ? ["已过期", "expired"]
      : days === 0
        ? ["今日到期", "urgent"]
        : days <= 3
          ? ["即将过期", "urgent"]
          : ["正常", "normal"];
  return <span className={`expiry ${state[1]}`}>{state[0]}</span>;
}

export default function App() {
  const [page, setPage] = useState<Page>("login"),
    [countryCode, setCountryCode] = useState("+86"),
    [phone, setPhone] = useState(""),
    [password, setPassword] = useState(""),
    [showPassword, setShowPassword] = useState(false),
    [agreed, setAgreed] = useState(false),
    [loginError, setLoginError] = useState(""),
    [legal, setLegal] = useState(""),
    [foods, setFoods] = useState(initialFoods),
    [editIndex, setEditIndex] = useState(0),
    [confirmEdit, setConfirmEdit] = useState<number | null>(null),
    [foodModal, setFoodModal] = useState<"summary" | "edit" | "add" | null>(
      null,
    ),
    [newFood, setNewFood] = useState<Food>({
      name: "",
      qty: 1,
      unit: "个",
      place: "冷藏",
      days: 3,
    }),
    [fridgePlace, setFridgePlace] = useState("冷藏"),
    [fridgePage, setFridgePage] = useState(0),
    [toast, setToast] = useState(""),
    [dialog, setDialog] = useState(""),
    [captureTab, setCaptureTab] = useState<"camera" | "album" | "voice">(
      "camera",
    ),
    [photos, setPhotos] = useState({ camera: 0, album: 0 }),
    [listening, setListening] = useState(false),
    [input, setInput] = useState(""),
    [time, setTime] = useState(""),
    [taste, setTaste] = useState("按平时口味"),
    [people, setPeople] = useState(["我", "阳", "妈妈"]),
    [members, setMembers] = useState(["我"]),
    [profileData, setProfileData] = useState<Record<string, ProfileData>>({
      我: { taste: "家常", diet: "低脂", limits: [], allergens: [] },
      阳: {
        taste: "香辣",
        diet: "高蛋白",
        limits: ["不吃香菜"],
        allergens: [],
      },
      妈妈: {
        taste: "清淡",
        diet: "低脂",
        limits: ["不吃辣"],
        allergens: ["海鲜"],
      },
    }),
    [profileName, setProfileName] = useState("我"),
    [draftProfileName, setDraftProfileName] = useState("我"),
    [draftTaste, setDraftTaste] = useState(""),
    [draftDiet, setDraftDiet] = useState(""),
    [draftLimits, setDraftLimits] = useState<string[]>([]),
    [draftAllergens, setDraftAllergens] = useState<string[]>([]),
    [memberOpen, setMemberOpen] = useState(false),
    [memberMode, setMemberMode] = useState<"add" | "edit">("add"),
    [memberFrom, setMemberFrom] = useState<"needs" | "profile">("needs"),
    [newMemberName, setNewMemberName] = useState(""),
    [relation, setRelation] = useState(""),
    [chosenLimits, setChosenLimits] = useState<string[]>([]),
    [prefer, setPrefer] = useState(false),
    [other, setOther] = useState(false),
    [otherLimit, setOtherLimit] = useState(""),
    [batch, setBatch] = useState(0),
    [liked, setLiked] = useState(false),
    [likedRecipes, setLikedRecipes] = useState<string[]>([]),
    [recipeTab, setRecipeTab] = useState<"done" | "liked">("done"),
    [recipeOrigin, setRecipeOrigin] = useState<"recommend" | "done" | "liked">(
      "recommend",
    ),
    [consumeOpen, setConsumeOpen] = useState(false),
    [mealReaction, setMealReaction] = useState(""),
    [needError, setNeedError] = useState(false),
    [success, setSuccess] = useState(false);
  const missing = time ? 0 : 1;
  const go = (p: Page) => {
    setPage(p);
    window.scrollTo(0, 0);
  };
  const say = (s: string) => {
    setToast(s);
    setTimeout(() => setToast(""), 1800);
  };
  useEffect(() => {
    if (page === "recognize") {
      const t = setTimeout(() => go("confirm"), 2000);
      return () => clearTimeout(t);
    }
    if (page === "recommend-loading") {
      const t = setTimeout(() => go("recommend"), 4200);
      return () => clearTimeout(t);
    }
  }, [page]);
  useEffect(() => {
    const expires = Number(localStorage.getItem("wte_login_expires") || 0);
    if (expires > Date.now()) setPage("home");
    else localStorage.removeItem("wte_login_expires");
  }, []);
  const nav = (
    <nav className="bottom-nav">
      <button
        className={page === "fridge" ? "active" : ""}
        onClick={() => go("fridge")}
      >
        <Placeholder kind="icon" />
        冰箱
      </button>
      <button
        className={page === "home" ? "active" : ""}
        onClick={() => go("home")}
      >
        <Placeholder kind="icon" />
        今天吃什么
      </button>
      <button
        className={page === "profile" ? "active" : ""}
        onClick={() => go("profile")}
      >
        <Placeholder kind="icon" />
        我的
      </button>
    </nav>
  );
  const saveMember = () => {
    const name = newMemberName.trim();
    if (!name || !relation) return;
    if (memberMode === "edit") {
      setPeople((a) => a.map((x) => (x === profileName ? name : x)));
      setMembers((a) => a.map((x) => (x === profileName ? name : x)));
    } else {
      setPeople((a) => (a.includes(name) ? a : [...a, name]));
      if (memberFrom === "needs")
        setMembers((a) => (a.includes(name) ? a : [...a, name]));
    }
    setNewMemberName("");
    setRelation("");
    setMemberOpen(false);
    say("成员档案已保存");
  };
  const openMember = (from: "needs" | "profile") => {
    setMemberMode("add");
    setMemberFrom(from);
    setNewMemberName("");
    setRelation("");
    setMemberOpen(true);
  };
  const editMember = (name: string, index: number) => {
    setMemberMode("edit");
    setMemberFrom("profile");
    setProfileName(name);
    setNewMemberName(name);
    setRelation(index === 0 ? "主用户" : index === 1 ? "伴侣" : "家人");
    setMemberOpen(true);
  };
  const openRecipes = (tab: "done" | "liked") => {
    setRecipeTab(tab);
    setPage("recipes");
    window.scrollTo(0, 0);
  };
  const openDiet = (name: string) => {
    const d = profileData[name] || {
      taste: "",
      diet: "",
      limits: [],
      allergens: [],
    };
    setProfileName(name);
    setDraftProfileName(name);
    setDraftTaste(d.taste);
    setDraftDiet(d.diet);
    setDraftLimits(d.limits);
    setDraftAllergens(d.allergens);
    go("diet");
  };
  const logout = () => {
    localStorage.removeItem("wte_login_expires");
    setDialog("");
    setPage("login");
  };
  const shell = (content: React.ReactNode, withNav = false) => (
    <main className="app-shell">
      <section className="page">{content}</section>
      {withNav && nav}
      {toast && <div className="toast">{toast}</div>}
      {legal && (
        <div className="overlay">
          <div className="dialog">
            <button className="modal-close" onClick={() => setLegal("")}>
              ×
            </button>
            <h2>{legal}</h2>
            <p>这里是「{legal}」的低保真内容占位。</p>
          </div>
        </div>
      )}
      {memberOpen && (
        <div className="overlay">
          <div className="member-modal">
            <div className="member-modal-head">
              <h2>
                {memberMode === "edit" ? "修改成员档案" : "添加一起吃饭的人"}
              </h2>
              <button
                className="modal-close"
                onClick={() => setMemberOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="member-modal-body">
              <div className="member-basic">
                <label className="label">
                  姓名 / 昵称
                  <input
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="输入姓名或昵称"
                  />
                </label>
                <label className="label">
                  关系
                  <select
                    value={relation}
                    onChange={(e) => setRelation(e.target.value)}
                  >
                    <option value="">请选择关系</option>
                    {["伴侣", "家人", "朋友", "其他"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
              </div>
              <ProfileForm />
            </div>
            <div className="modal-edit-actions">
              <button onClick={() => setMemberOpen(false)}>取消</button>
              <button
                className="primary"
                disabled={!newMemberName.trim() || !relation}
                onClick={saveMember}
              >
                保存档案
              </button>
            </div>
          </div>
        </div>
      )}
      {dialog && (
        <div className="overlay">
          <div className="dialog">
            <h2>{dialog}</h2>
            <p>
              {dialog.includes("退出")
                ? "退出后将返回登录页，不会删除冰箱、档案和菜谱数据。"
                : dialog.includes("删除")
                  ? "删除后，这项食材不会再参与菜谱推荐。"
                  : dialog.includes("结束")
                    ? "结束后不会更新冰箱库存，也不会生成本次制作记录。"
                    : "请确认本次操作。"}
            </p>
            <div className="actions">
              <button onClick={() => setDialog("")}>取消</button>
              <button
                className="danger"
                onClick={() => {
                  if (dialog.includes("退出")) logout();
                  else {
                    if (dialog.includes("删除")) {
                      setFoods((f) => f.filter((_, i) => i !== editIndex));
                      go("fridge");
                    }
                    if (dialog.includes("结束")) go("home");
                    setDialog("");
                  }
                }}
              >
                {dialog.includes("退出")
                  ? "确认退出"
                  : dialog.includes("结束")
                    ? "结束制作"
                    : "删除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );

  if (page === "login") {
    const enabled = phone.trim() && password && agreed;
    const submit = () => {
      if (
        countryCode === "+86" &&
        phone.trim() === "800800" &&
        password === "123456"
      ) {
        localStorage.setItem(
          "wte_login_expires",
          String(Date.now() + 12 * 60 * 60 * 1000),
        );
        setLoginError("");
        go("home");
      } else setLoginError("账号或密码不正确，请使用测试账号登录");
    };
    return shell(
      <div className="login-page">
        <header>
          <h1>今天吃什么</h1>
        </header>
        <Placeholder wide />
        <p className="login-subtitle">手机号密码登录</p>
        <div className="login-form">
          <label>
            手机号
            <span className="phone-input">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                aria-label="国家或地区区号"
              >
                <option>+86</option>
                <option>+852</option>
                <option>+853</option>
                <option>+886</option>
                <option>+1</option>
              </select>
              <input
                value={phone}
                inputMode="numeric"
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
              />
            </span>
          </label>
          <label>
            密码
            <span className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
              />
              <button onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? "隐藏" : "显示"}
              </button>
            </span>
          </label>
          <div className="test-account">
            <strong>测试账号</strong>
            <span>+86 800800</span>
            <span>密码：123456</span>
          </div>
          {loginError && <p className="login-error">{loginError}</p>}
          <label className="agreement">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              我已阅读并同意
              <button onClick={() => setLegal("用户协议")}>《用户协议》</button>
              和
              <button onClick={() => setLegal("隐私政策")}>《隐私政策》</button>
            </span>
          </label>
          <button className="primary" disabled={!enabled} onClick={submit}>
            登录
          </button>
          <p className="other-login-title">其他登录方式</p>
          <div className="other-login">
            <button
              aria-label="微信登录"
              onClick={() => say("该登录方式暂未开放")}
            >
              <Placeholder kind="icon" />
            </button>
            <button
              aria-label="Apple 登录"
              onClick={() => say("该登录方式暂未开放")}
            >
              <Placeholder kind="icon" />
            </button>
          </div>
        </div>
      </div>,
    );
  }
  if (page === "home")
    return shell(
      <>
        <Header
          title="今天吃什么？"
          sub="看看家里有什么，再帮你挑一道刚刚好的。"
        />
        <section className="home-feature">
          <div className="feature-motion">
            <span>动态大图占位</span>
            <i />
            <i />
            <i />
          </div>
          <div className="feature-copy">
            <strong>今天的一餐，从家里有什么开始。</strong>
            <small>此区域预留给后续动态视觉素材</small>
          </div>
        </section>
        <div className="home-entries">
          <button type="button" onClick={() => go("fridge")}>
            <Placeholder kind="icon" />
            <span>
              <strong>打开冰箱</strong>
              <small>查看和管理家里的食材</small>
            </span>
            <b>›</b>
          </button>
          <button
            type="button"
            className="featured"
            onClick={() =>
              foods.length ? go("needs") : setDialog("冰箱里还没记东西呢")
            }
          >
            <Placeholder kind="icon" />
            <span>
              <strong>帮我决定</strong>
              <small>根据这一顿的需求帮你挑</small>
            </span>
            <b>›</b>
          </button>
          <button type="button" onClick={() => openRecipes("done")}>
            <Placeholder kind="icon" />
            <span>
              <strong>我的菜谱</strong>
              <small>查看做过和喜欢的菜谱</small>
            </span>
            <b>›</b>
          </button>
        </div>
      </>,
      true,
    );
  if (page === "fridge") {
    const all = foods.filter((f) => f.place === fridgePlace),
      totalPages = Math.max(1, Math.ceil(all.length / 20)),
      visible = all.slice(fridgePage * 20, fridgePage * 20 + 20),
      selected = foodModal === "add" ? newFood : foods[editIndex];
    return shell(
      <>
        <Header
          title="家里还有这些"
          sub="冷藏、冷冻和常温分开维护，找起来更清楚。"
        />
        <div className="storage-toolbar">
          <div className="storage-tabs">
            {["冷藏", "冷冻", "常温"].map((place) => (
              <button
                className={fridgePlace === place ? "active" : ""}
                key={place}
                onClick={() => {
                  setFridgePlace(place);
                  setFridgePage(0);
                }}
              >
                <strong>{place}</strong>
                <small>
                  {foods.filter((f) => f.place === place).length} 种
                </small>
              </button>
            ))}
          </div>
          <button className="storage-add" onClick={() => go("capture")}>
            ＋ 添加食材
          </button>
        </div>
        <section className="storage-pane">
          <div className="storage-heading">
            <h2>{fridgePlace}</h2>
          </div>
          {visible.length ? (
            <div className="inventory-grid">
              {visible.map((f) => {
                const i = foods.indexOf(f);
                return (
                  <button
                    className="food-tile"
                    key={`${f.name}-${i}`}
                    onClick={() => {
                      setEditIndex(i);
                      setFoodModal("summary");
                    }}
                  >
                    <Placeholder />
                    <span>
                      <strong>{f.name}</strong>
                      <small>
                        {f.qty} {f.unit}
                      </small>
                    </span>
                    <ExpiryTag days={f.days} />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="empty">这里还没有食材</div>
          )}
          <div className="pagination">
            <button
              aria-label="上一页"
              disabled={fridgePage === 0}
              onClick={() => setFridgePage((x) => x - 1)}
            >
              ‹
            </button>
            <span>
              {fridgePage + 1} / {totalPages}
            </span>
            <button
              aria-label="下一页"
              disabled={fridgePage >= totalPages - 1}
              onClick={() => setFridgePage((x) => x + 1)}
            >
              ›
            </button>
          </div>
        </section>
        <button
          className="fab"
          data-tip="添加一些食材吧～"
          aria-label="添加食材"
          onClick={() => go("capture")}
        >
          ＋
        </button>
        {foodModal && selected && (
          <div className="overlay">
            <div className="food-modal">
              {foodModal === "summary" ? (
                <>
                  <button
                    className="modal-close"
                    onClick={() => setFoodModal(null)}
                  >
                    ×
                  </button>
                  <div className="modal-food-title">
                    <Placeholder />
                    <span>
                      <h2>{selected.name}</h2>
                      <p>存放于：{selected.place}</p>
                    </span>
                  </div>
                  <div className="stock-summary">
                    <span>
                      当前库存量：
                      <b>
                        {selected.qty} {selected.unit}
                      </b>
                    </span>
                    <span>
                      过期状态：
                      <ExpiryTag days={selected.days} />
                    </span>
                  </div>
                  <div className="modal-actions">
                    <button onClick={() => setFoodModal("edit")}>
                      <Placeholder kind="icon" />
                      编辑信息
                    </button>
                    <button
                      onClick={() => {
                        setFoodModal(null);
                        setDialog("删除这项食材？");
                      }}
                    >
                      <Placeholder kind="icon" />
                      移除食材
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2>
                    {foodModal === "add" ? "新增食材信息" : "编辑食材信息"}
                  </h2>
                  <Field
                    food={selected}
                    onChange={(f) =>
                      foodModal === "add"
                        ? setNewFood(f)
                        : setFoods((a) =>
                            a.map((x, i) => (i === editIndex ? f : x)),
                          )
                    }
                  />
                  <div className="modal-edit-actions">
                    <button
                      onClick={() =>
                        setFoodModal(foodModal === "add" ? null : "summary")
                      }
                    >
                      取消
                    </button>
                    <button
                      className="primary"
                      disabled={!selected.name.trim()}
                      onClick={() => {
                        if (foodModal === "add")
                          setFoods((a) => [...a, newFood]);
                        setFoodModal(null);
                        say(foodModal === "add" ? "食材已添加" : "已保存修改");
                      }}
                    >
                      {foodModal === "add" ? "保存" : "保存修改"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </>,
      true,
    );
  }
  if (page === "edit") {
    const food = foods[editIndex];
    if (!food) return shell(null);
    return shell(
      <>
        <Header title="编辑食材" back={() => go("fridge")} />
        <Field
          food={food}
          onChange={(f) =>
            setFoods((a) => a.map((x, i) => (i === editIndex ? f : x)))
          }
        />
        <div className="sticky-actions">
          <button
            className="primary"
            onClick={() => {
              say("已保存修改");
              go("fridge");
            }}
          >
            保存修改
          </button>
          <button
            className="danger-link"
            onClick={() => setDialog("删除这项食材？")}
          >
            删除食材
          </button>
        </div>
      </>,
    );
  }
  if (page === "capture") {
    const photoMode =
        captureTab === "camera" || captureTab === "album" ? captureTab : null,
      count = photoMode ? photos[photoMode] : 0;
    return shell(
      <>
        <Header
          title="家里还有什么？"
          sub="拍张照片最快，也可以直接告诉我。"
          back={() => go("fridge")}
        />
        <div className="tabs capture-tabs">
          <button
            className={captureTab === "camera" ? "active" : ""}
            onClick={() => setCaptureTab("camera")}
          >
            <Placeholder kind="icon" />
            拍一张
          </button>
          <button
            className={captureTab === "album" ? "active" : ""}
            onClick={() => setCaptureTab("album")}
          >
            <Placeholder kind="icon" />
            从相册选
          </button>
          <button
            className={captureTab === "voice" ? "active" : ""}
            onClick={() => setCaptureTab("voice")}
          >
            <Placeholder kind="icon" />
            语音解析
          </button>
        </div>
        {photoMode ? (
          <section className="upload">
            <div className="upload-dropzone">
              <Placeholder kind="icon" />
              <h2>
                {captureTab === "camera"
                  ? "对着冰箱或食材拍一张"
                  : "点击打开手机 / 电脑相册"}
              </h2>
              <p>
                {captureTab === "camera"
                  ? "拍摄冰箱或食材即可"
                  : "支持多选食材照片"}
              </p>
            </div>
            <div className="upload-heading">
              <span>已选择图片</span>
              <p className="upload-count">{count} / 5</p>
            </div>
            {count > 0 && (
              <div className="thumbs">
                {Array.from({ length: count }).map((_, i) => (
                  <span className="upload-thumb" key={i}>
                    <Placeholder />
                    <button
                      aria-label={`删除第 ${i + 1} 张照片`}
                      onClick={() =>
                        setPhotos((a) => ({
                          ...a,
                          [photoMode]: Math.max(0, a[photoMode] - 1),
                        }))
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="upload-actions">
              <button
                className="secondary"
                disabled={count >= 5}
                onClick={() =>
                  setPhotos((a) => ({
                    ...a,
                    [photoMode]: Math.min(5, a[photoMode] + 1),
                  }))
                }
              >
                {count >= 5
                  ? "已达上限"
                  : captureTab === "camera"
                    ? count
                      ? "继续拍照"
                      : "拍照"
                    : "浏览相册照片"}
              </button>
              {count > 0 && (
                <button
                  className="link"
                  onClick={() => setPhotos((a) => ({ ...a, [photoMode]: 0 }))}
                >
                  {captureTab === "camera" ? "清空重拍" : "清空照片"}
                </button>
              )}
            </div>
          </section>
        ) : (
          <section className="voice-parse">
            <button
              className={`voice-trigger ${listening ? "listening" : ""}`}
              onClick={() => {
                if (listening) {
                  setInput("买了西红柿 2 个、鸡蛋 1 盒、牛肉半斤");
                  setListening(false);
                } else setListening(true);
              }}
            >
              <Placeholder kind="icon" />
            </button>
            <h2>{listening ? "正在听……" : "轻点麦克风，口述刚刚买的食材"}</h2>
            <div className="voice-result">
              <strong>语音解析结果：</strong>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="语音结果会显示在这里，也可以直接修改"
              />
              <button
                className="primary"
                disabled={!input}
                onClick={() => go("recognize")}
              >
                <Placeholder kind="icon" />
                确认填入食材
              </button>
            </div>
          </section>
        )}
        {photoMode && (
          <>
            <div className="voice-box">
              <Placeholder kind="icon" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="也可以直接告诉我家里有什么……"
              />
            </div>
            <button className="primary sticky" onClick={() => go("recognize")}>
              开始识别
            </button>
          </>
        )}
      </>,
    );
  }
  if (page === "recognize")
    return shell(
      <div className="center-state">
        <span className="spinner" />
        <h1>我看看都有些什么……</h1>
        <p>稍等一下，很快就好。</p>
      </div>,
    );
  if (page === "confirm") {
    const editing =
      confirmEdit === -1
        ? newFood
        : confirmEdit !== null
          ? foods[confirmEdit]
          : null;
    return shell(
      <>
        <Header
          title="这些食材对吗？"
          sub="我先整理了一遍，有不对的地方可以直接修改。"
          back={() => go("capture")}
        />
        <div className="confirm-list">
          {foods.map((f, i) => (
            <article className="confirm-item" key={`${f.name}${i}`}>
              <Placeholder kind="icon" />
              <span>
                <strong>{f.name || "未命名食材"}</strong>
                <small>
                  {f.qty} {f.unit} · {f.place} · {f.days} 天后过期
                </small>
              </span>
              <button
                className="confirm-edit-button"
                onClick={() => setConfirmEdit(i)}
              >
                修改
              </button>
            </article>
          ))}
        </div>
        <button
          className="add-row"
          onClick={() => {
            setNewFood({
              name: "",
              qty: 1,
              unit: "个",
              place: "冷藏",
              days: 3,
            });
            setConfirmEdit(-1);
          }}
        >
          ＋ 添加食材
        </button>
        <button
          className="primary sticky"
          onClick={() => {
            say("食材已经添加到冰箱");
            go("fridge");
          }}
        >
          确认添加
        </button>
        {editing && (
          <div className="overlay">
            <div className="food-modal">
              <button
                className="modal-close"
                onClick={() => setConfirmEdit(null)}
              >
                ×
              </button>
              <h2>{confirmEdit === -1 ? "新增食材信息" : "编辑食材信息"}</h2>
              <Field
                food={editing}
                onChange={(f) =>
                  confirmEdit === -1
                    ? setNewFood(f)
                    : setFoods((a) =>
                        a.map((x, i) => (i === confirmEdit ? f : x)),
                      )
                }
              />
              <div className="modal-edit-actions">
                <button onClick={() => setConfirmEdit(null)}>取消</button>
                {confirmEdit !== -1 && (
                  <button
                    className="danger-link"
                    onClick={() => {
                      setFoods((a) => a.filter((_, i) => i !== confirmEdit));
                      setConfirmEdit(null);
                    }}
                  >
                    删除
                  </button>
                )}
                <button
                  className="primary"
                  disabled={!editing.name.trim()}
                  onClick={() => {
                    if (confirmEdit === -1) setFoods((a) => [...a, newFood]);
                    setConfirmEdit(null);
                    say(confirmEdit === -1 ? "食材已添加" : "修改已保存");
                  }}
                >
                  {confirmEdit === -1 ? "保存" : "保存修改"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>,
    );
  }
  if (page === "needs")
    return shell(
      <>
        <Header
          title="这一顿想怎么吃？"
          sub="告诉我今天的需求，我来帮你缩小选择范围。"
          back={() => go("home")}
        />
        <div className="needs-layout">
          <section className="need-card">
            <h2>今天有多少时间？</h2>
            <div className="option-grid">
              {["快速解决（15–30 分钟）", "慢慢做饭（30 分钟以上）"].map(
                (x) => (
                  <Choice
                    key={x}
                    label={x}
                    selected={time === x}
                    onClick={() => setTime(x)}
                  />
                ),
              )}
            </div>
          </section>
          <section className="need-card">
            <h2>今天和谁一起吃？</h2>
            <div className="chips member-options">
              {people.map((x) => (
                <button
                  className={members.includes(x) ? "active" : ""}
                  key={x}
                  onClick={() =>
                    setMembers((a) =>
                      a.includes(x) ? a.filter((v) => v !== x) : [...a, x],
                    )
                  }
                >
                  {x}
                </button>
              ))}
              <button onClick={() => openMember("needs")}>＋ 添加成员</button>
            </div>
          </section>
          <section className="need-card">
            <h2>今天想吃什么口味？</h2>
            <div className="chips option-cards icon-options">
              {[
                "按平时口味",
                "重口过瘾",
                "家常下饭",
                "清淡爽口",
                "健康轻食",
              ].map((x) => (
                <button
                  className={taste === x ? "active" : ""}
                  key={x}
                  onClick={() => setTaste(x)}
                >
                  <Placeholder kind="icon" />
                  {x}
                </button>
              ))}
            </div>
          </section>
          <section className="need-card preference-card">
            <label className="toggle-row">
              <span>
                <strong>喜欢的菜谱优先</strong>
                <small>优先考虑之前喜欢过的菜谱</small>
              </span>
              <input
                type="checkbox"
                checked={prefer}
                onChange={(e) => setPrefer(e.target.checked)}
              />
              <i className={`switch ${prefer ? "on" : ""}`}>
                {prefer ? "ON" : "OFF"}
              </i>
            </label>
          </section>
          <section className="need-card full">
            <h2>这顿有什么不吃的？</h2>
            <div className="chips option-cards">
              {[
                ...limits,
                ...chosenLimits.filter((x) => !limits.includes(x)),
              ].map((x) => (
                <button
                  className={chosenLimits.includes(x) ? "active" : ""}
                  key={x}
                  onClick={() =>
                    setChosenLimits((a) =>
                      a.includes(x) ? a.filter((v) => v !== x) : [...a, x],
                    )
                  }
                >
                  {x}
                </button>
              ))}
            </div>
            <button className="link other-limit" onClick={() => setOther(true)}>
              ＋ 添加其他限制
            </button>
            {other && (
              <div className="other-limit-input">
                <input
                  value={otherLimit}
                  onChange={(e) => setOtherLimit(e.target.value)}
                  placeholder="输入这顿不吃的食材或要求"
                />
                <button
                  disabled={!otherLimit.trim()}
                  onClick={() => {
                    const v = otherLimit.trim();
                    setChosenLimits((a) => (a.includes(v) ? a : [...a, v]));
                    setOtherLimit("");
                    setOther(false);
                  }}
                >
                  确认添加
                </button>
              </div>
            )}
          </section>
        </div>
        <div className="sticky-actions">
          {missing > 0 && (
            <p className={needError ? "error" : ""}>
              还有 {missing} 项没有完成
            </p>
          )}
          <button
            className="primary"
            disabled={missing > 0}
            onClick={() =>
              missing ? setNeedError(true) : go("recommend-loading")
            }
          >
            帮我挑一挑
          </button>
        </div>
      </>,
    );
  if (page === "member")
    return shell(
      <>
        <Header title="添加一起吃饭的人" back={() => go("needs")} />
        <label className="label">
          姓名 / 昵称
          <input
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            placeholder="输入姓名或昵称"
          />
        </label>
        <section className="block">
          <h2>关系</h2>
          <div className="chips relation-options">
            {["伴侣", "家人", "朋友", "其他"].map((x) => (
              <button
                className={relation === x ? "active" : ""}
                onClick={() => setRelation(x)}
                key={x}
              >
                {x}
              </button>
            ))}
          </div>
        </section>
        <ProfileForm />
        <button
          className="primary sticky"
          disabled={!newMemberName.trim() || !relation}
          onClick={() => {
            const name = newMemberName.trim();
            setPeople((a) => (a.includes(name) ? a : [...a, name]));
            setMembers((a) => (a.includes(name) ? a : [...a, name]));
            setNewMemberName("");
            setRelation("");
            go("needs");
          }}
        >
          保存
        </button>
      </>,
    );
  if (page === "recommend-loading") {
    const texts = [
      "看看今天适合吃点什么……",
      "正在看看冰箱里有什么",
      "正在避开大家不吃的东西",
      "再挑几道今天做起来刚刚好",
    ];
    return shell(<LoadingSequence texts={texts} />);
  }
  if (page === "recommend") {
    const rs = batch ? recipesB : recipesA;
    return shell(
      <>
        <Header
          title="今天可以吃这些"
          sub="按照家里的食材和你刚才的需求，先挑了 3 道。"
          back={() => go("needs")}
        />
        <div className="recipe-grid">
          {rs.map((r, i) => (
            <article className="recipe-card" key={r[0]}>
              <Placeholder wide />
              <div className="recipe-body">
                <div className="heading">
                  <h2>{r[0]}</h2>
                  <button
                    className="heart"
                    onClick={() =>
                      setLikedRecipes((a) =>
                        a.includes(r[0])
                          ? a.filter((x) => x !== r[0])
                          : [...a, r[0]],
                      )
                    }
                  >
                    {likedRecipes.includes(r[0]) ? "♥ 已喜欢" : "♡ 喜欢"}
                  </button>
                </div>
                <p>
                  {r[1]} ｜ {r[2]}
                </p>
                <div className="tags">
                  <span>家常</span>
                  <span>{i === 2 ? "热乎" : "下饭"}</span>
                </div>
                <strong className="match">{r[3]}</strong>
                <p>{r[4]}</p>
                <button
                  className="secondary"
                  onClick={() => {
                    setRecipeOrigin("recommend");
                    go("recipe");
                  }}
                >
                  查看菜谱
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="bottom-question">
          <p>这几道都不太合适？</p>
          <button
            className="secondary"
            onClick={() => {
              say("再换几道看看……");
              setTimeout(() => setBatch(1), 800);
            }}
          >
            换一批
          </button>
          <button className="link" onClick={() => go("needs")}>
            调整需求
          </button>
        </div>
      </>,
    );
  }
  const recipeBack = () =>
    recipeOrigin === "recommend"
      ? go("recommend")
      : (setRecipeTab(recipeOrigin), go("recipes"));
  if (page === "recipe")
    return shell(
      <>
        <Header title="菜谱详情" back={recipeBack} />
        <Placeholder wide />
        <div className="recipe-title">
          <div>
            <h1>番茄炒蛋</h1>
            <p>15 分钟｜简单 · 家常｜下饭</p>
          </div>
          <button className="heart" onClick={() => setLiked(!liked)}>
            {liked ? "♥ 已喜欢" : "♡ 喜欢"}
          </button>
        </div>
        <section className="block ingredients">
          <h2>准备这些就够了</h2>
          <div className="ingredient-groups">
            <div>
              <h3>家里已有</h3>
              <div className="mini-cards">
                <span>
                  <Placeholder kind="icon" />
                  <em>番茄</em>
                  <b>2 个</b>
                </span>
                <span>
                  <Placeholder kind="icon" />
                  <em>鸡蛋</em>
                  <b>3 个</b>
                </span>
              </div>
            </div>
            <div>
              <h3>需要补充</h3>
              <div className="mini-cards">
                <span>无需补充主要食材</span>
              </div>
            </div>
            <div>
              <h3>调料</h3>
              <div className="mini-cards">
                <span>
                  <Placeholder kind="icon" />
                  <em>盐</em>
                  <b>适量</b>
                </span>
                <span>
                  <Placeholder kind="icon" />
                  <em>食用油</em>
                  <b>适量</b>
                </span>
                <span>
                  <Placeholder kind="icon" />
                  <em>白糖</em>
                  <b>少许</b>
                </span>
              </div>
            </div>
            <div>
              <h3>可替换食材</h3>
              <div className="mini-cards">
                <span>暂无需要替换的食材</span>
              </div>
            </div>
          </div>
        </section>
        <section className="block recipe-steps">
          <h2>制作步骤</h2>
          <div className="step-list preview-steps">
            {steps.map((s, i) => (
              <article className="step-preview" key={s[0]}>
                <span>{i + 1}</span>
                <strong>{s[0].split("｜")[1]}</strong>
                <small>{s[2]}</small>
              </article>
            ))}
          </div>
        </section>
        <button className="primary sticky" onClick={() => go("cook")}>
          {recipeOrigin === "recommend" ? "就做这道" : "再做一次"}
        </button>
      </>,
    );
  if (page === "cook")
    return shell(
      <>
        <Header
          title="开始做吧"
          sub="番茄炒蛋 · 预计 15 分钟"
          back={recipeBack}
        />
        {recipeOrigin === "recommend" && (
          <button className="link cook-back" onClick={() => go("recommend")}>
            ‹ 看看其他菜谱
          </button>
        )}
        <div className="cook-all-steps">
          {steps.map((s, i) => (
            <RecipeStepCard
              key={s[0]}
              index={i}
              data={s}
              timer={i === 1 || i === 2}
            />
          ))}
        </div>
        <div className="sticky-actions">
          <button className="primary" onClick={() => setConsumeOpen(true)}>
            做好啦
          </button>
          <button
            className="danger-link"
            onClick={() => setDialog("确定结束这次制作吗？")}
          >
            结束制作
          </button>
        </div>
        {consumeOpen && (
          <div className="overlay">
            <div className="consume-modal">
              <button
                className="modal-close"
                onClick={() => setConsumeOpen(false)}
              >
                ×
              </button>
              <Consume
                onDone={(tomato, egg) => {
                  setFoods((a) =>
                    a.flatMap((f) =>
                      f.name === "番茄"
                        ? tomato >= Number(f.qty)
                          ? []
                          : [{ ...f, qty: Number(f.qty) - tomato }]
                        : f.name === "鸡蛋"
                          ? [{ ...f, qty: Math.max(0, Number(f.qty) - egg) }]
                          : [f],
                    ),
                  );
                  setConsumeOpen(false);
                  go("feedback");
                }}
              />
            </div>
          </div>
        )}
      </>,
    );
  if (page === "feedback")
    return shell(
      <>
        <Header title="吃起来怎么样？" sub="随手记一下，下次会更懂你的口味。" />
        <section className="block">
          <h2>这道菜你觉得怎么样？</h2>
          <div className="reaction-options">
            {["好吃！", "一般", "不喜欢"].map((x) => (
              <button
                className={mealReaction === x ? "active" : ""}
                key={x}
                onClick={() => setMealReaction(x)}
              >
                <Placeholder />
                <strong>{x}</strong>
              </button>
            ))}
          </div>
        </section>
        <label className="label">
          还有什么想说的？
          <textarea placeholder="很好吃，就是有点甜……" />
        </label>
        <button className="heart big" onClick={() => setLiked(!liked)}>
          {liked ? "♥ 已加入喜欢" : "♡ 加入喜欢"}
        </button>
        <button
          className="primary sticky"
          onClick={() => {
            setSuccess(true);
            setTimeout(() => {
              setSuccess(false);
              go("home");
            }, 2000);
          }}
        >
          完成
        </button>
        {success && (
          <div className="success-state">
            <b>✓</b>
            <h2>记住啦，下次继续帮你挑合适的。</h2>
          </div>
        )}
      </>,
    );
  if (page === "profile")
    return shell(
      <>
        <Header title="我的" />
        <div className="person">
          <Placeholder />
          <div>
            <h2>
              佳美 <span className="profile-tag">主用户</span>
            </h2>
            <p>+86 800800</p>
            <small>ID：102837658</small>
          </div>
        </div>
        <section className="block recipe-shortcuts">
          <h2>我的菜谱</h2>
          <div>
            <button type="button" onClick={() => openRecipes("done")}>
              <Placeholder kind="icon" />
              <span>
                <strong>历史菜谱</strong>
                <small>8 条做饭记录</small>
              </span>
              <b>›</b>
            </button>
            <button type="button" onClick={() => openRecipes("liked")}>
              <Placeholder kind="icon" />
              <span>
                <strong>喜欢的菜谱</strong>
                <small>5 道心水菜</small>
              </span>
              <b>›</b>
            </button>
          </div>
        </section>
        <section className="block profile-section">
          <div className="section-heading">
            <span>
              <h2>用户档案</h2>
              <p>记录一起吃饭的人的饮食偏好。</p>
            </span>
            <button
              className="secondary compact-add"
              onClick={() => openMember("profile")}
            >
              ＋ 添加成员
            </button>
          </div>
          <div className="profile-list">
            {people.map((name, i) => {
              const d = profileData[name] || {
                taste: "",
                diet: "",
                limits: [],
                allergens: [],
              };
              return (
                <button
                  type="button"
                  className="profile-row"
                  key={name}
                  onClick={() => openDiet(name)}
                >
                  <div className="profile-card-head">
                    <strong>{name}</strong>
                    <em className="profile-tag">
                      {i === 0 ? "主用户" : i === 1 ? "伴侣" : "父母"}
                    </em>
                    <b>›</b>
                  </div>
                  <span className="profile-detail">
                    <strong>口味偏好：</strong>
                    {[d.taste, d.diet].filter(Boolean).join("、") || "未设置"}
                  </span>
                  <span className="profile-detail">
                    <strong>长期忌口：</strong>
                    {d.limits.join("、") || "无"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
        <button
          className="danger-link logout"
          onClick={() => setDialog("确定要退出登录吗？")}
        >
          退出登录
        </button>
      </>,
      true,
    );
  if (page === "diet")
    return shell(
      <>
        <Header
          title={
            draftProfileName === "我"
              ? "我的饮食档案"
              : `${draftProfileName}的饮食档案`
          }
          back={() => go("profile")}
        />
        {profileName !== "我" && (
          <label className="label profile-name">
            成员姓名
            <input
              value={draftProfileName}
              onChange={(e) => setDraftProfileName(e.target.value)}
              placeholder="输入成员姓名"
            />
          </label>
        )}
        <ProfileForm
          value={{
            taste: draftTaste,
            diet: draftDiet,
            limits: draftLimits,
            allergens: draftAllergens,
          }}
          onChange={(d) => {
            setDraftTaste(d.taste);
            setDraftDiet(d.diet);
            setDraftLimits(d.limits);
            setDraftAllergens(d.allergens);
          }}
        />
        <button
          className="primary sticky"
          disabled={!draftProfileName.trim()}
          onClick={() => {
            const next = draftProfileName.trim();
            setPeople((a) => a.map((x) => (x === profileName ? next : x)));
            setMembers((a) => a.map((x) => (x === profileName ? next : x)));
            setProfileData((a) => {
              const copy = { ...a };
              delete copy[profileName];
              copy[next] = {
                taste: draftTaste,
                diet: draftDiet,
                limits: draftLimits,
                allergens: draftAllergens,
              };
              return copy;
            });
            setProfileName(next);
            say("档案已保存");
            go("profile");
          }}
        >
          保存
        </button>
        {profileName !== "我" && (
          <button
            className="danger-link"
            onClick={() => {
              setPeople((a) => a.filter((x) => x !== profileName));
              setMembers((a) => a.filter((x) => x !== profileName));
              go("profile");
            }}
          >
            删除成员
          </button>
        )}
      </>,
    );
  if (page === "recipes") {
    const data =
      recipeTab === "done"
        ? [
            ["番茄炒蛋", "上周 · 3 次", "主要食材全部已有"],
            ["青椒肉丝", "2 周前 · 2 次", "缺少 1 种主要食材"],
            ["可乐鸡翅", "上个月 · 1 次", "缺少 2 种主要食材"],
          ]
        : [
            ["番茄炒蛋", "15 分钟 · 简单", "主要食材全部已有"],
            ["香菇鸡肉饭", "30 分钟 · 简单", "缺少 2 种主要食材"],
            ["可乐鸡翅", "30 分钟 · 简单", "缺少 2 种主要食材"],
            ["麻婆豆腐", "25 分钟 · 中等", "已有 1 种主要食材"],
            ["土豆炖牛肉", "60 分钟 · 中等", "缺少 2 种主要食材"],
          ];
    return shell(
      <>
        <Header title="我的菜谱" back={() => go("profile")} />
        <div className="tabs">
          <button
            type="button"
            className={recipeTab === "done" ? "active" : ""}
            onClick={() => setRecipeTab("done")}
          >
            历史菜谱
          </button>
          <button
            type="button"
            className={recipeTab === "liked" ? "active" : ""}
            onClick={() => setRecipeTab("liked")}
          >
            喜欢的菜谱
          </button>
        </div>
        <div className="recipe-grid">
          {data.map((x) => (
            <button
              type="button"
              className="saved-card"
              key={x[0]}
              onClick={() => {
                setRecipeOrigin(recipeTab);
                go("recipe");
              }}
            >
              <Placeholder wide />
              <span>
                <strong>{x[0]}</strong>
                <small>{x[1]}</small>
                <em>{x[2]}</em>
                {recipeTab === "liked" && <i>♥ 已喜欢</i>}
              </span>
            </button>
          ))}
        </div>
      </>,
    );
  }
  return shell(null);
}

function LoadingSequence({ texts }: { texts: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setI((x) => Math.min(x + 1, texts.length - 1)),
      1000,
    );
    return () => clearInterval(t);
  }, [texts.length]);
  return (
    <div className="center-state loading-state">
      <span className="spinner" />
      <h1>{texts[i]}</h1>
      <p>正在为这一顿缩小选择范围。</p>
      <Placeholder wide />
    </div>
  );
}
function RecipeStepCard({
  index,
  data,
  timer,
}: {
  index: number;
  data: string[];
  timer: boolean;
}) {
  const initial = index === 2 ? 300 : 180,
    [complete, setComplete] = useState(false),
    [running, setRunning] = useState(false),
    [seconds, setSeconds] = useState(initial);
  useEffect(() => {
    if (!running || seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running, seconds]);
  const reset = () => {
      setRunning(false);
      setSeconds(initial);
    },
    toggleComplete = () => {
      if (complete) reset();
      setComplete((v) => !v);
    };
  const name = data[0].split("｜")[1] || data[0];
  return (
    <article className={`detail-step ${complete ? "is-complete" : ""}`}>
      <div className="step-number">{index + 1}</div>
      <div className="step-content">
        <div className="step-title">
          <h3>{name}</h3>
          <strong>{data[2]}</strong>
        </div>
        <p>{data[1]}</p>
        {timer && (
          <div className="compact-timer">
            <b>
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")}
            </b>
            <span>
              <button onClick={() => setRunning((v) => !v)}>
                {running ? "暂停" : seconds === 0 ? "时间到啦" : "开始计时"}
              </button>
              <button onClick={reset}>清零</button>
            </span>
          </div>
        )}
        <button className="complete-action" onClick={toggleComplete}>
          {complete ? "✓ 已完成 · 重新打开" : "标记已完成"}
        </button>
      </div>
    </article>
  );
}
function Consume({ onDone }: { onDone: (t: number, e: number) => void }) {
  const [t, setT] = useState(2),
    [e, setE] = useState(3);
  return (
    <>
      <Header
        title="刚刚用了哪些食材？"
        sub="我已经按菜谱填好预计用量，请确认实际使用数量。"
      />
      <div className="consume-grid">
        {[
          ["番茄", t, setT, "个"],
          ["鸡蛋", e, setE, "个"],
        ].map((x: any) => (
          <label className="consume" key={x[0]}>
            <Placeholder />
            <span>
              <strong>{x[0]}</strong>
              <small>
                预计消耗 {x[0] === "番茄" ? 2 : 3} {x[3]}
              </small>
            </span>
            <span>
              <input
                type="number"
                min="0"
                max={x[0] === "番茄" ? 2 : 6}
                value={x[1]}
                onChange={(z) => x[2](Math.max(0, +z.target.value))}
              />
              {x[3]}
            </span>
          </label>
        ))}
      </div>
      <p className="notice">确认后会直接更新冰箱库存，不会产生负库存。</p>
      <button
        className="primary"
        onClick={() => onDone(Math.min(t, 2), Math.min(e, 6))}
      >
        确认食材消耗
      </button>
    </>
  );
}
function ProfileForm({
  value,
  onChange,
}: {
  value?: ProfileData;
  onChange?: (d: ProfileData) => void;
}) {
  const [local, setLocal] = useState<ProfileData>({
    taste: "",
    diet: "",
    limits: [],
    allergens: [],
  });
  const data = value || local,
    change = (next: ProfileData) => {
      onChange ? onChange(next) : setLocal(next);
    };
  return (
    <div className="profile-form">
      <Single
        title="平时喜欢什么口味？"
        opts={["清淡", "家常", "香辣", "酸口", "甜口"]}
        selected={data.taste}
        onSelect={(taste) => change({ ...data, taste })}
      />
      <Single
        title="平时的饮食倾向"
        opts={["高蛋白", "低脂", "素食"]}
        selected={data.diet}
        onSelect={(diet) => change({ ...data, diet })}
      />
      <EditableMulti
        title="长期不吃的食物"
        opts={[
          "不吃辣",
          "不吃香菜",
          "不吃葱",
          "不吃姜",
          "不吃蒜",
          "不吃动物内脏",
          "不吃生食",
          "不吃菌菇",
          "不吃牛肉",
          "不吃羊肉",
          "不吃海鲜",
        ]}
        selected={data.limits}
        onSelect={(limits) => change({ ...data, limits })}
      />
      <EditableMulti
        title="过敏原"
        opts={[
          "花生",
          "坚果",
          "牛奶 / 乳制品",
          "鸡蛋",
          "小麦 / 麸质",
          "大豆",
          "鱼类",
          "甲壳类 / 贝类",
          "无已知过敏原",
        ]}
        selected={data.allergens}
        onSelect={(allergens) => change({ ...data, allergens })}
        allergy
      />
      <p className="notice">过敏信息会优先用于每一次菜谱推荐。</p>
    </div>
  );
}
function Single({
  title,
  opts,
  selected,
  onSelect,
}: {
  title: string;
  opts: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <section className="block">
      <h2>
        <Placeholder kind="icon" />
        {title}
        <small className="selection-rule">单选</small>
      </h2>
      <div className="chips">
        {opts.map((x) => (
          <button
            className={selected === x ? "active" : ""}
            key={x}
            onClick={() => onSelect(x)}
          >
            {x}
          </button>
        ))}
      </div>
    </section>
  );
}
function EditableMulti({
  title,
  opts,
  selected,
  onSelect,
  allergy = false,
}: {
  title: string;
  opts: string[];
  selected: string[];
  onSelect: (v: string[]) => void;
  allergy?: boolean;
}) {
  const [custom, setCustom] = useState("");
  const items = [...opts, ...selected.filter((x) => !opts.includes(x))];
  const add = () => {
    const v = custom.trim();
    if (v) onSelect(selected.includes(v) ? selected : [...selected, v]);
    setCustom("");
  };
  return (
    <section className="block">
      <h2>
        <Placeholder kind="icon" />
        {title}
        <small className="selection-rule">多选</small>
      </h2>
      <div className="chips">
        {items.map((x) => (
          <button
            className={selected.includes(x) ? "active" : ""}
            key={x}
            onClick={() =>
              onSelect(
                allergy && x === "无已知过敏原"
                  ? [x]
                  : selected.includes(x)
                    ? selected.filter((v) => v !== x)
                    : [...selected.filter((v) => v !== "无已知过敏原"), x],
              )
            }
          >
            {x}
          </button>
        ))}
      </div>
      <div className="manual-add">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder={`手动添加${title}`}
        />
        <button onClick={add}>添加</button>
      </div>
    </section>
  );
}
