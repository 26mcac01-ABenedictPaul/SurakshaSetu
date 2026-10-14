package com.surakshasetu.servlet;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.surakshasetu.model.Complaint;
import com.surakshasetu.model.Officer;
import com.surakshasetu.util.Api;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * GET  /api/admin?complaintId=N            -> officers matching that case (state / city / specialization)
 * POST /api/admin  complaintId, officerId  -> assign a Pending case to one of those officers
 */
@WebServlet("/api/admin")
public class AdminServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!Api.require(req, resp, "admin")) return;

        Complaint c = find(parse(req.getParameter("complaintId")));
        if (c == null) {
            Api.send(resp, 404, Api.msg("error", "Case not found."));
            return;
        }

        List<Map<String, Object>> out = new ArrayList<>();
        for (Officer o : Api.SERVICE.findMatchingOfficers(c)) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", o.getOfficerId());
            m.put("name", o.getName());
            m.put("station", o.getStation());
            m.put("city", o.getCity());
            m.put("state", o.getState());
            m.put("specialization", o.getSpecialization());
            m.put("contactNumber", o.getContactNumber());
            out.add(m);
        }
        Api.send(resp, 200, out);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!Api.require(req, resp, "admin")) return;

        int complaintId = parse(req.getParameter("complaintId"));
        int officerId = parse(req.getParameter("officerId"));

        synchronized (Api.LOCK) {
            Complaint c = find(complaintId);
            if (c == null) {
                Api.send(resp, 404, Api.msg("error", "Case not found."));
                return;
            }
            if (!"Pending".equalsIgnoreCase(c.getStatus())) {
                Api.send(resp, 409, Api.msg("error", "This case is no longer waiting for assignment."));
                return;
            }

            Officer chosen = null;
            for (Officer o : Api.SERVICE.findMatchingOfficers(c)) {
                if (o.getOfficerId() == officerId) { chosen = o; break; }
            }
            if (chosen == null) {
                Api.send(resp, 400, Api.msg("error", "That officer does not match this case."));
                return;
            }

            Api.SERVICE.assignOfficer(c, chosen);
            Api.send(resp, 200, Api.msg("success",
                    "Case #" + c.getComplaintId() + " assigned to " + chosen.getName() + ". Awaiting their response."));
        }
    }

    private Complaint find(int id) {
        for (Complaint c : Api.SERVICE.getAllComplaints()) {
            if (c.getComplaintId() == id) return c;
        }
        return null;
    }

    private int parse(String s) {
        try { return Integer.parseInt(Api.clean(s)); } catch (NumberFormatException e) { return -1; }
    }
}
