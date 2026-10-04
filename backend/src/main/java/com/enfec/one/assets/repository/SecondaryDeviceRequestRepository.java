package com.enfec.one.assets.repository;

import com.enfec.one.assets.entity.SecondaryDeviceRequest;
import com.enfec.one.assets.enums.SecondaryDeviceRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SecondaryDeviceRequestRepository
        extends JpaRepository<SecondaryDeviceRequest, UUID> {

    /*
     * =========================================================
     * EMPLOYEE
     * =========================================================
     */

    /*
     * Returns all secondary-device requests created by
     * one employee, newest request first.
     *
     * Used by:
     * Employee -> My Secondary Device Requests
     */
    List<SecondaryDeviceRequest>
    findAllByEmployee_IdOrderByRequestedAtDesc(
            UUID employeeId
    );

    /*
     * Used to prevent an employee from creating multiple
     * active requests for the same device category.
     */
    boolean existsByEmployee_IdAndCategoryIgnoreCaseAndStatusIn(
            UUID employeeId,
            String category,
            Collection<SecondaryDeviceRequestStatus> statuses
    );


    /*
     * =========================================================
     * MANAGER
     * =========================================================
     */

    /*
     * Returns every request belonging to employees assigned
     * to the logged-in manager.
     *
     * Used by:
     * Manager -> Asset Requests
     */
    List<SecondaryDeviceRequest>
    findAllByManager_IdOrderByRequestedAtDesc(
            UUID managerId
    );

    /*
     * Returns Manager requests filtered by status.
     *
     * Examples:
     *
     * PENDING_MANAGER_APPROVAL
     * MANAGER_APPROVED
     * MANAGER_REJECTED
     */
    List<SecondaryDeviceRequest>
    findAllByManager_IdAndStatusOrderByRequestedAtDesc(
            UUID managerId,
            SecondaryDeviceRequestStatus status
    );

    /*
     * Security-sensitive lookup.
     *
     * A Manager should never be able to approve/reject
     * another Manager's employee request.
     *
     * Instead of loading only by request ID, this verifies
     * that the request also belongs to the logged-in Manager.
     */
    Optional<SecondaryDeviceRequest>
    findByIdAndManager_Id(
            UUID requestId,
            UUID managerId
    );


    /*
     * =========================================================
     * ASSET ADMIN
     * =========================================================
     */

    /*
     * Returns requests by status for Asset Admin processing.
     *
     * Examples:
     *
     * MANAGER_APPROVED
     * PENDING_ASSIGNMENT
     * PENDING_PROCUREMENT
     */
    List<SecondaryDeviceRequest>
    findAllByStatusOrderByRequestedAtAsc(
            SecondaryDeviceRequestStatus status
    );

    /*
     * Allows Asset Admin to load several actionable
     * statuses together.
     */
    List<SecondaryDeviceRequest>
    findAllByStatusInOrderByRequestedAtAsc(
            Collection<SecondaryDeviceRequestStatus> statuses
    );


    /*
     * =========================================================
     * DASHBOARD COUNTS
     * =========================================================
     */

    /*
     * Number of pending requests for a Manager.
     */
    long countByManager_IdAndStatus(
            UUID managerId,
            SecondaryDeviceRequestStatus status
    );

    /*
     * Manager dashboard counts for several statuses.
     */
    long countByManager_IdAndStatusIn(
            UUID managerId,
            Collection<SecondaryDeviceRequestStatus> statuses
    );

    /*
     * Employee request count.
     */
    long countByEmployee_IdAndStatus(
            UUID employeeId,
            SecondaryDeviceRequestStatus status
    );

    /*
     * Asset Admin count.
     */
    long countByStatus(
            SecondaryDeviceRequestStatus status
    );
}