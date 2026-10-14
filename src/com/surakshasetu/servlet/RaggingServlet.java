package com.surakshasetu.servlet;

import java.io.IOException;
import java.lang.reflect.Type;
import java.security.SecureRandom;
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
 * Anti-Ragging & Campus Safety complaints (stored in data/ragging.json).
 *
 * GET  /api/ragging?code=AR-XXXXXXXX -> status of one report (works for anonymous reports too)
 * GET  /api/ragging                  -> citizen: own NON-anonymous reports | admin: all reports
 * POST /api/ragging                  -> citizen: file a report (anonymous=yes keeps the account out of the record)
 * POST /api/ragging action=status    -> admin: reportId, status
 *
 * Anonymous reports store userId = -1, so nobody (not even the admin) can link them to an account.
 * The student keeps the tracking code to check progress.
 */
@WebServlet("/api/ragging")
public class RaggingServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final Type REPORTS = new TypeToken<List<Report>>() {}.getType();
    private static final String FILE = "ragging.json";
    private static final SecureRandom RNG = new SecureRandom();
    private static final String CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no look-alike characters

    private static final List<String> TYPES = Arrays.asList(
            "Verbal abuse or humiliation", "Physical harm or forced exercise", "Forced to do tasks or hand over money",
            "Sexual or gender-based harassment", "Cyber-bullying or online ragging", "Threats or intimidation",
            "Social exclusion or forced isolation", "Other");
    private static final List<String> STATUSES = Arrays.asList(
            "Received", "Under review", "Forwarded to the college Anti-Ragging Committee", "Action taken", "Closed");

    public static class Report {
        int reportId;
        String code;
        int userId;           // -1 when anonymous
        boolean anonymous;
        String college;
        String city;
        String state;
        String type;
        String happenedAt;    // where / when (free text)
        String description;
        String accused;       // optional: names / year / course / hostel
        boolean urgent;
        String contact;       // optional, only if the student wants to be contacted
        String status;
        String filedAt;
        String updatedAt;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!Api.require(req, resp, null)) return;
        String role = Api.role(req);
        if (!"user".equals(role) && !"admin".equals(role)) { Api.send(resp, 403, Api.msg("error", "You are not allowed to do this.")); return; }

        List<Report> all = JsonStorage.readList(FILE, REPORTS);
        String code = Api.clean(req.getParameter("code")).toUpperCase();

        if (!code.isEmpty()) {
            for (Report r : all) if (r.code.equals(code)) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("code", r.code); m.put("status", r.status); m.put("type", r.type); m.put("college", r.college);
                m.put("filedAt", r.filedAt); m.put("updatedAt", r.updatedAt);
                Api.send(resp, 200, m);
                return;
            }
            Api.send(resp, 404, Api.msg("error", "No report found for that code. Check it and try again."));
            return;
        }

        List<Report> out = new ArrayList<>();
        for (Report r : all) {
            if ("admin".equals(role)) { out.add(r); }
            else if (!r.anonymous && r.userId == Api.id(req)) { out.add(r); }
        }
        out.sort(Comparator.comparingInt((Report r) -> r.reportId).reversed());
        Api.send(resp, 200, out);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        if (!Api.require(req, resp, null)) return;
        String role = Api.role(req);

        if ("status".equals(req.getParameter("action"))) {
            if (!"admin".equals(role)) { Api.send(resp, 403, Api.msg("error", "Only the admin can update a report.")); return; }
            String status = Api.clean(req.getParameter("status"));
            int id;
            try { id = Integer.parseInt(Api.clean(req.getParameter("reportId"))); }
            catch (NumberFormatException e) { Api.send(resp, 400, Api.msg("error", "Invalid report.")); return; }
            if (!STATUSES.contains(status)) { Api.send(resp, 400, Api.msg("error", "Invalid status.")); return; }
            synchronized (Api.LOCK) {
                List<Report> list = JsonStorage.readList(FILE, REPORTS);
                for (Report r : list) if (r.reportId == id) {
                    r.status = status;
                    r.updatedAt = LocalDateTime.now().toString();
                    JsonStorage.writeList(FILE, list);
                    Api.send(resp, 200, Api.msg("success", "Report " + r.code + " is now: " + status + "."));
                    return;
                }
            }
            Api.send(resp, 404, Api.msg("error", "Report not found."));
            return;
        }

        if (!"user".equals(role)) { Api.send(resp, 403, Api.msg("error", "Only students/citizens can file a report.")); return; }

        String college = Api.clean(req.getParameter("college"));
        String city = Api.clean(req.getParameter("city"));
        String state = Api.clean(req.getParameter("state"));
        String type = Api.clean(req.getParameter("type"));
        String happenedAt = Api.clean(req.getParameter("happenedAt"));
        String description = Api.clean(req.getParameter("description"));
        String accused = Api.clean(req.getParameter("accused"));
        String contact = Api.clean(req.getParameter("contact"));
        boolean anonymous = "yes".equals(req.getParameter("anonymous"));
        boolean urgent = "yes".equals(req.getParameter("urgent"));

        if (college.length() < 3) { Api.send(resp, 400, Api.msg("error", "Please enter your college / university name.")); return; }
        if (!TYPES.contains(type)) { Api.send(resp, 400, Api.msg("error", "Please choose what kind of incident it was.")); return; }
        if (description.length() < 20) { Api.send(resp, 400, Api.msg("error", "Please describe what happened (at least 20 characters).")); return; }
        college = cut(college, 150); city = cut(city, 80); state = cut(state, 80); happenedAt = cut(happenedAt, 200);
        description = cut(description, 3000); accused = cut(accused, 300); contact = cut(contact, 120);

        final Report r = new Report();
        synchronized (Api.LOCK) {
            List<Report> list = JsonStorage.readList(FILE, REPORTS);
            int next = 1;
            for (Report x : list) next = Math.max(next, x.reportId + 1);
            r.reportId = next;
            r.code = newCode(list);
            r.anonymous = anonymous;
            r.userId = anonymous ? -1 : Api.id(req);
            r.college = college; r.city = city; r.state = state; r.type = type;
            r.happenedAt = happenedAt; r.description = description; r.accused = accused;
            r.urgent = urgent;
            r.contact = anonymous ? "" : contact; // an anonymous report never stores contact details
            r.status = "Received";
            r.filedAt = LocalDateTime.now().toString();
            r.updatedAt = r.filedAt;
            list.add(r);
            JsonStorage.writeList(FILE, list);
        }

        Map<String, Object> m = Api.msg("success", "Your report has been received. Keep your tracking code: " + r.code);
        m.put("code", r.code);
        m.put("anonymous", anonymous);
        m.put("year", LocalDate.now().getYear());
        Api.send(resp, 201, m);
    }

    private static String newCode(List<Report> existing) {
        while (true) {
            StringBuilder sb = new StringBuilder("AR-");
            for (int i = 0; i < 8; i++) sb.append(CODE_CHARS.charAt(RNG.nextInt(CODE_CHARS.length())));
            String c = sb.toString();
            boolean clash = false;
            for (Report x : existing) if (x.code.equals(c)) { clash = true; break; }
            if (!clash) return c;
        }
    }

    private static String cut(String s, int max) { return s.length() > max ? s.substring(0, max) : s; }
}
