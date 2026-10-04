"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type Role =
  | "ASSET_ADMIN"
  | "MANAGER"
  | "EMPLOYEE"
  | "HR_ADMIN"
  | "FINANCE"
  | "VP";

type Mode = "LOGIN" | "SIGNUP";

interface RoleConfig {
  label: string;
  email: string;
  password: string;
  redirect: string;
  demoLabel: string;
}

const ROLE_CONFIG: Record<Role, RoleConfig> = {
  ASSET_ADMIN: {
    label: "Asset Admin",
    email: "admin@enfec.local",
    password: "ChangeMe123!",
    redirect: "/admin",
    demoLabel: "Demo asset admin",
  },

  MANAGER: {
    label: "Manager",
    email: "vikram@enfec.local",
    password: "ChangeMe123!",
    redirect: "/manager/dashboard",
    demoLabel: "Demo manager",
  },

  EMPLOYEE: {
    label: "Employee",
    email: "",
    password: "",
    redirect: "/employee",
    demoLabel: "",
  },

  HR_ADMIN: {
    label: "HR Admin",
    email: "hradmin@enfec.local",
    password: "ChangeMe123!",
    redirect: "/hr-admin/dashboard",
    demoLabel: "Demo HR admin",
  },

  FINANCE: {
    label: "Finance",
    email: "finance@enfec.local",
    password: "ChangeMe123!",
    redirect: "/finance/dashboard",
    demoLabel: "Demo finance",
  },

  VP: {
    label: "VP",
    email: "vp@enfec.local",
    password: "ChangeMe123!",
    redirect: "/vp/dashboard",
    demoLabel: "Demo VP",
  },
};

export default function HomePage() {
  const router = useRouter();

  const [mode, setMode] =
    useState<Mode>("LOGIN");

  const [role, setRole] =
    useState<Role>("ASSET_ADMIN");

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState(
      ROLE_CONFIG.ASSET_ADMIN.email
    );

  const [password, setPassword] =
    useState(
      ROLE_CONFIG.ASSET_ADMIN.password
    );

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * =========================================================
   * CHANGE LOGIN ROLE
   * =========================================================
   */
  function changeRole(
    selectedRole: Role
  ) {
    setRole(selectedRole);
    setError("");

    const config =
      ROLE_CONFIG[selectedRole];

    setEmail(config.email);
    setPassword(config.password);
  }

  /*
   * =========================================================
   * LOGIN
   * =========================================================
   */
  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response =
        await api(
          "/api/auth/login",
          {
            method: "POST",

            body: JSON.stringify({
              email: email.trim(),
              password,
            }),
          }
        );

      if (!response) {
        throw new Error(
          "No response received from server."
        );
      }

      if (!response.token) {
        throw new Error(
          "Login succeeded but token was not returned."
        );
      }

      /*
       * =====================================================
       * VERIFY SELECTED PORTAL ROLE
       * =====================================================
       */
      if (
        response.role !== role
      ) {
        setError(
          `This account is not a ${ROLE_CONFIG[role].label} account.`
        );

        return;
      }

      /*
       * =====================================================
       * SAVE AUTHENTICATION INFORMATION
       * =====================================================
       */
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
        response.name || ""
      );

      localStorage.setItem(
        "email",
        response.email ||
          email.trim()
      );

      /*
       * =====================================================
       * ROLE BASED REDIRECTION
       * =====================================================
       */
      const loggedInRole =
        response.role as Role;

      const roleConfig =
        ROLE_CONFIG[loggedInRole];

      if (!roleConfig) {
        throw new Error(
          `Unsupported role: ${response.role}`
        );
      }

      router.push(
        roleConfig.redirect
      );

    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Login failed."
      );

    } finally {
      setLoading(false);
    }
  }

  /*
   * =========================================================
   * EMPLOYEE SIGNUP
   * =========================================================
   */
  async function handleSignup(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    if (!name.trim()) {
      setError(
        "Full name is required."
      );

      setLoading(false);

      return;
    }

    if (!email.trim()) {
      setError(
        "Company email is required."
      );

      setLoading(false);

      return;
    }

    if (!password) {
      setError(
        "Password is required."
      );

      setLoading(false);

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      setLoading(false);

      return;
    }

    try {
      await api(
        "/api/auth/signup",
        {
          method: "POST",

          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      /*
       * Signup remains employee-only.
       */
      setMode("LOGIN");
      setRole("EMPLOYEE");
      setName("");
      setPassword("");
      setConfirmPassword("");
      setError("");

    } catch (err) {
      console.error(
        "Signup error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Signup failed."
      );

    } finally {
      setLoading(false);
    }
  }

  /*
   * =========================================================
   * OPEN LOGIN
   * =========================================================
   */
  function openLogin() {
    setMode("LOGIN");
    setError("");

    const config =
      ROLE_CONFIG[role];

    setEmail(config.email);
    setPassword(config.password);
  }

  /*
   * =========================================================
   * OPEN EMPLOYEE SIGNUP
   * =========================================================
   */
  function openSignup() {
    setMode("SIGNUP");

    setRole("EMPLOYEE");

    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
  }

  /*
   * =========================================================
   * CURRENT ROLE INFORMATION
   * =========================================================
   */
  const currentRoleConfig =
    ROLE_CONFIG[role];

  return (
    <main className="loginPage">

      {/* ================================================= */}
      {/* LEFT SIDE                                         */}
      {/* ================================================= */}

      <section className="welcomePanel">

        <div className="brand">

          <div className="brandIcon">
            ◆
          </div>

          <span>
            ENFEC OWN
          </span>

        </div>

        <div className="welcomeContent">

          <h1>
            Welcome to
            <br />
            Asset Management
          </h1>

          <p>
            Manage and track company assets
            <br />
            efficiently
          </p>

          <div className="assetIllustration">

            <div
              className="illustrationCircle"
            />

            <div className="laptop">

              <div className="laptopScreen">

                <div
                  className="screenGlow"
                />

              </div>

              <div
                className="laptopBase"
              />

            </div>

            <div
              className="mouseShape"
            />

            <div
              className="gear gearOne"
            >
              ⚙
            </div>

            <div
              className="gear gearTwo"
            >
              ⚙
            </div>

          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* RIGHT SIDE                                        */}
      {/* ================================================= */}

      <section className="formPanel">

        <div className="authCard">

          {/* ============================================= */}
          {/* LOGIN / SIGNUP TABS                           */}
          {/* ============================================= */}

          <div className="modeTabs">

            <button
              type="button"
              className={
                mode === "LOGIN"
                  ? "activeTab"
                  : ""
              }
              onClick={openLogin}
            >
              Login
            </button>

            <button
              type="button"
              className={
                mode === "SIGNUP"
                  ? "activeTab"
                  : ""
              }
              onClick={openSignup}
            >
              Sign Up
            </button>

          </div>

          {/* ============================================= */}
          {/* LOGIN                                         */}
          {/* ============================================= */}

          {mode === "LOGIN" && (
            <>

              {/* ========================================= */}
              {/* SIX ROLE LOGIN OPTIONS                    */}
              {/* ========================================= */}

              <div
                className="roleTabs"
                style={{
                  gridTemplateColumns:
                    "repeat(3, minmax(0, 1fr))",
                  gap: "10px",
                }}
              >

                {/* ======================================= */}
                {/* ASSET ADMIN                             */}
                {/* ======================================= */}

                <button
                  type="button"
                  className={
                    role ===
                    "ASSET_ADMIN"
                      ? "activeRole"
                      : ""
                  }
                  onClick={() =>
                    changeRole(
                      "ASSET_ADMIN"
                    )
                  }
                >
                  Asset Admin
                </button>

                {/* ======================================= */}
                {/* MANAGER                                 */}
                {/* ======================================= */}

                <button
                  type="button"
                  className={
                    role ===
                    "MANAGER"
                      ? "activeRole"
                      : ""
                  }
                  onClick={() =>
                    changeRole(
                      "MANAGER"
                    )
                  }
                >
                  Manager
                </button>

                {/* ======================================= */}
                {/* EMPLOYEE                                */}
                {/* ======================================= */}

                <button
                  type="button"
                  className={
                    role ===
                    "EMPLOYEE"
                      ? "activeRole"
                      : ""
                  }
                  onClick={() =>
                    changeRole(
                      "EMPLOYEE"
                    )
                  }
                >
                  Employee
                </button>

                {/* ======================================= */}
                {/* HR ADMIN                                */}
                {/* ======================================= */}

                <button
                  type="button"
                  className={
                    role ===
                    "HR_ADMIN"
                      ? "activeRole"
                      : ""
                  }
                  onClick={() =>
                    changeRole(
                      "HR_ADMIN"
                    )
                  }
                >
                  HR Admin
                </button>

                {/* ======================================= */}
                {/* FINANCE                                 */}
                {/* ======================================= */}

                <button
                  type="button"
                  className={
                    role ===
                    "FINANCE"
                      ? "activeRole"
                      : ""
                  }
                  onClick={() =>
                    changeRole(
                      "FINANCE"
                    )
                  }
                >
                  Finance
                </button>

                {/* ======================================= */}
                {/* VP                                      */}
                {/* ======================================= */}

                <button
                  type="button"
                  className={
                    role ===
                    "VP"
                      ? "activeRole"
                      : ""
                  }
                  onClick={() =>
                    changeRole(
                      "VP"
                    )
                  }
                >
                  VP
                </button>

              </div>

              {/* ========================================= */}
              {/* LOGIN FORM                                */}
              {/* ========================================= */}

              <form
                onSubmit={
                  handleLogin
                }
              >

                <label
                  htmlFor="loginEmail"
                >
                  Email
                </label>

                <input
                  id="loginEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(
                    event
                  ) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  required
                />

                <label
                  htmlFor="loginPassword"
                >
                  Password
                </label>

                <input
                  id="loginPassword"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(
                    event
                  ) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  required
                />

                <div
                  className="loginOptions"
                >

                  <label
                    className="remember"
                  >

                    <input
                      type="checkbox"
                    />

                    <span>
                      Remember me
                    </span>

                  </label>

                  <button
                    type="button"
                    className="linkButton"
                  >
                    Forgot password?
                  </button>

                </div>

                {/* ======================================= */}
                {/* ERROR                                   */}
                {/* ======================================= */}

                {error && (
                  <div
                    className="errorMessage"
                  >
                    {error}
                  </div>
                )}

                {/* ======================================= */}
                {/* LOGIN BUTTON                            */}
                {/* ======================================= */}

                <button
                  type="submit"
                  className="primaryButton"
                  disabled={loading}
                >
                  {loading
                    ? "Logging in..."
                    : `Login as ${currentRoleConfig.label}`}
                </button>

                {/* ======================================= */}
                {/* DEMO CREDENTIALS                        */}
                {/* ======================================= */}

                {role !== "EMPLOYEE" &&
                  currentRoleConfig.email && (
                    <p
                      className="demoText"
                    >
                      {currentRoleConfig.demoLabel}:{" "}
                      {currentRoleConfig.email}
                      {" / "}
                      {
                        currentRoleConfig.password
                      }
                    </p>
                  )}

                {/* ======================================= */}
                {/* EMPLOYEE SIGNUP LINK                    */}
                {/* ======================================= */}

                <p
                  className="bottomText"
                >
                  New employee?{" "}

                  <button
                    type="button"
                    className="linkButton"
                    onClick={
                      openSignup
                    }
                  >
                    Sign up here
                  </button>

                </p>

              </form>

            </>
          )}

          {/* ============================================= */}
          {/* EMPLOYEE SIGNUP                               */}
          {/* ============================================= */}

          {mode === "SIGNUP" && (

            <form
              onSubmit={
                handleSignup
              }
            >

              <div
                className="employeeBadge"
              >
                Employee Registration
              </div>

              <label
                htmlFor="fullName"
              >
                Full Name
              </label>

              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(
                  event
                ) =>
                  setName(
                    event.target.value
                  )
                }
                required
              />

              <label
                htmlFor="signupEmail"
              >
                Company Email
              </label>

              <input
                id="signupEmail"
                type="email"
                placeholder="Enter your company email"
                value={email}
                onChange={(
                  event
                ) =>
                  setEmail(
                    event.target.value
                  )
                }
                required
              />

              <label
                htmlFor="signupPassword"
              >
                Password
              </label>

              <input
                id="signupPassword"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(
                  event
                ) =>
                  setPassword(
                    event.target.value
                  )
                }
                required
              />

              <label
                htmlFor="confirmPassword"
              >
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={
                  confirmPassword
                }
                onChange={(
                  event
                ) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                required
              />

              {error && (
                <div
                  className="errorMessage"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="primaryButton"
                disabled={loading}
              >
                {loading
                  ? "Creating Account..."
                  : "Create Account"}
              </button>

              <p
                className="bottomText"
              >
                Already have an
                account?{" "}

                <button
                  type="button"
                  className="linkButton"
                  onClick={
                    openLogin
                  }
                >
                  Login
                </button>

              </p>

            </form>

          )}

        </div>

      </section>

    </main>
  );
}