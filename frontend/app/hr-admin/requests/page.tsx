"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type OnboardingRequest = {
  id?: string;
  requestNumber?: string;
  requestNo?: string;
  employeeName?: string;
  employeeEmail?: string;
  employeeCode?: string;
  department?: string;
  joiningDate?: string;
  category?: string;
  deviceCategory?: string;
  brand?: string;
  model?: string;
  quantity?: number;
  estimatedPricePerUnit?: number;
  estimatedUnitPrice?: number;
  estimatedCost?: number;
  totalEstimatedCost?: number;
  specifications?: string;
  businessJustification?: string;
  justification?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    const message = (
      error as { message?: unknown }
    ).message;

    if (typeof message === "string") {
      return message;
    }
  }

  return fallback;
}

function safeArray(
  value: unknown
): OnboardingRequest[] {
  if (Array.isArray(value)) {
    return value as OnboardingRequest[];
  }

  if (value && typeof value === "object") {
    const object =
      value as Record<string, unknown>;

    if (Array.isArray(object.content)) {
      return object.content as OnboardingRequest[];
    }

    if (Array.isArray(object.requests)) {
      return object.requests as OnboardingRequest[];
    }

    if (Array.isArray(object.data)) {
      return object.data as OnboardingRequest[];
    }
  }

  return [];
}

function normalizeStatus(status?: string) {
  return (status || "UNKNOWN")
    .trim()
    .toUpperCase();
}

function prettyStatus(status?: string) {
  return normalizeStatus(status)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value?: number | null) {
  if (
    value === undefined ||
    value === null ||
    Number.isNaN(value)
  ) {
    return "-";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function getEstimatedCost(
  request: OnboardingRequest
) {
  if (
    request.totalEstimatedCost !== undefined
  ) {
    return request.totalEstimatedCost;
  }

  if (request.estimatedCost !== undefined) {
    return request.estimatedCost;
  }

  const unitPrice =
    request.estimatedPricePerUnit ??
    request.estimatedUnitPrice;

  if (unitPrice !== undefined) {
    return unitPrice * (request.quantity ?? 1);
  }

  return undefined;
}

function getRequestNumber(
  request: OnboardingRequest,
  index: number
) {
  if (request.requestNumber) {
    return request.requestNumber;
  }

  if (request.requestNo) {
    return request.requestNo;
  }

  if (request.id) {
    return `REQ-${request.id
      .substring(0, 8)
      .toUpperCase()}`;
  }

  return `REQ-${index + 1}`;
}

function getDeviceName(
  request: OnboardingRequest
) {
  const category =
    request.deviceCategory ||
    request.category ||
    "";

  const device = [
    request.brand,
    request.model,
  ]
    .filter(Boolean)
    .join(" ");

  if (category && device) {
    return `${category} - ${device}`;
  }

  if (device) {
    return device;
  }

  return category || "-";
}

function getStatusStyle(
  status?: string
): CSSProperties {
  const value = normalizeStatus(status);

  if (
    value.includes("REJECT") ||
    value.includes("CANCEL")
  ) {
    return {
      background: "#fee2e2",
      color: "#b91c1c",
    };
  }

  if (
    value.includes("ALLOCATED") ||
    value.includes("ASSIGNED") ||
    value.includes("FULFILLED") ||
    value.includes("COMPLETED")
  ) {
    return {
      background: "#dcfce7",
      color: "#15803d",
    };
  }

  if (value.includes("VP")) {
    return {
      background: "#f3e8ff",
      color: "#7e22ce",
    };
  }

  if (value.includes("FINANCE")) {
    return {
      background: "#fef3c7",
      color: "#b45309",
    };
  }

  if (
    value.includes("ASSET") ||
    value.includes("SYSTEM")
  ) {
    return {
      background: "#dbeafe",
      color: "#1d4ed8",
    };
  }

  if (value.includes("APPROVED")) {
    return {
      background: "#dcfce7",
      color: "#15803d",
    };
  }

  return {
    background: "#e2e8f0",
    color: "#475569",
  };
}

export default function HRAdminRequestsPage() {
  const router = useRouter();

  const [requests, setRequests] =
    useState<OnboardingRequest[]>([]);

  const [
    selectedRequest,
    setSelectedRequest,
  ] = useState<OnboardingRequest | null>(
    null
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");

  const [userName, setUserName] =
    useState("HR Admin");

  useEffect(() => {
    const role =
      localStorage.getItem("role");

    const name =
      localStorage.getItem("name");

    if (name) {
      setUserName(name);
    }

    if (role && role !== "HR_ADMIN") {
      router.replace("/");
    }
  }, [router]);

  const loadRequests =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api(
          "/api/v1/onboarding/requests/hr"
        );

        setRequests(
          safeArray(response)
        );
      } catch (err) {
        setRequests([]);

        setError(
          getErrorMessage(
            err,
            "Unable to load your requests."
          )
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const statuses = useMemo(() => {
    return Array.from(
      new Set(
        requests
          .map((request) =>
            normalizeStatus(
              request.status
            )
          )
          .filter(
            (status) =>
              status !== "UNKNOWN"
          )
      )
    );
  }, [requests]);

  const filteredRequests =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      return requests.filter(
        (request) => {
          const matchesStatus =
            statusFilter === "ALL" ||
            normalizeStatus(
              request.status
            ) === statusFilter;

          if (!matchesStatus) {
            return false;
          }

          if (!query) {
            return true;
          }

          const values = [
            request.requestNumber,
            request.requestNo,
            request.employeeName,
            request.employeeEmail,
            request.employeeCode,
            request.department,
            request.deviceCategory,
            request.category,
            request.brand,
            request.model,
            request.status,
          ];

          return values.some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(query)
          );
        }
      );
    }, [
      requests,
      search,
      statusFilter,
    ]);

  const pendingCount =
    requests.filter((request) => {
      const status =
        normalizeStatus(request.status);

      return !(
        status.includes("ALLOCATED") ||
        status.includes("ASSIGNED") ||
        status.includes("FULFILLED") ||
        status.includes("COMPLETED") ||
        status.includes("REJECT") ||
        status.includes("CANCEL")
      );
    }).length;

  const completedCount =
    requests.filter((request) => {
      const status =
        normalizeStatus(request.status);

      return (
        status.includes("ALLOCATED") ||
        status.includes("ASSIGNED") ||
        status.includes("FULFILLED") ||
        status.includes("COMPLETED")
      );
    }).length;

  const rejectedCount =
    requests.filter((request) => {
      const status =
        normalizeStatus(request.status);

      return (
        status.includes("REJECT") ||
        status.includes("CANCEL")
      );
    }).length;

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    localStorage.removeItem("userId");

    router.push("/");
  }

  return (
    <div style={styles.page}>
      {/* SIDEBAR */}

      <aside style={styles.sidebar}>
        <div>
          <div style={styles.logoRow}>
            <div style={styles.logoBox}>
              C
            </div>

            <div>
              <div style={styles.logoTitle}>
                ENFEC ONE
              </div>

              <div
                style={
                  styles.logoSubtitle
                }
              >
                HR Asset Onboarding
              </div>
            </div>
          </div>

          {/* ONLY DASHBOARD + MY REQUESTS */}

          <div style={styles.menu}>
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/hr-admin/dashboard"
                )
              }
              style={styles.menuItem}
            >
              <span
                style={styles.menuIcon}
              >
                ⌂
              </span>

              <span>
                Dashboard
              </span>
            </button>

            <button
              type="button"
              style={{
                ...styles.menuItem,
                ...styles.menuActive,
              }}
            >
              <span
                style={styles.menuIcon}
              >
                ▤
              </span>

              <span>
                My Requests
              </span>
            </button>
          </div>
        </div>

        <div>
          <div
            style={
              styles.sidebarProfile
            }
          >
            <div
              style={
                styles.sidebarProfileName
              }
            >
              {userName}
            </div>

            <div
              style={
                styles.sidebarProfileRole
              }
            >
              HR Administrator
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            style={
              styles.logoutButton
            }
          >
            <span>↪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <main style={styles.main}>
        <header style={styles.topbar}>
          <div>
            <div
              style={
                styles.workflowSmall
              }
            >
              Workflow 2
            </div>

            <div
              style={
                styles.workflowTitle
              }
            >
              New Joiner Asset
              Provisioning
            </div>
          </div>

          <div
            style={
              styles.topProfile
            }
          >
            <div style={styles.avatar}>
              H
            </div>

            <div>
              <div
                style={
                  styles.topProfileName
                }
              >
                {userName}
              </div>

              <div
                style={
                  styles.topProfileRole
                }
              >
                HR Admin
              </div>
            </div>
          </div>
        </header>

        <div style={styles.content}>
          <div
            style={
              styles.pageHeader
            }
          >
            <div>
              <h1
                style={
                  styles.pageTitle
                }
              >
                My Requests
              </h1>

              <p
                style={
                  styles.pageSubtitle
                }
              >
                View and track all new
                joiner asset requests
                created by HR.
              </p>
            </div>

            <div
              style={
                styles.headerActions
              }
            >
              <button
                type="button"
                onClick={
                  loadRequests
                }
                disabled={loading}
                style={
                  styles.secondaryButton
                }
              >
                {loading
                  ? "Loading..."
                  : "↻ Refresh"}
              </button>

              {/* KEEP CREATION ON DASHBOARD */}

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/hr-admin/dashboard?newRequest=true"
                  )
                }
                style={
                  styles.primaryButton
                }
              >
                + New Joiner Asset Request
              </button>
            </div>
          </div>

          {error && (
            <div
              style={
                styles.errorAlert
              }
            >
              {error}
            </div>
          )}

          {/* SUMMARY */}

          <div
            style={
              styles.summaryGrid
            }
          >
            <SummaryCard
              title="Total Requests"
              value={requests.length}
            />

            <SummaryCard
              title="In Progress"
              value={pendingCount}
            />

            <SummaryCard
              title="Allocated"
              value={completedCount}
            />

            <SummaryCard
              title="Rejected"
              value={rejectedCount}
            />
          </div>

          {/* REQUEST TABLE */}

          <section style={styles.card}>
            <div
              style={
                styles.cardHeader
              }
            >
              <div>
                <h2
                  style={
                    styles.cardTitle
                  }
                >
                  New Joiner Asset
                  Requests
                </h2>

                <p
                  style={
                    styles.cardSubtitle
                  }
                >
                  Track each request
                  through the approval
                  and allocation
                  workflow.
                </p>
              </div>

              <div style={styles.filters}>
                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search requests..."
                  style={
                    styles.searchInput
                  }
                />

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                  style={styles.select}
                >
                  <option value="ALL">
                    All Statuses
                  </option>

                  {statuses.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {prettyStatus(
                          status
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div
              style={
                styles.tableWrapper
              }
            >
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>
                      Request No
                    </th>

                    <th style={styles.th}>
                      Employee
                    </th>

                    <th style={styles.th}>
                      Department
                    </th>

                    <th style={styles.th}>
                      Joining Date
                    </th>

                    <th style={styles.th}>
                      Requested Device
                    </th>

                    <th style={styles.th}>
                      Qty
                    </th>



                    <th style={styles.th}>
                      Status
                    </th>

                    <th style={styles.th}>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={8}
                        style={
                          styles.emptyCell
                        }
                      >
                        Loading requests...
                      </td>
                    </tr>
                  ) : filteredRequests.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        style={
                          styles.emptyCell
                        }
                      >
                        {requests.length ===
                        0
                          ? "No requests have been created yet."
                          : "No requests match your search or filter."}
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map(
                      (
                        request,
                        index
                      ) => (
                        <tr
                          key={
                            request.id ||
                            `${index}`
                          }
                        >
                          <td
                            style={
                              styles.td
                            }
                          >
                            <strong>
                              {getRequestNumber(
                                request,
                                index
                              )}
                            </strong>
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            <div
                              style={
                                styles.employeeName
                              }
                            >
                              {request.employeeName ||
                                "-"}
                            </div>

                            <div
                              style={
                                styles.employeeSecondary
                              }
                            >
                              {request.employeeCode ||
                                request.employeeEmail ||
                                ""}
                            </div>
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            {request.department ||
                              "-"}
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            {formatDate(
                              request.joiningDate
                            )}
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            {getDeviceName(
                              request
                            )}
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            {request.quantity ??
                              1}
                          </td>



                          <td
                            style={
                              styles.td
                            }
                          >
                            <span
                              style={{
                                ...styles.statusBadge,
                                ...getStatusStyle(
                                  request.status
                                ),
                              }}
                            >
                              {prettyStatus(
                                request.status
                              )}
                            </span>
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedRequest(
                                  request
                                )
                              }
                              style={
                                styles.viewButton
                              }
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {/* DETAILS MODAL */}

      {selectedRequest && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div
              style={
                styles.modalHeader
              }
            >
              <div>
                <h2
                  style={
                    styles.modalTitle
                  }
                >
                  Request Details
                </h2>

                <p
                  style={
                    styles.modalSubtitle
                  }
                >
                  {selectedRequest.requestNumber ||
                    selectedRequest.requestNo ||
                    "New Joiner Asset Request"}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedRequest(
                    null
                  )
                }
                style={
                  styles.closeButton
                }
              >
                ×
              </button>
            </div>

            <div
              style={
                styles.detailsGrid
              }
            >
              <Detail
                label="Employee"
                value={
                  selectedRequest.employeeName
                }
              />

              <Detail
                label="Employee ID"
                value={
                  selectedRequest.employeeCode
                }
              />

              <Detail
                label="Email"
                value={
                  selectedRequest.employeeEmail
                }
              />

              <Detail
                label="Department"
                value={
                  selectedRequest.department
                }
              />

              <Detail
                label="Joining Date"
                value={formatDate(
                  selectedRequest.joiningDate
                )}
              />

              <Detail
                label="Device"
                value={getDeviceName(
                  selectedRequest
                )}
              />

              <Detail
                label="Quantity"
                value={String(
                  selectedRequest.quantity ??
                    1
                )}
              />



              <Detail
                label="Status"
                value={prettyStatus(
                  selectedRequest.status
                )}
              />
            </div>

            <div
              style={
                styles.blockSection
              }
            >
              <div
                style={
                  styles.detailLabel
                }
              >
                Specifications
              </div>

              <div
                style={
                  styles.blockValue
                }
              >
                {selectedRequest.specifications ||
                  "-"}
              </div>
            </div>

            <div
              style={
                styles.blockSection
              }
            >
              <div
                style={
                  styles.detailLabel
                }
              >
                Business Justification
              </div>

              <div
                style={
                  styles.blockValue
                }
              >
                {selectedRequest.businessJustification ||
                  selectedRequest.justification ||
                  "-"}
              </div>
            </div>

            <div
              style={
                styles.modalFooter
              }
            >
              <button
                type="button"
                onClick={() =>
                  setSelectedRequest(
                    null
                  )
                }
                style={
                  styles.primaryButton
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

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div style={styles.summaryCard}>
      <div
        style={
          styles.summaryLabel
        }
      >
        {title}
      </div>

      <div
        style={
          styles.summaryValue
        }
      >
        {value}
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div style={styles.detail}>
      <div
        style={
          styles.detailLabel
        }
      >
        {label}
      </div>

      <div
        style={
          styles.detailValue
        }
      >
        {value || "-"}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    color: "#10233f",
    fontFamily:
      "Inter, Arial, Helvetica, sans-serif",
  },

  sidebar: {
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    width: 285,
    background: "#0d334c",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "28px 22px 24px",
    zIndex: 30,
    boxSizing: "border-box",
  },

  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    paddingBottom: 35,
  },

  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    background: "#ffffff",
    color: "#0d334c",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: 22,
  },

  logoTitle: {
    fontSize: 21,
    fontWeight: 900,
    letterSpacing: 0.5,
  },

  logoSubtitle: {
    fontSize: 12,
    color: "#c6d5e2",
    marginTop: 3,
  },

  menu: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  menuItem: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    borderRadius: 9,
    padding: "14px 15px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
  },

  menuActive: {
    background: "#286b96",
  },

  menuIcon: {
    width: 20,
    textAlign: "center",
  },

  sidebarProfile: {
    padding: "16px 0 18px",
    borderBottom:
      "1px solid rgba(255,255,255,0.15)",
  },

  sidebarProfileName: {
    fontSize: 16,
    fontWeight: 800,
  },

  sidebarProfileRole: {
    marginTop: 4,
    color: "#c6d5e2",
    fontSize: 13,
  },

  logoutButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    padding: "13px 0",
    marginTop: 10,
  },

  main: {
    marginLeft: 285,
    minHeight: "100vh",
  },

  topbar: {
    height: 82,
    background: "#ffffff",
    borderBottom: "1px solid #dce4ed",
    padding: "0 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxSizing: "border-box",
  },

  workflowSmall: {
    fontSize: 13,
    color: "#6f8298",
  },

  workflowTitle: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: 800,
  },

  topProfile: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "#0d334c",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: 18,
  },

  topProfileName: {
    fontWeight: 800,
    fontSize: 15,
  },

  topProfileRole: {
    marginTop: 2,
    fontSize: 12,
    color: "#74869b",
  },

  content: {
    padding: "36px 32px 60px",
  },

  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 26,
  },

  pageTitle: {
    margin: 0,
    fontSize: 32,
    fontWeight: 900,
    color: "#102b47",
  },

  pageSubtitle: {
    margin: "8px 0 0",
    color: "#687c92",
    fontSize: 15,
  },

  headerActions: {
    display: "flex",
    gap: 10,
  },

  primaryButton: {
    border: "none",
    borderRadius: 8,
    background: "#1876e8",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: 14,
    padding: "13px 18px",
    cursor: "pointer",
  },

  secondaryButton: {
    border: "1px solid #cbd8e5",
    borderRadius: 8,
    background: "#ffffff",
    color: "#29445f",
    fontWeight: 700,
    fontSize: 14,
    padding: "13px 18px",
    cursor: "pointer",
  },

  errorAlert: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    padding: "13px 16px",
    borderRadius: 8,
    marginBottom: 20,
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: 16,
    marginBottom: 25,
  },

  summaryCard: {
    background: "#ffffff",
    border: "1px solid #d9e3ee",
    borderRadius: 10,
    padding: 20,
  },

  summaryLabel: {
    color: "#647991",
    fontWeight: 700,
    fontSize: 14,
  },

  summaryValue: {
    marginTop: 12,
    fontSize: 32,
    fontWeight: 900,
  },

  card: {
    background: "#ffffff",
    border: "1px solid #d9e3ee",
    borderRadius: 12,
    overflow: "hidden",
  },

  cardHeader: {
    padding: "24px 26px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    borderBottom: "1px solid #e4ebf2",
  },

  cardTitle: {
    margin: 0,
    fontSize: 22,
  },

  cardSubtitle: {
    margin: "6px 0 0",
    color: "#71849b",
    fontSize: 14,
  },

  filters: {
    display: "flex",
    gap: 10,
  },

  searchInput: {
    width: 260,
    height: 42,
    border: "1px solid #cdd9e5",
    borderRadius: 7,
    padding: "0 12px",
    fontSize: 14,
    outline: "none",
  },

  select: {
    height: 42,
    border: "1px solid #cdd9e5",
    borderRadius: 7,
    padding: "0 12px",
    background: "#ffffff",
    fontSize: 14,
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: 1100,
    borderCollapse: "collapse",
  },

  th: {
    background: "#f5f7fa",
    padding: "14px 16px",
    textAlign: "left",
    fontSize: 13,
    color: "#40566f",
    whiteSpace: "nowrap",
  },

  td: {
    padding: 16,
    borderTop: "1px solid #e5ebf1",
    fontSize: 14,
    color: "#1a324c",
    verticalAlign: "middle",
  },

  emptyCell: {
    padding: "55px 20px",
    textAlign: "center",
    color: "#71849b",
  },

  employeeName: {
    fontWeight: 700,
  },

  employeeSecondary: {
    marginTop: 4,
    color: "#71849b",
    fontSize: 12,
  },

  statusBadge: {
    display: "inline-block",
    borderRadius: 999,
    padding: "7px 10px",
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  viewButton: {
    border: "1px solid #bdd6f2",
    background: "#ffffff",
    color: "#1266c8",
    borderRadius: 7,
    padding: "8px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(12,31,48,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 100,
  },

  modal: {
    width: "min(720px, 100%)",
    maxHeight: "calc(100vh - 40px)",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: 12,
    boxShadow:
      "0 20px 60px rgba(0,0,0,0.25)",
  },

  modalHeader: {
    padding: "22px 25px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "1px solid #e4eaf0",
  },

  modalTitle: {
    margin: 0,
    fontSize: 23,
  },

  modalSubtitle: {
    margin: "6px 0 0",
    color: "#71849b",
  },

  closeButton: {
    width: 38,
    height: 38,
    border: "1px solid #d4dee8",
    borderRadius: 8,
    background: "#ffffff",
    fontSize: 22,
    cursor: "pointer",
  },

  detailsGrid: {
    padding: "24px 25px",
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },

  detail: {
    border: "1px solid #e0e7ef",
    borderRadius: 8,
    background: "#f8fafc",
    padding: 14,
  },

  detailLabel: {
    color: "#75879c",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
  },

  detailValue: {
    marginTop: 7,
    color: "#18304b",
    fontSize: 14,
    fontWeight: 700,
  },

  blockSection: {
    margin: "0 25px 14px",
    padding: 15,
    border: "1px solid #e0e7ef",
    borderRadius: 8,
    background: "#f8fafc",
  },

  blockValue: {
    marginTop: 8,
    color: "#18304b",
    lineHeight: 1.6,
  },

  modalFooter: {
    padding: "20px 25px",
    borderTop: "1px solid #e5ebf1",
    display: "flex",
    justifyContent: "flex-end",
  },
};