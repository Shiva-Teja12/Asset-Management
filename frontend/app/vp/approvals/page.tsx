"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";

import Side from "@/components/Side";
import { api } from "@/lib/api";

/* =========================================================
   TYPES
   ========================================================= */

type OnboardingRequestStatus =
  | "PENDING_ASSET_ADMIN"
  | "PENDING_VP_APPROVAL"
  | "VP_APPROVED"
  | "VP_REJECTED"
  | "PENDING_ALLOCATION"
  | "ALLOCATED"
  | "COMPLETED";

type OnboardingRequest = {
  id: string;
  requestNumber: string;

  employeeName: string;
  employeeEmail: string;
  employeeCode?: string | null;

  department: string;
  designation?: string | null;
  joiningDate: string;

  deviceCategory: string;
  quantity: number;

  specifications?: string | null;
  estimatedCost?: number | null;
  businessJustification: string;

  status: OnboardingRequestStatus;

  createdByEmail?: string | null;
  createdByName?: string | null;

  assetAdminEmail?: string | null;
  assetAdminComment?: string | null;
  assetAdminReviewedAt?: string | null;

  vpEmail?: string | null;
  vpComment?: string | null;
  vpReviewedAt?: string | null;

  assignedAssetId?: string | null;
  allocatedAt?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
};

/* =========================================================
   FORMATTERS
   ========================================================= */

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
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

function formatDateTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value?: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function statusLabel(status: OnboardingRequestStatus) {
  switch (status) {
    case "PENDING_ASSET_ADMIN":
      return "Pending Asset Admin";

    case "PENDING_VP_APPROVAL":
      return "Pending VP Approval";

    case "VP_APPROVED":
      return "VP Approved";

    case "VP_REJECTED":
      return "VP Rejected";

    case "PENDING_ALLOCATION":
      return "Pending Allocation";

    case "ALLOCATED":
      return "Allocated";

    case "COMPLETED":
      return "Completed";

    default:
      return status;
  }
}

/* =========================================================
   PAGE
   ========================================================= */

export default function VpApprovalsPage() {
  const router = useRouter();

  const [requests, setRequests] =
    useState<OnboardingRequest[]>([]);

  const [selected, setSelected] =
    useState<OnboardingRequest | null>(null);

  const [comment, setComment] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  /* =========================================================
     LOAD VP REQUESTS
     ========================================================= */

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await api(
        "/api/v1/onboarding/requests/vp"
      );

      setRequests(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load VP approval requests."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================================================
     AUTHENTICATION
     ========================================================= */

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    const role =
      localStorage.getItem("role");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (role !== "VP") {
      router.replace("/");
      return;
    }

    loadRequests();
  }, [router, loadRequests]);

  /* =========================================================
     ONLY PENDING VP REQUESTS
     ========================================================= */

  const pendingRequests = useMemo(() => {
    return requests.filter(
      (request) =>
        request.status ===
        "PENDING_VP_APPROVAL"
    );
  }, [requests]);

  /* =========================================================
     SEARCH
     ========================================================= */

  const filteredRequests = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    if (!value) {
      return pendingRequests;
    }

    return pendingRequests.filter(
      (request) =>
        request.requestNumber
          ?.toLowerCase()
          .includes(value) ||
        request.employeeName
          ?.toLowerCase()
          .includes(value) ||
        request.employeeEmail
          ?.toLowerCase()
          .includes(value) ||
        request.department
          ?.toLowerCase()
          .includes(value) ||
        request.deviceCategory
          ?.toLowerCase()
          .includes(value)
    );
  }, [pendingRequests, search]);

  /* =========================================================
     TOTAL VALUE
     ========================================================= */

  const totalEstimatedValue = useMemo(() => {
    return pendingRequests.reduce(
      (total, request) =>
        total +
        Number(request.estimatedCost ?? 0),
      0
    );
  }, [pendingRequests]);

  /* =========================================================
     OPEN REQUEST
     ========================================================= */

  function openRequest(
    request: OnboardingRequest
  ) {
    setSelected(request);
    setComment("");
    setError("");
    setSuccess("");
  }

  /* =========================================================
     CLOSE MODAL
     ========================================================= */

  function closeModal() {
    if (submitting) {
      return;
    }

    setSelected(null);
    setComment("");
    setError("");
    setSuccess("");
  }

  /* =========================================================
     APPROVE
     ========================================================= */

  async function approveRequest() {
    if (!selected) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await api(
        `/api/v1/onboarding/requests/${selected.id}/vp/approve`,
        {
          method: "POST",

          body: JSON.stringify({
            comment:
              comment.trim() || null,
          }),
        }
      );

      setSuccess(
        "Request approved successfully. It has been moved to Asset Allocation."
      );

      await loadRequests();

      window.setTimeout(() => {
        setSelected(null);
        setComment("");
        setSuccess("");
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to approve request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =========================================================
     REJECT
     ========================================================= */

  async function rejectRequest() {
    if (!selected) {
      return;
    }

    if (!comment.trim()) {
      setError(
        "Please enter a rejection reason before rejecting the request."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await api(
        `/api/v1/onboarding/requests/${selected.id}/vp/reject`,
        {
          method: "POST",

          body: JSON.stringify({
            comment: comment.trim(),
          }),
        }
      );

      setSuccess(
        "Request rejected successfully."
      );

      await loadRequests();

      window.setTimeout(() => {
        setSelected(null);
        setComment("");
        setSuccess("");
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reject request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.shell}>
      <Side role="vp" />

      <main style={styles.main}>
        {/* HEADER */}

        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>
              VP / HIGHER AUTHORITY
            </div>

            <h1 style={styles.title}>
              Asset Approvals
            </h1>

            <p style={styles.subtitle}>
              Review and authorize asset
              requests forwarded by the Asset
              Admin.
            </p>
          </div>

          <button
            type="button"
            style={styles.refreshButton}
            onClick={loadRequests}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>

        {/* TOP CARDS */}

        <section style={styles.cards}>
          <div style={styles.card}>
            <div>
              <div style={styles.cardLabel}>
                Pending Approvals
              </div>

              <div style={styles.cardValue}>
                {pendingRequests.length}
              </div>

              <div style={styles.cardHelper}>
                Waiting for VP decision
              </div>
            </div>

            <div
              style={{
                ...styles.cardIcon,
                backgroundColor: "#eaf2ff",
                color: "#1473e6",
              }}
            >
              ✓
            </div>
          </div>

          <div style={styles.card}>
            <div>
              <div style={styles.cardLabel}>
                Estimated Value
              </div>

              <div style={styles.cardValue}>
                {formatMoney(
                  totalEstimatedValue
                )}
              </div>

              <div style={styles.cardHelper}>
                Pending approval value
              </div>
            </div>

            <div
              style={{
                ...styles.cardIcon,
                backgroundColor: "#eafaf1",
                color: "#159455",
              }}
            >
              ₹
            </div>
          </div>
        </section>

        {/* ERROR */}

        {error && !selected && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {/* APPROVAL TABLE */}

        <section style={styles.tableCard}>
          <div style={styles.tableTop}>
            <div>
              <h2 style={styles.sectionTitle}>
                Pending Requests
              </h2>

              <p style={styles.sectionSubtitle}>
                Requests waiting for your
                authorization.
              </p>
            </div>

            <div style={styles.searchContainer}>
              <span style={styles.searchIcon}>
                ⌕
              </span>

              <input
                style={styles.searchInput}
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search request, employee, department..."
              />
            </div>
          </div>

          {loading ? (
            <div style={styles.empty}>
              Loading approval requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>
                ✓
              </div>

              <h3 style={styles.emptyTitle}>
                No pending approvals
              </h3>

              <p style={styles.emptyText}>
                There are currently no asset
                requests waiting for VP
                approval.
              </p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>
                      REQUEST
                    </th>

                    <th style={styles.th}>
                      EMPLOYEE
                    </th>

                    <th style={styles.th}>
                      DEPARTMENT
                    </th>

                    <th style={styles.th}>
                      DEVICE
                    </th>

                    <th style={styles.th}>
                      JOINING DATE
                    </th>

                    <th style={styles.th}>
                      EST. COST
                    </th>

                    <th style={styles.th}>
                      STATUS
                    </th>

                    <th style={styles.th}>
                      ACTION
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.map(
                    (request) => (
                      <tr key={request.id}>
                        <td style={styles.td}>
                          <div
                            style={
                              styles.requestNumber
                            }
                          >
                            {
                              request.requestNumber
                            }
                          </div>

                          <div
                            style={
                              styles.smallText
                            }
                          >
                            {formatDate(
                              request.createdAt
                            )}
                          </div>
                        </td>

                        <td style={styles.td}>
                          <div
                            style={
                              styles.primaryText
                            }
                          >
                            {
                              request.employeeName
                            }
                          </div>

                          <div
                            style={
                              styles.smallText
                            }
                          >
                            {
                              request.employeeEmail
                            }
                          </div>
                        </td>

                        <td style={styles.td}>
                          {request.department}
                        </td>

                        <td style={styles.td}>
                          <div
                            style={
                              styles.primaryText
                            }
                          >
                            {
                              request.deviceCategory
                            }
                          </div>

                          <div
                            style={
                              styles.smallText
                            }
                          >
                            Qty:{" "}
                            {request.quantity}
                          </div>
                        </td>

                        <td style={styles.td}>
                          {formatDate(
                            request.joiningDate
                          )}
                        </td>

                        <td style={styles.td}>
                          <strong>
                            {formatMoney(
                              request.estimatedCost
                            )}
                          </strong>
                        </td>

                        <td style={styles.td}>
                          <span
                            style={
                              styles.statusBadge
                            }
                          >
                            {statusLabel(
                              request.status
                            )}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <button
                            type="button"
                            style={
                              styles.reviewButton
                            }
                            onClick={() =>
                              openRequest(
                                request
                              )
                            }
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* =====================================================
          REVIEW MODAL
          ===================================================== */}

      {selected && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            {/* HEADER */}

            <div style={styles.modalHeader}>
              <div>
                <div
                  style={
                    styles.modalRequestNumber
                  }
                >
                  {selected.requestNumber}
                </div>

                <h2 style={styles.modalTitle}>
                  Asset Approval
                </h2>

                <p style={styles.modalSubtitle}>
                  Review all request information
                  before approving or rejecting.
                </p>
              </div>

              <button
                type="button"
                style={styles.closeButton}
                onClick={closeModal}
                disabled={submitting}
              >
                ×
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* WORKFLOW */}

              <section
                style={styles.modalSection}
              >
                <h3
                  style={
                    styles.modalSectionTitle
                  }
                >
                  Approval Workflow
                </h3>

                <div style={styles.workflow}>
                  <WorkflowStep
                    number="✓"
                    title="HR Admin"
                    subtitle="Submitted"
                    completed
                  />

                  <div style={styles.arrow}>
                    →
                  </div>

                  <WorkflowStep
                    number="✓"
                    title="Asset Admin"
                    subtitle="Reviewed"
                    completed
                  />

                  <div style={styles.arrow}>
                    →
                  </div>

                  <WorkflowStep
                    number="3"
                    title="VP"
                    subtitle="Your Decision"
                    active
                  />

                  <div style={styles.arrow}>
                    →
                  </div>

                  <WorkflowStep
                    number="4"
                    title="Allocation"
                    subtitle="Next Stage"
                  />
                </div>
              </section>

              {/* EMPLOYEE DETAILS */}

              <section
                style={styles.modalSection}
              >
                <h3
                  style={
                    styles.modalSectionTitle
                  }
                >
                  Employee Details
                </h3>

                <div style={styles.detailBox}>
                  <div
                    style={styles.detailGrid}
                  >
                    <Detail
                      label="Employee Name"
                      value={
                        selected.employeeName
                      }
                    />

                    <Detail
                      label="Employee Email"
                      value={
                        selected.employeeEmail
                      }
                    />

                    <Detail
                      label="Employee Code"
                      value={
                        selected.employeeCode
                      }
                    />

                    <Detail
                      label="Department"
                      value={
                        selected.department
                      }
                    />

                    <Detail
                      label="Designation"
                      value={
                        selected.designation
                      }
                    />

                    <Detail
                      label="Joining Date"
                      value={formatDate(
                        selected.joiningDate
                      )}
                    />
                  </div>
                </div>
              </section>

              {/* ASSET DETAILS */}

              <section
                style={styles.modalSection}
              >
                <h3
                  style={
                    styles.modalSectionTitle
                  }
                >
                  Asset Requirement
                </h3>

                <div style={styles.detailBox}>
                  <div
                    style={styles.detailGrid}
                  >
                    <Detail
                      label="Device Category"
                      value={
                        selected.deviceCategory
                      }
                    />

                    <Detail
                      label="Quantity"
                      value={String(
                        selected.quantity
                      )}
                    />

                    <Detail
                      label="Estimated Cost"
                      value={formatMoney(
                        selected.estimatedCost
                      )}
                    />

                    <Detail
                      label="Specifications"
                      value={
                        selected.specifications
                      }
                    />
                  </div>

                  <div
                    style={
                      styles.separatedDetail
                    }
                  >
                    <Detail
                      label="Business Justification"
                      value={
                        selected.businessJustification
                      }
                    />
                  </div>
                </div>
              </section>

              {/* ASSET ADMIN */}

              <section
                style={styles.modalSection}
              >
                <h3
                  style={
                    styles.modalSectionTitle
                  }
                >
                  Asset Admin Review
                </h3>

                <div
                  style={
                    styles.adminReviewBox
                  }
                >
                  <div
                    style={styles.detailGrid}
                  >
                    <Detail
                      label="Reviewed By"
                      value={
                        selected.assetAdminEmail
                      }
                    />

                    <Detail
                      label="Reviewed At"
                      value={formatDateTime(
                        selected.assetAdminReviewedAt
                      )}
                    />
                  </div>

                  <div
                    style={
                      styles.separatedDetail
                    }
                  >
                    <Detail
                      label="Asset Admin Comment"
                      value={
                        selected.assetAdminComment
                      }
                    />
                  </div>
                </div>
              </section>

              {/* VP DECISION */}

              <section
                style={styles.modalSection}
              >
                <h3
                  style={
                    styles.modalSectionTitle
                  }
                >
                  VP Decision
                </h3>

                <p style={styles.helpText}>
                  Approval comments are optional.
                  A rejection reason is required
                  when rejecting a request.
                </p>

                <textarea
                  style={styles.textarea}
                  value={comment}
                  rows={4}
                  onChange={(event) =>
                    setComment(
                      event.target.value
                    )
                  }
                  placeholder="Enter approval comment or rejection reason..."
                />
              </section>

              {error && (
                <div style={styles.modalError}>
                  {error}
                </div>
              )}

              {success && (
                <div
                  style={styles.modalSuccess}
                >
                  ✓ {success}
                </div>
              )}
            </div>

            {/* FOOTER */}

            <div style={styles.modalFooter}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={closeModal}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="button"
                style={styles.rejectButton}
                onClick={rejectRequest}
                disabled={submitting}
              >
                {submitting
                  ? "Processing..."
                  : "Reject Request"}
              </button>

              <button
                type="button"
                style={styles.approveButton}
                onClick={approveRequest}
                disabled={submitting}
              >
                {submitting
                  ? "Processing..."
                  : "Approve Request →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   DETAIL COMPONENT
   ========================================================= */

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <div style={styles.detailLabel}>
        {label}
      </div>

      <div style={styles.detailValue}>
        {value || "—"}
      </div>
    </div>
  );
}

/* =========================================================
   WORKFLOW STEP
   ========================================================= */

function WorkflowStep({
  number,
  title,
  subtitle,
  completed = false,
  active = false,
}: {
  number: string;
  title: string;
  subtitle: string;
  completed?: boolean;
  active?: boolean;
}) {
  let circleStyle: CSSProperties = {
    ...styles.workflowCircle,
  };

  if (completed) {
    circleStyle = {
      ...circleStyle,
      backgroundColor: "#159455",
      borderColor: "#159455",
      color: "#ffffff",
    };
  }

  if (active) {
    circleStyle = {
      ...circleStyle,
      backgroundColor: "#1473e6",
      borderColor: "#1473e6",
      color: "#ffffff",
    };
  }

  return (
    <div style={styles.workflowStep}>
      <div style={circleStyle}>
        {number}
      </div>

      <div>
        <div style={styles.workflowTitle}>
          {title}
        </div>

        <div
          style={styles.workflowSubtitle}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STYLES
   ========================================================= */

const styles: Record<
  string,
  CSSProperties
> = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f5f8fc",
    color: "#14283d",
  },

  main: {
    flex: 1,
    minWidth: 0,
    padding: "34px 38px 50px",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "27px",
  },

  eyebrow: {
    color: "#1473e6",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "1.4px",
    marginBottom: "8px",
  },

  title: {
    margin: 0,
    color: "#14283d",
    fontSize: "31px",
    fontWeight: 800,
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#718399",
    fontSize: "14px",
  },

  refreshButton: {
    border: "none",
    borderRadius: "9px",
    backgroundColor: "#1473e6",
    color: "#ffffff",
    padding: "11px 18px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "18px",
    marginBottom: "22px",
  },

  card: {
    minHeight: "112px",
    padding: "20px 22px",
    border: "1px solid #e3eaf2",
    borderRadius: "13px",
    backgroundColor: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxSizing: "border-box",
    boxShadow:
      "0 3px 12px rgba(15,42,64,0.04)",
  },

  cardLabel: {
    color: "#72849a",
    fontSize: "12px",
    fontWeight: 600,
  },

  cardValue: {
    marginTop: "8px",
    color: "#14283d",
    fontSize: "28px",
    fontWeight: 800,
  },

  cardHelper: {
    marginTop: "5px",
    color: "#91a0b1",
    fontSize: "11px",
  },

  cardIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    fontWeight: 800,
  },

  errorBox: {
    marginBottom: "20px",
    padding: "13px 16px",
    backgroundColor: "#fff0f0",
    border: "1px solid #f4c7c7",
    borderRadius: "10px",
    color: "#b42318",
    fontSize: "13px",
    fontWeight: 600,
  },

  tableCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e3eaf2",
    borderRadius: "13px",
    overflow: "hidden",
    boxShadow:
      "0 3px 12px rgba(15,42,64,0.04)",
  },

  tableTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    padding: "21px 23px",
    borderBottom: "1px solid #e7edf4",
  },

  sectionTitle: {
    margin: 0,
    color: "#14283d",
    fontSize: "17px",
    fontWeight: 800,
  },

  sectionSubtitle: {
    margin: "6px 0 0",
    color: "#7f90a3",
    fontSize: "12px",
  },

  searchContainer: {
    width: "320px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "0 12px",
    border: "1px solid #d7e0e9",
    borderRadius: "9px",
    backgroundColor: "#ffffff",
    boxSizing: "border-box",
  },

  searchIcon: {
    color: "#8a9bad",
    fontSize: "17px",
  },

  searchInput: {
    width: "100%",
    height: "39px",
    border: "none",
    outline: "none",
    backgroundColor: "transparent",
    color: "#263e55",
    fontSize: "12px",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: "1100px",
    borderCollapse: "collapse",
  },

  th: {
    padding: "13px 17px",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e7edf4",
    color: "#7b8da1",
    textAlign: "left",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.5px",
  },

  td: {
    padding: "16px 17px",
    borderBottom: "1px solid #edf1f5",
    color: "#30465c",
    fontSize: "12px",
    verticalAlign: "middle",
  },

  requestNumber: {
    color: "#1473e6",
    fontSize: "12px",
    fontWeight: 800,
  },

  primaryText: {
    color: "#20374d",
    fontWeight: 700,
  },

  smallText: {
    marginTop: "4px",
    color: "#8798aa",
    fontSize: "10px",
  },

  statusBadge: {
    display: "inline-block",
    padding: "6px 10px",
    border: "1px solid #f4dfb5",
    borderRadius: "999px",
    backgroundColor: "#fff5df",
    color: "#9a6200",
    fontSize: "10px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  reviewButton: {
    border: "1px solid #bcd5f3",
    borderRadius: "7px",
    backgroundColor: "#edf5ff",
    color: "#1473e6",
    padding: "7px 14px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 800,
  },

  empty: {
    padding: "65px 20px",
    textAlign: "center",
    color: "#718399",
    fontSize: "13px",
  },

  emptyIcon: {
    width: "46px",
    height: "46px",
    margin: "0 auto",
    borderRadius: "50%",
    backgroundColor: "#eaf8f0",
    color: "#159455",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    fontWeight: 800,
  },

  emptyTitle: {
    margin: "13px 0 0",
    color: "#20374d",
    fontSize: "16px",
  },

  emptyText: {
    margin: "7px 0 0",
    color: "#8798aa",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    backgroundColor:
      "rgba(8,27,43,0.58)",
  },

  modal: {
    width: "100%",
    maxWidth: "930px",
    maxHeight: "92vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow:
      "0 25px 70px rgba(0,0,0,0.25)",
  },

  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "24px 28px",
    borderBottom: "1px solid #e4eaf1",
  },

  modalRequestNumber: {
    marginBottom: "5px",
    color: "#1473e6",
    fontSize: "11px",
    fontWeight: 800,
  },

  modalTitle: {
    margin: 0,
    color: "#14283d",
    fontSize: "23px",
    fontWeight: 800,
  },

  modalSubtitle: {
    margin: "6px 0 0",
    color: "#8091a4",
    fontSize: "12px",
  },

  closeButton: {
    width: "38px",
    height: "38px",
    border: "none",
    borderRadius: "9px",
    backgroundColor: "#f1f5f9",
    color: "#53677c",
    cursor: "pointer",
    fontSize: "22px",
  },

  modalBody: {
    overflowY: "auto",
    padding: "24px 28px",
  },

  modalSection: {
    marginBottom: "25px",
  },

  modalSectionTitle: {
    margin: "0 0 12px",
    color: "#14283d",
    fontSize: "15px",
    fontWeight: 800,
  },

  workflow: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "17px",
    border: "1px solid #dfe7ef",
    borderRadius: "11px",
    backgroundColor: "#f8fafc",
  },

  workflowStep: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  workflowCircle: {
    width: "34px",
    height: "34px",
    minWidth: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #c9d5e2",
    borderRadius: "50%",
    color: "#7d8fa3",
    fontSize: "12px",
    fontWeight: 800,
    boxSizing: "border-box",
  },

  workflowTitle: {
    color: "#21384f",
    fontSize: "12px",
    fontWeight: 800,
  },

  workflowSubtitle: {
    marginTop: "3px",
    color: "#8495a8",
    fontSize: "10px",
  },

  arrow: {
    color: "#9aabba",
    fontSize: "18px",
  },

  detailBox: {
    padding: "18px",
    border: "1px solid #e1e8f0",
    borderRadius: "11px",
    backgroundColor: "#ffffff",
  },

  detailGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "18px 28px",
  },

  detailLabel: {
    color: "#8495a8",
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  detailValue: {
    marginTop: "5px",
    color: "#20374d",
    fontSize: "12px",
    fontWeight: 600,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },

  separatedDetail: {
    marginTop: "18px",
    paddingTop: "16px",
    borderTop: "1px solid #edf1f5",
  },

  adminReviewBox: {
    padding: "18px",
    border: "1px solid #cce8d8",
    borderRadius: "11px",
    backgroundColor: "#f0faf4",
  },

  helpText: {
    margin: "0 0 10px",
    color: "#8192a5",
    fontSize: "11px",
  },

  textarea: {
    width: "100%",
    minHeight: "100px",
    padding: "12px 13px",
    border: "1px solid #cfd9e4",
    borderRadius: "9px",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    color: "#20374d",
    fontFamily: "inherit",
    fontSize: "12px",
  },

  modalError: {
    padding: "12px 14px",
    border: "1px solid #f4c7c7",
    borderRadius: "9px",
    backgroundColor: "#fff0f0",
    color: "#b42318",
    fontSize: "12px",
    fontWeight: 600,
  },

  modalSuccess: {
    padding: "12px 14px",
    border: "1px solid #c8e9d5",
    borderRadius: "9px",
    backgroundColor: "#eefaf3",
    color: "#16794a",
    fontSize: "12px",
    fontWeight: 700,
  },

  modalFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "10px",
    padding: "17px 28px",
    borderTop: "1px solid #e4eaf1",
  },

  cancelButton: {
    padding: "10px 16px",
    border: "1px solid #ccd7e2",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#42586e",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 700,
  },

  rejectButton: {
    padding: "10px 17px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#d64545",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 700,
  },

  approveButton: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#159455",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 800,
  },
};