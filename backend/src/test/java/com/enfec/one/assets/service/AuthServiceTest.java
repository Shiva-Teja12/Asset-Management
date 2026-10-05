package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.auth.AuthResponse;
import com.enfec.one.assets.dto.auth.LoginRequest;
import com.enfec.one.assets.dto.auth.SignupRequest;
import com.enfec.one.assets.entity.AppUser;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.exception.ConflictException;
import com.enfec.one.assets.exception.UnauthorizedException;
import com.enfec.one.assets.repository.AppUserRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Field;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AppUserRepository users;

    @Mock
    private PasswordEncoder encoder;

    @Mock
    private AuditService audit;

    @InjectMocks
    private AuthService service;


    // =========================================================
    // LOGIN - SUCCESS
    // =========================================================

    @Test
    void login_shouldLoginSuccessfully() {

        UUID userId = UUID.randomUUID();

        AppUser user = mock(AppUser.class);

        when(user.getId())
                .thenReturn(userId);

        when(user.getName())
                .thenReturn("Manoj");

        when(user.getEmail())
                .thenReturn("manoj@enfec.com");

        when(user.getPasswordHash())
                .thenReturn("encoded-password");

        when(user.getRole())
                .thenReturn(Role.EMPLOYEE);

        when(user.getEmployeeCode())
                .thenReturn("EMP-0020");

        when(user.getDepartment())
                .thenReturn("Engineering");

        when(user.getAuthToken())
                .thenReturn("generated-token");

        when(users.findByEmailIgnoreCase(
                "manoj@enfec.com"
        )).thenReturn(
                Optional.of(user)
        );

        when(encoder.matches(
                "password123",
                "encoded-password"
        )).thenReturn(true);

        LoginRequest request =
                new LoginRequest(
                        "manoj@enfec.com",
                        "password123"
                );

        AuthResponse result =
                service.login(request);

        assertNotNull(result);

        assertEquals(
                userId,
                result.userId()
        );

        assertEquals(
                "Manoj",
                result.name()
        );

        assertEquals(
                "manoj@enfec.com",
                result.email()
        );

        assertEquals(
                Role.EMPLOYEE,
                result.role()
        );

        assertEquals(
                "EMP-0020",
                result.employeeCode()
        );

        assertEquals(
                "Engineering",
                result.department()
        );

        verify(user)
                .setAuthToken(anyString());

        verify(audit)
                .log(
                        eq(user),
                        eq("LOGIN"),
                        eq("SECURITY"),
                        eq("USER"),
                        eq(userId.toString()),
                        eq("manoj@enfec.com"),
                        isNull(),
                        isNull(),
                        isNull(),
                        eq("Successful login")
                );
    }


    // =========================================================
    // LOGIN - UNKNOWN USER
    // =========================================================

    @Test
    void login_shouldRejectUnknownEmail() {

        when(users.findByEmailIgnoreCase(
                "unknown@enfec.com"
        )).thenReturn(
                Optional.empty()
        );

        LoginRequest request =
                new LoginRequest(
                        "unknown@enfec.com",
                        "password123"
                );

        assertThrows(
                UnauthorizedException.class,
                () -> service.login(request)
        );

        verify(audit)
                .logFailedLogin(
                        "unknown@enfec.com",
                        "Login failed - user was not found."
                );

        verifyNoInteractions(encoder);
    }


    // =========================================================
    // LOGIN - WRONG PASSWORD
    // =========================================================

    @Test
    void login_shouldRejectInvalidPassword() {

        UUID userId = UUID.randomUUID();

        AppUser user = mock(AppUser.class);

        when(user.getId())
                .thenReturn(userId);

        when(user.getEmail())
                .thenReturn("manoj@enfec.com");

        when(user.getPasswordHash())
                .thenReturn("encoded-password");

        when(users.findByEmailIgnoreCase(
                "manoj@enfec.com"
        )).thenReturn(
                Optional.of(user)
        );

        when(encoder.matches(
                "wrong-password",
                "encoded-password"
        )).thenReturn(false);

        LoginRequest request =
                new LoginRequest(
                        "manoj@enfec.com",
                        "wrong-password"
                );

        assertThrows(
                UnauthorizedException.class,
                () -> service.login(request)
        );

        verify(audit)
                .logFailure(
                        eq(user),
                        eq("LOGIN_FAILED"),
                        eq("SECURITY"),
                        eq("USER"),
                        eq(userId.toString()),
                        eq("manoj@enfec.com"),
                        eq(
                                "Login failed - invalid password."
                        )
                );

        verify(user, never())
                .setAuthToken(anyString());
    }


    // =========================================================
    // SIGNUP - SUCCESS
    // =========================================================

    @Test
    void signup_shouldCreateEmployeeSuccessfully()
            throws Exception {

        AppUser manager =
                mock(AppUser.class);

        when(manager.getRole())
                .thenReturn(Role.MANAGER);

        /*
         * Important:
         * AuthService currently checks the original email
         * before trimming it.
         */
        when(users.existsByEmailIgnoreCase(
                "  newemployee@enfec.com  "
        )).thenReturn(false);

        when(users.findByEmailIgnoreCase(
                "vikram@enfec.local"
        )).thenReturn(
                Optional.of(manager)
        );

        when(users.count())
                .thenReturn(19L);

        when(encoder.encode(
                "password123"
        )).thenReturn(
                "encoded-password"
        );

        SignupRequest request =
                new SignupRequest(
                        "  New Employee  ",
                        "  newemployee@enfec.com  ",
                        "password123",
                        "  Engineering  "
                );

        /*
         * In a real JPA save, Hibernate assigns the entity ID.
         *
         * Mockito does not run Hibernate, so we simulate that
         * behaviour when users.save(...) is called.
         */
        doAnswer(invocation -> {

            AppUser savedUser =
                    invocation.getArgument(0);

            Field idField =
                    AppUser.class
                            .getDeclaredField("id");

            idField.setAccessible(true);

            if (idField.get(savedUser) == null) {

                idField.set(
                        savedUser,
                        UUID.randomUUID()
                );
            }

            return savedUser;

        }).when(users)
                .save(any(AppUser.class));

        AuthResponse result =
                service.signup(request);

        assertNotNull(result);

        assertNotNull(
                result.userId()
        );

        assertEquals(
                "New Employee",
                result.name()
        );

        assertEquals(
                "newemployee@enfec.com",
                result.email()
        );

        assertEquals(
                Role.EMPLOYEE,
                result.role()
        );

        assertEquals(
                "EMP-0020",
                result.employeeCode()
        );

        assertEquals(
                "Engineering",
                result.department()
        );

        assertNotNull(
                result.token()
        );

        verify(encoder)
                .encode("password123");

        verify(users)
                .findByEmailIgnoreCase(
                        "vikram@enfec.local"
                );

        verify(users)
                .save(any(AppUser.class));

        verify(audit)
                .logWithEmployee(
                        any(AppUser.class),
                        eq("EMPLOYEE_SIGNUP"),
                        eq("EMPLOYEE"),
                        eq("USER"),
                        anyString(),
                        eq("newemployee@enfec.com"),
                        isNull(),
                        eq("New Employee"),
                        isNull(),
                        eq("EMPLOYEE"),
                        contains(
                                "Employee account created"
                        )
                );
    }


    // =========================================================
    // SIGNUP - DUPLICATE EMAIL
    // =========================================================

    @Test
    void signup_shouldRejectDuplicateEmail() {

        when(users.existsByEmailIgnoreCase(
                "existing@enfec.com"
        )).thenReturn(true);

        SignupRequest request =
                new SignupRequest(
                        "Existing Employee",
                        "existing@enfec.com",
                        "password123",
                        "Engineering"
                );

        assertThrows(
                ConflictException.class,
                () -> service.signup(request)
        );

        verify(users, never())
                .save(any());

        verify(encoder, never())
                .encode(anyString());

        verify(users, never())
                .findByEmailIgnoreCase(
                        "vikram@enfec.local"
                );

        verifyNoInteractions(audit);
    }


    // =========================================================
    // SIGNUP - MANAGER DOES NOT EXIST
    // =========================================================

    @Test
    void signup_shouldRejectWhenDefaultManagerDoesNotExist() {

        when(users.existsByEmailIgnoreCase(
                "newemployee@enfec.com"
        )).thenReturn(false);

        when(users.findByEmailIgnoreCase(
                "vikram@enfec.local"
        )).thenReturn(
                Optional.empty()
        );

        SignupRequest request =
                new SignupRequest(
                        "New Employee",
                        "newemployee@enfec.com",
                        "password123",
                        "Engineering"
                );

        ResponseStatusException exception =
                assertThrows(
                        ResponseStatusException.class,
                        () ->
                                service.signup(request)
                );

        assertEquals(
                409,
                exception
                        .getStatusCode()
                        .value()
        );

        verify(users, never())
                .save(any());

        verify(encoder, never())
                .encode(anyString());
    }


    // =========================================================
    // SIGNUP - DEFAULT USER IS NOT MANAGER
    // =========================================================

    @Test
    void signup_shouldRejectWhenDefaultUserIsNotManager() {

        AppUser wrongUser =
                mock(AppUser.class);

        when(wrongUser.getRole())
                .thenReturn(Role.EMPLOYEE);

        when(users.existsByEmailIgnoreCase(
                "newemployee@enfec.com"
        )).thenReturn(false);

        when(users.findByEmailIgnoreCase(
                "vikram@enfec.local"
        )).thenReturn(
                Optional.of(wrongUser)
        );

        SignupRequest request =
                new SignupRequest(
                        "New Employee",
                        "newemployee@enfec.com",
                        "password123",
                        "Engineering"
                );

        ResponseStatusException exception =
                assertThrows(
                        ResponseStatusException.class,
                        () ->
                                service.signup(request)
                );

        assertEquals(
                409,
                exception
                        .getStatusCode()
                        .value()
        );

        verify(users, never())
                .save(any());

        verify(encoder, never())
                .encode(anyString());
    }
}