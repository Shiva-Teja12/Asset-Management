"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";

import Side from "../../../components/Side";
import { api } from "../../../lib/api";

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

export default function EmployeeTicketsPage() {
  const router = useRouter();

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadTickets() {
    try {
      setLoading(true);
      setError("");

      const response = await api(
        "/api/v1/tickets/my"
      );

      setTickets(getArray<Ticket>(response));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load tickets."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTickets();
  }, []);

  const open = tickets.filter(
    (ticket) => ticket.status === "OPEN"
  ).length;

  const inProgress = tickets.filter(
    (ticket) =>
      ticket.status === "IN_PROGRESS"
  ).length;

  const resolved = tickets.filter(
    (ticket) =>
      ticket.status === "RESOLVED"
  ).length;

  return (
    <div style={styles.shell}>
      <Side role="employee" />

      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              My Tickets
            </h1>

            <p style={styles.subtitle}>
              Track your asset requests and support
              tickets.
            </p>
          </div>

          <div style={styles.headerButtons}>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => void loadTickets()}
            >
              Refresh
            </button>

            <button
              type="button"
              style={styles.primaryButton}
              onClick={() =>
                router.push(
                  "/employee/tickets/new"
                )
              }
            >
              + Raise Ticket
            </button>
          </div>
        </div>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <div style={styles.cards}>
          <StatCard
            title="Total Tickets"
            value={tickets.length}
          />

          <StatCard
            title="Open"
            value={open}
          />

          <StatCard
            title="In Progress"
            value={inProgress}
          />

          <StatCard
            title="Resolved"
            value={resolved}
          />
        </div>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>
                Asset Requests
              </h2>

              <p style={styles.panelSubtitle}>
                Tickets you have submitted
              </p>
            </div>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>
                    Description
                  </th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Created</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={styles.empty}
                    >
                      Loading tickets...
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={styles.empty}
                    >
                      No tickets found. Use the
                      &quot;Raise Ticket&quot; button to
                      create your first request.
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td style={styles.td}>
                        {formatValue(ticket.type)}
                      </td>

                      <td style={styles.td}>
                        <strong>
                          {ticket.subject || "-"}
                        </strong>
                      </td>

                      <td style={styles.td}>
                        {ticket.description || "-"}
                      </td>

                      <td style={styles.td}>
                        <span
                          style={getStatusStyle(
                            ticket.status
                          )}
                        >
                          {formatValue(
                            ticket.status
                          )}
                        </span>
                      </td>

                      <td style={styles.td}>
                        {ticket.createdAt
                          ? new Date(
                              ticket.createdAt
                            ).toLocaleString()
                          : "-"}
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
}: {
  title: string;
  value: number;
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>
        {title}
      </div>

      <div style={styles.statValue}>
        {value}
      </div>
    </div>
  );
}

function getStatusStyle(
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
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "20px",
    backgroundColor,
    color,
    fontSize: "11px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  };
}

const styles: Record<string, CSSProperties> = {
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
    gap: "20px",
    marginBottom: "25px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    color: "#10243a",
  },

  subtitle: {
    margin: "7px 0 0",
    color: "#7c8b9c",
    fontSize: "14px",
  },

  headerButtons: {
    display: "flex",
    gap: "10px",
  },

  primaryButton: {
    border: "none",
    backgroundColor: "#1473e6",
    color: "#ffffff",
    borderRadius: "8px",
    padding: "11px 18px",
    fontWeight: 700,
    cursor: "pointer",
  },

  secondaryButton: {
    border: "1px solid #dce3eb",
    backgroundColor: "#ffffff",
    color: "#405367",
    borderRadius: "8px",
    padding: "11px 18px",
    fontWeight: 600,
    cursor: "pointer",
  },

  error: {
    marginBottom: "20px",
    padding: "13px",
    backgroundColor: "#fff0f0",
    border: "1px solid #ffcaca",
    color: "#b42318",
    borderRadius: "8px",
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(160px, 1fr))",
    gap: "18px",
    marginBottom: "22px",
  },

  statCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
  },

  statLabel: {
    color: "#7b899a",
    fontSize: "13px",
  },

  statValue: {
    color: "#10243a",
    fontSize: "29px",
    fontWeight: 700,
    marginTop: "7px",
  },

  panel: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    overflow: "hidden",
  },

  panelHeader: {
    padding: "21px 22px",
    borderBottom: "1px solid #edf1f5",
  },

  panelTitle: {
    margin: 0,
    color: "#10243a",
    fontSize: "19px",
  },

  panelSubtitle: {
    margin: "5px 0 0",
    color: "#8996a5",
    fontSize: "12px",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "14px 16px",
    backgroundColor: "#f7f9fc",
    color: "#718096",
    fontSize: "12px",
    borderBottom: "1px solid #e5eaf0",
  },

  td: {
    padding: "15px 16px",
    color: "#3b4b5c",
    fontSize: "13px",
    borderBottom: "1px solid #eef1f4",
  },

  empty: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#8996a5",
  },
};