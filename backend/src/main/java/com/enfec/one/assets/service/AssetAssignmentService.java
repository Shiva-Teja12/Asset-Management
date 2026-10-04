package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.asset.AssignAssetRequest;
import com.enfec.one.assets.dto.asset.AssetAssignmentResponse;
import com.enfec.one.assets.dto.asset.AssetResponse;
import com.enfec.one.assets.dto.asset.ReturnAssetRequest;

import com.enfec.one.assets.entity.AppUser;
import com.enfec.one.assets.entity.Asset;
import com.enfec.one.assets.entity.AssetAssignment;
import com.enfec.one.assets.entity.AssetEvent;

import com.enfec.one.assets.enums.AssetAssignmentType;
import com.enfec.one.assets.enums.AssetStatus;
import com.enfec.one.assets.enums.Role;

import com.enfec.one.assets.exception.ConflictException;
import com.enfec.one.assets.exception.ResourceNotFoundException;

import com.enfec.one.assets.repository.AppUserRepository;
import com.enfec.one.assets.repository.AssetAssignmentRepository;
import com.enfec.one.assets.repository.AssetEventRepository;
import com.enfec.one.assets.repository.AssetRepository;

import com.enfec.one.assets.security.CurrentUser;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AssetAssignmentService {

    private final AssetRepository assets;

    private final AssetAssignmentRepository assignments;

    private final AssetEventRepository events;

    private final AppUserRepository users;

    private final CurrentUser current;

    private final AuditService audit;

    private final AssetService assetService;


    public AssetAssignmentService(
            AssetRepository assets,
            AssetAssignmentRepository assignments,
            AssetEventRepository events,
            AppUserRepository users,
            CurrentUser current,
            AuditService audit,
            AssetService assetService
    ) {

        this.assets = assets;
        this.assignments = assignments;
        this.events = events;
        this.users = users;
        this.current = current;
        this.audit = audit;
        this.assetService = assetService;
    }


    /*
     * =========================================================
     * PRIMARY ASSET ASSIGNMENT
     * =========================================================
     *
     * Used for:
     *
     * - normal asset assignment
     * - onboarding asset assignment
     *
     * Signature:
     *
     * assign(
     *      UUID assetId,
     *      AssignAssetRequest request
     * )
     */

    @Transactional
    public AssetResponse assign(
            UUID id,
            AssignAssetRequest request
    ) {

        AppUser admin =
                current.requireRole(
                        Role.ASSET_ADMIN
                );


        Asset asset =
                find(id);


        /*
         * IMPORTANT:
         *
         * Only an asset currently available in inventory
         * can be assigned.
         */
        if (
                asset.getStatus()
                        != AssetStatus.IN_STOCK
        ) {

            throw new ConflictException(
                    "ASSET_NOT_IN_STOCK",
                    "Selected asset is not available in stock."
            );
        }


        /*
         * Extra protection:
         *
         * Even if the lifecycle status says IN_STOCK,
         * make sure there is no active assignment.
         */
        validateAssetNotAssigned(
                id
        );


        /*
         * Find the employee.
         */
        AppUser employee =
                findEmployee(
                        request.employeeId()
                );


        String reason =
                request.reason().trim();


        AssetStatus previousStatus =
                asset.getStatus();


        /*
         * =====================================================
         * CREATE PRIMARY ASSIGNMENT
         * =====================================================
         */

        assignments.save(
                new AssetAssignment(
                        asset.getId(),
                        employee.getId(),
                        employee.getName(),
                        admin.getEmail(),
                        reason,
                        AssetAssignmentType.PRIMARY
                )
        );


        /*
         * =====================================================
         * CHANGE ASSET STATUS
         * =====================================================
         *
         * IN_STOCK
         *      ->
         * ASSIGNED
         */

        asset.changeStatus(
                AssetStatus.ASSIGNED
        );


        /*
         * =====================================================
         * CREATE ASSET EVENT
         * =====================================================
         */

        events.save(
                new AssetEvent(
                        asset.getId(),
                        previousStatus,
                        AssetStatus.ASSIGNED,
                        admin.getEmail(),
                        "Assigned to "
                                + employee.getName()
                                + ": "
                                + reason
                )
        );


        /*
         * =====================================================
         * AUDIT LOG
         * =====================================================
         */

        audit.logWithEmployee(
                admin,
                "ASSIGN_ASSET",
                "ASSET",
                "ASSET",
                asset.getId().toString(),
                asset.getAssetTag(),
                asset,
                employee.getName(),
                previousStatus.name(),
                AssetStatus.ASSIGNED.name(),
                "Assigned PRIMARY asset to "
                        + employee.getName()
                        + ". Reason: "
                        + reason
        );


        /*
         * Return updated asset.
         */
        return assetService.one(
                id
        );
    }


    /*
     * =========================================================
     * SECONDARY DEVICE ASSIGNMENT
     * =========================================================
     *
     * IMPORTANT:
     *
     * Your AssetAdminSecondaryDeviceService already calls:
     *
     * assignmentService.assignSecondary(
     *      asset.getId(),
     *      employee.getId(),
     *      reason
     * );
     *
     * Therefore this method MUST have THREE arguments.
     */

    @Transactional
    public AssetResponse assignSecondary(
            UUID assetId,
            UUID employeeId,
            String reason
    ) {

        AppUser admin =
                current.requireRole(
                        Role.ASSET_ADMIN
                );


        /*
         * Find selected asset.
         */
        Asset asset =
                find(
                        assetId
                );


        /*
         * Asset must still be available.
         */
        if (
                asset.getStatus()
                        != AssetStatus.IN_STOCK
        ) {

            throw new ConflictException(
                    "ASSET_NOT_IN_STOCK",
                    "Selected asset is not available in stock."
            );
        }


        /*
         * Make sure asset does not already have
         * an active assignment.
         */
        validateAssetNotAssigned(
                assetId
        );


        /*
         * Find employee.
         */
        AppUser employee =
                findEmployee(
                        employeeId
                );


        /*
         * Clean assignment reason.
         */
        String cleanReason;

        if (
                reason == null
                        ||
                        reason.isBlank()
        ) {

            cleanReason =
                    "Secondary device assignment";

        } else {

            cleanReason =
                    reason.trim();
        }


        AssetStatus previousStatus =
                asset.getStatus();


        /*
         * =====================================================
         * CREATE SECONDARY ASSIGNMENT
         * =====================================================
         */

        assignments.save(
                new AssetAssignment(
                        asset.getId(),
                        employee.getId(),
                        employee.getName(),
                        admin.getEmail(),
                        cleanReason,
                        AssetAssignmentType.SECONDARY
                )
        );


        /*
         * =====================================================
         * CHANGE ASSET STATUS
         * =====================================================
         */

        asset.changeStatus(
                AssetStatus.ASSIGNED
        );


        /*
         * =====================================================
         * CREATE ASSET EVENT
         * =====================================================
         */

        events.save(
                new AssetEvent(
                        asset.getId(),
                        previousStatus,
                        AssetStatus.ASSIGNED,
                        admin.getEmail(),
                        "Secondary asset assigned to "
                                + employee.getName()
                                + ": "
                                + cleanReason
                )
        );


        /*
         * =====================================================
         * AUDIT LOG
         * =====================================================
         */

        audit.logWithEmployee(
                admin,
                "ASSIGN_SECONDARY_ASSET",
                "ASSET",
                "ASSET",
                asset.getId().toString(),
                asset.getAssetTag(),
                asset,
                employee.getName(),
                previousStatus.name(),
                AssetStatus.ASSIGNED.name(),
                "Secondary asset assigned to "
                        + employee.getName()
                        + ". Reason: "
                        + cleanReason
        );


        return assetService.one(
                assetId
        );
    }


    /*
     * =========================================================
     * RETURN ASSET
     * =========================================================
     */

    @Transactional
    public AssetResponse returnAsset(
            UUID id,
            ReturnAssetRequest request
    ) {

        AppUser admin =
                current.requireRole(
                        Role.ASSET_ADMIN
                );


        Asset asset =
                find(id);


        /*
         * Find active assignment.
         */
        AssetAssignment assignment =
                assignments
                        .findFirstByAssetIdAndReturnedAtIsNull(
                                id
                        )
                        .orElseThrow(() ->
                                new ConflictException(
                                        "ASSET_NOT_ASSIGNED",
                                        "Asset is not currently assigned."
                                )
                        );


        AssetStatus previousStatus =
                asset.getStatus();


        /*
         * IMPORTANT:
         *
         * Your existing AssetAssignment entity uses close().
         *
         * Do not change this to returnAsset().
         */
        assignment.close(
                admin.getEmail(),
                request.reason().trim()
        );


        /*
         * Returned asset goes back into inventory.
         */
        asset.changeStatus(
                AssetStatus.IN_STOCK
        );


        /*
         * Lifecycle event.
         */
        events.save(
                new AssetEvent(
                        asset.getId(),
                        previousStatus,
                        AssetStatus.IN_STOCK,
                        admin.getEmail(),
                        "Returned from "
                                + assignment.getEmployeeName()
                                + ": "
                                + request.reason().trim()
                )
        );


        /*
         * Audit.
         */
        audit.logWithEmployee(
                admin,
                "RETURN_ASSET",
                "ASSET",
                "ASSET",
                asset.getId().toString(),
                asset.getAssetTag(),
                asset,
                assignment.getEmployeeName(),
                previousStatus.name(),
                AssetStatus.IN_STOCK.name(),
                "Return from "
                        + assignment.getEmployeeName()
                        + " recorded by "
                        + admin.getEmail()
                        + ". Reason: "
                        + request.reason().trim()
        );


        return assetService.one(
                id
        );
    }


    /*
     * =========================================================
     * ASSIGNMENT HISTORY
     * =========================================================
     */

    @Transactional(readOnly = true)
    public List<AssetAssignmentResponse> history(
            UUID id
    ) {

        current.requireRole(
                Role.ASSET_ADMIN
        );


        /*
         * Ensure asset exists.
         */
        find(id);


        return assignments
                .findAllByAssetIdOrderByAssignedAtDesc(
                        id
                )
                .stream()
                .map(assignment ->
                        new AssetAssignmentResponse(
                                assignment.getId(),
                                assignment.getAssetId(),
                                assignment.getEmployeeId(),
                                assignment.getEmployeeName(),
                                assignment.getAssignedAt(),
                                assignment.getAssignedBy(),
                                assignment.getReason(),
                                assignment.getReturnedAt(),
                                assignment.getReturnedBy(),
                                assignment.getReturnReason()
                        )
                )
                .toList();
    }


    /*
     * =========================================================
     * VALIDATE ASSET NOT ALREADY ASSIGNED
     * =========================================================
     */

    private void validateAssetNotAssigned(
            UUID assetId
    ) {

        boolean alreadyAssigned =
                assignments
                        .findFirstByAssetIdAndReturnedAtIsNull(
                                assetId
                        )
                        .isPresent();


        if (alreadyAssigned) {

            throw new ConflictException(
                    "ALREADY_ASSIGNED",
                    "Asset is already assigned."
            );
        }
    }


    /*
     * =========================================================
     * FIND EMPLOYEE
     * =========================================================
     */

    private AppUser findEmployee(
            UUID employeeId
    ) {

        return users
                .findById(
                        employeeId
                )
                .filter(user ->
                        user.getRole()
                                == Role.EMPLOYEE
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "EMPLOYEE_NOT_FOUND",
                                "Employee not found."
                        )
                );
    }


    /*
     * =========================================================
     * FIND ASSET
     * =========================================================
     */

    private Asset find(
            UUID id
    ) {

        return assets
                .findById(
                        id
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "ASSET_NOT_FOUND",
                                "Asset was not found."
                        )
                );
    }
}