"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CSSProperties,
} from "react";

import Side from "@/components/Side";
import { api } from "@/lib/api";

type Filter =
  | "ALL"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

interface SecondaryDeviceRequest {
  id: string;

  employeeName?: string;
  employeeCode?: string;

  managerName?: string | null;

  category: string;
  reason: string;
  status: string;

  managerComment?: string | null;

  reviewedBy?: string | null;
  reviewedAt?: string | null;

  assignedAssetId?: string | null;
  assignedAssetTag?: string | null;
  assignedAssetName?: string | null;

  requestedAt?: string | null;
  fulfilledAt?: string | null;
}

export default function MyRequestsPage() {
  const [requests, setRequests] =
    useState<
      SecondaryDeviceRequest[]
    >([]);

  const [filter, setFilter] =
    useState<Filter>("ALL");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    selectedRequest,
    setSelectedRequest,
  ] =
    useState<SecondaryDeviceRequest | null>(
      null
    );

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const data = await api(
        "/api/v1/employees/me/secondary-device-requests"
      );

      setRequests(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load requests:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your requests."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, []);

  const filteredRequests =
    useMemo(() => {
      if (filter === "ALL") {
        return requests;
      }

      if (filter === "PENDING") {
        return requests.filter(
          (request) =>
            [
              "PENDING_MANAGER_APPROVAL",
              "PENDING_ASSIGNMENT",
              "PENDING_PROCUREMENT",
            ].includes(
              request.status
            )
        );
      }

      if (filter === "APPROVED") {
        return requests.filter(
          (request) =>
            [
              "MANAGER_APPROVED",
              "FULFILLED",
            ].includes(
              request.status
            )
        );
      }

      return requests.filter(
        (request) =>
          request.status ===
          "MANAGER_REJECTED"
      );
    }, [filter, requests]);

  function formatDate(
    value?: string | null
  ) {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "-";
    }

    return date.toLocaleDateString();
  }

  function statusLabel(
    status: string
  ) {
    switch (status) {
      case "PENDING_MANAGER_APPROVAL":
        return "Pending Manager Approval";

      case "MANAGER_APPROVED":
        return "Manager Approved";

      case "MANAGER_REJECTED":
        return "Rejected";

      case "PENDING_ASSIGNMENT":
        return "Pending Assignment";

      case "PENDING_PROCUREMENT":
        return "Pending Procurement";

      case "FULFILLED":
        return "Fulfilled";

      case "CANCELLED":
        return "Cancelled";

      default:
        return status;
    }
  }

  function statusStyle(
    status: string
  ): CSSProperties {
    switch (status) {
      case "PENDING_MANAGER_APPROVAL":
        return {
          backgroundColor:
            "#fff4cc",
          color: "#9a6700",
        };

      case "MANAGER_APPROVED":
        return {
          backgroundColor:
            "#dcfce7",
          color: "#15803d",
        };

      case "FULFILLED":
        return {
          backgroundColor:
            "#dcfce7",
          color: "#15803d",
        };

      case "PENDING_ASSIGNMENT":
        return {
          backgroundColor:
            "#e8f1ff",
          color: "#1473e6",
        };

      case "PENDING_PROCUREMENT":
        return {
          backgroundColor:
            "#f3e8ff",
          color: "#7e22ce",
        };

      case "MANAGER_REJECTED":
        return {
          backgroundColor:
            "#fee2e2",
          color: "#dc2626",
        };

      case "CANCELLED":
        return {
          backgroundColor:
            "#f1f5f9",
          color: "#64748b",
        };

      default:
        return {
          backgroundColor:
            "#f1f5f9",
          color: "#475569",
        };
    }
  }

  return (
    <div style={styles.page}>
      <Side role="employee" />

      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              My Secondary Device
              Requests
            </h1>

            <p style={styles.subtitle}>
              Track your secondary
              device requests and
              manager decisions.
            </p>
          </div>

          <button
            type="button"
            style={
              styles.refreshButton
            }
            onClick={() =>
              void loadRequests()
            }
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "Refresh"}
          </button>
        </div>

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        <section style={styles.panel}>
          <div style={styles.tabs}>
            <Tab
              label="All Requests"
              active={
                filter === "ALL"
              }
              onClick={() =>
                setFilter("ALL")
              }
            />

            <Tab
              label="Pending"
              active={
                filter === "PENDING"
              }
              onClick={() =>
                setFilter("PENDING")
              }
            />

            <Tab
              label="Approved"
              active={
                filter === "APPROVED"
              }
              onClick={() =>
                setFilter("APPROVED")
              }
            />

            <Tab
              label="Rejected"
              active={
                filter === "REJECTED"
              }
              onClick={() =>
                setFilter("REJECTED")
              }
            />
          </div>

          <div style={styles.panelBody}>
            {loading &&
            requests.length === 0 ? (
              <div
                style={
                  styles.emptyState
                }
              >
                Loading requests...
              </div>
            ) : filteredRequests.length ===
              0 ? (
              <div
                style={
                  styles.emptyState
                }
              >
                No requests found.
              </div>
            ) : (
              <div
                style={
                  styles.tableWrapper
                }
              >
                <table
                  style={styles.table}
                >
                  <thead>
                    <tr>
                      <th
                        style={
                          styles.th
                        }
                      >
                        #
                      </th>

                      <th
                        style={
                          styles.th
                        }
                      >
                        Category
                      </th>

                      <th
                        style={
                          styles.th
                        }
                      >
                        Reason
                      </th>

                      <th
                        style={
                          styles.th
                        }
                      >
                        Status
                      </th>

                      <th
                        style={
                          styles.th
                        }
                      >
                        Requested On
                      </th>

                      <th
                        style={
                          styles.th
                        }
                      >
                        Reviewed By
                      </th>

                      <th
                        style={
                          styles.th
                        }
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRequests.map(
                      (
                        request,
                        index
                      ) => (
                        <tr
                          key={
                            request.id
                          }
                        >
                          <td
                            style={
                              styles.td
                            }
                          >
                            {index + 1}
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            <strong>
                              {
                                request.category
                              }
                            </strong>
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            <div
                              style={
                                styles.reasonCell
                              }
                            >
                              {
                                request.reason
                              }
                            </div>
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            <span
                              style={{
                                ...styles.statusBadge,
                                ...statusStyle(
                                  request.status
                                ),
                              }}
                            >
                              {statusLabel(
                                request.status
                              )}
                            </span>
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            {formatDate(
                              request.requestedAt
                            )}
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            {request.reviewedBy ||
                              request.managerName ||
                              "-"}
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            <button
                              type="button"
                              style={
                                styles.viewButton
                              }
                              onClick={() =>
                                setSelectedRequest(
                                  request
                                )
                              }
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      {selectedRequest && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div
              style={styles.modalHeader}
            >
              <div>
                <h2
                  style={
                    styles.modalTitle
                  }
                >
                  Secondary Device
                  Request
                </h2>

                <p
                  style={
                    styles.modalSubtitle
                  }
                >
                  Request details and
                  current status
                </p>
              </div>

              <button
                type="button"
                style={
                  styles.closeButton
                }
                onClick={() =>
                  setSelectedRequest(
                    null
                  )
                }
              >
                ×
              </button>
            </div>

            <div
              style={styles.modalBody}
            >
              <Detail
                label="Category"
                value={
                  selectedRequest.category
                }
              />

              <Detail
                label="Requested On"
                value={formatDate(
                  selectedRequest.requestedAt
                )}
              />

              <Detail
                label="Manager"
                value={
                  selectedRequest.managerName ||
                  "-"
                }
              />

              <Detail
                label="Status"
                value={statusLabel(
                  selectedRequest.status
                )}
              />

              <div
                style={
                  styles.fullDetail
                }
              >
                <div
                  style={
                    styles.detailLabel
                  }
                >
                  Reason / Justification
                </div>

                <div
                  style={
                    styles.detailValue
                  }
                >
                  {
                    selectedRequest.reason
                  }
                </div>
              </div>

              <div
                style={
                  styles.fullDetail
                }
              >
                <div
                  style={
                    styles.detailLabel
                  }
                >
                  Manager Comment
                </div>

                <div
                  style={
                    styles.detailValue
                  }
                >
                  {selectedRequest.managerComment ||
                    "-"}
                </div>
              </div>

              {selectedRequest.assignedAssetId && (
                <div
                  style={
                    styles.assignedAssetBox
                  }
                >
                  <div
                    style={
                      styles.assignedTitle
                    }
                  >
                    Assigned Secondary
                    Device
                  </div>

                  <div>
                    {selectedRequest.assignedAssetName ||
                      "Asset"}
                  </div>

                  <div
                    style={
                      styles.assignedTag
                    }
                  >
                    {selectedRequest.assignedAssetTag ||
                      "-"}
                  </div>
                </div>
              )}
            </div>

            <div
              style={
                styles.modalFooter
              }
            >
              <button
                type="button"
                style={
                  styles.closeModalButton
                }
                onClick={() =>
                  setSelectedRequest(
                    null
                  )
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Tab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.tab,
        ...(active
          ? styles.activeTab
          : {}),
      }}
    >
      {label}
    </button>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={styles.detail}>
      <div
        style={styles.detailLabel}
      >
        {label}
      </div>

      <div
        style={styles.detailValue}
      >
        {value}
      </div>
    </div>
  );
}

const styles: Record<
  string,
  CSSProperties
> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    backgroundColor: "#f5f8fc",
  },

  main: {
    flex: 1,
    minWidth: 0,
    padding: "36px 44px",
    backgroundColor: "#f5f8fc",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "26px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    color: "#0f2740",
    fontWeight: 750,
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#71829a",
    fontSize: "15px",
  },

  refreshButton: {
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#1473e6",
    color: "#ffffff",
    padding: "12px 20px",
    fontWeight: 700,
    cursor: "pointer",
  },

  errorBox: {
    padding: "14px 16px",
    borderRadius: "9px",
    backgroundColor: "#fff0f0",
    color: "#c62828",
    marginBottom: "18px",
    border:
      "1px solid #fecaca",
  },

  panel: {
    backgroundColor: "#ffffff",
    border:
      "1px solid #dde6f0",
    borderRadius: "14px",
    overflow: "hidden",
  },

  tabs: {
    display: "flex",
    gap: "5px",
    padding: "15px 20px 0",
    borderBottom:
      "1px solid #e7edf4",
  },

  tab: {
    border: "none",
    backgroundColor:
      "transparent",
    color: "#64748b",
    padding: "12px 18px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 650,
    borderBottom:
      "3px solid transparent",
  },

  activeTab: {
    color: "#1473e6",
    borderBottom:
      "3px solid #1473e6",
  },

  panelBody: {
    padding: "20px",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse:
      "collapse",
  },

  th: {
    textAlign: "left",
    padding: "13px 12px",
    backgroundColor: "#f8fafc",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 700,
    borderBottom:
      "1px solid #e2e8f0",
  },

  td: {
    padding: "15px 12px",
    color: "#334155",
    fontSize: "13px",
    borderBottom:
      "1px solid #edf2f7",
    verticalAlign: "middle",
  },

  reasonCell: {
    maxWidth: "280px",
    lineHeight: 1.5,
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
    padding: "6px 9px",
    fontSize: "11px",
    fontWeight: 700,
  },

  viewButton: {
    border:
      "1px solid #bfdbfe",
    backgroundColor: "#eff6ff",
    color: "#1473e6",
    borderRadius: "6px",
    padding: "7px 12px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "12px",
  },

  emptyState: {
    padding: "55px 20px",
    textAlign: "center",
    color: "#8191a6",
    fontSize: "15px",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor:
      "rgba(15,23,42,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    zIndex: 1000,
  },

  modal: {
    width: "100%",
    maxWidth: "650px",
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    boxShadow:
      "0 25px 60px rgba(15,23,42,0.25)",
    overflow: "hidden",
  },

  modalHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    padding: "22px 24px",
    borderBottom:
      "1px solid #e2e8f0",
  },

  modalTitle: {
    margin: 0,
    color: "#0f2740",
    fontSize: "21px",
    fontWeight: 750,
  },

  modalSubtitle: {
    margin: "5px 0 0",
    color: "#71829a",
    fontSize: "13px",
  },

  closeButton: {
    width: "34px",
    height: "34px",
    border: "none",
    borderRadius: "7px",
    backgroundColor: "#f1f5f9",
    color: "#475569",
    cursor: "pointer",
    fontSize: "22px",
  },

  modalBody: {
    padding: "24px",
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "20px",
  },

  detail: {
    padding: "13px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
  },

  fullDetail: {
    gridColumn: "1 / -1",
    padding: "13px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
  },

  detailLabel: {
    color: "#94a3b8",
    fontSize: "11px",
    marginBottom: "6px",
  },

  detailValue: {
    color: "#334155",
    fontSize: "13px",
    fontWeight: 650,
    lineHeight: 1.5,
  },

  assignedAssetBox: {
    gridColumn: "1 / -1",
    padding: "16px",
    backgroundColor: "#ecfdf5",
    border:
      "1px solid #a7f3d0",
    borderRadius: "9px",
    color: "#166534",
  },

  assignedTitle: {
    fontWeight: 750,
    marginBottom: "8px",
  },

  assignedTag: {
    fontSize: "12px",
    marginTop: "4px",
  },

  modalFooter: {
    padding: "17px 24px",
    borderTop:
      "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "flex-end",
  },

  closeModalButton: {
    border: "none",
    borderRadius: "7px",
    backgroundColor: "#1473e6",
    color: "#ffffff",
    padding: "10px 18px",
    fontWeight: 700,
    cursor: "pointer",
  },
};