"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  CSSProperties,
  FormEvent,
  ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import Side from "@/components/Side";
import { api } from "@/lib/api";

/* =========================================================
   TYPES
   ========================================================= */

type AssetStatus =
  | "IN_STOCK"
  | "ASSIGNED"
  | "IN_REPAIR"
  | "RETIRED";

type WarrantyStatus =
  | "NO_WARRANTY"
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED";

type Asset = {
  id: string;
  assetTag: string;
  name: string;
  category: string;

  brand?: string | null;
  model?: string | null;

  serialNumber: string;
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
  warrantyStatus?: WarrantyStatus;
  warrantyDaysRemaining?: number | null;

  status: AssetStatus;

  createdAt?: string | null;
  updatedAt?: string | null;

  assignedEmployeeId?: string | null;
  assignedEmployeeName?: string | null;

  employeeId?: string | null;
  employeeName?: string | null;
  assignedTo?: string | null;
};

type Employee = {
  id: string;
  name: string;
  email?: string;
  employeeCode?: string;
  department?: string;
};

type AssetEvent = {
  id: string;
  assetId: string;
  previousStatus: AssetStatus;
  newStatus: AssetStatus;
  actor: string;
  reason: string;
  occurredAt: string;
};

type AssetAssignment = {
  id: string;
  assetId: string;
  employeeId: string;
  employeeName: string;

  assignedAt: string;
  assignedBy: string;
  reason: string;

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

  renewedBy: string;
  renewedAt: string;
};

type AssetForm = {
  assetTag: string;
  name: string;
  category: string;

  brand: string;
  model: string;

  serialNumber: string;
  specifications: string;

  purchaseDate: string;
  purchasePrice: string;
  supplier: string;

  warrantyAvailable: boolean;
  warrantyStartDate: string;
  warrantyPeriodMonths: string;
  warrantyProvider: string;
  warrantyReference: string;
  purchaseOrderId?: string;
};

type ActionType =
  | "ASSIGN"
  | "REPAIR"
  | "REPAIR_COMPLETE"
  | "RETURN"
  | "RETIRE"
  | null;

/* =========================================================
   CONSTANTS
   ========================================================= */

const categories = [
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

function getWarrantyDaysLeft(
  expiryDate?: string | null
): number | null {
  if (!expiryDate) {
    return null;
  }

  const dateOnly =
    expiryDate.split("T")[0];

  const parts =
    dateOnly.split("-");

  if (parts.length !== 3) {
    return null;
  }

  const year =
    Number(parts[0]);

  const month =
    Number(parts[1]);

  const day =
    Number(parts[2]);

  if (!year || !month || !day) {
    return null;
  }

  const today =
    new Date();

  const todayUtc =
    Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

  const expiryUtc =
    Date.UTC(
      year,
      month - 1,
      day
    );

  const oneDay =
    1000 * 60 * 60 * 24;

  return Math.round(
    (expiryUtc - todayUtc) /
      oneDay
  );
}

function getWarrantyAlertMessage(
  daysLeft: number
) {
  if (daysLeft < 0) {
    const expiredDays =
      Math.abs(daysLeft);

    if (expiredDays === 1) {
      return "Warranty expired yesterday";
    }

    return `Warranty expired ${expiredDays} days ago`;
  }

  if (daysLeft === 0) {
    return "Warranty expires today";
  }

  if (daysLeft === 1) {
    return "Warranty expires tomorrow";
  }

  return `Warranty expires in ${daysLeft} days`;
}

function getWarrantyAlertColor(
  daysLeft: number
) {
  if (daysLeft <= 0) {
    return {
      background: "#fff1f0",
      border: "#ffccc7",
      color: "#cf1322",
      badge: "#ff4d4f",
    };
  }

  if (daysLeft <= 7) {
    return {
      background: "#fff7e6",
      border: "#ffd591",
      color: "#ad4e00",
      badge: "#fa8c16",
    };
  }

  if (daysLeft <= 15) {
    return {
      background: "#fffbe6",
      border: "#ffe58f",
      color: "#ad6800",
      badge: "#faad14",
    };
  }

  return {
    background: "#e6f4ff",
    border: "#91caff",
    color: "#0958d9",
    badge: "#1677ff",
  };
}

function formatLocalDate(
  date: Date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function emptyAssetForm(): AssetForm {
  return {
    assetTag: "",
    name: "",
    category: "Laptop",

    brand: "",
    model: "",

    serialNumber: "",
    specifications: "",

    purchaseDate: "",
    purchasePrice: "",
    supplier: "",

    warrantyAvailable: false,
    warrantyStartDate: "",
    warrantyPeriodMonths: "12",
    warrantyProvider: "",
    warrantyReference: "",
  };
}

/* =========================================================
   ICONS
   ========================================================= */

function EditIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle
        cx="12"
        cy="12"
        r="3"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function AssignIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle
        cx="9"
        cy="7"
        r="4"
      />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
    </svg>
  );
}

function RepairIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14.7 6.3a4 4 0 0 0-5-5L7.4 3.6l3 3L12.7 4.3a4 4 0 0 0 2 5L6 18.3 2.7 21.6a1 1 0 0 0 1.4 1.4L7.4 19.7l8.7-8.7a4 4 0 0 0 5-5l-2.3 2.3-3-3L18.1 3a4 4 0 0 0-3.4 3.3Z" />
    </svg>
  );
}

function ReturnIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 6 6v5" />
    </svg>
  );
}

function RetireIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 8v13H3V8" />
      <path d="M1 3h22v5H1z" />
      <path d="M10 12h4" />
    </svg>
  );
}

function WarrantyIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/* =========================================================
   MAIN PAGE
   ========================================================= */

export default function AdminAssetsPage() {
const searchParams = useSearchParams();
  const [
    assets,
    setAssets,
  ] = useState<Asset[]>([]);

  const [
    employees,
    setEmployees,
  ] = useState<Employee[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    working,
    setWorking,
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
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");

  /* =========================================================
     HOVER
     ========================================================= */

  const [
    hoveredAsset,
    setHoveredAsset,
  ] = useState<Asset | null>(
    null
  );

  const [
    hoverPosition,
    setHoverPosition,
  ] = useState({
    x: 0,
    y: 0,
  });

  /* =========================================================
     ADD ASSET
     ========================================================= */

  const [
    showAddAsset,
    setShowAddAsset,
  ] = useState(false);

  const [
    newAsset,
    setNewAsset,
  ] = useState<AssetForm>(
    emptyAssetForm()
  );
  const [
    purchaseOrderId,
    setPurchaseOrderId,
  ] = useState<string | null>(
    null
  );
  /* =========================================================
     EDIT ASSET
     ========================================================= */

  const [
    editingAsset,
    setEditingAsset,
  ] = useState<Asset | null>(
    null
  );

  const [
    editAsset,
    setEditAsset,
  ] = useState<AssetForm>(
    emptyAssetForm()
  );

  /* =========================================================
     ACTIONS
     ========================================================= */

  const [
    selectedAsset,
    setSelectedAsset,
  ] = useState<Asset | null>(
    null
  );

  const [
    actionType,
    setActionType,
  ] = useState<ActionType>(
    null
  );

  const [
    employeeId,
    setEmployeeId,
  ] = useState("");

  const [
    reason,
    setReason,
  ] = useState("");

  const [
    openActionsId,
    setOpenActionsId,
  ] = useState<string | null>(
    null
  );

  const [
    actionsMenuPosition,
    setActionsMenuPosition,
  ] = useState({
    top: 0,
    left: 0,
  });

  /* =========================================================
     HISTORY
     ========================================================= */

  const [
    historyAsset,
    setHistoryAsset,
  ] = useState<Asset | null>(
    null
  );

  const [
    lifecycleHistory,
    setLifecycleHistory,
  ] = useState<
    AssetEvent[]
  >([]);

  const [
    assignmentHistory,
    setAssignmentHistory,
  ] = useState<
    AssetAssignment[]
  >([]);

  const [
    warrantyHistory,
    setWarrantyHistory,
  ] = useState<
    WarrantyHistory[]
  >([]);

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);

  const [
    historyError,
    setHistoryError,
  ] = useState("");

  /* =========================================================
     WARRANTY RENEWAL
     ========================================================= */

  const [
    showRenewWarranty,
    setShowRenewWarranty,
  ] = useState(false);

  const [
    renewWarrantyForm,
    setRenewWarrantyForm,
  ] = useState({
    newStartDate: "",
    periodMonths: "12",
    provider: "",
    warrantyReference: "",
    renewalCost: "",
    notes: "",
  });
/* =========================================================
   ONBOARDING PURCHASE PREFILL
   ========================================================= */

useEffect(() => {
  const onboardingRequestId =
    searchParams.get(
      "onboardingRequestId"
    );
const directPurchaseOrderId =
    searchParams.get(
        "purchaseOrderId"
    );
  if (
      !onboardingRequestId &&
      !directPurchaseOrderId
  ) {
      return;
  }

  if (directPurchaseOrderId) {
      setPurchaseOrderId(
          directPurchaseOrderId
      );
  }

  const category =
    searchParams.get(
      "category"
    ) || "Laptop";

  const specifications =
    searchParams.get(
      "specifications"
    ) || "";

  const purchasePrice =
    searchParams.get(
      "purchasePrice"
    ) || "";
  if (directPurchaseOrderId) {
    setPurchaseOrderId(
      directPurchaseOrderId
    );

    setNewAsset((current) => ({
      ...current,
      assetTag: "",
      name: category,
      category,
      brand:
        searchParams.get("brand") || "",
      model:
        searchParams.get("model") || "",
      serialNumber: "",
      specifications,
      purchaseDate:
        formatLocalDate(new Date()),
      purchasePrice,
      supplier:
        searchParams.get("supplier") || "",
      warrantyAvailable: false,
      warrantyStartDate: "",
      warrantyPeriodMonths: "12",
      warrantyProvider: "",
      warrantyReference: "",
    }));

    setError("");
    setShowAddAsset(true);

    return;
  }
  async function loadPurchaseOrder() {
    try {
      const purchaseOrder =
        await api(
          `/api/v1/purchase-orders/onboarding/${onboardingRequestId}`
        );

      setPurchaseOrderId(
        purchaseOrder?.id || null
      );

      setNewAsset((current) => ({
        ...current,

        assetTag: "",

        name: category,

        category,

        brand:
          purchaseOrder?.brand || "",

        model:
          purchaseOrder?.model || "",

        serialNumber: "",

        specifications:
          purchaseOrder?.specifications ||
          specifications,

        purchaseDate:
          formatLocalDate(
            new Date()
          ),

        purchasePrice:
          purchaseOrder?.pricePerUnit !==
            null &&
          purchaseOrder?.pricePerUnit !==
            undefined
            ? String(
                purchaseOrder.pricePerUnit
              )
            : purchasePrice,

        supplier:
          purchaseOrder?.supplier || "",

        warrantyAvailable: false,

        warrantyStartDate: "",

        warrantyPeriodMonths: "12",

        warrantyProvider: "",

        warrantyReference: "",
      }));

      setError("");

      setShowAddAsset(true);

    } catch (err: any) {
      console.error(err);

      /*
       * Preserve the existing prefill behaviour
       * even when an old onboarding request has
       * no linked purchase order.
       */
      setPurchaseOrderId(null);

      setNewAsset((current) => ({
        ...current,

        assetTag: "",

        name: category,

        category,

        brand: "",

        model: "",

        serialNumber: "",

        specifications,

        purchaseDate:
          formatLocalDate(
            new Date()
          ),

        purchasePrice,

        supplier: "",

        warrantyAvailable: false,

        warrantyStartDate: "",

        warrantyPeriodMonths: "12",

        warrantyProvider: "",

        warrantyReference: "",
      }));

      setShowAddAsset(true);
    }
  }

  void loadPurchaseOrder();

}, [searchParams]);
  /* =========================================================
     INITIAL LOAD
     ========================================================= */

  useEffect(() => {
    const token =
      localStorage.getItem(
        "token"
      );

    const role =
      localStorage.getItem(
        "role"
      );

    if (!token) {
      setError(
        "Please login again as Asset Admin."
      );

      setLoading(false);

      return;
    }

    if (
      role !==
      "ASSET_ADMIN"
    ) {
      setError(
        "This page requires an Asset Admin login."
      );

      setLoading(false);

      return;
    }

    void loadData();
  }, []);

  /* =========================================================
     LOAD DATA
     ========================================================= */

  async function loadData() {
    setLoading(true);

    setError("");

    try {
      const [
        assetData,
        employeeData,
      ] =
        await Promise.all([
          api(
            "/api/v1/assets"
          ),

          api(
            "/api/v1/employees"
          ),
        ]);

      setAssets(
        Array.isArray(
          assetData
        )
          ? assetData
          : Array.isArray(
                assetData?.content
              )
            ? assetData.content
            : []
      );

      setEmployees(
        Array.isArray(
          employeeData
        )
          ? employeeData
          : Array.isArray(
                employeeData?.content
              )
            ? employeeData.content
            : []
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Failed to load assets."
      );
    } finally {
      setLoading(false);
    }
  }

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  /* =========================================================
     DISPLAY HELPERS
     ========================================================= */

  function getAssignedEmployeeName(
    asset: Asset
  ) {
    return (
      asset.assignedEmployeeName ||
      asset.employeeName ||
      asset.assignedTo ||
      "-"
    );
  }

  function formatDate(
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
      "en-IN"
    );
  }

  function formatDateOnly(
    value?: string | null
  ) {
    if (!value) {
      return "-";
    }

    const dateOnly =
      value.split("T")[0];

    const parts =
      dateOnly.split("-");

    if (
      parts.length !== 3
    ) {
      return value;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

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
        maximumFractionDigits: 2,
      }
    ).format(value);
  }

  function statusText(
    status: AssetStatus
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

  function statusStyle(
    status: AssetStatus
  ): CSSProperties {
    if (
      status ===
      "IN_STOCK"
    ) {
      return {
        background:
          "#e8f8ef",

        color:
          "#16834b",
      };
    }

    if (
      status ===
      "ASSIGNED"
    ) {
      return {
        background:
          "#e8f1ff",

        color:
          "#1467d2",
      };
    }

    if (
      status ===
      "IN_REPAIR"
    ) {
      return {
        background:
          "#fff4df",

        color:
          "#b56a00",
      };
    }

    return {
      background:
        "#fdecec",

      color:
        "#c0392b",
    };
  }

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

    const days =
      getWarrantyDaysLeft(
        asset.warrantyExpiryDate
      );

    if (
      days !== null &&
      days < 0
    ) {
      return "Expired";
    }

    if (
      days !== null &&
      days <= 30
    ) {
      return "Expiring Soon";
    }

    return "Active";
  }

  function warrantyStatusStyle(
    asset: Asset
  ): CSSProperties {
    const status =
      warrantyStatusText(
        asset
      );

    if (
      status ===
      "No Warranty"
    ) {
      return {
        background:
          "#eef2f6",

        color:
          "#60738a",
      };
    }

    if (
      status ===
      "Expired"
    ) {
      return {
        background:
          "#fdecec",

        color:
          "#c0392b",
      };
    }

    if (
      status ===
      "Expiring Soon"
    ) {
      return {
        background:
          "#fff4df",

        color:
          "#b56a00",
      };
    }

    return {
      background:
        "#e8f8ef",

      color:
        "#16834b",
    };
  }

  function warrantyRemainingText(
    asset: Asset
  ) {
    if (
      !asset.warrantyAvailable
    ) {
      return "-";
    }

    const days =
      getWarrantyDaysLeft(
        asset.warrantyExpiryDate
      );

    if (
      days === null
    ) {
      return "-";
    }

    return getWarrantyAlertMessage(
      days
    );
  }

  /* =========================================================
     HOVER HELPERS
     ========================================================= */

  function startHover(
    asset: Asset,
    x: number,
    y: number
  ) {
    setHoveredAsset(
      asset
    );

    setHoverPosition({
      x,
      y,
    });
  }

  function moveHover(
    x: number,
    y: number
  ) {
    setHoverPosition({
      x,
      y,
    });
  }

  function stopHover() {
    setHoveredAsset(
      null
    );
  }

  /* =========================================================
     CREATE ASSET
     ========================================================= */

  async function addAsset(
    event: FormEvent
  ) {
    event.preventDefault();

    clearMessages();

    if (
      !newAsset.assetTag.trim() ||
      !newAsset.name.trim() ||
      !newAsset.category.trim() ||
      !newAsset.serialNumber.trim()
    ) {
      setError(
        "Asset Tag, Asset Name, Category and Serial Number are required."
      );

      return;
    }

    if (
      newAsset.warrantyAvailable &&
      (
        !newAsset.warrantyStartDate ||
        !newAsset.warrantyPeriodMonths
      )
    ) {
      setError(
        "Warranty Start Date and Warranty Period are required."
      );

      return;
    }

    setWorking(true);

    try {
await api(
  "/api/v1/assets",
  {
    method: "POST",

    body:
      JSON.stringify({
        ...buildAssetPayload(
          newAsset,
          purchaseOrderId
        ),

        purchaseOrderId:
          purchaseOrderId,
      }),
  }
);

      setNewAsset(
        emptyAssetForm()
      );

      setShowAddAsset(
        false
      );

      await loadData();

      setSuccess(
        "Asset added successfully."
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "Failed to add asset."
      );
    } finally {
      setWorking(false);
    }
  }

  /* =========================================================
     EDIT
     ========================================================= */

  function openEditAsset(
    asset: Asset
  ) {
    clearMessages();

    closeAction();

    closeHistory();

    setShowAddAsset(
      false
    );

    setEditingAsset(
      asset
    );

    setEditAsset({
      assetTag:
        asset.assetTag ||
        "",

      name:
        asset.name ||
        "",

      category:
        asset.category ||
        "Laptop",

      brand:
        asset.brand ||
        "",

      model:
        asset.model ||
        "",

      serialNumber:
        asset.serialNumber ||
        "",

      specifications:
        asset.specifications ||
        "",

      purchaseDate:
        asset.purchaseDate ||
        "",

      purchasePrice:
        asset.purchasePrice ===
          null ||
        asset.purchasePrice ===
          undefined
          ? ""
          : String(
              asset.purchasePrice
            ),

      supplier:
        asset.supplier ||
        "",

      warrantyAvailable:
        Boolean(
          asset.warrantyAvailable
        ),

      warrantyStartDate:
        asset.warrantyStartDate ||
        "",

      warrantyPeriodMonths:
        asset.warrantyPeriodMonths
          ? String(
              asset.warrantyPeriodMonths
            )
          : "12",

      warrantyProvider:
        asset.warrantyProvider ||
        "",

      warrantyReference:
        asset.warrantyReference ||
        "",
    });
  }

  async function updateAsset(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !editingAsset
    ) {
      return;
    }

    clearMessages();

    if (
      !editAsset.assetTag.trim() ||
      !editAsset.name.trim() ||
      !editAsset.category.trim() ||
      !editAsset.serialNumber.trim()
    ) {
      setError(
        "Asset Tag, Asset Name, Category and Serial Number are required."
      );

      return;
    }

    setWorking(true);

    try {
      await api(
        `/api/v1/assets/${editingAsset.id}`,
        {
          method: "PUT",

          body:
            JSON.stringify(
              buildAssetPayload(
                editAsset
              )
            ),
        }
      );

      const tag =
        editAsset.assetTag;

      setEditingAsset(
        null
      );

      await loadData();

      setSuccess(
        `${tag} updated successfully.`
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "Failed to update asset."
      );
    } finally {
      setWorking(false);
    }
  }

  /* =========================================================
     DELETE
     ========================================================= */

  async function deleteAsset(
    asset: Asset
  ) {
    const confirmed =
      window.confirm(
        `Delete ${asset.assetTag} - ${asset.name}?`
      );

    if (!confirmed) {
      return;
    }

    clearMessages();

    setWorking(true);

    try {
      await api(
        `/api/v1/assets/${asset.id}`,
        {
          method:
            "DELETE",
        }
      );

      await loadData();

      setSuccess(
        `${asset.assetTag} deleted successfully.`
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "Failed to delete asset."
      );
    } finally {
      setWorking(false);
    }
  }

  /* =========================================================
     ACTIONS
     ========================================================= */

  function closeAction() {
    setSelectedAsset(
      null
    );

    setActionType(
      null
    );

    setEmployeeId("");

    setReason("");
  }

  function openAction(
    asset: Asset,
    type: ActionType
  ) {
    clearMessages();

    closeHistory();

    setEditingAsset(
      null
    );

    setSelectedAsset(
      asset
    );

    setActionType(
      type
    );

    setReason("");

    setEmployeeId("");
  }

  async function assignAsset() {
    if (
      !selectedAsset
    ) {
      return;
    }

    if (
      !employeeId
    ) {
      setError(
        "Please select an employee."
      );

      return;
    }

    if (
      !reason.trim()
    ) {
      setError(
        "Please enter an assignment reason."
      );

      return;
    }

    setWorking(true);

    try {
      const tag =
        selectedAsset.assetTag;

      await api(
        `/api/v1/assets/${selectedAsset.id}/assign`,
        {
          method: "POST",

          body:
            JSON.stringify({
              employeeId,

              reason:
                reason.trim(),
            }),
        }
      );

      closeAction();

      await loadData();

      setSuccess(
        `${tag} assigned successfully.`
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "Failed to assign asset."
      );
    } finally {
      setWorking(false);
    }
  }

  async function changeStatus(
    status: AssetStatus,
    message: string
  ) {
    if (
      !selectedAsset
    ) {
      return;
    }

    if (
      !reason.trim()
    ) {
      setError(
        "Please enter a reason."
      );

      return;
    }

    setWorking(true);

    try {
      await api(
        `/api/v1/assets/${selectedAsset.id}/status`,
        {
          method: "PATCH",

          body:
            JSON.stringify({
              status,

              reason:
                reason.trim(),
            }),
        }
      );

      closeAction();

      await loadData();

      setSuccess(
        message
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "Failed to change asset status."
      );
    } finally {
      setWorking(false);
    }
  }

  async function returnAsset() {
    if (
      !selectedAsset
    ) {
      return;
    }

    if (
      !reason.trim()
    ) {
      setError(
        "Please enter a return reason."
      );

      return;
    }

    setWorking(true);

    try {
      const tag =
        selectedAsset.assetTag;

      await api(
        `/api/v1/assets/${selectedAsset.id}/return`,
        {
          method: "POST",

          body:
            JSON.stringify({
              reason:
                reason.trim(),
            }),
        }
      );

      closeAction();

      await loadData();

      setSuccess(
        `${tag} returned successfully.`
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "Failed to return asset."
      );
    } finally {
      setWorking(false);
    }
  }

  async function executeAction() {
    if (
      !selectedAsset ||
      !actionType
    ) {
      return;
    }

    if (
      actionType ===
      "ASSIGN"
    ) {
      await assignAsset();

      return;
    }

    if (
      actionType ===
      "REPAIR"
    ) {
      await changeStatus(
        "IN_REPAIR",

        `${selectedAsset.assetTag} moved to In Repair.`
      );

      return;
    }

    if (
      actionType ===
      "REPAIR_COMPLETE"
    ) {
      await changeStatus(
        "ASSIGNED",

        `${selectedAsset.assetTag} repair completed.`
      );

      return;
    }

    if (
      actionType ===
      "RETURN"
    ) {
      await returnAsset();

      return;
    }

    if (
      actionType ===
      "RETIRE"
    ) {
      await changeStatus(
        "RETIRED",

        `${selectedAsset.assetTag} retired successfully.`
      );
    }
  }

  function actionTitle() {
    switch (
      actionType
    ) {
      case "ASSIGN":
        return "Assign Asset";

      case "REPAIR":
        return "Send Asset to Repair";

      case "REPAIR_COMPLETE":
        return "Return Asset From Repair";

      case "RETURN":
        return "Return Asset";

      case "RETIRE":
        return "Retire Asset";

      default:
        return "";
    }
  }

  /* =========================================================
     HISTORY
     ========================================================= */

  function closeHistory() {
    setHistoryAsset(
      null
    );

    setLifecycleHistory(
      []
    );

    setAssignmentHistory(
      []
    );

    setWarrantyHistory(
      []
    );

    setShowRenewWarranty(
      false
    );

    setHistoryError("");
  }

  async function openHistory(
    asset: Asset,
    openRenewal = false
  ) {
    clearMessages();

    closeAction();

    setEditingAsset(
      null
    );

    setHistoryAsset(
      asset
    );

    setLifecycleHistory(
      []
    );

    setAssignmentHistory(
      []
    );

    setWarrantyHistory(
      []
    );

    setShowRenewWarranty(
      false
    );

    setHistoryError("");

    setHistoryLoading(
      true
    );

    try {
      const [
        assetData,
        eventData,
        assignmentData,
        warrantyData,
      ] =
        await Promise.all([
          api(
            `/api/v1/assets/${asset.id}`
          ),

          api(
            `/api/v1/assets/${asset.id}/events`
          ),

          api(
            `/api/v1/assets/${asset.id}/assignments`
          ),

          api(
            `/api/v1/assets/${asset.id}/warranty/history`
          ),
        ]);

      setHistoryAsset(
        assetData
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

      if (
        openRenewal
      ) {
        setRenewWarrantyForm({
          newStartDate:
            suggestedRenewalStart(
              assetData
            ),

          periodMonths:
            "12",

          provider:
            assetData.warrantyProvider ||
            assetData.brand ||
            "",

          warrantyReference:
            "",

          renewalCost:
            "",

          notes:
            "",
        });

        setShowRenewWarranty(
          true
        );

        window.setTimeout(
          () => {
            document
              .getElementById(
                "warranty-renewal-section"
              )
              ?.scrollIntoView({
                behavior:
                  "smooth",

                block:
                  "center",
              });
          },
          250
        );
      }
    } catch (err: any) {
      console.error(err);

      setHistoryError(
        err?.message ||
          "Failed to load asset history."
      );
    } finally {
      setHistoryLoading(
        false
      );
    }
  }

  /* =========================================================
     WARRANTY RENEWAL
     ========================================================= */

  function suggestedRenewalStart(
    asset: Asset
  ) {
    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    if (
      !asset.warrantyExpiryDate
    ) {
      return formatLocalDate(
        today
      );
    }

    const dateOnly =
      asset.warrantyExpiryDate.split(
        "T"
      )[0];

    const [
      year,
      month,
      day,
    ] =
      dateOnly
        .split("-")
        .map(Number);

    if (
      !year ||
      !month ||
      !day
    ) {
      return formatLocalDate(
        today
      );
    }

    const expiry =
      new Date(
        year,
        month - 1,
        day
      );

    expiry.setHours(
      0,
      0,
      0,
      0
    );

    if (
      expiry < today
    ) {
      return formatLocalDate(
        today
      );
    }

    const nextDay =
      new Date(expiry);

    nextDay.setDate(
      nextDay.getDate() +
        1
    );

    return formatLocalDate(
      nextDay
    );
  }

  function openRenewWarranty(
    asset: Asset
  ) {
    setHistoryError("");

    setRenewWarrantyForm({
      newStartDate:
        suggestedRenewalStart(
          asset
        ),

      periodMonths:
        "12",

      provider:
        asset.warrantyProvider ||
        asset.brand ||
        "",

      warrantyReference:
        "",

      renewalCost:
        "",

      notes:
        "",
    });

    setShowRenewWarranty(
      true
    );

    window.setTimeout(
      () => {
        document
          .getElementById(
            "warranty-renewal-section"
          )
          ?.scrollIntoView({
            behavior:
              "smooth",

            block:
              "center",
          });
      },
      100
    );
  }

  async function renewWarranty() {
    if (
      !historyAsset
    ) {
      return;
    }

    setHistoryError("");

    if (
      !renewWarrantyForm.newStartDate
    ) {
      setHistoryError(
        "Please enter the new warranty start date."
      );

      return;
    }

    const periodMonths =
      Number(
        renewWarrantyForm.periodMonths
      );

    if (
      !periodMonths ||
      periodMonths <= 0
    ) {
      setHistoryError(
        "Warranty period must be greater than zero."
      );

      return;
    }

    const renewalCost =
      renewWarrantyForm.renewalCost
        ? Number(
            renewWarrantyForm.renewalCost
          )
        : null;

    if (
      renewalCost !==
        null &&
      renewalCost < 0
    ) {
      setHistoryError(
        "Renewal cost cannot be negative."
      );

      return;
    }

    setWorking(true);

    try {
      await api(
        `/api/v1/assets/${historyAsset.id}/warranty/renew`,
        {
          method:
            "POST",

          body:
            JSON.stringify({
              newStartDate:
                renewWarrantyForm.newStartDate,

              periodMonths,

              provider:
                renewWarrantyForm.provider.trim() ||
                null,

              warrantyReference:
                renewWarrantyForm.warrantyReference.trim() ||
                null,

              renewalCost,

              notes:
                renewWarrantyForm.notes.trim() ||
                null,
            }),
        }
      );

      const [
        updatedAsset,
        warrantyData,
      ] =
        await Promise.all([
          api(
            `/api/v1/assets/${historyAsset.id}`
          ),

          api(
            `/api/v1/assets/${historyAsset.id}/warranty/history`
          ),
        ]);

      setHistoryAsset(
        updatedAsset
      );

      setWarrantyHistory(
        Array.isArray(
          warrantyData
        )
          ? warrantyData
          : []
      );

      setShowRenewWarranty(
        false
      );

      await loadData();

      setSuccess(
        `${updatedAsset.assetTag} warranty renewed successfully.`
      );
    } catch (err: any) {
      setHistoryError(
        err?.message ||
          "Failed to renew warranty."
      );
    } finally {
      setWorking(false);
    }
  }

  /* =========================================================
     SEARCH
     ========================================================= */

  const filteredAssets =
    useMemo(() => {
      return assets.filter(
        (asset) => {
          const query =
            search
              .trim()
              .toLowerCase();

          const assigned =
            (
              asset.assignedEmployeeName ||
              asset.employeeName ||
              asset.assignedTo ||
              ""
            ).toLowerCase();

          const searchable =
            [
              asset.assetTag,
              asset.name,
              asset.category,
              asset.brand,
              asset.model,
              asset.serialNumber,
              asset.specifications,
              asset.supplier,
              asset.warrantyProvider,
              asset.warrantyReference,
              assigned,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          const matchesSearch =
            !query ||
            searchable.includes(
              query
            );

          const matchesStatus =
            statusFilter ===
              "ALL" ||
            asset.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      assets,
      search,
      statusFilter,
    ]);

  /* =========================================================
     COUNTS
     ========================================================= */

  const totalAssets =
    assets.length;

  const inStockCount =
    assets.filter(
      (asset) =>
        asset.status ===
        "IN_STOCK"
    ).length;

  const assignedCount =
    assets.filter(
      (asset) =>
        asset.status ===
        "ASSIGNED"
    ).length;

  const repairCount =
    assets.filter(
      (asset) =>
        asset.status ===
        "IN_REPAIR"
    ).length;

  const retiredCount =
    assets.filter(
      (asset) =>
        asset.status ===
        "RETIRED"
    ).length;

  /* =========================================================
     WARRANTY ALERTS
     ========================================================= */

  const warrantyAlerts =
    useMemo(() => {
      return assets
        .filter(
          (asset) =>
            asset.warrantyAvailable ===
              true &&
            Boolean(
              asset.warrantyExpiryDate
            ) &&
            asset.status !==
              "RETIRED"
        )
        .map(
          (asset) => ({
            asset,

            daysLeft:
              getWarrantyDaysLeft(
                asset.warrantyExpiryDate
              ),
          })
        )
        .filter(
          (
            item
          ): item is {
            asset: Asset;
            daysLeft: number;
          } =>
            item.daysLeft !==
              null &&
            item.daysLeft <=
              30
        )
        .sort(
          (a, b) =>
            a.daysLeft -
            b.daysLeft
        );
    }, [assets]);

  const expiredWarrantyCount =
    warrantyAlerts.filter(
      (item) =>
        item.daysLeft < 0
    ).length;

  const expiringTodayCount =
    warrantyAlerts.filter(
      (item) =>
        item.daysLeft ===
        0
    ).length;

  const expiringNext7DaysCount =
    warrantyAlerts.filter(
      (item) =>
        item.daysLeft > 0 &&
        item.daysLeft <=
          7
    ).length;

  const expiringNext30DaysCount =
    warrantyAlerts.filter(
      (item) =>
        item.daysLeft > 7 &&
        item.daysLeft <=
          30
    ).length;

  /* =========================================================
     CSV
     ========================================================= */

  function exportCsv() {
    const headers = [
      "Asset Tag",
      "Asset Name",
      "Category",
      "Brand",
      "Model",
      "Serial Number",
      "Specifications",
      "Status",
      "Assigned To",
      "Purchase Date",
      "Purchase Price",
      "Supplier",
      "Warranty",
      "Warranty Expiry",
    ];

    const rows =
      filteredAssets.map(
        (asset) => [
          asset.assetTag,
          asset.name,
          asset.category,
          asset.brand ||
            "",
          asset.model ||
            "",
          asset.serialNumber,
          asset.specifications ||
            "",
          statusText(
            asset.status
          ),
          getAssignedEmployeeName(
            asset
          ),
          asset.purchaseDate ||
            "",
          asset.purchasePrice ??
            "",
          asset.supplier ||
            "",
          warrantyStatusText(
            asset
          ),
          asset.warrantyExpiryDate ||
            "",
        ]
      );

    function escapeCsv(
      value: unknown
    ) {
      const text =
        value === null ||
        value === undefined
          ? ""
          : String(value);

      return `"${text.replace(
        /"/g,
        '""'
      )}"`;
    }

    const csv = [
      headers
        .map(escapeCsv)
        .join(","),

      ...rows.map(
        (row) =>
          row
            .map(escapeCsv)
            .join(",")
      ),
    ].join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href =
      url;

    link.download =
      `asset-inventory-${formatLocalDate(
        new Date()
      )}.csv`;

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(
      url
    );
  }

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div style={styles.shell}>
      <Side role="admin" />

      <main style={styles.main}>

        {/* HEADER */}

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Assets
            </h1>

            <p style={styles.subtitle}>
              Manage company assets,
              lifecycle, purchase
              information and warranty
              details
            </p>
          </div>

          <div
            style={
              styles.headerButtons
            }
          >
            <button
              type="button"
              style={
                styles.secondaryButton
              }
              onClick={
                exportCsv
              }
            >
              Export CSV
            </button>

            <button
              type="button"
              style={
                styles.primaryButton
              }
              onClick={() => {
                clearMessages();

                closeAction();

                closeHistory();

                setEditingAsset(
                  null
                );

                setShowAddAsset(
                  (value) =>
                    !value
                );
              }}
            >
              {showAddAsset
                ? "Cancel"
                : "+ Add Asset"}
            </button>
          </div>
        </div>

        {/* SUMMARY */}

        <div
          style={
            styles.statsGrid
          }
        >
          <StatCard
            title="Total Fleet"
            value={totalAssets}
          />

          <StatCard
            title="In Stock"
            value={inStockCount}
          />

          <StatCard
            title="Assigned"
            value={assignedCount}
          />

          <StatCard
            title="In Repair"
            value={repairCount}
          />

          <StatCard
            title="Retired"
            value={retiredCount}
          />
        </div>

        {/* WARRANTY ALERTS */}

        <div
          id="warranty-alerts-section"
          style={
            styles.warrantyAlertPanel
          }
        >
          <div
            style={
              styles.warrantyAlertHeader
            }
          >
            <div>
              <h2
                style={
                  styles.warrantyAlertTitle
                }
              >
                Warranty Alerts
              </h2>

              <p
                style={
                  styles.warrantyAlertDescription
                }
              >
                Daily warranty expiry
                status. Expired
                warranties and
                warranties expiring
                within the next 30 days
                are shown here.
              </p>
            </div>

            <div
              style={
                styles.warrantyAlertCounts
              }
            >
              <div
                style={
                  styles.expiredCountBadge
                }
              >
                Expired:{" "}
                {
                  expiredWarrantyCount
                }
              </div>

              <div
                style={
                  styles.expiredCountBadge
                }
              >
                Today:{" "}
                {
                  expiringTodayCount
                }
              </div>

              <div
                style={
                  styles.sevenDayBadge
                }
              >
                Next 7 Days:{" "}
                {
                  expiringNext7DaysCount
                }
              </div>

              <div
                style={
                  styles.thirtyDayBadge
                }
              >
                8-30 Days:{" "}
                {
                  expiringNext30DaysCount
                }
              </div>
            </div>
          </div>

          {loading ? (
            <div
              style={
                styles.warrantyLoading
              }
            >
              Loading warranty
              alerts...
            </div>
          ) : warrantyAlerts.length ===
            0 ? (
            <div
              style={
                styles.noWarrantyAlerts
              }
            >
              ✓ No expired warranties
              or warranties expiring
              in the next 30 days.
            </div>
          ) : (
            <div
              style={
                styles.warrantyAlertList
              }
            >
              {warrantyAlerts.map(
                ({
                  asset,
                  daysLeft,
                }) => {
                  const alertStyle =
                    getWarrantyAlertColor(
                      daysLeft
                    );

                  return (
                    <div
                      key={
                        asset.id
                      }
                      style={{
                        ...styles.warrantyAlertRow,

                        background:
                          alertStyle.background,

                        border:
                          `1px solid ${alertStyle.border}`,
                      }}
                    >
                      <div
                        style={
                          styles.warrantyAssetSide
                        }
                      >
                        <div
                          style={{
                            ...styles.warrantyAlertDot,

                            background:
                              alertStyle.badge,
                          }}
                        />

                        <div>
                          <div
                            style={
                              styles.warrantyAssetName
                            }
                          >
                            {
                              asset.assetTag
                            }
                            {" — "}
                            {
                              asset.name
                            }
                          </div>

                          <div
                            style={
                              styles.warrantyAssetMeta
                            }
                          >
                            {
                              asset.category
                            }

                            {asset.brand
                              ? ` • ${asset.brand}`
                              : ""}

                            {asset.model
                              ? ` • ${asset.model}`
                              : ""}
                          </div>
                        </div>
                      </div>

                      <div
                        style={
                          styles.warrantyMessageSide
                        }
                      >
                        <div
                          style={{
                            ...styles.warrantyMessage,

                            color:
                              alertStyle.color,
                          }}
                        >
                          {getWarrantyAlertMessage(
                            daysLeft
                          )}
                        </div>

                        <div
                          style={
                            styles.warrantyExpiryText
                          }
                        >
                          Expiry Date:{" "}
                          {formatDateOnly(
                            asset.warrantyExpiryDate
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={
                            working
                          }
                          style={
                            styles.renewAlertButton
                          }
                          onClick={() =>
                            void openHistory(
                              asset,
                              true
                            )
                          }
                        >
                          Renew Warranty
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* MESSAGES */}

        {error && (
          <div
            style={
              styles.errorMessage
            }
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={
              styles.successMessage
            }
          >
            {success}
          </div>
        )}

        {/* ADD ASSET */}

        {showAddAsset && (
          <div
            style={
              styles.inlinePanel
            }
          >
            <h2
              style={
                styles.panelTitle
              }
            >
              Add New Asset
            </h2>

            <p
              style={
                styles.panelDescription
              }
            >
              Register the asset,
              purchase details and
              warranty.
            </p>

            <form
              onSubmit={
                addAsset
              }
            >
              <AssetFormFields
                form={
                  newAsset
                }
                setForm={
                  setNewAsset
                }
              />

              <div
                style={
                  styles.formActions
                }
              >
                <button
                  type="button"
                  style={
                    styles.secondaryButton
                  }
                  onClick={() =>
                    setShowAddAsset(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    working
                  }
                  style={
                    styles.primaryButton
                  }
                >
                  {working
                    ? "Adding..."
                    : "Add Asset"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* EDIT ASSET */}

        {editingAsset && (
          <div
            style={
              styles.inlinePanel
            }
          >
            <h2
              style={
                styles.panelTitle
              }
            >
              Edit Asset -{" "}
              {
                editingAsset.assetTag
              }
            </h2>

            <form
              onSubmit={
                updateAsset
              }
            >
              <AssetFormFields
                form={
                  editAsset
                }
                setForm={
                  setEditAsset
                }
              />

              <div
                style={
                  styles.formActions
                }
              >
                <button
                  type="button"
                  style={
                    styles.secondaryButton
                  }
                  onClick={() =>
                    setEditingAsset(
                      null
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    working
                  }
                  style={
                    styles.primaryButton
                  }
                >
                  {working
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===================================================
            ASSET TABLE
            =================================================== */}

        <div
          style={
            styles.tablePanel
          }
        >
          <div
            style={
              styles.filters
            }
          >
            <input
              style={
                styles.searchInput
              }
              placeholder="Search asset, brand, model, serial, employee..."
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
            />

            <select
              style={
                styles.filterSelect
              }
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event.target
                    .value
                )
              }
            >
              <option value="ALL">
                All Statuses
              </option>

              <option value="IN_STOCK">
                In Stock
              </option>

              <option value="ASSIGNED">
                Assigned
              </option>

              <option value="IN_REPAIR">
                In Repair
              </option>

              <option value="RETIRED">
                Retired
              </option>
            </select>

            <button
              type="button"
              style={
                styles.secondaryButton
              }
              onClick={() =>
                void loadData()
              }
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div
              style={
                styles.emptyState
              }
            >
              Loading assets...
            </div>
          ) : filteredAssets.length ===
            0 ? (
            <div
              style={
                styles.emptyState
              }
            >
              No assets found.
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
                      TAG
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      ASSET
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      CATEGORY
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      BRAND / MODEL
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      SERIAL
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      WARRANTY
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      STATUS
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      ASSIGNED TO
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      ACTIONS
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAssets.map(
                    (asset) => (
                      <Fragment
                        key={
                          asset.id
                        }
                      >
                        <tr>
                          {/* TAG */}

                          <td
                            style={
                              styles.td
                            }
                          >
                            <strong>
                              {
                                asset.assetTag
                              }
                            </strong>
                          </td>

                          {/* ASSET - HOVER */}

                          <td
                            style={{
                              ...styles.td,

                              cursor:
                                "pointer",
                            }}
                            onMouseEnter={(
                              event
                            ) =>
                              startHover(
                                asset,
                                event.clientX,
                                event.clientY
                              )
                            }
                            onMouseMove={(
                              event
                            ) =>
                              moveHover(
                                event.clientX,
                                event.clientY
                              )
                            }
                            onMouseLeave={
                              stopHover
                            }
                          >
                            <span
                              style={
                                styles.hoverableText
                              }
                            >
                              {
                                asset.name
                              }
                            </span>
                          </td>

                          {/* CATEGORY */}

                          <td
                            style={
                              styles.td
                            }
                          >
                            {
                              asset.category
                            }
                          </td>

                          {/* BRAND / MODEL - HOVER */}

                          <td
                            style={{
                              ...styles.td,

                              cursor:
                                "pointer",
                            }}
                            onMouseEnter={(
                              event
                            ) =>
                              startHover(
                                asset,
                                event.clientX,
                                event.clientY
                              )
                            }
                            onMouseMove={(
                              event
                            ) =>
                              moveHover(
                                event.clientX,
                                event.clientY
                              )
                            }
                            onMouseLeave={
                              stopHover
                            }
                          >
                            <strong
                              style={
                                styles.hoverableText
                              }
                            >
                              {asset.brand ||
                                "-"}
                            </strong>

                            <div
                              style={
                                styles.muted
                              }
                            >
                              {asset.model ||
                                "-"}
                            </div>
                          </td>

                          {/* SERIAL */}

                          <td
                            style={
                              styles.td
                            }
                          >
                            {
                              asset.serialNumber
                            }
                          </td>

                          {/* WARRANTY */}

                          <td
                            style={
                              styles.td
                            }
                          >
                            <span
                              style={{
                                ...styles.statusBadge,

                                ...warrantyStatusStyle(
                                  asset
                                ),
                              }}
                            >
                              {warrantyStatusText(
                                asset
                              )}
                            </span>

                            {asset.warrantyAvailable && (
                              <>
                                <div
                                  style={
                                    styles.muted
                                  }
                                >
                                  Expires:{" "}
                                  {formatDateOnly(
                                    asset.warrantyExpiryDate
                                  )}
                                </div>

                                <div
                                  style={
                                    styles.warrantyTableRemaining
                                  }
                                >
                                  {warrantyRemainingText(
                                    asset
                                  )}
                                </div>
                              </>
                            )}
                          </td>

                          {/* STATUS */}

                          <td
                            style={
                              styles.td
                            }
                          >
                            <span
                              style={{
                                ...styles.statusBadge,

                                ...statusStyle(
                                  asset.status
                                ),
                              }}
                            >
                              {statusText(
                                asset.status
                              )}
                            </span>
                          </td>

                          {/* ASSIGNED */}

                          <td
                            style={
                              styles.td
                            }
                          >
                            {getAssignedEmployeeName(
                              asset
                            )}
                          </td>

                          {/* =================================================
                              ACTIONS
                              EDIT | EYE | DELETE | DROPDOWN
                              ================================================= */}

                          <td
                            style={
                              styles.td
                            }
                          >
                            <div
                              style={
                                styles.actionButtons
                              }
                            >
                              {/* EDIT */}

                              <button
                                type="button"
                                style={
                                  styles.actionEditButton
                                }
                                title="Edit Asset"
                                aria-label={`Edit ${asset.assetTag}`}
                                onClick={() => {
                                  setOpenActionsId(
                                    null
                                  );

                                  openEditAsset(
                                    asset
                                  );
                                }}
                              >
                                <EditIcon />

                                <span>
                                  Edit
                                </span>
                              </button>

                              {/* VIEW HISTORY */}

                              <button
                                type="button"
                                style={
                                  styles.actionIconButton
                                }
                                title="View History"
                                aria-label={`View history for ${asset.assetTag}`}
                                onClick={() => {
                                  setOpenActionsId(
                                    null
                                  );

                                  void openHistory(
                                    asset
                                  );
                                }}
                              >
                                <EyeIcon />
                              </button>

                              {/* DELETE */}

                              <button
                                type="button"
                                disabled={
                                  asset.status ===
                                  "ASSIGNED"
                                }
                                style={{
                                  ...styles.actionDeleteButton,

                                  ...(asset.status ===
                                  "ASSIGNED"
                                    ? styles.actionDeleteButtonDisabled
                                    : {}),
                                }}
                                title={
                                  asset.status ===
                                  "ASSIGNED"
                                    ? "Return the asset before deleting it"
                                    : "Delete Asset"
                                }
                                aria-label={`Delete ${asset.assetTag}`}
                                onClick={() => {
                                  setOpenActionsId(
                                    null
                                  );

                                  void deleteAsset(
                                    asset
                                  );
                                }}
                              >
                                <TrashIcon />
                              </button>

                              {/* ACTIONS DROPDOWN */}

                              <div
                                style={
                                  styles.actionsMenuWrap
                                }
                              >
                                <button
                                  type="button"
                                  style={
                                    styles.actionsDropdownButton
                                  }
                                  aria-haspopup="menu"
                                  aria-expanded={
                                    openActionsId ===
                                    asset.id
                                  }
                                  onClick={(
                                    event
                                  ) => {
                                    if (
                                      openActionsId ===
                                      asset.id
                                    ) {
                                      setOpenActionsId(
                                        null
                                      );

                                      return;
                                    }

                                    const rect =
                                      event.currentTarget.getBoundingClientRect();

                                    const menuWidth =
                                      205;

                                    const menuHeight =
                                      220;

                                    const left =
                                      Math.max(
                                        8,

                                        Math.min(
                                          rect.right -
                                            menuWidth,

                                          window.innerWidth -
                                            menuWidth -
                                            8
                                        )
                                      );

                                    let top =
                                      rect.bottom +
                                      7;

                                    if (
                                      top +
                                        menuHeight >
                                      window.innerHeight -
                                        8
                                    ) {
                                      top =
                                        Math.max(
                                          8,

                                          rect.top -
                                            menuHeight -
                                            7
                                        );
                                    }

                                    setActionsMenuPosition({
                                      top,
                                      left,
                                    });

                                    setOpenActionsId(
                                      asset.id
                                    );
                                  }}
                                >
                                  <span>
                                    Actions
                                  </span>

                                  <ChevronDownIcon />
                                </button>

                                {openActionsId ===
                                  asset.id && (
                                  <div
                                    role="menu"
                                    style={{
                                      ...styles.actionsDropdownMenu,

                                      top:
                                        actionsMenuPosition.top,

                                      left:
                                        actionsMenuPosition.left,
                                    }}
                                  >
                                    {/* WARRANTY RENEWAL */}

                                    {asset.warrantyAvailable &&
                                      asset.warrantyExpiryDate &&
                                      (getWarrantyDaysLeft(
                                        asset.warrantyExpiryDate
                                      ) ??
                                        999999) <=
                                        30 && (
                                        <button
                                          type="button"
                                          role="menuitem"
                                          style={
                                            styles.actionsMenuItem
                                          }
                                          onClick={() => {
                                            setOpenActionsId(
                                              null
                                            );

                                            void openHistory(
                                              asset,
                                              true
                                            );
                                          }}
                                        >
                                          <span
                                            style={{
                                              ...styles.actionsMenuIcon,

                                              color:
                                                "#1467d2",
                                            }}
                                          >
                                            <WarrantyIcon />
                                          </span>

                                          <span>
                                            Renew Warranty
                                          </span>
                                        </button>
                                      )}

                                    {/* IN STOCK */}

                                    {asset.status ===
                                      "IN_STOCK" && (
                                      <>
                                        {/* ASSIGN */}

                                        <button
                                          type="button"
                                          role="menuitem"
                                          style={
                                            styles.actionsMenuItem
                                          }
                                          onClick={() => {
                                            setOpenActionsId(
                                              null
                                            );

                                            openAction(
                                              asset,
                                              "ASSIGN"
                                            );
                                          }}
                                        >
                                          <span
                                            style={{
                                              ...styles.actionsMenuIcon,

                                              color:
                                                "#1467d2",
                                            }}
                                          >
                                            <AssignIcon />
                                          </span>

                                          <span>
                                            Assign
                                          </span>
                                        </button>

                                        {/* REPAIR */}

                                        <button
                                          type="button"
                                          role="menuitem"
                                          style={
                                            styles.actionsMenuItem
                                          }
                                          onClick={() => {
                                            setOpenActionsId(
                                              null
                                            );

                                            openAction(
                                              asset,
                                              "REPAIR"
                                            );
                                          }}
                                        >
                                          <span
                                            style={{
                                              ...styles.actionsMenuIcon,

                                              color:
                                                "#d97706",
                                            }}
                                          >
                                            <RepairIcon />
                                          </span>

                                          <span>
                                            Repair
                                          </span>
                                        </button>

                                        {/* RETIRE */}

                                        <button
                                          type="button"
                                          role="menuitem"
                                          style={{
                                            ...styles.actionsMenuItem,

                                            ...styles.actionsMenuDangerItem,
                                          }}
                                          onClick={() => {
                                            setOpenActionsId(
                                              null
                                            );

                                            openAction(
                                              asset,
                                              "RETIRE"
                                            );
                                          }}
                                        >
                                          <span
                                            style={
                                              styles.actionsMenuIcon
                                            }
                                          >
                                            <RetireIcon />
                                          </span>

                                          <span>
                                            Retire
                                          </span>
                                        </button>
                                      </>
                                    )}

                                    {/* ASSIGNED */}

                                    {asset.status ===
                                      "ASSIGNED" && (
                                      <>
                                        {/* REPAIR */}

                                        <button
                                          type="button"
                                          role="menuitem"
                                          style={
                                            styles.actionsMenuItem
                                          }
                                          onClick={() => {
                                            setOpenActionsId(
                                              null
                                            );

                                            openAction(
                                              asset,
                                              "REPAIR"
                                            );
                                          }}
                                        >
                                          <span
                                            style={{
                                              ...styles.actionsMenuIcon,

                                              color:
                                                "#d97706",
                                            }}
                                          >
                                            <RepairIcon />
                                          </span>

                                          <span>
                                            Repair
                                          </span>
                                        </button>

                                        {/* RETURN */}

                                        <button
                                          type="button"
                                          role="menuitem"
                                          style={
                                            styles.actionsMenuItem
                                          }
                                          onClick={() => {
                                            setOpenActionsId(
                                              null
                                            );

                                            openAction(
                                              asset,
                                              "RETURN"
                                            );
                                          }}
                                        >
                                          <span
                                            style={{
                                              ...styles.actionsMenuIcon,

                                              color:
                                                "#1467d2",
                                            }}
                                          >
                                            <ReturnIcon />
                                          </span>

                                          <span>
                                            Return
                                          </span>
                                        </button>
                                      </>
                                    )}

                                    {/* IN REPAIR */}

                                    {asset.status ===
                                      "IN_REPAIR" && (
                                      <button
                                        type="button"
                                        role="menuitem"
                                        style={
                                          styles.actionsMenuItem
                                        }
                                        onClick={() => {
                                          setOpenActionsId(
                                            null
                                          );

                                          openAction(
                                            asset,
                                            "REPAIR_COMPLETE"
                                          );
                                        }}
                                      >
                                        <span
                                          style={{
                                            ...styles.actionsMenuIcon,

                                            color:
                                              "#16834b",
                                          }}
                                        >
                                          <ReturnIcon />
                                        </span>

                                        <span>
                                          Return from Repair
                                        </span>
                                      </button>
                                    )}

                                    {/* RETIRED */}

                                    {asset.status ===
                                      "RETIRED" &&
                                      !(
                                        asset.warrantyAvailable &&
                                        asset.warrantyExpiryDate &&
                                        (getWarrantyDaysLeft(
                                          asset.warrantyExpiryDate
                                        ) ??
                                          999999) <=
                                          30
                                      ) && (
                                        <div
                                          style={
                                            styles.actionsMenuEmpty
                                          }
                                        >
                                          No lifecycle actions available
                                        </div>
                                      )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* ACTION PANEL */}

                        {selectedAsset?.id ===
                          asset.id &&
                          actionType && (
                            <tr>
                              <td
                                colSpan={
                                  9
                                }
                                style={
                                  styles.expandedCell
                                }
                              >
                                <div
                                  style={
                                    styles.actionPanel
                                  }
                                >
                                  <div
                                    style={
                                      styles.actionHeader
                                    }
                                  >
                                    <div>
                                      <h3
                                        style={
                                          styles.actionTitle
                                        }
                                      >
                                        {actionTitle()}
                                      </h3>

                                      <div
                                        style={
                                          styles.actionAsset
                                        }
                                      >
                                        {
                                          asset.assetTag
                                        }{" "}
                                        -{" "}
                                        {
                                          asset.name
                                        }
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      style={
                                        styles.closeButton
                                      }
                                      onClick={
                                        closeAction
                                      }
                                    >
                                      ×
                                    </button>
                                  </div>

                                  {actionType ===
                                    "ASSIGN" && (
                                    <div
                                      style={
                                        styles.field
                                      }
                                    >
                                      <label
                                        style={
                                          styles.label
                                        }
                                      >
                                        Employee *
                                      </label>

                                      <select
                                        style={
                                          styles.input
                                        }
                                        value={
                                          employeeId
                                        }
                                        onChange={(
                                          event
                                        ) =>
                                          setEmployeeId(
                                            event
                                              .target
                                              .value
                                          )
                                        }
                                      >
                                        <option value="">
                                          Select employee
                                        </option>

                                        {employees.map(
                                          (
                                            employee
                                          ) => (
                                            <option
                                              key={
                                                employee.id
                                              }
                                              value={
                                                employee.id
                                              }
                                            >
                                              {
                                                employee.name
                                              }
                                            </option>
                                          )
                                        )}
                                      </select>
                                    </div>
                                  )}

                                  <div
                                    style={
                                      styles.field
                                    }
                                  >
                                    <label
                                      style={
                                        styles.label
                                      }
                                    >
                                      Reason *
                                    </label>

                                    <textarea
                                      style={
                                        styles.textarea
                                      }
                                      value={
                                        reason
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        setReason(
                                          event
                                            .target
                                            .value
                                        )
                                      }
                                      placeholder="Enter reason"
                                    />
                                  </div>

                                  <div
                                    style={
                                      styles.formActions
                                    }
                                  >
                                    <button
                                      type="button"
                                      style={
                                        styles.secondaryButton
                                      }
                                      onClick={
                                        closeAction
                                      }
                                    >
                                      Cancel
                                    </button>

                                    <button
                                      type="button"
                                      disabled={
                                        working
                                      }
                                      style={
                                        actionType ===
                                        "RETIRE"
                                          ? styles.dangerButton
                                          : styles.primaryButton
                                      }
                                      onClick={() =>
                                        void executeAction()
                                      }
                                    >
                                      {working
                                        ? "Processing..."
                                        : "Confirm"}
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                      </Fragment>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ===================================================
            HISTORY
            =================================================== */}

        {historyAsset && (
          <div
            style={
              styles.historyPanel
            }
          >
            <div
              style={
                styles.historyHeader
              }
            >
              <div>
                <h2
                  style={
                    styles.panelTitle
                  }
                >
                  Asset History
                </h2>

                <p
                  style={
                    styles.panelDescription
                  }
                >
                  {
                    historyAsset.assetTag
                  }{" "}
                  -{" "}
                  {
                    historyAsset.name
                  }
                </p>
              </div>

              <button
                type="button"
                style={
                  styles.closeButton
                }
                onClick={
                  closeHistory
                }
              >
                ×
              </button>
            </div>

            {historyLoading ? (
              <div
                style={
                  styles.emptyState
                }
              >
                Loading history...
              </div>
            ) : (
              <>
                {historyError && (
                  <div
                    style={
                      styles.errorMessage
                    }
                  >
                    {historyError}
                  </div>
                )}

                <HistorySection
                  title="Asset Details"
                  description="Complete information for this company asset."
                >
                  <div
                    style={
                      styles.detailsGrid
                    }
                  >
                    <DetailItem
                      label="Asset Tag"
                      value={
                        historyAsset.assetTag
                      }
                    />

                    <DetailItem
                      label="Asset Name"
                      value={
                        historyAsset.name
                      }
                    />

                    <DetailItem
                      label="Category"
                      value={
                        historyAsset.category
                      }
                    />

                    <DetailItem
                      label="Brand"
                      value={
                        historyAsset.brand
                      }
                    />

                    <DetailItem
                      label="Model"
                      value={
                        historyAsset.model
                      }
                    />

                    <DetailItem
                      label="Serial Number"
                      value={
                        historyAsset.serialNumber
                      }
                    />

                    <DetailItem
                      label="Status"
                      value={statusText(
                        historyAsset.status
                      )}
                    />

                    <DetailItem
                      label="Assigned To"
                      value={getAssignedEmployeeName(
                        historyAsset
                      )}
                    />

                    <DetailItem
                      label="Purchase Date"
                      value={formatDateOnly(
                        historyAsset.purchaseDate
                      )}
                    />

                    <DetailItem
                      label="Purchase Price"
                      value={formatMoney(
                        historyAsset.purchasePrice
                      )}
                    />

                    <DetailItem
                      label="Supplier"
                      value={
                        historyAsset.supplier
                      }
                    />
                  </div>

                  <div
                    style={
                      styles.specificationsBox
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
                        styles.detailValue
                      }
                    >
                      {historyAsset.specifications ||
                        "-"}
                    </div>
                  </div>
                </HistorySection>

                {/* WARRANTY */}

                <HistorySection
                  title="Warranty Details"
                  description="Current warranty coverage, expiry information and renewal."
                >
                  <div
                    style={
                      styles.warrantyTop
                    }
                  >
                    <div>
                      <span
                        style={{
                          ...styles.statusBadge,

                          ...warrantyStatusStyle(
                            historyAsset
                          ),
                        }}
                      >
                        {warrantyStatusText(
                          historyAsset
                        )}
                      </span>

                      {historyAsset.warrantyAvailable &&
                        historyAsset.warrantyExpiryDate && (
                          <div
                            style={
                              styles.historyWarrantyRemaining
                            }
                          >
                            {warrantyRemainingText(
                              historyAsset
                            )}
                          </div>
                        )}
                    </div>

                    <button
                      type="button"
                      style={
                        styles.smallPrimaryButton
                      }
                      onClick={() =>
                        openRenewWarranty(
                          historyAsset
                        )
                      }
                    >
                      Renew Warranty
                    </button>
                  </div>

                  {historyAsset.warrantyAvailable ? (
                    <div
                      style={
                        styles.detailsGrid
                      }
                    >
                      <DetailItem
                        label="Provider"
                        value={
                          historyAsset.warrantyProvider
                        }
                      />

                      <DetailItem
                        label="Reference"
                        value={
                          historyAsset.warrantyReference
                        }
                      />

                      <DetailItem
                        label="Start Date"
                        value={formatDateOnly(
                          historyAsset.warrantyStartDate
                        )}
                      />

                      <DetailItem
                        label="Period"
                        value={
                          historyAsset.warrantyPeriodMonths
                            ? `${historyAsset.warrantyPeriodMonths} months`
                            : "-"
                        }
                      />

                      <DetailItem
                        label="Expiry Date"
                        value={formatDateOnly(
                          historyAsset.warrantyExpiryDate
                        )}
                      />

                      <DetailItem
                        label="Remaining"
                        value={warrantyRemainingText(
                          historyAsset
                        )}
                      />
                    </div>
                  ) : (
                    <div
                      style={
                        styles.historyEmpty
                      }
                    >
                      No warranty
                      recorded.
                    </div>
                  )}

                  {/* RENEW FORM */}

                  {showRenewWarranty && (
                    <div
                      id="warranty-renewal-section"
                      style={
                        styles.renewPanel
                      }
                    >
                      <div
                        style={
                          styles.renewHeader
                        }
                      >
                        <div>
                          <h3
                            style={
                              styles.actionTitle
                            }
                          >
                            Renew Warranty
                          </h3>

                          <p
                            style={
                              styles.panelDescription
                            }
                          >
                            Renew warranty
                            for{" "}
                            <strong>
                              {
                                historyAsset.assetTag
                              }
                            </strong>
                          </p>
                        </div>

                        <button
                          type="button"
                          style={
                            styles.closeButton
                          }
                          onClick={() =>
                            setShowRenewWarranty(
                              false
                            )
                          }
                        >
                          ×
                        </button>
                      </div>

                      <div
                        style={
                          styles.formGrid
                        }
                      >
                        <div>
                          <label
                            style={
                              styles.label
                            }
                          >
                            New Start Date *
                          </label>

                          <input
                            type="date"
                            style={
                              styles.input
                            }
                            value={
                              renewWarrantyForm.newStartDate
                            }
                            onChange={(
                              event
                            ) =>
                              setRenewWarrantyForm({
                                ...renewWarrantyForm,

                                newStartDate:
                                  event
                                    .target
                                    .value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <label
                            style={
                              styles.label
                            }
                          >
                            Period (Months) *
                          </label>

                          <input
                            type="number"
                            min="1"
                            style={
                              styles.input
                            }
                            value={
                              renewWarrantyForm.periodMonths
                            }
                            onChange={(
                              event
                            ) =>
                              setRenewWarrantyForm({
                                ...renewWarrantyForm,

                                periodMonths:
                                  event
                                    .target
                                    .value,
                              })
                            }
                          />
                        </div>

                        <Field
                          label="Warranty Provider"
                          value={
                            renewWarrantyForm.provider
                          }
                          placeholder="Dell"
                          onChange={(
                            value
                          ) =>
                            setRenewWarrantyForm({
                              ...renewWarrantyForm,

                              provider:
                                value,
                            })
                          }
                        />

                        <Field
                          label="Warranty Reference"
                          value={
                            renewWarrantyForm.warrantyReference
                          }
                          placeholder="DELL-WAR-002"
                          onChange={(
                            value
                          ) =>
                            setRenewWarrantyForm({
                              ...renewWarrantyForm,

                              warrantyReference:
                                value,
                            })
                          }
                        />

                        <div>
                          <label
                            style={
                              styles.label
                            }
                          >
                            Renewal Cost (₹)
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            style={
                              styles.input
                            }
                            value={
                              renewWarrantyForm.renewalCost
                            }
                            onChange={(
                              event
                            ) =>
                              setRenewWarrantyForm({
                                ...renewWarrantyForm,

                                renewalCost:
                                  event
                                    .target
                                    .value,
                              })
                            }
                          />
                        </div>

                        <div
                          style={
                            styles.fullWidth
                          }
                        >
                          <label
                            style={
                              styles.label
                            }
                          >
                            Notes
                          </label>

                          <textarea
                            style={
                              styles.textarea
                            }
                            value={
                              renewWarrantyForm.notes
                            }
                            onChange={(
                              event
                            ) =>
                              setRenewWarrantyForm({
                                ...renewWarrantyForm,

                                notes:
                                  event
                                    .target
                                    .value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div
                        style={
                          styles.formActions
                        }
                      >
                        <button
                          type="button"
                          style={
                            styles.secondaryButton
                          }
                          onClick={() =>
                            setShowRenewWarranty(
                              false
                            )
                          }
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          disabled={
                            working
                          }
                          style={
                            styles.primaryButton
                          }
                          onClick={() =>
                            void renewWarranty()
                          }
                        >
                          {working
                            ? "Renewing..."
                            : "Renew Warranty"}
                        </button>
                      </div>
                    </div>
                  )}
                </HistorySection>

                {/* WARRANTY HISTORY */}

                <HistorySection
                  title="Warranty History"
                  description="Previous warranty renewals for this asset."
                >
                  {warrantyHistory.length ===
                  0 ? (
                    <div
                      style={
                        styles.historyEmpty
                      }
                    >
                      No warranty renewal
                      history.
                    </div>
                  ) : (
                    <HistoryTable>
                      <thead>
                        <tr>
                          <HistoryTh>
                            Previous Expiry
                          </HistoryTh>

                          <HistoryTh>
                            New Start
                          </HistoryTh>

                          <HistoryTh>
                            New Expiry
                          </HistoryTh>

                          <HistoryTh>
                            Period
                          </HistoryTh>

                          <HistoryTh>
                            Provider
                          </HistoryTh>

                          <HistoryTh>
                            Cost
                          </HistoryTh>

                          <HistoryTh>
                            Renewed By
                          </HistoryTh>

                          <HistoryTh>
                            Renewed At
                          </HistoryTh>
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
                              <HistoryTd>
                                {formatDateOnly(
                                  item.previousExpiryDate
                                )}
                              </HistoryTd>

                              <HistoryTd>
                                {formatDateOnly(
                                  item.newStartDate
                                )}
                              </HistoryTd>

                              <HistoryTd>
                                {formatDateOnly(
                                  item.newExpiryDate
                                )}
                              </HistoryTd>

                              <HistoryTd>
                                {
                                  item.periodMonths
                                }{" "}
                                months
                              </HistoryTd>

                              <HistoryTd>
                                {item.provider ||
                                  "-"}
                              </HistoryTd>

                              <HistoryTd>
                                {formatMoney(
                                  item.renewalCost
                                )}
                              </HistoryTd>

                              <HistoryTd>
                                {
                                  item.renewedBy
                                }
                              </HistoryTd>

                              <HistoryTd>
                                {formatDate(
                                  item.renewedAt
                                )}
                              </HistoryTd>
                            </tr>
                          )
                        )}
                      </tbody>
                    </HistoryTable>
                  )}
                </HistorySection>

                {/* LIFECYCLE */}

                <HistorySection
                  title="Lifecycle History"
                  description="Every lifecycle status change with actor, reason and timestamp."
                >
                  {lifecycleHistory.length ===
                  0 ? (
                    <div
                      style={
                        styles.historyEmpty
                      }
                    >
                      No lifecycle
                      history.
                    </div>
                  ) : (
                    <HistoryTable>
                      <thead>
                        <tr>
                          <HistoryTh>
                            Date
                          </HistoryTh>

                          <HistoryTh>
                            Previous
                          </HistoryTh>

                          <HistoryTh>
                            New Status
                          </HistoryTh>

                          <HistoryTh>
                            Reason
                          </HistoryTh>

                          <HistoryTh>
                            Changed By
                          </HistoryTh>
                        </tr>
                      </thead>

                      <tbody>
                        {lifecycleHistory.map(
                          (
                            item
                          ) => (
                            <tr
                              key={
                                item.id
                              }
                            >
                              <HistoryTd>
                                {formatDate(
                                  item.occurredAt
                                )}
                              </HistoryTd>

                              <HistoryTd>
                                {statusText(
                                  item.previousStatus
                                )}
                              </HistoryTd>

                              <HistoryTd>
                                {statusText(
                                  item.newStatus
                                )}
                              </HistoryTd>

                              <HistoryTd>
                                {
                                  item.reason
                                }
                              </HistoryTd>

                              <HistoryTd>
                                {
                                  item.actor
                                }
                              </HistoryTd>
                            </tr>
                          )
                        )}
                      </tbody>
                    </HistoryTable>
                  )}
                </HistorySection>

                {/* ASSIGNMENT */}

                <HistorySection
                  title="Assignment History"
                  description="Asset assignment and return history."
                >
                  {assignmentHistory.length ===
                  0 ? (
                    <div
                      style={
                        styles.historyEmpty
                      }
                    >
                      No assignment
                      history.
                    </div>
                  ) : (
                    <HistoryTable>
                      <thead>
                        <tr>
                          <HistoryTh>
                            Employee
                          </HistoryTh>

                          <HistoryTh>
                            Assigned
                          </HistoryTh>

                          <HistoryTh>
                            Reason
                          </HistoryTh>

                          <HistoryTh>
                            Assigned By
                          </HistoryTh>

                          <HistoryTh>
                            Returned
                          </HistoryTh>

                          <HistoryTh>
                            Return Reason
                          </HistoryTh>
                        </tr>
                      </thead>

                      <tbody>
                        {assignmentHistory.map(
                          (
                            item
                          ) => (
                            <tr
                              key={
                                item.id
                              }
                            >
                              <HistoryTd>
                                {
                                  item.employeeName
                                }
                              </HistoryTd>

                              <HistoryTd>
                                {formatDate(
                                  item.assignedAt
                                )}
                              </HistoryTd>

                              <HistoryTd>
                                {
                                  item.reason
                                }
                              </HistoryTd>

                              <HistoryTd>
                                {
                                  item.assignedBy
                                }
                              </HistoryTd>

                              <HistoryTd>
                                {formatDate(
                                  item.returnedAt
                                )}
                              </HistoryTd>

                              <HistoryTd>
                                {item.returnReason ||
                                  "-"}
                              </HistoryTd>
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
        )}

        {/* ===================================================
            FLOATING HOVER CARD
            =================================================== */}

        {hoveredAsset && (
          <div
            style={{
              ...styles.assetHoverCard,

              left:
                typeof window !==
                "undefined"
                  ? Math.max(
                      12,

                      Math.min(
                        hoverPosition.x +
                          18,

                        window.innerWidth -
                          365
                      )
                    )
                  : hoverPosition.x,

              top:
                typeof window !==
                "undefined"
                  ? Math.max(
                      12,

                      Math.min(
                        hoverPosition.y +
                          18,

                        window.innerHeight -
                          430
                      )
                    )
                  : hoverPosition.y,
            }}
          >
            <div
              style={
                styles.hoverHeader
              }
            >
              <div>
                <div
                  style={
                    styles.hoverAssetName
                  }
                >
                  {
                    hoveredAsset.name
                  }
                </div>

                <div
                  style={
                    styles.hoverAssetTag
                  }
                >
                  {
                    hoveredAsset.assetTag
                  }
                </div>
              </div>

              <span
                style={{
                  ...styles.statusBadge,

                  ...statusStyle(
                    hoveredAsset.status
                  ),
                }}
              >
                {statusText(
                  hoveredAsset.status
                )}
              </span>
            </div>

            <div
              style={
                styles.hoverDivider
              }
            />

            <div
              style={
                styles.hoverDetailsGrid
              }
            >
              <HoverDetail
                label="Category"
                value={
                  hoveredAsset.category
                }
              />

              <HoverDetail
                label="Brand"
                value={
                  hoveredAsset.brand ||
                  "-"
                }
              />

              <HoverDetail
                label="Model"
                value={
                  hoveredAsset.model ||
                  "-"
                }
              />

              <HoverDetail
                label="Serial Number"
                value={
                  hoveredAsset.serialNumber
                }
              />

              <HoverDetail
                label="Assigned To"
                value={getAssignedEmployeeName(
                  hoveredAsset
                )}
              />

              <HoverDetail
                label="Warranty"
                value={warrantyStatusText(
                  hoveredAsset
                )}
              />
            </div>

            <div
              style={
                styles.hoverSection
              }
            >
              <div
                style={
                  styles.hoverLabel
                }
              >
                Specifications
              </div>

              <div
                style={
                  styles.hoverSpecification
                }
              >
                {hoveredAsset.specifications ||
                  "No specifications available"}
              </div>
            </div>

            {hoveredAsset.warrantyAvailable && (
              <div
                style={
                  styles.hoverWarranty
                }
              >
                <div>
                  <strong>
                    Warranty:
                  </strong>{" "}
                  {warrantyRemainingText(
                    hoveredAsset
                  )}
                </div>

                <div
                  style={{
                    marginTop:
                      "4px",
                  }}
                >
                  <strong>
                    Expiry:
                  </strong>{" "}
                  {formatDateOnly(
                    hoveredAsset.warrantyExpiryDate
                  )}
                </div>

                {hoveredAsset.warrantyProvider && (
                  <div
                    style={{
                      marginTop:
                        "4px",
                    }}
                  >
                    <strong>
                      Provider:
                    </strong>{" "}
                    {
                      hoveredAsset.warrantyProvider
                    }
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* =========================================================
   PAYLOAD
   ========================================================= */

function buildAssetPayload(
  form: AssetForm,
  purchaseOrderId?: string | null
) {
  return {
    assetTag:
      form.assetTag.trim(),

    name:
      form.name.trim(),

    category:
      form.category.trim(),

    brand:
      form.brand.trim() ||
      null,

    model:
      form.model.trim() ||
      null,

    serialNumber:
      form.serialNumber.trim(),

    specifications:
      form.specifications.trim() ||
      null,

    purchaseDate:
      form.purchaseDate ||
      null,

    purchasePrice:
      form.purchasePrice
        ? Number(
            form.purchasePrice
          )
        : null,

    supplier:
      form.supplier.trim() ||
      null,

    warrantyAvailable:
      form.warrantyAvailable,

    warrantyStartDate:
      form.warrantyAvailable
        ? form.warrantyStartDate ||
          null
        : null,

    warrantyPeriodMonths:
      form.warrantyAvailable
        ? Number(
            form.warrantyPeriodMonths
          )
        : null,

    warrantyProvider:
      form.warrantyAvailable
        ? form.warrantyProvider.trim() ||
          null
        : null,

    warrantyReference:
      form.warrantyAvailable
        ? form.warrantyReference.trim() ||
          null
        : null,

    purchaseOrderId:
        purchaseOrderId || null,
    };
}

/* =========================================================
   ASSET FORM
   ========================================================= */

function AssetFormFields({
  form,
  setForm,
}: {
  form: AssetForm;

  setForm: (
    value: AssetForm
  ) => void;
}) {
  return (
    <>
      <div
        style={
          styles.formGrid
        }
      >
        <Field
          label="Asset Tag *"
          value={
            form.assetTag
          }
          placeholder="LAP-01"
          onChange={(
            value
          ) =>
            setForm({
              ...form,

              assetTag:
                value,
            })
          }
        />

        <Field
          label="Asset Name *"
          value={
            form.name
          }
          placeholder="Dell Latitude"
          onChange={(
            value
          ) =>
            setForm({
              ...form,

              name:
                value,
            })
          }
        />

        <div>
          <label
            style={
              styles.label
            }
          >
            Category *
          </label>

          <select
            style={
              styles.input
            }
            value={
              form.category
            }
            onChange={(
              event
            ) =>
              setForm({
                ...form,

                category:
                  event.target
                    .value,
              })
            }
          >
            {categories.map(
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
        </div>

        <Field
          label="Brand / Company"
          value={
            form.brand
          }
          placeholder="Dell"
          onChange={(
            value
          ) =>
            setForm({
              ...form,

              brand:
                value,
            })
          }
        />

        <Field
          label="Model"
          value={
            form.model
          }
          placeholder="Latitude 5440"
          onChange={(
            value
          ) =>
            setForm({
              ...form,

              model:
                value,
            })
          }
        />

        <Field
          label="Serial Number *"
          value={
            form.serialNumber
          }
          placeholder="DL001"
          onChange={(
            value
          ) =>
            setForm({
              ...form,

              serialNumber:
                value,
            })
          }
        />

        <div
          style={
            styles.fullWidth
          }
        >
          <label
            style={
              styles.label
            }
          >
            Specifications
          </label>

          <textarea
            style={
              styles.textarea
            }
            placeholder="Intel Core i7, 16GB RAM, 512GB SSD"
            value={
              form.specifications
            }
            onChange={(
              event
            ) =>
              setForm({
                ...form,

                specifications:
                  event.target
                    .value,
              })
            }
          />
        </div>

        <div>
          <label
            style={
              styles.label
            }
          >
            Purchase Date
          </label>

          <input
            type="date"
            style={
              styles.input
            }
            value={
              form.purchaseDate
            }
            onChange={(
              event
            ) =>
              setForm({
                ...form,

                purchaseDate:
                  event.target
                    .value,
              })
            }
          />
        </div>

        <div>
          <label
            style={
              styles.label
            }
          >
            Purchase Price (₹)
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            style={
              styles.input
            }
            value={
              form.purchasePrice
            }
            onChange={(
              event
            ) =>
              setForm({
                ...form,

                purchasePrice:
                  event.target
                    .value,
              })
            }
          />
        </div>

        <div
          style={
            styles.fullWidth
          }
        >
          <Field
            label="Supplier / Vendor"
            value={
              form.supplier
            }
            placeholder="Dell Authorized Partner"
            onChange={(
              value
            ) =>
              setForm({
                ...form,

                supplier:
                  value,
              })
            }
          />
        </div>
      </div>

      {/* WARRANTY */}

      <div
        style={
          styles.sectionDivider
        }
      >
        <div>
          <h3
            style={
              styles.sectionTitle
            }
          >
            Warranty
          </h3>

          <p
            style={
              styles.panelDescription
            }
          >
            Record warranty details
            for this asset.
          </p>
        </div>

        <label
          style={
            styles.checkboxLabel
          }
        >
          <input
            type="checkbox"
            checked={
              form.warrantyAvailable
            }
            onChange={(
              event
            ) =>
              setForm({
                ...form,

                warrantyAvailable:
                  event.target
                    .checked,
              })
            }
          />

          Warranty Available
        </label>
      </div>

      {form.warrantyAvailable && (
        <div
          style={
            styles.formGrid
          }
        >
          <div>
            <label
              style={
                styles.label
              }
            >
              Warranty Start Date *
            </label>

            <input
              type="date"
              style={
                styles.input
              }
              value={
                form.warrantyStartDate
              }
              onChange={(
                event
              ) =>
                setForm({
                  ...form,

                  warrantyStartDate:
                    event.target
                      .value,
                })
              }
            />
          </div>

          <div>
            <label
              style={
                styles.label
              }
            >
              Warranty Period
              (Months) *
            </label>

            <input
              type="number"
              min="1"
              max="240"
              style={
                styles.input
              }
              value={
                form.warrantyPeriodMonths
              }
              onChange={(
                event
              ) =>
                setForm({
                  ...form,

                  warrantyPeriodMonths:
                    event.target
                      .value,
                })
              }
            />
          </div>

          <Field
            label="Warranty Provider"
            value={
              form.warrantyProvider
            }
            placeholder="Dell"
            onChange={(
              value
            ) =>
              setForm({
                ...form,

                warrantyProvider:
                  value,
              })
            }
          />

          <Field
            label="Warranty Reference"
            value={
              form.warrantyReference
            }
            placeholder="DELL-WAR-001"
            onChange={(
              value
            ) =>
              setForm({
                ...form,

                warrantyReference:
                  value,
              })
            }
          />
        </div>
      )}
    </>
  );
}

/* =========================================================
   COMPONENTS
   ========================================================= */

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;

  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <label
        style={
          styles.label
        }
      >
        {label}
      </label>

      <input
        style={
          styles.input
        }
        value={
          value
        }
        placeholder={
          placeholder
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
      />
    </div>
  );
}

function HoverDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div
        style={
          styles.hoverLabel
        }
      >
        {label}
      </div>

      <div
        style={
          styles.hoverValue
        }
      >
        {value}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div
      style={
        styles.statCard
      }
    >
      <div
        style={
          styles.statTitle
        }
      >
        {title}
      </div>

      <div
        style={
          styles.statValue
        }
      >
        {value}
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;

  value?:
    | string
    | number
    | null;
}) {
  return (
    <div
      style={
        styles.detailItem
      }
    >
      <span
        style={
          styles.detailLabel
        }
      >
        {label}
      </span>

      <strong
        style={
          styles.detailValue
        }
      >
        {value === null ||
        value === undefined ||
        value === ""
          ? "-"
          : value}
      </strong>
    </div>
  );
}

function HistorySection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div
      style={
        styles.historySection
      }
    >
      <h3
        style={
          styles.sectionTitle
        }
      >
        {title}
      </h3>

      <p
        style={
          styles.panelDescription
        }
      >
        {description}
      </p>

      {children}
    </div>
  );
}

function HistoryTable({
  children,
}: {
  children: ReactNode;
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

function HistoryTh({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th
      style={
        styles.historyTh
      }
    >
      {children}
    </th>
  );
}

function HistoryTd({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <td
      style={
        styles.historyTd
      }
    >
      {children}
    </td>
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

    minHeight:
      "100vh",

    background:
      "#f4f7fb",
  },

  main: {
    flex: 1,

    minWidth: 0,

    padding:
      "34px 32px 60px",
  },

  header: {
    display: "flex",

    alignItems:
      "center",

    justifyContent:
      "space-between",

    gap: "20px",

    marginBottom:
      "25px",
  },

  headerButtons: {
    display: "flex",

    gap: "10px",

    flexWrap:
      "wrap",
  },

  title: {
    margin: 0,

    fontSize:
      "34px",

    fontWeight:
      800,

    color:
      "#0b2239",
  },

  subtitle: {
    margin:
      "6px 0 0",

    color:
      "#718096",

    fontSize:
      "15px",
  },

  /* SUMMARY */

  statsGrid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(5, minmax(130px, 1fr))",

    gap: "14px",

    marginBottom:
      "22px",
  },

  statCard: {
    background:
      "#ffffff",

    border:
      "1px solid #dde5ef",

    borderRadius:
      "14px",

    padding:
      "18px",
  },

  statTitle: {
    color:
      "#718096",

    fontSize:
      "13px",
  },

  statValue: {
    marginTop:
      "7px",

    color:
      "#0b2239",

    fontSize:
      "28px",

    fontWeight:
      800,
  },

  /* WARRANTY ALERTS */

  warrantyAlertPanel: {
    background:
      "#ffffff",

    border:
      "1px solid #e5e7eb",

    borderRadius:
      "14px",

    padding:
      "22px",

    marginBottom:
      "24px",

    boxShadow:
      "0 1px 3px rgba(0,0,0,0.06)",
  },

  warrantyAlertHeader: {
    display: "flex",

    justifyContent:
      "space-between",

    alignItems:
      "flex-start",

    gap: "20px",

    flexWrap:
      "wrap",

    marginBottom:
      "20px",
  },

  warrantyAlertTitle: {
    margin: 0,

    fontSize:
      "20px",

    fontWeight:
      700,

    color:
      "#172b4d",
  },

  warrantyAlertDescription: {
    margin:
      "6px 0 0",

    fontSize:
      "14px",

    color:
      "#6b778c",
  },

  warrantyAlertCounts: {
    display: "flex",

    gap: "10px",

    flexWrap:
      "wrap",
  },

  expiredCountBadge: {
    padding:
      "8px 12px",

    borderRadius:
      "8px",

    background:
      "#fff1f0",

    color:
      "#cf1322",

    fontSize:
      "13px",

    fontWeight:
      600,
  },

  sevenDayBadge: {
    padding:
      "8px 12px",

    borderRadius:
      "8px",

    background:
      "#fff7e6",

    color:
      "#ad4e00",

    fontSize:
      "13px",

    fontWeight:
      600,
  },

  thirtyDayBadge: {
    padding:
      "8px 12px",

    borderRadius:
      "8px",

    background:
      "#fffbe6",

    color:
      "#ad6800",

    fontSize:
      "13px",

    fontWeight:
      600,
  },

  warrantyLoading: {
    padding:
      "20px",

    textAlign:
      "center",

    color:
      "#6b778c",
  },

  noWarrantyAlerts: {
    padding:
      "20px",

    background:
      "#f6ffed",

    border:
      "1px solid #b7eb8f",

    borderRadius:
      "10px",

    color:
      "#389e0d",

    fontSize:
      "14px",

    fontWeight:
      600,
  },

  warrantyAlertList: {
    display: "flex",

    flexDirection:
      "column",

    gap: "10px",
  },

  warrantyAlertRow: {
    display: "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    gap: "20px",

    padding:
      "14px 16px",

    borderRadius:
      "10px",

    flexWrap:
      "wrap",
  },

  warrantyAssetSide: {
    display: "flex",

    alignItems:
      "center",

    gap: "12px",
  },

  warrantyAlertDot: {
    width:
      "10px",

    height:
      "10px",

    borderRadius:
      "50%",

    flexShrink: 0,
  },

  warrantyAssetName: {
    fontSize:
      "15px",

    fontWeight:
      700,

    color:
      "#172b4d",
  },

  warrantyAssetMeta: {
    marginTop:
      "4px",

    fontSize:
      "13px",

    color:
      "#6b778c",
  },

  warrantyMessageSide: {
    textAlign:
      "right",
  },

  warrantyMessage: {
    fontSize:
      "14px",

    fontWeight:
      700,
  },

  warrantyExpiryText: {
    marginTop:
      "4px",

    fontSize:
      "12px",

    color:
      "#6b778c",
  },

  renewAlertButton: {
    marginTop:
      "10px",

    border:
      "none",

    borderRadius:
      "7px",

    padding:
      "8px 14px",

    background:
      "#1677e8",

    color:
      "#ffffff",

    fontSize:
      "12px",

    fontWeight:
      700,

    cursor:
      "pointer",
  },

  warrantyTableRemaining: {
    marginTop:
      "5px",

    fontSize:
      "11px",

    fontWeight:
      700,

    color:
      "#5b6f84",
  },

  /* PANELS */

  inlinePanel: {
    background:
      "#ffffff",

    border:
      "1px solid #dce5ef",

    borderRadius:
      "14px",

    padding:
      "24px",

    marginBottom:
      "22px",
  },

  panelTitle: {
    margin: 0,

    color:
      "#0b2239",

    fontSize:
      "21px",
  },

  panelDescription: {
    margin:
      "5px 0 16px",

    color:
      "#718096",

    fontSize:
      "13px",

    lineHeight:
      1.5,
  },

  formGrid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",

    gap: "17px",
  },

  fullWidth: {
    gridColumn:
      "1 / -1",
  },

  label: {
    display:
      "block",

    fontSize:
      "13px",

    fontWeight:
      700,

    color:
      "#34495e",

    marginBottom:
      "7px",
  },

  input: {
    width:
      "100%",

    boxSizing:
      "border-box",

    border:
      "1px solid #d5dfeb",

    borderRadius:
      "9px",

    padding:
      "11px 13px",

    fontSize:
      "14px",

    background:
      "#ffffff",

    color:
      "#172b3f",
  },

  textarea: {
    width:
      "100%",

    minHeight:
      "90px",

    boxSizing:
      "border-box",

    border:
      "1px solid #d5dfeb",

    borderRadius:
      "9px",

    padding:
      "11px 13px",

    fontSize:
      "14px",

    fontFamily:
      "inherit",

    resize:
      "vertical",
  },

  sectionDivider: {
    display: "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    gap: "20px",

    margin:
      "24px 0 18px",

    paddingTop:
      "20px",

    borderTop:
      "1px solid #e2e8f0",
  },

  sectionTitle: {
    margin:
      "0 0 6px",

    color:
      "#0b2239",

    fontSize:
      "17px",
  },

  checkboxLabel: {
    display: "flex",

    alignItems:
      "center",

    gap: "8px",

    fontSize:
      "14px",

    fontWeight:
      700,

    color:
      "#22384d",
  },

  formActions: {
    display: "flex",

    justifyContent:
      "flex-end",

    gap: "10px",

    marginTop:
      "20px",
  },

  primaryButton: {
    border:
      "none",

    borderRadius:
      "9px",

    padding:
      "11px 17px",

    background:
      "#1677e8",

    color:
      "#ffffff",

    fontWeight:
      700,

    cursor:
      "pointer",
  },

  secondaryButton: {
    border:
      "1px solid #d5dfeb",

    borderRadius:
      "9px",

    padding:
      "10px 16px",

    background:
      "#ffffff",

    color:
      "#22384d",

    fontWeight:
      600,

    cursor:
      "pointer",
  },

  dangerButton: {
    border:
      "none",

    borderRadius:
      "9px",

    padding:
      "11px 17px",

    background:
      "#d64545",

    color:
      "#ffffff",

    fontWeight:
      700,

    cursor:
      "pointer",
  },

  errorMessage: {
    background:
      "#fff1f1",

    color:
      "#b42318",

    border:
      "1px solid #f5c2c0",

    borderRadius:
      "10px",

    padding:
      "13px 16px",

    marginBottom:
      "18px",
  },

  successMessage: {
    background:
      "#edf9f2",

    color:
      "#147a45",

    border:
      "1px solid #bde7ce",

    borderRadius:
      "10px",

    padding:
      "13px 16px",

    marginBottom:
      "18px",
  },

  /* TABLE */

  tablePanel: {
    background:
      "#ffffff",

    border:
      "1px solid #dce5ef",

    borderRadius:
      "14px",

    overflow:
      "hidden",
  },

  filters: {
    display: "flex",

    gap: "12px",

    flexWrap:
      "wrap",

    padding:
      "20px",

    borderBottom:
      "1px solid #e5ebf2",
  },

  searchInput: {
    width:
      "330px",

    maxWidth:
      "100%",

    border:
      "1px solid #d5dfeb",

    borderRadius:
      "9px",

    padding:
      "11px 13px",

    fontSize:
      "14px",
  },

  filterSelect: {
    minWidth:
      "150px",

    border:
      "1px solid #d5dfeb",

    borderRadius:
      "9px",

    padding:
      "11px 13px",

    background:
      "#ffffff",
  },

  tableWrapper: {
    overflowX:
      "auto",
  },

  table: {
    width:
      "100%",

    minWidth:
      "1450px",

    borderCollapse:
      "collapse",
  },

  th: {
    textAlign:
      "left",

    background:
      "#f7f9fc",

    color:
      "#60738a",

    fontSize:
      "11px",

    padding:
      "14px",

    borderBottom:
      "1px solid #e2e8f0",

    whiteSpace:
      "nowrap",
  },

  td: {
    padding:
      "14px",

    color:
      "#22384d",

    fontSize:
      "13px",

    borderBottom:
      "1px solid #edf1f5",

    verticalAlign:
      "middle",
  },

  hoverableText: {
    borderBottom:
      "1px dashed #9cb2c7",
  },

  statusBadge: {
    display:
      "inline-block",

    padding:
      "6px 10px",

    borderRadius:
      "20px",

    fontSize:
      "11px",

    fontWeight:
      700,

    whiteSpace:
      "nowrap",
  },

  /* =========================================================
     NEW ACTION BUTTONS
     ========================================================= */

  actionButtons: {
    display:
      "flex",

    alignItems:
      "center",

    flexWrap:
      "nowrap",

    gap:
      "8px",

    whiteSpace:
      "nowrap",
  },

  actionEditButton: {
    height:
      "36px",

    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      "6px",

    padding:
      "0 12px",

    border:
      "1px solid #b9d4f4",

    borderRadius:
      "8px",

    background:
      "#ffffff",

    color:
      "#1467d2",

    fontWeight:
      700,

    fontSize:
      "12px",

    cursor:
      "pointer",
  },

  actionIconButton: {
    width:
      "40px",

    height:
      "36px",

    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    padding: 0,

    border:
      "1px solid #b9d4f4",

    borderRadius:
      "8px",

    background:
      "#ffffff",

    color:
      "#1467d2",

    cursor:
      "pointer",
  },

  actionDeleteButton: {
    width:
      "40px",

    height:
      "36px",

    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    padding: 0,

    border:
      "1px solid #ffc8c8",

    borderRadius:
      "8px",

    background:
      "#fff7f7",

    color:
      "#e03131",

    cursor:
      "pointer",
  },

  actionDeleteButtonDisabled: {
    opacity:
      0.38,

    cursor:
      "not-allowed",
  },

  actionsMenuWrap: {
    position:
      "relative",

    display:
      "inline-block",
  },

  actionsDropdownButton: {
    height:
      "36px",

    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      "7px",

    padding:
      "0 12px",

    border:
      "1px solid #8bbcf3",

    borderRadius:
      "8px",

    background:
      "#ffffff",

    color:
      "#1467d2",

    fontWeight:
      700,

    fontSize:
      "12px",

    cursor:
      "pointer",
  },

  actionsDropdownMenu: {
    position:
      "fixed",

    zIndex:
      5000,

    width:
      "205px",

    padding:
      "7px",

    background:
      "#ffffff",

    border:
      "1px solid #dce5ef",

    borderRadius:
      "10px",

    boxShadow:
      "0 12px 30px rgba(15, 42, 68, 0.18)",
  },

  actionsMenuItem: {
    width:
      "100%",

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "11px",

    border:
      "none",

    borderRadius:
      "7px",

    padding:
      "10px 11px",

    background:
      "transparent",

    color:
      "#22384d",

    fontSize:
      "13px",

    fontWeight:
      600,

    textAlign:
      "left",

    cursor:
      "pointer",
  },

  actionsMenuDangerItem: {
    color:
      "#bd3434",
  },

  actionsMenuIcon: {
    width:
      "18px",

    height:
      "18px",

    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    flexShrink: 0,
  },

  actionsMenuEmpty: {
    padding:
      "10px 11px",

    color:
      "#7b8da0",

    fontSize:
      "12px",

    lineHeight:
      1.4,
  },

  smallPrimaryButton: {
    border:
      "none",

    borderRadius:
      "7px",

    padding:
      "7px 10px",

    background:
      "#1677e8",

    color:
      "#ffffff",

    fontWeight:
      600,

    fontSize:
      "12px",

    cursor:
      "pointer",
  },

  smallRenewButton: {
    border:
      "1px solid #1677e8",

    borderRadius:
      "7px",

    padding:
      "7px 10px",

    background:
      "#eef6ff",

    color:
      "#1677e8",

    fontWeight:
      700,

    fontSize:
      "12px",

    cursor:
      "pointer",
  },

  smallButton: {
    border:
      "1px solid #d4deea",

    borderRadius:
      "7px",

    padding:
      "7px 10px",

    background:
      "#ffffff",

    color:
      "#274158",

    fontWeight:
      600,

    fontSize:
      "12px",

    cursor:
      "pointer",
  },

  smallDangerButton: {
    border:
      "1px solid #f0c7c7",

    borderRadius:
      "7px",

    padding:
      "7px 10px",

    background:
      "#fff5f5",

    color:
      "#bd3434",

    fontWeight:
      600,

    fontSize:
      "12px",

    cursor:
      "pointer",
  },

  smallHistoryButton: {
    border:
      "1px solid #b9d4f4",

    borderRadius:
      "7px",

    padding:
      "7px 10px",

    background:
      "#eef6ff",

    color:
      "#1467d2",

    fontWeight:
      700,

    fontSize:
      "12px",

    cursor:
      "pointer",
  },

  expandedCell: {
    padding:
      "0 16px 18px",

    background:
      "#f8fbff",
  },

  actionPanel: {
    maxWidth:
      "760px",

    background:
      "#ffffff",

    border:
      "1px solid #cfe0f4",

    borderLeft:
      "4px solid #1677e8",

    borderRadius:
      "10px",

    padding:
      "20px",

    marginTop:
      "5px",
  },

  actionHeader: {
    display:
      "flex",

    justifyContent:
      "space-between",

    gap:
      "20px",
  },

  actionTitle: {
    margin: 0,

    color:
      "#0b2239",

    fontSize:
      "18px",
  },

  actionAsset: {
    marginTop:
      "5px",

    color:
      "#1677e8",

    fontWeight:
      700,
  },

  closeButton: {
    width:
      "34px",

    height:
      "34px",

    border:
      "1px solid #dce4ed",

    borderRadius:
      "8px",

    background:
      "#ffffff",

    color:
      "#5f7184",

    fontSize:
      "21px",

    cursor:
      "pointer",
  },

  field: {
    marginTop:
      "16px",
  },

  /* HISTORY */

  historyPanel: {
    marginTop:
      "24px",

    background:
      "#ffffff",

    border:
      "1px solid #cfe0f4",

    borderLeft:
      "4px solid #1677e8",

    borderRadius:
      "14px",

    padding:
      "24px",
  },

  historyHeader: {
    display:
      "flex",

    justifyContent:
      "space-between",

    gap:
      "20px",
  },

  historySection: {
    marginTop:
      "28px",

    paddingTop:
      "20px",

    borderTop:
      "1px solid #e7edf4",
  },

  detailsGrid: {
    display:
      "grid",

    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",

    gap:
      "12px",
  },

  detailItem: {
    minHeight:
      "58px",

    padding:
      "11px 12px",

    borderRadius:
      "8px",

    background:
      "#f8fbff",

    border:
      "1px solid #e6ecf3",

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      "5px",
  },

  detailLabel: {
    color:
      "#718096",

    fontSize:
      "11px",

    fontWeight:
      700,

    textTransform:
      "uppercase",
  },

  detailValue: {
    color:
      "#17334d",

    fontSize:
      "13px",

    lineHeight:
      1.5,
  },

  specificationsBox: {
    marginTop:
      "12px",

    padding:
      "13px",

    borderRadius:
      "8px",

    background:
      "#f8fbff",

    border:
      "1px solid #e6ecf3",
  },

  warrantyTop: {
    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    gap:
      "10px",

    marginBottom:
      "14px",
  },

  historyWarrantyRemaining: {
    marginTop:
      "8px",

    color:
      "#52677d",

    fontSize:
      "13px",

    fontWeight:
      700,
  },

  renewPanel: {
    marginTop:
      "20px",

    padding:
      "20px",

    borderRadius:
      "12px",

    border:
      "2px solid #1677e8",

    background:
      "#f8fbff",

    scrollMarginTop:
      "30px",
  },

  renewHeader: {
    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "flex-start",

    gap:
      "20px",
  },

  historyTableWrapper: {
    width:
      "100%",

    overflowX:
      "auto",

    border:
      "1px solid #e2e8f0",

    borderRadius:
      "9px",
  },

  historyTable: {
    width:
      "100%",

    minWidth:
      "1000px",

    borderCollapse:
      "collapse",
  },

  historyTh: {
    textAlign:
      "left",

    background:
      "#f7f9fc",

    color:
      "#60738a",

    fontSize:
      "11px",

    padding:
      "11px 12px",

    borderBottom:
      "1px solid #e2e8f0",

    whiteSpace:
      "nowrap",
  },

  historyTd: {
    padding:
      "12px",

    color:
      "#22384d",

    fontSize:
      "12px",

    borderBottom:
      "1px solid #edf1f5",

    verticalAlign:
      "top",
  },

  historyEmpty: {
    padding:
      "18px",

    background:
      "#f8fbff",

    border:
      "1px dashed #d5dfeb",

    borderRadius:
      "8px",

    color:
      "#718096",
  },

  emptyState: {
    textAlign:
      "center",

    color:
      "#7b8da1",

    padding:
      "50px 20px",
  },

  muted: {
    marginTop:
      "4px",

    color:
      "#8b9bad",

    fontSize:
      "11px",
  },

  /* =========================================================
     HOVER CARD
     ========================================================= */

  assetHoverCard: {
    position:
      "fixed",

    zIndex:
      99999,

    width:
      "330px",

    maxWidth:
      "calc(100vw - 30px)",

    background:
      "#ffffff",

    border:
      "1px solid #dbe5ef",

    borderRadius:
      "12px",

    padding:
      "16px",

    boxShadow:
      "0 12px 35px rgba(15, 35, 55, 0.20)",

    pointerEvents:
      "none",
  },

  hoverHeader: {
    display:
      "flex",

    alignItems:
      "flex-start",

    justifyContent:
      "space-between",

    gap:
      "12px",
  },

  hoverAssetName: {
    fontSize:
      "16px",

    fontWeight:
      800,

    color:
      "#0b2239",
  },

  hoverAssetTag: {
    marginTop:
      "3px",

    fontSize:
      "12px",

    fontWeight:
      700,

    color:
      "#1677e8",
  },

  hoverDivider: {
    height:
      "1px",

    background:
      "#e7edf4",

    margin:
      "13px 0",
  },

  hoverDetailsGrid: {
    display:
      "grid",

    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",

    gap:
      "12px",
  },

  hoverLabel: {
    fontSize:
      "10px",

    fontWeight:
      700,

    color:
      "#8392a5",

    textTransform:
      "uppercase",

    marginBottom:
      "3px",
  },

  hoverValue: {
    fontSize:
      "13px",

    fontWeight:
      600,

    color:
      "#22384d",

    wordBreak:
      "break-word",
  },

  hoverSection: {
    marginTop:
      "14px",

    paddingTop:
      "12px",

    borderTop:
      "1px solid #edf1f5",
  },

  hoverSpecification: {
    fontSize:
      "12px",

    lineHeight:
      1.55,

    color:
      "#52677d",
  },

  hoverWarranty: {
    marginTop:
      "14px",

    padding:
      "10px 12px",

    background:
      "#f7faff",

    border:
      "1px solid #dce8f5",

    borderRadius:
      "8px",

    fontSize:
      "12px",

    lineHeight:
      1.4,

    color:
      "#3b5268",
  },
};