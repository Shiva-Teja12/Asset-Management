"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Side from "@/components/Side";
import { api } from "@/lib/api";

interface Asset {
  id: number | string;
  assetTag?: string;
  name?: string;
  category?: string;
  serialNumber?: string;
  status?: string;
}

interface Employee {
  id: number | string;
  name?: string;
  email?: string;
  department?: string;
}

interface Ticket {
  id: number | string;
  subject?: string;
  type?: string;
  status?: string;
  createdAt?: string;
  employeeName?: string;
}

function toArray<T>(data: any): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function readableStatus(status?: string) {
  if (!status) {
    return "-";
  }

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusColor(status?: string) {
  switch (status) {
    case "IN_STOCK":
      return {
        background: "#e8f8f0",
        color: "#14804a",
      };

    case "ASSIGNED":
      return {
        background: "#e8f1ff",
        color: "#1769d2",
      };

    case "IN_REPAIR":
      return {
        background: "#fff5df",
        color: "#b7791f",
      };

    case "RETIRED":
      return {
        background: "#fdecec",
        color: "#d64545",
      };

    case "OPEN":
      return {
        background: "#fff5df",
        color: "#b7791f",
      };

    case "IN_PROGRESS":
      return {
        background: "#e8f1ff",
        color: "#1769d2",
      };

    case "RESOLVED":
      return {
        background: "#e8f8f0",
        color: "#14804a",
      };

    case "REJECTED":
      return {
        background: "#fdecec",
        color: "#d64545",
      };

    default:
      return {
        background: "#eef2f7",
        color: "#526276",
      };
  }
}

export default function AdminDashboard() {
  const router = useRouter();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const [adminName, setAdminName] = useState("Asset Admin");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const storedName = localStorage.getItem("name");

    if (!token) {
      router.replace("/");
      return;
    }

    if (role !== "ASSET_ADMIN") {
      router.replace("/employee");
      return;
    }

    if (storedName) {
      setAdminName(storedName);
    }

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const results = await Promise.allSettled([
          api("/api/v1/assets"),
          api("/api/v1/employees"),
          api("/api/v1/tickets"),
        ]);

        const assetsResult = results[0];
        const employeesResult = results[1];
        const ticketsResult = results[2];

        if (assetsResult.status === "fulfilled") {
          setAssets(
            toArray<Asset>(assetsResult.value)
          );
        } else {
          console.error(
            "Assets request failed:",
            assetsResult.reason
          );
        }

        if (employeesResult.status === "fulfilled") {
          setEmployees(
            toArray<Employee>(employeesResult.value)
          );
        } else {
          console.error(
            "Employees request failed:",
            employeesResult.reason
          );
        }

        if (ticketsResult.status === "fulfilled") {
          setTickets(
            toArray<Ticket>(ticketsResult.value)
          );
        } else {
          console.error(
            "Tickets request failed:",
            ticketsResult.reason
          );
        }

        if (
          results.every(
            (result) => result.status === "rejected"
          )
        ) {
          setError(
            "Dashboard data could not be loaded. Make sure the backend is running on port 8086."
          );
        }
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, [router]);

  const totalAssets = assets.length;

  const inStock = assets.filter(
    (asset) => asset.status === "IN_STOCK"
  ).length;

  const assigned = assets.filter(
    (asset) => asset.status === "ASSIGNED"
  ).length;

  const inRepair = assets.filter(
    (asset) => asset.status === "IN_REPAIR"
  ).length;

  const retired = assets.filter(
    (asset) => asset.status === "RETIRED"
  ).length;

  const openTickets = tickets.filter(
    (ticket) =>
      ticket.status === "OPEN" ||
      ticket.status === "IN_PROGRESS"
  ).length;

  return (
    <div style={styles.shell}>
      <Side role="admin" />

      <main style={styles.main}>
        {/* TOP HEADER */}

        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Dashboard
            </h1>

            <p style={styles.subtitle}>
              Welcome back, {adminName}. Here&apos;s your
              asset overview.
            </p>
          </div>

          <div style={styles.headerRight}>
            <div style={styles.searchBox}>
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search..."
                style={styles.searchInput}
              />
            </div>

            <button
              type="button"
              style={styles.notificationButton}
              title="Notifications"
            >
              🔔
            </button>

            <div style={styles.userBox}>
              <div style={styles.avatar}>
                {adminName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <div style={styles.userName}>
                  {adminName}
                </div>

                <div style={styles.userRole}>
                  Asset Admin
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ERROR */}

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div style={styles.loadingBox}>
            Loading dashboard...
          </div>
        )}

        {/* STAT CARDS */}

        <section style={styles.statsGrid}>
          <StatCard
            title="Total Assets"
            value={totalAssets}
            icon="▣"
            iconBackground="#eaf2ff"
          />

          <StatCard
            title="In Stock"
            value={inStock}
            icon="✓"
            iconBackground="#e8f8f0"
          />

          <StatCard
            title="Assigned"
            value={assigned}
            icon="↗"
            iconBackground="#e8f1ff"
          />

          <StatCard
            title="In Repair"
            value={inRepair}
            icon="⚙"
            iconBackground="#fff5df"
          />

          <StatCard
            title="Retired"
            value={retired}
            icon="×"
            iconBackground="#fdecec"
          />
        </section>

        {/* SECOND ROW */}

        <section style={styles.twoColumns}>
          {/* ASSET STATUS */}

          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>
                  Asset Status
                </h2>

                <p style={styles.panelSubtitle}>
                  Current lifecycle distribution
                </p>
              </div>

              <button
                type="button"
                style={styles.viewButton}
                onClick={() =>
                  router.push("/admin/assets")
                }
              >
                View Assets
              </button>
            </div>

            <div style={styles.statusContent}>
              <div style={styles.circleContainer}>
                <div style={styles.bigCircle}>
                  <div style={styles.innerCircle}>
                    <strong style={styles.circleNumber}>
                      {totalAssets}
                    </strong>

                    <span style={styles.circleText}>
                      Assets
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.legend}>
                <LegendItem
                  label="In Stock"
                  value={inStock}
                  symbol="●"
                />

                <LegendItem
                  label="Assigned"
                  value={assigned}
                  symbol="●"
                />

                <LegendItem
                  label="In Repair"
                  value={inRepair}
                  symbol="●"
                />

                <LegendItem
                  label="Retired"
                  value={retired}
                  symbol="●"
                />
              </div>
            </div>
          </div>

          {/* QUICK SUMMARY */}

          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>
                  Quick Summary
                </h2>

                <p style={styles.panelSubtitle}>
                  Asset management overview
                </p>
              </div>
            </div>

            <div style={styles.summaryList}>
              <SummaryItem
                title="Employees"
                value={employees.length}
                description="Registered employees"
                icon="👥"
              />

              <SummaryItem
                title="Open Tickets"
                value={openTickets}
                description="Require attention"
                icon="🎫"
              />

              <SummaryItem
                title="Assigned Assets"
                value={assigned}
                description="Currently in use"
                icon="💻"
              />

              <SummaryItem
                title="Assets In Repair"
                value={inRepair}
                description="Under maintenance"
                icon="🔧"
              />
            </div>
          </div>
        </section>

        {/* RECENT TICKETS */}

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>
                Recent Tickets
              </h2>

              <p style={styles.panelSubtitle}>
                Latest employee asset requests
              </p>
            </div>

            <button
              type="button"
              style={styles.viewButton}
              onClick={() =>
                router.push("/admin/tickets")
              }
            >
              View All
            </button>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>
                    Ticket
                  </th>

                  <th style={styles.th}>
                    Type
                  </th>

                  <th style={styles.th}>
                    Employee
                  </th>

                  <th style={styles.th}>
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={styles.emptyCell}
                    >
                      {loading
                        ? "Loading tickets..."
                        : "No tickets found."}
                    </td>
                  </tr>
                ) : (
                  tickets
                    .slice(0, 5)
                    .map((ticket) => (
                      <tr key={ticket.id}>
                        <td style={styles.td}>
                          <strong>
                            {ticket.subject ||
                              `Ticket #${ticket.id}`}
                          </strong>
                        </td>

                        <td style={styles.td}>
                          {readableStatus(
                            ticket.type
                          )}
                        </td>

                        <td style={styles.td}>
                          {ticket.employeeName ||
                            "-"}
                        </td>

                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.badge,
                              ...statusColor(
                                ticket.status
                              ),
                            }}
                          >
                            {readableStatus(
                              ticket.status
                            )}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  iconBackground,
}: {
  title: string;
  value: number;
  icon: string;
  iconBackground: string;
}) {
  return (
    <div style={styles.statCard}>
      <div>
        <p style={styles.statLabel}>
          {title}
        </p>

        <div style={styles.statValue}>
          {value}
        </div>
      </div>

      <div
        style={{
          ...styles.statIcon,
          background: iconBackground,
        }}
      >
        {icon}
      </div>
    </div>
  );
}

function LegendItem({
  label,
  value,
  symbol,
}: {
  label: string;
  value: number;
  symbol: string;
}) {
  return (
    <div style={styles.legendItem}>
      <div style={styles.legendLabel}>
        <span>{symbol}</span>
        <span>{label}</span>
      </div>

      <strong>{value}</strong>
    </div>
  );
}

function SummaryItem({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: string;
}) {
  return (
    <div style={styles.summaryItem}>
      <div style={styles.summaryIcon}>
        {icon}
      </div>

      <div style={{ flex: 1 }}>
        <div style={styles.summaryTitle}>
          {title}
        </div>

        <div style={styles.summaryDescription}>
          {description}
        </div>
      </div>

      <strong style={styles.summaryValue}>
        {value}
      </strong>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "#f5f8fc",
  },

  main: {
    flex: 1,
    minWidth: 0,
    padding: "30px",
    overflowX: "hidden",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "28px",
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    color: "#14283d",
    fontWeight: 700,
  },

  subtitle: {
    margin: "7px 0 0",
    color: "#7a899a",
    fontSize: "14px",
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  searchBox: {
    width: "230px",
    height: "42px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#ffffff",
    border: "1px solid #e1e7ef",
    borderRadius: "9px",
    padding: "0 13px",
  },

  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "14px",
  },

  notificationButton: {
    width: "42px",
    height: "42px",
    borderRadius: "9px",
    border: "1px solid #e1e7ef",
    background: "#ffffff",
    cursor: "pointer",
  },

  userBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#1473e6",
    color: "#ffffff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: 700,
  },

  userName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#1d2d3e",
  },

  userRole: {
    fontSize: "12px",
    color: "#8794a3",
    marginTop: "2px",
  },

  errorBox: {
    background: "#fff0f0",
    border: "1px solid #ffcaca",
    color: "#b42318",
    padding: "13px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  loadingBox: {
    background: "#eef6ff",
    border: "1px solid #cfe4ff",
    color: "#1769aa",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "16px",
    marginBottom: "22px",
  },

  statCard: {
    background: "#ffffff",
    border: "1px solid #e4eaf1",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 3px 12px rgba(20,40,61,0.04)",
  },

  statLabel: {
    margin: "0 0 8px",
    color: "#7a899a",
    fontSize: "13px",
  },

  statValue: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#14283d",
  },

  statIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },

  twoColumns: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "20px",
    marginBottom: "22px",
  },

  panel: {
    background: "#ffffff",
    border: "1px solid #e4eaf1",
    borderRadius: "12px",
    padding: "22px",
    marginBottom: "22px",
    boxShadow: "0 3px 12px rgba(20,40,61,0.04)",
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px",
  },

  panelTitle: {
    margin: 0,
    color: "#14283d",
    fontSize: "18px",
  },

  panelSubtitle: {
    margin: "5px 0 0",
    color: "#8995a4",
    fontSize: "13px",
  },

  viewButton: {
    border: "none",
    background: "#edf5ff",
    color: "#1473e6",
    padding: "9px 13px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: 600,
  },

  statusContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    gap: "30px",
    flexWrap: "wrap",
  },

  circleContainer: {
    display: "flex",
    justifyContent: "center",
  },

  bigCircle: {
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    background:
      "conic-gradient(#1473e6 0 35%, #22b573 35% 65%, #f5a623 65% 85%, #e55353 85% 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  innerCircle: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  circleNumber: {
    fontSize: "27px",
    color: "#14283d",
  },

  circleText: {
    color: "#8995a4",
    fontSize: "12px",
  },

  legend: {
    minWidth: "180px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  legendItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: "25px",
    color: "#425466",
    fontSize: "14px",
  },

  legendLabel: {
    display: "flex",
    gap: "9px",
  },

  summaryList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  summaryItem: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "12px 0",
    borderBottom: "1px solid #eef1f5",
  },

  summaryIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "9px",
    background: "#f2f6fb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  summaryTitle: {
    fontWeight: 600,
    color: "#27394c",
    fontSize: "14px",
  },

  summaryDescription: {
    color: "#8b97a5",
    fontSize: "12px",
    marginTop: "3px",
  },

  summaryValue: {
    fontSize: "20px",
    color: "#14283d",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "12px 14px",
    background: "#f7f9fc",
    color: "#6e7c8c",
    fontSize: "12px",
    fontWeight: 600,
    borderBottom: "1px solid #e5eaf0",
  },

  td: {
    padding: "15px 14px",
    color: "#3b4b5c",
    fontSize: "13px",
    borderBottom: "1px solid #eef1f4",
  },

  emptyCell: {
    textAlign: "center",
    padding: "35px",
    color: "#8995a4",
  },

  badge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 600,
  },
};