package com.surakshasetu.servlet;

import java.io.IOException;
import java.lang.reflect.Type;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import com.google.gson.reflect.TypeToken;
import com.surakshasetu.exception.InvalidComplaintDataException;
import com.surakshasetu.model.Complaint;
import com.surakshasetu.util.Api;
import com.surakshasetu.util.JsonStorage;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * e-FIR: a detailed complaint. It is filed as a normal case (so it is classified Minor/Major/Critical
 * and routed to an officer) and also stored with its extra details in data/efirs.json.
 * GET  /api/efir -> the citizen's e-FIRs
 * POST /api/efir -> category, incidentDate, incidentTime, place, description, accused, witnesses
 */
@WebServlet("/api/efir")
public class EfirServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final Type EFIRS = new TypeToken<List<Efir>>() {}.getType();
    private static final String FILE = "efirs.json";
    private static final List<String> CATEGORIES =
            Arrays.asList("Theft", "Cybercrime", "Assault", "Missing Person", "Harassment", "Murder", "Fraud");

    public static class Efir {
        int efirId;
        String firNumber;
        int userId;
        int complaintId;
        String category;
        String severity;
        String incidentDate;
        String incidentTime;
        String place;
        String description;
        String accused;
        String witnesses;
        String filedAt;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!Api.require(req, resp, "user")) return;
        List<Efir> mine = new ArrayList<>();
        for (Efir e : JsonStorage.<Efir>readList(FILE, EFIRS)) if (e.userId == Api.id(req)) mine.add(e);
        mine.sort(Comparator.comparingInt((Efir e) -> e.efirId).reversed());
        Api.send(resp, 200, mine);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        if (!Api.require(req, resp, "user")) return;

        String category = Api.clean(req.getParameter("category"));
        String date = Api.clean(req.getParameter("incidentDate"));
        String time = Api.clean(req.getParameter("incidentTime"));
        String place = Api.clean(req.getParameter("place"));
        String description = Api.clean(req.getParameter("description"));
        String accused = Api.clean(req.getParameter("accused"));
        String witnesses = Api.clean(req.getParameter("witnesses"));

        if (!CATEGORIES.contains(category)) { Api.send(resp, 400, Api.msg("error", "Please choose a valid category.")); return; }
        LocalDate d;
        try { d = LocalDate.parse(date); }
        catch (Exception e) { Api.send(resp, 400, Api.msg("error", "Please enter the date of the incident.")); return; }
        if (d.isAfter(LocalDate.now())) { Api.send(resp, 400, Api.msg("error", "The incident date cannot be in the future.")); return; }
        if (place.length() < 3) { Api.send(resp, 400, Api.msg("error", "Please enter where it happened.")); return; }
        if (description.length() < 20) { Api.send(resp, 400, Api.msg("error", "An e-FIR needs a description of at least 20 characters.")); return; }
        if (!"yes".equals(req.getParameter("declare"))) { Api.send(resp, 400, Api.msg("error", "Please tick the declaration.")); return; }

        String full = description + " | Place: " + place + " | When: " + date + (time.isEmpty() ? "" : " " + time)
                + (accused.isEmpty() ? "" : " | Accused: " + accused)
                + (witnesses.isEmpty() ? "" : " | Witnesses: " + witnesses);

        final Complaint filed;
        final Efir e = new Efir();
        try {
            synchronized (Api.LOCK) {
                filed = Api.SERVICE.fileComplaint(Api.id(req), category, full);
                List<Efir> list = JsonStorage.readList(FILE, EFIRS);
                int next = 1;
                for (Efir x : list) next = Math.max(next, x.efirId + 1);
                e.efirId = next;
                e.firNumber = String.format("EFIR-%d-%05d", LocalDate.now().getYear(), next);
                e.userId = Api.id(req);
                e.complaintId = filed.getComplaintId();
                e.category = category;
                e.severity = filed.getSeverity();
                e.incidentDate = date;
                e.incidentTime = time;
                e.place = place;
                e.description = description;
                e.accused = accused;
                e.witnesses = witnesses;
                e.filedAt = LocalDateTime.now().toString();
                list.add(e);
                JsonStorage.writeList(FILE, list);
            }
        } catch (InvalidComplaintDataException ex) {
            Api.send(resp, 400, Api.msg("error", ex.getMessage())); return;
        } catch (Exception ex) {
            Api.send(resp, 500, Api.msg("error", "Server error: " + ex.getMessage())); return;
        }

        Map<String, Object> m = Api.msg("success", "e-FIR registered. Reference " + e.firNumber + " (" + e.severity
                + " priority), linked to Case #" + e.complaintId + ".");
        m.put("firNumber", e.firNumber);
        m.put("complaintId", e.complaintId);
        m.put("severity", e.severity);
        Api.send(resp, 201, m);
    }
}
