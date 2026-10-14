package com.surakshasetu.servlet;

import java.io.IOException;
import java.io.StringReader;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import com.surakshasetu.util.Api;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * GET /api/feed?topic=politics|party|crime|achievement|army|international|community
 *   -> { live, topic, items:[{title,source,link,date,image,topic}], videos:[{id,title,channel,thumb,date}] }
 *
 * Headlines come from Google News RSS (searched per topic). Google's RSS carries no pictures, so we also read a few
 * publisher RSS feeds that DO carry pictures, keep the stories that match the topic, and merge them in.
 * Videos come from public YouTube channel RSS feeds (no API key needed) and play in an embedded player.
 * Everything is fetched in parallel, cached per topic for 15 minutes, and any feed that fails is simply skipped.
 */
@WebServlet("/api/feed")
public class FeedServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final long TTL_MS = 15 * 60 * 1000L;
    private static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4))
            .followRedirects(HttpClient.Redirect.NORMAL).build();

    // ---- editable source lists -------------------------------------------------------------------------
    /** topic -> Google News search query */
    private static final Map<String, String> QUERY = new LinkedHashMap<>();
    /** topic -> keyword regex used to pick matching stories out of the general publisher feeds */
    private static final Map<String, Pattern> KEYWORDS = new LinkedHashMap<>();
    /** Publisher RSS feeds that include pictures (media:content / media:thumbnail / enclosure). */
    private static final Map<String, String[]> PUBLISHERS = new LinkedHashMap<>();
    /** YouTube channel feeds: {channelId, channel name}. A wrong id is harmless: it is skipped. */
    private static final String[][] CHANNELS = {
        {"UC16niRr50-MSBwiO3YDb3RA", "BBC News"},
        {"UCNye-wNBqNL5ZzHSJj3l8Bg", "Al Jazeera English"},
        {"UCZFMm1mMw0F81Z37aaEzTUA", "NDTV"},
        {"UCYPvAwZP8pZhSMW8qs7cVCw", "India Today"},
        {"UCttspZesZIDEwwpVIgoZtWQ", "Times of India"},
        {"UChqUTb7kYRX8-EiaN3XFrSQ", "Reuters"},
    };
    static {
        QUERY.put("politics", "India politics government parliament");
        QUERY.put("party", "India political party election campaign");
        QUERY.put("crime", "India crime police arrest investigation");
        QUERY.put("achievement", "India achievement award record ISRO OR medal OR first");
        QUERY.put("army", "Indian Army OR Indian Air Force OR Indian Navy OR defence ministry");
        QUERY.put("international", "world news international");
        QUERY.put("community", "India community rally OR parade OR procession OR \"peaceful protest\" OR \"candlelight march\"");

        KEYWORDS.put("politics", Pattern.compile("politic|minister|parliament|government|election|modi|congress|bjp|cabinet|bill|assembly|supreme court", Pattern.CASE_INSENSITIVE));
        KEYWORDS.put("party", Pattern.compile("party|bjp|congress|aap|tmc|dmk|election|campaign|poll|manifesto|rally|candidate", Pattern.CASE_INSENSITIVE));
        KEYWORDS.put("crime", Pattern.compile("arrest|police|murder|rape|crime|court|killed|fraud|theft|accused|probe|custody|scam", Pattern.CASE_INSENSITIVE));
        KEYWORDS.put("achievement", Pattern.compile("win|award|record|launch|first|gold|medal|isro|space|honour|champion|success|inaugurat", Pattern.CASE_INSENSITIVE));
        KEYWORDS.put("army", Pattern.compile("army|military|defence|border|soldier|navy|air force|missile|jawan|troops|lac|loc", Pattern.CASE_INSENSITIVE));
        KEYWORDS.put("international", Pattern.compile(".*"));
        KEYWORDS.put("community", Pattern.compile("rally|parade|march|procession|protest|gather|community|festival|volunteer|citizens|vigil|drive", Pattern.CASE_INSENSITIVE));

        String[] india = { "https://feeds.bbci.co.uk/news/world/asia/india/rss.xml", "https://www.thehindu.com/news/national/feeder/default.rss" };
        for (String t : new String[] { "politics", "party", "crime", "achievement", "army", "community" }) PUBLISHERS.put(t, india);
        PUBLISHERS.put("international", new String[] { "https://feeds.bbci.co.uk/news/world/rss.xml", "https://www.thehindu.com/news/international/feeder/default.rss" });
    }

    private static final Map<String, Object[]> CACHE = new ConcurrentHashMap<>(); // topic -> {time, payload}

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!Api.require(req, resp, null)) return;
        String topic = Api.clean(req.getParameter("topic")).toLowerCase(Locale.ROOT);
        if (!QUERY.containsKey(topic)) { Api.send(resp, 400, Api.msg("error", "Unknown topic.")); return; }

        Object[] hit = CACHE.get(topic);
        if (hit != null && System.currentTimeMillis() - (Long) hit[0] < TTL_MS) { Api.send(resp, 200, hit[1]); return; }

        // fetch everything in parallel
        CompletableFuture<List<Map<String, String>>> google = CompletableFuture.supplyAsync(() -> google(topic));
        List<CompletableFuture<List<Map<String, String>>>> pubs = new ArrayList<>();
        for (String u : PUBLISHERS.getOrDefault(topic, new String[0])) pubs.add(CompletableFuture.supplyAsync(() -> publisher(u, topic)));
        List<CompletableFuture<List<Map<String, String>>>> vids = new ArrayList<>();
        for (String[] c : CHANNELS) vids.add(CompletableFuture.supplyAsync(() -> channel(c[0], c[1])));

        List<Map<String, String>> items = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        List<Map<String, String>> all = new ArrayList<>();
        for (CompletableFuture<List<Map<String, String>>> p : pubs) all.addAll(join(p));   // pictures first
        all.addAll(join(google));
        for (Map<String, String> m : all) {
            String key = m.get("title").toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
            if (key.length() > 40) key = key.substring(0, 40);
            if (seen.add(key)) { m.put("topic", topic); items.add(m); }
            if (items.size() >= 20) break;
        }

        List<Map<String, String>> videos = new ArrayList<>(), matching = new ArrayList<>();
        for (CompletableFuture<List<Map<String, String>>> v : vids) videos.addAll(join(v));
        Pattern kw = KEYWORDS.get(topic);
        for (Map<String, String> v : videos) if (kw.matcher(v.get("title")).find()) matching.add(v);
        List<Map<String, String>> pick = matching.size() >= 3 ? matching : videos;   // fall back to the latest videos
        pick.sort((a, b) -> b.get("date").compareTo(a.get("date")));
        if (pick.size() > 8) pick = new ArrayList<>(pick.subList(0, 8));

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("live", !items.isEmpty());
        out.put("topic", topic);
        out.put("items", items);
        out.put("videos", pick);
        if (!items.isEmpty() || !pick.isEmpty()) CACHE.put(topic, new Object[] { System.currentTimeMillis(), out });
        Api.send(resp, 200, out);
    }

    private static <T> List<T> join(CompletableFuture<List<T>> f) {
        try { return f.get(8, java.util.concurrent.TimeUnit.SECONDS); } catch (Exception e) { return new ArrayList<>(); }
    }

    private static String get(String url) throws Exception {
        HttpRequest r = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(6))
                .header("User-Agent", "Mozilla/5.0 SurakshaSetu").header("Accept", "application/rss+xml, application/xml, text/xml, */*").build();
        HttpResponse<String> res = HTTP.send(r, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() != 200) throw new IOException("HTTP " + res.statusCode());
        return res.body();
    }

    private static org.w3c.dom.Document xml(String body) throws Exception {
        DocumentBuilderFactory f = DocumentBuilderFactory.newInstance();
        f.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true); // no XXE
        DocumentBuilder b = f.newDocumentBuilder();
        return b.parse(new InputSource(new StringReader(body)));
    }

    /* ---------- Google News headlines (no pictures in this feed) ---------- */
    private static List<Map<String, String>> google(String topic) {
        List<Map<String, String>> out = new ArrayList<>();
        try {
            String url = "https://news.google.com/rss/search?q=" + URLEncoder.encode(QUERY.get(topic) + " when:7d", StandardCharsets.UTF_8) + "&hl=en-IN&gl=IN&ceid=IN:en";
            NodeList nodes = xml(get(url)).getElementsByTagName("item");
            for (int i = 0; i < nodes.getLength() && out.size() < 14; i++) {
                Element el = (Element) nodes.item(i);
                String title = text(el, "title"), link = text(el, "link"), source = text(el, "source");
                if (title.isEmpty() || !link.startsWith("http")) continue;
                int dash = title.lastIndexOf(" - ");
                if (dash > 0) { if (source.isEmpty()) source = title.substring(dash + 3); title = title.substring(0, dash); }
                out.add(item(title, source.isEmpty() ? "Google News" : source, link, text(el, "pubDate"), ""));
            }
        } catch (Exception e) { /* offline / blocked: skip */ }
        return out;
    }

    /* ---------- publisher feeds that include pictures ---------- */
    private static final Pattern IMG = Pattern.compile("<img[^>]+src=[\"']([^\"']+)[\"']", Pattern.CASE_INSENSITIVE);
    private static List<Map<String, String>> publisher(String url, String topic) {
        List<Map<String, String>> out = new ArrayList<>();
        try {
            String host = URI.create(url).getHost().replace("www.", "").replace("feeds.", "");
            String name = host.contains("bbc") ? "BBC News" : host.contains("thehindu") ? "The Hindu" : host;
            Pattern kw = KEYWORDS.get(topic);
            NodeList nodes = xml(get(url)).getElementsByTagName("item");
            for (int i = 0; i < nodes.getLength() && out.size() < 10; i++) {
                Element el = (Element) nodes.item(i);
                String title = text(el, "title"), link = text(el, "link");
                if (title.isEmpty() || !link.startsWith("http")) continue;
                if (!kw.matcher(title + " " + text(el, "description")).find()) continue;
                out.add(item(title, name, link, text(el, "pubDate"), image(el)));
            }
        } catch (Exception e) { /* skip this feed */ }
        return out;
    }

    private static String image(Element el) {
        for (String tag : new String[] { "media:content", "media:thumbnail", "enclosure" }) {
            NodeList l = el.getElementsByTagName(tag);
            for (int i = 0; i < l.getLength(); i++) {
                Element m = (Element) l.item(i);
                String u = m.getAttribute("url"), type = m.getAttribute("type"), medium = m.getAttribute("medium");
                if (u.startsWith("http") && (type.isEmpty() || type.startsWith("image")) && (medium.isEmpty() || medium.equals("image"))) return u;
            }
        }
        for (String tag : new String[] { "description", "content:encoded" }) {
            Matcher m = IMG.matcher(text(el, tag));
            if (m.find() && m.group(1).startsWith("http")) return m.group(1);
        }
        return "";
    }

    /* ---------- YouTube channel feeds ---------- */
    private static List<Map<String, String>> channel(String id, String name) {
        List<Map<String, String>> out = new ArrayList<>();
        try {
            NodeList nodes = xml(get("https://www.youtube.com/feeds/videos.xml?channel_id=" + id)).getElementsByTagName("entry");
            for (int i = 0; i < nodes.getLength() && out.size() < 10; i++) {
                Element el = (Element) nodes.item(i);
                String vid = text(el, "yt:videoId"), title = text(el, "title");
                if (!vid.matches("[A-Za-z0-9_-]{11}") || title.isEmpty()) continue;
                Map<String, String> m = new LinkedHashMap<>();
                m.put("id", vid);
                m.put("title", title);
                m.put("channel", name);
                m.put("thumb", "https://i.ytimg.com/vi/" + vid + "/hqdefault.jpg");
                String pub = text(el, "published");
                m.put("date", pub);
                out.add(m);
            }
        } catch (Exception e) { /* skip */ }
        return out;
    }

    private static Map<String, String> item(String title, String source, String link, String date, String image) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("title", title);
        m.put("source", source);
        m.put("link", link);
        m.put("date", date);
        m.put("image", image);
        return m;
    }

    private static String text(Element parent, String tag) {
        NodeList l = parent.getElementsByTagName(tag);
        return l.getLength() == 0 ? "" : l.item(0).getTextContent().trim();
    }
}
