import type { ReactNode } from "react";

export type AuthTheme = "dark" | "light";
export type AuthMode = "signin" | "signup";

export interface AuthPageProps {
  theme?: AuthTheme;
  onBackHome?: () => void;
  onSignIn: (input: { email: string; password: string; honeypot?: string }) => Promise<void>;
  onSignUp: (input: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    acceptedTerms: boolean;
    honeypot?: string;
  }) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  onContinueAsGuest: () => Promise<void>;
  onForgotPassword?: (email: string) => Promise<void>;
  onThemeChange?: (theme: AuthTheme) => void;
  signInSecurity?: ReactNode;
  signUpSecurity?: ReactNode;
  termsUrl?: string;
  privacyUrl?: string;
  guidelinesUrl?: string;
}
