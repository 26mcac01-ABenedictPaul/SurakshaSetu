package com.surakshasetu.test;

import java.util.List;
import java.util.Scanner;

import com.surakshasetu.exception.DuplicateUserException;
import com.surakshasetu.exception.InvalidCredentialsException;
import com.surakshasetu.exception.InvalidComplaintDataException;
import com.surakshasetu.model.Admin;
import com.surakshasetu.model.Complaint;
import com.surakshasetu.model.Officer;
import com.surakshasetu.model.User;
import com.surakshasetu.service.impl.AuthServiceImpl;
import com.surakshasetu.service.impl.ComplaintServiceImpl;
import com.surakshasetu.util.EmailService;
import com.surakshasetu.util.OtpService;

public class Main {

    static Scanner sc = new Scanner(System.in);
    static AuthServiceImpl authService = new AuthServiceImpl();
    static ComplaintServiceImpl complaintService = new ComplaintServiceImpl();
    static Admin admin = new Admin("admin", "admin123");

    public static void main(String[] args) {

        boolean running = true;

        while (running) {
            System.out.println("\n===== SurakshaSetu =====");
            System.out.println("1. Register (Public User)");
            System.out.println("2. Login (Public User)");
            System.out.println("3. Login (Police Officer)");
            System.out.println("4. Login (Admin)");
            System.out.println("5. Exit");
            System.out.print("Enter choice: ");
            String choice = sc.nextLine();

            switch (choice) {
                case "1": registerUser(); break;
                case "2": loginUser(); break;
                case "3": loginOfficer(); break;
                case "4": loginAdmin(); break;
                case "5":
                    running = false;
                    System.out.println("Exiting SurakshaSetu. Stay safe!");
                    break;
                default:
                    System.out.println("❌ Invalid choice.");
            }
        }

        sc.close();
    }

    // ---------------- PUBLIC USER ----------------

    static void registerUser() {
        System.out.println("\n--- Public User Registration ---");
        System.out.print("Enter username: ");
        String username = sc.nextLine();
        System.out.print("Enter password: ");
        String password = sc.nextLine();
        System.out.print("Enter phone number: ");
        String phone = sc.nextLine();
        System.out.print("Enter address: ");
        String address = sc.nextLine();
        System.out.print("Enter state (e.g., Karnataka): ");
        String state = sc.nextLine();
        System.out.print("Enter city (e.g., Bangalore): ");
        String city = sc.nextLine();
        System.out.print("Enter email: ");
        String email = sc.nextLine();

        try {
            User user = authService.registerUser(username, password, phone, address, state, city, email);
            System.out.println("✅ Registration successful! Welcome, " + user.getUsername() + ".");
            EmailService.sendWelcomeEmail(user.getEmail(), user.getUsername());
        } catch (DuplicateUserException e) {
            System.out.println("❌ " + e.getMessage());
        }
    }

    static void loginUser() {
        System.out.println("\n--- Public User Login ---");
        System.out.print("Username: ");
        String username = sc.nextLine();
        System.out.print("Password: ");
        String password = sc.nextLine();

        try {
            User user = authService.loginUser(username, password);
            System.out.println("✅ Welcome, " + user.getUsername() + "!");
            userMenu(user);
        } catch (InvalidCredentialsException e) {
            System.out.println("❌ " + e.getMessage());
            System.out.print("Forgot your password? (Y/N): ");
            String retry = sc.nextLine();
            if (retry.equalsIgnoreCase("Y")) {
                forgotPassword("1", username);
            }
        }
    }

    static void userMenu(User user) {
        System.out.println("\n--- User Menu ---");
        System.out.println("1. File a Complaint");
        System.out.println("2. Change Password");
        System.out.print("Enter choice: ");
        String choice = sc.nextLine();

        if (choice.equals("1")) {
            System.out.println("Select category: 1.Theft 2.Cybercrime 3.Assault 4.Missing Person 5.Harassment 6.Murder 7.Fraud");
            System.out.print("Choice: ");
            String catChoice = sc.nextLine();
            String category;
            switch (catChoice) {
                case "1": category = "Theft"; break;
                case "2": category = "Cybercrime"; break;
                case "3": category = "Assault"; break;
                case "4": category = "Missing Person"; break;
                case "5": category = "Harassment"; break;
                case "6": category = "Murder"; break;
                case "7": category = "Fraud"; break;
                default:
                    System.out.println("❌ Invalid category.");
                    return;
            }
            System.out.print("Describe the incident: ");
            String description = sc.nextLine();

            try {
                Complaint c = complaintService.fileComplaint(user.getUserId(), category, description);
                System.out.println("✅ Complaint filed successfully! Severity auto-detected: " + c.getSeverity());
                System.out.println(c);

                EmailService.sendComplaintConfirmation(user.getEmail(), user.getUsername(), c);

                Officer suggested = complaintService.suggestOfficer(c);
                if (suggested != null) {
                    System.out.println("📍 Nearest matching officer: " + suggested.getName() +
                            " (" + suggested.getStation() + ", " + suggested.getCity() + ") - " + suggested.getSpecialization());
                } else {
                    System.out.println("⚠️ No matching officer found nearby. Admin will assign manually.");
                }

            } catch (InvalidComplaintDataException e) {
                System.out.println("❌ " + e.getMessage());
            }

        } else if (choice.equals("2")) {
            System.out.print("Enter current password: ");
            String currentPassword = sc.nextLine();
            if (!currentPassword.equals(user.getPassword())) {
                System.out.println("❌ Incorrect current password.");
                return;
            }
            System.out.print("Enter new password: ");
            String newPassword = sc.nextLine();
            System.out.print("Confirm new password: ");
            String confirmPassword = sc.nextLine();
            if (!newPassword.equals(confirmPassword)) {
                System.out.println("❌ Passwords do not match.");
                return;
            }
            authService.updateUserPassword(user.getUsername(), newPassword);
            user.setPassword(newPassword);
            System.out.println("✅ Password changed successfully!");
        }
    }

    // ---------------- POLICE OFFICER ----------------

    static void loginOfficer() {
        System.out.println("\n--- Police Officer Login ---");
        System.out.print("Username: ");
        String username = sc.nextLine();
        System.out.print("Password: ");
        String password = sc.nextLine();

        try {
            Officer officer = authService.loginOfficer(username, password);
            System.out.println("✅ Welcome, Officer " + officer.getName() + "!");
            officerMenu(officer);
        } catch (InvalidCredentialsException e) {
            System.out.println("❌ " + e.getMessage());
            System.out.print("Forgot your password? (Y/N): ");
            String retry = sc.nextLine();
            if (retry.equalsIgnoreCase("Y")) {
                forgotPassword("2", username);
            }
        }
    }

    static void officerMenu(Officer officer) {
        System.out.println("\n--- Officer Menu ---");
        System.out.println("1. View Cases Assigned to Me (Pending Response)");
        System.out.println("2. Change Password");
        System.out.print("Enter choice: ");
        String choice = sc.nextLine();

        if (choice.equals("2")) {
            System.out.print("Enter current password: ");
            String currentPassword = sc.nextLine();
            if (!currentPassword.equals(officer.getPassword())) {
                System.out.println("❌ Incorrect current password.");
                return;
            }
            System.out.print("Enter new password: ");
            String newPassword = sc.nextLine();
            System.out.print("Confirm new password: ");
            String confirmPassword = sc.nextLine();
            if (!newPassword.equals(confirmPassword)) {
                System.out.println("❌ Passwords do not match.");
                return;
            }
            authService.updateOfficerPassword(officer.getUsername(), newPassword);
            officer.setPassword(newPassword);
            System.out.println("✅ Password changed successfully!");
            return;
        }

        List<Complaint> assignedToMe = complaintService.getAllComplaints().stream()
                .filter(c -> c.getStatus().equalsIgnoreCase("Assigned - Awaiting Officer Response"))
                .filter(c -> c.getAssignedOfficerId() != null && c.getAssignedOfficerId() == officer.getOfficerId())
                .toList();

        if (assignedToMe.isEmpty()) {
            System.out.println("No cases currently assigned to you for response.");
            return;
        }

        System.out.println("\n--- Cases Assigned to You ---");
        for (Complaint c : assignedToMe) {
            System.out.println(c);
        }

        System.out.print("Enter Complaint ID to respond to, or 0 to skip: ");
        String idInput = sc.nextLine();
        int id;
        try {
            id = Integer.parseInt(idInput);
        } catch (NumberFormatException e) {
            System.out.println("❌ Invalid input.");
            return;
        }

        if (id == 0) return;

        for (Complaint c : assignedToMe) {
            if (c.getComplaintId() == id) {
                System.out.print("Accept (A) or Decline (D) this case? ");
                String decision = sc.nextLine();
                if (decision.equalsIgnoreCase("A")) {
                    complaintService.acceptCase(c, officer);
                    c.setStatus("Waiting for Further Enquiry");
                    printCaseReceipt(c, officer);

                    User filer = authService.getAllUsers().stream()
                            .filter(u -> u.getUserId() == c.getUserId())
                            .findFirst()
                            .orElse(null);

                    if (filer != null) {
                        EmailService.sendCaseAcceptedEmail(filer.getEmail(), filer.getUsername(), c, officer);
                    }

                } else {
                    complaintService.declineCase(c, officer);
                    System.out.println("⚠️ Case declined. Sent back to admin for reassignment.");
                }
                return;
            }
        }
        System.out.println("❌ No complaint found with that ID.");
    }

    static void printCaseReceipt(Complaint c, Officer officer) {
        System.out.println("\n========================================");
        System.out.println("   ✅ CASE REGISTERED SUCCESSFULLY");
        System.out.println("========================================");
        System.out.println("Case ID              : " + c.getComplaintId());
        System.out.println("Category             : " + c.getCategory());
        System.out.println("Severity             : " + c.getSeverity());
        System.out.println("----------------------------------------");
        System.out.println("Police In-Charge     : " + officer.getName());
        System.out.println("Badge Number         : " + officer.getBadgeNumber());
        System.out.println("Station / Address    : " + officer.getStation() + ", " +
                officer.getCity() + ", " + officer.getState());
        System.out.println("Contact Number       : " +
                (officer.getContactNumber() != null ? officer.getContactNumber() : "N/A"));
        System.out.println("Specialization       : " + officer.getSpecialization());
        System.out.println("----------------------------------------");
        System.out.println("Status               : " + c.getStatus());
        System.out.println("Note                 : Your case has been accepted and is now");
        System.out.println("                        waiting for further enquiry by the officer.");
        System.out.println("========================================\n");
    }

    // ---------------- ADMIN ----------------

    static void loginAdmin() {
        System.out.println("\n--- Admin Login ---");
        System.out.print("Username: ");
        String username = sc.nextLine();
        System.out.print("Password: ");
        String password = sc.nextLine();

        if (username.equals(admin.getUsername()) && password.equals(admin.getPassword())) {
            System.out.println("✅ Welcome, Admin!");
            adminMenu();
        } else {
            System.out.println("❌ Invalid admin credentials.");
        }
    }

    static void adminMenu() {
        System.out.println("\n--- Admin Menu ---");
        System.out.println("1. View All Cases");
        System.out.println("2. Assign Unassigned Case to Officer");
        System.out.print("Enter choice: ");
        String choice = sc.nextLine();

        List<Complaint> allComplaints = complaintService.getAllComplaints();

        if (choice.equals("2")) {
            List<Complaint> unassigned = allComplaints.stream()
                    .filter(c -> c.getStatus().equalsIgnoreCase("Pending"))
                    .toList();

            if (unassigned.isEmpty()) {
                System.out.println("No unassigned cases right now.");
                return;
            }

            System.out.println("\n--- Unassigned Cases ---");
            for (Complaint c : unassigned) {
                System.out.println(c);
            }

            System.out.print("Enter Complaint ID to assign: ");
            String idInput = sc.nextLine();
            int id;
            try {
                id = Integer.parseInt(idInput);
            } catch (NumberFormatException e) {
                System.out.println("❌ Invalid input.");
                return;
            }

            Complaint target = unassigned.stream()
                    .filter(c -> c.getComplaintId() == id)
                    .findFirst()
                    .orElse(null);

            if (target == null) {
                System.out.println("❌ No unassigned complaint found with that ID.");
                return;
            }

            List<Officer> matches = complaintService.findMatchingOfficers(target);

            if (matches.isEmpty()) {
                System.out.println("⚠️ No matching officers found (state/city/specialization). Cannot assign.");
                return;
            }

            System.out.println("\n--- Matching Officers ---");
            for (int i = 0; i < matches.size(); i++) {
                Officer o = matches.get(i);
                System.out.println((i + 1) + ". " + o.getName() + " - " + o.getStation() +
                        " (" + o.getCity() + ", " + o.getState() + ") - " + o.getSpecialization());
            }

            System.out.print("Select officer number to assign: ");
            String officerChoice = sc.nextLine();
            int officerIndex;
            try {
                officerIndex = Integer.parseInt(officerChoice) - 1;
            } catch (NumberFormatException e) {
                System.out.println("❌ Invalid input.");
                return;
            }

            if (officerIndex < 0 || officerIndex >= matches.size()) {
                System.out.println("❌ Invalid selection.");
                return;
            }

            Officer selectedOfficer = matches.get(officerIndex);
            complaintService.assignOfficer(target, selectedOfficer);
            System.out.println("✅ Case #" + target.getComplaintId() + " assigned to Officer " +
                    selectedOfficer.getName() + ". Awaiting their response.");
            return;
        }

        if (allComplaints.isEmpty()) {
            System.out.println("No complaints registered yet.");
            return;
        }

        System.out.println("\n===== Admin Dashboard: All Registered Cases =====");

        List<User> allUsers = authService.getAllUsers();
        List<Officer> allOfficers = authService.getAllOfficers();

        for (Complaint c : allComplaints) {
            String filedBy = "Unknown";
            for (User u : allUsers) {
                if (u.getUserId() == c.getUserId()) {
                    filedBy = u.getUsername() + " (" + u.getCity() + ", " + u.getState() + ")";
                    break;
                }
            }

            String assignedTo = "Not yet assigned";
            if (c.getAssignedOfficerId() != null) {
                for (Officer o : allOfficers) {
                    if (o.getOfficerId() == c.getAssignedOfficerId()) {
                        assignedTo = "Officer " + o.getName() + " (" + o.getStation() + ")";
                        break;
                    }
                }
            }

            System.out.println("----------------------------------------");
            System.out.println("Complaint ID   : " + c.getComplaintId());
            System.out.println("Filed By       : " + filedBy);
            System.out.println("Category       : " + c.getCategory());
            System.out.println("Severity       : " + c.getSeverity());
            System.out.println("Status         : " + c.getStatus());
            System.out.println("Assigned To    : " + assignedTo);
        }
        System.out.println("----------------------------------------");

        long majorCount = allComplaints.stream().filter(c -> c.getSeverity().equalsIgnoreCase("Major")).count();
        long minorCount = allComplaints.stream().filter(c -> c.getSeverity().equalsIgnoreCase("Minor")).count();
        long criticalCount = allComplaints.stream().filter(c -> c.getSeverity().equalsIgnoreCase("Critical")).count();

        System.out.println("Summary → Critical: " + criticalCount + " | Major: " + majorCount + " | Minor: " + minorCount);
    }

    // ---------------- FORGOT PASSWORD ----------------

    static void forgotPassword(String presetType, String presetUsername) {
        System.out.println("\n--- Forgot Password ---");

        String type = presetType;
        if (type == null) {
            System.out.println("1. Public User");
            System.out.println("2. Police Officer");
            System.out.print("Select account type: ");
            type = sc.nextLine();
        }

        String username = presetUsername;
        if (username == null) {
            System.out.print("Enter your username: ");
            username = sc.nextLine();
        }

        String email = null;

        if (type.equals("1")) {
            User user = authService.findUserByUsername(username);
            if (user == null) {
                System.out.println("❌ No user found with that username.");
                return;
            }
            email = user.getEmail();
        } else if (type.equals("2")) {
            Officer officer = authService.findOfficerByUsername(username);
            if (officer == null) {
                System.out.println("❌ No officer found with that username.");
                return;
            }
            email = officer.getEmail();
        } else {
            System.out.println("❌ Invalid choice.");
            return;
        }

        if (email == null || email.trim().isEmpty()) {
            System.out.println("❌ No email registered for this account. Cannot send OTP. Please contact admin.");
            return;
        }

        String otp = OtpService.generateOtp(username);
        EmailService.sendOtp(email, otp);

        System.out.print("Enter the OTP sent to your email: ");
        String enteredOtp = sc.nextLine();

        if (!OtpService.verifyOtp(username, enteredOtp)) {
            System.out.println("❌ Invalid OTP. Password reset cancelled.");
            return;
        }

        System.out.println("✅ OTP verified!");
        System.out.print("Enter your new password: ");
        String newPassword = sc.nextLine();
        System.out.print("Confirm new password: ");
        String confirmPassword = sc.nextLine();

        if (!newPassword.equals(confirmPassword)) {
            System.out.println("❌ Passwords do not match. Please try again from the menu.");
            return;
        }

        if (type.equals("1")) {
            authService.updateUserPassword(username, newPassword);
        } else {
            authService.updateOfficerPassword(username, newPassword);
        }

        System.out.println("✅ Password updated successfully! You can now log in with your new password.");
    }
}