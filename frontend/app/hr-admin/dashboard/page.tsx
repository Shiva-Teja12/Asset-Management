"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  CSSProperties,
  FormEvent,
} from "react";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

/* =========================================================
   TYPES
   ========================================================= */

type OnboardingRequest = {
  id?: string;

  requestNumber?: string;
  requestNo?: string;

  employeeName?: string;
  employeeEmail?: string;
  employeeCode?: string;

  department?: string;
  designation?: string;

  joiningDate?: string;

  category?: string;
  deviceCategory?: string;

  quantity?: number;

  estimatedPricePerUnit?: number;
  estimatedUnitPrice?: number;
  estimatedCost?: number;
  totalEstimatedCost?: number;

  specifications?: string;

  businessJustification?: string;
  justification?: string;

  status?: string;

  createdByEmail?: string;
  createdByName?: string;

  assetAdminEmail?: string;
  assetAdminComment?: string;
  assetAdminReviewedAt?: string;

  financeEmail?: string;
  financeComment?: string;
  financeReviewedAt?: string;

  vpEmail?: string;
  vpComment?: string;
  vpReviewedAt?: string;

  assignedAssetId?: string;
  allocatedAt?: string;

  createdAt?: string;
  updatedAt?: string;
};

type CreateRequestForm = {
  employeeName: string;
  employeeEmail: string;
  employeeCode: string;

  department: string;
  designation: string;

  joiningDate: string;

  deviceCategory: string;

  quantity: string;


  specifications: string;

  businessJustification: string;
};

/* =========================================================
   CONSTANTS
   ========================================================= */

const INITIAL_FORM: CreateRequestForm = {
  employeeName: "",
  employeeEmail: "",
  employeeCode: "",

  department: "",
  designation: "",

  joiningDate: "",

  deviceCategory: "Laptop",

  quantity: "1",


  specifications: "",

  businessJustification: "",
};

const DEPARTMENTS = [
  "Engineering",
  "Human Resources",
  "Finance",
  "Information Technology",
  "Sales",
  "Operations",
  "Management",
  "Customer Support",
  "Administration",
];

const DEVICE_CATEGORIES = [
  "Laptop",
  "Desktop",
  "Monitor",
  "Mouse",
  "Keyboard",
  "Headset",
  "Mobile",
  "Tablet",
  "Docking Station",
  "Printer",
  "Webcam",
  "Other",
];

/* =========================================================
   HELPERS
   ========================================================= */

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
      error as {
        message?: unknown;
      }
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

  if (
    value &&
    typeof value === "object"
  ) {
    const objectValue =
      value as Record<
        string,
        unknown
      >;

    if (
      Array.isArray(
        objectValue.content
      )
    ) {
      return objectValue.content as OnboardingRequest[];
    }

    if (
      Array.isArray(
        objectValue.requests
      )
    ) {
      return objectValue.requests as OnboardingRequest[];
    }

    if (
      Array.isArray(
        objectValue.data
      )
    ) {
      return objectValue.data as OnboardingRequest[];
    }
  }

  return [];
}

function normalizeStatus(
  status?: string
) {
  return (
    status ?? "UNKNOWN"
  )
    .trim()
    .toUpperCase();
}

/* =========================================================
   MAIN PAGE
   ========================================================= */

export default function HRAdminDashboardPage() {
  const router = useRouter();

  const [
    requests,
    setRequests,
  ] = useState<
    OnboardingRequest[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    showCreate,
    setShowCreate,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    userName,
    setUserName,
  ] = useState("HR Admin");

  const [
    form,
    setForm,
  ] = useState<CreateRequestForm>(
    INITIAL_FORM
  );

  /* =======================================================
     AUTH
     ======================================================= */

  useEffect(() => {
    const token =
      localStorage.getItem(
        "token"
      );

    const role =
      localStorage.getItem(
        "role"
      );

    const name =
      localStorage.getItem(
        "name"
      );

    if (!token) {
      router.replace("/");
      return;
    }

    if (
      role &&
      role !== "HR_ADMIN"
    ) {
      router.replace("/");
      return;
    }

    if (name) {
      setUserName(name);
    }
  }, [router]);

  /* =======================================================
     LOAD REQUESTS
     ======================================================= */

  const loadRequests =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api<unknown>(
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
            "Unable to load onboarding requests."
          )
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  /* =======================================================
     OPEN CREATE MODAL FROM QUERY PARAMETER
     ======================================================= */

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    if (
      params.get(
        "newRequest"
      ) === "true"
    ) {
      setForm(INITIAL_FORM);

      setError("");
      setSuccess("");

      setShowCreate(true);

      window.history.replaceState(
        {},
        "",
        "/hr-admin/dashboard"
      );
    }
  }, []);

  /* =======================================================
     DASHBOARD COUNTS
     ======================================================= */

  const totalRequests =
    requests.length;

  const assetAdminCount =
    requests.filter(
      (request) => {
        const status =
          normalizeStatus(
            request.status
          );

        return (
          status.includes(
            "ASSET_ADMIN"
          ) ||
          status.includes(
            "SYSTEM_ADMIN"
          )
        );
      }
    ).length;

  const financeCount =
    requests.filter(
      (request) =>
        normalizeStatus(
          request.status
        ).includes(
          "FINANCE"
        )
    ).length;

  const vpCount =
    requests.filter(
      (request) =>
        normalizeStatus(
          request.status
        ).includes(
          "VP"
        )
    ).length;

  const allocatedCount =
    requests.filter(
      (request) => {
        const status =
          normalizeStatus(
            request.status
          );

        return (
          status.includes(
            "ALLOCATED"
          ) ||
          status.includes(
            "ASSIGNED"
          ) ||
          status.includes(
            "FULFILLED"
          ) ||
          status.includes(
            "COMPLETED"
          )
        );
      }
    ).length;

  /* =======================================================
     NAVIGATION
     ======================================================= */

  function goToDashboard() {
    router.push(
      "/hr-admin/dashboard"
    );
  }

  function goToMyRequests() {
    router.push(
      "/hr-admin/requests"
    );
  }

  function openNewRequest() {
    setError("");
    setSuccess("");

    setForm(
      INITIAL_FORM
    );

    setShowCreate(true);
  }

  function closeNewRequest() {
    if (creating) {
      return;
    }

    setShowCreate(false);

    setForm(
      INITIAL_FORM
    );

    setError("");
  }

  function logout() {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "role"
    );

    localStorage.removeItem(
      "name"
    );

    localStorage.removeItem(
      "email"
    );

    localStorage.removeItem(
      "userId"
    );

    router.push("/");
  }

  /* =======================================================
     FORM UPDATE
     ======================================================= */

  function updateForm(
    field:
      keyof CreateRequestForm,
    value: string
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  }

  /* =======================================================
     CREATE NEW JOINER REQUEST
     ======================================================= */

  async function submitRequest(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.employeeName.trim()
    ) {
      setError(
        "Employee name is required."
      );
      return;
    }

    if (
      !form.employeeEmail.trim()
    ) {
      setError(
        "Employee email is required."
      );
      return;
    }

    if (
      !form.department.trim()
    ) {
      setError(
        "Department is required."
      );
      return;
    }

    if (
      !form.joiningDate
    ) {
      setError(
        "Joining date is required."
      );
      return;
    }

    if (
      !form.deviceCategory.trim()
    ) {
      setError(
        "Device category is required."
      );
      return;
    }

    const quantity =
      Number(
        form.quantity
      );

    if (
      !Number.isFinite(
        quantity
      ) ||
      quantity < 1
    ) {
      setError(
        "Quantity must be at least 1."
      );
      return;
    }


    if (
      !form.businessJustification.trim()
    ) {
      setError(
        "Business justification is required."
      );
      return;
    }

    try {
      setCreating(true);

      const payload = {
        employeeName:
          form.employeeName.trim(),

        employeeEmail:
          form.employeeEmail
            .trim()
            .toLowerCase(),

        employeeCode:
          form.employeeCode.trim() ||
          null,

        department:
          form.department.trim(),

        designation:
          form.designation.trim() ||
          null,

        joiningDate:
          form.joiningDate,

        deviceCategory:
          form.deviceCategory.trim(),

        quantity,

        specifications:
          form.specifications.trim() ||
          null,

        estimatedCost: 0,

        businessJustification:
          form.businessJustification.trim(),
      };

      await api(
        "/api/v1/onboarding/requests",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              payload
            ),
        }
      );

      setShowCreate(false);

      setForm(
        INITIAL_FORM
      );

      setSuccess(
        "New joiner asset request created successfully."
      );

      await loadRequests();

      router.push(
        "/hr-admin/requests"
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to create new joiner asset request."
        )
      );
    } finally {
      setCreating(false);
    }
  }

  /* =======================================================
     UI
     ======================================================= */

  return (
    <div style={styles.page}>

      {/* ===================================================
          SIDEBAR
          =================================================== */}

      <aside
        style={
          styles.sidebar
        }
      >
        <div>

          {/* LOGO */}

          <div
            style={
              styles.logoRow
            }
          >
            <div
              style={
                styles.logoBox
              }
            >
              C
            </div>

            <div>
              <div
                style={
                  styles.logoTitle
                }
              >
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

          {/* MENU */}

          <div
            style={
              styles.menu
            }
          >
            <button
              type="button"
              onClick={
                goToDashboard
              }
              style={{
                ...styles.menuItem,
                ...styles.menuActive,
              }}
            >
              <span
                style={
                  styles.menuIcon
                }
              >
                ⌂
              </span>

              <span>
                Dashboard
              </span>
            </button>

            <button
              type="button"
              onClick={
                goToMyRequests
              }
              style={
                styles.menuItem
              }
            >
              <span
                style={
                  styles.menuIcon
                }
              >
                ▤
              </span>

              <span>
                My Requests
              </span>
            </button>
          </div>
        </div>

        {/* SIDEBAR BOTTOM */}

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
              {userName ||
                "HR Admin"}
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
            onClick={
              logout
            }
            style={
              styles.logoutButton
            }
          >
            <span>
              ↪
            </span>

            <span>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* ===================================================
          MAIN
          =================================================== */}

      <main
        style={
          styles.main
        }
      >

        {/* TOP BAR */}

        <header
          style={
            styles.topbar
          }
        >
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
                styles.topbarTitle
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
            <div
              style={
                styles.avatar
              }
            >
              H
            </div>

            <div>
              <div
                style={
                  styles.topProfileName
                }
              >
                {userName ||
                  "HR Admin"}
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

        {/* =================================================
            CONTENT
            ================================================= */}

        <div
          style={
            styles.content
          }
        >

          {/* PAGE HEADER */}

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
                HR Admin Dashboard
              </h1>

              <p
                style={
                  styles.pageSubtitle
                }
              >
                Create and track new
                joiner asset
                provisioning requests.
              </p>
            </div>

            <button
              type="button"
              onClick={
                openNewRequest
              }
              style={
                styles.primaryButton
              }
            >
              + New Joiner Asset
              Request
            </button>
          </div>

          {/* ALERTS */}

          {error &&
            !showCreate && (
              <div
                style={
                  styles.errorAlert
                }
              >
                {error}
              </div>
            )}

          {success && (
            <div
              style={
                styles.successAlert
              }
            >
              {success}
            </div>
          )}

          {/* =================================================
              SUMMARY CARDS
              ================================================= */}

          <div
            style={
              styles.cardsGrid
            }
          >
            <SummaryCard
              title="Total Requests"
              value={
                totalRequests
              }
              subtitle={
                loading
                  ? "Loading..."
                  : "All onboarding requests"
              }
            />

            <SummaryCard
              title="Asset Admin"
              value={
                assetAdminCount
              }
              subtitle="Waiting for review"
            />

            <SummaryCard
              title="Finance"
              value={
                financeCount
              }
              subtitle="Budget review"
            />

            <SummaryCard
              title="VP Approval"
              value={
                vpCount
              }
              subtitle="Business approval"
            />

            <SummaryCard
              title="Allocated"
              value={
                allocatedCount
              }
              subtitle="Assets issued"
            />
          </div>

          {/* =================================================
              ONBOARDING WORKFLOW REMOVED
              ================================================= */}

          {/* =================================================
              MANAGE REQUESTS
              ================================================= */}

          <section
            style={
              styles.manageCard
            }
          >
            <div>
              <h2
                style={
                  styles.manageTitle
                }
              >
                Manage New Joiner
                Requests
              </h2>

              <p
                style={
                  styles.manageSubtitle
                }
              >
                View all requests,
                search employees and
                track approval status
                from the My Requests
                page.
              </p>
            </div>

            <button
              type="button"
              onClick={
                goToMyRequests
              }
              style={
                styles.viewRequestsButton
              }
            >
              View My Requests →
            </button>
          </section>
        </div>
      </main>

      {/* ===================================================
          CREATE NEW JOINER REQUEST MODAL
          =================================================== */}

      {showCreate && (
        <div
          style={
            styles.overlay
          }
        >
          <div
            style={
              styles.modal
            }
          >

            {/* MODAL HEADER */}

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
                  New Joiner Asset
                  Request
                </h2>

                <p
                  style={
                    styles.modalSubtitle
                  }
                >
                  Submit an asset
                  provisioning request
                  for a new employee.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeNewRequest
                }
                disabled={
                  creating
                }
                style={
                  styles.closeButton
                }
              >
                ×
              </button>
            </div>

            {/* FORM */}

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

                {error && (
                  <div
                    style={
                      styles.errorAlert
                    }
                  >
                    {error}
                  </div>
                )}

                {/* EMPLOYEE INFORMATION */}

                <section
                  style={
                    styles.formSection
                  }
                >
                  <h3
                    style={
                      styles.formSectionTitle
                    }
                  >
                    Employee Information
                  </h3>

                  <p
                    style={
                      styles.formSectionSubtitle
                    }
                  >
                    Enter the new
                    employee&apos;s
                    onboarding details.
                  </p>

                  <div
                    style={
                      styles.formGrid
                    }
                  >

                    <FormField
                      label="Employee Name"
                      required
                    >
                      <input
                        type="text"
                        value={
                          form.employeeName
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "employeeName",
                            event.target
                              .value
                          )
                        }
                        placeholder="Enter employee name"
                        style={
                          styles.input
                        }
                      />
                    </FormField>

                    <FormField
                      label="Employee Email"
                      required
                    >
                      <input
                        type="email"
                        value={
                          form.employeeEmail
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "employeeEmail",
                            event.target
                              .value
                          )
                        }
                        placeholder="employee@enfec.com"
                        style={
                          styles.input
                        }
                      />
                    </FormField>

                    <FormField
                      label="Employee ID"
                    >
                      <input
                        type="text"
                        value={
                          form.employeeCode
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "employeeCode",
                            event.target
                              .value
                          )
                        }
                        placeholder="EMP-0011"
                        style={
                          styles.input
                        }
                      />
                    </FormField>

                    <FormField
                      label="Department"
                      required
                    >
                      <select
                        value={
                          form.department
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "department",
                            event.target
                              .value
                          )
                        }
                        style={
                          styles.input
                        }
                      >
                        <option value="">
                          Select department
                        </option>

                        {DEPARTMENTS.map(
                          (
                            department
                          ) => (
                            <option
                              key={
                                department
                              }
                              value={
                                department
                              }
                            >
                              {
                                department
                              }
                            </option>
                          )
                        )}
                      </select>
                    </FormField>

                    <FormField
                      label="Designation"
                    >
                      <input
                        type="text"
                        value={
                          form.designation
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "designation",
                            event.target
                              .value
                          )
                        }
                        placeholder="Software Engineer"
                        style={
                          styles.input
                        }
                      />
                    </FormField>

                    <FormField
                      label="Joining Date"
                      required
                    >
                      <input
                        type="date"
                        value={
                          form.joiningDate
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "joiningDate",
                            event.target
                              .value
                          )
                        }
                        style={
                          styles.input
                        }
                      />
                    </FormField>
                  </div>
                </section>

                {/* ASSET REQUIREMENT */}

                <section
                  style={
                    styles.formSection
                  }
                >
                  <h3
                    style={
                      styles.formSectionTitle
                    }
                  >
                    Asset Requirement
                  </h3>

                  <p
                    style={
                      styles.formSectionSubtitle
                    }
                  >
                    Enter the hardware
                    required for the new
                    joiner.
                  </p>

                  <div
                    style={
                      styles.formGrid
                    }
                  >

                    <FormField
                      label="Device Category"
                      required
                    >
                      <select
                        value={
                          form.deviceCategory
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "deviceCategory",
                            event.target
                              .value
                          )
                        }
                        style={
                          styles.input
                        }
                      >
                        {DEVICE_CATEGORIES.map(
                          (
                            category
                          ) => (
                            <option
                              key={
                                category
                              }
                              value={
                                category
                              }
                            >
                              {
                                category
                              }
                            </option>
                          )
                        )}
                      </select>
                    </FormField>

                    <FormField
                      label="Quantity"
                      required
                    >
                      <input
                        type="number"
                        min="1"
                        value={
                          form.quantity
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "quantity",
                            event.target
                              .value
                          )
                        }
                        style={
                          styles.input
                        }
                      />
                    </FormField>

                  </div>

                  <div
                    style={
                      styles.fullField
                    }
                  >
                    <FormField
                      label="Specifications"
                    >
                      <textarea
                        value={
                          form.specifications
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "specifications",
                            event.target
                              .value
                          )
                        }
                        placeholder="Example: Intel Core i7, 16GB RAM, 512GB SSD"
                        rows={4}
                        style={
                          styles.textarea
                        }
                      />
                    </FormField>
                  </div>

                  <div
                    style={
                      styles.fullField
                    }
                  >
                    <FormField
                      label="Business Justification"
                      required
                    >
                      <textarea
                        value={
                          form.businessJustification
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "businessJustification",
                            event.target
                              .value
                          )
                        }
                        placeholder="Explain why this asset is required for the employee..."
                        rows={4}
                        style={
                          styles.textarea
                        }
                      />
                    </FormField>
                  </div>
                </section>
              </div>

              {/* MODAL FOOTER */}

              <div
                style={
                  styles.modalFooter
                }
              >
                <button
                  type="button"
                  onClick={
                    closeNewRequest
                  }
                  disabled={
                    creating
                  }
                  style={
                    styles.cancelButton
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    creating
                  }
                  style={{
                    ...styles.submitButton,

                    ...(creating
                      ? styles.disabledButton
                      : {}),
                  }}
                >
                  {creating
                    ? "Creating..."
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
   SUMMARY CARD
   ========================================================= */

function SummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <div
      style={
        styles.summaryCard
      }
    >
      <div
        style={
          styles.summaryTitle
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

      <div
        style={
          styles.summarySubtitle
        }
      >
        {subtitle}
      </div>
    </div>
  );
}

/* =========================================================
   FORM FIELD
   ========================================================= */

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      style={
        styles.field
      }
    >
      <span
        style={
          styles.label
        }
      >
        {label}

        {required && (
          <span
            style={
              styles.required
            }
          >
            *
          </span>
        )}
      </span>

      {children}
    </label>
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
    minHeight: "100vh",
    display: "flex",
    backgroundColor: "#f4f7fb",
    color: "#102d47",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  /* =======================================================
     SIDEBAR
     ======================================================= */

  sidebar: {
    width: "300px",
    minWidth: "300px",
    minHeight: "100vh",

    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,

    display: "flex",
    flexDirection: "column",
    justifyContent:
      "space-between",

    padding:
      "28px 22px 22px",

    boxSizing: "border-box",

    backgroundColor:
      "#0d3a54",

    color: "#ffffff",

    zIndex: 50,
  },

  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "0 4px",
  },

  logoBox: {
    width: "50px",
    height: "50px",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    borderRadius: "11px",

    backgroundColor:
      "#ffffff",

    color: "#0d3a54",

    fontSize: "24px",
    fontWeight: 900,
  },

  logoTitle: {
    fontSize: "23px",
    fontWeight: 900,
    letterSpacing: "0.4px",
  },

  logoSubtitle: {
    marginTop: "4px",
    fontSize: "12px",
    color: "#d2e1ec",
  },

  menu: {
    marginTop: "36px",
    display: "grid",
    gap: "10px",
  },

  menuItem: {
    width: "100%",
    minHeight: "49px",

    display: "flex",
    alignItems: "center",

    gap: "15px",

    padding:
      "0 18px",

    border: "none",
    borderRadius: "9px",

    backgroundColor:
      "transparent",

    color: "#ffffff",

    fontSize: "15px",
    fontWeight: 700,

    textAlign: "left",

    cursor: "pointer",
  },

  menuActive: {
    backgroundColor:
      "#2d7aa5",
  },

  menuIcon: {
    width: "18px",
    textAlign: "center",
    fontSize: "15px",
  },

  sidebarProfile: {
    padding:
      "18px 0 20px",

    borderBottom:
      "1px solid rgba(255,255,255,0.15)",
  },

  sidebarProfileName: {
    fontSize: "16px",
    fontWeight: 800,
  },

  sidebarProfileRole: {
    marginTop: "5px",
    fontSize: "13px",
    color: "#d2e1ec",
  },

  logoutButton: {
    width: "100%",

    display: "flex",
    alignItems: "center",

    gap: "12px",

    marginTop: "16px",

    padding:
      "12px 0",

    border: "none",

    backgroundColor:
      "transparent",

    color: "#ffffff",

    fontSize: "14px",
    fontWeight: 700,

    cursor: "pointer",
  },

  /* =======================================================
     MAIN
     ======================================================= */

  main: {
    flex: 1,
    minWidth: 0,

    marginLeft: "300px",

    minHeight: "100vh",
  },

  /* =======================================================
     TOPBAR
     ======================================================= */

  topbar: {
    height: "85px",

    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",

    padding:
      "0 36px",

    boxSizing: "border-box",

    backgroundColor:
      "#ffffff",

    borderBottom:
      "1px solid #dce5ef",
  },

  workflowSmall: {
    fontSize: "12px",
    color: "#8092a7",
    marginBottom: "5px",
  },

  topbarTitle: {
    fontSize: "17px",
    fontWeight: 800,
    color: "#102d47",
  },

  topProfile: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  avatar: {
    width: "46px",
    height: "46px",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    borderRadius: "50%",

    backgroundColor:
      "#0d3a54",

    color: "#ffffff",

    fontSize: "18px",
    fontWeight: 800,
  },

  topProfileName: {
    fontSize: "15px",
    fontWeight: 800,
    color: "#102d47",
  },

  topProfileRole: {
    marginTop: "4px",
    fontSize: "12px",
    color: "#8192a7",
  },

  /* =======================================================
     CONTENT
     ======================================================= */

  content: {
    padding:
      "38px 34px 60px",
  },

  pageHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",

    gap: "20px",

    marginBottom: "30px",
  },

  pageTitle: {
    margin: 0,

    fontSize: "37px",
    lineHeight: 1.1,

    fontWeight: 900,

    color: "#102d47",
  },

  pageSubtitle: {
    margin: "8px 0 0",

    color: "#70859c",

    fontSize: "15px",

    lineHeight: 1.5,
  },

  primaryButton: {
    minHeight: "54px",

    padding:
      "0 24px",

    border: "none",
    borderRadius: "8px",

    backgroundColor:
      "#1677e8",

    color: "#ffffff",

    fontSize: "15px",
    fontWeight: 800,

    boxShadow:
      "0 7px 18px rgba(22,119,232,0.20)",

    cursor: "pointer",
  },

  /* =======================================================
     ALERTS
     ======================================================= */

  errorAlert: {
    marginBottom: "18px",

    padding:
      "13px 15px",

    border:
      "1px solid #fecaca",

    borderRadius: "8px",

    backgroundColor:
      "#fef2f2",

    color: "#b91c1c",

    fontSize: "13px",
  },

  successAlert: {
    marginBottom: "18px",

    padding:
      "13px 15px",

    border:
      "1px solid #bbf7d0",

    borderRadius: "8px",

    backgroundColor:
      "#f0fdf4",

    color: "#15803d",

    fontSize: "13px",
  },

  /* =======================================================
     SUMMARY
     ======================================================= */

  cardsGrid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(5, minmax(0, 1fr))",

    gap: "16px",

    marginBottom: "30px",
  },

  summaryCard: {
    minHeight: "145px",

    padding:
      "25px 22px",

    boxSizing: "border-box",

    border:
      "1px solid #d8e3ee",

    borderRadius: "13px",

    backgroundColor:
      "#ffffff",
  },

  summaryTitle: {
    fontSize: "14px",
    fontWeight: 800,
    color: "#586f88",
  },

  summaryValue: {
    marginTop: "15px",

    fontSize: "34px",
    lineHeight: 1,

    fontWeight: 900,

    color: "#102d47",
  },

  summarySubtitle: {
    marginTop: "12px",

    fontSize: "12px",

    color: "#8ca0b6",
  },

  /* =======================================================
     MANAGE REQUESTS
     ======================================================= */

  manageCard: {
    minHeight: "108px",

    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",

    gap: "20px",

    padding:
      "24px 28px",

    boxSizing: "border-box",

    border:
      "1px solid #d8e3ee",

    borderRadius: "13px",

    backgroundColor:
      "#ffffff",
  },

  manageTitle: {
    margin: 0,

    fontSize: "20px",
    fontWeight: 900,

    color: "#102d47",
  },

  manageSubtitle: {
    margin: "8px 0 0",

    fontSize: "13px",

    color: "#7d91a7",

    lineHeight: 1.5,
  },

  viewRequestsButton: {
    minWidth: "205px",
    minHeight: "48px",

    padding:
      "0 20px",

    border:
      "1.5px solid #1677e8",

    borderRadius: "8px",

    backgroundColor:
      "#ffffff",

    color: "#1677e8",

    fontSize: "14px",
    fontWeight: 800,

    cursor: "pointer",
  },

  /* =======================================================
     MODAL
     ======================================================= */

  overlay: {
    position: "fixed",

    inset: 0,

    zIndex: 1000,

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    padding: "28px",

    boxSizing: "border-box",

    backgroundColor:
      "rgba(12, 37, 57, 0.62)",
  },

  modal: {
    width: "850px",
    maxWidth: "100%",

    maxHeight: "92vh",

    display: "flex",
    flexDirection: "column",

    overflow: "hidden",

    borderRadius: "14px",

    backgroundColor:
      "#ffffff",

    boxShadow:
      "0 24px 70px rgba(0,0,0,0.24)",
  },

  modalHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",

    gap: "20px",

    padding:
      "22px 26px",

    borderBottom:
      "1px solid #e1e8f0",
  },

  modalTitle: {
    margin: 0,

    fontSize: "22px",
    fontWeight: 900,

    color: "#102d47",
  },

  modalSubtitle: {
    margin: "6px 0 0",

    fontSize: "13px",

    color: "#8093a8",
  },

  closeButton: {
    width: "38px",
    height: "38px",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    border: "none",
    borderRadius: "8px",

    backgroundColor:
      "#f0f4f8",

    color: "#40576d",

    fontSize: "22px",

    cursor: "pointer",
  },

  modalBody: {
    maxHeight:
      "calc(92vh - 160px)",

    overflowY: "auto",

    padding:
      "22px 26px",
  },

  modalFooter: {
    display: "flex",
    justifyContent:
      "flex-end",

    gap: "12px",

    padding:
      "17px 26px",

    borderTop:
      "1px solid #e1e8f0",

    backgroundColor:
      "#ffffff",
  },

  /* =======================================================
     FORM
     ======================================================= */

  formSection: {
    marginBottom: "28px",
  },

  formSectionTitle: {
    margin: 0,

    fontSize: "17px",
    fontWeight: 900,

    color: "#102d47",
  },

  formSectionSubtitle: {
    margin:
      "6px 0 18px",

    fontSize: "12px",

    color: "#8093a8",
  },

  formGrid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",

    gap: "18px",
  },

  fullField: {
    marginTop: "18px",
  },

  field: {
    display: "flex",
    flexDirection: "column",

    gap: "7px",
  },

  label: {
    fontSize: "12px",
    fontWeight: 800,

    color: "#526b84",
  },

  required: {
    marginLeft: "3px",

    color: "#dc2626",
  },

  input: {
    width: "100%",
    height: "44px",

    padding:
      "0 13px",

    boxSizing: "border-box",

    border:
      "1px solid #cfdbe7",

    borderRadius: "8px",

    backgroundColor:
      "#ffffff",

    color: "#18364f",

    fontSize: "13px",

    outline: "none",
  },

  textarea: {
    width: "100%",

    padding:
      "12px 13px",

    boxSizing: "border-box",

    resize: "vertical",

    border:
      "1px solid #cfdbe7",

    borderRadius: "8px",

    backgroundColor:
      "#ffffff",

    color: "#18364f",

    fontFamily:
      "Arial, Helvetica, sans-serif",

    fontSize: "13px",

    lineHeight: 1.5,

    outline: "none",
  },

  moneyInputWrapper: {
    position: "relative",
  },

  moneyPrefix: {
    position: "absolute",

    left: "13px",
    top: "50%",

    transform:
      "translateY(-50%)",

    zIndex: 2,

    color: "#64748b",

    fontSize: "14px",
  },

  cancelButton: {
    minWidth: "100px",
    minHeight: "43px",

    padding:
      "0 18px",

    border:
      "1px solid #ccd8e4",

    borderRadius: "8px",

    backgroundColor:
      "#ffffff",

    color: "#38516a",

    fontSize: "13px",
    fontWeight: 800,

    cursor: "pointer",
  },

  submitButton: {
    minWidth: "155px",
    minHeight: "43px",

    padding:
      "0 20px",

    border: "none",

    borderRadius: "8px",

    backgroundColor:
      "#1677e8",

    color: "#ffffff",

    fontSize: "13px",
    fontWeight: 800,

    cursor: "pointer",
  },

  disabledButton: {
    opacity: 0.65,

    cursor: "not-allowed",
  },
};