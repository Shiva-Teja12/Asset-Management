package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.auth.AuthResponse;
import com.enfec.one.assets.dto.auth.LoginRequest;
import com.enfec.one.assets.dto.auth.SignupRequest;
import com.enfec.one.assets.entity.AppUser;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.exception.ConflictException;
import com.enfec.one.assets.exception.UnauthorizedException;
import com.enfec.one.assets.repository.AppUserRepository;
import com.enfec.one.assets.util.StringUtils;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class AuthService {

 private static final String DEFAULT_MANAGER_EMAIL =
         "vikram@enfec.local";

 private final AppUserRepository users;
 private final PasswordEncoder encoder;
 private final AuditService audit;

 public AuthService(
         AppUserRepository users,
         PasswordEncoder encoder,
         AuditService audit
 ) {
  this.users = users;
  this.encoder = encoder;
  this.audit = audit;
 }

 @Transactional
 public AuthResponse login(
         LoginRequest request
 ) {

  AppUser user =
          users
                  .findByEmailIgnoreCase(
                          request.email()
                  )
                  .orElse(null);

  if (user == null) {

   audit.logFailedLogin(
           request.email(),
           "Login failed - user was not found."
   );

   throw new UnauthorizedException(
           "INVALID_LOGIN",
           "Invalid email or password."
   );
  }

  if (
          !encoder.matches(
                  request.password(),
                  user.getPasswordHash()
          )
  ) {

   audit.logFailure(
           user,
           "LOGIN_FAILED",
           "SECURITY",
           "USER",
           user.getId().toString(),
           user.getEmail(),
           "Login failed - invalid password."
   );

   throw new UnauthorizedException(
           "INVALID_LOGIN",
           "Invalid email or password."
   );
  }

  user.setAuthToken(
          UUID.randomUUID().toString()
  );

  audit.log(
          user,
          "LOGIN",
          "SECURITY",
          "USER",
          user.getId().toString(),
          user.getEmail(),
          null,
          null,
          null,
          "Successful login"
  );

  return response(user);
 }

 @Transactional
 public AuthResponse signup(
         SignupRequest request
 ) {

  if (
          users.existsByEmailIgnoreCase(
                  request.email()
          )
  ) {
   throw new ConflictException(
           "EMAIL_EXISTS",
           "Email already exists."
   );
  }

  /*
   * Every employee currently reports to Vikram.
   *
   * Resolve the manager BEFORE creating/saving the
   * employee so that manager_id is never left null.
   */
  AppUser manager =
          users
                  .findByEmailIgnoreCase(
                          DEFAULT_MANAGER_EMAIL
                  )
                  .filter(user ->
                          user.getRole()
                                  == Role.MANAGER
                  )
                  .orElseThrow(() ->
                          new ResponseStatusException(
                                  HttpStatus.CONFLICT,
                                  "Default manager Vikram is not configured."
                          )
                  );

  String code =
          "EMP-"
                  + String.format(
                  "%04d",
                  users.count() + 1
          );

  AppUser user =
          new AppUser(
                  request.name().trim(),
                  request.email().trim(),
                  encoder.encode(
                          request.password()
                  ),
                  Role.EMPLOYEE,
                  code,
                  StringUtils.blankToNull(
                          request.department()
                  )
          );

  /*
   * Permanent manager assignment.
   *
   * This writes Vikram's UUID into:
   *
   * app_users.manager_id
   */
  user.setManager(manager);

  user.setAuthToken(
          UUID.randomUUID().toString()
  );

  users.save(user);

  audit.logWithEmployee(
          user,
          "EMPLOYEE_SIGNUP",
          "EMPLOYEE",
          "USER",
          user.getId().toString(),
          user.getEmail(),
          null,
          user.getName(),
          null,
          Role.EMPLOYEE.name(),
          "Employee account created: "
                  + user.getEmployeeCode()
  );

  return response(user);
 }

 private AuthResponse response(
         AppUser user
 ) {

  return new AuthResponse(
          user.getAuthToken(),
          user.getId(),
          user.getName(),
          user.getEmail(),
          user.getRole(),
          user.getEmployeeCode(),
          user.getDepartment()
  );
 }
}