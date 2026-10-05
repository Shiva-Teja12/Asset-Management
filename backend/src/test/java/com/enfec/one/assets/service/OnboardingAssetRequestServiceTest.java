package com.enfec.one.assets.service;

import com.enfec.one.assets.entity.AppUser;
import com.enfec.one.assets.entity.OnboardingAssetRequest;
import com.enfec.one.assets.enums.OnboardingRequestStatus;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.repository.AppUserRepository;
import com.enfec.one.assets.repository.AssetRepository;
import com.enfec.one.assets.repository.DepartmentBudgetRepository;
import com.enfec.one.assets.repository.OnboardingAssetRequestRepository;
import com.enfec.one.assets.security.CurrentUser;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OnboardingAssetRequestServiceTest {

    @Mock
    private OnboardingAssetRequestRepository requests;

    @Mock
    private AssetRepository assets;

    @Mock
    private AppUserRepository users;

    @Mock
    private DepartmentBudgetRepository departmentBudgets;

    @Mock
    private AssetAssignmentService assetAssignmentService;

    @Mock
    private CurrentUser current;

    @InjectMocks
    private OnboardingAssetRequestService service;


    @Test
    void assetAdminRequests_shouldReturnRequests() {

        OnboardingAssetRequest request =
                mock(OnboardingAssetRequest.class);

        when(requests.findAllByOrderByCreatedAtDesc())
                .thenReturn(List.of(request));

        List<?> result =
                service.assetAdminRequests();

        assertNotNull(result);

        assertEquals(
                1,
                result.size()
        );

        verify(current)
                .requireRole(Role.ASSET_ADMIN);

        verify(requests)
                .findAllByOrderByCreatedAtDesc();
    }


    @Test
    void assetAdminRequests_shouldReturnEmptyList() {

        when(requests.findAllByOrderByCreatedAtDesc())
                .thenReturn(List.of());

        List<?> result =
                service.assetAdminRequests();

        assertNotNull(result);

        assertTrue(
                result.isEmpty()
        );

        verify(current)
                .requireRole(Role.ASSET_ADMIN);
    }


    @Test
    void totalHrRequests_shouldReturnCorrectCount() {

        AppUser hrAdmin =
                mock(AppUser.class);

        when(hrAdmin.getEmail())
                .thenReturn("hr@enfec.com");

        when(current.requireRole(Role.HR_ADMIN))
                .thenReturn(hrAdmin);

        when(
                requests
                        .findAllByCreatedByEmailIgnoreCaseOrderByCreatedAtDesc(
                                "hr@enfec.com"
                        )
        ).thenReturn(
                List.of(
                        mock(OnboardingAssetRequest.class),
                        mock(OnboardingAssetRequest.class)
                )
        );

        long result =
                service.totalHrRequests();

        assertEquals(
                2,
                result
        );

        verify(current)
                .requireRole(Role.HR_ADMIN);
    }


    @Test
    void forwardToVp_shouldThrowExceptionWhenRequestNotFound() {

        UUID requestId =
                UUID.randomUUID();

        AppUser assetAdmin =
                mock(AppUser.class);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(assetAdmin);

        when(requests.findById(requestId))
                .thenReturn(Optional.empty());

        assertThrows(
                RuntimeException.class,
                () ->
                        service.forwardToVp(
                                requestId
                        )
        );

        verify(requests)
                .findById(requestId);

        verify(requests, never())
                .save(any());
    }


    @Test
    void forwardToVp_shouldRejectWrongStatus() {

        UUID requestId =
                UUID.randomUUID();

        AppUser assetAdmin =
                mock(AppUser.class);

        OnboardingAssetRequest request =
                mock(OnboardingAssetRequest.class);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(assetAdmin);

        when(requests.findById(requestId))
                .thenReturn(
                        Optional.of(request)
                );

        when(request.getStatus())
                .thenReturn(
                        OnboardingRequestStatus.COMPLETED
                );

        assertThrows(
                RuntimeException.class,
                () ->
                        service.forwardToVp(
                                requestId
                        )
        );

        verify(requests, never())
                .save(any());
    }


    @Test
    void stockCheck_shouldRejectWrongStatus() {

        UUID requestId =
                UUID.randomUUID();

        OnboardingAssetRequest request =
                mock(OnboardingAssetRequest.class);

        when(requests.findById(requestId))
                .thenReturn(
                        Optional.of(request)
                );

        when(request.getStatus())
                .thenReturn(
                        OnboardingRequestStatus.COMPLETED
                );

        assertThrows(
                RuntimeException.class,
                () ->
                        service.stockCheck(
                                requestId
                        )
        );

        verify(current)
                .requireRole(Role.ASSET_ADMIN);

        verify(assets, never())
                .findAllByCategoryIgnoreCaseAndStatusOrderByCreatedAtAsc(
                        anyString(),
                        any()
                );
    }
}