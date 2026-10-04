package com.enfec.one.assets.entity;

import com.enfec.one.assets.enums.AssetStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
        name = "assets",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_asset_tag",
                columnNames = "asset_tag"
        )
)
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "asset_tag", nullable = false, length = 80)
    private String assetTag;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(length = 120)
    private String brand;

    @Column(length = 150)
    private String model;

    @Column(name = "serial_number", length = 150)
    private String serialNumber;

    @Column(length = 2000)
    private String specifications;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(
            name = "purchase_price",
            precision = 14,
            scale = 2
    )
    private BigDecimal purchasePrice;

    @Column(length = 200)
    private String supplier;

    /*
     * Nullable intentionally.
     *
     * You already have existing asset rows in PostgreSQL.
     * Hibernate can add this column without breaking those rows.
     */
    @Column(name = "warranty_available")
    private Boolean warrantyAvailable;

    @Column(name = "warranty_start_date")
    private LocalDate warrantyStartDate;

    @Column(name = "warranty_period_months")
    private Integer warrantyPeriodMonths;

    @Column(name = "warranty_expiry_date")
    private LocalDate warrantyExpiryDate;

    @Column(
            name = "warranty_provider",
            length = 200
    )
    private String warrantyProvider;

    @Column(
            name = "warranty_reference",
            length = 200
    )
    private String warrantyReference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AssetStatus status;

    @Column(
            name = "created_at",
            nullable = false
    )
    private Instant createdAt;

    @Column(
            name = "updated_at",
            nullable = false
    )
    private Instant updatedAt;

    protected Asset() {
    }

    public Asset(
            String assetTag,
            String name,
            String category,
            String brand,
            String model,
            String serialNumber,
            String specifications,
            LocalDate purchaseDate,
            BigDecimal purchasePrice,
            String supplier,
            boolean warrantyAvailable,
            LocalDate warrantyStartDate,
            Integer warrantyPeriodMonths,
            String warrantyProvider,
            String warrantyReference
    ) {
        this.assetTag = assetTag;
        this.name = name;
        this.category = category;
        this.brand = brand;
        this.model = model;
        this.serialNumber = serialNumber;
        this.specifications = specifications;
        this.purchaseDate = purchaseDate;
        this.purchasePrice = purchasePrice;
        this.supplier = supplier;

        setWarranty(
                warrantyAvailable,
                warrantyStartDate,
                warrantyPeriodMonths,
                warrantyProvider,
                warrantyReference
        );

        this.status = AssetStatus.IN_STOCK;

        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public void update(
            String assetTag,
            String name,
            String category,
            String brand,
            String model,
            String serialNumber,
            String specifications,
            LocalDate purchaseDate,
            BigDecimal purchasePrice,
            String supplier,
            boolean warrantyAvailable,
            LocalDate warrantyStartDate,
            Integer warrantyPeriodMonths,
            String warrantyProvider,
            String warrantyReference
    ) {
        this.assetTag = assetTag;
        this.name = name;
        this.category = category;
        this.brand = brand;
        this.model = model;
        this.serialNumber = serialNumber;
        this.specifications = specifications;
        this.purchaseDate = purchaseDate;
        this.purchasePrice = purchasePrice;
        this.supplier = supplier;

        setWarranty(
                warrantyAvailable,
                warrantyStartDate,
                warrantyPeriodMonths,
                warrantyProvider,
                warrantyReference
        );

        this.updatedAt = Instant.now();
    }

    private void setWarranty(
            boolean available,
            LocalDate startDate,
            Integer periodMonths,
            String provider,
            String reference
    ) {
        this.warrantyAvailable = available;

        if (!available) {
            this.warrantyStartDate = null;
            this.warrantyPeriodMonths = null;
            this.warrantyExpiryDate = null;
            this.warrantyProvider = null;
            this.warrantyReference = null;

            return;
        }

        this.warrantyStartDate = startDate;
        this.warrantyPeriodMonths = periodMonths;

        if (
                startDate != null &&
                        periodMonths != null
        ) {
            this.warrantyExpiryDate =
                    startDate.plusMonths(
                            periodMonths
                    );
        } else {
            this.warrantyExpiryDate = null;
        }

        this.warrantyProvider = provider;
        this.warrantyReference = reference;
    }

    public void renewWarranty(
            LocalDate newStartDate,
            Integer periodMonths,
            String provider,
            String reference
    ) {
        this.warrantyAvailable = true;

        this.warrantyStartDate =
                newStartDate;

        this.warrantyPeriodMonths =
                periodMonths;

        this.warrantyExpiryDate =
                newStartDate.plusMonths(
                        periodMonths
                );

        this.warrantyProvider =
                provider;

        this.warrantyReference =
                reference;

        this.updatedAt =
                Instant.now();
    }

    public void changeStatus(
            AssetStatus status
    ) {
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getAssetTag() {
        return assetTag;
    }

    public String getName() {
        return name;
    }

    public String getCategory() {
        return category;
    }

    public String getBrand() {
        return brand;
    }

    public String getModel() {
        return model;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public String getSpecifications() {
        return specifications;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }

    public String getSupplier() {
        return supplier;
    }

    public boolean isWarrantyAvailable() {
        return Boolean.TRUE.equals(
                warrantyAvailable
        );
    }

    public LocalDate getWarrantyStartDate() {
        return warrantyStartDate;
    }

    public Integer getWarrantyPeriodMonths() {
        return warrantyPeriodMonths;
    }

    public LocalDate getWarrantyExpiryDate() {
        return warrantyExpiryDate;
    }

    public String getWarrantyProvider() {
        return warrantyProvider;
    }

    public String getWarrantyReference() {
        return warrantyReference;
    }

    public AssetStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}