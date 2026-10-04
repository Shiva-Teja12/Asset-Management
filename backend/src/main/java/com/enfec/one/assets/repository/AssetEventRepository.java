package com.enfec.one.assets.repository;

import com.enfec.one.assets.entity.AssetEvent;
import com.enfec.one.assets.enums.AssetStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssetEventRepository
        extends JpaRepository<AssetEvent, UUID> {

    /*
     * =========================================================
     * EXISTING METHODS
     * =========================================================
     */

    List<AssetEvent>
    findAllByAssetIdOrderByOccurredAtDesc(UUID assetId);

    void deleteAllByAssetId(UUID assetId);


    /*
     * =========================================================
     * REPAIR INFORMATION
     * =========================================================
     */

    /*
     * Returns the latest event for an asset where the asset
     * entered a particular status.
     *
     * For repair information we will call:
     *
     * findFirstByAssetIdAndNewStatusOrderByOccurredAtDesc(
     *      assetId,
     *      AssetStatus.IN_REPAIR
     * )
     *
     * The returned event gives us:
     *
     * - repair reason
     * - who moved the asset into repair
     * - when it was moved into repair
     */
    Optional<AssetEvent>
    findFirstByAssetIdAndNewStatusOrderByOccurredAtDesc(
            UUID assetId,
            AssetStatus newStatus
    );


    /*
     * Returns lifecycle events for multiple assets.
     *
     * This is useful for the Manager -> Team Assets page.
     */
    List<AssetEvent>
    findAllByAssetIdInOrderByOccurredAtDesc(
            Collection<UUID> assetIds
    );


    /*
     * Returns events of one particular status for multiple
     * assets.
     *
     * Example:
     *
     * All IN_REPAIR events for assets belonging to
     * employees under the logged-in Manager.
     */
    List<AssetEvent>
    findAllByAssetIdInAndNewStatusOrderByOccurredAtDesc(
            Collection<UUID> assetIds,
            AssetStatus newStatus
    );
}