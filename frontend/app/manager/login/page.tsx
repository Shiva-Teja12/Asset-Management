"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function ManagerLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role === "MANAGER") {
      router.replace("/manager/dashboard");
    }
  }, [router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await api(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      if (!response?.token) {
        throw new Error(
          "The backend did not return an authentication token."
        );
      }

      if (response.role !== "MANAGER") {
        throw new Error(
          "This account is not a Manager account."
        );
      }

      localStorage.setItem(
        "token",
        response.token
      );

      localStorage.setItem(
        "role",
        response.role
      );

      localStorage.setItem(
        "name",
        response.name || "Manager"
      );

      localStorage.setItem(
        "email",
        response.email || email.trim()
      );

      if (remember) {
        localStorage.setItem(
          "rememberManager",
          "true"
        );
      } else {
        localStorage.removeItem(
          "rememberManager"
        );
      }

      router.replace(
        "/manager/dashboard"
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Manager login failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.leftPanel}>
        <div style={styles.brandRow}>
          <div style={styles.brandMark}>
            C
          </div>

          <div>
            <div style={styles.brandTitle}>
              ENFEC ONE
            </div>

            <div style={styles.brandSub}>
              Asset Management
            </div>
          </div>
        </div>

        <div style={styles.heroContent}>
          <div style={styles.managerPill}>
            MANAGER PORTAL
          </div>

          <h1 style={styles.heroTitle}>
            Manage your team
            <br />
            with confidence.
          </h1>

          <p style={styles.heroText}>
            Review secondary device requests,
            monitor team assets and see repair
            reasons from one place.
          </p>

          <div style={styles.featureGrid}>
            <Feature
              title="Secondary Device Approvals"
              text="Approve or reject employee requests."
            />

            <Feature
              title="My Team"
              text="View team members and assigned assets."
            />

            <Feature
              title="Repair Visibility"
              text="See which device is in repair and why."
            />
          </div>
        </div>

        <div style={styles.leftFooter}>
          ENFEC ONE · Manager Asset Portal
        </div>
      </section>

      <section style={styles.rightPanel}>
        <form
          style={styles.card}
          onSubmit={handleSubmit}
        >
          <div style={styles.avatar}>
            M
          </div>

          <h2 style={styles.title}>
            Manager Sign In
          </h2>

          <p style={styles.subtitle}>
            Sign in with your manager account
            to continue.
          </p>

          <label style={styles.label}>
            Email
          </label>

          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="manager@enfec.local"
            autoComplete="email"
            required
          />

          <label style={styles.label}>
            Password
          </label>

          <div style={styles.passwordWrap}>
            <input
              style={{
                ...styles.input,
                marginBottom: 0,
                paddingRight: 76,
              }}
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              style={styles.showButton}
              onClick={() =>
                setShowPassword(
                  (current) => !current
                )
              }
            >
              {showPassword
                ? "Hide"
                : "Show"}
            </button>
          </div>

          <div style={styles.optionsRow}>
            <label
              style={styles.rememberLabel}
            >
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) =>
                  setRemember(
                    event.target.checked
                  )
                }
              />

              Remember me
            </label>

            <span
              style={styles.managerOnly}
            >
              Manager access only
            </span>
          </div>

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={styles.loginButton}
          >
            {loading
              ? "Signing in..."
              : "Sign In as Manager"}
          </button>

          <button
            type="button"
            style={styles.backButton}
            onClick={() =>
              router.push("/")
            }
          >
            Back to main sign in
          </button>
        </form>
      </section>
    </main>
  );
}

function Feature({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div style={styles.featureCard}>
      <div style={styles.featureDot} />

      <div>
        <div
          style={styles.featureTitle}
        >
          {title}
        </div>

        <div
          style={styles.featureText}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns:
      "minmax(360px, 44%) 1fr",
    background: "#f6f9fd",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    color: "#142033",
  },

  leftPanel: {
    minHeight: "100vh",
    background:
      "linear-gradient(150deg, #0e263d 0%, #123a5c 55%, #0c2943 100%)",
    color: "white",
    padding: "42px 52px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxSizing: "border-box",
  },

  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 999,
    border: "4px solid #1f8cff",
    color: "#1f8cff",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
  },

  brandTitle: {
    fontSize: 20,
    fontWeight: 850,
    letterSpacing: ".03em",
  },

  brandSub: {
    fontSize: 12,
    color: "#bcd0df",
    marginTop: 2,
  },

  heroContent: {
    maxWidth: 560,
  },

  managerPill: {
    display: "inline-flex",
    padding: "7px 11px",
    borderRadius: 999,
    background:
      "rgba(22,119,255,.18)",
    border:
      "1px solid rgba(91,162,255,.4)",
    color: "#a9d0ff",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: ".08em",
  },

  heroTitle: {
    fontSize: 48,
    lineHeight: 1.08,
    margin: "22px 0 14px",
    letterSpacing: "-.03em",
  },

  heroText: {
    fontSize: 17,
    lineHeight: 1.65,
    color: "#c7d8e6",
    maxWidth: 520,
  },

  featureGrid: {
    display: "grid",
    gap: 11,
    marginTop: 30,
  },

  featureCard: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    padding: "14px 16px",
    borderRadius: 10,
    background:
      "rgba(255,255,255,.055)",
    border:
      "1px solid rgba(255,255,255,.09)",
  },

  featureDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "#3194ff",
    marginTop: 5,
    flex: "0 0 auto",
  },

  featureTitle: {
    fontSize: 14,
    fontWeight: 750,
  },

  featureText: {
    fontSize: 12,
    color: "#bcd0df",
    marginTop: 3,
  },

  leftFooter: {
    fontSize: 12,
    color: "#94aec1",
  },

  rightPanel: {
    display: "grid",
    placeItems: "center",
    padding: 30,
  },

  card: {
    width: "min(430px, 100%)",
    background: "white",
    border:
      "1px solid #dce6f2",
    borderRadius: 16,
    padding: 34,
    boxSizing: "border-box",
    boxShadow:
      "0 18px 50px rgba(31,55,85,.10)",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 999,
    background: "#1677ff",
    color: "white",
    display: "grid",
    placeItems: "center",
    fontWeight: 850,
    fontSize: 20,
  },

  title: {
    fontSize: 28,
    margin: "18px 0 5px",
  },

  subtitle: {
    margin: "0 0 26px",
    color: "#667085",
    fontSize: 14,
  },

  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    margin: "14px 0 7px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border:
      "1px solid #ccd8e5",
    borderRadius: 8,
    padding: "12px 13px",
    fontSize: 14,
    outline: "none",
    background: "white",
    marginBottom: 2,
  },

  passwordWrap: {
    position: "relative",
  },

  showButton: {
    position: "absolute",
    right: 8,
    top: 7,
    border: 0,
    background: "#eef5ff",
    color: "#1677ff",
    borderRadius: 6,
    padding: "6px 9px",
    cursor: "pointer",
    fontWeight: 700,
  },

  optionsRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    margin: "16px 0",
  },

  rememberLabel: {
    display: "flex",
    gap: 7,
    alignItems: "center",
    color: "#475467",
    fontSize: 12,
  },

  managerOnly: {
    color: "#1677ff",
    fontSize: 11,
    fontWeight: 750,
  },

  error: {
    border:
      "1px solid #ffc8c8",
    background: "#fff0f0",
    color: "#b42318",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 13,
    marginBottom: 12,
  },

  loginButton: {
    width: "100%",
    border: 0,
    borderRadius: 8,
    padding: "12px 14px",
    background: "#1677ff",
    color: "white",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  },

  backButton: {
    width: "100%",
    border: 0,
    background: "transparent",
    color: "#667085",
    padding: "12px 14px 0",
    cursor: "pointer",
    fontWeight: 650,
  },
};