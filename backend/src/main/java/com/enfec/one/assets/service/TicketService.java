package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.ticket.CreateTicketRequest;
import com.enfec.one.assets.dto.ticket.TicketResponse;
import com.enfec.one.assets.dto.ticket.UpdateTicketStatusRequest;
import com.enfec.one.assets.entity.AppUser;
import com.enfec.one.assets.entity.Asset;
import com.enfec.one.assets.entity.AssetTicket;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.exception.ResourceNotFoundException;
import com.enfec.one.assets.repository.AssetRepository;
import com.enfec.one.assets.repository.AssetTicketRepository;
import com.enfec.one.assets.security.CurrentUser;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TicketService {

 private final AssetTicketRepository tickets;
 private final AssetRepository assets;
 private final CurrentUser current;
 private final AuditService audit;

 public TicketService(
         AssetTicketRepository tickets,
         AssetRepository assets,
         CurrentUser current,
         AuditService audit
 ) {
  this.tickets = tickets;
  this.assets = assets;
  this.current = current;
  this.audit = audit;
 }

 @Transactional
 public TicketResponse create(
         CreateTicketRequest request
 ) {
  AppUser employee =
          current.requireRole(
                  Role.EMPLOYEE
          );

  AssetTicket ticket =
          tickets.save(
                  new AssetTicket(
                          employee.getId(),
                          employee.getName(),
                          request.assetId(),
                          request.type(),
                          request
                                  .subject()
                                  .trim(),
                          request
                                  .description()
                                  .trim()
                  )
          );

  Asset asset =
          request.assetId() == null
                  ? null
                  : assets
                  .findById(
                          request.assetId()
                  )
                  .orElse(null);

  audit.logWithEmployee(
          employee,
          "CREATE_TICKET",
          "TICKET",
          "TICKET",
          ticket.getId().toString(),
          ticket.getSubject(),
          asset,
          employee.getName(),
          null,
          ticket.getStatus().name(),
          "Ticket type: "
                  + ticket.getType()
                  + ". "
                  + ticket.getDescription()
  );

  return response(ticket);
 }

 @Transactional(readOnly = true)
 public List<TicketResponse> mine() {

  AppUser employee =
          current.requireRole(
                  Role.EMPLOYEE
          );

  return tickets
          .findAllByEmployeeIdOrderByCreatedAtDesc(
                  employee.getId()
          )
          .stream()
          .map(this::response)
          .toList();
 }

 @Transactional(readOnly = true)
 public List<TicketResponse> all() {

  current.requireRole(
          Role.ASSET_ADMIN
  );

  return tickets
          .findAllByOrderByCreatedAtDesc()
          .stream()
          .map(this::response)
          .toList();
 }

 @Transactional
 public TicketResponse status(
         UUID id,
         UpdateTicketStatusRequest request
 ) {
  AppUser admin =
          current.requireRole(
                  Role.ASSET_ADMIN
          );

  AssetTicket ticket =
          tickets
                  .findById(id)
                  .orElseThrow(() ->
                          new ResourceNotFoundException(
                                  "TICKET_NOT_FOUND",
                                  "Ticket not found."
                          )
                  );

  var oldStatus =
          ticket.getStatus();

  ticket.changeStatus(
          request.status()
  );

  Asset asset =
          ticket.getAssetId() == null
                  ? null
                  : assets
                  .findById(
                          ticket.getAssetId()
                  )
                  .orElse(null);

  audit.logWithEmployee(
          admin,
          "UPDATE_TICKET_STATUS",
          "TICKET",
          "TICKET",
          ticket.getId().toString(),
          ticket.getSubject(),
          asset,
          ticket.getEmployeeName(),
          oldStatus.name(),
          ticket.getStatus().name(),
          "Ticket status updated for "
                  + ticket.getEmployeeName()
  );

  return response(ticket);
 }

 private TicketResponse response(
         AssetTicket ticket
 ) {
  return new TicketResponse(
          ticket.getId(),
          ticket.getEmployeeId(),
          ticket.getEmployeeName(),
          ticket.getAssetId(),
          ticket.getType(),
          ticket.getSubject(),
          ticket.getDescription(),
          ticket.getStatus(),
          ticket.getCreatedAt(),
          ticket.getUpdatedAt()
  );
 }
}