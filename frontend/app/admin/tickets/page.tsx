"use client";

import { useEffect, useState } from "react";
import Side from "@/components/Side";
import { api } from "@/lib/api";

interface Ticket {
  id: string | number;
  employeeName?: string;
  employeeEmail?: string;
  type?: string;
  subject?: string;
  description?: string;
  status?: string;
  createdAt?: string;
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

function readable(value?: string) {
  if (!value) {
    return "-";
  }

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default function TicketsPage() {
  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState<string | number | null>(null);

  async function loadTickets() {
    try {
      setLoading(true);
      setError("");

      const response = await api(
        "/api/v1/tickets"
      );

      setTickets(
        toArray<Ticket>(response)
      );
    } catch (err) {
      console.error(
        "Failed to load tickets:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load tickets."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * IMPORTANT:
   *
   * Do NOT write:
   *
   * useEffect(loadTickets, []);
   *
   * loadTickets() is async and returns a Promise.
   *
   * The effect itself must return nothing
   * or a cleanup function.
   */
  useEffect(() => {
    void loadTickets();
  }, []);

  async function updateStatus(
    ticketId: string | number,
    status: string
  ) {
    try {
      setUpdatingId(ticketId);
      setError("");

      await api(
        `/api/v1/tickets/${ticketId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
          }),
        }
      );

      await loadTickets();
    } catch (err) {
      console.error(
        "Failed to update ticket:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update ticket."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div style={styles.shell}>
      <Side role="admin" />

      <main style={styles.main}>
        {/* HEADER */}

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Tickets
            </h1>

            <p style={styles.subtitle}>
              Review and manage employee asset
              requests
            </p>
          </div>

          <button
            type="button"
            style={styles.refreshButton}
            onClick={() => {
              void loadTickets();
            }}
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "Refresh"}
          </button>
        </div>

        {/* SUMMARY CARDS */}

        <div style={styles.cards}>
          <SummaryCard
            title="Total Tickets"
            value={tickets.length}
          />

          <SummaryCard
            title="Open"
            value={
              tickets.filter(
                (ticket) =>
                  ticket.status === "OPEN"
              ).length
            }
          />

          <SummaryCard
            title="In Progress"
            value={
              tickets.filter(
                (ticket) =>
                  ticket.status ===
                  "IN_PROGRESS"
              ).length
            }
          />

          <SummaryCard
            title="Resolved"
            value={
              tickets.filter(
                (ticket) =>
                  ticket.status ===
                  "RESOLVED"
              ).length
            }
          />
        </div>

        {/* ERROR */}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* TABLE */}

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>
                Asset Tickets
              </h2>

              <p style={styles.panelSubtitle}>
                Requests submitted by employees
              </p>
            </div>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>
                    Employee
                  </th>

                  <th style={styles.th}>
                    Type
                  </th>

                  <th style={styles.th}>
                    Subject
                  </th>

                  <th style={styles.th}>
                    Description
                  </th>

                  <th style={styles.th}>
                    Status
                  </th>

                  <th style={styles.th}>
                    Created
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading &&
                tickets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={styles.empty}
                    >
                      Loading tickets...
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={styles.empty}
                    >
                      No tickets found.
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td style={styles.td}>
                        <strong>
                          {ticket.employeeName ||
                            "-"}
                        </strong>

                        {ticket.employeeEmail && (
                          <div
                            style={
                              styles.smallText
                            }
                          >
                            {
                              ticket.employeeEmail
                            }
                          </div>
                        )}
                      </td>

                      <td style={styles.td}>
                        <span
                          style={
                            styles.typeBadge
                          }
                        >
                          {readable(
                            ticket.type
                          )}
                        </span>
                      </td>

                      <td style={styles.td}>
                        {ticket.subject || "-"}
                      </td>

                      <td style={styles.td}>
                        <div
                          style={
                            styles.description
                          }
                        >
                          {ticket.description ||
                            "-"}
                        </div>
                      </td>

                      <td style={styles.td}>
                        <select
                          value={
                            ticket.status ||
                            "OPEN"
                          }
                          disabled={
                            updatingId ===
                            ticket.id
                          }
                          onChange={(event) => {
                            void updateStatus(
                              ticket.id,
                              event.target.value
                            );
                          }}
                          style={{
                            ...styles.select,
                            ...getStatusStyle(
                              ticket.status
                            ),
                          }}
                        >
                          <option value="OPEN">
                            Open
                          </option>

                          <option value="IN_PROGRESS">
                            In Progress
                          </option>

                          <option value="RESOLVED">
                            Resolved
                          </option>

                          <option value="REJECTED">
                            Rejected
                          </option>
                        </select>
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

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div style={styles.summaryCard}>
      <div style={styles.summaryLabel}>
        {title}
      </div>

      <div style={styles.summaryValue}>
        {value}
      </div>
    </div>
  );
}

function getStatusStyle(
  status?: string
): React.CSSProperties {
  switch (status) {
    case "OPEN":
      return {
        background: "#fff5df",
        color: "#a96700",
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
        color: "#c93636",
      };

    default:
      return {
        background: "#f1f4f8",
        color: "#526276",
      };
  }
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "#f5f8fc",
  },

  main: {
    flex: 1,
    minWidth: 0,
    padding: "30px",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "25px",
    gap: "20px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    color: "#14283d",
  },

  subtitle: {
    margin: "7px 0 0",
    color: "#7a899a",
    fontSize: "14px",
  },

  refreshButton: {
    padding: "11px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#1473e6",
    color: "#ffffff",
    fontWeight: 600,
    cursor: "pointer",
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "22px",
  },

  summaryCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "11px",
    padding: "20px",
  },

  summaryLabel: {
    color: "#7a899a",
    fontSize: "13px",
  },

  summaryValue: {
    marginTop: "8px",
    fontSize: "27px",
    fontWeight: 700,
    color: "#14283d",
  },

  error: {
    padding: "13px 16px",
    background: "#fff0f0",
    border: "1px solid #ffcaca",
    color: "#b42318",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  panel: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    overflow: "hidden",
  },

  panelHeader: {
    padding: "20px 22px",
    borderBottom: "1px solid #edf1f5",
  },

  panelTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#14283d",
  },

  panelSubtitle: {
    margin: "5px 0 0",
    fontSize: "13px",
    color: "#8995a4",
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
    padding: "13px 16px",
    background: "#f7f9fc",
    color: "#718096",
    fontSize: "12px",
    borderBottom: "1px solid #e5eaf0",
  },

  td: {
    padding: "15px 16px",
    color: "#3b4b5c",
    fontSize: "13px",
    borderBottom: "1px solid #eef1f4",
    verticalAlign: "middle",
  },

  empty: {
    textAlign: "center",
    padding: "50px",
    color: "#8995a4",
  },

  smallText: {
    marginTop: "3px",
    fontSize: "11px",
    color: "#8995a4",
  },

  typeBadge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "20px",
    background: "#eef4fb",
    color: "#385b7a",
    fontSize: "11px",
    fontWeight: 600,
  },

  description: {
    maxWidth: "300px",
    whiteSpace: "normal",
    lineHeight: "1.4",
  },

  select: {
    border: "none",
    outline: "none",
    padding: "7px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },
};