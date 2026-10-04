package com.enfec.one.assets.exception;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import java.time.Instant;
import java.util.Map;
@RestControllerAdvice
public class GlobalExceptionHandler {
 @ExceptionHandler(ApiException.class) ResponseEntity<?> api(ApiException e){return ResponseEntity.status(e.getStatus()).body(Map.of("timestamp",Instant.now(),"status",e.getStatus().value(),"code",e.getCode(),"message",e.getMessage()));}
 @ExceptionHandler(MethodArgumentNotValidException.class) ResponseEntity<?> validation(MethodArgumentNotValidException e){return ResponseEntity.badRequest().body(Map.of("timestamp",Instant.now(),"status",400,"code","VALIDATION_ERROR","message","Invalid request data."));}
 @ExceptionHandler(HttpMessageNotReadableException.class) ResponseEntity<?> unreadable(HttpMessageNotReadableException e){return ResponseEntity.badRequest().body(Map.of("timestamp",Instant.now(),"status",400,"code","INVALID_REQUEST","message","Invalid request body or unsupported enum value."));}
}
