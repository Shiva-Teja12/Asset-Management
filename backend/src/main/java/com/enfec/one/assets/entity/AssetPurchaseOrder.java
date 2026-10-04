package com.enfec.one.assets.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "asset_purchase_orders")
public class AssetPurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /*
     * ONBOARDING REQUEST LINK
     *
     * Links a new purchase order to the
     * onboarding asset request that caused
     * the purchase.
     *
     * This column is nullable at database/entity
     * level because historical purchase orders
     * were created before this relationship existed.
     */
    @Column(
            name = "onboarding_request_id"
    )
    private UUID onboardingRequestId;

    /*
     * INVENTORY REQUIREMENT
     */

    @Column(
            nullable = false,
            length = 100
    )
    private String category;

    @Column(
            name = "current_available_stock",
            nullable = false
    )
    private Integer currentAvailableStock;

    @Column(
            name = "required_available_stock",
            nullable = false
    )
    private Integer requiredAvailableStock;

    @Column(
            name = "quantity_needed",
            nullable = false
    )
    private Integer quantityNeeded;

    /*
     * EQUIPMENT DETAILS
     */

    @Column(
            nullable = false,
            length = 120
    )
    private String brand;

    @Column(
            nullable = false,
            length = 150
    )
    private String model;

    @Column(
            nullable = false,
            length = 2000
    )
    private String specifications;

    /*
     * ORDER DETAILS
     */

    @Column(
            name = "quantity_ordered",
            nullable = false
    )
    private Integer quantityOrdered;

    /*
     * Number of physical assets from this
     * purchase order that have been received
     * and registered into inventory.
     */
    @Column(
            name = "quantity_received",
            nullable = false
    )
    private Integer quantityReceived;

    /*
     * Purchase order lifecycle.
     *
     * ORDERED
     * PARTIALLY_RECEIVED
     * RECEIVED
     */
    @Column(
            nullable = false,
            length = 30
    )
    private String status;

    @Column(
            name = "price_per_unit",
            nullable = false,
            precision = 14,
            scale = 2
    )
    private BigDecimal pricePerUnit;

    @Column(
            name = "total_estimated_cost",
            nullable = false,
            precision = 16,
            scale = 2
    )
    private BigDecimal totalEstimatedCost;

    @Column(
            nullable = false,
            length = 200
    )
    private String supplier;

    @Column(
            nullable = false,
            length = 1000
    )
    private String reason;

    /*
     * ORDER INFORMATION
     */

    @Column(
            name = "ordered_by_name",
            nullable = false,
            length = 200
    )
    private String orderedByName;

    @Column(
            name = "ordered_by_email",
            nullable = false,
            length = 250
    )
    private String orderedByEmail;

    @Column(
            name = "ordered_at",
            nullable = false
    )
    private Instant orderedAt;

    /*
     * JPA CONSTRUCTOR
     */

    protected AssetPurchaseOrder() {
    }

    /*
     * CREATE PURCHASE ORDER
     */

    public AssetPurchaseOrder(
            UUID onboardingRequestId,
            String category,
            Integer currentAvailableStock,
            Integer requiredAvailableStock,
            Integer quantityNeeded,
            String brand,
            String model,
            String specifications,
            Integer quantityOrdered,
            BigDecimal pricePerUnit,
            String supplier,
            String reason,
            String orderedByName,
            String orderedByEmail
    ) {

        this.onboardingRequestId =
                onboardingRequestId;

        this.category =
                category;

        this.currentAvailableStock =
                currentAvailableStock;

        this.requiredAvailableStock =
                requiredAvailableStock;

        this.quantityNeeded =
                quantityNeeded;

        this.brand =
                brand;

        this.model =
                model;

        this.specifications =
                specifications;

        this.quantityOrdered =
                quantityOrdered;

        /*
         * A newly created purchase order has
         * not received any physical assets yet.
         */
        this.quantityReceived = 0;

        /*
         * Every new purchase order starts
         * in ORDERED status.
         */
        this.status = "ORDERED";

        this.pricePerUnit =
                pricePerUnit;

        /*
         * Total estimated cost is calculated
         * by the backend.
         *
         * Quantity Ordered × Price Per Unit
         */
        this.totalEstimatedCost =
                pricePerUnit.multiply(
                        BigDecimal.valueOf(
                                quantityOrdered
                        )
                );

        this.supplier =
                supplier;

        this.reason =
                reason;

        this.orderedByName =
                orderedByName;

        this.orderedByEmail =
                orderedByEmail;

        this.orderedAt =
                Instant.now();
    }

    /*
     * GETTERS
     */

    public UUID getId() {
        return id;
    }

    public UUID getOnboardingRequestId() {
        return onboardingRequestId;
    }

    public String getCategory() {
        return category;
    }

    public Integer getCurrentAvailableStock() {
        return currentAvailableStock;
    }

    public Integer getRequiredAvailableStock() {
        return requiredAvailableStock;
    }

    public Integer getQuantityNeeded() {
        return quantityNeeded;
    }

    public String getBrand() {
        return brand;
    }

    public String getModel() {
        return model;
    }

    public String getSpecifications() {
        return specifications;
    }

    public Integer getQuantityOrdered() {
        return quantityOrdered;
    }

    public Integer getQuantityReceived() {
        return quantityReceived;
    }

    public String getStatus() {
        return status;
    }

    public BigDecimal getPricePerUnit() {
        return pricePerUnit;
    }

    public BigDecimal getTotalEstimatedCost() {
        return totalEstimatedCost;
    }

    public String getSupplier() {
        return supplier;
    }

    public String getReason() {
        return reason;
    }

    public String getOrderedByName() {
        return orderedByName;
    }

    public String getOrderedByEmail() {
        return orderedByEmail;
    }

    public Instant getOrderedAt() {
        return orderedAt;
    }
    public void receiveOne() {

        int received =
                quantityReceived == null
                        ? 0
                        : quantityReceived;

        if (received >= quantityOrdered) {
            throw new IllegalStateException(
                    "All assets for this purchase order have already been received."
            );
        }

        this.quantityReceived =
                received + 1;

        if (this.quantityReceived >= this.quantityOrdered) {
            this.status = "RECEIVED";
        } else {
            this.status = "PARTIALLY_RECEIVED";
        }
    }
}
