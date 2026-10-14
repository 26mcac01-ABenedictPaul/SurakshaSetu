package com.surakshasetu.service.impl;

import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.util.List;

import com.surakshasetu.exception.DuplicateUserException;
import com.surakshasetu.exception.InvalidCredentialsException;
import com.surakshasetu.model.Officer;
import com.surakshasetu.model.User;
import com.surakshasetu.service.AuthService;
import com.surakshasetu.util.JsonStorage;

public class AuthServiceImpl implements AuthService {

    private static final String USERS_FILE = "users.json";
    private static final String OFFICERS_FILE = "officers.json";

    private static final Type USER_LIST_TYPE = new TypeToken<List<User>>() {}.getType();
    private static final Type OFFICER_LIST_TYPE = new TypeToken<List<Officer>>() {}.getType();

    @Override
    public User registerUser(String username, String password, String phone, String address,
                              String state, String city, String email) throws DuplicateUserException {

        List<User> users = JsonStorage.readList(USERS_FILE, USER_LIST_TYPE);

        for (User u : users) {
            if (u.getUsername().equalsIgnoreCase(username)) {
                throw new DuplicateUserException("Username '" + username + "' is already taken.");
            }
        }

        int newId = users.stream().mapToInt(User::getUserId).max().orElse(0) + 1;

        User user = new User(username, password, phone, address, state, city, email);
        user.setUserId(newId);

        users.add(user);
        JsonStorage.writeList(USERS_FILE, users);

        return user;
    }

    @Override
    public User loginUser(String username, String password) throws InvalidCredentialsException {
        List<User> users = JsonStorage.readList(USERS_FILE, USER_LIST_TYPE);

        for (User u : users) {
            if (u.getUsername().equalsIgnoreCase(username)) {
                if (u.getPassword().equals(password)) {
                    return u;
                } else {
                    throw new InvalidCredentialsException("Incorrect password for username: " + username);
                }
            }
        }
        throw new InvalidCredentialsException("No user found with username: " + username);
    }

    @Override
    public Officer registerOfficer(String name, String badgeNumber, String station, String specialization,
                                    String state, String district, String city,
                                    String username, String password, String email, String contactNumber) throws DuplicateUserException {

        List<Officer> officers = JsonStorage.readList(OFFICERS_FILE, OFFICER_LIST_TYPE);

        for (Officer o : officers) {
            if (o.getUsername().equalsIgnoreCase(username)) {
                throw new DuplicateUserException("Officer username '" + username + "' is already taken.");
            }
        }

        int newId = officers.stream().mapToInt(Officer::getOfficerId).max().orElse(0) + 1;

        Officer officer = new Officer(name, badgeNumber, station, specialization, state, district, city, username, password, email, contactNumber);
        officer.setOfficerId(newId);

        officers.add(officer);
        JsonStorage.writeList(OFFICERS_FILE, officers);

        return officer;
    }

    @Override
    public Officer loginOfficer(String username, String password) throws InvalidCredentialsException {
        List<Officer> officers = JsonStorage.readList(OFFICERS_FILE, OFFICER_LIST_TYPE);

        for (Officer o : officers) {
            if (o.getUsername().equalsIgnoreCase(username)) {
                if (o.getPassword().equals(password)) {
                    return o;
                } else {
                    throw new InvalidCredentialsException("Incorrect password for officer: " + username);
                }
            }
        }
        throw new InvalidCredentialsException("No officer found with username: " + username);
    }

    // ---------------- FORGOT PASSWORD ----------------

    public User findUserByUsername(String username) {
        List<User> users = JsonStorage.readList(USERS_FILE, USER_LIST_TYPE);
        for (User u : users) {
            if (u.getUsername().equalsIgnoreCase(username)) {
                return u;
            }
        }
        return null;
    }

    public Officer findOfficerByUsername(String username) {
        List<Officer> officers = JsonStorage.readList(OFFICERS_FILE, OFFICER_LIST_TYPE);
        for (Officer o : officers) {
            if (o.getUsername().equalsIgnoreCase(username)) {
                return o;
            }
        }
        return null;
    }

    public void updateUserPassword(String username, String newPassword) {
        List<User> users = JsonStorage.readList(USERS_FILE, USER_LIST_TYPE);
        for (User u : users) {
            if (u.getUsername().equalsIgnoreCase(username)) {
                u.setPassword(newPassword);
                break;
            }
        }
        JsonStorage.writeList(USERS_FILE, users);
    }

    public void updateOfficerPassword(String username, String newPassword) {
        List<Officer> officers = JsonStorage.readList(OFFICERS_FILE, OFFICER_LIST_TYPE);
        for (Officer o : officers) {
            if (o.getUsername().equalsIgnoreCase(username)) {
                o.setPassword(newPassword);
                break;
            }
        }
        JsonStorage.writeList(OFFICERS_FILE, officers);
    }

    // ---------------- HELPERS FOR ADMIN DASHBOARD ----------------

    public List<User> getAllUsers() {
        return JsonStorage.readList(USERS_FILE, USER_LIST_TYPE);
    }

    public List<Officer> getAllOfficers() {
        return JsonStorage.readList(OFFICERS_FILE, OFFICER_LIST_TYPE);
    }
}