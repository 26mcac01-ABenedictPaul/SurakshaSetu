package com.surakshasetu.util;

import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

import com.google.gson.reflect.TypeToken;
import com.surakshasetu.model.Complaint;
import com.surakshasetu.model.Officer;
import com.surakshasetu.model.SeverityClassifier;
import com.surakshasetu.model.User;

import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

/**
 * Loads sample citizens and cases at start-up so the admin and police dashboards are not empty
 * (useful on a fresh deployment, where the data folder starts without users or cases).
 *
 * It only runs when there are no cases yet, so real data is never touched.
 *   SEED_DEMO_DATA=false  -> never load sample data
 *   SEED_DEMO_DATA=force  -> add the sample data even if cases already exist
 *
 * Sample citizens are named demo_* and use the password demo123.
 */
@WebListener
public class DemoDataLoader implements ServletContextListener {

    private static final Type USERS = new TypeToken<List<User>>() {}.getType();
    private static final Type OFFICERS = new TypeToken<List<Officer>>() {}.getType();
    private static final Type COMPLAINTS = new TypeToken<List<Complaint>>() {}.getType();

    // username, phone, address, state, city  (Bangalore is repeated so a few Karnataka officers get many cases)
    private static final String[][] CITIZENS = {
        {"demo_ananya",  "9876500001", "12 MG Road",              "Karnataka",     "Bangalore"},
        {"demo_rohan",   "9876500002", "45 Indiranagar",          "Karnataka",     "Bangalore"},
        {"demo_meera",   "9876500003", "7 Jayanagar 4th Block",   "Karnataka",     "Bangalore"},
        {"demo_kiran",   "9876500004", "88 Whitefield Main Road", "Karnataka",     "Bangalore"},
        {"demo_sneha",   "9876500005", "23 Koramangala",          "Karnataka",     "Bangalore"},
        {"demo_vikram",  "9876500006", "5 Saraswathipuram",       "Karnataka",     "Mysore"},
        {"demo_aarav",   "9876500007", "31 Andheri West",         "Maharashtra",   "Mumbai"},
        {"demo_isha",    "9876500008", "9 Koregaon Park",         "Maharashtra",   "Pune"},
        {"demo_karthik", "9876500009", "14 T Nagar",              "Tamil Nadu",    "Chennai"},
        {"demo_divya",   "9876500010", "62 Banjara Hills",        "Telangana",     "Hyderabad"},
        {"demo_rahul",   "9876500011", "3 Connaught Place",       "Delhi",         "New Delhi"},
        {"demo_priya",   "9876500012", "18 Salt Lake",            "West Bengal",   "Kolkata"},
        {"demo_arjun",   "9876500013", "27 Marine Drive",         "Kerala",        "Kochi"},
        {"demo_neha",    "9876500014", "40 Malviya Nagar",        "Rajasthan",     "Jaipur"},
        {"demo_sanjay",  "9876500015", "21 Gomti Nagar",          "Uttar Pradesh", "Lucknow"},
        {"demo_pooja",   "9876500016", "6 Navrangpura",           "Gujarat",       "Ahmedabad"},
    };

    /** Repeated entries make a category more common. */
    private static final String[] CATEGORY_MIX = {
        "Theft", "Theft", "Theft", "Theft", "Theft",
        "Cybercrime", "Cybercrime", "Cybercrime", "Cybercrime", "Cybercrime",
        "Fraud", "Fraud", "Fraud", "Fraud",
        "Assault", "Assault", "Assault",
        "Harassment", "Harassment",
        "Missing Person", "Missing Person",
        "Murder"
    };

    private static final Map<String, String[]> STORIES = new LinkedHashMap<>();
    static {
        STORIES.put("Theft", new String[] {
            "My mobile phone was snatched near the bus stop while I was walking home in the evening.",
            "Two-wheeler stolen from the parking area outside my apartment overnight.",
            "Wallet with cash and ID cards was picked from my bag in a crowded market.",
            "Burglary at our house while the family was away; jewellery and a laptop are missing."});
        STORIES.put("Cybercrime", new String[] {
            "My social media account was hacked and messages are being sent to my contacts asking for money.",
            "I received a phishing link, entered my details and my email account was taken over.",
            "Someone created a fake profile with my photos and is harassing people in my name.",
            "Ransomware message appeared on my office laptop demanding payment in cryptocurrency."});
        STORIES.put("Fraud", new String[] {
            "A caller pretending to be from my bank took an OTP and withdrew money from my account.",
            "I paid an advance for an online purchase and the seller blocked me and never delivered.",
            "A fake job offer asked for a registration fee and then stopped responding.",
            "Cheated in a UPI collect request scam; the amount was debited without my approval."});
        STORIES.put("Assault", new String[] {
            "I was attacked by a group of men after a minor argument over parking and was injured.",
            "A neighbour hit me with a stick during a dispute and I needed medical treatment.",
            "Physical fight outside a shop where I was pushed and beaten by two people."});
        STORIES.put("Harassment", new String[] {
            "A person has been following me and sending threatening messages for the past two weeks.",
            "Repeated eve-teasing near the college gate by the same group of youths.",
            "Receiving abusive and threatening phone calls from an unknown number every night."});
        STORIES.put("Missing Person", new String[] {
            "My younger brother has not returned home since yesterday morning and his phone is switched off.",
            "An elderly relative with memory problems left home and cannot be found.",
            "Our teenage daughter did not come back from tuition class and we cannot reach her."});
        STORIES.put("Murder", new String[] {
            "A man was found dead near the railway track with injury marks; I am reporting what I saw.",
            "A neighbour was killed in a violent fight last night and the attackers ran away."});
    }

    private static final String[] AREAS = {
        "near the main market", "outside the bus stand", "at the railway station road",
        "near the city park", "outside the shopping mall", "on the ring road", "near the school gate"
    };

    @Override
    public void contextInitialized(ServletContextEvent event) {
        String mode = System.getenv("SEED_DEMO_DATA");
        if ("false".equalsIgnoreCase(mode)) return;
        try {
            synchronized (Api.LOCK) {
                load("force".equalsIgnoreCase(mode));
            }
        } catch (RuntimeException e) {
            System.out.println("Demo data not loaded: " + e);
        }
    }

    private void load(boolean force) {
        List<Complaint> complaints = JsonStorage.readList("complaints.json", COMPLAINTS);
        if (!force && !complaints.isEmpty()) return;

        List<Officer> officers = JsonStorage.readList("officers.json", OFFICERS);
        if (officers.isEmpty()) return;

        // ---- sample citizens ----
        List<User> users = JsonStorage.readList("users.json", USERS);
        int nextUserId = users.stream().mapToInt(User::getUserId).max().orElse(0) + 1;
        List<User> demoUsers = new ArrayList<>();
        for (String[] c : CITIZENS) {
            User u = null;
            for (User x : users) {
                if (x.getUsername() != null && x.getUsername().equalsIgnoreCase(c[0])) { u = x; break; }
            }
            if (u == null) {
                u = new User(c[0], "demo123", c[1], c[2], c[3], c[4], c[0] + "@example.com");
                u.setUserId(nextUserId++);
                users.add(u);
            }
            demoUsers.add(u);
        }
        JsonStorage.writeList("users.json", users);

        // ---- sample cases ----
        Random rnd = new Random(2026);
        int nextId = complaints.stream().mapToInt(Complaint::getComplaintId).max().orElse(0) + 1;
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        Map<String, Integer> perOfficer = new LinkedHashMap<>();
        int created = 0;

        for (int i = 0; i < 84; i++) {
            // the first cases are all from Bangalore citizens so a few well-known officers have a full queue
            User citizen = i < 30 ? demoUsers.get(i % 5) : demoUsers.get(rnd.nextInt(demoUsers.size()));
            String category = CATEGORY_MIX[rnd.nextInt(CATEGORY_MIX.length)];
            String[] stories = STORIES.get(category);
            String description = stories[rnd.nextInt(stories.length)];

            LocalDateTime filed = now.minusDays(rnd.nextInt(75)).minusMinutes(rnd.nextInt(1440));
            Complaint c = new Complaint(citizen.getUserId(), category,
                    SeverityClassifier.classify(category, description), description);
            c.setComplaintId(nextId++);
            c.setDateFiled(filed);

            Map<String, String> details = new LinkedHashMap<>();
            details.put("incidentDate", filed.format(dateFmt));
            details.put("incidentTime", String.format("%02d:%02d", rnd.nextInt(24), rnd.nextInt(60)));
            details.put("location", AREAS[rnd.nextInt(AREAS.length)] + ", " + citizen.getCity());
            details.put("city", citizen.getCity());
            details.put("state", citizen.getState());
            c.setDetails(details);

            double p = rnd.nextDouble();
            if (p >= 0.28) {                       // 28% stay Pending so the admin has cases to assign
                Officer o = firstMatch(officers, citizen, category);
                if (o != null) {
                    c.setAssignedOfficerId(o.getOfficerId());
                    if (p < 0.48)      c.setStatus("Assigned - Awaiting Officer Response");
                    else if (p < 0.88) c.setStatus("Under Investigation");
                    else               c.setStatus("Closed");
                    perOfficer.merge(o.getUsername(), 1, Integer::sum);
                }
            }
            complaints.add(c);
            created++;
        }
        JsonStorage.writeList("complaints.json", complaints);

        String busiest = perOfficer.entrySet().stream()
                .sorted((a, b) -> b.getValue() - a.getValue()).limit(5)
                .map(e -> e.getKey() + " (" + e.getValue() + ")")
                .collect(Collectors.joining(", "));
        System.out.println("Demo data loaded: " + created + " cases, " + demoUsers.size()
                + " sample citizens (demo_*, password demo123). Officers with the most cases: " + busiest);
    }

    /** Same idea as the real matching: same state + city + specialization first, then same state + specialization. */
    private static Officer firstMatch(List<Officer> officers, User citizen, String category) {
        Officer stateOnly = null;
        for (Officer o : officers) {
            if (o.getSpecialization() == null || !o.getSpecialization().equalsIgnoreCase(category)) continue;
            if (o.getState() == null || !o.getState().equalsIgnoreCase(citizen.getState())) continue;
            if (o.getCity() != null && o.getCity().equalsIgnoreCase(citizen.getCity())) return o;
            if (stateOnly == null) stateOnly = o;
        }
        return stateOnly;
    }
}
