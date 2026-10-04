"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

import Side from "@/components/Side";
import { API, api, auth } from "@/lib/api";

type AuditLog = {
  id: string;

  actorUserId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;

  action: string;
  module?: string | null;

  entityType?: string | null;
  entityId?: string | null;
  entityName?: string | null;

  assetCategory?: string | null;
  assetName?: string | null;
  assetBrand?: string | null;
  assetModel?: string | null;
  assetTag?: string | null;
  assetSerialNumber?: string | null;
  assetSpecifications?: string | null;

  oldValue?: string | null;
  newValue?: string | null;
  details?: string | null;

  result?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;

  createdAt: string;
};

type AssetStatus =
  | "IN_STOCK"
  | "ASSIGNED"
  | "IN_REPAIR"
  | "RETIRED";

type Asset = {
  id: string;

  assetTag: string;
  name: string;
  category: string;

  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  specifications?: string | null;

  purchaseDate?: string | null;
  purchasePrice?: number | null;
  supplier?: string | null;

  warrantyAvailable?: boolean;

  warrantyStartDate?: string | null;
  warrantyPeriodMonths?: number | null;
  warrantyExpiryDate?: string | null;

  warrantyProvider?: string | null;
  warrantyReference?: string | null;

  warrantyStatus?:
    | "NO_WARRANTY"
    | "ACTIVE"
    | "EXPIRING_SOON"
    | "EXPIRED";

  warrantyDaysRemaining?: number | null;

  status: AssetStatus;

  assignedEmployeeId?: string | null;
  assignedEmployeeName?: string | null;

  employeeId?: string | null;
  employeeName?: string | null;

  assignedTo?: string | null;
};

type AssetEvent = {
  id: string;
  assetId: string;

  previousStatus: AssetStatus;
  newStatus: AssetStatus;

  actor?: string | null;
  reason?: string | null;

  occurredAt: string;
};

type AssetAssignment = {
  id: string;
  assetId: string;

  employeeId: string;
  employeeName: string;

  assignedAt: string;
  assignedBy?: string | null;

  reason?: string | null;

  returnedAt?: string | null;
  returnedBy?: string | null;
  returnReason?: string | null;
};

type WarrantyHistory = {
  id: string;
  assetId: string;

  previousExpiryDate?: string | null;

  newStartDate: string;
  newExpiryDate: string;

  periodMonths: number;

  provider?: string | null;
  warrantyReference?: string | null;

  renewalCost?: number | null;
  notes?: string | null;

  renewedBy?: string | null;
  renewedAt: string;
};

const KNOWN_ACTIONS = [
  "VIEW_ASSET_HISTORY",
  "CREATE_ASSET",
  "UPDATE_ASSET",
  "DELETE_ASSET",
  "ASSIGN_ASSET",
  "RETURN_ASSET",
  "SEND_TO_REPAIR",
  "RETURN_FROM_REPAIR",
  "RETIRE_ASSET",
  "ASSET_STATUS_CHANGED",
  "RENEW_WARRANTY",
  "CREATE_TICKET",
  "UPDATE_TICKET_STATUS",
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "SIGNUP_SUCCESS",
];

const KNOWN_MODULES = [
  "ASSET",
  "WARRANTY",
  "EMPLOYEE",
  "TICKET",
  "AUTH",
  "SECURITY",
  "INVENTORY",
  "PURCHASE",
];

export default function AuditLogsPage() {
  const [logs, setLogs] =
    useState<AuditLog[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * FILTERS
   */

  const [userFilter, setUserFilter] =
    useState("");

  const [actionFilter, setActionFilter] =
    useState("");

  const [moduleFilter, setModuleFilter] =
    useState("");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [searchText, setSearchText] =
    useState("");

  /*
   * ASSET HISTORY POPUP
   */

  const [historyAsset, setHistoryAsset] =
    useState<Asset | null>(null);

  const [
    lifecycleHistory,
    setLifecycleHistory,
  ] = useState<AssetEvent[]>([]);

  const [
    assignmentHistory,
    setAssignmentHistory,
  ] = useState<AssetAssignment[]>([]);

  const [
    warrantyHistory,
    setWarrantyHistory,
  ] = useState<WarrantyHistory[]>([]);

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);

  const [
    historyError,
    setHistoryError,
  ] = useState("");

  /*
   * INITIAL LOAD
   */

  useEffect(() => {
    void loadLogs();
  }, []);

  /*
   * LOAD AUDIT LOGS
   */

  async function loadLogs() {
    setLoading(true);
    setError("");

    try {
      const params =
        new URLSearchParams();

      if (userFilter.trim()) {
        params.set(
          "user",
          userFilter.trim()
        );
      }

      if (actionFilter) {
        params.set(
          "action",
          actionFilter
        );
      }

      if (moduleFilter) {
        params.set(
          "module",
          moduleFilter
        );
      }

      if (fromDate) {
        params.set(
          "from",
          fromDate
        );
      }

      if (toDate) {
        params.set(
          "to",
          toDate
        );
      }

      const query =
        params.toString();

      const data =
        await api(
          `/api/v1/audit-logs${
            query
              ? `?${query}`
              : ""
          }`
        );

      setLogs(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load audit logs."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * RESET FILTERS
   */

  function resetFilters() {
    setUserFilter("");
    setActionFilter("");
    setModuleFilter("");
    setFromDate("");
    setToDate("");
    setSearchText("");

    setTimeout(() => {
      void loadAllLogsWithoutFilters();
    }, 0);
  }

  async function loadAllLogsWithoutFilters() {
    setLoading(true);
    setError("");

    try {
      const data =
        await api(
          "/api/v1/audit-logs"
        );

      setLogs(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load audit logs."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * EXPORT CSV
   */

  async function exportCsv() {
    setError("");

    try {
      const params =
        new URLSearchParams();

      if (userFilter.trim()) {
        params.set(
          "user",
          userFilter.trim()
        );
      }

      if (actionFilter) {
        params.set(
          "action",
          actionFilter
        );
      }

      if (moduleFilter) {
        params.set(
          "module",
          moduleFilter
        );
      }

      if (fromDate) {
        params.set(
          "from",
          fromDate
        );
      }

      if (toDate) {
        params.set(
          "to",
          toDate
        );
      }

      const query =
        params.toString();

      const response =
        await fetch(
          `${API}/api/v1/audit-logs/export.csv${
            query
              ? `?${query}`
              : ""
          }`,
          {
            headers: auth(),
          }
        );

      if (!response.ok) {
        throw new Error(
          `Export failed (${response.status})`
        );
      }

      const blob =
        await response.blob();

      const url =
        URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          "a"
        );

      anchor.href = url;

      anchor.download =
        `audit-logs-${
          new Date()
            .toISOString()
            .slice(0, 10)
        }.csv`;

      document.body.appendChild(
        anchor
      );

      anchor.click();

      anchor.remove();

      URL.revokeObjectURL(
        url
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to export audit logs."
      );
    }
  }

  /*
   * OPEN ASSET HISTORY
   *
   * This is called when the admin clicks
   * "View Asset History" inside Audit Logs.
   */

  async function openAssetHistory(
    log: AuditLog
  ) {
    if (!log.entityId) {
      setError(
        "Asset ID is not available for this audit record."
      );

      return;
    }

    /*
     * Immediately open popup with
     * information already stored in
     * the audit record.
     */

    setHistoryAsset({
      id: log.entityId,

      assetTag:
        log.assetTag ||
        log.entityName ||
        "Asset",

      name:
        log.assetName ||
        log.entityName ||
        "Asset",

      category:
        log.assetCategory ||
        "-",

      brand:
        log.assetBrand,

      model:
        log.assetModel,

      serialNumber:
        log.assetSerialNumber,

      specifications:
        log.assetSpecifications,

      status:
        "IN_STOCK",
    });

    setLifecycleHistory([]);
    setAssignmentHistory([]);
    setWarrantyHistory([]);

    setHistoryError("");
    setHistoryLoading(true);

    try {
      /*
       * Load complete information
       * for the selected asset.
       */

      const [
        assetData,
        eventData,
        assignmentData,
        warrantyData,
      ] =
        await Promise.all([
          api(
            `/api/v1/assets/${log.entityId}`
          ),

          api(
            `/api/v1/assets/${log.entityId}/events`
          ),

          api(
            `/api/v1/assets/${log.entityId}/assignments`
          ),

          api(
            `/api/v1/assets/${log.entityId}/warranty/history`
          ),
        ]);

      setHistoryAsset(
        assetData as Asset
      );

      setLifecycleHistory(
        Array.isArray(
          eventData
        )
          ? eventData
          : []
      );

      setAssignmentHistory(
        Array.isArray(
          assignmentData
        )
          ? assignmentData
          : []
      );

      setWarrantyHistory(
        Array.isArray(
          warrantyData
        )
          ? warrantyData
          : []
      );
    } catch (err) {
      setHistoryError(
        err instanceof Error
          ? err.message
          : "Failed to load asset history."
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  /*
   * CLOSE HISTORY POPUP
   */

  function closeAssetHistory() {
    setHistoryAsset(null);

    setLifecycleHistory([]);
    setAssignmentHistory([]);
    setWarrantyHistory([]);

    setHistoryError("");
    setHistoryLoading(false);
  }

  /*
   * LOCAL SEARCH
   */

  const filteredLogs =
    useMemo(() => {
      const q =
        searchText
          .trim()
          .toLowerCase();

      if (!q) {
        return logs;
      }

      return logs.filter(
        (log) => {
          const values = [
            log.actorName,
            log.actorEmail,
            log.action,
            log.module,
            log.entityType,
            log.entityName,
            log.assetCategory,
            log.assetName,
            log.assetBrand,
            log.assetModel,
            log.assetTag,
            log.assetSerialNumber,
            log.assetSpecifications,
            log.oldValue,
            log.newValue,
            log.details,
            log.result,
            log.ipAddress,
          ];

          return values.some(
            (value) =>
              String(
                value ?? ""
              )
                .toLowerCase()
                .includes(q)
          );
        }
      );
    }, [
      logs,
      searchText,
    ]);

  /*
   * ACTION OPTIONS
   */

  const actionOptions =
    useMemo(() => {
      return Array.from(
        new Set([
          ...KNOWN_ACTIONS,

          ...logs
            .map(
              (log) =>
                log.action
            )
            .filter(Boolean),
        ])
      ).sort();
    }, [logs]);

  /*
   * MODULE OPTIONS
   */

  const moduleOptions =
    useMemo(() => {
      return Array.from(
        new Set([
          ...KNOWN_MODULES,

          ...logs
            .map(
              (log) =>
                log.module ||
                ""
            )
            .filter(Boolean),
        ])
      ).sort();
    }, [logs]);

  /*
   * SUMMARY COUNTS
   */

  const totalLogs =
    filteredLogs.length;

  const successEvents =
    filteredLogs.filter(
      (log) =>
        (
          log.result ||
          "SUCCESS"
        ).toUpperCase() ===
        "SUCCESS"
    ).length;

  const failedEvents =
    filteredLogs.filter(
      (log) =>
        (
          log.result ||
          "SUCCESS"
        ).toUpperCase() !==
        "SUCCESS"
    ).length;

  const assetEvents =
    filteredLogs.filter(
      (log) =>
        (
          log.module ||
          ""
        ).toUpperCase() ===
          "ASSET" ||
        (
          log.entityType ||
          ""
        ).toUpperCase() ===
          "ASSET" ||
        Boolean(
          log.assetTag
        )
    ).length;

  const securityEvents =
    filteredLogs.filter(
      (log) => {
        const action =
          (
            log.action ||
            ""
          ).toUpperCase();

        const module =
          (
            log.module ||
            ""
          ).toUpperCase();

        return (
          module === "AUTH" ||
          module ===
            "SECURITY" ||
          action.includes(
            "LOGIN"
          ) ||
          action.includes(
            "AUTH"
          )
        );
      }
    ).length;

  return (
    <div style={styles.page}>
      <Side role="admin" />

      <main style={styles.main}>
        {/* HEADER */}

        <div
          style={
            styles.headerRow
          }
        >
          <div>
            <h1
              style={
                styles.title
              }
            >
              Audit Logs
            </h1>

            <p
              style={
                styles.subtitle
              }
            >
              Track important
              system activities,
              asset actions and
              security events
            </p>
          </div>

          <button
            type="button"
            style={
              styles.exportButton
            }
            onClick={() =>
              void exportCsv()
            }
          >
            ↓ Export CSV
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div
            style={
              styles.errorBox
            }
          >
            {error}
          </div>
        )}

        {/* SUMMARY */}

        <section
          style={
            styles.summaryGrid
          }
        >
          <SummaryCard
            icon="☷"
            label="Total Logs"
            value={totalLogs}
            background="#edf5ff"
          />

          <SummaryCard
            icon="✓"
            label="Success Events"
            value={
              successEvents
            }
            background="#eafaf1"
          />

          <SummaryCard
            icon="!"
            label="Failed / Blocked"
            value={
              failedEvents
            }
            background="#fff0f0"
          />

          <SummaryCard
            icon="▣"
            label="Asset Related"
            value={assetEvents}
            background="#f3f0ff"
          />

          <SummaryCard
            icon="◆"
            label="Security Events"
            value={
              securityEvents
            }
            background="#fff8e7"
          />
        </section>

        {/* FILTERS */}

        <section
          style={styles.card}
        >
          <div
            style={
              styles.cardHeaderRow
            }
          >
            <div>
              <h2
                style={
                  styles.sectionTitle
                }
              >
                Filters
              </h2>

              <p
                style={
                  styles.sectionSubtitle
                }
              >
                Filter by user,
                action, module or
                date range
              </p>
            </div>

            <button
              type="button"
              style={
                styles.resetButton
              }
              onClick={
                resetFilters
              }
            >
              Reset
            </button>
          </div>

          <div
            style={
              styles.filterGrid
            }
          >
            {/* USER */}

            <div>
              <label
                style={
                  styles.label
                }
              >
                User
              </label>

              <input
                style={
                  styles.input
                }
                placeholder="Name or email..."
                value={
                  userFilter
                }
                onChange={(
                  event
                ) =>
                  setUserFilter(
                    event
                      .target
                      .value
                  )
                }
              />
            </div>

            {/* ACTION */}

            <div>
              <label
                style={
                  styles.label
                }
              >
                Action
              </label>

              <select
                style={
                  styles.input
                }
                value={
                  actionFilter
                }
                onChange={(
                  event
                ) =>
                  setActionFilter(
                    event
                      .target
                      .value
                  )
                }
              >
                <option value="">
                  All Actions
                </option>

                {actionOptions.map(
                  (action) => (
                    <option
                      key={
                        action
                      }
                      value={
                        action
                      }
                    >
                      {formatAction(
                        action
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* MODULE */}

            <div>
              <label
                style={
                  styles.label
                }
              >
                Module
              </label>

              <select
                style={
                  styles.input
                }
                value={
                  moduleFilter
                }
                onChange={(
                  event
                ) =>
                  setModuleFilter(
                    event
                      .target
                      .value
                  )
                }
              >
                <option value="">
                  All Modules
                </option>

                {moduleOptions.map(
                  (module) => (
                    <option
                      key={
                        module
                      }
                      value={
                        module
                      }
                    >
                      {formatAction(
                        module
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* FROM */}

            <div>
              <label
                style={
                  styles.label
                }
              >
                From Date
              </label>

              <input
                type="date"
                style={
                  styles.input
                }
                value={
                  fromDate
                }
                onChange={(
                  event
                ) =>
                  setFromDate(
                    event
                      .target
                      .value
                  )
                }
              />
            </div>

            {/* TO */}

            <div>
              <label
                style={
                  styles.label
                }
              >
                To Date
              </label>

              <input
                type="date"
                style={
                  styles.input
                }
                value={
                  toDate
                }
                onChange={(
                  event
                ) =>
                  setToDate(
                    event
                      .target
                      .value
                  )
                }
              />
            </div>
          </div>

          {/* SEARCH */}

          <div
            style={
              styles.searchRow
            }
          >
            <input
              style={
                styles.searchInput
              }
              placeholder="Search asset tag, employee, brand, model, details..."
              value={
                searchText
              }
              onChange={(
                event
              ) =>
                setSearchText(
                  event
                    .target
                    .value
                )
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  void loadLogs();
                }
              }}
            />

            <button
              type="button"
              style={
                styles.primaryButton
              }
              onClick={() =>
                void loadLogs()
              }
            >
              Search / Refresh
            </button>
          </div>
        </section>

        {/* SYSTEM ACTIVITY */}

        <section
          style={{
            ...styles.card,
            padding: 0,
            overflow:
              "hidden",
          }}
        >
          <div
            style={
              styles.activityHeader
            }
          >
            <div>
              <h2
                style={
                  styles.sectionTitle
                }
              >
                System Activity
              </h2>

              <p
                style={
                  styles.sectionSubtitle
                }
              >
                Showing{" "}
                {
                  filteredLogs.length
                }{" "}
                audit{" "}
                {filteredLogs.length ===
                1
                  ? "record"
                  : "records"}
              </p>
            </div>

            <button
              type="button"
              style={
                styles.resetButton
              }
              onClick={() =>
                void loadLogs()
              }
            >
              ↻ Refresh
            </button>
          </div>

          <div
            style={
              styles.tableWrapper
            }
          >
            <table
              style={
                styles.table
              }
            >
              <thead>
                <tr>
                  <th
                    style={
                      styles.th
                    }
                  >
                    DATE &amp; TIME
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    USER
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    ROLE
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    ACTION
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    MODULE
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    ASSET / ENTITY
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    EMPLOYEE
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    PREVIOUS
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    NEW
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    DETAILS
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    RESULT
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    IP ADDRESS
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      style={
                        styles.emptyCell
                      }
                      colSpan={
                        12
                      }
                    >
                      Loading audit
                      logs...
                    </td>
                  </tr>
                ) : filteredLogs.length ===
                  0 ? (
                  <tr>
                    <td
                      style={
                        styles.emptyCell
                      }
                      colSpan={
                        12
                      }
                    >
                      No audit logs
                      found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(
                    (log) => (
                      <tr
                        key={
                          log.id
                        }
                      >
                        {/* DATE */}

                        <td
                          style={
                            styles.td
                          }
                        >
                          {formatDateTime(
                            log.createdAt
                          )}
                        </td>

                        {/* USER */}

                        <td
                          style={
                            styles.td
                          }
                        >
                          <div
                            style={
                              styles.strongText
                            }
                          >
                            {log.actorName ||
                              "-"}
                          </div>

                          <div
                            style={
                              styles.smallMuted
                            }
                          >
                            {log.actorEmail ||
                              "-"}
                          </div>
                        </td>

                        {/* ROLE */}

                        <td
                          style={
                            styles.td
                          }
                        >
                          {log.actorRole ||
                            "-"}
                        </td>

                        {/* ACTION */}

                        <td
                          style={
                            styles.td
                          }
                        >
                          {canOpenAssetHistory(
                            log
                          ) ? (
                            <button
                              type="button"
                              style={
                                styles.actionButton
                              }
                              onClick={() =>
                                void openAssetHistory(
                                  log
                                )
                              }
                              title="Open complete asset history"
                            >
                              {formatAction(
                                log.action
                              )}
                            </button>
                          ) : (
                            <span
                              style={
                                styles.actionBadge
                              }
                            >
                              {formatAction(
                                log.action
                              )}
                            </span>
                          )}
                        </td>

                        {/* MODULE */}

                        <td
                          style={
                            styles.td
                          }
                        >
                          <span
                            style={
                              styles.moduleBadge
                            }
                          >
                            {log.module ||
                              "-"}
                          </span>
                        </td>

                        {/* ASSET */}

                        <td
                          style={
                            styles.td
                          }
                        >
                          <div
                            style={
                              styles.strongText
                            }
                          >
                            {log.assetTag ||
                              log.entityName ||
                              "-"}
                          </div>

                          {(log.assetName ||
                            log.assetBrand ||
                            log.assetModel) && (
                            <div
                              style={
                                styles.smallMuted
                              }
                            >
                              {[
                                log.assetName,

                                [
                                  log.assetBrand,
                                  log.assetModel,
                                ]
                                  .filter(
                                    Boolean
                                  )
                                  .join(
                                    " / "
                                  ),
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  " · "
                                )}
                            </div>
                          )}
                        </td>

                        {/* EMPLOYEE */}

                        <td
                          style={
                            styles.td
                          }
                        >
                          -
                        </td>

                        {/* PREVIOUS */}

                        <td
                          style={
                            styles.td
                          }
                        >
                          {formatValue(
                            log.oldValue
                          )}
                        </td>

                        {/* NEW */}

                        <td
                          style={
                            styles.td
                          }
                        >
                          {formatValue(
                            log.newValue
                          )}
                        </td>

                        {/* DETAILS */}

                        <td
                          style={{
                            ...styles.td,
                            minWidth:
                              260,
                          }}
                        >
                          {log.details ||
                            "-"}
                        </td>

                        {/* RESULT */}

                        <td
                          style={
                            styles.td
                          }
                        >
                          <span
                            style={resultStyle(
                              log.result
                            )}
                          >
                            {(
                              log.result ||
                              "SUCCESS"
                            ).toUpperCase()}
                          </span>
                        </td>

                        {/* IP */}

                        <td
                          style={
                            styles.td
                          }
                        >
                          {log.ipAddress ||
                            "-"}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ===================================================== */}
      {/* ASSET HISTORY POPUP */}
      {/* ===================================================== */}

      {historyAsset && (
        <div
          style={
            styles.modalOverlay
          }
          onMouseDown={
            closeAssetHistory
          }
        >
          <div
            style={styles.modal}
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            {/* MODAL HEADER */}

            <div
              style={
                styles.modalHeader
              }
            >
              <div>
                <div
                  style={
                    styles.modalEyebrow
                  }
                >
                  ASSET HISTORY
                </div>

                <h2
                  style={
                    styles.modalTitle
                  }
                >
                  {
                    historyAsset.assetTag
                  }{" "}
                  -{" "}
                  {
                    historyAsset.name
                  }
                </h2>

                <p
                  style={
                    styles.modalSubtitle
                  }
                >
                  Complete asset,
                  warranty,
                  lifecycle and
                  assignment history
                </p>
              </div>

              <button
                type="button"
                style={
                  styles.closeButton
                }
                onClick={
                  closeAssetHistory
                }
              >
                ×
              </button>
            </div>

            {/* MODAL BODY */}

            <div
              style={
                styles.modalBody
              }
            >
              {historyLoading && (
                <div
                  style={
                    styles.infoBox
                  }
                >
                  Loading asset
                  history...
                </div>
              )}

              {historyError && (
                <div
                  style={
                    styles.errorBox
                  }
                >
                  {historyError}
                </div>
              )}

              {!historyLoading && (
                <>
                  {/* ============================== */}
                  {/* ASSET DETAILS */}
                  {/* ============================== */}

                  <HistorySection
                    title="Asset Details"
                    subtitle="Current information for this equipment."
                  >
                    <div
                      style={
                        styles.detailGrid
                      }
                    >
                      <Detail
                        label="Category"
                        value={
                          historyAsset.category
                        }
                      />

                      <Detail
                        label="Asset Name"
                        value={
                          historyAsset.name
                        }
                      />

                      <Detail
                        label="Brand / Company"
                        value={
                          historyAsset.brand
                        }
                      />

                      <Detail
                        label="Model"
                        value={
                          historyAsset.model
                        }
                      />

                      <Detail
                        label="Asset Tag"
                        value={
                          historyAsset.assetTag
                        }
                      />

                      <Detail
                        label="Serial Number"
                        value={
                          historyAsset.serialNumber
                        }
                      />

                      <Detail
                        label="Specifications"
                        value={
                          historyAsset.specifications
                        }
                        wide
                      />

                      <Detail
                        label="Current Status"
                        value={statusText(
                          historyAsset.status
                        )}
                      />

                      <Detail
                        label="Assigned To"
                        value={assignedEmployee(
                          historyAsset
                        )}
                      />

                      <Detail
                        label="Purchase Date"
                        value={formatDateOnly(
                          historyAsset.purchaseDate
                        )}
                      />

                      <Detail
                        label="Purchase Price"
                        value={formatMoney(
                          historyAsset.purchasePrice
                        )}
                      />

                      <Detail
                        label="Supplier / Vendor"
                        value={
                          historyAsset.supplier
                        }
                      />
                    </div>
                  </HistorySection>

                  {/* ============================== */}
                  {/* WARRANTY DETAILS */}
                  {/* ============================== */}

                  <HistorySection
                    title="Warranty Details"
                    subtitle="Current warranty information for this asset."
                  >
                    <div
                      style={
                        styles.detailGrid
                      }
                    >
                      <Detail
                        label="Warranty"
                        value={
                          historyAsset.warrantyAvailable
                            ? "Available"
                            : "No Warranty"
                        }
                      />

                      <Detail
                        label="Status"
                        value={warrantyStatusText(
                          historyAsset
                        )}
                      />

                      <Detail
                        label="Start Date"
                        value={formatDateOnly(
                          historyAsset.warrantyStartDate
                        )}
                      />

                      <Detail
                        label="Period"
                        value={
                          historyAsset.warrantyPeriodMonths
                            ? `${historyAsset.warrantyPeriodMonths} months`
                            : "-"
                        }
                      />

                      <Detail
                        label="Expiry Date"
                        value={formatDateOnly(
                          historyAsset.warrantyExpiryDate
                        )}
                      />

                      <Detail
                        label="Provider"
                        value={
                          historyAsset.warrantyProvider
                        }
                      />

                      <Detail
                        label="Reference"
                        value={
                          historyAsset.warrantyReference
                        }
                      />

                      <Detail
                        label="Remaining"
                        value={warrantyRemainingText(
                          historyAsset
                        )}
                      />
                    </div>
                  </HistorySection>

                  {/* ============================== */}
                  {/* WARRANTY HISTORY */}
                  {/* ============================== */}

                  <HistorySection
                    title="Warranty History"
                    subtitle="Previous warranty renewals recorded for this asset."
                  >
                    {warrantyHistory.length ===
                    0 ? (
                      <EmptyHistory
                        text="No warranty renewal history found for this asset."
                      />
                    ) : (
                      <HistoryTable>
                        <thead>
                          <tr>
                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              Renewed At
                            </th>

                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              Previous
                              Expiry
                            </th>

                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              New Start
                            </th>

                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              New Expiry
                            </th>

                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              Period
                            </th>

                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              Provider
                            </th>

                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              Reference
                            </th>

                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              Cost
                            </th>

                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              Renewed By
                            </th>

                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              Notes
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {warrantyHistory.map(
                            (
                              item
                            ) => (
                              <tr
                                key={
                                  item.id
                                }
                              >
                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {formatDateTime(
                                    item.renewedAt
                                  )}
                                </td>

                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {formatDateOnly(
                                    item.previousExpiryDate
                                  )}
                                </td>

                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {formatDateOnly(
                                    item.newStartDate
                                  )}
                                </td>

                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {formatDateOnly(
                                    item.newExpiryDate
                                  )}
                                </td>

                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {
                                    item.periodMonths
                                  }{" "}
                                  months
                                </td>

                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {item.provider ||
                                    "-"}
                                </td>

                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {item.warrantyReference ||
                                    "-"}
                                </td>

                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {formatMoney(
                                    item.renewalCost
                                  )}
                                </td>

                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {item.renewedBy ||
                                    "-"}
                                </td>

                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {item.notes ||
                                    "-"}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </HistoryTable>
                    )}
                  </HistorySection>

                  {/* ============================== */}
                  {/* LIFECYCLE HISTORY */}
                  {/* ============================== */}

                  <HistorySection
                    title="Lifecycle History"
                    subtitle="Every recorded asset status change."
                  >
                    {lifecycleHistory.length ===
                    0 ? (
                      <EmptyHistory
                        text="No lifecycle history found for this asset."
                      />
                    ) : (
                      <HistoryTable>
                        <thead>
                          <tr>
                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              Date &amp;
                              Time
                            </th>

                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              Previous
                              Status
                            </th>

                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              New Status
                            </th>

                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              Reason
                            </th>

                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              Changed By
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {lifecycleHistory.map(
                            (
                              event
                            ) => (
                              <tr
                                key={
                                  event.id
                                }
                              >
                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {formatDateTime(
                                    event.occurredAt
                                  )}
                                </td>

                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {statusText(
                                    event.previousStatus
                                  )}
                                </td>

                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {statusText(
                                    event.newStatus
                                  )}
                                </td>

                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {event.reason ||
                                    "-"}
                                </td>

                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {event.actor ||
                                    "-"}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </HistoryTable>
                    )}
                  </HistorySection>

                  {/* ============================== */}
                  {/* ASSIGNMENT HISTORY */}
                  {/* ============================== */}

                  <HistorySection
                    title="Assignment History"
                    subtitle="Who received the asset, why it was assigned, and when it was returned."
                  >
                    {assignmentHistory.length ===
                    0 ? (
                      <EmptyHistory
                        text="No assignment history found for this asset."
                      />
                    ) : (
                      <HistoryTable>
                        <thead>
                          <tr>
                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              Employee
                            </th>

                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              Assigned
                              Date
                            </th>

                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              Assignment
                              Reason
                            </th>

                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              Assigned By
                            </th>

                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              Returned
                              Date
                            </th>

                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              Return
                              Reason
                            </th>

                            <th
                              style={
                                styles.historyTh
                              }
                            >
                              Return
                              Recorded By
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {assignmentHistory.map(
                            (
                              assignment
                            ) => (
                              <tr
                                key={
                                  assignment.id
                                }
                              >
                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {assignment.employeeName ||
                                    "-"}
                                </td>

                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {formatDateTime(
                                    assignment.assignedAt
                                  )}
                                </td>

                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {assignment.reason ||
                                    "-"}
                                </td>

                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {assignment.assignedBy ||
                                    "-"}
                                </td>

                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {formatDateTime(
                                    assignment.returnedAt
                                  )}
                                </td>

                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {assignment.returnReason ||
                                    "-"}
                                </td>

                                <td
                                  style={
                                    styles.historyTd
                                  }
                                >
                                  {assignment.returnedBy ||
                                    "-"}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </HistoryTable>
                    )}
                  </HistorySection>
                </>
              )}
            </div>

            {/* MODAL FOOTER */}

            <div
              style={
                styles.modalFooter
              }
            >
              <button
                type="button"
                style={
                  styles.primaryButton
                }
                onClick={
                  closeAssetHistory
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

/*
 * ONLY VIEW_ASSET_HISTORY
 * IS CLICKABLE.
 */

function canOpenAssetHistory(
  log: AuditLog
) {
  return (
    log.action ===
      "VIEW_ASSET_HISTORY" &&
    (
      log.entityType ||
      ""
    ).toUpperCase() ===
      "ASSET" &&
    Boolean(log.entityId)
  );
}

/*
 * SUMMARY CARD
 */

function SummaryCard({
  icon,
  label,
  value,
  background,
}: {
  icon: string;
  label: string;
  value: number;
  background: string;
}) {
  return (
    <div
      style={{
        ...styles.summaryCard,
        background,
      }}
    >
      <div
        style={
          styles.summaryIcon
        }
      >
        {icon}
      </div>

      <div>
        <div
          style={
            styles.summaryLabel
          }
        >
          {label}
        </div>

        <div
          style={
            styles.summaryValue
          }
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/*
 * HISTORY SECTION
 */

function HistorySection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={
        styles.historySection
      }
    >
      <h3
        style={
          styles.historyTitle
        }
      >
        {title}
      </h3>

      <p
        style={
          styles.historySubtitle
        }
      >
        {subtitle}
      </p>

      {children}
    </section>
  );
}

/*
 * DETAIL FIELD
 */

function Detail({
  label,
  value,
  wide = false,
}: {
  label: string;
  value?:
    | string
    | number
    | null;
  wide?: boolean;
}) {
  return (
    <div
      style={
        wide
          ? styles.detailWide
          : undefined
      }
    >
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
        {value === null ||
        value === undefined ||
        value === ""
          ? "-"
          : value}
      </div>
    </div>
  );
}

/*
 * HISTORY TABLE
 */

function HistoryTable({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={
        styles.historyTableWrapper
      }
    >
      <table
        style={
          styles.historyTable
        }
      >
        {children}
      </table>
    </div>
  );
}

/*
 * EMPTY HISTORY
 */

function EmptyHistory({
  text,
}: {
  text: string;
}) {
  return (
    <div
      style={
        styles.historyEmpty
      }
    >
      {text}
    </div>
  );
}

/*
 * FORMAT ACTION
 */

function formatAction(
  value?: string | null
) {
  if (!value) {
    return "-";
  }

  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

/*
 * FORMAT OLD/NEW VALUE
 */

function formatValue(
  value?: string | null
) {
  if (!value) {
    return "-";
  }

  return formatAction(
    value
  );
}

/*
 * DATE + TIME
 */

function formatDateTime(
  value?: string | null
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

/*
 * DATE ONLY
 */

function formatDateOnly(
  value?: string | null
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(
      `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN"
  );
}

/*
 * MONEY
 */

function formatMoney(
  value?: number | null
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "-";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits:
        2,
    }
  ).format(value);
}

/*
 * STATUS
 */

function statusText(
  status?: string | null
) {
  if (!status) {
    return "-";
  }

  const labels:
    Record<
      string,
      string
    > = {
    IN_STOCK:
      "In Stock",

    ASSIGNED:
      "Assigned",

    IN_REPAIR:
      "In Repair",

    RETIRED:
      "Retired",
  };

  return (
    labels[status] ||
    formatAction(status)
  );
}

/*
 * ASSIGNED EMPLOYEE
 */

function assignedEmployee(
  asset: Asset
) {
  return (
    asset.assignedEmployeeName ||
    asset.employeeName ||
    asset.assignedTo ||
    "-"
  );
}

/*
 * WARRANTY STATUS
 */

function warrantyStatusText(
  asset: Asset
) {
  if (
    !asset.warrantyAvailable ||
    asset.warrantyStatus ===
      "NO_WARRANTY"
  ) {
    return "No Warranty";
  }

  if (
    asset.warrantyStatus ===
    "EXPIRED"
  ) {
    return "Expired";
  }

  if (
    asset.warrantyStatus ===
    "EXPIRING_SOON"
  ) {
    return "Expiring Soon";
  }

  return "Active";
}

/*
 * WARRANTY REMAINING
 */

function warrantyRemainingText(
  asset: Asset
) {
  if (
    !asset.warrantyAvailable ||
    asset.warrantyDaysRemaining ===
      null ||
    asset.warrantyDaysRemaining ===
      undefined
  ) {
    return "-";
  }

  if (
    asset.warrantyDaysRemaining <
    0
  ) {
    return `${Math.abs(
      asset.warrantyDaysRemaining
    )} day(s) expired`;
  }

  if (
    asset.warrantyDaysRemaining ===
    0
  ) {
    return "Expires today";
  }

  return `${asset.warrantyDaysRemaining} day(s) remaining`;
}

/*
 * RESULT BADGE
 */

function resultStyle(
  result?: string | null
): CSSProperties {
  const success =
    (
      result ||
      "SUCCESS"
    ).toUpperCase() ===
    "SUCCESS";

  return {
    display:
      "inline-flex",

    alignItems:
      "center",

    borderRadius:
      999,

    padding:
      "5px 9px",

    fontSize:
      11,

    fontWeight:
      800,

    background:
      success
        ? "#e8f8ef"
        : "#fdecec",

    color:
      success
        ? "#16834b"
        : "#c0392b",
  };
}

/*
 * STYLES
 */

const styles:
  Record<
    string,
    CSSProperties
  > = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#f5f8fc",
    color: "#0d2a40",
  },

  main: {
    flex: 1,
    minWidth: 0,
    padding:
      "34px 36px 48px",
  },

  headerRow: {
    display: "flex",
    alignItems:
      "flex-start",
    justifyContent:
      "space-between",
    gap: 20,
    marginBottom: 28,
  },

  title: {
    margin: 0,
    fontSize: 44,
    lineHeight: 1.05,
    fontWeight: 900,
    letterSpacing: -1,
    color: "#082a45",
  },

  subtitle: {
    margin:
      "8px 0 0",
    color: "#60738a",
    fontSize: 16,
  },

  exportButton: {
    border: 0,
    borderRadius: 10,
    padding:
      "13px 18px",
    background:
      "#1473e6",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
  },

  summaryGrid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(5, minmax(170px, 1fr))",

    gap: 16,
    marginBottom: 24,
  },

  summaryCard: {
    minHeight: 112,

    border:
      "1px solid #dce6f2",

    borderRadius: 16,

    display: "flex",

    alignItems:
      "center",

    gap: 16,

    padding:
      "18px 20px",
  },

  summaryIcon: {
    width: 46,
    height: 46,

    borderRadius: 12,

    background:
      "rgba(255,255,255,0.85)",

    display: "grid",

    placeItems:
      "center",

    color:
      "#1473e6",

    fontSize: 22,

    fontWeight: 900,
  },

  summaryLabel: {
    fontSize: 13,

    fontWeight: 800,

    color:
      "#29445d",

    marginBottom: 5,
  },

  summaryValue: {
    fontSize: 28,

    lineHeight: 1,

    fontWeight: 900,

    color:
      "#082a45",
  },

  card: {
    background: "#fff",

    border:
      "1px solid #dce6f2",

    borderRadius: 16,

    padding: 22,

    marginBottom: 24,
  },

  cardHeaderRow: {
    display: "flex",

    alignItems:
      "flex-start",

    justifyContent:
      "space-between",

    gap: 16,

    marginBottom: 18,
  },

  sectionTitle: {
    margin: 0,

    fontSize: 24,

    fontWeight: 900,

    color:
      "#082a45",
  },

  sectionSubtitle: {
    margin:
      "4px 0 0",

    color:
      "#71839a",

    fontSize: 14,
  },

  resetButton: {
    border:
      "1px solid #d5e0ec",

    background: "#fff",

    color:
      "#29445d",

    borderRadius: 9,

    padding:
      "10px 16px",

    fontSize: 14,

    fontWeight: 800,

    cursor: "pointer",
  },

  filterGrid: {
    display: "grid",

    gridTemplateColumns:
      "1.25fr 1fr 1fr 1fr 1fr",

    gap: 14,
  },

  label: {
    display: "block",

    fontSize: 12,

    fontWeight: 800,

    color:
      "#29445d",

    marginBottom: 7,
  },

  input: {
    width: "100%",

    boxSizing:
      "border-box",

    minHeight: 44,

    border:
      "1px solid #d5e0ec",

    borderRadius: 8,

    padding:
      "0 12px",

    background: "#fff",

    color:
      "#1d3851",

    outline: "none",

    fontSize: 14,
  },

  searchRow: {
    display: "grid",

    gridTemplateColumns:
      "1fr auto",

    gap: 12,

    marginTop: 16,
  },

  searchInput: {
    width: "100%",

    boxSizing:
      "border-box",

    minHeight: 46,

    border:
      "1px solid #d5e0ec",

    borderRadius: 8,

    padding:
      "0 14px",

    fontSize: 14,

    outline: "none",
  },

  primaryButton: {
    border: 0,

    borderRadius: 9,

    padding:
      "11px 18px",

    background:
      "#1473e6",

    color: "#fff",

    fontSize: 15,

    fontWeight: 800,

    cursor: "pointer",
  },

  activityHeader: {
    display: "flex",

    alignItems:
      "center",

    justifyContent:
      "space-between",

    gap: 16,

    padding:
      "22px 22px 18px",
  },

  tableWrapper: {
    overflowX: "auto",

    borderTop:
      "1px solid #e2e9f2",
  },

  table: {
    width: "100%",

    minWidth: 1450,

    borderCollapse:
      "collapse",
  },

  th: {
    textAlign: "left",

    padding:
      "14px 14px",

    background:
      "#f4f7fb",

    color:
      "#36506a",

    fontSize: 11,

    fontWeight: 900,

    whiteSpace:
      "nowrap",

    borderBottom:
      "1px solid #dce6f2",
  },

  td: {
    padding: "14px",

    borderBottom:
      "1px solid #edf1f6",

    verticalAlign:
      "top",

    color:
      "#29445d",

    fontSize: 13,

    whiteSpace:
      "nowrap",
  },

  emptyCell: {
    padding: 54,

    textAlign:
      "center",

    color:
      "#71839a",

    fontSize: 14,
  },

  strongText: {
    fontWeight: 800,

    color:
      "#12334f",
  },

  smallMuted: {
    color:
      "#7a8ca1",

    fontSize: 11,

    marginTop: 3,
  },

  actionBadge: {
    display:
      "inline-flex",

    borderRadius: 7,

    padding:
      "6px 9px",

    background:
      "#edf5ff",

    color:
      "#1161ba",

    fontSize: 11,

    fontWeight: 800,
  },

  /*
   * This is now a real clickable button.
   */

  actionButton: {
    border:
      "1px solid #bcd8fb",

    borderRadius: 7,

    padding:
      "6px 9px",

    background:
      "#edf5ff",

    color:
      "#1161ba",

    fontSize: 11,

    fontWeight: 900,

    cursor: "pointer",

    textDecoration:
      "underline",

    textUnderlineOffset: 2,
  },

  moduleBadge: {
    display:
      "inline-flex",

    borderRadius: 7,

    padding:
      "6px 9px",

    background:
      "#f0f2f5",

    color:
      "#29445d",

    fontSize: 11,

    fontWeight: 900,
  },

  errorBox: {
    marginBottom: 18,

    padding:
      "12px 14px",

    borderRadius: 9,

    border:
      "1px solid #f0b9b9",

    background:
      "#fff1f1",

    color:
      "#b42318",

    fontSize: 14,

    fontWeight: 700,
  },

  infoBox: {
    marginBottom: 18,

    padding: "14px",

    borderRadius: 9,

    background:
      "#edf5ff",

    color:
      "#1161ba",

    fontWeight: 700,
  },

  /*
   * HISTORY MODAL
   */

  modalOverlay: {
    position: "fixed",

    inset: 0,

    zIndex: 1000,

    background:
      "rgba(4, 22, 37, 0.62)",

    display: "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    padding: 24,
  },

  modal: {
    width:
      "min(1280px, 96vw)",

    maxHeight:
      "92vh",

    background:
      "#f7f9fc",

    borderRadius: 18,

    overflow:
      "hidden",

    boxShadow:
      "0 28px 80px rgba(0,0,0,0.28)",

    display: "flex",

    flexDirection:
      "column",
  },

  modalHeader: {
    display: "flex",

    alignItems:
      "flex-start",

    justifyContent:
      "space-between",

    gap: 20,

    padding:
      "22px 26px",

    background: "#fff",

    borderBottom:
      "1px solid #dce6f2",
  },

  modalEyebrow: {
    color:
      "#1473e6",

    fontSize: 11,

    fontWeight: 900,

    letterSpacing: 1.2,

    marginBottom: 5,
  },

  modalTitle: {
    margin: 0,

    fontSize: 26,

    color:
      "#082a45",

    fontWeight: 900,
  },

  modalSubtitle: {
    margin:
      "5px 0 0",

    color:
      "#71839a",

    fontSize: 13,
  },

  closeButton: {
    width: 38,

    height: 38,

    borderRadius: 10,

    border:
      "1px solid #d5e0ec",

    background: "#fff",

    color:
      "#29445d",

    fontSize: 25,

    lineHeight: 1,

    cursor: "pointer",
  },

  modalBody: {
    overflowY: "auto",

    padding: 22,
  },

  modalFooter: {
    display: "flex",

    justifyContent:
      "flex-end",

    padding:
      "16px 22px",

    background: "#fff",

    borderTop:
      "1px solid #dce6f2",
  },

  historySection: {
    background: "#fff",

    border:
      "1px solid #dce6f2",

    borderRadius: 14,

    padding: 18,

    marginBottom: 16,
  },

  historyTitle: {
    margin: 0,

    color:
      "#082a45",

    fontSize: 19,

    fontWeight: 900,
  },

  historySubtitle: {
    margin:
      "4px 0 16px",

    color:
      "#71839a",

    fontSize: 13,
  },

  detailGrid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",

    gap: 16,
  },

  detailWide: {
    gridColumn:
      "span 2",
  },

  detailLabel: {
    fontSize: 11,

    color:
      "#71839a",

    fontWeight: 800,

    textTransform:
      "uppercase",

    letterSpacing: 0.4,

    marginBottom: 5,
  },

  detailValue: {
    color:
      "#173751",

    fontSize: 14,

    fontWeight: 700,

    overflowWrap:
      "anywhere",
  },

  historyTableWrapper: {
    overflowX: "auto",

    border:
      "1px solid #e0e7ef",

    borderRadius: 10,
  },

  historyTable: {
    width: "100%",

    minWidth: 900,

    borderCollapse:
      "collapse",
  },

  historyTh: {
    padding:
      "11px 12px",

    background:
      "#f4f7fb",

    borderBottom:
      "1px solid #dce6f2",

    textAlign:
      "left",

    color:
      "#36506a",

    fontSize: 11,

    fontWeight: 900,

    whiteSpace:
      "nowrap",
  },

  historyTd: {
    padding: "12px",

    borderBottom:
      "1px solid #edf1f6",

    color:
      "#29445d",

    fontSize: 12,

    verticalAlign:
      "top",
  },

  historyEmpty: {
    padding: 22,

    borderRadius: 9,

    background:
      "#f7f9fc",

    color:
      "#71839a",

    textAlign:
      "center",

    fontSize: 13,
  },
};