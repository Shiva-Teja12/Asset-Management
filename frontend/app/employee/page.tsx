"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import Side from "../../components/Side";
import { api } from "../../lib/api";

type Employee = {
  id?: number | string;
  name?: string;
  email?: string;
  employeeCode?: string;
  department?: string;
};

type Asset = {
  id: number | string;
  assetTag?: string;
  name?: string;
  category?: string;
  serialNumber?: string;
  status?: string;
};

type Ticket = {
  id: number | string;
  type?: string;
  subject?: string;
  description?: string;
  status?: string;
  createdAt?: string;
};

function getArray<T>(response: any): T[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.content)) {
    return response.content;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

function formatValue(value?: string) {
  if (!value) {
    return "-";
  }

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function EmployeeDashboard() {
  /*
   * IMPORTANT:
   * Do NOT read localStorage here.
   *
   * Server and browser must both start with exactly
   * the same value to prevent hydration errors.
   */
  const [displayName, setDisplayName] =
    useState("Employee");

  const [employee, setEmployee] =
    useState<Employee | null>(null);

  const [assets, setAssets] =
    useState<Asset[]>([]);

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    /*
     * localStorage exists only in the browser.
     * Reading it here is safe because hydration
     * has already completed.
     */
    const storedName =
      localStorage.getItem("name");

    if (storedName) {
      setDisplayName(storedName);
    }

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const results =
          await Promise.allSettled([
            api("/api/v1/employees/me"),
            api(
              "/api/v1/employees/me/assets"
            ),
            api("/api/v1/tickets/my"),
          ]);

        /*
         * Employee details
         */
        if (
          results[0].status === "fulfilled"
        ) {
          const employeeData =
            results[0].value as Employee;

          setEmployee(employeeData);

          if (employeeData?.name) {
            setDisplayName(
              employeeData.name
            );
          }
        }

        /*
         * Employee assets
         */
        if (
          results[1].status === "fulfilled"
        ) {
          setAssets(
            getArray<Asset>(
              results[1].value
            )
          );
        }

        /*
         * Employee tickets
         */
        if (
          results[2].status === "fulfilled"
        ) {
          setTickets(
            getArray<Ticket>(
              results[2].value
            )
          );
        }

        /*
         * If all three requests failed,
         * show an error.
         */
        const allFailed =
          results.every(
            (result) =>
              result.status === "rejected"
          );

        if (allFailed) {
          setError(
            "Unable to load employee dashboard data."
          );
        }
      } catch (err) {
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
  }, []);

  const openTickets =
    tickets.filter(
      (ticket) =>
        ticket.status === "OPEN"
    ).length;

  const inProgressTickets =
    tickets.filter(
      (ticket) =>
        ticket.status === "IN_PROGRESS"
    ).length;

  const resolvedTickets =
    tickets.filter(
      (ticket) =>
        ticket.status === "RESOLVED"
    ).length;

  return (
    <div style={styles.shell}>
      <Side role="employee" />

      <main style={styles.main}>
        {/* HEADER */}

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Welcome, {displayName}
            </h1>

            <p style={styles.subtitle}>
              Here&apos;s your asset
              management overview.
            </p>
          </div>

          <div style={styles.profile}>
            <div style={styles.avatar}>
              {displayName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <div style={styles.profileName}>
                {displayName}
              </div>

              <div style={styles.profileRole}>
                Employee
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* SUMMARY CARDS */}

        <div style={styles.cards}>
          <DashboardCard
            title="My Assets"
            value={assets.length}
            icon="A"
          />

          <DashboardCard
            title="Open Tickets"
            value={openTickets}
            icon="T"
          />

          <DashboardCard
            title="In Progress"
            value={inProgressTickets}
            icon="P"
          />

          <DashboardCard
            title="Resolved"
            value={resolvedTickets}
            icon="R"
          />
        </div>

        {/* EMPLOYEE DETAILS */}

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>
                Employee Details
              </h2>

              <p
                style={
                  styles.panelSubtitle
                }
              >
                Your employee information
              </p>
            </div>
          </div>

          {loading ? (
            <div style={styles.loading}>
              Loading employee details...
            </div>
          ) : (
            <div style={styles.detailsGrid}>
              <DetailBox
                label="Employee ID"
                value={
                  employee?.employeeCode ||
                  "-"
                }
              />

              <DetailBox
                label="Employee Name"
                value={
                  employee?.name ||
                  displayName
                }
              />

              <DetailBox
                label="Email"
                value={
                  employee?.email || "-"
                }
              />

              <DetailBox
                label="Department"
                value={
                  employee?.department ||
                  "-"
                }
              />
            </div>
          )}
        </section>

        {/* ASSETS + TICKETS */}

        <div style={styles.twoColumns}>
          {/* MY ASSETS */}

          <section style={styles.panel}>
            <div
              style={styles.panelHeader}
            >
              <div>
                <h2
                  style={styles.panelTitle}
                >
                  My Assets
                </h2>

                <p
                  style={
                    styles.panelSubtitle
                  }
                >
                  Equipment currently
                  assigned to you
                </p>
              </div>
            </div>

            {loading ? (
              <div style={styles.empty}>
                Loading assets...
              </div>
            ) : assets.length === 0 ? (
              <div style={styles.empty}>
                <div
                  style={
                    styles.emptyIcon
                  }
                >
                  A
                </div>

                <h3
                  style={
                    styles.emptyTitle
                  }
                >
                  No assets assigned
                </h3>

                <p
                  style={
                    styles.emptyText
                  }
                >
                  You currently have no
                  company assets assigned.
                </p>
              </div>
            ) : (
              <div style={styles.list}>
                {assets
                  .slice(0, 5)
                  .map((asset) => (
                    <div
                      key={asset.id}
                      style={
                        styles.listItem
                      }
                    >
                      <div
                        style={
                          styles.itemIcon
                        }
                      >
                        A
                      </div>

                      <div
                        style={
                          styles.itemContent
                        }
                      >
                        <div
                          style={
                            styles.itemTitle
                          }
                        >
                          {asset.name ||
                            "Company Asset"}
                        </div>

                        <div
                          style={
                            styles.itemSubtitle
                          }
                        >
                          {asset.assetTag ||
                            "-"}
                        </div>
                      </div>

                      <span
                        style={
                          styles.statusBadge
                        }
                      >
                        {formatValue(
                          asset.status
                        )}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </section>

          {/* RECENT TICKETS */}

          <section style={styles.panel}>
            <div
              style={styles.panelHeader}
            >
              <div>
                <h2
                  style={styles.panelTitle}
                >
                  Recent Tickets
                </h2>

                <p
                  style={
                    styles.panelSubtitle
                  }
                >
                  Your latest asset
                  requests
                </p>
              </div>
            </div>

            {loading ? (
              <div style={styles.empty}>
                Loading tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div style={styles.empty}>
                <div
                  style={
                    styles.emptyIcon
                  }
                >
                  T
                </div>

                <h3
                  style={
                    styles.emptyTitle
                  }
                >
                  No tickets
                </h3>

                <p
                  style={
                    styles.emptyText
                  }
                >
                  You have not submitted
                  any asset requests yet.
                </p>
              </div>
            ) : (
              <div style={styles.list}>
                {tickets
                  .slice(0, 5)
                  .map((ticket) => (
                    <div
                      key={ticket.id}
                      style={
                        styles.listItem
                      }
                    >
                      <div
                        style={
                          styles.ticketIcon
                        }
                      >
                        T
                      </div>

                      <div
                        style={
                          styles.itemContent
                        }
                      >
                        <div
                          style={
                            styles.itemTitle
                          }
                        >
                          {ticket.subject ||
                            "Asset Request"}
                        </div>

                        <div
                          style={
                            styles.itemSubtitle
                          }
                        >
                          {formatValue(
                            ticket.type
                          )}
                        </div>
                      </div>

                      <span
                        style={getTicketStatusStyle(
                          ticket.status
                        )}
                      >
                        {formatValue(
                          ticket.status
                        )}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div style={styles.card}>
      <div>
        <div style={styles.cardTitle}>
          {title}
        </div>

        <div style={styles.cardValue}>
          {value}
        </div>
      </div>

      <div style={styles.cardIcon}>
        {icon}
      </div>
    </div>
  );
}

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={styles.detailBox}>
      <div style={styles.detailLabel}>
        {label}
      </div>

      <div style={styles.detailValue}>
        {value}
      </div>
    </div>
  );
}

function getTicketStatusStyle(
  status?: string
): CSSProperties {
  let backgroundColor = "#e8f1ff";
  let color = "#1769c2";

  if (status === "RESOLVED") {
    backgroundColor = "#e9f8f0";
    color = "#16804b";
  }

  if (status === "IN_PROGRESS") {
    backgroundColor = "#fff4df";
    color = "#b66d00";
  }

  if (status === "REJECTED") {
    backgroundColor = "#fff0f0";
    color = "#c53030";
  }

  return {
    padding: "5px 10px",
    borderRadius: "20px",
    backgroundColor,
    color,
    fontSize: "10px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  };
}

const styles: Record<
  string,
  CSSProperties
> = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f5f8fc",
  },

  main: {
    flex: 1,
    minWidth: 0,
    padding: "36px 40px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px",
  },

  title: {
    margin: 0,
    color: "#10243a",
    fontSize: "32px",
    fontWeight: 700,
  },

  subtitle: {
    margin: "7px 0 0",
    color: "#7c8b9c",
    fontSize: "14px",
  },

  profile: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
  },

  avatar: {
    width: "43px",
    height: "43px",
    borderRadius: "50%",
    backgroundColor: "#1473e6",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },

  profileName: {
    color: "#10243a",
    fontWeight: 700,
    fontSize: "13px",
  },

  profileRole: {
    color: "#8996a5",
    fontSize: "11px",
    marginTop: "2px",
  },

  error: {
    marginBottom: "20px",
    padding: "13px 15px",
    borderRadius: "8px",
    backgroundColor: "#fff0f0",
    border: "1px solid #ffcaca",
    color: "#b42318",
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(160px, 1fr))",
    gap: "18px",
    marginBottom: "22px",
  },

  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "21px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  cardTitle: {
    color: "#7b899a",
    fontSize: "13px",
  },

  cardValue: {
    color: "#10243a",
    fontSize: "29px",
    fontWeight: 700,
    marginTop: "7px",
  },

  cardIcon: {
    width: "43px",
    height: "43px",
    borderRadius: "9px",
    backgroundColor: "#e8f1ff",
    color: "#1473e6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },

  panel: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "22px",
  },

  panelHeader: {
    padding: "20px 22px",
    borderBottom:
      "1px solid #edf1f5",
  },

  panelTitle: {
    margin: 0,
    color: "#10243a",
    fontSize: "18px",
  },

  panelSubtitle: {
    margin: "5px 0 0",
    color: "#8996a5",
    fontSize: "12px",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(150px, 1fr))",
    gap: "15px",
    padding: "22px",
  },

  detailBox: {
    padding: "17px",
    border: "1px solid #edf1f5",
    borderRadius: "9px",
    backgroundColor: "#f9fbfd",
  },

  detailLabel: {
    color: "#8996a5",
    fontSize: "11px",
    marginBottom: "6px",
  },

  detailValue: {
    color: "#263b50",
    fontWeight: 700,
    fontSize: "13px",
  },

  twoColumns: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "22px",
  },

  list: {
    padding: "0 20px",
  },

  listItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px 0",
    borderBottom:
      "1px solid #edf1f5",
  },

  itemIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "8px",
    backgroundColor: "#e8f1ff",
    color: "#1473e6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },

  ticketIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "8px",
    backgroundColor: "#fff4df",
    color: "#b66d00",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },

  itemContent: {
    flex: 1,
    minWidth: 0,
  },

  itemTitle: {
    color: "#263b50",
    fontSize: "13px",
    fontWeight: 700,
  },

  itemSubtitle: {
    color: "#8996a5",
    fontSize: "11px",
    marginTop: "3px",
  },

  statusBadge: {
    padding: "5px 10px",
    borderRadius: "20px",
    backgroundColor: "#e9f8f0",
    color: "#16804b",
    fontSize: "10px",
    fontWeight: 700,
  },

  empty: {
    padding: "45px 20px",
    textAlign: "center",
    color: "#8996a5",
  },

  emptyIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "9px",
    margin: "0 auto",
    backgroundColor: "#e8f1ff",
    color: "#1473e6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },

  emptyTitle: {
    margin: "12px 0 5px",
    color: "#263b50",
    fontSize: "15px",
  },

  emptyText: {
    margin: 0,
    fontSize: "12px",
  },

  loading: {
    padding: "35px 22px",
    color: "#8996a5",
  },
};