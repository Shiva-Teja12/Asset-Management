package com.enfec.one.assets.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
        name = "asset_warranty_history"
)
public class WarrantyHistory {

    @Id
    @GeneratedValue(
            strategy = GenerationType.UUID
    )
    private UUID id;

    @Column(
            name = "asset_id",
            nullable = false
    )
    private UUID assetId;

    @Column(
            name = "previous_expiry_date"
    )
    private LocalDate previousExpiryDate;

    @Column(
            name = "new_start_date",
            nullable = false
    )
    private LocalDate newStartDate;

    @Column(
            name = "new_expiry_date",
            nullable = false
    )
    private LocalDate newExpiryDate;

    @Column(
            name = "period_months",
            nullable = false
    )
    private Integer periodMonths;

    @Column(length = 200)
    private String provider;

    @Column(
            name = "warranty_reference",
            length = 200
    )
    private String warrantyReference;

    @Column(
            name = "renewal_cost",
            precision = 14,
            scale = 2
    )
    private BigDecimal renewalCost;

    @Column(length = 1000)
    private String notes;

    @Column(
            name = "renewed_by",
            nullable = false,
            length = 200
    )
    private String renewedBy;

    @Column(
            name = "renewed_at",
            nullable = false
    )
    private Instant renewedAt;

    protected WarrantyHistory() {
    }

    public WarrantyHistory(
            UUID assetId,
            LocalDate previousExpiryDate,
            LocalDate newStartDate,
            LocalDate newExpiryDate,
            Integer periodMonths,
            String provider,
            String warrantyReference,
            BigDecimal renewalCost,
            String notes,
            String renewedBy
    ) {
        this.assetId =
                assetId;

        this.previousExpiryDate =
                previousExpiryDate;

        this.newStartDate =
                newStartDate;

        this.newExpiryDate =
                newExpiryDate;

        this.periodMonths =
                periodMonths;

        this.provider =
                provider;

        this.warrantyReference =
                warrantyReference;

        this.renewalCost =
                renewalCost;

        this.notes =
                notes;

        this.renewedBy =
                renewedBy;

        this.renewedAt =
                Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getAssetId() {
        return assetId;
    }

    public LocalDate getPreviousExpiryDate() {
        return previousExpiryDate;
    }

    public LocalDate getNewStartDate() {
        return newStartDate;
    }

    public LocalDate getNewExpiryDate() {
        return newExpiryDate;
    }

    public Integer getPeriodMonths() {
        return periodMonths;
    }

    public String getProvider() {
        return provider;
    }

    public String getWarrantyReference() {
        return warrantyReference;
    }

    public BigDecimal getRenewalCost() {
        return renewalCost;
    }

    public String getNotes() {
        return notes;
    }

    public String getRenewedBy() {
        return renewedBy;
    }

    public Instant getRenewedAt() {
        return renewedAt;
    }
}