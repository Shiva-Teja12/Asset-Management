package com.enfec.one.assets.repository;

import com.enfec.one.assets.entity.Asset;
import com.enfec.one.assets.enums.AssetStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AssetRepository extends JpaRepository<Asset, UUID> {

    /*
     * =========================================================
     * EXISTING METHODS
     * =========================================================
     */

    List<Asset> findAllByOrderByCreatedAtDesc();

    boolean existsByAssetTagIgnoreCase(String tag);

    boolean existsByAssetTagIgnoreCaseAndIdNot(
            String tag,
            UUID id
    );


    /*
     * =========================================================
     * SECONDARY DEVICE / STOCK QUERIES
     * =========================================================
     */

    /*
     * Returns assets by lifecycle status.
     *
     * Example:
     * IN_STOCK -> all currently available assets.
     */
    List<Asset> findAllByStatusOrderByCreatedAtDesc(
            AssetStatus status
    );


    /*
     * Finds available assets for a requested category.
     *
     * Example:
     *
     * category = "Laptop"
     * status   = IN_STOCK
     *
     * Used by Asset Admin while processing an approved
     * secondary-device request.
     */
    List<Asset>
    findAllByCategoryIgnoreCaseAndStatusOrderByCreatedAtAsc(
            String category,
            AssetStatus status
    );


    /*
     * Used to show available-stock count for the requested
     * category.
     */
    long countByCategoryIgnoreCaseAndStatus(
            String category,
            AssetStatus status
    );


    /*
     * Useful for dashboard counts.
     */
    long countByStatus(
            AssetStatus status
    );
}