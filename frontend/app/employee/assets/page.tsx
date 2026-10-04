"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CSSProperties,
  FormEvent,
} from "react";

import Side from "@/components/Side";
import AssetIcon from "@/components/AssetIcon";
import { api } from "@/lib/api";

/* =========================================================
   TYPES
   ========================================================= */

interface Asset {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  serialNumber?: string | null;
  status: string;

  /*
   * Optional because some AssetResponse versions
   * may not return this field yet.
   */
  assignmentType?:
    | "PRIMARY"
    | "SECONDARY"
    | null;
}

interface EmployeeProfile {
  id?: string;

  employeeCode?: string | null;

  name?: string | null;

  email?: string | null;

  department?: string | null;

  /*
   * These three fields come from the updated
   * EmployeeResponse.java.
   */
  managerId?: string | null;

  managerName?: string | null;

  managerEmail?: string | null;
}

interface SecondaryDeviceRequest {
  id: string;

  category: string;

  reason: string;

  status: string;

  managerId?: string | null;

  managerName?: string | null;

  assignedAssetId?: string | null;

  assignedAssetTag?: string | null;

  assignedAssetName?: string | null;

  requestedAt?: string | null;
}

/* =========================================================
   PAGE
   ========================================================= */

export default function MyAssets() {
  const [assets, setAssets] =
    useState<Asset[]>([]);

  const [requests, setRequests] =
    useState<SecondaryDeviceRequest[]>([]);

  const [employee, setEmployee] =
    useState<EmployeeProfile | null>(
      null
    );

  /*
   * Do not call localStorage directly inside JSX.
   * Read it after the client component mounts.
   */
  const [storedName, setStoredName] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    showRequestModal,
    setShowRequestModal,
  ] = useState(false);

  const [category, setCategory] =
    useState("");

  const [reason, setReason] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  /* =========================================================
     LOAD DATA
     ========================================================= */

  async function loadData() {
    try {
      setLoading(true);

      setError("");

      const [
        assetData,
        requestData,
        employeeData,
      ] = await Promise.all([
        api(
          "/api/v1/employees/me/assets"
        ),

        api(
          "/api/v1/employees/me/secondary-device-requests"
        ),

        api(
          "/api/v1/employees/me"
        ),
      ]);

      /*
       * -----------------------------------------------------
       * ASSETS
       * -----------------------------------------------------
       */

      setAssets(
        Array.isArray(assetData)
          ? assetData
          : []
      );

      /*
       * -----------------------------------------------------
       * SECONDARY DEVICE REQUESTS
       * -----------------------------------------------------
       */

      setRequests(
        Array.isArray(requestData)
          ? requestData
          : []
      );

      /*
       * -----------------------------------------------------
       * EMPLOYEE PROFILE
       * -----------------------------------------------------
       *
       * Expected response:
       *
       * {
       *   id: "...",
       *   employeeCode: "EMP-0002",
       *   name: "Shiva Teja",
       *   email: "shiva@enfec.local",
       *   department: "Engineering",
       *   managerId: "...",
       *   managerName: "Vikram",
       *   managerEmail: "vikram@enfec.local"
       * }
       */

      setEmployee(
        employeeData ?? null
      );

      console.log(
        "EMPLOYEE PROFILE:",
        employeeData
      );
    } catch (err) {
      console.error(
        "Failed to load employee assets:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load employee asset information."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     INITIAL LOAD
     ========================================================= */

  useEffect(() => {
    /*
     * Read employee name safely from browser storage.
     */
    const name =
      window.localStorage.getItem(
        "name"
      );

    if (name) {
      setStoredName(name);
    }

    void loadData();

    /*
     * Allows:
     *
     * /employee/assets?request=1
     *
     * to automatically open the request modal.
     */
    const params =
      new URLSearchParams(
        window.location.search
      );

    if (
      params.get("request") === "1"
    ) {
      setShowRequestModal(true);
    }
  }, []);

  /* =========================================================
     SECONDARY ASSET IDS
     ========================================================= */

  const secondaryAssetIds =
    useMemo(() => {
      return new Set(
        requests
          .map(
            (request) =>
              request.assignedAssetId
          )
          .filter(
            (
              id
            ): id is string =>
              Boolean(id)
          )
      );
    }, [requests]);

  /* =========================================================
     PRIMARY ASSETS
     ========================================================= */

  const primaryAssets =
    useMemo(() => {
      return assets.filter(
        (asset) => {
          /*
           * If backend explicitly returns assignmentType,
           * use it.
           */
          if (
            asset.assignmentType ===
            "SECONDARY"
          ) {
            return false;
          }

          if (
            asset.assignmentType ===
            "PRIMARY"
          ) {
            return true;
          }

          /*
           * Backward-compatible fallback.
           *
           * If asset ID belongs to a fulfilled secondary
           * request, it is secondary.
           */
          return !secondaryAssetIds.has(
            asset.id
          );
        }
      );
    }, [
      assets,
      secondaryAssetIds,
    ]);

  /* =========================================================
     SECONDARY ASSETS
     ========================================================= */

  const secondaryAssets =
    useMemo(() => {
      return assets.filter(
        (asset) => {
          if (
            asset.assignmentType ===
            "SECONDARY"
          ) {
            return true;
          }

          if (
            asset.assignmentType ===
            "PRIMARY"
          ) {
            return false;
          }

          return secondaryAssetIds.has(
            asset.id
          );
        }
      );
    }, [
      assets,
      secondaryAssetIds,
    ]);

  /* =========================================================
     MANAGER NAME
     =========================================================

     PRIMARY SOURCE:

     GET /api/v1/employees/me

     employee.managerName

     FALLBACK:

     existing secondary request managerName

     If Shiva's manager_id points to Vikram, and the backend
     EmployeeResponse has been updated, this becomes "Vikram".
     ========================================================= */

  const managerName =
    employee?.managerName ||
    requests.find(
      (request) =>
        request.managerName
    )?.managerName ||
    "-";

  /* =========================================================
     OPEN REQUEST MODAL
     ========================================================= */

  function openRequestModal() {
    setError("");

    setSuccess("");

    setCategory("");

    setReason("");

    setShowRequestModal(true);
  }

  /* =========================================================
     CLOSE REQUEST MODAL
     ========================================================= */

  function closeRequestModal() {
    if (submitting) {
      return;
    }

    setShowRequestModal(false);

    setCategory("");

    setReason("");

    /*
     * Remove ?request=1 from URL.
     */
    if (
      window.location.search
    ) {
      window.history.replaceState(
        {},
        "",
        "/employee/assets"
      );
    }
  }

  /* =========================================================
     SUBMIT SECONDARY DEVICE REQUEST
     ========================================================= */

  async function submitRequest(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanCategory =
      category.trim();

    const cleanReason =
      reason.trim();

    if (!cleanCategory) {
      setError(
        "Please select a device category."
      );

      return;
    }

    if (!cleanReason) {
      setError(
        "Please enter a reason / justification."
      );

      return;
    }

    if (
      cleanReason.length > 1000
    ) {
      setError(
        "Reason cannot exceed 1000 characters."
      );

      return;
    }

    try {
      setSubmitting(true);

      setError("");

      setSuccess("");

      await api(
        "/api/v1/employees/me/secondary-device-requests",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            category:
              cleanCategory,

            reason:
              cleanReason,
          }),
        }
      );

      setShowRequestModal(false);

      setCategory("");

      setReason("");

      window.history.replaceState(
        {},
        "",
        "/employee/assets"
      );

      setSuccess(
        "Secondary device request submitted successfully. It is now waiting for manager approval."
      );

      await loadData();
    } catch (err) {
      console.error(
        "Failed to submit request:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit secondary device request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =========================================================
     FORMAT STATUS
     ========================================================= */

  function formatStatus(
    status: string
  ) {
    switch (status) {
      case "IN_STOCK":
        return "In Stock";

      case "ASSIGNED":
        return "Assigned";

      case "IN_REPAIR":
        return "In Repair";

      case "RETIRED":
        return "Retired";

      default:
        return status;
    }
  }

  /* =========================================================
     STATUS STYLE
     ========================================================= */

  function getStatusStyle(
    status: string
  ): CSSProperties {
    switch (status) {
      case "IN_STOCK":
        return {
          backgroundColor:
            "#e8f8f0",

          color:
            "#15803d",
        };

      case "ASSIGNED":
        return {
          backgroundColor:
            "#e8f1ff",

          color:
            "#1473e6",
        };

      case "IN_REPAIR":
        return {
          backgroundColor:
            "#fff7df",

          color:
            "#b7791f",
        };

      case "RETIRED":
        return {
          backgroundColor:
            "#feecec",

          color:
            "#dc2626",
        };

      default:
        return {
          backgroundColor:
            "#eef2f7",

          color:
            "#475569",
        };
    }
  }

  /* =========================================================
     UI
     ========================================================= */

  return (
    <div style={styles.page}>
      <Side role="employee" />

      <main style={styles.main}>
        {/* =================================================
            HEADER
            ================================================= */}

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              My Assets
            </h1>

            <p style={styles.subtitle}>
              View your primary and
              secondary company devices.
            </p>
          </div>

          <button
            type="button"
            style={
              styles.refreshButton
            }
            onClick={() =>
              void loadData()
            }
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "Refresh"}
          </button>
        </div>

        {/* =================================================
            ERROR MESSAGE
            ================================================= */}

        {error && (
          <div
            style={styles.errorBox}
          >
            {error}
          </div>
        )}

        {/* =================================================
            SUCCESS MESSAGE
            ================================================= */}

        {success && (
          <div
            style={
              styles.successBox
            }
          >
            {success}
          </div>
        )}

        {/* =================================================
            SUMMARY CARDS
            ================================================= */}

        <div
          style={styles.summaryRow}
        >
          <div
            style={
              styles.summaryCard
            }
          >
            <div>
              <div
                style={
                  styles.summaryLabel
                }
              >
                Total Assigned Assets
              </div>

              <div
                style={
                  styles.summaryNumber
                }
              >
                {assets.length}
              </div>
            </div>

            <div
              style={
                styles.summaryIcon
              }
            >
              <AssetIcon
                category="Other"
                name="Assets"
                size={28}
              />
            </div>
          </div>

          <div
            style={
              styles.summaryCard
            }
          >
            <div>
              <div
                style={
                  styles.summaryLabel
                }
              >
                Primary Devices
              </div>

              <div
                style={
                  styles.summaryNumber
                }
              >
                {
                  primaryAssets.length
                }
              </div>
            </div>

            <div
              style={
                styles.summaryIcon
              }
            >
              <AssetIcon
                category="Laptop"
                name="Primary"
                size={28}
              />
            </div>
          </div>

          <div
            style={
              styles.summaryCard
            }
          >
            <div>
              <div
                style={
                  styles.summaryLabel
                }
              >
                Secondary Devices
              </div>

              <div
                style={
                  styles.summaryNumber
                }
              >
                {
                  secondaryAssets.length
                }
              </div>
            </div>

            <div
              style={
                styles.summaryIcon
              }
            >
              <AssetIcon
                category="Monitor"
                name="Secondary"
                size={28}
              />
            </div>
          </div>
        </div>

        {/* =================================================
            PRIMARY DEVICE
            ================================================= */}

        <section
          style={styles.panel}
        >
          <div
            style={
              styles.panelHeader
            }
          >
            <div>
              <h2
                style={
                  styles.panelTitle
                }
              >
                Primary Device
              </h2>

              <p
                style={
                  styles.panelSubtitle
                }
              >
                Your main company
                equipment
              </p>
            </div>
          </div>

          <div
            style={
              styles.panelBody
            }
          >
            {loading &&
              assets.length ===
                0 && (
                <div
                  style={
                    styles.emptyState
                  }
                >
                  Loading your
                  assets...
                </div>
              )}

            {!loading &&
              primaryAssets.length ===
                0 && (
                <div
                  style={
                    styles.emptyState
                  }
                >
                  No primary device
                  is currently
                  assigned.
                </div>
              )}

            {primaryAssets.map(
              (asset) => (
                <div
                  key={asset.id}
                  style={
                    styles.assetCard
                  }
                >
                  <div
                    style={
                      styles.assetTop
                    }
                  >
                    <div
                      style={
                        styles.assetIdentity
                      }
                    >
                      <div
                        style={
                          styles.assetIcon
                        }
                      >
                        <AssetIcon
                          category={
                            asset.category
                          }
                          name={
                            asset.name
                          }
                          size={32}
                        />
                      </div>

                      <div>
                        <h3
                          style={
                            styles.assetName
                          }
                        >
                          {
                            asset.name
                          }
                        </h3>

                        <div
                          style={
                            styles.assetTag
                          }
                        >
                          {
                            asset.assetTag
                          }
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        ...styles.statusBadge,

                        ...getStatusStyle(
                          asset.status
                        ),
                      }}
                    >
                      {formatStatus(
                        asset.status
                      )}
                    </span>
                  </div>

                  <div
                    style={
                      styles.dividerLine
                    }
                  />

                  <div
                    style={
                      styles.assetDetailsGrid
                    }
                  >
                    <div>
                      <div
                        style={
                          styles.detailLabel
                        }
                      >
                        Asset Tag
                      </div>

                      <div
                        style={
                          styles.detailValue
                        }
                      >
                        {
                          asset.assetTag
                        }
                      </div>
                    </div>

                    <div>
                      <div
                        style={
                          styles.detailLabel
                        }
                      >
                        Category
                      </div>

                      <div
                        style={
                          styles.detailValue
                        }
                      >
                        {asset.category ||
                          "-"}
                      </div>
                    </div>

                    <div>
                      <div
                        style={
                          styles.detailLabel
                        }
                      >
                        Serial Number
                      </div>

                      <div
                        style={
                          styles.detailValue
                        }
                      >
                        {asset.serialNumber ||
                          "-"}
                      </div>
                    </div>

                    <div>
                      <div
                        style={
                          styles.detailLabel
                        }
                      >
                        Status
                      </div>

                      <div
                        style={
                          styles.detailValue
                        }
                      >
                        {formatStatus(
                          asset.status
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {/* =================================================
            SECONDARY DEVICES
            ================================================= */}

        <section
          style={{
            ...styles.panel,

            marginTop:
              "24px",
          }}
        >
          <div
            style={
              styles.secondaryHeader
            }
          >
            <div>
              <h2
                style={
                  styles.panelTitle
                }
              >
                Secondary Devices
              </h2>

              <p
                style={
                  styles.panelSubtitle
                }
              >
                Additional devices
                assigned through an
                approved request
              </p>
            </div>

            <button
              type="button"
              style={
                styles.requestButton
              }
              onClick={
                openRequestModal
              }
            >
              + Request Secondary Device
            </button>
          </div>

          <div
            style={
              styles.panelBody
            }
          >
            {secondaryAssets.length ===
            0 ? (
              <div
                style={
                  styles.emptySecondary
                }
              >
                No secondary
                devices are
                currently assigned.
              </div>
            ) : (
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
                        Asset
                      </th>

                      <th
                        style={
                          styles.th
                        }
                      >
                        Asset Tag
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
                        Serial Number
                      </th>

                      <th
                        style={
                          styles.th
                        }
                      >
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {secondaryAssets.map(
                      (asset) => (
                        <tr
                          key={
                            asset.id
                          }
                        >
                          <td
                            style={
                              styles.td
                            }
                          >
                            <div
                              style={
                                styles.tableAsset
                              }
                            >
                              <AssetIcon
                                category={
                                  asset.category
                                }
                                name={
                                  asset.name
                                }
                                size={
                                  24
                                }
                              />

                              <span>
                                {
                                  asset.name
                                }
                              </span>
                            </div>
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            {
                              asset.assetTag
                            }
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            {
                              asset.category
                            }
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            {asset.serialNumber ||
                              "-"}
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
                                  asset.status
                                ),
                              }}
                            >
                              {formatStatus(
                                asset.status
                              )}
                            </span>
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

      {/* =====================================================
          REQUEST SECONDARY DEVICE MODAL
          ===================================================== */}

      {showRequestModal && (
        <div
          style={styles.overlay}
        >
          <div
            style={styles.modal}
          >
            {/* ===============================================
                MODAL HEADER
                =============================================== */}

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
                  Request Secondary
                  Device
                </h2>

                <p
                  style={
                    styles.modalSubtitle
                  }
                >
                  Submit a request
                  to your manager
                  for an additional
                  device.
                </p>
              </div>

              <button
                type="button"
                style={
                  styles.closeButton
                }
                onClick={
                  closeRequestModal
                }
                disabled={
                  submitting
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                submitRequest
              }
            >
              <div
                style={
                  styles.modalBody
                }
              >
                {/* ===========================================
                    EMPLOYEE INFORMATION
                    =========================================== */}

                <div
                  style={
                    styles.sectionTitle
                  }
                >
                  Employee Information
                </div>

                <div
                  style={
                    styles.infoGrid
                  }
                >
                  <Info
                    label="Name"
                    value={
                      employee?.name ||
                      storedName ||
                      "-"
                    }
                  />

                  <Info
                    label="Employee ID"
                    value={
                      employee?.employeeCode ||
                      "-"
                    }
                  />

                  <Info
                    label="Department"
                    value={
                      employee?.department ||
                      "-"
                    }
                  />

                  {/* =========================================
                      THIS NOW READS VIKRAM FROM
                      GET /api/v1/employees/me
                      ========================================= */}

                  <Info
                    label="Manager"
                    value={
                      managerName
                    }
                  />
                </div>

                {/* Optional manager email display */}

                {employee?.managerEmail && (
                  <div
                    style={
                      styles.managerInfo
                    }
                  >
                    Reports to{" "}
                    <strong>
                      {
                        employee.managerName
                      }
                    </strong>

                    {" • "}

                    {
                      employee.managerEmail
                    }
                  </div>
                )}

                <div
                  style={
                    styles.sectionDivider
                  }
                />

                {/* ===========================================
                    CURRENT PRIMARY DEVICE
                    =========================================== */}

                <div
                  style={
                    styles.sectionTitle
                  }
                >
                  Current Primary Device
                </div>

                {primaryAssets.length >
                0 ? (
                  <div
                    style={
                      styles.currentAsset
                    }
                  >
                    <div
                      style={
                        styles.currentAssetIcon
                      }
                    >
                      <AssetIcon
                        category={
                          primaryAssets[0]
                            .category
                        }
                        name={
                          primaryAssets[0]
                            .name
                        }
                        size={30}
                      />
                    </div>

                    <div>
                      <div
                        style={
                          styles.currentAssetName
                        }
                      >
                        {
                          primaryAssets[0]
                            .name
                        }
                      </div>

                      <div
                        style={
                          styles.currentAssetMeta
                        }
                      >
                        Asset Tag:{" "}
                        {
                          primaryAssets[0]
                            .assetTag
                        }
                      </div>

                      <div
                        style={
                          styles.currentAssetMeta
                        }
                      >
                        Category:{" "}
                        {
                          primaryAssets[0]
                            .category
                        }
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={
                      styles.noPrimary
                    }
                  >
                    No primary
                    device assigned.
                  </div>
                )}

                <div
                  style={
                    styles.sectionDivider
                  }
                />

                {/* ===========================================
                    SECONDARY DEVICE REQUEST
                    =========================================== */}

                <div
                  style={
                    styles.sectionTitle
                  }
                >
                  Secondary Device
                  Request
                </div>

                <label
                  style={
                    styles.formLabel
                  }
                >
                  Device Category{" "}

                  <span
                    style={{
                      color:
                        "#dc2626",
                    }}
                  >
                    *
                  </span>
                </label>

                <select
                  value={
                    category
                  }
                  onChange={(
                    event
                  ) =>
                    setCategory(
                      event.target
                        .value
                    )
                  }
                  style={
                    styles.input
                  }
                  required
                >
                  <option value="">
                    Select device
                    category
                  </option>

                  <option value="Laptop">
                    Laptop
                  </option>

                  <option value="Monitor">
                    Monitor
                  </option>

                  <option value="Tablet">
                    Tablet
                  </option>

                  <option value="Mobile">
                    Mobile
                  </option>

                  <option value="Keyboard">
                    Keyboard
                  </option>

                  <option value="Mouse">
                    Mouse
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>

                <label
                  style={{
                    ...styles.formLabel,

                    marginTop:
                      "18px",
                  }}
                >
                  Reason / Justification{" "}

                  <span
                    style={{
                      color:
                        "#dc2626",
                    }}
                  >
                    *
                  </span>
                </label>

                <textarea
                  value={reason}
                  onChange={(
                    event
                  ) =>
                    setReason(
                      event.target
                        .value
                    )
                  }
                  placeholder="Explain why you need an additional device..."
                  maxLength={
                    1000
                  }
                  style={
                    styles.textarea
                  }
                  required
                />

                <div
                  style={
                    styles.characterCount
                  }
                >
                  {reason.length}
                  /1000
                </div>
              </div>

              {/* =============================================
                  MODAL FOOTER
                  ============================================= */}

              <div
                style={
                  styles.modalFooter
                }
              >
                <button
                  type="button"
                  style={
                    styles.cancelButton
                  }
                  onClick={
                    closeRequestModal
                  }
                  disabled={
                    submitting
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={
                    styles.submitButton
                  }
                  disabled={
                    submitting
                  }
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   INFO COMPONENT
   ========================================================= */

function Info({
  label,
  value,
}: {
  label: string;

  value:
    | string
    | null
    | undefined;
}) {
  return (
    <div>
      <div
        style={
          styles.infoLabel
        }
      >
        {label}
      </div>

      <div
        style={
          styles.infoValue
        }
      >
        {value || "-"}
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
  page: {
    minHeight:
      "100vh",

    display:
      "flex",

    backgroundColor:
      "#f5f8fc",
  },

  main: {
    flex:
      1,

    minWidth:
      0,

    padding:
      "36px 44px",

    backgroundColor:
      "#f5f8fc",
  },

  header: {
    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "flex-start",

    gap:
      "20px",

    marginBottom:
      "28px",
  },

  title: {
    margin:
      0,

    fontSize:
      "34px",

    lineHeight:
      1.2,

    color:
      "#0f2740",

    fontWeight:
      750,
  },

  subtitle: {
    margin:
      "8px 0 0",

    color:
      "#71829a",

    fontSize:
      "15px",
  },

  refreshButton: {
    border:
      "none",

    borderRadius:
      "9px",

    backgroundColor:
      "#1473e6",

    color:
      "#ffffff",

    fontWeight:
      700,

    fontSize:
      "15px",

    padding:
      "13px 22px",

    cursor:
      "pointer",
  },

  errorBox: {
    padding:
      "14px 16px",

    borderRadius:
      "9px",

    backgroundColor:
      "#fff0f0",

    color:
      "#c62828",

    marginBottom:
      "18px",

    border:
      "1px solid #fecaca",
  },

  successBox: {
    padding:
      "14px 16px",

    borderRadius:
      "9px",

    backgroundColor:
      "#ecfdf5",

    color:
      "#047857",

    marginBottom:
      "18px",

    border:
      "1px solid #a7f3d0",
  },

  summaryRow: {
    display:
      "flex",

    gap:
      "18px",

    flexWrap:
      "wrap",

    marginBottom:
      "24px",
  },

  summaryCard: {
    width:
      "245px",

    minHeight:
      "105px",

    backgroundColor:
      "#ffffff",

    border:
      "1px solid #dde6f0",

    borderRadius:
      "14px",

    padding:
      "22px",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "space-between",

    boxSizing:
      "border-box",
  },

  summaryLabel: {
    color:
      "#75869d",

    fontSize:
      "14px",

    marginBottom:
      "6px",
  },

  summaryNumber: {
    color:
      "#0f2740",

    fontSize:
      "30px",

    lineHeight:
      1,

    fontWeight:
      750,
  },

  summaryIcon: {
    width:
      "50px",

    height:
      "50px",

    borderRadius:
      "10px",

    backgroundColor:
      "#e8f1ff",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",
  },

  panel: {
    backgroundColor:
      "#ffffff",

    border:
      "1px solid #dde6f0",

    borderRadius:
      "14px",

    overflow:
      "hidden",
  },

  panelHeader: {
    padding:
      "22px 24px",

    borderBottom:
      "1px solid #e7edf4",
  },

  secondaryHeader: {
    padding:
      "22px 24px",

    borderBottom:
      "1px solid #e7edf4",

    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    gap:
      "20px",
  },

  panelTitle: {
    margin:
      0,

    color:
      "#0f2740",

    fontSize:
      "21px",

    fontWeight:
      750,
  },

  panelSubtitle: {
    margin:
      "5px 0 0",

    color:
      "#8292a7",

    fontSize:
      "14px",
  },

  panelBody: {
    padding:
      "24px",
  },

  requestButton: {
    border:
      "none",

    borderRadius:
      "8px",

    backgroundColor:
      "#1473e6",

    color:
      "#ffffff",

    padding:
      "11px 17px",

    fontWeight:
      700,

    cursor:
      "pointer",

    whiteSpace:
      "nowrap",
  },

  assetCard: {
    border:
      "1px solid #dde6f0",

    borderRadius:
      "13px",

    padding:
      "22px",

    marginBottom:
      "16px",

    backgroundColor:
      "#ffffff",
  },

  assetTop: {
    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    gap:
      "20px",
  },

  assetIdentity: {
    display:
      "flex",

    alignItems:
      "center",

    gap:
      "16px",
  },

  assetIcon: {
    width:
      "54px",

    height:
      "54px",

    borderRadius:
      "10px",

    backgroundColor:
      "#e8f1ff",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",
  },

  assetName: {
    margin:
      "0 0 5px",

    color:
      "#0f2740",

    fontSize:
      "19px",

    fontWeight:
      750,
  },

  assetTag: {
    color:
      "#1473e6",

    fontSize:
      "14px",

    fontWeight:
      700,
  },

  statusBadge: {
    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    borderRadius:
      "999px",

    padding:
      "6px 12px",

    fontSize:
      "12px",

    fontWeight:
      700,

    whiteSpace:
      "nowrap",
  },

  dividerLine: {
    height:
      "1px",

    backgroundColor:
      "#e7edf4",

    margin:
      "20px 0",
  },

  assetDetailsGrid: {
    display:
      "grid",

    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",

    gap:
      "20px",
  },

  detailLabel: {
    color:
      "#8191a6",

    fontSize:
      "12px",

    marginBottom:
      "6px",
  },

  detailValue: {
    color:
      "#263c53",

    fontSize:
      "14px",

    fontWeight:
      650,
  },

  emptyState: {
    padding:
      "35px 20px",

    textAlign:
      "center",

    color:
      "#8191a6",

    fontSize:
      "15px",
  },

  emptySecondary: {
    padding:
      "30px",

    textAlign:
      "center",

    color:
      "#8191a6",

    backgroundColor:
      "#f8fafc",

    borderRadius:
      "10px",
  },

  tableWrapper: {
    width:
      "100%",

    overflowX:
      "auto",
  },

  table: {
    width:
      "100%",

    borderCollapse:
      "collapse",
  },

  th: {
    padding:
      "13px 14px",

    textAlign:
      "left",

    backgroundColor:
      "#f8fafc",

    color:
      "#64748b",

    fontSize:
      "12px",

    fontWeight:
      700,

    borderBottom:
      "1px solid #e2e8f0",
  },

  td: {
    padding:
      "15px 14px",

    color:
      "#334155",

    fontSize:
      "14px",

    borderBottom:
      "1px solid #edf2f7",
  },

  tableAsset: {
    display:
      "flex",

    alignItems:
      "center",

    gap:
      "10px",

    fontWeight:
      650,
  },

  overlay: {
    position:
      "fixed",

    inset:
      0,

    backgroundColor:
      "rgba(15, 23, 42, 0.55)",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    padding:
      "24px",

    zIndex:
      1000,
  },

  modal: {
    width:
      "100%",

    maxWidth:
      "720px",

    maxHeight:
      "92vh",

    overflowY:
      "auto",

    backgroundColor:
      "#ffffff",

    borderRadius:
      "14px",

    boxShadow:
      "0 25px 60px rgba(15,23,42,0.25)",
  },

  modalHeader: {
    padding:
      "22px 24px",

    borderBottom:
      "1px solid #e2e8f0",

    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "flex-start",
  },

  modalTitle: {
    margin:
      0,

    color:
      "#0f2740",

    fontSize:
      "22px",

    fontWeight:
      750,
  },

  modalSubtitle: {
    margin:
      "5px 0 0",

    color:
      "#71829a",

    fontSize:
      "13px",
  },

  closeButton: {
    width:
      "34px",

    height:
      "34px",

    border:
      "none",

    borderRadius:
      "7px",

    backgroundColor:
      "#f1f5f9",

    color:
      "#475569",

    cursor:
      "pointer",

    fontSize:
      "22px",
  },

  modalBody: {
    padding:
      "24px",
  },

  sectionTitle: {
    color:
      "#0f2740",

    fontSize:
      "14px",

    fontWeight:
      750,

    marginBottom:
      "15px",
  },

  infoGrid: {
    display:
      "grid",

    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",

    gap:
      "18px",
  },

  infoLabel: {
    color:
      "#94a3b8",

    fontSize:
      "11px",

    marginBottom:
      "5px",
  },

  infoValue: {
    color:
      "#334155",

    fontSize:
      "13px",

    fontWeight:
      650,
  },

  managerInfo: {
    marginTop:
      "14px",

    padding:
      "10px 12px",

    borderRadius:
      "8px",

    backgroundColor:
      "#f8fafc",

    color:
      "#64748b",

    fontSize:
      "12px",

    border:
      "1px solid #e2e8f0",
  },

  sectionDivider: {
    height:
      "1px",

    backgroundColor:
      "#e2e8f0",

    margin:
      "23px 0",
  },

  currentAsset: {
    display:
      "flex",

    alignItems:
      "center",

    gap:
      "15px",

    border:
      "1px solid #e2e8f0",

    borderRadius:
      "10px",

    padding:
      "15px",

    backgroundColor:
      "#f8fafc",
  },

  currentAssetIcon: {
    width:
      "50px",

    height:
      "50px",

    borderRadius:
      "9px",

    backgroundColor:
      "#e8f1ff",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",
  },

  currentAssetName: {
    color:
      "#0f2740",

    fontWeight:
      750,

    fontSize:
      "15px",

    marginBottom:
      "4px",
  },

  currentAssetMeta: {
    color:
      "#64748b",

    fontSize:
      "12px",

    marginTop:
      "2px",
  },

  noPrimary: {
    padding:
      "16px",

    backgroundColor:
      "#f8fafc",

    borderRadius:
      "9px",

    color:
      "#64748b",

    fontSize:
      "13px",
  },

  formLabel: {
    display:
      "block",

    color:
      "#334155",

    fontSize:
      "13px",

    fontWeight:
      650,

    marginBottom:
      "7px",
  },

  input: {
    width:
      "100%",

    height:
      "43px",

    border:
      "1px solid #cbd5e1",

    borderRadius:
      "7px",

    padding:
      "0 12px",

    fontSize:
      "14px",

    color:
      "#334155",

    backgroundColor:
      "#ffffff",

    boxSizing:
      "border-box",

    outline:
      "none",
  },

  textarea: {
    width:
      "100%",

    minHeight:
      "110px",

    border:
      "1px solid #cbd5e1",

    borderRadius:
      "7px",

    padding:
      "11px 12px",

    fontSize:
      "14px",

    color:
      "#334155",

    resize:
      "vertical",

    boxSizing:
      "border-box",

    outline:
      "none",

    fontFamily:
      "inherit",
  },

  characterCount: {
    textAlign:
      "right",

    color:
      "#94a3b8",

    fontSize:
      "11px",

    marginTop:
      "5px",
  },

  modalFooter: {
    padding:
      "18px 24px",

    borderTop:
      "1px solid #e2e8f0",

    display:
      "flex",

    justifyContent:
      "flex-end",

    gap:
      "10px",
  },

  cancelButton: {
    border:
      "1px solid #cbd5e1",

    borderRadius:
      "7px",

    backgroundColor:
      "#ffffff",

    color:
      "#475569",

    padding:
      "10px 17px",

    fontWeight:
      650,

    cursor:
      "pointer",
  },

  submitButton: {
    border:
      "none",

    borderRadius:
      "7px",

    backgroundColor:
      "#1473e6",

    color:
      "#ffffff",

    padding:
      "10px 18px",

    fontWeight:
      700,

    cursor:
      "pointer",
  },
};