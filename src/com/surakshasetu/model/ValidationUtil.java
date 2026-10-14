package com.surakshasetu.model;

public class ValidationUtil {

    public static boolean isValidUsername(String username) {
        return username != null && username.trim().length() >= 4;
    }

    public static boolean isValidPassword(String password) {
        // at least 6 chars, at least one digit
        return password != null
                && password.length() >= 6
                && password.matches(".*\\d.*");
    }

    public static boolean isValidPhone(String phone) {
        return phone != null && phone.matches("\\d{10}");
    }

    public static boolean isNotEmpty(String value) {
        return value != null && !value.trim().isEmpty();
    }
}