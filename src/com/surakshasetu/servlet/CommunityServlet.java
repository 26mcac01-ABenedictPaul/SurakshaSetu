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
 * Community: citizen initiatives (start / join / leave / cancel) and surveys (vote once).
 *
 * GET  /api/community              -> { initiatives:[...], surveys:[...] } for the logged-in person
 * POST /api/community action=create    title,type,description,date,time,place,city,permit   (citizen)
 *                     action=join|leave initiativeId                                         (citizen)
 *                     action=cancel     initiativeId  (organiser)   action=remove initiativeId (admin)
 *                     action=vote       surveyId,option                                      (citizen)
 *                     action=newSurvey  question,options (one per line, 2-6)                 (admin)
 *
 * Rallies and public assemblies are allowed only with an explicit acknowledgement that police permission
 * may be needed. Data: data/initiatives.json, data/surveys.json.
 */
@WebServlet("/api/community")
public class CommunityServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final Type INITS = new TypeToken<List<Initiative>>() {}.getType();
    private static final Type SURVEYS = new TypeToken<List<Survey>>() {}.getType();

    public static class Initiative {
        int id;
        int organizerId;
        String organizer;
        String title;
        String type;
        String description;
        String date;
        String time;
        String place;
        String city;
        String status;           // Open | Cancelled
        List<Integer> participants = new ArrayList<>();
        String createdAt;
    }

    public static class Survey {
        int id;
        String question;
        List<String> options = new ArrayList<>();
        Map<String, Integer> votes = new LinkedHashMap<>();   // userId -> option index
        boolean open = true;
        String createdAt;
    }

    private static final List<String> TYPES = Arrays.asList("Clean-up drive", "Awareness campaign", "Neighbourhood watch", "Blood donation / health camp",
            "Cultural parade", "Peaceful rally / march", "Candlelight vigil", "Other community event");
    private static final List<String> NEEDS_PERMIT = Arrays.asList("Cultural parade", "Peaceful rally / march", "Candlelight vigil");

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!Api.require(req, resp, null)) return;
        int me = Api.id(req);
        String role = Api.role(req);
        List<Map<String, Object>> inits = new ArrayList<>();
        List<Initiative> list = JsonStorage.readList("initiatives.json", INITS);
        list.sort(Comparator.comparing((Initiative i) -> i.date + " " + (i.time == null ? "" : i.time)));
        String today = LocalDate.now().toString();
        for (Initiative i : list) {
            if (i.date.compareTo(today) < 0 && !"admin".equals(role)) continue;          // past events drop off
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", i.id); m.put("title", i.title); m.put("type", i.type); m.put("description", i.description);
            m.put("date", i.date); m.put("time", i.time); m.put("place", i.place); m.put("city", i.city);
            m.put("organizer", i.organizer); m.put("status", i.status);
            m.put("participants", i.participants.size());
            m.put("joined", "user".equals(role) && i.participants.contains(me));
            m.put("mine", "user".equals(role) && i.organizerId == me);
            inits.add(m);
        }

        List<Map<String, Object>> surveys = new ArrayList<>();
        synchronized (Api.LOCK) {
            List<Survey> sl = JsonStorage.readList("surveys.json", SURVEYS);
            if (sl.isEmpty()) { sl = seed(); JsonStorage.writeList("surveys.json", sl); }
            for (Survey s : sl) {
                Map<String, Object> m = new LinkedHashMap<>();
                int[] counts = new int[s.options.size()];
                for (int v : s.votes.values()) if (v >= 0 && v < counts.length) counts[v]++;
                List<Map<String, Object>> opts = new ArrayList<>();
                for (int k = 0; k < counts.length; k++) {
                    Map<String, Object> o = new LinkedHashMap<>();
                    o.put("text", s.options.get(k)); o.put("votes", counts[k]);
                    opts.add(o);
                }
                Integer mine = s.votes.get(String.valueOf(me));
                m.put("id", s.id); m.put("question", s.question); m.put("options", opts);
                m.put("total", s.votes.size()); m.put("myVote", mine == null ? -1 : mine); m.put("open", s.open);
                surveys.add(m);
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("initiatives", inits);
        out.put("surveys", surveys);
        Api.send(resp, 200, out);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        if (!Api.require(req, resp, null)) return;
        String action = Api.clean(req.getParameter("action"));
        String role = Api.role(req);
        int me = Api.id(req);

        try {
            synchronized (Api.LOCK) {
                switch (action) {
                    case "create": {
                        if (!"user".equals(role)) { Api.send(resp, 403, Api.msg("error", "Only citizens can start an initiative.")); return; }
                        String title = Api.clean(req.getParameter("title")), type = Api.clean(req.getParameter("type"));
                        String desc = Api.clean(req.getParameter("description")), date = Api.clean(req.getParameter("date"));
                        String time = Api.clean(req.getParameter("time")), place = Api.clean(req.getParameter("place")), city = Api.clean(req.getParameter("city"));
                        if (title.length() < 5 || title.length() > 100) { bad(resp, "Give your initiative a short title (5-100 characters)."); return; }
                        if (!TYPES.contains(type)) { bad(resp, "Please choose a type of initiative."); return; }
                        if (desc.length() < 20 || desc.length() > 1500) { bad(resp, "Please describe it in at least 20 characters (max 1500)."); return; }
                        LocalDate d;
                        try { d = LocalDate.parse(date); } catch (Exception e) { bad(resp, "Please choose a date."); return; }
                        if (d.isBefore(LocalDate.now()) || d.isAfter(LocalDate.now().plusYears(1))) { bad(resp, "The date must be within the next year."); return; }
                        if (place.length() < 3 || place.length() > 200) { bad(resp, "Please say where it will take place."); return; }
                        if (city.length() < 2 || city.length() > 80) { bad(resp, "Please enter the city."); return; }
                        if (NEEDS_PERMIT.contains(type) && !"yes".equals(req.getParameter("permit"))) {
                            bad(resp, "Public gatherings may need police permission. Please tick the box to confirm you will check with your local station."); return;
                        }
                        List<Initiative> list = JsonStorage.readList("initiatives.json", INITS);
                        Initiative i = new Initiative();
                        for (Initiative x : list) i.id = Math.max(i.id, x.id);
                        i.id++;
                        i.organizerId = me; i.organizer = Api.name(req); i.title = title; i.type = type; i.description = desc;
                        i.date = date; i.time = time.length() > 5 ? "" : time; i.place = place; i.city = city; i.status = "Open";
                        i.participants.add(me);                       // the organiser takes part
                        i.createdAt = LocalDateTime.now().toString();
                        list.add(i);
                        JsonStorage.writeList("initiatives.json", list);
                        Api.send(resp, 201, Api.msg("success", "Your initiative is live. People can now join it."));
                        return;
                    }
                    case "join": case "leave": case "cancel": case "remove": {
                        int id = Integer.parseInt(Api.clean(req.getParameter("initiativeId")));
                        List<Initiative> list = JsonStorage.readList("initiatives.json", INITS);
                        Initiative t = null;
                        for (Initiative x : list) if (x.id == id) { t = x; break; }
                        if (t == null) { Api.send(resp, 404, Api.msg("error", "Initiative not found.")); return; }
                        String msg;
                        if ("remove".equals(action)) {
                            if (!"admin".equals(role)) { Api.send(resp, 403, Api.msg("error", "Not allowed.")); return; }
                            list.remove(t); msg = "Removed.";
                        } else if (!"user".equals(role)) { Api.send(resp, 403, Api.msg("error", "Only citizens can do this.")); return; }
                        else if ("cancel".equals(action)) {
                            if (t.organizerId != me) { Api.send(resp, 403, Api.msg("error", "Only the organiser can cancel.")); return; }
                            t.status = "Cancelled"; msg = "Initiative cancelled.";
                        } else if ("join".equals(action)) {
                            if (!"Open".equals(t.status)) { bad(resp, "This initiative is no longer open."); return; }
                            if (!t.participants.contains(me)) t.participants.add(me);
                            msg = "You have joined. See you there!";
                        } else {
                            if (t.organizerId == me) { bad(resp, "You are the organiser. Cancel the initiative instead."); return; }
                            t.participants.remove(Integer.valueOf(me)); msg = "You have left.";
                        }
                        JsonStorage.writeList("initiatives.json", list);
                        Api.send(resp, 200, Api.msg("success", msg));
                        return;
                    }
                    case "vote": {
                        if (!"user".equals(role)) { Api.send(resp, 403, Api.msg("error", "Only citizens can vote.")); return; }
                        int sid = Integer.parseInt(Api.clean(req.getParameter("surveyId"))), opt = Integer.parseInt(Api.clean(req.getParameter("option")));
                        List<Survey> sl = JsonStorage.readList("surveys.json", SURVEYS);
                        for (Survey s : sl) if (s.id == sid) {
                            if (!s.open) { bad(resp, "This survey is closed."); return; }
                            if (opt < 0 || opt >= s.options.size()) { bad(resp, "Please choose one of the options."); return; }
                            if (s.votes.containsKey(String.valueOf(me))) { bad(resp, "You have already answered this survey."); return; }
                            s.votes.put(String.valueOf(me), opt);
                            JsonStorage.writeList("surveys.json", sl);
                            Api.send(resp, 200, Api.msg("success", "Thank you. Your answer has been recorded."));
                            return;
                        }
                        Api.send(resp, 404, Api.msg("error", "Survey not found."));
                        return;
                    }
                    case "newSurvey": {
                        if (!"admin".equals(role)) { Api.send(resp, 403, Api.msg("error", "Only admins can add surveys.")); return; }
                        String q = Api.clean(req.getParameter("question"));
                        List<String> opts = new ArrayList<>();
                        for (String line : Api.clean(req.getParameter("options")).split("\\r?\\n")) if (!line.trim().isEmpty()) opts.add(line.trim());
                        if (q.length() < 8 || opts.size() < 2 || opts.size() > 6) { bad(resp, "A survey needs a question and 2 to 6 options."); return; }
                        List<Survey> sl = JsonStorage.readList("surveys.json", SURVEYS);
                        Survey s = new Survey();
                        for (Survey x : sl) s.id = Math.max(s.id, x.id);
                        s.id++; s.question = q; s.options = opts; s.createdAt = LocalDateTime.now().toString();
                        sl.add(s);
                        JsonStorage.writeList("surveys.json", sl);
                        Api.send(resp, 201, Api.msg("success", "Survey added."));
                        return;
                    }
                    default:
                        bad(resp, "Unknown action.");
                }
            }
        } catch (NumberFormatException e) {
            bad(resp, "Invalid request.");
        } catch (Exception e) {
            Api.send(resp, 500, Api.msg("error", "Server error: " + e.getMessage()));
        }
    }

    private static void bad(HttpServletResponse resp, String m) throws IOException { Api.send(resp, 400, Api.msg("error", m)); }

    private static List<Survey> seed() {
        String[][] rows = {
            {"How safe do you feel walking in your neighbourhood after dark?", "Very safe", "Mostly safe", "Not very safe", "Not safe at all"},
            {"Which would help your area most?", "More street lighting", "More police patrolling", "CCTV at key junctions", "Neighbourhood watch groups"},
            {"How easy was it to report a problem to the authorities?", "Very easy", "Okay", "Difficult", "I have never tried"},
        };
        List<Survey> out = new ArrayList<>();
        int n = 1;
        for (String[] r : rows) {
            Survey s = new Survey();
            s.id = n++; s.question = r[0]; s.options = new ArrayList<>(Arrays.asList(r).subList(1, r.length)); s.createdAt = LocalDateTime.now().toString();
            out.add(s);
        }
        return out;
    }
}
