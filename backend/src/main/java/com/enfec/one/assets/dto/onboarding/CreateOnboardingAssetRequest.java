package com.enfec.one.assets.dto.onboarding;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreateOnboardingAssetRequest {

    @NotBlank(message = "Employee name is required")
    @Size(max = 200)
    private String employeeName;

    @NotBlank(message = "Employee email is required")
    @Email(message = "Employee email is invalid")
    @Size(max = 200)
    private String employeeEmail;

    @Size(max = 80)
    private String employeeCode;

    @NotBlank(message = "Department is required")
    @Size(max = 100)
    private String department;

    @Size(max = 150)
    private String designation;

    @NotNull(message = "Joining date is required")
    private LocalDate joiningDate;

    @NotBlank(message = "Device category is required")
    @Size(max = 100)
    private String deviceCategory;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    @Size(max = 2000)
    private String specifications;

    @DecimalMin(
            value = "0.0",
            inclusive = true,
            message = "Estimated cost cannot be negative"
    )
    private BigDecimal estimatedCost;

    @NotBlank(
            message = "Business justification is required"
    )
    @Size(max = 2000)
    private String businessJustification;

    public CreateOnboardingAssetRequest() {
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

    public String getBusinessJustification() {
        return businessJustification;
    }

    public void setBusinessJustification(
            String businessJustification
    ) {
        this.businessJustification =
                businessJustification;
    }
}