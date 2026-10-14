package com.surakshasetu.servlet;

import java.io.IOException;
import java.lang.reflect.Type;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.google.gson.reflect.TypeToken;
import com.surakshasetu.util.Api;
import com.surakshasetu.util.JsonStorage;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Civic issues & public grievances (potholes, fallen trees, utility hazards, nuisance, sanitation).
 * These are NOT police cases, so they are stored separately in data/civic.json.
 *
 * GET  /api/civic -> citizen: own reports | admin: all reports
 * POST /api/civic -> group, issue, location, description, urgent, lat, lng
 *
 * Threats/assault/fights are refused here on purpose (they need the police), and so are
 * neighbourhood/boundary disputes (civil matters: mediation, not an FIR).
 */
@WebServlet("/api/civic")
public class CivicServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final Type REPORTS = new TypeToken<List<Report>>() {}.getType();
    private static final String FILE = "civic.json";

    public static class Report {
        int reportId;
        String reference;
        int userId;
        String group;
        String issue;
        String authority;
        String location;
        Double lat;
        Double lng;
        String description;
        boolean urgent;
        String status;
        String filedAt;
    }

    private static final Map<String, String[]> ISSUES = new LinkedHashMap<>();
    private static final Map<String, String> AUTHORITY = new LinkedHashMap<>();
    static {
        ISSUES.put("roads", new String[] { "Broken roads and potholes", "Damaged footpaths and blocked drains", "Broken streetlights",
                "Damaged public property", "Missing road signs and traffic signals" });
        AUTHORITY.put("roads", "Municipal corporation / PWD / traffic police");

        ISSUES.put("hazards", new String[] { "Trees or large branches fallen on roads", "Trees at risk of falling", "Flooding and waterlogging",
                "Landslides or storm damage", "Obstructions blocking public roads" });
        AUTHORITY.put("hazards", "Municipal tree / disaster management cell");

        ISSUES.put("utilities", new String[] { "Fallen or leaning electric poles", "Exposed electrical wires", "Sparking transformers",
                "Water supply interruptions", "Sewage leaks and overflowing drains" });
        AUTHORITY.put("utilities", "Electricity distribution company / water board");

        ISSUES.put("disturbances", new String[] { "Loud noise and public nuisance", "Public arguments and disturbances" });
        AUTHORITY.put("disturbances", "Local police station (non-emergency)");

        ISSUES.put("sanitation", new String[] { "Garbage accumulation and illegal dumping", "Open drains and sewage overflow", "Stray animal concerns",
                "Air or noise pollution", "Unsafe or unhygienic public spaces" });
        AUTHORITY.put("sanitation", "Municipal sanitation / pollution control board");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!Api.require(req, resp, null)) return;
        String role = Api.role(req);
        if (!"user".equals(role) && !"admin".equals(role)) { Api.send(resp, 403, Api.msg("error", "You are not allowed to do this.")); return; }
        List<Report> out = new ArrayList<>();
        for (Report r : JsonStorage.<Report>readList(FILE, REPORTS)) if ("admin".equals(role) || r.userId == Api.id(req)) out.add(r);
        out.sort(Comparator.comparingInt((Report r) -> r.reportId).reversed());
        Api.send(resp, 200, out);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        if (!Api.require(req, resp, "user")) return;

        String group = Api.clean(req.getParameter("group"));
        String issue = Api.clean(req.getParameter("issue"));
        String location = Api.clean(req.getParameter("location"));
        String description = Api.clean(req.getParameter("description"));
        boolean urgent = "yes".equals(req.getParameter("urgent"));

        if ("disturbances".equals(group) && (issue.startsWith("Threats") || issue.startsWith("Property or boundary") || issue.startsWith("Neighbourhood quarrels"))) {
            Api.send(resp, 400, Api.msg("error", issue.startsWith("Threats")
                    ? "Threats, assault and fights need the police. Call 112 or file a police complaint."
                    : "Neighbourhood and boundary disputes are civil matters. Please use mediation (Lok Adalat / legal services authority) or ask your station for advice."));
            return;
        }
        String[] allowed = ISSUES.get(group);
        if (allowed == null || !Arrays.asList(allowed).contains(issue)) { Api.send(resp, 400, Api.msg("error", "Please choose a valid issue.")); return; }
        if (location.length() < 5) { Api.send(resp, 400, Api.msg("error", "Please tell us where the problem is (street, landmark, area).")); return; }
        if (location.length() > 300) location = location.substring(0, 300);
        if (description.length() < 10) { Api.send(resp, 400, Api.msg("error", "Please describe the problem (at least 10 characters).")); return; }
        if (description.length() > 2000) description = description.substring(0, 2000);

        Double lat = num(req.getParameter("lat"), -90, 90), lng = num(req.getParameter("lng"), -180, 180);
        if (lat == null || lng == null) { lat = null; lng = null; }

        final Report r = new Report();
        try {
            synchronized (Api.LOCK) {
                List<Report> list = JsonStorage.readList(FILE, REPORTS);
                int next = 1;
                for (Report x : list) next = Math.max(next, x.reportId + 1);
                r.reportId = next;
                r.reference = String.format("CV-%d-%05d", LocalDate.now().getYear(), next);
                r.userId = Api.id(req);
                r.group = group;
                r.issue = issue;
                r.authority = AUTHORITY.get(group);
                r.location = location;
                r.lat = lat;
                r.lng = lng;
                r.description = description;
                r.urgent = urgent;
                r.status = "Reported";
                r.filedAt = LocalDateTime.now().toString();
                list.add(r);
                JsonStorage.writeList(FILE, list);
            }
        } catch (Exception e) {
            Api.send(resp, 500, Api.msg("error", "Server error: " + e.getMessage()));
            return;
        }
        Map<String, Object> m = Api.msg("success", "Reported. Reference " + r.reference + ". It has been logged for: " + r.authority + ".");
        m.put("reference", r.reference);
        Api.send(resp, 201, m);
    }

    private static Double num(String s, double min, double max) {
        try {
            double d = Double.parseDouble(Api.clean(s));
            return d >= min && d <= max ? d : null;
        } catch (Exception e) { return null; }
    }
}
