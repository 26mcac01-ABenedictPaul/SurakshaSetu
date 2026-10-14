package com.surakshasetu.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class Complaint {

    private int complaintId;
    private int userId;
    private String category;
    private String severity;
    private String description;
    private String status;
    private LocalDateTime dateFiled;
    private Integer assignedOfficerId;
    private List<Integer> declinedByOfficerIds = new ArrayList<>();

    // ---- extra case details (older records simply leave these empty) ----
    /** incidentDate, incidentTime, platform, identifiers, location, city, state, jurisdiction */
    private Map<String, String> details = new LinkedHashMap<>();
    /** amountLost, paymentMethod, bankName, transactionRef, transactionDate, beneficiary */
    private Map<String, String> financial = new LinkedHashMap<>();
    private List<EvidenceFile> evidence = new ArrayList<>();

    public Complaint() {
    }

    public Complaint(int userId, String category, String severity, String description) {
        this.userId = userId;
        this.category = category;
        this.severity = severity;
        this.description = description;
        this.status = "Pending";
        this.dateFiled = LocalDateTime.now();
    }

    public int getComplaintId() { return complaintId; }
    public void setComplaintId(int complaintId) { this.complaintId = complaintId; }

    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getDateFiled() { return dateFiled; }
    public void setDateFiled(LocalDateTime dateFiled) { this.dateFiled = dateFiled; }

    public Integer getAssignedOfficerId() { return assignedOfficerId; }
    public void setAssignedOfficerId(Integer assignedOfficerId) { this.assignedOfficerId = assignedOfficerId; }

    public List<Integer> getDeclinedByOfficerIds() { return declinedByOfficerIds; }
    public void setDeclinedByOfficerIds(List<Integer> declinedByOfficerIds) { this.declinedByOfficerIds = declinedByOfficerIds; }

    public Map<String, String> getDetails() { return details == null ? new LinkedHashMap<>() : details; }
    public void setDetails(Map<String, String> details) { this.details = details; }

    public Map<String, String> getFinancial() { return financial == null ? new LinkedHashMap<>() : financial; }
    public void setFinancial(Map<String, String> financial) { this.financial = financial; }

    public List<EvidenceFile> getEvidence() { return evidence == null ? new ArrayList<>() : evidence; }
    public void setEvidence(List<EvidenceFile> evidence) { this.evidence = evidence; }

    /** Human-friendly reference shown to the citizen, e.g. SS-2026-00012. */
    public String getReferenceNo() {
        int year = dateFiled == null ? LocalDateTime.now().getYear() : dateFiled.getYear();
        return String.format("SS-%d-%05d", year, complaintId);
    }

    @Override
    public String toString() {
        return "Complaint{" +
                "complaintId=" + complaintId +
                ", userId=" + userId +
                ", category='" + category + '\'' +
                ", severity='" + severity + '\'' +
                ", status='" + status + '\'' +
                ", dateFiled=" + dateFiled +
                ", assignedOfficerId=" + assignedOfficerId +
                ", declinedByOfficerIds=" + declinedByOfficerIds +
                '}';
    }
}