package com.enfec.one.assets.entity;

import com.enfec.one.assets.enums.Role;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "app_users",
        uniqueConstraints = @UniqueConstraint(columnNames = "email")
)
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 200)
    private String email;

    @Column(nullable = false, length = 200)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Role role;

    @Column(unique = true, length = 50)
    private String employeeCode;

    @Column(length = 100)
    private String department;

    /*
     * Manager assigned to this employee.
     *
     * Example:
     *
     * Ravi  -> MANAGER
     * Shiva -> EMPLOYEE -> manager = Ravi
     * Kiran -> EMPLOYEE -> manager = Ravi
     *
     * For ASSET_ADMIN and MANAGER users this can remain null.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private AppUser manager;

    @Column(unique = true, length = 100)
    private String authToken;

    @Column(nullable = false)
    private Instant createdAt;

    protected AppUser() {
    }

    public AppUser(
            String name,
            String email,
            String passwordHash,
            Role role,
            String employeeCode,
            String department
    ) {
        this.name = name;
        this.email = email.toLowerCase();
        this.passwordHash = passwordHash;
        this.role = role;
        this.employeeCode = employeeCode;
        this.department = department;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public String getEmployeeCode() {
        return employeeCode;
    }

    public String getDepartment() {
        return department;
    }

    public AppUser getManager() {
        return manager;
    }

    public String getAuthToken() {
        return authToken;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setAuthToken(String authToken) {
        this.authToken = authToken;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public void setManager(AppUser manager) {
        this.manager = manager;
    }
}