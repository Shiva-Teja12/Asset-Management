package com.enfec.one.assets.entity;

import com.enfec.one.assets.enums.SecondaryDeviceRequestStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "secondary_device_requests")
public class SecondaryDeviceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /*
     * Employee who requested the secondary device.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "employee_id",
            nullable = false
    )
    private AppUser employee;

    /*
     * Manager who must approve/reject the request.
     *
     * We store the manager on the request so the approval
     * history remains clear even if the employee's manager
     * changes later.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "manager_id",
            nullable = false
    )
    private AppUser manager;

    /*
     * Requested device category.
     *
     * Examples:
     * Laptop
     * Monitor
     * Mobile
     * Tablet
     */
    @Column(nullable = false, length = 100)
    private String category;

    /*
     * Employee's reason / justification for requesting
     * the secondary device.
     */
    @Column(nullable = false, length = 1000)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private SecondaryDeviceRequestStatus status;

    /*
     * Manager's approval/rejection comment.
     */
    @Column(length = 500)
    private String managerComment;

    /*
     * User who reviewed the request.
     *
     * Normally this will be the same manager stored above.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private AppUser reviewedBy;

    @Column
    private Instant reviewedAt;

    /*
     * Actual physical asset assigned after Manager approval.
     *
     * This remains null while:
     *
     * PENDING_MANAGER_APPROVAL
     * MANAGER_APPROVED
     * PENDING_ASSIGNMENT
     * PENDING_PROCUREMENT
     *
     * Once Asset Admin assigns the physical device,
     * this can point to the existing Asset record.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_asset_id")
    private Asset assignedAsset;

    @Column(nullable = false)
    private Instant requestedAt;

    @Column
    private Instant fulfilledAt;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected SecondaryDeviceRequest() {
    }

    public SecondaryDeviceRequest(
            AppUser employee,
            AppUser manager,
            String category,
            String reason
    ) {
        this.employee = employee;
        this.manager = manager;
        this.category = category;
        this.reason = reason;
        this.status =
                SecondaryDeviceRequestStatus.PENDING_MANAGER_APPROVAL;

        Instant now = Instant.now();

        this.requestedAt = now;
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();

        if (requestedAt == null) {
            requestedAt = now;
        }

        if (createdAt == null) {
            createdAt = now;
        }

        if (updatedAt == null) {
            updatedAt = now;
        }

        if (status == null) {
            status =
                    SecondaryDeviceRequestStatus.PENDING_MANAGER_APPROVAL;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public AppUser getEmployee() {
        return employee;
    }

    public AppUser getManager() {
        return manager;
    }

    public String getCategory() {
        return category;
    }

    public String getReason() {
        return reason;
    }

    public SecondaryDeviceRequestStatus getStatus() {
        return status;
    }

    public String getManagerComment() {
        return managerComment;
    }

    public AppUser getReviewedBy() {
        return reviewedBy;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public Asset getAssignedAsset() {
        return assignedAsset;
    }

    public Instant getRequestedAt() {
        return requestedAt;
    }

    public Instant getFulfilledAt() {
        return fulfilledAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public void setStatus(
            SecondaryDeviceRequestStatus status
    ) {
        this.status = status;
    }

    public void setManagerComment(
            String managerComment
    ) {
        this.managerComment = managerComment;
    }

    public void setReviewedBy(
            AppUser reviewedBy
    ) {
        this.reviewedBy = reviewedBy;
    }

    public void setReviewedAt(
            Instant reviewedAt
    ) {
        this.reviewedAt = reviewedAt;
    }

    public void setAssignedAsset(
            Asset assignedAsset
    ) {
        this.assignedAsset = assignedAsset;
    }

    public void setFulfilledAt(
            Instant fulfilledAt
    ) {
        this.fulfilledAt = fulfilledAt;
    }
}