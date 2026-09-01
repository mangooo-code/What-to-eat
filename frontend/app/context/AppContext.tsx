"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { initialFoods } from "../lib/data";
import type { RecipeDto } from "../services/findRecipesService";
import type { Food, Page, ProfileData } from "../lib/types";
import type { HouseholdMember, User } from "../types/domain";
import { memberService } from "../services/memberService";
import { userService } from "../services/userService";
import { authToken } from "../services/authToken";

// Maps each logical app `Page` to its real URL route (drives useRouter/usePathname below).
const pageToPath: Record<Page, string> = {
  login: "/login",
  home: "/",
  fridge: "/fridge",
  edit: "/edit",
  capture: "/capture",
  recognize: "/recognize",
  confirm: "/confirm",
  findrecipes: "/findrecipes",
  member: "/member",
  recommend: "/recommend",
  recipe: "/recipe",
  cook: "/cook",
  feedback: "/feedback",
  profile: "/profile",
  diet: "/diet",
  recipes: "/recipes",
};
const pathToPage: Record<string, Page> = Object.fromEntries(
  Object.entries(pageToPath).map(([p, path]) => [path, p as Page]),
);

interface AppContextValue {
  page: Page;
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
  householdMembers: HouseholdMember[];
  membersLoading: boolean;
  currentUser: User | null;
  currentUserLoading: boolean;
  loadCurrentUser: () => Promise<void>;
  loadMembers: () => Promise<void>;
  memberSaving: boolean;
  members: string[];
  setMembers: React.Dispatch<React.SetStateAction<string[]>>;
  profileData: Record<string, ProfileData>;
  setProfileData: React.Dispatch<
    React.SetStateAction<Record<string, ProfileData>>
  >;
  profileName: string;
  setProfileName: (v: string) => void;
  profileMemberId: string;
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
  memberFrom: "findrecipes" | "profile";
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
  recommendedRecipes: RecipeDto[];
  setRecommendedRecipes: (v: RecipeDto[]) => void;
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
  saveMember: () => Promise<boolean>;
  saveDietProfile: () => Promise<boolean>;
  deleteProfileMember: () => Promise<boolean>;
  openMember: (from: "findrecipes" | "profile") => void;
  editMember: (memberId: string) => void;
  openRecipes: (tab: "done" | "liked") => void;
  openDiet: (name: string) => void;
  logout: () => void;
  recipeBack: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function selectValidMemberIds(
  selected: string[],
  items: HouseholdMember[],
): string[] {
  const valid = selected.filter((id) => items.some((item) => item.memberId === id));
  if (valid.length) return valid;
  const owner = items.find((item) => item.isOwner);
  return owner ? [owner.memberId] : [];
}

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const page = pathToPage[pathname] ?? "login";
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
  const [taste, setTaste] = useState("");
  const [people, setPeople] = useState(["我", "阳", "妈妈"]);
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserLoading, setCurrentUserLoading] = useState(false);
  const [memberSaving, setMemberSaving] = useState(false);
  const [members, setMembers] = useState<string[]>([]);
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
  const [profileMemberId, setProfileMemberId] = useState("");
  const [draftProfileName, setDraftProfileName] = useState("我");
  const [draftTaste, setDraftTaste] = useState("");
  const [draftDiet, setDraftDiet] = useState("");
  const [draftLimits, setDraftLimits] = useState<string[]>([]);
  const [draftAllergens, setDraftAllergens] = useState<string[]>([]);
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberMode, setMemberMode] = useState<"add" | "edit">("add");
  const [memberFrom, setMemberFrom] = useState<"findrecipes" | "profile">("findrecipes");
  const [newMemberName, setNewMemberName] = useState("");
  const [relation, setRelation] = useState("");
  const [chosenLimits, setChosenLimits] = useState<string[]>([]);
  const [prefer, setPrefer] = useState(false);
  const [other, setOther] = useState(false);
  const [otherLimit, setOtherLimit] = useState("");
  const [batch, setBatch] = useState(0);
  const [recommendedRecipes, setRecommendedRecipes] = useState<RecipeDto[]>([]);
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
    router.push(pageToPath[p]);
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
  }, [page]);
  const loadCurrentUser = async () => {
    if (!authToken.get()) {
      setCurrentUser(null);
      return;
    }
    setCurrentUserLoading(true);
    try {
      setCurrentUser(await userService.getProfile());
    } catch {
      setCurrentUser(null);
    } finally {
      setCurrentUserLoading(false);
    }
  };
  const loadMembers = async () => {
    if (!authToken.get()) {
      setHouseholdMembers([]);
      setMembersLoading(false);
      return;
    }
    setMembersLoading(true);
    try {
      const items = await memberService.list();
      setHouseholdMembers(items);
      setMembers((selected) => selectValidMemberIds(selected, items));
    } catch (error) {
      say(`成员加载失败：${error instanceof Error ? error.message : "请稍后重试"}`);
    } finally {
      setMembersLoading(false);
    }
  };
  useEffect(() => {
    if (authToken.get()) {
      loadCurrentUser();
      loadMembers();
      if (pathname === "/login") go("home");
    } else {
      setMembersLoading(false);
      if (pathname !== "/login") go("login");
    }
  }, []);


  const saveMember = async (): Promise<boolean> => {
    const name = newMemberName.trim();
    if (!name || !relation || memberSaving) return false;
    setMemberSaving(true);
    try {
      const input = {
        name,
        relationship: relation,
        tastePreference: draftTaste || null,
        dietPreference: draftDiet || null,
        dietaryRestrictions: draftLimits,
        allergens: draftAllergens,
      };
      const saved = memberMode === "edit" && profileMemberId
        ? await memberService.update(profileMemberId, input)
        : await memberService.create({ ...input, isOwner: false });
      setHouseholdMembers((items) => memberMode === "edit"
        ? items.map((item) => item.memberId === saved.memberId ? saved : item)
        : [...items, saved]);
      if (memberFrom === "findrecipes") {
        setMembers((ids) => ids.includes(saved.memberId) ? ids : [...ids, saved.memberId]);
      }
      setNewMemberName("");
      setRelation("");
      setDraftTaste("");
      setDraftDiet("");
      setDraftLimits([]);
      setDraftAllergens([]);
      setMemberOpen(false);
      say("成员档案已保存");
      return true;
    } catch (error) {
      say(`成员保存失败：${error instanceof Error ? error.message : "请稍后重试"}`);
      return false;
    } finally {
      setMemberSaving(false);
    }
  };
  const openMember = (from: "findrecipes" | "profile") => {
    setMemberMode("add");
    setMemberFrom(from);
    setNewMemberName("");
    setRelation("");
    setProfileMemberId("");
    setDraftTaste("");
    setDraftDiet("");
    setDraftLimits([]);
    setDraftAllergens([]);
    setMemberOpen(true);
  };
  const editMember = (memberId: string) => {
    const member = householdMembers.find((item) => item.memberId === memberId);
    if (!member) return;
    setMemberMode("edit");
    setMemberFrom("profile");
    setProfileMemberId(member.memberId);
    setProfileName(member.name);
    setNewMemberName(member.name);
    setRelation(member.relationship);
    setDraftTaste(member.tastePreference ?? "");
    setDraftDiet(member.dietPreference ?? "");
    setDraftLimits(member.dietaryRestrictions);
    setDraftAllergens(member.allergens);
    setMemberOpen(true);
  };
  const openRecipes = (tab: "done" | "liked") => {
    setRecipeTab(tab);
    go("recipes");
  };
  const openDiet = (memberId: string) => {
    const member = householdMembers.find((item) => item.memberId === memberId);
    if (!member) return;
    setProfileMemberId(member.memberId);
    setProfileName(member.name);
    setDraftProfileName(member.name);
    setDraftTaste(member.tastePreference ?? "");
    setDraftDiet(member.dietPreference ?? "");
    setDraftLimits(member.dietaryRestrictions);
    setDraftAllergens(member.allergens);
    go("diet");
  };
  const saveDietProfile = async (): Promise<boolean> => {
    const name = draftProfileName.trim();
    if (!name || !profileMemberId || memberSaving) return false;
    setMemberSaving(true);
    try {
      const saved = await memberService.update(profileMemberId, {
        name,
        tastePreference: draftTaste || null,
        dietPreference: draftDiet || null,
        dietaryRestrictions: draftLimits,
        allergens: draftAllergens,
      });
      setHouseholdMembers((items) => items.map((item) => item.memberId === saved.memberId ? saved : item));
      setProfileName(saved.name);
      say("档案已保存");
      go("profile");
      return true;
    } catch (error) {
      say(`档案保存失败：${error instanceof Error ? error.message : "请稍后重试"}`);
      return false;
    } finally {
      setMemberSaving(false);
    }
  };
  const deleteProfileMember = async (): Promise<boolean> => {
    if (!profileMemberId || memberSaving) return false;
    setMemberSaving(true);
    try {
      await memberService.remove(profileMemberId);
      setHouseholdMembers((items) => items.filter((item) => item.memberId !== profileMemberId));
      setMembers((ids) => ids.filter((id) => id !== profileMemberId));
      go("profile");
      say("成员已删除");
      return true;
    } catch (error) {
      say(`成员删除失败：${error instanceof Error ? error.message : "请稍后重试"}`);
      return false;
    } finally {
      setMemberSaving(false);
    }
  };
  const logout = () => {
    authToken.clear();
    setCurrentUser(null);
    setDialog("");
    go("login");
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
    householdMembers,
    membersLoading,
    currentUser,
    currentUserLoading,
    loadCurrentUser,
    loadMembers,
    memberSaving,
    members,
    setMembers,
    profileData,
    setProfileData,
    profileName,
    setProfileName,
    profileMemberId,
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
    recommendedRecipes,
    setRecommendedRecipes,
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
    saveDietProfile,
    deleteProfileMember,
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
