package com.surakshasetu.servlet;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.google.gson.reflect.TypeToken;
import com.surakshasetu.exception.InvalidComplaintDataException;
import com.surakshasetu.model.Complaint;
import com.surakshasetu.model.Officer;
import com.surakshasetu.model.User;
import com.surakshasetu.util.Api;
import com.surakshasetu.util.EmailService;
import com.surakshasetu.util.JsonStorage;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * GET  /api/complaints  -> citizen: own cases | officer: cases assigned to them | admin: all cases
 * POST /api/complaints  -> citizen files a new complaint (category, description)
 */
@WebServlet("/api/complaints")
public class ComplaintServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    public static final String AWAITING = "Assigned - Awaiting Officer Response";
    public static final String ACCEPTED = "Under Investigation";

    private static final List<String> CATEGORIES =
            Arrays.asList("Theft", "Cybercrime", "Assault", "Missing Person", "Harassment", "Murder", "Fraud");
    private static final Type USERS = new TypeToken<List<User>>() {}.getType();
    private static final Type OFFICERS = new TypeToken<List<Officer>>() {}.getType();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!Api.require(req, resp, null)) return;

        String role = Api.role(req);
        int me = Api.id(req);

        List<User> users = JsonStorage.readList("users.json", USERS);
        List<Officer> officers = JsonStorage.readList("officers.json", OFFICERS);
        Map<Integer, User> userById = users.stream()
                .collect(Collectors.toMap(User::getUserId, Function.identity(), (a, b) -> a));
        Map<Integer, Officer> officerById = officers.stream()
                .collect(Collectors.toMap(Officer::getOfficerId, Function.identity(), (a, b) -> a));

        List<Complaint> all = Api.SERVICE.getAllComplaints();
        List<Map<String, Object>> out = new ArrayList<>();

        all.stream()
                .sorted(Comparator.comparingInt(Complaint::getComplaintId).reversed())
                .filter(c -> {
                    if ("user".equals(role)) return c.getUserId() == me;
                    if ("officer".equals(role)) return c.getAssignedOfficerId() != null && c.getAssignedOfficerId() == me;
                    return true; // admin
                })
                .forEach(c -> out.add(view(c, role, userById.get(c.getUserId()),
                        c.getAssignedOfficerId() == null ? null : officerById.get(c.getAssignedOfficerId()))));

        Api.send(resp, 200, out);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        if (!Api.require(req, resp, "user")) return;

        String category = Api.clean(req.getParameter("category"));
        String description = Api.clean(req.getParameter("description"));

        if (!CATEGORIES.contains(category)) {
            Api.send(resp, 400, Api.msg("error", "Please choose a valid category."));
            return;
        }

        final Complaint filed;
        try {
            synchronized (Api.LOCK) {
                filed = Api.SERVICE.fileComplaint(Api.id(req), category, description);
            }
        } catch (InvalidComplaintDataException e) {
            Api.send(resp, 400, Api.msg("error", e.getMessage()));
            return;
        } catch (Exception e) {
            Api.send(resp, 500, Api.msg("error", "Server error: " + e.getMessage()));
            return;
        }

        // confirmation email in the background so the page never waits for SMTP
        List<User> users = JsonStorage.readList("users.json", USERS);
        for (User u : users) {
            if (u.getUserId() == filed.getUserId() && u.getEmail() != null && !u.getEmail().isBlank()) {
                final User owner = u;
                new Thread(() -> EmailService.sendComplaintConfirmation(owner.getEmail(), owner.getUsername(), filed)).start();
                break;
            }
        }

        Map<String, Object> m = Api.msg("success", "Complaint filed. Case #" + filed.getComplaintId()
                + " (" + filed.getSeverity() + " priority). A confirmation email is on its way.");
        m.put("complaintId", filed.getComplaintId());
        m.put("severity", filed.getSeverity());
        Api.send(resp, 201, m);
    }

    /** Builds what each role is allowed to see about a case. */
    private Map<String, Object> view(Complaint c, String role, User filer, Officer officer) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getComplaintId());
        m.put("category", c.getCategory());
        m.put("severity", c.getSeverity());
        m.put("description", c.getDescription());
        m.put("status", c.getStatus());
        m.put("dateFiled", c.getDateFiled() == null ? "" : c.getDateFiled().toString());
        m.put("referenceNo", c.getReferenceNo());
        if (!c.getDetails().isEmpty()) m.put("details", c.getDetails());
        if (!c.getFinancial().isEmpty()) m.put("financial", c.getFinancial());
        if (!c.getEvidence().isEmpty()) {
            List<Map<String, Object>> ev = new ArrayList<>();
            for (com.surakshasetu.model.EvidenceFile f : c.getEvidence()) {
                Map<String, Object> e = new LinkedHashMap<>();
                e.put("id", f.getId());
                e.put("name", f.getOriginalName());
                e.put("size", f.getSize());
                ev.add(e);
            }
            m.put("evidence", ev);
        }

        // officers and admins see who filed it
        if (!"user".equals(role) && filer != null) {
            m.put("filedBy", filer.getUsername());
            m.put("filerPhone", filer.getPhone());
            m.put("filerAddress", filer.getAddress());
            m.put("filerCity", filer.getCity());
            m.put("filerState", filer.getState());
        }

        // officer details: admin always; citizen/officer only once the case is accepted
        boolean accepted = ACCEPTED.equalsIgnoreCase(c.getStatus());
        if (officer != null && ("admin".equals(role) || accepted)) {
            Map<String, Object> o = new LinkedHashMap<>();
            o.put("name", officer.getName());
            o.put("station", officer.getStation());
            o.put("specialization", officer.getSpecialization());
            o.put("district", officer.getDistrict());
            o.put("city", officer.getCity());
            o.put("state", officer.getState());
            o.put("contactNumber", officer.getContactNumber());
            m.put("officer", o);
        }
        return m;
    }
}
