"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { UserRound, X, Eye, EyeOff, LoaderCircle, LogOut, CloudCheck, CloudOff, Mail } from "lucide-react";
import { useAccount } from "@/store/authStore";
import { useI18n } from "@/lib/useI18n";
import { accountError, loginAccount, registerAccount, logoutAccount, resetAccountPassword, verifyAccountEmail, startAccountSession } from "@/lib/firebase/session";
const syncCopy = { guest: "Progression enregistrée sur cet appareil.", loading: "Récupération de ta progression…", saving: "Sauvegarde en cours…", saved: "Progression synchronisée avec ton compte", offline: "Hors ligne · progression gardée sur cet appareil", error: "Synchronisation interrompue · tes révisions restent sur cet appareil" };
export function ProgressStatus() {
  const { t } = useI18n();
  const sync = useAccount((s) => s.sync);
  return <span className="account-sync" role="status">{sync === "saved" ? <CloudCheck size={14} /> : sync === "error" || sync === "offline" ? <CloudOff size={14} /> : null}{t(syncCopy[sync])}</span>;
}
export function AccountButton({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const account = useAccount();
  return <button className={compact ? "account-trigger" : "account-entry secondary-button"} aria-label={t(account.user ? "Mon compte" : "Se connecter")} title={t(account.user ? "Mon compte" : "Se connecter")} onClick={account.show}>
    <UserRound size={compact ? 19 : 17} />{!compact && <span>{t(account.user ? "Mon compte" : "Se connecter")}</span>}{compact && account.user && <i />}
  </button>;
}
export function AccountDialog() {
  const { t } = useI18n();
  const account = useAccount();
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(startAccountSession, []);
  useEffect(() => {
    if (account.open) { setError(""); setMessage(""); dialog.current?.showModal(); }
    else { dialog.current?.close(); setPassword(""); setVisible(false); }
  }, [account.open]);
  const changeMode = (next: typeof mode) => { setMode(next); setPassword(""); setError(""); setMessage(""); setVisible(false); };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return;
    setPending(true); setError(""); setMessage("");
    try {
      if (mode === "reset") { await resetAccountPassword(email); setMessage("Si un compte correspond à cette adresse, un lien de réinitialisation a été envoyé. Vérifie aussi tes indésirables."); }
      else if (mode === "register") { await registerAccount(email, password); setPassword(""); setMessage("Ton compte est créé. Ta progression est maintenant liée à ton compte."); }
      else { await loginAccount(email, password); setPassword(""); account.close(); }
    } catch (cause) { setError(accountError(cause)); } finally { setPending(false); }
  }
  async function accountAction(action: "logout" | "verify") {
    if (pending) return; setPending(true); setError(""); setMessage("");
    try {
      if (action === "logout") { await logoutAccount(); account.close(); }
      else { await verifyAccountEmail(); setMessage("E-mail de vérification envoyé. Ouvre le lien reçu dans ta messagerie."); }
    } catch (cause) { setError(accountError(cause)); } finally { setPending(false); }
  }
  const title = account.user ? "Mon compte" : mode === "register" ? "Créer un compte" : mode === "reset" ? "Mot de passe oublié" : "Retrouve tes révisions";
  return <dialog className="account-dialog" ref={dialog} aria-labelledby="account-title" onCancel={(event) => { if (pending) event.preventDefault(); else account.close(); }} onClick={(event) => { if (event.target === dialog.current && !pending) account.close(); }}>
    <div className="account-dialog-heading"><h2 id="account-title">{t(title)}</h2><button className="icon-button" aria-label={t("Fermer mon compte")} disabled={pending} onClick={account.close}><X size={21} /></button></div>
    {account.user ? <>
      <div className="account-identity"><UserRound size={26} /><div><strong>{account.user.email}</strong><span>{t("Ton espace de révision Oscar")}</span></div></div>
      <ProgressStatus />
      <p>{t("Ta progression te suit lorsque tu te connectes sur un autre appareil.")}</p>
      {!account.user.emailVerified && <button className="secondary-button" disabled={pending} onClick={() => void accountAction("verify")}><Mail size={17} />{t("Vérifier mon adresse e-mail")}</button>}
      <button className="account-logout text-button" disabled={pending} onClick={() => void accountAction("logout")}><LogOut size={17} />{t("Se déconnecter")}</button>
    </> : <>
      <p>{t(mode === "register" ? "Crée ton espace pour retrouver ta progression sur tous tes appareils. Tes révisions actuelles seront reprises." : mode === "reset" ? "Indique ton e-mail pour recevoir un lien et choisir un nouveau mot de passe." : "Connecte-toi pour reprendre là où tu t’étais arrêté.")}</p>
      {mode !== "reset" && <div className="account-tabs" role="group" aria-label={t("Accès au compte")}><button aria-pressed={mode === "login"} disabled={pending} onClick={() => changeMode("login")}>{t("Connexion")}</button><button aria-pressed={mode === "register"} disabled={pending} onClick={() => changeMode("register")}>{t("Inscription")}</button></div>}
      <form onSubmit={submit}>
        <label htmlFor="account-email">{t("Adresse e-mail")}</label>
        <input id="account-email" type="email" autoComplete="email" inputMode="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} disabled={pending} />
        {mode !== "reset" && <><label htmlFor="account-password">{t("Mot de passe")}</label><div className="account-password"><input id="account-password" type={visible ? "text" : "password"} autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={mode === "register" ? 8 : 1} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} disabled={pending} aria-describedby={mode === "register" ? "password-help" : undefined} /><button type="button" aria-label={t(visible ? "Masquer le mot de passe" : "Afficher le mot de passe")} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{mode === "register" && <small id="password-help">{t("8 caractères minimum")}</small>}</>}
        <button className="primary-button" type="submit" disabled={pending || !account.ready}>{pending && <LoaderCircle className="spin" size={17} />}{t(pending ? "Patiente un instant…" : mode === "register" ? "Créer mon compte" : mode === "reset" ? "Envoyer le lien" : "Se connecter")}</button>
      </form>
      {mode === "login" && <button className="text-button" disabled={pending} onClick={() => changeMode("reset")}>{t("Mot de passe oublié ?")}</button>}
      {mode === "reset" && <button className="text-button" disabled={pending} onClick={() => changeMode("login")}>{t("Retour à la connexion")}</button>}
    </>}
    {(error || account.error) && <p className="account-error" role="alert">{t(error || account.error!)}</p>}
    {message && <p className="account-message" role="status">{t(message)}</p>}
    <div className="account-privacy">{t("Ton adresse e-mail et ta progression sont hébergées avec Firebase. Ton mot de passe est géré par Firebase Authentication.")}</div>
    {!account.user && <button className="account-guest text-button" disabled={pending} onClick={account.close}>{t("Continuer sans compte")}</button>}
  </dialog>;
}
