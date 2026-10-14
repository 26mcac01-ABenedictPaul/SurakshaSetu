package com.surakshasetu.service;

import com.surakshasetu.exception.DuplicateUserException;
import com.surakshasetu.exception.InvalidCredentialsException;
import com.surakshasetu.model.User;
import com.surakshasetu.model.Officer;

public interface AuthService {

    User registerUser(String username, String password, String phone, String address,
                       String state, String city, String email)
            throws DuplicateUserException;

    User loginUser(String username, String password)
            throws InvalidCredentialsException;

    Officer registerOfficer(String name, String badgeNumber, String station, String specialization,
                             String state, String district, String city,
                             String username, String password, String email, String contactNumber)
            throws DuplicateUserException;

    Officer loginOfficer(String username, String password)
            throws InvalidCredentialsException;
}