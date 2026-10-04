"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { CSSProperties } from "react";

type SideProps = {
  role: "admin" | "employee" | "vp";
};

type MenuItem = {
  label: string;
  href: string;
  icon: string;
};

export default function Side({ role }: SideProps) {
  const pathname = usePathname();
  const router = useRouter();

  // =========================================================
  // ASSET ADMIN MENU
  // =========================================================
  const adminMenu: MenuItem[] = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: "▦",
    },
    {
      label: "Assets",
      href: "/admin/assets",
      icon: "▣",
    },
    {
      label: "Asset Requests",
      href: "/admin/asset-requests",
      icon: "▤",
    },
    {
      label: "Employees",
      href: "/admin/employees",
      icon: "♟",
    },
    {
      label: "Tickets",
      href: "/admin/tickets",
      icon: "▤",
    },
    {
      label: "Reports",
      href: "/admin/reports",
      icon: "▥",
    },
    {
      label: "Audit Logs",
      href: "/admin/audit-logs",
      icon: "☷",
    },
  ];

  // =========================================================
  // EMPLOYEE MENU
  // =========================================================
  const employeeMenu: MenuItem[] = [
    {
      label: "Dashboard",
      href: "/employee",
      icon: "▦",
    },
    {
      label: "My Assets",
      href: "/employee/assets",
      icon: "▣",
    },
    {
      label: "My Requests",
      href: "/employee/requests",
      icon: "▤",
    },
    {
      label: "My Tickets",
      href: "/employee/tickets",
      icon: "▤",
    },
  ];

  // =========================================================
  // VP / HIGHER AUTHORITY MENU
  // =========================================================
  const vpMenu: MenuItem[] = [
    {
      label: "Dashboard",
      href: "/vp/dashboard",
      icon: "▦",
    },
    {
      label: "Asset Approvals",
      href: "/vp/approvals",
      icon: "✓",
    },
  ];

  // =========================================================
  // SELECT MENU
  // =========================================================
  const menu =
    role === "admin"
      ? adminMenu
      : role === "vp"
        ? vpMenu
        : employeeMenu;

  // =========================================================
  // ROLE TITLE
  // =========================================================
  const roleTitle =
    role === "admin"
      ? "ASSET ADMIN"
      : role === "vp"
        ? "VP / HIGHER AUTHORITY"
        : "EMPLOYEE PORTAL";

  // =========================================================
  // ACTIVE MENU CHECK
  // =========================================================
  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    if (href === "/employee") {
      return pathname === "/employee";
    }

    if (href === "/vp/dashboard") {
      return pathname === "/vp/dashboard";
    }

    if (href === "/employee/tickets") {
      return (
        pathname === "/employee/tickets" ||
        pathname.startsWith("/employee/tickets/")
      );
    }

    if (href === "/admin/asset-requests") {
      return (
        pathname === "/admin/asset-requests" ||
        pathname.startsWith("/admin/asset-requests/")
      );
    }

    if (href === "/vp/approvals") {
      return (
        pathname === "/vp/approvals" ||
        pathname.startsWith("/vp/approvals/")
      );
    }

    return (
      pathname === href ||
      pathname.startsWith(href + "/")
    );
  }

  // =========================================================
  // LOGOUT
  // =========================================================
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("email");

    router.push("/");
  }

  return (
    <aside style={styles.sidebar}>
      {/* LOGO */}
      <div style={styles.logoSection}>
        <div style={styles.logoIcon}>
          ◆
        </div>

        <div>
          <div style={styles.logoText}>
            ENFEC ONE
          </div>

          <div style={styles.logoSub}>
            Asset Management
          </div>
        </div>
      </div>

      <div style={styles.divider} />

      {/* ROLE TITLE */}
      <div style={styles.roleTitle}>
        {roleTitle}
      </div>

      {/* NAVIGATION */}
      <nav style={styles.nav}>
        {menu.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...styles.link,
                ...(active
                  ? styles.activeLink
                  : {}),
              }}
            >
              <span style={styles.menuIcon}>
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* BOTTOM SECTION */}
      <div style={styles.bottom}>
        <div style={styles.helpBox}>
          <div style={styles.helpIcon}>
            ?
          </div>

          <div>
            <div style={styles.helpTitle}>
              Need help?
            </div>

            <div style={styles.helpText}>
              Contact support
            </div>
          </div>
        </div>

        <button
          type="button"
          style={styles.logout}
          onClick={logout}
        >
          <span style={styles.logoutIcon}>
            ↪
          </span>

          Logout
        </button>
      </div>
    </aside>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles: Record<string, CSSProperties> = {
  sidebar: {
    width: "270px",
    minWidth: "270px",
    minHeight: "100vh",
    backgroundColor: "#0d2a40",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },

  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "30px 28px 25px",
  },

  logoIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "9px",
    backgroundColor: "#1473e6",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "13px",
  },

  logoText: {
    fontSize: "20px",
    fontWeight: 800,
    letterSpacing: "0.4px",
  },

  logoSub: {
    color: "#9eb2c5",
    fontSize: "12px",
    marginTop: "3px",
  },

  divider: {
    height: "1px",
    backgroundColor:
      "rgba(255,255,255,0.08)",
  },

  roleTitle: {
    color: "#7f9ab1",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "1.4px",
    padding: "23px 28px 13px",
  },

  nav: {
    padding: "0 17px",
  },

  link: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minHeight: "50px",
    padding: "0 18px",
    marginBottom: "5px",
    borderRadius: "9px",
    color: "#c6d3df",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 500,
    boxSizing: "border-box",
  },

  activeLink: {
    backgroundColor: "#1473e6",
    color: "#ffffff",
    fontWeight: 700,
  },

  menuIcon: {
    width: "20px",
    textAlign: "center",
    fontSize: "15px",
  },

  bottom: {
    marginTop: "auto",
    padding: "16px 19px 20px",
    borderTop:
      "1px solid rgba(255,255,255,0.08)",
  },

  helpBox: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    backgroundColor:
      "rgba(255,255,255,0.06)",
    padding: "12px",
    borderRadius: "9px",
    marginBottom: "14px",
  },

  helpIcon: {
    width: "31px",
    height: "31px",
    borderRadius: "50%",
    backgroundColor:
      "rgba(255,255,255,0.10)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },

  helpTitle: {
    fontSize: "12px",
    fontWeight: 700,
  },

  helpText: {
    color: "#91a7ba",
    fontSize: "10px",
    marginTop: "2px",
  },

  logout: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "13px",
    border: "none",
    backgroundColor: "transparent",
    color: "#c6d3df",
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: "14px",
    textAlign: "left",
  },

  logoutIcon: {
    fontSize: "18px",
  },
};