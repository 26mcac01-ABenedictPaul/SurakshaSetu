package com.surakshasetu.model;

public class Officer {

    private int officerId;
    private String name;
    private String badgeNumber;
    private String station;
    private String specialization;
    private String state;
    private String district;
    private String city;
    private String username;
    private String password;
    private String email;
    private String contactNumber;

    public Officer() {
    }

    public Officer(String name, String badgeNumber, String station, String specialization,
                    String state, String district, String city,
                    String username, String password, String email, String contactNumber) {
        this.name = name;
        this.badgeNumber = badgeNumber;
        this.station = station;
        this.specialization = specialization;
        this.state = state;
        this.district = district;
        this.city = city;
        this.username = username;
        this.password = password;
        this.email = email;
        this.contactNumber = contactNumber;
    }

    public int getOfficerId() { return officerId; }
    public void setOfficerId(int officerId) { this.officerId = officerId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBadgeNumber() { return badgeNumber; }
    public void setBadgeNumber(String badgeNumber) { this.badgeNumber = badgeNumber; }

    public String getStation() { return station; }
    public void setStation(String station) { this.station = station; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    @Override
    public String toString() {
        return "Officer{" +
                "officerId=" + officerId +
                ", name='" + name + '\'' +
                ", station='" + station + '\'' +
                ", specialization='" + specialization + '\'' +
                ", state='" + state + '\'' +
                ", district='" + district + '\'' +
                ", city='" + city + '\'' +
                ", email='" + email + '\'' +
                ", contactNumber='" + contactNumber + '\'' +
                '}';
    }
}