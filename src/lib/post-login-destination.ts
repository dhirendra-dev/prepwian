export const POST_LOGIN_CHOICE_KEY = "jph:post-login-choice";
export const OAUTH_RETURN_PATH_KEY = "jph:oauth-return-path";

export function markPostLoginChoice() {
  try {
    window.sessionStorage.setItem(POST_LOGIN_CHOICE_KEY, "pending");
  } catch {
    // Storage can be disabled; the normal authentication redirect still works.
  }
}

export function clearPostLoginChoice() {
  try {
    window.sessionStorage.removeItem(POST_LOGIN_CHOICE_KEY);
    window.sessionStorage.removeItem(OAUTH_RETURN_PATH_KEY);
  } catch {
    // Nothing to clear when session storage is unavailable.
  }
}

export function consumePostLoginChoice() {
  try {
    const pending = window.sessionStorage.getItem(POST_LOGIN_CHOICE_KEY) === "pending";
    window.sessionStorage.removeItem(POST_LOGIN_CHOICE_KEY);
    return pending;
  } catch {
    return false;
  }
}
