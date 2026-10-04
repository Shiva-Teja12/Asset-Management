package com.enfec.one.assets.dto.manager;

public class ManagerDashboardResponse {

    private String managerName;

    private long teamMembers;

    private long totalAssetsAssigned;

    private long inUse;

    private long inRepair;

    private long pendingRequests;

    private long approvedRequests;

    private long rejectedRequests;

    public ManagerDashboardResponse() {
    }

    public String getManagerName() {
        return managerName;
    }

    public void setManagerName(String managerName) {
        this.managerName = managerName;
    }

    public long getTeamMembers() {
        return teamMembers;
    }

    public void setTeamMembers(long teamMembers) {
        this.teamMembers = teamMembers;
    }

    public long getTotalAssetsAssigned() {
        return totalAssetsAssigned;
    }

    public void setTotalAssetsAssigned(
            long totalAssetsAssigned
    ) {
        this.totalAssetsAssigned = totalAssetsAssigned;
    }

    public long getInUse() {
        return inUse;
    }

    public void setInUse(long inUse) {
        this.inUse = inUse;
    }

    public long getInRepair() {
        return inRepair;
    }

    public void setInRepair(long inRepair) {
        this.inRepair = inRepair;
    }

    public long getPendingRequests() {
        return pendingRequests;
    }

    public void setPendingRequests(long pendingRequests) {
        this.pendingRequests = pendingRequests;
    }

    public long getApprovedRequests() {
        return approvedRequests;
    }

    public void setApprovedRequests(long approvedRequests) {
        this.approvedRequests = approvedRequests;
    }

    public long getRejectedRequests() {
        return rejectedRequests;
    }

    public void setRejectedRequests(long rejectedRequests) {
        this.rejectedRequests = rejectedRequests;
    }
}