package com.enfec.one.assets.repository;

import com.enfec.one.assets.entity.AssetAssignment;
import com.enfec.one.assets.enums.AssetAssignmentType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssetAssignmentRepository
        extends JpaRepository<AssetAssignment, UUID> {

    /*
     * =========================================================
     * EXISTING METHODS
     * =========================================================
     */

    Optional<AssetAssignment>
    findFirstByAssetIdAndReturnedAtIsNull(UUID assetId);

    List<AssetAssignment>
    findAllByAssetIdOrderByAssignedAtDesc(UUID assetId);

    List<AssetAssignment>
    findAllByEmployeeIdAndReturnedAtIsNullOrderByAssignedAtDesc(
            UUID employeeId
    );

    void deleteAllByAssetId(UUID assetId);


    /*
     * =========================================================
     * EMPLOYEE ASSET TYPE
     * =========================================================
     */

    /*
     * Returns active assignments of a particular type.
     *
     * Example:
     * SECONDARY -> all active secondary devices.
     */
    List<AssetAssignment>
    findAllByEmployeeIdAndAssignmentTypeAndReturnedAtIsNullOrderByAssignedAtDesc(
            UUID employeeId,
            AssetAssignmentType assignmentType
    );


    /*
     * =========================================================
     * MANAGER - MY TEAM
     * =========================================================
     */

    /*
     * Returns active assets for all employees belonging
     * to a Manager.
     *
     * employeeIds will contain the IDs returned from:
     *
     * AppUserRepository
     * .findAllByManager_IdAndRoleOrderByNameAsc(...)
     */
    List<AssetAssignment>
    findAllByEmployeeIdInAndReturnedAtIsNullOrderByAssignedAtDesc(
            Collection<UUID> employeeIds
    );


    /*
     * Returns all assignment history for an employee.
     *
     * Manager -> Employee Details -> History
     */
    List<AssetAssignment>
    findAllByEmployeeIdOrderByAssignedAtDesc(
            UUID employeeId
    );


    /*
     * =========================================================
     * COUNTS
     * =========================================================
     */

    long countByEmployeeIdAndReturnedAtIsNull(
            UUID employeeId
    );

    long countByEmployeeIdAndAssignmentTypeAndReturnedAtIsNull(
            UUID employeeId,
            AssetAssignmentType assignmentType
    );
}