package com.surakshasetu.servlet;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.google.gson.reflect.TypeToken;
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
 * Officer dashboard data that no other endpoint shows to police. Everything is scoped to the signed-in officer:
 *   civic    -> civic-issue reports filed by citizens living in the officer's city
 *   ragging  -> anti-ragging reports from the officer's city (no contact details, status changes stay admin-only)
 *   efirs    -> e-FIR details, only for cases currently assigned to this officer
 *   officer  -> the officer's own profile (never the password)
 * GET /api/officer-hub   (officers only; cases, concerns and appointments still come from their own endpoints)
 */
@WebServlet("/api/officer-hub")
public class OfficerHubServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final Type OFFICERS = new TypeToken<List<Officer>>() {}.getType();
    private static final Type USERS = new TypeToken<List<User>>() {}.getType();
    private static final Type COMPLAINTS = new TypeToken<List<Complaint>>() {}.getType();
    private static final Type MAPS = new TypeToken<List<Map<String, Object>>>() {}.getType();
    private static final int CAP = 200;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!Api.require(req, resp, "officer")) return;
        int me = Api.id(req);

        Officer self = null;
        List<Officer> officers = JsonStorage.readList("officers.json", OFFICERS);
        for (Officer o : officers) if (o.getOfficerId() == me) { self = o; break; }
        if (self == null) { Api.send(resp, 404, Api.msg("error", "Officer profile not found.")); return; }
        String city = self.getCity();

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", self.getOfficerId());
        profile.put("name", self.getName());
        profile.put("badge", self.getBadgeNumber());
        profile.put("station", self.getStation());
        profile.put("specialization", self.getSpecialization());
        profile.put("district", self.getDistrict());
        profile.put("city", city);
        profile.put("state", self.getState());
        profile.put("contact", self.getContactNumber());

        // civic reports carry no city, so use the city of the citizen who filed them
        Map<Integer, String> userCity = new HashMap<>();
        List<User> users = JsonStorage.readList("users.json", USERS);
        for (User u : users) userCity.put(u.getUserId(), u.getCity());
        List<Map<String, Object>> civic = new ArrayList<>();
        List<Map<String, Object>> civicAll = JsonStorage.readList("civic.json", MAPS);
        for (Map<String, Object> r : civicAll) {
            if (civic.size() >= CAP) break;
            if (same(city, userCity.get(intOf(r.get("userId"))))) {
                civic.add(pick(r, "reportId", "reference", "group", "issue", "authority", "location", "lat", "lng", "description", "urgent", "status", "filedAt"));
            }
        }

        List<Map<String, Object>> ragging = new ArrayList<>();
        List<Map<String, Object>> ragAll = JsonStorage.readList("ragging.json", MAPS);
        for (Map<String, Object> r : ragAll) {
            if (ragging.size() >= CAP) break;
            if (same(city, str(r.get("city")))) {
                ragging.add(pick(r, "reportId", "code", "type", "college", "city", "state", "happenedAt", "description", "urgent", "status", "filedAt", "anonymous"));
            }
        }

        Set<Integer> mine = new HashSet<>();
        List<Complaint> complaints = JsonStorage.readList("complaints.json", COMPLAINTS);
        for (Complaint c : complaints) if (c.getAssignedOfficerId() != null && c.getAssignedOfficerId() == me) mine.add(c.getComplaintId());
        List<Map<String, Object>> efirs = new ArrayList<>();
        List<Map<String, Object>> efirAll = JsonStorage.readList("efirs.json", MAPS);
        for (Map<String, Object> e : efirAll) {
            if (efirs.size() >= CAP) break;
            if (mine.contains(intOf(e.get("complaintId")))) {
                efirs.add(pick(e, "firNumber", "complaintId", "category", "severity", "incidentDate", "incidentTime", "place", "description", "accused", "witnesses", "filedAt"));
            }
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("officer", profile);
        out.put("civic", civic);
        out.put("ragging", ragging);
        out.put("efirs", efirs);
        Api.send(resp, 200, out);
    }

    private static boolean same(String a, String b) { return a != null && b != null && !a.trim().isEmpty() && a.trim().equalsIgnoreCase(b.trim()); }

    private static String str(Object o) { return o == null ? null : String.valueOf(o); }

    private static int intOf(Object o) { return o instanceof Number ? ((Number) o).intValue() : -1; }

    /** Copies only the listed keys that exist, so no other field of the stored record can leak. */
    private static Map<String, Object> pick(Map<String, Object> src, String... keys) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (String k : keys) if (src.containsKey(k)) m.put(k, src.get(k));
        return m;
    }
}
