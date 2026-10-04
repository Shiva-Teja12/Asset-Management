package com.enfec.one.assets.repository;

import com.enfec.one.assets.entity.AppUser;
import com.enfec.one.assets.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {

    Optional<AppUser> findByEmailIgnoreCase(String email);

    Optional<AppUser> findByAuthToken(String token);

    boolean existsByEmailIgnoreCase(String email);

    List<AppUser> findAllByRoleOrderByNameAsc(Role role);

    /*
     * Returns all users assigned to a particular manager.
     *
     * Example:
     *
     * Ravi -> Manager
     *
     * Shiva.manager = Ravi
     * Kiran.manager = Ravi
     * Teja.manager = Ravi
     *
     * Passing Ravi's UUID returns Shiva, Kiran and Teja.
     */
    List<AppUser> findAllByManager_IdOrderByNameAsc(UUID managerId);

    /*
     * Same manager lookup, but also restricts the result by role.
     *
     * We will use this for the Manager "My Team" page so that
     * only EMPLOYEE users are returned.
     */
    List<AppUser> findAllByManager_IdAndRoleOrderByNameAsc(
            UUID managerId,
            Role role
    );
}