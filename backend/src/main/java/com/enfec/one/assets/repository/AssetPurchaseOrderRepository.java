package com.enfec.one.assets.repository;

import com.enfec.one.assets.entity.AssetPurchaseOrder;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssetPurchaseOrderRepository
        extends JpaRepository<
        AssetPurchaseOrder,
        UUID
        > {

    /*
     * All purchase orders,
     * newest order first.
     */
    List<AssetPurchaseOrder>
    findAllByOrderByOrderedAtDesc();

    /*
     * Find the newest purchase order
     * belonging to a specific onboarding
     * asset request.
     */
    Optional<AssetPurchaseOrder>
    findFirstByOnboardingRequestIdOrderByOrderedAtDesc(
            UUID onboardingRequestId
    );
}