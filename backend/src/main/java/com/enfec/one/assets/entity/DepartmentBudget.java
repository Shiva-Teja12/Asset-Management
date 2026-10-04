package com.enfec.one.assets.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "department_budgets")
public class DepartmentBudget {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(
            name = "department",
            nullable = false,
            unique = true,
            length = 100
    )
    private String department;

    @Column(
            name = "budget_available",
            nullable = false,
            precision = 14,
            scale = 2
    )
    private BigDecimal budgetAvailable;

    @Column(
            name = "cost_center",
            nullable = false,
            length = 150
    )
    private String costCenter;

    @Column(
            name = "created_at",
            nullable = false,
            insertable = false,
            updatable = false
    )
    private Instant createdAt;

    @Column(
            name = "updated_at",
            nullable = false,
            insertable = false,
            updatable = false
    )
    private Instant updatedAt;


    public DepartmentBudget() {
    }


    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }


    public String getDepartment() {
        return department;
    }

    public void setDepartment(
            String department
    ) {
        this.department = department;
    }


    public BigDecimal getBudgetAvailable() {
        return budgetAvailable;
    }

    public void setBudgetAvailable(
            BigDecimal budgetAvailable
    ) {
        this.budgetAvailable = budgetAvailable;
    }


    public String getCostCenter() {
        return costCenter;
    }

    public void setCostCenter(
            String costCenter
    ) {
        this.costCenter = costCenter;
    }


    public Instant getCreatedAt() {
        return createdAt;
    }


    public Instant getUpdatedAt() {
        return updatedAt;
    }
}