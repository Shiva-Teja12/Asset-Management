"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import Side from "@/components/Side";
import { api } from "@/lib/api";

import type { CSSProperties } from "react";
function getErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === "string") {
    return error;
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
/* =========================================================
   TYPES
   ========================================================= */

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

type RequestFilter =
  | "ALL"
  | "MANAGER_APPROVED"
  | "PENDING_ASSIGNMENT"
  | "PENDING_PROCUREMENT"
  | "FULFILLED";

type CurrentAsset = {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  status: AssetStatus;
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

  managerComment?: string | null;

  reviewedById?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;

  assignedAssetId?: string | null;
  assignedAssetTag?: string | null;
  assignedAssetName?: string | null;

  requestedAt?: string | null;
  fulfilledAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;

  currentAssets?: CurrentAsset[];
};

type AssetResponse = {
  id: string;

  assetTag: string;
  name: string;
  category: string;

  brand?: string | null;
  model?: string | null;

  serialNumber?: string | null;
  specifications?: string | null;

  status: AssetStatus;

  assignedToName?: string | null;
  assignedToEmployeeId?: string | null;
};

type OnboardingAssetRequest = {
  id: string;

  requestNumber?: string | null;

  employeeName: string;
  employeeEmail?: string | null;
  employeeCode?: string | null;

  department?: string | null;
  designation?: string | null;

  joiningDate?: string | null;

  deviceCategory: string;
  quantity: number;

  specifications?: string | null;

  estimatedCost?: number | null;

  businessJustification?: string | null;

  status: string;

  createdByEmail?: string | null;
  createdByName?: string | null;

  assetAdminEmail?: string | null;
  assetAdminComment?: string | null;
  assetAdminReviewedAt?: string | null;

  financeEmail?: string | null;
  financeComment?: string | null;
  financeReviewedAt?: string | null;

  vpEmail?: string | null;
  vpComment?: string | null;
  vpReviewedAt?: string | null;

  assignedAssetId?: string | null;
  allocatedAt?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
};

/*
 * Response returned by:
 *
 * GET
 * /api/v1/onboarding/requests/{id}/asset-admin/stock-check
 */
type OnboardingStockResponse = {
  requestId: string;
  requestNumber?: string | null;

  employeeName: string;
  employeeEmail?: string | null;

  category: string;

  requiredQuantity: number;
  availableQuantity: number;
  shortageQuantity: number;

  stockAvailable: boolean;

  availableAssets: OnboardingAvailableAsset[];
};

type OnboardingAvailableAsset = {
  id: string;
  assetTag: string;
  name: string;
  category: string;

  brand?: string | null;
  model?: string | null;

  serialNumber?: string | null;
  specifications?: string | null;
};

/* =========================================================
   PAGE
   ========================================================= */

export default function AssetRequestsPage() {
  const router = useRouter();

  /* =======================================================
     SECONDARY DEVICE STATE
     ======================================================= */

  const [requests, setRequests] = useState<
    SecondaryDeviceRequest[]
  >([]);

  const [selectedRequest, setSelectedRequest] =
    useState<SecondaryDeviceRequest | null>(null);

  const [availableAssets, setAvailableAssets] =
    useState<AssetResponse[]>([]);

  const [selectedAssetId, setSelectedAssetId] =
    useState("");

  const [filter, setFilter] =
    useState<RequestFilter>("ALL");

  const [search, setSearch] =
    useState("");

  const [modalLoading, setModalLoading] =
    useState(false);

  const [processing, setProcessing] =
    useState(false);

  const [assigning, setAssigning] =
    useState(false);

  /* =======================================================
     ONBOARDING STATE
     ======================================================= */

  const [
    onboardingRequests,
    setOnboardingRequests,
  ] = useState<OnboardingAssetRequest[]>([]);

  const [
    selectedOnboarding,
    setSelectedOnboarding,
  ] =
    useState<OnboardingAssetRequest | null>(
      null
    );

  const [
    onboardingSearch,
    setOnboardingSearch,
  ] = useState("");

  const [
    onboardingComment,
    setOnboardingComment,
  ] = useState("");

  const [
    forwardingToVp,
    setForwardingToVp,
  ] = useState(false);

  const [
    onboardingError,
    setOnboardingError,
  ] = useState("");

  const [
    onboardingSuccess,
    setOnboardingSuccess,
  ] = useState("");

  /*
   * NEW ONBOARDING STOCK STATE
   */

  const [
    onboardingStock,
    setOnboardingStock,
  ] =
    useState<OnboardingStockResponse | null>(
      null
    );

  const [
    selectedOnboardingAssetId,
    setSelectedOnboardingAssetId,
  ] = useState("");

  const [
    checkingOnboardingStock,
    setCheckingOnboardingStock,
  ] = useState(false);

  const [
    allocatingOnboardingAsset,
    setAllocatingOnboardingAsset,
  ] = useState(false);

  const [
    raisingPurchaseRequest,
    setRaisingPurchaseRequest,
  ] = useState(false);
  const [
    assetEstimatedCost,
    setAssetEstimatedCost,
  ] = useState("");
    const [
      sendingOnboardingPrToFinance,
      setSendingOnboardingPrToFinance,
    ] = useState(false);
const [
  sendingToVendor,
  setSendingToVendor,
] = useState(false);
const [
  markingDelivered,
  setMarkingDelivered,
] = useState(false);
const [
  passingInspection,
  setPassingInspection,
] = useState(false);

const [
  failingInspection,
  setFailingInspection,
] = useState(false);
/*
 * VENDOR PURCHASE ORDER DETAILS
 */

const [
  vendorBrand,
  setVendorBrand,
] = useState("");

const [
  vendorModel,
  setVendorModel,
] = useState("");

const [
  vendorSupplier,
  setVendorSupplier,
] = useState("");
  /* =======================================================
     COMMON STATE
     ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* =========================================================
     AUTH CHECK
     ========================================================= */

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    const role =
      localStorage.getItem("role");

    if (!token) {
      router.replace("/");
      return;
    }

    if (
      role &&
      role !== "ASSET_ADMIN" &&
      role !== "admin"
    ) {
      router.replace("/");
    }
  }, [router]);

  /* =========================================================
     LOAD ALL REQUESTS
     ========================================================= */

  const loadRequests =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const [
          secondaryResult,
          onboardingResult,
        ] = await Promise.allSettled([
          api<SecondaryDeviceRequest[]>(
            "/api/v1/admin/secondary-device-requests"
          ),

          api<OnboardingAssetRequest[]>(
            "/api/v1/onboarding/requests/asset-admin"
          ),
        ]);

        /* SECONDARY DEVICE */

        if (
          secondaryResult.status ===
          "fulfilled"
        ) {
          setRequests(
            Array.isArray(
              secondaryResult.value
            )
              ? secondaryResult.value
              : []
          );
        } else {
          setRequests([]);
        }

        /* ONBOARDING */

        if (
          onboardingResult.status ===
          "fulfilled"
        ) {
          setOnboardingRequests(
            Array.isArray(
              onboardingResult.value
            )
              ? onboardingResult.value
              : []
          );
        } else {
          setOnboardingRequests([]);
        }

        /* BOTH FAILED */

        if (
          secondaryResult.status ===
            "rejected" &&
          onboardingResult.status ===
            "rejected"
        ) {
          throw secondaryResult.reason;
        }

        /* ONLY ONBOARDING FAILED */

        if (
          onboardingResult.status ===
          "rejected"
        ) {
          setError(
            getErrorMessage(
              onboardingResult.reason,
              "Secondary requests loaded, but new joiner requests could not be loaded."
            )
          );
        } else if (
          secondaryResult.status ===
          "rejected"
        ) {
          setError(
            getErrorMessage(
              secondaryResult.reason,
              "New joiner requests loaded, but secondary-device requests could not be loaded."
            )
          );
        }
      } catch (err) {
        setError(
          getErrorMessage(
            err,
            "Unable to load asset requests."
          )
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  /* =========================================================
     ONBOARDING COUNTS
     ========================================================= */

  const newJoinerCount =
    onboardingRequests.length;

  const pendingAssetAdminCount =
    onboardingRequests.filter(
      (request) =>
        request.status ===
        "PENDING_ASSET_ADMIN"
    ).length;

  /* =========================================================
     SECONDARY DEVICE COUNTS
     ========================================================= */

  const approvedCount =
    requests.filter(
      (request) =>
        request.status ===
        "MANAGER_APPROVED"
    ).length;

  const assignmentCount =
    requests.filter(
      (request) =>
        request.status ===
        "PENDING_ASSIGNMENT"
    ).length;

  const procurementCount =
    requests.filter(
      (request) =>
        request.status ===
        "PENDING_PROCUREMENT"
    ).length;

  const fulfilledCount =
    requests.filter(
      (request) =>
        request.status ===
        "FULFILLED"
    ).length;

  /* =========================================================
     FILTER SECONDARY REQUESTS
     ========================================================= */

  const filteredRequests =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return requests.filter(
        (request) => {
          const matchesFilter =
            filter === "ALL" ||
            request.status === filter;

          if (!matchesFilter) {
            return false;
          }

          if (!searchValue) {
            return true;
          }

          const values = [
            request.employeeName,
            request.employeeCode,
            request.department,
            request.category,
            request.reason,
            request.managerName,
            request.status,
            request.assignedAssetTag,
            request.assignedAssetName,
          ];

          return values.some(
            (value) =>
              String(value ?? "")
                .toLowerCase()
                .includes(
                  searchValue
                )
          );
        }
      );
    }, [
      requests,
      search,
      filter,
    ]);

  /* =========================================================
     FILTER ONBOARDING REQUESTS
     ========================================================= */

  const filteredOnboardingRequests =
    useMemo(() => {
      const value =
        onboardingSearch
          .trim()
          .toLowerCase();

      if (!value) {
        return onboardingRequests;
      }

      return onboardingRequests.filter(
        (request) =>
          [
            request.requestNumber,
            request.employeeName,
            request.employeeEmail,
            request.employeeCode,
            request.department,
            request.deviceCategory,
            request.status,
          ].some((item) =>
            String(item ?? "")
              .toLowerCase()
              .includes(value)
          )
      );
    }, [
      onboardingRequests,
      onboardingSearch,
    ]);

  /* =========================================================
     OPEN ONBOARDING REQUEST
     ========================================================= */

  function openOnboardingRequest(
    request: OnboardingAssetRequest
  ) {
    setOnboardingError("");
    setOnboardingSuccess("");

    setOnboardingStock(null);
    setSelectedOnboardingAssetId("");

    setOnboardingComment(
      request.assetAdminComment ??
        ""
    );

    setSelectedOnboarding(
      request
    );
  }

  /* =========================================================
     CLOSE ONBOARDING REQUEST
     ========================================================= */

  function closeOnboardingModal() {
    if (
      forwardingToVp ||
      checkingOnboardingStock ||
      allocatingOnboardingAsset ||
      raisingPurchaseRequest
    ) {
      return;
    }

    setSelectedOnboarding(null);
    setOnboardingComment("");

    setOnboardingStock(null);
    setSelectedOnboardingAssetId("");

    setOnboardingError("");
    setOnboardingSuccess("");
  }

  /* =========================================================
     FORWARD ONBOARDING REQUEST TO VP
     ========================================================= */

  async function forwardToVp() {
    if (!selectedOnboarding) {
      return;
    }

    if (
      selectedOnboarding.status !==
      "PENDING_ASSET_ADMIN"
    ) {
      setOnboardingError(
        "Only requests pending Asset Admin review can be forwarded to VP."
      );
      return;
    }

    try {
      setForwardingToVp(true);

      setOnboardingError("");
      setOnboardingSuccess("");

      const response =
        await api<OnboardingAssetRequest>(
          `/api/v1/onboarding/requests/${selectedOnboarding.id}/asset-admin/forward-to-vp`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              comment:
                onboardingComment
                  .trim() ||
                null,
            }),
          }
        );

      setSelectedOnboarding(
        response
      );

      setOnboardingComment("");

      setOnboardingSuccess(
        "Request forwarded to VP / Higher Authority successfully."
      );

      await loadRequests();
    } catch (err) {
      setOnboardingError(
        getErrorMessage(
          err,
          "Unable to forward this request to VP."
        )
      );
    } finally {
      setForwardingToVp(false);
    }
  }

  /* =========================================================
     CHECK ONBOARDING INVENTORY STOCK
     ========================================================= */

  async function checkOnboardingStock() {
    if (!selectedOnboarding) {
      return;
    }

    if (
      selectedOnboarding.status !==
      "PENDING_STOCK_CHECK"
    ) {
      setOnboardingError(
        "Stock can only be checked when the request is pending stock check."
      );
      return;
    }

    try {
      setCheckingOnboardingStock(true);

      setOnboardingError("");
      setOnboardingSuccess("");

      setOnboardingStock(null);
      setSelectedOnboardingAssetId("");

      const response =
        await api<OnboardingStockResponse>(
          `/api/v1/onboarding/requests/${selectedOnboarding.id}/asset-admin/stock-check`
        );

      const normalized: OnboardingStockResponse = {
        ...response,
        availableAssets:
          Array.isArray(
            response.availableAssets
          )
            ? response.availableAssets
            : [],
      };

      setOnboardingStock(
        normalized
      );

      /*
       * If there is exactly one available asset,
       * automatically select it.
       */
      if (
        normalized.availableAssets
          .length === 1
      ) {
        setSelectedOnboardingAssetId(
          normalized.availableAssets[0]
            .id
        );
      }

      if (
        normalized.stockAvailable
      ) {
        setOnboardingSuccess(
          `${normalized.availableQuantity} matching ${normalized.category} asset(s) are currently available. Select an asset and allocate it to ${normalized.employeeName}.`
        );
      } else {
        setOnboardingSuccess(
          `Insufficient stock. Required: ${normalized.requiredQuantity}, Available: ${normalized.availableQuantity}, Shortage: ${normalized.shortageQuantity}.`
        );
      }
    } catch (err) {
      setOnboardingError(
        getErrorMessage(
          err,
          "Unable to check inventory stock."
        )
      );
    } finally {
      setCheckingOnboardingStock(false);
    }
  }

  /* =========================================================
     ALLOCATE ONBOARDING ASSET
     ========================================================= */

  async function allocateOnboardingAsset() {
    if (!selectedOnboarding) {
      return;
    }

    if (!onboardingStock) {
      setOnboardingError(
        "Please check inventory stock first."
      );
      return;
    }

    if (
      !onboardingStock.stockAvailable
    ) {
      setOnboardingError(
        "There is not enough stock to allocate this request."
      );
      return;
    }

    if (
      !selectedOnboardingAssetId
    ) {
      setOnboardingError(
        "Please select an asset first."
      );
      return;
    }

    try {
      setAllocatingOnboardingAsset(
        true
      );

      setOnboardingError("");
      setOnboardingSuccess("");

      const response =
        await api<OnboardingAssetRequest>(
          `/api/v1/onboarding/requests/${selectedOnboarding.id}/asset-admin/allocate`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              assetId:
                selectedOnboardingAssetId,
            }),
          }
        );

      setSelectedOnboarding(
        response
      );

      setOnboardingStock(null);
      setSelectedOnboardingAssetId("");

      setOnboardingSuccess(
        `Asset allocated to ${response.employeeName} successfully.`
      );

      await loadRequests();
    } catch (err) {
      setOnboardingError(
        getErrorMessage(
          err,
          "Unable to allocate the selected asset."
        )
      );
    } finally {
      setAllocatingOnboardingAsset(
        false
      );
    }
  }

  /* =========================================================
     RAISE PURCHASE REQUEST
     ========================================================= */

  async function raiseOnboardingPurchaseRequest() {
    if (!selectedOnboarding) {
      return;
    }

    if (
      selectedOnboarding.status !==
      "PENDING_STOCK_CHECK"
    ) {
      setOnboardingError(
        "A purchase request can only be raised after the request reaches stock check."
      );
      return;
    }
const estimatedCost =
  Number(assetEstimatedCost);

if (
  !Number.isFinite(estimatedCost) ||
  estimatedCost <= 0
) {
  setOnboardingError(
    "Please enter a valid estimated price per unit."
  );
  return;
}
    if (
      onboardingStock &&
      onboardingStock.stockAvailable
    ) {
      setOnboardingError(
        "Sufficient stock is available. Allocate an existing asset instead of raising a purchase request."
      );
      return;
    }

    try {
      setRaisingPurchaseRequest(
        true
      );

      setOnboardingError("");
      setOnboardingSuccess("");

      const response =
        await api<OnboardingAssetRequest>(
          `/api/v1/onboarding/requests/${selectedOnboarding.id}/asset-admin/raise-pr`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              estimatedCost:
                estimatedCost,
            }),
          }
        );

      setSelectedOnboarding(
        response
      );

      setOnboardingStock(null);
      setSelectedOnboardingAssetId("");

      setOnboardingSuccess(
        "Purchase request raised successfully."
      );

      await loadRequests();
    } catch (err) {
      setOnboardingError(
        getErrorMessage(
          err,
          "Unable to raise the purchase request."
        )
      );
    } finally {
      setRaisingPurchaseRequest(
        false
      );
    }
  }
  /* =========================================================
     SEND PURCHASE REQUEST TO FINANCE
     ========================================================= */

  async function sendOnboardingPrToFinance() {
    if (!selectedOnboarding) {
      return;
    }

    if (selectedOnboarding.status !== "PR_REQUIRED") {
      setOnboardingError(
        "This purchase request is not ready to be sent to Finance."
      );
      return;
    }

    try {
      setSendingOnboardingPrToFinance(true);

      setOnboardingError("");
      setOnboardingSuccess("");

      const response =
        await api<OnboardingAssetRequest>(
          `/api/v1/onboarding/requests/${selectedOnboarding.id}/asset-admin/send-pr-to-finance`,
          {
            method: "POST",
          }
        );

      setSelectedOnboarding(response);

      setOnboardingStock(null);
      setSelectedOnboardingAssetId("");

      setOnboardingSuccess(
        "Purchase request sent to Finance successfully."
      );

      await loadRequests();
    } catch (err) {
      setOnboardingError(
        getErrorMessage(
          err,
          "Unable to send the purchase request to Finance."
        )
      );
    } finally {
      setSendingOnboardingPrToFinance(false);
    }
  }
  /* =========================================================
     SEND PURCHASE REQUEST TO VENDOR
     ========================================================= */
async function sendOnboardingToVendor() {
  if (!selectedOnboarding) {
    return;
  }

  if (
    selectedOnboarding.status !==
    "PENDING_VENDOR_ORDER"
  ) {
    setOnboardingError(
      "This purchase request is not ready for vendor ordering."
    );
    return;
  }

  const brand = vendorBrand.trim();
  const model = vendorModel.trim();
  const supplier = vendorSupplier.trim();

  if (!brand) {
    setOnboardingError(
      "Please enter the Brand / Company."
    );
    return;
  }

  if (!model) {
    setOnboardingError(
      "Please enter the Model."
    );
    return;
  }

  if (!supplier) {
    setOnboardingError(
      "Please enter the Supplier / Vendor."
    );
    return;
  }

  const quantity =
    selectedOnboarding.quantity ?? 1;

  const pricePerUnit =
    selectedOnboarding.estimatedCost ?? 0;

  if (pricePerUnit <= 0) {
    setOnboardingError(
      "A valid estimated cost is required before placing the vendor order."
    );
    return;
  }

  try {
    setSendingToVendor(true);

    setOnboardingError("");
    setOnboardingSuccess("");

    /*
     * STEP 1:
     * Create the actual purchase order and link it
     * to this onboarding request.
     */
    await api(
      "/api/v1/purchase-orders",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          onboardingRequestId:
            selectedOnboarding.id,

          category:
            selectedOnboarding.deviceCategory,

          currentAvailableStock: 0,

          requiredAvailableStock:
            quantity,

          quantityNeeded:
            quantity,

          brand,

          model,

          specifications:
            selectedOnboarding.specifications?.trim() ||
            "As per onboarding asset requirement",

          quantityOrdered:
            quantity,

          pricePerUnit,

          supplier,

          reason:
            selectedOnboarding.businessJustification?.trim() ||
            `Onboarding asset purchase for ${selectedOnboarding.employeeName}`,
        }),
      }
    );

    /*
     * STEP 2:
     * Purchase order was created successfully.
     * Now move the onboarding workflow to ORDER_PLACED.
     */
    const response =
      await api<OnboardingAssetRequest>(
        `/api/v1/onboarding/requests/${selectedOnboarding.id}/asset-admin/send-to-vendor`,
        {
          method: "POST",
        }
      );

    setSelectedOnboarding(response);

    setVendorBrand("");
    setVendorModel("");
    setVendorSupplier("");

    setOnboardingSuccess(
      "Purchase order created and vendor order placed successfully."
    );

    await loadRequests();
  } catch (err) {
    setOnboardingError(
      getErrorMessage(
        err,
        "Unable to create or place the vendor order."
      )
    );
  } finally {
    setSendingToVendor(false);
  }
}
/* =========================================================
   MARK VENDOR ORDER AS DELIVERED
   ========================================================= */

async function markOnboardingDelivered() {
  if (!selectedOnboarding) {
    return;
  }

  if (
    selectedOnboarding.status !==
    "ORDER_PLACED"
  ) {
    setOnboardingError(
      "This vendor order is not ready to be marked as delivered."
    );
    return;
  }

  try {
    setMarkingDelivered(true);

    setOnboardingError("");
    setOnboardingSuccess("");

    const response =
      await api<OnboardingAssetRequest>(
        `/api/v1/onboarding/requests/${selectedOnboarding.id}/asset-admin/delivered`,
        {
          method: "POST",
        }
      );

    setSelectedOnboarding(response);

    setOnboardingSuccess(
      "Vendor delivery received successfully. The asset is now ready for inspection."
    );

    await loadRequests();
  } catch (err) {
    setOnboardingError(
      getErrorMessage(
        err,
        "Unable to mark the vendor order as delivered."
      )
    );
  } finally {
    setMarkingDelivered(false);
  }
}
/* =========================================================
   INSPECTION PASSED
   ========================================================= */

async function passOnboardingInspection() {
  if (!selectedOnboarding) {
    return;
  }

  if (selectedOnboarding.status !== "PENDING_INSPECTION") {
    setOnboardingError(
      "This asset is not waiting for inspection."
    );
    return;
  }

  try {
    setPassingInspection(true);

    setOnboardingError("");
    setOnboardingSuccess("");

    const response =
      await api<OnboardingAssetRequest>(
        `/api/v1/onboarding/requests/${selectedOnboarding.id}/asset-admin/inspection/pass`,
        {
          method: "POST",
        }
      );

    setSelectedOnboarding(response);

    setOnboardingSuccess(
      "Asset inspection passed successfully. The asset is ready for allocation."
    );

    await loadRequests();
  } catch (err) {
    setOnboardingError(
      getErrorMessage(
        err,
        "Unable to mark the inspection as passed."
      )
    );
  } finally {
    setPassingInspection(false);
  }
}

/* =========================================================
   INSPECTION FAILED
   ========================================================= */

async function failOnboardingInspection() {
  if (!selectedOnboarding) {
    return;
  }

  if (selectedOnboarding.status !== "PENDING_INSPECTION") {
    setOnboardingError(
      "This asset is not waiting for inspection."
    );
    return;
  }

  try {
    setFailingInspection(true);

    setOnboardingError("");
    setOnboardingSuccess("");

    const response =
      await api<OnboardingAssetRequest>(
        `/api/v1/onboarding/requests/${selectedOnboarding.id}/asset-admin/inspection/fail`,
        {
          method: "POST",
        }
      );

    setSelectedOnboarding(response);

    setOnboardingSuccess(
      "Asset inspection has been marked as failed."
    );

    await loadRequests();
  } catch (err) {
    setOnboardingError(
      getErrorMessage(
        err,
        "Unable to mark the inspection as failed."
      )
    );
  } finally {
    setFailingInspection(false);
  }
}
  /* =========================================================
     OPEN SECONDARY DEVICE REQUEST
     ========================================================= */


  async function openRequest(
    requestId: string
  ) {
    try {
      setModalLoading(true);

      setError("");
      setSuccess("");

      setAvailableAssets([]);
      setSelectedAssetId("");

      const response =
        await api<SecondaryDeviceRequest>(
          `/api/v1/admin/secondary-device-requests/${requestId}`
        );

      setSelectedRequest(
        response
      );

      if (
        response.status ===
          "PENDING_ASSIGNMENT" ||
        response.status ===
          "PENDING_PROCUREMENT"
      ) {
        await loadAvailableAssets(
          requestId
        );
      }
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to load request."
        )
      );
    } finally {
      setModalLoading(false);
    }
  }

  /* =========================================================
     AVAILABLE ASSETS - SECONDARY DEVICE
     ========================================================= */

  async function loadAvailableAssets(
    requestId: string
  ) {
    try {
      const response =
        await api<AssetResponse[]>(
          `/api/v1/admin/secondary-device-requests/${requestId}/available-assets`
        );

      const list =
        Array.isArray(response)
          ? response
          : [];

      setAvailableAssets(
        list
      );

      if (
        list.length === 1
      ) {
        setSelectedAssetId(
          list[0].id
        );
      }
    } catch (err) {
      setAvailableAssets([]);

      throw err;
    }
  }

  /* =========================================================
     PROCESS SECONDARY REQUEST
     ========================================================= */

  async function processRequest() {
    if (!selectedRequest) {
      return;
    }

    try {
      setProcessing(true);

      setError("");
      setSuccess("");

      const response =
        await api<SecondaryDeviceRequest>(
          `/api/v1/admin/secondary-device-requests/${selectedRequest.id}/process`,
          {
            method: "POST",
          }
        );

      setSelectedRequest(
        response
      );

      await loadAvailableAssets(
        selectedRequest.id
      );

      await loadRequests();

      if (
        response.status ===
        "PENDING_ASSIGNMENT"
      ) {
        setSuccess(
          "Stock is available. Select an asset and assign it to the employee."
        );
      } else if (
        response.status ===
        "PENDING_PROCUREMENT"
      ) {
        setSuccess(
          "No matching asset is currently in stock. This request is pending procurement."
        );
      }
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to process request."
        )
      );
    } finally {
      setProcessing(false);
    }
  }

  /* =========================================================
     RECHECK SECONDARY STOCK
     ========================================================= */

  async function recheckStock() {
    if (!selectedRequest) {
      return;
    }

    try {
      setProcessing(true);

      setError("");
      setSuccess("");

      const response =
        await api<SecondaryDeviceRequest>(
          `/api/v1/admin/secondary-device-requests/${selectedRequest.id}/process`,
          {
            method: "POST",
          }
        );

      setSelectedRequest(
        response
      );

      await loadAvailableAssets(
        selectedRequest.id
      );

      await loadRequests();

      if (
        response.status ===
        "PENDING_ASSIGNMENT"
      ) {
        setSuccess(
          "Stock is now available. Select an asset below."
        );
      } else {
        setSuccess(
          "Matching stock is still unavailable."
        );
      }
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to recheck stock."
        )
      );
    } finally {
      setProcessing(false);
    }
  }

  /* =========================================================
     ASSIGN SECONDARY DEVICE
     ========================================================= */

  async function assignAsset() {
    if (!selectedRequest) {
      return;
    }

    if (!selectedAssetId) {
      setError(
        "Please select an asset first."
      );
      return;
    }

    try {
      setAssigning(true);

      setError("");
      setSuccess("");

      const response =
        await api<SecondaryDeviceRequest>(
          `/api/v1/admin/secondary-device-requests/${selectedRequest.id}/assign`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              assetId:
                selectedAssetId,
            }),
          }
        );

      setSelectedRequest(
        response
      );

      setAvailableAssets([]);
      setSelectedAssetId("");

      await loadRequests();

      setSuccess(
        "Secondary device assigned successfully."
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to assign the asset."
        )
      );
    } finally {
      setAssigning(false);
    }
  }

  /* =========================================================
     CLOSE SECONDARY MODAL
     ========================================================= */

  function closeModal() {
    setSelectedRequest(null);

    setAvailableAssets([]);

    setSelectedAssetId("");

    setError("");
    setSuccess("");
  }
    /* =========================================================
       UI
       ========================================================= */

    return (
      <div style={styles.page}>
        <Side role="admin" />

        <main style={styles.main}>
          {/* =================================================
              HEADER
              ================================================= */}

          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>
                Asset Requests
              </h1>

              <p style={styles.subtitle}>
                Review new joiner asset requests and process
                manager-approved secondary device requests.
              </p>
            </div>

            <button
              type="button"
              style={styles.refreshButton}
              onClick={() => void loadRequests()}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {/* =================================================
              PAGE ERROR
              ================================================= */}

          {error &&
            !selectedRequest &&
            !selectedOnboarding && (
              <div style={styles.errorBox}>
                {error}
              </div>
            )}

          {/* =================================================
              NEW JOINER SUMMARY
              ================================================= */}

          <div style={styles.onboardingSummary}>
            <SummaryCard
              label="New Joiner Requests"
              value={newJoinerCount}
              description="Requests submitted by HR"
            />

            <SummaryCard
              label="Pending Asset Admin"
              value={pendingAssetAdminCount}
              description="Waiting for your review"
            />
          </div>

          {/* =================================================
              NEW JOINER ASSET REQUESTS
              ================================================= */}

          <section
            style={{
              ...styles.card,
              marginBottom: "26px",
            }}
          >
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.cardTitle}>
                  New Joiner Asset Requests
                </h2>

                <p style={styles.cardSubtitle}>
                  Requests submitted by HR for new employees
                  joining the organization.
                </p>
              </div>

              {pendingAssetAdminCount > 0 && (
                <span style={styles.pendingCountBadge}>
                  {pendingAssetAdminCount} Pending
                </span>
              )}
            </div>

            {/* SEARCH */}

            <div style={styles.filters}>
              <input
                value={onboardingSearch}
                onChange={(event) =>
                  setOnboardingSearch(event.target.value)
                }
                placeholder="Search request, employee, department, device..."
                style={styles.searchInput}
              />

              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() => setOnboardingSearch("")}
              >
                Clear
              </button>
            </div>

            {/* TABLE */}

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>
                      REQUEST NO
                    </th>

                    <th style={styles.th}>
                      EMPLOYEE
                    </th>

                    <th style={styles.th}>
                      DEPARTMENT
                    </th>

                    <th style={styles.th}>
                      JOINING DATE
                    </th>

                    <th style={styles.th}>
                      DEVICE
                    </th>

                    <th style={styles.th}>
                      QTY
                    </th>

                    <th style={styles.th}>
                      EST. COST
                    </th>

                    <th style={styles.th}>
                      STATUS
                    </th>

                    <th
                      style={{
                        ...styles.th,
                        textAlign: "right",
                      }}
                    >
                      ACTION
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={9}
                        style={styles.emptyCell}
                      >
                        Loading new joiner requests...
                      </td>
                    </tr>
                  ) : filteredOnboardingRequests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        style={styles.emptyCell}
                      >
                        No new joiner asset requests found.
                      </td>
                    </tr>
                  ) : (
                    filteredOnboardingRequests.map(
                      (request) => (
                        <tr key={request.id}>
                          <td style={styles.td}>
                            <div style={styles.requestNumber}>
                              {request.requestNumber || "-"}
                            </div>
                          </td>

                          <td style={styles.td}>
                            <div style={styles.employeeCell}>
                              <div style={styles.avatar}>
                                {getInitials(
                                  request.employeeName
                                )}
                              </div>

                              <div>
                                <div style={styles.primaryText}>
                                  {request.employeeName}
                                </div>

                                <div style={styles.secondaryText}>
                                  {request.employeeCode ||
                                    request.employeeEmail ||
                                    "-"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td style={styles.td}>
                            {request.department || "-"}
                          </td>

                          <td style={styles.td}>
                            {formatDate(
                              request.joiningDate
                            )}
                          </td>

                          <td style={styles.td}>
                            <div style={styles.primaryText}>
                              {request.deviceCategory}
                            </div>

                            {request.specifications && (
                              <div
                                style={styles.reasonPreview}
                                title={request.specifications}
                              >
                                {request.specifications}
                              </div>
                            )}
                          </td>

                          <td style={styles.td}>
                            {request.quantity ?? 1}
                          </td>

                          <td style={styles.td}>
                            {formatMoney(
                              request.estimatedCost
                            )}
                          </td>

                          <td style={styles.td}>
                            <OnboardingStatusBadge
                              status={request.status}
                            />
                          </td>

                          <td
                            style={{
                              ...styles.td,
                              textAlign: "right",
                            }}
                          >
                            <button
                              type="button"
                              style={
                                request.status ===
                                  "PENDING_ASSET_ADMIN" ||
                                request.status ===
                                  "PENDING_STOCK_CHECK"
                                  ? styles.processButton
                                  : styles.viewButton
                              }
                              onClick={() =>
                                openOnboardingRequest(
                                  request
                                )
                              }
                            >
                              {request.status ===
                              "PENDING_ASSET_ADMIN"
                                ? "Review"
                                : request.status ===
                                    "PENDING_STOCK_CHECK"
                                  ? "Check Stock"
                                  : "View"}
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
                  {/* =================================================
                      SECONDARY DEVICE SUMMARY
                      ================================================= */}

                  <div style={styles.summaryGrid}>
                    <SummaryCard
                      label="Approved Requests"
                      value={approvedCount}
                      description="Waiting for processing"
                    />

                    <SummaryCard
                      label="Pending Assignment"
                      value={assignmentCount}
                      description="Stock available"
                    />

                    <SummaryCard
                      label="Pending Procurement"
                      value={procurementCount}
                      description="Stock unavailable"
                    />

                    <SummaryCard
                      label="Fulfilled"
                      value={fulfilledCount}
                      description="Device assigned"
                    />
                  </div>

                  {/* =================================================
                      SECONDARY DEVICE REQUESTS
                      ================================================= */}

                  <section style={styles.card}>
                    <div style={styles.cardHeader}>
                      <div>
                        <h2 style={styles.cardTitle}>
                          Secondary Device Requests
                        </h2>

                        <p style={styles.cardSubtitle}>
                          Manager-approved requests ready for Asset
                          Admin processing.
                        </p>
                      </div>
                    </div>

                    {/* FILTERS */}

                    <div style={styles.filters}>
                      <input
                        value={search}
                        onChange={(event) =>
                          setSearch(event.target.value)
                        }
                        placeholder="Search employee, device, department..."
                        style={styles.searchInput}
                      />

                      <select
                        value={filter}
                        onChange={(event) =>
                          setFilter(
                            event.target.value as RequestFilter
                          )
                        }
                        style={styles.select}
                      >
                        <option value="ALL">
                          All Requests
                        </option>

                        <option value="MANAGER_APPROVED">
                          Manager Approved
                        </option>

                        <option value="PENDING_ASSIGNMENT">
                          Pending Assignment
                        </option>

                        <option value="PENDING_PROCUREMENT">
                          Pending Procurement
                        </option>

                        <option value="FULFILLED">
                          Fulfilled
                        </option>
                      </select>

                      <button
                        type="button"
                        style={styles.secondaryButton}
                        onClick={() => {
                          setSearch("");
                          setFilter("ALL");
                        }}
                      >
                        Clear
                      </button>
                    </div>

                    {/* TABLE */}

                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>
                              EMPLOYEE
                            </th>

                            <th style={styles.th}>
                              DEPARTMENT
                            </th>

                            <th style={styles.th}>
                              REQUESTED DEVICE
                            </th>

                            <th style={styles.th}>
                              MANAGER
                            </th>

                            <th style={styles.th}>
                              REQUESTED
                            </th>

                            <th style={styles.th}>
                              STATUS
                            </th>

                            <th
                              style={{
                                ...styles.th,
                                textAlign: "right",
                              }}
                            >
                              ACTION
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {loading ? (
                            <tr>
                              <td
                                colSpan={7}
                                style={styles.emptyCell}
                              >
                                Loading asset requests...
                              </td>
                            </tr>
                          ) : filteredRequests.length === 0 ? (
                            <tr>
                              <td
                                colSpan={7}
                                style={styles.emptyCell}
                              >
                                No asset requests found.
                              </td>
                            </tr>
                          ) : (
                            filteredRequests.map(
                              (request) => (
                                <tr key={request.id}>
                                  {/* EMPLOYEE */}

                                  <td style={styles.td}>
                                    <div style={styles.employeeCell}>
                                      <div style={styles.avatar}>
                                        {getInitials(
                                          request.employeeName
                                        )}
                                      </div>

                                      <div>
                                        <div style={styles.primaryText}>
                                          {request.employeeName}
                                        </div>

                                        <div style={styles.secondaryText}>
                                          {request.employeeCode || "-"}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* DEPARTMENT */}

                                  <td style={styles.td}>
                                    {request.department || "-"}
                                  </td>

                                  {/* DEVICE */}

                                  <td style={styles.td}>
                                    <div style={styles.primaryText}>
                                      {request.category}
                                    </div>

                                    <div
                                      style={styles.reasonPreview}
                                      title={request.reason}
                                    >
                                      {request.reason}
                                    </div>
                                  </td>

                                  {/* MANAGER */}

                                  <td style={styles.td}>
                                    {request.managerName || "-"}
                                  </td>

                                  {/* REQUESTED DATE */}

                                  <td style={styles.td}>
                                    {formatDate(
                                      request.requestedAt ||
                                        request.createdAt
                                    )}
                                  </td>

                                  {/* STATUS */}

                                  <td style={styles.td}>
                                    <StatusBadge
                                      status={request.status}
                                    />
                                  </td>

                                  {/* ACTION */}

                                  <td
                                    style={{
                                      ...styles.td,
                                      textAlign: "right",
                                    }}
                                  >
                                    <button
                                      type="button"
                                      style={
                                        request.status ===
                                        "MANAGER_APPROVED"
                                          ? styles.processButton
                                          : styles.viewButton
                                      }
                                      onClick={() =>
                                        void openRequest(request.id)
                                      }
                                    >
                                      {request.status ===
                                      "MANAGER_APPROVED"
                                        ? "Process"
                                        : "View"}
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
                </main>
                      {/* ===================================================
                          NEW JOINER REQUEST MODAL
                          =================================================== */}

                      {selectedOnboarding && (
                        <div style={styles.overlay}>
                          <div style={styles.modal}>
                            {/* =============================================
                                MODAL HEADER
                                ============================================= */}

                            <div style={styles.modalHeader}>
                              <div>
                                <h2 style={styles.modalTitle}>
                                  New Joiner Asset Request
                                </h2>

                                <p style={styles.modalSubtitle}>
                                  Review and fulfil the onboarding asset
                                  request submitted by HR.
                                </p>
                              </div>

                              <button
                                type="button"
                                style={styles.closeButton}
                                disabled={
                                  forwardingToVp ||
                                  checkingOnboardingStock ||
                                  allocatingOnboardingAsset ||
                                  raisingPurchaseRequest
                                }
                                onClick={closeOnboardingModal}
                              >
                                ×
                              </button>
                            </div>

                            {/* =============================================
                                MODAL BODY
                                ============================================= */}

                            <div style={styles.modalBody}>
                              {/* ERROR */}

                              {onboardingError && (
                                <div style={styles.errorBox}>
                                  {onboardingError}
                                </div>
                              )}

                              {/* SUCCESS */}

                              {onboardingSuccess && (
                                <div style={styles.successBox}>
                                  {onboardingSuccess}
                                </div>
                              )}

                              {/* ===========================================
                                  REQUEST NUMBER + STATUS
                                  =========================================== */}

                              <div style={styles.modalStatusRow}>
                                <div>
                                  <div style={styles.sectionLabel}>
                                    REQUEST NUMBER
                                  </div>

                                  <div style={styles.modalRequestNumber}>
                                    {selectedOnboarding.requestNumber ||
                                      "-"}
                                  </div>
                                </div>

                                <OnboardingStatusBadge
                                  status={selectedOnboarding.status}
                                />
                              </div>

                              {/* ===========================================
                                  EMPLOYEE INFORMATION
                                  =========================================== */}

                              <section style={styles.detailSection}>
                                <h3 style={styles.sectionTitle}>
                                  Employee Information
                                </h3>

                                <div
                                  style={styles.onboardingDetailGrid}
                                >
                                  <Detail
                                    label="Employee Name"
                                    value={
                                      selectedOnboarding.employeeName ||
                                      "-"
                                    }
                                  />

                                  <Detail
                                    label="Employee Code"
                                    value={
                                      selectedOnboarding.employeeCode ||
                                      "-"
                                    }
                                  />

                                  <Detail
                                    label="Email"
                                    value={
                                      selectedOnboarding.employeeEmail ||
                                      "-"
                                    }
                                  />

                                  <Detail
                                    label="Department"
                                    value={
                                      selectedOnboarding.department ||
                                      "-"
                                    }
                                  />

                                  <Detail
                                    label="Designation"
                                    value={
                                      selectedOnboarding.designation ||
                                      "-"
                                    }
                                  />

                                  <Detail
                                    label="Joining Date"
                                    value={formatDate(
                                      selectedOnboarding.joiningDate
                                    )}
                                  />
                                </div>
                              </section>

                              {/* ===========================================
                                  ASSET REQUIREMENT
                                  =========================================== */}

                              <section style={styles.detailSection}>
                                <h3 style={styles.sectionTitle}>
                                  Asset Requirement
                                </h3>

                                <div
                                  style={styles.onboardingDetailGrid}
                                >
                                  <Detail
                                    label="Device Category"
                                    value={
                                      selectedOnboarding.deviceCategory ||
                                      "-"
                                    }
                                  />

                                  <Detail
                                    label="Quantity"
                                    value={String(
                                      selectedOnboarding.quantity ?? 1
                                    )}
                                  />

                                  <Detail
                                    label="Estimated Cost"
                                    value={formatMoney(
                                      selectedOnboarding.estimatedCost
                                    )}
                                  />

                                  <Detail
                                    label="Requested By"
                                    value={
                                      selectedOnboarding.createdByName ||
                                      "HR Admin"
                                    }
                                  />
                                </div>
                              </section>

                              {/* ===========================================
                                  SPECIFICATIONS
                                  =========================================== */}

                              <section style={styles.detailSection}>
                                <h3 style={styles.sectionTitle}>
                                  Specifications
                                </h3>

                                <div style={styles.requestBox}>
                                  <div style={styles.requestReason}>
                                    {selectedOnboarding.specifications ||
                                      "No specifications provided."}
                                  </div>
                                </div>
                              </section>

                              {/* ===========================================
                                  BUSINESS JUSTIFICATION
                                  =========================================== */}

                              <section style={styles.detailSection}>
                                <h3 style={styles.sectionTitle}>
                                  Business Justification
                                </h3>

                                <div style={styles.requestBox}>
                                  <div style={styles.requestReason}>
                                    {selectedOnboarding.businessJustification ||
                                      "-"}
                                  </div>
                                </div>
                              </section>

                              {/* ===========================================
                                  REQUEST WORKFLOW
                                  =========================================== */}

                              <section style={styles.detailSection}>
                                <h3 style={styles.sectionTitle}>
                                  Request Workflow
                                </h3>

                                <div style={styles.workflowBox}>
                                  {/* HR */}

                                  <WorkflowItem
                                    number="✓"
                                    title="HR Admin"
                                    description="New joiner request submitted"
                                    state="done"
                                  />

                                  <WorkflowArrow />

                                  {/* ASSET ADMIN */}

                                  <WorkflowItem
                                    number="2"
                                    title="Asset Admin"
                                    description="Initial review"
                                    state={
                                      selectedOnboarding.status ===
                                      "PENDING_ASSET_ADMIN"
                                        ? "active"
                                        : "done"
                                    }
                                  />

                                  <WorkflowArrow />

                                  {/* VP */}

                                  <WorkflowItem
                                    number="3"
                                    title="VP Approval"
                                    description="Employee asset authorization"
                                    state={
                                      selectedOnboarding.status ===
                                      "PENDING_VP_APPROVAL"
                                        ? "active"
                                        : selectedOnboarding.vpReviewedAt
                                          ? "done"
                                          : "pending"
                                    }
                                  />

                                  <WorkflowArrow />

                                  {/* STOCK */}

                                  <WorkflowItem
                                    number="4"
                                    title="Stock Check"
                                    description="Check available inventory"
                                    state={
                                      selectedOnboarding.status ===
                                      "PENDING_STOCK_CHECK"
                                        ? "active"
                                        : isAfterStockCheck(
                                              selectedOnboarding.status
                                            )
                                          ? "done"
                                          : "pending"
                                    }
                                  />

                                  <WorkflowArrow />

                                  {/* FULFILMENT */}

                                  <WorkflowItem
                                    number="5"
                                    title="Fulfilment"
                                    description="Allocate or procure asset"
                                    state={
                                      selectedOnboarding.status ===
                                        "COMPLETED" ||
                                      selectedOnboarding.status ===
                                        "ALLOCATED"
                                        ? "done"
                                        : isFulfilmentStage(
                                              selectedOnboarding.status
                                            )
                                          ? "active"
                                          : "pending"
                                    }
                                  />
                                </div>
                              </section>

                              {/* ===========================================
                                  ASSET ADMIN INITIAL REVIEW
                                  =========================================== */}

                              {selectedOnboarding.status ===
                                "PENDING_ASSET_ADMIN" && (
                                <section
                                  style={
                                    styles.assetAdminActionSection
                                  }
                                >
                                  <div
                                    style={
                                      styles.assetAdminActionHeader
                                    }
                                  >
                                    <div
                                      style={
                                        styles.assetAdminActionTitle
                                      }
                                    >
                                      Asset Admin Review
                                    </div>

                                    <div
                                      style={
                                        styles.assetAdminActionText
                                      }
                                    >
                                      Review the HR request and forward it
                                      to VP / Higher Authority for
                                      authorization.
                                    </div>
                                  </div>

                                  <label style={styles.commentLabel}>
                                    Asset Admin Comment
                                    <span style={styles.optionalText}>
                                      {" "}
                                      (optional)
                                    </span>
                                  </label>

                                  <textarea
                                    value={onboardingComment}
                                    onChange={(event) =>
                                      setOnboardingComment(
                                        event.target.value
                                      )
                                    }
                                    placeholder="Add review notes for VP..."
                                    rows={4}
                                    maxLength={1000}
                                    style={styles.commentTextarea}
                                  />

                                  <div style={styles.commentCounter}>
                                    {onboardingComment.length}/1000
                                  </div>
                                </section>
                              )}

                              {/* ===========================================
                                  WAITING FOR INITIAL VP APPROVAL
                                  =========================================== */}

                              {selectedOnboarding.status ===
                                "PENDING_VP_APPROVAL" && (
                                <div style={styles.forwardedBox}>
                                  <div style={styles.forwardedIcon}>
                                    ✓
                                  </div>

                                  <div>
                                    <div style={styles.forwardedTitle}>
                                      Forwarded to VP
                                    </div>

                                    <div style={styles.forwardedText}>
                                      Asset Admin review is complete.
                                      This request is waiting for VP /
                                      Higher Authority approval.
                                    </div>
                                  </div>
                                </div>
                              )}
                                            {/* ===========================================
                                                STOCK CHECK
                                                =========================================== */}

                                           {(
                                             selectedOnboarding.status ===
                                               "PENDING_STOCK_CHECK" ||
                                             selectedOnboarding.status ===
                                               "PENDING_ALLOCATION"
                                           ) && (
                                              <section style={styles.assetAdminActionSection}>
                                                <div style={styles.assetAdminActionHeader}>
                                                  <div style={styles.assetAdminActionTitle}>
                                                    Inventory Stock Check
                                                  </div>

                                                  <div style={styles.assetAdminActionText}>
                                                    VP approval is complete. Check the
                                                    actual inventory for an available{" "}
                                                    {selectedOnboarding.deviceCategory}.
                                                  </div>
                                                </div>
{/* REGISTER RECEIVED PURCHASED ASSET */}
{selectedOnboarding.status === "PENDING_ALLOCATION" && (
  <div
    style={{
      marginTop: "16px",
      padding: "16px",
      border: "1px solid #d9d9d9",
      borderRadius: "10px",
    }}
  >
    <div
      style={{
        fontWeight: 700,
        marginBottom: "6px",
      }}
    >
      Register Received Asset
    </div>

    <div
      style={{
        marginBottom: "14px",
        lineHeight: 1.5,
      }}
    >
      The purchased device has passed inspection.
      Register the received{" "}
      {selectedOnboarding.deviceCategory} in inventory
      before allocating it to{" "}
      {selectedOnboarding.employeeName}.
    </div>

    <button
      type="button"
      style={styles.primaryButton}
      onClick={() => {
        const params = new URLSearchParams();

        params.set(
          "category",
          selectedOnboarding.deviceCategory
        );

        if (selectedOnboarding.specifications) {
          params.set(
            "specifications",
            selectedOnboarding.specifications
          );
        }

        if (
          selectedOnboarding.estimatedCost !== null &&
          selectedOnboarding.estimatedCost !== undefined
        ) {
          params.set(
            "purchasePrice",
            String(selectedOnboarding.estimatedCost)
          );
        }

        params.set(
          "onboardingRequestId",
          selectedOnboarding.id
        );

        router.push(
          `/admin/assets?${params.toString()}`
        );
      }}
    >
      Register Received Asset
    </button>
  </div>
)}
                                                {/* CHECK STOCK BUTTON */}

                                                <button
                                                  type="button"
                                                  style={
                                                    checkingOnboardingStock
                                                      ? styles.disabledButton
                                                      : styles.primaryButton
                                                  }
                                                  disabled={checkingOnboardingStock}
                                                  onClick={() =>
                                                    void checkOnboardingStock()
                                                  }
                                                >
                                                  {checkingOnboardingStock
                                                    ? "Checking Inventory..."
                                                    : onboardingStock
                                                      ? "Recheck Stock"
                                                      : "Check Stock"}
                                                </button>

                                                {/* =======================================
                                                    STOCK RESULT
                                                    ======================================= */}

                                                {onboardingStock && (
                                                  <div style={{ marginTop: "20px" }}>
                                                    {/* STOCK COUNTS */}

                                                    <div
                                                      style={
                                                        styles.onboardingDetailGrid
                                                      }
                                                    >
                                                      <Detail
                                                        label="Category"
                                                        value={
                                                          onboardingStock.category
                                                        }
                                                      />

                                                      <Detail
                                                        label="Required Quantity"
                                                        value={String(
                                                          onboardingStock.requiredQuantity
                                                        )}
                                                      />

                                                      <Detail
                                                        label="Available Quantity"
                                                        value={String(
                                                          onboardingStock.availableQuantity
                                                        )}
                                                      />

                                                      <Detail
                                                        label="Shortage Quantity"
                                                        value={String(
                                                          onboardingStock.shortageQuantity
                                                        )}
                                                      />
                                                    </div>

                                                    {/* ===================================
                                                        STOCK AVAILABLE
                                                        =================================== */}

                                                    {onboardingStock.stockAvailable ? (
                                                      <div style={{ marginTop: "22px" }}>
                                                        <div style={styles.availableHeader}>
                                                          <div>
                                                            <h3 style={styles.sectionTitle}>
                                                              Available Inventory
                                                            </h3>

                                                            <div
                                                              style={
                                                                styles.actionDescription
                                                              }
                                                            >
                                                              Select an available{" "}
                                                              {onboardingStock.category}{" "}
                                                              and allocate it to{" "}
                                                              {
                                                                selectedOnboarding.employeeName
                                                              }
                                                              .
                                                            </div>
                                                          </div>

                                                          <span
                                                            style={
                                                              styles.inStockBadge
                                                            }
                                                          >
                                                            {
                                                              onboardingStock.availableQuantity
                                                            }{" "}
                                                            IN STOCK
                                                          </span>
                                                        </div>

                                                        {/* ===============================
                                                            AVAILABLE ASSET LIST
                                                            =============================== */}

                                                        {onboardingStock.availableAssets
                                                          .length > 0 ? (
                                                          <div
                                                            style={
                                                              styles.assetSelectionList
                                                            }
                                                          >
                                                            {onboardingStock.availableAssets.map(
                                                              (asset) => {
                                                                const selected =
                                                                  selectedOnboardingAssetId ===
                                                                  asset.id;

                                                                return (
                                                                  <button
                                                                    key={asset.id}
                                                                    type="button"
                                                                    style={{
                                                                      ...styles.assetOption,

                                                                      ...(selected
                                                                        ? styles.assetOptionSelected
                                                                        : {}),
                                                                    }}
                                                                    onClick={() =>
                                                                      setSelectedOnboardingAssetId(
                                                                        asset.id
                                                                      )
                                                                    }
                                                                  >
                                                                    {/* RADIO */}

                                                                    <div
                                                                      style={
                                                                        styles.radioOuter
                                                                      }
                                                                    >
                                                                      {selected && (
                                                                        <div
                                                                          style={
                                                                            styles.radioInner
                                                                          }
                                                                        />
                                                                      )}
                                                                    </div>

                                                                    {/* ASSET DETAILS */}

                                                                    <div
                                                                      style={
                                                                        styles.assetOptionContent
                                                                      }
                                                                    >
                                                                      <div
                                                                        style={
                                                                          styles.assetOptionTop
                                                                        }
                                                                      >
                                                                        <div>
                                                                          <div
                                                                            style={
                                                                              styles.assetName
                                                                            }
                                                                          >
                                                                            {asset.name}
                                                                          </div>

                                                                          <div
                                                                            style={
                                                                              styles.assetTag
                                                                            }
                                                                          >
                                                                            Asset Tag:{" "}
                                                                            {
                                                                              asset.assetTag
                                                                            }
                                                                          </div>
                                                                        </div>

                                                                        <span
                                                                          style={
                                                                            styles.inStockBadge
                                                                          }
                                                                        >
                                                                          IN STOCK
                                                                        </span>
                                                                      </div>

                                                                      {/* ASSET META */}

                                                                      <div
                                                                        style={
                                                                          styles.assetMetaGrid
                                                                        }
                                                                      >
                                                                        <Detail
                                                                          label="Category"
                                                                          value={
                                                                            asset.category ||
                                                                            "-"
                                                                          }
                                                                        />

                                                                        <Detail
                                                                          label="Brand"
                                                                          value={
                                                                            asset.brand ||
                                                                            "-"
                                                                          }
                                                                        />

                                                                        <Detail
                                                                          label="Model"
                                                                          value={
                                                                            asset.model ||
                                                                            "-"
                                                                          }
                                                                        />

                                                                        <Detail
                                                                          label="Serial Number"
                                                                          value={
                                                                            asset.serialNumber ||
                                                                            "-"
                                                                          }
                                                                        />
                                                                      </div>

                                                                      {/* SPECIFICATIONS */}

                                                                      {asset.specifications && (
                                                                        <div
                                                                          style={{
                                                                            marginTop:
                                                                              "14px",
                                                                          }}
                                                                        >
                                                                          <div
                                                                            style={
                                                                              styles.requestLabel
                                                                            }
                                                                          >
                                                                            Specifications
                                                                          </div>

                                                                          <div
                                                                            style={
                                                                              styles.requestReason
                                                                            }
                                                                          >
                                                                            {
                                                                              asset.specifications
                                                                            }
                                                                          </div>
                                                                        </div>
                                                                      )}
                                                                    </div>
                                                                  </button>
                                                                );
                                                              }
                                                            )}
                                                          </div>
                                                        ) : (
                                                          <div
                                                            style={
                                                              styles.noStockBox
                                                            }
                                                          >
                                                            Stock was reported as
                                                            available, but no selectable
                                                            inventory assets were returned.
                                                          </div>
                                                        )}

                                                        {/* ===============================
                                                            SELECTED ASSET INFORMATION
                                                            =============================== */}

                                                        {selectedOnboardingAssetId && (
                                                          <div
                                                            style={
                                                              styles.selectedAssetNotice
                                                            }
                                                          >
                                                            <div
                                                              style={
                                                                styles.selectedAssetNoticeTitle
                                                              }
                                                            >
                                                              Asset Selected
                                                            </div>

                                                            <div
                                                              style={
                                                                styles.selectedAssetNoticeText
                                                              }
                                                            >
                                                              {
                                                                onboardingStock.availableAssets.find(
                                                                  (asset) =>
                                                                    asset.id ===
                                                                    selectedOnboardingAssetId
                                                                )?.assetTag
                                                              }{" "}
                                                              will be allocated to{" "}
                                                              {
                                                                selectedOnboarding.employeeName
                                                              }
                                                              .
                                                            </div>
                                                          </div>
                                                        )}

                                                        {/* ===============================
                                                            ALLOCATE BUTTON
                                                            =============================== */}

                                                        <div
                                                          style={
                                                            styles.stockActionRow
                                                          }
                                                        >
                                                          <button
                                                            type="button"
                                                            style={
                                                              !selectedOnboardingAssetId ||
                                                              allocatingOnboardingAsset
                                                                ? styles.disabledButton
                                                                : styles.allocateButton
                                                            }
                                                            disabled={
                                                              !selectedOnboardingAssetId ||
                                                              allocatingOnboardingAsset
                                                            }
                                                            onClick={() =>
                                                              void allocateOnboardingAsset()
                                                            }
                                                          >
                                                            {allocatingOnboardingAsset
                                                              ? "Allocating Asset..."
                                                              : `Allocate to ${selectedOnboarding.employeeName}`}
                                                          </button>
                                                        </div>
                                                      </div>
                                                    ) : (
                                                      /* =================================
                                                         INSUFFICIENT STOCK
                                                         ================================= */

                                                      <div style={styles.procurementBox}>
                                                        <div
                                                          style={
                                                            styles.procurementContent
                                                          }
                                                        >
                                                          <div
                                                            style={
                                                              styles.procurementIcon
                                                            }
                                                          >
                                                            !
                                                          </div>

                                                          <div>
                                                            <div
                                                              style={
                                                                styles.procurementTitle
                                                              }
                                                            >
                                                              Insufficient Inventory
                                                            </div>

                                                            <div
                                                              style={
                                                                styles.procurementText
                                                              }
                                                            >
                                                              The request requires{" "}
                                                              {
                                                                onboardingStock.requiredQuantity
                                                              }{" "}
                                                              {
                                                                onboardingStock.category
                                                              }{" "}
                                                              asset(s), but only{" "}
                                                              {
                                                                onboardingStock.availableQuantity
                                                              }{" "}
                                                              are currently available.
                                                            </div>

                                                            <div
                                                              style={
                                                                styles.shortageText
                                                              }
                                                            >
                                                              Quantity to procure:{" "}
                                                              <strong>
                                                                {
                                                                  onboardingStock.shortageQuantity
                                                                }
                                                              </strong>
                                                            </div>
                                                          </div>
                                                        </div>
<div
  style={{
    marginTop: "16px",
    marginBottom: "16px",
  }}
>
  <label
    style={{
      display: "block",
      fontWeight: 700,
      marginBottom: "8px",
    }}
  >
    Estimated Price Per Unit
  </label>

  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }}
  >
    <span
      style={{
        fontWeight: 700,
        fontSize: "18px",
      }}
    >
      ₹
    </span>

    <input
      type="number"
      min="0"
      step="0.01"
      value={assetEstimatedCost}
      onChange={(event) =>
        setAssetEstimatedCost(
          event.target.value
        )
      }
      placeholder="Enter estimated price"
      style={{
        width: "260px",
        padding: "10px 12px",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        fontSize: "14px",
      }}
    />
  </div>

  {Number(assetEstimatedCost) > 0 && (
    <div
      style={{
        marginTop: "10px",
        fontSize: "14px",
        fontWeight: 600,
      }}
    >
      Estimated Total Cost: ₹
      {(
        Number(assetEstimatedCost) *
        onboardingStock.shortageQuantity
      ).toLocaleString("en-IN")}
    </div>
  )}
</div>
                                                        <button
                                                          type="button"
                                                          style={
                                                            raisingPurchaseRequest
                                                              ? styles.disabledButton
                                                              : styles.purchaseRequestButton
                                                          }
                                                          disabled={
                                                            raisingPurchaseRequest
                                                          }
                                                          onClick={() =>
                                                            void raiseOnboardingPurchaseRequest()
                                                          }
                                                        >
                                                          {raisingPurchaseRequest
                                                            ? "Raising Purchase Request..."
                                                            : "Raise Purchase Request"}
                                                        </button>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </section>
                                            )}

                                            {/* ===========================================
                                                PURCHASE REQUEST CREATED
                                                =========================================== */}

                                            {selectedOnboarding.status ===
                                              "PR_REQUIRED" && (
                                              <div style={styles.procurementBox}>
                                                <div style={styles.procurementContent}>
                                                  <div style={styles.procurementIcon}>
                                                    ✓
                                                  </div>

                                                  <div style={{ flex: 1 }}>
                                                    <div style={styles.procurementTitle}>
                                                      Purchase Request Required
                                                    </div>

                                                    <div style={styles.procurementText}>
                                                      Available inventory is insufficient for this
                                                      request. The purchase request is ready to be
                                                      sent to Finance.
                                                    </div>

                                                    <div style={styles.shortageText}>
                                                      Requested device:{" "}
                                                      <strong>
                                                        {selectedOnboarding.deviceCategory}
                                                      </strong>
                                                    </div>

                                                    <div
                                                      style={{
                                                        marginTop: "16px",
                                                        display: "flex",
                                                        gap: "10px",
                                                      }}
                                                    >
                                                      <button
                                                        type="button"
                                                        style={
                                                          sendingOnboardingPrToFinance
                                                            ? styles.disabledButton
                                                            : styles.primaryButton
                                                        }
                                                        disabled={sendingOnboardingPrToFinance}
                                                        onClick={() =>
                                                          void sendOnboardingPrToFinance()
                                                        }
                                                      >
                                                        {sendingOnboardingPrToFinance
                                                          ? "Sending to Finance..."
                                                          : "Send Purchase Request to Finance"}
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            )}

                                            {/* ===========================================
                                                WAITING FOR FINANCE
                                                =========================================== */}

                                            {selectedOnboarding.status ===
                                              "PENDING_FINANCE_APPROVAL" && (
                                              <div style={styles.forwardedBox}>
                                                <div style={styles.forwardedIcon}>
                                                  ✓
                                                </div>

                                                <div>
                                                  <div style={styles.forwardedTitle}>
                                                    Waiting for Finance Approval
                                                  </div>

                                                  <div style={styles.forwardedText}>
                                                    The purchase request has been sent
                                                    for Finance review and approval.
                                                  </div>
                                                </div>
                                              </div>
                                            )}

                                            {/* ===========================================
                                                FINANCE REJECTED
                                                =========================================== */}

                                            {selectedOnboarding.status ===
                                              "FINANCE_REJECTED" && (
                                              <div style={styles.rejectedBox}>
                                                <div>
                                                  <div style={styles.rejectedTitle}>
                                                    Finance Rejected
                                                  </div>

                                                  <div style={styles.rejectedText}>
                                                    Finance rejected this purchase
                                                    request.
                                                  </div>
                                                </div>
                                              </div>
                                            )}

                                            {/* ===========================================
                                                SECOND VP / PR APPROVAL
                                                =========================================== */}

                                            {selectedOnboarding.status ===
                                              "PENDING_PR_VP_APPROVAL" && (
                                              <div style={styles.forwardedBox}>
                                                <div style={styles.forwardedIcon}>
                                                  ✓
                                                </div>

                                                <div>
                                                  <div style={styles.forwardedTitle}>
                                                    Waiting for Procurement VP Approval
                                                  </div>

                                                  <div style={styles.forwardedText}>
                                                    Finance approval is complete. The
                                                    purchase request is waiting for the
                                                    second VP / Higher Authority
                                                    approval before ordering.
                                                  </div>
                                                </div>
                                              </div>
                                            )}

                                            {/* ===========================================
                                                PROCUREMENT / VENDOR
                                                =========================================== */}

                                            {(selectedOnboarding.status ===
                                              "PENDING_VENDOR_ORDER" ||
                                              selectedOnboarding.status ===
                                                "ORDER_PLACED" ||
                                              selectedOnboarding.status ===
                                                "PENDING_DELIVERY") && (
                                              <div style={styles.procurementBox}>
                                                <div style={styles.procurementContent}>
                                                  <div style={styles.procurementIcon}>
                                                    ✓
                                                  </div>

                                                  <div>
                                                    <div style={styles.procurementTitle}>
                                                      Procurement in Progress
                                                    </div>

                                                    <div style={styles.procurementText}>
                                                      Purchase approval is complete and
                                                      the request is now in the vendor /
                                                      delivery stage.
                                                    </div>

                                                    <div style={styles.shortageText}>
                                                      Current status:{" "}
                                                      <strong>
                                                        {prettyStatus(
                                                          selectedOnboarding.status
                                                        )}
                                                      </strong>
                                                    </div>
                                                   {selectedOnboarding.status ===
                                                     "PENDING_VENDOR_ORDER" && (
                                                     <div
                                                       style={{
                                                         marginTop: "16px",
                                                         padding: "16px",
                                                         border: "1px solid #d9d9d9",
                                                         borderRadius: "10px",
                                                       }}
                                                     >
                                                       <div
                                                         style={{
                                                           fontWeight: 700,
                                                           marginBottom: "6px",
                                                         }}
                                                       >
                                                         Vendor Order Details
                                                       </div>

                                                       <div
                                                         style={{
                                                           marginBottom: "16px",
                                                           lineHeight: 1.5,
                                                         }}
                                                       >
                                                         Enter the equipment and vendor details before
                                                         placing the purchase order.
                                                       </div>

                                                       <div style={{ marginBottom: "14px" }}>
                                                         <label
                                                           style={{
                                                             display: "block",
                                                             fontWeight: 600,
                                                             marginBottom: "6px",
                                                           }}
                                                         >
                                                           Brand / Company *
                                                         </label>

                                                         <input
                                                           type="text"
                                                           value={vendorBrand}
                                                           placeholder="Example: Dell"
                                                           onChange={(event) =>
                                                             setVendorBrand(event.target.value)
                                                           }
                                                           style={{
                                                             width: "100%",
                                                             padding: "10px 12px",
                                                             border: "1px solid #d9d9d9",
                                                             borderRadius: "8px",
                                                           }}
                                                         />
                                                       </div>

                                                       <div style={{ marginBottom: "14px" }}>
                                                         <label
                                                           style={{
                                                             display: "block",
                                                             fontWeight: 600,
                                                             marginBottom: "6px",
                                                           }}
                                                         >
                                                           Model *
                                                         </label>

                                                         <input
                                                           type="text"
                                                           value={vendorModel}
                                                           placeholder="Example: Latitude 5450"
                                                           onChange={(event) =>
                                                             setVendorModel(event.target.value)
                                                           }
                                                           style={{
                                                             width: "100%",
                                                             padding: "10px 12px",
                                                             border: "1px solid #d9d9d9",
                                                             borderRadius: "8px",
                                                           }}
                                                         />
                                                       </div>

                                                       <div style={{ marginBottom: "16px" }}>
                                                         <label
                                                           style={{
                                                             display: "block",
                                                             fontWeight: 600,
                                                             marginBottom: "6px",
                                                           }}
                                                         >
                                                           Supplier / Vendor *
                                                         </label>

                                                         <input
                                                           type="text"
                                                           value={vendorSupplier}
                                                           placeholder="Example: Dell Authorized Partner"
                                                           onChange={(event) =>
                                                             setVendorSupplier(event.target.value)
                                                           }
                                                           style={{
                                                             width: "100%",
                                                             padding: "10px 12px",
                                                             border: "1px solid #d9d9d9",
                                                             borderRadius: "8px",
                                                           }}
                                                         />
                                                       </div>

                                                       <button
                                                         type="button"
                                                         style={
                                                           sendingToVendor
                                                             ? styles.disabledButton
                                                             : styles.primaryButton
                                                         }
                                                         disabled={sendingToVendor}
                                                         onClick={() =>
                                                           void sendOnboardingToVendor()
                                                         }
                                                       >
                                                         {sendingToVendor
                                                           ? "Placing Vendor Order..."
                                                           : "Place Vendor Order"}
                                                       </button>
                                                     </div>
                                                   )}
                                                    {selectedOnboarding.status ===
                                                      "ORDER_PLACED" && (
                                                      <div
                                                        style={{
                                                          marginTop: "16px",
                                                        }}
                                                      >
                                                        <button
                                                          type="button"
                                                          style={
                                                            markingDelivered
                                                              ? styles.disabledButton
                                                              : styles.primaryButton
                                                          }
                                                          disabled={markingDelivered}
                                                          onClick={() =>
                                                            void markOnboardingDelivered()
                                                          }
                                                        >
                                                          {markingDelivered
                                                            ? "Marking Delivered..."
                                                            : "Delivery Received"}
                                                        </button>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            )}

                                            {/* ===========================================
                                                INSPECTION
                                                =========================================== */}

                                            {(selectedOnboarding.status ===
                                              "PENDING_INSPECTION" ||
                                              selectedOnboarding.status ===
                                                "INSPECTION_PASSED" ||
                                              selectedOnboarding.status ===
                                                "INSPECTION_FAILED") && (
                                              <div style={styles.procurementBox}>
                                                <div style={styles.procurementContent}>
                                                  <div style={styles.procurementIcon}>
                                                    {selectedOnboarding.status ===
                                                    "INSPECTION_FAILED"
                                                      ? "!"
                                                      : "✓"}
                                                  </div>

                                                  <div>
                                                    <div style={styles.procurementTitle}>
                                                      Asset Inspection
                                                    </div>

                                                    <div style={styles.procurementText}>
                                                      Current inspection status:{" "}
                                                      <strong>
                                                        {prettyStatus(
                                                          selectedOnboarding.status
                                                        )}
                                                      </strong>
                                                    </div>
                                                    {selectedOnboarding.status ===
                                                      "PENDING_INSPECTION" && (
                                                      <div
                                                        style={{
                                                          display: "flex",
                                                          gap: "12px",
                                                          marginTop: "16px",
                                                          flexWrap: "wrap",
                                                        }}
                                                      >
                                                        <button
                                                          type="button"
                                                          style={
                                                            passingInspection ||
                                                            failingInspection
                                                              ? styles.disabledButton
                                                              : styles.primaryButton
                                                          }
                                                          disabled={
                                                            passingInspection ||
                                                            failingInspection
                                                          }
                                                          onClick={() =>
                                                            void passOnboardingInspection()
                                                          }
                                                        >
                                                          {passingInspection
                                                            ? "Passing Inspection..."
                                                            : "Pass Inspection"}
                                                        </button>

                                                        <button
                                                          type="button"
                                                          style={
                                                            passingInspection ||
                                                            failingInspection
                                                              ? styles.disabledButton
                                                              : styles.secondaryButton
                                                          }
                                                          disabled={
                                                            passingInspection ||
                                                            failingInspection
                                                          }
                                                          onClick={() =>
                                                            void failOnboardingInspection()
                                                          }
                                                        >
                                                          {failingInspection
                                                            ? "Failing Inspection..."
                                                            : "Fail Inspection"}
                                                        </button>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            )}

                                            {/* ===========================================
                                                ALLOCATION COMPLETED
                                                =========================================== */}

                                            {(selectedOnboarding.status ===
                                              "ALLOCATED" ||
                                              selectedOnboarding.status ===
                                                "COMPLETED") && (
                                              <div style={styles.fulfilledBox}>
                                                <div style={styles.fulfilledIcon}>
                                                  ✓
                                                </div>

                                                <div>
                                                  <div style={styles.fulfilledTitle}>
                                                    Asset Allocation Completed
                                                  </div>

                                                  <div style={styles.fulfilledText}>
                                                    The requested asset has been
                                                    allocated to{" "}
                                                    <strong>
                                                      {
                                                        selectedOnboarding.employeeName
                                                      }
                                                    </strong>
                                                    .
                                                  </div>

                                                  {selectedOnboarding.allocatedAt && (
                                                    <div
                                                      style={{
                                                        marginTop: "6px",
                                                        fontSize: "12px",
                                                      }}
                                                    >
                                                      Allocated:{" "}
                                                      {formatDateTime(
                                                        selectedOnboarding.allocatedAt
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                                          {/* ===========================================
                                                              ASSET ADMIN REVIEW INFORMATION
                                                              =========================================== */}

                                                          {selectedOnboarding.assetAdminReviewedAt && (
                                                            <section style={styles.detailSection}>
                                                              <h3 style={styles.sectionTitle}>
                                                                Asset Admin Review
                                                              </h3>

                                                              <div style={styles.onboardingDetailGrid}>
                                                                <Detail
                                                                  label="Reviewed By"
                                                                  value={
                                                                    selectedOnboarding.assetAdminEmail ||
                                                                    "-"
                                                                  }
                                                                />

                                                                <Detail
                                                                  label="Reviewed At"
                                                                  value={formatDateTime(
                                                                    selectedOnboarding.assetAdminReviewedAt
                                                                  )}
                                                                />
                                                              </div>

                                                              {selectedOnboarding.assetAdminComment && (
                                                                <div style={styles.commentDisplayBox}>
                                                                  <div style={styles.requestLabel}>
                                                                    Asset Admin Comment
                                                                  </div>

                                                                  <div style={styles.requestReason}>
                                                                    {
                                                                      selectedOnboarding.assetAdminComment
                                                                    }
                                                                  </div>
                                                                </div>
                                                              )}
                                                            </section>
                                                          )}

                                                          {/* ===========================================
                                                              INITIAL VP REVIEW INFORMATION
                                                              =========================================== */}

                                                          {selectedOnboarding.vpReviewedAt && (
                                                            <section style={styles.detailSection}>
                                                              <h3 style={styles.sectionTitle}>
                                                                VP / Higher Authority Review
                                                              </h3>

                                                              <div style={styles.onboardingDetailGrid}>
                                                                <Detail
                                                                  label="Reviewed By"
                                                                  value={
                                                                    selectedOnboarding.vpEmail ||
                                                                    "-"
                                                                  }
                                                                />

                                                                <Detail
                                                                  label="Reviewed At"
                                                                  value={formatDateTime(
                                                                    selectedOnboarding.vpReviewedAt
                                                                  )}
                                                                />
                                                              </div>

                                                              {selectedOnboarding.vpComment && (
                                                                <div style={styles.commentDisplayBox}>
                                                                  <div style={styles.requestLabel}>
                                                                    VP Comment
                                                                  </div>

                                                                  <div style={styles.requestReason}>
                                                                    {selectedOnboarding.vpComment}
                                                                  </div>
                                                                </div>
                                                              )}
                                                            </section>
                                                          )}

                                                          {/* ===========================================
                                                              FINANCE REVIEW INFORMATION
                                                              =========================================== */}

                                                          {selectedOnboarding.financeReviewedAt && (
                                                            <section style={styles.detailSection}>
                                                              <h3 style={styles.sectionTitle}>
                                                                Finance Review
                                                              </h3>

                                                              <div style={styles.onboardingDetailGrid}>
                                                                <Detail
                                                                  label="Reviewed By"
                                                                  value={
                                                                    selectedOnboarding.financeEmail ||
                                                                    "-"
                                                                  }
                                                                />

                                                                <Detail
                                                                  label="Reviewed At"
                                                                  value={formatDateTime(
                                                                    selectedOnboarding.financeReviewedAt
                                                                  )}
                                                                />
                                                              </div>

                                                              {selectedOnboarding.financeComment && (
                                                                <div style={styles.commentDisplayBox}>
                                                                  <div style={styles.requestLabel}>
                                                                    Finance Comment
                                                                  </div>

                                                                  <div style={styles.requestReason}>
                                                                    {selectedOnboarding.financeComment}
                                                                  </div>
                                                                </div>
                                                              )}
                                                            </section>
                                                          )}
                                                        </div>

                                                        {/* =============================================
                                                            MODAL FOOTER
                                                            ============================================= */}

                                                        <div style={styles.modalFooter}>
                                                          <button
                                                            type="button"
                                                            style={styles.secondaryButton}
                                                            disabled={
                                                              forwardingToVp ||
                                                              checkingOnboardingStock ||
                                                              allocatingOnboardingAsset ||
                                                              raisingPurchaseRequest
                                                            }
                                                            onClick={closeOnboardingModal}
                                                          >
                                                            Close
                                                          </button>

                                                          {/* FORWARD TO VP */}

                                                          {selectedOnboarding.status ===
                                                            "PENDING_ASSET_ADMIN" && (
                                                            <button
                                                              type="button"
                                                              style={
                                                                forwardingToVp
                                                                  ? styles.disabledButton
                                                                  : styles.forwardButton
                                                              }
                                                              disabled={forwardingToVp}
                                                              onClick={() =>
                                                                void forwardToVp()
                                                              }
                                                            >
                                                              {forwardingToVp
                                                                ? "Forwarding..."
                                                                : "Forward to VP →"}
                                                            </button>
                                                          )}

                                                          {/* STOCK CHECK SHORTCUT */}

                                                          {selectedOnboarding.status ===
                                                            "PENDING_STOCK_CHECK" &&
                                                            !onboardingStock && (
                                                              <button
                                                                type="button"
                                                                style={
                                                                  checkingOnboardingStock
                                                                    ? styles.disabledButton
                                                                    : styles.primaryButton
                                                                }
                                                                disabled={checkingOnboardingStock}
                                                                onClick={() =>
                                                                  void checkOnboardingStock()
                                                                }
                                                              >
                                                                {checkingOnboardingStock
                                                                  ? "Checking..."
                                                                  : "Check Inventory"}
                                                              </button>
                                                            )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}

                                                  {/* ===================================================
                                                      SECONDARY DEVICE MODAL STARTS NEXT
                                                      =================================================== */}
                                                            {/* ===================================================
                                                                SECONDARY DEVICE PROCESS MODAL
                                                                =================================================== */}

                                                            {selectedRequest && (
                                                              <div style={styles.overlay}>
                                                                <div style={styles.modal}>
                                                                  {/* HEADER */}

                                                                  <div style={styles.modalHeader}>
                                                                    <div>
                                                                      <h2 style={styles.modalTitle}>
                                                                        Process Secondary Device Request
                                                                      </h2>

                                                                      <p style={styles.modalSubtitle}>
                                                                        Review the approved request and assign an
                                                                        available company asset.
                                                                      </p>
                                                                    </div>

                                                                    <button
                                                                      type="button"
                                                                      style={styles.closeButton}
                                                                      onClick={closeModal}
                                                                    >
                                                                      ×
                                                                    </button>
                                                                  </div>

                                                                  {/* BODY */}

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

                                                                    {modalLoading ? (
                                                                      <div style={styles.modalLoading}>
                                                                        Loading request...
                                                                      </div>
                                                                    ) : (
                                                                      <>
                                                                        {/* =======================================
                                                                            STATUS
                                                                            ======================================= */}

                                                                        <div style={styles.modalStatusRow}>
                                                                          <span style={styles.sectionLabel}>
                                                                            Request Status
                                                                          </span>

                                                                          <StatusBadge
                                                                            status={selectedRequest.status}
                                                                          />
                                                                        </div>

                                                                        {/* =======================================
                                                                            EMPLOYEE INFORMATION
                                                                            ======================================= */}

                                                                        <section style={styles.detailSection}>
                                                                          <h3 style={styles.sectionTitle}>
                                                                            Employee Information
                                                                          </h3>

                                                                          <div style={styles.detailGrid}>
                                                                            <Detail
                                                                              label="Employee"
                                                                              value={selectedRequest.employeeName}
                                                                            />

                                                                            <Detail
                                                                              label="Employee ID"
                                                                              value={
                                                                                selectedRequest.employeeCode || "-"
                                                                              }
                                                                            />

                                                                            <Detail
                                                                              label="Department"
                                                                              value={
                                                                                selectedRequest.department || "-"
                                                                              }
                                                                            />

                                                                            <Detail
                                                                              label="Manager"
                                                                              value={
                                                                                selectedRequest.managerName || "-"
                                                                              }
                                                                            />
                                                                          </div>
                                                                        </section>

                                                                        {/* =======================================
                                                                            CURRENT ASSETS
                                                                            ======================================= */}

                                                                        <section style={styles.detailSection}>
                                                                          <h3 style={styles.sectionTitle}>
                                                                            Current Assets
                                                                          </h3>

                                                                          {!selectedRequest.currentAssets ||
                                                                          selectedRequest.currentAssets.length === 0 ? (
                                                                            <div style={styles.noAssets}>
                                                                              No currently assigned assets.
                                                                            </div>
                                                                          ) : (
                                                                            <div style={styles.currentAssetList}>
                                                                              {selectedRequest.currentAssets.map(
                                                                                (asset) => (
                                                                                  <div
                                                                                    key={asset.id}
                                                                                    style={styles.currentAsset}
                                                                                  >
                                                                                    <div style={styles.deviceIcon}>
                                                                                      ▣
                                                                                    </div>

                                                                                    <div>
                                                                                      <div style={styles.primaryText}>
                                                                                        {asset.name}
                                                                                      </div>

                                                                                      <div
                                                                                        style={styles.secondaryText}
                                                                                      >
                                                                                        Asset Tag: {asset.assetTag} •{" "}
                                                                                        {asset.category}
                                                                                      </div>
                                                                                    </div>
                                                                                  </div>
                                                                                )
                                                                              )}
                                                                            </div>
                                                                          )}
                                                                        </section>

                                                                        {/* =======================================
                                                                            REQUESTED DEVICE
                                                                            ======================================= */}

                                                                        <section style={styles.detailSection}>
                                                                          <h3 style={styles.sectionTitle}>
                                                                            Requested Device
                                                                          </h3>

                                                                          <div style={styles.requestBox}>
                                                                            <div style={styles.requestCategory}>
                                                                              {selectedRequest.category}
                                                                            </div>

                                                                            <div style={styles.requestLabel}>
                                                                              Reason / Justification
                                                                            </div>

                                                                            <div style={styles.requestReason}>
                                                                              {selectedRequest.reason}
                                                                            </div>
                                                                          </div>
                                                                        </section>

                                                                        {/* =======================================
                                                                            MANAGER APPROVAL
                                                                            ======================================= */}

                                                                        <section style={styles.detailSection}>
                                                                          <h3 style={styles.sectionTitle}>
                                                                            Manager Approval
                                                                          </h3>

                                                                          <div style={styles.detailGrid}>
                                                                            <Detail
                                                                              label="Reviewed By"
                                                                              value={
                                                                                selectedRequest.reviewedBy ||
                                                                                selectedRequest.managerName ||
                                                                                "-"
                                                                              }
                                                                            />

                                                                            <Detail
                                                                              label="Reviewed At"
                                                                              value={formatDateTime(
                                                                                selectedRequest.reviewedAt
                                                                              )}
                                                                            />
                                                                          </div>

                                                                          {selectedRequest.managerComment && (
                                                                            <div style={styles.commentBox}>
                                                                              <div style={styles.requestLabel}>
                                                                                Manager Comment
                                                                              </div>

                                                                              <div style={styles.requestReason}>
                                                                                {selectedRequest.managerComment}
                                                                              </div>
                                                                            </div>
                                                                          )}
                                                                        </section>

                                                                        {/* =======================================
                                                                            CHECK STOCK
                                                                            ======================================= */}

                                                                        {selectedRequest.status ===
                                                                          "MANAGER_APPROVED" && (
                                                                          <section style={styles.actionSection}>
                                                                            <div>
                                                                              <h3 style={styles.sectionTitle}>
                                                                                Check Available Stock
                                                                              </h3>

                                                                              <p style={styles.actionDescription}>
                                                                                Check whether an in-stock{" "}
                                                                                {selectedRequest.category} is
                                                                                available.
                                                                              </p>
                                                                            </div>

                                                                            <button
                                                                              type="button"
                                                                              style={styles.primaryButton}
                                                                              disabled={processing}
                                                                              onClick={() =>
                                                                                void processRequest()
                                                                              }
                                                                            >
                                                                              {processing
                                                                                ? "Checking..."
                                                                                : "Check Stock"}
                                                                            </button>
                                                                          </section>
                                                                        )}

                                                                        {/* =======================================
                                                                            PROCUREMENT
                                                                            ======================================= */}

                                                                        {selectedRequest.status ===
                                                                          "PENDING_PROCUREMENT" && (
                                                                          <section style={styles.procurementBox}>
                                                                            <div>
                                                                              <div style={styles.procurementTitle}>
                                                                                No matching stock available
                                                                              </div>

                                                                              <div style={styles.procurementText}>
                                                                                This request is waiting for
                                                                                procurement. Once a matching asset
                                                                                is added to stock, recheck the
                                                                                stock.
                                                                              </div>
                                                                            </div>

                                                                            <button
                                                                              type="button"
                                                                              style={styles.secondaryButton}
                                                                              disabled={processing}
                                                                              onClick={() =>
                                                                                void recheckStock()
                                                                              }
                                                                            >
                                                                              {processing
                                                                                ? "Checking..."
                                                                                : "Recheck Stock"}
                                                                            </button>
                                                                          </section>
                                                                        )}
                                                                                          {/* =======================================
                                                                                              AVAILABLE ASSETS
                                                                                              ======================================= */}

                                                                                          {selectedRequest.status ===
                                                                                            "PENDING_ASSIGNMENT" && (
                                                                                            <section style={styles.detailSection}>
                                                                                              <div style={styles.availableHeader}>
                                                                                                <div>
                                                                                                  <h3 style={styles.sectionTitle}>
                                                                                                    Available Assets
                                                                                                  </h3>

                                                                                                  <p style={styles.actionDescription}>
                                                                                                    Select one in-stock asset to
                                                                                                    assign as the employee&apos;s
                                                                                                    secondary device.
                                                                                                  </p>
                                                                                                </div>

                                                                                                <button
                                                                                                  type="button"
                                                                                                  style={styles.smallButton}
                                                                                                  disabled={processing}
                                                                                                  onClick={() =>
                                                                                                    void recheckStock()
                                                                                                  }
                                                                                                >
                                                                                                  Refresh Stock
                                                                                                </button>
                                                                                              </div>

                                                                                              {/* NO STOCK */}

                                                                                              {availableAssets.length === 0 ? (
                                                                                                <div style={styles.noStockBox}>
                                                                                                  No matching assets are currently
                                                                                                  available.
                                                                                                </div>
                                                                                              ) : (
                                                                                                /* ASSET SELECTION */

                                                                                                <div style={styles.assetSelectionList}>
                                                                                                  {availableAssets.map((asset) => {
                                                                                                    const selected =
                                                                                                      selectedAssetId === asset.id;

                                                                                                    return (
                                                                                                      <button
                                                                                                        key={asset.id}
                                                                                                        type="button"
                                                                                                        onClick={() =>
                                                                                                          setSelectedAssetId(asset.id)
                                                                                                        }
                                                                                                        style={{
                                                                                                          ...styles.assetOption,

                                                                                                          ...(selected
                                                                                                            ? styles.assetOptionSelected
                                                                                                            : {}),
                                                                                                        }}
                                                                                                      >
                                                                                                        {/* RADIO */}

                                                                                                        <div style={styles.radioOuter}>
                                                                                                          {selected && (
                                                                                                            <div
                                                                                                              style={styles.radioInner}
                                                                                                            />
                                                                                                          )}
                                                                                                        </div>

                                                                                                        {/* ASSET */}

                                                                                                        <div
                                                                                                          style={
                                                                                                            styles.assetOptionContent
                                                                                                          }
                                                                                                        >
                                                                                                          <div
                                                                                                            style={styles.assetOptionTop}
                                                                                                          >
                                                                                                            <div>
                                                                                                              <div
                                                                                                                style={styles.assetName}
                                                                                                              >
                                                                                                                {asset.name}
                                                                                                              </div>

                                                                                                              <div
                                                                                                                style={styles.assetTag}
                                                                                                              >
                                                                                                                {asset.assetTag}
                                                                                                              </div>
                                                                                                            </div>

                                                                                                            <span
                                                                                                              style={styles.inStockBadge}
                                                                                                            >
                                                                                                              In Stock
                                                                                                            </span>
                                                                                                          </div>

                                                                                                          <div
                                                                                                            style={styles.assetMetaGrid}
                                                                                                          >
                                                                                                            <Detail
                                                                                                              label="Category"
                                                                                                              value={asset.category}
                                                                                                            />

                                                                                                            <Detail
                                                                                                              label="Brand"
                                                                                                              value={
                                                                                                                asset.brand || "-"
                                                                                                              }
                                                                                                            />

                                                                                                            <Detail
                                                                                                              label="Model"
                                                                                                              value={
                                                                                                                asset.model || "-"
                                                                                                              }
                                                                                                            />

                                                                                                            <Detail
                                                                                                              label="Serial Number"
                                                                                                              value={
                                                                                                                asset.serialNumber ||
                                                                                                                "-"
                                                                                                              }
                                                                                                            />
                                                                                                          </div>

                                                                                                          {asset.specifications && (
                                                                                                            <div
                                                                                                              style={{
                                                                                                                marginTop: "12px",
                                                                                                              }}
                                                                                                            >
                                                                                                              <div
                                                                                                                style={
                                                                                                                  styles.requestLabel
                                                                                                                }
                                                                                                              >
                                                                                                                Specifications
                                                                                                              </div>

                                                                                                              <div
                                                                                                                style={
                                                                                                                  styles.requestReason
                                                                                                                }
                                                                                                              >
                                                                                                                {
                                                                                                                  asset.specifications
                                                                                                                }
                                                                                                              </div>
                                                                                                            </div>
                                                                                                          )}
                                                                                                        </div>
                                                                                                      </button>
                                                                                                    );
                                                                                                  })}
                                                                                                </div>
                                                                                              )}

                                                                                              {/* ===================================
                                                                                                  SELECTED ASSET
                                                                                                  =================================== */}

                                                                                              {selectedAssetId && (
                                                                                                <div
                                                                                                  style={styles.selectedAssetNotice}
                                                                                                >
                                                                                                  <div
                                                                                                    style={
                                                                                                      styles.selectedAssetNoticeTitle
                                                                                                    }
                                                                                                  >
                                                                                                    Asset Selected
                                                                                                  </div>

                                                                                                  <div
                                                                                                    style={
                                                                                                      styles.selectedAssetNoticeText
                                                                                                    }
                                                                                                  >
                                                                                                    {availableAssets.find(
                                                                                                      (asset) =>
                                                                                                        asset.id === selectedAssetId
                                                                                                    )?.assetTag || "Selected asset"}{" "}
                                                                                                    will be assigned to{" "}
                                                                                                    {selectedRequest.employeeName}.
                                                                                                  </div>
                                                                                                </div>
                                                                                              )}

                                                                                              {/* ===================================
                                                                                                  ASSIGN BUTTON
                                                                                                  =================================== */}

                                                                                              <div style={styles.stockActionRow}>
                                                                                                <button
                                                                                                  type="button"
                                                                                                  style={
                                                                                                    !selectedAssetId || processing
                                                                                                      ? styles.disabledButton
                                                                                                      : styles.allocateButton
                                                                                                  }
                                                                                                  disabled={
                                                                                                    !selectedAssetId || processing
                                                                                                  }
                                                                                                  onClick={() =>
                                                                                                    void assignAsset()
                                                                                                  }
                                                                                                >
                                                                                                  {processing
                                                                                                    ? "Assigning Asset..."
                                                                                                    : `Assign to ${selectedRequest.employeeName}`}
                                                                                                </button>
                                                                                              </div>
                                                                                            </section>
                                                                                          )}

                                                                                          {/* =======================================
                                                                                              FULFILLED
                                                                                              ======================================= */}

                                                                                          {selectedRequest.status ===
                                                                                            "FULFILLED" && (
                                                                                            <section style={styles.fulfilledBox}>
                                                                                              <div style={styles.fulfilledIcon}>
                                                                                                ✓
                                                                                              </div>

                                                                                              <div>
                                                                                                <div style={styles.fulfilledTitle}>
                                                                                                  Request Fulfilled
                                                                                                </div>

                                                                                                <div style={styles.fulfilledText}>
                                                                                                  The secondary device request has
                                                                                                  been completed successfully.
                                                                                                </div>

                                                                                                {selectedRequest.assignedAsset && (
                                                                                                  <div
                                                                                                    style={{
                                                                                                      marginTop: "14px",
                                                                                                    }}
                                                                                                  >
                                                                                                    <div
                                                                                                      style={styles.requestLabel}
                                                                                                    >
                                                                                                      Assigned Asset
                                                                                                    </div>

                                                                                                    <div
                                                                                                      style={{
                                                                                                        marginTop: "6px",
                                                                                                      }}
                                                                                                    >
                                                                                                      <strong>
                                                                                                        {
                                                                                                          selectedRequest
                                                                                                            .assignedAsset.name
                                                                                                        }
                                                                                                      </strong>

                                                                                                      {" — "}

                                                                                                      {
                                                                                                        selectedRequest.assignedAsset
                                                                                                          .assetTag
                                                                                                      }
                                                                                                    </div>

                                                                                                    <div
                                                                                                      style={{
                                                                                                        marginTop: "4px",
                                                                                                        fontSize: "13px",
                                                                                                      }}
                                                                                                    >
                                                                                                      {selectedRequest.assignedAsset
                                                                                                        .brand || "-"}

                                                                                                      {" • "}

                                                                                                      {selectedRequest.assignedAsset
                                                                                                        .model || "-"}
                                                                                                    </div>
                                                                                                  </div>
                                                                                                )}
                                                                                              </div>
                                                                                            </section>
                                                                                          )}
                                                                                                          </>
                                                                                                        )}
                                                                                                      </div>

                                                                                                      {/* =============================================
                                                                                                          SECONDARY DEVICE MODAL FOOTER
                                                                                                          ============================================= */}

                                                                                                      <div style={styles.modalFooter}>
                                                                                                        <button
                                                                                                          type="button"
                                                                                                          style={styles.secondaryButton}
                                                                                                          disabled={processing}
                                                                                                          onClick={closeModal}
                                                                                                        >
                                                                                                          Close
                                                                                                        </button>

                                                                                                        {selectedRequest.status ===
                                                                                                          "MANAGER_APPROVED" && (
                                                                                                          <button
                                                                                                            type="button"
                                                                                                            style={
                                                                                                              processing
                                                                                                                ? styles.disabledButton
                                                                                                                : styles.primaryButton
                                                                                                            }
                                                                                                            disabled={processing}
                                                                                                            onClick={() =>
                                                                                                              void processRequest()
                                                                                                            }
                                                                                                          >
                                                                                                            {processing
                                                                                                              ? "Checking Stock..."
                                                                                                              : "Check Stock"}
                                                                                                          </button>
                                                                                                        )}

                                                                                                        {selectedRequest.status ===
                                                                                                          "PENDING_PROCUREMENT" && (
                                                                                                          <button
                                                                                                            type="button"
                                                                                                            style={
                                                                                                              processing
                                                                                                                ? styles.disabledButton
                                                                                                                : styles.primaryButton
                                                                                                            }
                                                                                                            disabled={processing}
                                                                                                            onClick={() =>
                                                                                                              void recheckStock()
                                                                                                            }
                                                                                                          >
                                                                                                            {processing
                                                                                                              ? "Checking Stock..."
                                                                                                              : "Recheck Stock"}
                                                                                                          </button>
                                                                                                        )}


                                                                                                      </div>
                                                                                                    </div>
                                                                                                  </div>
                                                                                                )}

                                                                                                {/* ===================================================
                                                                                                    END MODALS
                                                                                                    =================================================== */}
                                                                                              </div>
                                                                                            );
                                                                                          }
                                                                                          /* =========================================================
                                                                                             HELPERS
                                                                                             ========================================================= */

                                                                                          function getInitials(name?: string | null) {
                                                                                            if (!name) {
                                                                                              return "?";
                                                                                            }

                                                                                            const parts = name
                                                                                              .trim()
                                                                                              .split(/\s+/)
                                                                                              .filter(Boolean);

                                                                                            if (parts.length === 0) {
                                                                                              return "?";
                                                                                            }

                                                                                            if (parts.length === 1) {
                                                                                              return parts[0].charAt(0).toUpperCase();
                                                                                            }

                                                                                            return (
                                                                                              parts[0].charAt(0) +
                                                                                              parts[parts.length - 1].charAt(0)
                                                                                            ).toUpperCase();
                                                                                          }

                                                                                          function formatDate(value?: string | null) {
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

                                                                                          function formatDateTime(value?: string | null) {
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
                                                                                            }).format(date);
                                                                                          }

                                                                                          function formatMoney(
                                                                                            value?: number | string | null
                                                                                          ) {
                                                                                            if (
                                                                                              value === null ||
                                                                                              value === undefined ||
                                                                                              value === ""
                                                                                            ) {
                                                                                              return "-";
                                                                                            }

                                                                                            const amount = Number(value);

                                                                                            if (Number.isNaN(amount)) {
                                                                                              return String(value);
                                                                                            }

                                                                                            return new Intl.NumberFormat("en-IN", {
                                                                                              style: "currency",
                                                                                              currency: "INR",
                                                                                              maximumFractionDigits: 0,
                                                                                            }).format(amount);
                                                                                          }

                                                                                          function prettyStatus(
                                                                                            status?: string | null
                                                                                          ) {
                                                                                            if (!status) {
                                                                                              return "-";
                                                                                            }

                                                                                            return status
                                                                                              .replaceAll("_", " ")
                                                                                              .toLowerCase()
                                                                                              .replace(/\b\w/g, (character) =>
                                                                                                character.toUpperCase()
                                                                                              );
                                                                                          }

                                                                                          /* =========================================================
                                                                                             ONBOARDING WORKFLOW STATUS HELPERS
                                                                                             ========================================================= */

                                                                                          function isAfterStockCheck(
                                                                                            status?: string | null
                                                                                          ) {
                                                                                            return [
                                                                                              "PENDING_ALLOCATION",
                                                                                              "ALLOCATED",

                                                                                              "PR_REQUIRED",
                                                                                              "PENDING_FINANCE_APPROVAL",
                                                                                              "FINANCE_APPROVED",
                                                                                              "FINANCE_REJECTED",

                                                                                              "PENDING_PR_VP_APPROVAL",
                                                                                              "PR_VP_APPROVED",
                                                                                              "PR_VP_REJECTED",

                                                                                              "PENDING_VENDOR_ORDER",
                                                                                              "ORDER_PLACED",
                                                                                              "PENDING_DELIVERY",

                                                                                              "PENDING_INSPECTION",
                                                                                              "INSPECTION_PASSED",
                                                                                              "INSPECTION_FAILED",

                                                                                              "COMPLETED",
                                                                                            ].includes(status ?? "");
                                                                                          }

                                                                                          function isFulfilmentStage(
                                                                                            status?: string | null
                                                                                          ) {
                                                                                            return [
                                                                                              "PENDING_ALLOCATION",

                                                                                              "PR_REQUIRED",
                                                                                              "PENDING_FINANCE_APPROVAL",
                                                                                              "FINANCE_APPROVED",

                                                                                              "PENDING_PR_VP_APPROVAL",
                                                                                              "PR_VP_APPROVED",

                                                                                              "PENDING_VENDOR_ORDER",
                                                                                              "ORDER_PLACED",
                                                                                              "PENDING_DELIVERY",

                                                                                              "PENDING_INSPECTION",
                                                                                              "INSPECTION_PASSED",
                                                                                              "INSPECTION_FAILED",
                                                                                            ].includes(status ?? "");
                                                                                          }

                                                                                          /* =========================================================
                                                                                             SUMMARY CARD
                                                                                             ========================================================= */

                                                                                          function SummaryCard({
                                                                                            label,
                                                                                            value,
                                                                                            description,
                                                                                          }: {
                                                                                            label: string;
                                                                                            value: number;
                                                                                            description: string;
                                                                                          }) {
                                                                                            return (
                                                                                              <div style={styles.summaryCard}>
                                                                                                <div style={styles.summaryLabel}>
                                                                                                  {label}
                                                                                                </div>

                                                                                                <div style={styles.summaryValue}>
                                                                                                  {value}
                                                                                                </div>

                                                                                                <div style={styles.summaryDescription}>
                                                                                                  {description}
                                                                                                </div>
                                                                                              </div>
                                                                                            );
                                                                                          }

                                                                                          /* =========================================================
                                                                                             DETAIL FIELD
                                                                                             ========================================================= */

                                                                                          function Detail({
                                                                                            label,
                                                                                            value,
                                                                                          }: {
                                                                                            label: string;
                                                                                            value?: string | number | null;
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
                                                                                                    : value}
                                                                                                </div>
                                                                                              </div>
                                                                                            );
                                                                                          }

                                                                                          /* =========================================================
                                                                                             SECONDARY DEVICE STATUS BADGE
                                                                                             ========================================================= */

                                                                                          function StatusBadge({
                                                                                            status,
                                                                                          }: {
                                                                                            status?: string | null;
                                                                                          }) {
                                                                                            const normalized = status ?? "";

                                                                                            let background = "#f3f4f6";
                                                                                            let color = "#374151";

                                                                                            if (normalized === "MANAGER_APPROVED") {
                                                                                              background = "#dbeafe";
                                                                                              color = "#1d4ed8";
                                                                                            }

                                                                                            if (normalized === "PENDING_ASSIGNMENT") {
                                                                                              background = "#fef3c7";
                                                                                              color = "#92400e";
                                                                                            }

                                                                                            if (normalized === "PENDING_PROCUREMENT") {
                                                                                              background = "#ffedd5";
                                                                                              color = "#9a3412";
                                                                                            }

                                                                                            if (normalized === "FULFILLED") {
                                                                                              background = "#dcfce7";
                                                                                              color = "#166534";
                                                                                            }

                                                                                            if (
                                                                                              normalized === "REJECTED" ||
                                                                                              normalized.includes("REJECTED")
                                                                                            ) {
                                                                                              background = "#fee2e2";
                                                                                              color = "#991b1b";
                                                                                            }

                                                                                            return (
                                                                                              <span
                                                                                                style={{
                                                                                                  ...styles.statusBadge,
                                                                                                  background,
                                                                                                  color,
                                                                                                }}
                                                                                              >
                                                                                                {prettyStatus(normalized)}
                                                                                              </span>
                                                                                            );
                                                                                          }

                                                                                          /* =========================================================
                                                                                             ONBOARDING STATUS BADGE
                                                                                             ========================================================= */

                                                                                          function OnboardingStatusBadge({
                                                                                            status,
                                                                                          }: {
                                                                                            status?: string | null;
                                                                                          }) {
                                                                                            const normalized = status ?? "";

                                                                                            let background = "#f3f4f6";
                                                                                            let color = "#374151";

                                                                                            if (
                                                                                              normalized === "PENDING_ASSET_ADMIN" ||
                                                                                              normalized === "PENDING_VP_APPROVAL"
                                                                                            ) {
                                                                                              background = "#dbeafe";
                                                                                              color = "#1d4ed8";
                                                                                            }

                                                                                            if (normalized === "PENDING_STOCK_CHECK") {
                                                                                              background = "#fef3c7";
                                                                                              color = "#92400e";
                                                                                            }

                                                                                            if (
                                                                                              normalized === "PR_REQUIRED" ||
                                                                                              normalized === "PENDING_FINANCE_APPROVAL" ||
                                                                                              normalized === "PENDING_PR_VP_APPROVAL" ||
                                                                                              normalized === "PENDING_VENDOR_ORDER" ||
                                                                                              normalized === "ORDER_PLACED" ||
                                                                                              normalized === "PENDING_DELIVERY" ||
                                                                                              normalized === "PENDING_INSPECTION"
                                                                                            ) {
                                                                                              background = "#ffedd5";
                                                                                              color = "#9a3412";
                                                                                            }

                                                                                            if (
                                                                                              normalized === "FINANCE_APPROVED" ||
                                                                                              normalized === "PR_VP_APPROVED" ||
                                                                                              normalized === "INSPECTION_PASSED" ||
                                                                                              normalized === "ALLOCATED" ||
                                                                                              normalized === "COMPLETED"
                                                                                            ) {
                                                                                              background = "#dcfce7";
                                                                                              color = "#166534";
                                                                                            }

                                                                                            if (
                                                                                              normalized === "VP_REJECTED" ||
                                                                                              normalized === "FINANCE_REJECTED" ||
                                                                                              normalized === "PR_VP_REJECTED" ||
                                                                                              normalized === "INSPECTION_FAILED"
                                                                                            ) {
                                                                                              background = "#fee2e2";
                                                                                              color = "#991b1b";
                                                                                            }

                                                                                            return (
                                                                                              <span
                                                                                                style={{
                                                                                                  ...styles.statusBadge,
                                                                                                  background,
                                                                                                  color,
                                                                                                }}
                                                                                              >
                                                                                                {prettyStatus(normalized)}
                                                                                              </span>
                                                                                            );
                                                                                          }
                                                                                          /* =========================================================
                                                                                             WORKFLOW ITEM
                                                                                             ========================================================= */

                                                                                          function WorkflowItem({
                                                                                            number,
                                                                                            title,
                                                                                            description,
                                                                                            state,
                                                                                          }: {
                                                                                            number: string;
                                                                                            title: string;
                                                                                            description: string;
                                                                                            state: "done" | "active" | "pending";
                                                                                          }) {
                                                                                            const circleStyle =
                                                                                              state === "done"
                                                                                                ? styles.workflowCircleDone
                                                                                                : state === "active"
                                                                                                  ? styles.workflowCircleActive
                                                                                                  : styles.workflowCirclePending;

                                                                                            const titleStyle =
                                                                                              state === "pending"
                                                                                                ? styles.workflowTitlePending
                                                                                                : styles.workflowTitle;

                                                                                            return (
                                                                                              <div style={styles.workflowItem}>
                                                                                                <div
                                                                                                  style={{
                                                                                                    ...styles.workflowCircle,
                                                                                                    ...circleStyle,
                                                                                                  }}
                                                                                                >
                                                                                                  {state === "done" ? "✓" : number}
                                                                                                </div>

                                                                                                <div style={styles.workflowContent}>
                                                                                                  <div style={titleStyle}>
                                                                                                    {title}
                                                                                                  </div>

                                                                                                  <div style={styles.workflowDescription}>
                                                                                                    {description}
                                                                                                  </div>
                                                                                                </div>
                                                                                              </div>
                                                                                            );
                                                                                          }

                                                                                          /* =========================================================
                                                                                             WORKFLOW ARROW
                                                                                             ========================================================= */

                                                                                          function WorkflowArrow() {
                                                                                            return (
                                                                                              <div style={styles.workflowArrow}>
                                                                                                →
                                                                                              </div>
                                                                                            );
                                                                                          }
                                                                                          /* =========================================================
                                                                                             STYLES
                                                                                             ========================================================= */

                                                                                          const styles: Record<string, CSSProperties> = {
                                                                                            page: {
                                                                                              minHeight: "100vh",
                                                                                              background: "#f8fafc",
                                                                                              display: "flex",
                                                                                            },

                                                                                            main: {
                                                                                              flex: 1,
                                                                                              minWidth: 0,
                                                                                              padding: "32px",
                                                                                              overflowX: "hidden",
                                                                                            },

                                                                                            /* =======================================================
                                                                                               HEADER
                                                                                               ======================================================= */

                                                                                            header: {
                                                                                              display: "flex",
                                                                                              alignItems: "flex-start",
                                                                                              justifyContent: "space-between",
                                                                                              gap: "20px",
                                                                                              marginBottom: "28px",
                                                                                            },

                                                                                            title: {
                                                                                              margin: 0,
                                                                                              fontSize: "30px",
                                                                                              fontWeight: 800,
                                                                                              lineHeight: 1.2,
                                                                                              color: "#0f172a",
                                                                                            },

                                                                                            subtitle: {
                                                                                              margin: "8px 0 0",
                                                                                              maxWidth: "760px",
                                                                                              fontSize: "14px",
                                                                                              lineHeight: 1.6,
                                                                                              color: "#64748b",
                                                                                            },

                                                                                            refreshButton: {
                                                                                              border: "1px solid #cbd5e1",
                                                                                              background: "#ffffff",
                                                                                              color: "#334155",
                                                                                              borderRadius: "10px",
                                                                                              padding: "10px 16px",
                                                                                              fontSize: "13px",
                                                                                              fontWeight: 700,
                                                                                              cursor: "pointer",
                                                                                              whiteSpace: "nowrap",
                                                                                            },

                                                                                            /* =======================================================
                                                                                               SUMMARY CARDS
                                                                                               ======================================================= */

                                                                                            onboardingSummary: {
                                                                                              display: "grid",
                                                                                              gridTemplateColumns:
                                                                                                "repeat(auto-fit, minmax(220px, 1fr))",
                                                                                              gap: "16px",
                                                                                              marginBottom: "24px",
                                                                                            },

                                                                                            summaryGrid: {
                                                                                              display: "grid",
                                                                                              gridTemplateColumns:
                                                                                                "repeat(auto-fit, minmax(190px, 1fr))",
                                                                                              gap: "16px",
                                                                                              marginBottom: "24px",
                                                                                            },

                                                                                            summaryCard: {
                                                                                              background: "#ffffff",
                                                                                              border: "1px solid #e2e8f0",
                                                                                              borderRadius: "14px",
                                                                                              padding: "20px",
                                                                                              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
                                                                                            },

                                                                                            summaryLabel: {
                                                                                              fontSize: "13px",
                                                                                              fontWeight: 700,
                                                                                              color: "#64748b",
                                                                                            },

                                                                                            summaryValue: {
                                                                                              marginTop: "8px",
                                                                                              fontSize: "30px",
                                                                                              lineHeight: 1,
                                                                                              fontWeight: 800,
                                                                                              color: "#0f172a",
                                                                                            },

                                                                                            summaryDescription: {
                                                                                              marginTop: "8px",
                                                                                              fontSize: "12px",
                                                                                              lineHeight: 1.5,
                                                                                              color: "#94a3b8",
                                                                                            },

                                                                                            pendingCountBadge: {
                                                                                              display: "inline-flex",
                                                                                              alignItems: "center",
                                                                                              borderRadius: "999px",
                                                                                              padding: "6px 11px",
                                                                                              background: "#fef3c7",
                                                                                              color: "#92400e",
                                                                                              fontSize: "12px",
                                                                                              fontWeight: 800,
                                                                                              whiteSpace: "nowrap",
                                                                                            },

                                                                                            /* =======================================================
                                                                                               CARD
                                                                                               ======================================================= */

                                                                                            card: {
                                                                                              background: "#ffffff",
                                                                                              border: "1px solid #e2e8f0",
                                                                                              borderRadius: "16px",
                                                                                              overflow: "hidden",
                                                                                              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
                                                                                            },

                                                                                            cardHeader: {
                                                                                              padding: "22px 24px",
                                                                                              display: "flex",
                                                                                              alignItems: "flex-start",
                                                                                              justifyContent: "space-between",
                                                                                              gap: "16px",
                                                                                              borderBottom: "1px solid #e2e8f0",
                                                                                            },

                                                                                            cardTitle: {
                                                                                              margin: 0,
                                                                                              fontSize: "18px",
                                                                                              fontWeight: 800,
                                                                                              color: "#0f172a",
                                                                                            },

                                                                                            cardSubtitle: {
                                                                                              margin: "6px 0 0",
                                                                                              fontSize: "13px",
                                                                                              lineHeight: 1.5,
                                                                                              color: "#64748b",
                                                                                            },

                                                                                            /* =======================================================
                                                                                               FILTERS
                                                                                               ======================================================= */

                                                                                            filters: {
                                                                                              display: "flex",
                                                                                              alignItems: "center",
                                                                                              flexWrap: "wrap",
                                                                                              gap: "10px",
                                                                                              padding: "16px 24px",
                                                                                              borderBottom: "1px solid #e2e8f0",
                                                                                              background: "#ffffff",
                                                                                            },

                                                                                            searchInput: {
                                                                                              flex: "1 1 300px",
                                                                                              minWidth: "220px",
                                                                                              height: "42px",
                                                                                              border: "1px solid #cbd5e1",
                                                                                              borderRadius: "10px",
                                                                                              padding: "0 13px",
                                                                                              outline: "none",
                                                                                              background: "#ffffff",
                                                                                              color: "#0f172a",
                                                                                              fontSize: "13px",
                                                                                            },

                                                                                            select: {
                                                                                              minWidth: "190px",
                                                                                              height: "42px",
                                                                                              border: "1px solid #cbd5e1",
                                                                                              borderRadius: "10px",
                                                                                              padding: "0 12px",
                                                                                              outline: "none",
                                                                                              background: "#ffffff",
                                                                                              color: "#334155",
                                                                                              fontSize: "13px",
                                                                                              cursor: "pointer",
                                                                                            },

                                                                                            /* =======================================================
                                                                                               TABLE
                                                                                               ======================================================= */

                                                                                            tableWrapper: {
                                                                                              width: "100%",
                                                                                              overflowX: "auto",
                                                                                            },

                                                                                            table: {
                                                                                              width: "100%",
                                                                                              minWidth: "1050px",
                                                                                              borderCollapse: "collapse",
                                                                                            },

                                                                                            th: {
                                                                                              padding: "13px 16px",
                                                                                              borderBottom: "1px solid #e2e8f0",
                                                                                              background: "#f8fafc",
                                                                                              color: "#64748b",
                                                                                              fontSize: "11px",
                                                                                              fontWeight: 800,
                                                                                              letterSpacing: "0.04em",
                                                                                              textAlign: "left",
                                                                                              whiteSpace: "nowrap",
                                                                                            },

                                                                                            td: {
                                                                                              padding: "15px 16px",
                                                                                              borderBottom: "1px solid #f1f5f9",
                                                                                              color: "#334155",
                                                                                              fontSize: "13px",
                                                                                              verticalAlign: "middle",
                                                                                            },

                                                                                            emptyCell: {
                                                                                              padding: "42px 20px",
                                                                                              textAlign: "center",
                                                                                              color: "#94a3b8",
                                                                                              fontSize: "14px",
                                                                                            },

                                                                                            requestNumber: {
                                                                                              color: "#2563eb",
                                                                                              fontWeight: 800,
                                                                                              whiteSpace: "nowrap",
                                                                                            },

                                                                                            employeeCell: {
                                                                                              display: "flex",
                                                                                              alignItems: "center",
                                                                                              gap: "11px",
                                                                                            },

                                                                                            avatar: {
                                                                                              width: "36px",
                                                                                              height: "36px",
                                                                                              flex: "0 0 36px",
                                                                                              borderRadius: "50%",
                                                                                              display: "flex",
                                                                                              alignItems: "center",
                                                                                              justifyContent: "center",
                                                                                              background: "#e0e7ff",
                                                                                              color: "#4338ca",
                                                                                              fontSize: "12px",
                                                                                              fontWeight: 800,
                                                                                            },

                                                                                            primaryText: {
                                                                                              color: "#0f172a",
                                                                                              fontSize: "13px",
                                                                                              fontWeight: 700,
                                                                                            },

                                                                                            secondaryText: {
                                                                                              marginTop: "3px",
                                                                                              color: "#94a3b8",
                                                                                              fontSize: "11px",
                                                                                            },

                                                                                            reasonPreview: {
                                                                                              marginTop: "4px",
                                                                                              maxWidth: "240px",
                                                                                              overflow: "hidden",
                                                                                              textOverflow: "ellipsis",
                                                                                              whiteSpace: "nowrap",
                                                                                              color: "#94a3b8",
                                                                                              fontSize: "11px",
                                                                                            },

                                                                                            /* =======================================================
                                                                                               BASIC BUTTONS
                                                                                               ======================================================= */

                                                                                            primaryButton: {
                                                                                              border: "none",
                                                                                              borderRadius: "10px",
                                                                                              padding: "10px 16px",
                                                                                              background: "#2563eb",
                                                                                              color: "#ffffff",
                                                                                              fontSize: "13px",
                                                                                              fontWeight: 800,
                                                                                              cursor: "pointer",
                                                                                              whiteSpace: "nowrap",
                                                                                            },

                                                                                            secondaryButton: {
                                                                                              border: "1px solid #cbd5e1",
                                                                                              borderRadius: "10px",
                                                                                              padding: "10px 16px",
                                                                                              background: "#ffffff",
                                                                                              color: "#334155",
                                                                                              fontSize: "13px",
                                                                                              fontWeight: 700,
                                                                                              cursor: "pointer",
                                                                                              whiteSpace: "nowrap",
                                                                                            },

                                                                                            processButton: {
                                                                                              border: "none",
                                                                                              borderRadius: "9px",
                                                                                              padding: "8px 13px",
                                                                                              background: "#2563eb",
                                                                                              color: "#ffffff",
                                                                                              fontSize: "12px",
                                                                                              fontWeight: 800,
                                                                                              cursor: "pointer",
                                                                                              whiteSpace: "nowrap",
                                                                                            },

                                                                                            viewButton: {
                                                                                              border: "1px solid #cbd5e1",
                                                                                              borderRadius: "9px",
                                                                                              padding: "8px 13px",
                                                                                              background: "#ffffff",
                                                                                              color: "#334155",
                                                                                              fontSize: "12px",
                                                                                              fontWeight: 700,
                                                                                              cursor: "pointer",
                                                                                              whiteSpace: "nowrap",
                                                                                            },

                                                                                            smallButton: {
                                                                                              border: "1px solid #cbd5e1",
                                                                                              borderRadius: "8px",
                                                                                              padding: "8px 12px",
                                                                                              background: "#ffffff",
                                                                                              color: "#334155",
                                                                                              fontSize: "12px",
                                                                                              fontWeight: 700,
                                                                                              cursor: "pointer",
                                                                                              whiteSpace: "nowrap",
                                                                                            },

                                                                                            disabledButton: {
                                                                                              border: "none",
                                                                                              borderRadius: "10px",
                                                                                              padding: "10px 16px",
                                                                                              background: "#cbd5e1",
                                                                                              color: "#64748b",
                                                                                              fontSize: "13px",
                                                                                              fontWeight: 800,
                                                                                              cursor: "not-allowed",
                                                                                              whiteSpace: "nowrap",
                                                                                            },

                                                                                            forwardButton: {
                                                                                              border: "none",
                                                                                              borderRadius: "10px",
                                                                                              padding: "10px 18px",
                                                                                              background: "#4f46e5",
                                                                                              color: "#ffffff",
                                                                                              fontSize: "13px",
                                                                                              fontWeight: 800,
                                                                                              cursor: "pointer",
                                                                                              whiteSpace: "nowrap",
                                                                                            },

                                                                                            allocateButton: {
                                                                                              border: "none",
                                                                                              borderRadius: "10px",
                                                                                              padding: "11px 18px",
                                                                                              background: "#16a34a",
                                                                                              color: "#ffffff",
                                                                                              fontSize: "13px",
                                                                                              fontWeight: 800,
                                                                                              cursor: "pointer",
                                                                                              whiteSpace: "nowrap",
                                                                                            },

                                                                                            purchaseRequestButton: {
                                                                                              border: "none",
                                                                                              borderRadius: "10px",
                                                                                              padding: "11px 18px",
                                                                                              background: "#c2410c",
                                                                                              color: "#ffffff",
                                                                                              fontSize: "13px",
                                                                                              fontWeight: 800,
                                                                                              cursor: "pointer",
                                                                                              whiteSpace: "nowrap",
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
                                                                                                padding: "24px",
                                                                                                background: "rgba(15, 23, 42, 0.58)",
                                                                                                backdropFilter: "blur(3px)",
                                                                                              },

                                                                                              modal: {
                                                                                                width: "min(920px, 100%)",
                                                                                                maxHeight: "92vh",
                                                                                                display: "flex",
                                                                                                flexDirection: "column",
                                                                                                background: "#ffffff",
                                                                                                borderRadius: "18px",
                                                                                                overflow: "hidden",
                                                                                                boxShadow: "0 24px 70px rgba(15, 23, 42, 0.25)",
                                                                                              },

                                                                                              modalHeader: {
                                                                                                display: "flex",
                                                                                                alignItems: "flex-start",
                                                                                                justifyContent: "space-between",
                                                                                                gap: "20px",
                                                                                                padding: "22px 24px",
                                                                                                borderBottom: "1px solid #e2e8f0",
                                                                                              },

                                                                                              modalTitle: {
                                                                                                margin: 0,
                                                                                                color: "#0f172a",
                                                                                                fontSize: "20px",
                                                                                                fontWeight: 800,
                                                                                              },

                                                                                              modalSubtitle: {
                                                                                                margin: "6px 0 0",
                                                                                                color: "#64748b",
                                                                                                fontSize: "13px",
                                                                                                lineHeight: 1.5,
                                                                                              },

                                                                                              closeButton: {
                                                                                                width: "36px",
                                                                                                height: "36px",
                                                                                                flex: "0 0 36px",
                                                                                                border: "1px solid #e2e8f0",
                                                                                                borderRadius: "9px",
                                                                                                background: "#ffffff",
                                                                                                color: "#64748b",
                                                                                                fontSize: "22px",
                                                                                                lineHeight: 1,
                                                                                                cursor: "pointer",
                                                                                              },

                                                                                              modalBody: {
                                                                                                flex: 1,
                                                                                                minHeight: 0,
                                                                                                overflowY: "auto",
                                                                                                padding: "24px",
                                                                                              },

                                                                                              modalFooter: {
                                                                                                display: "flex",
                                                                                                alignItems: "center",
                                                                                                justifyContent: "flex-end",
                                                                                                flexWrap: "wrap",
                                                                                                gap: "10px",
                                                                                                padding: "16px 24px",
                                                                                                borderTop: "1px solid #e2e8f0",
                                                                                                background: "#f8fafc",
                                                                                              },

                                                                                              modalLoading: {
                                                                                                padding: "50px 20px",
                                                                                                textAlign: "center",
                                                                                                color: "#64748b",
                                                                                                fontSize: "14px",
                                                                                              },

                                                                                              modalStatusRow: {
                                                                                                display: "flex",
                                                                                                alignItems: "center",
                                                                                                justifyContent: "space-between",
                                                                                                gap: "16px",
                                                                                                marginBottom: "24px",
                                                                                                padding: "14px 16px",
                                                                                                border: "1px solid #e2e8f0",
                                                                                                borderRadius: "12px",
                                                                                                background: "#f8fafc",
                                                                                              },

                                                                                              modalRequestNumber: {
                                                                                                marginTop: "4px",
                                                                                                color: "#0f172a",
                                                                                                fontSize: "16px",
                                                                                                fontWeight: 800,
                                                                                              },

                                                                                              /* =======================================================
                                                                                                 ERROR / SUCCESS
                                                                                                 ======================================================= */

                                                                                              errorBox: {
                                                                                                marginBottom: "18px",
                                                                                                padding: "12px 14px",
                                                                                                border: "1px solid #fecaca",
                                                                                                borderRadius: "10px",
                                                                                                background: "#fef2f2",
                                                                                                color: "#991b1b",
                                                                                                fontSize: "13px",
                                                                                                lineHeight: 1.5,
                                                                                              },

                                                                                              successBox: {
                                                                                                marginBottom: "18px",
                                                                                                padding: "12px 14px",
                                                                                                border: "1px solid #bbf7d0",
                                                                                                borderRadius: "10px",
                                                                                                background: "#f0fdf4",
                                                                                                color: "#166534",
                                                                                                fontSize: "13px",
                                                                                                lineHeight: 1.5,
                                                                                              },

                                                                                              /* =======================================================
                                                                                                 DETAIL SECTIONS
                                                                                                 ======================================================= */

                                                                                              detailSection: {
                                                                                                marginBottom: "24px",
                                                                                              },

                                                                                              sectionTitle: {
                                                                                                margin: "0 0 13px",
                                                                                                color: "#0f172a",
                                                                                                fontSize: "15px",
                                                                                                fontWeight: 800,
                                                                                              },

                                                                                              sectionLabel: {
                                                                                                color: "#94a3b8",
                                                                                                fontSize: "10px",
                                                                                                fontWeight: 800,
                                                                                                letterSpacing: "0.08em",
                                                                                              },

                                                                                              detailGrid: {
                                                                                                display: "grid",
                                                                                                gridTemplateColumns:
                                                                                                  "repeat(auto-fit, minmax(180px, 1fr))",
                                                                                                gap: "12px",
                                                                                              },

                                                                                              onboardingDetailGrid: {
                                                                                                display: "grid",
                                                                                                gridTemplateColumns:
                                                                                                  "repeat(auto-fit, minmax(190px, 1fr))",
                                                                                                gap: "12px",
                                                                                              },

                                                                                              detailItem: {
                                                                                                minWidth: 0,
                                                                                                padding: "12px 14px",
                                                                                                border: "1px solid #e2e8f0",
                                                                                                borderRadius: "10px",
                                                                                                background: "#f8fafc",
                                                                                              },

                                                                                              detailLabel: {
                                                                                                marginBottom: "5px",
                                                                                                color: "#94a3b8",
                                                                                                fontSize: "10px",
                                                                                                fontWeight: 800,
                                                                                                letterSpacing: "0.04em",
                                                                                                textTransform: "uppercase",
                                                                                              },

                                                                                              detailValue: {
                                                                                                overflowWrap: "anywhere",
                                                                                                color: "#334155",
                                                                                                fontSize: "13px",
                                                                                                fontWeight: 700,
                                                                                                lineHeight: 1.45,
                                                                                              },

                                                                                              /* =======================================================
                                                                                                 REQUEST INFORMATION
                                                                                                 ======================================================= */

                                                                                              requestBox: {
                                                                                                padding: "16px",
                                                                                                border: "1px solid #e2e8f0",
                                                                                                borderRadius: "12px",
                                                                                                background: "#f8fafc",
                                                                                              },

                                                                                              requestCategory: {
                                                                                                marginBottom: "14px",
                                                                                                color: "#0f172a",
                                                                                                fontSize: "17px",
                                                                                                fontWeight: 800,
                                                                                              },

                                                                                              requestLabel: {
                                                                                                marginBottom: "5px",
                                                                                                color: "#94a3b8",
                                                                                                fontSize: "10px",
                                                                                                fontWeight: 800,
                                                                                                letterSpacing: "0.05em",
                                                                                                textTransform: "uppercase",
                                                                                              },

                                                                                              requestReason: {
                                                                                                color: "#475569",
                                                                                                fontSize: "13px",
                                                                                                lineHeight: 1.65,
                                                                                                whiteSpace: "pre-wrap",
                                                                                                overflowWrap: "anywhere",
                                                                                              },

                                                                                              commentBox: {
                                                                                                marginTop: "12px",
                                                                                                padding: "14px",
                                                                                                border: "1px solid #e2e8f0",
                                                                                                borderRadius: "10px",
                                                                                                background: "#f8fafc",
                                                                                              },

                                                                                              commentDisplayBox: {
                                                                                                marginTop: "14px",
                                                                                                padding: "14px",
                                                                                                border: "1px solid #e2e8f0",
                                                                                                borderRadius: "10px",
                                                                                                background: "#f8fafc",
                                                                                              },

                                                                                              /* =======================================================
                                                                                                 ASSET ADMIN REVIEW
                                                                                                 ======================================================= */

                                                                                              assetAdminActionSection: {
                                                                                                marginBottom: "24px",
                                                                                                padding: "18px",
                                                                                                border: "1px solid #c7d2fe",
                                                                                                borderRadius: "14px",
                                                                                                background: "#eef2ff",
                                                                                              },

                                                                                              assetAdminActionHeader: {
                                                                                                marginBottom: "16px",
                                                                                              },

                                                                                              assetAdminActionTitle: {
                                                                                                color: "#312e81",
                                                                                                fontSize: "15px",
                                                                                                fontWeight: 800,
                                                                                              },

                                                                                              assetAdminActionText: {
                                                                                                marginTop: "5px",
                                                                                                color: "#6366f1",
                                                                                                fontSize: "12px",
                                                                                                lineHeight: 1.55,
                                                                                              },

                                                                                              commentLabel: {
                                                                                                display: "block",
                                                                                                marginBottom: "7px",
                                                                                                color: "#334155",
                                                                                                fontSize: "12px",
                                                                                                fontWeight: 800,
                                                                                              },

                                                                                              optionalText: {
                                                                                                color: "#94a3b8",
                                                                                                fontWeight: 500,
                                                                                              },

                                                                                              commentTextarea: {
                                                                                                width: "100%",
                                                                                                minHeight: "100px",
                                                                                                resize: "vertical",
                                                                                                boxSizing: "border-box",
                                                                                                border: "1px solid #c7d2fe",
                                                                                                borderRadius: "10px",
                                                                                                padding: "11px 12px",
                                                                                                outline: "none",
                                                                                                background: "#ffffff",
                                                                                                color: "#0f172a",
                                                                                                fontFamily: "inherit",
                                                                                                fontSize: "13px",
                                                                                                lineHeight: 1.5,
                                                                                              },

                                                                                              commentCounter: {
                                                                                                marginTop: "5px",
                                                                                                textAlign: "right",
                                                                                                color: "#94a3b8",
                                                                                                fontSize: "10px",
                                                                                              },

                                                                                              /* =======================================================
                                                                                                 FORWARDED / WAITING
                                                                                                 ======================================================= */

                                                                                              forwardedBox: {
                                                                                                display: "flex",
                                                                                                alignItems: "flex-start",
                                                                                                gap: "12px",
                                                                                                marginBottom: "24px",
                                                                                                padding: "16px",
                                                                                                border: "1px solid #bfdbfe",
                                                                                                borderRadius: "12px",
                                                                                                background: "#eff6ff",
                                                                                              },

                                                                                              forwardedIcon: {
                                                                                                width: "28px",
                                                                                                height: "28px",
                                                                                                flex: "0 0 28px",
                                                                                                display: "flex",
                                                                                                alignItems: "center",
                                                                                                justifyContent: "center",
                                                                                                borderRadius: "50%",
                                                                                                background: "#2563eb",
                                                                                                color: "#ffffff",
                                                                                                fontSize: "13px",
                                                                                                fontWeight: 900,
                                                                                              },

                                                                                              forwardedTitle: {
                                                                                                color: "#1e40af",
                                                                                                fontSize: "13px",
                                                                                                fontWeight: 800,
                                                                                              },

                                                                                              forwardedText: {
                                                                                                marginTop: "4px",
                                                                                                color: "#3b82f6",
                                                                                                fontSize: "12px",
                                                                                                lineHeight: 1.55,
                                                                                              },

                                                                                              /* =======================================================
                                                                                                 REJECTED
                                                                                                 ======================================================= */

                                                                                              rejectedBox: {
                                                                                                marginBottom: "24px",
                                                                                                padding: "16px",
                                                                                                border: "1px solid #fecaca",
                                                                                                borderRadius: "12px",
                                                                                                background: "#fef2f2",
                                                                                              },

                                                                                              rejectedTitle: {
                                                                                                color: "#991b1b",
                                                                                                fontSize: "13px",
                                                                                                fontWeight: 800,
                                                                                              },

                                                                                              rejectedText: {
                                                                                                marginTop: "4px",
                                                                                                color: "#b91c1c",
                                                                                                fontSize: "12px",
                                                                                                lineHeight: 1.55,
                                                                                              },

                                                                                              /* =======================================================
                                                                                                 GENERIC ACTION SECTION
                                                                                                 ======================================================= */

                                                                                              actionSection: {
                                                                                                display: "flex",
                                                                                                alignItems: "center",
                                                                                                justifyContent: "space-between",
                                                                                                gap: "18px",
                                                                                                marginBottom: "24px",
                                                                                                padding: "18px",
                                                                                                border: "1px solid #dbeafe",
                                                                                                borderRadius: "12px",
                                                                                                background: "#eff6ff",
                                                                                              },

                                                                                              actionDescription: {
                                                                                                margin: "5px 0 0",
                                                                                                color: "#64748b",
                                                                                                fontSize: "12px",
                                                                                                lineHeight: 1.55,
                                                                                              },
                                                                                                /* =======================================================
                                                                                                   WORKFLOW
                                                                                                   ======================================================= */

                                                                                                workflowSection: {
                                                                                                  marginBottom: "24px",
                                                                                                  padding: "18px",
                                                                                                  border: "1px solid #e2e8f0",
                                                                                                  borderRadius: "14px",
                                                                                                  background: "#ffffff",
                                                                                                },

                                                                                                workflow: {
                                                                                                  display: "flex",
                                                                                                  alignItems: "center",
                                                                                                  gap: "8px",
                                                                                                  overflowX: "auto",
                                                                                                  padding: "8px 2px 4px",
                                                                                                },

                                                                                                workflowItem: {
                                                                                                  minWidth: "145px",
                                                                                                  display: "flex",
                                                                                                  alignItems: "center",
                                                                                                  gap: "10px",
                                                                                                },

                                                                                                workflowCircle: {
                                                                                                  width: "32px",
                                                                                                  height: "32px",
                                                                                                  flex: "0 0 32px",
                                                                                                  display: "flex",
                                                                                                  alignItems: "center",
                                                                                                  justifyContent: "center",
                                                                                                  borderRadius: "50%",
                                                                                                  fontSize: "11px",
                                                                                                  fontWeight: 900,
                                                                                                },

                                                                                                workflowCircleDone: {
                                                                                                  background: "#dcfce7",
                                                                                                  color: "#166534",
                                                                                                  border: "1px solid #86efac",
                                                                                                },

                                                                                                workflowCircleActive: {
                                                                                                  background: "#dbeafe",
                                                                                                  color: "#1d4ed8",
                                                                                                  border: "1px solid #93c5fd",
                                                                                                },

                                                                                                workflowCirclePending: {
                                                                                                  background: "#f1f5f9",
                                                                                                  color: "#94a3b8",
                                                                                                  border: "1px solid #e2e8f0",
                                                                                                },

                                                                                                workflowContent: {
                                                                                                  minWidth: 0,
                                                                                                },

                                                                                                workflowTitle: {
                                                                                                  color: "#0f172a",
                                                                                                  fontSize: "11px",
                                                                                                  fontWeight: 800,
                                                                                                  whiteSpace: "nowrap",
                                                                                                },

                                                                                                workflowTitlePending: {
                                                                                                  color: "#94a3b8",
                                                                                                  fontSize: "11px",
                                                                                                  fontWeight: 700,
                                                                                                  whiteSpace: "nowrap",
                                                                                                },

                                                                                                workflowDescription: {
                                                                                                  marginTop: "2px",
                                                                                                  color: "#94a3b8",
                                                                                                  fontSize: "9px",
                                                                                                  lineHeight: 1.35,
                                                                                                },

                                                                                                workflowArrow: {
                                                                                                  flex: "0 0 auto",
                                                                                                  color: "#cbd5e1",
                                                                                                  fontSize: "18px",
                                                                                                  fontWeight: 800,
                                                                                                },

                                                                                                /* =======================================================
                                                                                                   STOCK CHECK
                                                                                                   ======================================================= */

                                                                                                stockCheckSection: {
                                                                                                  marginBottom: "24px",
                                                                                                  padding: "18px",
                                                                                                  border: "1px solid #fde68a",
                                                                                                  borderRadius: "14px",
                                                                                                  background: "#fffbeb",
                                                                                                },

                                                                                                stockCheckHeader: {
                                                                                                  display: "flex",
                                                                                                  alignItems: "flex-start",
                                                                                                  justifyContent: "space-between",
                                                                                                  flexWrap: "wrap",
                                                                                                  gap: "14px",
                                                                                                  marginBottom: "16px",
                                                                                                },

                                                                                                stockCheckTitle: {
                                                                                                  color: "#78350f",
                                                                                                  fontSize: "15px",
                                                                                                  fontWeight: 800,
                                                                                                },

                                                                                                stockCheckText: {
                                                                                                  marginTop: "5px",
                                                                                                  maxWidth: "620px",
                                                                                                  color: "#92400e",
                                                                                                  fontSize: "12px",
                                                                                                  lineHeight: 1.55,
                                                                                                },

                                                                                                stockSummaryGrid: {
                                                                                                  display: "grid",
                                                                                                  gridTemplateColumns:
                                                                                                    "repeat(auto-fit, minmax(145px, 1fr))",
                                                                                                  gap: "10px",
                                                                                                  marginBottom: "16px",
                                                                                                },

                                                                                                stockSummaryCard: {
                                                                                                  padding: "13px",
                                                                                                  border: "1px solid #fde68a",
                                                                                                  borderRadius: "10px",
                                                                                                  background: "#ffffff",
                                                                                                },

                                                                                                stockSummaryLabel: {
                                                                                                  color: "#92400e",
                                                                                                  fontSize: "10px",
                                                                                                  fontWeight: 800,
                                                                                                  textTransform: "uppercase",
                                                                                                  letterSpacing: "0.04em",
                                                                                                },

                                                                                                stockSummaryValue: {
                                                                                                  marginTop: "5px",
                                                                                                  color: "#451a03",
                                                                                                  fontSize: "20px",
                                                                                                  fontWeight: 900,
                                                                                                },

                                                                                                shortageText: {
                                                                                                  color: "#b91c1c",
                                                                                                  fontWeight: 900,
                                                                                                },

                                                                                                stockAvailableBox: {
                                                                                                  marginTop: "14px",
                                                                                                  padding: "15px",
                                                                                                  border: "1px solid #bbf7d0",
                                                                                                  borderRadius: "12px",
                                                                                                  background: "#f0fdf4",
                                                                                                },

                                                                                                stockUnavailableBox: {
                                                                                                  marginTop: "14px",
                                                                                                  padding: "15px",
                                                                                                  border: "1px solid #fed7aa",
                                                                                                  borderRadius: "12px",
                                                                                                  background: "#fff7ed",
                                                                                                },

                                                                                                stockResultTitle: {
                                                                                                  color: "#166534",
                                                                                                  fontSize: "13px",
                                                                                                  fontWeight: 800,
                                                                                                },

                                                                                                stockResultText: {
                                                                                                  marginTop: "4px",
                                                                                                  color: "#475569",
                                                                                                  fontSize: "12px",
                                                                                                  lineHeight: 1.55,
                                                                                                },

                                                                                                stockActionRow: {
                                                                                                  display: "flex",
                                                                                                  alignItems: "center",
                                                                                                  justifyContent: "flex-end",
                                                                                                  flexWrap: "wrap",
                                                                                                  gap: "10px",
                                                                                                  marginTop: "16px",
                                                                                                },

                                                                                                /* =======================================================
                                                                                                   AVAILABLE ASSET SELECTION
                                                                                                   ======================================================= */

                                                                                                assetSelectionSection: {
                                                                                                  marginTop: "16px",
                                                                                                },

                                                                                                assetSelectionTitle: {
                                                                                                  marginBottom: "10px",
                                                                                                  color: "#334155",
                                                                                                  fontSize: "12px",
                                                                                                  fontWeight: 800,
                                                                                                },

                                                                                                assetSelectionList: {
                                                                                                  display: "grid",
                                                                                                  gap: "10px",
                                                                                                },

                                                                                                assetOption: {
                                                                                                  width: "100%",
                                                                                                  boxSizing: "border-box",
                                                                                                  display: "flex",
                                                                                                  alignItems: "flex-start",
                                                                                                  justifyContent: "space-between",
                                                                                                  gap: "16px",
                                                                                                  padding: "14px",
                                                                                                  border: "1px solid #e2e8f0",
                                                                                                  borderRadius: "11px",
                                                                                                  background: "#ffffff",
                                                                                                  cursor: "pointer",
                                                                                                  textAlign: "left",
                                                                                                },

                                                                                                assetOptionSelected: {
                                                                                                  border: "2px solid #2563eb",
                                                                                                  background: "#eff6ff",
                                                                                                },

                                                                                                assetOptionLeft: {
                                                                                                  minWidth: 0,
                                                                                                  flex: 1,
                                                                                                },

                                                                                                assetOptionRight: {
                                                                                                  flex: "0 0 auto",
                                                                                                  textAlign: "right",
                                                                                                },

                                                                                                assetName: {
                                                                                                  color: "#0f172a",
                                                                                                  fontSize: "13px",
                                                                                                  fontWeight: 800,
                                                                                                },

                                                                                                assetMeta: {
                                                                                                  marginTop: "4px",
                                                                                                  color: "#64748b",
                                                                                                  fontSize: "11px",
                                                                                                  lineHeight: 1.45,
                                                                                                },

                                                                                                assetTag: {
                                                                                                  display: "inline-flex",
                                                                                                  marginTop: "6px",
                                                                                                  padding: "4px 7px",
                                                                                                  borderRadius: "6px",
                                                                                                  background: "#f1f5f9",
                                                                                                  color: "#475569",
                                                                                                  fontSize: "10px",
                                                                                                  fontWeight: 800,
                                                                                                },

                                                                                                assetSpecifications: {
                                                                                                  marginTop: "8px",
                                                                                                  color: "#64748b",
                                                                                                  fontSize: "11px",
                                                                                                  lineHeight: 1.5,
                                                                                                  whiteSpace: "pre-wrap",
                                                                                                },

                                                                                                selectedAssetNotice: {
                                                                                                  marginTop: "12px",
                                                                                                  padding: "10px 12px",
                                                                                                  border: "1px solid #bfdbfe",
                                                                                                  borderRadius: "9px",
                                                                                                  background: "#eff6ff",
                                                                                                  color: "#1e40af",
                                                                                                  fontSize: "12px",
                                                                                                  fontWeight: 700,
                                                                                                },

                                                                                                /* =======================================================
                                                                                                   PROCUREMENT
                                                                                                   ======================================================= */

                                                                                                procurementBox: {
                                                                                                  display: "flex",
                                                                                                  alignItems: "flex-start",
                                                                                                  gap: "13px",
                                                                                                  marginBottom: "24px",
                                                                                                  padding: "17px",
                                                                                                  border: "1px solid #fed7aa",
                                                                                                  borderRadius: "13px",
                                                                                                  background: "#fff7ed",
                                                                                                },

                                                                                                procurementContent: {
                                                                                                  flex: 1,
                                                                                                  minWidth: 0,
                                                                                                },

                                                                                                procurementIcon: {
                                                                                                  width: "32px",
                                                                                                  height: "32px",
                                                                                                  flex: "0 0 32px",
                                                                                                  display: "flex",
                                                                                                  alignItems: "center",
                                                                                                  justifyContent: "center",
                                                                                                  borderRadius: "50%",
                                                                                                  background: "#ea580c",
                                                                                                  color: "#ffffff",
                                                                                                  fontSize: "15px",
                                                                                                  fontWeight: 900,
                                                                                                },

                                                                                                procurementTitle: {
                                                                                                  color: "#9a3412",
                                                                                                  fontSize: "13px",
                                                                                                  fontWeight: 800,
                                                                                                },

                                                                                                procurementText: {
                                                                                                  marginTop: "5px",
                                                                                                  color: "#c2410c",
                                                                                                  fontSize: "12px",
                                                                                                  lineHeight: 1.55,
                                                                                                },

                                                                                                procurementStatus: {
                                                                                                  display: "inline-flex",
                                                                                                  marginTop: "9px",
                                                                                                  padding: "5px 9px",
                                                                                                  borderRadius: "999px",
                                                                                                  background: "#ffedd5",
                                                                                                  color: "#9a3412",
                                                                                                  fontSize: "10px",
                                                                                                  fontWeight: 800,
                                                                                                },

                                                                                                /* =======================================================
                                                                                                   FINANCE / VP / INSPECTION INFORMATION
                                                                                                   ======================================================= */

                                                                                                reviewInfoBox: {
                                                                                                  marginBottom: "24px",
                                                                                                  padding: "16px",
                                                                                                  border: "1px solid #e2e8f0",
                                                                                                  borderRadius: "12px",
                                                                                                  background: "#f8fafc",
                                                                                                },

                                                                                                reviewInfoTitle: {
                                                                                                  marginBottom: "11px",
                                                                                                  color: "#0f172a",
                                                                                                  fontSize: "13px",
                                                                                                  fontWeight: 800,
                                                                                                },

                                                                                                reviewInfoGrid: {
                                                                                                  display: "grid",
                                                                                                  gridTemplateColumns:
                                                                                                    "repeat(auto-fit, minmax(180px, 1fr))",
                                                                                                  gap: "10px",
                                                                                                },

                                                                                                inspectionBox: {
                                                                                                  marginBottom: "24px",
                                                                                                  padding: "16px",
                                                                                                  border: "1px solid #bfdbfe",
                                                                                                  borderRadius: "12px",
                                                                                                  background: "#eff6ff",
                                                                                                },

                                                                                                inspectionTitle: {
                                                                                                  color: "#1e40af",
                                                                                                  fontSize: "13px",
                                                                                                  fontWeight: 800,
                                                                                                },

                                                                                                inspectionText: {
                                                                                                  marginTop: "5px",
                                                                                                  color: "#3b82f6",
                                                                                                  fontSize: "12px",
                                                                                                  lineHeight: 1.55,
                                                                                                },
                                                                                                  /* =======================================================
                                                                                                     FULFILLED / COMPLETED
                                                                                                     ======================================================= */

                                                                                                  fulfilledBox: {
                                                                                                    marginBottom: "24px",
                                                                                                    padding: "18px",
                                                                                                    border: "1px solid #bbf7d0",
                                                                                                    borderRadius: "14px",
                                                                                                    background: "#f0fdf4",
                                                                                                  },

                                                                                                  fulfilledHeader: {
                                                                                                    display: "flex",
                                                                                                    alignItems: "flex-start",
                                                                                                    gap: "12px",
                                                                                                    marginBottom: "14px",
                                                                                                  },

                                                                                                  fulfilledIcon: {
                                                                                                    width: "34px",
                                                                                                    height: "34px",
                                                                                                    flex: "0 0 34px",
                                                                                                    display: "flex",
                                                                                                    alignItems: "center",
                                                                                                    justifyContent: "center",
                                                                                                    borderRadius: "50%",
                                                                                                    background: "#16a34a",
                                                                                                    color: "#ffffff",
                                                                                                    fontSize: "16px",
                                                                                                    fontWeight: 900,
                                                                                                  },

                                                                                                  fulfilledTitle: {
                                                                                                    color: "#166534",
                                                                                                    fontSize: "14px",
                                                                                                    fontWeight: 800,
                                                                                                  },

                                                                                                  fulfilledText: {
                                                                                                    marginTop: "4px",
                                                                                                    color: "#15803d",
                                                                                                    fontSize: "12px",
                                                                                                    lineHeight: 1.55,
                                                                                                  },

                                                                                                  completedBox: {
                                                                                                    marginBottom: "24px",
                                                                                                    padding: "18px",
                                                                                                    border: "1px solid #bbf7d0",
                                                                                                    borderRadius: "14px",
                                                                                                    background: "#f0fdf4",
                                                                                                  },

                                                                                                  completedTitle: {
                                                                                                    color: "#166534",
                                                                                                    fontSize: "14px",
                                                                                                    fontWeight: 800,
                                                                                                  },

                                                                                                  completedText: {
                                                                                                    marginTop: "5px",
                                                                                                    color: "#15803d",
                                                                                                    fontSize: "12px",
                                                                                                    lineHeight: 1.55,
                                                                                                  },

                                                                                                  /* =======================================================
                                                                                                     CURRENT ASSETS
                                                                                                     ======================================================= */

                                                                                                  currentAssetsSection: {
                                                                                                    marginBottom: "24px",
                                                                                                  },

                                                                                                  currentAssetsList: {
                                                                                                    display: "grid",
                                                                                                    gap: "10px",
                                                                                                  },

                                                                                                  currentAssetCard: {
                                                                                                    padding: "14px",
                                                                                                    border: "1px solid #e2e8f0",
                                                                                                    borderRadius: "11px",
                                                                                                    background: "#f8fafc",
                                                                                                  },

                                                                                                  currentAssetHeader: {
                                                                                                    display: "flex",
                                                                                                    alignItems: "flex-start",
                                                                                                    justifyContent: "space-between",
                                                                                                    gap: "12px",
                                                                                                  },

                                                                                                  currentAssetName: {
                                                                                                    color: "#0f172a",
                                                                                                    fontSize: "13px",
                                                                                                    fontWeight: 800,
                                                                                                  },

                                                                                                  currentAssetTag: {
                                                                                                    color: "#475569",
                                                                                                    fontSize: "11px",
                                                                                                    fontWeight: 700,
                                                                                                  },

                                                                                                  currentAssetMeta: {
                                                                                                    marginTop: "5px",
                                                                                                    color: "#64748b",
                                                                                                    fontSize: "11px",
                                                                                                    lineHeight: 1.5,
                                                                                                  },

                                                                                                  noAssetsBox: {
                                                                                                    padding: "14px",
                                                                                                    border: "1px dashed #cbd5e1",
                                                                                                    borderRadius: "10px",
                                                                                                    background: "#f8fafc",
                                                                                                    color: "#94a3b8",
                                                                                                    fontSize: "12px",
                                                                                                    textAlign: "center",
                                                                                                  },

                                                                                                  /* =======================================================
                                                                                                     MANAGER APPROVAL
                                                                                                     ======================================================= */

                                                                                                  approvalBox: {
                                                                                                    marginBottom: "24px",
                                                                                                    padding: "16px",
                                                                                                    border: "1px solid #bfdbfe",
                                                                                                    borderRadius: "12px",
                                                                                                    background: "#eff6ff",
                                                                                                  },

                                                                                                  approvalHeader: {
                                                                                                    display: "flex",
                                                                                                    alignItems: "center",
                                                                                                    justifyContent: "space-between",
                                                                                                    flexWrap: "wrap",
                                                                                                    gap: "10px",
                                                                                                    marginBottom: "10px",
                                                                                                  },

                                                                                                  approvalTitle: {
                                                                                                    color: "#1e40af",
                                                                                                    fontSize: "13px",
                                                                                                    fontWeight: 800,
                                                                                                  },

                                                                                                  approvalText: {
                                                                                                    color: "#3b82f6",
                                                                                                    fontSize: "12px",
                                                                                                    lineHeight: 1.55,
                                                                                                  },

                                                                                                  /* =======================================================
                                                                                                     ASSIGNED ASSET
                                                                                                     ======================================================= */

                                                                                                  assignedAssetBox: {
                                                                                                    marginTop: "14px",
                                                                                                    padding: "15px",
                                                                                                    border: "1px solid #bbf7d0",
                                                                                                    borderRadius: "11px",
                                                                                                    background: "#ffffff",
                                                                                                  },

                                                                                                  assignedAssetTitle: {
                                                                                                    marginBottom: "10px",
                                                                                                    color: "#166534",
                                                                                                    fontSize: "12px",
                                                                                                    fontWeight: 800,
                                                                                                  },

                                                                                                  assignedAssetGrid: {
                                                                                                    display: "grid",
                                                                                                    gridTemplateColumns:
                                                                                                      "repeat(auto-fit, minmax(160px, 1fr))",
                                                                                                    gap: "10px",
                                                                                                  },

                                                                                                  /* =======================================================
                                                                                                     STATUS BADGE
                                                                                                     ======================================================= */

                                                                                                  statusBadge: {
                                                                                                    display: "inline-flex",
                                                                                                    alignItems: "center",
                                                                                                    justifyContent: "center",
                                                                                                    maxWidth: "100%",
                                                                                                    padding: "5px 9px",
                                                                                                    borderRadius: "999px",
                                                                                                    fontSize: "10px",
                                                                                                    lineHeight: 1.3,
                                                                                                    fontWeight: 800,
                                                                                                    whiteSpace: "nowrap",
                                                                                                  },

                                                                                                  /* =======================================================
                                                                                                     SECONDARY DEVICE STOCK
                                                                                                     ======================================================= */

                                                                                                  stockBox: {
                                                                                                    marginBottom: "24px",
                                                                                                    padding: "16px",
                                                                                                    border: "1px solid #fde68a",
                                                                                                    borderRadius: "12px",
                                                                                                    background: "#fffbeb",
                                                                                                  },

                                                                                                  stockTitle: {
                                                                                                    color: "#78350f",
                                                                                                    fontSize: "13px",
                                                                                                    fontWeight: 800,
                                                                                                  },

                                                                                                  stockText: {
                                                                                                    marginTop: "5px",
                                                                                                    color: "#92400e",
                                                                                                    fontSize: "12px",
                                                                                                    lineHeight: 1.55,
                                                                                                  },

                                                                                                  stockButtons: {
                                                                                                    display: "flex",
                                                                                                    alignItems: "center",
                                                                                                    flexWrap: "wrap",
                                                                                                    gap: "10px",
                                                                                                    marginTop: "14px",
                                                                                                  },

                                                                                                  /* =======================================================
                                                                                                     GENERIC INFO
                                                                                                     ======================================================= */

                                                                                                  infoBox: {
                                                                                                    marginBottom: "24px",
                                                                                                    padding: "15px",
                                                                                                    border: "1px solid #bfdbfe",
                                                                                                    borderRadius: "11px",
                                                                                                    background: "#eff6ff",
                                                                                                  },

                                                                                                  infoTitle: {
                                                                                                    color: "#1e40af",
                                                                                                    fontSize: "13px",
                                                                                                    fontWeight: 800,
                                                                                                  },

                                                                                                  infoText: {
                                                                                                    marginTop: "4px",
                                                                                                    color: "#3b82f6",
                                                                                                    fontSize: "12px",
                                                                                                    lineHeight: 1.55,
                                                                                                  },

                                                                                                  warningBox: {
                                                                                                    marginBottom: "24px",
                                                                                                    padding: "15px",
                                                                                                    border: "1px solid #fde68a",
                                                                                                    borderRadius: "11px",
                                                                                                    background: "#fffbeb",
                                                                                                  },

                                                                                                  warningTitle: {
                                                                                                    color: "#92400e",
                                                                                                    fontSize: "13px",
                                                                                                    fontWeight: 800,
                                                                                                  },

                                                                                                  warningText: {
                                                                                                    marginTop: "4px",
                                                                                                    color: "#a16207",
                                                                                                    fontSize: "12px",
                                                                                                    lineHeight: 1.55,
                                                                                                  },

                                                                                                  /* =======================================================
                                                                                                     SMALL UTILITY STYLES
                                                                                                     ======================================================= */

                                                                                                  mutedText: {
                                                                                                    color: "#94a3b8",
                                                                                                    fontSize: "12px",
                                                                                                  },

                                                                                                  strongText: {
                                                                                                    color: "#0f172a",
                                                                                                    fontWeight: 800,
                                                                                                  },

                                                                                                  divider: {
                                                                                                    height: "1px",
                                                                                                    margin: "20px 0",
                                                                                                    background: "#e2e8f0",
                                                                                                  },

                                                                                                  buttonRow: {
                                                                                                    display: "flex",
                                                                                                    alignItems: "center",
                                                                                                    justifyContent: "flex-end",
                                                                                                    flexWrap: "wrap",
                                                                                                    gap: "10px",
                                                                                                    marginTop: "16px",
                                                                                                  },

                                                                                                  sectionSpacing: {
                                                                                                    marginBottom: "24px",
                                                                                                  },
                                                                                                };