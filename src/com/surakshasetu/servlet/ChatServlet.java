package com.surakshasetu.servlet;

import java.io.IOException;
import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.google.gson.reflect.TypeToken;
import com.surakshasetu.model.User;
import com.surakshasetu.util.Api;
import com.surakshasetu.util.JsonStorage;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Citizen <-> police station messaging.
 * GET  /api/chat?officerId=N   (citizen) -> messages with that station
 * GET  /api/chat               (officer) -> list of conversations
 * GET  /api/chat?userId=N      (officer) -> messages with that citizen
 * POST /api/chat               citizen: officerId,text | officer: userId,text
 */
@WebServlet("/api/chat")
public class ChatServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final Type MSGS = new TypeToken<List<Message>>() {}.getType();
    private static final Type USERS = new TypeToken<List<User>>() {}.getType();
    private static final String FILE = "messages.json";

    public static class Message {
        int messageId;
        int userId;
        int officerId;
        String sender;   // "user" or "officer"
        String text;
        String time;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!Api.require(req, resp, null)) return;
        String role = Api.role(req);
        int me = Api.id(req);
        List<Message> all = JsonStorage.readList(FILE, MSGS);

        if ("user".equals(role)) {
            int officerId = parse(req.getParameter("officerId"));
            List<Message> out = new ArrayList<>();
            for (Message m : all) if (m.userId == me && m.officerId == officerId) out.add(m);
            Api.send(resp, 200, out);
            return;
        }
        if (!"officer".equals(role)) { Api.send(resp, 403, Api.msg("error", "You are not allowed to do this.")); return; }

        String userParam = req.getParameter("userId");
        if (userParam != null && !userParam.isBlank()) {
            int userId = parse(userParam);
            List<Message> out = new ArrayList<>();
            for (Message m : all) if (m.officerId == me && m.userId == userId) out.add(m);
            Api.send(resp, 200, out);
            return;
        }

        // conversation list: one row per citizen, with the latest message
        Map<Integer, Message> last = new LinkedHashMap<>();
        for (Message m : all) if (m.officerId == me) last.put(m.userId, m);
        Map<Integer, String> names = new LinkedHashMap<>();
        for (User u : JsonStorage.<User>readList("users.json", USERS)) names.put(u.getUserId(), u.getUsername());

        List<Map<String, Object>> out = new ArrayList<>();
        for (Map.Entry<Integer, Message> e : last.entrySet()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("userId", e.getKey());
            row.put("name", names.getOrDefault(e.getKey(), "Citizen #" + e.getKey()));
            row.put("lastText", e.getValue().text);
            row.put("lastTime", e.getValue().time);
            row.put("lastSender", e.getValue().sender);
            out.add(row);
        }
        java.util.Collections.reverse(out); // newest conversation first
        Api.send(resp, 200, out);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        if (!Api.require(req, resp, null)) return;
        String role = Api.role(req);
        if (!"user".equals(role) && !"officer".equals(role)) {
            Api.send(resp, 403, Api.msg("error", "You are not allowed to do this.")); return;
        }
        String text = Api.clean(req.getParameter("text"));
        if (text.isEmpty()) { Api.send(resp, 400, Api.msg("error", "Type a message first.")); return; }
        if (text.length() > 1000) text = text.substring(0, 1000);

        int other = parse("user".equals(role) ? req.getParameter("officerId") : req.getParameter("userId"));
        if (other < 0) { Api.send(resp, 400, Api.msg("error", "Choose who to message.")); return; }

        Message m = new Message();
        synchronized (Api.LOCK) {
            List<Message> all = JsonStorage.readList(FILE, MSGS);
            int next = 1;
            for (Message x : all) next = Math.max(next, x.messageId + 1);
            m.messageId = next;
            m.userId = "user".equals(role) ? Api.id(req) : other;
            m.officerId = "user".equals(role) ? other : Api.id(req);
            m.sender = role;
            m.text = text;
            m.time = LocalDateTime.now().toString();
            all.add(m);
            JsonStorage.writeList(FILE, all);
        }
        Api.send(resp, 201, Api.msg("success", "Sent."));
    }

    private static int parse(String s) {
        try { return Integer.parseInt(s == null ? "" : s.trim()); } catch (NumberFormatException e) { return -1; }
    }
}
