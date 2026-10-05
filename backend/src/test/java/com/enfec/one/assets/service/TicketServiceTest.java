package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.ticket.TicketResponse;
import com.enfec.one.assets.dto.ticket.UpdateTicketStatusRequest;
import com.enfec.one.assets.entity.AppUser;
import com.enfec.one.assets.entity.AssetTicket;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.enums.TicketStatus;
import com.enfec.one.assets.enums.TicketType;
import com.enfec.one.assets.exception.ResourceNotFoundException;
import com.enfec.one.assets.repository.AssetRepository;
import com.enfec.one.assets.repository.AssetTicketRepository;
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
class TicketServiceTest {

    @Mock
    private AssetTicketRepository tickets;

    @Mock
    private AssetRepository assets;

    @Mock
    private CurrentUser current;

    @Mock
    private AuditService audit;

    @InjectMocks
    private TicketService ticketService;


    @Test
    void mine_shouldReturnTicketsOfCurrentEmployee() {

        AppUser employee = new AppUser(
                "Manoj",
                "manoj@gmail.com",
                "password",
                Role.EMPLOYEE,
                "EMP-0020",
                "Engineering"
        );

        UUID employeeId = employee.getId();

        AssetTicket ticket = new AssetTicket(
                employeeId,
                "Manoj",
                null,
                TicketType.ISSUE,
                "Screen is Flickering",
                "Monitor screen is flickering"
        );

        when(current.requireRole(Role.EMPLOYEE))
                .thenReturn(employee);

        when(tickets.findAllByEmployeeIdOrderByCreatedAtDesc(employeeId))
                .thenReturn(List.of(ticket));

        List<TicketResponse> result =
                ticketService.mine();

        assertNotNull(result);

        assertEquals(
                1,
                result.size()
        );

        assertEquals(
                "Screen is Flickering",
                result.get(0).subject()
        );

        assertEquals(
                TicketType.ISSUE,
                result.get(0).type()
        );

        assertEquals(
                TicketStatus.OPEN,
                result.get(0).status()
        );

        verify(current)
                .requireRole(Role.EMPLOYEE);

        verify(tickets)
                .findAllByEmployeeIdOrderByCreatedAtDesc(
                        employeeId
                );
    }


    @Test
    void all_shouldReturnAllTicketsForAssetAdmin() {

        AppUser admin = new AppUser(
                "Asset Admin",
                "assetadmin@gmail.com",
                "password",
                Role.ASSET_ADMIN,
                null,
                null
        );

        AssetTicket ticket = new AssetTicket(
                UUID.randomUUID(),
                "Manoj",
                null,
                TicketType.ISSUE,
                "Laptop Problem",
                "Laptop is not working"
        );

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(tickets.findAllByOrderByCreatedAtDesc())
                .thenReturn(List.of(ticket));

        List<TicketResponse> result =
                ticketService.all();

        assertNotNull(result);

        assertEquals(
                1,
                result.size()
        );

        assertEquals(
                "Laptop Problem",
                result.get(0).subject()
        );

        assertEquals(
                TicketStatus.OPEN,
                result.get(0).status()
        );

        verify(current)
                .requireRole(Role.ASSET_ADMIN);

        verify(tickets)
                .findAllByOrderByCreatedAtDesc();
    }


    @Test
    void status_shouldChangeTicketStatus() {

        UUID ticketId =
                UUID.randomUUID();

        AppUser admin = new AppUser(
                "Asset Admin",
                "assetadmin@gmail.com",
                "password",
                Role.ASSET_ADMIN,
                null,
                null
        );

        AssetTicket ticket =
                mock(AssetTicket.class);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(tickets.findById(ticketId))
                .thenReturn(
                        Optional.of(ticket)
                );

        when(ticket.getStatus())
                .thenReturn(
                        TicketStatus.OPEN,
                        TicketStatus.IN_PROGRESS
                );

        when(ticket.getAssetId())
                .thenReturn(null);

        when(ticket.getId())
                .thenReturn(ticketId);

        when(ticket.getSubject())
                .thenReturn(
                        "Screen is Flickering"
                );

        when(ticket.getEmployeeName())
                .thenReturn("Manoj");

        UpdateTicketStatusRequest request =
                new UpdateTicketStatusRequest(
                        TicketStatus.IN_PROGRESS
                );

        TicketResponse response =
                ticketService.status(
                        ticketId,
                        request
                );

        verify(ticket)
                .changeStatus(
                        TicketStatus.IN_PROGRESS
                );

        assertEquals(
                TicketStatus.IN_PROGRESS,
                response.status()
        );
    }


    @Test
    void status_shouldThrowExceptionWhenTicketNotFound() {

        UUID ticketId =
                UUID.randomUUID();

        AppUser admin = new AppUser(
                "Asset Admin",
                "assetadmin@gmail.com",
                "password",
                Role.ASSET_ADMIN,
                null,
                null
        );

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(tickets.findById(ticketId))
                .thenReturn(
                        Optional.empty()
                );

        UpdateTicketStatusRequest request =
                new UpdateTicketStatusRequest(
                        TicketStatus.RESOLVED
                );

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        ticketService.status(
                                ticketId,
                                request
                        )
        );

        verify(tickets)
                .findById(ticketId);
    }
}