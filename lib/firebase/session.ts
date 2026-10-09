"use client";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, sendEmailVerification } from "firebase/auth";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { getFirebase } from "./client";
import { captureChanges, emptyBranch, hasProgress, importProgress, mergeBranches, parseBranch, snapshotProgress, type ProgressBranch, type ProgressData } from "./progress";
import { useProgress, switchProgressAccount } from "@/store/progressStore";
import { useAccount } from "@/store/authStore";
import { useLocale } from "@/store/localeStore";
import { useAnatomy } from "@/store/anatomyStore";
import { useQuiz } from "@/store/quizStore";
import { useSheet } from "@/store/sheetStore";
let guestImport: ProgressData | null = null;
let memoryDeviceId = "";
function tabId() {
  try {
    let id = sessionStorage.getItem("oscar-sync-tab-v1");
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem("oscar-sync-tab-v1", id); }
    return id;
  } catch { return memoryDeviceId ||= crypto.randomUUID(); }
}
export function accountError(error: unknown) {
  const code = (error as { code?: string })?.code ?? (error as Error)?.message;
  const errors: Record<string, string> = {
    "auth/invalid-credential": "E-mail ou mot de passe incorrect.", "auth/user-not-found": "E-mail ou mot de passe incorrect.", "auth/wrong-password": "E-mail ou mot de passe incorrect.",
    "auth/email-already-in-use": "Un compte utilise déjà cet e-mail. Connecte-toi ou réinitialise ton mot de passe.",
    "auth/invalid-email": "Vérifie ton adresse e-mail.", "auth/weak-password": "Choisis un mot de passe d’au moins 8 caractères.",
    "auth/password-does-not-meet-requirements": "Ce mot de passe ne respecte pas les règles du compte. Utilise au moins 8 caractères.",
    "auth/too-many-requests": "Trop de tentatives. Patiente quelques minutes avant de réessayer.",
    "auth/network-request-failed": "Connexion indisponible. Vérifie ton réseau et réessaie.", "auth/operation-not-allowed": "La connexion est momentanément indisponible. Réessaie plus tard.",
    "auth/not-configured": "Les comptes sont en cours de configuration. Tu peux continuer sans compte.",
    "auth/user-disabled": "Ce compte est désactivé. Contacte le propriétaire du site.",
  };
  return errors[code] ?? "Une erreur est survenue. Réessaie dans un instant.";
}
async function languageAuth() {
  const { auth } = await getFirebase(); auth.languageCode = useLocale.getState().locale; return auth;
}
export async function loginAccount(email: string, password: string) { await signInWithEmailAndPassword(await languageAuth(), email.trim(), password); }
export async function registerAccount(email: string, password: string) {
  guestImport = useAccount.getState().user ? null : snapshotProgress(useProgress.getState());
  try { await createUserWithEmailAndPassword(await languageAuth(), email.trim(), password); } catch (error) { guestImport = null; throw error; }
}
export async function logoutAccount() { await signOut(await languageAuth()); }
export async function resetAccountPassword(email: string) {
  try { await sendPasswordResetEmail(await languageAuth(), email.trim()); }
  catch (error) { if ((error as { code?: string }).code !== "auth/user-not-found") throw error; }
}
export async function verifyAccountEmail() { const auth = await languageAuth(); if (auth.currentUser) await sendEmailVerification(auth.currentUser); }
function resetExercises() {
  useAnatomy.getState().setMode("explore");
  useQuiz.setState({ questions: [], index: 0, picks: [], order: [], feedback: null, complete: false, earned: 0, correct: 0, missed: [], attempts: 0 });
  useSheet.getState().restart();
}
function syncProgress(uid: string, initial: ProgressData | null, db: Awaited<ReturnType<typeof getFirebase>>["db"]) {
  const id = tabId(), key = `oscar-cloud-branch-v1:${uid}:${id}`;
  const reference = doc(db, "users", uid, "devices", id);
  let branch = emptyBranch(), remote = new Map<string, ProgressBranch>(), applying = false, disposed = false, timer: ReturnType<typeof setTimeout> | undefined;
  try { branch = parseBranch(JSON.parse(localStorage.getItem(key) ?? "null")); } catch { /* The in-memory branch still works. */ }
  if (initial && !hasProgress(branch) && hasProgress(initial)) branch = importProgress(initial);
  try {
    const cached = JSON.parse(localStorage.getItem(`oscar-cloud-remotes-v1:${uid}`) ?? "[]");
    if (Array.isArray(cached)) remote = new Map(cached.filter((item) => Array.isArray(item) && typeof item[0] === "string").map(([key, data]) => [key, parseBranch(data)]));
  } catch { /* Cloud snapshots will restore the account when online. */ }
  const cachedOwn = remote.get(id);
  if (cachedOwn && cachedOwn.updatedAt > branch.updatedAt) branch = cachedOwn;
  function cache() { try { localStorage.setItem(key, JSON.stringify(branch)); } catch { /* The progress store reports local storage failures. */ } }
  function display() {
    const branches = new Map(remote); branches.set(id, branch);
    applying = true; useProgress.setState(mergeBranches([...branches.values()])); applying = false;
  }
  function upload() {
    if (disposed) return;
    const sent = branch;
    useAccount.setState({ sync: navigator.onLine ? "saving" : "offline" });
    void setDoc(reference, sent).then(() => {
      if (!disposed && branch.updatedAt === sent.updatedAt) useAccount.setState({ sync: "saved" });
    }).catch(() => { if (!disposed) useAccount.setState({ sync: navigator.onLine ? "error" : "offline" }); });
  }
  display(); cache();
  const unsubscribeStore = useProgress.subscribe((after, before) => {
    if (applying || disposed || (after.records === before.records && after.saved === before.saved && after.xp === before.xp && after.sessions === before.sessions)) return;
    branch = captureChanges(branch, before, after); cache();
    useAccount.setState({ sync: navigator.onLine ? "saving" : "offline" });
    clearTimeout(timer); timer = setTimeout(upload, 650);
  });
  const unsubscribeCloud = onSnapshot(collection(db, "users", uid, "devices"), { includeMetadataChanges: true }, (snapshot) => {
    if (disposed) return;
    const incoming = snapshot.docs.map((item) => [item.id, parseBranch(item.data())] as const);
    remote = snapshot.metadata.fromCache ? new Map([...remote, ...incoming]) : new Map(incoming);
    try { localStorage.setItem(`oscar-cloud-remotes-v1:${uid}`, JSON.stringify([...remote])); } catch { /* Cache is optional. */ }
    const own = remote.get(id);
    if (own && own.updatedAt > branch.updatedAt) { branch = own; cache(); }
    display();
    if (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
      if (branch.updatedAt > (own?.updatedAt ?? 0)) upload();
      else useAccount.setState({ sync: "saved" });
    }
  }, () => { if (!disposed) useAccount.setState({ sync: navigator.onLine ? "error" : "offline" }); });
  const reconnect = () => { if (branch.updatedAt) upload(); };
  const offline = () => useAccount.setState({ sync: "offline" });
  const flush = () => { clearTimeout(timer); if (branch.updatedAt) upload(); };
  window.addEventListener("online", reconnect); window.addEventListener("offline", offline); window.addEventListener("pagehide", flush);
  if (branch.updatedAt) upload();
  return () => { disposed = true; clearTimeout(timer); unsubscribeStore(); unsubscribeCloud(); window.removeEventListener("online", reconnect); window.removeEventListener("offline", offline); window.removeEventListener("pagehide", flush); };
}
export function startAccountSession() {
  let disposed = false, stopAuth = () => {}, stopSync = () => {};
  void (async () => {
    await useProgress.persist.rehydrate();
    if (disposed) return;
    const { auth, db } = await getFirebase();
    if (disposed) return;
    let previousUid: string | null | undefined;
    stopAuth = onAuthStateChanged(auth, (user) => {
      stopSync();
      const uid = user?.uid ?? null;
      if (previousUid !== undefined && previousUid !== uid) resetExercises();
      previousUid = uid;
      switchProgressAccount(uid);
      useAccount.setState({ user: user ? { uid: user.uid, email: user.email, emailVerified: user.emailVerified } : null, ready: true, sync: user ? "loading" : "guest", error: null });
      if (user) { const initial = guestImport; guestImport = null; stopSync = syncProgress(user.uid, initial, db); }
    }, (error) => { useAccount.setState({ ready: true, error: accountError(error), sync: "error" }); });
  })().catch((error) => { if (!disposed) useAccount.setState({ ready: true, error: accountError(error), sync: "guest" }); });
  return () => { disposed = true; stopAuth(); stopSync(); };
}
