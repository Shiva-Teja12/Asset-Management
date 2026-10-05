package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.asset.AssignAssetRequest;
import com.enfec.one.assets.dto.onboarding.CreateOnboardingAssetRequest;
import com.enfec.one.assets.dto.onboarding.OnboardingAssetRequestResponse;
import com.enfec.one.assets.dto.onboarding.OnboardingStockResponse;
import com.enfec.one.assets.entity.AppUser;
import com.enfec.one.assets.entity.Asset;
import com.enfec.one.assets.entity.DepartmentBudget;
import com.enfec.one.assets.entity.OnboardingAssetRequest;
import com.enfec.one.assets.enums.AssetStatus;
import com.enfec.one.assets.enums.OnboardingRequestStatus;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.repository.AppUserRepository;
import com.enfec.one.assets.repository.AssetRepository;
import com.enfec.one.assets.repository.DepartmentBudgetRepository;
import com.enfec.one.assets.repository.OnboardingAssetRequestRepository;
import com.enfec.one.assets.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class OnboardingAssetRequestService {

    private final OnboardingAssetRequestRepository requests;
    private final AssetRepository assets;
    private final AppUserRepository users;
    private final DepartmentBudgetRepository departmentBudgets;
    private final AssetAssignmentService assetAssignmentService;
    private final CurrentUser current;


    public OnboardingAssetRequestService(
            OnboardingAssetRequestRepository requests,
            AssetRepository assets,
            AppUserRepository users,
            DepartmentBudgetRepository departmentBudgets,
            AssetAssignmentService assetAssignmentService,
            CurrentUser current
    ) {
        this.requests = requests;
        this.assets = assets;
        this.users = users;
        this.departmentBudgets = departmentBudgets;
        this.assetAssignmentService = assetAssignmentService;
        this.current = current;
    }


    /*
     * =========================================================
     * HR ADMIN - CREATE REQUEST
     * =========================================================
     */

    @Transactional
    public OnboardingAssetRequestResponse create(
            CreateOnboardingAssetRequest request
    ) {

        AppUser hrAdmin =
                current.requireRole(Role.HR_ADMIN);

        OnboardingAssetRequest entity =
                new OnboardingAssetRequest();

        entity.setEmployeeName(
                clean(request.getEmployeeName())
        );

        entity.setEmployeeEmail(
                clean(request.getEmployeeEmail())
                        .toLowerCase()
        );

        entity.setEmployeeCode(
                cleanNullable(request.getEmployeeCode())
        );

        entity.setDepartment(
                clean(request.getDepartment())
        );

        entity.setDesignation(
                cleanNullable(request.getDesignation())
        );

        entity.setJoiningDate(
                request.getJoiningDate()
        );

        entity.setDeviceCategory(
                clean(request.getDeviceCategory())
        );

        entity.setQuantity(
                request.getQuantity()
        );

        entity.setSpecifications(
                cleanNullable(request.getSpecifications())
        );

        entity.setEstimatedCost(
                request.getEstimatedCost()
        );

        entity.setBusinessJustification(
                clean(request.getBusinessJustification())
        );

        entity.setStatus(
                OnboardingRequestStatus.PENDING_ASSET_ADMIN
        );

        entity.setCreatedByEmail(
                hrAdmin.getEmail()
        );

        entity.setCreatedByName(
                hrAdmin.getName()
        );

        /*
         * Keep the employee's AppUser department synchronized
         * with the department selected by HR during onboarding.
         */
        users.findByEmailIgnoreCase(
                        clean(request.getEmployeeEmail())
                )
                .filter(user ->
                        user.getRole() == Role.EMPLOYEE
                )
                .ifPresent(employee -> {

                    employee.setDepartment(
                            clean(request.getDepartment())
                    );

                    users.save(employee);
                });

        return response(
                requests.save(entity)
        );
    }


    /*
     * =========================================================
     * HR ADMIN - MY REQUESTS
     * =========================================================
     */

    @Transactional(readOnly = true)
    public List<OnboardingAssetRequestResponse> hrRequests() {

        AppUser hrAdmin =
                current.requireRole(Role.HR_ADMIN);

        return requests
                .findAllByCreatedByEmailIgnoreCaseOrderByCreatedAtDesc(
                        hrAdmin.getEmail()
                )
                .stream()
                .map(this::response)
                .toList();
    }


    /*
     * =========================================================
     * ASSET ADMIN - REQUESTS
     * =========================================================
     */

    @Transactional(readOnly = true)
    public List<OnboardingAssetRequestResponse>
    assetAdminRequests() {

        current.requireRole(Role.ASSET_ADMIN);

        return requests
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::response)
                .toList();
    }


    /*
     * =========================================================
     * ASSET ADMIN -> VP
     * =========================================================
     */

    @Transactional
    public OnboardingAssetRequestResponse forwardToVp(
            UUID requestId
    ) {

        AppUser assetAdmin =
                current.requireRole(Role.ASSET_ADMIN);

        OnboardingAssetRequest request =
                findRequest(requestId);

        if (
                request.getStatus()
                        != OnboardingRequestStatus.PENDING_ASSET_ADMIN
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This request is not waiting for Asset Admin review."
            );
        }

        request.setAssetAdminEmail(
                assetAdmin.getEmail()
        );

        request.setAssetAdminComment(
                "Reviewed and forwarded to VP for approval."
        );

        request.setAssetAdminReviewedAt(
                Instant.now()
        );

        request.setStatus(
                OnboardingRequestStatus.PENDING_VP_APPROVAL
        );

        return response(
                requests.save(request)
        );
    }


    /*
     * =========================================================
     * VP - REQUEST LIST
     * =========================================================
     */

    @Transactional(readOnly = true)
    public List<OnboardingAssetRequestResponse> vpRequests() {

        current.requireRole(Role.VP);

        return requests
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(request ->

                        request.getStatus()
                                == OnboardingRequestStatus.PENDING_VP_APPROVAL

                                ||

                                request.getStatus()
                                        == OnboardingRequestStatus.PENDING_PR_VP_APPROVAL

                                ||

                                request.getVpReviewedAt() != null
                )
                .map(this::response)
                .toList();
    }


    /*
     * =========================================================
     * VP - INITIAL APPROVAL
     * =========================================================
     */

    @Transactional
    public OnboardingAssetRequestResponse approveByVp(
            UUID requestId,
            String comment
    ) {

        AppUser vp =
                current.requireRole(Role.VP);

        OnboardingAssetRequest request =
                findRequest(requestId);

        requirePendingVpApproval(request);

        request.setVpEmail(
                vp.getEmail()
        );

        String cleanedComment =
                cleanNullable(comment);

        request.setVpComment(
                cleanedComment == null
                        ? "Employee asset requirement approved by VP."
                        : cleanedComment
        );

        request.setVpReviewedAt(
                Instant.now()
        );

        /*
         * VP approval does NOT immediately allocate.
         * Asset Admin must check real inventory.
         */
        request.setStatus(
                OnboardingRequestStatus.PENDING_STOCK_CHECK
        );

        return response(
                requests.save(request)
        );
    }


    /*
     * =========================================================
     * VP - INITIAL REJECTION
     * =========================================================
     */

    @Transactional
    public OnboardingAssetRequestResponse rejectByVp(
            UUID requestId,
            String comment
    ) {

        AppUser vp =
                current.requireRole(Role.VP);

        OnboardingAssetRequest request =
                findRequest(requestId);

        requirePendingVpApproval(request);

        String cleanedComment =
                cleanNullable(comment);

        if (cleanedComment == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A rejection comment is required."
            );
        }

        request.setVpEmail(
                vp.getEmail()
        );

        request.setVpComment(
                cleanedComment
        );

        request.setVpReviewedAt(
                Instant.now()
        );

        request.setStatus(
                OnboardingRequestStatus.VP_REJECTED
        );

        return response(
                requests.save(request)
        );
    }


    /*
     * =========================================================
     * REAL INVENTORY STOCK CHECK
     * =========================================================
     */

    @Transactional(readOnly = true)
    public OnboardingStockResponse stockCheck(
            UUID requestId
    ) {

        current.requireRole(Role.ASSET_ADMIN);

        OnboardingAssetRequest request =
                findRequest(requestId);

        if (
                request.getStatus()
                        != OnboardingRequestStatus.PENDING_STOCK_CHECK
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This request is not waiting for stock check."
            );
        }

        String category =
                request.getDeviceCategory();

        int required =
                request.getQuantity();

        List<Asset> availableAssets =
                assets
                        .findAllByCategoryIgnoreCaseAndStatusOrderByCreatedAtAsc(
                                category,
                                AssetStatus.IN_STOCK
                        );

        long available =
                availableAssets.size();

        long shortage =
                Math.max(
                        0L,
                        (long) required - available
                );

        boolean enoughStock =
                available >= required;

        List<OnboardingStockResponse.AvailableAssetResponse>
                availableAssetResponses =

                availableAssets
                        .stream()
                        .map(asset ->
                                new OnboardingStockResponse.AvailableAssetResponse(
                                        asset.getId(),
                                        asset.getAssetTag(),
                                        asset.getName(),
                                        asset.getCategory(),
                                        asset.getBrand(),
                                        asset.getModel(),
                                        asset.getSerialNumber(),
                                        asset.getSpecifications()
                                )
                        )
                        .toList();

        return new OnboardingStockResponse(
                request.getId(),
                request.getRequestNumber(),
                request.getEmployeeName(),
                request.getEmployeeEmail(),
                category,
                required,
                available,
                shortage,
                enoughStock,
                availableAssetResponses
        );
    }


    /*
     * =========================================================
     * STOCK NOT AVAILABLE -> RAISE PR
     * =========================================================
     */

    @Transactional
    public OnboardingAssetRequestResponse raisePurchaseRequest(
            UUID requestId,
            BigDecimal estimatedCost
    ) {

        current.requireRole(Role.ASSET_ADMIN);

        OnboardingAssetRequest request =
                findRequest(requestId);

        if (
                request.getStatus()
                        != OnboardingRequestStatus.PENDING_STOCK_CHECK
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This request is not waiting for stock check."
            );
        }

        long available =
                assets
                        .countByCategoryIgnoreCaseAndStatus(
                                request.getDeviceCategory(),
                                AssetStatus.IN_STOCK
                        );

        if (
                available >= request.getQuantity()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Enough stock is available. Allocate an existing asset instead of raising a purchase request."
            );
        }

        if (
                estimatedCost == null
                        ||
                        estimatedCost.compareTo(
                                BigDecimal.ZERO
                        ) <= 0
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Estimated price per unit must be greater than zero."
            );
        }

        request.setEstimatedCost(
                estimatedCost
        );

        request.setStatus(
                OnboardingRequestStatus.PR_REQUIRED
        );

        return response(
                requests.save(request)
        );
    }


    /*
     * =========================================================
     * PR -> FINANCE
     * =========================================================
     */

    @Transactional
    public OnboardingAssetRequestResponse sendPrToFinance(
            UUID requestId
    ) {

        current.requireRole(Role.ASSET_ADMIN);

        OnboardingAssetRequest request =
                findRequest(requestId);

        if (
                request.getStatus()
                        != OnboardingRequestStatus.PR_REQUIRED
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This request does not currently require a purchase request."
            );
        }

        BigDecimal estimatedCost =
                request.getEstimatedCost();

        if (
                estimatedCost == null
                        ||
                        estimatedCost.compareTo(
                                BigDecimal.ZERO
                        ) <= 0
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A valid estimated price is required before sending the purchase request to Finance."
            );
        }

        /*
         * Find configured department budget.
         */
        DepartmentBudget departmentBudget =
                departmentBudgets
                        .findByDepartmentIgnoreCase(
                                request.getDepartment()
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "No budget is configured for department: "
                                                + request.getDepartment()
                                )
                        );

        /*
         * Estimated cost is price per unit.
         *
         * Amount Requested =
         * Estimated Price Per Unit x Quantity
         */
        BigDecimal amountRequested =
                estimatedCost.multiply(
                        BigDecimal.valueOf(
                                request.getQuantity()
                        )
                );

        BigDecimal budgetAvailable =
                departmentBudget.getBudgetAvailable();

        BigDecimal remainingBudget =
                budgetAvailable.subtract(
                        amountRequested
                );

        String budgetStatus =
                budgetAvailable.compareTo(
                        amountRequested
                ) >= 0
                        ? "SUFFICIENT"
                        : "INSUFFICIENT";

        /*
         * Store Finance budget snapshot
         * against this purchase request.
         */
        request.setBudgetAvailable(
                budgetAvailable
        );

        request.setAmountRequested(
                amountRequested
        );

        request.setRemainingBudget(
                remainingBudget
        );

        request.setBudgetStatus(
                budgetStatus
        );

        request.setCostCenter(
                departmentBudget.getCostCenter()
        );

        request.setStatus(
                OnboardingRequestStatus.PENDING_FINANCE_APPROVAL
        );

        return response(
                requests.save(request)
        );
    }


    /*
     * =========================================================
     * ALLOCATE EXISTING ASSET
     * =========================================================
     */

    @Transactional
    public OnboardingAssetRequestResponse allocateExistingAsset(
            UUID requestId,
            UUID assetId
    ) {

        current.requireRole(Role.ASSET_ADMIN);

        OnboardingAssetRequest request =
                findRequest(requestId);

        if (
                request.getStatus()
                        != OnboardingRequestStatus.PENDING_STOCK_CHECK

                        &&

                        request.getStatus()
                                != OnboardingRequestStatus.PENDING_ALLOCATION
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This request is not ready for asset allocation."
            );
        }

        if (
                request.getQuantity() != 1
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This allocation endpoint currently supports requests with quantity 1."
            );
        }

        Asset asset =
                assets
                        .findById(assetId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Selected asset was not found."
                                )
                        );

        if (
                !asset.getCategory()
                        .equalsIgnoreCase(
                                request.getDeviceCategory()
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Selected asset category does not match the requested asset category."
            );
        }

        if (
                asset.getStatus()
                        != AssetStatus.IN_STOCK
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Selected asset is no longer available in stock."
            );
        }

        AppUser employee =
                users
                        .findByEmailIgnoreCase(
                                request.getEmployeeEmail()
                        )
                        .filter(user ->
                                user.getRole()
                                        == Role.EMPLOYEE
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "No EMPLOYEE account was found for "
                                                + request.getEmployeeEmail()
                                                + ". Create or activate the employee account before allocation."
                                )
                        );

        assetAssignmentService.assign(
                assetId,
                new AssignAssetRequest(
                        employee.getId(),
                        "Onboarding asset allocation - "
                                + request.getRequestNumber()
                )
        );

        request.setAssignedAssetId(
                assetId
        );

        request.setAllocatedAt(
                Instant.now()
        );

        request.setStatus(
                OnboardingRequestStatus.COMPLETED
        );

        return response(
                requests.save(request)
        );
    }


    /*
     * =========================================================
     * FINANCE REQUEST LIST
     * =========================================================
     */

    @Transactional(readOnly = true)
    public List<OnboardingAssetRequestResponse>
    financeRequests() {

        current.requireRole(Role.FINANCE);

        return requests
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(request ->

                        request.getStatus()
                                == OnboardingRequestStatus.PENDING_FINANCE_APPROVAL

                                ||

                                request.getFinanceReviewedAt() != null
                )
                .map(this::response)
                .toList();
    }


    /*
     * =========================================================
     * FINANCE APPROVE
     * =========================================================
     */

    @Transactional
    public OnboardingAssetRequestResponse financeApprove(
            UUID requestId,
            String comment
    ) {

        AppUser finance =
                current.requireRole(Role.FINANCE);

        OnboardingAssetRequest request =
                findRequest(requestId);

        if (
                request.getStatus()
                        != OnboardingRequestStatus.PENDING_FINANCE_APPROVAL
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This purchase request is not waiting for Finance approval."
            );
        }

        String cleanedComment =
                cleanNullable(comment);

        request.setFinanceEmail(
                finance.getEmail()
        );

        request.setFinanceComment(
                cleanedComment == null
                        ? "Purchase request approved by Finance."
                        : cleanedComment
        );

        request.setFinanceReviewedAt(
                Instant.now()
        );

        request.setStatus(
                OnboardingRequestStatus.PENDING_PR_VP_APPROVAL
        );

        return response(
                requests.save(request)
        );
    }


    /*
     * =========================================================
     * FINANCE REJECT
     * =========================================================
     */

    @Transactional
    public OnboardingAssetRequestResponse financeReject(
            UUID requestId,
            String comment
    ) {

        AppUser finance =
                current.requireRole(Role.FINANCE);

        OnboardingAssetRequest request =
                findRequest(requestId);

        if (
                request.getStatus()
                        != OnboardingRequestStatus.PENDING_FINANCE_APPROVAL
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This purchase request is not waiting for Finance approval."
            );
        }

        String cleanedComment =
                cleanNullable(comment);

        if (cleanedComment == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Finance rejection reason is required."
            );
        }

        request.setFinanceEmail(
                finance.getEmail()
        );

        request.setFinanceComment(
                cleanedComment
        );

        request.setFinanceReviewedAt(
                Instant.now()
        );

        request.setStatus(
                OnboardingRequestStatus.FINANCE_REJECTED
        );

        return response(
                requests.save(request)
        );
    }


    /*
     * =========================================================
     * SECOND VP APPROVAL - PURCHASE
     * =========================================================
     */

    @Transactional
    public OnboardingAssetRequestResponse approvePurchaseByVp(
            UUID requestId,
            String comment
    ) {

        AppUser vp =
                current.requireRole(Role.VP);

        OnboardingAssetRequest request =
                findRequest(requestId);

        if (
                request.getStatus()
                        != OnboardingRequestStatus.PENDING_PR_VP_APPROVAL
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This purchase request is not waiting for VP approval."
            );
        }

        String cleanedComment =
                cleanNullable(comment);

        request.setPurchaseVpEmail(
                vp.getEmail()
        );

        request.setPurchaseVpComment(
                cleanedComment == null
                        ? "Purchase request approved by VP."
                        : cleanedComment
        );

        request.setPurchaseVpReviewedAt(
                Instant.now()
        );

        request.setStatus(
                OnboardingRequestStatus.PENDING_VENDOR_ORDER
        );

        return response(
                requests.save(request)
        );
    }


    /*
     * =========================================================
     * SECOND VP REJECTION - PURCHASE
     * =========================================================
     */

    @Transactional
    public OnboardingAssetRequestResponse rejectPurchaseByVp(
            UUID requestId,
            String comment
    ) {

        AppUser vp =
                current.requireRole(Role.VP);

        OnboardingAssetRequest request =
                findRequest(requestId);

        if (
                request.getStatus()
                        != OnboardingRequestStatus.PENDING_PR_VP_APPROVAL
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This purchase request is not waiting for VP approval."
            );
        }

        String cleanedComment =
                cleanNullable(comment);

        if (cleanedComment == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "VP rejection reason is required."
            );
        }

        request.setPurchaseVpEmail(
                vp.getEmail()
        );

        request.setPurchaseVpComment(
                cleanedComment
        );

        request.setPurchaseVpReviewedAt(
                Instant.now()
        );

        request.setStatus(
                OnboardingRequestStatus.PR_VP_REJECTED
        );

        return response(
                requests.save(request)
        );
    }


    /*
     * =========================================================
     * SEND TO VENDOR
     * =========================================================
     */

    @Transactional
    public OnboardingAssetRequestResponse sendToVendor(
            UUID requestId
    ) {

        current.requireRole(Role.ASSET_ADMIN);

        OnboardingAssetRequest request =
                findRequest(requestId);

        if (
                request.getStatus()
                        != OnboardingRequestStatus.PENDING_VENDOR_ORDER
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This request is not ready for vendor ordering."
            );
        }

        request.setStatus(
                OnboardingRequestStatus.ORDER_PLACED
        );

        return response(
                requests.save(request)
        );
    }


    /*
     * =========================================================
     * DELIVERY RECEIVED
     * =========================================================
     */

    @Transactional
    public OnboardingAssetRequestResponse markDelivered(
            UUID requestId
    ) {

        current.requireRole(Role.ASSET_ADMIN);

        OnboardingAssetRequest request =
                findRequest(requestId);

        if (
                request.getStatus()
                        != OnboardingRequestStatus.ORDER_PLACED
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The vendor order has not been placed."
            );
        }

        request.setStatus(
                OnboardingRequestStatus.PENDING_INSPECTION
        );

        return response(
                requests.save(request)
        );
    }


    /*
     * =========================================================
     * INSPECTION PASSED
     * =========================================================
     */

    @Transactional
    public OnboardingAssetRequestResponse inspectionPassed(
            UUID requestId
    ) {

        current.requireRole(Role.ASSET_ADMIN);

        OnboardingAssetRequest request =
                findRequest(requestId);

        if (
                request.getStatus()
                        != OnboardingRequestStatus.PENDING_INSPECTION
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This asset is not waiting for inspection."
            );
        }

        request.setStatus(
                OnboardingRequestStatus.PENDING_ALLOCATION
        );

        return response(
                requests.save(request)
        );
    }


    /*
     * =========================================================
     * INSPECTION FAILED
     * =========================================================
     */

    @Transactional
    public OnboardingAssetRequestResponse inspectionFailed(
            UUID requestId
    ) {

        current.requireRole(Role.ASSET_ADMIN);

        OnboardingAssetRequest request =
                findRequest(requestId);

        if (
                request.getStatus()
                        != OnboardingRequestStatus.PENDING_INSPECTION
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This asset is not waiting for inspection."
            );
        }

        request.setStatus(
                OnboardingRequestStatus.INSPECTION_FAILED
        );

        return response(
                requests.save(request)
        );
    }


    /*
     * =========================================================
     * HR DASHBOARD COUNT
     * =========================================================
     */

    @Transactional(readOnly = true)
    public long totalHrRequests() {

        AppUser hrAdmin =
                current.requireRole(Role.HR_ADMIN);

        return requests
                .findAllByCreatedByEmailIgnoreCaseOrderByCreatedAtDesc(
                        hrAdmin.getEmail()
                )
                .size();
    }


    /*
     * =========================================================
     * FIND REQUEST
     * =========================================================
     */

    private OnboardingAssetRequest findRequest(
            UUID requestId
    ) {

        return requests
                .findById(requestId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Onboarding asset request not found."
                        )
                );
    }


    /*
     * =========================================================
     * VALIDATE INITIAL VP STAGE
     * =========================================================
     */

    private void requirePendingVpApproval(
            OnboardingAssetRequest request
    ) {

        if (
                request.getStatus()
                        != OnboardingRequestStatus.PENDING_VP_APPROVAL
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This request is not waiting for VP approval."
            );
        }
    }


    /*
     * =========================================================
     * RESPONSE MAPPER
     * =========================================================
     */

    private OnboardingAssetRequestResponse response(
            OnboardingAssetRequest request
    ) {

        return new OnboardingAssetRequestResponse(

                request.getId(),

                request.getRequestNumber(),

                request.getEmployeeName(),

                request.getEmployeeEmail(),

                request.getEmployeeCode(),

                request.getDepartment(),

                request.getDesignation(),

                request.getJoiningDate(),

                request.getDeviceCategory(),

                request.getQuantity(),

                request.getSpecifications(),

                request.getEstimatedCost(),

                /*
                 * Finance budget information
                 */
                request.getBudgetAvailable(),

                request.getAmountRequested(),

                request.getRemainingBudget(),

                request.getBudgetStatus(),

                request.getCostCenter(),

                request.getBusinessJustification(),

                request.getStatus(),

                request.getCreatedByEmail(),

                request.getCreatedByName(),

                request.getAssetAdminEmail(),

                request.getAssetAdminComment(),

                request.getAssetAdminReviewedAt(),

                request.getFinanceEmail(),

                request.getFinanceComment(),

                request.getFinanceReviewedAt(),

                request.getVpEmail(),

                request.getVpComment(),

                request.getVpReviewedAt(),

                request.getPurchaseVpEmail(),

                request.getPurchaseVpComment(),

                request.getPurchaseVpReviewedAt(),

                request.getAssignedAssetId(),

                request.getAllocatedAt(),

                request.getCreatedAt(),

                request.getUpdatedAt()
        );
    }


    /*
     * =========================================================
     * STRING HELPERS
     * =========================================================
     */

    private String clean(
            String value
    ) {

        if (value == null) {
            return "";
        }

        return value.trim();
    }


    private String cleanNullable(
            String value
    ) {

        if (value == null) {
            return null;
        }

        String cleaned =
                value.trim();

        return cleaned.isBlank()
                ? null
                : cleaned;
    }
}