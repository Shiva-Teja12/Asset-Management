package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.asset.AssetResponse;
import com.enfec.one.assets.dto.asset.CreateAssetRequest;
import com.enfec.one.assets.dto.asset.UpdateAssetRequest;
import com.enfec.one.assets.entity.Asset;
import com.enfec.one.assets.entity.AssetAssignment;
import com.enfec.one.assets.entity.AssetPurchaseOrder;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.exception.BadRequestException;
import com.enfec.one.assets.exception.ConflictException;
import com.enfec.one.assets.exception.ResourceNotFoundException;
import com.enfec.one.assets.repository.AssetAssignmentRepository;
import com.enfec.one.assets.repository.AssetPurchaseOrderRepository;
import com.enfec.one.assets.repository.AssetRepository;
import com.enfec.one.assets.security.CurrentUser;
import com.enfec.one.assets.util.StringUtils;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class AssetService {

 private final AssetRepository assets;
 private final AssetAssignmentRepository assignments;
 private final AssetPurchaseOrderRepository purchaseOrders;
 private final CurrentUser current;

 public AssetService(
         AssetRepository assets,
         AssetAssignmentRepository assignments,
         AssetPurchaseOrderRepository purchaseOrders,
         CurrentUser current
 ) {
  this.assets = assets;
  this.assignments = assignments;
  this.purchaseOrders = purchaseOrders;
  this.current = current;
 }

 @Transactional
 public AssetResponse create(
         CreateAssetRequest request
 ) {

  current.requireRole(Role.ASSET_ADMIN);

  if (
          assets.existsByAssetTagIgnoreCase(
                  request.assetTag()
          )
  ) {
   throw new ConflictException(
           "ASSET_TAG_EXISTS",
           "Asset tag already exists."
   );
  }

  validateWarranty(
          request.warrantyAvailable(),
          request.warrantyStartDate(),
          request.warrantyPeriodMonths()
  );

  /*
   * If this asset is being registered from
   * a purchase order, load and validate the
   * purchase order before creating the asset.
   *
   * purchaseOrderId is optional, so normal
   * manual asset creation continues to work.
   */
  AssetPurchaseOrder purchaseOrder = null;

  if (request.purchaseOrderId() != null) {

   purchaseOrder =
           purchaseOrders
                   .findById(
                           request.purchaseOrderId()
                   )
                   .orElseThrow(() ->
                           new ResourceNotFoundException(
                                   "PURCHASE_ORDER_NOT_FOUND",
                                   "Purchase order was not found."
                           )
                   );

   /*
    * Prevent registering an asset against
    * a purchase order for another category.
    *
    * Example:
    * Laptop cannot be received against
    * a Mouse purchase order.
    */
   if (
           !purchaseOrder
                   .getCategory()
                   .trim()
                   .equalsIgnoreCase(
                           request
                                   .category()
                                   .trim()
                   )
   ) {
    throw new BadRequestException(
            "PURCHASE_ORDER_CATEGORY_MISMATCH",
            "Asset category does not match the purchase order category."
    );
   }

   /*
    * Register one physical item as received.
    *
    * 0/1 -> 1/1 RECEIVED
    *
    * 0/2 -> 1/2 PARTIALLY_RECEIVED
    * 1/2 -> 2/2 RECEIVED
    */
   try {

    purchaseOrder.receiveOne();

   } catch (IllegalStateException exception) {

    throw new ConflictException(
            "PURCHASE_ORDER_ALREADY_RECEIVED",
            exception.getMessage()
    );
   }
  }

  Asset asset = new Asset(
          request.assetTag().trim(),
          request.name().trim(),
          request.category().trim(),

          StringUtils.blankToNull(
                  request.brand()
          ),

          StringUtils.blankToNull(
                  request.model()
          ),

          StringUtils.blankToNull(
                  request.serialNumber()
          ),

          StringUtils.blankToNull(
                  request.specifications()
          ),

          request.purchaseDate(),
          request.purchasePrice(),

          StringUtils.blankToNull(
                  request.supplier()
          ),

          request.warrantyAvailable(),
          request.warrantyStartDate(),
          request.warrantyPeriodMonths(),

          StringUtils.blankToNull(
                  request.warrantyProvider()
          ),

          StringUtils.blankToNull(
                  request.warrantyReference()
          )
  );

  /*
   * Save the physical asset into inventory.
   */
  Asset savedAsset =
          assets.save(
                  asset
          );

  /*
   * If the asset belongs to a purchase order,
   * save the updated received quantity/status.
   */
  if (purchaseOrder != null) {

   purchaseOrders.save(
           purchaseOrder
   );
  }

  return response(
          savedAsset
  );
 }

 @Transactional(readOnly = true)
 public List<AssetResponse> all() {

  current.requireRole(Role.ASSET_ADMIN);

  return assets
          .findAllByOrderByCreatedAtDesc()
          .stream()
          .map(this::response)
          .toList();
 }

 @Transactional(readOnly = true)
 public AssetResponse one(
         UUID id
 ) {

  current.requireRole(Role.ASSET_ADMIN);

  return response(
          find(id)
  );
 }

 @Transactional
 public AssetResponse update(
         UUID id,
         UpdateAssetRequest request
 ) {

  current.requireRole(Role.ASSET_ADMIN);

  Asset asset = find(id);

  if (
          assets
                  .existsByAssetTagIgnoreCaseAndIdNot(
                          request.assetTag(),
                          id
                  )
  ) {
   throw new ConflictException(
           "ASSET_TAG_EXISTS",
           "Another asset has this tag."
   );
  }

  validateWarranty(
          request.warrantyAvailable(),
          request.warrantyStartDate(),
          request.warrantyPeriodMonths()
  );

  asset.update(
          request.assetTag().trim(),
          request.name().trim(),
          request.category().trim(),

          StringUtils.blankToNull(
                  request.brand()
          ),

          StringUtils.blankToNull(
                  request.model()
          ),

          StringUtils.blankToNull(
                  request.serialNumber()
          ),

          StringUtils.blankToNull(
                  request.specifications()
          ),

          request.purchaseDate(),
          request.purchasePrice(),

          StringUtils.blankToNull(
                  request.supplier()
          ),

          request.warrantyAvailable(),
          request.warrantyStartDate(),
          request.warrantyPeriodMonths(),

          StringUtils.blankToNull(
                  request.warrantyProvider()
          ),

          StringUtils.blankToNull(
                  request.warrantyReference()
          )
  );

  return response(asset);
 }

 @Transactional
 public void delete(
         UUID id
 ) {

  current.requireRole(Role.ASSET_ADMIN);

  Asset asset = find(id);

  assets.delete(asset);
 }

 @Transactional(readOnly = true)
 public List<AssetResponse> myAssets() {

  var employee =
          current.requireRole(
                  Role.EMPLOYEE
          );

  return assignments
          .findAllByEmployeeIdAndReturnedAtIsNullOrderByAssignedAtDesc(
                  employee.getId()
          )
          .stream()
          .map(assignment ->
                  response(
                          find(
                                  assignment.getAssetId()
                          )
                  )
          )
          .toList();
 }

 private void validateWarranty(
         boolean warrantyAvailable,
         LocalDate startDate,
         Integer periodMonths
 ) {

  if (!warrantyAvailable) {
   return;
  }

  if (startDate == null) {
   throw new BadRequestException(
           "WARRANTY_START_REQUIRED",
           "Warranty start date is required when warranty is available."
   );
  }

  if (periodMonths == null) {
   throw new BadRequestException(
           "WARRANTY_PERIOD_REQUIRED",
           "Warranty period is required when warranty is available."
   );
  }

  if (periodMonths <= 0) {
   throw new BadRequestException(
           "INVALID_WARRANTY_PERIOD",
           "Warranty period must be greater than zero."
   );
  }
 }

 private Asset find(
         UUID id
 ) {

  return assets
          .findById(id)
          .orElseThrow(() ->
                  new ResourceNotFoundException(
                          "ASSET_NOT_FOUND",
                          "Asset was not found."
                  )
          );
 }

 private AssetResponse response(
         Asset asset
 ) {

  AssetAssignment assignment =
          assignments
                  .findFirstByAssetIdAndReturnedAtIsNull(
                          asset.getId()
                  )
                  .orElse(null);

  return new AssetResponse(
          asset.getId(),
          asset.getAssetTag(),
          asset.getName(),
          asset.getCategory(),

          asset.getBrand(),
          asset.getModel(),

          asset.getSerialNumber(),
          asset.getSpecifications(),

          asset.getPurchaseDate(),
          asset.getPurchasePrice(),
          asset.getSupplier(),

          asset.isWarrantyAvailable(),
          asset.getWarrantyStartDate(),
          asset.getWarrantyPeriodMonths(),
          asset.getWarrantyExpiryDate(),
          asset.getWarrantyProvider(),
          asset.getWarrantyReference(),

          warrantyStatus(asset),
          warrantyDaysRemaining(asset),

          asset.getStatus(),

          assignment == null
                  ? null
                  : assignment.getEmployeeName(),

          assignment == null
                  ? null
                  : assignment.getEmployeeId(),

          asset.getCreatedAt(),
          asset.getUpdatedAt()
  );
 }

 private String warrantyStatus(
         Asset asset
 ) {

  if (
          !asset.isWarrantyAvailable() ||
                  asset.getWarrantyExpiryDate() == null
  ) {
   return "NO_WARRANTY";
  }

  long days =
          ChronoUnit.DAYS.between(
                  LocalDate.now(),
                  asset.getWarrantyExpiryDate()
          );

  if (days < 0) {
   return "EXPIRED";
  }

  if (days <= 30) {
   return "EXPIRING_SOON";
  }

  return "ACTIVE";
 }

 private Long warrantyDaysRemaining(
         Asset asset
 ) {

  if (
          !asset.isWarrantyAvailable() ||
                  asset.getWarrantyExpiryDate() == null
  ) {
   return null;
  }

  return ChronoUnit.DAYS.between(
          LocalDate.now(),
          asset.getWarrantyExpiryDate()
  );
 }
}