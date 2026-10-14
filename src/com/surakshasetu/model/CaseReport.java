package com.surakshasetu.model;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Investigation report submitted by an officer. Stored in data/reports.json and shown on the crime dashboard. */
public class CaseReport {
    public int reportId;
    /** 0 for demo records that have no real complaint behind them. */
    public int complaintId;
    public String caseRef = "";
    public String category = "";
    public String severity = "Major";
    public String area = "";
    public double lat;
    public double lng;
    /** Date of the incident (ISO) */
    public String date = "";
    public String cause = "";
    public String summary = "";
    public String modus = "";
    /** Charge-sheet filed | Arrest made | Closed - insufficient evidence | Referred to court | Under further enquiry */
    public String outcome = "";
    public int officerId;
    public String officerName = "";
    public String submittedAt = "";
    public List<Integer> accusedIds = new ArrayList<>();
    /** accusedId -> "Accused" | "Suspect" for this case */
    public Map<String, String> roles = new LinkedHashMap<>();
    public boolean demo;

    public CaseReport() { }
}
