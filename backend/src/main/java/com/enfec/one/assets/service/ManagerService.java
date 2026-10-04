package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.manager.ManagerDashboardResponse;
import com.enfec.one.assets.dto.manager.TeamAssetResponse;
import com.enfec.one.assets.dto.manager.TeamMemberResponse;
import com.enfec.one.assets.dto.secondarydevice.ManagerDecisionRequest;
import com.enfec.one.assets.dto.secondarydevice.SecondaryDeviceRequestResponse;
import com.enfec.one.assets.entity.AppUser;
import com.enfec.one.assets.entity.Asset;
import com.enfec.one.assets.entity.AssetAssignment;
import com.enfec.one.assets.entity.AssetEvent;
import com.enfec.one.assets.entity.SecondaryDeviceRequest;
import com.enfec.one.assets.enums.AssetStatus;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.enums.SecondaryDeviceRequestStatus;
import com.enfec.one.assets.repository.AppUserRepository;
import com.enfec.one.assets.repository.AssetAssignmentRepository;
import com.enfec.one.assets.repository.AssetEventRepository;
import com.enfec.one.assets.repository.AssetRepository;
import com.enfec.one.assets.repository.SecondaryDeviceRequestRepository;
import com.enfec.one.assets.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ManagerService {

    private final CurrentUser currentUser;

    private final AppUserRepository appUserRepository;

    private final AssetRepository assetRepository;

    private final AssetAssignmentRepository assetAssignmentRepository;

    private final AssetEventRepository assetEventRepository;

    private final SecondaryDeviceRequestRepository
            secondaryDeviceRequestRepository;

    public ManagerService(
            CurrentUser currentUser,
            AppUserRepository appUserRepository,
            AssetRepository assetRepository,
            AssetAssignmentRepository assetAssignmentRepository,
            AssetEventRepository assetEventRepository,
            SecondaryDeviceRequestRepository secondaryDeviceRequestRepository
    ) {
        this.currentUser = currentUser;
        this.appUserRepository = appUserRepository;
        this.assetRepository = assetRepository;
        this.assetAssignmentRepository =
                assetAssignmentRepository;
        this.assetEventRepository = assetEventRepository;
        this.secondaryDeviceRequestRepository =
                secondaryDeviceRequestRepository;
    }

    /*
     * =========================================================
     * MANAGER DASHBOARD
     * =========================================================
     */

    public ManagerDashboardResponse getDashboard() {

        AppUser manager =
                currentUser.requireRole(Role.MANAGER);

        List<AppUser> employees =
                getDirectReports(manager);

        List<UUID> employeeIds =
                employees.stream()
                        .map(AppUser::getId)
                        .toList();

        List<AssetAssignment> assignments =
                getActiveAssignments(employeeIds);

        Map<UUID, Asset> assetMap =
                getAssetMap(assignments);

        long totalAssetsAssigned =
                assignments.size();

        long inUse = 0;

        long inRepair = 0;

        for (AssetAssignment assignment : assignments) {

            Asset asset =
                    assetMap.get(
                            assignment.getAssetId()
                    );

            if (asset == null) {
                continue;
            }

            if (asset.getStatus() == AssetStatus.ASSIGNED) {
                inUse++;
            }

            if (asset.getStatus() == AssetStatus.IN_REPAIR) {
                inRepair++;
            }
        }

        long pendingRequests =
                secondaryDeviceRequestRepository
                        .countByManager_IdAndStatus(
                                manager.getId(),
                                SecondaryDeviceRequestStatus
                                        .PENDING_MANAGER_APPROVAL
                        );

        /*
         * A request still counts as approved even after
         * Asset Admin moves it forward to assignment,
         * procurement or fulfillment.
         */
        long approvedRequests =
                secondaryDeviceRequestRepository
                        .countByManager_IdAndStatusIn(
                                manager.getId(),
                                EnumSet.of(
                                        SecondaryDeviceRequestStatus
                                                .MANAGER_APPROVED,
                                        SecondaryDeviceRequestStatus
                                                .PENDING_ASSIGNMENT,
                                        SecondaryDeviceRequestStatus
                                                .PENDING_PROCUREMENT,
                                        SecondaryDeviceRequestStatus
                                                .FULFILLED
                                )
                        );

        long rejectedRequests =
                secondaryDeviceRequestRepository
                        .countByManager_IdAndStatus(
                                manager.getId(),
                                SecondaryDeviceRequestStatus
                                        .MANAGER_REJECTED
                        );

        ManagerDashboardResponse response =
                new ManagerDashboardResponse();

        response.setManagerName(
                manager.getName()
        );

        response.setTeamMembers(
                employees.size()
        );

        response.setTotalAssetsAssigned(
                totalAssetsAssigned
        );

        response.setInUse(
                inUse
        );

        response.setInRepair(
                inRepair
        );

        response.setPendingRequests(
                pendingRequests
        );

        response.setApprovedRequests(
                approvedRequests
        );

        response.setRejectedRequests(
                rejectedRequests
        );

        return response;
    }


    /*
     * =========================================================
     * MY TEAM
     * =========================================================
     */

    public List<TeamMemberResponse> getTeam() {

        AppUser manager =
                currentUser.requireRole(Role.MANAGER);

        List<AppUser> employees =
                getDirectReports(manager);

        List<TeamMemberResponse> result =
                new ArrayList<>();

        for (AppUser employee : employees) {

            TeamMemberResponse response =
                    new TeamMemberResponse();

            response.setId(
                    employee.getId()
            );

            response.setName(
                    employee.getName()
            );

            response.setEmployeeCode(
                    employee.getEmployeeCode()
            );

            response.setDepartment(
                    employee.getDepartment()
            );

            response.setEmail(
                    employee.getEmail()
            );

            response.setActive(true);

            response.setAssets(
                    getEmployeeTeamAssets(employee)
            );

            long pendingRequests =
                    secondaryDeviceRequestRepository
                            .countByEmployee_IdAndStatus(
                                    employee.getId(),
                                    SecondaryDeviceRequestStatus
                                            .PENDING_MANAGER_APPROVAL
                            );

            response.setPendingRequests(
                    pendingRequests
            );

            result.add(response);
        }

        return result;
    }


    /*
     * =========================================================
     * TEAM ASSETS
     * =========================================================
     */

    public List<TeamAssetResponse> getTeamAssets() {

        AppUser manager =
                currentUser.requireRole(Role.MANAGER);

        List<AppUser> employees =
                getDirectReports(manager);

        List<TeamAssetResponse> result =
                new ArrayList<>();

        for (AppUser employee : employees) {

            result.addAll(
                    getEmployeeTeamAssets(employee)
            );
        }

        return result;
    }


    /*
     * =========================================================
     * SECONDARY DEVICE REQUESTS
     * =========================================================
     */

    public List<SecondaryDeviceRequestResponse>
    getSecondaryDeviceRequests() {

        AppUser manager =
                currentUser.requireRole(Role.MANAGER);

        return secondaryDeviceRequestRepository
                .findAllByManager_IdOrderByRequestedAtDesc(
                        manager.getId()
                )
                .stream()
                .map(this::toSecondaryDeviceRequestResponse)
                .collect(Collectors.toList());
    }


    public SecondaryDeviceRequestResponse
    getSecondaryDeviceRequest(UUID requestId) {

        AppUser manager =
                currentUser.requireRole(Role.MANAGER);

        SecondaryDeviceRequest request =
                findManagerRequest(
                        requestId,
                        manager
                );

        return toSecondaryDeviceRequestResponse(
                request
        );
    }


    /*
     * =========================================================
     * APPROVE
     * =========================================================
     */

    @Transactional
    public SecondaryDeviceRequestResponse approveRequest(
            UUID requestId,
            ManagerDecisionRequest decision
    ) {

        AppUser manager =
                currentUser.requireRole(Role.MANAGER);

        SecondaryDeviceRequest request =
                findManagerRequest(
                        requestId,
                        manager
                );

        requirePendingManagerApproval(
                request
        );

        request.setStatus(
                SecondaryDeviceRequestStatus
                        .MANAGER_APPROVED
        );

        request.setManagerComment(
                cleanComment(decision)
        );

        request.setReviewedBy(
                manager
        );

        request.setReviewedAt(
                Instant.now()
        );

        SecondaryDeviceRequest saved =
                secondaryDeviceRequestRepository.save(
                        request
                );

        return toSecondaryDeviceRequestResponse(
                saved
        );
    }


    /*
     * =========================================================
     * REJECT
     * =========================================================
     */

    @Transactional
    public SecondaryDeviceRequestResponse rejectRequest(
            UUID requestId,
            ManagerDecisionRequest decision
    ) {

        AppUser manager =
                currentUser.requireRole(Role.MANAGER);

        SecondaryDeviceRequest request =
                findManagerRequest(
                        requestId,
                        manager
                );

        requirePendingManagerApproval(
                request
        );

        request.setStatus(
                SecondaryDeviceRequestStatus
                        .MANAGER_REJECTED
        );

        request.setManagerComment(
                cleanComment(decision)
        );

        request.setReviewedBy(
                manager
        );

        request.setReviewedAt(
                Instant.now()
        );

        SecondaryDeviceRequest saved =
                secondaryDeviceRequestRepository.save(
                        request
                );

        return toSecondaryDeviceRequestResponse(
                saved
        );
    }


    /*
     * =========================================================
     * DIRECT REPORTS
     * =========================================================
     */

    private List<AppUser> getDirectReports(
            AppUser manager
    ) {

        return appUserRepository
                .findAllByManager_IdAndRoleOrderByNameAsc(
                        manager.getId(),
                        Role.EMPLOYEE
                );
    }


    /*
     * =========================================================
     * EMPLOYEE TEAM ASSETS
     * =========================================================
     */

    private List<TeamAssetResponse>
    getEmployeeTeamAssets(
            AppUser employee
    ) {

        List<AssetAssignment> assignments =
                assetAssignmentRepository
                        .findAllByEmployeeIdAndReturnedAtIsNullOrderByAssignedAtDesc(
                                employee.getId()
                        );

        List<TeamAssetResponse> result =
                new ArrayList<>();

        for (AssetAssignment assignment : assignments) {

            Asset asset =
                    assetRepository
                            .findById(
                                    assignment.getAssetId()
                            )
                            .orElse(null);

            if (asset == null) {
                continue;
            }

            TeamAssetResponse response =
                    toTeamAssetResponse(
                            employee,
                            assignment,
                            asset
                    );

            result.add(response);
        }

        return result;
    }


    /*
     * =========================================================
     * TEAM ASSET MAPPER
     * =========================================================
     */

    private TeamAssetResponse toTeamAssetResponse(
            AppUser employee,
            AssetAssignment assignment,
            Asset asset
    ) {

        TeamAssetResponse response =
                new TeamAssetResponse();

        response.setId(
                asset.getId()
        );

        response.setAssetTag(
                asset.getAssetTag()
        );

        response.setName(
                asset.getName()
        );

        response.setCategory(
                asset.getCategory()
        );

        response.setBrand(
                asset.getBrand()
        );

        response.setModel(
                asset.getModel()
        );

        response.setSerialNumber(
                asset.getSerialNumber()
        );

        response.setStatus(
                asset.getStatus()
        );

        response.setAssignmentType(
                assignment.getAssignmentType()
        );

        response.setAssignedOn(
                assignment.getAssignedAt()
        );

        response.setEmployeeId(
                employee.getId()
        );

        response.setEmployeeName(
                employee.getName()
        );

        response.setEmployeeCode(
                employee.getEmployeeCode()
        );

        /*
         * IMPORTANT:
         *
         * Only display repair information while the asset
         * is CURRENTLY IN_REPAIR.
         *
         * If it was repaired previously and is now ASSIGNED,
         * we do not display the old repair reason as though
         * the asset is still under repair.
         */
        if (asset.getStatus() == AssetStatus.IN_REPAIR) {

            assetEventRepository
                    .findFirstByAssetIdAndNewStatusOrderByOccurredAtDesc(
                            asset.getId(),
                            AssetStatus.IN_REPAIR
                    )
                    .ifPresent(event -> {

                        response.setRepairReason(
                                event.getReason()
                        );

                        response.setRepairReportedOn(
                                event.getOccurredAt()
                        );
                    });
        }

        return response;
    }


    /*
     * =========================================================
     * SECONDARY DEVICE REQUEST MAPPER
     * =========================================================
     */

    private SecondaryDeviceRequestResponse
    toSecondaryDeviceRequestResponse(
            SecondaryDeviceRequest request
    ) {

        SecondaryDeviceRequestResponse response =
                new SecondaryDeviceRequestResponse();

        response.setId(
                request.getId()
        );

        AppUser employee =
                request.getEmployee();

        if (employee != null) {

            response.setEmployeeId(
                    employee.getId()
            );

            response.setEmployeeName(
                    employee.getName()
            );

            response.setEmployeeCode(
                    employee.getEmployeeCode()
            );

            response.setDepartment(
                    employee.getDepartment()
            );

            response.setCurrentAssets(
                    getCurrentAssetsForRequest(
                            employee.getId()
                    )
            );
        }

        AppUser manager =
                request.getManager();

        if (manager != null) {

            response.setManagerId(
                    manager.getId()
            );

            response.setManagerName(
                    manager.getName()
            );
        }

        response.setCategory(
                request.getCategory()
        );

        response.setReason(
                request.getReason()
        );

        response.setStatus(
                request.getStatus()
        );

        response.setManagerComment(
                request.getManagerComment()
        );

        AppUser reviewedBy =
                request.getReviewedBy();

        if (reviewedBy != null) {

            response.setReviewedById(
                    reviewedBy.getId()
            );

            response.setReviewedBy(
                    reviewedBy.getName()
            );
        }

        response.setReviewedAt(
                request.getReviewedAt()
        );

        Asset assignedAsset =
                request.getAssignedAsset();

        if (assignedAsset != null) {

            response.setAssignedAssetId(
                    assignedAsset.getId()
            );

            response.setAssignedAssetTag(
                    assignedAsset.getAssetTag()
            );

            response.setAssignedAssetName(
                    assignedAsset.getName()
            );
        }

        response.setRequestedAt(
                request.getRequestedAt()
        );

        response.setFulfilledAt(
                request.getFulfilledAt()
        );

        response.setCreatedAt(
                request.getCreatedAt()
        );

        response.setUpdatedAt(
                request.getUpdatedAt()
        );

        return response;
    }


    /*
     * =========================================================
     * CURRENT ASSETS FOR REQUEST REVIEW
     * =========================================================
     */

    private List<SecondaryDeviceRequestResponse.CurrentAsset>
    getCurrentAssetsForRequest(
            UUID employeeId
    ) {

        List<AssetAssignment> assignments =
                assetAssignmentRepository
                        .findAllByEmployeeIdAndReturnedAtIsNullOrderByAssignedAtDesc(
                                employeeId
                        );

        List<SecondaryDeviceRequestResponse.CurrentAsset>
                result = new ArrayList<>();

        for (AssetAssignment assignment : assignments) {

            Asset asset =
                    assetRepository
                            .findById(
                                    assignment.getAssetId()
                            )
                            .orElse(null);

            if (asset == null) {
                continue;
            }

            SecondaryDeviceRequestResponse.CurrentAsset
                    currentAsset =
                    new SecondaryDeviceRequestResponse.CurrentAsset(
                            asset.getId(),
                            asset.getAssetTag(),
                            asset.getName(),
                            asset.getCategory(),
                            asset.getStatus().name()
                    );

            result.add(
                    currentAsset
            );
        }

        return result;
    }


    /*
     * =========================================================
     * REQUEST SECURITY
     * =========================================================
     */

    private SecondaryDeviceRequest findManagerRequest(
            UUID requestId,
            AppUser manager
    ) {

        return secondaryDeviceRequestRepository
                .findByIdAndManager_Id(
                        requestId,
                        manager.getId()
                )
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Secondary device request not found."
                        )
                );
    }


    private void requirePendingManagerApproval(
            SecondaryDeviceRequest request
    ) {

        if (
                request.getStatus()
                        != SecondaryDeviceRequestStatus
                        .PENDING_MANAGER_APPROVAL
        ) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This request has already been reviewed."
            );
        }
    }


    private String cleanComment(
            ManagerDecisionRequest decision
    ) {

        if (
                decision == null
                        || decision.getComment() == null
        ) {
            return null;
        }

        String comment =
                decision.getComment().trim();

        return comment.isEmpty()
                ? null
                : comment;
    }


    /*
     * =========================================================
     * DASHBOARD HELPERS
     * =========================================================
     */

    private List<AssetAssignment> getActiveAssignments(
            List<UUID> employeeIds
    ) {

        if (
                employeeIds == null
                        || employeeIds.isEmpty()
        ) {
            return List.of();
        }

        return assetAssignmentRepository
                .findAllByEmployeeIdInAndReturnedAtIsNullOrderByAssignedAtDesc(
                        employeeIds
                );
    }


    private Map<UUID, Asset> getAssetMap(
            List<AssetAssignment> assignments
    ) {

        if (
                assignments == null
                        || assignments.isEmpty()
        ) {
            return Map.of();
        }

        List<UUID> assetIds =
                assignments.stream()
                        .map(
                                AssetAssignment::getAssetId
                        )
                        .distinct()
                        .toList();

        Map<UUID, Asset> result =
                new HashMap<>();

        assetRepository
                .findAllById(assetIds)
                .forEach(
                        asset ->
                                result.put(
                                        asset.getId(),
                                        asset
                                )
                );

        return result;
    }
}