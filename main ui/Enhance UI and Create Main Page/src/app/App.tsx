import { useState } from "react";
import { LoginPage } from "./components/LoginPage";
import { DietaryPage } from "./components/DietaryPage";
import { AllergiesPage } from "./components/AllergiesPage";
import { MainApp } from "./components/MainApp";

type Screen = "login" | "dietary" | "allergies" | "main";

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");

  return (
    <div className="size-full">
      {screen === "login" && (
        <LoginPage onLogin={() => setScreen("dietary")} />
      )}
      {screen === "dietary" && (
        <DietaryPage
          onNext={() => setScreen("allergies")}
          onBack={() => setScreen("login")}
        />
      )}
      {screen === "allergies" && (
        <AllergiesPage
          onNext={() => setScreen("main")}
          onBack={() => setScreen("dietary")}
        />
      )}
      {screen === "main" && <MainApp />}
    </div>
  );
}
