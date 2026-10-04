package com.enfec.one.assets.controller;

import com.enfec.one.assets.dto.purchase.AssetPurchaseOrderResponse;
import com.enfec.one.assets.dto.purchase.CreateAssetPurchaseOrderRequest;
import com.enfec.one.assets.service.AssetPurchaseOrderService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(
        "/api/v1/purchase-orders"
)
public class AssetPurchaseOrderController {

    private final AssetPurchaseOrderService service;

    public AssetPurchaseOrderController(
            AssetPurchaseOrderService service
    ) {

        this.service = service;
    }

    /*
     * PLACE ORDER
     *
     * POST
     * /api/v1/purchase-orders
     */

    @PostMapping
    public ResponseEntity<AssetPurchaseOrderResponse> create(
            @Valid
            @RequestBody
            CreateAssetPurchaseOrderRequest request
    ) {

        return ResponseEntity
                .status(
                        HttpStatus.CREATED
                )
                .body(
                        service.create(
                                request
                        )
                );
    }

    /*
     * GET ORDER HISTORY
     *
     * GET
     * /api/v1/purchase-orders
     */

    @GetMapping
    public List<AssetPurchaseOrderResponse> all() {

        return service.all();
    }

    /*
     * GET PURCHASE ORDER FOR ONBOARDING REQUEST
     *
     * GET
     * /api/v1/purchase-orders/onboarding/{onboardingRequestId}
     *
     * Used by the received-asset registration flow
     * to retrieve the procurement information for
     * the selected onboarding request.
     */

    @GetMapping(
            "/onboarding/{onboardingRequestId}"
    )
    public AssetPurchaseOrderResponse findByOnboardingRequestId(
            @PathVariable
            UUID onboardingRequestId
    ) {

        return service.findByOnboardingRequestId(
                onboardingRequestId
        );
    }
    /*
     * REGISTER ONE RECEIVED PURCHASE ORDER ITEM
     *
     * POST
     * /api/v1/purchase-orders/{purchaseOrderId}/receive-one
     */
    @PostMapping(
            "/{purchaseOrderId}/receive-one"
    )
    public AssetPurchaseOrderResponse receiveOne(
            @PathVariable
            UUID purchaseOrderId
    ) {

        return service.receiveOne(
                purchaseOrderId
        );
    }
}