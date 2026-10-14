package com.surakshasetu.servlet;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.google.gson.reflect.TypeToken;
import com.surakshasetu.model.Officer;
import com.surakshasetu.model.User;
import com.surakshasetu.util.Api;
import com.surakshasetu.util.JsonStorage;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** GET /api/stations -> police stations/officers near the logged-in citizen (same city first, then same state). */
@WebServlet("/api/stations")
public class StationServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final Type USERS = new TypeToken<List<User>>() {}.getType();
    private static final Type OFFICERS = new TypeToken<List<Officer>>() {}.getType();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!Api.require(req, resp, "user")) return;

        User me = null;
        for (User u : JsonStorage.<User>readList("users.json", USERS)) {
            if (u.getUserId() == Api.id(req)) { me = u; break; }
        }
        List<Officer> all = JsonStorage.readList("officers.json", OFFICERS);

        List<Map<String, Object>> out = new ArrayList<>();
        Set<Integer> seen = new LinkedHashSet<>();
        // pass 0 = same city, pass 1 = same state (so there is always someone to chat with)
        // ?all=1 adds pass 2 = every station (used by the "Police near me" map)
        boolean everything = "1".equals(req.getParameter("all"));
        for (int pass = 0; pass < (everything ? 3 : 2); pass++) {
            for (Officer o : all) {
                if (seen.contains(o.getOfficerId())) continue;
                boolean sameCity = me != null && o.getCity() != null && o.getCity().equalsIgnoreCase(me.getCity());
                boolean sameState = me != null && o.getState() != null && o.getState().equalsIgnoreCase(me.getState());
                if ((pass == 0 && !sameCity) || (pass == 1 && !sameState)) continue; // pass 2 takes the rest
                seen.add(o.getOfficerId());
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("officerId", o.getOfficerId());
                m.put("name", o.getName());
                m.put("station", o.getStation());
                m.put("specialization", o.getSpecialization());
                m.put("city", o.getCity());
                m.put("district", o.getDistrict());
                m.put("state", o.getState());
                m.put("contactNumber", o.getContactNumber());
                m.put("nearby", pass == 0);
                out.add(m);
            }
        }
        Api.send(resp, 200, out);
    }
}
