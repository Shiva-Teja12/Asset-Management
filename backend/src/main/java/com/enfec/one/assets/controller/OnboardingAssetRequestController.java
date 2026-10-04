package com.enfec.one.assets.controller;

import com.enfec.one.assets.dto.onboarding.AllocateOnboardingAssetRequest;
import com.enfec.one.assets.dto.onboarding.CreateOnboardingAssetRequest;
import com.enfec.one.assets.dto.onboarding.OnboardingAssetRequestResponse;
import com.enfec.one.assets.dto.onboarding.OnboardingStockResponse;
import com.enfec.one.assets.dto.onboarding.RaisePurchaseRequest;
import com.enfec.one.assets.dto.onboarding.VpDecisionRequest;

import com.enfec.one.assets.service.OnboardingAssetRequestService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/onboarding/requests")
public class OnboardingAssetRequestController {

    private final OnboardingAssetRequestService service;


    public OnboardingAssetRequestController(
            OnboardingAssetRequestService service
    ) {

        this.service = service;
    }


    /*
     * =========================================================
     * HR ADMIN
     * =========================================================
     */

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OnboardingAssetRequestResponse create(
            @Valid
            @RequestBody
            CreateOnboardingAssetRequest request
    ) {

        return service.create(request);
    }


    @GetMapping("/hr")
    public List<OnboardingAssetRequestResponse>
    hrRequests() {

        return service.hrRequests();
    }


    /*
     * =========================================================
     * ASSET ADMIN REQUEST LIST
     * =========================================================
     */

    @GetMapping("/asset-admin")
    public List<OnboardingAssetRequestResponse>
    assetAdminRequests() {

        return service.assetAdminRequests();
    }


    /*
     * =========================================================
     * ASSET ADMIN -> VP
     * =========================================================
     */

    @PostMapping(
            "/{requestId}/asset-admin/forward-to-vp"
    )
    public OnboardingAssetRequestResponse forwardToVp(
            @PathVariable UUID requestId
    ) {

        return service.forwardToVp(
                requestId
        );
    }


    /*
     * =========================================================
     * REAL INVENTORY STOCK CHECK
     * =========================================================
     */

    @GetMapping(
            "/{requestId}/asset-admin/stock-check"
    )
    public OnboardingStockResponse stockCheck(
            @PathVariable UUID requestId
    ) {

        return service.stockCheck(
                requestId
        );
    }


    /*
     * =========================================================
     * ALLOCATE EXISTING ASSET
     * =========================================================
     */

    @PostMapping(
            "/{requestId}/asset-admin/allocate"
    )
    public OnboardingAssetRequestResponse allocate(
            @PathVariable UUID requestId,

            @Valid
            @RequestBody
            AllocateOnboardingAssetRequest request
    ) {

        return service.allocateExistingAsset(
                requestId,
                request.assetId()
        );
    }


    /*
     * =========================================================
     * RAISE PURCHASE REQUEST
     * =========================================================
     */

    @PostMapping(
            "/{requestId}/asset-admin/raise-pr"
    )
    public OnboardingAssetRequestResponse raisePr(
            @PathVariable UUID requestId,

            @RequestBody
            RaisePurchaseRequest request
    ) {

        return service.raisePurchaseRequest(
                requestId,
                request.getEstimatedCost()
        );
    }


    /*
     * =========================================================
     * SEND PR TO FINANCE
     * =========================================================
     */

    @PostMapping(
            "/{requestId}/asset-admin/send-pr-to-finance"
    )
    public OnboardingAssetRequestResponse sendPrToFinance(
            @PathVariable UUID requestId
    ) {

        return service.sendPrToFinance(
                requestId
        );
    }


    /*
     * =========================================================
     * VP REQUESTS
     * =========================================================
     */

    @GetMapping("/vp")
    public List<OnboardingAssetRequestResponse>
    vpRequests() {

        return service.vpRequests();
    }


    /*
     * =========================================================
     * INITIAL VP APPROVAL
     * =========================================================
     */

    @PostMapping(
            "/{requestId}/vp/approve"
    )
    public OnboardingAssetRequestResponse approveByVp(
            @PathVariable UUID requestId,

            @RequestBody(required = false)
            VpDecisionRequest decision
    ) {

        String comment =
                decision == null
                        ? null
                        : decision.getComment();


        return service.approveByVp(
                requestId,
                comment
        );
    }


    /*
     * =========================================================
     * INITIAL VP REJECTION
     * =========================================================
     */

    @PostMapping(
            "/{requestId}/vp/reject"
    )
    public OnboardingAssetRequestResponse rejectByVp(
            @PathVariable UUID requestId,

            @RequestBody(required = false)
            VpDecisionRequest decision
    ) {

        String comment =
                decision == null
                        ? null
                        : decision.getComment();


        return service.rejectByVp(
                requestId,
                comment
        );
    }


    /*
     * =========================================================
     * FINANCE REQUESTS
     * =========================================================
     */

    @GetMapping("/finance")
    public List<OnboardingAssetRequestResponse>
    financeRequests() {

        return service.financeRequests();
    }


    /*
     * =========================================================
     * FINANCE APPROVE
     * =========================================================
     */

    @PostMapping(
            "/{requestId}/finance/approve"
    )
    public OnboardingAssetRequestResponse financeApprove(
            @PathVariable UUID requestId,

            @RequestBody(required = false)
            VpDecisionRequest decision
    ) {

        String comment =
                decision == null
                        ? null
                        : decision.getComment();


        return service.financeApprove(
                requestId,
                comment
        );
    }


    /*
     * =========================================================
     * FINANCE REJECT
     * =========================================================
     */

    @PostMapping(
            "/{requestId}/finance/reject"
    )
    public OnboardingAssetRequestResponse financeReject(
            @PathVariable UUID requestId,

            @RequestBody(required = false)
            VpDecisionRequest decision
    ) {

        String comment =
                decision == null
                        ? null
                        : decision.getComment();


        return service.financeReject(
                requestId,
                comment
        );
    }


    /*
     * =========================================================
     * SECOND VP APPROVAL - PURCHASE
     * =========================================================
     */

    @PostMapping(
            "/{requestId}/vp/pr/approve"
    )
    public OnboardingAssetRequestResponse approvePurchaseByVp(
            @PathVariable UUID requestId,

            @RequestBody(required = false)
            VpDecisionRequest decision
    ) {

        String comment =
                decision == null
                        ? null
                        : decision.getComment();


        return service.approvePurchaseByVp(
                requestId,
                comment
        );
    }


    /*
     * =========================================================
     * SECOND VP REJECTION - PURCHASE
     * =========================================================
     */

    @PostMapping(
            "/{requestId}/vp/pr/reject"
    )
    public OnboardingAssetRequestResponse rejectPurchaseByVp(
            @PathVariable UUID requestId,

            @RequestBody(required = false)
            VpDecisionRequest decision
    ) {

        String comment =
                decision == null
                        ? null
                        : decision.getComment();


        return service.rejectPurchaseByVp(
                requestId,
                comment
        );
    }


    /*
     * =========================================================
     * SEND TO VENDOR
     * =========================================================
     */

    @PostMapping(
            "/{requestId}/asset-admin/send-to-vendor"
    )
    public OnboardingAssetRequestResponse sendToVendor(
            @PathVariable UUID requestId
    ) {

        return service.sendToVendor(
                requestId
        );
    }


    /*
     * =========================================================
     * DELIVERY RECEIVED
     * =========================================================
     */

    @PostMapping(
            "/{requestId}/asset-admin/delivered"
    )
    public OnboardingAssetRequestResponse delivered(
            @PathVariable UUID requestId
    ) {

        return service.markDelivered(
                requestId
        );
    }


    /*
     * =========================================================
     * INSPECTION PASSED
     * =========================================================
     */

    @PostMapping(
            "/{requestId}/asset-admin/inspection/pass"
    )
    public OnboardingAssetRequestResponse inspectionPassed(
            @PathVariable UUID requestId
    ) {

        return service.inspectionPassed(
                requestId
        );
    }


    /*
     * =========================================================
     * INSPECTION FAILED
     * =========================================================
     */

    @PostMapping(
            "/{requestId}/asset-admin/inspection/fail"
    )
    public OnboardingAssetRequestResponse inspectionFailed(
            @PathVariable UUID requestId
    ) {

        return service.inspectionFailed(
                requestId
        );
    }
}