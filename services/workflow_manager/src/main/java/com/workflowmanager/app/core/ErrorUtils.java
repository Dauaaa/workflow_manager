package com.workflowmanager.app.core;

import java.io.Serializable;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

// TODO: maybe find a way to create better response with problem library
public class ErrorUtils {
  public static ResponseStatusException notFound() {
    return new ResponseStatusException(HttpStatus.NOT_FOUND);
  }

  public static ResponseStatusException notFoundById(Class<?> clazz, Serializable id) {
    return new ResponseStatusException(
        HttpStatus.NOT_FOUND, String.format("%s[id:%s] not found.", clazz.getSimpleName(), id));
  }

  public static <T> T onEmpty404(Optional<T> v) {
    return v.orElseThrow(() -> ErrorUtils.notFound());
  }

  public static <T> T onEmpty404(Optional<T> v, Serializable id) {
    // TODO: send T class
    return v.orElseThrow(() -> ErrorUtils.notFoundById(v.getClass(), id));
  }

  public static <T> void assertEq(T lfs, T rhs) throws ResponseStatusException {
    if (lfs == null && rhs == null) {
      return;
    }

    if (lfs == null || rhs == null || !lfs.equals(rhs)) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  public static <T> void assertEq(T lfs, T rhs, String message) throws ResponseStatusException {
    if (lfs == null && rhs == null) {
      return;
    }

    if (lfs == null || rhs == null || !lfs.equals(rhs)) {
      System.out.println(message);
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, message);
    }
  }

  public static <T> void assertNeq(T lfs, T rhs) throws ResponseStatusException {
    if (lfs == null && rhs != null || lfs != null && rhs == null) {
      return;
    }

    if (lfs == null || lfs.equals(rhs)) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  public static <T> void assertNeq(T lfs, T rhs, String message) throws ResponseStatusException {
    if (lfs == null && rhs != null || lfs != null && rhs == null) {
      return;
    }

    if (lfs == null || lfs.equals(rhs)) {
      System.out.println(message);
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, message);
    }
  }

  public static <T> void serverAssertEq(T lfs, T rhs) throws ResponseStatusException {
    if (lfs == null && rhs == null) {
      return;
    }

    if (lfs == null || rhs == null || !lfs.equals(rhs)) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  public static <T> void serverAssertEq(T lfs, T rhs, String message)
      throws ResponseStatusException {
    if (lfs == null && rhs == null) {
      return;
    }

    if (lfs == null || rhs == null || !lfs.equals(rhs)) {
      System.out.println(message);
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, message);
    }
  }

  public static <T> void serverAssertNeq(T lfs, T rhs) throws ResponseStatusException {
    if (lfs == null && rhs != null || lfs != null && rhs == null) {
      return;
    }

    if (lfs == null || lfs.equals(rhs)) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  public static <T> void serverAssertNeq(T lfs, T rhs, String message)
      throws ResponseStatusException {
    if (lfs == null && rhs != null || lfs != null && rhs == null) {
      return;
    }

    if (lfs == null || lfs.equals(rhs)) {
      System.out.println(message);
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, message);
    }
  }
}
