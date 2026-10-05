package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.audit.AuditLogResponse;
import com.enfec.one.assets.entity.AppUser;
import com.enfec.one.assets.entity.Asset;
import com.enfec.one.assets.entity.AuditLog;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.repository.AuditLogRepository;
import com.enfec.one.assets.security.CurrentUser;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock
    private AuditLogRepository logs;

    @Mock
    private CurrentUser current;

    @Mock
    private AppUser actor;

    @Mock
    private Asset asset;

    private AuditService service;

    private UUID actorId;

    @BeforeEach
    void setUp() {

        service =
                new AuditService(
                        logs,
                        current
                );

        actorId = UUID.randomUUID();
    }

    /*
     * =========================================================
     * LOG SUCCESS
     * =========================================================
     */

    @Test
    void log_shouldSaveSuccessfulAuditLog() {

        when(actor.getId())
                .thenReturn(actorId);

        when(actor.getName())
                .thenReturn("Asset Admin");

        when(actor.getEmail())
                .thenReturn(
                        "assetadmin@enfec.com"
                );

        when(actor.getRole())
                .thenReturn(Role.ASSET_ADMIN);

        service.log(
                actor,
                "CREATE_ASSET",
                "ASSET",
                "ASSET",
                "asset-1",
                "LAP-001",
                null,
                null,
                null,
                "Asset created"
        );

        ArgumentCaptor<AuditLog> captor =
                ArgumentCaptor.forClass(
                        AuditLog.class
                );

        verify(logs)
                .save(captor.capture());

        AuditLog saved =
                captor.getValue();

        assertEquals(
                actorId,
                saved.getActorUserId()
        );

        assertEquals(
                "Asset Admin",
                saved.getActorName()
        );

        assertEquals(
                "assetadmin@enfec.com",
                saved.getActorEmail()
        );

        assertEquals(
                Role.ASSET_ADMIN.name(),
                saved.getActorRole()
        );

        assertEquals(
                "CREATE_ASSET",
                saved.getAction()
        );

        assertEquals(
                "ASSET",
                saved.getModule()
        );

        assertEquals(
                "ASSET",
                saved.getEntityType()
        );

        assertEquals(
                "asset-1",
                saved.getEntityId()
        );

        assertEquals(
                "LAP-001",
                saved.getEntityName()
        );

        assertEquals(
                "Asset created",
                saved.getDetails()
        );

        assertEquals(
                "SUCCESS",
                saved.getResult()
        );

        assertNotNull(
                saved.getCreatedAt()
        );
    }

    /*
     * =========================================================
     * ASSET DETAILS
     * =========================================================
     */

    @Test
    void log_shouldSaveAssetDetails() {

        when(actor.getId())
                .thenReturn(actorId);

        when(actor.getName())
                .thenReturn("Asset Admin");

        when(actor.getEmail())
                .thenReturn(
                        "assetadmin@enfec.com"
                );

        when(actor.getRole())
                .thenReturn(Role.ASSET_ADMIN);

        when(asset.getCategory())
                .thenReturn("Laptop");

        when(asset.getName())
                .thenReturn("Dell Laptop");

        when(asset.getBrand())
                .thenReturn("Dell");

        when(asset.getModel())
                .thenReturn("Latitude 5450");

        when(asset.getAssetTag())
                .thenReturn("LAP-001");

        when(asset.getSerialNumber())
                .thenReturn("SERIAL-001");

        when(asset.getSpecifications())
                .thenReturn(
                        "Intel Core i7, 16GB RAM"
                );

        service.log(
                actor,
                "UPDATE_ASSET",
                "ASSET",
                "ASSET",
                "asset-1",
                "LAP-001",
                asset,
                "IN_STOCK",
                "ASSIGNED",
                "Asset updated"
        );

        ArgumentCaptor<AuditLog> captor =
                ArgumentCaptor.forClass(
                        AuditLog.class
                );

        verify(logs)
                .save(captor.capture());

        AuditLog saved =
                captor.getValue();

        assertEquals(
                "Laptop",
                saved.getAssetCategory()
        );

        assertEquals(
                "Dell Laptop",
                saved.getAssetName()
        );

        assertEquals(
                "Dell",
                saved.getAssetBrand()
        );

        assertEquals(
                "Latitude 5450",
                saved.getAssetModel()
        );

        assertEquals(
                "LAP-001",
                saved.getAssetTag()
        );

        assertEquals(
                "SERIAL-001",
                saved.getAssetSerialNumber()
        );

        assertEquals(
                "Intel Core i7, 16GB RAM",
                saved.getAssetSpecifications()
        );

        assertEquals(
                "IN_STOCK",
                saved.getOldValue()
        );

        assertEquals(
                "ASSIGNED",
                saved.getNewValue()
        );

        assertEquals(
                "SUCCESS",
                saved.getResult()
        );
    }

    /*
     * =========================================================
     * EMPLOYEE AUDIT
     * =========================================================
     */

    @Test
    void logWithEmployee_shouldSaveEmployeeName() {

        when(actor.getId())
                .thenReturn(actorId);

        when(actor.getName())
                .thenReturn("Asset Admin");

        when(actor.getEmail())
                .thenReturn(
                        "assetadmin@enfec.com"
                );

        when(actor.getRole())
                .thenReturn(Role.ASSET_ADMIN);

        service.logWithEmployee(
                actor,
                "ASSIGN_ASSET",
                "ASSET",
                "ASSET",
                "asset-1",
                "LAP-001",
                null,
                "Manoj",
                "IN_STOCK",
                "ASSIGNED",
                "Asset assigned to employee"
        );

        ArgumentCaptor<AuditLog> captor =
                ArgumentCaptor.forClass(
                        AuditLog.class
                );

        verify(logs)
                .save(captor.capture());

        AuditLog saved =
                captor.getValue();

        assertEquals(
                "Manoj",
                saved.getEmployeeName()
        );

        assertEquals(
                "ASSIGN_ASSET",
                saved.getAction()
        );

        assertEquals(
                "SUCCESS",
                saved.getResult()
        );

        assertEquals(
                "IN_STOCK",
                saved.getOldValue()
        );

        assertEquals(
                "ASSIGNED",
                saved.getNewValue()
        );
    }

    /*
     * =========================================================
     * FAILURE AUDIT
     * =========================================================
     */

    @Test
    void logFailure_shouldSaveFailedAuditLog() {

        when(actor.getId())
                .thenReturn(actorId);

        when(actor.getName())
                .thenReturn("Asset Admin");

        when(actor.getEmail())
                .thenReturn(
                        "assetadmin@enfec.com"
                );

        when(actor.getRole())
                .thenReturn(Role.ASSET_ADMIN);

        service.logFailure(
                actor,
                "DELETE_ASSET_FAILED",
                "ASSET",
                "ASSET",
                "asset-1",
                "LAP-001",
                "Asset could not be deleted"
        );

        ArgumentCaptor<AuditLog> captor =
                ArgumentCaptor.forClass(
                        AuditLog.class
                );

        verify(logs)
                .save(captor.capture());

        AuditLog saved =
                captor.getValue();

        assertEquals(
                "DELETE_ASSET_FAILED",
                saved.getAction()
        );

        assertEquals(
                "FAILED",
                saved.getResult()
        );

        assertEquals(
                "Asset could not be deleted",
                saved.getDetails()
        );
    }

    /*
     * =========================================================
     * FAILED LOGIN
     * =========================================================
     */

    @Test
    void logFailedLogin_shouldSaveFailedSecurityAudit() {

        service.logFailedLogin(
                "wronguser@enfec.com",
                "Login failed - user was not found."
        );

        ArgumentCaptor<AuditLog> captor =
                ArgumentCaptor.forClass(
                        AuditLog.class
                );

        verify(logs)
                .save(captor.capture());

        AuditLog saved =
                captor.getValue();

        assertNull(
                saved.getActorUserId()
        );

        assertNull(
                saved.getActorName()
        );

        assertEquals(
                "wronguser@enfec.com",
                saved.getActorEmail()
        );

        assertNull(
                saved.getActorRole()
        );

        assertEquals(
                "LOGIN_FAILED",
                saved.getAction()
        );

        assertEquals(
                "SECURITY",
                saved.getModule()
        );

        assertEquals(
                "USER",
                saved.getEntityType()
        );

        assertEquals(
                "wronguser@enfec.com",
                saved.getEntityName()
        );

        assertEquals(
                "FAILED",
                saved.getResult()
        );

        assertEquals(
                "Login failed - user was not found.",
                saved.getDetails()
        );
    }

    /*
     * =========================================================
     * SYSTEM ACTOR
     * =========================================================
     */

    @Test
    void log_shouldUseSystemWhenActorIsNull() {

        service.log(
                null,
                "SYSTEM_ACTION",
                "SYSTEM",
                "SYSTEM",
                null,
                null,
                null,
                null,
                null,
                "Automatic system action"
        );

        ArgumentCaptor<AuditLog> captor =
                ArgumentCaptor.forClass(
                        AuditLog.class
                );

        verify(logs)
                .save(captor.capture());

        AuditLog saved =
                captor.getValue();

        assertNull(
                saved.getActorUserId()
        );

        assertEquals(
                "SYSTEM",
                saved.getActorName()
        );

        assertEquals(
                "SYSTEM",
                saved.getActorEmail()
        );

        assertEquals(
                "SYSTEM",
                saved.getActorRole()
        );

        assertEquals(
                "SUCCESS",
                saved.getResult()
        );
    }

    /*
     * =========================================================
     * SEARCH - ALL
     * =========================================================
     */

    @Test
    void search_shouldReturnAllAuditLogs() {

        AuditLog first =
                auditLog(
                        "assetadmin@enfec.com",
                        "Asset Admin",
                        "CREATE_ASSET",
                        "ASSET",
                        "SUCCESS"
                );

        AuditLog second =
                auditLog(
                        "assetadmin@enfec.com",
                        "Asset Admin",
                        "ASSIGN_ASSET",
                        "ASSET",
                        "SUCCESS"
                );

        when(logs.findAllByOrderByCreatedAtDesc())
                .thenReturn(
                        List.of(
                                first,
                                second
                        )
                );

        List<AuditLogResponse> result =
                service.search(
                        null,
                        null,
                        null,
                        null,
                        null
                );

        assertEquals(
                2,
                result.size()
        );

        verify(current)
                .requireRole(
                        Role.ASSET_ADMIN
                );

        verify(logs)
                .findAllByOrderByCreatedAtDesc();
    }

    /*
     * =========================================================
     * SEARCH - USER
     * =========================================================
     */

    @Test
    void search_shouldFilterByUser() {

        AuditLog adminLog =
                auditLog(
                        "assetadmin@enfec.com",
                        "Asset Admin",
                        "CREATE_ASSET",
                        "ASSET",
                        "SUCCESS"
                );

        AuditLog employeeLog =
                auditLog(
                        "manoj@enfec.com",
                        "Manoj",
                        "LOGIN",
                        "SECURITY",
                        "SUCCESS"
                );

        when(logs.findAllByOrderByCreatedAtDesc())
                .thenReturn(
                        List.of(
                                adminLog,
                                employeeLog
                        )
                );

        List<AuditLogResponse> result =
                service.search(
                        "manoj",
                        null,
                        null,
                        null,
                        null
                );

        assertEquals(
                1,
                result.size()
        );

        assertEquals(
                "manoj@enfec.com",
                result.get(0)
                        .actorEmail()
        );
    }

    /*
     * =========================================================
     * SEARCH - ACTION
     * =========================================================
     */

    @Test
    void search_shouldFilterByAction() {

        AuditLog create =
                auditLog(
                        "assetadmin@enfec.com",
                        "Asset Admin",
                        "CREATE_ASSET",
                        "ASSET",
                        "SUCCESS"
                );

        AuditLog assign =
                auditLog(
                        "assetadmin@enfec.com",
                        "Asset Admin",
                        "ASSIGN_ASSET",
                        "ASSET",
                        "SUCCESS"
                );

        when(logs.findAllByOrderByCreatedAtDesc())
                .thenReturn(
                        List.of(
                                create,
                                assign
                        )
                );

        List<AuditLogResponse> result =
                service.search(
                        null,
                        "assign",
                        null,
                        null,
                        null
                );

        assertEquals(
                1,
                result.size()
        );

        assertEquals(
                "ASSIGN_ASSET",
                result.get(0)
                        .action()
        );
    }

    /*
     * =========================================================
     * SEARCH - MODULE
     * =========================================================
     */

    @Test
    void search_shouldFilterByModule() {

        AuditLog assetLog =
                auditLog(
                        "assetadmin@enfec.com",
                        "Asset Admin",
                        "CREATE_ASSET",
                        "ASSET",
                        "SUCCESS"
                );

        AuditLog securityLog =
                auditLog(
                        "assetadmin@enfec.com",
                        "Asset Admin",
                        "LOGIN",
                        "SECURITY",
                        "SUCCESS"
                );

        when(logs.findAllByOrderByCreatedAtDesc())
                .thenReturn(
                        List.of(
                                assetLog,
                                securityLog
                        )
                );

        List<AuditLogResponse> result =
                service.search(
                        null,
                        null,
                        "security",
                        null,
                        null
                );

        assertEquals(
                1,
                result.size()
        );

        assertEquals(
                "SECURITY",
                result.get(0)
                        .module()
        );
    }

    /*
     * =========================================================
     * SEARCH - DATE RANGE
     * =========================================================
     */

    @Test
    void search_shouldReturnLogInsideDateRange() {

        AuditLog auditLog =
                auditLog(
                        "assetadmin@enfec.com",
                        "Asset Admin",
                        "CREATE_ASSET",
                        "ASSET",
                        "SUCCESS"
                );

        when(logs.findAllByOrderByCreatedAtDesc())
                .thenReturn(
                        List.of(auditLog)
                );

        LocalDate today =
                LocalDate.now();

        List<AuditLogResponse> result =
                service.search(
                        null,
                        null,
                        null,
                        today,
                        today
                );

        assertEquals(
                1,
                result.size()
        );
    }

    /*
     * =========================================================
     * SEARCH - CASE INSENSITIVE
     * =========================================================
     */

    @Test
    void search_shouldBeCaseInsensitive() {

        AuditLog auditLog =
                auditLog(
                        "AssetAdmin@Enfec.com",
                        "Asset Admin",
                        "CREATE_ASSET",
                        "ASSET",
                        "SUCCESS"
                );

        when(logs.findAllByOrderByCreatedAtDesc())
                .thenReturn(
                        List.of(auditLog)
                );

        List<AuditLogResponse> result =
                service.search(
                        "ASSETADMIN",
                        "create",
                        "asset",
                        null,
                        null
                );

        assertEquals(
                1,
                result.size()
        );
    }

    /*
     * =========================================================
     * CSV EXPORT
     * =========================================================
     */

    @Test
    void exportCsv_shouldGenerateCsv() {

        AuditLog auditLog =
                auditLog(
                        "assetadmin@enfec.com",
                        "Asset Admin",
                        "CREATE_ASSET",
                        "ASSET",
                        "SUCCESS"
                );

        when(logs.findAllByOrderByCreatedAtDesc())
                .thenReturn(
                        List.of(auditLog)
                );

        String csv =
                service.exportCsv(
                        null,
                        null,
                        null,
                        null,
                        null
                );

        assertNotNull(csv);

        assertTrue(
                csv.contains(
                        "Date & Time"
                )
        );

        assertTrue(
                csv.contains(
                        "User"
                )
        );

        assertTrue(
                csv.contains(
                        "Action"
                )
        );

        assertTrue(
                csv.contains(
                        "assetadmin@enfec.com"
                )
        );

        assertTrue(
                csv.contains(
                        "CREATE_ASSET"
                )
        );

        assertTrue(
                csv.contains(
                        "SUCCESS"
                )
        );

        verify(current)
                .requireRole(
                        Role.ASSET_ADMIN
                );
    }

    /*
     * =========================================================
     * HELPER
     * =========================================================
     */

    private AuditLog auditLog(
            String email,
            String name,
            String action,
            String module,
            String result
    ) {

        return new AuditLog(
                UUID.randomUUID(),
                name,
                email,
                Role.ASSET_ADMIN.name(),
                action,
                module,
                "ASSET",
                UUID.randomUUID().toString(),
                "LAP-001",
                "Laptop",
                "Dell Laptop",
                "Dell",
                "Latitude 5450",
                "LAP-001",
                "SERIAL-001",
                "Intel Core i7, 16GB RAM",
                "Manoj",
                null,
                null,
                "Test audit log",
                result,
                "127.0.0.1",
                "JUnit"
        );
    }
}