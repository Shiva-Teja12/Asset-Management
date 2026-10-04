package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.employee.EmployeeResponse;
import com.enfec.one.assets.dto.employee.UpdateEmployeeDepartmentRequest;
import com.enfec.one.assets.dto.secondarydevice.CreateSecondaryDeviceRequest;
import com.enfec.one.assets.dto.secondarydevice.SecondaryDeviceRequestResponse;
import com.enfec.one.assets.entity.AppUser;
import com.enfec.one.assets.entity.Asset;
import com.enfec.one.assets.entity.AssetAssignment;
import com.enfec.one.assets.entity.SecondaryDeviceRequest;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.enums.SecondaryDeviceRequestStatus;
import com.enfec.one.assets.exception.ResourceNotFoundException;
import com.enfec.one.assets.repository.AppUserRepository;
import com.enfec.one.assets.repository.AssetAssignmentRepository;
import com.enfec.one.assets.repository.AssetRepository;
import com.enfec.one.assets.repository.SecondaryDeviceRequestRepository;
import com.enfec.one.assets.security.CurrentUser;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.UUID;

@Service
public class EmployeeService {

 private final AppUserRepository users;
 private final CurrentUser current;
 private final AuditService audit;

 private final SecondaryDeviceRequestRepository
         secondaryDeviceRequestRepository;

 private final AssetAssignmentRepository
         assetAssignmentRepository;

 private final AssetRepository assetRepository;


 public EmployeeService(
         AppUserRepository users,
         CurrentUser current,
         AuditService audit,
         SecondaryDeviceRequestRepository secondaryDeviceRequestRepository,
         AssetAssignmentRepository assetAssignmentRepository,
         AssetRepository assetRepository
 ) {

  this.users = users;
  this.current = current;
  this.audit = audit;

  this.secondaryDeviceRequestRepository =
          secondaryDeviceRequestRepository;

  this.assetAssignmentRepository =
          assetAssignmentRepository;

  this.assetRepository =
          assetRepository;
 }


 /*
  * =========================================================
  * ALL EMPLOYEES
  * =========================================================
  */

 @Transactional(readOnly = true)
 public List<EmployeeResponse> all() {

  current.requireRole(
          Role.ASSET_ADMIN
  );

  return users
          .findAllByRoleOrderByNameAsc(
                  Role.EMPLOYEE
          )
          .stream()
          .map(this::response)
          .toList();
 }


 /*
  * =========================================================
  * CURRENT EMPLOYEE
  * =========================================================
  *
  * The authenticated AppUser stored by Spring Security
  * can be detached from Hibernate.
  *
  * We reload the employee inside this transaction so that
  * the manager relationship can be accessed safely.
  */

 @Transactional(readOnly = true)
 public EmployeeResponse me() {

  AppUser authenticatedUser =
          current.requireRole(
                  Role.EMPLOYEE
          );

  AppUser employee =
          findManagedEmployee(
                  authenticatedUser.getId()
          );

  return response(
          employee
  );
 }


 /*
  * =========================================================
  * UPDATE EMPLOYEE DEPARTMENT
  * =========================================================
  */

 @Transactional
 public EmployeeResponse updateDepartment(
         UUID employeeId,
         UpdateEmployeeDepartmentRequest request
 ) {

  AppUser admin =
          current.requireRole(
                  Role.ASSET_ADMIN
          );

  AppUser employee =
          users
                  .findById(
                          employeeId
                  )
                  .filter(user ->
                          user.getRole()
                                  == Role.EMPLOYEE
                  )
                  .orElseThrow(() ->
                          new ResourceNotFoundException(
                                  "EMPLOYEE_NOT_FOUND",
                                  "Employee was not found."
                          )
                  );

  String oldDepartment =
          employee.getDepartment();

  String department =
          request
                  .department()
                  .trim();

  employee.setDepartment(
          department
  );

  audit.logWithEmployee(
          admin,
          "UPDATE_EMPLOYEE_DEPARTMENT",
          "EMPLOYEE",
          "USER",
          employee.getId().toString(),
          employee.getName(),
          null,
          employee.getName(),
          oldDepartment,
          department,
          "Department updated for "
                  + employee.getName()
                  + " ("
                  + employee.getEmployeeCode()
                  + ")"
  );

  return response(
          employee
  );
 }


 /*
  * =========================================================
  * CREATE SECONDARY DEVICE REQUEST
  * =========================================================
  *
  * The employee ID and manager ID are not supplied by
  * the frontend.
  *
  * They are obtained from the authenticated employee.
  */

 @Transactional
 public SecondaryDeviceRequestResponse
 createSecondaryDeviceRequest(
         CreateSecondaryDeviceRequest request
 ) {

  AppUser authenticatedUser =
          current.requireRole(
                  Role.EMPLOYEE
          );


  /*
   * Reload employee inside the current Hibernate
   * transaction.
   */
  AppUser employee =
          findManagedEmployee(
                  authenticatedUser.getId()
          );


  /*
   * Manager comes directly from app_users.manager_id.
   */
  AppUser manager =
          employee.getManager();


  if (manager == null) {

   throw new ResponseStatusException(
           HttpStatus.CONFLICT,
           "No manager is assigned to your employee account."
   );
  }


  if (manager.getRole() != Role.MANAGER) {

   throw new ResponseStatusException(
           HttpStatus.CONFLICT,
           "The manager assigned to your account is invalid."
   );
  }


  String category =
          request
                  .getCategory()
                  .trim();

  String reason =
          request
                  .getReason()
                  .trim();


  /*
   * Prevent duplicate active requests for the same
   * employee and category.
   */
  boolean duplicateActiveRequest =
          secondaryDeviceRequestRepository
                  .existsByEmployee_IdAndCategoryIgnoreCaseAndStatusIn(
                          employee.getId(),
                          category,
                          EnumSet.of(

                                  SecondaryDeviceRequestStatus
                                          .PENDING_MANAGER_APPROVAL,

                                  SecondaryDeviceRequestStatus
                                          .MANAGER_APPROVED,

                                  SecondaryDeviceRequestStatus
                                          .PENDING_ASSIGNMENT,

                                  SecondaryDeviceRequestStatus
                                          .PENDING_PROCUREMENT
                          )
                  );


  if (duplicateActiveRequest) {

   throw new ResponseStatusException(
           HttpStatus.CONFLICT,
           "You already have an active request for this device category."
   );
  }


  SecondaryDeviceRequest secondaryRequest =
          new SecondaryDeviceRequest(
                  employee,
                  manager,
                  category,
                  reason
          );


  SecondaryDeviceRequest saved =
          secondaryDeviceRequestRepository.save(
                  secondaryRequest
          );


  return secondaryDeviceRequestResponse(
          saved
  );
 }


 /*
  * =========================================================
  * MY SECONDARY DEVICE REQUESTS
  * =========================================================
  */

 @Transactional(readOnly = true)
 public List<SecondaryDeviceRequestResponse>
 mySecondaryDeviceRequests() {

  AppUser authenticatedUser =
          current.requireRole(
                  Role.EMPLOYEE
          );


  AppUser employee =
          findManagedEmployee(
                  authenticatedUser.getId()
          );


  return secondaryDeviceRequestRepository
          .findAllByEmployee_IdOrderByRequestedAtDesc(
                  employee.getId()
          )
          .stream()
          .map(
                  this::secondaryDeviceRequestResponse
          )
          .toList();
 }


 /*
  * =========================================================
  * SECONDARY DEVICE REQUEST RESPONSE
  * =========================================================
  */

 private SecondaryDeviceRequestResponse
 secondaryDeviceRequestResponse(
         SecondaryDeviceRequest request
 ) {

  SecondaryDeviceRequestResponse response =
          new SecondaryDeviceRequestResponse();


  /*
   * Request ID
   */
  response.setId(
          request.getId()
  );


  /*
   * =====================================================
   * EMPLOYEE
   * =====================================================
   */

  AppUser employee =
          request.getEmployee();


  if (employee != null) {

   response.setEmployeeId(
           employee.getId()
   );

   response.setEmployeeName(
           employee.getName()
   );

   response.setEmployeeCode(
           employee.getEmployeeCode()
   );

   response.setDepartment(
           employee.getDepartment()
   );


   response.setCurrentAssets(
           getCurrentAssets(
                   employee.getId()
           )
   );
  }


  /*
   * =====================================================
   * MANAGER
   * =====================================================
   */

  AppUser manager =
          request.getManager();


  if (manager != null) {

   response.setManagerId(
           manager.getId()
   );

   response.setManagerName(
           manager.getName()
   );
  }


  /*
   * =====================================================
   * REQUEST DETAILS
   * =====================================================
   */

  response.setCategory(
          request.getCategory()
  );

  response.setReason(
          request.getReason()
  );

  response.setStatus(
          request.getStatus()
  );


  /*
   * =====================================================
   * MANAGER DECISION
   * =====================================================
   */

  response.setManagerComment(
          request.getManagerComment()
  );


  AppUser reviewedBy =
          request.getReviewedBy();


  if (reviewedBy != null) {

   response.setReviewedById(
           reviewedBy.getId()
   );

   response.setReviewedBy(
           reviewedBy.getName()
   );
  }


  response.setReviewedAt(
          request.getReviewedAt()
  );


  /*
   * =====================================================
   * ASSIGNED ASSET
   * =====================================================
   */

  Asset assignedAsset =
          request.getAssignedAsset();


  if (assignedAsset != null) {

   response.setAssignedAssetId(
           assignedAsset.getId()
   );

   response.setAssignedAssetTag(
           assignedAsset.getAssetTag()
   );

   response.setAssignedAssetName(
           assignedAsset.getName()
   );
  }


  /*
   * =====================================================
   * DATES
   * =====================================================
   */

  response.setRequestedAt(
          request.getRequestedAt()
  );

  response.setFulfilledAt(
          request.getFulfilledAt()
  );

  response.setCreatedAt(
          request.getCreatedAt()
  );

  response.setUpdatedAt(
          request.getUpdatedAt()
  );


  return response;
 }


 /*
  * =========================================================
  * CURRENT ASSETS OF EMPLOYEE
  * =========================================================
  */

 private List<
         SecondaryDeviceRequestResponse.CurrentAsset
         >
 getCurrentAssets(
         UUID employeeId
 ) {

  List<AssetAssignment> assignments =
          assetAssignmentRepository
                  .findAllByEmployeeIdAndReturnedAtIsNullOrderByAssignedAtDesc(
                          employeeId
                  );


  List<
          SecondaryDeviceRequestResponse.CurrentAsset
          > result =
          new ArrayList<>();


  for (
          AssetAssignment assignment
          : assignments
  ) {

   Asset asset =
           assetRepository
                   .findById(
                           assignment.getAssetId()
                   )
                   .orElse(
                           null
                   );


   if (asset == null) {
    continue;
   }


   SecondaryDeviceRequestResponse.CurrentAsset
           currentAsset =
           new SecondaryDeviceRequestResponse.CurrentAsset(
                   asset.getId(),
                   asset.getAssetTag(),
                   asset.getName(),
                   asset.getCategory(),
                   asset.getStatus().name()
           );


   result.add(
           currentAsset
   );
  }


  return result;
 }


 /*
  * =========================================================
  * EMPLOYEE RESPONSE
  * =========================================================
  *
  * EmployeeResponse now contains 8 fields:
  *
  * 1. id
  * 2. employeeCode
  * 3. name
  * 4. email
  * 5. department
  * 6. managerId
  * 7. managerName
  * 8. managerEmail
  */

 private EmployeeResponse response(
         AppUser user
 ) {

  AppUser manager =
          user.getManager();


  UUID managerId =
          manager != null
                  ? manager.getId()
                  : null;


  String managerName =
          manager != null
                  ? manager.getName()
                  : null;


  String managerEmail =
          manager != null
                  ? manager.getEmail()
                  : null;


  return new EmployeeResponse(
          user.getId(),
          user.getEmployeeCode(),
          user.getName(),
          user.getEmail(),
          user.getDepartment(),
          managerId,
          managerName,
          managerEmail
  );
 }


 /*
  * =========================================================
  * FIND MANAGED EMPLOYEE
  * =========================================================
  *
  * Reloading the employee from the repository while the
  * transaction is active prevents the manager relationship
  * from causing LazyInitializationException.
  */

 private AppUser findManagedEmployee(
         UUID employeeId
 ) {

  return users
          .findById(
                  employeeId
          )
          .filter(user ->
                  user.getRole()
                          == Role.EMPLOYEE
          )
          .orElseThrow(() ->
                  new ResourceNotFoundException(
                          "EMPLOYEE_NOT_FOUND",
                          "Employee was not found."
                  )
          );
 }
}