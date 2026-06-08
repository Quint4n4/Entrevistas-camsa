import { useState } from "react";
import { adminToken } from "../lib/tokenStore";
import { AdminLogin } from "./AdminLogin";
import { Dashboard } from "./Dashboard";
import { SubmissionDetailView } from "./SubmissionDetailView";
import { QuestionEditor } from "./QuestionEditor";

type View =
  | { name: "dashboard" }
  | { name: "detail"; token: string }
  | { name: "editor" };

export function AdminApp() {
  const [authed, setAuthed] = useState(() => !!adminToken.get());
  const [view, setView] = useState<View>({ name: "dashboard" });

  const logout = () => {
    adminToken.clear();
    setAuthed(false);
    setView({ name: "dashboard" });
  };

  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />;

  if (view.name === "detail") {
    return (
      <SubmissionDetailView
        token={view.token}
        onBack={() => setView({ name: "dashboard" })}
        onLogout={logout}
      />
    );
  }

  if (view.name === "editor") {
    return (
      <QuestionEditor
        onBack={() => setView({ name: "dashboard" })}
        onLogout={logout}
      />
    );
  }

  return (
    <Dashboard
      onOpen={(token) => setView({ name: "detail", token })}
      onEdit={() => setView({ name: "editor" })}
      onLogout={logout}
    />
  );
}
