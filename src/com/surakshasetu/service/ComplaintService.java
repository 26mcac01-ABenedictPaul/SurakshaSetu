package com.surakshasetu.service;

import java.util.List;
import com.surakshasetu.exception.InvalidComplaintDataException;
import com.surakshasetu.model.Complaint;
import com.surakshasetu.model.Officer;

public interface ComplaintService {

    Complaint fileComplaint(int userId, String category, String description)
            throws InvalidComplaintDataException;

    Officer suggestOfficer(Complaint complaint);

    List<Officer> findMatchingOfficers(Complaint complaint);

    void assignOfficer(Complaint complaint, Officer officer);

    void acceptCase(Complaint complaint, Officer officer);

    void declineCase(Complaint complaint, Officer officer);

    List<Complaint> getAllComplaints();

    List<Complaint> getPendingComplaints();

    List<Complaint> getComplaintsBySeverity(String severity);
}