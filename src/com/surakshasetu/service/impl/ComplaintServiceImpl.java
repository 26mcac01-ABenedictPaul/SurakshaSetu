package com.surakshasetu.service.impl;

import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.surakshasetu.exception.InvalidComplaintDataException;
import com.surakshasetu.model.Complaint;
import com.surakshasetu.model.Officer;
import com.surakshasetu.model.SeverityClassifier;
import com.surakshasetu.model.User;
import com.surakshasetu.model.ValidationUtil;
import com.surakshasetu.service.ComplaintService;
import com.surakshasetu.util.JsonStorage;

public class ComplaintServiceImpl implements ComplaintService {

    private static final String COMPLAINTS_FILE = "complaints.json";
    private static final String OFFICERS_FILE = "officers.json";
    private static final String USERS_FILE = "users.json";

    private static final Type COMPLAINT_LIST_TYPE = new TypeToken<List<Complaint>>() {}.getType();
    private static final Type OFFICER_LIST_TYPE = new TypeToken<List<Officer>>() {}.getType();
    private static final Type USER_LIST_TYPE = new TypeToken<List<User>>() {}.getType();

    @Override
    public Complaint fileComplaint(int userId, String category, String description)
            throws InvalidComplaintDataException {

        if (!ValidationUtil.isNotEmpty(category)) {
            throw new InvalidComplaintDataException("Category cannot be empty.");
        }
        if (!ValidationUtil.isNotEmpty(description) || description.trim().length() < 10) {
            throw new InvalidComplaintDataException("Description must be at least 10 characters long.");
        }

        String severity = SeverityClassifier.classify(category, description);

        List<Complaint> complaints = JsonStorage.readList(COMPLAINTS_FILE, COMPLAINT_LIST_TYPE);

        int newId = complaints.stream().mapToInt(Complaint::getComplaintId).max().orElse(0) + 1;

        Complaint complaint = new Complaint(userId, category, severity, description);
        complaint.setComplaintId(newId);
        complaint.setDateFiled(LocalDateTime.now());

        complaints.add(complaint);
        JsonStorage.writeList(COMPLAINTS_FILE, complaints);

        return complaint;
    }

    @Override
    public Officer suggestOfficer(Complaint complaint) {
        List<Officer> matches = findMatchingOfficers(complaint);
        return matches.isEmpty() ? null : matches.get(0);
    }

    @Override
    public List<Officer> findMatchingOfficers(Complaint complaint) {
        List<User> users = JsonStorage.readList(USERS_FILE, USER_LIST_TYPE);
        List<Officer> officers = JsonStorage.readList(OFFICERS_FILE, OFFICER_LIST_TYPE);

        User filer = users.stream()
                .filter(u -> u.getUserId() == complaint.getUserId())
                .findFirst()
                .orElse(null);

        if (filer == null) {
            return new ArrayList<>();
        }

        List<Integer> declined = complaint.getDeclinedByOfficerIds();

        List<Officer> exactMatches = officers.stream()
                .filter(o -> o.getState().equalsIgnoreCase(filer.getState()))
                .filter(o -> o.getCity().equalsIgnoreCase(filer.getCity()))
                .filter(o -> o.getSpecialization().equalsIgnoreCase(complaint.getCategory()))
                .filter(o -> !declined.contains(o.getOfficerId()))
                .collect(Collectors.toList());

        if (!exactMatches.isEmpty()) {
            return exactMatches;
        }

        return officers.stream()
                .filter(o -> o.getState().equalsIgnoreCase(filer.getState()))
                .filter(o -> o.getSpecialization().equalsIgnoreCase(complaint.getCategory()))
                .filter(o -> !declined.contains(o.getOfficerId()))
                .collect(Collectors.toList());
    }

    @Override
    public void assignOfficer(Complaint complaint, Officer officer) {
        List<Complaint> complaints = JsonStorage.readList(COMPLAINTS_FILE, COMPLAINT_LIST_TYPE);

        for (Complaint c : complaints) {
            if (c.getComplaintId() == complaint.getComplaintId()) {
                c.setAssignedOfficerId(officer.getOfficerId());
                c.setStatus("Assigned - Awaiting Officer Response");
                break;
            }
        }
        JsonStorage.writeList(COMPLAINTS_FILE, complaints);

        complaint.setAssignedOfficerId(officer.getOfficerId());
        complaint.setStatus("Assigned - Awaiting Officer Response");
    }

    @Override
    public void acceptCase(Complaint complaint, Officer officer) {
        List<Complaint> complaints = JsonStorage.readList(COMPLAINTS_FILE, COMPLAINT_LIST_TYPE);

        for (Complaint c : complaints) {
            if (c.getComplaintId() == complaint.getComplaintId()) {
                c.setAssignedOfficerId(officer.getOfficerId());
                c.setStatus("Under Investigation");
                break;
            }
        }
        JsonStorage.writeList(COMPLAINTS_FILE, complaints);

        complaint.setAssignedOfficerId(officer.getOfficerId());
        complaint.setStatus("Under Investigation");
    }

    @Override
    public void declineCase(Complaint complaint, Officer officer) {
        List<Complaint> complaints = JsonStorage.readList(COMPLAINTS_FILE, COMPLAINT_LIST_TYPE);

        for (Complaint c : complaints) {
            if (c.getComplaintId() == complaint.getComplaintId()) {
                c.setAssignedOfficerId(null);
                c.setStatus("Pending");
                if (!c.getDeclinedByOfficerIds().contains(officer.getOfficerId())) {
                    c.getDeclinedByOfficerIds().add(officer.getOfficerId());
                }
                break;
            }
        }
        JsonStorage.writeList(COMPLAINTS_FILE, complaints);

        complaint.setAssignedOfficerId(null);
        complaint.setStatus("Pending");
        if (!complaint.getDeclinedByOfficerIds().contains(officer.getOfficerId())) {
            complaint.getDeclinedByOfficerIds().add(officer.getOfficerId());
        }
    }

    @Override
    public List<Complaint> getAllComplaints() {
        return JsonStorage.readList(COMPLAINTS_FILE, COMPLAINT_LIST_TYPE);
    }

    @Override
    public List<Complaint> getPendingComplaints() {
        return getAllComplaints().stream()
                .filter(c -> c.getStatus().equalsIgnoreCase("Pending"))
                .collect(Collectors.toList());
    }

    @Override
    public List<Complaint> getComplaintsBySeverity(String severity) {
        return getAllComplaints().stream()
                .filter(c -> c.getSeverity().equalsIgnoreCase(severity))
                .collect(Collectors.toList());
    }
}