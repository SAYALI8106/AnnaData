import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { Leaf, Eye, EyeOff, Loader2, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Mode = "login" | "signup" | "reset";

const FIREBASE_ERRORS: Record<string, string> = {
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/network-request-failed": "Network error. Check your connection.",
};

const getErrorMessage = (code: string) =>
  FIREBASE_ERRORS[code] ?? "Something went wrong. Please try again.";

const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email.";

    if (mode !== "reset") {
      if (!password) e.password = "Password is required.";
      else if (password.length < 6) e.password = "At least 6 characters.";
    }

    if (mode === "signup") {
      if (!name.trim()) e.name = "Name is required.";
      if (password !== confirmPassword) e.confirmPassword = "Passwords do not match.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Welcome back! 👋", description: "You're now logged in." });
        navigate("/dashboard");
      } else if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name.trim() });
        toast({ title: "Account created! 🚀", description: "Welcome to FoodBridge." });
        navigate("/dashboard");
      } else {
        await sendPasswordResetEmail(auth, email);
        toast({
          title: "Reset email sent 📧",
          description: "Check your inbox for a password reset link.",
        });
        setMode("login");
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      toast({
        title: "Error",
        description: getErrorMessage(code),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setErrors({});
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-2xl text-foreground">FoodBridge</span>
          </Link>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === "login" && "Sign in to your account"}
            {mode === "signup" && "Create your free account"}
            {mode === "reset" && "Reset your password"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 space-y-5">
          {/* Tab switcher */}
          {mode !== "reset" && (
            <div className="flex bg-muted rounded-lg p-1 gap-1">
              {(["login", "signup"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all capitalize ${
                    mode === m
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
          )}

          {mode === "reset" && (
            <div>
              <h2 className="text-lg font-semibold">Forgot your password?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your email and we'll send you a reset link.
              </p>
            </div>
          )}

          {/* Name (signup only) */}
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="John Doe"
                  className="pl-9"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {/* Password */}
          {mode !== "reset" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => switchMode("reset")}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
          )}

          {/* Confirm Password (signup only) */}
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* Submit */}
          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {mode === "login" ? "Signing in..." : mode === "signup" ? "Creating account..." : "Sending..."}
              </span>
            ) : (
              <>
                {mode === "login" && "Sign In"}
                {mode === "signup" && "Create Account"}
                {mode === "reset" && "Send Reset Link"}
              </>
            )}
          </Button>

          {/* Back link for reset mode */}
          {mode === "reset" && (
            <p className="text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <button
                onClick={() => switchMode("login")}
                className="text-primary hover:underline font-medium"
              >
                Back to sign in
              </button>
            </p>
          )}

          {/* Terms */}
          {mode === "signup" && (
            <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to our{" "}
              <span className="text-primary hover:underline cursor-pointer">Terms of Service</span>{" "}
              and{" "}
              <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
