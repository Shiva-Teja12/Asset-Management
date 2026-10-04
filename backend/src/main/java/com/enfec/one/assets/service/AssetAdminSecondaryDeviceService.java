package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.asset.AssetResponse;
import com.enfec.one.assets.dto.secondarydevice.SecondaryDeviceRequestResponse;
import com.enfec.one.assets.entity.AppUser;
import com.enfec.one.assets.entity.Asset;
import com.enfec.one.assets.entity.AssetAssignment;
import com.enfec.one.assets.entity.SecondaryDeviceRequest;
import com.enfec.one.assets.enums.AssetStatus;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.enums.SecondaryDeviceRequestStatus;
import com.enfec.one.assets.exception.ConflictException;
import com.enfec.one.assets.exception.ResourceNotFoundException;
import com.enfec.one.assets.repository.AssetAssignmentRepository;
import com.enfec.one.assets.repository.AssetRepository;
import com.enfec.one.assets.repository.SecondaryDeviceRequestRepository;
import com.enfec.one.assets.security.CurrentUser;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.UUID;

@Service
public class AssetAdminSecondaryDeviceService {

    private final SecondaryDeviceRequestRepository requests;
    private final AssetRepository assets;
    private final AssetAssignmentRepository assignments;
    private final AssetAssignmentService assignmentService;
    private final AssetService assetService;
    private final CurrentUser current;

    public AssetAdminSecondaryDeviceService(
            SecondaryDeviceRequestRepository requests,
            AssetRepository assets,
            AssetAssignmentRepository assignments,
            AssetAssignmentService assignmentService,
            AssetService assetService,
            CurrentUser current
    ) {
        this.requests = requests;
        this.assets = assets;
        this.assignments = assignments;
        this.assignmentService = assignmentService;
        this.assetService = assetService;
        this.current = current;
    }


    /*
     * =========================================================
     * GET ALL MANAGER-APPROVED REQUESTS
     * =========================================================
     *
     * Asset Admin sees requests that have already passed
     * Manager approval.
     *
     * Includes:
     *
     * MANAGER_APPROVED
     * PENDING_ASSIGNMENT
     * PENDING_PROCUREMENT
     * FULFILLED
     */
    @Transactional(readOnly = true)
    public List<SecondaryDeviceRequestResponse> all() {

        current.requireRole(
                Role.ASSET_ADMIN
        );

        return requests
                .findAllByStatusInOrderByRequestedAtAsc(
                        EnumSet.of(
                                SecondaryDeviceRequestStatus.MANAGER_APPROVED,
                                SecondaryDeviceRequestStatus.PENDING_ASSIGNMENT,
                                SecondaryDeviceRequestStatus.PENDING_PROCUREMENT,
                                SecondaryDeviceRequestStatus.FULFILLED
                        )
                )
                .stream()
                .map(this::response)
                .toList();
    }


    /*
     * =========================================================
     * GET ONE REQUEST
     * =========================================================
     */
    @Transactional(readOnly = true)
    public SecondaryDeviceRequestResponse one(
            UUID requestId
    ) {

        current.requireRole(
                Role.ASSET_ADMIN
        );

        SecondaryDeviceRequest request =
                findRequest(requestId);

        requireManagerApprovedWorkflow(
                request
        );

        return response(request);
    }


    /*
     * =========================================================
     * PROCESS REQUEST
     * =========================================================
     *
     * Asset Admin clicks Process.
     *
     * Backend checks stock for the requested category.
     *
     * Stock available:
     *      PENDING_ASSIGNMENT
     *
     * No stock:
     *      PENDING_PROCUREMENT
     */
    @Transactional
    public SecondaryDeviceRequestResponse process(
            UUID requestId
    ) {

        current.requireRole(
                Role.ASSET_ADMIN
        );

        SecondaryDeviceRequest request =
                findRequest(requestId);

        /*
         * Only requests that passed Manager approval can
         * enter Asset Admin processing.
         */
        if (
                request.getStatus()
                        != SecondaryDeviceRequestStatus.MANAGER_APPROVED
                        &&
                        request.getStatus()
                                != SecondaryDeviceRequestStatus.PENDING_ASSIGNMENT
                        &&
                        request.getStatus()
                                != SecondaryDeviceRequestStatus.PENDING_PROCUREMENT
        ) {

            throw new ConflictException(
                    "REQUEST_NOT_PROCESSABLE",
                    "This secondary device request cannot be processed."
            );
        }

        long availableStock =
                assets.countByCategoryIgnoreCaseAndStatus(
                        request.getCategory(),
                        AssetStatus.IN_STOCK
                );

        if (availableStock > 0) {

            request.setStatus(
                    SecondaryDeviceRequestStatus.PENDING_ASSIGNMENT
            );

        } else {

            request.setStatus(
                    SecondaryDeviceRequestStatus.PENDING_PROCUREMENT
            );
        }

        SecondaryDeviceRequest saved =
                requests.save(request);

        return response(saved);
    }


    /*
     * =========================================================
     * AVAILABLE ASSETS
     * =========================================================
     *
     * Returns only:
     *
     * requested category
     * +
     * IN_STOCK assets
     *
     * Example:
     *
     * Request category = Monitor
     *
     * This endpoint will return only available Monitors.
     */
    @Transactional(readOnly = true)
    public List<AssetResponse> availableAssets(
            UUID requestId
    ) {

        current.requireRole(
                Role.ASSET_ADMIN
        );

        SecondaryDeviceRequest request =
                findRequest(requestId);

        if (
                request.getStatus()
                        != SecondaryDeviceRequestStatus.MANAGER_APPROVED
                        &&
                        request.getStatus()
                                != SecondaryDeviceRequestStatus.PENDING_ASSIGNMENT
                        &&
                        request.getStatus()
                                != SecondaryDeviceRequestStatus.PENDING_PROCUREMENT
        ) {

            throw new ConflictException(
                    "REQUEST_NOT_ASSIGNABLE",
                    "This request is not available for asset assignment."
            );
        }

        return assets
                .findAllByCategoryIgnoreCaseAndStatusOrderByCreatedAtAsc(
                        request.getCategory(),
                        AssetStatus.IN_STOCK
                )
                .stream()
                .map(asset ->
                        assetService.one(
                                asset.getId()
                        )
                )
                .toList();
    }


    /*
     * =========================================================
     * ASSIGN SECONDARY DEVICE
     * =========================================================
     *
     * Asset Admin selects one IN_STOCK asset.
     *
     * This creates:
     *
     * AssetAssignmentType.SECONDARY
     *
     * and changes:
     *
     * Asset -> ASSIGNED
     * Request -> FULFILLED
     */
    @Transactional
    public SecondaryDeviceRequestResponse assign(
            UUID requestId,
            UUID assetId
    ) {

        current.requireRole(
                Role.ASSET_ADMIN
        );

        SecondaryDeviceRequest request =
                findRequest(requestId);

        if (
                request.getStatus()
                        != SecondaryDeviceRequestStatus.MANAGER_APPROVED
                        &&
                        request.getStatus()
                                != SecondaryDeviceRequestStatus.PENDING_ASSIGNMENT
                        &&
                        request.getStatus()
                                != SecondaryDeviceRequestStatus.PENDING_PROCUREMENT
        ) {

            throw new ConflictException(
                    "REQUEST_NOT_ASSIGNABLE",
                    "This secondary device request cannot be assigned."
            );
        }

        AppUser employee =
                request.getEmployee();

        if (employee == null) {

            throw new ConflictException(
                    "REQUEST_EMPLOYEE_MISSING",
                    "Employee information is missing from this request."
            );
        }

        Asset asset =
                assets
                        .findById(assetId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "ASSET_NOT_FOUND",
                                        "Asset was not found."
                                )
                        );


        /*
         * =====================================================
         * VALIDATE CATEGORY
         * =====================================================
         *
         * A Monitor request must not be fulfilled with a
         * Laptop, for example.
         */
        if (
                asset.getCategory() == null
                        ||
                        !asset.getCategory()
                                .trim()
                                .equalsIgnoreCase(
                                        request.getCategory().trim()
                                )
        ) {

            throw new ConflictException(
                    "ASSET_CATEGORY_MISMATCH",
                    "Selected asset does not match the requested device category."
            );
        }


        /*
         * =====================================================
         * VALIDATE STOCK
         * =====================================================
         */
        if (
                asset.getStatus()
                        != AssetStatus.IN_STOCK
        ) {

            throw new ConflictException(
                    "ASSET_NOT_IN_STOCK",
                    "Selected asset is not currently available in stock."
            );
        }


        /*
         * =====================================================
         * CREATE SECONDARY ASSIGNMENT
         * =====================================================
         *
         * This reuses the assignment service we already
         * updated.
         */
        assignmentService.assignSecondary(
                asset.getId(),
                employee.getId(),
                "Secondary device request "
                        + request.getId()
                        + ". Employee reason: "
                        + request.getReason()
        );


        /*
         * =====================================================
         * COMPLETE REQUEST
         * =====================================================
         */
        request.setAssignedAsset(
                asset
        );

        request.setStatus(
                SecondaryDeviceRequestStatus.FULFILLED
        );

        request.setFulfilledAt(
                Instant.now()
        );

        SecondaryDeviceRequest saved =
                requests.save(request);

        return response(saved);
    }


    /*
     * =========================================================
     * FIND REQUEST
     * =========================================================
     */
    private SecondaryDeviceRequest findRequest(
            UUID requestId
    ) {

        return requests
                .findById(requestId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "SECONDARY_DEVICE_REQUEST_NOT_FOUND",
                                "Secondary device request was not found."
                        )
                );
    }


    /*
     * =========================================================
     * VALIDATE ASSET ADMIN VISIBILITY
     * =========================================================
     */
    private void requireManagerApprovedWorkflow(
            SecondaryDeviceRequest request
    ) {

        SecondaryDeviceRequestStatus status =
                request.getStatus();

        if (
                status != SecondaryDeviceRequestStatus.MANAGER_APPROVED
                        &&
                        status != SecondaryDeviceRequestStatus.PENDING_ASSIGNMENT
                        &&
                        status != SecondaryDeviceRequestStatus.PENDING_PROCUREMENT
                        &&
                        status != SecondaryDeviceRequestStatus.FULFILLED
        ) {

            throw new ConflictException(
                    "REQUEST_NOT_MANAGER_APPROVED",
                    "This request has not entered the Asset Admin workflow."
            );
        }
    }


    /*
     * =========================================================
     * RESPONSE MAPPER
     * =========================================================
     */
    private SecondaryDeviceRequestResponse response(
            SecondaryDeviceRequest request
    ) {

        SecondaryDeviceRequestResponse response =
                new SecondaryDeviceRequestResponse();

        response.setId(
                request.getId()
        );


        /*
         * Employee
         */
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
                    currentAssets(
                            employee.getId()
                    )
            );
        }


        /*
         * Manager
         */
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


        /*
         * Request details
         */
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


        /*
         * Manager review
         */
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


        /*
         * Assigned secondary asset
         */
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


        /*
         * Dates
         */
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
     * EMPLOYEE CURRENT ASSETS
     * =========================================================
     */
    private List<
            SecondaryDeviceRequestResponse.CurrentAsset
            >
    currentAssets(
            UUID employeeId
    ) {

        List<AssetAssignment> activeAssignments =
                assignments
                        .findAllByEmployeeIdAndReturnedAtIsNullOrderByAssignedAtDesc(
                                employeeId
                        );

        List<
                SecondaryDeviceRequestResponse.CurrentAsset
                > result =
                new ArrayList<>();

        for (
                AssetAssignment assignment
                : activeAssignments
        ) {

            Asset asset =
                    assets
                            .findById(
                                    assignment.getAssetId()
                            )
                            .orElse(null);

            if (asset == null) {
                continue;
            }

            result.add(
                    new SecondaryDeviceRequestResponse.CurrentAsset(
                            asset.getId(),
                            asset.getAssetTag(),
                            asset.getName(),
                            asset.getCategory(),
                            asset.getStatus().name()
                    )
            );
        }

        return result;
    }
}