package com.surakshasetu.exception;

public class InvalidComplaintDataException extends Exception {

    private static final long serialVersionUID = 1L;

    public InvalidComplaintDataException(String message) {
        super(message);
    }
}