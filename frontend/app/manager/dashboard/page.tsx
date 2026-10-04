"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type View =
  | "DASHBOARD"
  | "TEAM"
  | "REQUESTS"
  | "TEAM_ASSETS"
  | "NOTIFICATIONS"
  | "PROFILE";

type RequestFilter =
  | "ALL"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

type RequestStatus =
  | "PENDING_MANAGER_APPROVAL"
  | "MANAGER_APPROVED"
  | "MANAGER_REJECTED"
  | "PENDING_ASSIGNMENT"
  | "PENDING_PROCUREMENT"
  | "FULFILLED"
  | "CANCELLED";

type AssetStatus =
  | "IN_STOCK"
  | "ASSIGNED"
  | "IN_REPAIR"
  | "RETIRED";

type AssignmentType =
  | "PRIMARY"
  | "SECONDARY";

type TeamAsset = {
  id: string;
  assetTag: string;
  name: string;
  category: string;

  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;

  status: AssetStatus;

  assignmentType?: AssignmentType | null;

  assignedOn?: string | null;

  employeeId?: string | null;
  employeeName?: string | null;
  employeeCode?: string | null;

  repairReason?: string | null;
  repairReportedOn?: string | null;
  sentForRepairOn?: string | null;
  expectedReturnDate?: string | null;
  serviceProvider?: string | null;
  repairRemarks?: string | null;
};

type TeamMember = {
  id: string;
  name: string;
  employeeCode: string;

  department?: string | null;
  designation?: string | null;
  email?: string | null;
  phone?: string | null;
  joiningDate?: string | null;

  active?: boolean;

  assets: TeamAsset[];

  pendingRequests?: number;
};

type SecondaryDeviceRequest = {
  id: string;

  employeeId: string;
  employeeName: string;
  employeeCode?: string | null;
  department?: string | null;

  managerId?: string | null;
  managerName?: string | null;

  category: string;
  reason: string;

  status: RequestStatus;

  requestedAt: string;

  reviewedAt?: string | null;
  reviewedBy?: string | null;
  managerComment?: string | null;

  currentAssets?: TeamAsset[];

  assignedAssetId?: string | null;
  assignedAssetTag?: string | null;
  assignedAssetName?: string | null;
};

type ManagerDashboardResponse = {
  managerName?: string;

  teamMembers?: number;
  totalAssetsAssigned?: number;
  inUse?: number;
  inRepair?: number;

  pendingRequests?: number;
  approvedRequests?: number;
  rejectedRequests?: number;
};

const C = {
  navy: "#10263d",
  navyLight: "#1b4c73",

  blue: "#1677ff",
  blueSoft: "#eaf3ff",

  border: "#dce6f2",

  text: "#142033",
  muted: "#667085",

  green: "#12a66a",
  greenSoft: "#e8f8f1",

  red: "#e5484d",
  redSoft: "#fff0f0",

  orange: "#e99112",
  orangeSoft: "#fff6df",

  purple: "#6f49d8",
  purpleSoft: "#f2edff",

  bg: "#f7faff",
};

/* =========================================================
   HELPERS
   ========================================================= */

function fmt(value?: string | null) {
  if (!value) {
    return "-";
  }

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function initials(name?: string | null) {
  return (
    name?.trim().charAt(0).toUpperCase() ||
    "M"
  );
}

function requestLabel(
  status: RequestStatus
) {
  const labels: Record<
    RequestStatus,
    string
  > = {
    PENDING_MANAGER_APPROVAL:
      "Pending Manager Approval",

    MANAGER_APPROVED:
      "Manager Approved",

    MANAGER_REJECTED:
      "Rejected",

    PENDING_ASSIGNMENT:
      "Pending Assignment",

    PENDING_PROCUREMENT:
      "Pending Procurement",

    FULFILLED:
      "Fulfilled",

    CANCELLED:
      "Cancelled",
  };

  return labels[status];
}

/* =========================================================
   ASSET CATEGORY IMAGE / ICON
   ========================================================= */

function assetIcon(
  asset: Pick<
    TeamAsset,
    "category" | "name"
  >
) {
  const value =
    `${asset.category || ""} ${asset.name || ""}`.toLowerCase();

  if (
    value.includes("laptop") ||
    value.includes("macbook") ||
    value.includes("thinkpad")
  ) {
    return "💻";
  }

  if (
    value.includes("monitor") ||
    value.includes("display")
  ) {
    return "🖥️";
  }

  if (
    value.includes("desktop") ||
    value.includes("optiplex") ||
    value.includes("computer")
  ) {
    return "🖥️";
  }

  if (value.includes("keyboard")) {
    return "⌨️";
  }

  if (value.includes("mouse")) {
    return "🖱️";
  }

  if (
    value.includes("mobile") ||
    value.includes("phone") ||
    value.includes("iphone")
  ) {
    return "📱";
  }

  if (
    value.includes("tablet") ||
    value.includes("ipad")
  ) {
    return "📱";
  }

  if (
    value.includes("headset") ||
    value.includes("headphone")
  ) {
    return "🎧";
  }

  if (value.includes("printer")) {
    return "🖨️";
  }

  if (
    value.includes("camera") ||
    value.includes("webcam")
  ) {
    return "📷";
  }

  if (value.includes("dock")) {
    return "🔌";
  }

  return "🧰";
}

function AssetImage({
  asset,
  compact = false,
}: {
  asset: Pick<
    TeamAsset,
    "category" | "name" | "assetTag"
  >;

  compact?: boolean;
}) {
  return (
    <div
      title={`${asset.category} - ${asset.assetTag}`}
      style={{
        ...s.assetImage,

        ...(compact
          ? s.assetImageCompact
          : {}),
      }}
    >
      <span
        style={{
          ...s.assetImageIcon,

          ...(compact
            ? s.assetImageIconCompact
            : {}),
        }}
      >
        {assetIcon(asset)}
      </span>
    </div>
  );
}

/* =========================================================
   BADGES
   ========================================================= */

function RequestBadge({
  status,
}: {
  status: RequestStatus;
}) {
  let background =
    C.greenSoft;

  let color =
    C.green;

  if (
    status ===
    "PENDING_MANAGER_APPROVAL"
  ) {
    background =
      C.orangeSoft;

    color =
      "#9a6500";
  }

  if (
    status ===
      "MANAGER_REJECTED" ||
    status ===
      "CANCELLED"
  ) {
    background =
      C.redSoft;

    color =
      C.red;
  }

  if (
    status ===
    "PENDING_PROCUREMENT"
  ) {
    background =
      C.purpleSoft;

    color =
      C.purple;
  }

  return (
    <span
      style={{
        ...s.badge,
        background,
        color,
      }}
    >
      {requestLabel(status)}
    </span>
  );
}

function AssetBadge({
  status,
}: {
  status: AssetStatus;
}) {
  let background =
    C.greenSoft;

  let color =
    C.green;

  let label =
    status.replaceAll(
      "_",
      " "
    );

  if (
    status ===
    "ASSIGNED"
  ) {
    label = "Assigned";
  }

  if (
    status ===
    "IN_STOCK"
  ) {
    label = "In Stock";
  }

  if (
    status ===
    "IN_REPAIR"
  ) {
    label = "In Repair";

    background =
      C.redSoft;

    color =
      C.red;
  }

  if (
    status ===
    "RETIRED"
  ) {
    label = "Retired";

    background =
      "#f2f4f7";

    color =
      "#475467";
  }

  return (
    <span
      style={{
        ...s.badge,
        background,
        color,
      }}
    >
      {label}
    </span>
  );
}

/* =========================================================
   MAIN PAGE
   ========================================================= */

export default function ManagerDashboardPage() {
  const router =
    useRouter();

  const [
    view,
    setView,
  ] =
    useState<View>(
      "DASHBOARD"
    );

  const [
    managerName,
    setManagerName,
  ] =
    useState(
      "Manager"
    );

  const [
    managerEmail,
    setManagerEmail,
  ] =
    useState("");

  const [
    summary,
    setSummary,
  ] =
    useState<ManagerDashboardResponse>(
      {}
    );

  const [
    team,
    setTeam,
  ] =
    useState<TeamMember[]>(
      []
    );

  const [
    requests,
    setRequests,
  ] =
    useState<
      SecondaryDeviceRequest[]
    >([]);

  const [
    selectedMember,
    setSelectedMember,
  ] =
    useState<
      TeamMember | null
    >(null);

  const [
    selectedRequest,
    setSelectedRequest,
  ] =
    useState<
      SecondaryDeviceRequest | null
    >(null);

  const [
    requestFilter,
    setRequestFilter,
  ] =
    useState<RequestFilter>(
      "ALL"
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    department,
    setDepartment,
  ] =
    useState("ALL");

  const [
    assetStatus,
    setAssetStatus,
  ] =
    useState("ALL");

  const [
    managerComment,
    setManagerComment,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    working,
    setWorking,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  /* =======================================================
     AUTHENTICATION
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

    const email =
      localStorage.getItem(
        "email"
      );

    if (!token) {
      router.replace(
        "/manager/login"
      );

      return;
    }

    if (
      role !==
      "MANAGER"
    ) {
      router.replace(
        role ===
          "ASSET_ADMIN"
          ? "/admin/dashboard"
          : "/employee/dashboard"
      );

      return;
    }

    if (name) {
      setManagerName(
        name
      );
    }

    if (email) {
      setManagerEmail(
        email
      );
    }

    void loadAll();
  }, [router]);

  /* =======================================================
     LOAD DATA
     ======================================================= */

  async function loadAll() {
    setLoading(true);

    setError("");

    try {
      const [
        dashboardData,
        teamData,
        requestData,
      ] =
        await Promise.all([
          api(
            "/api/v1/manager/dashboard"
          ),

          api(
            "/api/v1/manager/team"
          ),

          api(
            "/api/v1/manager/secondary-device-requests"
          ),
        ]);

      setSummary(
        (dashboardData ||
          {}) as ManagerDashboardResponse
      );

      setTeam(
        Array.isArray(
          teamData
        )
          ? (teamData as TeamMember[])
          : []
      );

      setRequests(
        Array.isArray(
          requestData
        )
          ? (requestData as SecondaryDeviceRequest[])
          : []
      );

      const dashboard =
        dashboardData as
          | ManagerDashboardResponse
          | null;

      if (
        dashboard?.managerName
      ) {
        setManagerName(
          dashboard.managerName
        );
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to load manager dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     REQUEST DETAILS
     ======================================================= */

  async function reviewRequest(
    request:
      SecondaryDeviceRequest
  ) {
    setError("");

    setSuccess("");

    try {
      const details =
        (await api(
          `/api/v1/manager/secondary-device-requests/${request.id}`
        )) as SecondaryDeviceRequest;

      setSelectedRequest(
        details ||
          request
      );

      setManagerComment(
        details?.managerComment ||
          ""
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to load request details."
      );
    }
  }

  /* =======================================================
     APPROVE / REJECT
     ======================================================= */

  async function decideRequest(
    action:
      | "approve"
      | "reject"
  ) {
    if (
      !selectedRequest
    ) {
      return;
    }

    if (
      !managerComment
        .trim()
    ) {
      setError(
        "Manager comments are required."
      );

      return;
    }

    setWorking(true);

    setError("");

    setSuccess("");

    try {
      await api(
        `/api/v1/manager/secondary-device-requests/${selectedRequest.id}/${action}`,
        {
          method:
            "POST",

          body:
            JSON.stringify(
              {
                comment:
                  managerComment
                    .trim(),
              }
            ),
        }
      );

      setSuccess(
        action ===
          "approve"
          ? "Secondary device request approved successfully."
          : "Secondary device request rejected."
      );

      setSelectedRequest(
        null
      );

      setManagerComment(
        ""
      );

      await loadAll();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : `Unable to ${action} request.`
      );
    } finally {
      setWorking(false);
    }
  }

  /* =======================================================
     LOGOUT
     ======================================================= */

  function logout() {
    [
      "token",
      "role",
      "name",
      "email",
    ].forEach(
      (
        key
      ) =>
        localStorage.removeItem(
          key
        )
    );

    router.replace("/");
  }

  /* =======================================================
     DEPARTMENTS
     ======================================================= */

  const departments =
    useMemo(() => {
      return Array.from(
        new Set(
          team
            .map(
              (
                member
              ) =>
                member.department
            )
            .filter(
              Boolean
            ) as string[]
        )
      ).sort();
    }, [team]);

  /* =======================================================
     FILTER TEAM
     ======================================================= */

  const filteredTeam =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return team.filter(
        (
          member
        ) => {
          const assets =
            member.assets ||
            [];

          const text =
            [
              member.name,
              member.employeeCode,
              member.department,
              member.email,

              ...assets.flatMap(
                (
                  asset
                ) => [
                  asset.name,
                  asset.assetTag,
                  asset.category,
                ]
              ),
            ]
              .filter(
                Boolean
              )
              .join(" ")
              .toLowerCase();

          const matchesSearch =
            !query ||
            text.includes(
              query
            );

          const matchesDepartment =
            department ===
              "ALL" ||
            member.department ===
              department;

          const matchesStatus =
            assetStatus ===
              "ALL" ||
            assets.some(
              (
                asset
              ) =>
                asset.status ===
                assetStatus
            );

          return (
            matchesSearch &&
            matchesDepartment &&
            matchesStatus
          );
        }
      );
    }, [
      team,
      search,
      department,
      assetStatus,
    ]);

  /* =======================================================
     FILTER REQUESTS
     ======================================================= */

  const filteredRequests =
    useMemo(() => {
      return requests.filter(
        (
          request
        ) => {
          if (
            requestFilter ===
            "ALL"
          ) {
            return true;
          }

          if (
            requestFilter ===
            "PENDING"
          ) {
            return (
              request.status ===
              "PENDING_MANAGER_APPROVAL"
            );
          }

          if (
            requestFilter ===
            "APPROVED"
          ) {
            return [
              "MANAGER_APPROVED",
              "PENDING_ASSIGNMENT",
              "PENDING_PROCUREMENT",
              "FULFILLED",
            ].includes(
              request.status
            );
          }

          return (
            request.status ===
            "MANAGER_REJECTED"
          );
        }
      );
    }, [
      requests,
      requestFilter,
    ]);

  const pendingRequests =
    requests.filter(
      (
        request
      ) =>
        request.status ===
        "PENDING_MANAGER_APPROVAL"
    );

  /* =======================================================
     TEAM ASSETS
     ======================================================= */

  const allTeamAssets =
    team.flatMap(
      (
        member
      ) =>
        (
          member.assets ||
          []
        ).map(
          (
            asset
          ) => ({
            ...asset,

            employeeId:
              member.id,

            employeeName:
              member.name,

            employeeCode:
              member.employeeCode,
          })
        )
    );

  const repairAssets =
    allTeamAssets.filter(
      (
        asset
      ) =>
        asset.status ===
        "IN_REPAIR"
    );

  const notificationCount =
    pendingRequests.length +
    repairAssets.length;

  /* =======================================================
     COUNTS
     ======================================================= */

  const counts = {
    teamMembers:
      summary.teamMembers ??
      team.length,

    totalAssets:
      summary
        .totalAssetsAssigned ??
      allTeamAssets.length,

    inRepair:
      summary.inRepair ??
      repairAssets.length,

    pending:
      summary
        .pendingRequests ??
      pendingRequests.length,

    approved:
      summary
        .approvedRequests ??
      requests.filter(
        (
          request
        ) =>
          [
            "MANAGER_APPROVED",
            "PENDING_ASSIGNMENT",
            "PENDING_PROCUREMENT",
            "FULFILLED",
          ].includes(
            request.status
          )
      ).length,

    rejected:
      summary
        .rejectedRequests ??
      requests.filter(
        (
          request
        ) =>
          request.status ===
          "MANAGER_REJECTED"
      ).length,
  };

  /* =======================================================
     PAGE
     ======================================================= */

  return (
    <div
      style={
        s.page
      }
    >
      {/* SIDEBAR */}

      <aside
        style={
          s.sidebar
        }
      >
        <div
          style={
            s.brandRow
          }
        >
          <div
            style={
              s.brandMark
            }
          >
            C
          </div>

          <div>
            <div
              style={
                s.brandTitle
              }
            >
              ENFEC ONE
            </div>

            <div
              style={
                s.brandSub
              }
            >
              Asset Management
            </div>
          </div>
        </div>

        <nav
          style={
            s.nav
          }
        >
          <Nav
            icon="⌂"
            label="Dashboard"
            active={
              view ===
              "DASHBOARD"
            }
            onClick={() =>
              setView(
                "DASHBOARD"
              )
            }
          />

          <Nav
            icon="♙"
            label="My Team"
            active={
              view ===
              "TEAM"
            }
            onClick={() =>
              setView(
                "TEAM"
              )
            }
          />

          <Nav
            icon="▣"
            label="Asset Requests"
            active={
              view ===
              "REQUESTS"
            }
            badge={
              pendingRequests
                .length ||
              undefined
            }
            onClick={() =>
              setView(
                "REQUESTS"
              )
            }
          />

          <Nav
            icon="▤"
            label="Team Assets"
            active={
              view ===
              "TEAM_ASSETS"
            }
            onClick={() =>
              setView(
                "TEAM_ASSETS"
              )
            }
          />

          <Nav
            icon="♧"
            label="Notifications"
            active={
              view ===
              "NOTIFICATIONS"
            }
            badge={
              notificationCount ||
              undefined
            }
            onClick={() =>
              setView(
                "NOTIFICATIONS"
              )
            }
          />

          <Nav
            icon="♙"
            label="Profile"
            active={
              view ===
              "PROFILE"
            }
            onClick={() =>
              setView(
                "PROFILE"
              )
            }
          />

          <Nav
            icon="↪"
            label="Logout"
            active={false}
            onClick={
              logout
            }
          />
        </nav>
      </aside>

      {/* CONTENT */}

      <div
        style={
          s.contentWrap
        }
      >
        <header
          style={
            s.topbar
          }
        >
          <div />

          <div
            style={
              s.userBlock
            }
          >
            <div
              style={
                s.avatar
              }
            >
              {initials(
                managerName
              )}
            </div>

            <div>
              <div
                style={
                  s.userName
                }
              >
                {managerName}
              </div>

              <div
                style={
                  s.userRole
                }
              >
                Manager
              </div>
            </div>
          </div>
        </header>

        <main
          style={
            s.main
          }
        >
          {error && (
            <div
              style={
                s.error
              }
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={
                s.success
              }
            >
              {success}
            </div>
          )}

          {loading ? (
            <div
              style={
                s.loading
              }
            >
              Loading manager
              data...
            </div>
          ) : (
            <>
              {view ===
                "DASHBOARD" && (
                <Dashboard
                  counts={
                    counts
                  }
                  pending={
                    pendingRequests
                  }
                  repairs={
                    repairAssets
                  }
                  onReview={
                    reviewRequest
                  }
                  onTeam={() =>
                    setView(
                      "TEAM"
                    )
                  }
                  onRequests={() =>
                    setView(
                      "REQUESTS"
                    )
                  }
                />
              )}

              {view ===
                "TEAM" && (
                <Team
                  team={
                    filteredTeam
                  }
                  departments={
                    departments
                  }
                  search={
                    search
                  }
                  setSearch={
                    setSearch
                  }
                  department={
                    department
                  }
                  setDepartment={
                    setDepartment
                  }
                  assetStatus={
                    assetStatus
                  }
                  setAssetStatus={
                    setAssetStatus
                  }
                  selected={
                    selectedMember
                  }
                  setSelected={
                    setSelectedMember
                  }
                />
              )}

              {view ===
                "REQUESTS" && (
                <Requests
                  requests={
                    filteredRequests
                  }
                  filter={
                    requestFilter
                  }
                  setFilter={
                    setRequestFilter
                  }
                  onReview={
                    reviewRequest
                  }
                />
              )}

              {view ===
                "TEAM_ASSETS" && (
                <TeamAssets
                  assets={
                    allTeamAssets
                  }
                />
              )}

              {view ===
                "NOTIFICATIONS" && (
                <Notifications
                  pending={
                    pendingRequests
                  }
                  repairs={
                    repairAssets
                  }
                  requests={
                    requests
                  }
                  onReview={
                    reviewRequest
                  }
                  onAssets={() =>
                    setView(
                      "TEAM_ASSETS"
                    )
                  }
                />
              )}

              {view ===
                "PROFILE" && (
                <Profile
                  name={
                    managerName
                  }
                  email={
                    managerEmail
                  }
                  counts={
                    counts
                  }
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* REQUEST MODAL */}

      {selectedRequest && (
        <RequestModal
          request={
            selectedRequest
          }
          comment={
            managerComment
          }
          setComment={
            setManagerComment
          }
          working={
            working
          }
          onClose={() => {
            setSelectedRequest(
              null
            );

            setManagerComment(
              ""
            );
          }}
          onApprove={() =>
            void decideRequest(
              "approve"
            )
          }
          onReject={() =>
            void decideRequest(
              "reject"
            )
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function Nav({
  icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      style={{
        ...s.navButton,

        ...(active
          ? s.navButtonActive
          : {}),
      }}
    >
      <span
        style={
          s.navLeft
        }
      >
        <span
          style={
            s.navIcon
          }
        >
          {icon}
        </span>

        {label}
      </span>

      {badge ? (
        <span
          style={
            s.navBadge
          }
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

/* =========================================================
   STAT CARD
   ========================================================= */

function Stat({
  title,
  value,
  icon,
  tone = "blue",
}: {
  title: string;
  value: number;
  icon: string;

  tone?:
    | "blue"
    | "green"
    | "red"
    | "orange";
}) {
  const map = {
    blue: [
      C.blueSoft,
      C.blue,
    ],

    green: [
      C.greenSoft,
      C.green,
    ],

    red: [
      C.redSoft,
      C.red,
    ],

    orange: [
      C.orangeSoft,
      C.orange,
    ],
  };

  const [
    background,
    color,
  ] =
    map[tone];

  return (
    <div
      style={
        s.stat
      }
    >
      <div
        style={{
          ...s.statIcon,
          background,
          color,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={
            s.statValue
          }
        >
          {value}
        </div>

        <div
          style={
            s.statTitle
          }
        >
          {title}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE HEADER
   ========================================================= */

function Header({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div
      style={
        s.pageHeader
      }
    >
      <div>
        <h1
          style={
            s.h1
          }
        >
          {title}
        </h1>

        <p
          style={
            s.subtitle
          }
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard({
  counts,
  pending,
  repairs,
  onReview,
  onTeam,
  onRequests,
}: {
  counts: any;

  pending:
    SecondaryDeviceRequest[];

  repairs:
    TeamAsset[];

  onReview:
    (
      request:
        SecondaryDeviceRequest
    ) => void;

  onTeam:
    () => void;

  onRequests:
    () => void;
}) {
  return (
    <>
      <Header
        title="Manager Dashboard"
        subtitle="Overview of your team, assigned assets and secondary device requests."
      />

      <div
        style={
          s.statsGrid
        }
      >
        <Stat
          title="Team Members"
          value={
            counts.teamMembers
          }
          icon="♙"
        />

        <Stat
          title="Assets Assigned"
          value={
            counts.totalAssets
          }
          icon="▤"
          tone="green"
        />

        <Stat
          title="In Repair"
          value={
            counts.inRepair
          }
          icon="⚒"
          tone="red"
        />

        <Stat
          title="Pending Requests"
          value={
            counts.pending
          }
          icon="▣"
          tone="orange"
        />
      </div>

      <div
        style={
          s.twoCol
        }
      >
        <section
          style={
            s.panel
          }
        >
          <div
            style={
              s.panelHeader
            }
          >
            <div>
              <h2
                style={
                  s.h2
                }
              >
                Pending Asset
                Requests
              </h2>

              <div
                style={
                  s.muted
                }
              >
                Requests waiting
                for your approval.
              </div>
            </div>

            <button
              style={
                s.linkButton
              }
              onClick={
                onRequests
              }
            >
              View all
            </button>
          </div>

          {pending.length ===
          0 ? (
            <Empty
              text="No pending requests."
            />
          ) : (
            pending
              .slice(
                0,
                5
              )
              .map(
                (
                  request
                ) => (
                  <div
                    key={
                      request.id
                    }
                    style={
                      s.listRow
                    }
                  >
                    <div>
                      <strong>
                        {
                          request.employeeName
                        }
                      </strong>

                      <div
                        style={
                          s.smallMuted
                        }
                      >
                        {request.employeeCode ||
                          "-"}{" "}
                        ·{" "}
                        {
                          request.category
                        }
                      </div>

                      <div
                        style={
                          s.smallMuted
                        }
                      >
                        {
                          request.reason
                        }
                      </div>
                    </div>

                    <button
                      style={
                        s.primarySmall
                      }
                      onClick={() =>
                        onReview(
                          request
                        )
                      }
                    >
                      Review
                    </button>
                  </div>
                )
              )
          )}
        </section>

        <section
          style={
            s.panel
          }
        >
          <div
            style={
              s.panelHeader
            }
          >
            <div>
              <h2
                style={
                  s.h2
                }
              >
                Assets in Repair
              </h2>

              <div
                style={
                  s.muted
                }
              >
                Current repair
                status for your
                team.
              </div>
            </div>

            <button
              style={
                s.linkButton
              }
              onClick={
                onTeam
              }
            >
              My Team
            </button>
          </div>

          {repairs.length ===
          0 ? (
            <Empty
              text="No team assets currently in repair."
            />
          ) : (
            repairs
              .slice(
                0,
                5
              )
              .map(
                (
                  asset
                ) => (
                  <div
                    key={`${asset.employeeId}-${asset.id}`}
                    style={
                      s.listRow
                    }
                  >
                    <div
                      style={
                        s.assetRow
                      }
                    >
                      <AssetImage
                        asset={
                          asset
                        }
                        compact
                      />

                      <div>
                        <strong>
                          {
                            asset.name
                          }
                        </strong>

                        <div
                          style={
                            s.smallMuted
                          }
                        >
                          {
                            asset.assetTag
                          }{" "}
                          ·{" "}
                          {
                            asset.employeeName
                          }
                        </div>

                        <div
                          style={
                            s.repairText
                          }
                        >
                          {asset.repairReason ||
                            "Reason not available"}
                        </div>
                      </div>
                    </div>

                    <AssetBadge
                      status={
                        asset.status
                      }
                    />
                  </div>
                )
              )
          )}
        </section>
      </div>
    </>
  );
}

/* =========================================================
   MY TEAM
   ========================================================= */

function Team({
  team,
  departments,
  search,
  setSearch,
  department,
  setDepartment,
  assetStatus,
  setAssetStatus,
  selected,
  setSelected,
}: {
  team:
    TeamMember[];

  departments:
    string[];

  search:
    string;

  setSearch:
    (
      value: string
    ) => void;

  department:
    string;

  setDepartment:
    (
      value: string
    ) => void;

  assetStatus:
    string;

  setAssetStatus:
    (
      value: string
    ) => void;

  selected:
    TeamMember | null;

  setSelected:
    (
      value:
        TeamMember | null
    ) => void;
}) {
  return (
    <>
      <Header
        title="My Team"
        subtitle="View employees reporting to you and the assets currently assigned to them."
      />

      <div
        style={
          s.filters
        }
      >
        <input
          style={
            s.input
          }
          value={
            search
          }
          onChange={
            (
              event
            ) =>
              setSearch(
                event.target
                  .value
              )
          }
          placeholder="Search employee, asset, tag or category..."
        />

        <select
          style={
            s.select
          }
          value={
            department
          }
          onChange={
            (
              event
            ) =>
              setDepartment(
                event.target
                  .value
              )
          }
        >
          <option
            value="ALL"
          >
            All Departments
          </option>

          {departments.map(
            (
              value
            ) => (
              <option
                key={
                  value
                }
              >
                {value}
              </option>
            )
          )}
        </select>

        <select
          style={
            s.select
          }
          value={
            assetStatus
          }
          onChange={
            (
              event
            ) =>
              setAssetStatus(
                event.target
                  .value
              )
          }
        >
          <option
            value="ALL"
          >
            All Asset Status
          </option>

          <option
            value="ASSIGNED"
          >
            Assigned
          </option>

          <option
            value="IN_REPAIR"
          >
            In Repair
          </option>

          <option
            value="IN_STOCK"
          >
            In Stock
          </option>

          <option
            value="RETIRED"
          >
            Retired
          </option>
        </select>
      </div>

      <div
        style={
          s.teamLayout
        }
      >
        <section
          style={
            s.panel
          }
        >
          <div
            style={
              s.tableWrap
            }
          >
            <table
              style={
                s.table
              }
            >
              <thead>
                <tr>
                  {[
                    "Employee",
                    "Employee ID",
                    "Department",
                    "Primary Device",
                    "Secondary Devices",
                    "Total Assets",
                    "Status",
                    "Action",
                  ].map(
                    (
                      heading
                    ) => (
                      <th
                        key={
                          heading
                        }
                        style={
                          s.th
                        }
                      >
                        {
                          heading
                        }
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {team.map(
                  (
                    member
                  ) => {
                    const assets =
                      member.assets ||
                      [];

                    const primary =
                      assets.find(
                        (
                          asset
                        ) =>
                          asset.assignmentType ===
                            "PRIMARY" ||
                          !asset.assignmentType
                      );

                    const secondary =
                      assets.filter(
                        (
                          asset
                        ) =>
                          asset.assignmentType ===
                          "SECONDARY"
                      );

                    const repair =
                      assets.some(
                        (
                          asset
                        ) =>
                          asset.status ===
                          "IN_REPAIR"
                      );

                    return (
                      <tr
                        key={
                          member.id
                        }
                      >
                        <td
                          style={
                            s.td
                          }
                        >
                          <strong>
                            {
                              member.name
                            }
                          </strong>

                          <div
                            style={
                              s.smallMuted
                            }
                          >
                            {member.email ||
                              "-"}
                          </div>
                        </td>

                        <td
                          style={
                            s.td
                          }
                        >
                          {
                            member.employeeCode
                          }
                        </td>

                        <td
                          style={
                            s.td
                          }
                        >
                          {member.department ||
                            "-"}
                        </td>

                        <td
                          style={
                            s.td
                          }
                        >
                          {primary ? (
                            <div
                              style={
                                s.assetRow
                              }
                            >
                              <AssetImage
                                asset={
                                  primary
                                }
                                compact
                              />

                              <span>
                                {
                                  primary.name
                                }

                                <br />

                                <span
                                  style={
                                    s.smallMuted
                                  }
                                >
                                  (
                                  {
                                    primary.assetTag
                                  }
                                  )
                                </span>
                              </span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td
                          style={
                            s.td
                          }
                        >
                          {secondary.length
                            ? secondary.map(
                                (
                                  asset
                                ) => (
                                  <div
                                    key={
                                      asset.id
                                    }
                                  >
                                    {
                                      asset.name
                                    }{" "}
                                    (
                                    {
                                      asset.assetTag
                                    }
                                    )
                                  </div>
                                )
                              )
                            : "-"}
                        </td>

                        <td
                          style={
                            s.td
                          }
                        >
                          {
                            assets.length
                          }
                        </td>

                        <td
                          style={
                            s.td
                          }
                        >
                          {repair ? (
                            <AssetBadge
                              status="IN_REPAIR"
                            />
                          ) : assets.length ? (
                            <AssetBadge
                              status="ASSIGNED"
                            />
                          ) : (
                            <span
                              style={
                                s.muted
                              }
                            >
                              No Assets
                            </span>
                          )}
                        </td>

                        <td
                          style={
                            s.td
                          }
                        >
                          <button
                            style={
                              s.secondarySmall
                            }
                            onClick={() =>
                              setSelected(
                                member
                              )
                            }
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          {team.length ===
            0 && (
            <Empty
              text="No team members found."
            />
          )}
        </section>

        {selected && (
          <MemberDrawer
            member={
              selected
            }
            onClose={() =>
              setSelected(
                null
              )
            }
          />
        )}
      </div>
    </>
  );
}

/* =========================================================
   MEMBER DETAILS DRAWER
   ========================================================= */

function MemberDrawer({
  member,
  onClose,
}: {
  member:
    TeamMember;

  onClose:
    () => void;
}) {
  const assets =
    member.assets ||
    [];

  const primary =
    assets.find(
      (
        asset
      ) =>
        asset.assignmentType ===
          "PRIMARY" ||
        !asset.assignmentType
    );

  const secondary =
    assets.filter(
      (
        asset
      ) =>
        asset.assignmentType ===
        "SECONDARY"
    );

  const repairs =
    assets.filter(
      (
        asset
      ) =>
        asset.status ===
        "IN_REPAIR"
    );

  return (
    <aside
      style={
        s.drawer
      }
    >
      <div
        style={
          s.drawerHeader
        }
      >
        <div>
          <div
            style={
              s.drawerName
            }
          >
            {member.name}
          </div>

          <div
            style={
              s.smallMuted
            }
          >
            {
              member.employeeCode
            }
          </div>
        </div>

        <button
          style={
            s.close
          }
          onClick={
            onClose
          }
        >
          ×
        </button>
      </div>

      <h3
        style={
          s.sectionTitle
        }
      >
        Overview
      </h3>

      <div
        style={
          s.infoGrid
        }
      >
        <Info
          label="Employee ID"
          value={
            member.employeeCode
          }
        />

        <Info
          label="Department"
          value={
            member.department
          }
        />

        <Info
          label="Designation"
          value={
            member.designation
          }
        />

        <Info
          label="Email"
          value={
            member.email
          }
        />

        <Info
          label="Phone"
          value={
            member.phone
          }
        />

        <Info
          label="Joining Date"
          value={
            fmt(
              member.joiningDate
            )
          }
        />
      </div>

      <h3
        style={
          s.sectionTitle
        }
      >
        Primary Device
      </h3>

      {primary ? (
        <AssetCard
          asset={
            primary
          }
        />
      ) : (
        <Empty
          text="No primary device assigned."
        />
      )}

      <h3
        style={
          s.sectionTitle
        }
      >
        Secondary Devices (
        {secondary.length})
      </h3>

      {secondary.length ? (
        secondary.map(
          (
            asset
          ) => (
            <AssetCard
              key={
                asset.id
              }
              asset={
                asset
              }
            />
          )
        )
      ) : (
        <Empty
          text="No secondary devices assigned."
        />
      )}

      <h3
        style={
          s.sectionTitle
        }
      >
        Current Repairs (
        {repairs.length})
      </h3>

      {repairs.length ? (
        repairs.map(
          (
            asset
          ) => (
            <RepairCard
              key={
                asset.id
              }
              asset={
                asset
              }
            />
          )
        )
      ) : (
        <Empty
          text="No assets currently in repair."
        />
      )}
    </aside>
  );
}

/* =========================================================
   ASSET CARD WITH IMAGE
   ========================================================= */

function AssetCard({
  asset,
}: {
  asset:
    TeamAsset;
}) {
  return (
    <div
      style={
        s.assetCard
      }
    >
      <div
        style={
          s.assetCardMain
        }
      >
        <AssetImage
          asset={
            asset
          }
        />

        <div>
          <strong>
            {asset.name}
          </strong>

          <div
            style={
              s.smallMuted
            }
          >
            Asset Tag:{" "}
            {
              asset.assetTag
            }
          </div>

          <div
            style={
              s.smallMuted
            }
          >
            Category:{" "}
            {
              asset.category
            }
          </div>

          {asset.brand && (
            <div
              style={
                s.smallMuted
              }
            >
              Brand / Model:{" "}
              {asset.brand}
              {asset.model
                ? ` ${asset.model}`
                : ""}
            </div>
          )}

          <div
            style={
              s.smallMuted
            }
          >
            Type:{" "}
            {asset.assignmentType ||
              "PRIMARY"}
          </div>

          <div
            style={
              s.smallMuted
            }
          >
            Assigned:{" "}
            {fmt(
              asset.assignedOn
            )}
          </div>
        </div>
      </div>

      <AssetBadge
        status={
          asset.status
        }
      />
    </div>
  );
}

/* =========================================================
   REPAIR CARD
   ========================================================= */

function RepairCard({
  asset,
}: {
  asset:
    TeamAsset;
}) {
  return (
    <div
      style={
        s.repairCard
      }
    >
      <div
        style={
          s.panelHeader
        }
      >
        <div
          style={
            s.assetRow
          }
        >
          <AssetImage
            asset={
              asset
            }
            compact
          />

          <div>
            <strong>
              {asset.name}
            </strong>

            <div
              style={
                s.smallMuted
              }
            >
              {
                asset.assetTag
              }{" "}
              ·{" "}
              {
                asset.category
              }
            </div>
          </div>
        </div>

        <AssetBadge
          status={
            asset.status
          }
        />
      </div>

      <div
        style={
          s.repairDetails
        }
      >
        <Info
          label="Reason"
          value={
            asset.repairReason ||
            "Reason not available"
          }
        />

        <Info
          label="Reported On"
          value={
            fmt(
              asset.repairReportedOn
            )
          }
        />

        <Info
          label="Sent For Repair"
          value={
            fmt(
              asset.sentForRepairOn
            )
          }
        />

        <Info
          label="Expected Return"
          value={
            fmt(
              asset.expectedReturnDate
            )
          }
        />

        <Info
          label="Service Provider"
          value={
            asset.serviceProvider
          }
        />

        <Info
          label="Remarks"
          value={
            asset.repairRemarks
          }
        />
      </div>
    </div>
  );
}

/* =========================================================
   ASSET REQUESTS
   ========================================================= */

function Requests({
  requests,
  filter,
  setFilter,
  onReview,
}: {
  requests:
    SecondaryDeviceRequest[];

  filter:
    RequestFilter;

  setFilter:
    (
      value:
        RequestFilter
    ) => void;

  onReview:
    (
      request:
        SecondaryDeviceRequest
    ) => void;
}) {
  return (
    <>
      <Header
        title="Asset Requests"
        subtitle="Review secondary device requests submitted by employees in your team."
      />

      <div
        style={
          s.tabs
        }
      >
        {[
          "ALL",
          "PENDING",
          "APPROVED",
          "REJECTED",
        ].map(
          (
            value
          ) => {
            const typed =
              value as RequestFilter;

            return (
              <button
                key={
                  value
                }
                style={{
                  ...s.tab,

                  ...(filter ===
                  typed
                    ? s.tabActive
                    : {}),
                }}
                onClick={() =>
                  setFilter(
                    typed
                  )
                }
              >
                {value
                  .charAt(
                    0
                  ) +
                  value
                    .slice(
                      1
                    )
                    .toLowerCase()}
              </button>
            );
          }
        )}
      </div>

      <section
        style={
          s.panel
        }
      >
        {requests.length ===
        0 ? (
          <Empty
            text="No asset requests found."
          />
        ) : (
          <div
            style={
              s.tableWrap
            }
          >
            <table
              style={
                s.table
              }
            >
              <thead>
                <tr>
                  {[
                    "Employee",
                    "Employee ID",
                    "Department",
                    "Requested Device",
                    "Reason",
                    "Requested On",
                    "Status",
                    "Action",
                  ].map(
                    (
                      heading
                    ) => (
                      <th
                        key={
                          heading
                        }
                        style={
                          s.th
                        }
                      >
                        {
                          heading
                        }
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {requests.map(
                  (
                    request
                  ) => (
                    <tr
                      key={
                        request.id
                      }
                    >
                      <td
                        style={
                          s.td
                        }
                      >
                        <strong>
                          {
                            request.employeeName
                          }
                        </strong>
                      </td>

                      <td
                        style={
                          s.td
                        }
                      >
                        {request.employeeCode ||
                          "-"}
                      </td>

                      <td
                        style={
                          s.td
                        }
                      >
                        {request.department ||
                          "-"}
                      </td>

                      <td
                        style={
                          s.td
                        }
                      >
                        {
                          request.category
                        }
                      </td>

                      <td
                        style={
                          s.td
                        }
                      >
                        {
                          request.reason
                        }
                      </td>

                      <td
                        style={
                          s.td
                        }
                      >
                        {fmt(
                          request.requestedAt
                        )}
                      </td>

                      <td
                        style={
                          s.td
                        }
                      >
                        <RequestBadge
                          status={
                            request.status
                          }
                        />
                      </td>

                      <td
                        style={
                          s.td
                        }
                      >
                        <button
                          style={
                            s.secondarySmall
                          }
                          onClick={() =>
                            onReview(
                              request
                            )
                          }
                        >
                          {request.status ===
                          "PENDING_MANAGER_APPROVAL"
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
    </>
  );
}

/* =========================================================
   TEAM ASSETS
   ========================================================= */

function TeamAssets({
  assets,
}: {
  assets:
    TeamAsset[];
}) {
  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    status,
    setStatus,
  ] =
    useState("ALL");

  const filtered =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return assets.filter(
        (
          asset
        ) => {
          const text =
            [
              asset.employeeName,
              asset.employeeCode,
              asset.name,
              asset.assetTag,
              asset.category,
            ]
              .filter(
                Boolean
              )
              .join(" ")
              .toLowerCase();

          const matchesSearch =
            !query ||
            text.includes(
              query
            );

          const matchesStatus =
            status ===
              "ALL" ||
            asset.status ===
              status;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      assets,
      search,
      status,
    ]);

  return (
    <>
      <Header
        title="My Team Assets"
        subtitle="Read-only view of all assets assigned to your team."
      />

      <div
        style={
          s.filters
        }
      >
        <input
          style={
            s.input
          }
          value={
            search
          }
          onChange={
            (
              event
            ) =>
              setSearch(
                event.target
                  .value
              )
          }
          placeholder="Search employee, asset, tag or category..."
        />

        <select
          style={
            s.select
          }
          value={
            status
          }
          onChange={
            (
              event
            ) =>
              setStatus(
                event.target
                  .value
              )
          }
        >
          <option
            value="ALL"
          >
            All Status
          </option>

          <option
            value="ASSIGNED"
          >
            Assigned
          </option>

          <option
            value="IN_REPAIR"
          >
            In Repair
          </option>

          <option
            value="IN_STOCK"
          >
            In Stock
          </option>

          <option
            value="RETIRED"
          >
            Retired
          </option>
        </select>
      </div>

      <section
        style={
          s.panel
        }
      >
        {filtered.length ===
        0 ? (
          <Empty
            text="No team assets found."
          />
        ) : (
          <div
            style={
              s.tableWrap
            }
          >
            <table
              style={
                s.table
              }
            >
              <thead>
                <tr>
                  {[
                    "Employee",
                    "Employee ID",
                    "Asset",
                    "Asset Tag",
                    "Category",
                    "Type",
                    "Status",
                    "Assigned On",
                    "Repair Reason",
                  ].map(
                    (
                      heading
                    ) => (
                      <th
                        key={
                          heading
                        }
                        style={
                          s.th
                        }
                      >
                        {
                          heading
                        }
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {filtered.map(
                  (
                    asset
                  ) => (
                    <tr
                      key={`${asset.employeeId}-${asset.id}`}
                    >
                      <td
                        style={
                          s.td
                        }
                      >
                        {asset.employeeName ||
                          "-"}
                      </td>

                      <td
                        style={
                          s.td
                        }
                      >
                        {asset.employeeCode ||
                          "-"}
                      </td>

                      <td
                        style={
                          s.td
                        }
                      >
                        <div
                          style={
                            s.assetRow
                          }
                        >
                          <AssetImage
                            asset={
                              asset
                            }
                            compact
                          />

                          <strong>
                            {
                              asset.name
                            }
                          </strong>
                        </div>
                      </td>

                      <td
                        style={
                          s.td
                        }
                      >
                        {
                          asset.assetTag
                        }
                      </td>

                      <td
                        style={
                          s.td
                        }
                      >
                        {
                          asset.category
                        }
                      </td>

                      <td
                        style={
                          s.td
                        }
                      >
                        {asset.assignmentType ||
                          "PRIMARY"}
                      </td>

                      <td
                        style={
                          s.td
                        }
                      >
                        <AssetBadge
                          status={
                            asset.status
                          }
                        />
                      </td>

                      <td
                        style={
                          s.td
                        }
                      >
                        {fmt(
                          asset.assignedOn
                        )}
                      </td>

                      <td
                        style={
                          s.td
                        }
                      >
                        {asset.status ===
                        "IN_REPAIR"
                          ? asset.repairReason ||
                            "Reason not available"
                          : "-"}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function Notifications({
  pending,
  repairs,
  requests,
  onReview,
  onAssets,
}: {
  pending:
    SecondaryDeviceRequest[];

  repairs:
    TeamAsset[];

  requests:
    SecondaryDeviceRequest[];

  onReview:
    (
      request:
        SecondaryDeviceRequest
    ) => void;

  onAssets:
    () => void;
}) {
  const recent =
    [
      ...requests,
    ]
      .filter(
        (
          request
        ) =>
          request.status !==
          "PENDING_MANAGER_APPROVAL"
      )
      .sort(
        (
          a,
          b
        ) =>
          new Date(
            b.reviewedAt ||
              b.requestedAt
          ).getTime() -
          new Date(
            a.reviewedAt ||
              a.requestedAt
          ).getTime()
      )
      .slice(
        0,
        5
      );

  return (
    <>
      <Header
        title="Notifications"
        subtitle="Items that need your attention and recent request updates."
      />

      <div
        style={
          s.twoCol
        }
      >
        <section
          style={
            s.panel
          }
        >
          <h2
            style={
              s.h2
            }
          >
            Pending Approvals (
            {pending.length})
          </h2>

          {pending.length ? (
            pending.map(
              (
                request
              ) => (
                <div
                  key={
                    request.id
                  }
                  style={
                    s.listRow
                  }
                >
                  <div>
                    <strong>
                      {
                        request.employeeName
                      }
                    </strong>

                    <div
                      style={
                        s.smallMuted
                      }
                    >
                      {
                        request.category
                      }{" "}
                      ·{" "}
                      {fmt(
                        request.requestedAt
                      )}
                    </div>
                  </div>

                  <button
                    style={
                      s.primarySmall
                    }
                    onClick={() =>
                      onReview(
                        request
                      )
                    }
                  >
                    Review
                  </button>
                </div>
              )
            )
          ) : (
            <Empty
              text="No pending approvals."
            />
          )}
        </section>

        <section
          style={
            s.panel
          }
        >
          <div
            style={
              s.panelHeader
            }
          >
            <h2
              style={
                s.h2
              }
            >
              Repair Alerts (
              {repairs.length})
            </h2>

            <button
              style={
                s.linkButton
              }
              onClick={
                onAssets
              }
            >
              Team Assets
            </button>
          </div>

          {repairs.length ? (
            repairs.map(
              (
                asset
              ) => (
                <div
                  key={`${asset.employeeId}-${asset.id}`}
                  style={
                    s.listRow
                  }
                >
                  <div
                    style={
                      s.assetRow
                    }
                  >
                    <AssetImage
                      asset={
                        asset
                      }
                      compact
                    />

                    <div>
                      <strong>
                        {
                          asset.name
                        }
                      </strong>

                      <div
                        style={
                          s.smallMuted
                        }
                      >
                        {
                          asset.employeeName
                        }{" "}
                        ·{" "}
                        {
                          asset.assetTag
                        }
                      </div>

                      <div
                        style={
                          s.repairText
                        }
                      >
                        {asset.repairReason ||
                          "Reason not available"}
                      </div>
                    </div>
                  </div>

                  <AssetBadge
                    status="IN_REPAIR"
                  />
                </div>
              )
            )
          ) : (
            <Empty
              text="No repair alerts."
            />
          )}
        </section>
      </div>

      <section
        style={{
          ...s.panel,
          marginTop:
            16,
        }}
      >
        <h2
          style={
            s.h2
          }
        >
          Recent Request
          Updates
        </h2>

        {recent.length ? (
          recent.map(
            (
              request
            ) => (
              <div
                key={
                  request.id
                }
                style={
                  s.listRow
                }
              >
                <div>
                  <strong>
                    {
                      request.employeeName
                    }{" "}
                    ·{" "}
                    {
                      request.category
                    }
                  </strong>

                  <div
                    style={
                      s.smallMuted
                    }
                  >
                    {fmt(
                      request.reviewedAt ||
                        request.requestedAt
                    )}
                  </div>
                </div>

                <RequestBadge
                  status={
                    request.status
                  }
                />
              </div>
            )
          )
        ) : (
          <Empty
            text="No recent updates."
          />
        )}
      </section>
    </>
  );
}

/* =========================================================
   PROFILE
   ========================================================= */

function Profile({
  name,
  email,
  counts,
}: {
  name:
    string;

  email:
    string;

  counts:
    any;
}) {
  return (
    <>
      <Header
        title="Profile"
        subtitle="Your manager account and current team access summary."
      />

      <section
        style={
          s.profileCard
        }
      >
        <div
          style={
            s.profileHero
          }
        >
          <div
            style={
              s.profileAvatar
            }
          >
            {initials(
              name
            )}
          </div>

          <div>
            <h2
              style={{
                margin: 0,
              }}
            >
              {name}
            </h2>

            <div
              style={
                s.muted
              }
            >
              {email ||
                "-"}
            </div>

            <div
              style={{
                marginTop:
                  8,
              }}
            >
              <span
                style={{
                  ...s.badge,

                  background:
                    C.blueSoft,

                  color:
                    C.blue,
                }}
              >
                MANAGER
              </span>
            </div>
          </div>
        </div>

        <div
          style={
            s.profileGrid
          }
        >
          <Info
            label="Role"
            value="Manager"
          />

          <Info
            label="Access"
            value="Direct team assets and requests"
          />

          <Info
            label="Team Members"
            value={String(
              counts.teamMembers
            )}
          />

          <Info
            label="Assets Assigned"
            value={String(
              counts.totalAssets
            )}
          />

          <Info
            label="Pending Requests"
            value={String(
              counts.pending
            )}
          />

          <Info
            label="Assets In Repair"
            value={String(
              counts.inRepair
            )}
          />
        </div>
      </section>
    </>
  );
}

/* =========================================================
   REQUEST REVIEW MODAL
   ========================================================= */

function RequestModal({
  request,
  comment,
  setComment,
  working,
  onClose,
  onApprove,
  onReject,
}: {
  request:
    SecondaryDeviceRequest;

  comment:
    string;

  setComment:
    (
      value:
        string
    ) => void;

  working:
    boolean;

  onClose:
    () => void;

  onApprove:
    () => void;

  onReject:
    () => void;
}) {
  const pending =
    request.status ===
    "PENDING_MANAGER_APPROVAL";

  const currentAssets =
    request.currentAssets ||
    [];

  return (
    <div
      style={
        s.overlay
      }
    >
      <div
        style={
          s.modal
        }
      >
        <div
          style={
            s.drawerHeader
          }
        >
          <div>
            <h2
              style={{
                margin: 0,
              }}
            >
              Secondary Device
              Request Details
            </h2>

            <div
              style={
                s.smallMuted
              }
            >
              Review employee
              information, current
              assets and requested
              device.
            </div>
          </div>

          <button
            style={
              s.close
            }
            onClick={
              onClose
            }
          >
            ×
          </button>
        </div>

        <div
          style={
            s.modalGrid
          }
        >
          <div>
            <h3
              style={
                s.sectionTitle
              }
            >
              Employee Information
            </h3>

            <div
              style={
                s.infoGrid
              }
            >
              <Info
                label="Name"
                value={
                  request.employeeName
                }
              />

              <Info
                label="Employee ID"
                value={
                  request.employeeCode
                }
              />

              <Info
                label="Department"
                value={
                  request.department
                }
              />

              <Info
                label="Manager"
                value={
                  request.managerName
                }
              />
            </div>

            <h3
              style={
                s.sectionTitle
              }
            >
              Current Assets
            </h3>

            {currentAssets.length ? (
              currentAssets.map(
                (
                  asset
                ) => (
                  <AssetCard
                    key={
                      asset.id
                    }
                    asset={
                      asset
                    }
                  />
                )
              )
            ) : (
              <Empty
                text="No currently assigned assets."
              />
            )}
          </div>

          <div>
            <h3
              style={
                s.sectionTitle
              }
            >
              Requested Device
            </h3>

            <div
              style={
                s.infoGrid
              }
            >
              <Info
                label="Category"
                value={
                  request.category
                }
              />

              <Info
                label="Request Type"
                value="Secondary Device"
              />

              <Info
                label="Reason"
                value={
                  request.reason
                }
              />

              <Info
                label="Requested On"
                value={
                  fmt(
                    request.requestedAt
                  )
                }
              />

              <Info
                label="Status"
                value={
                  requestLabel(
                    request.status
                  )
                }
              />
            </div>

            <h3
              style={
                s.sectionTitle
              }
            >
              Manager Comments
            </h3>

            <textarea
              style={
                s.textarea
              }
              value={
                comment
              }
              onChange={
                (
                  event
                ) =>
                  setComment(
                    event.target
                      .value
                  )
              }
              disabled={
                !pending ||
                working
              }
              placeholder="Enter approval or rejection comments..."
            />

            {!pending && (
              <div
                style={{
                  marginTop:
                    10,
                }}
              >
                <Info
                  label="Reviewed By"
                  value={
                    request.reviewedBy
                  }
                />

                <Info
                  label="Reviewed On"
                  value={
                    fmt(
                      request.reviewedAt
                    )
                  }
                />
              </div>
            )}
          </div>
        </div>

        <div
          style={
            s.modalActions
          }
        >
          <button
            style={
              s.secondaryButton
            }
            onClick={
              onClose
            }
            disabled={
              working
            }
          >
            Close
          </button>

          {pending && (
            <>
              <button
                style={
                  s.rejectButton
                }
                onClick={
                  onReject
                }
                disabled={
                  working
                }
              >
                {working
                  ? "Please wait..."
                  : "Reject"}
              </button>

              <button
                style={
                  s.primaryButton
                }
                onClick={
                  onApprove
                }
                disabled={
                  working
                }
              >
                {working
                  ? "Please wait..."
                  : "Approve"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INFO
   ========================================================= */

function Info({
  label,
  value,
}: {
  label:
    string;

  value?:
    string | null;
}) {
  return (
    <div
      style={
        s.infoRow
      }
    >
      <span
        style={
          s.infoLabel
        }
      >
        {label}
      </span>

      <span
        style={
          s.infoValue
        }
      >
        {value ||
          "-"}
      </span>
    </div>
  );
}

/* =========================================================
   EMPTY
   ========================================================= */

function Empty({
  text,
}: {
  text:
    string;
}) {
  return (
    <div
      style={
        s.empty
      }
    >
      {text}
    </div>
  );
}

/* =========================================================
   STYLES
   ========================================================= */

const s: Record<
  string,
  CSSProperties
> = {
  page: {
    minHeight:
      "100vh",

    background:
      C.bg,

    color:
      C.text,

    fontFamily:
      "Inter, Arial, sans-serif",

    display:
      "flex",
  },

  sidebar: {
    width:
      262,

    minWidth:
      262,

    minHeight:
      "100vh",

    background:
      C.navy,

    padding:
      "22px 16px",

    boxSizing:
      "border-box",

    position:
      "sticky",

    top:
      0,

    height:
      "100vh",
  },

  brandRow: {
    display:
      "flex",

    alignItems:
      "center",

    gap:
      11,

    padding:
      "2px 8px 24px",
  },

  brandMark: {
    width:
      38,

    height:
      38,

    borderRadius:
      10,

    background:
      "#fff",

    color:
      C.navy,

    display:
      "grid",

    placeItems:
      "center",

    fontWeight:
      900,
  },

  brandTitle: {
    color:
      "white",

    fontWeight:
      800,

    letterSpacing:
      ".02em",
  },

  brandSub: {
    color:
      "#c5d3df",

    fontSize:
      11,

    marginTop:
      2,
  },

  nav: {
    display:
      "grid",

    gap:
      7,
  },

  navButton: {
    width:
      "100%",

    border:
      0,

    background:
      "transparent",

    color:
      "#dce8f2",

    padding:
      "12px 13px",

    borderRadius:
      8,

    cursor:
      "pointer",

    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    textAlign:
      "left",

    fontSize:
      14,
  },

  navButtonActive: {
    background:
      C.navyLight,

    color:
      "white",
  },

  navLeft: {
    display:
      "flex",

    alignItems:
      "center",

    gap:
      10,
  },

  navIcon: {
    width:
      18,

    textAlign:
      "center",
  },

  navBadge: {
    minWidth:
      20,

    height:
      20,

    padding:
      "0 6px",

    borderRadius:
      999,

    background:
      "#ff4d4f",

    color:
      "white",

    display:
      "grid",

    placeItems:
      "center",

    fontSize:
      11,

    fontWeight:
      700,
  },

  contentWrap: {
    flex:
      1,

    minWidth:
      0,
  },

  topbar: {
    height:
      72,

    background:
      "white",

    borderBottom:
      `1px solid ${C.border}`,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "space-between",

    padding:
      "0 30px",

    position:
      "sticky",

    top:
      0,

    zIndex:
      10,
  },

  userBlock: {
    display:
      "flex",

    alignItems:
      "center",

    gap:
      10,
  },

  avatar: {
    width:
      38,

    height:
      38,

    borderRadius:
      "50%",

    background:
      C.navy,

    color:
      "white",

    display:
      "grid",

    placeItems:
      "center",

    fontWeight:
      800,
  },

  userName: {
    fontWeight:
      700,

    fontSize:
      14,
  },

  userRole: {
    color:
      C.muted,

    fontSize:
      12,
  },

  main: {
    padding:
      30,

    maxWidth:
      1500,

    margin:
      "0 auto",
  },

  pageHeader: {
    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    marginBottom:
      20,
  },

  h1: {
    margin:
      0,

    fontSize:
      28,
  },

  h2: {
    margin:
      0,

    fontSize:
      18,
  },

  subtitle: {
    margin:
      "6px 0 0",

    color:
      C.muted,
  },

  muted: {
    color:
      C.muted,
  },

  smallMuted: {
    color:
      C.muted,

    fontSize:
      12,

    lineHeight:
      1.45,
  },

  error: {
    background:
      C.redSoft,

    color:
      C.red,

    border:
      "1px solid #ffc8c8",

    borderRadius:
      8,

    padding:
      12,

    marginBottom:
      16,
  },

  success: {
    background:
      C.greenSoft,

    color:
      C.green,

    border:
      "1px solid #bcebd7",

    borderRadius:
      8,

    padding:
      12,

    marginBottom:
      16,
  },

  loading: {
    background:
      "white",

    border:
      `1px solid ${C.border}`,

    borderRadius:
      10,

    padding:
      30,

    textAlign:
      "center",

    color:
      C.muted,
  },

  statsGrid: {
    display:
      "grid",

    gridTemplateColumns:
      "repeat(4, minmax(0,1fr))",

    gap:
      14,

    marginBottom:
      18,
  },

  stat: {
    background:
      "white",

    border:
      `1px solid ${C.border}`,

    borderRadius:
      12,

    padding:
      18,

    display:
      "flex",

    alignItems:
      "center",

    gap:
      13,
  },

  statIcon: {
    width:
      44,

    height:
      44,

    borderRadius:
      10,

    display:
      "grid",

    placeItems:
      "center",

    fontSize:
      20,
  },

  statValue: {
    fontSize:
      24,

    fontWeight:
      800,
  },

  statTitle: {
    color:
      C.muted,

    fontSize:
      12,

    marginTop:
      2,
  },

  twoCol: {
    display:
      "grid",

    gridTemplateColumns:
      "1fr 1fr",

    gap:
      16,
  },

  panel: {
    background:
      "white",

    border:
      `1px solid ${C.border}`,

    borderRadius:
      12,

    padding:
      18,

    minWidth:
      0,
  },

  panelHeader: {
    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "space-between",

    gap:
      12,
  },

  listRow: {
    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "space-between",

    gap:
      12,

    padding:
      "13px 0",

    borderBottom:
      `1px solid ${C.border}`,
  },

  repairText: {
    color:
      C.red,

    fontSize:
      12,

    marginTop:
      3,
  },

  filters: {
    display:
      "grid",

    gridTemplateColumns:
      "minmax(280px,1fr) 235px 220px",

    gap:
      12,

    marginBottom:
      14,
  },

  input: {
    width:
      "100%",

    height:
      46,

    border:
      `1px solid ${C.border}`,

    borderRadius:
      8,

    padding:
      "0 14px",

    fontSize:
      14,

    boxSizing:
      "border-box",

    background:
      "white",
  },

  select: {
    height:
      46,

    border:
      `1px solid ${C.border}`,

    borderRadius:
      8,

    padding:
      "0 12px",

    fontSize:
      14,

    background:
      "white",
  },

  teamLayout: {
    display:
      "grid",

    gridTemplateColumns:
      "minmax(0,1fr) 360px",

    gap:
      16,

    alignItems:
      "start",
  },

  drawer: {
    background:
      "white",

    border:
      `1px solid ${C.border}`,

    borderRadius:
      12,

    padding:
      18,

    position:
      "sticky",

    top:
      88,

    maxHeight:
      "calc(100vh - 110px)",

    overflowY:
      "auto",
  },

  drawerHeader: {
    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "flex-start",

    gap:
      12,
  },

  drawerName: {
    fontWeight:
      800,

    fontSize:
      19,
  },

  close: {
    width:
      32,

    height:
      32,

    border:
      `1px solid ${C.border}`,

    background:
      "white",

    borderRadius:
      8,

    cursor:
      "pointer",

    fontSize:
      20,
  },

  tableWrap: {
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

    minWidth:
      900,
  },

  th: {
    background:
      "#f5f8fc",

    color:
      "#344054",

    textAlign:
      "left",

    padding:
      "12px 11px",

    fontSize:
      12,

    whiteSpace:
      "nowrap",

    borderBottom:
      `1px solid ${C.border}`,
  },

  td: {
    padding:
      "12px 11px",

    fontSize:
      13,

    verticalAlign:
      "middle",

    borderBottom:
      `1px solid ${C.border}`,
  },

  badge: {
    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    borderRadius:
      999,

    padding:
      "5px 9px",

    fontSize:
      11,

    fontWeight:
      700,

    whiteSpace:
      "nowrap",
  },

  sectionTitle: {
    fontSize:
      14,

    margin:
      "18px 0 10px",
  },

  infoGrid: {
    display:
      "grid",

    gap:
      8,
  },

  infoRow: {
    display:
      "grid",

    gridTemplateColumns:
      "145px minmax(0,1fr)",

    gap:
      10,

    fontSize:
      12,

    alignItems:
      "start",
  },

  infoLabel: {
    color:
      C.muted,
  },

  infoValue: {
    color:
      C.text,

    fontWeight:
      600,

    overflowWrap:
      "anywhere",
  },

  /* ASSET CARD */

  assetCard: {
    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "flex-start",

    gap:
      12,

    border:
      `1px solid ${C.border}`,

    borderRadius:
      10,

    padding:
      12,

    marginBottom:
      9,

    background:
      "white",
  },

  assetCardMain: {
    display:
      "flex",

    alignItems:
      "center",

    gap:
      12,

    minWidth:
      0,
  },

  assetRow: {
    display:
      "flex",

    alignItems:
      "center",

    gap:
      10,

    minWidth:
      0,
  },

  /* ASSET IMAGE */

  assetImage: {
    width:
      62,

    height:
      62,

    minWidth:
      62,

    borderRadius:
      12,

    display:
      "grid",

    placeItems:
      "center",

    background:
      "linear-gradient(145deg,#edf6ff,#f8fbff)",

    border:
      `1px solid ${C.border}`,

    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,.8)",
  },

  assetImageCompact: {
    width:
      42,

    height:
      42,

    minWidth:
      42,

    borderRadius:
      9,
  },

  assetImageIcon: {
    fontSize:
      34,

    lineHeight:
      1,
  },

  assetImageIconCompact: {
    fontSize:
      24,
  },

  repairCard: {
    border:
      "1px solid #ffc8c8",

    background:
      "#fffafa",

    borderRadius:
      10,

    padding:
      12,

    marginBottom:
      10,
  },

  repairDetails: {
    display:
      "grid",

    gap:
      7,

    marginTop:
      10,
  },

  tabs: {
    display:
      "flex",

    gap:
      4,

    marginBottom:
      14,

    background:
      "white",

    border:
      `1px solid ${C.border}`,

    borderRadius:
      8,

    padding:
      4,

    width:
      "fit-content",
  },

  tab: {
    border:
      0,

    background:
      "transparent",

    padding:
      "9px 14px",

    borderRadius:
      6,

    cursor:
      "pointer",

    color:
      C.muted,

    fontWeight:
      600,
  },

  tabActive: {
    background:
      C.blueSoft,

    color:
      C.blue,
  },

  overlay: {
    position:
      "fixed",

    inset:
      0,

    background:
      "rgba(15,23,42,.45)",

    zIndex:
      100,

    display:
      "grid",

    placeItems:
      "center",

    padding:
      20,
  },

  modal: {
    width:
      "min(980px,96vw)",

    maxHeight:
      "92vh",

    overflowY:
      "auto",

    background:
      "white",

    borderRadius:
      14,

    padding:
      22,

    boxShadow:
      "0 24px 80px rgba(0,0,0,.2)",
  },

  modalGrid: {
    display:
      "grid",

    gridTemplateColumns:
      "1fr 1fr",

    gap:
      28,

    marginTop:
      16,
  },

  modalActions: {
    display:
      "flex",

    justifyContent:
      "flex-end",

    gap:
      10,

    marginTop:
      20,

    paddingTop:
      16,

    borderTop:
      `1px solid ${C.border}`,
  },

  textarea: {
    width:
      "100%",

    minHeight:
      120,

    resize:
      "vertical",

    border:
      `1px solid ${C.border}`,

    borderRadius:
      8,

    padding:
      12,

    boxSizing:
      "border-box",

    fontFamily:
      "inherit",
  },

  primaryButton: {
    border:
      0,

    background:
      C.blue,

    color:
      "white",

    padding:
      "10px 18px",

    borderRadius:
      8,

    cursor:
      "pointer",

    fontWeight:
      700,
  },

  secondaryButton: {
    border:
      `1px solid ${C.border}`,

    background:
      "white",

    color:
      C.text,

    padding:
      "10px 18px",

    borderRadius:
      8,

    cursor:
      "pointer",

    fontWeight:
      600,
  },

  rejectButton: {
    border:
      "1px solid #ffc8c8",

    background:
      C.redSoft,

    color:
      C.red,

    padding:
      "10px 18px",

    borderRadius:
      8,

    cursor:
      "pointer",

    fontWeight:
      700,
  },

  primarySmall: {
    border:
      0,

    background:
      C.blue,

    color:
      "white",

    padding:
      "8px 12px",

    borderRadius:
      7,

    cursor:
      "pointer",

    fontWeight:
      700,

    whiteSpace:
      "nowrap",
  },

  secondarySmall: {
    border:
      `1px solid ${C.border}`,

    background:
      "white",

    color:
      C.text,

    padding:
      "7px 12px",

    borderRadius:
      7,

    cursor:
      "pointer",

    fontWeight:
      600,
  },

  linkButton: {
    border:
      0,

    background:
      "transparent",

    color:
      C.blue,

    cursor:
      "pointer",

    fontWeight:
      700,
  },

  empty: {
    color:
      C.muted,

    textAlign:
      "center",

    padding:
      "22px 12px",

    fontSize:
      13,
  },

  profileCard: {
    background:
      "white",

    border:
      `1px solid ${C.border}`,

    borderRadius:
      12,

    padding:
      22,

    maxWidth:
      780,
  },

  profileHero: {
    display:
      "flex",

    alignItems:
      "center",

    gap:
      16,

    paddingBottom:
      20,

    borderBottom:
      `1px solid ${C.border}`,
  },

  profileAvatar: {
    width:
      64,

    height:
      64,

    borderRadius:
      "50%",

    background:
      C.navy,

    color:
      "white",

    display:
      "grid",

    placeItems:
      "center",

    fontSize:
      24,

    fontWeight:
      800,
  },

  profileGrid: {
    display:
      "grid",

    gridTemplateColumns:
      "1fr 1fr",

    gap:
      14,

    marginTop:
      20,
  },
};