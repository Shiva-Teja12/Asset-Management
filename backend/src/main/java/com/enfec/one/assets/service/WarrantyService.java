package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.asset.AssetResponse;
import com.enfec.one.assets.dto.asset.RenewWarrantyRequest;
import com.enfec.one.assets.dto.asset.WarrantyHistoryResponse;
import com.enfec.one.assets.entity.Asset;
import com.enfec.one.assets.entity.WarrantyHistory;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.exception.ResourceNotFoundException;
import com.enfec.one.assets.repository.AssetRepository;
import com.enfec.one.assets.repository.WarrantyHistoryRepository;
import com.enfec.one.assets.security.CurrentUser;
import com.enfec.one.assets.util.StringUtils;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class WarrantyService {

    private final AssetRepository assets;
    private final WarrantyHistoryRepository history;
    private final CurrentUser current;
    private final AuditService audit;
    private final AssetService assetService;

    public WarrantyService(
            AssetRepository assets,
            WarrantyHistoryRepository history,
            CurrentUser current,
            AuditService audit,
            AssetService assetService
    ) {
        this.assets = assets;
        this.history = history;
        this.current = current;
        this.audit = audit;
        this.assetService = assetService;
    }

    @Transactional
    public AssetResponse renew(
            UUID assetId,
            RenewWarrantyRequest request
    ) {

        var admin =
                current.requireRole(
                        Role.ASSET_ADMIN
                );

        Asset asset = find(assetId);

        LocalDate previousExpiry =
                asset.getWarrantyExpiryDate();

        LocalDate newStart =
                request.newStartDate();

        LocalDate newExpiry =
                newStart.plusMonths(
                        request.periodMonths()
                );

        history.save(
                new WarrantyHistory(
                        asset.getId(),
                        previousExpiry,
                        newStart,
                        newExpiry,
                        request.periodMonths(),
                        StringUtils.blankToNull(
                                request.provider()
                        ),
                        StringUtils.blankToNull(
                                request.warrantyReference()
                        ),
                        request.renewalCost(),
                        StringUtils.blankToNull(
                                request.notes()
                        ),
                        admin.getEmail()
                )
        );

        asset.renewWarranty(
                newStart,
                request.periodMonths(),
                StringUtils.blankToNull(
                        request.provider()
                ),
                StringUtils.blankToNull(
                        request.warrantyReference()
                )
        );

        audit.log(
                admin,
                "RENEW_WARRANTY",
                "WARRANTY",
                "ASSET",
                asset.getId().toString(),
                asset.getAssetTag(),
                asset,

                previousExpiry == null
                        ? null
                        : previousExpiry.toString(),

                newExpiry.toString(),

                "Warranty renewed for "
                        + request.periodMonths()
                        + " months. Cost: "
                        + (
                        request.renewalCost() == null
                                ? "-"
                                : request.renewalCost().toString()
                )
        );

        /*
         * Use the existing public AssetService method.
         * We do NOT call AssetService.toResponse().
         */
        return assetService.one(assetId);
    }

    @Transactional(readOnly = true)
    public List<WarrantyHistoryResponse> history(
            UUID assetId
    ) {

        current.requireRole(
                Role.ASSET_ADMIN
        );

        find(assetId);

        return history
                .findAllByAssetIdOrderByRenewedAtDesc(
                        assetId
                )
                .stream()
                .map(item ->
                        new WarrantyHistoryResponse(
                                item.getId(),
                                item.getAssetId(),
                                item.getPreviousExpiryDate(),
                                item.getNewStartDate(),
                                item.getNewExpiryDate(),
                                item.getPeriodMonths(),
                                item.getProvider(),
                                item.getWarrantyReference(),
                                item.getRenewalCost(),
                                item.getNotes(),
                                item.getRenewedBy(),
                                item.getRenewedAt()
                        )
                )
                .toList();
    }

    private Asset find(UUID id) {

        return assets
                .findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "ASSET_NOT_FOUND",
                                "Asset was not found."
                        )
                );
    }
}