package com.enfec.one.assets.controller;

import com.enfec.one.assets.dto.asset.AssetResponse;
import com.enfec.one.assets.dto.employee.EmployeeResponse;
import com.enfec.one.assets.dto.employee.UpdateEmployeeDepartmentRequest;
import com.enfec.one.assets.dto.secondarydevice.CreateSecondaryDeviceRequest;
import com.enfec.one.assets.dto.secondarydevice.SecondaryDeviceRequestResponse;
import com.enfec.one.assets.service.AssetService;
import com.enfec.one.assets.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employees")
public class EmployeeController {

 private final EmployeeService employees;
 private final AssetService assets;

 public EmployeeController(
         EmployeeService employees,
         AssetService assets
 ) {
  this.employees = employees;
  this.assets = assets;
 }


 /*
  * =========================================================
  * EXISTING - ALL EMPLOYEES
  * =========================================================
  *
  * Asset Admin only.
  */

 @GetMapping
 public List<EmployeeResponse> all() {

  return employees.all();
 }


 /*
  * =========================================================
  * EXISTING - CURRENT EMPLOYEE PROFILE
  * =========================================================
  */

 @GetMapping("/me")
 public EmployeeResponse me() {

  return employees.me();
 }


 /*
  * =========================================================
  * EXISTING - CURRENT EMPLOYEE ASSETS
  * =========================================================
  */

 @GetMapping("/me/assets")
 public List<AssetResponse> mine() {

  return assets.myAssets();
 }


 /*
  * =========================================================
  * NEW - REQUEST SECONDARY DEVICE
  * =========================================================
  *
  * POST
  * /api/v1/employees/me/secondary-device-requests
  *
  * Example:
  *
  * {
  *   "category": "Monitor",
  *   "reason": "Required for development and testing work"
  * }
  */

 @PostMapping(
         "/me/secondary-device-requests"
 )
 @ResponseStatus(HttpStatus.CREATED)
 public SecondaryDeviceRequestResponse
 createSecondaryDeviceRequest(
         @Valid
         @RequestBody
         CreateSecondaryDeviceRequest request
 ) {

  return employees
          .createSecondaryDeviceRequest(
                  request
          );
 }


 /*
  * =========================================================
  * NEW - MY SECONDARY DEVICE REQUESTS
  * =========================================================
  *
  * GET
  * /api/v1/employees/me/secondary-device-requests
  */

 @GetMapping(
         "/me/secondary-device-requests"
 )
 public List<SecondaryDeviceRequestResponse>
 mySecondaryDeviceRequests() {

  return employees
          .mySecondaryDeviceRequests();
 }


 /*
  * =========================================================
  * EXISTING - UPDATE DEPARTMENT
  * =========================================================
  */

 @PatchMapping(
         "/{employeeId}/department"
 )
 public EmployeeResponse updateDepartment(
         @PathVariable UUID employeeId,
         @Valid
         @RequestBody
         UpdateEmployeeDepartmentRequest request
 ) {

  return employees.updateDepartment(
          employeeId,
          request
  );
 }
}