"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CSSProperties,
  FormEvent,
} from "react";

import Side from "../../../components/Side";
import { api } from "../../../lib/api";

/* ============================================================
   TYPES
   ============================================================ */

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

  status: AssetStatus;
};

type InventoryRow = {
  category: string;
  total: number;
  assigned: number;
  available: number;
  inRepair: number;
  retired: number;
  required: number;
  alreadyOrdered: number;
  needToOrder: number;
};

type BrandSummary = {
  brand: string;
  total: number;
};

type DeviceSummaryRow = {
  category: string;
  brand: string;
  deviceName: string;
  model: string;

  total: number;
  assigned: number;
  available: number;
  inRepair: number;
  retired: number;
};

type PurchaseOrder = {
  id: string;
  category: string;
  currentAvailableStock: number;
  requiredAvailableStock: number;
  quantityNeeded: number;
  brand: string;
  model: string;
  specifications: string;
  quantityOrdered: number;
  quantityReceived: number;
  status: "ORDERED" | "PARTIALLY_RECEIVED" | "RECEIVED";
  pricePerUnit: number;
  totalEstimatedCost: number;
  supplier: string;
  reason: string;
  orderedByName: string;
  orderedByEmail: string;
  orderedAt: string;
};

type OrderForm = {
  brand: string;
  model: string;
  specifications: string;
  quantityOrdered: string;
  pricePerUnit: string;
  supplier: string;
  reason: string;
};

/* ============================================================
   CONSTANTS
   ============================================================ */

const CATEGORIES = [
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

const REQUIREMENTS_KEY =
  "asset_inventory_requirements";

/* ============================================================
   HELPERS
   ============================================================ */

function emptyRequirements(): Record<
  string,
  number
> {
  return Object.fromEntries(
    CATEGORIES.map((category) => [
      category,
      0,
    ])
  );
}

function emptyOrderForm(): OrderForm {
  return {
    brand: "",
    model: "",
    specifications: "",
    quantityOrdered: "",
    pricePerUnit: "",
    supplier: "",
    reason: "",
  };
}

function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (
    data &&
    typeof data === "object" &&
    "content" in data &&
    Array.isArray(
      (data as { content?: unknown })
        .content
    )
  ) {
    return (
      data as { content: T[] }
    ).content;
  }

  return [];
}

/* ============================================================
   PAGE
   ============================================================ */

export default function ReportsPage() {
  const [assets, setAssets] =
    useState<Asset[]>([]);

  const [orders, setOrders] =
    useState<PurchaseOrder[]>([]);

  const [
    requirements,
    setRequirements,
  ] = useState<Record<string, number>>(
    emptyRequirements()
  );

  const [
    requirementsLoaded,
    setRequirementsLoaded,
  ] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [
    ordersLoading,
    setOrdersLoading,
  ] = useState(true);

  const [
    savingRequirements,
    setSavingRequirements,
  ] = useState(false);

  const [
    placingOrder,
    setPlacingOrder,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState("");

  const [
    adminName,
    setAdminName,
  ] = useState("Admin User");

  const [
    adminEmail,
    setAdminEmail,
  ] = useState(
    "Authenticated Admin"
  );

  const [
    selectedInventory,
    setSelectedInventory,
  ] = useState<InventoryRow | null>(
    null
  );

  const [
    orderForm,
    setOrderForm,
  ] = useState<OrderForm>(
    emptyOrderForm()
  );

  /* ==========================================================
     LOAD ADMIN INFORMATION
     ========================================================== */

  useEffect(() => {
    const storedName =
      localStorage.getItem("name");

    const storedEmail =
      localStorage.getItem("email");

    if (storedName) {
      setAdminName(storedName);
    }

    if (storedEmail) {
      setAdminEmail(storedEmail);
    }
  }, []);

  /* ==========================================================
     LOAD INVENTORY REQUIREMENTS
     ========================================================== */

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          REQUIREMENTS_KEY
        );

      if (saved) {
        const parsed =
          JSON.parse(saved) as Record<
            string,
            unknown
          >;

        const merged =
          emptyRequirements();

        CATEGORIES.forEach(
          (category) => {
            const value = Number(
              parsed?.[category]
            );

            merged[category] =
              Number.isFinite(value) &&
              value >= 0
                ? value
                : 0;
          }
        );

        setRequirements(merged);
      }
    } catch (err) {
      console.error(
        "Failed to load inventory requirements:",
        err
      );
    } finally {
      setRequirementsLoaded(true);
    }
  }, []);

  /* ==========================================================
     LOAD ASSETS
     ========================================================== */

  const loadAssets =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const data = await api(
          "/api/v1/assets"
        );

        setAssets(
          toArray<Asset>(data)
        );

        setLastUpdated(
          new Date().toLocaleString(
            "en-IN"
          )
        );
      } catch (err: unknown) {
        console.error(
          "Failed to load assets:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load assets."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /* ==========================================================
     LOAD PURCHASE ORDERS
     ========================================================== */

  const loadOrders =
    useCallback(async () => {
      try {
        setOrdersLoading(true);

        const data = await api(
          "/api/v1/purchase-orders"
        );

        setOrders(
          toArray<PurchaseOrder>(
            data
          )
        );
      } catch (err: unknown) {
        console.error(
          "Failed to load purchase orders:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load asset order history."
        );
      } finally {
        setOrdersLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadAssets();
    void loadOrders();
  }, [
    loadAssets,
    loadOrders,
  ]);

  /* ==========================================================
     INVENTORY CALCULATION

     Need To Order =
     Required Available Stock
     - Current Available Stock
     - Already Ordered
     ========================================================== */

  const inventory =
    useMemo<InventoryRow[]>(
      () => {
        return CATEGORIES.map(
          (category) => {
            const normalizedCategory =
              category
                .trim()
                .toLowerCase();

            const categoryAssets =
              assets.filter(
                (asset) =>
                  asset.category
                    ?.trim()
                    .toLowerCase() ===
                  normalizedCategory
              );

            const total =
              categoryAssets.length;

            const assigned =
              categoryAssets.filter(
                (asset) =>
                  asset.status ===
                  "ASSIGNED"
              ).length;

            const available =
              categoryAssets.filter(
                (asset) =>
                  asset.status ===
                  "IN_STOCK"
              ).length;

            const inRepair =
              categoryAssets.filter(
                (asset) =>
                  asset.status ===
                  "IN_REPAIR"
              ).length;

            const retired =
              categoryAssets.filter(
                (asset) =>
                  asset.status ===
                  "RETIRED"
              ).length;

            const required =
              Number(
                requirements[
                  category
                ]
              ) || 0;

            /*
             * Add all quantities already
             * ordered for this category.
             *
             * Example:
             *
             * Required = 3
             * Available = 0
             * Ordered = 2
             *
             * Need to Order = 1
             */

            const alreadyOrdered =
              orders
                .filter(
                  (order) =>
                    order.category
                      ?.trim()
                      .toLowerCase() ===
                    normalizedCategory
                )
                .reduce(
                  (
                    totalOrdered,
                    order
                  ) =>
                    totalOrdered +
                    (Number(
                      order.quantityOrdered
                    ) || 0),
                  0
                );

           const needToOrder =
             Math.max(
               required - available,
               0
             );

            return {
              category,
              total,
              assigned,
              available,
              inRepair,
              retired,
              required,
              alreadyOrdered,
              needToOrder,
            };
          }
        );
      },
      [
        assets,
        requirements,
        orders,
      ]
    );

  /* ==========================================================
     BRAND SUMMARY

     Counts ALL registered assets by brand.

     Dell      3
     HP        2
     Apple     1
     Logitech  4
     ========================================================== */

  const brandSummary =
    useMemo<BrandSummary[]>(
      () => {
        const brandMap =
          new Map<
            string,
            BrandSummary
          >();

        assets.forEach(
          (asset) => {
            const brand =
              asset.brand?.trim() ||
              "Not Specified";

            const key =
              brand.toLowerCase();

            const existing =
              brandMap.get(key);

            if (existing) {
              existing.total += 1;
            } else {
              brandMap.set(key, {
                brand,
                total: 1,
              });
            }
          }
        );

        return Array.from(
          brandMap.values()
        ).sort((a, b) => {
          if (
            b.total !== a.total
          ) {
            return (
              b.total - a.total
            );
          }

          return a.brand.localeCompare(
            b.brand
          );
        });
      },
      [assets]
    );

  /* ==========================================================
     DEVICE / MODEL SUMMARY

     Groups by:
     Category + Brand + Device Name + Model

     Works for:
     Laptop
     Desktop
     Monitor
     Mouse
     Keyboard
     Headset
     Mobile
     Tablet
     Docking Station
     Printer
     Webcam
     Other
     ========================================================== */

  const deviceSummary =
    useMemo<DeviceSummaryRow[]>(
      () => {
        const deviceMap =
          new Map<
            string,
            DeviceSummaryRow
          >();

        assets.forEach(
          (asset) => {
            const category =
              asset.category?.trim() ||
              "Other";

            const brand =
              asset.brand?.trim() ||
              "Not Specified";

            const deviceName =
              asset.name?.trim() ||
              asset.model?.trim() ||
              category;

            const model =
              asset.model?.trim() ||
              "Not Specified";

            const key = [
              category.toLowerCase(),
              brand.toLowerCase(),
              deviceName.toLowerCase(),
              model.toLowerCase(),
            ].join("|");

            let row =
              deviceMap.get(key);

            if (!row) {
              row = {
                category,
                brand,
                deviceName,
                model,
                total: 0,
                assigned: 0,
                available: 0,
                inRepair: 0,
                retired: 0,
              };

              deviceMap.set(
                key,
                row
              );
            }

            row.total += 1;

            if (
              asset.status ===
              "ASSIGNED"
            ) {
              row.assigned += 1;
            }

            if (
              asset.status ===
              "IN_STOCK"
            ) {
              row.available += 1;
            }

            if (
              asset.status ===
              "IN_REPAIR"
            ) {
              row.inRepair += 1;
            }

            if (
              asset.status ===
              "RETIRED"
            ) {
              row.retired += 1;
            }
          }
        );

        return Array.from(
          deviceMap.values()
        ).sort((a, b) => {
          const categoryA =
            CATEGORIES.indexOf(
              a.category
            );

          const categoryB =
            CATEGORIES.indexOf(
              b.category
            );

          const safeA =
            categoryA === -1
              ? 999
              : categoryA;

          const safeB =
            categoryB === -1
              ? 999
              : categoryB;

          if (safeA !== safeB) {
            return safeA - safeB;
          }

          const brandCompare =
            a.brand.localeCompare(
              b.brand
            );

          if (
            brandCompare !== 0
          ) {
            return brandCompare;
          }

          const nameCompare =
            a.deviceName.localeCompare(
              b.deviceName
            );

          if (
            nameCompare !== 0
          ) {
            return nameCompare;
          }

          return a.model.localeCompare(
            b.model
          );
        });
      },
      [assets]
    );

  /* ==========================================================
     SUMMARY COUNTS
     ========================================================== */

  const totalAssets =
    assets.length;

  const assignedCount =
    assets.filter(
      (asset) =>
        asset.status === "ASSIGNED"
    ).length;

  const availableCount =
    assets.filter(
      (asset) =>
        asset.status === "IN_STOCK"
    ).length;

  const repairCount =
    assets.filter(
      (asset) =>
        asset.status === "IN_REPAIR"
    ).length;

  const retiredCount =
    assets.filter(
      (asset) =>
        asset.status === "RETIRED"
    ).length;

  const totalNeedToOrder =
    inventory.reduce(
      (total, row) =>
        total + row.needToOrder,
      0
    );

  const firstItemToOrder =
    inventory.find(
      (row) =>
        row.needToOrder > 0
    ) ?? null;

  /* ==========================================================
     SAVE INVENTORY REQUIREMENTS
     ========================================================== */

  function saveRequirements() {
    try {
      setSavingRequirements(true);
      setError("");
      setSuccess("");

      localStorage.setItem(
        REQUIREMENTS_KEY,
        JSON.stringify(
          requirements
        )
      );

      setSuccess(
        "Inventory requirements saved successfully."
      );
    } catch (err) {
      console.error(
        "Failed to save requirements:",
        err
      );

      setError(
        "Failed to save inventory requirements."
      );
    } finally {
      setSavingRequirements(
        false
      );
    }
  }

  function updateRequirement(
    category: string,
    value: string
  ) {
    const numberValue =
      Number(value);

    setRequirements(
      (current) => ({
        ...current,

        [category]:
          Number.isFinite(
            numberValue
          ) &&
          numberValue >= 0
            ? numberValue
            : 0,
      })
    );
  }

  /* ==========================================================
     OPEN ORDER POPUP
     ========================================================== */

  function openOrder(
    row: InventoryRow
  ) {
    if (
      row.needToOrder <= 0
    ) {
      return;
    }

    setError("");
    setSuccess("");

    setOrderForm({
      brand: "",
      model: "",
      specifications: "",

      quantityOrdered:
        String(
          row.needToOrder
        ),

      pricePerUnit: "",

      supplier: "",

      reason:
        `Available ${row.category.toLowerCase()} ` +
        `stock is below the required stock level.`,
    });

    setSelectedInventory(
      row
    );
  }

  /* ==========================================================
     CLOSE ORDER POPUP
     ========================================================== */

  function closeOrder() {
    if (placingOrder) {
      return;
    }

    setSelectedInventory(
      null
    );

    setOrderForm(
      emptyOrderForm()
    );

    setError("");
  }

  /* ==========================================================
     TOTAL COST
     ========================================================== */

  const totalEstimatedCost =
    useMemo(() => {
      const quantity =
        Number(
          orderForm.quantityOrdered
        );

      const price =
        Number(
          orderForm.pricePerUnit
        );

      if (
        !Number.isFinite(
          quantity
        ) ||
        !Number.isFinite(
          price
        ) ||
        quantity <= 0 ||
        price <= 0
      ) {
        return 0;
      }

      return quantity * price;
    }, [
      orderForm.quantityOrdered,
      orderForm.pricePerUnit,
    ]);

  /* ==========================================================
     PLACE ORDER
     ========================================================== */

  async function placeOrder(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedInventory) {
      return;
    }

    const quantity =
      Number(
        orderForm.quantityOrdered
      );

    const price =
      Number(
        orderForm.pricePerUnit
      );

    if (
      !orderForm.brand.trim()
    ) {
      setError(
        "Brand / Company is required."
      );
      return;
    }

    if (
      !orderForm.model.trim()
    ) {
      setError(
        "Model is required."
      );
      return;
    }

    if (
      !orderForm.specifications.trim()
    ) {
      setError(
        "Specifications are required."
      );
      return;
    }

    if (
      !Number.isInteger(
        quantity
      ) ||
      quantity < 1
    ) {
      setError(
        "Quantity to order must be at least 1."
      );
      return;
    }

    if (
      quantity >
      selectedInventory.needToOrder
    ) {
      setError(
        `Only ${selectedInventory.needToOrder} ` +
          `${selectedInventory.category}(s) are currently needed.`
      );
      return;
    }

    if (
      !Number.isFinite(
        price
      ) ||
      price <= 0
    ) {
      setError(
        "Price per unit must be greater than zero."
      );
      return;
    }

    if (
      !orderForm.supplier.trim()
    ) {
      setError(
        "Supplier / Vendor is required."
      );
      return;
    }

    if (
      !orderForm.reason.trim()
    ) {
      setError(
        "Reason is required."
      );
      return;
    }

    try {
      setPlacingOrder(true);
      setError("");
      setSuccess("");

      await api(
        "/api/v1/purchase-orders",
        {
          method: "POST",

          body: JSON.stringify({
            category:
              selectedInventory.category,

            currentAvailableStock:
              selectedInventory.available,

            requiredAvailableStock:
              selectedInventory.required,

            quantityNeeded:
              selectedInventory.needToOrder,

            brand:
              orderForm.brand.trim(),

            model:
              orderForm.model.trim(),

            specifications:
              orderForm.specifications.trim(),

            quantityOrdered:
              quantity,

            pricePerUnit:
              price,

            supplier:
              orderForm.supplier.trim(),

            reason:
              orderForm.reason.trim(),
          }),
        }
      );

      const orderedCategory =
        selectedInventory.category;

      setSelectedInventory(
        null
      );

      setOrderForm(
        emptyOrderForm()
      );

      /*
       * IMPORTANT:
       * Reload orders immediately.
       * This automatically updates
       * Need to Order.
       */

      await loadOrders();

      setSuccess(
        `${orderedCategory} order placed successfully.`
      );
    } catch (err: unknown) {
      console.error(
        "Failed to place order:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to place asset order."
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  /* ==========================================================
     REFRESH
     ========================================================== */

  async function refreshEverything() {
    setError("");
    setSuccess("");

    await Promise.all([
      loadAssets(),
      loadOrders(),
    ]);
  }

  /* ==========================================================
     FORMATTERS
     ========================================================== */

  function formatCurrency(
    value:
      | number
      | null
      | undefined
  ) {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    ).format(
      Number(value || 0)
    );
  }

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
      "en-IN"
    );
  }

  /* ==========================================================
     UI
     ========================================================== */

  return (
    <div style={styles.shell}>
      <Side role="admin" />

      <main style={styles.main}>
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Inventory Summary
            </h1>

            <p style={styles.subtitle}>
              View asset availability by
              category and plan upcoming
              purchases
            </p>
          </div>

          <div
            style={
              styles.headerActions
            }
          >
            <span
              style={
                styles.lastUpdated
              }
            >
              Last updated:{" "}
              {lastUpdated || "-"}
            </span>

            <button
              type="button"
              style={
                styles.refreshButton
              }
              onClick={() =>
                void refreshEverything()
              }
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* ================================================= */}
        {/* MESSAGES */}
        {/* ================================================= */}

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

        {/* ================================================= */}
        {/* TOP SUMMARY CARDS */}
        {/* ================================================= */}

        <div
          style={
            styles.summaryGrid
          }
        >
          <SummaryCard
            icon="▣"
            label="Total Assets"
            value={totalAssets}
            background="#f2f7ff"
            iconBackground="#e4efff"
            valueColor="#0b2d49"
          />

          <SummaryCard
            icon="♟"
            label="Assigned"
            value={
              assignedCount
            }
            background="#f2f7ff"
            iconBackground="#e4efff"
            valueColor="#0b2d49"
          />

          <SummaryCard
            icon="◆"
            label="Available (In Stock)"
            value={
              availableCount
            }
            background="#f1fcf5"
            iconBackground="#dcf6e5"
            valueColor="#087d3d"
          />

          <SummaryCard
            icon="⚒"
            label="In Repair"
            value={repairCount}
            background="#fff8ec"
            iconBackground="#fff0cf"
            valueColor="#a75d00"
          />

          <SummaryCard
            icon="▥"
            label="Retired"
            value={retiredCount}
            background="#fff3f3"
            iconBackground="#ffe0e0"
            valueColor="#b81919"
          />

          <SummaryCard
            icon="🛒"
            label="Need to Order"
            value={
              totalNeedToOrder
            }
            background="#f8f4ff"
            iconBackground="#eee4ff"
            valueColor="#5420b8"
            onClick={
              firstItemToOrder
                ? () =>
                    openOrder(
                      firstItemToOrder
                    )
                : undefined
            }
          />
        </div>

        {/* ================================================= */}
        {/* ASSET INVENTORY SUMMARY */}
        {/* ================================================= */}

        <section
          style={styles.card}
        >
          <h2
            style={
              styles.sectionTitle
            }
          >
            Asset Inventory Summary
          </h2>

          <p
            style={
              styles.sectionDescription
            }
          >
            Current asset count by
            category with availability
            and procurement needs.
          </p>

          <div
            style={
              styles.tableWrapper
            }
          >
            <table
              style={styles.table}
            >
              <thead>
                <tr>
                  <th
                    style={styles.th}
                  >
                    Category
                  </th>

                  <th
                    style={
                      styles.thCenter
                    }
                  >
                    Total Assets
                  </th>

                  <th
                    style={
                      styles.thCenter
                    }
                  >
                    Assigned
                  </th>

                  <th
                    style={
                      styles.thCenter
                    }
                  >
                    Available
                    <br />
                    (In Stock)
                  </th>

                  <th
                    style={
                      styles.thCenter
                    }
                  >
                    In Repair
                  </th>

                  <th
                    style={
                      styles.thCenter
                    }
                  >
                    Retired
                  </th>

                  <th
                    style={
                      styles.thCenter
                    }
                  >
                    Required
                    <br />
                    Available Stock
                  </th>

                  <th
                    style={
                      styles.thCenter
                    }
                  >
                    Need to Order
                  </th>
                </tr>
              </thead>

              <tbody>
                {inventory.map(
                  (row) => (
                    <tr
                      key={
                        row.category
                      }
                    >
                      <td
                        style={
                          styles.td
                        }
                      >
                        <strong>
                          {
                            row.category
                          }
                        </strong>
                      </td>

                      <td
                        style={
                          styles.tdCenter
                        }
                      >
                        {row.total}
                      </td>

                      <td
                        style={{
                          ...styles.tdCenter,
                          color:
                            "#0877e8",
                          fontWeight:
                            700,
                        }}
                      >
                        {row.assigned}
                      </td>

                      <td
                        style={{
                          ...styles.tdCenter,
                          color:
                            "#008a3d",
                          fontWeight:
                            700,
                        }}
                      >
                        {
                          row.available
                        }
                      </td>

                      <td
                        style={{
                          ...styles.tdCenter,
                          color:
                            "#c26500",
                          fontWeight:
                            700,
                        }}
                      >
                        {
                          row.inRepair
                        }
                      </td>

                      <td
                        style={{
                          ...styles.tdCenter,
                          color:
                            "#d51c1c",
                          fontWeight:
                            700,
                        }}
                      >
                        {row.retired}
                      </td>

                      <td
                        style={
                          styles.tdCenter
                        }
                      >
                        {row.required}
                      </td>

                      <td
                        style={{
                          ...styles.tdCenter,
                          position:
                            "relative",
                        }}
                      >
                        {row.needToOrder >
                        0 ? (
                          <button
                            type="button"
                            style={
                              styles.needOrderButton
                            }
                            title={`Click to order ${row.category}`}
                            onClick={() =>
                              openOrder(
                                row
                              )
                            }
                          >
                            {
                              row.needToOrder
                            }
                          </button>
                        ) : (
                          <span
                            style={
                              styles.noOrderBadge
                            }
                          >
                            0
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <div
            style={
              styles.infoBox
            }
          >
            <strong>ⓘ</strong>

            <span>
              Need to Order =
              Required Available
              Stock - Current
              Available Stock -
              Quantity Already
              Ordered. If the result
              is negative, it shows
              0.{" "}
              <strong>
                Click a red number
                to place an asset
                order.
              </strong>
            </span>
          </div>
        </section>

        {/* ================================================= */}
        {/* NEW: ASSET BRAND & DEVICE SUMMARY */}
        {/* ================================================= */}

        <section
          style={styles.card}
        >
          <h2
            style={
              styles.sectionTitle
            }
          >
            Asset Brand & Device Summary
          </h2>

          <p
            style={
              styles.sectionDescription
            }
          >
            View how many assets you
            have by brand, category,
            device name, model and
            current status.
          </p>

          {/* =============================================== */}
          {/* BRAND SUMMARY */}
          {/* =============================================== */}

          <div
            style={
              styles.subSectionTitle
            }
          >
            Brand Summary
          </div>

          {brandSummary.length ===
          0 ? (
            <div
              style={
                styles.emptyBrandMessage
              }
            >
              No assets available.
            </div>
          ) : (
            <div
              style={
                styles.brandSummaryGrid
              }
            >
              {brandSummary.map(
                (brand) => (
                  <div
                    key={
                      brand.brand.toLowerCase()
                    }
                    style={
                      styles.brandSummaryCard
                    }
                  >
                    <div
                      style={
                        styles.brandIcon
                      }
                    >
                      ◈
                    </div>

                    <div>
                      <div
                        style={
                          styles.brandName
                        }
                      >
                        {brand.brand}
                      </div>

                      <div
                        style={
                          styles.brandCountRow
                        }
                      >
                        <span
                          style={
                            styles.brandTotal
                          }
                        >
                          {
                            brand.total
                          }
                        </span>

                        <span
                          style={
                            styles.brandTotalLabel
                          }
                        >
                          {brand.total ===
                          1
                            ? "Asset"
                            : "Assets"}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* =============================================== */}
          {/* DEVICE / MODEL BREAKDOWN */}
          {/* =============================================== */}

          <div
            style={
              styles.deviceSummaryHeader
            }
          >
            Device / Model Breakdown
          </div>

          <p
            style={
              styles.deviceSummaryDescription
            }
          >
            Detailed counts for
            laptops, desktops,
            monitors, mice,
            keyboards, headsets,
            mobiles, tablets, docking
            stations, printers,
            webcams and other assets.
          </p>

          <div
            style={
              styles.tableWrapper
            }
          >
            <table
              style={{
                ...styles.table,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={styles.th}
                  >
                    Category
                  </th>

                  <th
                    style={styles.th}
                  >
                    Brand
                  </th>

                  <th
                    style={styles.th}
                  >
                    Device Name
                  </th>

                  <th
                    style={styles.th}
                  >
                    Model
                  </th>

                  <th
                    style={
                      styles.thCenter
                    }
                  >
                    Total
                  </th>

                  <th
                    style={
                      styles.thCenter
                    }
                  >
                    Assigned
                  </th>

                  <th
                    style={
                      styles.thCenter
                    }
                  >
                    Available
                  </th>

                  <th
                    style={
                      styles.thCenter
                    }
                  >
                    In Repair
                  </th>

                  <th
                    style={
                      styles.thCenter
                    }
                  >
                    Retired
                  </th>
                </tr>
              </thead>

              <tbody>
                {deviceSummary.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={
                        styles.emptyCell
                      }
                    >
                      No asset data
                      available.
                    </td>
                  </tr>
                ) : (
                  deviceSummary.map(
                    (row) => (
                      <tr
                        key={[
                          row.category,
                          row.brand,
                          row.deviceName,
                          row.model,
                        ].join("|")}
                      >
                        <td
                          style={
                            styles.td
                          }
                        >
                          <span
                            style={
                              styles.categoryBadge
                            }
                          >
                            {
                              row.category
                            }
                          </span>
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          <strong>
                            {
                              row.brand
                            }
                          </strong>
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          <strong
                            style={
                              styles.deviceName
                            }
                          >
                            {
                              row.deviceName
                            }
                          </strong>
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          <span
                            style={
                              styles.modelText
                            }
                          >
                            {row.model}
                          </span>
                        </td>

                        <td
                          style={{
                            ...styles.tdCenter,
                            fontWeight:
                              800,
                            color:
                              "#0b2d49",
                          }}
                        >
                          {row.total}
                        </td>

                        <td
                          style={{
                            ...styles.tdCenter,
                            color:
                              "#0877e8",
                            fontWeight:
                              800,
                          }}
                        >
                          {
                            row.assigned
                          }
                        </td>

                        <td
                          style={{
                            ...styles.tdCenter,
                            color:
                              "#008a3d",
                            fontWeight:
                              800,
                          }}
                        >
                          {
                            row.available
                          }
                        </td>

                        <td
                          style={{
                            ...styles.tdCenter,
                            color:
                              "#c26500",
                            fontWeight:
                              800,
                          }}
                        >
                          {
                            row.inRepair
                          }
                        </td>

                        <td
                          style={{
                            ...styles.tdCenter,
                            color:
                              "#d51c1c",
                            fontWeight:
                              800,
                          }}
                        >
                          {
                            row.retired
                          }
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          <div
            style={
              styles.brandInfoBox
            }
          >
            <strong>ⓘ</strong>

            <span>
              These quantities are
              calculated automatically
              from the assets registered
              in the system. Adding or
              changing an asset will
              update this report after
              refresh.
            </span>
          </div>
        </section>

        {/* ================================================= */}
        {/* INVENTORY REQUIREMENTS */}
        {/* ================================================= */}

        {requirementsLoaded && (
          <section
            style={styles.card}
          >
            <div
              style={
                styles.sectionHeader
              }
            >
              <div>
                <h2
                  style={
                    styles.sectionTitle
                  }
                >
                  Inventory
                  Requirements
                </h2>

                <p
                  style={
                    styles.sectionDescription
                  }
                >
                  Set the required
                  available stock
                  level for each
                  asset category.
                </p>
              </div>

              <button
                type="button"
                style={
                  styles.primaryButton
                }
                onClick={
                  saveRequirements
                }
                disabled={
                  savingRequirements
                }
              >
                {savingRequirements
                  ? "Saving..."
                  : "▣ Save Changes"}
              </button>
            </div>

            <div
              style={
                styles.requirementsGrid
              }
            >
              {CATEGORIES.map(
                (category) => (
                  <div
                    key={category}
                  >
                    <label
                      style={
                        styles.label
                      }
                    >
                      {category}
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      style={
                        styles.input
                      }
                      value={
                        requirements[
                          category
                        ] ?? 0
                      }
                      onChange={(
                        event
                      ) =>
                        updateRequirement(
                          category,
                          event
                            .target
                            .value
                        )
                      }
                    />
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* ================================================= */}
        {/* ASSET ORDER HISTORY */}
        {/* ================================================= */}

        <section
          style={styles.card}
        >
          <div
            style={
              styles.sectionHeader
            }
          >
            <div>
              <h2
                style={
                  styles.sectionTitle
                }
              >
                Asset Order History
              </h2>

              <p
                style={
                  styles.sectionDescription
                }
              >
                Equipment orders
                placed by Asset
                Admin.
              </p>
            </div>

            <button
              type="button"
              style={
                styles.secondaryButton
              }
              onClick={() =>
                void loadOrders()
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
              style={{
                ...styles.table,
                minWidth: 0,
                width: "100%",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={styles.th}
                  >
                    Order Date
                  </th>

                  <th
                    style={styles.th}
                  >
                    Category
                  </th>

                  <th
                    style={styles.th}
                  >
                    Brand / Model
                  </th>

                  <th
                    style={styles.th}
                  >
                    Specifications
                  </th>

                  <th
                    style={
                      styles.thCenter
                    }
                  >
                    Needed
                  </th>

                  <th
                    style={
                      styles.thCenter
                    }
                  >
                    Ordered
                  </th>
                  <th
                    style={
                      styles.thCenter
                    }
                  >
                    Received
                  </th>

                  <th
                    style={
                      styles.thCenter
                    }
                  >
                    Status
                  </th>
                  <th
                    style={styles.th}
                  >
                    Price / Unit
                  </th>

                  <th
                    style={styles.th}
                  >
                    Total Cost
                  </th>

                  <th
                    style={styles.th}
                  >
                    Supplier
                  </th>

                  <th
                    style={styles.th}
                  >
                    Ordered By
                  </th>
                  <th
                    style={
                      styles.thCenter
                    }
                  >
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {ordersLoading ? (
                  <tr>
                    <td
                      colSpan={13}
                      style={
                        styles.emptyCell
                      }
                    >
                      Loading order
                      history...
                    </td>
                  </tr>
                ) : orders.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={13}
                      style={
                        styles.emptyCell
                      }
                    >
                      No asset orders
                      have been placed
                      yet.
                    </td>
                  </tr>
                ) : (
                  orders.map(
                    (order) => (
                      <tr
                        key={
                          order.id
                        }
                      >
                        <td
                          style={
                            styles.td
                          }
                        >
                          {formatDateTime(
                            order.orderedAt
                          )}
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          <strong>
                            {
                              order.category
                            }
                          </strong>
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          <strong>
                            {
                              order.brand
                            }
                          </strong>

                          <div
                            style={
                              styles.mutedText
                            }
                          >
                            {
                              order.model
                            }
                          </div>
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          {
                            order.specifications
                          }
                        </td>

                        <td
                          style={
                            styles.tdCenter
                          }
                        >
                          {
                            order.quantityNeeded
                          }
                        </td>

                        <td
                          style={
                            styles.tdCenter
                          }
                        >
                          <strong>
                            {
                              order.quantityOrdered
                            }
                          </strong>
                        </td>
                        <td
                          style={
                            styles.tdCenter
                          }
                        >
                          <strong>
                            {
                              order.quantityReceived ??
                              0
                            }
                          </strong>
                        </td>
                        <td
                          style={
                            styles.tdCenter
                          }
                        >
                          <strong>
                            {
                              order.status ||
                              "ORDERED"
                            }
                          </strong>
                        </td>
                        <td
                          style={
                            styles.td
                          }
                        >
                          {formatCurrency(
                            order.pricePerUnit
                          )}
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          <strong>
                            {formatCurrency(
                              order.totalEstimatedCost
                            )}
                          </strong>
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          {
                            order.supplier
                          }
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          <strong>
                            {
                              order.orderedByName
                            }
                          </strong>

                          <div
                            style={
                              styles.mutedText
                            }
                          >
                            {
                              order.orderedByEmail
                            }
                          </div>
                        </td>
                        <td
                          style={
                            styles.tdCenter
                          }
                        >
                          {(order.quantityReceived ?? 0) <
                          order.quantityOrdered ? (
                            <button
                              type="button"
                              onClick={() => {
                                const params =
                                  new URLSearchParams({
                                    purchaseOrderId:
                                      order.id,

                                    category:
                                      order.category || "",

                                    specifications:
                                      order.specifications || "",

                                    purchasePrice:
                                      String(
                                        order.pricePerUnit ?? ""
                                      ),

                                    brand:
                                      order.brand || "",

                                    model:
                                      order.model || "",

                                    supplier:
                                      order.supplier || "",
                                  });
                                params.set(
                                    "purchaseOrderId",
                                    order.id
                                );
                                window.location.href =
                                  `/admin/assets?${params.toString()}`;
                              }}
                              style={{
                                      background: "#1473e6",
                                      color: "#ffffff",
                                      border: "none",
                                      borderRadius: 8,
                                      padding: "10px 16px",
                                      fontWeight: 700,
                                      fontSize: 13,
                                      cursor: "pointer",
                                      whiteSpace: "nowrap",
                                  }}
                            >
                              Register Received Asset
                            </button>
                          ) : (
                            <strong>
                              Received
                            </strong>
                          )}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        {loading && (
          <div
            style={
              styles.loadingText
            }
          >
            Loading inventory...
          </div>
        )}
      </main>

      {/* =================================================== */}
      {/* ORDER ASSET POPUP */}
      {/* =================================================== */}

      {selectedInventory && (
        <div
          style={
            styles.modalOverlay
          }
          onClick={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !placingOrder
            ) {
              closeOrder();
            }
          }}
        >
          <div
            style={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-asset-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* POPUP HEADER */}

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
                  ASSET PROCUREMENT
                </div>

                <h2
                  id="order-asset-title"
                  style={
                    styles.modalTitle
                  }
                >
                  Order Asset
                </h2>

                <p
                  style={
                    styles.modalSubtitle
                  }
                >
                  Record an equipment
                  order for the current
                  inventory shortage.
                </p>
              </div>

              <button
                type="button"
                style={
                  styles.closeButton
                }
                onClick={closeOrder}
                disabled={
                  placingOrder
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                placeOrder
              }
            >
              <div
                style={
                  styles.modalBody
                }
              >
                {/* INVENTORY REQUIREMENT */}

                <div
                  style={
                    styles.formSection
                  }
                >
                  <h3
                    style={
                      styles.formSectionTitle
                    }
                  >
                    Inventory
                    Requirement
                  </h3>

                  <div
                    style={
                      styles.autoGrid
                    }
                  >
                    <ReadOnlyField
                      label="Category"
                      value={
                        selectedInventory.category
                      }
                    />

                    <ReadOnlyField
                      label="Current Available Stock"
                      value={String(
                        selectedInventory.available
                      )}
                    />

                    <ReadOnlyField
                      label="Required Available Stock"
                      value={String(
                        selectedInventory.required
                      )}
                    />

                    <ReadOnlyField
                      label="Quantity Needed"
                      value={String(
                        selectedInventory.needToOrder
                      )}
                      highlight
                    />
                  </div>
                </div>

                {/* EQUIPMENT DETAILS */}

                <div
                  style={
                    styles.formSection
                  }
                >
                  <h3
                    style={
                      styles.formSectionTitle
                    }
                  >
                    Equipment Details
                  </h3>

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
                        Brand /
                        Company *
                      </label>

                      <input
                        autoFocus
                        style={
                          styles.input
                        }
                        placeholder="Example: Dell"
                        value={
                          orderForm.brand
                        }
                        onChange={(
                          event
                        ) =>
                          setOrderForm(
                            (
                              current
                            ) => ({
                              ...current,

                              brand:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                      />
                    </div>

                    <div>
                      <label
                        style={
                          styles.label
                        }
                      >
                        Model *
                      </label>

                      <input
                        style={
                          styles.input
                        }
                        placeholder="Example: Latitude 5450"
                        value={
                          orderForm.model
                        }
                        onChange={(
                          event
                        ) =>
                          setOrderForm(
                            (
                              current
                            ) => ({
                              ...current,

                              model:
                                event
                                  .target
                                  .value,
                            })
                          )
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
                        Specifications
                        *
                      </label>

                      <textarea
                        style={
                          styles.textarea
                        }
                        placeholder="Example: Intel Core i7, 16GB RAM, 512GB SSD"
                        value={
                          orderForm.specifications
                        }
                        onChange={(
                          event
                        ) =>
                          setOrderForm(
                            (
                              current
                            ) => ({
                              ...current,

                              specifications:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* ORDER DETAILS */}

                <div
                  style={
                    styles.formSection
                  }
                >
                  <h3
                    style={
                      styles.formSectionTitle
                    }
                  >
                    Order Details
                  </h3>

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
                        Quantity to
                        Order *
                      </label>

                      <input
                        type="number"
                        min="1"
                        max={
                          selectedInventory.needToOrder
                        }
                        step="1"
                        style={
                          styles.input
                        }
                        value={
                          orderForm.quantityOrdered
                        }
                        onChange={(
                          event
                        ) =>
                          setOrderForm(
                            (
                              current
                            ) => ({
                              ...current,

                              quantityOrdered:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                      />
                    </div>

                    <div>
                      <label
                        style={
                          styles.label
                        }
                      >
                        Price Per Unit
                        (₹) *
                      </label>

                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        style={
                          styles.input
                        }
                        placeholder="Example: 65000"
                        value={
                          orderForm.pricePerUnit
                        }
                        onChange={(
                          event
                        ) =>
                          setOrderForm(
                            (
                              current
                            ) => ({
                              ...current,

                              pricePerUnit:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                      />
                    </div>

                    <div>
                      <label
                        style={
                          styles.label
                        }
                      >
                        Total Estimated
                        Cost
                      </label>

                      <div
                        style={
                          styles.totalCostBox
                        }
                      >
                        {formatCurrency(
                          totalEstimatedCost
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        style={
                          styles.label
                        }
                      >
                        Supplier /
                        Vendor *
                      </label>

                      <input
                        style={
                          styles.input
                        }
                        placeholder="Example: Dell Authorized Partner"
                        value={
                          orderForm.supplier
                        }
                        onChange={(
                          event
                        ) =>
                          setOrderForm(
                            (
                              current
                            ) => ({
                              ...current,

                              supplier:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* REASON */}

                <div
                  style={
                    styles.formSection
                  }
                >
                  <h3
                    style={
                      styles.formSectionTitle
                    }
                  >
                    Reason
                  </h3>

                  <textarea
                    style={
                      styles.textarea
                    }
                    value={
                      orderForm.reason
                    }
                    onChange={(
                      event
                    ) =>
                      setOrderForm(
                        (
                          current
                        ) => ({
                          ...current,

                          reason:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  />
                </div>

                {/* ORDER INFORMATION */}

                <div
                  style={
                    styles.formSection
                  }
                >
                  <h3
                    style={
                      styles.formSectionTitle
                    }
                  >
                    Order Information
                  </h3>

                  <div
                    style={
                      styles.autoGridThree
                    }
                  >
                    <ReadOnlyField
                      label="Ordered By"
                      value={
                        adminName
                      }
                    />

                    <ReadOnlyField
                      label="Ordered By Email"
                      value={
                        adminEmail
                      }
                    />

                    <ReadOnlyField
                      label="Order Date & Time"
                      value="Automatically recorded when order is placed"
                    />
                  </div>
                </div>
              </div>

              {/* FOOTER */}

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
                    closeOrder
                  }
                  disabled={
                    placingOrder
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    ...styles.placeOrderButton,

                    opacity:
                      placingOrder
                        ? 0.7
                        : 1,
                  }}
                  disabled={
                    placingOrder
                  }
                >
                  {placingOrder
                    ? "Placing Order..."
                    : "Place Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SUMMARY CARD
   ============================================================ */

type SummaryCardProps = {
  icon: string;
  label: string;
  value: number;
  background: string;
  iconBackground: string;
  valueColor: string;
  onClick?: () => void;
};

function SummaryCard({
  icon,
  label,
  value,
  background,
  iconBackground,
  valueColor,
  onClick,
}: SummaryCardProps) {
  const content = (
    <>
      <div
        style={{
          ...styles.summaryIcon,
          background:
            iconBackground,
        }}
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
          style={{
            ...styles.summaryValue,
            color: valueColor,
          }}
        >
          {value}
        </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          ...styles.summaryCard,
          ...styles.summaryCardButton,
          background,
        }}
        title={`Click ${label}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      style={{
        ...styles.summaryCard,
        background,
      }}
    >
      {content}
    </div>
  );
}

/* ============================================================
   READ ONLY FIELD
   ============================================================ */

type ReadOnlyFieldProps = {
  label: string;
  value: string;
  highlight?: boolean;
};

function ReadOnlyField({
  label,
  value,
  highlight,
}: ReadOnlyFieldProps) {
  return (
    <div>
      <label
        style={styles.label}
      >
        {label}
      </label>

      <div
        style={{
          ...styles.readOnlyBox,

          ...(highlight
            ? styles.readOnlyHighlight
            : {}),
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const styles: Record<
  string,
  CSSProperties
> = {
  shell: {
    minHeight: "100vh",
    display: "flex",
    background: "#f5f8fc",
    color: "#0b2d49",
  },

  main: {
    flex: 1,
    minWidth: 0,
    padding:
      "34px 34px 70px",
    background: "#f5f8fc",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    gap: 24,
    marginBottom: 26,
  },

  title: {
    margin: 0,
    fontSize: 40,
    lineHeight: 1.1,
    fontWeight: 800,
    color: "#082c48",
  },

  subtitle: {
    margin: "8px 0 0",
    fontSize: 15,
    color: "#6c819b",
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    paddingTop: 8,
  },

  lastUpdated: {
    color: "#71849b",
    fontSize: 13,
    whiteSpace: "nowrap",
  },

  refreshButton: {
    border: 0,
    borderRadius: 10,
    padding:
      "12px 20px",
    background: "#1473e6",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  },

  errorMessage: {
    padding:
      "13px 16px",
    borderRadius: 10,
    background: "#fff0f0",
    border:
      "1px solid #ffcaca",
    color: "#b42318",
    marginBottom: 18,
    fontWeight: 600,
  },

  successMessage: {
    padding:
      "13px 16px",
    borderRadius: 10,
    background: "#edf9f1",
    border:
      "1px solid #c6e8d2",
    color: "#087b3d",
    marginBottom: 18,
    fontWeight: 600,
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(6, minmax(150px, 1fr))",
    gap: 14,
    marginBottom: 22,
  },

  summaryCard: {
    minHeight: 100,
    border:
      "1px solid #d9e4ef",
    borderRadius: 14,
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    boxSizing: "border-box",
  },

  summaryCardButton: {
    width: "100%",
    fontFamily: "inherit",
    textAlign: "left",
    cursor: "pointer",
    appearance: "none",
    outline: "none",
  },

  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    fontSize: 20,
    flexShrink: 0,
  },

  summaryLabel: {
    color: "#314b66",
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.15,
  },

  summaryValue: {
    marginTop: 4,
    fontSize: 30,
    lineHeight: 1,
    fontWeight: 800,
  },

  card: {
    background: "#ffffff",
    border:
      "1px solid #dbe5ef",
    borderRadius: 15,
    padding: 22,
    marginBottom: 22,
    boxShadow:
      "0 1px 2px rgba(12,48,76,.02)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: 20,
    marginBottom: 16,
  },

  sectionTitle: {
    margin: 0,
    fontSize: 24,
    color: "#082c48",
    fontWeight: 800,
  },

  sectionDescription: {
    margin: "5px 0 16px",
    color: "#6b809a",
    fontSize: 14,
  },

  subSectionTitle: {
    marginTop: 22,
    marginBottom: 14,
    fontSize: 17,
    fontWeight: 800,
    color: "#0b2d49",
  },

  /* ==========================================================
     BRAND SUMMARY
     ========================================================== */

  brandSummaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    marginBottom: 30,
  },

  brandSummaryCard: {
    minHeight: 100,
    border:
      "1px solid #dbe5ef",
    borderRadius: 13,
    background: "#f7faff",
    padding:
      "17px 18px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    boxSizing: "border-box",
  },

  brandIcon: {
    width: 46,
    height: 46,
    minWidth: 46,
    borderRadius: 11,
    background: "#e6f0ff",
    color: "#1473e6",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    fontSize: 20,
    fontWeight: 800,
  },

  brandName: {
    color: "#425a75",
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 4,
  },

  brandCountRow: {
    display: "flex",
    alignItems:
      "baseline",
    gap: 7,
  },

  brandTotal: {
    color: "#0b2d49",
    fontSize: 28,
    lineHeight: 1,
    fontWeight: 900,
  },

  brandTotalLabel: {
    color: "#7a8da2",
    fontSize: 12,
    fontWeight: 700,
  },

  emptyBrandMessage: {
    padding:
      "24px 20px",
    border:
      "1px dashed #d6e1ec",
    borderRadius: 10,
    background: "#f8fafc",
    color: "#71849b",
    textAlign: "center",
    marginBottom: 25,
  },

  deviceSummaryHeader: {
    marginTop: 6,
    fontSize: 17,
    fontWeight: 800,
    color: "#0b2d49",
  },

  deviceSummaryDescription: {
    margin: "5px 0 14px",
    color: "#71849b",
    fontSize: 13,
  },

  categoryBadge: {
    display:
      "inline-block",
    padding: "6px 10px",
    borderRadius: 7,
    background: "#eef5ff",
    color: "#1468c8",
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  deviceName: {
    color: "#0b2d49",
    fontWeight: 800,
  },

  modelText: {
    color: "#526b84",
    fontWeight: 600,
  },

  brandInfoBox: {
    marginTop: 16,
    background: "#f0f7ff",
    border:
      "1px solid #d6e9ff",
    borderRadius: 10,
    padding:
      "13px 16px",
    color: "#45627e",
    display: "flex",
    gap: 10,
    fontSize: 13,
  },

  /* ==========================================================
     TABLE
     ========================================================== */

  tableWrapper: {
    overflowX: "auto",
    border:
      "1px solid #dbe5ef",
    borderRadius: 12,
  },

  table: {
    width: "100%",
    borderCollapse:
      "collapse",
  },

  th: {
    padding:
      "15px 14px",
    background: "#f6f8fb",
    borderBottom:
      "1px solid #dbe5ef",
    textAlign: "left",
    fontSize: 12,
    fontWeight: 800,
    color: "#425a75",
    whiteSpace: "nowrap",
  },

  thCenter: {
    padding:
      "15px 14px",
    background: "#f6f8fb",
    borderBottom:
      "1px solid #dbe5ef",
    textAlign: "center",
    fontSize: 12,
    fontWeight: 800,
    color: "#425a75",
    whiteSpace: "nowrap",
  },

  td: {
    padding:
      "16px 14px",
    borderBottom:
      "1px solid #edf1f5",
    color: "#173651",
    fontSize: 14,
    verticalAlign:
      "middle",
  },

  tdCenter: {
    padding:
      "16px 14px",
    borderBottom:
      "1px solid #edf1f5",
    textAlign: "center",
    color: "#173651",
    fontSize: 14,
    verticalAlign:
      "middle",
  },

  needOrderButton: {
    minWidth: 58,
    minHeight: 38,
    border:
      "1px solid #ff9f9f",
    background: "#ffe6e6",
    color: "#d71920",
    borderRadius: 9,
    padding:
      "8px 18px",
    fontWeight: 800,
    fontSize: 15,
    lineHeight: 1,
    cursor: "pointer",
    position: "relative",
    zIndex: 5,
    pointerEvents: "auto",
  },

  noOrderBadge: {
    display:
      "inline-block",
    minWidth: 52,
    padding:
      "7px 16px",
    borderRadius: 8,
    background: "#e4f7ed",
    color: "#087b3d",
    fontWeight: 800,
    boxSizing: "border-box",
  },

  infoBox: {
    marginTop: 16,
    background: "#f0f7ff",
    border:
      "1px solid #d6e9ff",
    borderRadius: 10,
    padding:
      "13px 16px",
    color: "#45627e",
    display: "flex",
    gap: 10,
    fontSize: 13,
  },

  /* ==========================================================
     REQUIREMENTS
     ========================================================== */

  requirementsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(6, minmax(130px, 1fr))",
    gap: 16,
  },

  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 800,
    color: "#3f5874",
    marginBottom: 7,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border:
      "1px solid #d4dfeb",
    borderRadius: 9,
    padding:
      "12px 13px",
    fontSize: 14,
    color: "#15344f",
    background: "#ffffff",
    outline: "none",
  },

  textarea: {
    width: "100%",
    minHeight: 88,
    resize: "vertical",
    boxSizing: "border-box",
    border:
      "1px solid #d4dfeb",
    borderRadius: 9,
    padding:
      "12px 13px",
    fontSize: 14,
    fontFamily: "inherit",
    color: "#15344f",
    background: "#ffffff",
    outline: "none",
  },

  primaryButton: {
    border: 0,
    borderRadius: 9,
    padding:
      "12px 18px",
    background: "#1473e6",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },

  secondaryButton: {
    border:
      "1px solid #d5e0eb",
    borderRadius: 9,
    padding:
      "11px 16px",
    background: "#ffffff",
    color: "#173651",
    fontWeight: 700,
    cursor: "pointer",
  },

  emptyCell: {
    padding:
      "32px 20px",
    textAlign: "center",
    color: "#71849b",
    fontSize: 14,
  },

  mutedText: {
    marginTop: 4,
    color: "#73869d",
    fontSize: 12,
  },

  loadingText: {
    padding: "12px 0",
    color: "#71849b",
    textAlign: "center",
  },

  /* ==========================================================
     MODAL
     ========================================================== */

  modalOverlay: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,

    zIndex: 2147483647,

    background:
      "rgba(5,25,42,.65)",

    display: "flex",

    alignItems: "center",

    justifyContent:
      "center",

    padding: 24,

    overflowY: "auto",

    pointerEvents: "auto",
  },

  modal: {
    width:
      "min(980px, 96vw)",

    maxHeight: "92vh",

    background: "#ffffff",

    borderRadius: 16,

    boxShadow:
      "0 24px 70px rgba(0,0,0,.35)",

    overflow: "hidden",

    position: "relative",

    zIndex: 2147483647,
  },

  modalHeader: {
    padding:
      "20px 24px",

    borderBottom:
      "1px solid #dce5ee",

    display: "flex",

    justifyContent:
      "space-between",

    alignItems:
      "flex-start",

    gap: 20,

    background: "#ffffff",
  },

  modalEyebrow: {
    color: "#1473e6",

    fontSize: 11,

    fontWeight: 800,

    letterSpacing: 1.2,
  },

  modalTitle: {
    margin: "4px 0 0",

    fontSize: 28,

    fontWeight: 800,

    color: "#082c48",
  },

  modalSubtitle: {
    margin: "6px 0 0",

    color: "#6d8198",

    fontSize: 14,
  },

  closeButton: {
    width: 40,

    height: 40,

    border:
      "1px solid #d7e1ec",

    borderRadius: 10,

    background: "#ffffff",

    color: "#163650",

    fontSize: 24,

    cursor: "pointer",
  },

  modalBody: {
    padding: 24,

    overflowY: "auto",

    maxHeight:
      "calc(92vh - 165px)",

    background: "#f8fafc",
  },

  formSection: {
    background: "#ffffff",

    border:
      "1px solid #dce5ee",

    borderRadius: 13,

    padding: 20,

    marginBottom: 16,
  },

  formSectionTitle: {
    margin:
      "0 0 16px",

    fontSize: 18,

    fontWeight: 800,

    color: "#0c304c",
  },

  autoGrid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",

    gap: 14,
  },

  autoGridThree: {
    display: "grid",

    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",

    gap: 14,
  },

  formGrid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",

    gap: 16,
  },

  fullWidth: {
    gridColumn:
      "1 / -1",
  },

  readOnlyBox: {
    minHeight: 43,

    boxSizing: "border-box",

    border:
      "1px solid #dce5ee",

    background: "#f6f8fb",

    borderRadius: 9,

    padding:
      "12px 13px",

    color: "#173651",

    fontWeight: 700,

    fontSize: 14,
  },

  readOnlyHighlight: {
    background: "#fff0f0",

    border:
      "1px solid #ffcaca",

    color: "#c41d1d",
  },

  totalCostBox: {
    minHeight: 43,

    boxSizing: "border-box",

    border:
      "1px solid #c7e1d1",

    background: "#edf9f1",

    borderRadius: 9,

    padding:
      "12px 13px",

    color: "#087b3d",

    fontWeight: 800,

    fontSize: 16,
  },

  modalFooter: {
    padding:
      "16px 24px",

    borderTop:
      "1px solid #dce5ee",

    display: "flex",

    justifyContent:
      "flex-end",

    gap: 12,

    background: "#ffffff",
  },

  cancelButton: {
    border:
      "1px solid #d4dfeb",

    borderRadius: 9,

    padding:
      "12px 20px",

    background: "#ffffff",

    color: "#173651",

    fontWeight: 700,

    cursor: "pointer",
  },

  placeOrderButton: {
    border: 0,

    borderRadius: 9,

    padding:
      "12px 22px",

    background: "#1473e6",

    color: "#ffffff",

    fontWeight: 800,

    cursor: "pointer",
  },
};