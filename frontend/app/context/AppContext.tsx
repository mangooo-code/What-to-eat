"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { initialFoods } from "../lib/data";
import type { Food, Page, ProfileData } from "../lib/types";

interface AppContextValue {
  page: Page;
  setPage: (p: Page) => void;
  go: (p: Page) => void;
  countryCode: string;
  setCountryCode: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  agreed: boolean;
  setAgreed: (v: boolean) => void;
  loginError: string;
  setLoginError: (v: string) => void;
  legal: string;
  setLegal: (v: string) => void;
  foods: Food[];
  setFoods: React.Dispatch<React.SetStateAction<Food[]>>;
  editIndex: number;
  setEditIndex: (v: number) => void;
  confirmEdit: number | null;
  setConfirmEdit: (v: number | null) => void;
  foodModal: "summary" | "edit" | "add" | null;
  setFoodModal: (v: "summary" | "edit" | "add" | null) => void;
  newFood: Food;
  setNewFood: React.Dispatch<React.SetStateAction<Food>>;
  fridgePlace: string;
  setFridgePlace: (v: string) => void;
  fridgePage: number;
  setFridgePage: React.Dispatch<React.SetStateAction<number>>;
  toast: string;
  say: (s: string) => void;
  dialog: string;
  setDialog: (v: string) => void;
  captureTab: "camera" | "album" | "voice";
  setCaptureTab: (v: "camera" | "album" | "voice") => void;
  photos: { camera: number; album: number };
  setPhotos: React.Dispatch<
    React.SetStateAction<{ camera: number; album: number }>
  >;
  listening: boolean;
  setListening: (v: boolean) => void;
  input: string;
  setInput: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  taste: string;
  setTaste: (v: string) => void;
  people: string[];
  setPeople: React.Dispatch<React.SetStateAction<string[]>>;
  members: string[];
  setMembers: React.Dispatch<React.SetStateAction<string[]>>;
  profileData: Record<string, ProfileData>;
  setProfileData: React.Dispatch<
    React.SetStateAction<Record<string, ProfileData>>
  >;
  profileName: string;
  setProfileName: (v: string) => void;
  draftProfileName: string;
  setDraftProfileName: (v: string) => void;
  draftTaste: string;
  setDraftTaste: (v: string) => void;
  draftDiet: string;
  setDraftDiet: (v: string) => void;
  draftLimits: string[];
  setDraftLimits: (v: string[]) => void;
  draftAllergens: string[];
  setDraftAllergens: (v: string[]) => void;
  memberOpen: boolean;
  setMemberOpen: (v: boolean) => void;
  memberMode: "add" | "edit";
  memberFrom: "needs" | "profile";
  newMemberName: string;
  setNewMemberName: (v: string) => void;
  relation: string;
  setRelation: (v: string) => void;
  chosenLimits: string[];
  setChosenLimits: React.Dispatch<React.SetStateAction<string[]>>;
  prefer: boolean;
  setPrefer: (v: boolean) => void;
  other: boolean;
  setOther: (v: boolean) => void;
  otherLimit: string;
  setOtherLimit: (v: string) => void;
  batch: number;
  setBatch: (v: number) => void;
  liked: boolean;
  setLiked: (v: boolean) => void;
  likedRecipes: string[];
  setLikedRecipes: React.Dispatch<React.SetStateAction<string[]>>;
  recipeTab: "done" | "liked";
  setRecipeTab: (v: "done" | "liked") => void;
  recipeOrigin: "recommend" | "done" | "liked";
  setRecipeOrigin: (v: "recommend" | "done" | "liked") => void;
  consumeOpen: boolean;
  setConsumeOpen: (v: boolean) => void;
  mealReaction: string;
  setMealReaction: (v: string) => void;
  needError: boolean;
  setNeedError: (v: boolean) => void;
  success: boolean;
  setSuccess: (v: boolean) => void;
  saveMember: () => void;
  openMember: (from: "needs" | "profile") => void;
  editMember: (name: string, index: number) => void;
  openRecipes: (tab: "done" | "liked") => void;
  openDiet: (name: string) => void;
  logout: () => void;
  recipeBack: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>("login");
  const [countryCode, setCountryCode] = useState("+86");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [legal, setLegal] = useState("");
  const [foods, setFoods] = useState(initialFoods);
  const [editIndex, setEditIndex] = useState(0);
  const [confirmEdit, setConfirmEdit] = useState<number | null>(null);
  const [foodModal, setFoodModal] = useState<
    "summary" | "edit" | "add" | null
  >(null);
  const [newFood, setNewFood] = useState<Food>({
    name: "",
    qty: 1,
    unit: "个",
    place: "冷藏",
    days: 3,
  });
  const [fridgePlace, setFridgePlace] = useState("冷藏");
  const [fridgePage, setFridgePage] = useState(0);
  const [toast, setToast] = useState("");
  const [dialog, setDialog] = useState("");
  const [captureTab, setCaptureTab] = useState<"camera" | "album" | "voice">(
    "camera",
  );
  const [photos, setPhotos] = useState({ camera: 0, album: 0 });
  const [listening, setListening] = useState(false);
  const [input, setInput] = useState("");
  const [time, setTime] = useState("");
  const [taste, setTaste] = useState("按平时口味");
  const [people, setPeople] = useState(["我", "阳", "妈妈"]);
  const [members, setMembers] = useState(["我"]);
  const [profileData, setProfileData] = useState<Record<string, ProfileData>>(
    {
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
    },
  );
  const [profileName, setProfileName] = useState("我");
  const [draftProfileName, setDraftProfileName] = useState("我");
  const [draftTaste, setDraftTaste] = useState("");
  const [draftDiet, setDraftDiet] = useState("");
  const [draftLimits, setDraftLimits] = useState<string[]>([]);
  const [draftAllergens, setDraftAllergens] = useState<string[]>([]);
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberMode, setMemberMode] = useState<"add" | "edit">("add");
  const [memberFrom, setMemberFrom] = useState<"needs" | "profile">("needs");
  const [newMemberName, setNewMemberName] = useState("");
  const [relation, setRelation] = useState("");
  const [chosenLimits, setChosenLimits] = useState<string[]>([]);
  const [prefer, setPrefer] = useState(false);
  const [other, setOther] = useState(false);
  const [otherLimit, setOtherLimit] = useState("");
  const [batch, setBatch] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likedRecipes, setLikedRecipes] = useState<string[]>([]);
  const [recipeTab, setRecipeTab] = useState<"done" | "liked">("done");
  const [recipeOrigin, setRecipeOrigin] = useState<
    "recommend" | "done" | "liked"
  >("recommend");
  const [consumeOpen, setConsumeOpen] = useState(false);
  const [mealReaction, setMealReaction] = useState("");
  const [needError, setNeedError] = useState(false);
  const [success, setSuccess] = useState(false);

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
  const recipeBack = () => {
    if (recipeOrigin === "recommend") go("recommend");
    else {
      setRecipeTab(recipeOrigin);
      go("recipes");
    }
  };

  const value: AppContextValue = {
    page,
    setPage,
    go,
    countryCode,
    setCountryCode,
    phone,
    setPhone,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    agreed,
    setAgreed,
    loginError,
    setLoginError,
    legal,
    setLegal,
    foods,
    setFoods,
    editIndex,
    setEditIndex,
    confirmEdit,
    setConfirmEdit,
    foodModal,
    setFoodModal,
    newFood,
    setNewFood,
    fridgePlace,
    setFridgePlace,
    fridgePage,
    setFridgePage,
    toast,
    say,
    dialog,
    setDialog,
    captureTab,
    setCaptureTab,
    photos,
    setPhotos,
    listening,
    setListening,
    input,
    setInput,
    time,
    setTime,
    taste,
    setTaste,
    people,
    setPeople,
    members,
    setMembers,
    profileData,
    setProfileData,
    profileName,
    setProfileName,
    draftProfileName,
    setDraftProfileName,
    draftTaste,
    setDraftTaste,
    draftDiet,
    setDraftDiet,
    draftLimits,
    setDraftLimits,
    draftAllergens,
    setDraftAllergens,
    memberOpen,
    setMemberOpen,
    memberMode,
    memberFrom,
    newMemberName,
    setNewMemberName,
    relation,
    setRelation,
    chosenLimits,
    setChosenLimits,
    prefer,
    setPrefer,
    other,
    setOther,
    otherLimit,
    setOtherLimit,
    batch,
    setBatch,
    liked,
    setLiked,
    likedRecipes,
    setLikedRecipes,
    recipeTab,
    setRecipeTab,
    recipeOrigin,
    setRecipeOrigin,
    consumeOpen,
    setConsumeOpen,
    mealReaction,
    setMealReaction,
    needError,
    setNeedError,
    success,
    setSuccess,
    saveMember,
    openMember,
    editMember,
    openRecipes,
    openDiet,
    logout,
    recipeBack,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
