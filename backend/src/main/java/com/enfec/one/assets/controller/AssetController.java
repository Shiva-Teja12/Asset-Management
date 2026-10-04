package com.enfec.one.assets.controller;

import com.enfec.one.assets.dto.asset.*;
import com.enfec.one.assets.service.AssetAssignmentService;
import com.enfec.one.assets.service.AssetLifecycleService;
import com.enfec.one.assets.service.AssetService;
import com.enfec.one.assets.service.WarrantyService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/assets")
public class AssetController {

    private final AssetService assets;
    private final AssetLifecycleService lifecycle;
    private final AssetAssignmentService assignments;
    private final WarrantyService warranties;

    public AssetController(
            AssetService assets,
            AssetLifecycleService lifecycle,
            AssetAssignmentService assignments,
            WarrantyService warranties
    ) {
        this.assets = assets;
        this.lifecycle = lifecycle;
        this.assignments = assignments;
        this.warranties = warranties;
    }

    /*
     * CREATE ASSET
     */
    @PostMapping
    public ResponseEntity<AssetResponse> create(
            @Valid
            @RequestBody
            CreateAssetRequest request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        assets.create(request)
                );
    }

    /*
     * GET ALL ASSETS
     */
    @GetMapping
    public List<AssetResponse> all() {

        return assets.all();
    }

    /*
     * GET ONE ASSET
     */
    @GetMapping("/{id}")
    public AssetResponse one(
            @PathVariable
            UUID id
    ) {

        return assets.one(id);
    }

    /*
     * UPDATE ASSET
     */
    @PutMapping("/{id}")
    public AssetResponse update(
            @PathVariable
            UUID id,

            @Valid
            @RequestBody
            UpdateAssetRequest request
    ) {

        return assets.update(
                id,
                request
        );
    }

    /*
     * DELETE ASSET
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable
            UUID id
    ) {

        assets.delete(id);

        return ResponseEntity
                .noContent()
                .build();
    }

    /*
     * CHANGE ASSET LIFECYCLE STATUS
     */
    @PatchMapping("/{id}/status")
    public AssetResponse status(
            @PathVariable
            UUID id,

            @Valid
            @RequestBody
            UpdateAssetStatusRequest request
    ) {

        return lifecycle.changeStatus(
                id,
                request
        );
    }

    /*
     * ASSIGN ASSET
     */
    @PostMapping("/{id}/assign")
    public AssetResponse assign(
            @PathVariable
            UUID id,

            @Valid
            @RequestBody
            AssignAssetRequest request
    ) {

        return assignments.assign(
                id,
                request
        );
    }

    /*
     * RETURN ASSET
     */
    @PostMapping("/{id}/return")
    public AssetResponse returnAsset(
            @PathVariable
            UUID id,

            @Valid
            @RequestBody
            ReturnAssetRequest request
    ) {

        return assignments.returnAsset(
                id,
                request
        );
    }

    /*
     * LIFECYCLE HISTORY
     */
    @GetMapping("/{id}/events")
    public List<AssetEventResponse> events(
            @PathVariable
            UUID id
    ) {

        return lifecycle.history(id);
    }

    /*
     * ASSIGNMENT HISTORY
     */
    @GetMapping("/{id}/assignments")
    public List<AssetAssignmentResponse> assignmentHistory(
            @PathVariable
            UUID id
    ) {

        return assignments.history(id);
    }

    /*
     * WARRANTY RENEWAL
     *
     * Returns the updated asset after
     * the warranty has been renewed.
     */
    @PostMapping("/{id}/warranty/renew")
    public AssetResponse renewWarranty(
            @PathVariable
            UUID id,

            @Valid
            @RequestBody
            RenewWarrantyRequest request
    ) {

        return warranties.renew(
                id,
                request
        );
    }

    /*
     * WARRANTY HISTORY
     */
    @GetMapping("/{id}/warranty/history")
    public List<WarrantyHistoryResponse> warrantyHistory(
            @PathVariable
            UUID id
    ) {

        return warranties.history(id);
    }
}