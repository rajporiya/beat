import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Check, Eye, EyeOff, Loader2, TriangleAlert, X } from "lucide-react";
import BeatMusicLogo from "@/components/c/BeatMusicLogo";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  PASSWORD_RULES,
  getConfirmPasswordError,
  getEmailError,
  getLoginPasswordError,
  getNameError,
  getPasswordError,
  type AuthFormValues,
} from "@/lib/authValidation";

const labelClass = "block text-sm font-semibold";
const inputBase =
  "mt-2 w-full rounded-md border bg-[#242424] p-3 pr-12 outline-none transition-colors placeholder:text-zinc-500";
const normalInputClass = "border-zinc-600 focus:border-[#22c55e]";
const errorInputClass = "border-red-500 focus:border-red-400";

const defaultValues: AuthFormValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-400"
    >
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

function PasswordToggle({
  visible,
  onToggle,
  label,
}: {
  visible: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      aria-label={label}
      title={label}
      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-zinc-400 transition-colors hover:text-white"
    >
      {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );
}

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const registerUser = useAuthStore((state) => state.register);
  const isAuthLoading = useAuthStore((state) => state.isLoading);

  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setError,
    reset,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    defaultValues,
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });

  const passwordValue = watch("password");
  const isBusy = isSubmitting || isAuthLoading;

  // Reset the form completely when switching between login and register.
  useEffect(() => {
    reset(defaultValues);
    setServerError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [mode, reset]);

  // Keep the "confirm password" error in sync when the password changes.
  useEffect(() => {
    if (!isLogin && getValues("confirmPassword")) {
      void trigger("confirmPassword");
    }
  }, [passwordValue, isLogin, getValues, trigger]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    try {
      if (isLogin) {
        await login({
          email: values.email.trim().toLowerCase(),
          password: values.password,
        });
      } else {
        await registerUser({
          name: values.name.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
          confirmPassword: values.confirmPassword,
        });
      }

      navigate("/home");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Authentication failed. Please try again.";
      const lowerMessage = message.toLowerCase();

      let field: keyof AuthFormValues | null = null;

      if (lowerMessage.includes("already exists")) {
        field = "email";
      } else if (lowerMessage.includes("passwords do not match")) {
        field = "confirmPassword";
      } else if (
        /email address|email must|email cannot|part before @|email domain/.test(
          lowerMessage,
        )
      ) {
        field = "email";
      } else if (/full name|name must|name can only/.test(lowerMessage)) {
        field = "name";
      } else if (
        /password must|password cannot|create a password|uppercase letter|lowercase letter|at least one number|special character/.test(
          lowerMessage,
        )
      ) {
        field = "password";
      }

      if (field) {
        setError(field, { type: "server", message });
      } else {
        setServerError(message);
      }
    }
  });

  const passwordChecks = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(passwordValue || ""),
  }));

  return (
    <main className="grid min-h-screen place-items-center bg-[#121212] p-5 text-white">
      <section className="w-full max-w-md rounded-2xl bg-[#181818] p-7 shadow-2xl sm:p-9">
        <div className="mb-8 flex flex-col items-center">
          <BeatMusicLogo className="size-12" />
          <h1 className="mt-4 text-center text-3xl font-black">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-center text-sm text-zinc-400">
            {isLogin
              ? "Log in to continue listening."
              : "Continue your sound journey with Beat Music."}
          </p>
        </div>

        <form
          noValidate
          onSubmit={onSubmit}
          onChange={() => setServerError(null)}
          className="space-y-4"
        >
          {!isLogin && (
            <div>
              <label className={labelClass} htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
                className={`${inputBase} ${errors.name ? errorInputClass : normalInputClass}`}
                {...register("name", { validate: getNameError })}
              />
              <FieldError id="name-error" message={errors.name?.message} />
            </div>
          )}

          <div>
            <label className={labelClass} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              placeholder="name@example.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={`${inputBase} ${errors.email ? errorInputClass : normalInputClass}`}
              {...register("email", { validate: getEmailError })}
            />
            <FieldError id="email-error" message={errors.email?.message} />
          </div>

          <div>
            <label className={labelClass} htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                placeholder={isLogin ? "Enter your password" : "Create a password"}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
                className={`${inputBase} ${errors.password ? errorInputClass : normalInputClass}`}
                {...register("password", {
                  validate: isLogin ? getLoginPasswordError : getPasswordError,
                })}
              />
              <PasswordToggle
                visible={showPassword}
                onToggle={() => setShowPassword((previous) => !previous)}
                label={showPassword ? "Hide password" : "Show password"}
              />
            </div>
            <FieldError id="password-error" message={errors.password?.message} />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className={labelClass} htmlFor="confirmPassword">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={
                      errors.confirmPassword ? "confirm-password-error" : undefined
                    }
                    className={`${inputBase} ${
                      errors.confirmPassword ? errorInputClass : normalInputClass
                    }`}
                    {...register("confirmPassword", {
                      validate: (value) =>
                        getConfirmPasswordError(value, getValues("password")),
                    })}
                  />
                  <PasswordToggle
                    visible={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((previous) => !previous)}
                    label={
                      showConfirmPassword ? "Hide confirm password" : "Show confirm password"
                    }
                  />
                </div>
                <FieldError
                  id="confirm-password-error"
                  message={errors.confirmPassword?.message}
                />
              </div>

              <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
                <p className="text-xs font-semibold text-zinc-300">
                  Password must include:
                </p>
                <ul className="mt-2 grid gap-x-3 gap-y-1.5 sm:grid-cols-2">
                  {passwordChecks.map((rule) => (
                    <li
                      key={rule.id}
                      className={`flex items-center gap-1.5 text-xs ${
                        rule.passed ? "text-emerald-400" : "text-zinc-500"
                      }`}
                    >
                      {rule.passed ? (
                        <Check className="size-3.5 shrink-0" />
                      ) : (
                        <X className="size-3.5 shrink-0" />
                      )}
                      <span>{rule.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isBusy}
            className="flex w-full cursor-pointer items-center justify-center rounded-full bg-[#22c55e] py-3 font-bold text-black hover:bg-[#3be477] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBusy && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isLogin ? "Log in" : "Create account"}
          </button>
        </form>

        {serverError && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <p className="mt-7 text-center text-sm text-zinc-400">
          {isLogin ? "New to Beat Music?" : "Already have an account?"}{" "}
          <Link
            className="font-bold text-white underline"
            to={isLogin ? "/register" : "/login"}
          >
            {isLogin ? "Create account" : "Log in"}
          </Link>
        </p>
      </section>
    </main>
  );
}
