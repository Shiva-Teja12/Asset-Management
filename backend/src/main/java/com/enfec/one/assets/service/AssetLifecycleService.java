package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.asset.AssetEventResponse;
import com.enfec.one.assets.dto.asset.AssetResponse;
import com.enfec.one.assets.dto.asset.UpdateAssetStatusRequest;
import com.enfec.one.assets.entity.Asset;
import com.enfec.one.assets.entity.AssetEvent;
import com.enfec.one.assets.enums.AssetStatus;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.exception.BadRequestException;
import com.enfec.one.assets.exception.ResourceNotFoundException;
import com.enfec.one.assets.repository.AssetAssignmentRepository;
import com.enfec.one.assets.repository.AssetEventRepository;
import com.enfec.one.assets.repository.AssetRepository;
import com.enfec.one.assets.security.CurrentUser;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AssetLifecycleService {

 private final AssetRepository assets;
 private final AssetEventRepository events;
 private final AssetAssignmentRepository assignments;
 private final CurrentUser current;
 private final AuditService audit;
 private final AssetService assetService;

 public AssetLifecycleService(
         AssetRepository assets,
         AssetEventRepository events,
         AssetAssignmentRepository assignments,
         CurrentUser current,
         AuditService audit,
         AssetService assetService
 ) {
  this.assets = assets;
  this.events = events;
  this.assignments = assignments;
  this.current = current;
  this.audit = audit;
  this.assetService = assetService;
 }

 @Transactional
 public AssetResponse changeStatus(
         UUID id,
         UpdateAssetStatusRequest request
 ) {

  var admin =
          current.requireRole(
                  Role.ASSET_ADMIN
          );

  Asset asset = find(id);

  AssetStatus newStatus =
          request.status();

  var activeAssignment =
          assignments
                  .findFirstByAssetIdAndReturnedAtIsNull(
                          id
                  )
                  .orElse(null);

  if (
          newStatus == AssetStatus.ASSIGNED
                  && activeAssignment == null
  ) {
   throw new BadRequestException(
           "USE_ASSIGN_API",
           "Use Assign Asset to select an employee."
   );
  }

  if (
          newStatus == AssetStatus.IN_STOCK
                  && activeAssignment != null
  ) {
   throw new BadRequestException(
           "USE_RETURN_API",
           "This asset is still assigned to an employee. Use Return Asset first."
   );
  }

  if (
          newStatus == AssetStatus.RETIRED
                  && activeAssignment != null
  ) {
   throw new BadRequestException(
           "ACTIVE_ASSIGNMENT",
           "Return the asset from the employee before retiring it."
   );
  }

  AssetStatus previousStatus =
          asset.getStatus();

  if (previousStatus != newStatus) {

   asset.changeStatus(newStatus);

   String eventReason =
           request.reason().trim();

   if (
           previousStatus
                   == AssetStatus.IN_REPAIR
                   && newStatus
                   == AssetStatus.ASSIGNED
                   && activeAssignment != null
   ) {
    eventReason =
            "Repair completed - returned to "
                    + activeAssignment.getEmployeeName()
                    + ": "
                    + request.reason().trim();
   }

   events.save(
           new AssetEvent(
                   id,
                   previousStatus,
                   newStatus,
                   admin.getEmail(),
                   eventReason
           )
   );

   String action =
           getAuditAction(
                   previousStatus,
                   newStatus
           );

   audit.logWithEmployee(
           admin,
           action,
           "ASSET",
           "ASSET",
           asset.getId().toString(),
           asset.getAssetTag(),
           asset,

           activeAssignment == null
                   ? null
                   : activeAssignment.getEmployeeName(),

           previousStatus.name(),
           newStatus.name(),
           eventReason
   );
  }

  /*
   * Corrected:
   * use existing AssetService.one()
   */
  return assetService.one(id);
 }

 @Transactional
 public List<AssetEventResponse> history(
         UUID id
 ) {

  var admin =
          current.requireRole(
                  Role.ASSET_ADMIN
          );

  Asset asset = find(id);

  var activeAssignment =
          assignments
                  .findFirstByAssetIdAndReturnedAtIsNull(
                          id
                  )
                  .orElse(null);

  /*
   * Clicking View History is also
   * recorded in the central Audit Log.
   */
  audit.logWithEmployee(
          admin,
          "VIEW_ASSET_HISTORY",
          "ASSET",
          "ASSET",
          asset.getId().toString(),
          asset.getAssetTag(),
          asset,

          activeAssignment == null
                  ? null
                  : activeAssignment.getEmployeeName(),

          null,
          null,
          "Viewed lifecycle, assignment and warranty history"
  );

  return events
          .findAllByAssetIdOrderByOccurredAtDesc(
                  id
          )
          .stream()
          .map(event ->
                  new AssetEventResponse(
                          event.getId(),
                          event.getAssetId(),
                          event.getPreviousStatus(),
                          event.getNewStatus(),
                          event.getActor(),
                          event.getReason(),
                          event.getOccurredAt()
                  )
          )
          .toList();
 }

 private String getAuditAction(
         AssetStatus previous,
         AssetStatus next
 ) {

  if (
          next == AssetStatus.IN_REPAIR
  ) {
   return "SEND_TO_REPAIR";
  }

  if (
          next == AssetStatus.RETIRED
  ) {
   return "RETIRE_ASSET";
  }

  if (
          previous == AssetStatus.IN_REPAIR
                  && next == AssetStatus.ASSIGNED
  ) {
   return "RETURN_FROM_REPAIR";
  }

  return "ASSET_STATUS_CHANGED";
 }

 private Asset find(UUID id) {

  return assets
          .findById(id)
          .orElseThrow(() ->
                  new ResourceNotFoundException(
                          "ASSET_NOT_FOUND",
                          "Asset was not found."
                  )
          );
 }
}