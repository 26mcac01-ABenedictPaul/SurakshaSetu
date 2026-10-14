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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Base64;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import com.google.gson.JsonArray;
import com.google.gson.JsonParser;
import com.surakshasetu.util.Api;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * GET /api/news -> latest police / law-and-order headlines for India and Bengaluru.
 * Read from Google News RSS on the server (browsers cannot, because of CORS), cached for 15 minutes.
 * If the internet is unavailable the page still gets a short fallback list, flagged "live": false.
 */
@WebServlet("/api/news")
public class NewsServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final long TTL_MS = 15 * 60 * 1000L;
    private static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    private static final Object CACHE_LOCK = new Object();
    private static Map<String, Object> cache;
    private static long cachedAt = 0;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!Api.require(req, resp, null)) return;
        Map<String, Object> result;
        synchronized (CACHE_LOCK) {
            if (cache == null || System.currentTimeMillis() - cachedAt > TTL_MS) {
                List<Map<String, String>> items = new ArrayList<>();
                List<Map<String, String>> a = fetchBing("Bengaluru police", "Bengaluru");
                if (a.isEmpty()) a = fetch("Bengaluru police", "Bengaluru");
                List<Map<String, String>> b = fetchBing("India police", "India");
                if (b.isEmpty()) b = fetch("India police government", "India");
                items.addAll(a);
                items.addAll(b);
                enrichWithImages(items);
                Map<String, Object> m = new LinkedHashMap<>();
                if (items.isEmpty()) {
                    m.put("live", false);
                    m.put("items", fallback());
                } else {
                    m.put("live", true);
                    m.put("items", items);
                }
                cache = m;
                cachedAt = System.currentTimeMillis();
            }
            result = cache;
        }
        Api.send(resp, 200, result);
    }

    private static List<Map<String, String>> fetch(String query, String region) {
        List<Map<String, String>> out = new ArrayList<>();
        try {
            String url = "https://news.google.com/rss/search?q="
                    + URLEncoder.encode(query + " when:7d", StandardCharsets.UTF_8)
                    + "&hl=en-IN&gl=IN&ceid=IN:en";
            HttpRequest r = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(6))
                    .header("User-Agent", "Mozilla/5.0 SurakshaSetu").build();
            HttpResponse<String> res = HTTP.send(r, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) return out;

            DocumentBuilderFactory f = DocumentBuilderFactory.newInstance();
            f.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true); // no XXE
            DocumentBuilder b = f.newDocumentBuilder();
            NodeList nodes = b.parse(new InputSource(new StringReader(res.body()))).getElementsByTagName("item");
            for (int i = 0; i < nodes.getLength() && out.size() < 6; i++) {
                Element el = (Element) nodes.item(i);
                String title = text(el, "title");
                String link = text(el, "link");
                if (title.isEmpty() || !link.startsWith("http")) continue;
                String source = text(el, "source");
                // Google appends " - Publisher" to titles
                int dash = title.lastIndexOf(" - ");
                if (dash > 0) { if (source.isEmpty()) source = title.substring(dash + 3); title = title.substring(0, dash); }
                Map<String, String> m = new LinkedHashMap<>();
                m.put("title", title);
                m.put("source", source);
                m.put("link", link);
                m.put("date", text(el, "pubDate"));
                m.put("region", region);
                out.add(m);
            }
        } catch (Exception e) {
            // offline / blocked / bad XML: caller falls back
        }
        return out;
    }


    // ---------- real photos for the news cards ----------
    private static final Pattern OG1 = Pattern.compile("<meta[^>]+(?:property|name)=[\"'](?:og:image|twitter:image)[\"'][^>]*content=[\"']([^\"']+)[\"']", Pattern.CASE_INSENSITIVE);
    private static final Pattern OG2 = Pattern.compile("<meta[^>]+content=[\"']([^\"']+)[\"'][^>]*(?:property|name)=[\"'](?:og:image|twitter:image)[\"']", Pattern.CASE_INSENSITIVE);
    private static final String UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36";

    /** Finds the article's own picture (og:image) for every item, in parallel, with short timeouts. */
    private static void enrichWithImages(List<Map<String, String>> items) {
        List<CompletableFuture<Void>> jobs = new ArrayList<>();
        for (Map<String, String> it : items) {
            if (it.get("image") != null && !it.get("image").isEmpty()) continue;
            jobs.add(CompletableFuture.runAsync(() -> {
                try {
                    String page = resolveGoogleNews(it.get("link"));
                    String img = page == null ? "" : ogImage(page);
                    it.put("image", img);
                } catch (Exception e) { it.put("image", ""); }
            }));
        }
        try { CompletableFuture.allOf(jobs.toArray(new CompletableFuture[0])).get(12, TimeUnit.SECONDS); }
        catch (Exception e) { /* whatever finished in time is used */ }
        for (Map<String, String> it : items) it.putIfAbsent("image", "");
    }

    private static String get(String url, String ua) throws Exception {
        HttpRequest r = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(6))
                .header("User-Agent", ua).header("Accept-Language", "en-IN,en;q=0.9").build();
        HttpResponse<String> res = HTTP.send(r, HttpResponse.BodyHandlers.ofString());
        return res.statusCode() == 200 ? res.body() : null;
    }

    private static String ogImage(String pageUrl) {
        try {
            HttpClient c = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).followRedirects(HttpClient.Redirect.NORMAL).build();
            HttpRequest r = HttpRequest.newBuilder(URI.create(pageUrl)).timeout(Duration.ofSeconds(6)).header("User-Agent", UA).build();
            HttpResponse<String> res = c.send(r, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) return "";
            String body = res.body();
            if (body.length() > 400000) body = body.substring(0, 400000);
            Matcher m = OG1.matcher(body);
            String img = m.find() ? m.group(1) : null;
            if (img == null) { m = OG2.matcher(body); if (m.find()) img = m.group(1); }
            if (img == null) return "";
            img = img.replace("&amp;", "&").trim();
            if (img.startsWith("//")) img = "https:" + img;
            if (!img.startsWith("http")) return "";
            if (img.contains("googleusercontent") || img.contains("news.google")) return ""; // Google's own logo, not the story
            return img;
        } catch (Exception e) { return ""; }
    }

    /** Google News RSS links are redirects. Turn them into the real publisher URL (old format decodes offline, new format needs one POST). */
    private static String resolveGoogleNews(String link) {
        try {
            if (link == null || !link.contains("news.google.com")) return link;
            Matcher id = Pattern.compile("/articles/([^?/]+)").matcher(link);
            if (!id.find()) return null;
            String b64 = id.group(1);

            byte[] raw = Base64.getUrlDecoder().decode(b64);
            String d = new String(raw, StandardCharsets.ISO_8859_1);
            if (d.startsWith("\u0008\u0013\"")) d = d.substring(3);
            if (d.endsWith("\u00d2\u0001\u0000")) d = d.substring(0, d.length() - 3);
            if (!d.isEmpty()) {
                int len = d.charAt(0);
                String u = len >= 0x80 ? d.substring(2, Math.min(d.length(), len + 1)) : d.substring(1, Math.min(d.length(), len + 1));
                if (u.startsWith("http")) return u;
            }

            // new format: ask Google's own page for the signed redirect
            String page = get("https://news.google.com/rss/articles/" + b64, UA);
            if (page == null) return null;
            Matcher sg = Pattern.compile("data-n-a-sg=\"([^\"]+)\"").matcher(page);
            Matcher ts = Pattern.compile("data-n-a-ts=\"([^\"]+)\"").matcher(page);
            if (!sg.find() || !ts.find()) return null;
            String inner = "[\"garturlreq\",[[\"X\",\"X\",[\"X\",\"X\"],null,null,1,1,\"US:en\",null,1,null,null,null,null,null,0,1],\"X\",\"X\",1,[1,1,1],1,1,null,0,0,null,0],\""
                    + b64 + "\"," + ts.group(1) + ",\"" + sg.group(1) + "\"]";
            JsonArray outer = new JsonArray();
            JsonArray mid = new JsonArray();
            JsonArray call = new JsonArray();
            call.add("Fbv4je"); call.add(inner);
            mid.add(call); outer.add(mid);
            String form = "f.req=" + URLEncoder.encode(outer.toString(), StandardCharsets.UTF_8);
            HttpRequest r = HttpRequest.newBuilder(URI.create("https://news.google.com/_/DotsSplashUi/data/batchexecute"))
                    .timeout(Duration.ofSeconds(6)).header("User-Agent", UA)
                    .header("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8")
                    .POST(HttpRequest.BodyPublishers.ofString(form)).build();
            HttpResponse<String> res = HTTP.send(r, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) return null;
            String[] parts = res.body().split("\n\n");
            if (parts.length < 2) return null;
            JsonArray top = JsonParser.parseString(parts[1]).getAsJsonArray();
            String payload = top.get(0).getAsJsonArray().get(2).getAsString();
            String url = JsonParser.parseString(payload).getAsJsonArray().get(1).getAsString();
            return url.startsWith("http") ? url : null;
        } catch (Exception e) { return null; }
    }


    /** Bing News RSS: every story already comes with its own thumbnail (News:Image) and the real publisher link. */
    private static List<Map<String, String>> fetchBing(String query, String region) {
        List<Map<String, String>> out = new ArrayList<>();
        try {
            String url = "https://www.bing.com/news/search?q=" + URLEncoder.encode(query, StandardCharsets.UTF_8)
                    + "&format=rss&setmkt=en-IN&setlang=en&qft=sortbydate%3d%221%22";
            String xml = get(url, UA);
            if (xml == null) return out;
            DocumentBuilderFactory f = DocumentBuilderFactory.newInstance();
            f.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            NodeList nodes = f.newDocumentBuilder().parse(new InputSource(new StringReader(xml))).getElementsByTagName("item");
            for (int i = 0; i < nodes.getLength() && out.size() < 8; i++) {
                Element el = (Element) nodes.item(i);
                String title = text(el, "title");
                String link = text(el, "link");
                Matcher um = Pattern.compile("[?&]url=([^&]+)").matcher(link);
                if (um.find()) link = java.net.URLDecoder.decode(um.group(1), StandardCharsets.UTF_8);
                if (title.isEmpty() || !link.startsWith("http")) continue;
                String img = text(el, "News:Image").replace("&amp;", "&");
                if (img.startsWith("//")) img = "https:" + img;
                if (img.startsWith("http://")) img = "https://" + img.substring(7);
                if (!img.isEmpty() && !img.contains("w=")) img += (img.contains("?") ? "&" : "?") + "w=640&h=360&c=7";
                Map<String, String> m = new LinkedHashMap<>();
                m.put("title", title);
                m.put("source", text(el, "News:Source"));
                m.put("link", link);
                m.put("date", text(el, "pubDate"));
                m.put("region", region);
                m.put("image", img.startsWith("http") ? img : "");
                out.add(m);
            }
        } catch (Exception e) {
            // blocked / offline / bad XML: caller falls back to Google News
        }
        return out;
    }

    private static String text(Element parent, String tag) {
        NodeList l = parent.getElementsByTagName(tag);
        return l.getLength() == 0 ? "" : l.item(0).getTextContent().trim();
    }

    private static List<Map<String, String>> fallback() {
        String[][] rows = {
            {"Dial 112: India's single emergency number works for police, fire and ambulance", "Public safety", "Bengaluru"},
            {"Report cyber fraud quickly: call 1930 or use cybercrime.gov.in within the first hours", "Cyber safety", "India"},
            {"Bengaluru City Police: use online services for FIR copies, verification and complaints", "Public safety", "Bengaluru"},
            {"Women in distress can reach the 112 helpline or the Suraksha app for fast response", "Public safety", "India"},
        };
        List<Map<String, String>> out = new ArrayList<>();
        for (String[] r : rows) {
            Map<String, String> m = new LinkedHashMap<>();
            m.put("title", r[0]); m.put("source", r[1]); m.put("link", ""); m.put("date", ""); m.put("region", r[2]); m.put("image", "");
            out.add(m);
        }
        return out;
    }
}
