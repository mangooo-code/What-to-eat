"use client";
import { Shell } from "./components/Shell";
import { AppProvider, useApp } from "./context/AppContext";
import { CapturePage } from "./pages/CapturePage";
import { ConfirmPage } from "./pages/ConfirmPage";
import { CookPage } from "./pages/CookPage";
import { DietPage } from "./pages/DietPage";
import { EditPage } from "./pages/EditPage";
import { FeedbackPage } from "./pages/FeedbackPage";
import { FridgePage } from "./pages/FridgePage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { MemberPage } from "./pages/MemberPage";
import { NeedsPage } from "./pages/NeedsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RecipePage } from "./pages/RecipePage";
import { RecipesPage } from "./pages/RecipesPage";
import { RecognizePage } from "./pages/RecognizePage";
import { RecommendLoadingPage } from "./pages/RecommendLoadingPage";
import { RecommendPage } from "./pages/RecommendPage";

// Pages that show the persistent bottom tab bar.
const NAV_PAGES = new Set(["home", "fridge", "profile"]);

function Router() {
  const { page } = useApp();
  const content = (() => {
    switch (page) {
      case "login":
        return <LoginPage />;
      case "home":
        return <HomePage />;
      case "fridge":
        return <FridgePage />;
      case "edit":
        return <EditPage />;
      case "capture":
        return <CapturePage />;
      case "recognize":
        return <RecognizePage />;
      case "confirm":
        return <ConfirmPage />;
      case "needs":
        return <NeedsPage />;
      case "member":
        return <MemberPage />;
      case "recommend-loading":
        return <RecommendLoadingPage />;
      case "recommend":
        return <RecommendPage />;
      case "recipe":
        return <RecipePage />;
      case "cook":
        return <CookPage />;
      case "feedback":
        return <FeedbackPage />;
      case "profile":
        return <ProfilePage />;
      case "diet":
        return <DietPage />;
      case "recipes":
        return <RecipesPage />;
      default:
        return null;
    }
  })();
  return <Shell withNav={NAV_PAGES.has(page)}>{content}</Shell>;
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
