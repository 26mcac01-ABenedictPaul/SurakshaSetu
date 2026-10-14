package com.surakshasetu.servlet;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.List;

import com.google.gson.reflect.TypeToken;
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

/** POST /api/officer  action=accept|decline, complaintId  (only for the officer the case is assigned to) */
@WebServlet("/api/officer")
public class OfficerServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final Type USERS = new TypeToken<List<User>>() {}.getType();
    private static final Type OFFICERS = new TypeToken<List<Officer>>() {}.getType();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!Api.require(req, resp, "officer")) return;

        String action = Api.clean(req.getParameter("action"));
        int complaintId;
        try {
            complaintId = Integer.parseInt(Api.clean(req.getParameter("complaintId")));
        } catch (NumberFormatException e) {
            Api.send(resp, 400, Api.msg("error", "Invalid case id."));
            return;
        }
        if (!action.equals("accept") && !action.equals("decline")) {
            Api.send(resp, 400, Api.msg("error", "Unknown action."));
            return;
        }

        int me = Api.id(req);
        Complaint target = null;
        Officer officer = null;

        synchronized (Api.LOCK) {
            for (Complaint c : Api.SERVICE.getAllComplaints()) {
                if (c.getComplaintId() == complaintId) { target = c; break; }
            }
            for (Officer o : JsonStorage.<Officer>readList("officers.json", OFFICERS)) {
                if (o.getOfficerId() == me) { officer = o; break; }
            }

            if (target == null || officer == null
                    || target.getAssignedOfficerId() == null || target.getAssignedOfficerId() != me
                    || !ComplaintServlet.AWAITING.equalsIgnoreCase(target.getStatus())) {
                Api.send(resp, 409, Api.msg("error", "This case is not waiting for your response."));
                return;
            }

            if (action.equals("accept")) {
                Api.SERVICE.acceptCase(target, officer);
            } else {
                Api.SERVICE.declineCase(target, officer);
            }
        }

        if (action.equals("accept")) {
            final Complaint c = target;
            final Officer o = officer;
            for (User u : JsonStorage.<User>readList("users.json", USERS)) {
                if (u.getUserId() == c.getUserId() && u.getEmail() != null && !u.getEmail().isBlank()) {
                    final User owner = u;
                    new Thread(() -> EmailService.sendCaseAcceptedEmail(owner.getEmail(), owner.getUsername(), c, o)).start();
                    break;
                }
            }
            Api.send(resp, 200, Api.msg("success", "Case #" + complaintId + " accepted. The citizen has been notified."));
        } else {
            Api.send(resp, 200, Api.msg("success", "Case #" + complaintId + " declined and returned to the admin queue."));
        }
    }
}
