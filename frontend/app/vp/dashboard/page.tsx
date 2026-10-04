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
  | "PURCHASE_REQUESTED"
  | "PENDING_FINANCE_APPROVAL"
  | "FINANCE_APPROVED"
  | "FINANCE_REJECTED"
  | "PENDING_PR_VP_APPROVAL"
  | "PR_VP_APPROVED"
  | "PR_VP_REJECTED"
  | "PENDING_VENDOR_ORDER"
  | "ORDERED"
  | "DELIVERED"
  | "INSPECTION_PASSED"
  | "INSPECTION_FAILED"
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

  financeEmail?: string | null;
  financeComment?: string | null;
  financeReviewedAt?: string | null;

  budgetAvailable?: number | null;
  amountRequested?: number | null;
  remainingBudget?: number | null;
  budgetStatus?: string | null;
  costCenter?: string | null;

  vpEmail?: string | null;
  vpComment?: string | null;
  vpReviewedAt?: string | null;

  purchaseVpEmail?: string | null;
  purchaseVpComment?: string | null;
  purchaseVpReviewedAt?: string | null;

  assignedAssetId?: string | null;
  allocatedAt?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
};

type VpDecisionHistory = {
  key: string;
  request: OnboardingRequest;
  stage: "INITIAL_VP" | "PURCHASE_VP";
  decision: "APPROVED" | "REJECTED";
  email?: string | null;
  comment?: string | null;
  reviewedAt: string;
};

type DecisionConfirmation = {
  type: "APPROVED" | "REJECTED";
  requestNumber: string;
  employeeName: string;
  employeeEmail: string;
  deviceCategory: string;
  quantity: number;
  estimatedCost?: number | null;
};

/* =========================================================
   FORMATTERS
   ========================================================= */

function formatDate(value?: string | null) {
  if (!value) return "—";

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
  if (!value) return "—";

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

    case "PENDING_PR_VP_APPROVAL":
      return "Pending PR VP Approval";

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

export default function VpDashboardPage() {
  const router = useRouter();

  const [requests, setRequests] =
    useState<OnboardingRequest[]>([]);

  const [selected, setSelected] =
    useState<OnboardingRequest | null>(null);

  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  const [confirmation, setConfirmation] =
    useState<DecisionConfirmation | null>(null);

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
          : "Unable to load VP requests."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================================================
     AUTH CHECK
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
     PENDING
     ========================================================= */
const pendingRequests = useMemo(() => {
  return requests.filter(
    (request) =>
      request.status === "PENDING_VP_APPROVAL" ||
      request.status === "PENDING_PR_VP_APPROVAL"
  );
}, [requests]);

  /* =========================================================
     RECENT VP DECISIONS
     ========================================================= */

  const recentDecisions = useMemo(() => {
    const decisions: VpDecisionHistory[] = [];

    requests.forEach((request) => {
      // Initial VP decision
      if (request.vpReviewedAt) {
        decisions.push({
          key: `${request.id}-initial-vp`,
          request,
          stage: "INITIAL_VP",
          decision:
            request.status === "VP_REJECTED"
              ? "REJECTED"
              : "APPROVED",
          email: request.vpEmail,
          comment: request.vpComment,
          reviewedAt: request.vpReviewedAt,
        });
      }

      // Purchase / PR VP decision
      if (request.purchaseVpReviewedAt) {
        decisions.push({
          key: `${request.id}-purchase-vp`,
          request,
          stage: "PURCHASE_VP",
          decision:
            request.status === "PR_VP_REJECTED"
              ? "REJECTED"
              : "APPROVED",
          email: request.purchaseVpEmail,
          comment: request.purchaseVpComment,
          reviewedAt: request.purchaseVpReviewedAt,
        });
      }
    });

    return decisions
      .sort(
        (a, b) =>
          new Date(b.reviewedAt).getTime() -
          new Date(a.reviewedAt).getTime()
      )
      .slice(0, 10);
  }, [requests]);
  /* =========================================================
     TOTAL PENDING VALUE
     ========================================================= */

  const estimatedTotal = useMemo(() => {
    return pendingRequests.reduce(
      (total, request) =>
        total +
        Number(request.estimatedCost ?? 0),
      0
    );
  }, [pendingRequests]);

  /* =========================================================
     LATEST REQUEST FOR DASHBOARD WORKFLOW
     ========================================================= */

  const latestWorkflowRequest =
    useMemo(() => {
      if (pendingRequests.length > 0) {
        return pendingRequests[0];
      }

      if (recentDecisions.length > 0) {
        return recentDecisions[0].request;
      }

      return null;
    }, [
      pendingRequests,
      recentDecisions,
    ]);
  const vpApproved =
    latestWorkflowRequest != null &&
    latestWorkflowRequest.vpReviewedAt != null &&
    latestWorkflowRequest.status !==
      "VP_REJECTED";

  const vpRejected =
    latestWorkflowRequest?.status ===
    "VP_REJECTED";

  const allocationCompleted =
    latestWorkflowRequest?.status ===
      "ALLOCATED" ||
    latestWorkflowRequest?.status ===
      "COMPLETED";

  const allocationPending =
    latestWorkflowRequest?.status ===
      "PENDING_ALLOCATION";

  /* =========================================================
     MODAL
     ========================================================= */

  function openRequest(
    request: OnboardingRequest
  ) {
    setSelected(request);
    setComment("");
    setError("");
  }

  function closeModal() {
    if (submitting) return;

    setSelected(null);
    setComment("");
    setError("");
  }

  /* =========================================================
     APPROVE
     ========================================================= */

  async function approveRequest() {
    if (!selected) return;

    const processed = selected;

    try {
      setSubmitting(true);
      setError("");

      const approveEndpoint =
        processed.status === "PENDING_PR_VP_APPROVAL"
          ? `/api/v1/onboarding/requests/${processed.id}/vp/pr/approve`
          : `/api/v1/onboarding/requests/${processed.id}/vp/approve`;

      await api(approveEndpoint, {
        method: "POST",
        body: JSON.stringify({
          comment: comment.trim() || null,
        }),
      });

      setConfirmation({
        type: "APPROVED",
        requestNumber:
          processed.requestNumber,
        employeeName:
          processed.employeeName,
        employeeEmail:
          processed.employeeEmail,
        deviceCategory:
          processed.deviceCategory,
        quantity: processed.quantity,
        estimatedCost:
          processed.estimatedCost,
      });

      setSelected(null);
      setComment("");

      await loadRequests();
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
    if (!selected) return;

    if (!comment.trim()) {
      setError(
        "Please enter a rejection reason."
      );
      return;
    }

    const processed = selected;

    try {
      setSubmitting(true);
      setError("");

      const rejectEndpoint =
        processed.status === "PENDING_PR_VP_APPROVAL"
          ? `/api/v1/onboarding/requests/${processed.id}/vp/pr/reject`
          : `/api/v1/onboarding/requests/${processed.id}/vp/reject`;

      await api(rejectEndpoint, {
        method: "POST",
        body: JSON.stringify({
          comment: comment.trim(),
        }),
      });

      setConfirmation({
        type: "REJECTED",
        requestNumber:
          processed.requestNumber,
        employeeName:
          processed.employeeName,
        employeeEmail:
          processed.employeeEmail,
        deviceCategory:
          processed.deviceCategory,
        quantity: processed.quantity,
        estimatedCost:
          processed.estimatedCost,
      });

      setSelected(null);
      setComment("");

      await loadRequests();
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
  const isLatestPurchaseVpApproval =
      latestWorkflowRequest?.status === "PENDING_PR_VP_APPROVAL" ||
      latestWorkflowRequest?.status === "PENDING_VENDOR_ORDER";

  const isPurchaseVpApproval =
    selected?.status === "PENDING_PR_VP_APPROVAL";
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
              Approval Dashboard
            </h1>

            <p style={styles.subtitle}>
              Review new joiner asset requests
              forwarded by the Asset Admin.
            </p>
          </div>

          <div
              style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
              }}
          >
              <button
                  type="button"
                  onClick={() => void loadRequests()}
                  style={{
                      padding: "11px 20px",
                      border: "none",
                      background: "#1677e8",
                      color: "#ffffff",
                      borderRadius: "10px",
                      fontSize: "14px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
                  }}
              >
                  ↻ Refresh
              </button>

              <button
                  type="button"
                  onClick={() => {
                      localStorage.clear();
                      window.location.href = "/";
                  }}
                  style={{
                      padding: "10px 18px",
                      border: "1px solid #dc2626",
                      background: "#ffffff",
                      color: "#dc2626",
                      borderRadius: "8px",
                      fontWeight: 700,
                      cursor: "pointer",
                  }}
              >
                  Logout
              </button>
          </div>
        </div>

        {/* CONFIRMATION */}

        {confirmation && (
          <div
            style={
              confirmation.type ===
              "APPROVED"
                ? styles.approvedConfirmation
                : styles.rejectedConfirmation
            }
          >
            <div
              style={
                confirmation.type ===
                "APPROVED"
                  ? styles.confirmationIconApproved
                  : styles.confirmationIconRejected
              }
            >
              {confirmation.type ===
              "APPROVED"
                ? "✓"
                : "×"}
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={
                  styles.confirmationTitle
                }
              >
                {confirmation.type ===
                "APPROVED"
                  ? "Asset request approved successfully"
                  : "Asset request rejected"}
              </div>

              <div
                style={
                  styles.confirmationText
                }
              >
                Request{" "}
                <strong>
                  {confirmation.requestNumber}
                </strong>{" "}
                for{" "}
                <strong>
                  {confirmation.employeeName}
                </strong>{" "}
                has been{" "}
                {confirmation.type ===
                "APPROVED"
                  ? "approved"
                  : "rejected"}
                .
              </div>

              <div
                style={
                  styles.confirmationMeta
                }
              >
                <span>
                  <strong>Asset:</strong>{" "}
                  {
                    confirmation.deviceCategory
                  }{" "}
                  × {confirmation.quantity}
                </span>

                <span>
                  <strong>
                    Estimated Cost:
                  </strong>{" "}
                  {formatMoney(
                    confirmation.estimatedCost
                  )}
                </span>

                {confirmation.type ===
                  "APPROVED" && (
                  <span>
                    <strong>
                      Next Stage:
                    </strong>{" "}
                    Asset Allocation
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              style={styles.dismissButton}
              onClick={() =>
                setConfirmation(null)
              }
            >
              ×
            </button>
          </div>
        )}

        {error && !selected && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {/* SUMMARY */}

        <section style={styles.cardGrid}>
          <SummaryCard
            label="Pending Approvals"
            value={String(
              pendingRequests.length
            )}
            helper="Waiting for your decision"
            icon="✓"
            iconBackground="#eaf2ff"
            iconColor="#1473e6"
          />

          <SummaryCard
            label="Recent Decisions"
            value={String(
              recentDecisions.length
            )}
            helper="Processed by VP"
            icon="▤"
            iconBackground="#fff6e5"
            iconColor="#d97706"
          />

          <SummaryCard
            label="Pending Value"
            value={formatMoney(
              estimatedTotal
            )}
            helper="Value awaiting approval"
            icon="₹"
            iconBackground="#eafaf1"
            iconColor="#159455"
          />
        </section>

        {/* =====================================================
            DYNAMIC APPROVAL WORKFLOW
            ===================================================== */}

        <section style={styles.workflowCard}>
          <div
            style={styles.workflowTop}
          >
            <div>
              <div
                style={
                  styles.workflowHeading
                }
              >
                Approval Workflow
              </div>

              {latestWorkflowRequest && (
                <div
                  style={
                    styles.workflowRequest
                  }
                >
                  Latest request:{" "}
                  <strong>
                    {
                      latestWorkflowRequest.requestNumber
                    }
                  </strong>{" "}
                  —{" "}
                  {
                    latestWorkflowRequest.employeeName
                  }
                </div>
              )}
            </div>

            {latestWorkflowRequest && (
              <span
                style={
                  styles.workflowStatusBadge
                }
              >
                {statusLabel(
                  latestWorkflowRequest.status
                )}
              </span>
            )}
          </div>

          <div style={styles.workflowRow}>
          {isLatestPurchaseVpApproval ? (
              <>
                  <WorkflowItem
                      number="✓"
                      title="Initial VP"
                      subtitle="Approved"
                      complete
                  />

                  <Arrow />

                  <WorkflowItem
                      number="✓"
                      title="Finance"
                      subtitle="Approved"
                      complete
                  />

                  <Arrow />

                 <WorkflowItem
                     number={
                         latestWorkflowRequest?.status === "PENDING_VENDOR_ORDER"
                             ? "✓"
                             : "3"
                     }
                     title="Purchase VP"
                     subtitle={
                         latestWorkflowRequest?.status === "PENDING_VENDOR_ORDER"
                             ? "Approved"
                             : "Awaiting your decision"
                     }
                     complete={
                         latestWorkflowRequest?.status === "PENDING_VENDOR_ORDER"
                     }
                     active={
                         latestWorkflowRequest?.status === "PENDING_PR_VP_APPROVAL"
                     }
                 />

                 <Arrow />

                 <WorkflowItem
                     number="4"
                     title="Vendor"
                     subtitle={
                         latestWorkflowRequest?.status === "PENDING_VENDOR_ORDER"
                             ? "Pending vendor order"
                             : "Next stage"
                     }
                     active={
                         latestWorkflowRequest?.status === "PENDING_VENDOR_ORDER"
                     }
                 />
              </>
          ) : (
              <>
                  <WorkflowItem
                      number="✓"
                      title="HR Admin"
                      subtitle="Request submitted"
                      complete
                  />

                  <Arrow />

                  <WorkflowItem
                      number="✓"
                      title="Asset Admin"
                      subtitle="Reviewed & forwarded"
                      complete
                  />

                  <Arrow />

                  <WorkflowItem
                     number={vpApproved ? "✓" : "3"}
                      title="VP / Higher Authority"
                      subtitle={
                          vpApproved
                              ? "Approved"
                              : vpRejected
                                  ? "Rejected"
                                  : "Awaiting decision"
                      }
                      complete={vpApproved}
                      active={
                          latestWorkflowRequest?.status === "PENDING_VP_APPROVAL"
                      }
                      disabled={vpRejected}
                  />

                  <Arrow />

                  <WorkflowItem
                      number="4"
                      title="Asset Allocation"
                      subtitle={
                          allocationCompleted
                              ? "Allocated"
                              : allocationPending
                                  ? "Pending allocation"
                                  : vpRejected
                                      ? "Not applicable"
                                      : "Stock & allocation"
                      }
                      complete={allocationCompleted}
                      active={allocationPending}
                      disabled={vpRejected}
                  />
              </>
          )}
          </div>
        </section>

        {/* =====================================================
            PENDING APPROVALS
            ===================================================== */}

        <section style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <div>
              <h2
                style={styles.sectionTitle}
              >
                Pending Asset Approvals
              </h2>

              <p
                style={
                  styles.sectionSubtitle
                }
              >
                Requests forwarded by Asset
                Admin for business
                authorization.
              </p>
            </div>

            <div
              style={styles.pendingBadge}
            >
              {pendingRequests.length} Pending
            </div>
          </div>

          {loading ? (
            <div style={styles.emptyState}>
              Loading approval requests...
            </div>
          ) : pendingRequests.length ===
            0 ? (
            <div style={styles.emptyState}>
              <div
                style={styles.emptyIcon}
              >
                ✓
              </div>

              <h3
                style={styles.emptyTitle}
              >
                No pending approvals
              </h3>

              <p
                style={styles.emptyText}
              >
                There are currently no asset
                requests waiting for your
                approval.
              </p>
            </div>
          ) : (
            <div
              style={styles.tableWrapper}
            >
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>
                      REQUEST
                    </th>

                    <th style={styles.th}>
                      CANDIDATE
                    </th>

                    <th style={styles.th}>
                      DEPARTMENT
                    </th>

                    <th style={styles.th}>
                      ASSET
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
                  {pendingRequests.map(
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
                              styles.secondaryText
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
                              styles.employeeName
                            }
                          >
                            {
                              request.employeeName
                            }
                          </div>

                          <div
                            style={
                              styles.secondaryText
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
                              styles.employeeName
                            }
                          >
                            {
                              request.deviceCategory
                            }
                          </div>

                          <div
                            style={
                              styles.secondaryText
                            }
                          >
                            Qty:{" "}
                            {request.quantity}
                          </div>
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

        {/* =====================================================
            RECENT VP DECISIONS
            ===================================================== */}

        <section
          style={{
            ...styles.tableCard,
            marginTop: "22px",
          }}
        >
          <div style={styles.tableHeader}>
            <div>
              <h2
                style={styles.sectionTitle}
              >
                Recent VP Decisions
              </h2>

              <p
                style={
                  styles.sectionSubtitle
                }
              >
                Previously approved and
                rejected asset requests.
              </p>
            </div>

            <div
              style={styles.historyBadge}
            >
              {recentDecisions.length} Decisions
            </div>
          </div>

          {loading ? (
            <div style={styles.emptyState}>
              Loading decision history...
            </div>
          ) : recentDecisions.length ===
            0 ? (
            <div
              style={
                styles.historyEmptyState
              }
            >
              No VP decisions have been
              recorded yet.
            </div>
          ) : (
            <div
              style={styles.tableWrapper}
            >
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>
                      REQUEST
                    </th>

                    <th style={styles.th}>
                      CANDIDATE
                    </th>

                    <th style={styles.th}>
                      ASSET
                    </th>

                    <th style={styles.th}>
                      VALUE
                    </th>

                    <th style={styles.th}>
                      DECISION
                    </th>

                    <th style={styles.th}>
                      DECISION BY
                    </th>

                    <th style={styles.th}>
                      DATE
                    </th>

                    <th style={styles.th}>
                      COMMENT
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentDecisions.map((history) => {
                    const request = history.request;
                    const rejected =
                      history.decision === "REJECTED";

                    return (
                        <tr key={history.key}>
                          <td
                            style={styles.td}
                          >
                            <div
                              style={
                                styles.requestNumber
                              }
                            >
                              {
                                request.requestNumber
                              }

                              <div
                                style={{
                                  marginTop: "4px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color:
                                    history.stage === "PURCHASE_VP"
                                      ? "#7c3aed"
                                      : "#2563eb",
                                }}
                              >
                                {history.stage === "PURCHASE_VP"
                                  ? "Purchase VP / PR"
                                  : "Initial VP"}
                              </div>
                            </div>
                          </td>

                          <td
                            style={styles.td}
                          >
                            <div
                              style={
                                styles.employeeName
                              }
                            >
                              {
                                request.employeeName
                              }
                            </div>

                            <div
                              style={
                                styles.secondaryText
                              }
                            >
                              {
                                request.employeeEmail
                              }
                            </div>
                          </td>

                          <td
                            style={styles.td}
                          >
                            <div
                              style={
                                styles.employeeName
                              }
                            >
                              {
                                request.deviceCategory
                              }
                            </div>

                            <div
                              style={
                                styles.secondaryText
                              }
                            >
                              Qty:{" "}
                              {
                                request.quantity
                              }
                            </div>
                          </td>

                          <td
                            style={styles.td}
                          >
                            <strong>
                              {formatMoney(
                                request.estimatedCost
                              )}
                            </strong>
                          </td>

                          <td
                            style={styles.td}
                          >
                            <span
                              style={
                                rejected
                                  ? styles.rejectedBadge
                                  : styles.approvedBadge
                              }
                            >
                              {rejected
                                ? "REJECTED"
                                : "✓ APPROVED"}
                            </span>

                            {!rejected &&
                              request.status ===
                                "PENDING_ALLOCATION" && (
                                <div
                                  style={
                                    styles.nextStage
                                  }
                                >
                                  → Pending Allocation
                                </div>
                              )}

                            {!rejected &&
                              (request.status ===
                                "ALLOCATED" ||
                                request.status ===
                                  "COMPLETED") && (
                                <div
                                  style={
                                    styles.allocatedStage
                                  }
                                >
                                  ✓ Asset Allocated
                                </div>
                              )}
                          </td>

                          <td
                            style={styles.td}
                          >
                            {request.vpEmail ||
                              "VP"}
                          </td>

                          <td
                            style={styles.td}
                          >
                            {formatDateTime(
                              request.vpReviewedAt
                            )}
                          </td>

                          <td
                            style={styles.td}
                          >
                            <div
                              style={
                                styles.commentCell
                              }
                            >
                              {request.vpComment ||
                                "—"}
                            </div>
                          </td>
                        </tr>
                      );
                    }
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
            <div style={styles.modalHeader}>
              <div>
                <div
                  style={
                    styles.modalRequestNumber
                  }
                >
                  {selected.requestNumber}
                </div>

                <h2
                  style={styles.modalTitle}
                >
                   {isPurchaseVpApproval
                          ? "Purchase Request Approval"
                          : "New Joiner Asset Request"}
                </h2>

                <p
                  style={
                    styles.modalSubtitle
                  }
                >
                 {isPurchaseVpApproval
                   ? "Review the Finance-approved purchase request before making your final purchase decision."
                   : "Review the onboarding request before making your decision."}
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
              {/* REQUEST WORKFLOW */}

              <section
                style={styles.modalSection}
              >
                <h3
                  style={
                    styles.modalSectionTitle
                  }
                >
                  Request Workflow
                </h3>

                <div
                  style={
                    styles.modalWorkflow
                  }
                >
                {isPurchaseVpApproval ? (
                    <>
                        <WorkflowItem
                            number="✓"
                            title="Initial VP"
                            subtitle="Approved"
                            complete
                        />

                        <Arrow />

                        <WorkflowItem
                            number="✓"
                            title="Finance"
                            subtitle="Approved"
                            complete
                        />

                        <Arrow />

                        <WorkflowItem
                            number="3"
                            title="Purchase VP"
                            subtitle="Your Decision"
                            active
                        />

                        <Arrow />

                        <WorkflowItem
                            number="4"
                            title="Vendor"
                            subtitle="Next Stage"
                        />
                    </>
                ) : (
                    <>
                        <WorkflowItem
                            number="✓"
                            title="HR Admin"
                            subtitle="Submitted"
                            complete
                        />

                        <Arrow />

                        <WorkflowItem
                            number="✓"
                            title="Asset Admin"
                            subtitle="Reviewed"
                            complete
                        />

                        <Arrow />

                        <WorkflowItem
                            number="3"
                            title="VP"
                            subtitle="Your Decision"
                            active
                        />

                        <Arrow />

                        <WorkflowItem
                            number="4"
                            title="Allocation"
                            subtitle="Next Stage"
                        />
                    </>
                )}

                </div>
              </section>

              {/* CANDIDATE DETAILS */}

              <section
                style={styles.modalSection}
              >
                <h3
                  style={
                    styles.modalSectionTitle
                  }
                >
                  Candidate Details
                </h3>

                <div style={styles.detailBox}>
                  <div
                    style={styles.detailGrid}
                  >
                    <Detail
                      label="Candidate Name"
                      value={
                        selected.employeeName
                      }
                    />

                    <Detail
                      label="Email"
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

              {/* ASSET */}

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
                      label="Asset Category"
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
                      styles.justificationBox
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

              {/* ASSET ADMIN REVIEW */}

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
                    styles.reviewInfoBox
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
                      styles.justificationBox
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
{/* FINANCE APPROVAL - PURCHASE REQUEST */}

{isPurchaseVpApproval && (
    <section style={styles.modalSection}>
        <h3 style={styles.modalSectionTitle}>
            Finance Approval
        </h3>

        <div style={styles.reviewInfoBox}>
            <div style={styles.detailGrid}>
                <Detail
                    label="Approved By"
                    value={selected.financeEmail}
                />

                <Detail
                    label="Approved At"
                    value={formatDateTime(
                        selected.financeReviewedAt
                    )}
                />

                <Detail
                    label="Cost Center"
                    value={selected.costCenter}
                />

                <Detail
                    label="Budget Status"
                    value={selected.budgetStatus}
                />

                <Detail
                    label="Budget Available"
                    value={formatMoney(
                        selected.budgetAvailable
                    )}
                />

                <Detail
                    label="Amount Requested"
                    value={formatMoney(
                        selected.amountRequested
                    )}
                />

                <Detail
                    label="Remaining Budget"
                    value={formatMoney(
                        selected.remainingBudget
                    )}
                />
            </div>

            <div style={styles.justificationBox}>
                <Detail
                    label="Finance Comment"
                    value={selected.financeComment}
                />
            </div>
        </div>
    </section>
)}
              {/* VP DECISION */}

              <section
                style={styles.modalSection}
              >
                <h3
                  style={
                    styles.modalSectionTitle
                  }
                >
                 {isPurchaseVpApproval
                   ? "Purchase Request Decision"
                   : "VP Decision"}
                </h3>

                <p
                  style={
                    styles.decisionHelp
                  }
                >
                  Approval comments are
                  optional. A rejection reason
                  is required when rejecting.
                </p>

                <textarea
                  style={styles.textarea}
                  rows={4}
                  value={comment}
                  onChange={(event) =>
                    setComment(
                      event.target.value
                    )
                  }
                  placeholder="Enter approval comment or rejection reason..."
                />
              </section>

              {error && (
                <div
                  style={styles.modalError}
                >
                  {error}
                </div>
              )}
            </div>

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
                  : isPurchaseVpApproval
                    ? "Approve Purchase Request →"
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
   SUMMARY CARD
   ========================================================= */

function SummaryCard({
  label,
  value,
  helper,
  icon,
  iconBackground,
  iconColor,
}: {
  label: string;
  value: string;
  helper: string;
  icon: string;
  iconBackground: string;
  iconColor: string;
}) {
  return (
    <div style={styles.summaryCard}>
      <div>
        <div style={styles.cardLabel}>
          {label}
        </div>

        <div style={styles.cardValue}>
          {value}
        </div>

        <div style={styles.cardHelper}>
          {helper}
        </div>
      </div>

      <div
        style={{
          ...styles.cardIcon,
          backgroundColor:
            iconBackground,
          color: iconColor,
        }}
      >
        {icon}
      </div>
    </div>
  );
}

/* =========================================================
   DETAIL
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
   WORKFLOW ITEM
   ========================================================= */

function WorkflowItem({
  number,
  title,
  subtitle,
  active = false,
  complete = false,
  rejected = false,
  disabled = false,
}: {
  number: string;
  title: string;
  subtitle: string;
  active?: boolean;
  complete?: boolean;
  rejected?: boolean;
  disabled?: boolean;
}) {
  let circleStyle: CSSProperties = {
    ...styles.workflowCircle,
  };

  if (complete) {
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

  if (rejected) {
    circleStyle = {
      ...circleStyle,
      backgroundColor: "#d64545",
      borderColor: "#d64545",
      color: "#ffffff",
    };
  }

  if (disabled) {
    circleStyle = {
      ...circleStyle,
      backgroundColor: "#f3f5f7",
      borderColor: "#d5dde6",
      color: "#a4b0bd",
    };
  }

  return (
    <div
      style={{
        ...styles.workflowItem,
        opacity: disabled ? 0.65 : 1,
      }}
    >
      <div style={circleStyle}>
        {number}
      </div>

      <div>
        <div
          style={styles.workflowTitle}
        >
          {title}
        </div>

        <div
          style={
            rejected
              ? styles.workflowRejectedSubtitle
              : complete
                ? styles.workflowCompleteSubtitle
                : active
                  ? styles.workflowActiveSubtitle
                  : styles.workflowSubtitle
          }
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div style={styles.arrow}>
      →
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
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "28px",
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
    fontSize: "31px",
    fontWeight: 800,
    color: "#14283d",
  },

  subtitle: {
    margin: "9px 0 0",
    color: "#718399",
    fontSize: "14px",
  },

  refreshButton: {
    border: "none",
    borderRadius: "9px",
    backgroundColor: "#1473e6",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "13px",
    padding: "11px 18px",
    cursor: "pointer",
  },

  approvedConfirmation: {
    display: "flex",
    gap: "15px",
    alignItems: "flex-start",
    backgroundColor: "#eefaf3",
    border: "1px solid #bfe4ce",
    borderRadius: "13px",
    padding: "18px 20px",
    marginBottom: "22px",
  },

  rejectedConfirmation: {
    display: "flex",
    gap: "15px",
    alignItems: "flex-start",
    backgroundColor: "#fff1f1",
    border: "1px solid #efcaca",
    borderRadius: "13px",
    padding: "18px 20px",
    marginBottom: "22px",
  },

  confirmationIconApproved: {
    width: "38px",
    height: "38px",
    minWidth: "38px",
    borderRadius: "50%",
    backgroundColor: "#159455",
    color: "#ffffff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: 900,
    fontSize: "18px",
  },

  confirmationIconRejected: {
    width: "38px",
    height: "38px",
    minWidth: "38px",
    borderRadius: "50%",
    backgroundColor: "#d64545",
    color: "#ffffff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: 900,
    fontSize: "20px",
  },

  confirmationTitle: {
    color: "#173d2a",
    fontSize: "14px",
    fontWeight: 800,
  },

  confirmationText: {
    color: "#405b4c",
    fontSize: "12px",
    marginTop: "5px",
  },

  confirmationMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px 22px",
    color: "#557061",
    fontSize: "11px",
    marginTop: "9px",
  },

  dismissButton: {
    border: "none",
    backgroundColor: "transparent",
    color: "#718399",
    fontSize: "21px",
    cursor: "pointer",
  },

  errorBox: {
    backgroundColor: "#fff0f0",
    border: "1px solid #f4c7c7",
    color: "#b42318",
    borderRadius: "10px",
    padding: "13px 16px",
    marginBottom: "20px",
    fontSize: "13px",
    fontWeight: 600,
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "18px",
    marginBottom: "22px",
  },

  summaryCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e3eaf2",
    borderRadius: "13px",
    padding: "21px 22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: "116px",
    boxShadow:
      "0 3px 12px rgba(15,42,64,0.04)",
  },

  cardLabel: {
    color: "#72849a",
    fontSize: "12px",
    fontWeight: 600,
  },

  cardValue: {
    color: "#14283d",
    fontSize: "29px",
    fontWeight: 800,
    marginTop: "9px",
  },

  cardHelper: {
    color: "#91a0b1",
    fontSize: "11px",
    marginTop: "6px",
  },

  cardIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: 800,
  },

  workflowCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e3eaf2",
    borderRadius: "13px",
    padding: "20px 22px",
    marginBottom: "22px",
    boxShadow:
      "0 3px 12px rgba(15,42,64,0.04)",
  },

  workflowTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "20px",
  },

  workflowHeading: {
    color: "#14283d",
    fontSize: "15px",
    fontWeight: 800,
  },

  workflowRequest: {
    color: "#8293a6",
    fontSize: "10px",
    marginTop: "5px",
  },

  workflowStatusBadge: {
    backgroundColor: "#eef5ff",
    border: "1px solid #d1e3f9",
    color: "#1473e6",
    borderRadius: "999px",
    padding: "6px 11px",
    fontSize: "10px",
    fontWeight: 800,
  },

  workflowRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },

  workflowItem: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  workflowCircle: {
    width: "36px",
    height: "36px",
    minWidth: "36px",
    borderRadius: "50%",
    border: "2px solid #c9d5e2",
    color: "#7d8fa3",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "12px",
    fontWeight: 800,
    boxSizing: "border-box",
  },

  workflowTitle: {
    fontSize: "12px",
    fontWeight: 800,
    color: "#21384f",
  },

  workflowSubtitle: {
    fontSize: "10px",
    color: "#8495a8",
    marginTop: "3px",
  },

  workflowCompleteSubtitle: {
    fontSize: "10px",
    color: "#159455",
    fontWeight: 700,
    marginTop: "3px",
  },

  workflowActiveSubtitle: {
    fontSize: "10px",
    color: "#1473e6",
    fontWeight: 700,
    marginTop: "3px",
  },

  workflowRejectedSubtitle: {
    fontSize: "10px",
    color: "#d64545",
    fontWeight: 700,
    marginTop: "3px",
  },

  arrow: {
    color: "#9aabba",
    fontSize: "18px",
    padding: "0 4px",
  },

  tableCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e3eaf2",
    borderRadius: "13px",
    overflow: "hidden",
    boxShadow:
      "0 3px 12px rgba(15,42,64,0.04)",
  },

  tableHeader: {
    padding: "21px 23px",
    borderBottom: "1px solid #e7edf4",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
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

  pendingBadge: {
    color: "#9a6200",
    backgroundColor: "#fff5df",
    border: "1px solid #f5dfb3",
    borderRadius: "999px",
    padding: "6px 11px",
    fontSize: "11px",
    fontWeight: 700,
  },

  historyBadge: {
    color: "#1473e6",
    backgroundColor: "#edf5ff",
    border: "1px solid #cfe2f9",
    borderRadius: "999px",
    padding: "6px 11px",
    fontSize: "11px",
    fontWeight: 700,
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: "1000px",
    borderCollapse: "collapse",
  },

  th: {
    padding: "13px 18px",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e7edf4",
    color: "#7b8da1",
    textAlign: "left",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.6px",
  },

  td: {
    padding: "16px 18px",
    borderBottom: "1px solid #edf1f5",
    color: "#30465c",
    fontSize: "12px",
    verticalAlign: "middle",
  },

  requestNumber: {
    color: "#1473e6",
    fontWeight: 800,
    fontSize: "12px",
  },

  employeeName: {
    color: "#20374d",
    fontWeight: 700,
  },

  secondaryText: {
    color: "#8798aa",
    fontSize: "10px",
    marginTop: "4px",
  },

  statusBadge: {
    display: "inline-block",
    borderRadius: "999px",
    padding: "6px 10px",
    backgroundColor: "#fff5df",
    color: "#9a6200",
    border: "1px solid #f4dfb5",
    fontSize: "10px",
    fontWeight: 800,
  },

  approvedBadge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    backgroundColor: "#eaf8f0",
    color: "#15804c",
    border: "1px solid #c7e8d4",
    fontSize: "10px",
    fontWeight: 800,
  },

  rejectedBadge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    backgroundColor: "#fff0f0",
    color: "#bd3030",
    border: "1px solid #f0cccc",
    fontSize: "10px",
    fontWeight: 800,
  },

  nextStage: {
    color: "#1473e6",
    fontSize: "9px",
    marginTop: "5px",
  },

  allocatedStage: {
    color: "#159455",
    fontSize: "9px",
    fontWeight: 700,
    marginTop: "5px",
  },

  commentCell: {
    maxWidth: "210px",
    color: "#617487",
    fontSize: "11px",
    wordBreak: "break-word",
  },

  reviewButton: {
    border: "1px solid #bcd5f3",
    backgroundColor: "#edf5ff",
    color: "#1473e6",
    borderRadius: "7px",
    padding: "7px 13px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 800,
  },

  emptyState: {
    padding: "60px 20px",
    textAlign: "center",
    color: "#718399",
    fontSize: "13px",
  },

  historyEmptyState: {
    padding: "35px 20px",
    textAlign: "center",
    color: "#8798aa",
    fontSize: "12px",
  },

  emptyIcon: {
    width: "45px",
    height: "45px",
    margin: "0 auto",
    borderRadius: "50%",
    backgroundColor: "#eaf8f0",
    color: "#159455",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "19px",
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
    backgroundColor: "rgba(8,27,43,0.58)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    zIndex: 1000,
  },

  modal: {
    width: "100%",
    maxWidth: "930px",
    maxHeight: "92vh",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow:
      "0 25px 70px rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "24px 28px",
    borderBottom: "1px solid #e4eaf1",
  },

  modalRequestNumber: {
    color: "#1473e6",
    fontSize: "11px",
    fontWeight: 800,
    marginBottom: "5px",
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

  modalWorkflow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "17px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e1e8f0",
    borderRadius: "11px",
  },

  detailBox: {
    border: "1px solid #e1e8f0",
    borderRadius: "11px",
    padding: "18px",
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
    color: "#20374d",
    fontSize: "12px",
    fontWeight: 600,
    marginTop: "5px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },

  justificationBox: {
    marginTop: "18px",
    paddingTop: "16px",
    borderTop: "1px solid #edf1f5",
  },

  reviewInfoBox: {
    border: "1px solid #cce8d8",
    backgroundColor: "#f0faf4",
    borderRadius: "11px",
    padding: "18px",
  },

  decisionHelp: {
    color: "#8192a5",
    fontSize: "11px",
    margin: "0 0 10px",
  },

  textarea: {
    width: "100%",
    minHeight: "100px",
    border: "1px solid #cfd9e4",
    borderRadius: "9px",
    padding: "12px 13px",
    resize: "vertical",
    fontFamily: "inherit",
    fontSize: "12px",
    color: "#20374d",
    outline: "none",
    boxSizing: "border-box",
  },

  modalError: {
    backgroundColor: "#fff0f0",
    border: "1px solid #f4c7c7",
    color: "#b42318",
    borderRadius: "9px",
    padding: "12px 14px",
    fontSize: "12px",
    fontWeight: 600,
  },

  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    padding: "17px 28px",
    borderTop: "1px solid #e4eaf1",
  },

  cancelButton: {
    border: "1px solid #ccd7e2",
    backgroundColor: "#ffffff",
    color: "#42586e",
    borderRadius: "8px",
    padding: "10px 16px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  rejectButton: {
    border: "none",
    backgroundColor: "#d64545",
    color: "#ffffff",
    borderRadius: "8px",
    padding: "10px 17px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  approveButton: {
    border: "none",
    backgroundColor: "#159455",
    color: "#ffffff",
    borderRadius: "8px",
    padding: "10px 18px",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },
};