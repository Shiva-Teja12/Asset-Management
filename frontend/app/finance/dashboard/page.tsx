"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type FinanceRequest = {
    id: string;
    requestNumber: string;

    employeeName: string;
    employeeCode?: string | null;
    employeeEmail?: string | null;
    department?: string | null;
    designation?: string | null;
    joiningDate?: string | null;

    deviceCategory: string;
    quantity: number;
    specifications?: string | null;

    estimatedCost?: number | null;

    budgetAvailable?: number | null;
    amountRequested?: number | null;
    remainingBudget?: number | null;
    budgetStatus?: string | null;
    costCenter?: string | null;

    businessJustification?: string | null;

    status: string;

    createdByEmail?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;

    assetAdminEmail?: string | null;
    assetAdminComment?: string | null;
    assetAdminReviewedAt?: string | null;

    vpEmail?: string | null;
    vpComment?: string | null;
    vpReviewedAt?: string | null;

    financeEmail?: string | null;
    financeComment?: string | null;
    financeReviewedAt?: string | null;
};

export default function FinanceDashboardPage() {
    const [requests, setRequests] = useState<FinanceRequest[]>([]);
    const [selectedRequest, setSelectedRequest] =
        useState<FinanceRequest | null>(null);

    const [search, setSearch] = useState("");
    const [comment, setComment] = useState("");

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadRequests = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const data = await api<FinanceRequest[]>(
                "/api/v1/onboarding/requests/finance"
            );

            setRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(
                getErrorMessage(
                    err,
                    "Unable to load Finance approval requests."
                )
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadRequests();
    }, [loadRequests]);

const pendingRequests = useMemo(
    () =>
        requests.filter(
            (request) =>
                request.status === "PENDING_FINANCE_APPROVAL"
        ),
    [requests]
);

const approvedRequests = useMemo(
    () =>
        requests.filter(
            (request) =>
                Boolean(request.financeReviewedAt) &&
                request.status !== "FINANCE_REJECTED"
        ),
    [requests]
);

const rejectedRequests = useMemo(
    () =>
        requests.filter(
            (request) =>
                request.status === "FINANCE_REJECTED"
        ),
    [requests]
);

const filteredRequests = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
        return requests;
    }

    return requests.filter((request) =>
        [
            request.requestNumber,
            request.employeeName,
            request.employeeCode,
            request.employeeEmail,
            request.department,
            request.deviceCategory,
            request.status,
            request.financeEmail,
            request.financeComment,
        ]
            .filter(Boolean)
            .some((field) =>
                String(field).toLowerCase().includes(value)
            )
    );
}, [requests, search]);
        function openRequest(request: FinanceRequest) {
            setSelectedRequest(request);
            setComment("");
            setError("");
            setSuccess("");
        }

        function closeRequest() {
            if (processing) {
                return;
            }

            setSelectedRequest(null);
            setComment("");
            setError("");
            setSuccess("");
        }

        async function approveRequest() {
            if (!selectedRequest || processing) {
                return;
            }

            setProcessing(true);
            setError("");
            setSuccess("");

            try {
                const updated = await api<FinanceRequest>(
                    `/api/v1/onboarding/requests/${selectedRequest.id}/finance/approve`,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            comment: comment.trim(),
                        }),
                    }
                );

                setSelectedRequest(updated);
                setSuccess(
                    "Purchase request approved by Finance successfully."
                );

                await loadRequests();
            } catch (err) {
                setError(
                    getErrorMessage(
                        err,
                        "Unable to approve the purchase request."
                    )
                );
            } finally {
                setProcessing(false);
            }
        }

        async function rejectRequest() {
            if (!selectedRequest || processing) {
                return;
            }

            const financeComment = comment.trim();

            if (!financeComment) {
                setError(
                    "Please enter a reason before rejecting the purchase request."
                );
                return;
            }

            setProcessing(true);
            setError("");
            setSuccess("");

            try {
                const updated = await api<FinanceRequest>(
                    `/api/v1/onboarding/requests/${selectedRequest.id}/finance/reject`,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            comment: financeComment,
                        }),
                    }
                );

                setSelectedRequest(updated);
                setSuccess(
                    "Purchase request rejected by Finance."
                );

                await loadRequests();
            } catch (err) {
                setError(
                    getErrorMessage(
                        err,
                        "Unable to reject the purchase request."
                    )
                );
            } finally {
                setProcessing(false);
            }
        }
            return (
                <div style={styles.page}>

                    <main style={styles.main}>
                       <div style={styles.header}>
                           <div>
                               <h1 style={styles.title}>Finance Approvals</h1>

                               <p style={styles.subtitle}>
                                   Review purchase requests raised for new joiner assets.
                               </p>
                           </div>

                           <div
                               style={{
                                   display: "flex",
                                   alignItems: "center",
                                   gap: "10px",
                               }}
                           >
                               <button
                                   type="button"
                                   style={styles.refreshButton}
                                   onClick={() => void loadRequests()}
                                   disabled={loading}
                               >
                                   {loading ? "Loading..." : "Refresh"}
                               </button>

                               <button
                                   type="button"
                                   style={{
                                       border: "1px solid #dc2626",
                                       background: "#ffffff",
                                       color: "#dc2626",
                                       padding: "10px 18px",
                                       borderRadius: "8px",
                                       fontSize: "14px",
                                       fontWeight: 600,
                                       cursor: "pointer",
                                   }}
                                   onClick={() => {
                                       localStorage.clear();
                                       window.location.href = "/";
                                   }}
                               >
                                   Logout
                               </button>
                           </div>
                       </div>

                        {error && !selectedRequest && (
                            <div style={styles.errorBox}>
                                {error}
                            </div>
                        )}

                      <div style={styles.summaryGrid}>
                          <div style={styles.summaryCard}>
                              <div style={styles.summaryLabel}>
                                  Pending Finance Approval
                              </div>

                              <div style={styles.summaryValue}>
                                  {pendingRequests.length}
                              </div>

                              <div style={styles.summaryText}>
                                  Purchase requests waiting for review
                              </div>
                          </div>


                          <div style={styles.summaryCard}>
                              <div style={styles.summaryLabel}>
                                  Finance Approved
                              </div>

                              <div
                                  style={{
                                      ...styles.summaryValue,
                                      color: "#15803d",
                                  }}
                              >
                                  {approvedRequests.length}
                              </div>

                              <div style={styles.summaryText}>
                                  Purchase requests approved by Finance
                              </div>
                          </div>


                          <div style={styles.summaryCard}>
                              <div style={styles.summaryLabel}>
                                  Finance Rejected
                              </div>

                              <div
                                  style={{
                                      ...styles.summaryValue,
                                      color: "#dc2626",
                                  }}
                              >
                                  {rejectedRequests.length}
                              </div>

                              <div style={styles.summaryText}>
                                  Purchase requests rejected by Finance
                              </div>
                          </div>
                      </div>

                        <section style={styles.card}>
                            <div style={styles.cardHeader}>
                                <div>
                                    <h2 style={styles.cardTitle}>
                                        Purchase Requests
                                    </h2>

                                    <p style={styles.cardSubtitle}>
                                        Review pending requests and view Finance
                                        approval and rejection history.
                                    </p>
                                </div>
                            </div>

                            <div style={styles.searchRow}>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search request, employee, department, device..."
                                    style={styles.searchInput}
                                />

                                {search && (
                                    <button
                                        type="button"
                                        style={styles.clearButton}
                                        onClick={() => setSearch("")}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            {loading ? (
                                <div style={styles.emptyState}>
                                    Loading Finance requests...
                                </div>
                            ) : filteredRequests.length === 0 ? (
                                <div style={styles.emptyState}>
                                    No Finance purchase requests found.
                                </div>
                            ) : (
                                <div style={styles.tableWrapper}>
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
                                                    Device
                                                </th>

                                                <th style={styles.th}>
                                                    Qty
                                                </th>

                                                <th style={styles.th}>
                                                    Estimated Cost
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
                                            {filteredRequests.map(
                                                (request) => (
                                                    <tr key={request.id}>
                                                        <td style={styles.td}>
                                                            <strong>
                                                                {
                                                                    request.requestNumber
                                                                }
                                                            </strong>
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
                                                                    styles.mutedText
                                                                }
                                                            >
                                                                {request.employeeCode ||
                                                                    request.employeeEmail ||
                                                                    "-"}
                                                            </div>
                                                        </td>

                                                        <td style={styles.td}>
                                                            {request.department ||
                                                                "-"}
                                                        </td>

                                                        <td style={styles.td}>
                                                            {
                                                                request.deviceCategory
                                                            }
                                                        </td>

                                                        <td style={styles.td}>
                                                            {request.quantity}
                                                        </td>

                                                        <td style={styles.td}>
                                                            {formatMoney(
                                                                request.estimatedCost
                                                            )}
                                                        </td>

                                                        <td style={styles.td}>
                                                            {request.status === "PENDING_FINANCE_APPROVAL" ? (
                                                                <span style={styles.pendingFinanceBadge}>
                                                                    Pending Finance
                                                                </span>
                                                            ) : request.status === "FINANCE_REJECTED" ? (
                                                                <span style={styles.rejectedFinanceBadge}>
                                                                    Finance Rejected
                                                                </span>
                                                            ) : request.financeReviewedAt ? (
                                                                <span style={styles.approvedFinanceBadge}>
                                                                    Finance Approved
                                                                </span>
                                                            ) : (
                                                                <span style={styles.statusBadge}>
                                                                    {prettyStatus(request.status)}
                                                                </span>
                                                            )}
                                                        </td>

                                                        <td style={styles.td}>
                                                            <button
                                                                type="button"
                                                                style={styles.reviewButton}
                                                                onClick={() =>
                                                                    openRequest(request)
                                                                }
                                                            >
                                                                {request.status === "PENDING_FINANCE_APPROVAL"
                                                                    ? "Review"
                                                                    : "View"}
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
                                        {/* ===================================================
                                            FINANCE REVIEW MODAL
                                            =================================================== */}

                                        {selectedRequest && (
                                            <div style={styles.overlay}>
                                                <div style={styles.modal}>
                                                    <div style={styles.modalHeader}>
                                                        <div>
                                                            <div style={styles.modalEyebrow}>
                                                                FINANCE APPROVAL
                                                            </div>

                                                            <h2 style={styles.modalTitle}>
                                                                {selectedRequest.requestNumber}
                                                            </h2>

                                                            <div style={styles.modalSubtitle}>
                                                                {selectedRequest.employeeName}
                                                                {" • "}
                                                                {selectedRequest.deviceCategory}
                                                            </div>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            style={styles.closeButton}
                                                            onClick={closeRequest}
                                                            disabled={processing}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>

                                                    <div style={styles.modalBody}>
                                                        {error && (
                                                            <div style={styles.errorBox}>
                                                                {error}
                                                            </div>
                                                        )}

                                                        {success && (
                                                            <div style={styles.successBox}>
                                                                {success}
                                                            </div>
                                                        )}

                                                        <div style={styles.statusRow}>
                                                            <span style={styles.statusLabel}>
                                                                Current Status
                                                            </span>

                                                            <span style={styles.statusBadge}>
                                                                {prettyStatus(
                                                                    selectedRequest.status
                                                                )}
                                                            </span>
                                                        </div>

                                                        <div style={styles.section}>
                                                            <h3 style={styles.sectionTitle}>
                                                                Employee Information
                                                            </h3>

                                                            <div style={styles.detailGrid}>
                                                                <Detail
                                                                    label="Employee"
                                                                    value={
                                                                        selectedRequest.employeeName
                                                                    }
                                                                />

                                                                <Detail
                                                                    label="Employee Code"
                                                                    value={
                                                                        selectedRequest.employeeCode ||
                                                                        "-"
                                                                    }
                                                                />

                                                                <Detail
                                                                    label="Email"
                                                                    value={
                                                                        selectedRequest.employeeEmail ||
                                                                        "-"
                                                                    }
                                                                />

                                                                <Detail
                                                                    label="Department"
                                                                    value={
                                                                        selectedRequest.department ||
                                                                        "-"
                                                                    }
                                                                />

                                                                <Detail
                                                                    label="Designation"
                                                                    value={
                                                                        selectedRequest.designation ||
                                                                        "-"
                                                                    }
                                                                />

                                                                <Detail
                                                                    label="Joining Date"
                                                                    value={formatDate(
                                                                        selectedRequest.joiningDate
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div style={styles.section}>
                                                            <h3 style={styles.sectionTitle}>
                                                                Purchase Requirement
                                                            </h3>

                                                            <div style={styles.detailGrid}>
                                                                <Detail
                                                                    label="Device"
                                                                    value={selectedRequest.deviceCategory}
                                                                />

                                                                <Detail
                                                                    label="Quantity"
                                                                    value={selectedRequest.quantity}
                                                                />

                                                                <Detail
                                                                    label="Estimated Cost"
                                                                    value={formatMoney(
                                                                        selectedRequest.estimatedCost
                                                                    )}
                                                                />
                                                            </div>

                                                            <div style={styles.textBlock}>
                                                                <div style={styles.textLabel}>
                                                                    Specifications
                                                                </div>

                                                                <div style={styles.textValue}>
                                                                    {selectedRequest.specifications ||
                                                                        "No specifications provided."}
                                                                </div>
                                                            </div>

                                                            <div style={styles.textBlock}>
                                                                <div style={styles.textLabel}>
                                                                    Business Justification
                                                                </div>

                                                                <div style={styles.textValue}>
                                                                    {selectedRequest.businessJustification ||
                                                                        "No business justification provided."}
                                                                </div>
                                                            </div>
                                                        </div>


                                                        {/* ===================================================
                                                            FINANCE BUDGET INFORMATION
                                                            =================================================== */}

                                                        <div style={styles.budgetSection}>
                                                            <div style={styles.budgetTitleRow}>
                                                                <div>
                                                                    <h3 style={styles.budgetTitle}>
                                                                        Finance Budget Information
                                                                    </h3>

                                                                    <div style={styles.budgetSubtitle}>
                                                                        Review the available budget before approving
                                                                        this purchase request.
                                                                    </div>
                                                                </div>

                                                                <span
                                                                    style={
                                                                        selectedRequest.budgetStatus === "SUFFICIENT"
                                                                            ? styles.budgetSufficientBadge
                                                                            : selectedRequest.budgetStatus === "INSUFFICIENT"
                                                                              ? styles.budgetInsufficientBadge
                                                                              : styles.budgetUnknownBadge
                                                                    }
                                                                >
                                                                    {selectedRequest.budgetStatus
                                                                        ? prettyStatus(selectedRequest.budgetStatus)
                                                                        : "Budget Not Set"}
                                                                </span>
                                                            </div>


                                                            <div style={styles.budgetGrid}>
                                                                <div style={styles.budgetItem}>
                                                                    <div style={styles.budgetLabel}>
                                                                        Estimated Cost
                                                                    </div>

                                                                    <div style={styles.budgetValue}>
                                                                        {formatMoney(
                                                                            selectedRequest.estimatedCost
                                                                        )}
                                                                    </div>
                                                                </div>


                                                                <div style={styles.budgetItem}>
                                                                    <div style={styles.budgetLabel}>
                                                                        Budget Available
                                                                    </div>

                                                                    <div style={styles.budgetValue}>
                                                                        {formatMoney(
                                                                            selectedRequest.budgetAvailable
                                                                        )}
                                                                    </div>
                                                                </div>


                                                                <div style={styles.budgetItem}>
                                                                    <div style={styles.budgetLabel}>
                                                                        Amount Requested
                                                                    </div>

                                                                    <div style={styles.budgetValue}>
                                                                        {formatMoney(
                                                                            selectedRequest.amountRequested
                                                                        )}
                                                                    </div>
                                                                </div>


                                                                <div style={styles.budgetItem}>
                                                                    <div style={styles.budgetLabel}>
                                                                        Remaining Budget
                                                                    </div>

                                                                    <div
                                                                        style={{
                                                                            ...styles.budgetValue,
                                                                            ...(selectedRequest.remainingBudget !== null &&
                                                                            selectedRequest.remainingBudget !== undefined &&
                                                                            Number(selectedRequest.remainingBudget) < 0
                                                                                ? styles.negativeBudgetValue
                                                                                : {}),
                                                                        }}
                                                                    >
                                                                        {formatMoney(
                                                                            selectedRequest.remainingBudget
                                                                        )}
                                                                    </div>
                                                                </div>


                                                                <div style={styles.budgetItem}>
                                                                    <div style={styles.budgetLabel}>
                                                                        Budget Status
                                                                    </div>

                                                                    <div style={styles.budgetValue}>
                                                                        {selectedRequest.budgetStatus
                                                                            ? prettyStatus(
                                                                                  selectedRequest.budgetStatus
                                                                              )
                                                                            : "-"}
                                                                    </div>
                                                                </div>


                                                                <div style={styles.budgetItem}>
                                                                    <div style={styles.budgetLabel}>
                                                                        Cost Center
                                                                    </div>

                                                                    <div style={styles.budgetValue}>
                                                                        {selectedRequest.costCenter || "-"}
                                                                    </div>
                                                                </div>
                                                            </div>


                                                            {selectedRequest.budgetStatus === "SUFFICIENT" && (
                                                                <div style={styles.budgetSuccessMessage}>
                                                                    ✓ Sufficient budget is available for this
                                                                    purchase request.
                                                                </div>
                                                            )}


                                                            {selectedRequest.budgetStatus === "INSUFFICIENT" && (
                                                                <div style={styles.budgetErrorMessage}>
                                                                    Insufficient budget is available for this
                                                                    purchase request.
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div style={styles.section}>
                                                            <h3 style={styles.sectionTitle}>
                                                                Previous Approvals
                                                            </h3>

                                                            <div style={styles.approvalBox}>
                                                                <div
                                                                    style={
                                                                        styles.approvalTitle
                                                                    }
                                                                >
                                                                    ✓ Asset Admin Review
                                                                </div>

                                                                <div style={styles.approvalText}>
                                                                    Reviewed by:{" "}
                                                                    <strong>
                                                                        {selectedRequest.assetAdminEmail ||
                                                                            "-"}
                                                                    </strong>
                                                                </div>

                                                                {selectedRequest.assetAdminComment && (
                                                                    <div
                                                                        style={
                                                                            styles.approvalComment
                                                                        }
                                                                    >
                                                                        “
                                                                        {
                                                                            selectedRequest.assetAdminComment
                                                                        }
                                                                        ”
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div style={styles.approvalBox}>
                                                                <div
                                                                    style={
                                                                        styles.approvalTitle
                                                                    }
                                                                >
                                                                    ✓ Initial VP Approval
                                                                </div>

                                                                <div style={styles.approvalText}>
                                                                    Approved by:{" "}
                                                                    <strong>
                                                                        {selectedRequest.vpEmail ||
                                                                            "-"}
                                                                    </strong>
                                                                </div>

                                                                {selectedRequest.vpComment && (
                                                                    <div
                                                                        style={
                                                                            styles.approvalComment
                                                                        }
                                                                    >
                                                                        “
                                                                        {
                                                                            selectedRequest.vpComment
                                                                        }
                                                                        ”
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {selectedRequest.financeReviewedAt && (
                                                            <div style={styles.section}>
                                                                <h3 style={styles.sectionTitle}>
                                                                    Finance Approval
                                                                </h3>

                                                                <div
                                                                    style={
                                                                        selectedRequest.status === "FINANCE_REJECTED"
                                                                            ? styles.financeRejectedBox
                                                                            : styles.financeApprovedBox
                                                                    }
                                                                >
                                                                    <div
                                                                        style={
                                                                            selectedRequest.status === "FINANCE_REJECTED"
                                                                                ? styles.financeRejectedTitle
                                                                                : styles.financeApprovedTitle
                                                                        }
                                                                    >
                                                                        {selectedRequest.status === "FINANCE_REJECTED"
                                                                            ? "✕ Finance Rejected"
                                                                            : "✓ Finance Approved"}
                                                                    </div>

                                                                    <div style={styles.financeHistoryGrid}>
                                                                        <Detail
                                                                            label={
                                                                                selectedRequest.status === "FINANCE_REJECTED"
                                                                                    ? "Rejected By"
                                                                                    : "Approved By"
                                                                            }
                                                                            value={selectedRequest.financeEmail || "-"}
                                                                        />

                                                                        <Detail
                                                                            label={
                                                                                selectedRequest.status === "FINANCE_REJECTED"
                                                                                    ? "Rejected At"
                                                                                    : "Approved At"
                                                                            }
                                                                            value={formatDateTime(
                                                                                selectedRequest.financeReviewedAt
                                                                            )}
                                                                        />

                                                                        <Detail
                                                                            label="Finance Decision"
                                                                            value={
                                                                                selectedRequest.status === "FINANCE_REJECTED"
                                                                                    ? "Rejected"
                                                                                    : "Approved"
                                                                            }
                                                                        />

                                                                        <Detail
                                                                            label="Current Workflow Status"
                                                                            value={prettyStatus(
                                                                                selectedRequest.status
                                                                            )}
                                                                        />
                                                                    </div>

                                                                    <div style={styles.financeCommentBox}>
                                                                        <div style={styles.financeCommentLabel}>
                                                                            Finance Comment
                                                                        </div>

                                                                        <div style={styles.financeCommentText}>
                                                                            {selectedRequest.financeComment ||
                                                                                "No Finance comment provided."}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                            {selectedRequest.status === "PENDING_FINANCE_APPROVAL" && (
                                                                <div style={styles.section}>
                                                                    <h3 style={styles.sectionTitle}>
                                                                        Finance Decision
                                                                    </h3>

                                                                    <label style={styles.commentLabel}>
                                                                        Finance Comment
                                                                    </label>

                                                                    <textarea
                                                                        value={comment}
                                                                        onChange={(event) =>
                                                                            setComment(event.target.value)
                                                                        }
                                                                        placeholder="Enter Finance approval comment or rejection reason..."
                                                                        rows={4}
                                                                        style={styles.textarea}
                                                                        disabled={processing}
                                                                    />

                                                                    <div style={styles.decisionRow}>
                                                                        <button
                                                                            type="button"
                                                                            style={
                                                                                processing
                                                                                    ? styles.disabledButton
                                                                                    : styles.rejectButton
                                                                            }
                                                                            disabled={processing}
                                                                            onClick={() => void rejectRequest()}
                                                                        >
                                                                            {processing ? "Processing..." : "Reject"}
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            style={
                                                                                processing
                                                                                    ? styles.disabledButton
                                                                                    : styles.approveButton
                                                                            }
                                                                            disabled={processing}
                                                                            onClick={() => void approveRequest()}
                                                                        >
                                                                            {processing
                                                                                ? "Processing..."
                                                                                : "Approve Purchase Request"}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                                </div>
                                                                                    <div style={styles.modalFooter}>
                                                                                        <button
                                                                                            type="button"
                                                                                            style={styles.secondaryButton}
                                                                                            onClick={closeRequest}
                                                                                            disabled={processing}
                                                                                        >
                                                                                            Close
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                    </main>
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
                                                            value: string | number | null | undefined;
                                                        }) {
                                                            return (
                                                                <div style={styles.detailItem}>
                                                                    <div style={styles.detailLabel}>
                                                                        {label}
                                                                    </div>

                                                                    <div style={styles.detailValue}>
                                                                        {value === null ||
                                                                        value === undefined ||
                                                                        value === ""
                                                                            ? "-"
                                                                            : String(value)}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }


                                                        /* =========================================================
                                                           FORMAT MONEY
                                                           ========================================================= */

                                                        function formatMoney(
                                                            value: number | null | undefined
                                                        ) {
                                                            if (
                                                                value === null ||
                                                                value === undefined ||
                                                                Number.isNaN(Number(value))
                                                            ) {
                                                                return "-";
                                                            }

                                                            return new Intl.NumberFormat("en-IN", {
                                                                style: "currency",
                                                                currency: "INR",
                                                                maximumFractionDigits: 0,
                                                            }).format(Number(value));
                                                        }


                                                        /* =========================================================
                                                           FORMAT DATE
                                                           ========================================================= */

                                                        function formatDate(
                                                            value: string | null | undefined
                                                        ) {
                                                            if (!value) {
                                                                return "-";
                                                            }

                                                            const date = new Date(value);

                                                            if (Number.isNaN(date.getTime())) {
                                                                return value;
                                                            }

                                                            return new Intl.DateTimeFormat("en-IN", {
                                                                day: "2-digit",
                                                                month: "short",
                                                                year: "numeric",
                                                            }).format(date);
                                                        }

function formatDateTime(
    value: string | null | undefined
) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).format(date);
}

                                                        /* =========================================================
                                                           PRETTY STATUS
                                                           ========================================================= */

                                                        function prettyStatus(
                                                            value: string | null | undefined
                                                        ) {
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


                                                        /* =========================================================
                                                           ERROR MESSAGE
                                                           ========================================================= */

                                                        function getErrorMessage(
                                                            error: unknown,
                                                            fallback: string
                                                        ) {
                                                            if (error instanceof Error) {
                                                                return error.message || fallback;
                                                            }

                                                            if (typeof error === "string") {
                                                                return error || fallback;
                                                            }

                                                            return fallback;
                                                        }
                                                        /* =========================================================
                                                           STYLES - PART 1
                                                           ========================================================= */

                                                        const styles: Record<string, React.CSSProperties> = {
                                                            page: {
                                                                minHeight: "100vh",
                                                                background: "#f6f8fb",
                                                                display: "flex",
                                                            },

                                                            main: {
                                                                flex: 1,
                                                                padding: "32px",
                                                                minWidth: 0,
                                                            },

                                                            header: {
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "flex-start",
                                                                gap: "20px",
                                                                marginBottom: "28px",
                                                            },

                                                            title: {
                                                                margin: 0,
                                                                fontSize: "30px",
                                                                fontWeight: 700,
                                                                color: "#111827",
                                                            },

                                                            subtitle: {
                                                                margin: "8px 0 0",
                                                                fontSize: "14px",
                                                                color: "#6b7280",
                                                            },

                                                            refreshButton: {
                                                                border: "1px solid #d1d5db",
                                                                background: "#ffffff",
                                                                color: "#374151",
                                                                padding: "10px 18px",
                                                                borderRadius: "8px",
                                                                fontSize: "14px",
                                                                fontWeight: 600,
                                                                cursor: "pointer",
                                                            },

                                                            errorBox: {
                                                                padding: "12px 16px",
                                                                marginBottom: "16px",
                                                                borderRadius: "8px",
                                                                background: "#fef2f2",
                                                                border: "1px solid #fecaca",
                                                                color: "#b91c1c",
                                                                fontSize: "14px",
                                                            },

                                                            successBox: {
                                                                padding: "12px 16px",
                                                                marginBottom: "16px",
                                                                borderRadius: "8px",
                                                                background: "#f0fdf4",
                                                                border: "1px solid #bbf7d0",
                                                                color: "#166534",
                                                                fontSize: "14px",
                                                            },

                                                            summaryGrid: {
                                                                display: "grid",
                                                                gridTemplateColumns:
                                                                    "repeat(auto-fit, minmax(220px, 1fr))",
                                                                gap: "16px",
                                                                marginBottom: "24px",
                                                            },

                                                            summaryCard: {
                                                                background: "#ffffff",
                                                                border: "1px solid #e5e7eb",
                                                                borderRadius: "12px",
                                                                padding: "20px",
                                                                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                                                            },

                                                            summaryLabel: {
                                                                fontSize: "13px",
                                                                fontWeight: 600,
                                                                color: "#6b7280",
                                                                marginBottom: "8px",
                                                            },

                                                            summaryValue: {
                                                                fontSize: "30px",
                                                                lineHeight: 1,
                                                                fontWeight: 700,
                                                                color: "#111827",
                                                                marginBottom: "8px",
                                                            },

                                                            summaryText: {
                                                                fontSize: "13px",
                                                                color: "#9ca3af",
                                                            },

                                                            card: {
                                                                background: "#ffffff",
                                                                border: "1px solid #e5e7eb",
                                                                borderRadius: "12px",
                                                                overflow: "hidden",
                                                                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                                                            },

                                                            cardHeader: {
                                                                padding: "20px 22px 14px",
                                                                borderBottom: "1px solid #f3f4f6",
                                                            },

                                                            cardTitle: {
                                                                margin: 0,
                                                                fontSize: "18px",
                                                                fontWeight: 700,
                                                                color: "#111827",
                                                            },

                                                            cardSubtitle: {
                                                                margin: "6px 0 0",
                                                                fontSize: "13px",
                                                                color: "#6b7280",
                                                            },

                                                            searchRow: {
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "10px",
                                                                padding: "16px 22px",
                                                                borderBottom: "1px solid #f3f4f6",
                                                            },

                                                            searchInput: {
                                                                width: "100%",
                                                                maxWidth: "520px",
                                                                height: "40px",
                                                                padding: "0 12px",
                                                                border: "1px solid #d1d5db",
                                                                borderRadius: "8px",
                                                                outline: "none",
                                                                background: "#ffffff",
                                                                color: "#111827",
                                                                fontSize: "14px",
                                                            },

                                                            clearButton: {
                                                                border: "none",
                                                                background: "transparent",
                                                                color: "#4f46e5",
                                                                fontSize: "13px",
                                                                fontWeight: 600,
                                                                cursor: "pointer",
                                                            },

                                                            emptyState: {
                                                                padding: "50px 20px",
                                                                textAlign: "center",
                                                                color: "#6b7280",
                                                                fontSize: "14px",
                                                            },

                                                            tableWrapper: {
                                                                width: "100%",
                                                                overflowX: "auto",
                                                            },

                                                            table: {
                                                                width: "100%",
                                                                borderCollapse: "collapse",
                                                                minWidth: "950px",
                                                            },

                                                            th: {
                                                                padding: "12px 16px",
                                                                textAlign: "left",
                                                                background: "#f9fafb",
                                                                borderBottom: "1px solid #e5e7eb",
                                                                color: "#6b7280",
                                                                fontSize: "12px",
                                                                fontWeight: 700,
                                                                textTransform: "uppercase",
                                                                letterSpacing: "0.03em",
                                                                whiteSpace: "nowrap",
                                                            },

                                                            td: {
                                                                padding: "15px 16px",
                                                                borderBottom: "1px solid #f3f4f6",
                                                                color: "#374151",
                                                                fontSize: "14px",
                                                                verticalAlign: "middle",
                                                            },

                                                            employeeName: {
                                                                color: "#111827",
                                                                fontWeight: 600,
                                                            },

                                                            mutedText: {
                                                                marginTop: "3px",
                                                                color: "#9ca3af",
                                                                fontSize: "12px",
                                                            },

                                                            statusBadge: {
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                padding: "5px 10px",
                                                                borderRadius: "999px",
                                                                background: "#fff7ed",
                                                                color: "#c2410c",
                                                                fontSize: "12px",
                                                                fontWeight: 700,
                                                                whiteSpace: "nowrap",
                                                            },

                                                            reviewButton: {
                                                                border: "none",
                                                                borderRadius: "7px",
                                                                background: "#111827",
                                                                color: "#ffffff",
                                                                padding: "8px 14px",
                                                                fontSize: "13px",
                                                                fontWeight: 600,
                                                                cursor: "pointer",
                                                            },
                                                                overlay: {
                                                                    position: "fixed",
                                                                    inset: 0,
                                                                    zIndex: 1000,
                                                                    background: "rgba(17, 24, 39, 0.55)",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    padding: "24px",
                                                                },

                                                                modal: {
                                                                    width: "100%",
                                                                    maxWidth: "900px",
                                                                    maxHeight: "92vh",
                                                                    background: "#ffffff",
                                                                    borderRadius: "14px",
                                                                    boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
                                                                    overflow: "hidden",
                                                                    display: "flex",
                                                                    flexDirection: "column",
                                                                },

                                                                modalHeader: {
                                                                    display: "flex",
                                                                    justifyContent: "space-between",
                                                                    alignItems: "flex-start",
                                                                    gap: "20px",
                                                                    padding: "22px 24px",
                                                                    borderBottom: "1px solid #e5e7eb",
                                                                },

                                                                modalEyebrow: {
                                                                    color: "#6b7280",
                                                                    fontSize: "11px",
                                                                    fontWeight: 700,
                                                                    letterSpacing: "0.08em",
                                                                    marginBottom: "5px",
                                                                },

                                                                modalTitle: {
                                                                    margin: 0,
                                                                    color: "#111827",
                                                                    fontSize: "22px",
                                                                    fontWeight: 700,
                                                                },

                                                                modalSubtitle: {
                                                                    marginTop: "6px",
                                                                    color: "#6b7280",
                                                                    fontSize: "14px",
                                                                },

                                                                closeButton: {
                                                                    width: "36px",
                                                                    height: "36px",
                                                                    border: "1px solid #e5e7eb",
                                                                    borderRadius: "8px",
                                                                    background: "#ffffff",
                                                                    color: "#374151",
                                                                    fontSize: "24px",
                                                                    lineHeight: 1,
                                                                    cursor: "pointer",
                                                                },

                                                                modalBody: {
                                                                    padding: "22px 24px",
                                                                    overflowY: "auto",
                                                                },

                                                                modalFooter: {
                                                                    display: "flex",
                                                                    justifyContent: "flex-end",
                                                                    padding: "16px 24px",
                                                                    borderTop: "1px solid #e5e7eb",
                                                                    background: "#f9fafb",
                                                                },

                                                                statusRow: {
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    gap: "16px",
                                                                    marginBottom: "20px",
                                                                    padding: "12px 14px",
                                                                    border: "1px solid #e5e7eb",
                                                                    borderRadius: "9px",
                                                                    background: "#f9fafb",
                                                                },

                                                                statusLabel: {
                                                                    color: "#6b7280",
                                                                    fontSize: "13px",
                                                                    fontWeight: 600,
                                                                },

                                                                section: {
                                                                    marginTop: "18px",
                                                                    padding: "18px",
                                                                    border: "1px solid #e5e7eb",
                                                                    borderRadius: "10px",
                                                                    background: "#ffffff",
                                                                },

                                                                sectionTitle: {
                                                                    margin: "0 0 16px",
                                                                    color: "#111827",
                                                                    fontSize: "15px",
                                                                    fontWeight: 700,
                                                                },

                                                                detailGrid: {
                                                                    display: "grid",
                                                                    gridTemplateColumns:
                                                                        "repeat(auto-fit, minmax(180px, 1fr))",
                                                                    gap: "16px",
                                                                },

                                                                detailItem: {
                                                                    minWidth: 0,
                                                                },

                                                                detailLabel: {
                                                                    marginBottom: "5px",
                                                                    color: "#9ca3af",
                                                                    fontSize: "11px",
                                                                    fontWeight: 700,
                                                                    textTransform: "uppercase",
                                                                    letterSpacing: "0.04em",
                                                                },

                                                                detailValue: {
                                                                    color: "#111827",
                                                                    fontSize: "14px",
                                                                    fontWeight: 600,
                                                                    overflowWrap: "anywhere",
                                                                },

                                                                textBlock: {
                                                                    marginTop: "16px",
                                                                    padding: "14px",
                                                                    borderRadius: "8px",
                                                                    background: "#f9fafb",
                                                                    border: "1px solid #f3f4f6",
                                                                },

                                                                textLabel: {
                                                                    marginBottom: "7px",
                                                                    color: "#6b7280",
                                                                    fontSize: "12px",
                                                                    fontWeight: 700,
                                                                },

                                                                textValue: {
                                                                    color: "#374151",
                                                                    fontSize: "14px",
                                                                    lineHeight: 1.6,
                                                                    whiteSpace: "pre-wrap",
                                                                },

                                                                approvalBox: {
                                                                    marginTop: "10px",
                                                                    padding: "14px",
                                                                    borderRadius: "8px",
                                                                    border: "1px solid #d1fae5",
                                                                    background: "#f0fdf4",
                                                                },

                                                                approvalTitle: {
                                                                    marginBottom: "6px",
                                                                    color: "#166534",
                                                                    fontSize: "13px",
                                                                    fontWeight: 700,
                                                                },

                                                                approvalText: {
                                                                    color: "#374151",
                                                                    fontSize: "13px",
                                                                },

                                                                approvalComment: {
                                                                    marginTop: "8px",
                                                                    color: "#6b7280",
                                                                    fontSize: "13px",
                                                                    fontStyle: "italic",
                                                                    lineHeight: 1.5,
                                                                },

                                                                commentLabel: {
                                                                    display: "block",
                                                                    marginBottom: "7px",
                                                                    color: "#374151",
                                                                    fontSize: "13px",
                                                                    fontWeight: 600,
                                                                },

                                                                textarea: {
                                                                    width: "100%",
                                                                    minHeight: "100px",
                                                                    resize: "vertical",
                                                                    padding: "11px 12px",
                                                                    border: "1px solid #d1d5db",
                                                                    borderRadius: "8px",
                                                                    outline: "none",
                                                                    color: "#111827",
                                                                    background: "#ffffff",
                                                                    fontSize: "14px",
                                                                    lineHeight: 1.5,
                                                                    fontFamily: "inherit",
                                                                    boxSizing: "border-box",
                                                                },

                                                                decisionRow: {
                                                                    display: "flex",
                                                                    justifyContent: "flex-end",
                                                                    flexWrap: "wrap",
                                                                    gap: "10px",
                                                                    marginTop: "16px",
                                                                },

                                                                rejectButton: {
                                                                    border: "1px solid #fecaca",
                                                                    borderRadius: "8px",
                                                                    background: "#ffffff",
                                                                    color: "#dc2626",
                                                                    padding: "10px 18px",
                                                                    fontSize: "13px",
                                                                    fontWeight: 700,
                                                                    cursor: "pointer",
                                                                },

                                                                approveButton: {
                                                                    border: "none",
                                                                    borderRadius: "8px",
                                                                    background: "#16a34a",
                                                                    color: "#ffffff",
                                                                    padding: "10px 18px",
                                                                    fontSize: "13px",
                                                                    fontWeight: 700,
                                                                    cursor: "pointer",
                                                                },

                                                                disabledButton: {
                                                                    border: "none",
                                                                    borderRadius: "8px",
                                                                    background: "#d1d5db",
                                                                    color: "#6b7280",
                                                                    padding: "10px 18px",
                                                                    fontSize: "13px",
                                                                    fontWeight: 700,
                                                                    cursor: "not-allowed",
                                                                },

                                                                secondaryButton: {
                                                                    border: "1px solid #d1d5db",
                                                                    borderRadius: "8px",
                                                                    background: "#ffffff",
                                                                    color: "#374151",
                                                                    padding: "9px 18px",
                                                                    fontSize: "13px",
                                                                    fontWeight: 600,
                                                                    cursor: "pointer",
                                                                },
                                                                budgetSection: {
                                                                    marginTop: "18px",
                                                                    padding: "20px",
                                                                    border: "1px solid #bbf7d0",
                                                                    borderRadius: "10px",
                                                                    background: "#f0fdf4",
                                                                },

                                                                budgetTitleRow: {
                                                                    display: "flex",
                                                                    alignItems: "flex-start",
                                                                    justifyContent: "space-between",
                                                                    flexWrap: "wrap",
                                                                    gap: "12px",
                                                                    marginBottom: "18px",
                                                                },

                                                                budgetTitle: {
                                                                    margin: 0,
                                                                    color: "#14532d",
                                                                    fontSize: "15px",
                                                                    fontWeight: 700,
                                                                },

                                                                budgetSubtitle: {
                                                                    marginTop: "5px",
                                                                    color: "#4b5563",
                                                                    fontSize: "12px",
                                                                    lineHeight: 1.5,
                                                                },

                                                                budgetGrid: {
                                                                    display: "grid",
                                                                    gridTemplateColumns:
                                                                        "repeat(auto-fit, minmax(190px, 1fr))",
                                                                    gap: "14px",
                                                                },

                                                                budgetItem: {
                                                                    padding: "14px",
                                                                    border: "1px solid #dcfce7",
                                                                    borderRadius: "8px",
                                                                    background: "#ffffff",
                                                                },

                                                                budgetLabel: {
                                                                    marginBottom: "7px",
                                                                    color: "#6b7280",
                                                                    fontSize: "11px",
                                                                    fontWeight: 700,
                                                                    textTransform: "uppercase",
                                                                    letterSpacing: "0.04em",
                                                                },

                                                                budgetValue: {
                                                                    color: "#111827",
                                                                    fontSize: "15px",
                                                                    fontWeight: 700,
                                                                    overflowWrap: "anywhere",
                                                                },

                                                                negativeBudgetValue: {
                                                                    color: "#dc2626",
                                                                },

                                                                budgetSufficientBadge: {
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    padding: "6px 11px",
                                                                    borderRadius: "999px",
                                                                    background: "#dcfce7",
                                                                    color: "#166534",
                                                                    fontSize: "12px",
                                                                    fontWeight: 700,
                                                                },

                                                                budgetInsufficientBadge: {
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    padding: "6px 11px",
                                                                    borderRadius: "999px",
                                                                    background: "#fee2e2",
                                                                    color: "#b91c1c",
                                                                    fontSize: "12px",
                                                                    fontWeight: 700,
                                                                },

                                                                budgetUnknownBadge: {
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    padding: "6px 11px",
                                                                    borderRadius: "999px",
                                                                    background: "#f3f4f6",
                                                                    color: "#6b7280",
                                                                    fontSize: "12px",
                                                                    fontWeight: 700,
                                                                },

                                                                budgetSuccessMessage: {
                                                                    marginTop: "16px",
                                                                    padding: "11px 13px",
                                                                    borderRadius: "8px",
                                                                    background: "#dcfce7",
                                                                    color: "#166534",
                                                                    fontSize: "13px",
                                                                    fontWeight: 600,
                                                                },

                                                                budgetErrorMessage: {
                                                                    marginTop: "16px",
                                                                    padding: "11px 13px",
                                                                    borderRadius: "8px",
                                                                    background: "#fee2e2",
                                                                    color: "#b91c1c",
                                                                    fontSize: "13px",
                                                                    fontWeight: 600,
                                                                },

                                                            pendingFinanceBadge: {
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                padding: "5px 10px",
                                                                borderRadius: "999px",
                                                                background: "#fff7ed",
                                                                color: "#c2410c",
                                                                fontSize: "12px",
                                                                fontWeight: 700,
                                                                whiteSpace: "nowrap",
                                                            },

                                                            approvedFinanceBadge: {
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                padding: "5px 10px",
                                                                borderRadius: "999px",
                                                                background: "#dcfce7",
                                                                color: "#166534",
                                                                fontSize: "12px",
                                                                fontWeight: 700,
                                                                whiteSpace: "nowrap",
                                                            },

                                                            rejectedFinanceBadge: {
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                padding: "5px 10px",
                                                                borderRadius: "999px",
                                                                background: "#fee2e2",
                                                                color: "#b91c1c",
                                                                fontSize: "12px",
                                                                fontWeight: 700,
                                                                whiteSpace: "nowrap",
                                                            },

                                                            financeApprovedBox: {
                                                                padding: "16px",
                                                                border: "1px solid #bbf7d0",
                                                                borderRadius: "9px",
                                                                background: "#f0fdf4",
                                                            },

                                                            financeRejectedBox: {
                                                                padding: "16px",
                                                                border: "1px solid #fecaca",
                                                                borderRadius: "9px",
                                                                background: "#fef2f2",
                                                            },

                                                            financeApprovedTitle: {
                                                                marginBottom: "14px",
                                                                color: "#166534",
                                                                fontSize: "14px",
                                                                fontWeight: 700,
                                                            },

                                                            financeRejectedTitle: {
                                                                marginBottom: "14px",
                                                                color: "#b91c1c",
                                                                fontSize: "14px",
                                                                fontWeight: 700,
                                                            },

                                                            financeHistoryGrid: {
                                                                display: "grid",
                                                                gridTemplateColumns:
                                                                    "repeat(auto-fit, minmax(180px, 1fr))",
                                                                gap: "16px",
                                                            },

                                                            financeCommentBox: {
                                                                marginTop: "16px",
                                                                padding: "13px 14px",
                                                                borderRadius: "8px",
                                                                background: "#ffffff",
                                                                border: "1px solid #e5e7eb",
                                                            },

                                                            financeCommentLabel: {
                                                                marginBottom: "6px",
                                                                color: "#6b7280",
                                                                fontSize: "11px",
                                                                fontWeight: 700,
                                                                textTransform: "uppercase",
                                                                letterSpacing: "0.04em",
                                                            },

                                                            financeCommentText: {
                                                                color: "#374151",
                                                                fontSize: "14px",
                                                                lineHeight: 1.6,
                                                                whiteSpace: "pre-wrap",
                                                            },
                                                            };