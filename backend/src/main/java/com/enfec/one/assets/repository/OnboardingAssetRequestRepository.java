package com.enfec.one.assets.repository;

import com.enfec.one.assets.entity.OnboardingAssetRequest;
import com.enfec.one.assets.enums.OnboardingRequestStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OnboardingAssetRequestRepository
        extends JpaRepository<OnboardingAssetRequest, UUID> {

    /*
     * HR ADMIN
     *
     * Requests created by the currently logged-in HR Admin.
     */
    List<OnboardingAssetRequest>
    findAllByCreatedByEmailIgnoreCaseOrderByCreatedAtDesc(
            String email
    );

    /*
     * ASSET ADMIN
     *
     * All new joiner onboarding requests.
     */
    List<OnboardingAssetRequest>
    findAllByOrderByCreatedAtDesc();

    /*
     * Workflow helper.
     */
    List<OnboardingAssetRequest>
    findAllByStatusOrderByCreatedAtDesc(
            OnboardingRequestStatus status
    );
}