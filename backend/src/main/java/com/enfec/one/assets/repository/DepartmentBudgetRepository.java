package com.enfec.one.assets.repository;

import com.enfec.one.assets.entity.DepartmentBudget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DepartmentBudgetRepository
        extends JpaRepository<DepartmentBudget, UUID> {

    Optional<DepartmentBudget> findByDepartmentIgnoreCase(
            String department
    );
}