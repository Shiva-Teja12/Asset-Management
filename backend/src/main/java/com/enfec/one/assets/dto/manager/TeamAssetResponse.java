package com.enfec.one.assets.dto.manager;

import com.enfec.one.assets.enums.AssetAssignmentType;
import com.enfec.one.assets.enums.AssetStatus;

import java.time.Instant;
import java.util.UUID;

public class TeamAssetResponse {

    private UUID id;
    private String assetTag;
    private String name;
    private String category;
    private String brand;
    private String model;
    private String serialNumber;

    private AssetStatus status;
    private AssetAssignmentType assignmentType;

    private Instant assignedOn;

    /*
     * Employee currently holding this asset.
     */
    private UUID employeeId;
    private String employeeName;
    private String employeeCode;

    /*
     * Repair information.
     *
     * These values come from the latest AssetEvent
     * where newStatus = IN_REPAIR.
     */
    private String repairReason;
    private Instant repairReportedOn;

    /*
     * Your current AssetEvent model does not yet contain
     * these fields. They remain null for now.
     *
     * We can add a dedicated repair model later if required.
     */
    private Instant sentForRepairOn;
    private Instant expectedReturnDate;
    private String serviceProvider;
    private String repairRemarks;

    public TeamAssetResponse() {
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

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public AssetStatus getStatus() {
        return status;
    }

    public void setStatus(AssetStatus status) {
        this.status = status;
    }

    public AssetAssignmentType getAssignmentType() {
        return assignmentType;
    }

    public void setAssignmentType(
            AssetAssignmentType assignmentType
    ) {
        this.assignmentType = assignmentType;
    }

    public Instant getAssignedOn() {
        return assignedOn;
    }

    public void setAssignedOn(Instant assignedOn) {
        this.assignedOn = assignedOn;
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

    public String getRepairReason() {
        return repairReason;
    }

    public void setRepairReason(String repairReason) {
        this.repairReason = repairReason;
    }

    public Instant getRepairReportedOn() {
        return repairReportedOn;
    }

    public void setRepairReportedOn(
            Instant repairReportedOn
    ) {
        this.repairReportedOn = repairReportedOn;
    }

    public Instant getSentForRepairOn() {
        return sentForRepairOn;
    }

    public void setSentForRepairOn(
            Instant sentForRepairOn
    ) {
        this.sentForRepairOn = sentForRepairOn;
    }

    public Instant getExpectedReturnDate() {
        return expectedReturnDate;
    }

    public void setExpectedReturnDate(
            Instant expectedReturnDate
    ) {
        this.expectedReturnDate = expectedReturnDate;
    }

    public String getServiceProvider() {
        return serviceProvider;
    }

    public void setServiceProvider(String serviceProvider) {
        this.serviceProvider = serviceProvider;
    }

    public String getRepairRemarks() {
        return repairRemarks;
    }

    public void setRepairRemarks(String repairRemarks) {
        this.repairRemarks = repairRemarks;
    }
}