package com.enfec.one.assets.entity;

import com.enfec.one.assets.enums.OnboardingRequestStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
        name = "onboarding_asset_requests",
        indexes = {
                @Index(
                        name = "idx_onboarding_request_status",
                        columnList = "status"
                ),
                @Index(
                        name = "idx_onboarding_request_employee_email",
                        columnList = "employee_email"
                )
        }
)
public class OnboardingAssetRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(
            name = "request_number",
            nullable = false,
            unique = true,
            length = 40
    )
    private String requestNumber;


    /*
     * =========================================================
     * NEW JOINER INFORMATION
     * =========================================================
     */

    @Column(
            name = "employee_name",
            nullable = false,
            length = 200
    )
    private String employeeName;

    @Column(
            name = "employee_email",
            nullable = false,
            length = 200
    )
    private String employeeEmail;

    @Column(
            name = "employee_code",
            length = 80
    )
    private String employeeCode;

    @Column(
            name = "department",
            nullable = false,
            length = 100
    )
    private String department;

    @Column(
            name = "designation",
            length = 150
    )
    private String designation;

    @Column(
            name = "joining_date",
            nullable = false
    )
    private LocalDate joiningDate;


    /*
     * =========================================================
     * ASSET REQUIREMENT
     * =========================================================
     */

    @Column(
            name = "device_category",
            nullable = false,
            length = 100
    )
    private String deviceCategory;

    @Column(
            name = "quantity",
            nullable = false
    )
    private Integer quantity;

    @Column(
            name = "specifications",
            length = 2000
    )
    private String specifications;

    @Column(
            name = "estimated_cost",
            precision = 14,
            scale = 2
    )
    private BigDecimal estimatedCost;


    /*
     * =========================================================
     * FINANCE BUDGET INFORMATION
     * =========================================================
     */

    @Column(
            name = "budget_available",
            precision = 15,
            scale = 2
    )
    private BigDecimal budgetAvailable;

    @Column(
            name = "amount_requested",
            precision = 15,
            scale = 2
    )
    private BigDecimal amountRequested;

    @Column(
            name = "remaining_budget",
            precision = 15,
            scale = 2
    )
    private BigDecimal remainingBudget;

    @Column(
            name = "budget_status",
            length = 50
    )
    private String budgetStatus;

    @Column(
            name = "cost_center",
            length = 255
    )
    private String costCenter;


    @Column(
            name = "business_justification",
            nullable = false,
            length = 2000
    )
    private String businessJustification;


    /*
     * =========================================================
     * WORKFLOW
     * =========================================================
     */

    @Enumerated(EnumType.STRING)
    @Column(
            name = "status",
            nullable = false,
            length = 50
    )
    private OnboardingRequestStatus status;


    /*
     * =========================================================
     * HR ADMIN
     * =========================================================
     */

    @Column(
            name = "created_by_email",
            nullable = false,
            length = 200
    )
    private String createdByEmail;

    @Column(
            name = "created_by_name",
            length = 200
    )
    private String createdByName;


    /*
     * =========================================================
     * ASSET ADMIN / SYSTEM ADMIN
     * =========================================================
     */

    @Column(
            name = "asset_admin_email",
            length = 200
    )
    private String assetAdminEmail;

    @Column(
            name = "asset_admin_comment",
            length = 1000
    )
    private String assetAdminComment;

    @Column(
            name = "asset_admin_reviewed_at"
    )
    private Instant assetAdminReviewedAt;


    /*
     * =========================================================
     * FINANCE
     * =========================================================
     */

    @Column(
            name = "finance_email",
            length = 200
    )
    private String financeEmail;

    @Column(
            name = "finance_comment",
            length = 1000
    )
    private String financeComment;

    @Column(
            name = "finance_reviewed_at"
    )
    private Instant financeReviewedAt;


    /*
     * =========================================================
     * INITIAL VP APPROVAL
     * =========================================================
     */

    @Column(
            name = "vp_email",
            length = 200
    )
    private String vpEmail;

    @Column(
            name = "vp_comment",
            length = 1000
    )
    private String vpComment;

    @Column(
            name = "vp_reviewed_at"
    )
    private Instant vpReviewedAt;


    /*
     * =========================================================
     * PURCHASE / SECOND VP APPROVAL
     * =========================================================
     */

    @Column(
            name = "purchase_vp_email",
            length = 200
    )
    private String purchaseVpEmail;

    @Column(
            name = "purchase_vp_comment",
            length = 1000
    )
    private String purchaseVpComment;

    @Column(
            name = "purchase_vp_reviewed_at"
    )
    private Instant purchaseVpReviewedAt;


    /*
     * =========================================================
     * FINAL ALLOCATION
     * =========================================================
     */

    @Column(
            name = "assigned_asset_id"
    )
    private UUID assignedAssetId;

    @Column(
            name = "allocated_at"
    )
    private Instant allocatedAt;


    /*
     * =========================================================
     * TIMESTAMPS
     * =========================================================
     */

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


    public OnboardingAssetRequest() {
    }


    @PrePersist
    public void prePersist() {

        Instant now = Instant.now();

        if (id == null) {
            id = UUID.randomUUID();
        }

        if (requestNumber == null || requestNumber.isBlank()) {

            requestNumber =
                    "ONB-"
                            + UUID.randomUUID()
                            .toString()
                            .substring(0, 8)
                            .toUpperCase();
        }

        if (status == null) {
            status =
                    OnboardingRequestStatus
                            .PENDING_ASSET_ADMIN;
        }

        if (quantity == null || quantity < 1) {
            quantity = 1;
        }

        createdAt = now;
        updatedAt = now;
    }


    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }


    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }


    public String getRequestNumber() {
        return requestNumber;
    }

    public void setRequestNumber(
            String requestNumber
    ) {
        this.requestNumber = requestNumber;
    }


    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(
            String employeeName
    ) {
        this.employeeName = employeeName;
    }


    public String getEmployeeEmail() {
        return employeeEmail;
    }

    public void setEmployeeEmail(
            String employeeEmail
    ) {
        this.employeeEmail = employeeEmail;
    }


    public String getEmployeeCode() {
        return employeeCode;
    }

    public void setEmployeeCode(
            String employeeCode
    ) {
        this.employeeCode = employeeCode;
    }


    public String getDepartment() {
        return department;
    }

    public void setDepartment(
            String department
    ) {
        this.department = department;
    }


    public String getDesignation() {
        return designation;
    }

    public void setDesignation(
            String designation
    ) {
        this.designation = designation;
    }


    public LocalDate getJoiningDate() {
        return joiningDate;
    }

    public void setJoiningDate(
            LocalDate joiningDate
    ) {
        this.joiningDate = joiningDate;
    }


    public String getDeviceCategory() {
        return deviceCategory;
    }

    public void setDeviceCategory(
            String deviceCategory
    ) {
        this.deviceCategory = deviceCategory;
    }


    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(
            Integer quantity
    ) {
        this.quantity = quantity;
    }


    public String getSpecifications() {
        return specifications;
    }

    public void setSpecifications(
            String specifications
    ) {
        this.specifications = specifications;
    }


    public BigDecimal getEstimatedCost() {
        return estimatedCost;
    }

    public void setEstimatedCost(
            BigDecimal estimatedCost
    ) {
        this.estimatedCost = estimatedCost;
    }


    /*
     * =========================================================
     * FINANCE BUDGET GETTERS / SETTERS
     * =========================================================
     */

    public BigDecimal getBudgetAvailable() {
        return budgetAvailable;
    }

    public void setBudgetAvailable(
            BigDecimal budgetAvailable
    ) {
        this.budgetAvailable = budgetAvailable;
    }


    public BigDecimal getAmountRequested() {
        return amountRequested;
    }

    public void setAmountRequested(
            BigDecimal amountRequested
    ) {
        this.amountRequested = amountRequested;
    }


    public BigDecimal getRemainingBudget() {
        return remainingBudget;
    }

    public void setRemainingBudget(
            BigDecimal remainingBudget
    ) {
        this.remainingBudget = remainingBudget;
    }


    public String getBudgetStatus() {
        return budgetStatus;
    }

    public void setBudgetStatus(
            String budgetStatus
    ) {
        this.budgetStatus = budgetStatus;
    }


    public String getCostCenter() {
        return costCenter;
    }

    public void setCostCenter(
            String costCenter
    ) {
        this.costCenter = costCenter;
    }


    public String getBusinessJustification() {
        return businessJustification;
    }

    public void setBusinessJustification(
            String businessJustification
    ) {
        this.businessJustification =
                businessJustification;
    }


    public OnboardingRequestStatus getStatus() {
        return status;
    }

    public void setStatus(
            OnboardingRequestStatus status
    ) {
        this.status = status;
    }


    public String getCreatedByEmail() {
        return createdByEmail;
    }

    public void setCreatedByEmail(
            String createdByEmail
    ) {
        this.createdByEmail = createdByEmail;
    }


    public String getCreatedByName() {
        return createdByName;
    }

    public void setCreatedByName(
            String createdByName
    ) {
        this.createdByName = createdByName;
    }


    public String getAssetAdminEmail() {
        return assetAdminEmail;
    }

    public void setAssetAdminEmail(
            String assetAdminEmail
    ) {
        this.assetAdminEmail = assetAdminEmail;
    }


    public String getAssetAdminComment() {
        return assetAdminComment;
    }

    public void setAssetAdminComment(
            String assetAdminComment
    ) {
        this.assetAdminComment =
                assetAdminComment;
    }


    public Instant getAssetAdminReviewedAt() {
        return assetAdminReviewedAt;
    }

    public void setAssetAdminReviewedAt(
            Instant assetAdminReviewedAt
    ) {
        this.assetAdminReviewedAt =
                assetAdminReviewedAt;
    }


    public String getFinanceEmail() {
        return financeEmail;
    }

    public void setFinanceEmail(
            String financeEmail
    ) {
        this.financeEmail = financeEmail;
    }


    public String getFinanceComment() {
        return financeComment;
    }

    public void setFinanceComment(
            String financeComment
    ) {
        this.financeComment = financeComment;
    }


    public Instant getFinanceReviewedAt() {
        return financeReviewedAt;
    }

    public void setFinanceReviewedAt(
            Instant financeReviewedAt
    ) {
        this.financeReviewedAt =
                financeReviewedAt;
    }


    /*
     * =========================================================
     * INITIAL VP GETTERS / SETTERS
     * =========================================================
     */

    public String getVpEmail() {
        return vpEmail;
    }

    public void setVpEmail(
            String vpEmail
    ) {
        this.vpEmail = vpEmail;
    }


    public String getVpComment() {
        return vpComment;
    }

    public void setVpComment(
            String vpComment
    ) {
        this.vpComment = vpComment;
    }


    public Instant getVpReviewedAt() {
        return vpReviewedAt;
    }

    public void setVpReviewedAt(
            Instant vpReviewedAt
    ) {
        this.vpReviewedAt = vpReviewedAt;
    }


    /*
     * =========================================================
     * PURCHASE / SECOND VP GETTERS / SETTERS
     * =========================================================
     */

    public String getPurchaseVpEmail() {
        return purchaseVpEmail;
    }

    public void setPurchaseVpEmail(
            String purchaseVpEmail
    ) {
        this.purchaseVpEmail = purchaseVpEmail;
    }


    public String getPurchaseVpComment() {
        return purchaseVpComment;
    }

    public void setPurchaseVpComment(
            String purchaseVpComment
    ) {
        this.purchaseVpComment = purchaseVpComment;
    }


    public Instant getPurchaseVpReviewedAt() {
        return purchaseVpReviewedAt;
    }

    public void setPurchaseVpReviewedAt(
            Instant purchaseVpReviewedAt
    ) {
        this.purchaseVpReviewedAt =
                purchaseVpReviewedAt;
    }


    /*
     * =========================================================
     * FINAL ALLOCATION GETTERS / SETTERS
     * =========================================================
     */

    public UUID getAssignedAssetId() {
        return assignedAssetId;
    }

    public void setAssignedAssetId(
            UUID assignedAssetId
    ) {
        this.assignedAssetId =
                assignedAssetId;
    }


    public Instant getAllocatedAt() {
        return allocatedAt;
    }

    public void setAllocatedAt(
            Instant allocatedAt
    ) {
        this.allocatedAt = allocatedAt;
    }


    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(
            Instant createdAt
    ) {
        this.createdAt = createdAt;
    }


    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(
            Instant updatedAt
    ) {
        this.updatedAt = updatedAt;
    }
}