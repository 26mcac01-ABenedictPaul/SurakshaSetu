# SurakshaSetu 🛡️

**A digital bridge between citizens and the police: report, track and resolve complaints online.**

SurakshaSetu ("bridge of safety") is a role-based crime reporting and case management web application built with **Java Servlets, JSP and JSON storage**. Citizens file complaints and e-FIRs from any device, administrators route each case to a matching police officer, and officers accept or decline cases from their own dashboard. The citizen is emailed at every important step.

![Java](https://img.shields.io/badge/Java-17-orange)
![Jakarta Servlet](https://img.shields.io/badge/Jakarta%20Servlet-5.0-blue)
![Jetty](https://img.shields.io/badge/Jetty-11-green)
![Build](https://img.shields.io/badge/build-Maven-red)
![Deploy](https://img.shields.io/badge/deploy-Docker%20%7C%20Render-informational)

---

## Table of contents

1. [Features](#features)
2. [How a case moves through the system](#how-a-case-moves-through-the-system)
3. [Tech stack](#tech-stack)
4. [Project structure](#project-structure)
5. [Getting started](#getting-started)
6. [Configuration](#configuration)
7. [Default accounts and sample data](#default-accounts-and-sample-data)
8. [Deployment (Docker / Render)](#deployment-docker--render)
9. [REST endpoints](#rest-endpoints)
10. [Security notes](#security-notes)
11. [Mobile support](#mobile-support)
12. [Course phase mapping](#course-phase-mapping)
13. [Roadmap](#roadmap)

---

## Features

### Citizen portal (`user.jsp`)
- **Register and log in** with client-side and server-side validation, and a server-protected dashboard.
- **File a case** across seven categories: Theft, Cybercrime, Assault, Missing Person, Harassment, Murder and Fraud. Cases are classified automatically as Minor, Major or Critical.
- **e-FIR**: a detailed complaint that is filed as a normal case.
- **Report a concern**: a fast alert for accidents, fights, fires or suspicious activity, with photos and location.
- **Track cases** and see which officer has taken them.
- **Book an appointment** with a police station and **chat** with the station.
- **Police stations near me**: nearest stations by city, then state.
- **Civic issues and community**: potholes, hazards, sanitation, citizen initiatives and surveys.
- **Four awareness sections**: Know Your Law, Road Safety Academy, Women's Safety and Support, and Anti-Ragging and Campus Safety (with an anonymous ragging complaint).
- **Suraksha AI**: a friendly assistant for citizens (optional, needs an API key).
- **SOS 112** shortcut, **My profile** and a news feed.

### Police officer dashboard (`officer.html`)
- Cases awaiting the officer's response, and their active cases.
- **Accept or decline** assigned cases; the citizen is emailed when a case is accepted.
- Appointments, messages, e-FIRs, concerns, civic and anti-ragging items scoped to the officer.
- Officer AI assistant for questions about their own queue.

### Admin dashboard (`admin.html`)
- See every case and **assign pending cases** to officers who match the case (state, city and specialization).
- Crime analytics and an admin AI analyst.

### Data
- **590 police officers** across all 28 states and 8 union territories, with at least two officers per case category in every state or union territory.

---

## How a case moves through the system

```
Citizen files a case ──► Pending ──► Admin assigns a matching officer
                                              │
                              ┌───────────────┴───────────────┐
                           Declined                        Accepted
                     (back to the admin,              (citizen is emailed,
                      officer is excluded)             officer works the case)
```

Officer matching first looks for the same **state + city + specialization** as the complainant, then falls back to the same **state + specialization**.

---

## Tech stack

| Layer | Technology |
|---|---|
| Language | Java 17 |
| Web | Jakarta Servlets 5, JSP, HTML5, CSS3, vanilla JavaScript |
| Server | Jetty 11 (via `jetty-maven-plugin`), Docker image for hosting |
| Build | Maven (WAR packaging) |
| Storage | JSON files read and written with Gson |
| Email | Jakarta Mail over Gmail SMTP |
| AI (optional) | Groq or Anthropic API, called from the server only |

---

## Project structure

```
SurakshaSetu/
├── pom.xml
├── Dockerfile / render.yaml        # hosting
├── data/
│   ├── officers.json               # 590 officers (seed data)
│   ├── admins.json                 # admin accounts
│   └── users.json, complaints.json # created at run time (git-ignored)
└── src/
    ├── com/surakshasetu/
    │   ├── model/                  # User, Officer, Complaint, ValidationUtil, ...
    │   ├── service/                # AuthService, ComplaintService (interfaces)
    │   │   └── impl/               # AuthServiceImpl, ComplaintServiceImpl
    │   ├── servlet/                # Login, Register, Logout, Complaint, Officer, Admin, ...
    │   ├── exception/              # InvalidCredentials, DuplicateUser, InvalidComplaintData
    │   ├── util/                   # JsonStorage, EmailService, OtpService, Api
    │   └── test/                   # console runner and manual tests
    └── main/webapp/
        ├── index.html              # login and registration
        ├── user.jsp                # citizen dashboard (session-protected)
        ├── officer.html, admin.html
        └── *.css, *.js, media/
```

---

## Getting started

### Prerequisites
- JDK 17 or newer
- Apache Maven 3.8 or newer

### Run locally

```bash
git clone https://github.com/<your-username>/SurakshaSetu.git
cd SurakshaSetu
cp mail.properties.example mail.properties     # then edit it (see Configuration)
mvn jetty:run
```

Open **http://localhost:8080/SurakshaSetu/**.

On Windows use `copy mail.properties.example mail.properties`.

### Eclipse
Import as an existing Maven project, then run `mvn jetty:run` from a terminal in the project folder (no Tomcat or WTP is needed).

---

## Configuration

Nothing secret is stored in the source code. Settings are read from **environment variables**, then JVM options, then a local `mail.properties` file.

| Variable | Purpose | Required |
|---|---|---|
| `MAIL_USER` | Gmail address used to send emails | For email |
| `MAIL_PASSWORD` | Gmail **App Password** (16 characters, needs 2-step verification) | For email |
| `GROQ_API_KEY` | Enables the AI assistants (Groq) | Optional |
| `ANTHROPIC_API_KEY` | Alternative AI engine | Optional |
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | Only for the optional MySQL test class | Optional |

Without email settings the app still runs and registration and cases still work, but emails fail and the error is logged.

---

## Default accounts and sample data

| Role | How to log in |
|---|---|
| Citizen | Register on the home page |
| Police officer | Username is the officer's **first name** in lowercase, e.g. `lokesh`. Password `pass123` |
| Admin | `admin` / `admin123` |

> ⚠️ **Change the admin password** in `data/admins.json` and the officer passwords before exposing the app to the internet.

---

## Deployment (Docker / Render)

The repository includes a multi-stage `Dockerfile` (Maven build, then Jetty 11 with JSP) and a `render.yaml` blueprint.

```bash
docker build -t surakshasetu .
docker run -p 8080:8080 -e MAIL_USER=you@gmail.com -e MAIL_PASSWORD=your-app-password surakshasetu
```

**On Render:** create a new *Blueprint* from this repository, then set `MAIL_PASSWORD` (and optionally `GROQ_API_KEY`) in the dashboard.

Hosting caveats:
- **Data is stored in files.** On free hosting the disk is wiped on every redeploy and restart. Attach a persistent disk or move to a database for real use.
- **Gmail SMTP is blocked on Render's free plan.** Use a paid instance, or switch `EmailService` to an HTTPS email API.

---

## REST endpoints

All endpoints return JSON and require a login unless noted.

| Endpoint | Purpose |
|---|---|
| `POST /register`, `POST /login`, `GET /logout` | Account creation, sign-in (citizen, officer or admin) and sign-out |
| `GET /api/me` | Who is logged in |
| `GET/POST /api/complaints` | Cases for the current role |
| `POST /api/case`, `POST /api/efir`, `POST /api/concern` | File a case, an e-FIR or a quick concern |
| `GET/POST /api/admin` | Admin: list matching officers, assign a case |
| `POST /api/officer` | Officer: `action=accept` or `decline` |
| `GET /api/stations` | Police stations near the citizen |
| `GET/POST /api/appointments`, `/api/chat` | Appointments and station messaging |
| `GET/POST /api/civic`, `/api/community`, `/api/ragging` | Civic issues, community and anti-ragging |
| `POST /api/ai`, `/api/assistant`, `/api/officer-ai`, `/api/admin-ai` | AI assistants |

---

## Security notes

- Sessions use `HttpSession` (30 minute timeout); a new session is created on every login.
- The citizen dashboard (`user.jsp`) is checked **on the server** before any page content is sent, and is marked no-cache so the Back button cannot show it after logout.
- API endpoints check the signed-in role (for example, only an admin can assign cases).
- Secrets come from the environment and are excluded from Git.
- Known limits for a demonstration project: passwords are stored in plain text in JSON and there is no CSRF protection or rate limiting. Hash passwords (for example with BCrypt) and add these before any production use.

---

## Mobile support

Every page is responsive and has been checked at 360 px and 390 px widths. A shared `mobile.css` uses 16 px form fields (prevents zoom on iPhone), thumb-sized buttons, safe-area insets for notches and home bars, and prevents sideways scrolling.

---

## Course phase mapping

| Phase | Topic | Where to look |
|---|---|---|
| 1 | Core setup: user entity, constructors, validation | `model/User`, `model/ValidationUtil` |
| 2 | Packages, interface, exception handling | `service/AuthService`, `exception/*` |
| 3 | HTML/CSS forms, JavaScript validation, JSON data | `index.html`, `app.js`, `data/*.json` |
| 4 | Servlets, server-side validation, `HttpSession`, JSP dashboard, logout, deployment | `servlet/*`, `user.jsp`, `Dockerfile` |

---

## Roadmap

- Hash passwords and add CSRF protection
- Replace JSON files with a database (PostgreSQL or MySQL)
- Convert the officer and admin dashboards to server-checked JSP pages
- HTTPS email API instead of SMTP
- Case status notifications by SMS or push

---

*Built as an academic project. Not affiliated with any police department; the officer data is sample data.*
