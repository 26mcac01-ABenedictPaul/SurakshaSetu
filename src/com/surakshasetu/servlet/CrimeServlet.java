package com.surakshasetu.servlet;

import java.io.IOException;
import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.reflect.TypeToken;
import com.surakshasetu.model.Accused;
import com.surakshasetu.model.CaseReport;
import com.surakshasetu.model.Complaint;
import com.surakshasetu.model.Officer;
import com.surakshasetu.model.User;
import com.surakshasetu.util.Api;
import com.surakshasetu.util.JsonStorage;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Crime analytics for the admin dashboard.
 *
 * GET  /api/crime?view=all    (admin)          -> { incidents, accused, reports, officers, areas }
 * GET  /api/crime?view=areas  (any logged in)  -> area list for the officer's report form
 * POST /api/crime action=report         (officer on own case, or admin)  complaintId, cause, summary, modus, outcome, area, accused(JSON array)
 * POST /api/crime action=saveAccused    (admin)  accusedId(0=new), name, alias, age, gender, status, description, history, photo, caseRefs
 * POST /api/crime action=seedDemo|clearDemo (admin)  fictional sample data so the dashboard can be shown straight away
 *
 * Data files: data/accused.json and data/reports.json (created on first use).
 * Map positions are approximate area centres, matched from the case's location / city text.
 */
@WebServlet("/api/crime")
public class CrimeServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final Type ACCUSED = new TypeToken<List<Accused>>() {}.getType();
    private static final Type REPORTS = new TypeToken<List<CaseReport>>() {}.getType();
    private static final Type OFFICERS = new TypeToken<List<Officer>>() {}.getType();
    private static final Type USERS = new TypeToken<List<User>>() {}.getType();
    private static final Type COMPLAINTS = new TypeToken<List<Complaint>>() {}.getType();

    private static final Set<String> OUTCOMES = Set.of("Charge-sheet filed", "Arrest made", "Closed - insufficient evidence",
            "Referred to court", "Under further enquiry");
    private static final Set<String> STATUSES = Set.of("Suspect", "Arrested", "Absconding", "Convicted", "Released");
    private static final Set<String> GENDERS = Set.of("Male", "Female", "Other", "Unknown");

    /* ---------------------------------------------------------------- gazetteer (approximate centres) */
    private static final Map<String, double[]> AREAS = new LinkedHashMap<>();
    private static final Map<String, double[]> CITIES = new LinkedHashMap<>();
    private static final String[][] ALIASES = { { "m g road", "MG Road" }, { "mahatma gandhi road", "MG Road" }, { "kamanahalli", "Kammanahalli" },
            { "ksr", "Majestic" }, { "electronic city", "Electronic City" }, { "e city", "Electronic City" }, { "k r puram", "KR Puram" } };

    private static void a(String n, double lat, double lng) { AREAS.put(n, new double[] { lat, lng }); }
    private static void c(String n, double lat, double lng) { CITIES.put(n, new double[] { lat, lng }); }

    static {
        a("MG Road", 12.9756, 77.6066); a("Kammanahalli", 13.0136, 77.6425); a("Indiranagar", 12.9784, 77.6408);
        a("Koramangala", 12.9352, 77.6245); a("Whitefield", 12.9698, 77.7500); a("Jayanagar", 12.9250, 77.5938);
        a("Malleshwaram", 13.0035, 77.5643); a("Electronic City", 12.8452, 77.6602); a("Marathahalli", 12.9569, 77.7011);
        a("HSR Layout", 12.9116, 77.6389); a("BTM Layout", 12.9166, 77.6101); a("Yeshwanthpur", 13.0285, 77.5409);
        a("Majestic", 12.9767, 77.5713); a("Shivajinagar", 12.9857, 77.6057); a("Banashankari", 12.9255, 77.5468);
        a("Hebbal", 13.0358, 77.5970); a("Yelahanka", 13.1007, 77.5963); a("Rajajinagar", 12.9916, 77.5520);
        a("JP Nagar", 12.9063, 77.5857); a("KR Puram", 13.0075, 77.6955); a("Basavanagudi", 12.9422, 77.5738);
        a("Peenya", 13.0329, 77.5273); a("Hennur", 13.0376, 77.6393); a("Ulsoor", 12.9810, 77.6200); a("Domlur", 12.9609, 77.6387);
        c("Bengaluru", 12.9716, 77.5946); c("Mysore", 12.2958, 76.6394); c("Mumbai", 19.0760, 72.8777); c("New Delhi", 28.6139, 77.2090);
        c("Chennai", 13.0827, 80.2707); c("Hyderabad", 17.3850, 78.4867); c("Kolkata", 22.5726, 88.3639); c("Pune", 18.5204, 73.8567);
        c("Ahmedabad", 23.0225, 72.5714); c("Jaipur", 26.9124, 75.7873); c("Lucknow", 26.8467, 80.9462); c("Kochi", 9.9312, 76.2673);
        c("Surat", 21.1702, 72.8311); c("Coimbatore", 11.0168, 76.9558); c("Guwahati", 26.1445, 91.7362); c("Bhubaneswar", 20.2961, 85.8245);
        c("Chandigarh", 30.7333, 76.7794); c("Ludhiana", 30.9010, 75.8573); c("Noida", 28.5355, 77.3910);
        c("Thiruvananthapuram", 8.5241, 76.9366); c("Vijayawada", 16.5062, 80.6480); c("Visakhapatnam", 17.6868, 83.2185);
    }

    /** Returns { name, lat, lng, precise } or null. Matches a known locality in the text first, then the city centre. */
    private static Object[] resolve(String text, String city) {
        String t = " " + (text == null ? "" : text).toLowerCase().replace(".", "").replaceAll("\\s+", " ") + " ";
        for (Map.Entry<String, double[]> e : AREAS.entrySet()) {
            if (t.contains(e.getKey().toLowerCase())) return new Object[] { e.getKey(), e.getValue()[0], e.getValue()[1], Boolean.TRUE };
        }
        for (String[] al : ALIASES) {
            if (t.contains(al[0]) && AREAS.containsKey(al[1])) { double[] p = AREAS.get(al[1]); return new Object[] { al[1], p[0], p[1], Boolean.TRUE }; }
        }
        String cy = city == null ? "" : city.toLowerCase().trim();
        if (cy.isEmpty()) return null;
        if (cy.contains("bangalore") || cy.contains("bengaluru")) cy = "bengaluru";
        else if (cy.equals("delhi")) cy = "new delhi";
        for (Map.Entry<String, double[]> e : CITIES.entrySet()) {
            if (cy.equals(e.getKey().toLowerCase()) || cy.contains(e.getKey().toLowerCase())) {
                return new Object[] { e.getKey(), e.getValue()[0], e.getValue()[1], Boolean.FALSE };
            }
        }
        return null;
    }

    /* ---------------------------------------------------------------- GET */
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String view = Api.clean(req.getParameter("view"));
        if ("areas".equals(view)) {
            if (!Api.require(req, resp, null)) return;
            List<Map<String, Object>> list = new ArrayList<>();
            for (Map.Entry<String, double[]> e : AREAS.entrySet()) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("name", e.getKey());
                list.add(m);
            }
            Api.send(resp, 200, list);
            return;
        }
        if (!Api.require(req, resp, "admin")) return;
        Api.send(resp, 200, snapshot());
    }

    /** Everything the dashboard (and the admin AI) needs, built from the live data files. */
    public static Map<String, Object> snapshot() {
        List<Complaint> complaints;
        List<CaseReport> reports;
        List<Accused> accused;
        List<Officer> officers;
        List<User> users;
        synchronized (Api.LOCK) {
            complaints = JsonStorage.readList("complaints.json", COMPLAINTS);
            reports = JsonStorage.readList("reports.json", REPORTS);
            accused = JsonStorage.readList("accused.json", ACCUSED);
            officers = JsonStorage.readList("officers.json", OFFICERS);
            users = JsonStorage.readList("users.json", USERS);
        }

        Map<Integer, String> userCity = new HashMap<>();
        for (User u : users) userCity.put(u.getUserId(), u.getCity() == null ? "" : u.getCity());
        Map<Integer, Officer> offById = new HashMap<>();
        for (Officer o : officers) offById.put(o.getOfficerId(), o);
        Map<Integer, CaseReport> repByComplaint = new HashMap<>();
        for (CaseReport r : reports) if (r.complaintId > 0) repByComplaint.put(r.complaintId, r);

        List<Map<String, Object>> incidents = new ArrayList<>();
        for (Complaint cp : complaints) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", "C" + cp.getComplaintId());
            m.put("complaintId", cp.getComplaintId());
            m.put("caseRef", cp.getReferenceNo());
            m.put("category", cp.getCategory());
            m.put("severity", cp.getSeverity());
            m.put("status", cp.getStatus());
            m.put("date", cp.getDateFiled() == null ? "" : cp.getDateFiled().toString());
            Map<String, String> d = cp.getDetails();
            String city = d.getOrDefault("city", "");
            if (city == null || city.isBlank()) city = userCity.getOrDefault(cp.getUserId(), "");
            String text = d.getOrDefault("location", "") + " " + d.getOrDefault("jurisdiction", "") + " " + cp.getDescription();
            CaseReport rep = repByComplaint.get(cp.getComplaintId());
            Object[] ar = null;
            if (rep != null && rep.area != null && !rep.area.isBlank()) ar = resolve(rep.area, city);
            if (ar == null) ar = resolve(text, city);
            putArea(m, ar);
            Integer oid = cp.getAssignedOfficerId();
            m.put("officerId", oid == null ? 0 : oid);
            m.put("officerName", oid != null && offById.containsKey(oid) ? offById.get(oid).getName() : "");
            m.put("hasReport", rep != null);
            m.put("cause", rep == null ? "" : rep.cause);
            m.put("description", cap(cp.getDescription() == null ? "" : cp.getDescription(), 220));
            m.put("demo", false);
            incidents.add(m);
        }
        for (CaseReport r : reports) {
            if (r.complaintId > 0) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", "D" + r.reportId);
            m.put("complaintId", 0);
            m.put("caseRef", r.caseRef);
            m.put("category", r.category);
            m.put("severity", r.severity);
            m.put("status", "Under further enquiry".equals(r.outcome) ? "Under Investigation" : "Closed");
            m.put("date", r.date);
            Object[] ar = resolve(r.area, "");
            putArea(m, ar);
            m.put("officerId", r.officerId);
            m.put("officerName", r.officerName);
            m.put("hasReport", true);
            m.put("cause", r.cause);
            m.put("description", cap(r.summary, 220));
            m.put("demo", r.demo);
            incidents.add(m);
        }

        List<Map<String, Object>> offs = new ArrayList<>();
        for (Officer o : officers) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", o.getOfficerId());
            m.put("name", o.getName());
            m.put("station", o.getStation());
            m.put("city", o.getCity());
            m.put("specialization", o.getSpecialization());
            offs.add(m);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("incidents", incidents);
        out.put("accused", accused);
        out.put("reports", reports);
        out.put("officers", offs);
        return out;
    }

    private static void putArea(Map<String, Object> m, Object[] ar) {
        if (ar == null) { m.put("area", ""); m.put("lat", null); m.put("lng", null); m.put("precise", false); }
        else { m.put("area", ar[0]); m.put("lat", ar[1]); m.put("lng", ar[2]); m.put("precise", ar[3]); }
    }

    /* ---------------------------------------------------------------- POST */
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        if (!Api.require(req, resp, null)) return;
        String role = Api.role(req);
        String action = Api.clean(req.getParameter("action"));

        if ("report".equals(action)) {
            if (!"officer".equals(role) && !"admin".equals(role)) { Api.send(resp, 403, Api.msg("error", "You are not allowed to do this.")); return; }
            report(req, resp, role);
            return;
        }
        if (!"admin".equals(role)) { Api.send(resp, 403, Api.msg("error", "Only the admin can do this.")); return; }
        switch (action) {
            case "saveAccused": saveAccused(req, resp); break;
            case "seedDemo": seedDemo(resp); break;
            case "clearDemo": clearDemo(resp); break;
            default: Api.send(resp, 400, Api.msg("error", "Unknown action."));
        }
    }

    private void report(HttpServletRequest req, HttpServletResponse resp, String role) throws IOException {
        int cid = parseInt(req.getParameter("complaintId"));
        String cause = cap(Api.clean(req.getParameter("cause")), 160);
        String summary = cap(Api.clean(req.getParameter("summary")), 2000);
        String modus = cap(Api.clean(req.getParameter("modus")), 300);
        String outcome = Api.clean(req.getParameter("outcome"));
        String areaName = cap(Api.clean(req.getParameter("area")), 80);
        if (cause.isEmpty() || summary.isEmpty()) { Api.send(resp, 400, Api.msg("error", "Please fill in the cause and what the investigation found.")); return; }
        if (!OUTCOMES.contains(outcome)) { Api.send(resp, 400, Api.msg("error", "Please choose an outcome.")); return; }
        JsonArray arr;
        try {
            String raw = Api.clean(req.getParameter("accused"));
            arr = JsonParser.parseString(raw.isEmpty() ? "[]" : raw).getAsJsonArray();
        } catch (Exception e) { Api.send(resp, 400, Api.msg("error", "The accused list was not understood.")); return; }
        if (arr.size() > 8) { Api.send(resp, 400, Api.msg("error", "Add at most 8 people per report.")); return; }

        synchronized (Api.LOCK) {
            List<Complaint> cs = JsonStorage.readList("complaints.json", COMPLAINTS);
            Complaint c = null;
            for (Complaint x : cs) if (x.getComplaintId() == cid) { c = x; break; }
            if (c == null) { Api.send(resp, 404, Api.msg("error", "Case not found.")); return; }
            int me = Api.id(req);
            if ("officer".equals(role)) {
                if (c.getAssignedOfficerId() == null || c.getAssignedOfficerId() != me || !"Under Investigation".equalsIgnoreCase(c.getStatus())) {
                    Api.send(resp, 409, Api.msg("error", "You can only report on a case you have accepted and are investigating."));
                    return;
                }
            } else if ("Pending".equalsIgnoreCase(c.getStatus())) {
                Api.send(resp, 409, Api.msg("error", "Assign an officer to this case first."));
                return;
            }

            Officer off = null;
            if (c.getAssignedOfficerId() != null) {
                for (Officer o : JsonStorage.<Officer>readList("officers.json", OFFICERS)) {
                    if (o.getOfficerId() == c.getAssignedOfficerId()) { off = o; break; }
                }
            }
            String city = off == null ? "" : off.getCity();
            Object[] ar = areaName.isEmpty() ? null : resolve(areaName, city);

            List<Accused> all = JsonStorage.readList("accused.json", ACCUSED);
            List<CaseReport> reps = JsonStorage.readList("reports.json", REPORTS);
            int nextRep = 1;
            for (CaseReport r : reps) nextRep = Math.max(nextRep, r.reportId + 1);
            reps.removeIf(r -> r.complaintId == cid);

            CaseReport rep = new CaseReport();
            rep.reportId = nextRep;
            rep.complaintId = cid;
            rep.caseRef = c.getReferenceNo();
            rep.category = c.getCategory();
            rep.severity = c.getSeverity();
            rep.date = c.getDateFiled() == null ? "" : c.getDateFiled().toString();
            rep.area = ar == null ? "" : (String) ar[0];
            rep.lat = ar == null ? 0 : (Double) ar[1];
            rep.lng = ar == null ? 0 : (Double) ar[2];
            rep.cause = cause;
            rep.summary = summary;
            rep.modus = modus;
            rep.outcome = outcome;
            rep.officerId = off == null ? 0 : off.getOfficerId();
            rep.officerName = off == null ? Api.clean(Api.name(req)) : off.getName();
            rep.submittedAt = LocalDateTime.now().withNano(0).toString();

            for (JsonElement el : arr) {
                if (!el.isJsonObject()) continue;
                JsonObject o = el.getAsJsonObject();
                String name = cap(str(o, "name"), 80);
                if (name.isEmpty()) continue;
                String alias = cap(str(o, "alias"), 60);
                Accused a = findAccused(all, name, alias);
                if (a == null) {
                    a = new Accused();
                    a.accusedId = nextAccusedId(all);
                    a.name = name;
                    all.add(a);
                }
                if (a.alias.isEmpty() && !alias.isEmpty()) a.alias = alias;
                int age = parseInt(str(o, "age"));
                if (a.age <= 0 && age > 0 && age < 120) a.age = age;
                String g = str(o, "gender");
                if (GENDERS.contains(g) && ("Unknown".equals(a.gender) || a.gender.isEmpty())) a.gender = g;
                String st = str(o, "status");
                if (STATUSES.contains(st)) a.status = st;
                String desc = cap(str(o, "description"), 500);
                if (a.description.isEmpty() && !desc.isEmpty()) a.description = desc;
                if (!a.caseRefs.contains(rep.caseRef)) a.caseRefs.add(rep.caseRef);
                if (!rep.accusedIds.contains(a.accusedId)) rep.accusedIds.add(a.accusedId);
                rep.roles.put(String.valueOf(a.accusedId), "Accused".equals(str(o, "role")) ? "Accused" : "Suspect");
            }
            reps.add(rep);
            JsonStorage.writeList("accused.json", all);
            JsonStorage.writeList("reports.json", reps);

            if (!"Under further enquiry".equals(outcome)) {
                c.setStatus("Closed");
                JsonStorage.writeList("complaints.json", cs);
            }
        }
        Api.send(resp, 200, Api.msg("success", "Report saved for case #" + cid + ". It now appears on the admin crime dashboard."));
    }

    private void saveAccused(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        int id = parseInt(req.getParameter("accusedId"));
        String name = cap(Api.clean(req.getParameter("name")), 80);
        if (name.isEmpty()) { Api.send(resp, 400, Api.msg("error", "Name is required.")); return; }
        String photo = Api.clean(req.getParameter("photo"));
        if (!photo.isEmpty() && !"remove".equals(photo) && (!photo.startsWith("data:image/") || photo.length() > 120000)) {
            Api.send(resp, 400, Api.msg("error", "That photo is too large. Please pick a smaller image."));
            return;
        }
        synchronized (Api.LOCK) {
            List<Accused> all = JsonStorage.readList("accused.json", ACCUSED);
            Accused a = null;
            if (id > 0) for (Accused x : all) if (x.accusedId == id) { a = x; break; }
            if (a == null) { a = new Accused(); a.accusedId = nextAccusedId(all); all.add(a); }
            a.name = name;
            a.alias = cap(Api.clean(req.getParameter("alias")), 60);
            int age = parseInt(req.getParameter("age"));
            a.age = age > 0 && age < 120 ? age : 0;
            String g = Api.clean(req.getParameter("gender"));
            a.gender = GENDERS.contains(g) ? g : "Unknown";
            String st = Api.clean(req.getParameter("status"));
            a.status = STATUSES.contains(st) ? st : "Suspect";
            a.description = cap(Api.clean(req.getParameter("description")), 600);
            a.history = new ArrayList<>();
            for (String line : Api.clean(req.getParameter("history")).split("\\r?\\n")) {
                if (!line.isBlank() && a.history.size() < 20) a.history.add(cap(line.trim(), 200));
            }
            if ("remove".equals(photo)) a.photo = "";
            else if (!photo.isEmpty()) a.photo = photo;
            List<String> refs = new ArrayList<>();
            for (String r : Api.clean(req.getParameter("caseRefs")).split(",")) {
                String t = cap(r.trim(), 30);
                if (!t.isEmpty() && !refs.contains(t) && refs.size() < 60) refs.add(t);
            }
            a.caseRefs = refs;
            JsonStorage.writeList("accused.json", all);
        }
        Api.send(resp, 200, Api.msg("success", "Saved " + name + "."));
    }

    /* ---------------------------------------------------------------- demo data (fictional) */
    private void seedDemo(HttpServletResponse resp) throws IOException {
        synchronized (Api.LOCK) {
            List<Accused> all = JsonStorage.readList("accused.json", ACCUSED);
            List<CaseReport> reps = JsonStorage.readList("reports.json", REPORTS);
            for (Accused a : all) if (a.demo) { Api.send(resp, 409, Api.msg("error", "Demo data is already loaded.")); return; }
            int baseAcc = 0;
            for (Accused a : all) baseAcc = Math.max(baseAcc, a.accusedId);
            int baseRep = 0;
            for (CaseReport r : reps) baseRep = Math.max(baseRep, r.reportId);

            String[][] people = {
                { "Arun Kumar", "Money Arun", "29", "Male", "Absconding", "Lean build, scar above the left eyebrow, rides a black two-wheeler. Targets cash handlers near busy commercial streets.",
                    "2022: Arrested for chain snatching, released on bail|2024: Named in two cash-bag snatching cases" },
                { "Sunil Rao", "Bunty", "34", "Male", "Arrested", "Heavy build, full beard. Often works with Arun as the pillion rider.", "2021: Receiving stolen property" },
                { "Vikram Shetty", "Phishing Vicky", "31", "Male", "Suspect", "Runs fake bank-call scams from rented rooms. Uses many SIM cards.", "2023: Questioned in a loan-app fraud" },
                { "Manoj Reddy", "Mani", "38", "Male", "Arrested", "Short, stocky, tattoo on right forearm. Known for sudden violence.", "2019: Arrested in a murder case, acquitted for lack of evidence|2023: Assault at a bus stand" },
                { "Deepak Nair", "", "27", "Male", "Suspect", "Posed as a property broker. Works in a pair with Sunil.", "" },
                { "Nikhil Bhat", "", "25", "Male", "Released", "Repeated online and street harassment complaints. Released on bail with conditions.", "2025: Warning issued by the women's help desk" },
                { "Ravi Teja", "Raja", "41", "Male", "Convicted", "Older offender, limps slightly. Convicted earlier for assault.", "2016: Convicted of assault, 2 years" }
            };
            for (int i = 0; i < people.length; i++) {
                Accused a = new Accused();
                a.accusedId = baseAcc + 1 + i;
                a.name = people[i][0]; a.alias = people[i][1]; a.age = Integer.parseInt(people[i][2]); a.gender = people[i][3];
                a.status = people[i][4]; a.description = people[i][5];
                for (String h : people[i][6].split("\\|")) if (!h.isBlank()) a.history.add(h);
                a.demo = true;
                all.add(a);
            }
            // {no, area, category, severity, daysAgo, cause, summary, modus, outcome, officerId, officerName, accused as "n:Role,n:Role"}
            String[][] cases = {
                { "101", "MG Road", "Theft", "Major", "2", "Financial gain", "Cash bag snatched from a shop employee near the metro exit.", "Two-wheeler snatch and run", "Charge-sheet filed", "2", "Suresh Gowda", "1:Accused" },
                { "102", "Kammanahalli", "Theft", "Major", "5", "Financial gain", "Bank deposit bag snatched outside a showroom.", "Two-wheeler snatch and run, pillion grabs the bag", "Arrest made", "2", "Suresh Gowda", "1:Accused,2:Accused" },
                { "103", "Indiranagar", "Theft", "Minor", "9", "Financial gain", "Cash taken from a parked delivery rider.", "Distraction, then snatch", "Charge-sheet filed", "2", "Suresh Gowda", "1:Suspect" },
                { "104", "MG Road", "Theft", "Major", "14", "Financial gain", "Wallet and cash taken from a tourist.", "Two-wheeler snatch and run", "Under further enquiry", "2", "Suresh Gowda", "1:Suspect" },
                { "105", "Whitefield", "Cybercrime", "Major", "3", "Financial gain", "Fake bank-call scam, OTP shared, savings drained.", "Voice phishing with spoofed number", "Charge-sheet filed", "1", "Rakesh Kumar", "3:Suspect" },
                { "106", "Marathahalli", "Cybercrime", "Major", "8", "Financial gain", "Loan-app harassment and data misuse.", "Fake loan app, contact list leaked", "Under further enquiry", "1", "Rakesh Kumar", "3:Suspect" },
                { "107", "Electronic City", "Fraud", "Major", "12", "Financial gain", "Fake job-offer fee collected from several candidates.", "Social-media job posts, UPI collection", "Charge-sheet filed", "4", "Lakshmi Devi", "3:Accused" },
                { "108", "Majestic", "Assault", "Major", "4", "Personal enmity", "Fight outside a bus stand, one person hospitalised.", "Group attack with a rod", "Arrest made", "3", "Manjunath H", "4:Accused,7:Accused" },
                { "109", "Shivajinagar", "Assault", "Minor", "11", "Dispute over money", "Argument over a loan turned violent.", "Sudden assault in a crowded lane", "Referred to court", "3", "Manjunath H", "4:Accused" },
                { "110", "Majestic", "Murder", "Critical", "6", "Revenge", "Man found dead near the railway parking area.", "Attack late at night, weapon not found", "Under further enquiry", "3", "Manjunath H", "4:Suspect" },
                { "111", "Koramangala", "Fraud", "Major", "7", "Financial gain", "Fake property advance taken from two buyers.", "Forged papers and a rented office", "Charge-sheet filed", "4", "Lakshmi Devi", "5:Accused,2:Accused" },
                { "112", "HSR Layout", "Theft", "Minor", "16", "Financial gain", "Laptop stolen from a co-working space.", "Entered with a visitor pass", "Closed - insufficient evidence", "2", "Suresh Gowda", "5:Suspect" },
                { "113", "Indiranagar", "Harassment", "Major", "10", "Obsession", "Repeated messages and following a student.", "Followed from the bus stop, anonymous messages", "Arrest made", "3", "Manjunath H", "6:Accused" },
                { "114", "Koramangala", "Harassment", "Minor", "18", "Obsession", "Threatening messages sent to a colleague.", "Fake social media account", "Charge-sheet filed", "1", "Rakesh Kumar", "6:Accused" },
                { "115", "Jayanagar", "Missing Person", "Major", "13", "Under enquiry", "Teenager missing after tuition class.", "Unknown", "Under further enquiry", "3", "Manjunath H", "" },
                { "116", "Yeshwanthpur", "Theft", "Minor", "20", "Opportunity", "Two-wheeler stolen from a market lane.", "Handle-lock broken", "Closed - insufficient evidence", "2", "Suresh Gowda", "" },
                { "117", "Whitefield", "Theft", "Minor", "22", "Opportunity", "Mobile phones taken from a repair shop.", "Night break-in", "Closed - insufficient evidence", "2", "Suresh Gowda", "" },
                { "118", "Hebbal", "Assault", "Major", "25", "Personal enmity", "Road-rage attack on a cab driver.", "Sudden assault after a collision", "Referred to court", "3", "Manjunath H", "7:Accused" }
            };
            for (int i = 0; i < cases.length; i++) {
                String[] k = cases[i];
                CaseReport r = new CaseReport();
                r.reportId = baseRep + 1 + i;
                r.complaintId = 0;
                r.caseRef = "DEMO-" + k[0];
                r.category = k[2]; r.severity = k[3];
                r.area = k[1];
                double[] p = AREAS.get(k[1]);
                r.lat = p[0]; r.lng = p[1];
                r.date = LocalDateTime.now().minusDays(Integer.parseInt(k[4])).withNano(0).withSecond(0).toString();
                r.cause = k[5]; r.summary = k[6]; r.modus = k[7]; r.outcome = k[8];
                r.officerId = Integer.parseInt(k[9]); r.officerName = k[10];
                r.submittedAt = r.date;
                r.demo = true;
                if (!k[11].isEmpty()) {
                    for (String pr : k[11].split(",")) {
                        String[] pa = pr.split(":");
                        int aid = baseAcc + Integer.parseInt(pa[0]);
                        r.accusedIds.add(aid);
                        r.roles.put(String.valueOf(aid), pa[1]);
                        for (Accused a : all) if (a.accusedId == aid && !a.caseRefs.contains(r.caseRef)) a.caseRefs.add(r.caseRef);
                    }
                }
                reps.add(r);
            }
            JsonStorage.writeList("accused.json", all);
            JsonStorage.writeList("reports.json", reps);
        }
        Api.send(resp, 200, Api.msg("success", "Demo data loaded (fictional people and cases)."));
    }

    private void clearDemo(HttpServletResponse resp) throws IOException {
        synchronized (Api.LOCK) {
            List<Accused> all = JsonStorage.readList("accused.json", ACCUSED);
            List<CaseReport> reps = JsonStorage.readList("reports.json", REPORTS);
            all.removeIf(a -> a.demo);
            reps.removeIf(r -> r.demo);
            for (Accused a : all) a.caseRefs.removeIf(r -> r.startsWith("DEMO-"));
            JsonStorage.writeList("accused.json", all);
            JsonStorage.writeList("reports.json", reps);
        }
        Api.send(resp, 200, Api.msg("success", "Demo data removed."));
    }

    /* ---------------------------------------------------------------- helpers */
    private static Accused findAccused(List<Accused> all, String name, String alias) {
        for (Accused a : all) {
            if (a.name.equalsIgnoreCase(name)) return a;
            if (!alias.isEmpty() && (alias.equalsIgnoreCase(a.alias) || alias.equalsIgnoreCase(a.name))) return a;
        }
        return null;
    }

    private static int nextAccusedId(List<Accused> all) {
        int n = 0;
        for (Accused a : all) n = Math.max(n, a.accusedId);
        return n + 1;
    }

    private static String str(JsonObject o, String k) {
        return o.has(k) && !o.get(k).isJsonNull() ? o.get(k).getAsString().trim() : "";
    }

    private static String cap(String s, int n) { return s.length() > n ? s.substring(0, n) : s; }

    private static int parseInt(String s) {
        try { return Integer.parseInt(Api.clean(s)); } catch (NumberFormatException e) { return 0; }
    }
}
