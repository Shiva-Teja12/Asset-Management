package com.enfec.one.assets.controller;

import com.enfec.one.assets.dto.asset.AssetResponse;
import com.enfec.one.assets.dto.secondarydevice.AssignSecondaryDeviceRequest;
import com.enfec.one.assets.dto.secondarydevice.SecondaryDeviceRequestResponse;
import com.enfec.one.assets.service.AssetAdminSecondaryDeviceService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(
        "/api/v1/admin/secondary-device-requests"
)
public class AssetAdminSecondaryDeviceController {

    private final AssetAdminSecondaryDeviceService service;

    public AssetAdminSecondaryDeviceController(
            AssetAdminSecondaryDeviceService service
    ) {
        this.service = service;
    }


    /*
     * =========================================================
     * ALL MANAGER-APPROVED REQUESTS
     * =========================================================
     *
     * GET
     * /api/v1/admin/secondary-device-requests
     */
    @GetMapping
    public ResponseEntity<
            List<SecondaryDeviceRequestResponse>
            >
    all() {

        return ResponseEntity.ok(
                service.all()
        );
    }


    /*
     * =========================================================
     * REQUEST DETAILS
     * =========================================================
     *
     * GET
     * /api/v1/admin/secondary-device-requests/{requestId}
     */
    @GetMapping("/{requestId}")
    public ResponseEntity<
            SecondaryDeviceRequestResponse
            >
    one(
            @PathVariable UUID requestId
    ) {

        return ResponseEntity.ok(
                service.one(requestId)
        );
    }


    /*
     * =========================================================
     * PROCESS REQUEST / CHECK STOCK
     * =========================================================
     *
     * POST
     * /api/v1/admin/secondary-device-requests/{requestId}/process
     *
     * If stock exists:
     *
     * PENDING_ASSIGNMENT
     *
     * If stock does not exist:
     *
     * PENDING_PROCUREMENT
     */
    @PostMapping("/{requestId}/process")
    public ResponseEntity<
            SecondaryDeviceRequestResponse
            >
    process(
            @PathVariable UUID requestId
    ) {

        return ResponseEntity.ok(
                service.process(requestId)
        );
    }


    /*
     * =========================================================
     * AVAILABLE ASSETS
     * =========================================================
     *
     * GET
     * /api/v1/admin/secondary-device-requests/{requestId}/available-assets
     */
    @GetMapping(
            "/{requestId}/available-assets"
    )
    public ResponseEntity<
            List<AssetResponse>
            >
    availableAssets(
            @PathVariable UUID requestId
    ) {

        return ResponseEntity.ok(
                service.availableAssets(
                        requestId
                )
        );
    }


    /*
     * =========================================================
     * ASSIGN SECONDARY ASSET
     * =========================================================
     *
     * POST
     * /api/v1/admin/secondary-device-requests/{requestId}/assign
     *
     * Body:
     *
     * {
     *     "assetId": "asset-uuid"
     * }
     */
    @PostMapping(
            "/{requestId}/assign"
    )
    public ResponseEntity<
            SecondaryDeviceRequestResponse
            >
    assign(
            @PathVariable UUID requestId,

            @Valid
            @RequestBody
            AssignSecondaryDeviceRequest request
    ) {

        return ResponseEntity.ok(
                service.assign(
                        requestId,
                        request.getAssetId()
                )
        );
    }
}