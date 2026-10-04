package com.enfec.one.assets.dto.secondarydevice;

import com.enfec.one.assets.enums.SecondaryDeviceRequestStatus;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class SecondaryDeviceRequestResponse {

    private UUID id;

    private UUID employeeId;
    private String employeeName;
    private String employeeCode;
    private String department;

    private UUID managerId;
    private String managerName;

    private String category;
    private String reason;

    private SecondaryDeviceRequestStatus status;

    private String managerComment;

    private UUID reviewedById;
    private String reviewedBy;
    private Instant reviewedAt;

    private UUID assignedAssetId;
    private String assignedAssetTag;
    private String assignedAssetName;

    private Instant requestedAt;
    private Instant fulfilledAt;
    private Instant createdAt;
    private Instant updatedAt;

    /*
     * Assets currently assigned to the employee.
     *
     * This is useful on the Manager Review Request screen.
     */
    private List<CurrentAsset> currentAssets = new ArrayList<>();

    public SecondaryDeviceRequestResponse() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(UUID employeeId) {
        this.employeeId = employeeId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getEmployeeCode() {
        return employeeCode;
    }

    public void setEmployeeCode(String employeeCode) {
        this.employeeCode = employeeCode;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public UUID getManagerId() {
        return managerId;
    }

    public void setManagerId(UUID managerId) {
        this.managerId = managerId;
    }

    public String getManagerName() {
        return managerName;
    }

    public void setManagerName(String managerName) {
        this.managerName = managerName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public SecondaryDeviceRequestStatus getStatus() {
        return status;
    }

    public void setStatus(SecondaryDeviceRequestStatus status) {
        this.status = status;
    }

    public String getManagerComment() {
        return managerComment;
    }

    public void setManagerComment(String managerComment) {
        this.managerComment = managerComment;
    }

    public UUID getReviewedById() {
        return reviewedById;
    }

    public void setReviewedById(UUID reviewedById) {
        this.reviewedById = reviewedById;
    }

    public String getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(String reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public UUID getAssignedAssetId() {
        return assignedAssetId;
    }

    public void setAssignedAssetId(UUID assignedAssetId) {
        this.assignedAssetId = assignedAssetId;
    }

    public String getAssignedAssetTag() {
        return assignedAssetTag;
    }

    public void setAssignedAssetTag(String assignedAssetTag) {
        this.assignedAssetTag = assignedAssetTag;
    }

    public String getAssignedAssetName() {
        return assignedAssetName;
    }

    public void setAssignedAssetName(String assignedAssetName) {
        this.assignedAssetName = assignedAssetName;
    }

    public Instant getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(Instant requestedAt) {
        this.requestedAt = requestedAt;
    }

    public Instant getFulfilledAt() {
        return fulfilledAt;
    }

    public void setFulfilledAt(Instant fulfilledAt) {
        this.fulfilledAt = fulfilledAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<CurrentAsset> getCurrentAssets() {
        return currentAssets;
    }

    public void setCurrentAssets(List<CurrentAsset> currentAssets) {
        this.currentAssets =
                currentAssets == null ? new ArrayList<>() : currentAssets;
    }

    public static class CurrentAsset {

        private UUID id;
        private String assetTag;
        private String name;
        private String category;
        private String status;

        public CurrentAsset() {
        }

        public CurrentAsset(
                UUID id,
                String assetTag,
                String name,
                String category,
                String status
        ) {
            this.id = id;
            this.assetTag = assetTag;
            this.name = name;
            this.category = category;
            this.status = status;
        }

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public String getAssetTag() {
            return assetTag;
        }

        public void setAssetTag(String assetTag) {
            this.assetTag = assetTag;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }
}