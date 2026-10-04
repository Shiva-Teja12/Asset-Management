package com.enfec.one.assets.dto.manager;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class TeamMemberResponse {

    private UUID id;
    private String name;
    private String employeeCode;
    private String department;
    private String email;

    /*
     * These fields are kept for frontend compatibility.
     *
     * AppUser currently does not store designation,
     * phone or joining date, so they will remain null
     * until those fields are added to the employee model.
     */
    private String designation;
    private String phone;
    private String joiningDate;

    private boolean active = true;

    private List<TeamAssetResponse> assets =
            new ArrayList<>();

    private long pendingRequests;

    public TeamMemberResponse() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getJoiningDate() {
        return joiningDate;
    }

    public void setJoiningDate(String joiningDate) {
        this.joiningDate = joiningDate;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public List<TeamAssetResponse> getAssets() {
        return assets;
    }

    public void setAssets(
            List<TeamAssetResponse> assets
    ) {
        this.assets =
                assets == null
                        ? new ArrayList<>()
                        : assets;
    }

    public long getPendingRequests() {
        return pendingRequests;
    }

    public void setPendingRequests(long pendingRequests) {
        this.pendingRequests = pendingRequests;
    }
}