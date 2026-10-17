import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { AuthMode, AuthPageProps } from "./auth-types";
import "./auth-page.css";
import { Logo } from "@/components/Logo";

const features = [
  { icon: "▤", title: "Study materials", detail: "Notes, PYQs, books and more" },
  { icon: "↗", title: "Tests & analysis", detail: "Practice and track progress" },
  { icon: "◎", title: "Student community", detail: "Discuss, solve and grow" },
  { icon: "✧", title: "AI study tools", detail: "Support for your study journey" },
];

function GoogleMark() {
  return (
    <span className="jph-google-mark" aria-hidden="true">
      G
    </span>
  );
}

export default function AuthPage({
  theme = "dark",
  onBackHome,
  onSignIn,
  onSignUp,
  onGoogleSignIn,
  onContinueAsGuest,
  onForgotPassword,
  onThemeChange,
  signInSecurity,
  signUpSecurity,
  termsUrl = "/terms",
  privacyUrl = "/privacy",
  guidelinesUrl = "/community-guidelines",
}: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const strength = useMemo(() => {
    if (!password) return 0;
    return [
      password.length >= 8,
      /[A-Z]/.test(password) && /[a-z]/.test(password),
      /\d/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;
  }, [password]);

  const changeMode = (next: AuthMode) => {
    setMode(next);
    setError("");
    setNotice("");
  };

  async function runAction(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "signup") {
      if (!acceptedTerms) {
        setError("Please accept the Terms of Use, Community Guidelines and Privacy Policy.");
        return;
      }
      if (password.length < 6) {
        setError("Your password must contain at least 6 characters.");
        return;
      }
      await runAction(() =>
        onSignUp({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
          acceptedTerms,
          honeypot,
        }),
      );
    } else {
      await runAction(() => onSignIn({ email: email.trim(), password, honeypot }));
    }
  }

  const handleForgot = () =>
    runAction(async () => {
      if (!onForgotPassword) return;
      if (!email.trim())
        throw new Error("Enter your email address first, then select Forgot password.");
      await onForgotPassword(email.trim());
      setNotice("If an account exists for this email, password-reset instructions will be sent.");
    });

  return (
    <main className="jph-auth" data-theme={theme}>
      <div className="jph-auth-noise" aria-hidden="true" />
      <div className="jph-auth-orb jph-auth-orb-one" aria-hidden="true" />
      <div className="jph-auth-orb jph-auth-orb-two" aria-hidden="true" />

      <header className="jph-auth-header">
        <a
          className="jph-brand"
          href="/"
          aria-label="PREPWIAN home"
          onClick={
            onBackHome
              ? (e) => {
                  e.preventDefault();
                  onBackHome();
                }
              : undefined
          }
        >
          <span className="jph-brand-symbol" aria-hidden="true">
            <Logo className="h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16" />
          </span>
          <span className="jph-brand-copy">
            <strong>JEE PREP</strong>
            <small>HUB</small>
          </span>
        </a>
        <div className="jph-header-actions">
          <button
            className="jph-theme-toggle jph-glass-control"
            type="button"
            onClick={() => onThemeChange?.(theme === "dark" ? "light" : "dark")}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title="Switch theme"
          >
            {theme === "dark" ? "☼" : "☾"}
          </button>
          <button className="jph-home-link jph-glass-control" type="button" onClick={onBackHome}>
            ← <span>Back to Home</span>
          </button>
        </div>
      </header>

      <div className="jph-auth-layout">
        <section className="jph-auth-intro" aria-label="About PREPWIAN">
          <span className="jph-eyebrow jph-glass-pill">
            <span className="jph-live-dot" /> BUILT FOR JEE ASPIRANTS
          </span>
          <h1>
            {mode === "signin" ? (
              <>
                Crack JEE.
                <br />
                <span>Grow together.</span>
              </>
            ) : (
              <>
                Build your
                <br />
                <span>JEE journey.</span>
              </>
            )}
          </h1>
          <p className="jph-intro-copy">
            {mode === "signin"
              ? "Your study space is ready. Pick up where you left off and keep moving forward."
              : "Create your account and bring your study materials, practice and community into one place."}
          </p>
          <div className="jph-feature-list">
            {features.map((feature) => (
              <div className="jph-feature jph-glass-panel" key={feature.title}>
                <span className="jph-feature-icon" aria-hidden="true">
                  {feature.icon}
                </span>
                <span>
                  <strong>{feature.title}</strong>
                  <small>{feature.detail}</small>
                </span>
                <span className="jph-feature-sheen" aria-hidden="true" />
              </div>
            ))}
          </div>
          <p className="jph-motto">One step today. A stronger tomorrow.</p>
        </section>

        <section
          className="jph-auth-card jph-glass-panel"
          aria-label={mode === "signin" ? "Sign in" : "Create account"}
        >
          <span className="jph-card-reflection" aria-hidden="true" />
          <div
            className="jph-mode-switch jph-glass-inset"
            role="tablist"
            aria-label="Authentication mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signin"}
              className={mode === "signin" ? "active" : ""}
              onClick={() => changeMode("signin")}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              className={mode === "signup" ? "active" : ""}
              onClick={() => changeMode("signup")}
            >
              Create account
            </button>
          </div>
          <div className="jph-form-heading">
            <h2>{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
            <p>
              {mode === "signin"
                ? "Sign in to continue to PREPWIAN."
                : "Start your PREPWIAN journey today."}
            </p>
          </div>

          {error && (
            <div className="jph-alert jph-alert-error" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="jph-alert jph-alert-success" role="status">
              {notice}
            </div>
          )}

          <button
            type="button"
            className="jph-social-button jph-glass-control"
            onClick={() => runAction(onGoogleSignIn)}
            disabled={busy}
          >
            <GoogleMark />
            <span>Continue with Google</span>
            <span className="jph-button-arrow" aria-hidden="true">
              ↗
            </span>
          </button>
          <div className="jph-divider">
            <span>OR CONTINUE WITH EMAIL</span>
          </div>

          <form onSubmit={submit} noValidate>
            {mode === "signup" && (
              <label className="jph-field">
                <span>Full name</span>
                <input
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                  maxLength={100}
                />
              </label>
            )}
            <label className="jph-field">
              <span>Email address</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="jph-field">
              <span className="jph-field-label-row">
                <span>Password</span>
                {mode === "signin" && onForgotPassword && (
                  <button
                    type="button"
                    className="jph-text-button"
                    onClick={handleForgot}
                    disabled={busy}
                  >
                    Forgot password?
                  </button>
                )}
              </span>
              <span className="jph-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 6 characters" : "Enter your password"}
                  required
                  minLength={6}
                />
                <button
                  className="jph-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "◉" : "◎"}
                </button>
              </span>
              {mode === "signup" && (
                <span className="jph-strength">
                  <small>Password strength</small>
                  <span className="jph-strength-bars">
                    {[1, 2, 3, 4].map((n) => (
                      <i key={n} className={strength >= n ? "filled" : ""} />
                    ))}
                  </span>
                </span>
              )}
            </label>
            {mode === "signup" && (
              <>
                <label className="jph-field">
                  <span>
                    Phone <em>(optional)</em>
                  </span>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </label>
                <label className="jph-consent jph-glass-inset">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                  />
                  <span>
                    I agree to the <a href={termsUrl}>Terms of Use</a>,{" "}
                    <a href={guidelinesUrl}>Community Guidelines</a> and{" "}
                    <a href={privacyUrl}>Privacy Policy</a>.
                    <small>
                      PREPWIAN is an independent student-run initiative and is not affiliated
                      with NTA, the IITs or any government body.
                    </small>
                  </span>
                </label>
              </>
            )}
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />
            {mode === "signin" ? signInSecurity : signUpSecurity}
            <button type="submit" className="jph-primary-button" disabled={busy}>
              {busy ? (
                <>
                  <span className="jph-spinner" /> Please wait…
                </>
              ) : (
                <>
                  {mode === "signin" ? "Sign in" : "Create account"}{" "}
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </form>

          {mode === "signin" && (
            <button
              type="button"
              className="jph-guest-button jph-glass-control"
              onClick={() => runAction(onContinueAsGuest)}
              disabled={busy}
            >
              <span className="jph-guest-icon" aria-hidden="true">
                ◌
              </span>
              <span>
                <strong>Continue as Guest</strong>
                <small>Explore without an account</small>
              </span>
              <span className="jph-button-arrow" aria-hidden="true">
                →
              </span>
            </button>
          )}
          <p className="jph-switch-copy">
            {mode === "signin" ? "New to PREPWIAN?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => changeMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <p className="jph-auth-footnote">
            Secure sign-in <span>•</span> Built for your study journey
          </p>
        </section>
      </div>

      <footer className="jph-auth-footer">
        <span>
          <strong>Study</strong>
          <small>Learn at your pace</small>
        </span>
        <span>
          <strong>Practice</strong>
          <small>Build consistency</small>
        </span>
        <span>
          <strong>Progress</strong>
          <small>Keep moving forward</small>
        </span>
        <span>
          <strong>Community</strong>
          <small>Grow together</small>
        </span>
      </footer>
    </main>
  );
}
