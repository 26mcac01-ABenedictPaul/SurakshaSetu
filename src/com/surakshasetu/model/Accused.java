package com.surakshasetu.model;

import java.util.ArrayList;
import java.util.List;

/** A person linked to one or more cases (accused or suspect). Stored in data/accused.json. */
public class Accused {
    public int accusedId;
    public String name = "";
    public String alias = "";
    public int age;
    public String gender = "Unknown";
    /** Suspect | Arrested | Absconding | Convicted | Released */
    public String status = "Suspect";
    public String description = "";
    /** small data:image/... URL (optional). Empty = the dashboard shows a sample silhouette. */
    public String photo = "";
    /** Case reference numbers this person is linked to, e.g. SS-2026-00012. */
    public List<String> caseRefs = new ArrayList<>();
    /** Older record / prior history lines entered by the admin. */
    public List<String> history = new ArrayList<>();
    public boolean demo;

    public Accused() { }
}
