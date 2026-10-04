package com.enfec.one.assets.repository;

import com.enfec.one.assets.entity.WarrantyHistory;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WarrantyHistoryRepository
        extends JpaRepository<
        WarrantyHistory,
        UUID
        > {

    List<WarrantyHistory>
    findAllByAssetIdOrderByRenewedAtDesc(
            UUID assetId
    );

    void deleteAllByAssetId(
            UUID assetId
    );
}